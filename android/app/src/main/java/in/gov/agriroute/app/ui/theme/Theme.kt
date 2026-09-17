package `in`.gov.agriroute.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColorScheme = lightColorScheme(
    primary = EarthGreen,
    onPrimary = Color.White,
    primaryContainer = MintLight,
    onPrimaryContainer = EarthGreenDark,
    secondary = EarthAccent,
    onSecondary = Color.White,
    background = PaperBackground,
    surface = PaperCard,
    onBackground = InkText,
    onSurface = InkText,
    outline = BorderColor
)

@Composable
fun AgriRouteTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        content = content
    )
}
