import React, { useEffect, useState, useCallback } from 'react';
import { API_ENDPOINTS } from '../const';
import {
  FaTrophy,
  FaChevronDown,
  FaHistory,
  FaBullseye,
  FaRunning,
  FaUsers,
  FaSyncAlt,
} from 'react-icons/fa';
import '../css/CplHistorySummary.css';

const LOADING_HINTS = [
  'Connecting to historical databases…',
  'Loading standings and playoff results…',
  'Aggregating player highlights…',
];

function CplHistorySkeleton() {
  const bars = [1, 2, 3, 4, 5];
  return (
    <div className="cpl-history-skeleton-root" aria-busy="true" aria-label="Loading CPL history">
      <div className="cpl-history-skeleton-banner">
        <div className="cpl-history-skeleton-line cpl-history-skeleton-line--title" />
        <div className="cpl-history-skeleton-line cpl-history-skeleton-line--sub" />
        <div className="cpl-history-skeleton-line cpl-history-skeleton-line--sub short" />
      </div>
      {bars.map((i) => (
        <div key={i} className="cpl-history-skeleton-card">
          <div className="cpl-history-skeleton-card-head">
            <div className="cpl-history-skeleton-line cpl-history-skeleton-line--h2" />
            <div className="cpl-history-skeleton-pill" />
          </div>
          <div className="cpl-history-skeleton-block" />
          <div className="cpl-history-skeleton-line cpl-history-skeleton-line--row" />
          <div className="cpl-history-skeleton-line cpl-history-skeleton-line--row medium" />
          <div className="cpl-history-skeleton-line cpl-history-skeleton-line--row short" />
        </div>
      ))}
    </div>
  );
}

function SeasonCard({ season }) {
  const [open, setOpen] = useState(false);
  const playoff = season.playoffChampion;
  const league = season.leagueLeader;
  const ch = season.champion;

  const sameName = (a, b) =>
    a && b && String(a.teamName).toLowerCase().trim() === String(b.teamName).toLowerCase().trim();

  return (
    <article className="cpl-history-season">
      <div className="cpl-history-season-head">
        <h2 className="cpl-history-season-title">{season.label}</h2>
        <span className="cpl-history-badge">
          {season.teamCount} teams · {season.completedFixtures} results
        </span>
      </div>

      {playoff && (
        <div className="cpl-history-champion">
          <div className="cpl-history-champion-label">
            <FaTrophy style={{ marginRight: 6, verticalAlign: 'middle' }} />
            CPL winner — playoff final
            {playoff.playoffMatchId && (
              <span className="cpl-history-subtle"> ({playoff.playoffMatchId})</span>
            )}
          </div>
          <p className="cpl-history-champion-name">{playoff.teamName}</p>
          {playoff.finalScores && (
            <p className="cpl-history-final-score">Final: {playoff.finalScores}</p>
          )}
          {playoff.playoffStage && (
            <p className="cpl-history-subtle" style={{ margin: '0 0 0.5rem' }}>
              {playoff.playoffStage}
            </p>
          )}
          <div className="cpl-history-champion-stats">
            {playoff.points != null && (
              <>
                <span>
                  <strong>{playoff.points}</strong> pts (league)
                </span>
                <span>
                  NRR <strong>{playoff.nrr}</strong>
                </span>
                <span>
                  Fair <strong>{playoff.fairness}</strong>
                </span>
                <span>
                  League #{playoff.rank}
                </span>
              </>
            )}
            {playoff.source === 'playoff_only' && (
              <span className="cpl-history-subtle">League row not matched — winner from playoff fixture only</span>
            )}
          </div>
        </div>
      )}

      {!playoff && ch && (
        <div className="cpl-history-champion cpl-history-champion--league-only">
          <div className="cpl-history-champion-label">
            <FaTrophy style={{ marginRight: 6, verticalAlign: 'middle' }} />
            League leader (no playoff final in database)
          </div>
          <p className="cpl-history-champion-name">{ch.teamName}</p>
          <div className="cpl-history-champion-stats">
            <span>
              <strong>{ch.points}</strong> pts
            </span>
            <span>
              NRR <strong>{ch.nrr}</strong>
            </span>
            <span>
              Fair <strong>{ch.fairness}</strong>
            </span>
            <span>
              <strong>{ch.matchesPlayed}</strong> played ({ch.wins}W / {ch.losses}L)
            </span>
          </div>
        </div>
      )}

      {playoff && league && !sameName(playoff, league) && (
        <div className="cpl-history-league-note">
          League table #1: <strong>{league.teamName}</strong> ({league.points} pts)
        </div>
      )}

      {season.playerHighlights &&
        (season.playerHighlights.bestBowler ||
          season.playerHighlights.bestAllRounder ||
          season.playerHighlights.bestAllRoundTeam) && (
          <div className="cpl-history-highlights">
            <strong className="cpl-history-highlights-title">Player & squad highlights</strong>
            <div className="cpl-history-highlight-grid">
              {season.playerHighlights.bestBowler && (
                <div className="cpl-history-highlight-card">
                  <div className="cpl-history-highlight-label">
                    <FaBullseye aria-hidden /> Best bowler
                  </div>
                  <p className="cpl-history-highlight-name">{season.playerHighlights.bestBowler.playerName}</p>
                  {season.playerHighlights.bestBowler.teamName && (
                    <p className="cpl-history-highlight-team">{season.playerHighlights.bestBowler.teamName}</p>
                  )}
                  <p className="cpl-history-highlight-achievement">{season.playerHighlights.bestBowler.achievement}</p>
                </div>
              )}
              {season.playerHighlights.bestAllRounder && (
                <div className="cpl-history-highlight-card">
                  <div className="cpl-history-highlight-label">
                    <FaRunning aria-hidden /> Best all-rounder
                  </div>
                  <p className="cpl-history-highlight-name">{season.playerHighlights.bestAllRounder.playerName}</p>
                  {season.playerHighlights.bestAllRounder.teamName && (
                    <p className="cpl-history-highlight-team">{season.playerHighlights.bestAllRounder.teamName}</p>
                  )}
                  <p className="cpl-history-highlight-achievement">
                    {season.playerHighlights.bestAllRounder.achievement}
                  </p>
                </div>
              )}
              {season.playerHighlights.bestAllRoundTeam && (
                <div className="cpl-history-highlight-card cpl-history-highlight-card--team">
                  <div className="cpl-history-highlight-label">
                    <FaUsers aria-hidden /> Best all-round squad
                  </div>
                  <p className="cpl-history-highlight-name">{season.playerHighlights.bestAllRoundTeam.teamName}</p>
                  <p className="cpl-history-highlight-achievement">
                    {season.playerHighlights.bestAllRoundTeam.achievement}
                  </p>
                  <p className="cpl-history-subtle" style={{ margin: '0.35rem 0 0' }}>
                    Highest combined batting runs + bowling wickets across the roster.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      {season.insights && (
        <div className="cpl-history-insights">
          <strong>Season snapshot</strong>
          <ul>
            <li>{season.insights.titleRaceNote}</li>
            {season.insights.runnerUp && (
              <li>
                Runner-up: <strong>{season.insights.runnerUp}</strong>
                {season.insights.titleMarginPoints != null &&
                  ` (${season.insights.titleMarginPoints} pts behind)`}
              </li>
            )}
            <li>
              Best NRR (league): <strong>{season.insights.bestNrrTeam}</strong> ({season.insights.bestNrrValue})
            </li>
            <li>
              Highest fairness total: <strong>{season.insights.highestFairnessTeam}</strong> (
              {season.insights.highestFairnessValue})
            </li>
            {season.insights.playoffNote && <li>{season.insights.playoffNote}</li>}
          </ul>
        </div>
      )}

      <button
        type="button"
        className={`cpl-history-toggle ${open ? 'open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>Full standings</span>
        <FaChevronDown />
      </button>

      {open && (
        <div className="cpl-history-table-wrap">
          <table className="cpl-history-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Team</th>
                <th>Pts</th>
                <th>NRR</th>
                <th>Fair</th>
                <th>Pld</th>
                <th>W</th>
                <th>L</th>
              </tr>
            </thead>
            <tbody>
              {(season.table || []).map((row) => (
                <tr
                  key={`${season.dbName}-${row.rank}`}
                  className={`${row.rank <= 6 ? 'top-six' : ''} ${row.rank === 1 ? 'rank-1' : ''}`}
                >
                  <td>{row.rank}</td>
                  <td>{row.teamName}</td>
                  <td>{row.points}</td>
                  <td>{row.nrr}</td>
                  <td>{row.fairness}</td>
                  <td>{row.matchesPlayed}</td>
                  <td>{row.wins}</td>
                  <td>{row.losses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

export default function CplHistorySummary() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadHint, setLoadHint] = useState(0);

  const load = useCallback(async (bustCache = false) => {
    setLoading(true);
    setErr('');
    const url = bustCache
      ? `${API_ENDPOINTS}/api/cpl-history/summary?t=${Date.now()}`
      : `${API_ENDPOINTS}/api/cpl-history/summary`;
    try {
      const res = await fetch(url);
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.message || 'Failed to load');
      setData(j);
    } catch (e) {
      setErr(e.message || 'Could not load CPL history');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  useEffect(() => {
    if (!loading) return undefined;
    setLoadHint(0);
    const id = setInterval(() => {
      setLoadHint((h) => (h + 1) % LOADING_HINTS.length);
    }, 2200);
    return () => clearInterval(id);
  }, [loading]);

  return (
    <div className="cpl-history-page">
      <header className="cpl-history-header">
        <h1>
          <FaHistory style={{ marginRight: 10, verticalAlign: 'middle', opacity: 0.9 }} />
          CPL history
        </h1>
        <p>
          Past seasons: CPL winner from playoff final when available (match F or WCF), full league tables (points, NRR,
          fairness), and player highlights (leading wicket-taker, best all-rounder, strongest batting+bowling squad).
          Current season DB is excluded.
        </p>
        {data?.currentSeasonDb && (
          <div className="cpl-history-meta">Live app DB: {data.currentSeasonDb}</div>
        )}
        {!loading && (
          <button
            type="button"
            className="cpl-history-refresh"
            onClick={() => load(true)}
            title="Fetch latest data (bypass cache)"
          >
            <FaSyncAlt aria-hidden /> Refresh
          </button>
        )}
      </header>

      <div className="cpl-history-content">
        {loading && (
          <>
            <div className="cpl-history-loading-bar" aria-hidden />
            <div className="cpl-history-loading-overlay">
              <div className="cpl-history-spinner cpl-history-spinner--lg" />
              <p className="cpl-history-loading-title">Loading CPL history</p>
              <p className="cpl-history-loading-hint" key={loadHint}>
                {LOADING_HINTS[loadHint]}
              </p>
              <p className="cpl-history-loading-note">This can take a few seconds when many seasons are included.</p>
            </div>
            <CplHistorySkeleton />
          </>
        )}

        {!loading && err && <div className="cpl-history-alert">{err}</div>}

        {!loading && data?.errors?.length > 0 && (
          <div className="cpl-history-alert">
            Some databases could not be read: {data.errors.map((e) => e.dbName).join(', ')}
          </div>
        )}

        {!loading && data?.seasons?.length === 0 && !err && (
          <div className="cpl-history-empty">No historical seasons configured. Set CPL_HISTORY_DBS on the server.</div>
        )}

        {!loading &&
          data?.seasons?.map((season) => <SeasonCard key={season.dbName} season={season} />)}

        {!loading && data?.generatedAt && (
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', marginTop: '1.5rem' }}>
            Updated {new Date(data.generatedAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
