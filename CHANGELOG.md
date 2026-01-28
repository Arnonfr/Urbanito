# Changelog

All notable changes to the Urbanito project will be documented in this file.

## [Unreleased]

## [2026-01-28]

### Added
- **Route Tabs Logic:** 
  - Implemented logic to show tabs only on user's route pages (`/route`).
  - Added "shrink" logic for tabs: shows active + 1 tab when > 3 routes are open.
  - Added "Expand/Collapse" functionality for managing multiple route tabs.
- **UI/UX Improvements:**
  - **RouteOverview Header:** Redesigned to match `UnifiedPoiCard` style.
    - Full-width image with gradient overlay.
    - Glassmorphic action buttons positioned at the top.
    - Bottom-aligned text (City, Title) with drop shadows.
    - Removed white header bar and close button (X).
  - **Global Audio Player:**
    - Improved layout and visibility.
  - **Preferences:**
    - Updated "Regenerate" button text to "Update Route" when editing an existing route (embedded mode).

### Changed
- **Styling:**
  - Central "Plus" FAB is now always purple with a white icon (unless menu is open).
  - Increased size of "Close" (X) button on route tabs for better accessibility (size 16).
  - Adjusted Z-index of `RouteOverview` to properly overlay tabs when expanded.
  - Added padding to the scrollable content area in `RouteOverview`.

### Fixed
- **Bugs:**
  - Fixed issue where 'white screen' appeared due to map padding errors.
  - Fixed logic for "Update/Regenerate" button text in `QuickRouteSetup`.
