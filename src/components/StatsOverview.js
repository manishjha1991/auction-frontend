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
  
  // Modal state for detailed view
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [modalTitle, setModalTitle] = useState('');

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

      {/* Cards: Single-Match / Overall Summaries */}
      <div className="stats-cards-grid fade-in-up">
        {/* Highest Strike Rate */}
        <div className="stats-card performance-card">
          <div className="card-header">
            <FaFireAlt className="card-icon" />
            <h3>Highest Strike Rate</h3>
          </div>
          <div className="card-content">
            <div className="player-info">
              <span className="player-name">{highestStrikeRate.playerName || 'N/A'}</span>
              <span className="team-name">{highestStrikeRate.teamName || 'N/A'}</span>
            </div>
            <div className="stat-value">{highestStrikeRate.strikeRate || 0}</div>
            {highestStrikeRate.opponentTeam && (
              <div className="opponent-info">vs {highestStrikeRate.opponentTeam}</div>
            )}
            {(highestStrikeRate.runs !== undefined || highestStrikeRate.balls !== undefined) && (
              <div className="match-stats">
                {highestStrikeRate.runs !== undefined && <span>{highestStrikeRate.runs} runs</span>}
                {highestStrikeRate.balls !== undefined && <span>{highestStrikeRate.balls} balls</span>}
              </div>
            )}
          </div>
        </div>

        {/* Best Economy */}
        <div className="stats-card performance-card">
          <div className="card-header">
            <FaShieldAlt className="card-icon" />
            <h3>Best Economy</h3>
          </div>
          <div className="card-content">
            <div className="player-info">
              <span className="player-name">{bestEconomicalBowler.playerName || 'N/A'}</span>
              <span className="team-name">{bestEconomicalBowler.teamName || 'N/A'}</span>
            </div>
            <div className="stat-value">{bestEconomicalBowler.economy || 0}</div>
            {bestEconomicalBowler.opponentTeam && (
              <div className="opponent-info">vs {bestEconomicalBowler.opponentTeam}</div>
            )}
            {(bestEconomicalBowler.wickets !== undefined || bestEconomicalBowler.runsGiven !== undefined || bestEconomicalBowler.ballsBowled !== undefined) && (
              <div className="match-stats">
                {bestEconomicalBowler.wickets !== undefined && <span>{bestEconomicalBowler.wickets} wkts</span>}
                {bestEconomicalBowler.runsGiven !== undefined && bestEconomicalBowler.ballsBowled !== undefined && (
                  <span>{bestEconomicalBowler.runsGiven}/{Math.floor(bestEconomicalBowler.ballsBowled / 6)}.{bestEconomicalBowler.ballsBowled % 6}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Highest Wickets (Single Match) */}
        <div className="stats-card performance-card">
          <div className="card-header">
            <FaBowlingBall className="card-icon" />
            <h3>Highest Wickets</h3>
          </div>
          <div className="card-content">
            <div className="player-info">
              <span className="player-name">{highestWicketTakerInMatch.playerName || 'N/A'}</span>
              <span className="team-name">{highestWicketTakerInMatch.teamName || 'N/A'}</span>
            </div>
            <div className="stat-value">{highestWicketTakerInMatch.wickets || 0}</div>
            <div className="opponent-info">vs {highestWicketTakerInMatch.opponentTeam || 'N/A'}</div>
            {(highestWicketTakerInMatch.runsGiven !== undefined || highestWicketTakerInMatch.ballsBowled !== undefined) && (
              <div className="match-stats">
                {highestWicketTakerInMatch.runsGiven !== undefined && highestWicketTakerInMatch.ballsBowled !== undefined && (
                  <span>{highestWicketTakerInMatch.runsGiven}/{Math.floor(highestWicketTakerInMatch.ballsBowled / 6)}.{highestWicketTakerInMatch.ballsBowled % 6}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Highest Score */}
        <div className="stats-card performance-card">
          <div className="card-header">
            <FaFireAlt className="card-icon" />
            <h3>Highest Score</h3>
          </div>
          <div className="card-content">
            <div className="player-info">
              <span className="player-name">{highestScore.playerName || 'N/A'}</span>
              <span className="team-name">{highestScore.teamName || 'N/A'}</span>
            </div>
            <div className="stat-value">{highestScore.score || 0}</div>
            <div className="opponent-info">vs {highestScore.opponentTeam || 'N/A'}</div>
            {(highestScore.balls !== undefined || highestScore.strikeRate !== undefined) && (
              <div className="match-stats">
                {highestScore.balls !== undefined && <span>{highestScore.balls} balls</span>}
                {highestScore.strikeRate !== undefined && highestScore.strikeRate > 0 && <span>SR: {highestScore.strikeRate}</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* NEW: Top-5 Performers Section */}
      <div className="top5-section fade-in-up">
        <h2 className="top5-heading">Top 5 Performers</h2>

        <div className="top5-cards-grid">
          {/* Top 5 Run Scorers */}
          <div className="stats-card top5-card clickable-card">
            <h2 className="top5-card-title">
              <FaFireAlt className="icon" /> Top 5 Run Scorers
              <FaEye className="view-icon" />
            </h2>
            {top5RunScorers.length > 0 ? (
              <ul className="top5-list">
                {top5RunScorers.map((player, i) => (
                  <li key={i} className="top5-list-item clickable-item" onClick={() => handleViewDetails('batting', player.playerId)}>
                    <span className={`rank-badge rank-${i + 1}`}>{i + 1}</span>
                    <div className="player-info">
                      <strong>{player.playerName}</strong> 
                      <span className="team-name">({player.teamName})</span>
                    </div>
                    <div className="stat-highlight">{player.runs} Runs</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No data available</p>
            )}
          </div>

          {/* Top 5 Wicket Takers */}
          <div className="stats-card top5-card clickable-card">
            <h2 className="top5-card-title">
              <FaBowlingBall className="icon" /> Top 5 Wicket Takers
              <FaEye className="view-icon" />
            </h2>
            {top5WicketTakers.length > 0 ? (
              <ul className="top5-list">
                {top5WicketTakers.map((player, i) => (
                  <li key={i} className="top5-list-item clickable-item" onClick={() => handleViewDetails('bowling', player.playerId)}>
                    <span className={`rank-badge rank-${i + 1}`}>{i + 1}</span>
                    <div className="player-info">
                      <strong>{player.playerName}</strong>
                      <span className="team-name">({player.teamName})</span>
                    </div>
                    <div className="stat-highlight">{player.wickets} Wkts</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No data available</p>
            )}
          </div>

          {/* Top 5 MOM */}
          <div className="stats-card top5-card">
            <h2 className="top5-card-title">
              <FaStar className="icon" /> Top 5 MOM
            </h2>
            {top5MOM.length > 0 ? (
              <ul className="top5-list">
                {top5MOM.map((player, i) => (
                  <li key={i} className="top5-list-item">
                    <span className={`rank-badge rank-${i + 1}`}>{i + 1}</span>
                    <div className="player-info">
                      <strong>{player.playerName}</strong> 
                      <span className="team-name">({player.teamName})</span>
                    </div>
                    <div className="stat-highlight">{player.momCount} MoM</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No data available</p>
            )}
          </div>

          {/* Top 5 Bowling Strike Rate */}
          <div className="stats-card top5-card">
            <h2 className="top5-card-title">
              <FaBowlingBall className="icon" /> Best Bowling S/R
            </h2>
            {top5BowlingStrikeRate.length > 0 ? (
              <ul className="top5-list">
                {top5BowlingStrikeRate.map((player, i) => (
                  <li key={i} className="top5-list-item">
                    <span className={`rank-badge rank-${i + 1}`}>{i + 1}</span>
                    <div className="player-info">
                      <strong>{player.playerName}</strong>
                      <span className="team-name">({player.teamName})</span>
                    </div>
                    <div className="stat-highlight">
                      {player.strikeRate.toFixed(1)} S/R
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No data available</p>
            )}
          </div>

          {/* Top 5 Best Batting Average */}
          <div className="stats-card top5-card">
            <h2 className="top5-card-title">
              <FaFireAlt className="icon" /> Best Batting Avg
            </h2>
            {top5BestBattingAverage.length > 0 ? (
              <ul className="top5-list">
                {top5BestBattingAverage.map((player, i) => (
                  <li key={i} className="top5-list-item">
                    <span className={`rank-badge rank-${i + 1}`}>{i + 1}</span>
                    <div className="player-info">
                      <strong>{player.playerName}</strong>
                      <span className="team-name">({player.teamName})</span>
                    </div>
                    <div className="stat-highlight">
                      {player.average.toFixed(2)} Avg
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Highest 5-Wicket Hauls */}
      <div className="table-section fade-in-up">
        <h2><FaStar className="table-heading-icon" /> Highest 5-Wicket Hauls</h2>
        <div className="responsive-table-wrapper">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Team</th>
                <th>Opponent</th>
                <th>Wickets</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {highestFiveWicketHauls.map((haul, i) => {
                const overs = haul.ballsBowled 
                  ? `${Math.floor(haul.ballsBowled / 6)}.${haul.ballsBowled % 6}` 
                  : '0.0';
                return (
                  <tr key={i}>
                    <td>{haul.playerName}</td>
                    <td>{haul.teamName}</td>
                    <td>{haul.opponentTeam}</td>
                    <td>
                      <span>{haul.wickets}</span>
                      {haul.runsGiven !== undefined && haul.ballsBowled !== undefined && (
                        <span className="table-stat-detail"> ({haul.runsGiven}/{overs})</span>
                      )}
                    </td>
                    <td>{new Date(haul.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Highest 4-Wicket Hauls */}
      <div className="table-section fade-in-up">
        <h2><FaStar className="table-heading-icon" /> Highest 4-Wicket Hauls</h2>
        <div className="responsive-table-wrapper">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Team</th>
                <th>Opponent</th>
                <th>Wickets</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {highestFourWicketHauls.map((haul, i) => {
                const overs = haul.ballsBowled 
                  ? `${Math.floor(haul.ballsBowled / 6)}.${haul.ballsBowled % 6}` 
                  : '0.0';
                return (
                  <tr key={i}>
                    <td>{haul.playerName}</td>
                    <td>{haul.teamName}</td>
                    <td>{haul.opponentTeam}</td>
                    <td>
                      <span>{haul.wickets}</span>
                      {haul.runsGiven !== undefined && haul.ballsBowled !== undefined && (
                        <span className="table-stat-detail"> ({haul.runsGiven}/{overs})</span>
                      )}
                    </td>
                    <td>{new Date(haul.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Centuries */}
      <div className="table-section fade-in-up">
        <h2><FaStar className="table-heading-icon" /> Centuries</h2>
        <div className="responsive-table-wrapper">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Team</th>
                <th>Against</th>
                <th>Runs</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {centuries.map((c, i) => (
                <tr key={i}>
                  <td>{c.playerName}</td>
                  <td>{c.teamName}</td>
                  <td>{c.againstTeam}</td>
                  <td>
                    <span>{c.runs}</span>
                    {c.balls !== undefined && (
                      <span className="table-stat-detail"> ({c.balls} balls)</span>
                    )}
                  </td>
                  <td>{new Date(c.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Half Centuries */}
      <div className="table-section fade-in-up">
        <h2><FaStar className="table-heading-icon" /> Half Centuries</h2>
        <div className="responsive-table-wrapper">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Team</th>
                <th>Against</th>
                <th>Runs</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {halfCenturies.map((hc, i) => (
                <tr key={i}>
                  <td>{hc.playerName}</td>
                  <td>{hc.teamName}</td>
                  <td>{hc.againstTeam}</td>
                  <td>
                    <span>{hc.runs}</span>
                    {hc.balls !== undefined && (
                      <span className="table-stat-detail"> ({hc.balls} balls)</span>
                    )}
                  </td>
                  <td>{new Date(hc.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</td>
                </tr>
              ))}
            </tbody>
          </table>
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