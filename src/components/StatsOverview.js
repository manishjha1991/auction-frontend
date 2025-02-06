// src/components/StatsOverview.js
import React, { useEffect, useState } from 'react';
import {
  FaFireAlt,
  FaShieldAlt,
  FaBowlingBall,
  FaRunning,
  FaMedal,
  FaStar
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
        setStatsData(data);  // Store the API response in state
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
    halfCenturies = []
  } = statsData || {};

  return (
    <div className="stats-overview-wrapper">

      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-text">
          <h1>Cricket Stats</h1>
          <p>All your top stats in one place</p>
        </div>
      </div>
      
      {/* Cards */}
      <div className="stats-cards-grid fade-in-up">

        {/* Highest Strike Rate */}
        <div className="stats-card">
          <h2><FaFireAlt className="icon" /> Highest Strike Rate</h2>
          <p><strong>Player:</strong> {highestStrikeRate.playerName || 'N/A'}</p>
          <p><strong>Team:</strong> {highestStrikeRate.teamName || 'N/A'}</p>
          <p className="highlight-stat">{highestStrikeRate.strikeRate || 0}</p>
          <span className="stat-label">SR</span>
        </div>

        {/* Best Economy */}
        <div className="stats-card">
          <h2><FaShieldAlt className="icon" /> Best Economy</h2>
          <p><strong>Player:</strong> {bestEconomicalBowler.playerName || 'N/A'}</p>
          <p><strong>Team:</strong> {bestEconomicalBowler.teamName || 'N/A'}</p>
          <p className="highlight-stat">{bestEconomicalBowler.economy || 0}</p>
          <span className="stat-label">Econ</span>
        </div>

        {/* Highest Wickets (Single Match) */}
        <div className="stats-card">
          <h2><FaBowlingBall className="icon" /> Highest Wickets (Match)</h2>
          <p><strong>Player:</strong> {highestWicketTakerInMatch.playerName || 'N/A'}</p>
          <p><strong>Team:</strong> {highestWicketTakerInMatch.teamName || 'N/A'}</p>
          <p><strong>Against:</strong> {highestWicketTakerInMatch.opponentTeam || 'N/A'}</p>
          <p className="highlight-stat">{highestWicketTakerInMatch.wickets || 0}</p>
          <span className="stat-label">Wickets</span>
        </div>

        {/* Highest Score */}
        <div className="stats-card">
          <h2><FaFireAlt className="icon" /> Highest Score</h2>
          <p><strong>Player:</strong> {highestScore.playerName || 'N/A'}</p>
          <p><strong>Team:</strong> {highestScore.teamName || 'N/A'}</p>
          <p><strong>Against:</strong> {highestScore.opponentTeam || 'N/A'}</p>
          <p className="highlight-stat">{highestScore.score || 0}</p>
          <span className="stat-label">Runs</span>
        </div>

        {/* Leading Wicket Taker (Overall) */}
        <div className="stats-card">
          <h2><FaMedal className="icon" /> Leading Wicket Taker</h2>
          <p><strong>Player:</strong> {leadingWicketTaker.playerName || 'N/A'}</p>
          <p><strong>Team:</strong> {leadingWicketTaker.teamName || 'N/A'}</p>
          <p className="highlight-stat">{leadingWicketTaker.totalWickets || 0}</p>
          <span className="stat-label">Wickets</span>
        </div>

        {/* Leading Run Scorer (Overall) */}
        <div className="stats-card">
          <h2><FaRunning className="icon" /> Leading Run Scorer</h2>
          <p><strong>Player:</strong> {leadingRunScorer.playerName || 'N/A'}</p>
          <p><strong>Team:</strong> {leadingRunScorer.teamName || 'N/A'}</p>
          <p className="highlight-stat">{leadingRunScorer.totalRuns || 0}</p>
          <span className="stat-label">Runs</span>
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
                  {/* Format date however you like, e.g. new Date(haul.date).toLocaleString() */}
                  <td>{haul.date}</td>
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
                  <td>{haul.date}</td>
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
                  <td>{c.date}</td>
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
                  <td>{hc.date}</td>
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
