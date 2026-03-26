import Combine
import Foundation

final class OnboardingViewModel: ObservableObject {
    @Published var step: Int = 0
    @Published var selectedCategories: Set<LifeCategory> = []
    /// 0...1 maps logarithmically to annual INR [50k/month, 10 Cr/year]
    @Published var incomeSlider: Double = 0.35
    @Published var lifestyleSelections: Set<String> = []
    @Published var personalitySelections: Set<String> = []
    @Published var fearSelections: Set<String> = []

    let lifestyleOptions = [
        "Luxury apartment",
        "Travel lifestyle",
        "Startup founder",
        "Athlete body",
        "Peaceful minimalist life"
    ]

    let personalityOptions = [
        "disciplined",
        "confident",
        "creative",
        "fearless",
        "calm",
        "dominant"
    ]

    let fearOptions = [
        "procrastination",
        "fear of failure",
        "lack of focus",
        "low confidence",
        "distractions"
    ]

    var annualIncomeINR: Double {
        OnboardingViewModel.incomeFromSlider(incomeSlider)
    }

    var incomeDisplayString: String {
        IncomeFormatting.string(forAnnualINR: annualIncomeINR)
    }

    static func incomeFromSlider(_ t: Double) -> Double {
        let clamped = min(1, max(0, t))
        let minAnnual = 50_000.0 * 12.0
        let maxAnnual = 10.0 * 10_000_000.0
        let logMin = log(minAnnual)
        let logMax = log(maxAnnual)
        return exp(logMin + clamped * (logMax - logMin))
    }

    func buildFutureSelfProfile() -> FutureSelfProfile {
        FutureSelfProfile(
            goals: selectedCategories,
            incomeTargetAnnualINR: annualIncomeINR,
            lifestyleTags: Array(lifestyleSelections).sorted(),
            personalityTraits: Array(personalitySelections).sorted(),
            fears: Array(fearSelections).sorted()
        )
    }

    func next() {
        guard step < 6 else { return }
        step += 1
        HapticsManager.shared.play(.selection)
    }

    func back() {
        guard step > 0 else { return }
        step -= 1
        HapticsManager.shared.play(.light)
    }
}
