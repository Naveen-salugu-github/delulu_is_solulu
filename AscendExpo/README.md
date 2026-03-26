# Ascend (Expo / React Native)

Cross-platform version of **Ascend**: onboarding, home dashboard, visualization session player, daily tasks, streaks, adaptive narrative tone, haptics, AsyncStorage persistence, and optional Groq AI narratives.

## Requirements

- Node.js 18+
- `npm` or `yarn`
- **Expo Go** on your phone (iOS/Android), or an emulator (Android Studio / Xcode on macOS for iOS Simulator)

## Install & run (Windows)

```bash
cd AscendExpo
npm install
npm run start
```

Use **`npm run start`** (not a bare `expo` command). If `npx expo start` fails with `'expo' is not recognized`, your PATH is fine—`npm` runs the local CLI from `node_modules`. The scripts in `package.json` call Expo via `node` so they work without a global `expo` install.

## Tri-platform testing (web + Android + iOS)

- **Web UI (desktop browser):** `npm run web`
- **Web UI on iPhone Safari:** `npm run web:lan`, then open `http://<your-pc-local-ip>:8083` on iPhone (same Wi-Fi)
- **Android emulator/device (native):** `npm run android`
- **iPhone native (Expo Go):** `npm run start` and scan QR from Expo Go app

Notes:
- iPhone Safari tests the **web build** (React Native Web), not native iOS runtime.
- For native iOS behavior (gestures, haptics differences), use **Expo Go** on iPhone.

Then:

- Press `w` for **web** in the terminal, or scan the QR code with **Expo Go** (same Wi‑Fi as your PC).
- For **Android emulator**: press `a` (with Android Studio installed).
- **iOS Simulator** only works on **macOS** with Xcode; on Windows use a physical iPhone with Expo Go.

## Optional: AI narrative (Groq)

Create a `.env` in this folder (Expo loads `EXPO_PUBLIC_*` at bundle time):

```env
EXPO_PUBLIC_GROQ_API_KEY=groq_your_key_here
EXPO_PUBLIC_GROQ_MODEL=llama-3.1-8b-instant
```

Restart `npx expo start` after changing env. Without a key, the app uses the built-in offline narrative.

## Stack

- Expo SDK 55, React Native 0.83, TypeScript
- React Navigation (native stack)
- AsyncStorage, expo-haptics, expo-linear-gradient, expo-blur, expo-speech
