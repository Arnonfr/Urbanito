package com.urbanito.walk.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AccountBalance
import androidx.compose.material.icons.outlined.Apartment
import androidx.compose.material.icons.outlined.Castle
import androidx.compose.material.icons.outlined.LocalFlorist
import androidx.compose.material.icons.outlined.HistoryEdu
import androidx.compose.material.icons.outlined.Palette
import androidx.compose.material.icons.outlined.Storefront
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.urbanito.walk.data.Category
import com.urbanito.walk.ui.theme.Urb
import com.urbanito.walk.ui.theme.UrbType
import kotlin.math.roundToInt

// ------------------------------------------------------------ categories

/** No religious symbols (design rule): heritage sites use a classical building. */
fun Category.icon(): ImageVector = when (this) {
    Category.HISTORY -> Icons.Outlined.Castle
    Category.ARCHITECTURE -> Icons.Outlined.Apartment
    Category.CULTURE -> Icons.Outlined.AccountBalance
    Category.ART -> Icons.Outlined.Palette
    Category.NATURE -> Icons.Outlined.LocalFlorist
    Category.VIEWPOINT -> Icons.Outlined.Visibility
    Category.MARKET, Category.SHOPPING -> Icons.Outlined.Storefront
    Category.HERITAGE -> Icons.Outlined.HistoryEdu
}

fun Category.label(): String = when (this) {
    Category.HISTORY -> "היסטוריה"
    Category.ARCHITECTURE -> "אדריכלות"
    Category.CULTURE -> "תרבות"
    Category.ART -> "אמנות"
    Category.NATURE -> "טבע"
    Category.VIEWPOINT -> "נקודת תצפית"
    Category.MARKET -> "שוק"
    Category.SHOPPING -> "מסחר"
    Category.HERITAGE -> "מורשת"
}

// ------------------------------------------------------------ chips & buttons

private val noRipple = MutableInteractionSource()

@Composable
fun FilterChip(text: String, selected: Boolean, onClick: () -> Unit) {
    val shape = RoundedCornerShape(50)
    Box(
        Modifier
            .clip(shape)
            .then(if (selected) Modifier.background(Urb.Orange) else Modifier.border(1.5.dp, Urb.Violet, shape))
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 7.dp),
    ) {
        Text(text, style = UrbType.Label.copy(color = if (selected) Urb.White else Urb.Violet))
    }
}

@Composable
fun PrimaryButton(text: String, modifier: Modifier = Modifier, enabled: Boolean = true, leading: @Composable (() -> Unit)? = null, onClick: () -> Unit) {
    Row(
        modifier
            .height(54.dp)
            .shadow(if (enabled) 10.dp else 0.dp, RoundedCornerShape(50), ambientColor = Urb.Violet, spotColor = Urb.Violet)
            .clip(RoundedCornerShape(50))
            .background(if (enabled) Urb.Violet else Urb.Violet.copy(alpha = 0.55f))
            .clickable(enabled = enabled, onClick = onClick)
            .padding(horizontal = 24.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        leading?.invoke()
        if (leading != null) Box(Modifier.width(10.dp))
        Text(text, style = UrbType.Button)
    }
}

@Composable
fun OutlineButton(text: String, icon: ImageVector, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Row(
        modifier
            .height(46.dp)
            .clip(RoundedCornerShape(50))
            .border(1.5.dp, Urb.Violet, RoundedCornerShape(50))
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(icon, null, tint = Urb.Violet, modifier = Modifier.size(19.dp))
        Box(Modifier.width(8.dp))
        Text(text, style = UrbType.Label)
    }
}

/** White floating control used over the map (close, zoom, locate). */
@Composable
fun MapButton(icon: ImageVector, contentDescription: String, modifier: Modifier = Modifier, size: Dp = 44.dp, onClick: () -> Unit) {
    Box(
        modifier
            .size(size)
            .shadow(6.dp, CircleShape, ambientColor = Urb.Shadow, spotColor = Urb.Shadow)
            .clip(CircleShape)
            .background(Urb.White)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Icon(icon, contentDescription, tint = Urb.Ink, modifier = Modifier.size(22.dp))
    }
}

// ------------------------------------------------------------ map markers

@Composable
fun StopMarker(category: Category, number: Int, selected: Boolean, onClick: () -> Unit) {
    Box(
        Modifier
            .scale(if (selected) 1.18f else 1f)
            .size(34.dp)
            .shadow(5.dp, CircleShape, ambientColor = Urb.Violet, spotColor = Urb.Violet)
            .clip(CircleShape)
            .background(if (selected) Urb.VioletDeep else Urb.Violet)
            .border(2.dp, Urb.White, CircleShape)
            .clickable(interactionSource = noRipple, indication = null, onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Icon(category.icon(), "$number", tint = Urb.White, modifier = Modifier.size(17.dp))
    }
}

@Composable
fun Dot(color: Color, size: Dp, border: Dp = 0.dp) {
    Box(
        Modifier
            .size(size)
            .clip(CircleShape)
            .background(color)
            .then(if (border > 0.dp) Modifier.border(border, Urb.White, CircleShape) else Modifier),
    )
}

// ------------------------------------------------------------ slider (reference: thin line, end dots, white knob)

@Composable
fun StepSlider(values: List<Float>, value: Float, labels: List<String>, onChange: (Float) -> Unit, modifier: Modifier = Modifier) {
    val index = values.indexOfFirst { it == value }.takeIf { it >= 0 } ?: 0
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val density = LocalDensity.current
    Column(modifier.fillMaxWidth()) {
        BoxWithConstraints(
            Modifier
                .fillMaxWidth()
                .height(36.dp),
            contentAlignment = Alignment.CenterStart,
        ) {
            val trackWidth = maxWidth
            val widthPx = with(density) { trackWidth.toPx() }
            val knob = 26.dp
            val knobPx = with(density) { knob.toPx() }
            fun indexAt(x: Float): Int {
                val f = ((x - knobPx / 2) / (widthPx - knobPx)).coerceIn(0f, 1f)
                val logical = if (rtl) 1 - f else f
                return (logical * (values.size - 1)).roundToInt()
            }
            val gestures = Modifier
                .pointerInput(values) { detectTapGestures { onChange(values[indexAt(it.x)]) } }
                .pointerInput(values) { detectHorizontalDragGestures { change, _ -> onChange(values[indexAt(change.position.x)]) } }
            Box(Modifier.fillMaxWidth().height(36.dp).then(gestures), contentAlignment = Alignment.CenterStart) {
                Box(Modifier.fillMaxWidth().padding(horizontal = knob / 2).height(1.5.dp).background(Urb.Violet))
                values.indices.forEach { i ->
                    val x = (trackWidth - knob) * (i.toFloat() / (values.size - 1))
                    Box(Modifier.offset(x = x + knob / 2 - 3.dp)) { Dot(Urb.Violet, 6.dp) }
                }
                val kx = (trackWidth - knob) * (index.toFloat() / (values.size - 1))
                Box(
                    Modifier
                        .offset(x = kx)
                        .size(knob)
                        .shadow(3.dp, CircleShape)
                        .clip(CircleShape)
                        .background(Urb.White)
                        .border(2.dp, Urb.Violet, CircleShape),
                )
            }
        }
        Row(Modifier.fillMaxWidth()) {
            labels.forEachIndexed { i, l ->
                Text(
                    l,
                    style = UrbType.Small,
                    textAlign = when (i) { 0 -> TextAlign.Start; labels.lastIndex -> TextAlign.End; else -> TextAlign.Center },
                    modifier = Modifier.weight(1f),
                )
            }
        }
    }
}
