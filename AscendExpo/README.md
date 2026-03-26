# Ascend (Expo / React Native)

Cross-platform version of **Ascend**: onboarding, home dashboard, visualization session player, daily tasks, streaks, adaptive narrative tone, haptics, AsyncStorage persistence, and optional OpenAI narratives.

## Requirements

- Node.js 18+
- `npm` or `yarn`
- **Expo Go** on your phone (iOS/Android), or an emulator (Android Studio / Xcode on macOS for iOS Simulator)

## Install & run (Windows)

```bash
cd AscendExpo
npm install
npx expo start
```

Then:

- Press `w` for **web** in the terminal, or scan the QR code with **Expo Go** (same Wi‑Fi as your PC).
- For **Android emulator**: press `a` (with Android Studio installed).
- **iOS Simulator** only works on **macOS** with Xcode; on Windows use a physical iPhone with Expo Go.

## Optional: AI narrative (OpenAI)

Create a `.env` in this folder (Expo loads `EXPO_PUBLIC_*` at bundle time):

```env
EXPO_PUBLIC_OPENAI_API_KEY=sk-your-key-here
```

Restart `npx expo start` after changing env. Without a key, the app uses the built-in offline narrative.

## Stack

- Expo SDK 55, React Native 0.83, TypeScript
- React Navigation (native stack)
- AsyncStorage, expo-haptics, expo-linear-gradient, expo-blur, expo-speech
