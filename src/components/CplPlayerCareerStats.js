import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FaChartBar, FaSearch, FaFire, FaBolt, FaBowlingBall, FaSyncAlt } from 'react-icons/fa';
import { API_ENDPOINTS } from '../const';
import '../css/CplPlayerCareerStats.css';

function formatDetailDate(d) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return null;
  }
}

/** Calendar day (YYYY-MM-DD) for grouping; empty if unparseable / missing. */
function dateKeyForDedupe(d) {
  if (d == null || d === '') return '';
  try {
    const t = new Date(d).getTime();
    if (Number.isNaN(t)) return '';
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

function normOpp(team) {
  return String(team || '')
    .trim()
    .toLowerCase();
}

/**
 * Same duplicate rule as backend: runs + balls + opponent + day (batting);
 * wickets + runs given + balls bowled + opponent + day (bowling).
 */
function dedupeIdenticalInnings(items, keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of items || []) {
    const k = keyFn(item);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

function battingInningsKey(c) {
  const dk = dateKeyForDedupe(c.date);
  const opp = normOpp(c.opponentTeam);
  return `${Number(c.runs)}|${Number(c.balls)}|${opp}|${dk}`;
}

function bowlingInningsKey(b) {
  const dk = dateKeyForDedupe(b.date);
  const opp = normOpp(b.opponentTeam);
  return `${Number(b.wickets)}|${Number(b.runsGiven)}|${Number(b.ballsBowled)}|${opp}|${dk}`;
}

export default function CplPlayerCareerStats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [openKey, setOpenKey] = useState('');

  const loadCareer = useCallback(async (forceRefresh = false) => {
    const q = forceRefresh ? '?refresh=1' : '';
    const res = await fetch(`${API_ENDPOINTS}/api/cpl-report/player-career-summary${q}`, {
      cache: forceRefresh ? 'no-store' : 'default',
    });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.message || `HTTP ${res.status}`);
    setData(json);
    setError('');
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadCareer(false);
      } catch (e) {
        if (mounted) setError(e.message || 'Failed to load player career stats');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [loadCareer]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError('');
    try {
      await loadCareer(true);
    } catch (e) {
      setError(e.message || 'Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  const rows = useMemo(() => {
    const list = data?.players || [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => {
      const teamStr = (p.teams || []).join(' ').toLowerCase();
      return (
        String(p.playerName || '').toLowerCase().includes(q) ||
        String(p.role || '').toLowerCase().includes(q) ||
        teamStr.includes(q)
      );
    });
  }, [data, query]);

  return (
    <div className="career-page">
      <header className="career-hero">
        <h1>
          <FaChartBar /> Player career stats
        </h1>
        <p>Runs, 50s, 100s, highest score, wickets, best bowling, strike rate, batting average, bowling average.</p>
        <p className="career-meta">
          {data?.careerDataSourceLabel || 'Data from cpl_15 to the current CPL (historical + live).'}
          {data?.generatedAt ? ` · Updated: ${new Date(data.generatedAt).toLocaleString()}` : ''}
        </p>
        <div className="career-toolbar">
          <button
            type="button"
            className="career-refresh-btn"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            title="Bypass cache and reload from the database"
          >
            <FaSyncAlt className={refreshing ? 'career-spin' : ''} aria-hidden />
            {refreshing ? 'Refreshing…' : 'Refresh data'}
          </button>
        </div>
      </header>

      <div className="career-wrap">
        <div className="career-search">
          <FaSearch />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search player, role, team..."
            aria-label="Search player career stats"
          />
        </div>

        {loading && <div className="career-info">Loading player stats...</div>}
        {!loading && error && <div className="career-error">{error}</div>}
        {!loading && !error && rows.length === 0 && <div className="career-info">No players found.</div>}

        {!loading && !error && (
          <div className="career-list">
            {rows.map((p, idx) => {
              const centuriesListed = dedupeIdenticalInnings(p.centuries || [], battingInningsKey);
              const fiftiesListed = dedupeIdenticalInnings(p.fifties || [], battingInningsKey);
              const th = p.totalHundreds ?? 0;
              const tf = p.totalFifties ?? 0;
              return (
              <article key={`${p.playerName}-${idx}`} className="career-card">
                <div className="career-top">
                  <div>
                    <h3>{p.playerName}</h3>
                    <p>
                      {p.role || '—'} {p.teams?.length ? `· ${p.teams.join(', ')}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="career-expand-btn"
                  onClick={() => setOpenKey(openKey === `${p.playerName}-${idx}` ? '' : `${p.playerName}-${idx}`)}
                >
                  {openKey === `${p.playerName}-${idx}` ? 'Hide 50s/100s & best bowling details' : 'Show 50s/100s & best bowling details'}
                </button>

                <div className="career-grid">
                  <div>
                    <span>Total runs</span>
                    <strong>{p.totalRuns}</strong>
                  </div>
                  <div>
                    <span>Total 50s</span>
                    <strong>{tf}</strong>
                  </div>
                  <div>
                    <span>Total 100s</span>
                    <strong>{th}</strong>
                  </div>
                  <div>
                    <span>Highest score</span>
                    <strong>{p.highestScore}</strong>
                  </div>
                  <div>
                    <span>Total wickets</span>
                    <strong>{p.totalWickets}</strong>
                  </div>
                  <div>
                    <span>Best bowling</span>
                    <strong>{p.bestBowling}</strong>
                  </div>
                  <div>
                    <span>Strike rate</span>
                    <strong>{p.battingStrikeRate}</strong>
                  </div>
                  <div>
                    <span>Bat avg</span>
                    <strong>{p.battingAverage}</strong>
                  </div>
                  <div>
                    <span>Bowl avg</span>
                    <strong>{p.bowlingAverage}</strong>
                  </div>
                </div>

                {openKey === `${p.playerName}-${idx}` && (
                  <div className="career-details">
                    <section className="career-detail-block career-detail-block--100">
                      <div className="career-detail-head">
                        <FaFire aria-hidden />
                        <h4>Centuries</h4>
                        <span className="career-detail-tag">100+</span>
                      </div>
                      {th !== centuriesListed.length && (
                        <p className="career-detail-sub">
                          Summary total is {th} unique 100+ innings; this list shows {centuriesListed.length}
                          {th > centuriesListed.length
                            ? ' (save stats or run career rebuild to refresh; very long careers may cap list size).'
                            : '.'}
                        </p>
                      )}
                      {centuriesListed.length ? (
                        <div className="career-milestone-list">
                          {centuriesListed.map((c, i) => {
                            const dateStr = formatDetailDate(c.date);
                            return (
                              <div key={`c-${i}`} className="career-milestone-row">
                                <div className="career-milestone-score">
                                  <span className="career-milestone-runs">{c.runs}</span>
                                  <span className="career-milestone-meta">
                                    {c.balls != null ? `${c.balls} balls` : '—'}
                                  </span>
                                </div>
                                <div className="career-milestone-right">
                                  <span className="career-opp-pill">{c.opponentTeam || 'Unknown'}</span>
                                  {dateStr && <span className="career-milestone-date">{dateStr}</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="career-detail-empty">No centuries yet.</p>
                      )}
                    </section>

                    <section className="career-detail-block career-detail-block--50">
                      <div className="career-detail-head">
                        <FaBolt aria-hidden />
                        <h4>Half-centuries</h4>
                        <span className="career-detail-tag">50–99</span>
                      </div>
                      {tf !== fiftiesListed.length && (
                        <p className="career-detail-sub">
                          Summary total is {tf} unique 50–99 innings; this list shows {fiftiesListed.length}
                          {tf > fiftiesListed.length
                            ? ' (save stats or run career rebuild to refresh; very long careers may cap list size).'
                            : '.'}
                        </p>
                      )}
                      {fiftiesListed.length ? (
                        <div className="career-milestone-list">
                          {fiftiesListed.map((f, i) => {
                            const dateStr = formatDetailDate(f.date);
                            return (
                              <div key={`f-${i}`} className="career-milestone-row">
                                <div className="career-milestone-score">
                                  <span className="career-milestone-runs">{f.runs}</span>
                                  <span className="career-milestone-meta">
                                    {f.balls != null ? `${f.balls} balls` : '—'}
                                  </span>
                                </div>
                                <div className="career-milestone-right">
                                  <span className="career-opp-pill">{f.opponentTeam || 'Unknown'}</span>
                                  {dateStr && <span className="career-milestone-date">{dateStr}</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="career-detail-empty">No fifties yet.</p>
                      )}
                    </section>

                    <section className="career-detail-block career-detail-block--bowl">
                      <div className="career-detail-head">
                        <FaBowlingBall aria-hidden />
                        <h4>Best bowling</h4>
                        <span className="career-detail-tag">Spells</span>
                      </div>
                      {p.bestBowlingSpells?.length ? (
                        <div className="career-milestone-list">
                          {dedupeIdenticalInnings(p.bestBowlingSpells, bowlingInningsKey).map((b, i) => {
                            const dateStr = formatDetailDate(b.date);
                            return (
                              <div key={`b-${i}`} className="career-milestone-row career-milestone-row--bowl">
                                <div className="career-bowl-figures">
                                  <span className="career-bowl-wk">
                                    {b.wickets}
                                    <span className="career-bowl-sep">/</span>
                                    {b.runsGiven}
                                  </span>
                                  <span className="career-milestone-meta">
                                    {b.ballsBowled != null ? `${b.ballsBowled} balls` : '—'}
                                  </span>
                                </div>
                                <div className="career-milestone-right">
                                  <span className="career-opp-pill career-opp-pill--bowl">{b.opponentTeam || 'Unknown'}</span>
                                  {dateStr && <span className="career-milestone-date">{dateStr}</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="career-detail-empty">No bowling spells recorded yet.</p>
                      )}
                    </section>
                  </div>
                )}
              </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

