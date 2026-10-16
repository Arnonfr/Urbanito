package com.urbanito.walk.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.material.icons.outlined.ExpandLess
import androidx.compose.material.icons.outlined.ExpandMore
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.DirectionsWalk
import androidx.compose.material.icons.outlined.ArrowDownward
import androidx.compose.material.icons.outlined.History
import androidx.compose.material.icons.outlined.RadioButtonChecked
import androidx.compose.material.icons.outlined.Route
import androidx.compose.material.icons.outlined.Tune
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.layout.layout
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import com.urbanito.walk.data.Category
import com.urbanito.walk.data.Preferences
import com.urbanito.walk.data.Stop
import com.urbanito.walk.data.Tour
import com.urbanito.walk.ui.theme.Urb
import com.urbanito.walk.ui.theme.UrbType
import java.util.Locale

private val SHEET_SHAPE = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)

@Composable
private fun Handle() {
    Box(Modifier.fillMaxWidth().padding(top = 10.dp, bottom = 4.dp), contentAlignment = Alignment.Center) {
        Box(Modifier.size(width = 36.dp, height = 4.dp).clip(CircleShape).background(Urb.Violet.copy(alpha = 0.7f)))
    }
}

/** White title strip over a cream body, as in the reference sheets. */
@Composable
private fun SheetHeader(title: String, action: (@Composable () -> Unit)? = null) {
    Column(Modifier.fillMaxWidth().background(Urb.White)) {
        Handle()
        Row(
            Modifier.fillMaxWidth().padding(start = 22.dp, end = 14.dp, top = 2.dp, bottom = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(title, style = UrbType.Title.copy(fontSize = 26.sp, lineHeight = 32.sp), maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
            action?.invoke()
        }
    }
}

@Composable
private fun LabelRow(icon: androidx.compose.ui.graphics.vector.ImageVector, text: String, value: String? = null) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, null, tint = Urb.VioletDeep, modifier = Modifier.size(20.dp))
        Spacer(Modifier.width(8.dp))
        Text(text, style = UrbType.Section, modifier = Modifier.weight(1f))
        value?.let { Text(it, style = UrbType.Label.copy(color = Urb.Orange)) }
    }
}

// ------------------------------------------------------------ settings ("הגדרות")

private val FILTERS = listOf(
    Category.HISTORY, Category.ARCHITECTURE, Category.ART, Category.CULTURE, Category.NATURE, Category.VIEWPOINT, Category.HERITAGE,
)
private val BUILD_STEPS = listOf("מאתרים מקומות אמיתיים בסביבה", "בודקים מה כל מקום ומה ידוע עליו", "מסדרים את המסלול הקצר ביותר")

@Composable
fun SettingsSheet(
    prefs: Preferences,
    building: Boolean,
    buildStep: Int,
    onPrefs: ((Preferences) -> Preferences) -> Unit,
    onBuild: () -> Unit,
    onClose: (() -> Unit)?,
) {
    var more by remember { mutableStateOf(false) }
    Column(Modifier.fillMaxWidth().clip(SHEET_SHAPE).background(Urb.Cream)) {
        SheetHeader("הגדרות", action = onClose?.let { close -> { MapButton(Icons.Outlined.Route, "חזרה למסלול", size = 40.dp, onClick = close) } })
        Column(Modifier.padding(horizontal = 22.dp).padding(top = 14.dp).navigationBarsPadding()) {
            LabelRow(Icons.Outlined.Tune, "מסננים")
            Spacer(Modifier.height(10.dp))
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip("הכל", prefs.interests.isEmpty()) { onPrefs { it.copy(interests = emptySet()) } }
                FILTERS.forEach { c ->
                    FilterChip(c.label(), c in prefs.interests) {
                        onPrefs { p -> p.copy(interests = if (c in p.interests) p.interests - c else p.interests + c) }
                    }
                }
            }

            Spacer(Modifier.height(18.dp))
            LabelRow(Icons.Outlined.RadioButtonChecked, "מרחק הליכה", value = "${prefs.walkingKm.toInt()} ק\"מ")
            Text("כמה רחוק נלך בסך הכל, מנקודת ההתחלה", style = UrbType.Body)
            StepSlider(
                values = listOf(1f, 2f, 3f, 4f, 5f),
                value = prefs.walkingKm,
                labels = listOf("1 ק\"מ", "5 ק\"מ"),
                onChange = { v -> onPrefs { it.copy(walkingKm = v) } },
            )

            Row(
                Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).clickable { more = !more }.padding(vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("אפשרויות נוספות", style = UrbType.Label, modifier = Modifier.weight(1f))
                Text("${prefs.stops} תחנות", style = UrbType.Small)
                Icon(if (more) Icons.Outlined.ExpandLess else Icons.Outlined.ExpandMore, null, tint = Urb.Violet, modifier = Modifier.padding(start = 6.dp).size(22.dp))
            }
            AnimatedVisibility(more) {
                Column {
                    LabelRow(Icons.AutoMirrored.Outlined.DirectionsWalk, "מספר תחנות", value = "${prefs.stops}")
                    StepSlider(
                        values = listOf(3f, 4f, 5f, 6f, 7f, 8f),
                        value = prefs.stops.toFloat(),
                        labels = listOf("3", "8"),
                        onChange = { v -> onPrefs { it.copy(stops = v.toInt()) } },
                    )
                    ToggleRow("כולל אתרים דתיים", prefs.includeReligious) { onPrefs { it.copy(includeReligious = !it.includeReligious) } }
                    ToggleRow("דגש על מורשת יהודית", prefs.jewishHeritage) { onPrefs { it.copy(jewishHeritage = !it.jewishHeritage) } }
                }
            }

            Spacer(Modifier.height(10.dp))
            PrimaryButton(
                if (building) "מתכננים את המסלול…" else "בניית מסלול",
                modifier = Modifier.fillMaxWidth(),
                enabled = !building,
                leading = if (building) ({ CircularProgressIndicator(color = Urb.White, strokeWidth = 2.dp, modifier = Modifier.size(18.dp)) }) else null,
                onClick = onBuild,
            )
            Text(
                if (building) BUILD_STEPS[buildStep.coerceIn(0, 2)] else "מבוסס על ויקיפדיה וויקינתונים — בלי עלות",
                style = UrbType.Small,
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp, bottom = 12.dp),
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            )
        }
    }
}

@Composable
private fun ToggleRow(text: String, on: Boolean, onClick: () -> Unit) {
    Row(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).clickable(onClick = onClick).padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(text, style = UrbType.Body.copy(color = Urb.Ink), modifier = Modifier.weight(1f))
        Box(
            Modifier.size(width = 44.dp, height = 26.dp).clip(CircleShape).background(if (on) Urb.Violet else Urb.Line).padding(3.dp),
            contentAlignment = if (on) Alignment.CenterEnd else Alignment.CenterStart,
        ) { Box(Modifier.size(20.dp).clip(CircleShape).background(Urb.White)) }
    }
}

/** Lays text out sideways (width ↔ height) so a rotated label takes its real space, like the reference's "15 m". */
private fun Modifier.vertical() = layout { measurable, constraints ->
    val p = measurable.measure(constraints.copy(minWidth = 0, maxWidth = Constraints.Infinity, minHeight = 0))
    layout(p.height, p.width) { p.place(-(p.width / 2 - p.height / 2), (p.width / 2 - p.height / 2)) }
}

// ------------------------------------------------------------ route ("פרטי המסלול")

fun formatKm(m: Int) = String.format(Locale.US, "%.1f", m / 1000.0).removeSuffix(".0")

@Composable
fun RouteSheet(tour: Tour, expanded: Boolean, onToggle: () -> Unit, onSettings: () -> Unit, onStop: (Int) -> Unit) {
    Column(Modifier.fillMaxWidth().fillMaxHeight().clip(SHEET_SHAPE).background(Urb.Cream)) {
        Box(Modifier.clickable(onClick = onToggle)) {
            SheetHeader(tour.city) { MapButton(Icons.Outlined.Tune, "הגדרות", size = 40.dp, onClick = onSettings) }
        }
        Column(Modifier.verticalScroll(rememberScrollState()).padding(horizontal = 22.dp).padding(top = 18.dp).navigationBarsPadding()) {
            LabelRow(Icons.Outlined.ArrowDownward, "פרטי המסלול")
            Spacer(Modifier.height(6.dp))
            Text(
                "סללנו מסלול של ${formatKm(tour.distanceMeters)} ק\"מ וסימנו בו ${tour.stops.size} מקומות מעניינים. כ-${(tour.durationMinutes / 5.0).toInt() * 5} דקות כולל עצירות.",
                style = UrbType.Body,
            )
            Spacer(Modifier.height(18.dp))
            tour.stops.forEachIndexed { i, s -> StopRow(s, i, isLast = i == tour.stops.lastIndex) { onStop(i) } }

            if (tour.detours.isNotEmpty()) {
                Spacer(Modifier.height(10.dp))
                LabelRow(Icons.Outlined.History, "שווה עיקוף קטן")
                Spacer(Modifier.height(6.dp))
                tour.detours.forEach { d ->
                    Text("• ${d.name}", style = UrbType.Body.copy(color = Urb.Ink), modifier = Modifier.padding(vertical = 3.dp))
                }
            }
            Text(
                "טקסט מוויקיפדיה ברישיון CC BY-SA · נתונים מוויקינתונים · מפה © Mapbox © OpenStreetMap",
                style = UrbType.Small.copy(color = Urb.Muted.copy(alpha = 0.8f)),
                modifier = Modifier.padding(top = 18.dp, bottom = 24.dp),
            )
        }
    }
}

@Composable
private fun StopRow(stop: Stop, index: Int, isLast: Boolean, onClick: () -> Unit) {
    Row(Modifier.fillMaxWidth().clickable(onClick = onClick)) {
        // Timeline: thin violet line, orange dot at the stop, walking time from the previous one.
        Box(Modifier.width(26.dp).height(104.dp)) {
            Box(Modifier.align(Alignment.TopCenter).width(1.5.dp).fillMaxHeight().background(if (index == 0) Color.Transparent else Urb.Violet.copy(alpha = 0.35f)))
            Box(Modifier.align(Alignment.Center)) { Dot(if (index == 0) Urb.Orange else Urb.Violet, 9.dp, border = 2.dp) }
            stop.walkFromPrevious?.let { w ->
                Text(
                    "${w.minutes} דק'",
                    style = UrbType.Small.copy(color = Urb.Violet),
                    maxLines = 1,
                    modifier = Modifier.align(Alignment.TopCenter).padding(top = 6.dp).vertical().rotate(-90f),
                )
            }
        }
        Spacer(Modifier.width(10.dp))
        Row(Modifier.weight(1f).padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(width = 72.dp, height = 82.dp).clip(RoundedCornerShape(16.dp)).background(Urb.VioletSoft), contentAlignment = Alignment.Center) {
                if (stop.imageUrl != null) {
                    AsyncImage(stop.imageUrl, null, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxWidth().fillMaxHeight())
                } else {
                    Icon(stop.category.icon(), null, tint = Urb.Violet, modifier = Modifier.size(28.dp))
                }
            }
            Spacer(Modifier.width(14.dp))
            Column(Modifier.weight(1f)) {
                Text(stop.name, style = UrbType.ItemTitle, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Spacer(Modifier.height(6.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(16.dp).clip(CircleShape).background(Urb.Violet), contentAlignment = Alignment.Center) {
                        Icon(stop.category.icon(), null, tint = Urb.White, modifier = Modifier.size(10.dp))
                    }
                    Spacer(Modifier.width(6.dp))
                    Text(stop.facts.instanceOf.firstOrNull() ?: stop.category.label(), style = UrbType.Small, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                factLine(stop)?.let {
                    Spacer(Modifier.height(4.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.History, null, tint = Urb.Muted, modifier = Modifier.size(15.dp))
                        Spacer(Modifier.width(6.dp))
                        Text(it, style = UrbType.Small, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                }
            }
        }
    }
    if (!isLast) Box(Modifier.padding(start = 12.dp).width(1.5.dp).height(6.dp).background(Urb.Violet.copy(alpha = 0.35f)))
}

private fun factLine(stop: Stop): String? = with(stop.facts) {
    when {
        inception != null && architects.isNotEmpty() -> "נבנה ב-$inception · ${architects.first()}"
        inception != null -> "נבנה ב-$inception"
        architects.isNotEmpty() -> "אדריכל: ${architects.first()}"
        styles.isNotEmpty() -> styles.first()
        else -> null
    }
}
