# Design Decisions Log

> **תיעוד החלטות עיצוב משמעותיות שהתקבלו בפרויקט**

---

## 🎨 **Core Design Philosophy**

### Principle: "Human Signature Over AI Slop"
**Date:** 2026-02-04  
**Decision:** Avoid generic AI aesthetics in favor of intentional, authored design

**What this means:**
- ❌ NO decorative stars/sparkles on icons
- ❌ NO generic stock photos
- ❌ NO rainbow gradients everywhere
- ❌ NO excessive glassmorphism
- ✅ Clean, minimal, purposeful design
- ✅ Consistent color palette
- ✅ Intentional use of effects

**Rationale:** AI-generated designs often feel generic and soulless. We want Urbanito to feel crafted and intentional.

---

## 🌍 **RTL-First Approach**

**Date:** Project inception  
**Decision:** Hebrew is the primary language, RTL is the default

**Implementation:**
- All layouts designed for RTL first
- LTR is secondary consideration
- Use `start`/`end` instead of `left`/`right`
- Test both directions always

**Rationale:** Most users are Hebrew speakers. RTL should feel native, not like an afterthought.

---

## 🎨 **Color Palette**

**Date:** Project inception  
**Decision:** Purple as primary brand color

**Palette:**
```css
Primary: #801ED6 (purple-600)
Darker: #6B17B8 (purple-700)
Neutrals: slate-50 through slate-900
```

**Rationale:** Purple conveys creativity and exploration, differentiates from competitors (Google Maps blue, etc.)

---

## 📱 **Mobile-First Design**

**Date:** Project inception  
**Decision:** Design for mobile, adapt for desktop

**Implementation:**
- Primary viewport: 375px (iPhone)
- Bottom sheet UI on mobile
- Sidebar on desktop
- Touch-friendly targets (min 44px)

**Rationale:** Most users will use Urbanito while walking around cities on their phones.

---

## 🎯 **Navigation Structure**

**Date:** 2026-02-03  
**Decision:** Persistent top tabs for "My Route" and "Library"

**Implementation:**
- Tabs always visible at top
- Search bar integrated into header
- No hidden navigation

**Rationale:** Users were confused when tabs disappeared. Persistent navigation improves discoverability.

---

## 🔊 **Audio Player Design**

**Date:** 2026-01-25  
**Decision:** Integrated audio player with RTL support

**Features:**
- Playback speed controls
- Seek bar
- Disclaimer about AI-generated content
- RTL-friendly layout

**Rationale:** Audio tours are a core feature. Player must be accessible and functional in Hebrew.

---

## 💰 **Monetization Strategy**

**Date:** 2026-01-25  
**Decision:** Google AdSense with strategic placement

**Placements:**
- Loading screens (during route generation)
- Between tour stops (every 3rd stop)
- NO ads on main map page

**Rationale:** Monetize without disrupting core UX. Ads during natural wait times feel less intrusive.

---

## 🗺️ **Map Interaction**

**Date:** Project inception  
**Decision:** Google Maps as base, custom overlays

**Implementation:**
- Google Maps API for base map
- Custom markers for POIs
- Custom info windows
- Clustering for dense areas

**Rationale:** Google Maps is familiar and reliable. Custom overlays allow brand differentiation.

---

## 📝 **Content Strategy**

**Date:** 2026-02-04  
**Decision:** No placeholder text or generic content

**Rules:**
- Real content only
- No "Lorem ipsum"
- No "Coming soon" without context
- Ask user for content if missing

**Rationale:** Placeholder text makes the app feel unfinished and unprofessional.

---

## 🎨 **Icon Philosophy**

**Date:** 2026-02-04  
**Decision:** Clean icons without decorative elements

**Rules:**
- ❌ NO stars, sparkles, or decorative overlays
- ✅ Simple, recognizable icons
- ✅ Consistent stroke width
- ✅ Lucide React icon library

**Rationale:** Decorative elements are AI clichés. Clean icons feel more professional.

---

## 🔄 **State Management**

**Date:** Project inception  
**Decision:** React state + Supabase for persistence

**Implementation:**
- Local state for UI (React useState)
- Supabase for user data (routes, POIs, preferences)
- No Redux or complex state management

**Rationale:** App complexity doesn't justify heavy state management. Keep it simple.

---

## 🎭 **Animation Philosophy**

**Date:** Project inception  
**Decision:** Subtle, purposeful animations

**Rules:**
- Smooth transitions (200-300ms)
- No excessive bounce/spring effects
- Animations should enhance, not distract
- Respect `prefers-reduced-motion`

**Rationale:** Animations should feel natural and enhance UX, not show off.

---

## 📊 **Data Display**

**Date:** Project inception  
**Decision:** Card-based layout for routes and POIs

**Implementation:**
- White cards with subtle borders
- Rounded corners (8px)
- Consistent padding
- Clear hierarchy

**Rationale:** Cards provide clear visual separation and are familiar to users.

---

## 🔍 **Search Design**

**Date:** 2026-02-03  
**Decision:** Integrated search bar in header

**Features:**
- Searches routes, cities, descriptions
- Does NOT trigger AI menu
- RTL text input
- Clear button when active

**Rationale:** Search is a core function. It should be always accessible and predictable.

---

## 🎨 **Typography**

**Date:** Project inception  
**Decision:** Noto Sans Hebrew for all text

**Implementation:**
```css
font-family: 'Noto Sans Hebrew', sans-serif
```

**Rationale:** Excellent Hebrew support, clean and readable, works well at all sizes.

---

## 📱 **Safe Areas**

**Date:** Project inception  
**Decision:** Respect iOS safe areas

**Implementation:**
```css
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
```

**Rationale:** Modern iOS devices have notches and home indicators. Must respect these.

---

## 🎯 **Feature Prioritization**

**Date:** Ongoing  
**Decision:** Core experience over feature bloat

**Priorities:**
1. Route discovery and navigation
2. Audio tours
3. Saving and organizing routes
4. Search and filtering
5. Social features (future)

**Rationale:** Better to do a few things excellently than many things poorly.

---

**Last Updated:** 2026-02-04  
**Next Review:** As needed when major design decisions are made
