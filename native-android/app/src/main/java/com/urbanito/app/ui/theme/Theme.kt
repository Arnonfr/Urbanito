package com.urbanito.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val Indigo600 = Color(0xFF4F46E5)
private val Indigo700 = Color(0xFF4338CA)
private val Slate900 = Color(0xFF0F172A)
private val Slate800 = Color(0xFF1E293B)

private val DarkColorScheme = darkColorScheme(
    primary = Indigo600,
    secondary = Indigo700,
    tertiary = Color.Cyan,
    background = Slate900,
    surface = Slate800,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onTertiary = Color.Black,
    onBackground = Color.White,
    onSurface = Color.White,
)

private val LightColorScheme = lightColorScheme(
    primary = Indigo600,
    secondary = Indigo700,
    tertiary = Color.Cyan,
    background = Color.White,
    surface = Color(0xFFF8FAFC),
    onPrimary = Color.White,
    onSecondary = Color.White,
    onTertiary = Color.Black,
    onBackground = Slate900,
    onSurface = Slate900,
)

@Composable
fun UrbanitoTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
