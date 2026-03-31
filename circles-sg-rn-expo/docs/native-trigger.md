# Native trigger contract

The production-grade flow in this repo expects native to open the Circles Roaming brownfield module and send a `circles.roaming.launch` message with a stable payload contract.

Use this contract only in a real native build or host app. Expo Go local runs do not provide the native `expo-brownfield` module.

## iOS

```swift
import ExpoBrownfield

BrownfieldMessaging.sendMessage([
    "type": "circles.roaming.launch",
    "data": [
        "correlationId": "corr-circles-sg-jp-001",
        "currentPlanName": "Circles 5G Plus",
        "currentUsageGb": "92 GB",
        "destinationName": "Tokyo",
        "lineNumber": "+65 8111 2468",
        "recommendedPassId": "roam-like-local",
        "renewalDate": "02 Apr 2026",
        "sessionId": "sdk-circles-roam-001",
        "sourcePlatform": "ios",
        "sourceScreen": "native-usage-hub",
        "subscriberId": "subscriber-circles-001"
    ]
])
```

## Android

```kotlin
import expo.modules.brownfield.BrownfieldMessaging

BrownfieldMessaging.sendMessage(
    mapOf(
        "type" to "circles.roaming.launch",
        "data" to mapOf(
            "correlationId" to "corr-circles-sg-jp-001",
            "currentPlanName" to "Circles 5G Plus",
            "currentUsageGb" to "92 GB",
            "destinationName" to "Tokyo",
            "lineNumber" to "+65 8111 2468",
            "recommendedPassId" to "roam-like-local",
            "renewalDate" to "02 Apr 2026",
            "sessionId" to "sdk-circles-roam-001",
            "sourcePlatform" to "android",
            "sourceScreen" to "native-usage-hub",
            "subscriberId" to "subscriber-circles-001"
        )
    )
)
```

## React Native handoff

- Native sends the launch payload into Travel Passes through the brownfield message bridge.
- Travel Passes validates the telco payload and stores it in brownfield shared state.
- Travel Passes pushes Activation Summary with a typed roaming-pass payload.
- Activation Summary can send `circles.roaming.completed` back to native and dismiss the brownfield view.
- The current demo library version for this SDK flow is `1.0.0`.
