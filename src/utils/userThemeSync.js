/** Normalise squad hex from API / localStorage (#rrggbb only). */
export function normalizeThemeHex(value) {
  return /^#[0-9a-f]{6}$/i.test(String(value || '').trim())
    ? String(value).trim()
    : null;
}

function squadHexToRgba(hex, alpha) {
  const n = normalizeThemeHex(hex);
  if (!n) return null;
  const r = parseInt(n.slice(1, 3), 16);
  const g = parseInt(n.slice(3, 5), 16);
  const b = parseInt(n.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Squad tint overlays on top of App.css shell gradients (logged-in routes only). */
export function applyUserThemeToDocument(primary, secondary) {
  const root = document.documentElement;
  const top = squadHexToRgba(primary, 0.38);
  const bottom = squadHexToRgba(secondary || primary, 0.28);

  if (!top && !bottom) {
    root.style.removeProperty('--app-theme-radial-top');
    root.style.removeProperty('--app-theme-radial-bottom');
    root.removeAttribute('data-app-squad-theme');
    return;
  }

  if (top) root.style.setProperty('--app-theme-radial-top', top);
  else root.style.removeProperty('--app-theme-radial-top');

  if (bottom) root.style.setProperty('--app-theme-radial-bottom', bottom);
  else root.style.removeProperty('--app-theme-radial-bottom');

  root.setAttribute('data-app-squad-theme', '');
}

export function clearUserThemeFromDocument() {
  const root = document.documentElement;
  root.style.removeProperty('--app-theme-radial-top');
  root.style.removeProperty('--app-theme-radial-bottom');
  root.removeAttribute('data-app-squad-theme');
}
