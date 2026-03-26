import Foundation

struct DailyTask: Codable, Identifiable, Equatable {
    var id: UUID
    var title: String
    var detail: String
    var category: LifeCategory
    var isCompleted: Bool
    var dayKey: String

    init(
        id: UUID = UUID(),
        title: String,
        detail: String,
        category: LifeCategory,
        isCompleted: Bool = false,
        dayKey: String
    ) {
        self.id = id
        self.title = title
        self.detail = detail
        self.category = category
        self.isCompleted = isCompleted
        self.dayKey = dayKey
    }
}
