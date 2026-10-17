package com.urbanito.walk.ui

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsTopHeight
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.automirrored.outlined.ArrowForward
import androidx.compose.material.icons.automirrored.outlined.OpenInNew
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.Headphones
import androidx.compose.material.icons.outlined.Navigation
import androidx.compose.material.icons.outlined.Stop
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextDirection
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import com.urbanito.walk.data.Stop
import com.urbanito.walk.ui.theme.Urb
import com.urbanito.walk.ui.theme.UrbType

@Composable
fun StopScreen(
    stop: Stop,
    index: Int,
    total: Int,
    loading: Boolean,
    speaking: Boolean,
    onClose: () -> Unit,
    onPrev: () -> Unit,
    onNext: () -> Unit,
    onSpeak: (String, String) -> Unit,
) {
    val context = LocalContext.current
    val scroll = rememberScrollState()
    LaunchedEffect(stop.id) { scroll.scrollTo(0) }
    val details = stop.details
    val mainText = details?.mainText ?: stop.intro.ifBlank { stop.summary }
    val contentLang = details?.contentLang ?: stop.introLang ?: "he"
    // Mixed Hebrew/English content: let each paragraph pick its own direction.
    val reading = UrbType.Reading.copy(textDirection = TextDirection.Content)

    Column(Modifier.fillMaxSize().background(Urb.Cream)) {
        Box(Modifier.weight(1f)) {
        Column(Modifier.fillMaxSize().verticalScroll(scroll)) {
            Box(Modifier.fillMaxWidth().height(300.dp).background(Urb.VioletSoft)) {
                if (stop.imageUrl != null) {
                    AsyncImage(stop.imageUrl, null, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
                } else {
                    Icon(stop.category.icon(), null, tint = Urb.Violet, modifier = Modifier.size(64.dp).align(Alignment.Center))
                }
                Box(Modifier.fillMaxSize().background(Brush.verticalGradient(0.55f to Color.Transparent, 1f to Urb.Cream)))
                MapButton(Icons.Outlined.Close, "סגירה", modifier = Modifier.align(Alignment.TopEnd).statusBarsPadding().padding(14.dp), onClick = onClose)
                Text(
                    "${index + 1} / $total",
                    style = UrbType.Label.copy(color = Urb.White, textDirection = TextDirection.Ltr),
                    modifier = Modifier.align(Alignment.TopStart).statusBarsPadding().padding(20.dp)
                        .clip(RoundedCornerShape(50)).background(Urb.VioletDeep.copy(alpha = 0.75f)).padding(horizontal = 12.dp, vertical = 5.dp),
                )
            }

            Column(Modifier.padding(horizontal = 22.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    FilterChip(stop.category.label(), selected = true) {}
                    stop.walkFromPrevious?.let {
                        Spacer(Modifier.width(10.dp))
                        Text("${it.minutes} דק' הליכה · ${formatKm(it.meters)} ק\"מ", style = UrbType.Small)
                    }
                }
                Spacer(Modifier.height(12.dp))
                Text(stop.name, style = UrbType.Display)
                stop.originalName?.let { Text(it, style = UrbType.Body.copy(textDirection = TextDirection.Content)) }

                Spacer(Modifier.height(18.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    PrimaryButton(
                        if (speaking) "עצירה" else "האזנה",
                        modifier = Modifier.weight(1f),
                        leading = { Icon(if (speaking) Icons.Outlined.Stop else Icons.Outlined.Headphones, null, tint = Urb.White, modifier = Modifier.size(20.dp)) },
                    ) {
                        val story = listOfNotNull(stop.name, mainText) + (details?.sections?.map { "${it.title}.\n${it.body}" } ?: emptyList())
                        onSpeak(story.joinToString("\n"), contentLang)
                    }
                    OutlineButton("ניווט", Icons.Outlined.Navigation, modifier = Modifier.height(54.dp)) {
                        val uri = Uri.parse("https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}&travelmode=walking")
                        context.startActivity(Intent(Intent.ACTION_VIEW, uri))
                    }
                }

                FactsCard(stop)

                if (contentLang != "he") {
                    Text(
                        "המידע על המקום הזה קיים רק באנגלית",
                        style = UrbType.Small.copy(color = Urb.Orange),
                        modifier = Modifier.padding(top = 14.dp).clip(RoundedCornerShape(10.dp)).background(Urb.OrangeSoft).padding(horizontal = 12.dp, vertical = 8.dp),
                    )
                }

                Spacer(Modifier.height(16.dp))
                mainText.split("\n").filter { it.isNotBlank() }.forEach {
                    Text(it, style = reading, modifier = Modifier.padding(bottom = 12.dp))
                }
                if (loading && details == null) {
                    Row(Modifier.padding(vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                        CircularProgressIndicator(color = Urb.Violet, strokeWidth = 2.dp, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(10.dp))
                        Text("טוענים את הסיפור המלא…", style = UrbType.Label)
                    }
                }
                details?.sections?.forEach { sec ->
                    Spacer(Modifier.height(10.dp))
                    Text(sec.title, style = UrbType.Section.copy(textDirection = TextDirection.Content))
                    Spacer(Modifier.height(6.dp))
                    sec.body.split("\n").filter { it.isNotBlank() }.forEach { Text(it, style = reading, modifier = Modifier.padding(bottom = 12.dp)) }
                }

                Spacer(Modifier.height(16.dp))
                Text("מקורות", style = UrbType.Section)
                SourceLink("ויקיפדיה (${stop.wikiLang})", stop.wikiUrl)
                SourceLink("ויקינתונים", stop.wikidataUrl)
                Text("טקסט מוויקיפדיה ברישיון CC BY-SA.", style = UrbType.Small, modifier = Modifier.padding(top = 6.dp, bottom = 24.dp))
            }
        }

        // Once the hero has scrolled away, keep text from running under the status bar.
        if (scroll.value > 500) {
            Box(Modifier.fillMaxWidth().windowInsetsTopHeight(WindowInsets.statusBars).background(Urb.Cream.copy(alpha = 0.97f)))
        }
        }
        Row(
            Modifier.fillMaxWidth().background(Urb.White).navigationBarsPadding().padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            OutlineButton("הקודמת", Icons.AutoMirrored.Outlined.ArrowBack) { if (index > 0) onPrev() }
            PrimaryButton(
                if (index == total - 1) "סיום המסלול" else "התחנה הבאה",
                modifier = Modifier.weight(1f),
                leading = { Icon(Icons.AutoMirrored.Outlined.ArrowForward, null, tint = Urb.White, modifier = Modifier.size(20.dp)) },
            ) { if (index == total - 1) onClose() else onNext() }
        }
    }
}

@Composable
private fun FactsCard(stop: Stop) {
    val f = stop.facts
    val rows = buildList {
        if (f.instanceOf.isNotEmpty()) add("סוג" to f.instanceOf.joinToString(", "))
        f.inception?.let { add("נבנה / נוסד" to it) }
        if (f.architects.isNotEmpty()) add("אדריכל" to f.architects.joinToString(", "))
        if (f.styles.isNotEmpty()) add("סגנון" to f.styles.joinToString(", "))
        if (f.heritage.isNotEmpty()) add("מעמד מורשת" to f.heritage.joinToString(", "))
    }
    if (rows.isEmpty()) return
    Column(Modifier.padding(top = 18.dp).fillMaxWidth().clip(RoundedCornerShape(18.dp)).background(Urb.White).padding(horizontal = 16.dp, vertical = 6.dp)) {
        rows.forEachIndexed { i, (k, v) ->
            Row(Modifier.fillMaxWidth().padding(vertical = 10.dp)) {
                Text(k, style = UrbType.Small, modifier = Modifier.width(96.dp))
                Text(v, style = UrbType.Label.copy(color = Urb.Ink, textDirection = TextDirection.Content), modifier = Modifier.weight(1f))
            }
            if (i < rows.lastIndex) Box(Modifier.fillMaxWidth().height(1.dp).background(Urb.Line))
        }
    }
}

@Composable
private fun SourceLink(text: String, url: String) {
    val context = LocalContext.current
    Row(
        Modifier.padding(top = 8.dp).fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Urb.White)
            .clickable { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) }.padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(text, style = UrbType.Label.copy(color = Urb.Ink), modifier = Modifier.weight(1f))
        Icon(Icons.AutoMirrored.Outlined.OpenInNew, null, tint = Urb.Violet, modifier = Modifier.size(16.dp))
    }
}
