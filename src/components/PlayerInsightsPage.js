import React, { useEffect, useMemo, useState } from 'react';
import '../css/PlayerInsightsPage.css';
import { API_ENDPOINTS } from '../const';

const formatNumber = (value, digits = 2) =>
  typeof value === 'number' ? value.toFixed(digits) : value || '—';

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
      setComparisonResult(data);
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

