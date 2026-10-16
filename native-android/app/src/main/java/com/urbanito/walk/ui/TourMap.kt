package com.urbanito.walk.ui

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.mapbox.bindgen.Value
import com.mapbox.geojson.Point
import com.mapbox.maps.MapboxMap
import com.mapbox.maps.extension.compose.MapEffect
import com.mapbox.maps.extension.compose.MapboxMap
import com.mapbox.maps.extension.compose.animation.viewport.MapViewportState
import com.mapbox.maps.extension.compose.annotation.ViewAnnotation
import com.mapbox.maps.extension.compose.annotation.generated.PolylineAnnotation
import com.mapbox.maps.extension.compose.style.standard.MapboxStandardStyle
import com.mapbox.maps.extension.style.layers.properties.generated.LineJoin
import com.mapbox.maps.ImageHolder
import com.mapbox.maps.plugin.LocationPuck2D
import com.urbanito.walk.R
import com.mapbox.maps.plugin.locationcomponent.location
import com.mapbox.maps.viewannotation.geometry
import com.mapbox.maps.viewannotation.viewAnnotationOptions
import com.urbanito.walk.data.LatLng
import com.urbanito.walk.data.Tour
import com.urbanito.walk.ui.theme.Urb

/**
 * "Paper" basemap like the reference: cream land, thin warm-grey streets, muted water,
 * no 3D buildings — the tour line and markers are the only saturated colour.
 */
private val PAPER = mapOf(
    "lightPreset" to "day",
    "colorLand" to "#F3EEE5",
    "colorBuildings" to "#ECE6DB",
    "colorCommercial" to "#F1ECE3",
    "colorEducation" to "#F1ECE3",
    "colorMedical" to "#F1ECE3",
    "colorIndustrial" to "#EFEAE0",
    "colorGreenspace" to "#E7E8D8",
    "colorWater" to "#D9E2E3",
    "colorRoads" to "#DDD5C8",
    "colorTrunks" to "#D5CCBC",
    "colorMotorways" to "#CFC5B4",
    "colorRoadLabels" to "#9A9183",
    "colorPlaceLabels" to "#6E6487",
    "colorAdminBoundaries" to "#C9BFAE",
)
private val PAPER_FLAGS = mapOf(
    "show3dObjects" to false,
    "showPointOfInterestLabels" to false,
    "showTransitLabels" to false,
)

private fun MapboxMap.applyPaper() {
    PAPER.forEach { (k, v) -> setStyleImportConfigProperty("basemap", k, Value.valueOf(v)) }
    PAPER_FLAGS.forEach { (k, v) -> setStyleImportConfigProperty("basemap", k, Value.valueOf(v)) }
}

private fun LatLng.point(): Point = Point.fromLngLat(lng, lat)

@Composable
fun TourMap(
    viewport: MapViewportState,
    tour: Tour?,
    selected: Int?,
    onSelect: (Int) -> Unit,
    onUserLocation: (LatLng) -> Unit,
    locationEnabled: Boolean,
) {
    MapboxMap(
        Modifier.fillMaxSize(),
        mapViewportState = viewport,
        compass = {},
        scaleBar = {},
        style = { MapboxStandardStyle() },
    ) {
        MapEffect(Unit) { mapView ->
            val map = mapView.mapboxMap
            map.subscribeStyleLoaded { map.applyPaper() }
            if (map.isStyleLoaded()) map.applyPaper()
        }
        MapEffect(locationEnabled) { mapView ->
            if (!locationEnabled) return@MapEffect
            mapView.location.updateSettings {
                enabled = true
                pulsingEnabled = true
                pulsingColor = android.graphics.Color.parseColor("#E8693A")
                locationPuck = LocationPuck2D(topImage = ImageHolder.from(R.drawable.puck_user))
            }
            mapView.location.addOnIndicatorPositionChangedListener { p -> onUserLocation(LatLng(p.latitude(), p.longitude())) }
        }

        if (tour != null) {
            if (tour.path.size >= 2) {
                PolylineAnnotation(points = tour.path.map { it.point() }) {
                    lineColor = Urb.Violet
                    lineWidth = 3.5
                    lineJoin = LineJoin.ROUND
                    lineOpacity = 0.95
                }
            }
            // Nearby extras as small violet dots (as in the reference).
            tour.detours.forEach { d ->
                ViewAnnotation(options = viewAnnotationOptions { geometry(d.position.point()); allowOverlap(true) }) {
                    Dot(Urb.Violet, 9.dp)
                }
            }
            ViewAnnotation(options = viewAnnotationOptions { geometry(tour.start.point()); allowOverlap(true) }) {
                Dot(Urb.Orange, 14.dp, border = 2.dp)
            }
            tour.stops.forEachIndexed { i, s ->
                ViewAnnotation(options = viewAnnotationOptions { geometry(s.position.point()); allowOverlap(true) }) {
                    StopMarker(s.category, i + 1, selected == i) { onSelect(i) }
                }
            }
        }
    }
}
