import Foundation

/// Computes adaptive narrative tone from behavioral signals.
struct FeedbackLoopEngine {
    func tone(for metrics: DailyProgress, tasksCompletedToday: Int, totalTasksToday: Int) -> NarrativeToneKind {
        let completionRate: Double
        if totalTasksToday > 0 {
            completionRate = Double(tasksCompletedToday) / Double(totalTasksToday)
        } else {
            completionRate = 1
        }

        if metrics.missedDays >= 3 {
            return .confrontational
        }

        if metrics.streakDays >= 7 && completionRate >= 0.66 {
            return .empowering
        }

        if completionRate < 0.34 && totalTasksToday > 0 {
            return .confrontational
        }

        if metrics.missedDays >= 1 || completionRate < 0.66 {
            return .supportive
        }

        if metrics.sessionListens >= 5 {
            return .empowering
        }

        return .neutral
    }

    func futureSelfMessage(for metrics: DailyProgress, profile: FutureSelfProfile?) -> String {
        let name = profile?.goals.first?.title ?? "your path"
        if metrics.streakDays == 0 {
            return "I am waiting on the other side of one honest hour. Start small—\(name) grows in inches."
        }
        if metrics.missedDays > 0 {
            return "You remember the days you almost quit. But today you can choose discipline again—for \(name), and for you."
        }
        if metrics.streakDays >= 14 {
            return "Momentum is becoming identity. Keep the promise you made when nobody was watching."
        }
        return "I am not built from perfection. I am built from returns—show up again today for \(name)."
    }
}
