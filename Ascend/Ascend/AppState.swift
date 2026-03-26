import Combine
import Foundation

final class AppState: ObservableObject {
    @Published var userProfile: UserProfile?
    @Published var dailyProgress: DailyProgress
    @Published var todayTasks: [DailyTask]
    @Published var sessionHistory: [VisualizationSessionRecord]

    private let persistence: PersistenceServiceProtocol
    private let taskEngine: DailyTaskEngineProtocol

    var hasCompletedOnboarding: Bool { userProfile?.hasCompletedOnboarding ?? false }

    init(
        persistence: PersistenceServiceProtocol = LocalPersistenceService(),
        taskEngine: DailyTaskEngineProtocol = DailyTaskEngine()
    ) {
        self.persistence = persistence
        self.taskEngine = taskEngine
        let loadedProgress = persistence.loadDailyProgress()
        let loadedProfile = persistence.loadUserProfile()
        self.dailyProgress = loadedProgress
        self.sessionHistory = persistence.loadSessionHistory()
        self.userProfile = loadedProfile

        let key = DateFormatter.dayKey.string(from: Date())
        let savedTasks = persistence.loadDailyTasks()
        if let first = savedTasks.first, first.dayKey == key, !savedTasks.isEmpty {
            self.todayTasks = savedTasks
        } else {
            let generated = taskEngine.tasksForToday(profile: loadedProfile, progress: loadedProgress)
            self.todayTasks = generated
            persistence.saveDailyTasks(generated)
        }
    }

    func refreshTasksIfNeeded() {
        let key = DateFormatter.dayKey.string(from: Date())
        if todayTasks.first?.dayKey != key {
            todayTasks = taskEngine.tasksForToday(profile: userProfile, progress: dailyProgress)
            persistence.saveDailyTasks(todayTasks)
        }
    }

    func completeOnboarding(profile: UserProfile) {
        var p = profile
        p.onboardingCompletedAt = Date()
        userProfile = p
        persistence.saveUserProfile(p)
        todayTasks = taskEngine.tasksForToday(profile: p, progress: dailyProgress)
        persistence.saveDailyTasks(todayTasks)
    }

    func updateProgress(_ progress: DailyProgress) {
        dailyProgress = progress
        persistence.saveDailyProgress(progress)
    }

    func updateTasks(_ tasks: [DailyTask]) {
        todayTasks = tasks
        persistence.saveDailyTasks(tasks)
    }

    func appendSession(_ record: VisualizationSessionRecord) {
        sessionHistory.append(record)
        persistence.saveSessionHistory(sessionHistory)
    }
}

extension DateFormatter {
    static let dayKey: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_IN_POSIX")
        f.timeZone = TimeZone.current
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()
}
