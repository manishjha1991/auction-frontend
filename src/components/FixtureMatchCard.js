import React from 'react';
import './FixtureMatchCard.css';

const DEFAULT_TEAM_IMG = '/images/default-team.png';

function formatMatchWhen(dateValue) {
  if (!dateValue) return { date: '—', time: '' };
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return { date: '—', time: '' };
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };
}

function absUrl(apiBase, src) {
  if (!src) return null;
  if (String(src).startsWith('http')) return String(src);
  return `${apiBase || ''}${src}`;
}

function TeamSide({
  name,
  image,
  score,
  overs,
  isWinner,
  themePrimary,
  themeSecondary,
}) {
  const accent = themePrimary || '#f5c842';
  const accentSoft = themeSecondary || accent;
  return (
    <div
      className={`fmc-side ${isWinner ? 'fmc-side--winner' : 'fmc-side--loser'}`}
      style={
        isWinner
          ? {
              borderColor: accent,
              boxShadow: `0 0 18px ${accent}55, inset 0 0 24px ${accent}18`,
              background: `linear-gradient(105deg, rgba(20,28,48,0.95) 0%, ${accent}22 100%)`,
            }
          : undefined
      }
    >
      <div
        className="fmc-avatar"
        style={isWinner ? { borderColor: accent, boxShadow: `0 0 10px ${accent}66` } : undefined}
      >
        <img src={image || DEFAULT_TEAM_IMG} alt={name || 'Team'} />
      </div>
      <div className="fmc-side-meta">
        <div className="fmc-team-name">{name || 'TBA'}</div>
        <div className="fmc-score-row">
          <span
            className={`fmc-score ${isWinner ? 'fmc-score--win' : ''}`}
            style={isWinner ? { color: accentSoft || '#4ade80' } : undefined}
          >
            {score || '—'}
          </span>
          {overs ? <span className="fmc-overs">({overs} ov)</span> : null}
        </div>
      </div>
      {isWinner ? (
        <div className="fmc-victor" style={{ color: accent }}>
          <span
            className="fmc-crown"
            style={{ background: `linear-gradient(135deg, ${accent}, ${accentSoft})` }}
          >
            ♛
          </span>
          <span className="fmc-victor-label">VICTOR</span>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Mobile-first match result card. Clickable when onClick is provided.
 */
export default function FixtureMatchCard({
  fixture,
  matchLabel,
  formatLabel = 'T20',
  seasonLabel = 'Season 1',
  leagueLabel = 'league',
  team1Meta = {},
  team2Meta = {},
  apiBase = '',
  onClick,
  highlightFinal = false,
  compact = false,
}) {
  const team1 = fixture?.team1 || 'TBA';
  const team2 = fixture?.team2 || 'TBA';
  const hasWinner = Boolean(fixture?.winner);
  const team1Won = hasWinner && fixture.winner === team1;
  const team2Won = hasWinner && fixture.winner === team2;

  const topIsTeam1 = !hasWinner || team1Won || (!team1Won && !team2Won);
  const top = topIsTeam1
    ? {
        name: team1,
        image: absUrl(apiBase, team1Meta.image || team1Meta.teamImage),
        score: fixture?.team1Score,
        overs: fixture?.team1Overs,
        isWinner: team1Won,
        themePrimary: team1Meta.themePrimary,
        themeSecondary: team1Meta.themeSecondary,
      }
    : {
        name: team2,
        image: absUrl(apiBase, team2Meta.image || team2Meta.teamImage),
        score: fixture?.team2Score,
        overs: fixture?.team2Overs,
        isWinner: team2Won,
        themePrimary: team2Meta.themePrimary,
        themeSecondary: team2Meta.themeSecondary,
      };
  const bottom = topIsTeam1
    ? {
        name: team2,
        image: absUrl(apiBase, team2Meta.image || team2Meta.teamImage),
        score: fixture?.team2Score,
        overs: fixture?.team2Overs,
        isWinner: team2Won,
        themePrimary: team2Meta.themePrimary,
        themeSecondary: team2Meta.themeSecondary,
      }
    : {
        name: team1,
        image: absUrl(apiBase, team1Meta.image || team1Meta.teamImage),
        score: fixture?.team1Score,
        overs: fixture?.team1Overs,
        isWinner: team1Won,
        themePrimary: team1Meta.themePrimary,
        themeSecondary: team1Meta.themeSecondary,
      };

  const when = formatMatchWhen(fixture?.createdAt);
  const resultText = hasWinner
    ? fixture.margin
      ? `${fixture.winner} Won by ${fixture.margin}`
      : `${fixture.winner} Won`
    : 'Result pending';

  const winnerAccent = top.isWinner ? top.themePrimary || '#f5c842' : '#94a3b8';
  const interactive = typeof onClick === 'function';

  return (
    <article
      className={`fmc-card ${highlightFinal ? 'fmc-card--final' : ''} ${!hasWinner ? 'fmc-card--pending' : ''} ${compact ? 'fmc-card--compact' : ''} ${interactive ? 'fmc-card--clickable' : ''}`}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? onClick : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(e);
              }
            }
          : undefined
      }
    >
      <header className="fmc-header">
        <div className="fmc-header-left">
          <div className="fmc-swords" aria-hidden>
            ⚔
          </div>
          <div className="fmc-header-titles">
            <div className="fmc-match-title">{matchLabel || 'Match'}</div>
            <div className="fmc-pills">
              <span className="fmc-pill fmc-pill--season">{seasonLabel}</span>
              <span className="fmc-pill fmc-pill--league">{leagueLabel}</span>
            </div>
            <span className="fmc-pill fmc-pill--format">{formatLabel}</span>
          </div>
        </div>
        <div className="fmc-header-right">
          <div className="fmc-when">
            <span className="fmc-date">{when.date}</span>
            {when.time ? <span className="fmc-time">{when.time}</span> : null}
          </div>
          {interactive ? (
            <span className="fmc-view-link">
              <span className="fmc-eye" aria-hidden>
                👁
              </span>
              Sign in for details
            </span>
          ) : null}
        </div>
      </header>

      <div className="fmc-duel">
        <TeamSide {...top} />
        <div className="fmc-vs-wrap">
          <span className="fmc-vs-line" />
          <span className="fmc-vs" style={{ borderColor: winnerAccent, color: winnerAccent }}>
            VS
          </span>
          <span className="fmc-vs-line" />
        </div>
        <TeamSide {...bottom} />
      </div>

      <footer className="fmc-footer">
        <div
          className={`fmc-result ${hasWinner ? 'fmc-result--done' : 'fmc-result--pending'}`}
          style={
            hasWinner
              ? {
                  borderColor: `${winnerAccent}88`,
                  background: `linear-gradient(90deg, ${winnerAccent}33, rgba(15,23,42,0.9))`,
                }
              : undefined
          }
        >
          <span className="fmc-trophy" style={hasWinner ? { background: winnerAccent } : undefined}>
            🏆
          </span>
          <span className="fmc-result-text">{resultText}</span>
        </div>
      </footer>
    </article>
  );
}
