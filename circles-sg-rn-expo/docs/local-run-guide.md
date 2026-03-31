# Local Expo run and native verification

This guide is written for someone who is new to Expo and wants the fastest way to see the app working.

## 1. Run the app locally in Expo first

This repo supports a local Expo run so you can see the Circles Roaming React Native flow before wiring it into the real native `expo-brownfield` host.

When you run the Android or iOS development client directly, the app now seeds a development launch payload automatically if no native `circles.roaming.launch` message arrives. Production brownfield builds still require the real native handoff.

From `/Users/iniyan.murugavel/Downloads/expo-brownfield-demo/common-rn-expo`:

```bash
npm install
npx expo start
```

Then open the app in one of these ways:

- iOS Simulator
- Android Emulator
- Expo Go
- Web browser

The local Expo run uses mock telco launch data from `src/brownfield/mock-launch.ts`, so Travel Passes and Activation Summary work without the native brownfield host.

If your phone cannot connect on local Wi-Fi, use:

```bash
npx expo start --tunnel -c
```

## 2. Real native verification

Once the React Native flow looks right, verify native compilation and real module behavior:

```bash
npx expo run:ios
npx expo run:android
```

After the first native build is installed, daily JS or TS changes only need:

```bash
npx expo start
```

Then press:

- `i` for iOS
- `a` for Android

Use this step when you want to validate native modules, build settings, and brownfield integration behavior.

## 3. Real brownfield embedding

For the actual architecture, the host native app should launch the SDK and send a `circles.roaming.launch` payload as documented in `docs/native-trigger.md`.

## Notes

- The local Expo run is for fast UI and JavaScript validation.
- Native brownfield verification is still required before calling a feature production-ready.
- The current demo library version is `1.0.0`.
- Expo documents local native development with `npx expo run:ios`, `npx expo run:android`, and then `npx expo start` for JS iteration.

References:

- https://docs.expo.dev/guides/local-app-development/
- https://docs.expo.dev/versions/latest/sdk/brownfield/
