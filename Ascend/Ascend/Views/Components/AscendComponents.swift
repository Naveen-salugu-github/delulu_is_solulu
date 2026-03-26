import SwiftUI

struct BreathingBackground: View {
    @State private var phase: CGFloat = 0

    var body: some View {
        TimelineView(.animation(minimumInterval: 1 / 30)) { timeline in
            let t = timeline.date.timeIntervalSinceReferenceDate
            let breathe = (sin(t * 0.6) + 1) / 2

            ZStack {
                LinearGradient(
                    colors: [
                        AscendTheme.backgroundTop,
                        AscendTheme.accentViolet.opacity(0.28 + breathe * 0.12),
                        AscendTheme.backgroundMid,
                        AscendTheme.accentCyan.opacity(0.12 + breathe * 0.1)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )

                RadialGradient(
                    colors: [AscendTheme.accentPink.opacity(0.18), .clear],
                    center: .center,
                    startRadius: 40,
                    endRadius: 420 + CGFloat(breathe) * 40
                )
                .blendMode(.plusLighter)
            }
            .ignoresSafeArea()
        }
        .onAppear {
            phase = 1
        }
    }
}

struct SiriOrbView: View {
    @State private var pulse: Bool = false

    var body: some View {
        ZStack {
            Circle()
                .fill(
                    RadialGradient(
                        colors: [AscendTheme.accentCyan.opacity(0.9), AscendTheme.accentViolet.opacity(0.55), .clear],
                        center: .center,
                        startRadius: 10,
                        endRadius: 120
                    )
                )
                .frame(width: 220, height: 220)
                .blur(radius: 18)
                .scaleEffect(pulse ? 1.06 : 0.98)

            Circle()
                .strokeBorder(
                    LinearGradient(
                        colors: [.white.opacity(0.55), .white.opacity(0.08)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 1.2
                )
                .frame(width: 200, height: 200)
                .background {
                    Circle()
                        .fill(.ultraThinMaterial)
                }

            Circle()
                .fill(AscendTheme.heroGradient.opacity(0.35))
                .frame(width: 140, height: 140)
                .blur(radius: 8)
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 3.2).repeatForever(autoreverses: true)) {
                pulse = true
            }
        }
    }
}

struct WaveformView: View {
    var progress: Double
    @State private var phase: CGFloat = 0

    var body: some View {
        TimelineView(.animation(minimumInterval: 1 / 30)) { timeline in
            let t = CGFloat(timeline.date.timeIntervalSinceReferenceDate)
            Canvas { context, size in
                let midY = size.height / 2
                let barCount = 36
                let barWidth = size.width / CGFloat(barCount)

                for i in 0..<barCount {
                    let x = CGFloat(i) * barWidth + barWidth * 0.2
                    let w = barWidth * 0.55
                    let travel = sin(t * 3 + CGFloat(i) * 0.35)
                    let amp = CGFloat(10 + (Double(i) / Double(barCount)) * 18) * (0.45 + CGFloat(progress) * 0.55)
                    let h = max(6, abs(travel) * amp + 6)
                    let rect = CGRect(x: x, y: midY - h / 2, width: w, height: h)
                    let color = Color(
                        hue: 0.72 + Double(i) / 200.0,
                        saturation: 0.55,
                        brightness: 0.95
                    ).opacity(0.35 + Double(progress) * 0.45)

                    context.fill(
                        Path(roundedRect: rect, cornerRadius: w / 2),
                        with: .color(color)
                    )
                }
            }
            .frame(height: 72)
        }
    }
}
