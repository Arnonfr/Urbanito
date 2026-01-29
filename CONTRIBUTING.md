# Contributing to Urbanito

## 🚨 Essential Rules for Developers & AI

Welcome to the Urbanito codebase. To ensure consistency and preventing "Spaghetti Code", strict adherence to the following guidelines is required.

### 1. 🎨 Design First
**NEVER** improvise on UI. Always consult:
👉 **[docs/core/DESIGN_GUIDELINES.md](docs/core/DESIGN_GUIDELINES.md)**

*   **Rounding:** Use `rounded-[8px]` for small elements, `rounded-[12px]` for cards.
*   **Colors:** Use the defined Indigo/Emerald palette.
*   **Icons:** Use `lucide-react` only.

### 2. 📱 iOS & Cross-Platform
We are building a Hybrid App (Capacitor).
👉 **[docs/core/IOS_STRATEGY.md](docs/core/IOS_STRATEGY.md)**

*   **Single Source of Truth:** Do not duplicate code for iOS.
*   **Abstraction:** Use `src/platform` (planned) for Native APIs.

### 3. 📂 Folder Structure
*   `docs/core/` - **The Source of Truth** for all rules.
*   `src/components/` - Reusable UI components.
*   `src/features/` - Logic-heavy feature clusters.

---
**Tip:** If you are an AI Agent, read the files in `docs/core/` immediately upon starting a session.
