# Technical Decisions Log

> **תיעוד החלטות טכניות משמעותיות שהתקבלו בפרויקט**

---

## 🏗️ **Architecture**

### Tech Stack
**Date:** Project inception  
**Decision:** React + Vite + Supabase

**Stack:**
- **Frontend:** React 19 (with TypeScript)
- **Build Tool:** Vite
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Maps:** Google Maps API
- **AI:** Google Gemini API
- **Styling:** Tailwind CSS
- **Icons:** Lucide React

**Rationale:**
- React: Industry standard, great ecosystem
- Vite: Fast dev server, modern build tool
- Supabase: Full backend without managing servers
- Tailwind: Rapid styling, consistent design system

---

## 🗄️ **Database Design**

### Supabase Schema
**Date:** Project inception  
**Decision:** Normalized schema with RLS policies

**Key Tables:**
- `routes` - User-created routes
- `pois` - Points of interest
- `saved_routes` - User's saved routes
- `saved_pois` - User's saved POIs
- `user_preferences` - User settings

**RLS Policies:**
- Users can only read/write their own data
- Public routes are readable by all
- Admin role for moderation (future)

**Rationale:** Security first. RLS ensures data isolation without complex backend logic.

---

## 🔐 **Authentication**

### Google OAuth Only
**Date:** Project inception  
**Decision:** Single sign-on with Google

**Implementation:**
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
});
```

**Rationale:**
- Simplifies UX (no password management)
- Trusted provider
- Fast implementation
- Can add more providers later

---

## 🗺️ **Maps Integration**

### Google Maps API
**Date:** Project inception  
**Decision:** Google Maps over Mapbox/OpenStreetMap

**Why Google Maps:**
- ✅ Best POI data
- ✅ Familiar to users
- ✅ Excellent geocoding
- ✅ Street View integration (future)

**Why NOT alternatives:**
- ❌ Mapbox: Requires more custom POI data
- ❌ OpenStreetMap: Less reliable POI data
- ❌ Apple Maps: Web support limited

**API Key:** Stored in `index.html` (public key, restricted by domain)

---

## 🤖 **AI Integration**

### Google Gemini API
**Date:** Project inception  
**Decision:** Gemini for route generation and content

**Use Cases:**
- Route generation from user prompts
- POI descriptions
- Audio tour scripts
- Image generation (future)

**Why Gemini:**
- ✅ Multimodal (text, images, future audio)
- ✅ Fast response times
- ✅ Good Hebrew support
- ✅ Generous free tier

**API Key Management:**
- Stored in Supabase (server-side)
- Never exposed to client
- Rate limiting implemented

---

## 📦 **State Management**

### React State + Supabase
**Date:** Project inception  
**Decision:** No Redux, keep it simple

**Approach:**
- Local UI state: `useState`, `useEffect`
- Persistent data: Supabase queries
- No global state library

**Rationale:**
- App complexity doesn't justify Redux
- Supabase handles data sync
- Simpler codebase, easier to maintain

---

## 🎨 **Styling Strategy**

### Tailwind CSS
**Date:** Project inception  
**Decision:** Utility-first CSS with Tailwind

**Configuration:**
```javascript
// tailwind.config in index.html
theme: {
  extend: {
    spacing: {
      'safe-top': 'env(safe-area-inset-top)',
      'safe-bottom': 'env(safe-area-inset-bottom)',
    }
  }
}
```

**Why Tailwind:**
- ✅ Rapid development
- ✅ Consistent design system
- ✅ No CSS file bloat
- ✅ Easy RTL support

**Custom CSS:**
- Minimal custom CSS in `index.html`
- Only for animations and global resets

---

## 🔊 **Audio Generation**

### Text-to-Speech Strategy
**Date:** 2026-01-25  
**Decision:** Client-side TTS with Web Speech API

**Implementation:**
```typescript
const utterance = new SpeechSynthesisUtterance(text);
utterance.lang = 'he-IL';
speechSynthesis.speak(utterance);
```

**Why Client-Side:**
- ✅ Free (no API costs)
- ✅ Instant playback
- ✅ Works offline
- ✅ No server load

**Limitations:**
- ❌ Voice quality varies by browser/OS
- ❌ Limited voice options
- ✅ Acceptable for MVP

**Future:** Consider Google Cloud TTS for premium voices

---

## 💾 **Caching Strategy**

### No Service Worker (Currently)
**Date:** 2026-01-25  
**Decision:** Removed service worker for now

**Code:**
```javascript
// index.html - Unregister all service workers
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
});
```

**Rationale:**
- Service worker was causing stale cache issues
- Simpler debugging without SW
- Can re-add later with proper cache invalidation

**Future:** Implement proper SW for offline support

---

## 🚀 **Deployment**

### Vite Build + Static Hosting
**Date:** Project inception  
**Decision:** Static site deployment

**Build:**
```bash
npm run build  # Vite builds to /dist
```

**Hosting:** TBD (likely Vercel, Netlify, or Firebase Hosting)

**Why Static:**
- ✅ Fast, cheap, scalable
- ✅ No server management
- ✅ CDN distribution
- ✅ Supabase handles backend

---

## 🔍 **Search Implementation**

### Client-Side Search
**Date:** 2026-02-03  
**Decision:** Filter routes/POIs client-side

**Implementation:**
```typescript
const filtered = routes.filter(route =>
  route.name.includes(query) ||
  route.city.includes(query) ||
  route.description?.includes(query)
);
```

**Why Client-Side:**
- ✅ Instant results
- ✅ No API calls
- ✅ Works offline
- ✅ Simple implementation

**Limitations:**
- ❌ Only searches loaded data
- ❌ No fuzzy matching (yet)

**Future:** Add Supabase full-text search for large datasets

---

## 📊 **Analytics**

### No Analytics (Yet)
**Date:** Current  
**Decision:** Defer analytics until MVP is stable

**Future Considerations:**
- Google Analytics 4
- Mixpanel for user behavior
- Custom events for key actions

**Rationale:** Focus on core features first, add analytics when we have users to track

---

## 🔒 **Security**

### Row Level Security (RLS)
**Date:** Project inception  
**Decision:** Supabase RLS for all user data

**Policies:**
```sql
-- Users can only read their own routes
CREATE POLICY "Users can read own routes"
  ON routes FOR SELECT
  USING (auth.uid() = user_id);
```

**Why RLS:**
- ✅ Database-level security
- ✅ Can't be bypassed by client
- ✅ Automatic with Supabase auth
- ✅ No backend code needed

---

## 🎯 **Performance Optimizations**

### Lazy Loading
**Date:** Project inception  
**Decision:** Load components/data on demand

**Examples:**
- Routes loaded when user opens library
- POI details loaded when marker clicked
- Images lazy loaded with `loading="lazy"`

**Why:**
- ✅ Faster initial load
- ✅ Less memory usage
- ✅ Better mobile performance

---

## 📱 **Mobile Optimization**

### Bottom Sheet UI
**Date:** Project inception  
**Decision:** Native-like bottom sheet on mobile

**Implementation:**
- Draggable sheet
- Snap points (collapsed, half, full)
- Smooth animations
- Safe area support

**Rationale:** Feels native, familiar to mobile users, better than modals

---

## 🔄 **Data Sync**

### Optimistic Updates
**Date:** Project inception  
**Decision:** Update UI immediately, sync to Supabase in background

**Pattern:**
```typescript
// Update UI immediately
setRoutes([...routes, newRoute]);

// Sync to Supabase
await supabase.from('routes').insert(newRoute);
```

**Why:**
- ✅ Feels instant
- ✅ Better UX
- ✅ Handle errors gracefully

---

## 🐛 **Error Handling**

### Console Logging + User Feedback
**Date:** Project inception  
**Decision:** Log errors, show user-friendly messages

**Pattern:**
```typescript
try {
  await riskyOperation();
} catch (error) {
  console.error('Context about what failed:', error);
  showToast('Something went wrong. Please try again.');
}
```

**Why:**
- ✅ Developers can debug
- ✅ Users get helpful feedback
- ✅ App doesn't crash silently

**Future:** Add error tracking (Sentry, LogRocket)

---

## 📦 **Bundle Size**

### ESM Imports
**Date:** Project inception  
**Decision:** Use ES modules via importmap

**Implementation:**
```html
<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@^19.2.3",
    "lucide-react": "https://esm.sh/lucide-react@^0.562.0"
  }
}
</script>
```

**Why:**
- ✅ No bundler needed for deps
- ✅ Browser caches modules
- ✅ Faster dev server
- ✅ Smaller build output

---

## 🔧 **Development Tools**

### Vite Dev Server
**Date:** Project inception  
**Decision:** Vite for development

**Features:**
- Hot Module Replacement (HMR)
- Fast startup
- TypeScript support
- ESM-first

**Why Vite over CRA:**
- ✅ Much faster
- ✅ Modern tooling
- ✅ Better DX
- ✅ Smaller bundle

---

**Last Updated:** 2026-02-04  
**Next Review:** When major technical decisions are made
