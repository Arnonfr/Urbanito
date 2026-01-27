# PRD: Walk & Talk Mode (Dynamic Urban Companion)

## 1. Executive Summary
**Problem Statement**: Users find pre-planned routes too rigid and often prefer to wander spontaneously, but they miss out on the historical and cultural context of their surroundings without a guide.
**Proposed Solution**: A context-aware "background" mode that narrates points of interest (POIs) as the user approaches them, using live location and predicted heading, without requiring a pre-defined route.
**Business Impact**: 
- Increased User Retention (stickiness of the app as a daily companion).
- Higher audio usage (monetization potential for premium AI voices).
- Differentiation as a "Live Guide" rather than just a "Route Planner."
**Success Metrics**:
- % of users engaging in Walk & Talk mode for >15 mins.
- Average POIs narrated per session.
- Conversion to Premium Audio from the Walk & Talk interface.

## 2. Problem Definition
### 2.1 Customer Problem
Modern travelers value spontaneity. Setting up a "Route" feels like a commitment. However, wandering "blind" leads to missing incredible stories (the "Hidden Gem" problem). Users want the app to be "on" without being "in the way."

### 2.2 Market Opportunity
Most competitors (Google Maps, TripAdvisor) focus on "Search & Go." There is a gap for an "Ambient Intelligence" layer that narrates the city passively, similar to an "Audiotour for the Soul."

## 3. Solution Overview
### 3.1 Capabilities
- **Spontaneous Discovery**: Background monitoring of GPS to detect POIs within 50-100m.
- **Predicative Narration**: Determining which side of the street the user is on and what they are likely looking at.
- **Micro-Interactions**: Brief audio "hooks" (e.g., "On your right is the oldest bakery in Paris...") followed by full stories only if the user stays near the site.

### 3.2 In Scope
- Background location tracking (Web Geolocation API).
- Heading detection (Device Orientation / GPS delta).
- Dynamic description generation via Gemini (if not cached).
- Mode-specific UI (Radar view).

### 3.3 Out of Scope
- Turn-by-turn navigation (this is not a navigator).
- Indoor mapping/POI detection.
- Social sharing of "Wander Paths" (v2).

## 4. User Stories & Requirements
### 4.1 User Stories
- **As a flâneur**, I want the app to talk to me only when I pass something interesting, so I can keep my eyes on the architecture and not the screen.
- **As a tourist with headphones**, I want to toggle "Walk Mode" so I can explore a neighborhood without checking a map every 2 minutes.

### 4.2 Functional Requirements
| ID | Requirement | Priority | Notes |
|----|------------|----------|-------|
| FR1 | System detects POI within 40m radius without active route. | P0 | Core Logic |
| FR2 | Audio triggers automatically if 'Auto-Play' is enabled. | P0 | Essential UX |
| FR3 | System predicts "Current View" based on movement heading. | P1 | Avoids talking about things behind the user. |
| FR4 | UI displays a "Search Radar" animation to show it's active. | P1 | Visibility of system status. |

## 5. Design & UX
### 5.1 Radar UI
- A minimalist, dark-themed overlay that replaces the map controls.
- Visual pulse centered on user location.
- "Upcoming Stop" card that slides in from the bottom.

## 6. Technical Specifications
### 6.1 Logic Flow
1. **Idle**: User enables Walk & Talk mode.
2. **Scan**: Every 10s, fetch POIs in a 200m bounding box (Supabase `nearby_pois` RPC).
3. **Filter**: Calculate distance and bearing (heading) to each POI.
4. **Trigger**: If `distance < 40m` AND `abs(heading - poi_bearing) < 45°`, trigger Audio Hook.
5. **Full Play**: If user remains within 40m for > 15s, play full `narrative`.

### 6.2 Data Needs
- We need an efficient Supabase function to query POIs by radius to avoid client-side bloat.

## 7. Success Metrics
- **Activation**: Number of times Walk & Talk is enabled per week.
- **Engagement**: Average duration of a "passive" walk session.
- **Precision**: % of narrations that users listen to for > 50% of the duration (indicates relevance).

## 8. Risks & Mitigations
- **Battery Drain**: Frequent GPS scanning can kill battery. *Mitigation: Progressive scanning (slower when stationary).*
- **Audio Overload**: Too many POIs in a dense area. *Mitigation: 2-minute cooldown between narrations.*
