# Urbanito Project Handover

## 1. Project Overview
**Urbanito** is an AI-powered urban exploration platform that generates personalized walking tours and audio guides for cities worldwide. It combines real-time route generation with premium AI text-to-speech to create immersive travel experiences.

## 2. Technology Stack

### Frontend (Web)
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + Lucide React (Icons)
- **Language**: TypeScript
- **State Management**: React Context (`AudioContext`, `PremiumContext`) + Local State
- **Animation**: Framer Motion

### Backend & Database
- **Platform**: Supabase
- **Database**: PostgreSQL
- **Key Tables**:
    - `routes`: User-generated and curated itineraries.
    - `poi_details`: Rich data for points of interest.
    - `audio_cache`: Server-side cache for AI-generated audio (hashed by text/voice).
    - `users`: Auth & profile management.
- **Authentication**: Supabase Auth (Google, Email).

### AI Engine
- **Provider**: Google Gemini (via `@google/genai` SDK)
- **Model**: `gemini-3-flash-preview` (Strictly enforced for high-quality generation)
- **Functions**: Route generation, Audio synthesis (TTS), Content enrichment.

### Mobile
- **Hybrid**: Capacitor 8 (Wraps the React app for iOS/Android).
- **Native Android**: A separate native codebase in `native-android/` written in Kotlin (Jetpack Compose), currently in development.

## 3. Core Architecture

### Key Directories
- `src/App.tsx`: Main application logic, routing, and global state orchestration.
- `src/services/`
    - `geminiService.ts`: AI interaction logic, including **Audio Caching** and **Route Generation**.
    - `supabase.ts` / `supabaseRoutes.ts`: Database interactions and RPC calls.
- `src/components/`: Reusable UI components (e.g., `UnifiedPoiCard`, `PremiumProfileSection`).
- `native-android/`: Standalone native Android project.

### Critical Workflows
1.  **Route Generation**: User inputs a city/theme -> AI generates JSON route -> App displays map & POIs -> Background "Enrichment" fetches details.
2.  **Audio Playback**: User clicks Play -> App checks `audio_cache` (Supabase) -> If miss, calls Gemini AI -> Plays audio & saves to cache.
3.  **Premium Unlock**: Coupon code / Auth check -> Updates `PremiumContext` -> Unlocks features (hidden logic, mostly badge/status now as Audio is global).

## 4. AI Agents & Skills (The "Brain")
This project is built with significant AI assistance using the `antigravity` agent framework. It includes specialized skills stored in `.agent/skills/`:

- **Premium Architect**: Strategy and implementation patterns for maximizing revenue and premium value.
- **Supabase Expert**: Deep knowledge of RLS, Edge Functions, and database schema optimization.
- **Local Guide Extractor**: Specialized in parsing unstructured social media content into structured POIs.
- **Android Kotlin Development**: Guidelines for the native Android codebase.
- **Frontend/UI/UX**: Specialized roles for React, Tailwind, and Design Systems.
- **Urban Guide**: Domain expert on city tours and travel content.

## 5. Setup & Running Locally

### Prerequisites
- Node.js 18+
- Supabase Project credentials

### Installation
```bash
npm install
```

### Environment Variables
Create a `.env` file with:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Run Development Server
```bash
npm run dev
```

## 6. Deployment

### Web (Google Cloud Run)
The project includes a deployment script for Google Cloud Run (containerized via Docker).
```bash
./deploy.sh
```

### Mobile
- **Capacitor**: `npx cap sync` then open Android/iOS studio.
- **Native Android**: Open `native-android` in Android Studio.

## 7. Feature Gating & Testing Strategy

To prevent experimental or draft UI elements from leaking into production (`urbanito.live`), we use a **Local-Only** visibility strategy:

### Experimental Features
- Features like `LocalGuidesSection` are wrapped in a conditional check:
  ```tsx
  {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || localStorage.getItem('urbanito_debug_mode') === 'true') && (
    <LocalGuidesSection ... />
  )}
  ```
- **How to Test on Live**: If you need to see these on the live site for testing, set `urbanito_debug_mode` to `true` in your browser's Local Storage console.

### Staging Environment Recommendation
It is highly recommended to set up a dedicated **Staging Server** (e.g., `staging.urbanito.live`). 
1. **GitHub Flow**: Merges to `develop` branch trigger deployment to Staging.
2. **Review**: Visual verification happens on Staging.
3. **Production**: Merges to `main` branch trigger deployment to the live site.

## 8. Recent Fixes & Status

- **Route Duplication**: Fixed via "Name+City" deduplication logic and ID synchronization.
- **Global Audio**: High-quality `gemini-3-flash-preview` voices enabled for **ALL** users.
- **Audio Caching**: Implemented to reduce API costs and latency.
- **Premium UI**: Added "Upgrade" button in Profile section.

## 9. Known Issues / To-Do
- **Live Site Update**: The production site (`urbanito.live`) needs a redeployment (`./deploy.sh`) to reflect recent fixes.
- **Native App**: The Kotlin app is a work-in-progress and follows the `docs/core/DESIGN_GUIDELINES.md`.

## 10. Documentation Resources
- `README.md`: Entry point.
- `.agent/IRON_RULES.md`: Critical coding standards.
- `docs/core/`: Detailed architectural guidelines.
- `task.md` & `walkthrough.md`: Logs of recent agentic work.
