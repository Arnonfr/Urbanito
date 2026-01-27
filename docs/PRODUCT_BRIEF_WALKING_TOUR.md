# Feature Brief: Dynamic Walking Tour (Walk & Talk Mode)

## Context
*Why are we considering this?*
Currently, Urbanito requires users to select or generate a static route before they begin their experience. However, travelers often prefer to wander spontaneously. We want to provide a "zero-click" experience where the app serves as a real-time, context-aware companion that narrates the city as you walk, without a pre-defined path.

## Hypothesis
*We believe that building a **Dynamic Walk & Talk Mode***
*For **spontaneous explorers and "flâneurs"***
*Will **increase engagement time and reduce the friction of "route planning"***
*We'll know we're right when **we see users spending >20 mins in this mode without a pre-planned route.***

## Proposed Solution
**The "On-the-Fly" Explorer Interface:**
1. **Radar Discovery:** A background service that monitors the user's live location and looks for POIs within a 50m radius.
2. **Directional Intelligence:** The app predicts which POI the user is approaching based on their heading and speed.
3. **Just-In-Time Narration:** Instead of pre-generating a full route, the AI generates a brief "hook" for the upcoming POI. If the user slows down or pauses, it triggers the full narration.
4. **Interactive Pathfinding:** Minimalist UI that suggests the "Next Best Stop" in the current walking direction (e.g., "Keep walking 200m for a hidden mural").

## Effort Estimate
- **Size**: M (Builds on existing AudioContext and Geolocation hooks)
- **Confidence**: High (Logic for nearest POI and TTS is already functional)

## Next Steps
1. [ ] **Technical Spike**: Test background Geolocation reliability in "Dynamic Mode."
2. [ ] **UX Design**: Create a "Radar View" or a simplified "Walk Mode" interface.
3. [ ] **Content Strategy**: Define how to handle "narrative gaps" when no POIs are nearby (e.g., city trivia or architecture style comments).
4. [ ] **Cost Analysis**: Estimate the cost of on-the-fly Gemini requests for dynamic POI descriptions vs. cached data.
