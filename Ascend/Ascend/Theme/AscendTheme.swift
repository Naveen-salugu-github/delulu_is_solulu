import SwiftUI

enum AscendTheme {
    static let backgroundTop = Color(red: 0.06, green: 0.05, blue: 0.14)
    static let backgroundMid = Color(red: 0.12, green: 0.08, blue: 0.22)
    static let accentViolet = Color(red: 0.55, green: 0.35, blue: 0.95)
    static let accentCyan = Color(red: 0.25, green: 0.85, blue: 0.95)
    static let accentPink = Color(red: 0.95, green: 0.35, blue: 0.65)
    static let glassStroke = Color.white.opacity(0.18)
    static let textPrimary = Color.white
    static let textSecondary = Color.white.opacity(0.65)

    static var heroGradient: LinearGradient {
        LinearGradient(
            colors: [accentViolet, accentCyan.opacity(0.85), accentPink.opacity(0.75)],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    static var breathingGradient: LinearGradient {
        LinearGradient(
            colors: [
                backgroundTop,
                accentViolet.opacity(0.35),
                backgroundMid,
                accentCyan.opacity(0.22)
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
}

struct GlassCard<Content: View>: View {
    var cornerRadius: CGFloat = 22
    @ViewBuilder var content: () -> Content

    var body: some View {
        content()
            .padding(18)
            .background {
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(.ultraThinMaterial)
                    .overlay {
                        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                            .stroke(AscendTheme.glassStroke, lineWidth: 1)
                    }
            }
    }
}

struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline.weight(.semibold))
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background {
                Capsule()
                    .fill(AscendTheme.heroGradient)
                    .opacity(configuration.isPressed ? 0.85 : 1)
            }
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
    }
}
