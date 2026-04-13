import React, { useState } from 'react';
import { resolvePlayerImageUrl } from '../utils/resolvePlayerImageUrl';

export default function PlayerAvatar({ profilePicture, name, size = 32, className = '' }) {
  const url = resolvePlayerImageUrl(profilePicture);
  const [broken, setBroken] = useState(false);
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const dim = { width: size, height: size, minWidth: size, minHeight: size };

  return (
    <span
      className={`player-avatar ${className}`}
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
        flexShrink: 0,
        border: '1px solid rgba(255,255,255,0.15)',
        verticalAlign: 'middle',
      }}
      title={name || ''}
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
  );
}
