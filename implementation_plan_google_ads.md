# Google Ads Implementation Plan for Urbanito

## Overview
This plan outlines the integration of Google Ads (AdSense) into the Urbanito application, specifically focusing on "Loading Screens" and "Tour Stops" as requested. The goal is to maximize revenue potential while maintaining a premium, non-intrusive user experience.

## Strategy
1.  **Ad Network**: Google AdSense (Display Ads).
2.  **Placements**:
    *   **Loading Screen (`RouteSkeleton`)**: A responsive display ad placed below the "Crafting your perfect route..." text. This utilizes the 5-10s wait time effectively.
    *   **Tour Stops (`RouteOverview`)**: In-feed style display ads inserted between tour stops (e.g., after every 3rd stop). These will mimic the card style of the tour stops to look native.
3.  **Constraints**:
    *   No ads on the main landing/map page.
    *   Minimal layout shift (using fixed-height containers where possible).

## Prerequisites
*   Active Google AdSense Account.
*   **Publisher ID** (e.g., `ca-pub-1234567890123456`).

## Implementation Steps

### 1. Add AdSense Script to `index.html`
We need to load the AdSense library globally but defer it to not impact initial load performance.

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
     crossorigin="anonymous"></script>
```

### 2. Create Reusable `GoogleAd` Component
Create `components/GoogleAd.tsx` to handle the ad unit rendering. This component will:
*   Wrap the `<ins>` tag.
*   Handle the `(adsbygoogle = window.adsbygoogle || []).push({});` call safely.
*   Accept `slot` ID, `format`, and `style` props.
*   Show a placeholder in development mode.

### 3. Integrate into Loading Screen (`RouteSkeleton`)
Edit `components/RouteSkeleton.tsx`:
*   Insert the `GoogleAd` component inside the mobile bottom sheet skeleton and the desktop sidebar skeleton.
*   Use a "Display" ad unit.

### 4. Integrate into Tour Stops (`RouteOverview`)
Edit `components/RouteOverview.tsx`:
*   Modify the mapping logic to insert a `GoogleAd` component after every N items (e.g., 3).
*   Style the ad container to match the white, rounded card style of the POI list (`bg-white rounded-[8px] border border-slate-100...`).

## Technical Considerations
*   **Development Mode**: AdSense doesn't show ads on `localhost` usually. The component will render a gray placeholder for testing.
*   **Ad Blockers**: The layout should degrade gracefully if ads are blocked (simply collapse).
*   **Responsive**: We will use `data-full-width-responsive="true"` to let Google handle sizing.

## Next Actions
1.  **User**: Provide AdSense Publisher ID.
2.  **Dev**: Execute the code changes listed above.
