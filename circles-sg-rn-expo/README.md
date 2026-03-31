# Circles Roaming Expo Brownfield

This repository is the shared Expo source project for the Circles Roaming module.

It follows the `expo-brownfield` model:

- native Android and iOS apps keep shell ownership
- Expo owns the shared product flow
- Android and iOS consume generated SDK artifacts instead of copying feature code into each host app

The current Android SDK coordinates are:

```kotlin
implementation("com.circles.telco:circles-travel-pass-sdk:1.0.0")
```

## What this repo contains

- the shared React Native / Expo UI for the Circles Roaming feature
- the `expo-brownfield` plugin configuration for Android and iOS SDK generation
- native bridge contracts used between the host app and the shared module
- scripts for local simulation and demo release flows
- documentation for host app integration and remote Maven publishing

## Architecture

This repo is the common product source.

Flow:

1. A native host app decides when to open the Circles Roaming feature.
2. The host app sends a typed launch payload using `circles.roaming.launch`.
3. This Expo module stores that payload in brownfield state.
4. The shared UI renders the travel-pass flow.
5. The Expo module sends lifecycle and completion events back to native:
   - `circles.roaming.ready`
   - `circles.roaming.stepChanged`
   - `circles.roaming.completed`
6. Native handles completion and returns to its own navigation stack.

## Key files

- `App.tsx`
  - the shared two-screen flow state machine
- `src/brownfield/provider.tsx`
  - loads the runtime, waits for launch payloads, and exposes brownfield helpers to the UI
- `src/screens/TravelPassesScreen.tsx`
  - travel pass selection screen
- `src/screens/ActivationSummaryScreen.tsx`
  - final confirmation screen and completion handoff
- `src/brownfield/contracts.ts`
  - launch and completion contract definitions
- `app.json`
  - `expo-brownfield` SDK generation and publishing configuration

## Prerequisites

- Node.js 20+
- npm
- Xcode for iOS local builds
- Android Studio and Android SDK for Android local builds

Recommended:

- Expo CLI through `npx`
- a recent Android emulator or iOS simulator

## Install dependencies

```bash
npm install
```

## Run the shared UI locally

For fast UI iteration:

```bash
npx expo start
```

You can then open the app in:

- Expo Go
- Android Emulator
- iOS Simulator
- browser

Preview behavior:

- when the brownfield runtime is not available, the app uses preview mode
- in development native builds, if the host payload does not arrive in time, the app seeds a development launch payload so the shared screens still open

## Run native Expo builds

If you need a local native app instead of Expo Go:

```bash
npx expo run:android
npx expo run:ios
```

Use this when you want to check:

- native startup behavior
- brownfield runtime packaging
- Android or iOS native integration issues

## Generate real brownfield SDK artifacts

### Android

```bash
npx expo-brownfield build:android -r
```

### iOS

```bash
npx expo-brownfield build:ios -r
```

Optional iOS Swift Package wrapper:

```bash
npx expo-brownfield build:ios -r -p CirclesTravelPassSDK
```

## Publish local Maven artifacts for Android

The Android host app in this workspace uses the real brownfield Android runtime built from this repo.

From the Android project generated under this repo:

```bash
cd android
./gradlew :expo:publishBrownfieldReleasePublicationToMavenLocal \
  :circles-travel-pass-sdk:publishBrownfieldReleasePublicationToMavenLocal
```

This publishes to:

- `~/.m2/repository/com/circles/telco/circles-travel-pass-sdk/1.0.0`

## Generate demo artifacts

These scripts are useful for demos, documentation, and release simulation:

```bash
node scripts/simulate-build-ios.mjs --version 1.0.0
node scripts/simulate-build-android.mjs --version 1.0.0
node scripts/release-sdks.mjs --version 1.0.0 --notes "Circles Roaming brownfield refresh"
```

These are not a replacement for the real `expo-brownfield build:*` commands.

## Publish to GitHub Packages

This repo is configured for a remote Maven repository named `githubPackages`.

The current config expects these environment variables:

```bash
export CIRCLES_MAVEN_URL=https://maven.pkg.github.com/iniyanmurugavel/common-rn-expo
export CIRCLES_MAVEN_USERNAME=iniyanmurugavel
export CIRCLES_MAVEN_PASSWORD=YOUR_GITHUB_CLASSIC_PAT
```

Your token should be a GitHub classic personal access token with:

- `write:packages`
- `read:packages`
- `repo` if the target repo is private

Publish flow:

```bash
npx expo prebuild --platform android --clean
npx expo-brownfield tasks:android
npx expo-brownfield build:android --release --repository githubPackages
```

If remote publish succeeds, a host app can move to:

```kotlin
implementation("com.circles.telco:circles-travel-pass-sdk:1.0.0")
```

without loading a local AAR manually.

## Versioning

Current SDK version:

- `1.0.0`

Version is defined in `app.json` under the `expo-brownfield` Android config.

Typical release sequence:

1. update shared Expo code
2. bump the Android and iOS SDK version in this repo
3. generate or publish Android and iOS artifacts
4. update host apps to the new SDK version
5. run host regression checks

## Related docs

- `docs/local-run-guide.md`
  - local Expo, simulator, device, and development-client guidance
- `docs/host-app-integration.md`
  - how Android and iOS host apps integrate the generated artifacts
- `docs/release-build-guide.md`
  - debug vs release guidance for Expo and native hosts
- `docs/android-remote-maven-publishing.md`
  - remote Maven publishing setup for Android
- `docs/native-trigger.md`
  - native launch message contract

## Troubleshooting

### White screen on Android host

Check:

- the host app installed the latest local AAR
- Metro is reachable if you are in a dev flow
- the host activity is launching with a valid brownfield payload
- the host app was reinstalled after changing SDK code

### `Launch payload missing`

This usually means:

- the host did not send `circles.roaming.launch`, or
- you opened the module outside the real native host path

In development builds, the provider falls back to a development launch payload after a short timeout.

### GitHub Packages publish returns `403`

This usually means:

- the token does not have `write:packages`
- the token is not a classic PAT
- the repo is private and the token is missing `repo`

### Host app using raw local AAR needs extra dependencies

If a host app loads only:

```kotlin
implementation(mapOf("name" to "circles-travel-pass-sdk-1.0.0", "ext" to "aar"))
```

it must also resolve the first-level runtime dependencies from Gradle repositories because a raw local `AAR` does not bring its Maven metadata with it.

## Current sibling repos in this workspace

- `../circles-roaming-android-host`
  - example Android host app
- `../android-brownfield-sdk`
  - simulated Android SDK repo for demo flow
- `../ios-brownfield-sdk`
  - simulated iOS SDK repo for demo flow
