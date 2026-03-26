import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        Group {
            if appState.hasCompletedOnboarding {
                HomeView()
            } else {
                OnboardingFlowView()
            }
        }
        .animation(.easeInOut(duration: 0.45), value: appState.hasCompletedOnboarding)
    }
}

#Preview {
    ContentView()
        .environmentObject(AppState())
}
