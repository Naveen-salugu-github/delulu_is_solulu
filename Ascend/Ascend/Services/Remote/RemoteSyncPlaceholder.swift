import Foundation

/// Replace with a concrete `SupabaseClient` or Firebase implementation.
/// `LocalPersistenceService` remains the offline source of truth; sync can merge on sign-in.
protocol RemoteSyncServiceProtocol: AnyObject {
    func pushProfile(_ profile: UserProfile) async throws
    func pullProfile() async throws -> UserProfile?
}

/// No-op stub so the app runs without backend credentials. Wire your SDK and credentials here.
final class RemoteSyncPlaceholder: RemoteSyncServiceProtocol {
    func pushProfile(_ profile: UserProfile) async throws {}
    func pullProfile() async throws -> UserProfile? { nil }
}
