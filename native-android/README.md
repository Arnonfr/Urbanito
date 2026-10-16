# Urbanito — native Android (Kotlin + Jetpack Compose)

Native walking-tour app. Design follows the "paper & violet" reference: cream map, deep-violet
route and markers, orange start/location, Suez One headings, Rubik body text, Hebrew RTL.

- **Map:** Mapbox Maps SDK 11 (Compose extension), Standard style recoloured at runtime (`ui/TourMap.kt`).
- **Tours:** `data/OpenDataEngine.kt` — Wikipedia geosearch + Wikidata + Wikipedia extracts, local
  ordering. No paid or AI calls. Kotlin port of `services/openDataRouteEngine.ts`.
- **Walking line, geocoding, search:** Mapbox REST APIs (`data/MapboxService.kt`).
- **Narration:** on-device Android TextToSpeech (Hebrew voice).

## Build

1. JDK 17+ and the Android SDK (compileSdk 36).
2. `local.properties` (not committed):
   ```
   sdk.dir=/path/to/Android/sdk
   MAPBOX_TOKEN=pk....
   ```
   CI can pass `MAPBOX_TOKEN` as an environment variable instead.
3. `./gradlew :app:assembleDebug` → `app/build/outputs/apk/debug/app-debug.apk`

Application id: `com.urbanito.walk` (installs next to the Capacitor app `com.urbanito.app`).
