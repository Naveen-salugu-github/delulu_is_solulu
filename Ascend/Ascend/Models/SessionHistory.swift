import Foundation

struct VisualizationSessionRecord: Codable, Identifiable, Equatable {
    var id: UUID
    var startedAt: Date
    var durationSeconds: TimeInterval
    var narrativeTone: String
    var completed: Bool

    init(
        id: UUID = UUID(),
        startedAt: Date = Date(),
        durationSeconds: TimeInterval,
        narrativeTone: String,
        completed: Bool
    ) {
        self.id = id
        self.startedAt = startedAt
        self.durationSeconds = durationSeconds
        self.narrativeTone = narrativeTone
        self.completed = completed
    }
}
