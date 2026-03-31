# Android remote Maven publishing

This guide is the next step after local validation.

Use it when:

- the Android SDK works locally
- you want CI or other developers to consume versioned SDK artifacts
- you want the host app to use a normal dependency line instead of local `AAR` files

## Recommended target

Start with a private Maven repository.

Good options:

- GitHub Packages
- JFrog Artifactory
- Sonatype Nexus
- your company's internal Maven repository

## Expo brownfield supports remote publishing

`expo-brownfield` supports these Android publishing types:

- `localMaven`
- `localDirectory`
- `remotePublic`
- `remotePrivate`

For a company SDK, `remotePrivate` is the normal starting point.

## Example: GitHub Packages

Add the Android publishing configuration under the `expo-brownfield` plugin in `app.json`.

```json
{
  "expo": {
    "plugins": [
      [
        "expo-brownfield",
        {
          "android": {
            "group": "com.circles.telco",
            "libraryName": "circles-travel-pass-sdk",
            "package": "com.circles.travelpass.brownfield",
            "version": "1.0.0",
            "publishing": [
              {
                "type": "remotePrivate",
                "name": "githubPackages",
                "url": {
                  "variable": "CIRCLES_MAVEN_URL"
                },
                "username": {
                  "variable": "CIRCLES_MAVEN_USERNAME"
                },
                "password": {
                  "variable": "CIRCLES_MAVEN_PASSWORD"
                }
              }
            ]
          }
        }
      ]
    ]
  }
}
```

Example environment values for GitHub Packages:

```bash
export CIRCLES_MAVEN_URL=https://maven.pkg.github.com/YOUR_GITHUB_OWNER/YOUR_ANDROID_SDK_REPO
export CIRCLES_MAVEN_USERNAME=YOUR_GITHUB_USERNAME
export CIRCLES_MAVEN_PASSWORD=YOUR_GITHUB_TOKEN
```

## Publish commands

First regenerate Android native config if you changed `app.json`:

```bash
cd /Users/iniyan.murugavel/Downloads/expo-brownfield-demo/common-rn-expo
npx expo prebuild --platform android --clean
```

List available publishing targets:

```bash
npx expo-brownfield tasks:android
```

Publish to the named remote repository:

```bash
npx expo-brownfield build:android --release --repository githubPackages
```

## After publishing

The Android host app should move back to the normal Maven dependency form:

```kotlin
dependencyResolutionManagement {
  repositories {
    google()
    mavenCentral()
    maven {
      url = uri("https://maven.pkg.github.com/YOUR_GITHUB_OWNER/YOUR_ANDROID_SDK_REPO")
      credentials {
        username = providers.gradleProperty("gpr.user").orNull ?: System.getenv("GITHUB_USER")
        password = providers.gradleProperty("gpr.key").orNull ?: System.getenv("GITHUB_TOKEN")
      }
    }
  }
}
```

```kotlin
dependencies {
  implementation("com.circles.telco:circles-travel-pass-sdk:1.0.0")
}
```

## Recommended release flow

1. Update the shared Expo code.
2. Bump the Android SDK version in the Expo plugin config.
3. Publish the Android SDK to the remote Maven repository.
4. Update the host Android app dependency version.
5. Run host app regression checks before release.
