package com.urbanito.walk.data

data class LatLng(val lat: Double, val lng: Double)

enum class Category { HISTORY, ARCHITECTURE, CULTURE, ART, NATURE, VIEWPOINT, MARKET, HERITAGE, SHOPPING }

data class Facts(
    val inception: String? = null,
    val architects: List<String> = emptyList(),
    val styles: List<String> = emptyList(),
    val heritage: List<String> = emptyList(),
    val website: String? = null,
    val instanceOf: List<String> = emptyList(),
)

data class Walk(val meters: Int, val minutes: Int)

data class Section(val title: String, val body: String)

data class StopDetails(
    val mainText: String,
    val sections: List<Section>,
    val contentLang: String,
)

data class Stop(
    val id: String,
    val qid: String,
    val name: String,
    val originalName: String?,
    val lat: Double,
    val lng: Double,
    val category: Category,
    val summary: String,
    val intro: String,
    val imageUrl: String?,
    val facts: Facts,
    val wikiLang: String,
    val wikiTitle: String,
    val introLang: String?,
    val walkFromPrevious: Walk?,
    val details: StopDetails? = null,
) {
    val position get() = LatLng(lat, lng)
    val wikiUrl get() = "https://$wikiLang.wikipedia.org/wiki/${wikiTitle.replace(' ', '_')}"
    val wikidataUrl get() = "https://www.wikidata.org/wiki/$qid"
}

data class Tour(
    val id: String,
    val city: String,
    val title: String,
    val start: LatLng,
    val stops: List<Stop>,
    val detours: List<Stop>,
    val distanceMeters: Int,
    val durationMinutes: Int,
    /** Real walking geometry (Mapbox Directions); straight legs until it arrives. */
    val path: List<LatLng> = emptyList(),
)

data class Preferences(
    val interests: Set<Category> = emptySet(),
    val walkingKm: Float = 3f,
    val stops: Int = 5,
    val includeReligious: Boolean = true,
    val jewishHeritage: Boolean = false,
    val hiddenGems: Float = 0.3f,
)
