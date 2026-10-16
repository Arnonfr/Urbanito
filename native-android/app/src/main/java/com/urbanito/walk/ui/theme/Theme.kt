package com.urbanito.walk.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontVariation
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.sp
import com.urbanito.walk.R

/** Palette taken from the reference: cream paper, deep violet ink, one warm orange accent. */
object Urb {
    val Violet = Color(0xFF4A2C8F)
    val VioletDeep = Color(0xFF34206A)
    val VioletSoft = Color(0xFFEDE6F7)
    val Orange = Color(0xFFE8693A)
    val OrangeSoft = Color(0xFFFCE6DC)
    val Cream = Color(0xFFF5F0E8)
    val Paper = Color(0xFFFBF8F3)
    val White = Color(0xFFFFFFFF)
    val Ink = Color(0xFF2B2143)
    val Muted = Color(0xFF6E6487)
    val Line = Color(0xFFE4DCCF)
    val Shadow = Color(0x332B2143)
}

@OptIn(androidx.compose.ui.text.ExperimentalTextApi::class)
private fun rubik(weight: Int) = Font(
    R.font.rubik,
    weight = FontWeight(weight),
    variationSettings = FontVariation.Settings(FontVariation.weight(weight)),
)

val Rubik = FontFamily(rubik(400), rubik(500), rubik(600), rubik(700))
val Suez = FontFamily(Font(R.font.suez_one))

object UrbType {
    val Display = TextStyle(fontFamily = Suez, fontSize = 30.sp, lineHeight = 36.sp, color = Urb.VioletDeep)
    val Title = TextStyle(fontFamily = Suez, fontSize = 22.sp, lineHeight = 28.sp, color = Urb.VioletDeep)
    val Section = TextStyle(fontFamily = Suez, fontSize = 18.sp, lineHeight = 24.sp, color = Urb.VioletDeep)
    val ItemTitle = TextStyle(fontFamily = Rubik, fontWeight = FontWeight.Medium, fontSize = 16.sp, lineHeight = 21.sp, color = Urb.Violet)
    val Body = TextStyle(fontFamily = Rubik, fontWeight = FontWeight.Normal, fontSize = 15.sp, lineHeight = 22.sp, color = Urb.Muted)
    val Reading = TextStyle(fontFamily = Rubik, fontWeight = FontWeight.Normal, fontSize = 17.sp, lineHeight = 27.sp, color = Urb.Ink)
    val Small = TextStyle(fontFamily = Rubik, fontWeight = FontWeight.Normal, fontSize = 13.sp, lineHeight = 17.sp, color = Urb.Muted)
    val Label = TextStyle(fontFamily = Rubik, fontWeight = FontWeight.Medium, fontSize = 14.sp, lineHeight = 18.sp, color = Urb.Violet)
    val Button = TextStyle(fontFamily = Suez, fontSize = 17.sp, lineHeight = 22.sp, color = Urb.White)
}

@Composable
fun UrbanitoTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = lightColorScheme(
            primary = Urb.Violet,
            onPrimary = Urb.White,
            secondary = Urb.Orange,
            background = Urb.Cream,
            surface = Urb.White,
            onSurface = Urb.Ink,
        ),
    ) {
        // Hebrew-first app: right-to-left regardless of the device language.
        CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl, content = content)
    }
}
