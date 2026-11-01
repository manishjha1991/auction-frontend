/**
 * CPL allowed stadiums — single source of truth for OCR / venue picker.
 * OCR spellings (MCG, Doclands, Ageas Bowl, …) map to these canonical names.
 */

export const CPL_VENUES_BY_REGION = {
  Australia: [
    'Adelaide Oval',
    'The Gabba',
    'Melbourne Cricket Ground (MCG)',
    'Perth Stadium',
    'Sydney Cricket Ground (SCG)',
    'Docklands Stadium',
    'GMHBA Stadium',
    'Sydney Showground Stadium',
    'The WACA',
  ],
  England: [
    'Edgbaston',
    'Emirates Old Trafford',
    'Headingley',
    'Kia Oval',
    "Lord's",
    'Utilita Bowl, Southampton',
    'Trent Bridge',
  ],
  India: [
    'Narendra Modi Stadium',
    'Ekana Cricket Stadium',
  ],
  'South Africa': [
    'Johannesburg Stadium',
  ],
};

/**
 * OCR / old labels → canonical stadium. Keys are normalizeVenueKey() output.
 * @type {Record<string, string>}
 */
const VENUE_ALIASES = {
  mcg: 'Melbourne Cricket Ground (MCG)',
  melbourmecricketground: 'Melbourne Cricket Ground (MCG)',
  melbourmecricketgroundmcg: 'Melbourne Cricket Ground (MCG)',
  scg: 'Sydney Cricket Ground (SCG)',
  sydneycricketground: 'Sydney Cricket Ground (SCG)',
  sydneycricketgroundscg: 'Sydney Cricket Ground (SCG)',
  doclands: 'Docklands Stadium',
  doclandsstadium: 'Docklands Stadium',
  docklands: 'Docklands Stadium',
  marvelstadium: 'Docklands Stadium',
  etihadstadium: 'Docklands Stadium',
  sydneyshowgrounds: 'Sydney Showground Stadium',
  sydneyshowground: 'Sydney Showground Stadium',
  showgroundstadium: 'Sydney Showground Stadium',
  gmhba: 'GMHBA Stadium',
  gmhbastadium: 'GMHBA Stadium',
  kardinia: 'GMHBA Stadium',
  kardiniapark: 'GMHBA Stadium',
  gabba: 'The Gabba',
  thegabba: 'The Gabba',
  waca: 'The WACA',
  thewaca: 'The WACA',
  optusstadium: 'Perth Stadium',
  emeraldheadingley: 'Headingley',
  headingley: 'Headingley',
  lords: "Lord's",
  lord: "Lord's",
  theoval: 'Kia Oval',
  kenningtonoval: 'Kia Oval',
  oldtrafford: 'Emirates Old Trafford',
  emiratesoldtrafford: 'Emirates Old Trafford',
  ageasbowl: 'Utilita Bowl, Southampton',
  ageasbowlsouthampton: 'Utilita Bowl, Southampton',
  rosebowl: 'Utilita Bowl, Southampton',
  utilitabowl: 'Utilita Bowl, Southampton',
  southampton: 'Utilita Bowl, Southampton',
  motera: 'Narendra Modi Stadium',
  narendramodi: 'Narendra Modi Stadium',
  ahmedabad: 'Narendra Modi Stadium',
  ekana: 'Ekana Cricket Stadium',
  lucknow: 'Ekana Cricket Stadium',
  wanderers: 'Johannesburg Stadium',
  thewanderers: 'Johannesburg Stadium',
  johannesburg: 'Johannesburg Stadium',
};

/** @type {string[]} */
export const CPL_ALLOWED_VENUES = Object.values(CPL_VENUES_BY_REGION).flat();

/** Strip punctuation & case for fuzzy compare */
export function normalizeVenueKey(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Normalise OCR / user typos before matching.
 * @param {string} raw
 */
export function normalizeForVenueMatch(raw) {
  let k = normalizeVenueKey(raw);
  k = k.replace(/ovel/g, 'oval');
  k = k.replace(/emirt/g, 'emirates');
  k = k.replace(/doclands/g, 'docklands');
  k = k.replace(/showgrounds/g, 'showground');
  return k;
}

/**
 * Map free text (OCR, fixtures) to one allowed venue label, or null.
 * @param {string} raw
 * @returns {string|null}
 */
export function suggestVenueFromOcr(raw) {
  if (!raw || String(raw).trim().length < 2) return null;
  const r = normalizeForVenueMatch(raw);
  if (r.length < 2) return null;
  if (VENUE_ALIASES[r]) return VENUE_ALIASES[r];

  for (const v of CPL_ALLOWED_VENUES) {
    if (normalizeForVenueMatch(v) === r) return v;
  }

  /** @type {{ v: string; score: number }[]} */
  const candidates = [];
  for (const v of CPL_ALLOWED_VENUES) {
    const c = normalizeForVenueMatch(v);
    if (c === r) return v;
    if (r.length >= 4 && (c.includes(r) || r.includes(c))) {
      candidates.push({ v, score: Math.min(c.length, r.length) });
    }
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.score - a.score || b.v.length - a.v.length);
  return candidates[0].v;
}

/**
 * @param {string} name
 */
export function isAllowedCplVenue(name) {
  return CPL_ALLOWED_VENUES.includes(String(name || '').trim());
}

/**
 * @param {string} raw
 * @returns {string} canonical label or '' if unknown
 */
export function coerceToAllowedVenue(raw) {
  const t = String(raw || '').trim();
  if (!t) return '';
  if (isAllowedCplVenue(t)) return t;
  const sug = suggestVenueFromOcr(t);
  if (sug) return sug;
  const lower = t.toLowerCase();
  return CPL_ALLOWED_VENUES.find((v) => v.toLowerCase() === lower) || '';
}
