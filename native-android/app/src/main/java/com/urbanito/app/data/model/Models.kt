package com.urbanito.app.data.model

import com.google.gson.annotations.SerializedName

data class City(
    val id: String,
    val name: String,
    @SerializedName("name_en") val nameEn: String?,
    @SerializedName("img_url") val imgUrl: String?,
    val lat: Double?,
    val lng: Double?
)

data class Route(
    val id: String,
    val name: String,
    val city: String,
    val description: String?,
    @SerializedName("duration_minutes") val durationMinutes: Int?,
    val pois: List<POI> = emptyList()
)

data class POI(
    val id: String,
    val name: String,
    val lat: Double,
    val lng: Double,
    val category: String?,
    val description: String?,
    val summary: String?,
    val narrative: String?
)
