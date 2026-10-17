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
        // Mapbox Maps SDK (public, no download token needed)
        maven { url = uri("https://api.mapbox.com/downloads/v2/releases/maven") }
    }
}

rootProject.name = "UrbanitoNative"
include(":app")
