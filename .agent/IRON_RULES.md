# ⚠️ IRON RULES - READ FIRST ⚠️

> **כללי ברזל שאסור להפר בשום מצב. קרא את זה לפני כל שינוי קוד!**

---

## 🚫 **NEVER DO THIS**

### 1. ⭐ **NO STARS IN ICONS**
**FORBIDDEN:** Adding decorative stars, sparkles, or "AI slop" elements to icons/UI

❌ **BAD:**
```jsx
<div className="relative">
  <MapPin />
  <Sparkles className="absolute -top-1 -right-1" /> {/* NO! */}
</div>
```

✅ **GOOD:**
```jsx
<MapPin className="text-purple-600" />
```

**Why:** Stars/sparkles are generic AI clichés. We want clean, intentional design.

---

### 2. 🎨 **NO GENERIC STOCK AESTHETICS**

**FORBIDDEN:**
- Generic gradient backgrounds everywhere
- Overuse of blur effects
- "Glassmorphism" on every card
- Rainbow gradients
- Excessive shadows

✅ **DO:**
- Clean, minimal design
- Purposeful use of effects
- Consistent color palette
- Subtle, intentional shadows

---

### 3. 📝 **NO PLACEHOLDER TEXT**

**FORBIDDEN:**
- "Lorem ipsum" or any placeholder text
- "Coming soon" without real content
- Generic descriptions like "This is a great feature"

✅ **DO:**
- Write real, meaningful copy
- Use actual data
- If content is missing, ask the user for it

---

### 4. 🖼️ **NO GENERIC STOCK IMAGES**

**FORBIDDEN:**
- Generic stock photos of people pointing at screens
- Fake "diverse team" photos
- Generic city skylines
- AI-generated faces that look obviously fake

✅ **DO:**
- Use `generate_image` tool for custom, relevant images
- Use real screenshots
- Use actual product images
- Leave space empty rather than fill with generic stock

---

### 5. 🎯 **NO FEATURE CREEP WITHOUT PERMISSION**

**FORBIDDEN:**
- Adding features the user didn't ask for
- "Improving" existing features without being asked
- Suggesting 10 new features when user asks for 1 fix

✅ **DO:**
- Do exactly what was requested
- Ask before adding "nice to have" features
- Focus on the task at hand

---

## ✅ **ALWAYS DO THIS**

### 1. 📱 **RTL-First Design**
- Hebrew is the primary language
- All layouts must work perfectly in RTL
- Test both RTL and LTR

### 2. 🎨 **Use Existing Design System**
- Check existing components before creating new ones
- Follow established color palette
- Maintain consistent spacing/typography

### 3. 🔍 **Check Existing Code First**
- Search for similar implementations
- Don't duplicate existing components
- Reuse utility functions

### 4. 📝 **Update Documentation**
- Update `.agent/memory/AGENT_LOG.md` for significant changes
- Create feature docs in `.agent/memory/features/`
- Keep `DASHBOARD.md` current

### 5. 🧪 **Test Before Claiming Success**
- Actually run the code
- Check browser console for errors
- Verify on mobile viewport
- Test RTL layout

---

## 🎨 **Design Principles**

### Color Palette
```css
/* Primary */
--purple-600: #801ED6  /* Brand color */
--purple-700: #6B17B8  /* Darker variant */

/* Neutrals */
--slate-50: #f8fafc
--slate-100: #f1f5f9
--slate-600: #475569
--slate-900: #0f172a

/* Avoid */
❌ Random rainbow colors
❌ Neon gradients
❌ Generic blue (#007bff)
```

### Typography
```css
/* Font */
font-family: 'Noto Sans Hebrew', sans-serif

/* Avoid */
❌ Multiple font families
❌ Overly decorative fonts
❌ Comic Sans (obviously)
```

### Spacing
```css
/* Use Tailwind scale */
✅ p-2, p-4, p-6, p-8 (8px increments)
❌ p-3, p-5, p-7 (odd numbers, unless necessary)
```

---

## 🚨 **Critical Functions - DO NOT BREAK**

### 1. **Route Saving Logic**
- Location: `App.tsx` - `saveRouteToSupabase()`
- **NEVER** create duplicate routes
- **ALWAYS** check if route exists before saving
- **MUST** update existing route if it exists

### 2. **Audio Player**
- Location: `components/AudioPlayer.tsx`
- **NEVER** break RTL layout
- **ALWAYS** maintain playback speed controls
- **MUST** show disclaimer

### 3. **Map Interactions**
- Location: `App.tsx` - Google Maps logic
- **NEVER** break marker clustering
- **ALWAYS** maintain smooth animations
- **MUST** handle safe areas on mobile

### 4. **Search Functionality**
- Location: `App.tsx` - search bar
- **NEVER** trigger AI menu on text input
- **ALWAYS** search routes, cities, and descriptions
- **MUST** maintain RTL text alignment

---

## 📋 **Before Making Changes - Checklist**

- [ ] Read this file (`IRON_RULES.md`)
- [ ] Check `.agent/memory/AGENT_LOG.md` for context
- [ ] Search codebase for existing implementations
- [ ] Verify change doesn't break critical functions
- [ ] Test in both RTL and LTR
- [ ] Update documentation if significant change
- [ ] No stars/sparkles/AI slop added ⭐❌

---

## 🔧 **Common Mistakes to Avoid**

### 1. **Over-Engineering**
❌ Creating 5 new components for a simple feature
✅ Use existing components, add props if needed

### 2. **Ignoring Mobile**
❌ Desktop-only testing
✅ Test on mobile viewport (375px width)

### 3. **Breaking RTL**
❌ Hardcoding `left`, `right`, `ml-`, `mr-`
✅ Use `start`, `end`, `ms-`, `me-` for directional properties

### 4. **Inconsistent Naming**
❌ `getUserData()`, `fetchUserInfo()`, `loadUser()`
✅ Pick one pattern and stick to it

### 5. **Silent Failures**
❌ `try { ... } catch (e) { }`
✅ `try { ... } catch (e) { console.error('Context:', e); }`

---

## 💡 **When in Doubt**

1. **Ask the user** - Don't assume
2. **Check existing code** - Don't reinvent
3. **Keep it simple** - Don't over-engineer
4. **Test it** - Don't just claim it works
5. **Document it** - Don't leave others guessing

---

## 🎯 **Success Criteria**

A change is successful when:
- ✅ It does exactly what was requested
- ✅ It doesn't break existing functionality
- ✅ It follows the design system
- ✅ It works in RTL and LTR
- ✅ It's documented
- ✅ **It has NO unnecessary stars/sparkles** ⭐❌

---

## 📞 **Questions?**

If you're unsure about something:
1. Check this file
2. Check `.agent/memory/AGENT_LOG.md`
3. Search the codebase
4. **ASK THE USER** - Don't guess!

---

**Last Updated:** 2026-02-04  
**Maintained by:** Arnon (User)  
**Enforced by:** All AI Agents
