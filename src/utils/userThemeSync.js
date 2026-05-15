/** Normalise squad hex from API / localStorage (#rrggbb only). */
export function normalizeThemeHex(value) {
  return /^#[0-9a-f]{6}$/i.test(String(value || '').trim())
    ? String(value).trim()
    : null;
}
