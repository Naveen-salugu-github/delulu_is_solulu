import Foundation

enum LifeCategory: String, CaseIterable, Codable, Identifiable {
    case wealth
    case career
    case health
    case confidence
    case relationships
    case lifestyle

    var id: String { rawValue }

    var title: String {
        switch self {
        case .wealth: return "Wealth"
        case .career: return "Career"
        case .health: return "Health"
        case .confidence: return "Confidence"
        case .relationships: return "Relationships"
        case .lifestyle: return "Lifestyle"
        }
    }

    var symbolName: String {
        switch self {
        case .wealth: return "indianrupeesign.circle.fill"
        case .career: return "briefcase.fill"
        case .health: return "heart.fill"
        case .confidence: return "sparkles"
        case .relationships: return "person.2.fill"
        case .lifestyle: return "sun.max.fill"
        }
    }
}
