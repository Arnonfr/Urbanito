# Agent Memory Log

> **מטרה:** תיעוד מרכזי של כל פעילות ה-agents, החלטות, וסטטוס פיצ'רים

---

## 📅 **Timeline**

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
