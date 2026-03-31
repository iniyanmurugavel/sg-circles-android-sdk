# Host app integration guide

This guide explains:

- how to generate the Android `AAR` and iOS `XCFramework` from Expo
- how to publish or share the Android dependency
- how to use the generated SDK in an empty Android project
- how to use the generated SDK in an empty iOS project

This workspace uses `expo-brownfield` as the standard approach: native keeps app-shell ownership, the shared Expo module owns the feature flow, and host apps adopt new versions through SDK artifacts.

The current demo SDK/library version is `1.0.0`.

## 1. What gets generated from Expo

In the brownfield isolated approach, the shared Expo app does not get shipped directly to the App Store or Play Store.

Instead, Expo generates native SDK artifacts:

- Android: `AAR`
- iOS: `XCFramework`

The host Android app or host iOS app then consumes those artifacts like any other native dependency.

For this project, the current generated file names are:

- Android: `circles-travel-pass-sdk-1.0.0.aar`
- iOS: `CirclesTravelPassBrownfield.xcframework`

## 2. Generate from the Expo project

From `/Users/iniyan.murugavel/Downloads/expo-brownfield-demo/common-rn-expo`:

```bash
npm install
npx expo install expo-brownfield
npx expo-brownfield build:android -r
npx expo-brownfield build:ios -r
```

For the Android host setup used in this workspace, also publish the actual local Maven artifacts that the empty host app resolves:

```bash
cd /Users/iniyan.murugavel/Downloads/expo-brownfield-demo/common-rn-expo/android
./gradlew :expo:publishBrownfieldReleasePublicationToMavenLocal \
  :circles-travel-pass-sdk:publishBrownfieldReleasePublicationToMavenLocal
```

If you want the iOS output wrapped as a Swift Package for distribution:

```bash
npx expo-brownfield build:ios -r -p CirclesTravelPassSDK
```

## 3. Where the files are

In this demo workspace, the generated outputs are under:

- Android AAR: `/Users/iniyan.murugavel/Downloads/expo-brownfield-demo/common-rn-expo/artifacts/android/1.0.0/circles-travel-pass-sdk-1.0.0.aar`
- iOS XCFramework: `/Users/iniyan.murugavel/Downloads/expo-brownfield-demo/common-rn-expo/artifacts/ios/1.0.0/CirclesTravelPassBrownfield.xcframework`
- iOS Hermes XCFramework: `/Users/iniyan.murugavel/Downloads/expo-brownfield-demo/common-rn-expo/artifacts/ios/1.0.0/hermesvm.xcframework`

## 4. What `implementation("com.circles.telco:circles-travel-pass-sdk:1.0.0")` means

This line does not work by itself unless the Android artifact has already been published to a Maven repository that your Android app can reach.

```kotlin
implementation("com.circles.telco:circles-travel-pass-sdk:1.0.0")
```

It means:

- group: `com.circles.telco`
- artifact: `circles-travel-pass-sdk`
- version: `1.0.0`

So before the host app can use that dependency:

1. the Expo brownfield Android build must produce the AAR
2. the AAR and POM must be published to Maven
3. the Android host app must have that Maven repository configured

## 5. How to deploy the Android SDK

For Android, you do not deploy the AAR to the Play Store.

You publish the AAR to an artifact repository such as:

- `mavenLocal()` for local development
- GitHub Packages
- JFrog Artifactory
- Sonatype Nexus
- internal Maven repository

After that, the host Android app consumes the SDK using the dependency version.

## 6. Use it in an empty Android project

### Option A: use Maven

This is the recommended approach.

#### Step 1: create an empty Android project

Create a normal empty app in Android Studio.

#### Step 2: add the repository

If the SDK was published to local Maven:

```kotlin
dependencyResolutionManagement {
  repositories {
    google()
    mavenCentral()
    mavenLocal()
  }
}
```

For this Expo 55 brownfield setup, the host also needs the remaining Expo package local Maven repos that are still referenced by `expo.core`:

```kotlin
dependencyResolutionManagement {
  repositories {
    google()
    mavenCentral()
    mavenLocal()

    val expoNodeModules = file("../common-rn-expo/node_modules")
    listOf(
      "expo-asset/local-maven-repo",
      "expo-file-system/local-maven-repo",
      "expo-font/local-maven-repo",
      "expo-keep-awake/local-maven-repo",
    ).forEach { relativeRepo ->
      maven(url = uri(expoNodeModules.resolve(relativeRepo)))
    }
  }
}
```

If you want to use this demo repo's Maven folder directly:

```kotlin
dependencyResolutionManagement {
  repositories {
    google()
    mavenCentral()
    maven(url = uri("../android-brownfield-sdk/maven-repo"))
  }
}
```

#### Step 3: add the dependency

In `app/build.gradle.kts`:

```kotlin
dependencies {
  implementation("com.circles.telco:circles-travel-pass-sdk:1.0.0")
}
```

#### Step 4: create a screen or activity to open the SDK

The host app should open the Expo brownfield screen from native navigation.

Typical Android setup is:

- create an Activity that hosts the brownfield screen
- register it in `AndroidManifest.xml`
- launch it with an `Intent`

#### Step 5: send the launch payload

Before showing the React Native screen, the native app should send the `circles.roaming.launch` message described in `docs/native-trigger.md`.

In this workspace the real Android host activity is:

- `/Users/iniyan.murugavel/Downloads/expo-brownfield-demo/circles-roaming-android-host/app/src/main/java/com/circles/travelpass/host/CirclesRoamingContainerActivity.kt`

That activity:

- extends `BrownfieldActivity`
- seeds `BrownfieldState`
- sends `circles.roaming.launch`
- listens for `circles.roaming.ready` and `circles.roaming.completed`
- shows the shared React Native fragment from the actual SDK dependency

### Option B: use the raw `.aar` directly

This workspace now includes that setup in:

- `/Users/iniyan.murugavel/Downloads/expo-brownfield-demo/circles-roaming-android-host`

How it works:

1. Publish the brownfield runtime locally from the Expo Android project:

```bash
cd /Users/iniyan.murugavel/Downloads/expo-brownfield-demo/common-rn-expo/android
./gradlew :expo:publishBrownfieldReleasePublicationToMavenLocal \
  :circles-travel-pass-sdk:publishBrownfieldReleasePublicationToMavenLocal
```

2. Sync the generated/runtime AAR files into the host app:

```bash
cd /Users/iniyan.murugavel/Downloads/expo-brownfield-demo/circles-roaming-android-host
./scripts/sync-sdk-aars.sh
```

3. The host app loads the Circles SDK from `app/libs` using:

```kotlin
implementation(mapOf("name" to "circles-travel-pass-sdk-1.0.0", "ext" to "aar"))
```

Important limitation:

- raw `AAR` loading does not read Maven `.pom` metadata
- because of that, the host app must declare the Expo/React transitive dependencies explicitly
- this is good for local validation or handoff to a native team
- remote Maven is still the cleaner production release path

## 6A. Remote Maven deployment for Android

The production-friendly Android path is:

1. generate the SDK AAR from Expo
2. publish the Android SDK artifact and metadata to a remote Maven repository
3. point the host app at that remote repository
4. consume the SDK with a versioned dependency line

After remote publication, the host app should use:

```kotlin
implementation("com.circles.telco:circles-travel-pass-sdk:1.0.0")
```

Typical remote Maven choices:

- GitHub Packages
- JFrog Artifactory
- Sonatype Nexus
- an internal company Maven repository

## 7. Use it in an empty iOS project

For iOS, the best approach is to use a Swift Package wrapper around the generated XCFrameworks.

This demo already simulates that wrapper in:

- `/Users/iniyan.murugavel/Downloads/expo-brownfield-demo/ios-brownfield-sdk/Package.swift`

### Option A: use Swift Package Manager

This is the recommended approach.

#### Step 1: create an empty iOS app

Create a normal empty iOS app in Xcode.

#### Step 2: add the package dependency

If your iOS SDK repo is published, add the package:

```swift
.package(url: "https://github.com/circles-life/ios-circles-travel-pass-sdk.git", exact: "1.0.0")
```

Then add the product dependency:

```swift
.product(name: "CirclesTravelPassSDK", package: "ios-circles-travel-pass-sdk")
```

The demo consumer example already shows this:

- `/Users/iniyan.murugavel/Downloads/expo-brownfield-demo/ios-brownfield-sdk/ConsumerExample/Package.swift`

#### Step 3: open the brownfield screen from native

The host iOS app should present the generated brownfield module from a native screen or flow.

#### Step 4: send the launch payload

Before showing the React Native screen, the native app should send the `circles.roaming.launch` payload described in `docs/native-trigger.md`.

### Option B: add the XCFrameworks directly

If you do not want Swift Package Manager yet:

1. Drag these into Xcode:
   - `CirclesTravelPassBrownfield.xcframework`
   - `hermesvm.xcframework`
2. Add them to the app target.
3. Set them to `Embed & Sign` if required by your integration pattern.

This works, but Swift Package Manager is cleaner for versioning and reuse.

## 8. Recommended real release flow

Use this flow in production:

1. Make changes in `common-rn-expo`
2. Validate locally with `npx expo start`
3. Validate native debug builds with:

```bash
npx expo run:android
npx expo run:ios
```

4. Build release artifacts:

```bash
npx expo-brownfield build:android -r
npx expo-brownfield build:ios -r
```

5. Publish Android runtime artifacts to Maven:

```bash
cd /Users/iniyan.murugavel/Downloads/expo-brownfield-demo/common-rn-expo/android
./gradlew :expo:publishBrownfieldReleasePublicationToMavenLocal \
  :circles-travel-pass-sdk:publishBrownfieldReleasePublicationToMavenLocal
```

6. Publish iOS through your binary or Swift Package distribution path
7. Bump the SDK version
8. Update the host Android and iOS apps to the new version
9. Validate the host apps again

## 9. Better artifact name recommendation

`circles-travel-pass-sdk` is the recommended long-term engineering name for this module.

If this is meant to become a long-term engineering artifact, a stronger production name is:

- Android: `com.circles.telco:circles-travel-pass-sdk`
- iOS package: `CirclesTravelPassSDK`

Why this is better:

- shorter
- capability-based
- easier to extend later
- less tied to one marketing phrase

If the module will always stay specific to the current travel-pass flow, the current name is acceptable.

If the module will grow into a broader roaming surface, `circles-travel-pass-sdk` is the better name.

## 10. Related docs

- `docs/native-trigger.md`
- `docs/local-run-guide.md`
- `docs/release-build-guide.md`
- `../circles-roaming-android-host/README.md`
