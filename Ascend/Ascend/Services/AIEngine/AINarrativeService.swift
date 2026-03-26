import Foundation

struct AIConfiguration {
    /// Set `OPENAI_API_KEY` in Xcode scheme environment or replace for production secrets handling.
    var apiKey: String?
    var model: String = "gpt-4o-mini"
    var baseURL: URL = URL(string: "https://api.openai.com/v1/chat/completions")!

    static var fromEnvironment: AIConfiguration {
        let key = ProcessInfo.processInfo.environment["OPENAI_API_KEY"]
        return AIConfiguration(apiKey: key)
    }
}

enum AINarrativeError: Error {
    case missingAPIKey
    case invalidResponse
}

protocol AINarrativeServiceProtocol {
    func generateVisualizationNarrative(
        profile: FutureSelfProfile,
        tone: NarrativeToneKind,
        metrics: DailyProgress
    ) async throws -> String
}

/// OpenAI-compatible chat completion. Falls back to a rich local template when no API key is present (dev / offline).
final class AINarrativeService: AINarrativeServiceProtocol {
    private let config: AIConfiguration
    private let urlSession: URLSession

    init(config: AIConfiguration = .fromEnvironment, urlSession: URLSession = .shared) {
        self.config = config
        self.urlSession = urlSession
    }

    func generateVisualizationNarrative(
        profile: FutureSelfProfile,
        tone: NarrativeToneKind,
        metrics: DailyProgress
    ) async throws -> String {
        if let key = config.apiKey, !key.isEmpty {
            return try await fetchFromOpenAI(prompt: AIPromptTemplates.visualizationNarrative(profile: profile, tone: tone, metrics: metrics), apiKey: key)
        }
        return LocalNarrativeFallback.generate(profile: profile, tone: tone, metrics: metrics)
    }

    private func fetchFromOpenAI(prompt: String, apiKey: String) async throws -> String {
        struct ChatRequest: Encodable {
            var model: String
            var messages: [Message]
            var temperature: Double
            struct Message: Encodable {
                var role: String
                var content: String
            }
        }
        struct ChatResponse: Decodable {
            struct Choice: Decodable {
                struct Msg: Decodable { var content: String }
                var message: Msg
            }
            var choices: [Choice]
        }

        let body = ChatRequest(
            model: config.model,
            messages: [
                .init(role: "system", content: "You write cinematic, grounded visualization narratives."),
                .init(role: "user", content: prompt)
            ],
            temperature: 0.85
        )

        var request = URLRequest(url: config.baseURL)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.addValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONEncoder().encode(body)

        let (data, response) = try await urlSession.data(for: request)
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            throw AINarrativeError.invalidResponse
        }
        let decoded = try JSONDecoder().decode(ChatResponse.self, from: data)
        guard let text = decoded.choices.first?.message.content, !text.isEmpty else {
            throw AINarrativeError.invalidResponse
        }
        return text.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}

enum LocalNarrativeFallback {
    static func generate(profile: FutureSelfProfile, tone: NarrativeToneKind, metrics: DailyProgress) -> String {
        let focus = profile.goals.map(\.title).joined(separator: ", ")
        let income = IncomeFormatting.string(forAnnualINR: profile.incomeTargetAnnualINR)
        let tags = profile.lifestyleTags.joined(separator: ", ")
        let traits = profile.personalityTraits.joined(separator: ", ")
        let fears = profile.fears.joined(separator: ", ")

        let opener: String
        switch tone {
        case .empowering:
            opener = "You breathe in and the air feels like proof: the version of you that \(focus.lowercased()) is not a fantasy on a screen—she is a direction your nervous system already knows."
        case .confrontational:
            opener = "You know the old pattern: the quiet negotiation with your future when the day gets loud. Today we do not negotiate. You listen to what you avoided—and you move anyway."
        case .supportive:
            opener = "If you have been hard on yourself lately, start here: you are still in the story. The life you want is built from small returns, not perfect weeks."
        case .neutral:
            opener = "Close your eyes for a moment. Let the room soften. You are about to walk forward in your mind the way you want to walk forward in your days."
        }

        let behavior = """
        Your streak reads \(metrics.streakDays) days of showing up—not as a scoreboard, but as evidence that you can anchor. Missed days (\(metrics.missedDays)) are not a verdict; they are information about friction, not identity.
        """

        let body = """
        Picture your mornings in a home that matches the life you described: \(tags). Light arrives the way you want time to arrive—clean, intentional, yours. You move through space with the traits you chose: \(traits). The world still asks hard questions, especially around \(fears), but you answer with motion—small, repeatable, undeniable.

        In your work, you stop performing busyness and start building leverage. The financial future you want—\(income)—shows up as decisions: focus blocks, courageous conversations, skills stacked like compound interest. You feel the texture of a calendar that protects deep work. You hear the quiet satisfaction of progress that nobody applauds but you.

        When doubt rises, you do not debate it like a courtroom. You breathe like someone who has practiced returning to center. You place your hand on your chest and remember: discipline is love with a schedule.

        By the time you open your eyes, carry one scene with you—the sound of your future morning, the temperature of the air, the steadiness in your hands. Let that steadiness become the next action you take today.
        """

        return [opener, behavior, body].joined(separator: "\n\n")
    }
}
