/**
 * Mapbox-backed implementation of the small subset of the Google Maps JS API that
 * App.tsx uses (Map, Marker, Circle, InfoWindow, DirectionsService/Renderer, Geocoder,
 * places.Autocomplete, DistanceMatrixService, LatLng/LatLngBounds, event, geometry).
 *
 * Why a compatibility layer instead of rewriting every call site: the map logic is spread
 * across ~40 places in App.tsx; keeping the same surface lets the screens stay untouched
 * while the map moves from Google (paid per load/call) to Mapbox (generous free tier).
 * New code should prefer `getMapboxMap()` / mapbox-gl directly.
 *
 * Cost notes: map loads, geocoding and walking directions use the Mapbox free tier;
 * directions are cached in localStorage; distance estimates are computed locally.
 */
import mapboxgl from 'mapbox-gl';
import type * as GeoJSON from 'geojson';
import { PALETTE } from '../../theme/palette';

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
const STYLE = 'mapbox://styles/mapbox/standard';

// "Paper" basemap: cream land, thin warm streets, muted water — the route and stops carry the colour.
const BASEMAP = {
  lightPreset: 'day',
  show3dObjects: false,
  showPointOfInterestLabels: false,
  showTransitLabels: false,
  colorLand: '#F4EFE6',
  colorBuildings: '#EAE3D6',
  colorCommercial: '#F0EADF',
  colorEducation: '#F0EADF',
  colorMedical: '#F0EADF',
  colorIndustrial: '#EDE7DB',
  colorGreenspace: '#E4E6D2',
  colorWater: '#D3DEE0',
  colorRoads: '#FFFDF8',
  colorTrunks: '#E6DDCD',
  colorMotorways: '#E0D5C2',
  colorRoadLabels: '#8A8274',
  colorPlaceLabels: '#5B5348',
  colorAdminBoundaries: '#C9BFAE',
};

// Google zoom levels assume 256px tiles; Mapbox GL uses 512px tiles.
const toMbZoom = (z: number) => z - 1;
const fromMbZoom = (z: number) => z + 1;

const uiLang = () => (document.documentElement.lang || 'he').slice(0, 2);

// ---------------------------------------------------------------- primitives

type LatLngLike = LatLng | { lat: number | (() => number); lng: number | (() => number) };

export class LatLng {
  private _lat: number;
  private _lng: number;
  constructor(lat: number, lng: number) {
    this._lat = Number(lat);
    this._lng = Number(lng);
  }
  lat() { return this._lat; }
  lng() { return this._lng; }
  toJSON() { return { lat: this._lat, lng: this._lng }; }
  equals(o: LatLngLike) {
    const p = toPlain(o);
    return p.lat === this._lat && p.lng === this._lng;
  }
}

const toPlain = (p: LatLngLike): { lat: number; lng: number } => {
  const lat = typeof (p as any).lat === 'function' ? (p as any).lat() : (p as any).lat;
  const lng = typeof (p as any).lng === 'function' ? (p as any).lng() : (p as any).lng;
  return { lat: Number(lat), lng: Number(lng) };
};
const toLngLat = (p: LatLngLike): [number, number] => {
  const { lat, lng } = toPlain(p);
  return [lng, lat];
};

export class LatLngBounds {
  private sw: { lat: number; lng: number } | null = null;
  private ne: { lat: number; lng: number } | null = null;
  extend(p: LatLngLike) {
    const { lat, lng } = toPlain(p);
    if (!isFinite(lat) || !isFinite(lng)) return this;
    if (!this.sw || !this.ne) {
      this.sw = { lat, lng };
      this.ne = { lat, lng };
    } else {
      this.sw = { lat: Math.min(this.sw.lat, lat), lng: Math.min(this.sw.lng, lng) };
      this.ne = { lat: Math.max(this.ne.lat, lat), lng: Math.max(this.ne.lng, lng) };
    }
    return this;
  }
  isEmpty() { return !this.sw; }
  getCenter() {
    if (!this.sw || !this.ne) return new LatLng(0, 0);
    return new LatLng((this.sw.lat + this.ne.lat) / 2, (this.sw.lng + this.ne.lng) / 2);
  }
  toMapbox(): mapboxgl.LngLatBoundsLike | null {
    if (!this.sw || !this.ne) return null;
    return [[this.sw.lng, this.sw.lat], [this.ne.lng, this.ne.lat]];
  }
}

type Handler = (...args: any[]) => void;
interface ListenerHandle { remove: () => void }

class Emitter {
  private handlers = new Map<string, Set<Handler>>();
  addListener(evt: string, fn: Handler): ListenerHandle {
    if (!this.handlers.has(evt)) this.handlers.set(evt, new Set());
    this.handlers.get(evt)!.add(fn);
    return { remove: () => this.handlers.get(evt)?.delete(fn) };
  }
  emit(evt: string, ...args: any[]) {
    this.handlers.get(evt)?.forEach(fn => {
      try { fn(...args); } catch (e) { console.error(`[map] ${evt} handler failed`, e); }
    });
  }
}

const haversine = (a: LatLngLike, b: LatLngLike) => {
  const p = toPlain(a), q = toPlain(b);
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (q.lat - p.lat) * rad, dLng = (q.lng - p.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(p.lat * rad) * Math.cos(q.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

// ---------------------------------------------------------------- map

let lastMap: MapCompat | null = null;
export const getMapboxMap = () => lastMap?.mb ?? null;

/** Runs `fn` once the style is ready (layers can only be added after that). */
const whenStyled = (mb: mapboxgl.Map, fn: () => void) => {
  if (mb.isStyleLoaded()) fn();
  else mb.once('load', fn);
};

export class MapCompat extends Emitter {
  mb: mapboxgl.Map;
  private pending: { center?: [number, number]; zoom?: number } | null = null;
  private el: HTMLElement;

  constructor(el: HTMLElement, opts: { center?: LatLngLike; zoom?: number } = {}) {
    super();
    this.el = el;
    mapboxgl.accessToken = TOKEN || '';
    this.mb = new mapboxgl.Map({
      container: el,
      style: STYLE,
      config: { basemap: BASEMAP },
      center: opts.center ? toLngLat(opts.center) : [2.3522, 48.8566],
      zoom: toMbZoom(opts.zoom ?? 14),
      language: uiLang(),
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
    });
    this.mb.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');
    this.mb.touchZoomRotate.disableRotation();
    this.mb.on('move', () => this.emit('center_changed'));
    this.mb.on('zoom', () => this.emit('zoom_changed'));
    this.mb.on('moveend', () => this.emit('idle'));
    this.mb.on('click', () => this.emit('click'));
    // The app lays out after the map is created (100dvh, sheets); keep the canvas in sync.
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => this.mb.resize()).observe(el);
    lastMap = this;
  }

  private flush = () => {
    const p = this.pending;
    this.pending = null;
    if (!p) return;
    this.mb.easeTo({ ...(p.center ? { center: p.center } : {}), ...(p.zoom != null ? { zoom: p.zoom } : {}), duration: 600, essential: true });
  };
  private schedule(patch: { center?: [number, number]; zoom?: number }) {
    // panTo() + setZoom() back-to-back become one smooth camera move.
    const first = !this.pending;
    this.pending = { ...(this.pending || {}), ...patch };
    if (first) queueMicrotask(this.flush);
  }

  panTo(p: LatLngLike) { this.schedule({ center: toLngLat(p) }); }
  setCenter(p: LatLngLike) { this.mb.jumpTo({ center: toLngLat(p) }); }
  setZoom(z: number) { this.schedule({ zoom: toMbZoom(z) }); }
  getZoom() { return fromMbZoom(this.pending?.zoom ?? this.mb.getZoom()); }
  getCenter() {
    if (this.pending?.center) return new LatLng(this.pending.center[1], this.pending.center[0]);
    const c = this.mb.getCenter();
    return new LatLng(c.lat, c.lng);
  }
  panBy(x: number, y: number) { this.mb.panBy([x, y], { duration: 300 }); }
  fitBounds(b: LatLngBounds, padding?: number | mapboxgl.PaddingOptions) {
    const box = b.toMapbox();
    if (!box) return;
    // The bottom sheet covers ~40% of the screen on route screens; keep stops above it.
    const h = this.el.clientHeight || window.innerHeight;
    const pad = padding ?? { top: 110, left: 40, right: 40, bottom: Math.min(420, Math.round(h * 0.42)) };
    this.mb.fitBounds(box, { padding: pad, maxZoom: toMbZoom(18), duration: 700 });
  }
  getDiv() { return this.el; }
  resize() { this.mb.resize(); }
  setLanguage(lang: string) {
    try { this.mb.setLanguage(lang); } catch { /* style not ready */ }
  }
  setOptions(_opts: unknown) { /* Google-only styling options are intentionally ignored */ }
}

// ---------------------------------------------------------------- markers & overlays

const SymbolPath = { CIRCLE: 0 };

interface MarkerIcon { path?: number; scale?: number; fillColor?: string; fillOpacity?: number; strokeColor?: string; strokeWeight?: number }
interface MarkerOptions {
  position: LatLngLike;
  map?: MapCompat | null;
  icon?: MarkerIcon;
  label?: { text: string; color?: string; fontSize?: string } | string;
  title?: string;
  zIndex?: number;
  clickable?: boolean;
}

export class Marker extends Emitter {
  private mk: mapboxgl.Marker;
  private pos: LatLng;
  constructor(opts: MarkerOptions) {
    super();
    this.pos = new LatLng(toPlain(opts.position).lat, toPlain(opts.position).lng);
    const wrap = document.createElement('div');
    const dot = document.createElement('div');
    const icon = opts.icon || {};
    const r = icon.scale ?? 10;
    const label = typeof opts.label === 'string' ? { text: opts.label } : opts.label;
    Object.assign(dot.style, {
      width: `${r * 2}px`,
      height: `${r * 2}px`,
      borderRadius: '50%',
      boxSizing: 'border-box',
      display: 'grid',
      placeItems: 'center',
      background: icon.fillColor || PALETTE.primary,
      opacity: String(icon.fillOpacity ?? 1),
      border: icon.strokeWeight ? `${icon.strokeWeight}px solid ${icon.strokeColor || '#fff'}` : 'none',
      boxShadow: icon.fillOpacity != null && icon.fillOpacity < 0.5 ? 'none' : '0 3px 8px rgba(38, 30, 54, 0.28)',
      color: label?.color || '#fff',
      fontSize: label?.fontSize || '11px',
      fontWeight: '700',
      fontFamily: "'Noto Sans Hebrew', sans-serif",
      cursor: opts.clickable === false ? 'default' : 'pointer',
      pointerEvents: opts.clickable === false ? 'none' : 'auto',
    } as CSSStyleDeclaration);
    if (label?.text) dot.textContent = label.text;
    if (opts.title) dot.title = opts.title;
    wrap.appendChild(dot);
    if (opts.zIndex != null) wrap.style.zIndex = String(opts.zIndex);
    dot.addEventListener('click', e => {
      e.stopPropagation();
      this.emit('click');
    });
    this.mk = new mapboxgl.Marker({ element: wrap }).setLngLat(toLngLat(this.pos));
    if (opts.map) this.setMap(opts.map);
  }
  setMap(map: MapCompat | null) {
    if (map) this.mk.addTo(map.mb);
    else this.mk.remove();
  }
  getPosition() { return this.pos; }
  setPosition(p: LatLngLike) {
    const { lat, lng } = toPlain(p);
    this.pos = new LatLng(lat, lng);
    this.mk.setLngLat([lng, lat]);
  }
  setVisible(v: boolean) { this.mk.getElement().style.display = v ? '' : 'none'; }
}

export class InfoWindow extends Emitter {
  private popup: mapboxgl.Popup;
  private content: string;
  constructor(opts: { content?: string } = {}) {
    super();
    this.content = opts.content || '';
    this.popup = new mapboxgl.Popup({ closeButton: false, offset: 18, maxWidth: '260px', className: 'urb-popup' });
  }
  setContent(html: string) { this.content = html; }
  open(map: MapCompat, anchor?: Marker) {
    const at = anchor ? anchor.getPosition() : map.getCenter();
    this.popup.setLngLat(toLngLat(at)).setHTML(this.content).addTo(map.mb);
    setTimeout(() => this.emit('domready'), 0);
  }
  close() { this.popup.remove(); }
}

let overlaySeq = 0;

const circleFeature = (c: LatLngLike, radiusM: number, steps = 72): GeoJSON.Feature<GeoJSON.Polygon> => {
  const { lat, lng } = toPlain(c);
  const dLat = radiusM / 111320;
  const dLng = radiusM / (111320 * Math.cos((lat * Math.PI) / 180));
  const ring: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * 2 * Math.PI;
    ring.push([lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)]);
  }
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } };
};

export class Circle extends Emitter {
  private id = `urb-circle-${++overlaySeq}`;
  private map: MapCompat | null = null;
  private center: LatLngLike;
  private radius: number;
  private opts: { strokeColor?: string; strokeOpacity?: number; strokeWeight?: number; fillColor?: string; fillOpacity?: number };
  constructor(opts: { map?: MapCompat; center: LatLngLike; radius: number; strokeColor?: string; strokeOpacity?: number; strokeWeight?: number; fillColor?: string; fillOpacity?: number }) {
    super();
    this.center = opts.center;
    this.radius = opts.radius;
    this.opts = opts;
    if (opts.map) this.setMap(opts.map);
  }
  private data() { return circleFeature(this.center, this.radius); }
  private update() {
    const src = this.map?.mb.getSource(this.id) as mapboxgl.GeoJSONSource | undefined;
    src?.setData(this.data());
  }
  setMap(map: MapCompat | null) {
    if (this.map) {
      const mb = this.map.mb;
      [`${this.id}-fill`, `${this.id}-line`].forEach(l => mb.getLayer(l) && mb.removeLayer(l));
      if (mb.getSource(this.id)) mb.removeSource(this.id);
    }
    this.map = map;
    if (!map) return;
    whenStyled(map.mb, () => {
      if (this.map !== map || map.mb.getSource(this.id)) return;
      map.mb.addSource(this.id, { type: 'geojson', data: this.data() });
      map.mb.addLayer({ id: `${this.id}-fill`, type: 'fill', source: this.id, slot: 'middle', paint: { 'fill-color': this.opts.fillColor || PALETTE.primary, 'fill-opacity': this.opts.fillOpacity ?? 0.12 } });
      map.mb.addLayer({ id: `${this.id}-line`, type: 'line', source: this.id, slot: 'middle', paint: { 'line-color': this.opts.strokeColor || PALETTE.primary, 'line-width': this.opts.strokeWeight ?? 2, 'line-opacity': this.opts.strokeOpacity ?? 0.8 } });
    });
  }
  setCenter(c: LatLngLike) { this.center = c; this.update(); }
  setRadius(r: number) { this.radius = r; this.update(); }
  getRadius() { return this.radius; }
  getCenter() { const p = toPlain(this.center); return new LatLng(p.lat, p.lng); }
}

// ---------------------------------------------------------------- directions

const formatDistance = (m: number) => {
  const he = uiLang() === 'he';
  return m >= 1000 ? `${(m / 1000).toFixed(1)} ${he ? 'ק"מ' : 'km'}` : `${Math.round(m / 10) * 10} ${he ? "מ'" : 'm'}`;
};
const formatDuration = (s: number) => {
  const mins = Math.max(1, Math.round(s / 60));
  return uiLang() === 'he' ? `${mins} דק'` : `${mins} min`;
};

/** Google-polyline decoder, for directions cached by the old Google implementation. */
const decodePolyline = (str: string): [number, number][] => {
  const out: [number, number][] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < str.length) {
    for (const which of [0, 1]) {
      let shift = 0, result = 0, b;
      do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (which === 0) lat += delta; else lng += delta;
    }
    out.push([lng / 1e5, lat / 1e5]);
  }
  return out;
};

const routeCoordinates = (res: any): [number, number][] => {
  const r = res?.routes?.[0];
  if (!r) return [];
  if (r.geometry?.coordinates) return r.geometry.coordinates;
  if (Array.isArray(r.overview_path)) return r.overview_path.map((p: any) => toLngLat(p));
  const enc = typeof r.overview_polyline === 'string' ? r.overview_polyline : r.overview_polyline?.points;
  return enc ? decodePolyline(enc) : [];
};

export class DirectionsRenderer {
  private id = `urb-route-${++overlaySeq}`;
  private map: MapCompat | null = null;
  private color: string;
  private width: number;
  private opacity: number;
  private coords: [number, number][] = [];
  constructor(opts: { map?: MapCompat; polylineOptions?: { strokeColor?: string; strokeWeight?: number; strokeOpacity?: number } } = {}) {
    this.color = opts.polylineOptions?.strokeColor || PALETTE.primary;
    this.width = opts.polylineOptions?.strokeWeight ?? 4;
    this.opacity = opts.polylineOptions?.strokeOpacity ?? 0.9;
    if (opts.map) this.setMap(opts.map);
  }
  private data(): GeoJSON.Feature<GeoJSON.LineString> {
    return { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: this.coords } };
  }
  setMap(map: MapCompat | null) {
    this.map = map;
    if (!map) return;
    whenStyled(map.mb, () => {
      if (map.mb.getSource(this.id)) return;
      map.mb.addSource(this.id, { type: 'geojson', data: this.data() });
      map.mb.addLayer({ id: `${this.id}-casing`, type: 'line', source: this.id, slot: 'top', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#FFFFFF', 'line-width': this.width + 4, 'line-opacity': 0.85, 'line-emissive-strength': 1 } });
      map.mb.addLayer({ id: `${this.id}-line`, type: 'line', source: this.id, slot: 'top', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': this.color, 'line-width': this.width, 'line-opacity': this.opacity, 'line-emissive-strength': 1 } });
    });
  }
  setDirections(res: any) {
    this.coords = routeCoordinates(res);
    const src = this.map?.mb.getSource(this.id) as mapboxgl.GeoJSONSource | undefined;
    if (src) src.setData(this.data());
    else if (this.map) whenStyled(this.map.mb, () => (this.map?.mb.getSource(this.id) as mapboxgl.GeoJSONSource | undefined)?.setData(this.data()));
  }
}

const DIRECTIONS_CACHE = 'urbanito-walk-directions-v1';
const readDirCache = (): Record<string, any> => {
  try { return JSON.parse(localStorage.getItem(DIRECTIONS_CACHE) || '{}'); } catch { return {}; }
};
const writeDirCache = (key: string, value: any) => {
  try {
    const all = readDirCache();
    all[key] = value;
    const keys = Object.keys(all);
    if (keys.length > 60) keys.slice(0, keys.length - 60).forEach(k => delete all[k]);
    localStorage.setItem(DIRECTIONS_CACHE, JSON.stringify(all));
  } catch { /* storage full */ }
};

export class DirectionsService {
  async route(req: { origin: LatLngLike; destination: LatLngLike; waypoints?: { location: LatLngLike }[] }, cb?: (res: any, status: string) => void) {
    const pts = [req.origin, ...(req.waypoints || []).map(w => w.location), req.destination].map(toLngLat).slice(0, 25);
    const key = pts.map(([x, y]) => `${x.toFixed(5)},${y.toFixed(5)}`).join(';');
    let res = readDirCache()[key];
    if (!res) {
      try {
        const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${key}?geometries=geojson&overview=full&access_token=${TOKEN}`;
        const data = await (await fetch(url)).json();
        if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error(data.message || data.code);
        const r = data.routes[0];
        res = {
          routes: [{
            geometry: r.geometry,
            legs: r.legs.map((l: any) => ({
              distance: { value: l.distance, text: formatDistance(l.distance) },
              duration: { value: l.duration, text: formatDuration(l.duration) },
            })),
          }],
          provider: 'mapbox',
        };
        writeDirCache(key, res);
      } catch (e) {
        console.warn('[map] walking directions failed', e);
        cb?.(null, 'ERROR');
        return { routes: [] };
      }
    }
    cb?.(res, 'OK');
    return res;
  }
}

/** Walking estimates are computed locally (no paid matrix calls). */
export class DistanceMatrixService {
  getDistanceMatrix(req: { origins: LatLngLike[]; destinations: LatLngLike[] }, cb: (res: any, status: string) => void) {
    const rows = req.origins.map(o => ({
      elements: req.destinations.map(d => {
        const m = haversine(o, d) * 1.25;
        return { status: 'OK', distance: { value: m, text: formatDistance(m) }, duration: { value: m / 1.33, text: formatDuration(m / 1.33) } };
      }),
    }));
    setTimeout(() => cb({ rows }, 'OK'), 0);
  }
}

// ---------------------------------------------------------------- geocoding

interface GoogleLikeResult {
  geometry: { location: LatLng };
  formatted_address: string;
  name: string;
  types: string[];
  address_components: { long_name: string; short_name: string; types: string[] }[];
}

const FEATURE_TYPES: Record<string, string[]> = {
  address: ['street_address'],
  street: ['route'],
  neighborhood: ['neighborhood'],
  locality: ['sublocality'],
  place: ['locality', 'political'],
  district: ['administrative_area_level_2'],
  region: ['administrative_area_level_1', 'political'],
  country: ['country', 'political'],
  postcode: ['postal_code'],
};

const toGoogleResult = (f: any): GoogleLikeResult => {
  const p = f.properties || {};
  const ctx = p.context || {};
  const comps: GoogleLikeResult['address_components'] = [];
  const add = (name: string | undefined, types: string[]) => name && comps.push({ long_name: name, short_name: name, types });
  add(ctx.address?.address_number, ['street_number']);
  add(ctx.street?.name || ctx.address?.street_name, ['route']);
  add(ctx.neighborhood?.name, ['neighborhood']);
  add(ctx.locality?.name, ['sublocality']);
  add(ctx.place?.name, ['locality', 'political']);
  add(ctx.district?.name, ['administrative_area_level_2']);
  add(ctx.region?.name, ['administrative_area_level_1', 'political']);
  add(ctx.country?.name, ['country', 'political']);
  if (!comps.length) add(p.name, FEATURE_TYPES[p.feature_type] || []);
  const c = p.coordinates || {};
  return {
    geometry: { location: new LatLng(c.latitude ?? f.geometry?.coordinates?.[1], c.longitude ?? f.geometry?.coordinates?.[0]) },
    formatted_address: p.full_address || [p.name, p.place_formatted].filter(Boolean).join(', '),
    name: p.name || '',
    types: FEATURE_TYPES[p.feature_type] || [p.feature_type],
    address_components: comps,
  };
};

const geocodeApi = async (path: 'forward' | 'reverse', params: Record<string, string>) => {
  const qs = new URLSearchParams({ ...params, language: uiLang(), access_token: TOKEN || '' });
  const data = await (await fetch(`https://api.mapbox.com/search/geocode/v6/${path}?${qs}`)).json();
  return (data.features || []).map(toGoogleResult) as GoogleLikeResult[];
};

const proximity = () => {
  const c = lastMap?.mb.getCenter();
  return c ? `${c.lng.toFixed(4)},${c.lat.toFixed(4)}` : 'ip';
};

export class Geocoder {
  async geocode(req: { address?: string; location?: LatLngLike }, cb?: (results: GoogleLikeResult[], status: string) => void) {
    let results: GoogleLikeResult[] = [];
    let status = 'OK';
    try {
      if (req.location) {
        const { lat, lng } = toPlain(req.location);
        results = await geocodeApi('reverse', { longitude: String(lng), latitude: String(lat) });
      } else if (req.address) {
        results = await geocodeApi('forward', { q: req.address, limit: '5', proximity: proximity() });
      }
      if (!results.length) status = 'ZERO_RESULTS';
    } catch (e) {
      console.warn('[map] geocoding failed', e);
      status = 'ERROR';
    }
    cb?.(results, status);
    // Never reject: callers use both callback and await styles and check `results[0]`.
    return { results };
  }
}

// ---------------------------------------------------------------- places autocomplete

/** Search-as-you-type suggestions under an input (Mapbox geocoding with autocomplete). */
export class Autocomplete extends Emitter {
  private input: HTMLInputElement;
  private list: HTMLDivElement;
  private items: GoogleLikeResult[] = [];
  private place: GoogleLikeResult | null = null;
  private timer = 0;
  private seq = 0;

  constructor(input: HTMLInputElement) {
    super();
    this.input = input;
    this.list = document.createElement('div');
    this.list.className = 'urb-suggest';
    this.list.setAttribute('role', 'listbox');
    document.body.appendChild(this.list);
    input.setAttribute('autocomplete', 'off');
    input.addEventListener('input', () => {
      window.clearTimeout(this.timer);
      this.timer = window.setTimeout(() => this.search(), 250);
    });
    input.addEventListener('blur', () => window.setTimeout(() => this.hide(), 150));
    input.addEventListener('keydown', e => { if (e.key === 'Escape') this.hide(); });
    window.addEventListener('resize', () => this.position());
  }
  bindTo(_key: string, _map: MapCompat) { /* proximity always follows the active map */ }
  getPlace() { return this.place || ({} as any); }

  private async search() {
    const q = this.input.value.trim();
    if (q.length < 2) return this.hide();
    const id = ++this.seq;
    try {
      const results = await geocodeApi('forward', { q, limit: '5', autocomplete: 'true', proximity: proximity() });
      if (id !== this.seq) return;
      this.items = results;
      this.render();
    } catch {
      this.hide();
    }
  }
  private position() {
    const r = this.input.closest('div')?.getBoundingClientRect() || this.input.getBoundingClientRect();
    Object.assign(this.list.style, { top: `${r.bottom + 8}px`, left: `${r.left}px`, width: `${r.width}px` });
  }
  private render() {
    this.list.innerHTML = '';
    if (!this.items.length) return this.hide();
    this.items.forEach(item => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'urb-suggest-row';
      const title = document.createElement('strong');
      title.textContent = item.name || item.formatted_address;
      const sub = document.createElement('small');
      sub.textContent = item.formatted_address.replace(`${item.name}, `, '');
      row.append(title, sub);
      row.addEventListener('pointerdown', e => {
        e.preventDefault();
        this.place = item;
        this.input.value = item.formatted_address;
        this.hide();
        this.emit('place_changed');
      });
      this.list.appendChild(row);
    });
    this.position();
    this.list.style.display = 'block';
  }
  private hide() { this.list.style.display = 'none'; }
}

// ---------------------------------------------------------------- install

const event = {
  addListener: (obj: Emitter, evt: string, fn: Handler) => obj.addListener(evt, fn),
  addListenerOnce: (obj: Emitter, evt: string, fn: Handler) => {
    const h = obj.addListener(evt, (...a: any[]) => { h.remove(); fn(...a); });
    return h;
  },
  removeListener: (h?: ListenerHandle) => h?.remove(),
  trigger: (obj: any, evt: string) => {
    if (evt === 'resize' && typeof obj?.resize === 'function') obj.resize();
    else obj?.emit?.(evt);
  },
};

export const installMapboxGoogleCompat = () => {
  if (!TOKEN) {
    console.error('[map] VITE_MAPBOX_TOKEN is missing — the map will not render.');
    return;
  }
  (window as any).google = {
    maps: {
      Map: MapCompat,
      Marker,
      InfoWindow,
      Circle,
      LatLng,
      LatLngBounds,
      DirectionsRenderer,
      DirectionsService,
      DistanceMatrixService,
      Geocoder,
      SymbolPath,
      TravelMode: { WALKING: 'WALKING', DRIVING: 'DRIVING' },
      places: { Autocomplete },
      event,
      geometry: { spherical: { computeDistanceBetween: haversine } },
    },
  };
};
