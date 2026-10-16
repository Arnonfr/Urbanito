/**
 * Urbanito palette — "paper & ink" with a deep-violet primary and a signal-orange accent.
 * index.html maps Tailwind's `indigo` and `slate` scales onto these values, so existing
 * classes (bg-indigo-600, text-slate-500…) pick up the palette without per-component edits.
 * Use these constants where a raw hex is needed (map markers, inline HTML, SVG).
 */
export const PALETTE = {
  primary: '#4F2D96', // violet-600: buttons, active states, route line
  primarySoft: '#6A47AE', // violet-500: markers, icons
  primaryInk: '#2A1652', // violet-900: headings on paper
  accent: '#E2602F', // signal orange: start point, user location, selected chip
  paper: '#FAF8F4', // app background
  cream: '#F4EFE6', // sheets, map land
  concrete: '#E6DFD3', // borders
  graphite: '#5E564B', // secondary text
  ink: '#261E36', // primary text
} as const;
