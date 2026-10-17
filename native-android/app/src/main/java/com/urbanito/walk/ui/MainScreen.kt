package com.urbanito.walk.ui

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.draggable
import androidx.compose.foundation.gestures.rememberDraggableState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.AutoFixOff
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.MyLocation
import androidx.compose.material.icons.outlined.Place
import androidx.compose.material.icons.outlined.Remove
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.focus.focusRequester
import androidx.compose.foundation.border
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import com.mapbox.geojson.Point
import com.mapbox.maps.CameraOptions
import com.mapbox.maps.EdgeInsets
import com.mapbox.maps.extension.compose.animation.viewport.rememberMapViewportState
import com.mapbox.maps.plugin.animation.MapAnimationOptions
import com.urbanito.walk.data.LatLng
import com.urbanito.walk.ui.theme.Urb
import com.urbanito.walk.ui.theme.UrbType

private val DEFAULT_START = Point.fromLngLat(34.7713, 32.0636) // Rothschild Blvd, Tel Aviv

@Composable
fun MainScreen(vm: MainViewModel = viewModel()) {
    val state by vm.state.collectAsState()
    val context = LocalContext.current
    val density = LocalDensity.current
    val viewport = rememberMapViewportState { setCameraOptions { center(DEFAULT_START); zoom(14.5) } }

    var locationEnabled by remember {
        mutableStateOf(ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED)
    }
    val permission = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { r ->
        locationEnabled = r.values.any { it }
    }
    LaunchedEffect(Unit) {
        if (!locationEnabled) permission.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION))
    }

    // Fly to the user the first time we learn where they are (only while planning).
    var centeredOnUser by remember { mutableStateOf(false) }
    LaunchedEffect(state.user) {
        val u = state.user ?: return@LaunchedEffect
        if (!centeredOnUser && state.tour == null) {
            centeredOnUser = true
            viewport.flyTo(CameraOptions.Builder().center(Point.fromLngLat(u.lng, u.lat)).zoom(15.0).build(), MapAnimationOptions.mapAnimationOptions { duration(900) })
        }
    }

    var sheetPx by remember { mutableIntStateOf(0) }
    var routeExpanded by remember { mutableStateOf(false) }
    var searchOpen by remember { mutableStateOf(false) }
    var query by remember { mutableStateOf("") }

    // Keep the map's "centre" in the visible area above the sheet.
    LaunchedEffect(sheetPx) {
        viewport.setCameraOptions { padding(EdgeInsets(0.0, 0.0, sheetPx.toDouble(), 0.0)) }
    }

    // Fit the whole tour (start + stops) above the sheet.
    LaunchedEffect(state.tour?.id, sheetPx) {
        val tour = state.tour ?: return@LaunchedEffect
        val pts = (listOf(tour.start) + tour.stops.map { it.position }).map { Point.fromLngLat(it.lng, it.lat) }
        val pad = with(density) { 56.dp.toPx().toDouble() }
        val camera = viewport.cameraForCoordinates(
            pts,
            CameraOptions.Builder().padding(EdgeInsets(0.0, 0.0, sheetPx.toDouble(), 0.0)).build(),
            EdgeInsets(pad * 2, pad, pad, pad),
            17.0,
            null,
        )
        viewport.easeTo(camera, MapAnimationOptions.mapAnimationOptions { duration(800) })
    }

    // Focus the selected stop.
    LaunchedEffect(state.selected) {
        val s = state.selected?.let { state.tour?.stops?.getOrNull(it) } ?: return@LaunchedEffect
        viewport.easeTo(CameraOptions.Builder().center(Point.fromLngLat(s.lng, s.lat)).zoom(16.5).build())
    }

    BackHandler(enabled = state.selected != null || state.tour != null || searchOpen) {
        when {
            state.selected != null -> vm.select(null)
            searchOpen -> { searchOpen = false; vm.clearSearch() }
            state.sheet == Sheet.Settings && state.tour != null -> vm.closeSettings()
            else -> vm.clearTour()
        }
    }

    BoxWithConstraints(Modifier.fillMaxSize().background(Urb.Cream)) {
        val screenH = maxHeight
        TourMap(
            viewport = viewport,
            tour = state.tour,
            selected = state.selected,
            onSelect = vm::select,
            onUserLocation = vm::setUser,
            locationEnabled = locationEnabled,
        )

        val visibleH = screenH - with(density) { sheetPx.toDp() }

        // Start point while planning: big orange dot at the map centre (as in the reference).
        if (state.tour == null) {
            Box(Modifier.fillMaxWidth().height(visibleH), contentAlignment = Alignment.Center) {
                Box(Modifier.size(44.dp).shadow(8.dp, CircleShape, ambientColor = Urb.Orange, spotColor = Urb.Orange).clip(CircleShape).background(Urb.Orange).border(3.dp, Urb.White, CircleShape))
            }
        }

        // Top controls.
        Row(Modifier.fillMaxWidth().statusBarsPadding().padding(horizontal = 16.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
            if (state.tour != null) {
                DistancePill(formatKm(state.tour!!.distanceMeters)) { vm.clearTour() }
                Spacer(Modifier.weight(1f))
                MapButton(Icons.Outlined.Close, "סגירת המסלול") { vm.clearTour() }
            } else {
                SearchPill(
                    open = searchOpen,
                    query = query,
                    onOpen = { searchOpen = true },
                    onQuery = { q ->
                        query = q
                        val c = viewport.cameraState?.center
                        vm.search(q, c?.let { LatLng(it.latitude(), it.longitude()) })
                    },
                    onClose = { searchOpen = false; query = ""; vm.clearSearch() },
                    modifier = Modifier.weight(1f),
                )
            }
        }
        if (searchOpen && state.searchResults.isNotEmpty()) {
            Column(
                Modifier.statusBarsPadding().padding(top = 70.dp, start = 16.dp, end = 16.dp).fillMaxWidth()
                    .shadow(10.dp, RoundedCornerShape(20.dp)).clip(RoundedCornerShape(20.dp)).background(Urb.White),
            ) {
                state.searchResults.forEach { p ->
                    Row(
                        Modifier.fillMaxWidth().clickable {
                            searchOpen = false; query = ""; vm.clearSearch()
                            viewport.flyTo(CameraOptions.Builder().center(Point.fromLngLat(p.position.lng, p.position.lat)).zoom(15.0).build())
                        }.padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Icon(Icons.Outlined.Place, null, tint = Urb.Violet, modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(10.dp))
                        Column {
                            Text(p.name, style = UrbType.Label.copy(color = Urb.Ink))
                            Text(p.detail, style = UrbType.Small, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                    }
                }
            }
        }

        // Zoom + locate (end side, vertically centred in the visible map).
        Column(
            Modifier.align(Alignment.TopEnd).offset(y = ((visibleH / 2) - 70.dp).coerceAtLeast(120.dp)).padding(end = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            if (locationEnabled) {
                MapButton(Icons.Outlined.MyLocation, "המיקום שלי") {
                    state.user?.let { u -> viewport.flyTo(CameraOptions.Builder().center(Point.fromLngLat(u.lng, u.lat)).zoom(15.5).build()) }
                }
                Spacer(Modifier.height(10.dp))
            }
            Column(Modifier.shadow(6.dp, RoundedCornerShape(50)).clip(RoundedCornerShape(50)).background(Urb.White)) {
                ZoomButton(Icons.Outlined.Add, "הגדלה") { zoomBy(viewport, 1.0) }
                Box(Modifier.width(24.dp).height(1.dp).background(Urb.Line).align(Alignment.CenterHorizontally))
                ZoomButton(Icons.Outlined.Remove, "הקטנה") { zoomBy(viewport, -1.0) }
            }
        }

        // Bottom sheets.
        val tour = state.tour
        Box(Modifier.align(Alignment.BottomCenter).fillMaxWidth().onSizeChanged { sheetPx = it.height }) {
            if (tour == null || state.sheet == Sheet.Settings) {
                Box(Modifier.shadow(24.dp, RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp))) {
                    SettingsSheet(
                        prefs = state.prefs,
                        building = state.building,
                        buildStep = state.buildStep,
                        onPrefs = vm::updatePrefs,
                        onBuild = {
                            val c = viewport.cameraState?.center
                            vm.build(c?.let { LatLng(it.latitude(), it.longitude()) } ?: LatLng(DEFAULT_START.latitude(), DEFAULT_START.longitude()))
                        },
                        onClose = if (tour != null) vm::closeSettings else null,
                    )
                }
            } else {
                val target = if (routeExpanded) screenH * 0.86f else screenH * 0.46f
                val height by animateDpAsState(target, label = "sheet")
                Box(
                    Modifier.height(height).shadow(24.dp, RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp))
                        .draggable(rememberDraggableState { d -> if (d < -8) routeExpanded = true else if (d > 8) routeExpanded = false }, Orientation.Vertical),
                ) {
                    RouteSheet(tour, routeExpanded, onToggle = { routeExpanded = !routeExpanded }, onSettings = vm::openSettings, onStop = vm::select)
                }
            }
        }

        // Messages.
        state.message?.let { msg ->
            Text(
                msg,
                style = UrbType.Label.copy(color = Urb.White),
                modifier = Modifier.statusBarsPadding().padding(top = 70.dp, start = 16.dp, end = 16.dp).fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp)).background(Urb.VioletDeep).clickable { vm.dismissMessage() }.padding(16.dp),
            )
            LaunchedEffect(msg) { kotlinx.coroutines.delay(6000); vm.dismissMessage() }
        }

        // Stop detail.
        AnimatedVisibility(
            visible = state.selected != null && tour != null,
            enter = slideInVertically { it / 3 } + fadeIn(),
            exit = slideOutVertically { it / 3 } + fadeOut(),
        ) {
            val t = tour ?: return@AnimatedVisibility
            val i = state.selected ?: return@AnimatedVisibility
            val stop = t.stops.getOrNull(i) ?: return@AnimatedVisibility
            StopScreen(
                stop = stop,
                index = i,
                total = t.stops.size,
                loading = state.loadingDetails,
                speaking = state.speakingStopId == stop.id,
                onClose = { vm.select(null) },
                onPrev = { vm.select(i - 1) },
                onNext = { vm.select(i + 1) },
                onSpeak = { text, lang -> vm.toggleSpeak(stop.id, text, lang) },
            )
        }
    }
}

private fun zoomBy(viewport: com.mapbox.maps.extension.compose.animation.viewport.MapViewportState, delta: Double) {
    val z = viewport.cameraState?.zoom ?: return
    viewport.easeTo(CameraOptions.Builder().zoom(z + delta).build(), MapAnimationOptions.mapAnimationOptions { duration(250) })
}

@Composable
private fun ZoomButton(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, onClick: () -> Unit) {
    Box(Modifier.size(44.dp).clickable(onClick = onClick), contentAlignment = Alignment.Center) {
        Icon(icon, label, tint = Urb.Ink, modifier = Modifier.size(22.dp))
    }
}

/** "2.3 ק"מ | eraser" pill from the reference. */
@Composable
private fun DistancePill(km: String, onClear: () -> Unit) {
    Row(
        Modifier.height(44.dp).shadow(6.dp, RoundedCornerShape(50)).clip(RoundedCornerShape(50)).background(Urb.White),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text("$km ק\"מ", style = UrbType.Section.copy(fontSize = UrbType.Label.fontSize), modifier = Modifier.padding(horizontal = 16.dp))
        Box(Modifier.width(1.dp).height(24.dp).background(Urb.Line))
        Box(Modifier.size(44.dp).clickable(onClick = onClear), contentAlignment = Alignment.Center) {
            Icon(Icons.Outlined.AutoFixOff, "ניקוי המסלול", tint = Urb.Ink, modifier = Modifier.size(20.dp))
        }
    }
}

@Composable
private fun SearchPill(open: Boolean, query: String, onOpen: () -> Unit, onQuery: (String) -> Unit, onClose: () -> Unit, modifier: Modifier = Modifier) {
    Row(
        modifier.height(48.dp).shadow(6.dp, RoundedCornerShape(50)).clip(RoundedCornerShape(50)).background(Urb.White)
            .clickable(enabled = !open, onClick = onOpen).padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(Icons.Outlined.Search, null, tint = Urb.Violet, modifier = Modifier.size(20.dp))
        Spacer(Modifier.width(10.dp))
        if (open) {
            val focus = remember { androidx.compose.ui.focus.FocusRequester() }
            BasicTextField(
                value = query,
                onValueChange = onQuery,
                singleLine = true,
                textStyle = UrbType.Label.copy(color = Urb.Ink),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                modifier = Modifier.weight(1f).focusRequester(focus),
                decorationBox = { inner ->
                    if (query.isEmpty()) Text("לאן הולכים?", style = UrbType.Label.copy(color = Urb.Muted))
                    inner()
                },
            )
            LaunchedEffect(Unit) { runCatching { focus.requestFocus() } }
            Icon(Icons.Outlined.Close, "סגירה", tint = Urb.Muted, modifier = Modifier.size(20.dp).clickable(onClick = onClose))
        } else {
            Text("לאן הולכים?", style = UrbType.Label.copy(color = Urb.Muted), modifier = Modifier.weight(1f))
        }
    }
}
