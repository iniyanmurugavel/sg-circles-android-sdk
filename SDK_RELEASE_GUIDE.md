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

## 2. Generate the SDK AAR

After updating the version, you need to build the new AAR file.
(Note: The current project setup seems to use pre-built AARs. If you have the source code, you would run `./gradlew assembleRelease`).

If you are manually adding a new AAR:
1. Place the new AAR file (e.g., `circles-travel-pass-sdk-1.0.2.aar`) into the `sg-circles-android-sdk/circles-travel-pass-sdk/` directory.
2. Update the `artifact` reference in `build.gradle`:
   ```gradle
   artifact("circles-travel-pass-sdk-1.0.2.aar")
   ```

## 3. Update the Host App

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
