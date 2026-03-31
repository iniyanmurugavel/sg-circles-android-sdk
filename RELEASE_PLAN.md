# Release Plan & Integration Guide

## Overview

This document covers:
1. Why two SDKs exist (Android vs iOS)
2. What `circles-sg-rn-expo` is
3. How to generate the Android AAR
4. How to generate the iOS XCFramework
5. How to integrate into an Android host app
6. How to integrate into an iOS host app
7. How to publish to a remote artifact registry (JitPack / GitHub Packages)

---

## Why Two SDK Registries?

Native Android and iOS have completely different binary formats and build systems:

| Platform | Binary Format | Consumed Via |
|---|---|---|
| Android | `.aar` (Android Archive) | Gradle / Maven |
| iOS | `.xcframework` (XCFramework) | Swift Package Manager / CocoaPods |

The React Native source in `circles-sg-rn-expo` compiles down to each format through `expo-brownfield`. Native teams then consume only the compiled artifact — they never touch React Native tooling.

---

## What is `circles-sg-rn-expo`?

This is the single source of truth for the shared Circles Roaming UI. It contains:

```
circles-sg-rn-expo/
├── src/
│   ├── brownfield/           # Bridge, contracts, provider, runtime
│   │   ├── contracts.ts      # Typed launch/completion payloads
│   │   ├── provider.tsx      # Waits for launch context, exposes helpers
│   │   ├── bridge.ts         # Native ↔ RN message layer
│   │   └── runtime.ts        # Brownfield runtime lifecycle
│   ├── screens/              # React Native UI
│   │   ├── TravelPassesScreen.tsx
│   │   ├── ActivationSummaryScreen.tsx
│   │   └── LaunchStateScreen.tsx
│   └── feature-config.json   # Feature flags / config
├── app.json                  # expo-brownfield SDK config
├── package.json              # Scripts and dependencies
└── android/                  # Generated native Android wrapper (do not edit)
```

**Communication flow:**

```
Native Host App
    │
    │  Intent extras / SwiftUI callback
    ▼
CirclesTravelPassSdk (native singleton)
    │
    │  BrownfieldMessaging: circles.roaming.launch
    ▼
circles-sg-rn-expo (React Native UI)
    │
    │  BrownfieldMessaging: circles.roaming.ready / completed
    ▼
Native Host App (delegate callback)
```

---

## Generating the Android AAR

### Prerequisites
- Node.js 20+, `npm install` run in `circles-sg-rn-expo`
- Android Studio + Android SDK installed

### Step 1 — Install dependencies
```bash
cd circles-sg-rn-expo
npm install
```

### Step 2 — Generate Debug AAR (local testing with Metro)
```bash
npm run build:android:debug
```
This runs `npx expo-brownfield build:android -d --repository MavenLocal` and publishes the debug AAR to your local Maven at:
```
~/.m2/repository/com/circles/telco/circles-travel-pass-sdk/
```

### Step 3 — Generate Release AAR (production)
```bash
npm run build:android:release
```
This runs `npx expo-brownfield build:android -r --repository MavenLocal` and publishes:
```
~/.m2/repository/com/circles/telco/circles-travel-pass-sdk/1.0.0/
    circles-travel-pass-sdk-1.0.0.aar
    circles-travel-pass-sdk-1.0.0.pom
```

### Step 4 — Rebuild with a new version
1. Bump the version in `app.json` under `plugins > expo-brownfield > android > version`.
2. Re-run `npm run build:android:release`.
3. Update the host app dependency version in `build.gradle.kts`.

---

## Generating the iOS XCFramework

### Prerequisites
- macOS with Xcode 15+
- Node.js 20+, `npm install` run in `circles-sg-rn-expo`
- Ruby + CocoaPods (if using CocoaPods)

### Step 1 — Install dependencies
```bash
cd circles-sg-rn-expo
npm install
```

### Step 2 — Generate the iOS SDK
```bash
# Without Swift Package wrapper
npx expo-brownfield build:ios -r

# With Swift Package Manager wrapper (recommended)
npx expo-brownfield build:ios -r -p CirclesTravelPassSDK
```

Or using the npm script:
```bash
npm run build:ios:real
```

Output artifacts are published to the local Swift Package or the remote registry defined in `app.json`.

### Step 3 — Rebuild after changes
1. Bump `ios > targetName` or version in `app.json` if needed.
2. Re-run `npm run build:ios:real`.

---

## Integrating into an Android Host App

### Using local MavenLocal (development)
After publishing locally via `npm run build:android:debug` or `build:android:release`:

**`settings.gradle.kts`**
```kotlin
dependencyResolutionManagement {
  repositories {
    mavenLocal()  // picks up ~/.m2/repository
    google()
    mavenCentral()
  }
}
```

**`app/build.gradle.kts`**
```kotlin
dependencies {
  implementation("com.circles.telco:circles-travel-pass-sdk:1.0.0")
}
```

### Using remote Maven (production — JitPack / GitHub Packages)
See the [Publishing Remotely](#publishing-remotely) section below.

### Host app integration steps

1. **Add dependency** to `build.gradle.kts` (above).
2. **Extend `BrownfieldActivity`** instead of `AppCompatActivity` for the container activity:
   ```kotlin
   class MyRoamingActivity : BrownfieldActivity(), DefaultHardwareBackBtnHandler {
     override fun invokeDefaultOnBackPressed() {
       onBackPressedDispatcher.onBackPressed()
     }
   }
   ```
3. **Call `BrownfieldLifecycleDispatcher.onApplicationCreate()`** in your `Application.onCreate()`:
   ```kotlin
   class MyApp : Application() {
     override fun onCreate() {
       super.onCreate()
       BrownfieldLifecycleDispatcher.onApplicationCreate(this)
     }
   }
   ```
4. **Launch the SDK** using the singleton:
   ```kotlin
   CirclesTravelPassSdk.launch(
     activity = this,
     request = TravelPassLaunchRequest(
       correlationId = "...",
       destinationName = "Tokyo",
       lineNumber = "+65 8111 2468",
       // ... all required fields
     ),
     delegate = this,
   )
   ```
5. **Implement the delegate**:
   ```kotlin
   class MainActivity : ComponentActivity(), CirclesTravelPassDelegate {
     override fun onFlowReady() { /* SDK loaded */ }
     override fun onFlowCompleted(result: TravelPassCompletion) { /* handle pass selection */ }
     override fun onFlowClosed() { /* user dismissed */ }
   }
   ```
6. **Edge-to-Edge (Android 15+):** Call `enableEdgeToEdge()` in `onCreate()` before `super.onCreate()` and apply `WindowInsetsCompat` padding on the root view.
7. **Register the container activity** in `AndroidManifest.xml`:
   ```xml
   <activity
     android:name=".CirclesRoamingContainerActivity"
     android:exported="false"
     android:theme="@style/Theme.YourApp" />
   ```

---

## Integrating into an iOS Host App

### Step 1 — Add the Swift Package
In Xcode:
1. `File → Add Package Dependencies`
2. Enter the URL of `sg-circles-ios-sdk` (or your published GitHub/Artifactory URL).
3. Add `CirclesTravelPassSDK` to your target.

### Step 2 — Initialize in `AppDelegate`
```swift
import CirclesTravelPassSDK

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    CirclesTravelPassSDK.initialize(application: application, launchOptions: launchOptions)
    return true
  }
}
```

### Step 3 — Launch the shared flow
```swift
import CirclesTravelPassSDK

// In your ViewController or SwiftUI action:
CirclesTravelPassSDK.launch(
  from: self,
  request: TravelPassLaunchRequest(
    correlationId: "ios-host-001",
    destinationName: "Tokyo",
    lineNumber: "+65 8111 2468",
    currentPlanName: "Circles 5G Plus"
    // ... fill all required fields
  ),
  onReady: {
    print("SDK ready")
  },
  onCompleted: { completion in
    print("Pass selected: \(completion.selectedPassName)")
  },
  onClosed: {
    print("User dismissed the flow")
  }
)
```

### Step 4 — Handle configuration changes
Conform to `BrownfieldConfigurationDelegate` if you need to forward trait/orientation changes:
```swift
extension AppDelegate {
  func application(
    _ application: UIApplication,
    didReceiveMemoryWarning warning: UIApplicationMemoryWarningNotification
  ) {
    CirclesTravelPassSDK.handleMemoryWarning()
  }
}
```

### Step 5 — Edge-to-Edge / Safe Area
The iOS brownfield surface respects `safeAreaInsets` automatically. Ensure your host view controller does **not** set `edgesForExtendedLayout = []`, to allow the React Native view to occupy the full safe area.

---

## Publishing Remotely

### GitHub Packages (Android)
Set environment variables in your CI:
```bash
export CIRCLES_MAVEN_URL=https://maven.pkg.github.com/iniyanmurugavel/sg-circles-android-sdk
export CIRCLES_MAVEN_USERNAME=YOUR_GITHUB_USERNAME
export CIRCLES_MAVEN_PASSWORD=YOUR_CLASSIC_PAT  # needs write:packages
```
Then publish:
```bash
cd circles-sg-rn-expo
npx expo-brownfield build:android -r --repository githubPackages
```
Host app consumes via:
```kotlin
// settings.gradle.kts
maven {
  url = uri("https://maven.pkg.github.com/iniyanmurugavel/sg-circles-android-sdk")
  credentials {
    username = System.getenv("CIRCLES_MAVEN_USERNAME")
    password = System.getenv("CIRCLES_MAVEN_PASSWORD")
  }
}
// build.gradle.kts
implementation("com.circles.telco:circles-travel-pass-sdk:1.0.0")
```

### JitPack (Android — pre-built AAR approach)

> JitPack clones your GitHub repo and runs `./gradlew build` to serve the artifact. Since our AAR is generated by `expo-brownfield` (React Native tooling), we push the pre-built AAR into the `sg-circles-android-sdk` repo and add a thin Gradle publish wrapper so JitPack picks it up correctly.

#### Step 1 — Flat repo layout for `sg-circles-android-sdk`

> No nested submodule folder is needed. The AAR and `maven-publish` config live directly at the root. JitPack just runs `./gradlew build` on the root project.

```
sg-circles-android-sdk/
├── build.gradle                        ← maven-publish config + POM (see below)
├── settings.gradle                     ← rootProject.name only
├── circles-travel-pass-sdk-1.0.0.aar  ← pre-built AAR from expo-brownfield
├── gradle/                             ← Gradle wrapper
├── gradlew
└── README.md
```

#### Step 2 — Root `build.gradle` (all-in-one)
```groovy
apply plugin: 'maven-publish'

group   = 'com.github.iniyanmurugavel'
version = '1.0.0'

buildscript {
    repositories { google(); mavenCentral() }
    dependencies { classpath 'com.android.tools.build:gradle:8.3.2' }
}

publishing {
    publications {
        aar(MavenPublication) {
            groupId    = 'com.circles.telco'
            artifactId = 'circles-travel-pass-sdk'
            version    = '1.0.0'
            artifact("circles-travel-pass-sdk-1.0.0.aar")
        }
    }
}
```

#### Step 3 — `settings.gradle`
```groovy
rootProject.name = 'sg-circles-android-sdk'
```

#### Step 4 — Push and tag
```bash
cd sg-circles-android-sdk
git remote add origin https://github.com/iniyanmurugavel/sg-circles-android-sdk.git
git branch -M main
git push -u origin main --tags
```

#### Step 5 — Trigger JitPack

Click **"Get it"** next to `v1.0.0` — JitPack will build and cache the artifact.

#### Step 7 — Consume from host app

**`settings.gradle.kts`**
```kotlin
dependencyResolutionManagement {
  repositories {
    google()
    mavenCentral()
    maven { url = uri("https://jitpack.io") }
  }
}
```

**`app/build.gradle.kts`**
```kotlin
dependencies {
  implementation("com.github.iniyanmurugavel:sg-circles-android-sdk:v1.0.0")
}
```

> **Important:** The host app still needs to declare the transitive dependencies manually (React Native, Hermes, Expo) because a raw AAR does not carry its Maven metadata. See `sg-circles-android-host/app/build.gradle.kts` for the full list.

#### Updating to a new version
1. Generate new AAR: `npm run build:android:release`
2. Copy the new AAR into `sg-circles-android-sdk/circles-travel-pass-sdk/`
3. Update the version in `build.gradle` and `settings.gradle`
4. Commit, tag `v1.1.0`, push
5. Update `implementation("com.github.iniyanmurugavel:sg-circles-android-sdk:v1.1.0")` in the host app

---

## Release Checklist

- [ ] Update version in `app.json` (`android.version` and `ios.targetName`)
- [ ] Run `npm run build:android:release` → publish Android AAR
- [ ] Run `npm run build:ios:real` → publish iOS XCFramework
- [ ] Tag the release in Git
- [ ] Update host app dependency version
- [ ] Test debug and release builds on both platforms
- [ ] Verify `circles.roaming.launch` → `circles.roaming.ready` → `circles.roaming.completed` flow end-to-end
