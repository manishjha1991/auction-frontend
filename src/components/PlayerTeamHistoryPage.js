import React, { useEffect, useMemo, useState } from 'react';
import { FaChevronDown, FaChevronRight, FaSearch, FaUsers } from 'react-icons/fa';
import { API_ENDPOINTS } from '../const';
import { resolvePlayerImageUrl } from '../utils/resolvePlayerImageUrl';
import '../css/PlayerTeamHistoryPage.css';

const formatTournamentLabel = (key) => {
  const match = String(key || '').match(/^cpl_(\d+)$/i);
  return match ? `CPL ${match[1]}` : key || 'Current';
};

const tournamentOrderValue = (key = '') => {
  const match = String(key || '').match(/^cpl_(\d+)$/i);
  if (match) return Number(match[1]);
  return Number.MAX_SAFE_INTEGER;
};

const sortTournaments = (rows = []) =>
  [...rows].sort((a, b) => tournamentOrderValue(a.tournamentKey) - tournamentOrderValue(b.tournamentKey));

const average = (values = []) => {
  if (!values.length) return 0;
  const total = values.reduce((sum, value) => sum + (Number(value) || 0), 0);
  return total / values.length;
};

const round1 = (value) => Number((Number(value) || 0).toFixed(1));
const round2 = (value) => Number((Number(value) || 0).toFixed(2));

const inferRoleBucket = (role = '') => {
  const text = String(role || '').toLowerCase();
  if (text.includes('allround')) return 'allrounder';
  if (text.includes('bowl')) return 'bowler';
  if (text.includes('keeper') || text.includes('wicket')) return 'keeper';
  return 'batter';
};

const ROLE_WEIGHTS = {
  batter: { run: 1.2, wicket: 10, mom: 12, strike: 0.55 },
  bowler: { run: 0.5, wicket: 26, mom: 13, strike: 0.25 },
  allrounder: { run: 0.9, wicket: 20, mom: 14, strike: 0.4 },
  keeper: { run: 1.1, wicket: 14, mom: 12, strike: 0.5 },
};

const weightedImpactScore = (
  { totalRuns = 0, totalWickets = 0, totalMom = 0, runs = 0, wickets = 0, mom = 0, matches = 0 },
  playerRole,
) => {
  const m = Math.max(1, Number(matches) || 0);
  const roleBucket = inferRoleBucket(playerRole);
  const weights = ROLE_WEIGHTS[roleBucket];
  // Support both aggregate shapes:
  // - { totalRuns, totalWickets, totalMom }
  // - { runs, wickets, mom }
  const totalRunsResolved = Number(totalRuns) || Number(runs) || 0;
  const totalWicketsResolved = Number(totalWickets) || Number(wickets) || 0;
  const totalMomResolved = Number(totalMom) || Number(mom) || 0;
  const avgRuns = totalRunsResolved / m;
  const avgWickets = totalWicketsResolved / m;
  const momRate = totalMomResolved / m;
  const confidence = Math.sqrt(m / (m + 4));
  const strikeProxy = avgRuns + avgWickets * 8;
  const base =
    avgRuns * weights.run +
    avgWickets * weights.wicket +
    momRate * weights.mom +
    strikeProxy * weights.strike;
  return base * confidence;
};

const buildPlayerSeries = (player) => {
  const totalsByTournament = new Map();
  (player?.teams || []).forEach((team) => {
    (team.tournaments || []).forEach((row) => {
      const key = row.tournamentKey || 'current';
      if (!totalsByTournament.has(key)) {
        totalsByTournament.set(key, {
          tournamentKey: key,
          runs: 0,
          wickets: 0,
          mom: 0,
          matches: 0,
        });
      }
      const bucket = totalsByTournament.get(key);
      bucket.runs += Number(row.totalRuns) || 0;
      bucket.wickets += Number(row.totalWickets) || 0;
      bucket.mom += Number(row.totalMom) || 0;
      bucket.matches += Number(row.matches) || 0;
    });
  });
  const sorted = sortTournaments([...totalsByTournament.values()]);
  return sorted.map((row, idx) => {
    const impact = weightedImpactScore(row, player.playerRole);
    return {
      ...row,
      impact,
      cplSeasonAverage: impact,
    };
  });
};

const PlayerAvatar = ({ player }) => {
  const src = resolvePlayerImageUrl(player.profilePicture);
  if (src) {
    return <img className="pth-player-avatar" src={src} alt="" />;
  }
  return (
    <span className="pth-player-avatar pth-player-avatar--fallback">
      {(player.playerName || '?').trim().charAt(0).toUpperCase()}
    </span>
  );
};

const StatPill = ({ label, value }) => (
  <span className="pth-stat-pill">
    <strong>{value || 0}</strong>
    {label}
  </span>
);

const MiniTrendGraph = ({ series = [], metric = 'runs' }) => {
  const [activePointKey, setActivePointKey] = useState(null);
  const points = series.slice(-6);
  if (!points.length) return null;
  const values = points.map((row) => Number(row[metric]) || 0);
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const width = 112;
  const height = 34;
  const padX = 4;
  const padY = 4;
  const drawW = width - padX * 2;
  const drawH = height - padY * 2;
  const rawRange = max - min;
  const range = Math.max(rawRange, 1);

  const coords = points.map((row, idx) => {
    const value = Number(row[metric]) || 0;
    const x = padX + (drawW * idx) / Math.max(points.length - 1, 1);
    const y = padY + drawH - ((value - min) / range) * drawH;
    const matches = Math.max(1, Number(row.matches) || 0);
    return {
      x,
      y,
      value,
      key: row.tournamentKey,
      matches,
      avgRuns: round2((Number(row.runs) || 0) / matches),
      avgWickets: round2((Number(row.wickets) || 0) / matches),
      avgMom: round2((Number(row.mom) || 0) / matches),
    };
  });

  const normalizedCoords =
    rawRange === 0
      ? coords.map((point) => ({ ...point, y: height / 2 }))
      : coords;

  const linePath = normalizedCoords
    .map((point, idx) => `${idx === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');
  const areaPath = `${linePath} L ${normalizedCoords[normalizedCoords.length - 1].x.toFixed(2)} ${(height - padY).toFixed(
    2,
  )} L ${normalizedCoords[0].x.toFixed(2)} ${(height - padY).toFixed(2)} Z`;
  const gradientId = `pth-spark-${metric}-${points[0]?.tournamentKey || 'x'}-${
    points[points.length - 1]?.tournamentKey || 'y'
  }`;
  const activePoint = normalizedCoords.find((point) => point.key === activePointKey) || null;

  if (points.length === 1) {
    return (
      <div className="pth-mini-graph pth-mini-graph--single" role="img" aria-label={`${metric} single point`}>
        <span className="pth-mini-graph-dot" />
      </div>
    );
  }

  return (
    <div
      className="pth-mini-graph"
      role="img"
      aria-label={`${metric} trend over recent tournaments`}
      onMouseLeave={() => setActivePointKey(null)}
    >
      <svg className="pth-sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.03" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" />
        {normalizedCoords.map((point) => (
          <circle
            key={`${metric}-${point.key}`}
            cx={point.x}
            cy={point.y}
            r="2.6"
            fill="#1d4ed8"
            stroke="#dbeafe"
            strokeWidth="1"
            onMouseEnter={() => setActivePointKey(point.key)}
            onFocus={() => setActivePointKey(point.key)}
            onTouchStart={() => setActivePointKey(point.key)}
            tabIndex={0}
          >
            <title>{`${formatTournamentLabel(point.key)} | Score: ${round1(point.value)} | Avg: ${point.avgRuns}R, ${point.avgWickets}W, ${point.avgMom} MoM`}</title>
          </circle>
        ))}
      </svg>
      {activePoint && (
        <div
          className="pth-spark-tooltip"
          style={{ left: `${(activePoint.x / width) * 100}%` }}
        >
          <strong>{formatTournamentLabel(activePoint.key)}</strong>
          <span>Score: {round1(activePoint.value)}</span>
          <span>
            Avg: {activePoint.avgRuns}R / {activePoint.avgWickets}W / {activePoint.avgMom} MoM
          </span>
        </div>
      )}
    </div>
  );
};

const teamImpactScore = (team, playerRole) => {
  return round1(
    weightedImpactScore(
    {
      totalRuns: team.totalRuns,
      totalWickets: team.totalWickets,
      totalMom: team.totalMom,
      matches: team.matches,
    },
    playerRole,
    ),
  );
};

const buildTeamPerformance = (player) => {
  const rows = (player.teams || []).map((team) => {
    const matches = Math.max(1, Number(team.matches) || 0);
    const avgRuns = round1((Number(team.totalRuns) || 0) / matches);
    const avgWickets = round1((Number(team.totalWickets) || 0) / matches);
    const momRate = round2((Number(team.totalMom) || 0) / matches);
    const score = teamImpactScore(team, player.playerRole);
    return {
      key: team.teamName,
      teamName: team.teamName,
      teamFullName: team.teamFullName,
      matches: Number(team.matches) || 0,
      avgRuns,
      avgWickets,
      momRate,
      score,
    };
  });
  return rows.sort((a, b) => b.score - a.score);
};

const TeamPerformanceBoard = ({ teams = [] }) => {
  if (teams.length <= 1) return null;
  const maxScore = Math.max(...teams.map((t) => t.score), 1);
  return (
    <div className="pth-impact-board">
      {teams.slice(0, 6).map((team) => (
        <div className="pth-impact-row" key={`impact-${team.key}`}>
          <span className="pth-impact-label">{team.teamName}</span>
          <span className="pth-impact-track">
            <span
              className="pth-impact-fill"
              style={{ width: `${Math.max(10, Math.round((team.score / maxScore) * 100))}%` }}
            />
          </span>
          <span className="pth-impact-value">{team.score}</span>
        </div>
      ))}
    </div>
  );
};

const PlayerTeamHistoryPage = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [openTeams, setOpenTeams] = useState({});

  useEffect(() => {
    let mounted = true;
    const loadHistory = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`${API_ENDPOINTS}/api/player-stats/team-tournament-history`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load team history');
        if (mounted) setPlayers(Array.isArray(data.players) ? data.players : []);
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to load team history');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadHistory();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredPlayers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return players;
    return players.filter((player) => {
      const playerHit = String(player.playerName || '').toLowerCase().includes(needle);
      const teamHit = (player.teams || []).some((team) =>
        [team.teamName, team.teamFullName].some((value) =>
          String(value || '').toLowerCase().includes(needle)
        )
      );
      return playerHit || teamHit;
    });
  }, [players, query]);

  const toggleTeam = (playerId, teamName) => {
    const key = `${playerId}:${teamName}`;
    setOpenTeams((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="pth-page">
      <div className="pth-header">
        <div>
          <span className="pth-eyebrow">CPL archive</span>
          <h1>Player team history</h1>
        </div>
        <div className="pth-search">
          <FaSearch aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search player or team"
            aria-label="Search player or team"
          />
        </div>
      </div>
      <div className="pth-formula-box">
        <h3>Performance formula (best/worst team)</h3>
        <p>
          Score uses per-match values and role-based weights so comparison is fair across batters, bowlers, allrounders, and keepers.
        </p>
        <div className="pth-formula-code">
          score = [avgRuns * runW + avgWkts * wicketW + momRate * momW + (avgRuns + avgWkts*8) * strikeW] * sqrt(matches / (matches + 4))
        </div>
        <p className="pth-formula-weights">
          Weights: Batter (run 1.2, wicket 10, mom 12, strike 0.55), Bowler (0.5, 26, 13, 0.25), Allrounder (0.9, 20, 14, 0.4), Keeper (1.1, 14, 12, 0.5)
        </p>
      </div>

      {loading && <div className="pth-state">Loading history...</div>}
      {!loading && error && <div className="pth-state pth-state--error">{error}</div>}
      {!loading && !error && filteredPlayers.length === 0 && (
        <div className="pth-state">
          <FaUsers aria-hidden />
          <span>No team history found. Run the backfill script once.</span>
        </div>
      )}

      {!loading && !error && filteredPlayers.length > 0 && (
        <div className="pth-grid">
          {filteredPlayers.map((player) => (
            <section className="pth-player-card" key={player.playerId}>
              {(() => {
                const playerSeries = buildPlayerSeries(player);
                const teamPerformance = buildTeamPerformance(player);
                const bestTeam = teamPerformance[0] || null;
                const worstTeam =
                  teamPerformance.length > 1 ? teamPerformance[teamPerformance.length - 1] : null;
                const teamPerformanceByName = new Map(teamPerformance.map((row) => [row.teamName, row]));
                return (
                  <>
                    <div className="pth-player-head">
                      <PlayerAvatar player={player} />
                      <div className="pth-player-title">
                        <h2>{player.playerName}</h2>
                        <span>{player.playerRole || 'Player'}</span>
                        <div className="pth-form-row">
                          <MiniTrendGraph series={playerSeries} metric="cplSeasonAverage" />
                          <span className="pth-team-score-chip">CPL-by-CPL Avg</span>
                        </div>
                        <div className="pth-performance-strip">
                          <span className="pth-performance-chip">{(player.teams || []).length} teams</span>
                          {bestTeam && (
                            <span className="pth-performance-chip pth-performance-chip--best">
                              Best: {bestTeam.teamName} ({bestTeam.avgRuns}R / {bestTeam.avgWickets}W / {bestTeam.momRate} MoM)
                            </span>
                          )}
                          {worstTeam && (
                            <span className="pth-performance-chip pth-performance-chip--worst">
                              Lower: {worstTeam.teamName} ({worstTeam.avgRuns}R / {worstTeam.avgWickets}W / {worstTeam.momRate} MoM)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="pth-player-total">
                        <StatPill label="Runs" value={player.totalRuns} />
                        <StatPill label="Wkts" value={player.totalWickets} />
                        <StatPill label="MoM" value={player.totalMom} />
                        <StatPill label="Mat" value={player.matches} />
                      </div>
                    </div>
                    <TeamPerformanceBoard teams={teamPerformance} />
                    <div className="pth-team-list">
                      {(player.teams || []).map((team) => {
                        const teamKey = `${player.playerId}:${team.teamName}`;
                        const isOpen = !!openTeams[teamKey];
                        const teamSeriesRaw = sortTournaments((team.tournaments || []).map((row) => ({
                          tournamentKey: row.tournamentKey,
                          runs: Number(row.totalRuns) || 0,
                          wickets: Number(row.totalWickets) || 0,
                          mom: Number(row.totalMom) || 0,
                          matches: Number(row.matches) || 0,
                        })));
                        const teamSeries = teamSeriesRaw.map((row, idx) => ({
                          ...row,
                          cplSeasonAverage: weightedImpactScore(row, player.playerRole),
                        }));
                        const perf = teamPerformanceByName.get(team.teamName);
                        return (
                          <div className="pth-team-block" key={teamKey}>
                            <button
                              type="button"
                              className="pth-team-row"
                              onClick={() => toggleTeam(player.playerId, team.teamName)}
                            >
                              <span className="pth-team-toggle" aria-hidden>
                                {isOpen ? <FaChevronDown /> : <FaChevronRight />}
                              </span>
                              <span className="pth-team-name">
                                <strong>{team.teamName}</strong>
                                {team.teamFullName && team.teamFullName !== team.teamName ? (
                                  <small>{team.teamFullName}</small>
                                ) : null}
                                <div className="pth-form-row">
                                  <MiniTrendGraph series={teamSeries} metric="cplSeasonAverage" />
                                  {perf && (
                                    <span className="pth-team-score-chip">
                                      Avg {perf.avgRuns}R / {perf.avgWickets}W
                                    </span>
                                  )}
                                </div>
                              </span>
                              <span className="pth-team-totals">
                                <StatPill label="Runs" value={team.totalRuns} />
                                <StatPill label="Wkts" value={team.totalWickets} />
                                <StatPill label="MoM" value={team.totalMom} />
                                <StatPill label="Mat" value={team.matches} />
                              </span>
                            </button>

                            {isOpen && (
                              <div className="pth-tournament-table">
                                <div className="pth-tournament-head">
                                  <span>Tournament</span>
                                  <span>Runs</span>
                                  <span>Wkts</span>
                                  <span>MoM</span>
                                  <span>Mat</span>
                                </div>
                                {(team.tournaments || []).map((row) => (
                                  <div
                                    className="pth-tournament-row"
                                    key={`${teamKey}:${row.tournamentKey}:${row.tournamentId || ''}`}
                                  >
                                    <span>{formatTournamentLabel(row.tournamentKey)}</span>
                                    <strong>{row.totalRuns || 0}</strong>
                                    <strong>{row.totalWickets || 0}</strong>
                                    <strong>{row.totalMom || 0}</strong>
                                    <strong>{row.matches || 0}</strong>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlayerTeamHistoryPage;
