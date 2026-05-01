/**
 * CPL “allowed” grounds — single source of truth for OCR / venue picker.
 * Aligns names so “West ovel”, “WEST OVAL”, etc. map to one canonical string.
 */

export const CPL_VENUES_BY_REGION = {
  Australia: [
    'Adelaide Oval',
    'Blundstone Arena',
    'Doclands Stadium',
    'The Gabba',
    'MCG',
    'Perth Stadium',
    'Sydney Cricket Ground',
    'Sydney Show Grounds',
    'The WACA',
    'Manuka Oval',
  ],
  England: [
    'Edgbaston',
    'Emerald Headingley',
    'Kia Oval',
    "Lord's",
    'Ageas Bowl',
    'Sophia Gardens',
    'Trent Bridge',
    'Emirates Old Trafford',
  ],
  Others: [
    'Cape Town Stadium',
    'Colombo Park Oval',
    'Delhi Park',
    'Dhaka Stadium',
    'Dubai Cricket Ground',
    'Durban Fields',
    'Kolkata Park',
    'Lahore Cricket Club',
    'West Oval',
  ],
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
  k = k.replace(/kolakata/g, 'kolkata');
  k = k.replace(/kolkota/g, 'kolkata');
  k = k.replace(/emirt/g, 'emirates');
  k = k.replace(/doclands/g, 'doclands');
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
