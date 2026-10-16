package com.urbanito.walk.ui

import android.app.Application
import android.content.Context
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.urbanito.walk.data.Category
import com.urbanito.walk.data.LatLng
import com.urbanito.walk.data.MapboxService
import com.urbanito.walk.data.OpenDataEngine
import com.urbanito.walk.data.Place
import com.urbanito.walk.data.Preferences
import com.urbanito.walk.data.Tour
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.util.Locale

enum class Sheet { Settings, Route }

data class UiState(
    val prefs: Preferences = Preferences(),
    val tour: Tour? = null,
    val sheet: Sheet = Sheet.Settings,
    val building: Boolean = false,
    val buildStep: Int = 0,
    val selected: Int? = null,
    val loadingDetails: Boolean = false,
    val speakingStopId: String? = null,
    val message: String? = null,
    val user: LatLng? = null,
    val searchResults: List<Place> = emptyList(),
)

class MainViewModel(app: Application) : AndroidViewModel(app) {
    private val store = app.getSharedPreferences("urbanito", Context.MODE_PRIVATE)
    private val _state = MutableStateFlow(UiState(prefs = loadPrefs()))
    val state: StateFlow<UiState> = _state

    private var tts: TextToSpeech? = null
    private var searchJob: Job? = null

    // ------------------------------------------------------------ preferences

    private fun loadPrefs() = Preferences(
        interests = store.getStringSet("interests", emptySet())!!.mapNotNull { runCatching { Category.valueOf(it) }.getOrNull() }.toSet(),
        walkingKm = store.getFloat("walkingKm", 3f),
        stops = store.getInt("stops", 5),
        includeReligious = store.getBoolean("religious", true),
        jewishHeritage = store.getBoolean("jewish", false),
    )

    fun updatePrefs(change: (Preferences) -> Preferences) {
        val p = change(_state.value.prefs)
        _state.update { it.copy(prefs = p) }
        store.edit()
            .putStringSet("interests", p.interests.map { it.name }.toSet())
            .putFloat("walkingKm", p.walkingKm)
            .putInt("stops", p.stops)
            .putBoolean("religious", p.includeReligious)
            .putBoolean("jewish", p.jewishHeritage)
            .apply()
    }

    // ------------------------------------------------------------ tour

    fun build(start: LatLng) {
        if (_state.value.building) return
        _state.update { it.copy(building = true, buildStep = 0, message = null) }
        val ticker = viewModelScope.launch {
            while (true) { delay(1800); _state.update { it.copy(buildStep = (it.buildStep + 1).coerceAtMost(2)) } }
        }
        viewModelScope.launch {
            try {
                val city = MapboxService.cityName(start) ?: "המסלול שלך"
                val tour = OpenDataEngine.buildTour(city, start, _state.value.prefs)
                if (tour == null) {
                    _state.update { it.copy(message = "לא נמצאו מספיק מקומות מתועדים כאן. נסו מרחק הליכה גדול יותר או מרכז העיר.") }
                } else {
                    _state.update { it.copy(tour = tour, sheet = Sheet.Route, selected = null) }
                    // Real walking geometry arrives a moment later; straight legs meanwhile.
                    MapboxService.walkingPath(tour.path)?.let { path ->
                        _state.update { s -> if (s.tour?.id == tour.id) s.copy(tour = s.tour.copy(path = path)) else s }
                    }
                }
            } catch (e: Exception) {
                _state.update { it.copy(message = "משהו השתבש. בדקו את החיבור ונסו שוב.") }
            } finally {
                ticker.cancel()
                _state.update { it.copy(building = false) }
            }
        }
    }

    fun clearTour() {
        stopSpeaking()
        _state.update { it.copy(tour = null, sheet = Sheet.Settings, selected = null) }
    }

    fun openSettings() = _state.update { it.copy(sheet = Sheet.Settings) }
    fun closeSettings() = _state.update { if (it.tour != null) it.copy(sheet = Sheet.Route) else it }
    fun dismissMessage() = _state.update { it.copy(message = null) }
    fun setUser(p: LatLng) = _state.update { if (it.user == p) it else it.copy(user = p) }

    fun select(index: Int?) {
        stopSpeaking()
        _state.update { it.copy(selected = index) }
        if (index != null) loadDetails(index)
    }

    private fun loadDetails(index: Int) {
        val tour = _state.value.tour ?: return
        val stop = tour.stops.getOrNull(index) ?: return
        if (stop.details != null) return
        _state.update { it.copy(loadingDetails = true) }
        viewModelScope.launch {
            val details = OpenDataEngine.details(stop)
            _state.update { s ->
                val t = s.tour ?: return@update s.copy(loadingDetails = false)
                val stops = t.stops.map { if (it.id == stop.id && details != null) it.copy(details = details) else it }
                s.copy(tour = t.copy(stops = stops), loadingDetails = false)
            }
        }
    }

    // ------------------------------------------------------------ search

    fun search(query: String, near: LatLng?) {
        searchJob?.cancel()
        if (query.trim().length < 2) { _state.update { it.copy(searchResults = emptyList()) }; return }
        searchJob = viewModelScope.launch {
            delay(250)
            val results = MapboxService.search(query.trim(), near)
            _state.update { it.copy(searchResults = results) }
        }
    }

    fun clearSearch() = _state.update { it.copy(searchResults = emptyList()) }

    // ------------------------------------------------------------ narration (on-device, free)

    fun toggleSpeak(stopId: String, text: String, lang: String) {
        if (_state.value.speakingStopId == stopId) { stopSpeaking(); return }
        val engine = tts
        val speak = { t: TextToSpeech ->
            t.language = if (lang == "en") Locale.US else Locale("he", "IL")
            // Engines cap one utterance (~4000 chars); queue paragraphs.
            text.split("\n").filter { it.isNotBlank() }.forEachIndexed { i, part ->
                t.speak(part, if (i == 0) TextToSpeech.QUEUE_FLUSH else TextToSpeech.QUEUE_ADD, null, "$stopId-$i")
            }
            _state.update { it.copy(speakingStopId = stopId) }
        }
        if (engine != null) { speak(engine); return }
        tts = TextToSpeech(getApplication()) { status ->
            val t = tts ?: return@TextToSpeech
            if (status != TextToSpeech.SUCCESS) {
                _state.update { it.copy(message = "הקראה לא זמינה במכשיר הזה.") }
                return@TextToSpeech
            }
            t.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(id: String?) {}
                override fun onDone(id: String?) { if (!t.isSpeaking) _state.update { it.copy(speakingStopId = null) } }
                @Deprecated("Deprecated in Java")
                override fun onError(id: String?) { _state.update { it.copy(speakingStopId = null) } }
            })
            speak(t)
        }
    }

    fun stopSpeaking() {
        tts?.stop()
        _state.update { it.copy(speakingStopId = null) }
    }

    override fun onCleared() {
        tts?.shutdown()
    }
}
