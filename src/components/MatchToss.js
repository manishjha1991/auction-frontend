import React, { useEffect, useMemo, useState } from 'react';
import './MatchToss.css';

function abbr(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return '??';
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
  return parts.slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

function idStr(value) {
  if (!value) return '';
  if (typeof value === 'object') return String(value._id || value.id || '');
  return String(value);
}

function idsMatch(a, b) {
  const left = idStr(a);
  const right = idStr(b);
  return Boolean(left) && left === right;
}

function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function namesMatch(a, b) {
  const left = normalizeName(a);
  const right = normalizeName(b);
  return Boolean(left) && left === right;
}

function isPlaceholderTeam(name) {
  const n = String(name || '').trim();
  if (!n || n.length < 2) return true;
  return /^(tbd|tba|na|n\/a|winner|loser|waiting)/i.test(n)
    || /winner of|loser of|qualifier|eliminator|to be decided|^top \d+$/i.test(n);
}

/** Admin: any match. Logged-in owner: only matches involving their team. */
export function userCanTossMatch(user, fixture) {
  if (!user || !fixture) return false;
  if (isPlaceholderTeam(fixture.team1) || isPlaceholderTeam(fixture.team2)) return false;
  if (user.isAdmin === true) return true;
  const uid = user.id || user._id;
  if (idsMatch(uid, fixture.team1UserId) || idsMatch(uid, fixture.team2UserId)) return true;
  const teamName = user.teamName;
  const abbrName = user.abbreviation;
  return namesMatch(teamName, fixture.team1)
    || namesMatch(teamName, fixture.team2)
    || namesMatch(abbrName, fixture.team1)
    || namesMatch(abbrName, fixture.team2);
}

export function isUnplayedMatch(fixture) {
  if (!fixture) return false;
  if (fixture.winner) return false;
  if (fixture.isCompleted) return false;
  const t1 = String(fixture.team1Score || '').trim();
  const t2 = String(fixture.team2Score || '').trim();
  const scored = t1 && t2 && t1 !== 'TBD' && t2 !== 'TBD' && t1 !== '—' && t2 !== '—';
  return !scored;
}

export function TossResultBadge({ tossWinner }) {
  if (!tossWinner) return null;
  return (
    <div className="toss-result-badge" role="status">
      <span className="toss-result-coin" aria-hidden>🪙</span>
      <span>
        <strong>{tossWinner}</strong> won the toss
      </span>
    </div>
  );
}

const SPARKS = Array.from({ length: 18 }, (_, i) => i);

export function TossOverlay({ open, team1, team2, winner, onClose }) {
  const [phase, setPhase] = useState('spin');
  const landTeam2 = winner && String(winner) === String(team2);

  useEffect(() => {
    if (!open) return undefined;
    setPhase('spin');
    const land = window.setTimeout(() => setPhase('land'), 3200);
    const reveal = window.setTimeout(() => setPhase('reveal'), 3800);
    return () => {
      window.clearTimeout(land);
      window.clearTimeout(reveal);
    };
  }, [open, winner]);

  if (!open) return null;

  return (
    <div
      className={`toss-overlay toss-overlay--${phase}`}
      role="dialog"
      aria-modal="true"
      aria-label="Coin toss"
      onClick={phase === 'reveal' ? onClose : undefined}
    >
      <div className="toss-ambient" aria-hidden>
        <span className="toss-flare toss-flare--l" />
        <span className="toss-flare toss-flare--r" />
        <span className="toss-haze" />
      </div>

      <div className="toss-stage" onClick={(e) => e.stopPropagation()}>
        <p className="toss-kicker">Match toss</p>
        <div className="toss-matchup">
          <div className={`toss-chip toss-chip--home ${!landTeam2 && phase === 'reveal' ? 'is-winner' : ''}`}>
            <span className="toss-chip-abbr">{abbr(team1)}</span>
            <span className="toss-chip-name">{team1}</span>
          </div>
          <div className="toss-vs">VS</div>
          <div className={`toss-chip toss-chip--away ${landTeam2 && phase === 'reveal' ? 'is-winner' : ''}`}>
            <span className="toss-chip-abbr">{abbr(team2)}</span>
            <span className="toss-chip-name">{team2}</span>
          </div>
        </div>

        <div className="toss-sides">
          <span className="toss-side toss-side--heads">Heads · {team1}</span>
          <span className="toss-side toss-side--tails">Tails · {team2}</span>
        </div>

        <div className="toss-arena">
          <div className={`toss-shadow ${phase === 'spin' ? 'is-air' : 'is-down'}`} />
          <div
            className={`toss-coin-wrap ${phase === 'spin' ? 'is-tossing' : 'is-landed'} ${landTeam2 ? 'lands-tails' : 'lands-heads'}`}
          >
            <div
              className={`toss-coin ${phase === 'spin' ? 'is-spinning' : ''} ${landTeam2 ? 'lands-tails' : 'lands-heads'}`}
            >
              <div className="toss-face toss-face--heads">
                <span className="toss-face-ring" />
                <span className="toss-face-shine" />
                <strong>{abbr(team1)}</strong>
                <em>HEADS</em>
              </div>
              <div className="toss-face toss-face--tails">
                <span className="toss-face-ring" />
                <span className="toss-face-shine" />
                <strong>{abbr(team2)}</strong>
                <em>TAILS</em>
              </div>
            </div>
          </div>
          {phase === 'reveal' ? (
            <div className="toss-burst" aria-hidden>
              {SPARKS.map((i) => (
                <span key={i} className={`toss-spark toss-spark--${i % 6}`} />
              ))}
            </div>
          ) : null}
        </div>

        <p className={`toss-caption ${phase === 'reveal' ? 'is-win' : ''}`}>
          {phase === 'reveal' && winner ? (
            <>The coin has spoken</>
          ) : phase === 'land' ? (
            'Settling…'
          ) : (
            'The coin is in the air…'
          )}
        </p>

        {phase === 'reveal' && winner ? (
          <>
            <div className="toss-winner-banner">
              <span>Toss winner</span>
              <strong>{winner}</strong>
            </div>
            <button type="button" className="toss-done" onClick={onClose}>
              Continue
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function MatchToss({
  fixture,
  user,
  tossing,
  onToss,
}) {
  const unplayed = isUnplayedMatch(fixture);
  if (!unplayed) return null;

  if (fixture?.tossWinner) {
    return <TossResultBadge tossWinner={fixture.tossWinner} />;
  }

  const canToss = userCanTossMatch(user, fixture);
  if (!canToss) return null;

  return (
    <button
      type="button"
      className="toss-btn"
      disabled={tossing}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToss();
      }}
    >
      <span className="toss-btn-coin" aria-hidden>🪙</span>
      {tossing ? 'Tossing…' : 'Toss'}
    </button>
  );
}

export function useMatchToss() {
  const [overlay, setOverlay] = useState({ open: false, team1: '', team2: '', winner: '' });
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const closeOverlay = () => setOverlay((prev) => ({ ...prev, open: false }));

  const showToss = ({ team1, team2, winner }) => {
    setOverlay({ open: true, team1, team2, winner });
  };

  return { user, overlay, showToss, closeOverlay };
}
