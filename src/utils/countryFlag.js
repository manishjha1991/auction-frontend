const COUNTRY_CODES = {
  india: 'in',
  australia: 'au',
  england: 'gb-eng',
  'new zealand': 'nz',
  newzeland: 'nz',
  pakistan: 'pk',
  'south africa': 'za',
  'west indies': 'wi',
  'sri lanka': 'lk',
  bangladesh: 'bd',
  afghanistan: 'af',
  ireland: 'ie',
  zimbabwe: 'zw',
};

export const countryToCode = (country) => {
  const key = String(country || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
  return COUNTRY_CODES[key] || null;
};

export const countryFlagUrl = (country) => {
  const code = countryToCode(country);
  if (!code) return null;
  if (code === 'wi') {
    return 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Flag_of_the_West_Indies_Cricket_Board.svg/80px-Flag_of_the_West_Indies_Cricket_Board.svg.png';
  }
  return `https://flagcdn.com/w80/${code}.png`;
};
