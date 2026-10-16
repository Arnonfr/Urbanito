/**
 * Open-data route engine — builds walking routes with ZERO paid API calls.
 *
 * Sources (all free, CORS-enabled, no API key):
 *  - Wikipedia geosearch: real, geotagged places near the start point (+ image, article size)
 *  - Wikidata: what each place is (museum / synagogue / event...) and hard facts
 *    (year built, architect, style, heritage status, official site)
 *  - Wikipedia extracts: summaries now, full article content lazily when a stop is opened
 *
 * Ordering and walking distances are computed locally (nearest-neighbour + 2-opt,
 * haversine), so no Directions / Distance Matrix calls are needed either.
 *
 * Returns null when open data can't produce a good route — callers then fall back to Gemini.
 */
import type { UserPreferences, Route, POI, POICategoryType, POISection } from '../types';

type Lang = 'he' | 'en';
interface LatLng { lat: number; lng: number }

interface Candidate {
  qid: string;
  lat: number;
  lng: number;
  titles: Partial<Record<Lang, string>>;
  articleLength: number;
  thumbnail?: string;
  category: POICategoryType;
  primaryClass: string;
  typeScore: number;
  isReligious: boolean;
  isJewish: boolean;
  facts: PoiFacts;
  score: number;
}

export interface PoiFacts {
  inception?: string;
  architects?: string[];
  styles?: string[];
  heritage?: string[];
  website?: string;
  instanceOf?: string[];
}

const UA_HEADERS = { 'Api-User-Agent': 'Urbanito/1.0 (urban walking guide)' };
const WALK_FACTOR = 1.25;        // streets are not straight lines
const WALK_SPEED_M_PER_MIN = 80; // ~4.8 km/h
const MINUTES_PER_STOP = 12;
const MIN_SPACING_M = 60;

// ---------------------------------------------------------------- geometry

export const haversineMeters = (a: LatLng, b: LatLng) => {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const pathLength = (start: LatLng, pts: LatLng[]) => {
  let total = 0;
  let prev = start;
  for (const p of pts) { total += haversineMeters(prev, p); prev = p; }
  return total;
};

/** Open path from a fixed start: nearest neighbour, then 2-opt until no improvement. */
export const orderStops = <T extends LatLng>(start: LatLng, pts: T[]): T[] => {
  const remaining = [...pts];
  const ordered: T[] = [];
  let cur: LatLng = start;
  while (remaining.length) {
    let best = 0;
    for (let i = 1; i < remaining.length; i++) {
      if (haversineMeters(cur, remaining[i]) < haversineMeters(cur, remaining[best])) best = i;
    }
    cur = remaining[best];
    ordered.push(remaining.splice(best, 1)[0]);
  }
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < ordered.length - 1; i++) {
      for (let j = i + 1; j < ordered.length; j++) {
        const candidate = [...ordered.slice(0, i), ...ordered.slice(i, j + 1).reverse(), ...ordered.slice(j + 1)];
        if (pathLength(start, candidate) + 0.5 < pathLength(start, ordered)) {
          ordered.splice(0, ordered.length, ...candidate);
          improved = true;
        }
      }
    }
  }
  return ordered;
};

export const formatWalk = (meters: number, lang: Lang) => {
  const walked = meters * WALK_FACTOR;
  const mins = Math.max(1, Math.round(walked / WALK_SPEED_M_PER_MIN));
  const distance = walked >= 1000 ? `${(walked / 1000).toFixed(1)} ${lang === 'he' ? 'ק"מ' : 'km'}` : `${Math.round(walked / 10) * 10} ${lang === 'he' ? "מ'" : 'm'}`;
  return { distance, duration: lang === 'he' ? `${mins} דק'` : `${mins} min` };
};

// ---------------------------------------------------------------- classification

// Matched against the English label of the Wikidata "instance of" (P31) classes.
const TYPE_RULES: { re: RegExp; category: POICategoryType; score: number; religious?: boolean }[] = [
  { re: /synagogue/, category: 'religion', score: 0.8, religious: true },
  { re: /cathedral|basilica|church|chapel|mosque|temple|monastery|abbey|convent|shrine|minaret/, category: 'religion', score: 0.8, religious: true },
  { re: /museum/, category: 'culture', score: 1 },
  { re: /theatre|theater|opera|concert hall|cinema|library|cultural (center|centre)|arts? (center|centre)/, category: 'culture', score: 0.85 },
  { re: /art gallery|gallery/, category: 'art', score: 0.85 },
  { re: /sculpture|statue|mural|mosaic|artwork|public art|work of art|graffiti|fountain/, category: 'art', score: 0.85 },
  { re: /market|food hall|bazaar|souk|shuk/, category: 'food', score: 0.85 },
  { re: /restaurant|caf[eé]|coffeehouse|bakery|brewery|pub\b|bar\b|tavern/, category: 'food', score: 0.6 },
  { re: /memorial|monument|archaeological|castle|fortress|fortification|\bfort\b|ruins|city gate|city wall|gate|tomb|mausoleum|cemetery|historic site|battlefield|tower house/, category: 'history', score: 1 },
  { re: /palace|mansion|villa|townhouse|hôtel particulier|house|building|tower|skyscraper|city hall|town hall|bridge|lighthouse|arcade|covered passage|clock tower|hall|structure|edifice|courthouse|bathhouse|hammam|water tower|well/, category: 'architecture', score: 0.8 },
  { re: /square|plaza|piazza|boulevard|promenade|esplanade/, category: 'architecture', score: 0.7 },
  { re: /park|garden|beach|zoo|botanical|nature reserve|viewpoint|observation|island|pond|lake|spring/, category: 'nature', score: 0.75 },
  { re: /shopping|department store|passage|mall/, category: 'shopping', score: 0.5 },
  { re: /street|avenue|road|alley|lane/, category: 'architecture', score: 0.45 },
  { re: /university|college|school|hospital|hotel|station/, category: 'architecture', score: 0.4 },
];

// Geotagged articles that are not places you can visit.
const EXCLUDE_RE = /\bhuman\b|\bevent\b|battle|siege|\bwar\b|riot|\bfire$|disaster|attack|massacre|shooting|fusillade|bombing|explosion|robbery|heist|theft|crime|murder|assassination|pogrom|incident|accident|\bfilm\b|\bbook\b|novel|album|company|business|enterprise|organi[sz]ation|political party|association|sports (club|team)|newspaper|magazine|record label|website|^ship$|aircraft|neighbo(u)?rhood|^quarter$|district|arrondissement|urban (area|ensemble)|^(city|big city|capital|commune|municipality|town|village|human settlement)$|administrative|metro station|subway station|tram stop|bus station|bus stop|embassy|consulate|ministry|government agency|^bank$|insurance|demonstration|protest|election|treaty|occupation|uprising/;

// Interests (Hebrew + English, from PreferencesPanel / themes) → categories they favour.
const INTEREST_MAP: { re: RegExp; cats: POICategoryType[] }[] = [
  { re: /היסטור|history|historic/i, cats: ['history'] },
  { re: /ארכיטקט|אדריכל|architect|modern|מודרני/i, cats: ['architecture'] },
  { re: /אמנות|art|צילום|photo/i, cats: ['art', 'culture'] },
  { re: /מוזיק|music|תרבות|culture/i, cats: ['culture'] },
  { re: /טבע|nature|romantic|רומנטי/i, cats: ['nature'] },
  { re: /דתי|religio/i, cats: ['religion'] },
  { re: /אוכל|קולינר|food|cuisine/i, cats: ['food'] },
  { re: /קניות|shopping/i, cats: ['shopping'] },
];

// Interests that encyclopedic data can't serve well — those routes go to the AI generator.
const AI_ONLY_INTEREST_RE = /אוכל|קולינר|food|cuisine|חיי לילה|nightlife|קניות|shopping/i;

export const canUseOpenData = (prefs: UserPreferences) => {
  if (prefs.customPrompt && prefs.customPrompt.trim()) return false; // free-text needs an LLM
  const interests = prefs.interests || [];
  if (interests.length === 0) return true;
  return interests.some(i => !AI_ONLY_INTEREST_RE.test(i));
};

// ---------------------------------------------------------------- HTTP helpers

const fetchWithTimeout = async (url: string, timeoutMs: number, init: RequestInit = {}) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url.split('?')[0]}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
};

const fetchJson = (url: string, timeoutMs = 15000) => fetchWithTimeout(url, timeoutMs, { headers: UA_HEADERS });

const wikiApi = (lang: Lang, params: Record<string, string | number>) => {
  const qs = new URLSearchParams({ format: 'json', formatversion: '2', origin: '*', ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) });
  return fetchJson(`https://${lang}.wikipedia.org/w/api.php?${qs}`);
};

const readCache = <T>(key: string, ttlMs: number): T | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { t, v } = JSON.parse(raw);
    return Date.now() - t < ttlMs ? v : null;
  } catch { return null; }
};
const writeCache = (key: string, v: unknown) => {
  try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), v })); } catch { /* quota / no storage */ }
};

// ---------------------------------------------------------------- candidate discovery

const geosearch = async (lang: Lang, center: LatLng, radiusM: number) => {
  const data = await wikiApi(lang, {
    action: 'query',
    generator: 'geosearch',
    ggscoord: `${center.lat}|${center.lng}`,
    ggsradius: Math.min(10000, Math.round(radiusM)),
    ggslimit: 100,
    prop: 'coordinates|pageimages|pageprops|info',
    piprop: 'thumbnail',
    pithumbsize: 800,
    pilimit: 'max',
    colimit: 'max',
    ppprop: 'wikibase_item',
  });
  return (data?.query?.pages || []) as any[];
};

interface EntityInfo {
  classesEn: string[];
  facts: PoiFacts;
  titles: Partial<Record<Lang, string>>;
}

const yearOf = (time?: string) => {
  const m = time?.match(/^([+-]?)0*(\d+)-/);
  if (!m) return undefined;
  return m[1] === '-' ? `${m[2]} BCE` : m[2];
};
const splitList = (v?: { value: string }) => (v?.value ? [...new Set(v.value.split('|').filter(Boolean))] : []);

/** One SPARQL request (~50KB) for classes, facts and he/en article titles of all candidates. */
const entityInfoSparql = async (ids: string[], lang: Lang): Promise<Map<string, EntityInfo>> => {
  const localized = (v: string, prop: string) => `OPTIONAL { ?item wdt:${prop} ?${v}E .
    OPTIONAL { ?${v}E rdfs:label ?${v}L FILTER(LANG(?${v}L) = "${lang}") }
    OPTIONAL { ?${v}E rdfs:label ?${v}N FILTER(LANG(?${v}N) = "en") }
    BIND(COALESCE(?${v}L, ?${v}N) AS ?${v}) }`;
  const query = `SELECT ?item
  (GROUP_CONCAT(DISTINCT ?clsEn; separator="|") AS ?classesEn) (GROUP_CONCAT(DISTINCT ?cls; separator="|") AS ?classes)
  (SAMPLE(?inc) AS ?inception) (SAMPLE(?web) AS ?website) (SAMPLE(?heT) AS ?he) (SAMPLE(?enT) AS ?en)
  (GROUP_CONCAT(DISTINCT ?arch; separator="|") AS ?architects) (GROUP_CONCAT(DISTINCT ?sty; separator="|") AS ?styles)
  (GROUP_CONCAT(DISTINCT ?her; separator="|") AS ?heritage)
WHERE {
  VALUES ?item { ${ids.map(i => `wd:${i}`).join(' ')} }
  OPTIONAL { ?item wdt:P31 ?clsE . ?clsE rdfs:label ?clsEn FILTER(LANG(?clsEn) = "en")
    OPTIONAL { ?clsE rdfs:label ?clsL FILTER(LANG(?clsL) = "${lang}") } BIND(COALESCE(?clsL, ?clsEn) AS ?cls) }
  ${localized('arch', 'P84')}
  ${localized('sty', 'P149')}
  ${localized('her', 'P1435')}
  OPTIONAL { ?item wdt:P571 ?inc }
  OPTIONAL { ?item wdt:P856 ?web }
  OPTIONAL { ?heA schema:about ?item; schema:isPartOf <https://he.wikipedia.org/>; schema:name ?heT }
  OPTIONAL { ?enA schema:about ?item; schema:isPartOf <https://en.wikipedia.org/>; schema:name ?enT }
} GROUP BY ?item`;
  const res = await fetchWithTimeout('https://query.wikidata.org/sparql', 15000, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/sparql-results+json' },
    body: new URLSearchParams({ query, format: 'json' }).toString(),
  });
  const out = new Map<string, EntityInfo>();
  for (const b of res?.results?.bindings || []) {
    const qid = b.item.value.split('/').pop();
    out.set(qid, {
      classesEn: splitList(b.classesEn).map(c => c.toLowerCase()),
      titles: { he: b.he?.value, en: b.en?.value },
      facts: {
        inception: yearOf(b.inception?.value),
        architects: splitList(b.architects),
        styles: splitList(b.styles),
        heritage: splitList(b.heritage),
        website: b.website?.value,
        instanceOf: splitList(b.classes).slice(0, 2),
      },
    });
  }
  return out;
};

/** Fallback when the SPARQL endpoint is down: the regular API (heavier, ~450KB per 50 items). */
const entityInfoApi = async (ids: string[], lang: Lang): Promise<Map<string, EntityInfo>> => {
  const get = async (chunkIds: string[], props: string) => {
    const out: Record<string, any> = {};
    for (let i = 0; i < chunkIds.length; i += 50) {
      const qs = new URLSearchParams({ action: 'wbgetentities', format: 'json', origin: '*', ids: chunkIds.slice(i, i + 50).join('|'), props, languages: `${lang}|en`, sitefilter: 'hewiki|enwiki' });
      Object.assign(out, (await fetchJson(`https://www.wikidata.org/w/api.php?${qs}`)).entities || {});
    }
    return out;
  };
  const claimIds = (e: any, prop: string): string[] => (e?.claims?.[prop] || []).map((c: any) => c?.mainsnak?.datavalue?.value?.id).filter(Boolean);
  const entities = await get(ids.slice(0, 50), 'claims|sitelinks');
  const refIds = new Set<string>();
  for (const e of Object.values(entities)) for (const p of ['P31', 'P84', 'P149', 'P1435']) claimIds(e, p).forEach(id => refIds.add(id));
  const refs = await get([...refIds], 'labels').catch(() => ({} as Record<string, any>));
  const label = (id: string) => refs[id]?.labels?.[lang]?.value || refs[id]?.labels?.en?.value;

  const out = new Map<string, EntityInfo>();
  for (const [qid, e] of Object.entries<any>(entities)) {
    out.set(qid, {
      classesEn: claimIds(e, 'P31').map(id => (refs[id]?.labels?.en?.value || '').toLowerCase()).filter(Boolean),
      titles: { he: e.sitelinks?.hewiki?.title, en: e.sitelinks?.enwiki?.title },
      facts: {
        inception: yearOf(e.claims?.P571?.[0]?.mainsnak?.datavalue?.value?.time),
        architects: claimIds(e, 'P84').map(label).filter(Boolean),
        styles: claimIds(e, 'P149').map(label).filter(Boolean),
        heritage: claimIds(e, 'P1435').map(label).filter(Boolean),
        website: e.claims?.P856?.[0]?.mainsnak?.datavalue?.value,
        instanceOf: claimIds(e, 'P31').map(label).filter(Boolean).slice(0, 2),
      },
    });
  }
  return out;
};

/** SPARQL is light but its latency varies (1–10s); if it's slow, race it against the regular API. */
const entityInfoFastest = async (ids: string[], lang: Lang) => {
  const sparql = entityInfoSparql(ids, lang);
  const early = await Promise.race([
    sparql.catch(() => null),
    new Promise<null>(resolve => setTimeout(() => resolve(null), 3500)),
  ]);
  if (early) return early;
  const api = entityInfoApi(ids, lang);
  // First success wins; fail only if both fail.
  return new Promise<Map<string, EntityInfo>>((resolve, reject) => {
    let failures = 0;
    const fail = (e: unknown) => { if (++failures === 2) reject(e); };
    sparql.then(resolve, fail);
    api.then(resolve, fail);
  });
};

const discoverCandidates = async (center: LatLng, radiusM: number, lang: Lang): Promise<Candidate[]> => {
  const cacheKey = `urbanito-od-v4-${lang}-${center.lat.toFixed(3)}-${center.lng.toFixed(3)}-${Math.round(radiusM / 100)}`;
  const cached = readCache<Candidate[]>(cacheKey, 1000 * 60 * 60 * 24 * 7);
  if (cached) return cached;

  // Search both the user's language and English wiki: English covers far more places abroad.
  const langs: Lang[] = lang === 'he' ? ['he', 'en'] : ['en'];
  const pageLists = await Promise.all(langs.map(l => geosearch(l, center, radiusM).catch(() => [])));

  type PageInfo = { lat: number; lng: number; titles: Partial<Record<Lang, string>>; length: number; thumbnail?: string };
  const byQid = new Map<string, PageInfo>();
  pageLists.forEach((pages, li) => {
    const l = langs[li];
    for (const p of pages) {
      const qid = p.pageprops?.wikibase_item;
      const coord = p.coordinates?.[0];
      if (!qid || !coord) continue;
      const entry: PageInfo = byQid.get(qid) || { lat: coord.lat, lng: coord.lon, titles: {}, length: 0 };
      entry.titles[l] = p.title;
      entry.length = Math.max(entry.length, p.length || 0);
      entry.thumbnail = entry.thumbnail || p.thumbnail?.source;
      byQid.set(qid, entry);
    }
  });
  if (byQid.size === 0) return [];

  // Most notable first: the long tail is rarely picked and makes the lookup slower.
  const ids = [...byQid.entries()].sort((a, b) => b[1].length - a[1].length).map(([qid]) => qid).slice(0, 60);
  const info = await entityInfoFastest(ids, lang);

  const candidates: Candidate[] = [];
  for (const [qid, page] of byQid) {
    const entity = info.get(qid);
    if (!entity || entity.classesEn.length === 0) continue;

    let best: { category: POICategoryType; score: number; religious?: boolean } | null = null;
    let primaryClass = '';
    let excluded = false;
    for (const cl of entity.classesEn) {
      // "structure fire" must not count as a structure.
      if (EXCLUDE_RE.test(cl)) { excluded = true; continue; }
      const rule = TYPE_RULES.find(r => r.re.test(cl));
      if (rule && (!best || rule.score > best.score)) { best = rule; primaryClass = cl; }
    }
    if (!best) continue;
    if (excluded && best.score < 0.8) continue;

    // Wikidata sitelinks give us the title in the other language even if geosearch missed it.
    const titles = { ...entity.titles, ...page.titles };
    const allText = `${entity.classesEn.join(' ')} ${titles.en || ''} ${titles.he || ''}`;
    candidates.push({
      qid,
      lat: page.lat,
      lng: page.lng,
      titles,
      articleLength: page.length,
      thumbnail: page.thumbnail,
      category: best.category,
      primaryClass,
      typeScore: best.score,
      isReligious: !!best.religious,
      isJewish: /synagogue|jewish|בית כנסת|יהוד/i.test(allText),
      facts: entity.facts,
      score: 0,
    });
  }

  writeCache(cacheKey, candidates);
  return candidates;
};

// ---------------------------------------------------------------- scoring & selection

const scoreCandidates = (cands: Candidate[], prefs: UserPreferences, lang: Lang, start: LatLng, radiusM: number) => {
  const wanted = new Set<POICategoryType>();
  for (const interest of prefs.interests || []) {
    for (const m of INTEREST_MAP) if (m.re.test(interest)) m.cats.forEach(c => wanted.add(c));
  }
  const hidden = Math.min(1, Math.max(0, (prefs.hiddenGemsLevel ?? 30) / 100));

  return cands
    .filter(c => {
      if (!c.isReligious) return true;
      if (prefs.religiousFriendly) return true;
      if (prefs.jewishHistory && c.isJewish) return true;
      return c.articleLength > 50000; // secular icons like Notre-Dame
    })
    .map(c => {
      // Notability: log-scaled article size. "Hidden gems" users get less of a fame bonus.
      const fame = Math.min(1, Math.log10(Math.max(1000, c.articleLength)) / 5); // 1k→0.6, 100k→1
      const hasLocalArticle = c.titles[lang] ? 1 : 0;
      const factCount = [c.facts.inception, c.facts.architects?.length, c.facts.styles?.length, c.facts.heritage?.length].filter(Boolean).length;
      const proximity = 1 - Math.min(1, haversineMeters(start, c) / radiusM);
      let score =
        c.typeScore * 2 +
        fame * (1.6 - hidden) +
        hasLocalArticle * (lang === 'he' ? 1.2 : 0.4) +
        (c.thumbnail ? 0.5 : 0) +
        factCount * 0.15 +
        proximity * 0.6;
      if (wanted.has(c.category)) score += 1.2;
      if (prefs.jewishHistory && c.isJewish) score += 1.5;
      return { ...c, score };
    })
    .sort((a, b) => b.score - a.score);
};

/**
 * Greedy pick under the walking budget. Each pick lowers the appeal of more of the same
 * (four memorials in a row is a worse tour than memorial + museum + square + church).
 */
const selectStops = (ranked: Candidate[], start: LatLng, count: number, budgetM: number) => {
  const chosen: Candidate[] = [];
  const pool = ranked.slice(0, 80);
  while (chosen.length < count) {
    let pick: Candidate | null = null;
    let pickScore = -Infinity;
    for (const c of pool) {
      if (chosen.includes(c)) continue;
      if (chosen.some(x => haversineMeters(x, c) < MIN_SPACING_M)) continue;
      const sameClass = chosen.filter(x => x.primaryClass === c.primaryClass).length;
      const sameCategory = chosen.filter(x => x.category === c.category).length;
      const adjusted = c.score - sameClass * 0.9 - sameCategory * 0.35;
      if (adjusted <= pickScore) continue;
      if (pathLength(start, orderStops(start, [...chosen, c])) * WALK_FACTOR > budgetM) continue;
      pick = c;
      pickScore = adjusted;
    }
    if (!pick) break;
    chosen.push(pick);
  }
  return orderStops(start, chosen);
};

// ---------------------------------------------------------------- content

// Plain-text extracts keep empty pronunciation stubs: "The Pantheon (UK: , US: ; Latin: ...)".
const cleanExtract = (text: string) => text
  .replace(/\b(UK|US|listen)\s*:\s*[,;]?\s*/g, '')
  .replace(/\(\s*[,;]\s*/g, '(')
  .replace(/\(\s*\)\s*/g, '')
  .replace(/[ \t]{2,}/g, ' ')
  .trim();

const firstSentences = (text: string, n: number) => {
  const parts = text.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
  return parts.slice(0, n).join('').trim();
};

const fetchIntros = async (lang: Lang, titles: string[]): Promise<Record<string, string>> => {
  const out: Record<string, string> = {};
  for (let i = 0; i < titles.length; i += 20) {
    const data = await wikiApi(lang, {
      action: 'query', prop: 'extracts', exintro: 1, explaintext: 1, exlimit: 20, redirects: 1,
      titles: titles.slice(i, i + 20).join('|'),
    }).catch(() => null);
    const redirects: Record<string, string> = {};
    for (const r of data?.query?.redirects || []) redirects[r.to] = r.from;
    for (const p of data?.query?.pages || []) if (p.extract) out[redirects[p.title] || p.title] = cleanExtract(p.extract);
  }
  return out;
};

export const factsSection = (facts: PoiFacts | undefined, lang: Lang): POISection | null => {
  if (!facts) return null;
  const he = lang === 'he';
  const lines: string[] = [];
  if (facts.instanceOf?.length) lines.push(`${he ? 'סוג' : 'Type'}: ${facts.instanceOf.join(', ')}`);
  if (facts.inception) lines.push(`${he ? 'נוסד / נבנה' : 'Built / founded'}: ${facts.inception}`);
  if (facts.architects?.length) lines.push(`${he ? 'אדריכל' : 'Architect'}: ${facts.architects.join(', ')}`);
  if (facts.styles?.length) lines.push(`${he ? 'סגנון' : 'Style'}: ${facts.styles.join(', ')}`);
  if (facts.heritage?.length) lines.push(`${he ? 'מעמד מורשת' : 'Heritage status'}: ${facts.heritage.join(', ')}`);
  if (facts.website) lines.push(`${he ? 'אתר רשמי' : 'Official website'}: ${facts.website}`);
  if (lines.length === 0) return null;
  return { title: he ? 'עובדות במבט מהיר' : 'Quick facts', content: lines.join('\n') };
};

const CATEGORY_LABELS: Record<POICategoryType, { he: string; en: string }> = {
  history: { he: 'היסטוריה', en: 'History' },
  architecture: { he: 'אדריכלות', en: 'Architecture' },
  culture: { he: 'תרבות', en: 'Culture' },
  art: { he: 'אמנות', en: 'Art' },
  nature: { he: 'טבע', en: 'Nature' },
  food: { he: 'אוכל', en: 'Food' },
  religion: { he: 'מורשת', en: 'Heritage' },
  shopping: { he: 'שווקים', en: 'Markets' },
  sailing: { he: 'ים', en: 'Sea' },
};

// "Great Synagogue (Tel Aviv)" → "Great Synagogue": the city is already implied by the route.
const displayName = (title?: string) => title?.replace(/\s*\([^)]*\)\s*$/, '').trim() || undefined;

const buildPoi = (c: Candidate, lang: Lang, intro: string | undefined, introLang: Lang | undefined, prev: LatLng | null): POI => {
  const he = displayName(c.titles.he);
  const en = displayName(c.titles.en);
  const local = lang === 'he' ? (he || en!) : (en || he!);
  const name = lang === 'he' && he && en && he !== en ? `${he} (${en})` : local;
  const wikiLang: Lang = c.titles[lang] ? lang : (lang === 'he' ? 'en' : 'he');
  const wikiTitle = c.titles[wikiLang]!;
  const facts = factsSection(c.facts, lang);
  const description = intro || '';
  return {
    id: `poi-od-${c.qid}`,
    name,
    lat: c.lat,
    lng: c.lng,
    category: c.category,
    summary: description ? firstSentences(description, 2) : '',
    description,
    architecturalStyle: c.facts.styles?.join(', ') || undefined,
    imageUrl: c.thumbnail,
    sections: facts ? [facts] : [],
    sources: [
      { title: `Wikipedia (${wikiLang})`, url: `https://${wikiLang}.wikipedia.org/wiki/${encodeURIComponent(wikiTitle.replace(/ /g, '_'))}` },
      { title: 'Wikidata', url: `https://www.wikidata.org/wiki/${c.qid}` },
    ],
    externalUrl: c.facts.website,
    travelFromPrevious: prev ? formatWalk(haversineMeters(prev, c), lang) : undefined,
    isFullyLoaded: false,
    content: {
      source: 'open-data',
      wikidata: c.qid,
      wikiLang,
      wikiTitle,
      wikiTitles: c.titles,
      contentLang: introLang,
      name_he: he,
      name_en: en,
      facts: c.facts,
    },
  };
};

// ---------------------------------------------------------------- public API

export interface OpenDataRouteOptions {
  mode?: 'area' | 'street';
  streetName?: string;
}

export const buildOpenDataRoute = async (
  city: string,
  start: LatLng,
  prefs: UserPreferences,
  opts: OpenDataRouteOptions = {}
): Promise<Route | null> => {
  const lang: Lang = prefs.language === 'he' ? 'he' : 'en';
  const isStreet = opts.mode === 'street';
  const count = Math.max(2, prefs.desiredPoiCount || (isStreet ? 4 : 5));
  const budgetM = isStreet ? 1500 : Math.max(800, (prefs.walkingDistance || 3) * 1000);
  let radius = isStreet ? 350 : Math.min(4000, Math.max(500, budgetM * 0.4));

  let ranked: Candidate[] = [];
  let stops: Candidate[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    const cands = await discoverCandidates(start, radius, lang);
    ranked = scoreCandidates(cands, prefs, lang, start, radius);
    stops = selectStops(ranked, start, count, budgetM);
    if (stops.length >= count || isStreet) break;
    radius = Math.min(10000, radius * 1.8); // sparse area — look a bit wider once
  }

  const minimum = Math.max(2, Math.ceil(count * 0.6));
  if (stops.length < minimum) {
    console.log(`[openData] Only ${stops.length}/${count} stops found near ${city} — falling back to AI`);
    return null;
  }

  // Intros: target language where an article exists, the other language otherwise.
  const titlesByLang: Record<Lang, string[]> = { he: [], en: [] };
  for (const s of stops) {
    const l: Lang = s.titles[lang] ? lang : (lang === 'he' ? 'en' : 'he');
    if (s.titles[l]) titlesByLang[l].push(s.titles[l]!);
  }
  const [heIntros, enIntros] = await Promise.all([
    titlesByLang.he.length ? fetchIntros('he', titlesByLang.he) : Promise.resolve({} as Record<string, string>),
    titlesByLang.en.length ? fetchIntros('en', titlesByLang.en) : Promise.resolve({} as Record<string, string>),
  ]);

  let prev: LatLng | null = null;
  const pois = stops.map((s) => {
    const introLang: Lang | undefined = s.titles[lang] && (lang === 'he' ? heIntros : enIntros)[s.titles[lang]!] ? lang
      : s.titles.en && enIntros[s.titles.en] ? 'en'
      : s.titles.he && heIntros[s.titles.he] ? 'he' : undefined;
    const intro = introLang ? (introLang === 'he' ? heIntros : enIntros)[s.titles[introLang]!] : undefined;
    const poi = buildPoi(s, lang, intro, introLang, prev);
    prev = s;
    return poi;
  });

  // Detours: the best unused candidates close to the walked path.
  const usedIds = new Set(stops.map(s => s.qid));
  const detours = ranked
    .filter(c => !usedIds.has(c.qid) && stops.some(s => haversineMeters(s, c) < 300) && !stops.some(s => haversineMeters(s, c) < MIN_SPACING_M))
    .slice(0, 3)
    .map(c => {
      const p = buildPoi(c, lang, undefined, undefined, null);
      return { ...p, id: `poi-od-detour-${c.qid}`, summary: c.facts.instanceOf?.join(', ') || '', category: 'history' as POICategoryType };
    });

  const walkedM = pathLength(start, stops) * WALK_FACTOR;
  const he = lang === 'he';
  const topCats = [...new Set(stops.map(s => s.category))].slice(0, 2).map(c => CATEGORY_LABELS[c]?.[lang]).filter(Boolean);
  const placeName = isStreet && opts.streetName ? opts.streetName.split(',')[0].trim() : city;
  const nameOf = (p: POI) => (he ? p.content?.name_he : p.content?.name_en) || p.name;
  const name = he
    ? `${topCats.join(' ו')} ב${placeName}`
    : `${topCats.join(' & ')} in ${placeName}`;
  const highlights = pois.slice(0, 3).map(nameOf).join(he ? ', ' : ', ');
  const km = (walkedM / 1000).toFixed(1);
  const description = he
    ? `${pois.length} תחנות, כ-${km} ק"מ הליכה: ${highlights}${pois.length > 3 ? ' ועוד' : ''}. התוכן מבוסס על ויקיפדיה וויקינתונים.`
    : `${pois.length} stops, about ${km} km on foot: ${highlights}${pois.length > 3 ? ' and more' : ''}. Content based on Wikipedia and Wikidata.`;
  const teaserSource = pois.filter(p => p.content?.contentLang === lang && p.description).sort((a, b) => b.description.length - a.description.length)[0];

  return {
    id: `od-${Date.now()}`,
    city,
    name,
    description,
    shareTeaser: teaserSource ? firstSentences(teaserSource.description, 1) : '',
    durationMinutes: Math.round(walkedM / WALK_SPEED_M_PER_MIN + pois.length * MINUTES_PER_STOP),
    creator: he ? 'Urbanito · נתונים פתוחים' : 'Urbanito · Open data',
    style: isStreet ? 'street' : 'area',
    pois,
    suggested_detours: detours,
    preferences: { names: { [lang]: name }, descriptions: { [lang]: description }, source: 'open-data', distanceKm: Number(km) },
  };
};

// ---------------------------------------------------------------- lazy full content

const SKIP_SECTIONS = /^(ראו גם|לקריאה נוספת|קישורים חיצוניים|הערות שוליים|גלריה|ביבליוגרפיה|מקורות|See also|References|External links|Further reading|Notes|Gallery|Bibliography|Sources|Citations)$/i;

/**
 * Full article content for a stop (free). Returns null when the article is too thin,
 * so the caller can decide whether an AI call is worth it.
 */
export const fetchOpenDataPoiDetails = async (poi: POI, prefLang: Lang) => {
  const c = poi.content || (poi as any).data?.content;
  let wikiLang: Lang | undefined = c?.wikiLang;
  let wikiTitle: string | undefined = c?.wikiTitle;
  if (c?.wikiTitles?.[prefLang]) { wikiLang = prefLang; wikiTitle = c.wikiTitles[prefLang]; }
  if (!wikiLang || !wikiTitle) return null;

  const data = await wikiApi(wikiLang, {
    action: 'query', prop: 'extracts', explaintext: 1, exsectionformat: 'wiki', redirects: 1, titles: wikiTitle,
  }).catch(() => null);
  const text: string = cleanExtract(data?.query?.pages?.[0]?.extract || '');
  if (text.length < 400) return null;

  const chunks = text.split(/\n(={2,})\s*(.+?)\s*\1\n/);
  const intro = chunks[0].trim();
  const sections: POISection[] = [];
  let skipping = false;
  for (let i = 1; i < chunks.length; i += 3) {
    const level = chunks[i].length;
    const title = chunks[i + 1];
    const body = (chunks[i + 2] || '').trim();
    if (level === 2) {
      skipping = SKIP_SECTIONS.test(title);
      if (!skipping) sections.push({ title, content: body });
    } else if (!skipping && body && sections.length) {
      // Fold sub-sections into their parent so the card shows a few rich sections.
      const parent = sections[sections.length - 1];
      parent.content = `${parent.content}\n\n${title}\n${body}`.trim();
    }
  }
  const filled = sections.filter(sec => sec.content);
  const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, s.lastIndexOf(' ', n))}…` : s);
  let mainSections = filled.slice(0, 6).map(s => ({ ...s, content: clip(s.content, 1800) }));
  const facts = factsSection(c?.facts, prefLang);
  // Main text = the intro; a short intro absorbs the first section (which then isn't repeated below).
  let historicalAnalysis = intro;
  if (intro.length < 500 && mainSections.length) {
    historicalAnalysis = `${intro}\n\n${mainSections[0].content}`;
    mainSections = mainSections.slice(1);
  }
  historicalAnalysis = clip(historicalAnalysis, 3000);

  return {
    historicalAnalysis,
    narrative: intro,
    description: poi.description || firstSentences(intro, 3),
    sections: [...(facts ? [facts] : []), ...mainSections],
    sources: poi.sources?.length ? poi.sources : [{ title: `Wikipedia (${wikiLang})`, url: `https://${wikiLang}.wikipedia.org/wiki/${encodeURIComponent(wikiTitle.replace(/ /g, '_'))}` }],
    contentLang: wikiLang,
    isFullyLoaded: true,
  };
};
