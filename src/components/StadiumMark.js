import React from 'react';

const MARKS = {
  'Adelaide Oval': { code: 'AO', a: '#9f1239', b: '#fde68a' },
  'The Gabba': { code: 'GAB', a: '#7f1d1d', b: '#fbbf24' },
  'Melbourne Cricket Ground (MCG)': { code: 'MCG', a: '#0f2744', b: '#eab308' },
  'Perth Stadium': { code: 'PER', a: '#5b21b6', b: '#fdba74' },
  'Sydney Cricket Ground (SCG)': { code: 'SCG', a: '#14532d', b: '#fde68a' },
  'Docklands Stadium': { code: 'DOC', a: '#0e4a6b', b: '#67e8f9' },
  'GMHBA Stadium': { code: 'GMH', a: '#1d4ed8', b: '#dbeafe' },
  'Sydney Showground Stadium': { code: 'SSS', a: '#9a3412', b: '#fed7aa' },
  'The WACA': { code: 'WAC', a: '#166534', b: '#facc15' },
  Edgbaston: { code: 'EDG', a: '#1e3a8a', b: '#fecaca' },
  'Emirates Old Trafford': { code: 'EOT', a: '#991b1b', b: '#fee2e2' },
  Headingley: { code: 'HEA', a: '#14532d', b: '#ecfccb' },
  'Kia Oval': { code: 'KIA', a: '#064e3b', b: '#fde68a' },
  "Lord's": { code: 'LOR', a: '#0f172a', b: '#f5d78e' },
  'Utilita Bowl, Southampton': { code: 'UTI', a: '#075985', b: '#e0f2fe' },
  'Trent Bridge': { code: 'TRB', a: '#166534', b: '#fef3c7' },
  'Narendra Modi Stadium': { code: 'NMS', a: '#1e40af', b: '#fdba74' },
  'Ekana Cricket Stadium': { code: 'EKA', a: '#15803d', b: '#fef08a' },
  'Johannesburg Stadium': { code: 'JHB', a: '#14532d', b: '#fbbf24' },
};

function fallbackCode(name) {
  const parts = String(name || '')
    .replace(/[()]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !/^(the|of|stadium|ground|oval|park)$/i.test(w));
  const code = parts.slice(0, 3).map((w) => w[0]).join('').toUpperCase();
  return code || 'VEN';
}

export function stadiumMarkFor(name) {
  if (MARKS[name]) return MARKS[name];
  return { code: fallbackCode(name), a: '#1e3a5f', b: '#e2e8f0' };
}

export default function StadiumMark({ name, size = 40 }) {
  const mark = stadiumMarkFor(name);
  return (
    <span
      className="stadium-mark"
      style={{ width: size, height: size, background: mark.a, color: mark.b }}
      aria-hidden
    >
      <svg className="stadium-mark-svg" viewBox="0 0 48 48" focusable="false">
        <path
          d="M8 30c0-9 7-16 16-16s16 7 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M14 30c0-5.5 4.5-10 10-10s10 4.5 10 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          opacity="0.75"
        />
        <path d="M10 30h28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 34h16M20 37.5h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
      </svg>
      <span className="stadium-mark-code">{mark.code}</span>
    </span>
  );
}
