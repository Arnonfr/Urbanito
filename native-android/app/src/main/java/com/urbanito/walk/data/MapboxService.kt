package com.urbanito.walk.data

import com.urbanito.walk.BuildConfig
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

data class Place(val name: String, val detail: String, val position: LatLng)

/** Mapbox REST APIs (free tier): reverse/forward geocoding and walking directions. */
object MapboxService {
    private val token get() = BuildConfig.MAPBOX_TOKEN
    private val directionsCache = mutableMapOf<String, List<LatLng>>()

    private fun JsonObject.s(key: String) = (this[key] as? kotlinx.serialization.json.JsonPrimitive)?.contentOrNull

    suspend fun cityName(at: LatLng, lang: String = "he"): String? = runCatching {
        val data = Http.getJson(
            "https://api.mapbox.com/search/geocode/v6/reverse",
            mapOf("longitude" to at.lng.toString(), "latitude" to at.lat.toString(), "types" to "place,locality", "language" to lang, "access_token" to token)
        )
        data.jsonObject["features"]?.jsonArray?.firstOrNull()?.jsonObject?.get("properties")?.jsonObject?.s("name")
    }.getOrNull()

    suspend fun search(query: String, near: LatLng?, lang: String = "he"): List<Place> = runCatching {
        val params = mutableMapOf("q" to query, "limit" to "6", "autocomplete" to "true", "language" to lang, "access_token" to token)
        near?.let { params["proximity"] = "${it.lng},${it.lat}" }
        val data = Http.getJson("https://api.mapbox.com/search/geocode/v6/forward", params)
        data.jsonObject["features"]!!.jsonArray.mapNotNull { f ->
            val p = f.jsonObject["properties"]?.jsonObject ?: return@mapNotNull null
            val c = p["coordinates"]?.jsonObject ?: return@mapNotNull null
            Place(
                name = p.s("name") ?: return@mapNotNull null,
                detail = p.s("place_formatted") ?: "",
                position = LatLng(c["latitude"]!!.jsonPrimitive.doubleOrNull!!, c["longitude"]!!.jsonPrimitive.doubleOrNull!!),
            )
        }
    }.getOrDefault(emptyList())

    /** Real walking geometry through the stops (max 25 points). Cached per route. */
    suspend fun walkingPath(points: List<LatLng>): List<LatLng>? {
        val coords = points.take(25).joinToString(";") { "%.5f,%.5f".format(java.util.Locale.US, it.lng, it.lat) }
        directionsCache[coords]?.let { return it }
        return runCatching {
            val data = Http.getJson(
                "https://api.mapbox.com/directions/v5/mapbox/walking/$coords",
                mapOf("geometries" to "geojson", "overview" to "full", "access_token" to token)
            )
            val line = data.jsonObject["routes"]!!.jsonArray.first().jsonObject["geometry"]!!.jsonObject["coordinates"]!!.jsonArray
            line.map { pt -> pt.jsonArray.let { LatLng(it[1].jsonPrimitive.doubleOrNull!!, it[0].jsonPrimitive.doubleOrNull!!) } }
        }.getOrNull()?.also { directionsCache[coords] = it }
    }
}
