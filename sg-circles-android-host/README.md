# Circles Roaming Android Host

This repository is a native Android sample host app for the Circles Roaming shared module.

It demonstrates the brownfield integration model used in this workspace:

- native Android keeps shell ownership
- the shared Expo module is delivered as an Android SDK
- the host opens the feature on demand and sends the launch payload
- completion returns back to native through a delegate-style API

## What this sample proves

- a clean Android app can integrate the shared Circles SDK
- the host can launch the shared roaming flow from Compose or any other native entry point
- the host can pass a typed request into the shared module
- the host can receive ready, completed, and closed callbacks
- the host can run either with a local `AAR` or later with a remote Maven dependency

## Current integration model

Right now this sample is configured for local `AAR` loading.

The host app loads:

```kotlin
implementation(mapOf("name" to "circles-travel-pass-sdk-1.0.0", "ext" to "aar"))
```

from:

- `app/libs/circles-travel-pass-sdk-1.0.0.aar`

The rest of the runtime is resolved through Gradle repositories.

This is useful for:

- local testing
- brownfield validation
- handoff to an Android team before remote Maven is live

For CI and multi-developer usage, remote Maven is the better end state.

## Project structure

- `app/src/main/java/com/circles/travelpass/host/MainActivity.kt`
  - Compose host shell and example integration screen
- `app/src/main/java/com/circles/travelpass/host/CirclesTravelPassSdk.kt`
  - the public Android launcher API and delegate contract
- `app/src/main/java/com/circles/travelpass/host/CirclesRoamingContainerActivity.kt`
  - the internal container activity that hosts the shared brownfield screen
- `app/build.gradle.kts`
  - app dependencies, Compose setup, and SDK AAR dependency
- `settings.gradle.kts`
  - repositories for Gradle, Expo module repos, and local `AAR` resolution
- `scripts/sync-sdk-aars.sh`
  - copies the current SDK AAR into `app/libs`

## Public launcher API

Use the SDK launcher object:

- `CirclesTravelPassSdk.launch(activity, request, delegate)`
- `CirclesTravelPassSdk.launch(context, request, delegate)`
- `CirclesTravelPassSdk.launch(launcher, context, request, delegate)`
- `CirclesTravelPassSdk.createIntent(context, request)`

The request type is:

- `TravelPassLaunchRequest`

The callback contract is:

- `CirclesTravelPassDelegate`

That makes the host integration scalable because the shared module can be opened from:

- a Compose button
- a fragment
- a classic view-based screen
- an activity result launcher flow

without exposing the internal container activity directly as the primary integration API.

## Prerequisites

- Android Studio
- Android SDK
- NDK `29.0.13599879`
- Java 17

The app is already pinned to:

- `compileSdk = 36`
- `targetSdk = 36`
- `ndkVersion = "29.0.13599879"`

## Refresh the local SDK AAR

### Step 1: publish the Expo brownfield artifacts locally

From the shared Expo repo:

```bash
cd /Users/iniyan.murugavel/Downloads/expo-brownfield-demo/common-rn-expo/android
./gradlew :expo:publishBrownfieldReleasePublicationToMavenLocal \
  :circles-travel-pass-sdk:publishBrownfieldReleasePublicationToMavenLocal
```

### Step 2: copy the SDK AAR into this host app

From this host app repo:

```bash
./scripts/sync-sdk-aars.sh
```

That updates:

- `app/libs/circles-travel-pass-sdk-1.0.0.aar`

## Why the host still declares Expo and React dependencies

Because this sample currently loads the SDK as a raw local `AAR`.

A raw local `AAR` does not automatically import its Maven `.pom` metadata.

That means the host app must declare the SDK's first-level runtime dependencies itself:

```kotlin
implementation("host.exp.exponent:expo.core:55.0.9")
implementation("com.facebook.react:react-android:0.83.4")
implementation("com.facebook.hermes:hermes-android:0.14.1")
```

Why they matter:

- `expo.core`
  - Expo runtime layer
- `react-android`
  - React Native framework classes needed by the brownfield runtime
- `hermes-android`
  - Hermes JS engine used by the shared React Native runtime

If you move to remote Maven consumption later, these explicit lines should no longer be needed in the host app because the SDK metadata should carry them transitively.

## Build and run

Build debug:

```bash
./gradlew assembleDebug
```

Install debug:

```bash
./gradlew installDebug
```

Open the host app:

```bash
adb shell am start -n com.circles.travelpass.host/.MainActivity
```

## How the flow works

1. `MainActivity` renders the host shell using Compose.
2. User taps the action to open Circles Roaming.
3. The host constructs a `TravelPassLaunchRequest`.
4. `CirclesTravelPassSdk.launch(...)` opens `CirclesRoamingContainerActivity`.
5. The container activity converts the request into brownfield state and sends `circles.roaming.launch`.
6. The shared Expo module renders the roaming flow.
7. Completion events are mapped back into `TravelPassCompletion`.
8. The delegate receives the result and native regains control.

## Example integration from Compose

This repo already uses Compose in `MainActivity`.

Typical call:

```kotlin
CirclesTravelPassSdk.launch(
  activity = this,
  request = TravelPassLaunchRequest(
    correlationId = "corr-1001",
    currentPlanName = "Circles 5G",
    currentUsageGb = "72 GB used",
    destinationName = "Tokyo",
    lineNumber = "+65 9000 1234",
    recommendedPassId = "roam-like-local",
    renewalDate = "2026-04-12",
    sessionId = "session-1001",
    sourcePlatform = "android",
    sourceScreen = "account-overview",
    subscriberId = "sub-1001",
  ),
  delegate = object : CirclesTravelPassDelegate {
    override fun onFlowReady() {}

    override fun onFlowCompleted(result: TravelPassCompletion) {}

    override fun onFlowClosed() {}
  },
)
```

## Move to remote Maven later

After the SDK is published remotely, this host should move away from local AAR loading.

The end-state dependency should be:

```kotlin
implementation("com.circles.telco:circles-travel-pass-sdk:1.0.0")
```

At that point:

- `app/libs` should no longer contain the SDK AAR
- the host should stop syncing local AAR files
- the SDK should be resolved through a remote Maven repository such as GitHub Packages, Artifactory, Nexus, or an internal repository

## Troubleshooting

### Gradle cannot find the build

Open the real host project path:

- `/Users/iniyan.murugavel/Downloads/expo-brownfield-demo/circles-roaming-android-host`

The old `android-empty-host-app` path is only a compatibility alias.

### `DefaultHardwareBackBtnHandler` crash

The container activity must implement the React Native back-handler contract.

This is already fixed in:

- `app/src/main/java/com/circles/travelpass/host/CirclesRoamingContainerActivity.kt`

### `CalledFromWrongThreadException` when handling brownfield messages

The brownfield SDK `BrownfieldMessaging.addListener` receives messages on a background React Native event thread (`mqt_v_js`), not the main thread.

Any native SDK routing code or UI manipulations (like hiding overlays, showing Toasts, or closing an Activity via `finish()`) executed in response to these messages **must actively dispatch to the UI thread**, typically by wrapping the callback with `Activity.runOnUiThread { ... }` or equivalent mechanism.

### White screen before the shared flow loads

The host already includes:

- a dark native loading shell
- a branded overlay while the React Native view becomes ready
- debug cleartext allowances for local dev host boot

If you still see a white screen, reinstall the latest debug build.

### Build succeeds but runtime fails

If the SDK AAR was updated, always:

1. republish the local Maven brownfield outputs from the Expo repo
2. rerun `./scripts/sync-sdk-aars.sh`
3. rebuild and reinstall this host app

### Why this sample still uses an internal activity

The public integration surface is `CirclesTravelPassSdk`.

`CirclesRoamingContainerActivity` is internal plumbing. Keeping it separate makes the host integration API cleaner and easier to reuse from multiple native entry points.
