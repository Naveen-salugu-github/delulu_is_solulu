import Foundation

protocol DailyTaskEngineProtocol {
    func tasksForToday(profile: UserProfile?, progress: DailyProgress) -> [DailyTask]
}

struct DailyTaskEngine: DailyTaskEngineProtocol {
    func tasksForToday(profile: UserProfile?, progress: DailyProgress) -> [DailyTask] {
        let dayKey = DateFormatter.dayKey.string(from: Date())
        let defaults: [LifeCategory] = [.wealth, .health, .confidence, .career, .relationships, .lifestyle]
        var base: [LifeCategory] = []
        if let goals = profile?.futureSelf.goals {
            base = Array(goals).sorted(by: { $0.rawValue < $1.rawValue })
        }
        for category in defaults where base.count < 3 {
            if !base.contains(category) {
                base.append(category)
            }
        }
        base = Array(base.prefix(3))

        let templates: [LifeCategory: [(String, String)]] = [
            .wealth: [
                ("Deep work sprint", "45 minutes on a revenue skill—no inbox."),
                ("Three ideas", "Write three ideas that could earn or compound."),
                ("Money clarity", "Review one expense with calm intention.")
            ],
            .career: [
                ("Signal upgrade", "Send one message that advances your career."),
                ("Skill rep", "30 minutes of deliberate practice."),
                ("Story polish", "Rewrite your one-line professional story.")
            ],
            .health: [
                ("Move", "20 minutes of movement you enjoy."),
                ("Fuel", "One nourishing meal, phone away."),
                ("Sleep gate", "Set a non-negotiable wind-down time.")
            ],
            .confidence: [
                ("Evidence log", "Write three proofs you handled hard things."),
                ("Voice", "Speak your goal out loud—clear, slow, certain."),
                ("Boundary", "Say one small no that protects your focus.")
            ],
            .relationships: [
                ("Reach", "One thoughtful message to someone you value."),
                ("Presence", "10 minutes of listening without fixing."),
                ("Repair", "If needed, one honest sentence that builds trust.")
            ],
            .lifestyle: [
                ("Environment", "10 minutes restoring one corner of your space."),
                ("Joy", "One small delight, guilt-free."),
                ("Travel fund", "Move a small amount toward a future trip.")
            ]
        ]

        return base.enumerated().map { index, cat in
            let options = templates[cat] ?? templates[.wealth]!
            let pick = options[index % options.count]
            return DailyTask(title: pick.0, detail: pick.1, category: cat, dayKey: dayKey)
        }
    }
}
