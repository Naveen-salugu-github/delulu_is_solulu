import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var vm = HomeViewModel()
    @State private var showPlayer = false

    var body: some View {
        ZStack {
            BreathingBackground()

            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    header

                    dailySessionCard

                    tasksSection

                    streakSection

                    futureSelfSection
                }
                .padding(.horizontal, 20)
                .padding(.top, 16)
                .padding(.bottom, 32)
            }
        }
        .onAppear {
            appState.refreshTasksIfNeeded()
            vm.bind(appState: appState)
        }
        .onChange(of: appState.todayTasks) { _, new in
            vm.tasks = new
        }
        .onChange(of: appState.dailyProgress) { _, _ in
            vm.refreshMessage(appState: appState)
        }
        .fullScreenCover(isPresented: $showPlayer) {
            VisualizationPlayerView(
                profile: appState.userProfile!.futureSelf,
                onClose: { showPlayer = false }
            )
            .environmentObject(appState)
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(greeting())
                .font(.title.weight(.semibold))
                .foregroundStyle(AscendTheme.textPrimary)

            Text("A calm, cinematic space for your future self.")
                .font(.subheadline)
                .foregroundStyle(AscendTheme.textSecondary)
        }
        .padding(.top, 8)
    }

    private func greeting() -> String {
        let hour = Calendar.current.component(.hour, from: Date())
        let prefix: String
        if hour < 12 { prefix = "Good morning" }
        else if hour < 17 { prefix = "Good afternoon" }
        else { prefix = "Good evening" }
        return "\(prefix)."
    }

    private var dailySessionCard: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text("Daily visualization")
                        .font(.headline)
                        .foregroundStyle(AscendTheme.textPrimary)
                    Spacer()
                    Image(systemName: "waveform.circle.fill")
                        .foregroundStyle(AscendTheme.accentCyan)
                }

                Text("5–10 minutes of immersive, second-person narrative tuned to your goals and your week.")
                    .font(.subheadline)
                    .foregroundStyle(AscendTheme.textSecondary)
                    .fixedSize(horizontal: false, vertical: true)

                Button {
                    HapticsManager.shared.play(.medium)
                    showPlayer = true
                } label: {
                    Text("Begin session")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(PrimaryButtonStyle())
            }
        }
    }

    private var tasksSection: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text("Reality alignment")
                        .font(.headline)
                        .foregroundStyle(AscendTheme.textPrimary)
                    Spacer()
                    Text("\(vm.tasks.filter(\.isCompleted).count)/\(vm.tasks.count)")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(AscendTheme.textSecondary)
                }

                Text("Small moves that bend the arc of your week.")
                    .font(.subheadline)
                    .foregroundStyle(AscendTheme.textSecondary)

                VStack(spacing: 10) {
                    ForEach(vm.tasks) { task in
                        taskRow(task)
                    }
                }
            }
        }
    }

    private func taskRow(_ task: DailyTask) -> some View {
        Button {
            vm.toggleTask(task, appState: appState)
        } label: {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: task.isCompleted ? "checkmark.circle.fill" : "circle")
                    .font(.title3)
                    .foregroundStyle(task.isCompleted ? AscendTheme.accentCyan : AscendTheme.textSecondary)

                VStack(alignment: .leading, spacing: 4) {
                    Text(task.title)
                        .font(.body.weight(.semibold))
                        .foregroundStyle(AscendTheme.textPrimary)
                        .multilineTextAlignment(.leading)
                    Text(task.detail)
                        .font(.footnote)
                        .foregroundStyle(AscendTheme.textSecondary)
                        .multilineTextAlignment(.leading)
                }
                Spacer(minLength: 0)
            }
            .padding(12)
            .background {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(Color.white.opacity(0.04))
                    .overlay {
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .stroke(AscendTheme.glassStroke.opacity(0.6), lineWidth: 1)
                    }
            }
        }
        .buttonStyle(.plain)
    }

    private var streakSection: some View {
        GlassCard {
            HStack(spacing: 14) {
                ZStack {
                    Circle()
                        .fill(AscendTheme.accentViolet.opacity(0.25))
                        .frame(width: 54, height: 54)
                    Image(systemName: "flame.fill")
                        .foregroundStyle(AscendTheme.accentPink)
                        .font(.title2)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text("Progress streak")
                        .font(.headline)
                        .foregroundStyle(AscendTheme.textPrimary)
                    Text("\(appState.dailyProgress.streakDays) days anchored • \(appState.dailyProgress.missedDays) missed signal")
                        .font(.footnote)
                        .foregroundStyle(AscendTheme.textSecondary)
                }
                Spacer()
            }
        }
    }

    private var futureSelfSection: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 10) {
                Text("Future self message")
                    .font(.headline)
                    .foregroundStyle(AscendTheme.textPrimary)

                Text(vm.futureSelfMessage)
                    .font(.body)
                    .foregroundStyle(AscendTheme.textSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }
}

#Preview {
    HomeView()
        .environmentObject(AppState())
}
