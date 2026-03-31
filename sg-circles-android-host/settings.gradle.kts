pluginManagement {
  repositories {
    google()
    mavenCentral()
    gradlePluginPortal()
  }
}

dependencyResolutionManagement {
  repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
  repositories {
    google()
    mavenCentral()
    mavenLocal()
    flatDir {
      dirs("$rootDir/app/libs")
    }

    val expoNodeModules = file("../circles-sg-rn-expo/node_modules")
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

rootProject.name = "SGCirclesAndroidHost"
include(":app")
