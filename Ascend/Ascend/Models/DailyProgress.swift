import Foundation

struct DailyProgress: Codable, Equatable {
    var streakDays: Int
    var lastActiveDayKey: String?
    /// Last calendar day (yyyy-MM-dd) when all daily tasks were completed.
    var lastAllTasksDayKey: String?
    var dailyTasksCompleted: Int
    var missedDays: Int
    var sessionListens: Int
    var lastSessionDayKey: String?

    init(
        streakDays: Int = 0,
        lastActiveDayKey: String? = nil,
        lastAllTasksDayKey: String? = nil,
        dailyTasksCompleted: Int = 0,
        missedDays: Int = 0,
        sessionListens: Int = 0,
        lastSessionDayKey: String? = nil
    ) {
        self.streakDays = streakDays
        self.lastActiveDayKey = lastActiveDayKey
        self.lastAllTasksDayKey = lastAllTasksDayKey
        self.dailyTasksCompleted = dailyTasksCompleted
        self.missedDays = missedDays
        self.sessionListens = sessionListens
        self.lastSessionDayKey = lastSessionDayKey
    }

    mutating func registerAllTasksCompleted(todayKey: String, calendar: Calendar = .current) {
        if let last = lastAllTasksDayKey, last == todayKey { return }
        guard let todayDate = DateFormatter.dayKey.date(from: todayKey) else {
            lastAllTasksDayKey = todayKey
            return
        }

        if let lastKey = lastAllTasksDayKey, let lastDate = DateFormatter.dayKey.date(from: lastKey) {
            let days = calendar.dateComponents([.day], from: lastDate, to: todayDate).day ?? 0
            if days == 1 {
                streakDays += 1
            } else if days > 1 {
                missedDays += days - 1
                streakDays = 1
            }
        } else {
            streakDays = 1
        }

        lastAllTasksDayKey = todayKey
    }
}
