import { API_ENDPOINTS } from '../const';

/** Absolute image URL, or API-relative path resolved with API_ENDPOINTS. */
export function resolvePlayerImageUrl(src) {
  if (!src) return null;
  const s = String(src).trim();
  if (!s) return null;
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  return `${API_ENDPOINTS}/${s.replace(/^\/+/, '')}`;
}
