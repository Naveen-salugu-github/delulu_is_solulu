import UIKit

enum HapticEvent {
    case light
    case medium
    case heavy
    case success
    case warning
    case selection
}

final class HapticsManager {
    static let shared = HapticsManager()

    private let light = UIImpactFeedbackGenerator(style: .light)
    private let medium = UIImpactFeedbackGenerator(style: .medium)
    private let heavy = UIImpactFeedbackGenerator(style: .heavy)
    private let notification = UINotificationFeedbackGenerator()
    private let selection = UISelectionFeedbackGenerator()

    private init() {
        light.prepare()
        medium.prepare()
        heavy.prepare()
    }

    func play(_ event: HapticEvent) {
        switch event {
        case .light:
            light.impactOccurred()
        case .medium:
            medium.impactOccurred()
        case .heavy:
            heavy.impactOccurred()
        case .success:
            notification.notificationOccurred(.success)
        case .warning:
            notification.notificationOccurred(.warning)
        case .selection:
            selection.selectionChanged()
        }
    }
}
