---
name: Premium Architect
description: Defines the strategy, rules, and implementation patterns for Urbanito's Premium tier.
---

# Premium Architect Skill

This skill governs the differentiation between **Free** and **Premium** users in Urbanito. It ensures that premium features are implemented consistently, securely, and with a clear value proposition.

## 💎 Core Philosophy
*   **Free (The Tourist)**: Functional, reliable, "Google Maps++". Good enough to get from A to B and learn something.
*   **Premium (The Traveler)**: Immersive, magical, frictionless. "Private Guide in your pocket". Focus on emotion, deep history, and convenience.

## 📐 Differentiation Rules

| Feature Category | Free Tier | Premium Tier |
| :--- | :--- | :--- |
| **Audio** | Standard Web Speech API (System TTS). | **Neural AI Voices** (Gemini/ElevenLabs). Character personas. |
| **Visuals** | 1 cover image per POI. | **Deep Dive Gallery** (Interiors, Archives) + **AI Reconstructions** (History view). |
| **Connectivity** | Online Only (Requires Data). | **Offline Mode**. Download full routes for airplane mode usage. |
| **Interaction** | Passive listening. | **AI Concierge**: Ask context-aware questions about the POI. |
| **Comfort** | Standard routing. | **Smart Detours** (Coffee, Restrooms, Vibe checks). |

## 🛡️ Implementation Guidelines

### 1. State Management
*   Global `usePremium` hook must be used to check status.
*   Do NOT scatter `if (premium)` logic inside every component. Use wrapper components (see below).

### 2. UI Patterns
*   **Locked Features**: Should be visible but disabled (or badged) to drive FOMO (Fear Of Missing Out).
*   **The "Velvet Rope"**: Clicking a premium feature should trigger a sleek, non-intrusive upgrade modal ("Unlock the full experience").
*   **Visual Distinction**: Premium active state usually involves a subtle "Gold" or "Platinum" accent in the UI (e.g., gold ring around avatar).

### 3. Activation Logic (V1 - Coupon)
*   **Mechanism**: Simple string match against a predefined list or formatted hash.
*   **Storage**: Persisted in `LocalStorage` (for web) and `SecureStorage` (for native).
*   **Validation**:
    *   Input: "URBAN-PRO-2026"
    *   Result: Sets `user_tier = 'premium'` and `expiry_date`.

## 💻 Tech Stack Integration

### The `PremiumGate` Component
Wrap premium-only UI sections with this component.

```tsx
<PremiumGate
  fallback={<LockIconWithTooltip text="Premium Feature" />}
  source="ai_reconstruction" // For analytics
>
  <AiReconstructionView />
</PremiumGate>
```

### The `usePremium` Hook
```typescript
const { isPremium, unlockWithCoupon } = usePremium();
```

---
**Rule of Thumb**: If it costs us significant money (API calls to LLMs, high-res image hosting) or saves the user significant stress (Offline mode), it belongs in **Premium**.
