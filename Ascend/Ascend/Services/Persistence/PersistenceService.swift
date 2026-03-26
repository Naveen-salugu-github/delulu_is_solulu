import Foundation

protocol PersistenceServiceProtocol: AnyObject {
    func loadUserProfile() -> UserProfile?
    func saveUserProfile(_ profile: UserProfile)

    func loadDailyProgress() -> DailyProgress
    func saveDailyProgress(_ progress: DailyProgress)

    func loadDailyTasks() -> [DailyTask]
    func saveDailyTasks(_ tasks: [DailyTask])

    func loadSessionHistory() -> [VisualizationSessionRecord]
    func saveSessionHistory(_ sessions: [VisualizationSessionRecord])
}

/// Local-first persistence using Application Support. Swap for `SupabasePersistenceService` or Firebase when backend keys are configured.
final class LocalPersistenceService: PersistenceServiceProtocol {
    private let fm = FileManager.default
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    private var supportURL: URL {
        let url = fm.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
        let dir = url.appendingPathComponent("Ascend", isDirectory: true)
        if !fm.fileExists(atPath: dir.path) {
            try? fm.createDirectory(at: dir, withIntermediateDirectories: true)
        }
        return dir
    }

    private func url(_ name: String) -> URL {
        supportURL.appendingPathComponent(name)
    }

    func loadUserProfile() -> UserProfile? {
        let u = url("user_profile.json")
        guard let data = try? Data(contentsOf: u) else { return nil }
        return try? decoder.decode(UserProfile.self, from: data)
    }

    func saveUserProfile(_ profile: UserProfile) {
        try? encoder.encode(profile).write(to: url("user_profile.json"))
    }

    func loadDailyProgress() -> DailyProgress {
        let u = url("daily_progress.json")
        guard let data = try? Data(contentsOf: u),
              let p = try? decoder.decode(DailyProgress.self, from: data) else {
            return DailyProgress()
        }
        return p
    }

    func saveDailyProgress(_ progress: DailyProgress) {
        try? encoder.encode(progress).write(to: url("daily_progress.json"))
    }

    func loadDailyTasks() -> [DailyTask] {
        let u = url("daily_tasks.json")
        guard let data = try? Data(contentsOf: u) else { return [] }
        return (try? decoder.decode([DailyTask].self, from: data)) ?? []
    }

    func saveDailyTasks(_ tasks: [DailyTask]) {
        try? encoder.encode(tasks).write(to: url("daily_tasks.json"))
    }

    func loadSessionHistory() -> [VisualizationSessionRecord] {
        let u = url("session_history.json")
        guard let data = try? Data(contentsOf: u) else { return [] }
        return (try? decoder.decode([VisualizationSessionRecord].self, from: data)) ?? []
    }

    func saveSessionHistory(_ sessions: [VisualizationSessionRecord]) {
        try? encoder.encode(sessions).write(to: url("session_history.json"))
    }
}
