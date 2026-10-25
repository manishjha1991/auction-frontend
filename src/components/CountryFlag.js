import React, { useState } from 'react';
import { countryFlagUrl } from '../utils/countryFlag';

const CountryFlag = ({ country, size = 18, className = '' }) => {
  const url = countryFlagUrl(country);
  const [broken, setBroken] = useState(false);
  if (!country) return null;
  if (!url || broken) {
    return (
      <span className={`country-flag-fallback ${className}`} title={country}>
        {country}
      </span>
    );
  }
  return (
    <img
      className={`country-flag ${className}`}
      src={url}
      alt={country}
      title={country}
      width={size}
      height={Math.round(size * 0.75)}
      onError={() => setBroken(true)}
      style={{
        width: size,
        height: Math.round(size * 0.75),
        objectFit: 'cover',
        borderRadius: 2,
        boxShadow: '0 0 0 1px rgba(0,0,0,0.15)',
        flexShrink: 0,
        display: 'inline-block',
        verticalAlign: 'middle',
        background: '#7A1420',
      }}
    />
  );
};

export default CountryFlag;
