package com.wimmich.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Mirrors the web app's --accent-primary (static/css/tokens.css) so the two
// clients read as the same product rather than unrelated skins.
private val WimmichAccent = Color(0xFF6366F1)
private val WimmichSuccess = Color(0xFF22C55E)
private val WimmichDanger = Color(0xFFEF4444)

private val LightColors = lightColorScheme(
    primary = WimmichAccent,
    secondary = WimmichSuccess,
    error = WimmichDanger,
)

private val DarkColors = darkColorScheme(
    primary = WimmichAccent,
    secondary = WimmichSuccess,
    error = WimmichDanger,
)

@Composable
fun WimmichTheme(darkTheme: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit) {
    val colors = if (darkTheme) DarkColors else LightColors
    MaterialTheme(colorScheme = colors, content = content)
}
