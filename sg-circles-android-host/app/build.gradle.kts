import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
  id("com.android.application")
  kotlin("android")
  kotlin("plugin.compose")
}

android {
  namespace = "com.circles.travelpass.host"
  compileSdk = 36
  ndkVersion = "29.0.13599879"

  defaultConfig {
    applicationId = "com.circles.travelpass.host"
    minSdk = 27
    targetSdk = 36
    versionCode = 1
    versionName = "1.0"
  }

  buildTypes {
    release {
      isMinifyEnabled = false
      proguardFiles(
        getDefaultProguardFile("proguard-android-optimize.txt"),
        "proguard-rules.pro"
      )
    }
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }

  buildFeatures {
    compose = true
  }
}

kotlin {
  compilerOptions {
    jvmTarget.set(JvmTarget.JVM_17)
  }
}

dependencies {
  // Keep only the Circles SDK as a local AAR. Everything else resolves as
  // normal Gradle dependencies from Maven repositories.
  // implementation(mapOf("name" to "circles-travel-pass-sdk-1.0.0", "ext" to "aar"))
  implementation("com.github.iniyanmurugavel:sg-circles-android-sdk:1.0.2")

  implementation("androidx.activity:activity:1.13.0")
  implementation("androidx.activity:activity-compose:1.13.0")
  implementation("com.google.android.material:material:1.13.0")

  // The local SDK AAR does not bring its Maven metadata with it, so we declare
  // its first-level dependencies explicitly and let Gradle resolve the
  // transitive graph from Maven repositories.
  implementation("host.exp.exponent:expo.core:55.0.9")
  implementation("com.facebook.react:react-android:0.83.4")
  implementation("com.facebook.hermes:hermes-android:0.14.1")

  implementation(platform("androidx.compose:compose-bom:2026.02.01"))
  implementation("androidx.compose.ui:ui")
  implementation("androidx.compose.material3:material3")
  implementation("androidx.compose.material:material-icons-core")
  implementation("androidx.compose.ui:ui-tooling-preview")
  debugImplementation("androidx.compose.ui:ui-tooling")

  // implementation("com.circles.telco:circles-travel-pass-sdk:1.0.0")
}
