import Foundation

enum NarrativeToneKind: String, Codable {
    case empowering
    case confrontational
    case supportive
    case neutral
}

enum AIPromptTemplates {

    static func visualizationNarrative(
        profile: FutureSelfProfile,
        tone: NarrativeToneKind,
        metrics: DailyProgress
    ) -> String {
        let goals = profile.goals.map(\.title).joined(separator: ", ")
        let income = IncomeFormatting.string(forAnnualINR: profile.incomeTargetAnnualINR)
        let lifestyle = profile.lifestyleTags.joined(separator: ", ")
        let traits = profile.personalityTraits.joined(separator: ", ")
        let fears = profile.fears.joined(separator: ", ")

        return """
        You are an expert visualization coach. Generate a vivid second-person visualization narrative for a user in India building their future self.

        User Profile:
        - Life focus areas: \(goals)
        - Income aspiration (reference naturally, do not fixate on numbers): \(income)
        - Lifestyle vision tags: \(lifestyle)
        - Personality traits to amplify: \(traits)
        - Current friction / fears to acknowledge: \(fears)

        Behavioral context (adapt tone):
        - Streak days: \(metrics.streakDays)
        - Missed days (tracked): \(metrics.missedDays)
        - Session listens: \(metrics.sessionListens)
        - Tasks completed (rolling signal): \(metrics.dailyTasksCompleted)

        Required narrative tone mode: \(tone.rawValue)
        - If empowering: celebrate identity, momentum, and sensory future scenes.
        - If confrontational: name avoidance honestly, demand presence, still end with a path forward.
        - If supportive: gentle accountability, repair after setbacks.
        - If neutral: balanced, cinematic, steady.

        Rules:
        - Second person POV ("you").
        - Immersive sensory descriptions (sound, light, breath, texture, city, home, body).
        - Realistic timeline (months and years, not overnight magic).
        - Emotionally powerful but not medically therapeutic; avoid guarantees of outcomes.
        - Length: 800–1200 words.
        - No bullet points. Paragraphs only.
        - Optionally include 2–3 subtle section transitions that could align with "beats" for haptics in a listening app (do not label them).

        Return only the narrative text.
        """
    }
}

enum IncomeFormatting {
    /// Slider domain: ₹50k/month … ₹10 Cr/year expressed as annual INR for storage.
    static func string(forAnnualINR annual: Double) -> String {
        let crore: Double = 10_000_000
        let month = annual / 12
        if annual >= crore {
            let cr = annual / crore
            return String(format: "about ₹%.1f Cr/year", cr)
        }
        if month >= 100_000 {
            return String(format: "about ₹%.0f L/year", annual / 100_000)
        }
        return String(format: "about ₹%.0f/month", month)
    }
}
