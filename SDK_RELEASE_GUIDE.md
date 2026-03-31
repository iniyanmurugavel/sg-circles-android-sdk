# SDK Release and Update Guide

This document explains how to release a new version of the **Circles Travel Pass SDK** and update the **Android Host App** to consume it.

## 1. Increment SDK Version

To provide a new SDK version, you need to increment the version numbers in the SDK's `build.gradle` file.

1. Open `sg-circles-android-sdk/circles-travel-pass-sdk/build.gradle`.
2. Update the `version` property at the top of the file:
   ```gradle
   group   = 'com.circles.telco'
   version = '1.0.2' // Increment this
   ```
3. Update the `version` property inside the `publishing` block:
   ```gradle
   publishing {
       publications {
           aar(MavenPublication) {
               // ...
               version = '1.0.2' // Match the version above
           }
       }
   }
   ```

## 2. Generate the Signed Release AAR

For production, you must always provide a **Signed Release AAR**. This ensures the code is optimized (minified) and verified.

1. **Configure Signing**: Ensure your `release` signing configuration is correctly set in `circles-sg-rn-expo/android/app/build.gradle`.
2. **Build the AAR**: Run the release build command from the `android/` directory:
   ```bash
   ./gradlew :app:bundleReleaseAar
   ```
   *(Note: The exact task name may vary based on your `expo-brownfield-publish` configuration, but it will typically be under the `bundle` or `publish` groups.)*

3. **Verify the Output**: The signed AAR will be generated in `circles-sg-rn-expo/android/app/build/outputs/aar/`.

## 3. Distribute the SDK AAR

Once you have the signed AAR:
1. Rename it to match the version (e.g., `circles-travel-pass-sdk-1.0.2.aar`).
2. Move it into the `sg-circles-android-sdk/circles-travel-pass-sdk/` directory.
3. Update the `artifact` reference in the SDK's `build.gradle`:
   ```gradle
   artifact("circles-travel-pass-sdk-1.0.2.aar")
   ```

## 5. Internal Testing

To test the **Circles Roaming** feature during development before releasing a new SDK version:

1. **Start the Metro Bundler**:
   From the `circles-sg-rn-expo/` directory:
   ```bash
   npm install
   npm run dev
   ```
2. **Run the Native Shell**:
   In another terminal, from the `circles-sg-rn-expo/` directory:
   ```bash
   npx expo run:android
   ```
   This will build and launch a native Android shell that loads your local React Native code. This is the best way to verify the feature in isolation.

## 6. JitPack Deployment (Recommended)

Deploying to **JitPack** is the standard way to share this SDK across different repositories. 

### Why JitPack?
- **Automated Builds**: JitPack builds the AAR directly from your GitHub repository.
- **Easy Consumption**: Host apps don't need to copy-paste AAR files; they just add a Maven dependency.

### How to use JitPack:
1. Ensure your SDK repository (`sg-circles-android-sdk`) has a clean `build.gradle` that applies the `maven-publish` plugin.
2. Tag a release on GitHub (e.g., `v1.0.2`).
3. In the **Host App**, add the JitPack repository and the dependency:
   ```kotlin
   // settings.gradle.kts
   dependencyResolutionManagement {
       repositories {
           maven { url = uri("https://www.jitpack.io") }
       }
   }

   // app/build.gradle.kts
   dependencies {
       implementation("com.github.iniyanmurugavel:sg-circles-android-sdk:1.0.2")
   }
   ```
