import Combine
import Foundation

final class HomeViewModel: ObservableObject {
    @Published var tasks: [DailyTask] = []
    @Published var futureSelfMessage: String = ""

    private let feedback = FeedbackLoopEngine()

    func bind(appState: AppState) {
        tasks = appState.todayTasks
        refreshMessage(appState: appState)
    }

    func refreshMessage(appState: AppState) {
        futureSelfMessage = feedback.futureSelfMessage(for: appState.dailyProgress, profile: appState.userProfile?.futureSelf)
    }

    func toggleTask(_ task: DailyTask, appState: AppState) {
        guard let idx = appState.todayTasks.firstIndex(where: { $0.id == task.id }) else { return }
        let wasComplete = appState.todayTasks[idx].isCompleted
        var updated = appState.todayTasks
        updated[idx].isCompleted.toggle()
        appState.updateTasks(updated)

        let isNowComplete = updated[idx].isCompleted

        if isNowComplete {
            HapticsManager.shared.play(.medium)
        } else {
            HapticsManager.shared.play(.light)
        }

        var progress = appState.dailyProgress
        if isNowComplete && !wasComplete {
            progress.dailyTasksCompleted += 1
        } else if !isNowComplete && wasComplete {
            progress.dailyTasksCompleted = max(0, progress.dailyTasksCompleted - 1)
        }
        progress.lastActiveDayKey = DateFormatter.dayKey.string(from: Date())

        let completedCount = updated.filter(\.isCompleted).count
        if completedCount == updated.count, !updated.isEmpty {
            progress.registerAllTasksCompleted(todayKey: DateFormatter.dayKey.string(from: Date()))
            HapticsManager.shared.play(.success)
        }

        appState.updateProgress(progress)
        tasks = appState.todayTasks
        refreshMessage(appState: appState)
    }
}
