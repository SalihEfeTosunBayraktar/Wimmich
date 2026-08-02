package com.wimmich.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Mirrors the web app's tokens.css exactly (both --accent-primary and the
// light/dark --bg-primary/--bg-secondary pair) so the two clients read as
// the same product rather than unrelated skins - this was previously left
// at Material3's own default background/surface, which didn't match at all.
private val WimmichAccent = Color(0xFF6366F1)
private val WimmichSuccess = Color(0xFF22C55E)
private val WimmichDanger = Color(0xFFEF4444)

private val WimmichDarkBg = Color(0xFF0A0A0F)
private val WimmichDarkSurface = Color(0xFF1A1A28)
private val WimmichLightBg = Color(0xFFF6F6FB)
private val WimmichLightSurface = Color(0xFFFFFFFF)

private val LightColors = lightColorScheme(
    primary = WimmichAccent,
    secondary = WimmichSuccess,
    error = WimmichDanger,
    background = WimmichLightBg,
    surface = WimmichLightSurface,
)

private val DarkColors = darkColorScheme(
    primary = WimmichAccent,
    secondary = WimmichSuccess,
    error = WimmichDanger,
    background = WimmichDarkBg,
    surface = WimmichDarkSurface,
)

@Composable
fun WimmichTheme(darkTheme: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit) {
    val colors = if (darkTheme) DarkColors else LightColors
    MaterialTheme(colorScheme = colors, content = content)
}
