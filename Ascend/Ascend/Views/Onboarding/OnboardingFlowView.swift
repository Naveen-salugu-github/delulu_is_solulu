import SwiftUI

struct OnboardingFlowView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var vm = OnboardingViewModel()

    var body: some View {
        ZStack {
            BreathingBackground()

            VStack(spacing: 0) {
                HStack {
                    if vm.step > 0 {
                        Button {
                            vm.back()
                        } label: {
                            Image(systemName: "chevron.left")
                                .font(.headline.weight(.semibold))
                                .foregroundStyle(AscendTheme.textSecondary)
                                .padding(12)
                                .background(Circle().fill(.ultraThinMaterial))
                        }
                        .transition(.opacity)
                    }
                    Spacer()
                    Text("Ascend")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(AscendTheme.textSecondary)
                    Spacer()
                    Color.clear.frame(width: 44, height: 44)
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)

                ZStack {
                    stepContent
                        .id(vm.step)
                        .transition(.asymmetric(
                            insertion: .move(edge: .trailing).combined(with: .opacity),
                            removal: .move(edge: .leading).combined(with: .opacity)
                        ))
                }
                .animation(.spring(response: 0.52, dampingFraction: 0.86), value: vm.step)
                .padding(.horizontal, 20)
                .padding(.top, 12)

                Spacer(minLength: 0)
            }
        }
    }

    @ViewBuilder
    private var stepContent: some View {
        switch vm.step {
        case 0:
            welcome
        case 1:
            categories
        case 2:
            income
        case 3:
            lifestyle
        case 4:
            personality
        case 5:
            fears
        default:
            summary
        }
    }

    private var welcome: some View {
        VStack(alignment: .leading, spacing: 22) {
            Spacer(minLength: 20)
            Text("Design the life you want to step into.")
                .font(.system(size: 34, weight: .semibold, design: .rounded))
                .foregroundStyle(AscendTheme.textPrimary)
                .fixedSize(horizontal: false, vertical: true)

            Text("Ascend builds immersive visualization sessions that evolve with your behavior—premium, personal, and grounded.")
                .font(.body)
                .foregroundStyle(AscendTheme.textSecondary)
                .fixedSize(horizontal: false, vertical: true)

            Spacer()

            Button("Start") {
                HapticsManager.shared.play(.light)
                vm.next()
            }
            .buttonStyle(PrimaryButtonStyle())
            .padding(.bottom, 12)
        }
    }

    private var categories: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("What are you ascending toward?")
                .font(.title2.weight(.semibold))
                .foregroundStyle(AscendTheme.textPrimary)

            Text("Choose every area that matters. Multiple selections are encouraged.")
                .font(.subheadline)
                .foregroundStyle(AscendTheme.textSecondary)

            ScrollView {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 150), spacing: 10)], spacing: 10) {
                    ForEach(LifeCategory.allCases) { cat in
                        let selected = vm.selectedCategories.contains(cat)
                        Button {
                            HapticsManager.shared.play(.selection)
                            if selected {
                                vm.selectedCategories.remove(cat)
                            } else {
                                vm.selectedCategories.insert(cat)
                            }
                        } label: {
                            HStack(spacing: 8) {
                                Image(systemName: cat.symbolName)
                                Text(cat.title)
                            }
                            .font(.subheadline.weight(.semibold))
                            .padding(.horizontal, 14)
                            .padding(.vertical, 10)
                            .background {
                                Capsule()
                                    .fill(selected ? AscendTheme.accentViolet.opacity(0.35) : Color.white.opacity(0.06))
                                    .overlay {
                                        Capsule().stroke(AscendTheme.glassStroke, lineWidth: 1)
                                    }
                            }
                            .foregroundStyle(AscendTheme.textPrimary)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.top, 8)
            }

            Spacer()

            Button("Continue") {
                guard !vm.selectedCategories.isEmpty else {
                    HapticsManager.shared.play(.warning)
                    return
                }
                vm.next()
            }
            .buttonStyle(PrimaryButtonStyle())
            .opacity(vm.selectedCategories.isEmpty ? 0.45 : 1)
            .padding(.bottom, 12)
        }
    }

    private var income: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("Your income horizon")
                .font(.title2.weight(.semibold))
                .foregroundStyle(AscendTheme.textPrimary)

            Text("Slide from a steady foundation to a generational scale. This anchors your visualizations.")
                .font(.subheadline)
                .foregroundStyle(AscendTheme.textSecondary)

            VStack(alignment: .leading, spacing: 10) {
                Text(vm.incomeDisplayString)
                    .font(.system(size: 28, weight: .semibold, design: .rounded))
                    .foregroundStyle(AscendTheme.textPrimary)
                    .contentTransition(.numericText())
                    .animation(.easeInOut(duration: 0.2), value: vm.incomeSlider)

                Slider(value: $vm.incomeSlider, in: 0...1)
                    .tint(AscendTheme.accentCyan)
            }
            .padding()
            .background {
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .fill(.ultraThinMaterial)
                    .overlay {
                        RoundedRectangle(cornerRadius: 22, style: .continuous)
                            .stroke(AscendTheme.glassStroke, lineWidth: 1)
                    }
            }

            Spacer()

            Button("Continue") {
                vm.next()
            }
            .buttonStyle(PrimaryButtonStyle())
            .padding(.bottom, 12)
        }
    }

    private func chipGrid(title: String, subtitle: String, items: [String], selection: Binding<Set<String>>) -> some View {
        VStack(alignment: .leading, spacing: 18) {
            Text(title)
                .font(.title2.weight(.semibold))
                .foregroundStyle(AscendTheme.textPrimary)

            Text(subtitle)
                .font(.subheadline)
                .foregroundStyle(AscendTheme.textSecondary)

            ScrollView {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 150), spacing: 10)], spacing: 10) {
                    ForEach(items, id: \.self) { item in
                        let selected = selection.wrappedValue.contains(item)
                        Button {
                            HapticsManager.shared.play(.selection)
                            if selected {
                                selection.wrappedValue.remove(item)
                            } else {
                                selection.wrappedValue.insert(item)
                            }
                        } label: {
                            Text(item)
                                .font(.subheadline.weight(.semibold))
                                .padding(.horizontal, 14)
                                .padding(.vertical, 10)
                                .background {
                                    Capsule()
                                        .fill(selected ? AscendTheme.accentCyan.opacity(0.22) : Color.white.opacity(0.06))
                                        .overlay {
                                            Capsule().stroke(AscendTheme.glassStroke, lineWidth: 1)
                                        }
                                }
                                .foregroundStyle(AscendTheme.textPrimary)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.top, 8)
            }

            Spacer()

            Button("Continue") {
                vm.next()
            }
            .buttonStyle(PrimaryButtonStyle())
            .padding(.bottom, 12)
        }
    }

    private var lifestyle: some View {
        chipGrid(
            title: "What does your ideal life look like?",
            subtitle: "Pick the scenes that feel true—not perfect.",
            items: vm.lifestyleOptions,
            selection: $vm.lifestyleSelections
        )
    }

    private var personality: some View {
        chipGrid(
            title: "Personality traits",
            subtitle: "Choose the traits your future self leads with.",
            items: vm.personalityOptions,
            selection: $vm.personalitySelections
        )
    }

    private var fears: some View {
        chipGrid(
            title: "What holds you back today?",
            subtitle: "Name the friction so the story can transform it.",
            items: vm.fearOptions,
            selection: $vm.fearSelections
        )
    }

    private var summary: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Your future self profile")
                .font(.title2.weight(.semibold))
                .foregroundStyle(AscendTheme.textPrimary)

            GlassCard {
                VStack(alignment: .leading, spacing: 10) {
                    labeled("Focus", vm.selectedCategories.map(\.title).joined(separator: ", "))
                    labeled("Income", vm.incomeDisplayString)
                    labeled("Lifestyle", vm.lifestyleSelections.sorted().joined(separator: ", "))
                    labeled("Traits", vm.personalitySelections.sorted().joined(separator: ", "))
                    labeled("Friction", vm.fearSelections.sorted().joined(separator: ", "))
                }
            }

            Text("We will send this profile to the narrative engine. Sessions adapt when you miss tasks or protect streaks.")
                .font(.footnote)
                .foregroundStyle(AscendTheme.textSecondary)
                .fixedSize(horizontal: false, vertical: true)

            Spacer()

            Button("Enter Ascend") {
                let profile = UserProfile(futureSelf: vm.buildFutureSelfProfile())
                HapticsManager.shared.play(.success)
                appState.completeOnboarding(profile: profile)
            }
            .buttonStyle(PrimaryButtonStyle())
            .padding(.bottom, 12)
        }
    }

    private func labeled(_ title: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title.uppercased())
                .font(.caption2.weight(.semibold))
                .foregroundStyle(AscendTheme.textSecondary)
            Text(value.isEmpty ? "—" : value)
                .font(.body.weight(.medium))
                .foregroundStyle(AscendTheme.textPrimary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

#Preview {
    OnboardingFlowView()
        .environmentObject(AppState())
}
