// src/components/StatsOverview.js
import React, { useEffect, useState } from 'react';
import {
  FaFireAlt,
  FaShieldAlt,
  FaBowlingBall,
  FaRunning,
  FaMedal,
  FaStar,
  FaHatCowboy,  // <-- NEW icon import for the cap
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
        <div className="stats-card">
          <h2><FaFireAlt className="icon" /> Highest Strike Rate</h2>
          <p><strong>Player:</strong> {highestStrikeRate.playerName || 'N/A'}</p>
          <p><strong>Team:</strong> {highestStrikeRate.teamName || 'N/A'}</p>
          <p className="highlight-stat">{highestStrikeRate.strikeRate || 0}</p>
        </div>

        {/* Best Economy */}
        <div className="stats-card">
          <h2><FaShieldAlt className="icon" /> Best Economy</h2>
          <p><strong>Player:</strong> {bestEconomicalBowler.playerName || 'N/A'}</p>
          <p><strong>Team:</strong> {bestEconomicalBowler.teamName || 'N/A'}</p>
          <p className="highlight-stat">{bestEconomicalBowler.economy || 0}</p>
        </div>

        {/* Highest Wickets (Single Match) */}
        <div className="stats-card">
          <h2><FaBowlingBall className="icon" /> Highest Wickets (Match)</h2>
          <p><strong>Player:</strong> {highestWicketTakerInMatch.playerName || 'N/A'}</p>
          <p><strong>Team:</strong> {highestWicketTakerInMatch.teamName || 'N/A'}</p>
          <p><strong>Against:</strong> {highestWicketTakerInMatch.opponentTeam || 'N/A'}</p>
          <p className="highlight-stat">{highestWicketTakerInMatch.wickets || 0}</p>
        </div>

        {/* Highest Score */}
        <div className="stats-card">
          <h2><FaFireAlt className="icon" /> Highest Score</h2>
          <p><strong>Player:</strong> {highestScore.playerName || 'N/A'}</p>
          <p><strong>Team:</strong> {highestScore.teamName || 'N/A'}</p>
          <p><strong>Against:</strong> {highestScore.opponentTeam || 'N/A'}</p>
          <p className="highlight-stat">{highestScore.score || 0}</p>
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
              {highestFiveWicketHauls.map((haul, i) => (
                <tr key={i}>
                  <td>{haul.playerName}</td>
                  <td>{haul.teamName}</td>
                  <td>{haul.opponentTeam}</td>
                  <td>{haul.wickets}</td>
                  <td>{new Date(haul.date).toLocaleDateString('en-US', { 
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
              {highestFourWicketHauls.map((haul, i) => (
                <tr key={i}>
                  <td>{haul.playerName}</td>
                  <td>{haul.teamName}</td>
                  <td>{haul.opponentTeam}</td>
                  <td>{haul.wickets}</td>
                  <td>{new Date(haul.date).toLocaleDateString('en-US', { 
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
                  <td>{c.runs}</td>
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
                  <td>{hc.runs}</td>
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