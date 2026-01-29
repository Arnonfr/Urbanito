# Urbanito Project Dashboard

## Status: Active Development
**Last Updated:** 2026-01-28

### ✅ Completed Today (2026-01-28)
- **UI Redesign:**
  - **RouteOverview:** Complete overhaul of the header to match `UnifiedPoiCard` aesthetics (Full-width image, glassmorphism).
  - **Route Tabs:** Implemented smart tab management (Autohide on non-route pages, "Shrink" logic for >3 routes).
- **UX Enhancements:**
  - **Contextual Actions:** "Regenerate" button now correctly says "Update Route" when editing.
  - **Visual Polish:** Fixed Z-index layering, padded scroll areas, and standardized the central FAB button.
- **Infrastructure:**
  - **Git:** Pushed all recent changes to `main`.
  - **Documentation:** Created `CHANGELOG.md` to track version history.

### 📊 Progress Metrics
- **Core Functionality:** 90% (Routes, POIs, Audio, Map are stable).
- **UI Polish:** 85% (Main flows are polished, edge cases being refined).
- **Mobile Responsiveness:** 95% (Optimized for mobile-first).
- **Monetization:** 40% (AdSense implementation started/planned).

### 📱 Roadmap to iOS App
**[👉 לחץ כאן למעבר ללוח הבקרה המלא של iOS (עברית)](./IOS_DASHBOARD.md)**
Current Stack: React (Vite) + Tailwind + Supabase + Capacitor.

**Remaining Tasks:**
1.  **Capacitor Integration (1-2 Days):**
    - [x] Install `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`.
    - [x] Initialize Capacitor config.
    - [x] Build web assets (`npm run build`).
2.  **Native Configuration (1 Day):**
    - [x] Add iOS platform (`npx cap add ios`).
    - [x] Configure `Info.plist` (Permissions descriptions for Geolocation).
    - [ ] Set up deep linking (if needed for authentication callbacks).
3.  **Testing & Refinement (2-3 Days):**
    - [ ] Test on iOS Simulator.
    - [ ] Verify native plugins (Geolocation, Audio background mode).
    - [ ] Adjust "Safe Area" insets (notch/home bar) if needed.
4.  **App Store Prep (1-2 Days):**
    - [ ] Generate App Icons and Splash Screens.
    - [ ] Create Apple Developer Account (if not exists).
    - [ ] Archive and Submit to TestFlight/App Store.

### 🚧 Pending items
- [ ] **AdSense:** Finalize implementation.
- [ ] **Voice/Reading Plan:** Finalize "Reading Plan" feature features.
- [ ] **Tests:** Set up automated testing workflow.

