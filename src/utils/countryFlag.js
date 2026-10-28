import westIndiesFlag from '../assets/west-indies-flag.svg';

const COUNTRY_CODES = {
  india: 'in',
  australia: 'au',
  england: 'gb-eng',
  'new zealand': 'nz',
  newzeland: 'nz',
  pakistan: 'pk',
  'south africa': 'za',
  'west indies': 'wi',
  westindies: 'wi',
  windies: 'wi',
  wi: 'wi',
  'sri lanka': 'lk',
  srilanka: 'lk',
  bangladesh: 'bd',
  afghanistan: 'af',
  ireland: 'ie',
  zimbabwe: 'zw',
  netherland: 'nl',
  netherlands: 'nl',
  holland: 'nl',
  nl: 'nl',
  scotland: 'gb-sct',
  italy: 'it',
  canada: 'ca',
  namibia: 'na',
  usa: 'us',
  us: 'us',
  'united states': 'us',
  'united states of america': 'us',
};

const normalizeCountryKey = (country) =>
  String(country || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

export const countryToCode = (country) => {
  const spaced = normalizeCountryKey(country);
  if (!spaced) return null;
  return COUNTRY_CODES[spaced] || COUNTRY_CODES[spaced.replace(/\s+/g, '')] || null;
};

export const countryFlagUrl = (country) => {
  const code = countryToCode(country);
  if (!code) return null;
  if (code === 'wi') return westIndiesFlag;
  return `https://flagcdn.com/w80/${code}.png`;
};
