import Combine
import Foundation

final class VisualizationPlayerViewModel: ObservableObject {
    enum Phase: Equatable {
        case idle
        case loading
        case playing
        case completed
    }

    @Published var phase: Phase = .idle
    @Published var narrative: String = ""
    @Published var visibleLineCount: Int = 0
    @Published var sessionProgress: Double = 0
    @Published var tone: NarrativeToneKind = .neutral
    @Published var narrationEnabled: Bool = false

    private var lines: [String] = []
    private var playbackTask: Task<Void, Never>?
    private let ai: AINarrativeServiceProtocol
    private let feedback = FeedbackLoopEngine()

    /// Target session length 5–10 minutes; scales line cadence to approximate reading pace.
    private let targetDuration: TimeInterval = 7 * 60

    init(ai: AINarrativeServiceProtocol = AINarrativeService()) {
        self.ai = ai
    }

    func prepareSession(profile: FutureSelfProfile, metrics: DailyProgress, tasksToday: [DailyTask]) {
        phase = .loading
        let completed = tasksToday.filter(\.isCompleted).count
        tone = feedback.tone(for: metrics, tasksCompletedToday: completed, totalTasksToday: tasksToday.count)

        playbackTask?.cancel()
        playbackTask = Task {
            do {
                let text = try await ai.generateVisualizationNarrative(profile: profile, tone: tone, metrics: metrics)
                await MainActor.run {
                    self.narrative = text
                    self.lines = Self.splitLines(text)
                    self.visibleLineCount = 0
                    self.sessionProgress = 0
                    self.phase = .playing
                    HapticsManager.shared.play(.heavy)
                }
                await self.runPlayback()
            } catch {
                await MainActor.run {
                    self.narrative = LocalNarrativeFallback.generate(profile: profile, tone: tone, metrics: metrics)
                    self.lines = Self.splitLines(self.narrative)
                    self.phase = .playing
                    HapticsManager.shared.play(.warning)
                }
                await self.runPlayback()
            }
        }
    }

    func stop() {
        playbackTask?.cancel()
        phase = .idle
    }

    private func runPlayback() async {
        if lines.isEmpty {
            await MainActor.run {
                phase = .completed
                sessionProgress = 1
                HapticsManager.shared.play(.success)
            }
            return
        }

        let total = lines.count
        let perLine = targetDuration / Double(total)

        for index in 0..<lines.count {
            if Task.isCancelled { return }

            await MainActor.run {
                visibleLineCount = index + 1
                sessionProgress = Double(index + 1) / Double(total)

                if index == total / 3 || index == (total * 2) / 3 {
                    HapticsManager.shared.play(.medium)
                }
                if index > 0, index % 5 == 0 {
                    HapticsManager.shared.play(.light)
                }
            }

            if index < lines.count - 1 {
                try? await Task.sleep(nanoseconds: UInt64(perLine * 1_000_000_000 * 0.85))
            }
        }

        await MainActor.run {
            phase = .completed
            sessionProgress = 1
            HapticsManager.shared.play(.success)
        }
    }

    private static func splitLines(_ text: String) -> [String] {
        let normalized = text.replacingOccurrences(of: "\n", with: " ")
        let rough = normalized.components(separatedBy: ". ")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        return rough.map { $0.hasSuffix(".") ? $0 : $0 + "." }
    }

    var visibleText: String {
        let parts = Array(lines.prefix(visibleLineCount))
        return parts.joined(separator: "\n\n")
    }
}
