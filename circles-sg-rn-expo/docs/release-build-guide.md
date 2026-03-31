# Release and build guide

This guide explains what to do in this 3-repo setup when you are:

- running the shared Expo code locally
- creating a native debug build
- creating a native release build
- publishing brownfield SDK artifacts for iOS and Android

The current demo SDK/library version is `1.0.0`.

## 1. Understand the build types

There are three different outputs in this architecture:

1. Local Expo run
   Used for fast UI and JavaScript checks with `npx expo start`.
2. Native debug app
   Used to test the app on Android or iOS with native code included.
3. Brownfield SDK artifact
   Used to publish the shared React Native module to the native host apps as an Android AAR or iOS XCFramework.

These are different outputs and should not be mixed up.

## 2. Expo local run

Use this when you want to move quickly on the React Native UI.

From `/Users/iniyan.murugavel/Downloads/expo-brownfield-demo/common-rn-expo`:

```bash
npm install
npx expo start
```

This starts Metro and lets you open the app in Expo Go, simulator, emulator, or web browser.

What to check here:

- screen layout
- navigation
- form and state handling
- text, spacing, and colors
- JavaScript or TypeScript errors

What not to rely on here:

- real brownfield native module behavior
- final native signing
- store-ready Android or iOS binaries

## 3. Native debug build

Use a native debug build when you want to test the app with native code compiled in.

### Android debug build

```bash
npx expo run:android
```

This builds and installs a debug app on your emulator or connected Android device.

Important points:

- this is the normal day-to-day Android debug path
- Metro is used for JavaScript during development
- if you need a different Android build variant, Expo supports `--variant`
- if you need a closer-to-production local build, Expo also supports `--variant release`, but that build is not signed for store submission

### iOS debug build

```bash
npx expo run:ios
```

This builds and installs a debug app on the iOS Simulator or a connected device.

Important points:

- this is the normal day-to-day iOS debug path
- Metro is used for JavaScript during development
- for a local production-style build, Expo supports `--configuration Release`, but that alone does not make it App Store ready

## 4. Brownfield SDK release artifacts

This project uses the isolated brownfield model, so the shared Expo app is released as:

- Android AAR
- iOS XCFramework

### Android brownfield artifact

```bash
npx expo-brownfield build:android -r
```

What this does:

- builds the Android brownfield library
- publishes the AAR to a Maven repository
- produces a release artifact for the host native app to consume

Important:

- Expo brownfield can build debug, release, or both
- release artifacts embed the JavaScript bundle, so Metro is not needed at runtime
- the host app should consume the published version from Maven, not copy files by hand

### iOS brownfield artifact

```bash
npx expo-brownfield build:ios -r
```

What this does:

- builds the iOS brownfield target
- packages it as an XCFramework
- copies the Hermes XCFramework alongside it

Important:

- the host iOS app should consume the XCFramework through your chosen distribution path, such as Swift Package Manager or an internal binary distribution flow
- the release artifact must match the version expected by the host app

## 5. Native Android app: debug APK vs release build

For Android, it is important to separate installable debug builds from release publishing builds.

### Debug APK

Use debug when:

- developers are coding locally
- QA is checking a dev or internal build
- you need logs, debugger support, and fast iteration

Typical path:

```bash
npx expo run:android
```

or in a native host app:

```bash
./gradlew assembleDebug
```

### Release APK or AAB

Use release when:

- you are preparing for store submission
- you are preparing a formal QA or UAT build
- you want production-like behavior and performance

Typical native Android paths:

```bash
./gradlew assembleRelease
./gradlew bundleRelease
```

What to know:

- `APK` is installable on devices
- `AAB` is the publishing format normally uploaded to Google Play
- release builds must be signed with the release key
- for Google Play, the normal store artifact is `AAB`

## 6. Native iOS app: debug vs release

For iOS, the usual split is:

- debug build for simulator or device testing
- release build for archive, TestFlight, and App Store submission

Typical paths:

- local debug: `npx expo run:ios`
- local release-style compile: `npx expo run:ios --configuration Release`
- App Store or TestFlight submission: archive and distribute with Xcode or use EAS Build and EAS Submit

Important:

- iOS release distribution requires signing
- TestFlight is not the same as App Store production release
- if you use Xcode directly, verify Signing & Capabilities before archiving

## 7. Recommended release flow for this 3-repo setup

Use this sequence every time you release a shared feature update.

1. Make UI and logic changes in `common-rn-expo`.
2. Run the app locally with `npx expo start`.
3. Validate native debug builds with `npx expo run:android` and `npx expo run:ios`.
4. Build brownfield release artifacts with:

```bash
npx expo-brownfield build:android -r
npx expo-brownfield build:ios -r
```

5. Publish the Android artifact to Maven and the iOS artifact to your XCFramework distribution path.
6. Bump the shared SDK/library version.
7. Update the host Android app dependency version and the host iOS package version.
8. Validate the host apps again using release-style builds.
9. Only after host validation, push store-facing Android and iOS releases.

## 8. What to verify before a release

Check these every time:

- SDK/library version is bumped correctly
- Android and iOS host apps both point to the same shared SDK version
- no contract changes are shipped without versioning or compatibility checks
- release notes are written
- crash reporting and analytics are enabled for release builds
- brownfield messages still match the native host contracts
- release build works without Metro
- Android signing and iOS signing are configured correctly

## 9. Common mistakes to avoid

- treating Expo Go as the final native verification path
- testing only debug and skipping release-style validation
- forgetting to bump the SDK version after artifact changes
- manually copying artifacts into native apps instead of consuming published versions
- shipping Android APKs to Google Play when your process expects an AAB
- assuming a local release build is automatically signed and ready for the store

## 10. Short command reference

### Local Expo run

```bash
npx expo start
```

### Native debug

```bash
npx expo run:android
npx expo run:ios
```

### Native release-style local builds

```bash
npx expo run:android --variant release
npx expo run:ios --configuration Release
```

### Brownfield SDK artifacts

```bash
npx expo-brownfield build:android -r
npx expo-brownfield build:ios -r
```

### Demo release script in this repo

```bash
node scripts/release-sdks.mjs --version 1.0.0 --notes "Circles Roaming brownfield refresh"
```

## References

- https://docs.expo.dev/guides/local-app-development/
- https://docs.expo.dev/guides/local-app-production/
- https://docs.expo.dev/brownfield/isolated-approach/
- https://docs.expo.dev/versions/latest/sdk/brownfield/
- https://docs.expo.dev/build-reference/apk/
- https://docs.expo.dev/submit/introduction/
- https://developer.android.com/guide/app-bundle/
- https://developer.android.com/build/build-variants
