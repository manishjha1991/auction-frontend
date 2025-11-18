import React, { useEffect, useMemo, useState } from 'react';
import '../css/PlayerInsightsPage.css';
import { API_ENDPOINTS } from '../const';

const formatNumber = (value, digits = 2) =>
  typeof value === 'number' ? value.toFixed(digits) : value || '—';

const toNumber = (value) => (typeof value === 'number' ? value : Number(value) || 0);

const inferRoleBucket = (roleFocus = '') => {
  const text = (roleFocus || '').toLowerCase();
  if (text.includes('all') || text.includes('round')) return 'allrounder';
  if (text.includes('keeper')) return 'keeper';
  if (text.includes('bowl')) return 'bowler';
  return 'batter';
};

const normalizeRoleForCombo = (roleBucket) =>
  roleBucket === 'keeper' ? 'batter' : roleBucket;

const battingImpactIndex = (player = {}) => {
  if (!player.batting) return 0;
  const recentAvg = toNumber(player.batting.recentAverage);
  const overallAvg = toNumber(player.batting.average);
  const sr = toNumber(player.batting.recentStrikeRate);
  return recentAvg * 0.6 + overallAvg * 0.4 + sr / 8;
};

const bowlingImpactIndex = (player = {}) => {
  if (!player.bowling) return 0;
  const wickets = toNumber(player.bowling.wicketsPerMatch);
  const economy = toNumber(player.bowling.economy);
  const strike = toNumber(player.bowling.strikeRate);
  return wickets * 18 - economy * 1.5 - strike * 0.2;
};

const overallImpactIndex = (player, roleBucket) => {
  const formScore = toNumber(player.formScore || player.form?.score);
  const roleWeight =
    roleBucket === 'allrounder'
      ? 12
      : roleBucket === 'bowler'
      ? 6
      : roleBucket === 'keeper'
      ? 5
      : 8;
  return formScore * 0.75 + battingImpactIndex(player) + bowlingImpactIndex(player) + roleWeight;
};

const roleDescriptor = (roleBucket) => {
  switch (roleBucket) {
    case 'bowler':
      return 'strike bowler';
    case 'keeper':
      return 'keeper-batter';
    case 'allrounder':
      return '3D impact option';
    default:
      return 'top-order anchor';
  }
};

const buildPlayerNarrative = (player, roleBucket) => {
  const snippets = [];
  const formScore = player.formScore || player.form?.score;
  if (formScore) snippets.push(`form score ${formScore}`);
  if ((roleBucket === 'batter' || roleBucket === 'keeper' || roleBucket === 'allrounder') && player.batting) {
    snippets.push(
      `recent ${formatNumber(player.batting.recentAverage || 0)} @ ${formatNumber(
        player.batting.recentStrikeRate || 0
      )} SR`
    );
  }
  if ((roleBucket === 'bowler' || roleBucket === 'allrounder') && player.bowling) {
    snippets.push(
      `${formatNumber(player.bowling.wicketsPerMatch || 0)} wkts/match, ${formatNumber(
        player.bowling.economy || 0
      )} econ`
    );
  }
  return snippets.join(' • ') || 'balanced output';
};

const buildComboContext = (leader, leaderRole, trailer, trailerRole) => {
  const leaderType = normalizeRoleForCombo(leaderRole);
  const trailerType = normalizeRoleForCombo(trailerRole);

  const leaderNarrative = buildPlayerNarrative(leader, leaderRole);
  const trailerNarrative = buildPlayerNarrative(trailer, trailerRole);

  const describeNeed = (need) => ` when your XI needs ${need}`;

  if (
    (leaderType === 'batter' && trailerType === 'bowler') ||
    (leaderType === 'bowler' && trailerType === 'batter')
  ) {
    if (leaderType === 'batter') {
      return `${leader.playerName} tilts it with run production, but ${trailer.playerName} still supplies wickets (${trailerNarrative}). Pick ${trailer.playerName}${describeNeed(
        'an extra strike spell'
      )}.`;
    }
    return `${leader.playerName} wins on wicket-taking upside, whereas ${trailer.playerName} remains the safer batting anchor (${trailerNarrative}). Turn to ${trailer.playerName}${describeNeed(
      'top-order stability'
    )}.`;
  }

  if (
    (leaderType === 'batter' && trailerType === 'allrounder') ||
    (leaderType === 'allrounder' && trailerType === 'batter')
  ) {
    if (leaderType === 'allrounder') {
      return `${leader.playerName} adds dual value (${leaderNarrative}), while ${trailer.playerName} is pure batting security. Slot ${trailer.playerName} if your order still lacks an anchor.`;
    }
    return `${leader.playerName} is the premium batting option, but ${trailer.playerName} keeps you covered with overs (${trailerNarrative}). Go with ${trailer.playerName} when the balance sheet needs that extra bowling cushion.`;
  }

  if (
    (leaderType === 'bowler' && trailerType === 'allrounder') ||
    (leaderType === 'allrounder' && trailerType === 'bowler')
  ) {
    if (leaderType === 'allrounder') {
      return `${leader.playerName} offers 3D impact (${leaderNarrative}), whereas ${trailer.playerName} is your dedicated wicket hunter. Reach for ${trailer.playerName}${describeNeed(
        'pure strike overs'
      )}.`;
    }
    return `${leader.playerName} is the hotter strike bowler, yet ${trailer.playerName} plugs lower-order runs (${trailerNarrative}). Deploy ${trailer.playerName} if batting depth is the gap.`;
  }

  return '';
};

const craftRecommendationCopy = (players = []) => {
  if (!Array.isArray(players) || players.length !== 2) {
    return 'Awaiting enough data to generate an AI recommendation.';
  }
  const [rawA, rawB] = players;
  const roleA = inferRoleBucket(rawA.roleFocus);
  const roleB = inferRoleBucket(rawB.roleFocus);
  const scoreA = overallImpactIndex(rawA, roleA);
  const scoreB = overallImpactIndex(rawB, roleB);
  const leader = scoreA >= scoreB ? rawA : rawB;
  const leaderRole = scoreA >= scoreB ? roleA : roleB;
  const trailer = scoreA >= scoreB ? rawB : rawA;
  const trailerRole = scoreA >= scoreB ? roleB : roleA;
  const gap = Math.abs(scoreA - scoreB);

  if (gap < 8) {
    return `${rawA.playerName} (${buildPlayerNarrative(rawA, roleA)}) and ${rawB.playerName} (${buildPlayerNarrative(
      rawB,
      roleB
    )}) are trending evenly. Let matchups decide—lean ${roleDescriptor(
      roleA
    )} for powerplay control or ${roleDescriptor(roleB)} if you need flexibility.`;
  }

  const base = `${leader.playerName} profiles as the sharper ${roleDescriptor(
    leaderRole
  )} right now (${buildPlayerNarrative(leader, leaderRole)}). ${trailer.playerName} still offers ${buildPlayerNarrative(
    trailer,
    trailerRole
  )}, so deploy when the role requirement matches their strengths.`;

  const comboContext = buildComboContext(leader, leaderRole, trailer, trailerRole);
  return comboContext ? `${base} ${comboContext}` : base;
};

const InsightCard = ({ insight }) => {
  if (!insight) {
    return (
      <div className="insight-card muted">
        Select a player to view insights.
      </div>
    );
  }

  if (!insight.hasStats) {
    return (
      <div className="insight-card muted">
        <p>{insight.summary}</p>
      </div>
    );
  }

  return (
    <div className="insight-card">
      <div className="insight-header">
        <div>
          <h2>{insight.playerName}</h2>
          <span>{insight.teamName}</span>
        </div>
        {insight.form?.score && (
          <div className="form-score">
            Form {insight.form.score}/100
          </div>
        )}
      </div>
      <p className="insight-summary">{insight.summary}</p>
      {insight.form?.tags && (
        <div className="insight-tags">
          {insight.form.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      )}
      <div className="insight-metrics">
        <div>
          <span className="label">Recent Avg</span>
          <strong>
            {insight.batting ? formatNumber(insight.batting.recentAverage) : '—'} runs
          </strong>
        </div>
        <div>
          <span className="label">Recent SR</span>
          <strong>
            {insight.batting
              ? formatNumber(insight.batting.recentStrikeRate)
              : '—'}{' '}
            SR
          </strong>
        </div>
        <div>
          <span className="label">Wkts / Match</span>
          <strong>
            {insight.bowling
              ? formatNumber(insight.bowling.wicketsPerMatch)
              : '—'}
          </strong>
        </div>
        <div>
          <span className="label">Economy</span>
          <strong>
            {insight.bowling ? formatNumber(insight.bowling.economy) : '—'}
          </strong>
        </div>
      </div>
      {insight.form?.projection && (
        <p className="projection">{insight.form.projection}</p>
      )}
      {insight.recentMatches && insight.recentMatches.length > 0 && (
        <div className="insight-recent">
          <h4>Recent Trend</h4>
          <div className="recent-list">
            {insight.recentMatches.slice(0, 4).map((match, idx) => (
              <div key={`${match.matchLabel}-${idx}`} className="recent-item">
                <div className="title">
                  {match.matchLabel} · {match.opponent}
                </div>
                <div className="values">
                  <span>{match.runs} runs</span>
                  <span>{match.wickets} wkts</span>
                  {match.strikeRate && <span>{match.strikeRate} SR</span>}
                </div>
                <div className="highlight">{match.highlight}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PlayerInsightsPage = () => {
  const [players, setPlayers] = useState([]);
  const [userTeam, setUserTeam] = useState(null);
  const [primaryPlayerId, setPrimaryPlayerId] = useState('');
  const [primaryInsight, setPrimaryInsight] = useState(null);
  const [primaryLoading, setPrimaryLoading] = useState(false);
  const [primaryError, setPrimaryError] = useState(null);

  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');
  const [comparisonResult, setComparisonResult] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState(null);
  const [playerFilter, setPlayerFilter] = useState('');
  const [compareFilterA, setCompareFilterA] = useState('');
  const [compareFilterB, setCompareFilterB] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUserTeam(parsed?.teamName || null);
      } catch {}
    }
  }, []);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS}/api/players/data`);
        const data = await response.json();
        if (Array.isArray(data)) {
          const sorted = data
            .map((p) => ({
              id: p.id || p._id,
              name: p.name,
              role: p.role,
              type: p.type,
              teamName: p.teamName || p.ownerTeamName || null,
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

          const prioritized =
            userTeam && sorted.length
              ? [
                  ...sorted.filter((p) => p.teamName === userTeam),
                  ...sorted.filter((p) => p.teamName !== userTeam),
                ]
              : sorted;

          setPlayers(prioritized);
          if (prioritized.length > 0) {
            setPrimaryPlayerId(prioritized[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to load players', error);
      }
    };

    fetchPlayers();
  }, [userTeam]);

  useEffect(() => {
    const fetchInsight = async () => {
      if (!primaryPlayerId) return;
      try {
        setPrimaryLoading(true);
        setPrimaryError(null);
        const response = await fetch(
          `${API_ENDPOINTS}/api/player-stats/insights/${primaryPlayerId}`
        );
        if (!response.ok) {
          throw new Error('Unable to fetch insight');
        }
        const data = await response.json();
        setPrimaryInsight(data);
      } catch (error) {
        setPrimaryError(error.message || 'Unable to fetch insight');
        setPrimaryInsight(null);
      } finally {
        setPrimaryLoading(false);
      }
    };

    fetchInsight();
  }, [primaryPlayerId]);

  const filteredPlayers = useMemo(() => {
    if (!playerFilter) return players;
    const needle = playerFilter.toLowerCase();
    return players.filter((player) =>
      player.name.toLowerCase().includes(needle)
    );
  }, [players, playerFilter]);

  useEffect(() => {
    if (!primaryPlayerId && filteredPlayers.length) {
      setPrimaryPlayerId(filteredPlayers[0].id);
      return;
    }
    const stillVisible = filteredPlayers.some((p) => p.id === primaryPlayerId);
    if (!stillVisible && filteredPlayers.length) {
      setPrimaryPlayerId(filteredPlayers[0].id);
    }
  }, [filteredPlayers, primaryPlayerId]);

  const mainPlayerOptions = useMemo(
    () =>
      filteredPlayers.map((player) => (
        <option key={player.id} value={player.id}>
          {player.name} · {player.role}
        </option>
      )),
    [filteredPlayers]
  );

  const filteredCompareA = useMemo(() => {
    if (!compareFilterA) return players;
    const needle = compareFilterA.toLowerCase();
    return players.filter((player) =>
      player.name.toLowerCase().includes(needle)
    );
  }, [players, compareFilterA]);

  const filteredCompareB = useMemo(() => {
    if (!compareFilterB) return players;
    const needle = compareFilterB.toLowerCase();
    return players.filter((player) =>
      player.name.toLowerCase().includes(needle)
    );
  }, [players, compareFilterB]);

  useEffect(() => {
    if (compareA) {
      const exists = players.some((p) => p.id === compareA);
      if (!exists) setCompareA('');
    }
    if (compareB) {
      const exists = players.some((p) => p.id === compareB);
      if (!exists) setCompareB('');
    }
  }, [players, compareA, compareB]);

  const decorateComparisonResult = (result) => {
    if (!result?.players || result.players.length !== 2) return result;
    return {
      ...result,
      recommendation: craftRecommendationCopy(result.players),
    };
  };

  const handleCompare = async () => {
    if (!compareA || !compareB || compareA === compareB) {
      setCompareError('Select two distinct players to compare.');
      setComparisonResult(null);
      return;
    }

    try {
      setCompareLoading(true);
      setCompareError(null);
      const response = await fetch(`${API_ENDPOINTS}/api/player-stats/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerAId: compareA, playerBId: compareB }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Compare failed');
      }
      const data = await response.json();
      setComparisonResult(decorateComparisonResult(data));
    } catch (error) {
      setCompareError(error.message || 'Compare failed');
      setComparisonResult(null);
    } finally {
      setCompareLoading(false);
    }
  };

  return (
    <div className="player-insights-page">
      <div className="page-header">
        <div>
          <h1>Player Performance Insights</h1>
          <p>
            Analyst-style breakdowns for every player. Select a player to view recent
            form, projections, and key trends. Use comparison to pick between two
            prospects.
          </p>
        </div>
      </div>

      <div className="insight-layout">
        <aside className="insight-sidebar">
          <label htmlFor="playerSelect">Choose Player</label>
          <input
            type="text"
            className="player-search-input"
            placeholder="Search player..."
            value={playerFilter}
            onChange={(e) => setPlayerFilter(e.target.value)}
          />
          <select
            id="playerSelect"
            value={primaryPlayerId}
            onChange={(e) => setPrimaryPlayerId(e.target.value)}
          >
            {mainPlayerOptions}
          </select>

          <div className="compare-section">
            <h4>Compare Players</h4>
            <label htmlFor="compareA">Player A</label>
            <input
              type="text"
              className="player-search-input"
              placeholder="Search player..."
              value={compareFilterA}
              onChange={(e) => setCompareFilterA(e.target.value)}
            />
            <select
              id="compareA"
              value={compareA}
              onChange={(e) => setCompareA(e.target.value)}
            >
              <option value="">Select player</option>
              {filteredCompareA.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name} · {player.role}
                </option>
              ))}
            </select>
            <label htmlFor="compareB">Player B</label>
            <input
              type="text"
              className="player-search-input"
              placeholder="Search player..."
              value={compareFilterB}
              onChange={(e) => setCompareFilterB(e.target.value)}
            />
            <select
              id="compareB"
              value={compareB}
              onChange={(e) => setCompareB(e.target.value)}
            >
              <option value="">Select player</option>
              {filteredCompareB.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name} · {player.role}
                </option>
              ))}
            </select>
            <button
              className="compare-btn"
              onClick={handleCompare}
              disabled={compareLoading}
            >
              {compareLoading ? 'Comparing...' : 'Compare'}
            </button>
            {compareError && <p className="compare-error">{compareError}</p>}
          </div>
        </aside>

        <section className="insight-main">
          {primaryLoading ? (
            <div className="insight-card muted">Loading insight...</div>
          ) : primaryError ? (
            <div className="insight-card muted">{primaryError}</div>
          ) : (
            <InsightCard insight={primaryInsight} />
          )}

          {comparisonResult && (
            <div className="comparison-panel">
              <div className="comparison-cards">
                {comparisonResult.players?.map((player) => (
                  <div key={player.playerId} className="comparison-card">
                    <div className="comparison-header">
                      <h3>{player.playerName}</h3>
                      <span>{player.teamName}</span>
                      {player.formScore && (
                        <span className="form-score small">
                          {player.formScore}/100
                        </span>
                      )}
                    </div>
                    <p className="role-focus">{player.roleFocus}</p>
                    <div className="insight-metrics compact">
                      <div>
                        <span className="label">Recent Avg</span>
                        <strong>
                          {player.batting
                            ? formatNumber(player.batting.recentAverage)
                            : '—'}{' '}
                          runs
                        </strong>
                      </div>
                      <div>
                        <span className="label">SR</span>
                        <strong>
                          {player.batting
                            ? formatNumber(player.batting.recentStrikeRate)
                            : '—'}
                        </strong>
                      </div>
                      <div>
                        <span className="label">Wkts / Match</span>
                        <strong>
                          {player.bowling
                            ? formatNumber(player.bowling.wicketsPerMatch)
                            : '—'}
                        </strong>
                      </div>
                      <div>
                        <span className="label">Economy</span>
                        <strong>
                          {player.bowling
                            ? formatNumber(player.bowling.economy)
                            : '—'}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="recommendation">
                <strong>AI Recommendation:</strong>
                <p>{comparisonResult.recommendation}</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PlayerInsightsPage;

