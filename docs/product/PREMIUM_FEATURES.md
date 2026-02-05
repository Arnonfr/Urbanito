# Urbanito Premium Features (Roadmap)

A curated list of potential "Pro" features to differentiate the paid tier from the free experience, focusing on deeper immersion, AI capabilities, and convenience.

## 🎨 User Confirmed Features

### 1. Premium AI Voices (Celebrity / Character)
*   **Concept**: Instead of the standard TTS voice, users can choose specific personas (e.g., "The Grumpy Historian", "The Local Hipster", "The French Aristocrat") or high-fidelity AI voices that sound indistinguishable from human recording.
*   **Value**: Higher immersion, emotional connection to the story.

### 2. Extended Visual Gallery ("Deep Dive")
*   **Concept**: Access to a richer media library for each POI.
    *   2+ additional high-res photos per stop.
    *   Historical photos (archive footage).
    *   Interior shots (where entry isn't possible).
    *   Architectural blueprints or sketches.
*   **Value**: Satisfies curiosity, provides access to the "unseen".

### 3. AI Historical Reconstruction ("Time Window")
*   **Concept**: A bespoke GenAI-created image showing the location exactly as it looked in a specific era (e.g., "Paris in 1889").
*   **Implementation**: Users tap a "Restore" button to fade between the current view (or street view) and the AI reconstruction.
*   **Value**: "Magic" moment, educational, highly shareable.

---

## 🚀 Proposed New Ideas

### 4. Offline Mode ("Traveler's Pack")
*   **Concept**: Download entire routes (Audio + Maps + Images) for use without data roaming.
*   **Value**: Essential for tourists with limited data plans; creates a feeling of security.

### 5. The AI Concierge ("Ask the Guide")
*   **Concept**: A context-aware chat interface. While at a POI, the user can ask specific questions: *"Who lived on the top floor?"*, *"What style are these windows?"*, *"Why is there a weird symbol on the door?"*.
*   **Tech**: Uses the RAG context of the current route + General Knowledge LLM.
*   **Value**: Turns a monologue lecture into an interactive dialogue. Feel like you have a *real* private guide.

### 6. Smart Detours ("Vibe check")
*   **Concept**: Dynamic route adjustment based on immediate needs or preferences.
*   **Features**:
    *   "I need Coffee" (Finds best Specialty Coffee nearby).
    *   "I need a Break" (Finds a quiet park/bench).
    *   "Sunset Mode" (Optimizes the remaining route to hit a viewpoint at Golden Hour).
*   **Value**: Personalization and comfort.

### 7. "Tour Party" (Group Sync)
*   **Concept**: Sync audio playback for couples or groups walking together. One person presses "Play", and it plays on everyone's headphones simultaneously.
*   **Value**: Solves the "Wait, are you listening to track 3 yet?" social friction.

## 🛠️ Technical Considerations
*   **Storage**: Offline mode and Extended Gallery will require managing device storage cache effectively.
*   **LLM Costs**: "Ask the Guide" and "Historical Reconstruction" have per-usage costs; suitable for subscription tier limit (e.g., "5 reconstructions per month").
