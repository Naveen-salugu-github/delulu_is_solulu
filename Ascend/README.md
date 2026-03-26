# Ascend (temporary name)

Production-style SwiftUI app (iOS 17+) for personalized visualization sessions, daily alignment tasks, streaks, and adaptive narrative tone.

## Open in Xcode

1. Open `Ascend.xcodeproj` on a Mac with Xcode 15+.
2. Select the **Ascend** scheme and an iPhone simulator or device.
3. Optional: **Product → Scheme → Edit Scheme → Run → Arguments → Environment Variables** add `OPENAI_API_KEY` for live AI narratives. Without it, the app uses a rich offline fallback narrative.

## Architecture

- **MVVM** with `ObservableObject` view models and Combine-friendly `@Published` state.
- **Persistence**: `LocalPersistenceService` (Application Support JSON). Replace or extend with `RemoteSyncPlaceholder` for Supabase/Firebase.
- **AI**: `AINarrativeService` (OpenAI-compatible chat completions) + `AIPromptTemplates` + `FeedbackLoopEngine` for tone.
- **Haptics**: `HapticsManager` (UIKit generators).
- **Optional voice**: `NarrationAudioEngine` (AVSpeech) in the visualization player.

## Product

- Multi-step onboarding → `FutureSelfProfile` → home dashboard → Siri-style visualization player (orb, breathing gradient, waveform, line-by-line copy).
- Daily tasks, streaks, missed-day signal, and session history drive adaptive tone (empowering vs confrontational vs supportive).
