# Brownfield Shared SDK Standard

## Executive summary

This is a strong direction for upcoming shared feature work.

In this workspace, the reference feature is **Circles Travel Pass**, a premium telco roaming activation journey embedded into the native app shell through Expo brownfield artifacts.

For the VP discussion, the right framing is:

- We are standardizing a **brownfield shared-feature architecture**
- We are **not** standardizing React Native as the entry point of the entire app
- Native apps remain the product shell and system owners
- Shared Expo/React Native becomes the delivery surface for cross-platform feature modules
- Native apps consume versioned iOS and Android SDK artifacts and only update SDK versions

That is aligned with Expo's current isolated brownfield model in Expo SDK 55, published on **March 5, 2026**, where the Expo app is packaged as an **XCFramework** on iOS and an **AAR** on Android and then integrated like a native dependency rather than becoming the host app's main runtime.

Sources:

- https://expo.dev/blog/expo-brownfield-how-to-add-expo-to-your-existing-native-app-without-a-rewrite
- https://docs.expo.dev/versions/latest/sdk/brownfield/

## Recommended standard

Use this as the standard approach when all of the following are true:

- The feature is product-facing and cross-platform
- The feature benefits from shared UI, shared logic, or shared release cadence
- The feature can be isolated behind a clear native entry point
- Communication with the native host can be reduced to explicit contracts
- The feature does not require deep ownership of the app root, app lifecycle, or global native navigation

Do not use this as the default when:

- The feature is highly platform-specific
- The feature requires deep native framework integration across many host layers
- The feature must own the app shell, root navigation, or startup lifecycle
- The feature cannot tolerate SDK artifact build and distribution overhead

## Standard repository model

The 3-repo model is appropriate:

1. `circles-sg-rn-expo`
   Owns shared feature code, navigation, contracts, validation, release orchestration, and brownfield packaging.
2. `sg-circles-ios-sdk`
   Owns versioned XCFramework distribution and Swift Package Manager consumption.
3. `sg-circles-android-sdk`
   Owns versioned AAR or Maven distribution and Gradle consumption.

This separation is operationally sound because it keeps Node.js, React Native, and Expo tooling complexity inside the shared-feature team while native app teams consume versioned SDK outputs.

## What is strong in the current demo

- Native launch is modeled as an explicit contract instead of loose props.
- The React Native surface is isolated and routed as a feature module.
- Travel Passes to Activation Summary handoff is typed and explicit.
- Native host apps update dependency versions instead of hand-copying feature code.
- Release flow mirrors the real Expo brownfield artifact model.

## What is still missing before calling this production-ready

This architecture is credible. The implementation should still be described as **production-oriented** rather than fully production-ready until these are added:

- Contract versioning
  Every native-to-RN and RN-to-native payload needs a schema version and backward-compatibility rules.
- Runtime schema enforcement
  Current validation is manual. Move to a shared schema layer and fail safely with structured error reporting.
- Observability
  Add correlation ID propagation, analytics events, error telemetry, and release/build traceability.
- CI/CD
  Automate artifact generation, signing, publishing, semantic versioning, changelog generation, and promotion across environments.
- Artifact governance
  Publish to your real artifact systems, not repo-local placeholders. iOS should use a proper package/distribution strategy and Android should use a managed Maven target.
- Rollback strategy
  Define how native teams revert from SDK `x.y.z` to `x.y.(z-1)` safely and quickly.
- Compatibility matrix
  Track which host app versions are compatible with which SDK versions and contract versions.
- Test strategy
  Add unit tests, integration tests for contracts, navigation tests, and host-app smoke tests on both platforms.
- Security review
  Validate payload trust boundaries, PII handling, and any auth/session data crossing the native/RN boundary.
- Ownership model
  Define who owns the shared repo, who approves contract changes, and who is accountable for release breakages.

## Platform constraints you should acknowledge up front

Expo's current brownfield isolated approach has practical limits you should say explicitly in the architecture review:

- Only one embedded isolated Expo app is supported per native app today
- Multiple logical experiences need to share a single embedded runtime
- The embedded app is intentionally self-contained and should communicate through explicit interfaces
- Artifact builds can be slow and switching configurations can require regenerating artifacts

These are not blockers. They are design constraints and should be part of the standard.

Sources:

- https://expo.dev/blog/expo-brownfield-how-to-add-expo-to-your-existing-native-app-without-a-rewrite
- https://docs.expo.dev/versions/latest/sdk/brownfield/

## Recommendation for VP review

Present this as:

**“Our standard for brownfield shared features.”**

Use this exact message:

- Native app remains the system of record and shell
- Shared features are built once in Expo/React Native
- Shared features are released as versioned native SDK artifacts
- Host apps adopt by bumping SDK versions instead of reimplementing the feature twice
- This reduces duplicate feature work while preserving native app ownership boundaries

Avoid saying:

- “We are moving the app to React Native”
- “All future features will use this”
- “This is already fully production-ready”

## Recommended next step

Adopt this as a **reference architecture standard** with a short production checklist. After the next one or two real feature launches succeed through CI/CD and rollback drills, then promote it to the default brownfield delivery pattern.
