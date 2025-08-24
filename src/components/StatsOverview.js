// src/components/StatsOverview.js
import React, { useEffect, useState } from 'react';
import {
  FaFireAlt,
  FaShieldAlt,
  FaBowlingBall,
  FaRunning,
  FaMedal,
  FaStar,
  FaHatCowboy  // <-- NEW icon import for the cap
} from 'react-icons/fa';
import '../css/StatsOverview.css';
import { API_ENDPOINTS } from "../const";

const StatsOverview = () => {
  // State to hold the fetched stats
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          <div className="stats-card top5-card">
            <h2 className="top5-card-title">
              <FaFireAlt className="icon" /> Top 5 Run Scorers
            </h2>
            {top5RunScorers.length > 0 ? (
              <ul className="top5-list">
                {top5RunScorers.map((player, i) => (
                  <li key={i} className="top5-list-item">
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
          <div className="stats-card top5-card">
            <h2 className="top5-card-title">
              <FaBowlingBall className="icon" /> Top 5 Wicket Takers
            </h2>
            {top5WicketTakers.length > 0 ? (
              <ul className="top5-list">
                {top5WicketTakers.map((player, i) => (
                  <li key={i} className="top5-list-item">
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
    </div>
  );
};

export default StatsOverview;