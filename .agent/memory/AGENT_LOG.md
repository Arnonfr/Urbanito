# Agent Memory Log

> **מטרה:** תיעוד מרכזי של כל פעילות ה-agents, החלטות, וסטטוס פיצ'רים

---

## 📅 **Timeline**

### 2026-02-13 (Today)
- **08:55** - 🚀 **Critical Route Saving Fixes & Deployment**
  - ✅ **RPC Polymorphism:** Fixed parameter naming mismatch (`p_duration` vs `p_duration_minutes`) by updating the DB function to handle both.
  - ✅ **Robust User ID Handling:** Fixed "invalid UUID" errors for guest users by sanitizing `'anon'` strings to `null` across all Supabase services.
  - ✅ **ID Propagation:** Ensured `user_id` is correctly passed from AI generation to the DB.
  - ✅ **Automated Deployment:** Verified that pushing to `main` triggers Firebase Hosting deployment via GitHub Actions.
  - ✅ **Data Integrity:** Cleaned `poi_details` to ensure better content deduplication and cache hits.
- **09:00** - 📱 **Native Android Progress**
  - Working on `LibraryViewModel.kt` to handle route sync and display in the native app.
  - refining `LibraryScreen.kt` and `MapScreen.kt` for a premium feel.
- **08:30** - 🛠️ **Refining Route Generation**
  - Improving nearby route discovery logic.
  - Adding instrumentation for debugging library freezes and duplicate loading.

### 2026-02-05
- **22:07** - 📊 **Research Questionnaire Deployment**
  - Created `Research.tsx` and `ResearchThankYou.tsx`.
  - Implemented progress bar and premium-designed sliders.
  - Set up Supabase migration for coupons tracking (`20260205_research_coupons.sql`).
- **18:11** - 💎 **Premium & Offline Foundation**
  - Created `PremiumContext.tsx` and `offlineService.ts` for managing route downloads.
  - Added `PremiumProfileSection.tsx` to the UI.
  - Documented roadmap in `docs/product/PREMIUM_FEATURES.md`.
- **14:00** - 🌍 **Local Guides Implementation**
  - Created `LocalGuidesSection.tsx` and Supabase migration `20240205_create_local_guides.sql`.
  - Integrated local curated content to boost Social Proof.
- **11:04** - 🤖 **Native Android Initialization**
  - Started `native-android` project (Kotlin, Jetpack Compose, MVVM).
  - Configured Gradle and project structure.

### 2026-02-04
- **21:55** - ✅ **Major UI Fixes (User Feedback)**
  - ✅ Removed route tabs completely (as requested)
  - ✅ Added back-to-library arrow button in RouteOverview
  - ✅ Applied "City | Short Title" format to ALL library route cards
  - ✅ Fixed RTL alignment for all route titles (added `dir` attribute)
  - ✅ Replaced AI-generated OG image with clean, branded version (purple gradient + logo)
  - **Result:** Cleaner UI, better navigation, consistent branding
- **21:50** - 🔗 **Open Graph & Link Previews**
  - Generated custom OG preview image (1200x630px)
  - Added comprehensive Open Graph meta tags (Facebook, WhatsApp, Telegram)
  - Added Twitter Card meta tags
  - Added SEO meta tags (description, keywords)
  - **Result:** Rich previews when sharing urbanito.live links
- **21:45** - 📋 **Header Duplicates Audit**
  - Created comprehensive audit of all app pages
  - Identified duplicate "העדפות מסלול" header in QuickRouteSetup
  - Documented all findings in `.agent/memory/HEADER_DUPLICATES_AUDIT.md`
- **21:40** - 🎨 **UI Improvements**
  - Fixed duplicate tabs issue (removed from /library, kept only in /route)
  - Changed title format: "City | Short Title" with long description as subtitle
  - Reduced swipe sensitivity (100px threshold instead of 60px) for better UX
- **21:30** - 🚨 **Created Iron Rules System**
  - Created `.agent/IRON_RULES.md` - Critical rules all agents must follow
  - Created `.agent/memory/decisions/design.md` - Design decisions log
  - Created `.agent/memory/decisions/technical.md` - Technical decisions log
  - Updated `README.md` to prominently link to Iron Rules
  - **Purpose:** Prevent recurring issues (stars in icons, breaking critical functions, ignoring RTL)
- **21:30** - יצירת מערכת Agent Memory
- **21:26** - בירור סטטוס Google Ads (הבנה שהפרסומות כבר מותקנות)

### 2026-01-25 (משוער)
- **Google Ads Integration** - הטמעה מלאה של AdSense
  - נוצר `GoogleAd.tsx` component
  - אינטגרציה ב-`RouteSkeleton` ו-`RouteOverview`
  - Publisher ID: `ca-pub-5516166184309166`
  - תכנון מלא ב-`implementation_plan_google_ads.md`

---

## 🎯 **Active Features**

| Feature | Status | Last Updated | Notes |
|---------|--------|--------------|-------|
| Google Ads | ✅ Implemented | 2026-01-25 | מותקן, מחכה לאישור Google |
| Audio Player | ✅ Active | 2026-01-25 | פעיל ותקין |
| Routes System | ✅ Active | 2026-02-03 | תוקן bug של duplicates |
| Library | ✅ Active | 2026-02-03 | נגיש מהניווט העליון |
| Search Bar | ✅ Fixed | 2026-02-03 | תוקן - לא פותח AI menu |

---

## 🔧 **Recent Fixes**

### Navigation Bugs (2026-02-03)
- ✅ Search bar פועל כ-text input
- ✅ "My Route" ו-"Library" tabs תמיד גלויים
- ✅ מניעת duplicate routes בספרייה

### Map Expansion (2026-01-29)
- ✅ כפתור "Expand" עובד תקין
- ✅ Zoom level מתאים
- ✅ צבע כפתור "+" תוקן

---

## 📝 **Pending Tasks**

- [ ] AdSense: המתן לאישור Google (24-48 שעות)
- [ ] בדיקת פרסומות בסביבת production

---

## 💡 **Key Decisions**

### Monetization Strategy
- **Chosen:** Google AdSense (Display Ads)
- **Placements:**
  - Loading screens (RouteSkeleton)
  - Between tour stops (every 3rd stop)
- **Constraints:**
  - No ads on main map page
  - Minimal layout shift
  - Native-looking integration

### Design Philosophy
- Premium, non-intrusive UX
- RTL-first design
- Mobile-first approach

---

## 🔗 **Related Documents**

- [Google Ads Implementation Plan](../implementation_plan_google_ads.md)
- [Dashboard](../DASHBOARD.md)
- [Design Guidelines](../docs/core/DESIGN_GUIDELINES.md)
