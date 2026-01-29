# Urbanito iOS Strategy & Roadmap

## 🎯 Business Goal
**Maximize Efficiency & Reach:** Launch a native iOS application with minimal development overhead by leveraging the existing web codebase.
**Target Audience:** Users who prefer installed apps for better integration (notifications, background location) and trust (App Store presence).

## 🛠 Technical Strategy: Hybrid Application
We are using **Capacitor** to wrap the existing React application.

*   **Primary Language:** TypeScript / React (Existing Web Code).
*   **Native Bridge:** Capacitor (Handles communication between Web and iOS).
*   **Native Code (Swift/Obj-C):** Minimal. Only used for configuration (`Info.plist`, `Podfile`) or specific native plugins if the web API falls short.

### 🚫 How we prevent code duplication
1.  **Single Source of Truth:** We maintain **ONE** repository. `src/` contains code for both Web and iOS.
2.  **Responsive Design:** The UI is already built mobile-first. We do not create separate "iOS Views".
3.  **Abstractions:** We use standard Web APIs (like `navigator.geolocation`) that Capacitor automatically maps to Native APIs. We don't write "if iOS do X else do Y" unless absolutely necessary (e.g., for specific safe-area insets).

## 🗺️ Roadmap & Status

### Phase 1: Infrastructure & Setup (✅ COMPLETED)
*   **Objective:** Get the web app running inside an iOS container.
*   [x] Install Capacitor dependencies.
*   [x] Initialize iOS platform.
*   [x] Configure core permissions (Location) in `Info.plist`.
*   [x] Initial Build & Sync.

### Phase 2: Native Polish & Integration (🚧 IN PROGRESS)
*   **Objective:** Make it feel like an app, not a website.
*   [ ] **Status Bar & Safe Areas:** Ensure content doesn't overlaps the notch or home bar.
*   [ ] **App Icon & Splash Screen:** Replace default Capacitor icons with Urbanito branding.
*   [ ] **Deep Linking:** Allow `urbanito://` or Universal Links (for auth redirects and route sharing).
*   [ ] **Background Mode:** Ensure audio guides continue playing when screen is locked.

### Phase 3: Store Compliance & Release (📅 NEXT)
*   **Objective:** Pass Apple Review.
*   [ ] **Privacy Manifest:** Declare data usage (Location, User ID).
*   [ ] **Screenshots:** Generate App Store assets.
*   [ ] **TestFlight:** Internal testing.
*   [ ] **App Store Submission.**

## 📌 Guiding Principles for Development
1.  **Web First:** Always develop features for the Web first. If it works on Chrome Mobile, it should work on iOS.
2.  **No "Ejecting":** Do not modify the `ios/` folder manually unless it's strictly configuration. Keep logic in TypeScript.
3.  **Test on Device:** The Simulator is good, but real GPS behavior only exists on a real iPhone.

## 🚀 Next Immediate Steps
1.  **Verify Build:** Open the project in Xcode and run on Simulator (`npx cap open ios`).
2.  **Assets Generation:** Create required icon sizes.
3.  **Authentication Test:** Verify Google Login works inside the app wrapper (may require specific URL scheme config).
