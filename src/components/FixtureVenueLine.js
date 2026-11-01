import React from 'react';
import { fixtureVenueParts } from '../utils/fixtureVenue';
import StadiumMark from './StadiumMark';
import './FixtureVenueLine.css';

export default function FixtureVenueLine({ fixture, homeGround1, homeGround2 }) {
  const view = fixtureVenueParts(fixture, homeGround1, homeGround2);
  if (!view) return null;

  return (
    <div className={`fvl fvl--${view.mode}`}>
      {view.items.map((item) => (
        <div className="fvl-row" key={`${item.team || 'venue'}-${item.ground}`}>
          {item.unset ? (
            <span className="fvl-mark fvl-mark--empty" aria-hidden>
              —
            </span>
          ) : (
            <StadiumMark name={item.ground} />
          )}
          <div className="fvl-copy">
            {item.caption ? <span className="fvl-kicker">{item.caption}</span> : null}
            {item.team ? <span className="fvl-team">{item.team}</span> : null}
            <span className="fvl-name">{item.ground}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
