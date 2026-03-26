import SwiftUI

struct VisualizationPlayerView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var vm = VisualizationPlayerViewModel()
    @StateObject private var narration = NarrationAudioEngine()
    @State private var didRecordSessionCompletion = false

    let profile: FutureSelfProfile
    var onClose: () -> Void

    var body: some View {
        ZStack {
            BreathingBackground()

            VStack(spacing: 0) {
                HStack {
                    Button {
                        HapticsManager.shared.play(.light)
                        narration.stop()
                        vm.stop()
                        onClose()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.headline.weight(.semibold))
                            .foregroundStyle(AscendTheme.textSecondary)
                            .padding(12)
                            .background(Circle().fill(.ultraThinMaterial))
                    }

                    Spacer()

                    Toggle("Voice narration", isOn: $vm.narrationEnabled)
                        .toggleStyle(.switch)
                        .tint(AscendTheme.accentCyan)
                        .labelsHidden()
                        .accessibilityLabel("Voice narration")
                }
                .padding(.horizontal, 16)
                .padding(.top, 12)

                Spacer(minLength: 10)

                SiriOrbView()
                    .padding(.bottom, 10)

                WaveformView(progress: vm.sessionProgress)
                    .padding(.horizontal, 24)

                ProgressView(value: vm.sessionProgress)
                    .tint(AscendTheme.accentCyan)
                    .padding(.horizontal, 24)
                    .padding(.top, 8)

                Group {
                    switch vm.phase {
                    case .idle, .loading:
                        VStack(spacing: 12) {
                            ProgressView()
                                .tint(.white)
                            Text("Composing your visualization…")
                                .font(.subheadline)
                                .foregroundStyle(AscendTheme.textSecondary)
                        }
                        .padding(.top, 24)

                    case .playing, .completed:
                        ScrollView {
                            Text(vm.visibleText)
                                .font(.system(size: 22, weight: .regular, design: .rounded))
                                .foregroundStyle(AscendTheme.textPrimary)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 22)
                                .padding(.vertical, 18)
                                .animation(.easeInOut(duration: 0.35), value: vm.visibleLineCount)
                        }
                        .scrollIndicators(.hidden)
                    }
                }
                .frame(maxHeight: .infinity)

                if vm.phase == .completed {
                    Button("Done") {
                        HapticsManager.shared.play(.success)
                        narration.stop()
                        onClose()
                    }
                    .buttonStyle(PrimaryButtonStyle())
                    .padding(.horizontal, 20)
                    .padding(.bottom, 18)
                } else {
                    Color.clear.frame(height: 18)
                }
            }
        }
        .onAppear {
            didRecordSessionCompletion = false
            vm.prepareSession(
                profile: profile,
                metrics: appState.dailyProgress,
                tasksToday: appState.todayTasks
            )
        }
        .onDisappear {
            narration.stop()
            vm.stop()
        }
        .onChange(of: vm.narrationEnabled) { _, on in
            if on {
                HapticsManager.shared.play(.selection)
                if !vm.narrative.isEmpty {
                    narration.speak(vm.narrative)
                }
            } else {
                narration.stop()
            }
        }
        .onChange(of: vm.narrative) { _, new in
            if vm.narrationEnabled, !new.isEmpty {
                narration.speak(new)
            }
        }
        .onChange(of: vm.phase) { _, new in
            guard new == .completed, !didRecordSessionCompletion else { return }
            didRecordSessionCompletion = true
            var p = appState.dailyProgress
            p.sessionListens += 1
            p.lastSessionDayKey = DateFormatter.dayKey.string(from: Date())
            appState.updateProgress(p)

            let record = VisualizationSessionRecord(
                durationSeconds: 7 * 60,
                narrativeTone: vm.tone.rawValue,
                completed: true
            )
            appState.appendSession(record)
        }
    }
}
