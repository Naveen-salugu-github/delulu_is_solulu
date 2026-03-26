import Foundation

struct FutureSelfProfile: Codable, Equatable {
    var goals: Set<LifeCategory>
    var incomeTargetAnnualINR: Double
    var lifestyleTags: [String]
    var personalityTraits: [String]
    var fears: [String]

    init(
        goals: Set<LifeCategory>,
        incomeTargetAnnualINR: Double,
        lifestyleTags: [String],
        personalityTraits: [String],
        fears: [String]
    ) {
        self.goals = goals
        self.incomeTargetAnnualINR = incomeTargetAnnualINR
        self.lifestyleTags = lifestyleTags
        self.personalityTraits = personalityTraits
        self.fears = fears
    }
}
