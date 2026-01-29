# Urbanito Design Principles

Strict adherence to these rules is mandatory for any AI agent working on this codebase to ensure a premium, consistent UX.

## 1. Rounding Rule (The "8px/12px Rule")
- **Standard Corners**: Use `rounded-[8px]` for small buttons, input fields, and small UI elements.
- **Main Cards & Containers**: Always use `rounded-[12px]` (or `rounded-[16px]` for very large sections) for primary cards like POI cards, Route Overview images, and preference panels.
- **Avoid Defaults**: Never use generic `rounded-md` or `rounded-lg`. Be explicit with pixel values.

## 2. Iconography & Category Visuals
- **Library**: Use `lucide-react`.
- **Religion Policy**: NEVER use crosses or specific religious symbols. Use the `Building` or `Landmark` icon for religious sites.
- **Themed Boxes**: In lists (like the route stops), the category icon must be placed inside a themed, colored square box (`w-12 h-12 rounded-[12px]`) with appropriate background colors (e.g., `bg-amber-50` for history).
- **No Redundancy**: Do not place the same icon twice (e.g., don't put it next to the title AND in the box).

## 3. Colors & Glassmorphism
- **Primary Color**: Indigo (`#6366F1`) for primary actions and active states.
- **Secondary Colors**: Emerald for "Ready/Completed", Rose for "Liked", Amber for "History/Warning".
- **Glass Effect**: Floating panels must use `bg-white/50 backdrop-blur-lg` with subtle borders (`border-white/40`) to create a high-end feel.
- **Shadows**: Use soft, large shadows (`shadow-xl` or `shadow-2xl`) for elevated components.

## 4. Content Hierarchy (Bilingual)
- **Primary Label**: Hebrew title (e.g., "מוזיאון החאן") should be bold and prominent.
- **Subtitle**: English/Original name (e.g., "The Khan Museum") should be smaller, in `text-slate-500`, and subtle.
- **Ready States**: If a Stop has content/description or is loaded, show a small green `Check` icon and "READY" text (text-[9px] bold emerald).

## 5. Map & Search Elements
- **Selection Circle**: The search radius circle on the map should visually represent roughly **1/4** of the total walking distance to look "balanced" on typical zoom levels.
- **Visual Feedback**: The circle must update its radius in real-time as the user moves the distance slider.

## 6. Layout & Controls
- **Action Priority**: In the `QuickRouteSetup`, the "Custom Prompt" (Something special in mind?) and its quick-tags must be at the TOP.
- **Preferences**: Use Grid layouts for filter buttons (Vegan, Accessible, No Religious sites) with clear toggled states (`bg-indigo-50` or similar).
- **Navigation Tabs**: Integrated into the top handle area of the `RouteOverview` to save map space.
- **Close Button (X)**: Should be a floating, circular button with a backdrop blur, typically placed in the top corner of an image or card.

## 7. Interactive Feedback
- **Scaling**: All primary buttons should have `active:scale-95 transition-all` for tactile feedback.
- **Loading**: Use the `RouteTravelIcon` component with `animated={true}` for generation processes.
- **Touch Targets**: Minimum 44x44px for clickability.

## 8. Anti-AI Aesthetic (The "No Sparkles" Rule)
- **BANNED**: The "Sparkles" icon (✨) is strictly forbidden for representing "AI" or "Smart" features. It is considered lazy and generic.
- **Alternatives**: Use metaphors of *Guidance* (Compass, Map), *Insight* (Lightbulb, Eye), or *Precision* (Target, Scan).
- **Human Tone**: Avoid robotic "AI is thinking" text. Use active verbs like "Building", "Curating", "Planning".
