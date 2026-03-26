import Foundation

struct UserProfile: Codable, Equatable {
    var id: UUID
    var displayName: String?
    var futureSelf: FutureSelfProfile
    var onboardingCompletedAt: Date?
    var createdAt: Date

    init(
        id: UUID = UUID(),
        displayName: String? = nil,
        futureSelf: FutureSelfProfile,
        onboardingCompletedAt: Date? = nil,
        createdAt: Date = Date()
    ) {
        self.id = id
        self.displayName = displayName
        self.futureSelf = futureSelf
        self.onboardingCompletedAt = onboardingCompletedAt
        self.createdAt = createdAt
    }

    var hasCompletedOnboarding: Bool { onboardingCompletedAt != nil }
}
