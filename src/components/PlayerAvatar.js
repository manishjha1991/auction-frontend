import React, { useState } from 'react';
import { resolvePlayerImageUrl } from '../utils/resolvePlayerImageUrl';
import CountryFlag from './CountryFlag';

export default function PlayerAvatar({ profilePicture, name, country, size = 32, className = '' }) {
  const url = resolvePlayerImageUrl(profilePicture);
  const [broken, setBroken] = useState(false);
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const dim = { width: size, height: size, minWidth: size, minHeight: size };
  const flagSize = Math.max(10, Math.round(size * 0.42));

  return (
    <span
      className={`player-avatar-wrap ${className}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        ...dim,
        flexShrink: 0,
        verticalAlign: 'middle',
      }}
      title={country ? `${name || ''} · ${country}` : (name || '')}
    >
      <span
        className="player-avatar"
        style={{
          ...dim,
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #334155, #1e293b)',
          color: '#e2e8f0',
          fontSize: Math.max(10, size * 0.42),
          fontWeight: 800,
          border: '1px solid rgba(255,255,255,0.15)',
        }}
        aria-hidden={url && !broken ? true : undefined}
      >
        {url && !broken ? (
          <img
            src={url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={() => setBroken(true)}
          />
        ) : (
          <span>{initial}</span>
        )}
      </span>
      {country ? (
        <span
          style={{
            position: 'absolute',
            right: -2,
            bottom: -1,
            zIndex: 2,
            lineHeight: 0,
            pointerEvents: 'none',
          }}
        >
          <CountryFlag country={country} size={flagSize} />
        </span>
      ) : null}
    </span>
  );
}
