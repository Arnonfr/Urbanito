# Urbanito Knowledge Base

**Last Updated:** 2026-01-29
**Version:** 2.1 (Alpha System Active)

---

## 1. Project Overview
**Urbanito** is an AI-powered "Operating System" for urban exploration. Unlike standard map apps that focus on "getting from A to B", Urbanito focuses on the **narrative between points**. It uses Generative AI to curate personalized walking tours that emphasize storytelling, hidden gems, and local secrets.

### Core Philosophy
*   **Anti-Generic:** We avoid "Top 10" lists. We prefer the hidden courtyard over the main square.
*   **Story-First:** Every POI (Point of Interest) isn't just a location; it's a chapter in a story.
*   **Agentic Orchestration:** The app feels like a living system ("Alpha") that delegates tasks to specialized agents (Atlas, Scribe, Builder).

---

## 2. Technology Stack

### Frontend
*   **Framework:** React 18 + Vite
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS (Custom Design System, utilizing "Slate" and "Indigo" palettes)
*   **State Management:** React Context + Local Hooks
*   **Routing:** React Router v6
*   **Maps:** Google Maps JavaScript API (Visuals + Places + Geocoding)

### Backend & Data
*   **Database:** Supabase (PostgreSQL)
*   **Auth:** Supabase Auth (Supporting Anonymous & Email/Magic Link)
*   **Storage:** Supabase Storage (User media, future use)

### Artificial Intelligence
*   **Core Model:** Google Gemini 1.5 Flash (chosen for speed/cost balance)
*   **Access Pattern:** Direct Client-to-API (Protected by restrictive API keys/proxies in production)
*   **Data Format:** Strict JSON Schema enforcement for all AI outputs

### Mobile (Future/Beta)
*   **Wrapper:** Capacitor (iOS/Android)

---

## 3. Architecture & The "Company OS"
The application is structured around a "Company OS" metaphor, where the AI isn't just a chatbot, but a team of agents.

### The Command Center (`/admin/command-center`)
A simulation interface where the user (Admin) interacts with the system.
*   **Alpha:** The Orchestrator. The main interface that parses user intent.
*   **Atlas:** The Geospatial Agent. Handles mapping, coordinates, and finding "places".
*   **Scribe:** The Creative Agent. Writes the descriptions, stories, and scripts.
*   **Builder:** The Engineering Agent. Fixes UI glitches and mock-updates code (in simulation).

**"Mini-Me" Architecture:**
To avoid dependency on external APIs for every interaction, the Command Center features a client-side *Orchestrator Simulation* that uses Regex and local logic to mimic the AI's delegation process instantly and without cost.

---

## 4. Key Features & Workflows

### A. AI Route Generation
1.  **User Input:** City, Interests, Vibe (e.g., "Spooky London").
2.  **Prompt Engineering:** A complex system prompt is sent to Gemini, enforcing a specific JSON structure (`Route` object).
3.  **Validation:** The response is parsed. If `lat/lng` are fuzzy, the client attempts to "snap" them to real coordinates using the Google Places API.
4.  **Distance Calculation:** A Matrix API call ensures the walking route is logical.

### B. The Unified POI Card
The core UI unit for consumption.
*   **Dynamic Content:** Expands from a simple summary to a deep historical analysis.
*   **Audio Engine:** Text-to-Speech integration reading the `narrative` field.
*   **Visuals:** Fetches images via Google Places Photos or fallback queries.
*   **Gamification:** "Collection" mechanic (Checkmarks when visited).

### C. The Library (`/library`)
A repository of routes.
*   **Global/Public:** Curated routes available to all users.
*   **Private/Saved:** Routes customized and saved by the logged-in user.
*   **Versioning (Wiki-Style):**
    *   If a user edits a public route *content* (POIs), it "forks" into a new public variation.
    *   If a user just changes *preferences* (Language/Accessibility), it saves as a private instance.

### D. Walk Mode (Radar)
An immersive, distraction-free mode for the actual walk.
*   **No Map:** Intentionally hides the full map to encourage looking at the world.
*   **Compass:** Uses device magnetometer (mobile) or simulated bearing to point to the next POI.
*   **Audio:** Auto-plays segments as you approach targets.

---

## 5. Data Models (Key Types)

### `Route`
The parent container.
```typescript
interface Route {
  id: string;
  name: string;
  pois: POI[];
  city: string;
  description: string;
  isOffline: boolean; // For downloaded routes
  originalPoiCount?: number; // Used for forking logic
}
```

### `POI` (Point of Interest)
The atomic unit of content.
```typescript
interface POI {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: 'history' | 'food' | 'architecture' | ...;
  narrative: string; // The "story" read by the audio engine
  description: string; // The text display
  googlePlaceId?: string; // Link to real-world data
  suggested_detours?: POI[]; // Nested "Hidden Gems"
}
```

### `UserPreferences`
Controls the personalization engine.
```typescript
interface UserPreferences {
  language: 'he' | 'en';
  hiddenGemsLevel: number; // 1-10 slider
  routeStyle: 'classic' | 'street'; // "Classic" = Tourist spots, "Street" = Specific vibes
  audioMode: 'free' | 'premium';
}
```

---

## 6. Developer Guidelines

### Styling
*   **Light Mode First:** The app has transitioned to a clean, white/slate aesthetic.
*   **Fonts:** System fonts or standardized sans-serif. High readability is key.
*   **Colors:**
    *   Primary: Indigo (`#6366F1`)
    *   Text: Slate-900 (Headings), Slate-600 (Body)
    *   Success: Emerald-500
    *   Warning: Amber-500

### Code Practices
*   **Absolute Imports:** Always use absolute paths (e.g. `/Users/hyh/Urbanito...`) when using agent tools.
*   **Localization:** Support Hebrew (`he`/RTL) and English (`en`/LTR) on every component.
*   **Error Handling:** Fail gracefully. If AI fails, show a "Simulation" or "Cached" version.

---

## 7. Known Issues / Roadmap
*   **Browser Support:** Mobile Safari "Address Bar" shifting requires specific `dvh` (Dynamic Viewport Height) CSS tricks.
*   **Rate Limits:** Google Maps API can get expensive; aggressive caching is implemented in `localStorage`.
*   **Audio:** Currently synthesized; roadmap includes real voice actors or higher-quality generative voice.
