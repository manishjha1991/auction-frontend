// src/components/StatsOverview.js
import React, { useEffect, useState } from 'react';
import {
  FaFireAlt,
  FaShieldAlt,
  FaBowlingBall,
  FaStar,
  FaTimes,
  FaEye,
  FaTrophy,
  FaChartLine
} from 'react-icons/fa';
import '../css/StatsOverview.css';
import { API_ENDPOINTS } from "../const";

const StatsOverview = () => {
  // State to hold the fetched stats
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teams, setTeams] = useState([]);
  
  // Modal state for detailed view
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [modalTitle, setModalTitle] = useState('');

  // Helper function to get team abbreviation
  const getTeamAbbreviation = (teamName) => {
    if (!teamName) return 'N/A';
    const team = teams.find(t => t.teamName === teamName);
    if (team && team.abbreviation) {
      return team.abbreviation;
    }
    // Fallback: use first 3 characters if no abbreviation found
    return teamName.slice(0, 3).toUpperCase();
  };

  // Helper function to get player type class for rank badge
  const getPlayerTypeClass = (playerType) => {
    if (!playerType) return '';
    const normalizedType = playerType.toLowerCase();
    if (normalizedType === 'sapphire') return 'type-sapphire';
    if (normalizedType === 'emerald') return 'type-emerald';
    if (normalizedType === 'gold') return 'type-gold';
    if (normalizedType === 'silver') return 'type-silver';
    return '';
  };

  // Fetch teams data
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS}/api/users/teams`);
        const data = await response.json();
        setTeams(Array.isArray(data) ? data : (data?.teams || []));
      } catch (err) {
        console.error('Error fetching teams:', err);
      }
    };

    fetchTeams();
  }, []);

  // Fetch data from the /stats-overview API when component mounts
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS}/api/player-stats/stats-overview`);
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = await response.json();
        setStatsData(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Function to handle opening detailed modal
  const handleViewDetails = async (type, playerId) => {
    try {
      const response = await fetch(`${API_ENDPOINTS}/api/player-stats/player-details/${playerId}`);
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const data = await response.json();
      
      setModalTitle(type === 'batting' ? 'Top 5 Run Scorer Details' : 'Top 5 Wicket Taker Details');
      setModalData(data);
      setShowModal(true);
    } catch (err) {
      console.error('Error fetching player details:', err);
      alert('Error loading player details');
    }
  };

  // Function to close modal
  const closeModal = () => {
    setShowModal(false);
    setModalData(null);
    setModalTitle('');
  };

  if (loading) {
    return <div className="stats-overview-wrapper">Loading...</div>;
  }

  if (error) {
    return <div className="stats-overview-wrapper">Error: {error}</div>;
  }

  // Destructure the fields from the fetched data
  const {
    highestStrikeRate = {},
    bestEconomicalBowler = {},
    highestWicketTakerInMatch = {},
    highestScore = {},
    leadingWicketTaker = {},
    leadingRunScorer = {},
    highestTeamTotal = {},
    lowestTeamTotal = {},
    highestFiveWicketHauls = [],
    highestFourWicketHauls = [],
    centuries = [],
    halfCenturies = [],

    // NEW "Top 5" fields
    top5RunScorers = [],
    top5WicketTakers = [],
    top5MOM = [],
    top5BowlingStrikeRate = [],
    top5BestBattingAverage = [],
  } = statsData || {};

  return (
    <div className="stats-overview-wrapper">
      {/* Leading Performers Section - Orange and Purple Boxes */}
      <div className="leading-performers">
        {/* Leading Run Scorer - Orange Box */}
        <div className="leading-box orange-box">
          <div className="player-info">
            <p><strong>{leadingRunScorer.playerName || 'N/A'}</strong></p>
            <p>{leadingRunScorer.teamName || 'N/A'}</p>
          </div>
          <div className="highlight-stat">{leadingRunScorer.totalRuns || 0}</div>
          <span className="stat-label">Runs</span>
        </div>

        {/* Leading Wicket Taker - Purple Box */}
        <div className="leading-box purple-box">
          <div className="player-info">
            <p><strong>{leadingWicketTaker.playerName || 'N/A'}</strong></p>
            <p>{leadingWicketTaker.teamName || 'N/A'}</p>
          </div>
          <div className="highlight-stat">{leadingWicketTaker.totalWickets || 0}</div>
          <span className="stat-label">Wickets</span>
        </div>
      </div>

      {/* Performance Highlights Section */}
      <div className="top-performers-section fade-in-up">
        <h2 className="performance-section-title">
          <FaTrophy /> Performance Highlights
        </h2>
        <div className="top-performers-grid">
          {/* Highest Strike Rate */}
          <div className="top-performer-card">
            <div className="top-performer-header">
              <div className="top-performer-title">
                <FaFireAlt className="icon" />
                <span>Highest Strike Rate</span>
              </div>
            </div>
            <div className="highlight-card-content">
              <div className="highlight-player-name">{highestStrikeRate.playerName || 'N/A'}</div>
              <div className="highlight-team-abbr">
                <span className="team-abbr-badge">{getTeamAbbreviation(highestStrikeRate.teamName)}</span>
                {highestStrikeRate.opponentTeam && (
                  <>
                    <span className="vs-text">vs</span>
                    <span className="team-abbr-badge opponent">{getTeamAbbreviation(highestStrikeRate.opponentTeam)}</span>
                  </>
                )}
              </div>
              <div className="highlight-stat-value">{highestStrikeRate.strikeRate || 0}</div>
              {(highestStrikeRate.runs !== undefined || highestStrikeRate.balls !== undefined) && (
                <div className="highlight-match-stats">
                  {highestStrikeRate.runs !== undefined && <span>{highestStrikeRate.runs} runs</span>}
                  {highestStrikeRate.balls !== undefined && <span>{highestStrikeRate.balls} balls</span>}
                </div>
              )}
            </div>
          </div>

          {/* Best Economy */}
          <div className="top-performer-card">
            <div className="top-performer-header">
              <div className="top-performer-title">
                <FaShieldAlt className="icon" />
                <span>Best Economy</span>
              </div>
            </div>
            <div className="highlight-card-content">
              <div className="highlight-player-name">{bestEconomicalBowler.playerName || 'N/A'}</div>
              <div className="highlight-team-abbr">
                <span className="team-abbr-badge">{getTeamAbbreviation(bestEconomicalBowler.teamName)}</span>
                {bestEconomicalBowler.opponentTeam && (
                  <>
                    <span className="vs-text">vs</span>
                    <span className="team-abbr-badge opponent">{getTeamAbbreviation(bestEconomicalBowler.opponentTeam)}</span>
                  </>
                )}
              </div>
              <div className="highlight-stat-value">{bestEconomicalBowler.economy || 0}</div>
              {(bestEconomicalBowler.wickets !== undefined || bestEconomicalBowler.runsGiven !== undefined || bestEconomicalBowler.ballsBowled !== undefined) && (
                <div className="highlight-match-stats">
                  {bestEconomicalBowler.wickets !== undefined && <span>{bestEconomicalBowler.wickets} wkts</span>}
                  {bestEconomicalBowler.runsGiven !== undefined && bestEconomicalBowler.ballsBowled !== undefined && (
                    <span>{bestEconomicalBowler.runsGiven}/{Math.floor(bestEconomicalBowler.ballsBowled / 6)}.{bestEconomicalBowler.ballsBowled % 6}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Highest Wickets (Single Match) */}
          <div className="top-performer-card">
            <div className="top-performer-header">
              <div className="top-performer-title">
                <FaBowlingBall className="icon" />
                <span>Highest Wickets</span>
              </div>
            </div>
            <div className="highlight-card-content">
              <div className="highlight-player-name">{highestWicketTakerInMatch.playerName || 'N/A'}</div>
              <div className="highlight-team-abbr">
                <span className="team-abbr-badge">{getTeamAbbreviation(highestWicketTakerInMatch.teamName)}</span>
                {highestWicketTakerInMatch.opponentTeam && (
                  <>
                    <span className="vs-text">vs</span>
                    <span className="team-abbr-badge opponent">{getTeamAbbreviation(highestWicketTakerInMatch.opponentTeam)}</span>
                  </>
                )}
              </div>
              <div className="highlight-stat-value">{highestWicketTakerInMatch.wickets || 0}</div>
              {(highestWicketTakerInMatch.runsGiven !== undefined || highestWicketTakerInMatch.ballsBowled !== undefined) && (
                <div className="highlight-match-stats">
                  {highestWicketTakerInMatch.runsGiven !== undefined && highestWicketTakerInMatch.ballsBowled !== undefined && (
                    <span>{highestWicketTakerInMatch.runsGiven}/{Math.floor(highestWicketTakerInMatch.ballsBowled / 6)}.{highestWicketTakerInMatch.ballsBowled % 6}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Highest Score */}
          <div className="top-performer-card">
            <div className="top-performer-header">
              <div className="top-performer-title">
                <FaFireAlt className="icon" />
                <span>Highest Score</span>
              </div>
            </div>
            <div className="highlight-card-content">
              <div className="highlight-player-name">{highestScore.playerName || 'N/A'}</div>
              <div className="highlight-team-abbr">
                <span className="team-abbr-badge">{getTeamAbbreviation(highestScore.teamName)}</span>
                {highestScore.opponentTeam && (
                  <>
                    <span className="vs-text">vs</span>
                    <span className="team-abbr-badge opponent">{getTeamAbbreviation(highestScore.opponentTeam)}</span>
                  </>
                )}
              </div>
              <div className="highlight-stat-value">{highestScore.score || 0}</div>
              {(highestScore.balls !== undefined || highestScore.strikeRate !== undefined) && (
                <div className="highlight-match-stats">
                  {highestScore.balls !== undefined && <span>{highestScore.balls} balls</span>}
                  {highestScore.strikeRate !== undefined && highestScore.strikeRate > 0 && <span>SR: {highestScore.strikeRate}</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Team Totals Section */}
      <div className="top-performers-section fade-in-up">
        <h2 className="performance-section-title">
          <FaChartLine /> Team Totals
        </h2>
        <div className="top-performers-grid">
          <div className="top-performer-card">
            <div className="top-performer-header">
              <div className="top-performer-title">
                <FaFireAlt className="icon" />
                <span>Highest Total</span>
              </div>
            </div>
            <div className="highlight-card-content">
              <div className="highlight-player-name">
                {highestTeamTotal.teamName || 'N/A'}
                {highestTeamTotal.opponentTeam ? ` vs ${highestTeamTotal.opponentTeam}` : ''}
              </div>
              <div className="highlight-stat-value">{highestTeamTotal.runs || 0}</div>
              <div className="highlight-match-stats">
                <span>{highestTeamTotal.overs || 0} overs</span>
                <span>{highestTeamTotal.wickets ?? 0} wkts</span>
              </div>
            </div>
          </div>

          <div className="top-performer-card">
            <div className="top-performer-header">
              <div className="top-performer-title">
                <FaShieldAlt className="icon" />
                <span>Lowest Total</span>
              </div>
            </div>
            <div className="highlight-card-content">
              <div className="highlight-player-name">
                {lowestTeamTotal.teamName || 'N/A'}
                {lowestTeamTotal.opponentTeam ? ` vs ${lowestTeamTotal.opponentTeam}` : ''}
              </div>
              <div className="highlight-stat-value">{lowestTeamTotal.runs || 0}</div>
              <div className="highlight-match-stats">
                <span>{lowestTeamTotal.overs || 0} overs</span>
                <span>{lowestTeamTotal.wickets ?? 0} wkts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers Section */}
      <div className="top-performers-section fade-in-up">
        <h2 className="performance-section-title">
          <FaChartLine /> Top Performers
        </h2>
        <div className="top-performers-grid">
          {/* Top 5 Run Scorers */}
          <div className="top-performer-card clickable-card" onClick={() => top5RunScorers[0] && handleViewDetails('batting', top5RunScorers[0].playerId)}>
            <div className="top-performer-header">
              <div className="top-performer-title">
                <FaFireAlt className="icon" />
                <span>Top Run Scorers</span>
              </div>
              <FaEye className="view-icon" />
            </div>
            <ul className="top-performer-list">
              {top5RunScorers.length > 0 ? (
                top5RunScorers.map((player, i) => (
                  <li key={i} className="top-performer-item" onClick={(e) => { e.stopPropagation(); handleViewDetails('batting', player.playerId); }}>
                    <span className={`rank-badge ${getPlayerTypeClass(player.playerType)}`}>{i + 1}</span>
                    <div className="top-performer-item-info">
                      <div className="top-performer-item-name">{player.playerName}</div>
                      <div className="top-performer-item-team">{player.teamName}</div>
                    </div>
                    <div className="top-performer-stat">
                      <div>{player.runs} Runs</div>
                      {(player.halfCenturies > 0 || player.centuries > 0) && (
                        <div className="achievement-badges">
                          {player.halfCenturies > 0 && (
                            <span className="achievement-badge achievement-50">
                              50: {player.halfCenturies}
                            </span>
                          )}
                          {player.centuries > 0 && (
                            <span className="achievement-badge achievement-100">
                              100: {player.centuries}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                ))
              ) : (
                <li style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No data available</li>
              )}
            </ul>
          </div>

          {/* Top 5 Wicket Takers */}
          <div className="top-performer-card clickable-card" onClick={() => top5WicketTakers[0] && handleViewDetails('bowling', top5WicketTakers[0].playerId)}>
            <div className="top-performer-header">
              <div className="top-performer-title">
                <FaBowlingBall className="icon" />
                <span>Top Wicket Takers</span>
              </div>
              <FaEye className="view-icon" />
            </div>
            <ul className="top-performer-list">
              {top5WicketTakers.length > 0 ? (
                top5WicketTakers.map((player, i) => (
                  <li key={i} className="top-performer-item" onClick={(e) => { e.stopPropagation(); handleViewDetails('bowling', player.playerId); }}>
                    <span className={`rank-badge ${getPlayerTypeClass(player.playerType)}`}>{i + 1}</span>
                    <div className="top-performer-item-info">
                      <div className="top-performer-item-name">{player.playerName}</div>
                      <div className="top-performer-item-team">{player.teamName}</div>
                    </div>
                    <div className="top-performer-stat">
                      <div>{player.wickets} Wkts</div>
                      {(player.fourWicketHauls > 0 || player.fiveWicketHauls > 0) && (
                        <div className="achievement-badges">
                          {player.fourWicketHauls > 0 && (
                            <span className="achievement-badge achievement-4w">
                              4W: {player.fourWicketHauls}
                            </span>
                          )}
                          {player.fiveWicketHauls > 0 && (
                            <span className="achievement-badge achievement-5w">
                              5W: {player.fiveWicketHauls}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                ))
              ) : (
                <li style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No data available</li>
              )}
            </ul>
          </div>

          {/* Top 5 MOM */}
          <div className="top-performer-card">
            <div className="top-performer-header">
              <div className="top-performer-title">
                <FaStar className="icon" />
                <span>Top MoM</span>
              </div>
            </div>
            <ul className="top-performer-list">
              {top5MOM.length > 0 ? (
                top5MOM.map((player, i) => (
                  <li key={i} className="top-performer-item">
                    <span className={`rank-badge ${getPlayerTypeClass(player.playerType)}`}>{i + 1}</span>
                    <div className="top-performer-item-info">
                      <div className="top-performer-item-name">{player.playerName}</div>
                      <div className="top-performer-item-team">{player.teamName}</div>
                    </div>
                    <div className="top-performer-stat">{player.momCount} MoM</div>
                  </li>
                ))
              ) : (
                <li style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No data available</li>
              )}
            </ul>
          </div>

          {/* Top 5 Bowling Strike Rate */}
          <div className="top-performer-card">
            <div className="top-performer-header">
              <div className="top-performer-title">
                <FaBowlingBall className="icon" />
                <span>Best Bowling S/R</span>
              </div>
            </div>
            <ul className="top-performer-list">
              {top5BowlingStrikeRate.length > 0 ? (
                top5BowlingStrikeRate.map((player, i) => (
                  <li key={i} className="top-performer-item">
                    <span className={`rank-badge ${getPlayerTypeClass(player.playerType)}`}>{i + 1}</span>
                    <div className="top-performer-item-info">
                      <div className="top-performer-item-name">{player.playerName}</div>
                      <div className="top-performer-item-team">{player.teamName}</div>
                    </div>
                    <div className="top-performer-stat">{player.strikeRate.toFixed(1)} S/R</div>
                  </li>
                ))
              ) : (
                <li style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No data available</li>
              )}
            </ul>
          </div>

          {/* Top 5 Best Batting Average */}
          <div className="top-performer-card">
            <div className="top-performer-header">
              <div className="top-performer-title">
                <FaFireAlt className="icon" />
                <span>Best Batting Avg</span>
              </div>
            </div>
            <ul className="top-performer-list">
              {top5BestBattingAverage.length > 0 ? (
                top5BestBattingAverage.map((player, i) => (
                  <li key={i} className="top-performer-item">
                    <span className={`rank-badge ${getPlayerTypeClass(player.playerType)}`}>{i + 1}</span>
                    <div className="top-performer-item-info">
                      <div className="top-performer-item-name">{player.playerName}</div>
                      <div className="top-performer-item-team">{player.teamName}</div>
                    </div>
                    <div className="top-performer-stat">{player.average.toFixed(2)} Avg</div>
                  </li>
                ))
              ) : (
                <li style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No data available</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Records Section - Card Based */}
      <div className="top-performers-section fade-in-up">
        <h2 className="performance-section-title">
          <FaTrophy /> Records & Achievements
        </h2>
        <div className="top-performers-grid">
          {/* Highest 5-Wicket Hauls */}
          <div className="top-performer-card">
            <div className="top-performer-header">
              <div className="top-performer-title">
                <FaBowlingBall className="icon" />
                <span>5-Wicket Hauls</span>
              </div>
            </div>
            <ul className="top-performer-list">
              {highestFiveWicketHauls.length > 0 ? (
                highestFiveWicketHauls.map((haul, i) => {
                  const overs = haul.ballsBowled 
                    ? `${Math.floor(haul.ballsBowled / 6)}.${haul.ballsBowled % 6}` 
                    : '0.0';
                  return (
                    <li key={i} className="top-performer-item">
                      <span className={`rank-badge ${getPlayerTypeClass(haul.playerType)}`}>{i + 1}</span>
                      <div className="top-performer-item-info">
                        <div className="top-performer-item-name">{haul.playerName}</div>
                        <div className="top-performer-item-teams-inline">
                          <span className="team-abbr-badge">{getTeamAbbreviation(haul.teamName)}</span>
                          <span className="vs-text">vs</span>
                          <span className="team-abbr-badge opponent">{getTeamAbbreviation(haul.opponentTeam)}</span>
                        </div>
                      </div>
                      <div className="top-performer-stat">
                        <div>{haul.wickets} wkts</div>
                        {haul.runsGiven !== undefined && haul.ballsBowled !== undefined && (
                          <div className="stat-detail">{haul.runsGiven}/{overs}</div>
                        )}
                      </div>
                    </li>
                  );
                })
              ) : (
                <li style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No data available</li>
              )}
            </ul>
          </div>

          {/* Highest 4-Wicket Hauls */}
          <div className="top-performer-card">
            <div className="top-performer-header">
              <div className="top-performer-title">
                <FaBowlingBall className="icon" />
                <span>4-Wicket Hauls</span>
              </div>
            </div>
            <ul className="top-performer-list">
              {highestFourWicketHauls.length > 0 ? (
                highestFourWicketHauls.map((haul, i) => {
                  const overs = haul.ballsBowled 
                    ? `${Math.floor(haul.ballsBowled / 6)}.${haul.ballsBowled % 6}` 
                    : '0.0';
                  return (
                    <li key={i} className="top-performer-item">
                      <span className={`rank-badge ${getPlayerTypeClass(haul.playerType)}`}>{i + 1}</span>
                      <div className="top-performer-item-info">
                        <div className="top-performer-item-name">{haul.playerName}</div>
                        <div className="top-performer-item-teams-inline">
                          <span className="team-abbr-badge">{getTeamAbbreviation(haul.teamName)}</span>
                          <span className="vs-text">vs</span>
                          <span className="team-abbr-badge opponent">{getTeamAbbreviation(haul.opponentTeam)}</span>
                        </div>
                      </div>
                      <div className="top-performer-stat">
                        <div>{haul.wickets} wkts</div>
                        {haul.runsGiven !== undefined && haul.ballsBowled !== undefined && (
                          <div className="stat-detail">{haul.runsGiven}/{overs}</div>
                        )}
                      </div>
                    </li>
                  );
                })
              ) : (
                <li style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No data available</li>
              )}
            </ul>
          </div>

          {/* Centuries */}
          <div className="top-performer-card">
            <div className="top-performer-header">
              <div className="top-performer-title">
                <FaFireAlt className="icon" />
                <span>Centuries</span>
              </div>
            </div>
            <ul className="top-performer-list">
              {centuries.length > 0 ? (
                centuries.map((c, i) => (
                  <li key={i} className="top-performer-item">
                    <span className={`rank-badge ${getPlayerTypeClass(c.playerType)}`}>{i + 1}</span>
                      <div className="top-performer-item-info">
                        <div className="top-performer-item-name">{c.playerName}</div>
                        <div className="top-performer-item-teams-inline">
                          <span className="team-abbr-badge">{getTeamAbbreviation(c.teamName)}</span>
                          <span className="vs-text">vs</span>
                          <span className="team-abbr-badge opponent">{getTeamAbbreviation(c.againstTeam)}</span>
                        </div>
                      </div>
                    <div className="top-performer-stat">
                      <div>{c.runs} runs</div>
                      {c.balls !== undefined && (
                        <div className="stat-detail">{c.balls} balls</div>
                      )}
                    </div>
                  </li>
                ))
              ) : (
                <li style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No data available</li>
              )}
            </ul>
          </div>

          {/* Half Centuries */}
          <div className="top-performer-card">
            <div className="top-performer-header">
              <div className="top-performer-title">
                <FaFireAlt className="icon" />
                <span>Half Centuries</span>
              </div>
            </div>
            <ul className="top-performer-list">
              {halfCenturies.length > 0 ? (
                halfCenturies.map((hc, i) => (
                  <li key={i} className="top-performer-item">
                    <span className={`rank-badge ${getPlayerTypeClass(hc.playerType)}`}>{i + 1}</span>
                      <div className="top-performer-item-info">
                        <div className="top-performer-item-name">{hc.playerName}</div>
                        <div className="top-performer-item-teams-inline">
                          <span className="team-abbr-badge">{getTeamAbbreviation(hc.teamName)}</span>
                          <span className="vs-text">vs</span>
                          <span className="team-abbr-badge opponent">{getTeamAbbreviation(hc.againstTeam)}</span>
                        </div>
                      </div>
                    <div className="top-performer-stat">
                      <div>{hc.runs} runs</div>
                      {hc.balls !== undefined && (
                        <div className="stat-detail">{hc.balls} balls</div>
                      )}
                    </div>
                  </li>
                ))
              ) : (
                <li style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No data available</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Player Details Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content player-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <FaTrophy className="modal-icon" />
                {modalTitle}
              </h2>
              <button className="close-btn" onClick={closeModal}>
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body">
              {modalData && (
                <div className="player-details-content">
                  {/* Player Summary */}
                  <div className="player-summary">
                    <div className="player-header">
                      <h3 className="player-name">{modalData.playerName}</h3>
                      <span className="player-team">{modalData.teamName}</span>
                    </div>
                    <div className="player-stats-overview">
                      {modalData.type === 'batting' ? (
                        <>
                          <div className="stat-item">
                            <FaChartLine className="stat-icon" />
                            <span className="stat-label">Total Runs</span>
                            <span className="stat-value">{modalData.totalRuns || 0}</span>
                          </div>
                          <div className="stat-item">
                            <FaFireAlt className="stat-icon" />
                            <span className="stat-label">Average</span>
                            <span className="stat-value">{modalData.average ? modalData.average.toFixed(2) : 0}</span>
                          </div>
                          <div className="stat-item">
                            <FaStar className="stat-icon" />
                            <span className="stat-label">Strike Rate</span>
                            <span className="stat-value">{modalData.strikeRate ? modalData.strikeRate.toFixed(2) : 0}</span>
                          </div>
                          {(modalData.halfCenturies > 0 || modalData.centuries > 0) && (
                            <div className="stat-item">
                              <FaTrophy className="stat-icon" />
                              <span className="stat-label">Milestones</span>
                              <div className="achievement-badges" style={{ justifyContent: 'flex-start', marginTop: '0.5rem' }}>
                                {modalData.halfCenturies > 0 && (
                                  <span className="achievement-badge achievement-50">
                                    50: {modalData.halfCenturies}
                                  </span>
                                )}
                                {modalData.centuries > 0 && (
                                  <span className="achievement-badge achievement-100">
                                    100: {modalData.centuries}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="stat-item">
                            <FaBowlingBall className="stat-icon" />
                            <span className="stat-label">Total Wickets</span>
                            <span className="stat-value">{modalData.totalWickets || 0}</span>
                          </div>
                          <div className="stat-item">
                            <FaShieldAlt className="stat-icon" />
                            <span className="stat-label">Economy</span>
                            <span className="stat-value">{modalData.economy ? modalData.economy.toFixed(2) : 0}</span>
                          </div>
                          <div className="stat-item">
                            <FaChartLine className="stat-icon" />
                            <span className="stat-label">Strike Rate</span>
                            <span className="stat-value">{modalData.strikeRate ? modalData.strikeRate.toFixed(1) : 0}</span>
                          </div>
                          {(modalData.fourWicketHauls > 0 || modalData.fiveWicketHauls > 0) && (
                            <div className="stat-item">
                              <FaTrophy className="stat-icon" />
                              <span className="stat-label">Wicket Hauls</span>
                              <div className="achievement-badges" style={{ justifyContent: 'flex-start', marginTop: '0.5rem' }}>
                                {modalData.fourWicketHauls > 0 && (
                                  <span className="achievement-badge achievement-4w">
                                    4W: {modalData.fourWicketHauls}
                                  </span>
                                )}
                                {modalData.fiveWicketHauls > 0 && (
                                  <span className="achievement-badge achievement-5w">
                                    5W: {modalData.fiveWicketHauls}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Match History */}
                  <div className="match-history">
                    <h4 className="section-title">Match History</h4>
                    {modalData.matchHistory && modalData.matchHistory.length > 0 ? (
                      <div className="matches-list">
                        {modalData.matchHistory.map((match, index) => (
                          <div key={index} className="match-item">
                            <div className="match-header">
                              <span className="match-number">Match {match.matchNumber}</span>
                              <span className="match-date">{new Date(match.date).toLocaleDateString()}</span>
                            </div>
                            <div className="match-details">
                              <div className="match-teams">
                                <span className="team">{match.teamName}</span>
                                <span className="vs">vs</span>
                                <span className="team">{match.opponentTeam}</span>
                              </div>
                              {modalData.type === 'batting' ? (
                                <div className="batting-stats">
                                  <div className="stat">
                                    <span className="label">Runs:</span>
                                    <span className="value">{match.runs || 0}</span>
                                  </div>
                                  <div className="stat">
                                    <span className="label">Balls:</span>
                                    <span className="value">{match.balls || 0}</span>
                                  </div>
                                  {match.isMom && (
                                    <div className="mom-badge">
                                      <FaStar /> MoM
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="bowling-stats">
                                  <div className="stat">
                                    <span className="label">Wickets:</span>
                                    <span className="value">{match.wickets || 0}</span>
                                  </div>
                                  <div className="stat">
                                    <span className="label">Runs Given:</span>
                                    <span className="value">{match.runsGiven || 0}</span>
                                  </div>
                                  {match.isMom && (
                                    <div className="mom-badge">
                                      <FaStar /> MoM
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-data">No match history available</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsOverview;