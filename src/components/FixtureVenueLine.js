import React from 'react';
import { fixtureVenueText } from '../utils/fixtureVenue';
import './FixtureVenueLine.css';

export default function FixtureVenueLine({ fixture, homeGround1, homeGround2 }) {
  const text = fixtureVenueText(fixture, homeGround1, homeGround2);
  if (!text) return null;
  const played = Boolean(String(fixture?.winner || '').trim());
  const tossed = Boolean(String(fixture?.tossWinner || '').trim());
  const mode = played ? 'played' : tossed ? 'toss' : 'homes';
  return <div className={`fvl fvl--${mode}`}>{text}</div>;
}
