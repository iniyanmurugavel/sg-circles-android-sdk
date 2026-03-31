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

## 4. Update the Host App

To consume the new SDK in the host application:

1. Copy the new AAR file to the host app's `libs` directory:
   `sg-circles-android-host/app/libs/`
2. Open `sg-circles-android-host/app/build.gradle.kts`.
3. Update the dependency version:
   ```kotlin
   implementation(mapOf("name" to "circles-travel-pass-sdk-1.0.2", "ext" to "aar"))
   ```
4. Sync the Gradle project in Android Studio.

## 4. Commit and Push

Once verified, commit your changes in both the SDK and Host App directories:

```bash
git add .
git commit -m "chore: bump sdk version to 1.0.2 and update host app"
git push origin main
```

> [!TIP]
> For production, consider using **JitPack** to automate the publication of the SDK directly from the GitHub repository. This removes the need for manual AAR copying.
