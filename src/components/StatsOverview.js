// src/components/StatsOverview.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  FaFireAlt,
  FaShieldAlt,
  FaBowlingBall,
  FaRunning,
  FaMedal,
  FaStar,
  FaHatCowboy,
  FaTrophy,
  FaCrown,
  FaFutbol,
  FaChartLine,
  FaUsers,
  FaAward
} from 'react-icons/fa';
import '../css/StatsOverview.css';
import { API_ENDPOINTS } from "../const";

const StatsOverview = () => {
  // State to hold the fetched stats
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playerImages, setPlayerImages] = useState({});

  // Debug logging for component lifecycle
  useEffect(() => {
    console.log('StatsOverview component mounted');
    return () => console.log('StatsOverview component unmounted');
  }, []);

  useEffect(() => {
    console.log('statsData changed:', statsData);
  }, [statsData]);

  useEffect(() => {
    console.log('loading state changed:', loading);
  }, [loading]);

  useEffect(() => {
    console.log('error state changed:', error);
  }, [error]);

  // Helper function to format date nicely
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Return original if invalid date
      
      const options = { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      return dateString; // Return original if parsing fails
    }
  };

  // Function to fetch player image from internet
  const fetchPlayerImage = useCallback(async (playerName) => {
    try {
      // Check local storage first
      const storedImage = localStorage.getItem(`player_image_${playerName}`);
      if (storedImage) {
        return storedImage;
      }

      // Try to fetch from a cricket player image API
      const searchQueries = [
        `cricket player ${playerName}`,
        `${playerName} cricketer`,
        `${playerName} cricket`,
        `cricket ${playerName}`
      ];

      let imageUrl = null;
      
      // Try multiple search queries
      for (const query of searchQueries) {
        try {
          // Use a free image service (Pixabay-like approach)
          const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=YOUR_UNSPLASH_ACCESS_KEY`);
          
          if (response.ok) {
            const data = await response.json();
            if (data.results && data.results.length > 0) {
              imageUrl = data.results[0].urls.regular;
              break;
            }
          }
        } catch (error) {
          console.log(`Failed to fetch image for query: ${query}`, error);
          continue;
        }
      }

      // If no image found, use placeholder
      if (!imageUrl) {
        imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&background=8b5cf6&color=fff&size=200&font-size=0.4&length=2&rounded=true`;
      }

      // Store in local storage
      localStorage.setItem(`player_image_${playerName}`, imageUrl);
      console.log(`Image stored for ${playerName}:`, imageUrl);
      return imageUrl;
    } catch (error) {
      console.error('Error fetching player image:', error);
      // Return default image on error
      const defaultImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&background=8b5cf6&color=fff&size=200&font-size=0.4&length=2&rounded=true`;
      localStorage.setItem(`player_image_${playerName}`, defaultImage);
      return defaultImage;
    }
  }, []);

  // Function to update player images when stats change
  const updatePlayerImages = useCallback(async (leadingRunScorer, leadingWicketTaker, centuries, halfCenturies, highestFiveWicketHauls) => {
    console.log('Updating player images for:', { leadingRunScorer, leadingWicketTaker });
    const newImages = {};
    
    // Get all unique player names from all records
    const allPlayers = new Set();
    
    if (leadingRunScorer?.playerName) allPlayers.add(leadingRunScorer.playerName);
    if (leadingWicketTaker?.playerName) allPlayers.add(leadingWicketTaker.playerName);
    
    // Add players from records
    if (centuries) {
      centuries.forEach(century => allPlayers.add(century.playerName));
    }
    if (halfCenturies) {
      halfCenturies.forEach(halfCentury => allPlayers.add(halfCentury.playerName));
    }
    if (highestFiveWicketHauls) {
      highestFiveWicketHauls.forEach(haul => allPlayers.add(haul.playerName));
    }
    
    console.log('All players to fetch images for:', Array.from(allPlayers));
    
    // Fetch images for all players
    for (const playerName of allPlayers) {
      if (playerName) {
        console.log('Fetching image for player:', playerName);
        newImages[playerName] = await fetchPlayerImage(playerName);
      }
    }
    
    console.log('New images object:', newImages);
    setPlayerImages(newImages);
  }, [fetchPlayerImage]);

  // Fetch data from the /stats-overview API when component mounts
  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('Fetching stats from:', `${API_ENDPOINTS}/api/player-stats/stats-overview`);
        const response = await fetch(`${API_ENDPOINTS}/api/player-stats/stats-overview`);
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = await response.json();
        console.log('Stats data received:', data);
        setStatsData(data);
        setLoading(false);
        
        // Update player images after data is loaded
        if (data.leadingRunScorer || data.leadingWicketTaker) {
          updatePlayerImages(data.leadingRunScorer, data.leadingWicketTaker, data.centuries, data.halfCenturies, data.highestFiveWicketHauls);
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchStats();
  }, [updatePlayerImages]);

  if (loading) {
    return (
      <div className="stats-overview-wrapper">
        <div className="loading-screen">
          <div className="loading-animation">
            <FaFutbol className="loading-icon" />
            <div className="loading-text">Loading Cricket Stats...</div>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stats-overview-wrapper">
        <div className="error-screen">
          <div className="error-content">
            <FaFutbol className="error-icon" />
            <h2>Error Loading Stats</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="retry-button">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if we have any data at all
  if (!statsData) {
    return (
      <div className="stats-overview-wrapper">
        <div className="no-data-screen">
          <div className="no-data-content">
            <FaFutbol className="no-data-icon" />
            <h2>No Stats Data Available</h2>
            <p>There are no cricket stats to display at the moment.</p>
          </div>
        </div>
      </div>
    );
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
    top5RunScorers = [],
    top5WicketTakers = [],
    top5MOM = [],
    top5BowlingStrikeRate = [],
    top5BestBattingAverage = [],
  } = statsData || {};

  console.log('Component rendering with data:', {
    leadingRunScorer,
    leadingWicketTaker,
    statsData
  });

  try {
    return (
      <div className="stats-overview-wrapper">
        {/* Hero Section with Animated Background */}
        <div className="hero-section">
          <div className="hero-background">
            <div className="floating-cricket-balls">
              <div className="ball ball-1"></div>
              <div className="ball ball-2"></div>
              <div className="ball ball-3"></div>
            </div>
          </div>
          <div className="hero-content">
            <div className="hero-icon">
              <FaFutbol />
            </div>
            <h1 className="hero-title">Cricket Stats Hub</h1>
            <p className="hero-subtitle">Where Legends Are Made & Records Are Broken</p>
            <div className="hero-stats-preview">
              <div className="stat-preview">
                <span className="stat-number">{top5RunScorers?.length || 0}</span>
                <span className="stat-label">Top Scorers</span>
              </div>
              <div className="stat-preview">
                <span className="stat-number">{top5WicketTakers?.length || 0}</span>
                <span className="stat-label">Top Bowlers</span>
              </div>
              <div className="stat-preview">
                <span className="stat-number">{centuries?.length || 0}</span>
                <span className="stat-label">Centuries</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cap Winners Section - The Star of the Show */}
        <div className="cap-winners-section">
          <div className="section-header">
            <h2 className="section-title">
              <FaAward className="title-icon" />
              Cap Winners
            </h2>
            <p className="section-subtitle">The Elite Performers of the Tournament</p>
          </div>
          
          <div className="cap-winners-grid">
            {/* Orange Cap - Leading Run Scorer */}
            <div className="cap-winner-card orange-cap" data-player-name={leadingRunScorer?.playerName || 'Player'}>
              <div className="cap-badge">
                <FaCrown className="cap-icon" />
                <span className="cap-label">Orange Cap</span>
              </div>
              
              <div className="player-image-container">
                <img 
                  src={playerImages[leadingRunScorer?.playerName] || `https://ui-avatars.com/api/?name=${encodeURIComponent(leadingRunScorer?.playerName || 'Player')}&background=f59e0b&color=ffffff&size=120&font-size=0.6&length=2&rounded=true&bold=true`}
                  alt={leadingRunScorer?.playerName || 'Leading Run Scorer'}
                  className="player-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="image-overlay">
                  <div className="overlay-content">
                    <FaFireAlt className="overlay-icon" />
                  </div>
                </div>
              </div>
              
              <div className="player-info">
                <h3 className="player-name">
                  {leadingRunScorer?.playerName || 'No Data Available'}
                </h3>
                <p className="player-team">
                  {leadingRunScorer?.teamName || 'No Team Data'}
                </p>
              </div>
              
              <div className="main-stat-display">
                <div className="stat-number">{leadingRunScorer?.totalRuns || 0}</div>
                <div className="stat-label">Total Runs</div>
              </div>
              
              <div className="achievement-badge">
                <FaMedal className="achievement-icon" />
                <span>Top Scorer</span>
              </div>
            </div>

            {/* Purple Cap - Leading Wicket Taker */}
            <div className="cap-winner-card purple-cap" data-player-name={leadingWicketTaker?.playerName || 'Player'}>
              <div className="cap-badge">
                <FaTrophy className="cap-icon" />
                <span className="cap-label">Purple Cap</span>
              </div>
              
              <div className="player-image-container">
                <img 
                  src={playerImages[leadingWicketTaker?.playerName] || `https://ui-avatars.com/api/?name=${encodeURIComponent(leadingWicketTaker?.playerName || 'Player')}&background=8b5cf6&color=ffffff&size=120&font-size=0.6&length=2&rounded=true&bold=true`}
                  alt={leadingWicketTaker?.playerName || 'Leading Wicket Taker'}
                  className="player-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="image-overlay">
                  <div className="overlay-content">
                    <FaBowlingBall className="overlay-icon" />
                  </div>
                </div>
              </div>
              
              <div className="player-info">
                <h3 className="player-name">
                  {leadingWicketTaker?.playerName || 'No Data Available'}
                </h3>
                <p className="player-team">
                  {leadingWicketTaker?.teamName || 'No Team Data'}
                </p>
              </div>
              
              <div className="main-stat-display">
                <div className="stat-number">{leadingWicketTaker?.totalWickets || 0}</div>
                <div className="stat-label">Total Wickets</div>
              </div>
              
              <div className="achievement-badge">
                <FaMedal className="achievement-icon" />
                <span>Top Bowler</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Highlights Section */}
        <div className="performance-highlights">
          <div className="section-header">
            <h2 className="section-title">
              <FaChartLine className="title-icon" />
              Performance Highlights
            </h2>
            <p className="section-subtitle">Record-Breaking Moments & Outstanding Performances</p>
          </div>
          
          <div className="highlights-grid">
            {/* Highest Strike Rate */}
            <div className="highlight-card strike-rate">
              <div className="card-header">
                <FaFireAlt className="card-icon" />
                <h3>Highest Strike Rate</h3>
              </div>
              <div className="card-content">
                <div className="main-stat">{highestStrikeRate?.strikeRate || 0}</div>
                <div className="stat-label">Strike Rate</div>
                <div className="player-details">
                  <strong>{highestStrikeRate?.playerName || 'N/A'}</strong>
                  <span>{highestStrikeRate?.teamName || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Best Economy */}
            <div className="highlight-card economy">
              <div className="card-header">
                <FaShieldAlt className="card-icon" />
                <h3>Best Economy</h3>
              </div>
              <div className="card-content">
                <div className="main-stat">{bestEconomicalBowler?.economy || 0}</div>
                <div className="stat-label">Economy</div>
                <div className="player-details">
                  <strong>{bestEconomicalBowler?.playerName || 'N/A'}</strong>
                  <span>{bestEconomicalBowler?.teamName || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Highest Score */}
            <div className="highlight-card highest-score">
              <div className="card-header">
                <FaRunning className="card-icon" />
                <h3>Highest Score</h3>
              </div>
              <div className="card-content">
                <div className="main-stat">{highestScore?.score || 0}</div>
                <div className="stat-label">Runs</div>
                <div className="player-details">
                  <strong>{highestScore?.playerName || 'N/A'}</strong>
                  <span>{highestScore?.teamName || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Most Wickets in Match */}
            <div className="highlight-card match-wickets">
              <div className="card-header">
                <FaBowlingBall className="card-icon" />
                <h3>Most Wickets (Match)</h3>
              </div>
              <div className="card-content">
                <div className="main-stat">{highestWicketTakerInMatch?.wickets || 0}</div>
                <div className="stat-label">Wickets</div>
                <div className="player-details">
                  <strong>{highestWicketTakerInMatch?.playerName || 'N/A'}</strong>
                  <span>{highestWicketTakerInMatch?.teamName || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performers Section */}
        <div className="top-performers-section">
          <div className="section-header">
            <h2 className="section-title">
              <FaUsers className="title-icon" />
              Top Performers
            </h2>
            <p className="section-subtitle">The Elite 5 in Each Category</p>
          </div>
          
          <div className="performers-grid">
            {/* Top 5 Run Scorers */}
            <div className="performer-category">
              <h3 className="category-title">
                <FaFireAlt className="category-icon" />
                Top Run Scorers
              </h3>
              <div className="performer-list">
                {top5RunScorers?.map((player, index) => (
                  <div key={index} className={`performer-item rank-${index + 1}`}>
                    <div className="rank-badge">{index + 1}</div>
                    <div className="performer-info">
                      <div className="performer-name">{player.playerName}</div>
                      <div className="performer-team">{player.teamName}</div>
                    </div>
                    <div className="performer-stat">{player.runs} Runs</div>
                  </div>
                )) || <div className="no-data">No data available</div>}
              </div>
            </div>

            {/* Top 5 Wicket Takers */}
            <div className="performer-category">
              <h3 className="category-title">
                <FaBowlingBall className="category-icon" />
                Top Wicket Takers
              </h3>
              <div className="performer-list">
                {top5WicketTakers?.map((player, index) => (
                  <div key={index} className={`performer-item rank-${index + 1}`}>
                    <div className="rank-badge">{index + 1}</div>
                    <div className="performer-info">
                      <div className="performer-name">{player.playerName}</div>
                      <div className="performer-team">{player.teamName}</div>
                    </div>
                    <div className="performer-stat">{player.wickets} Wickets</div>
                  </div>
                )) || <div className="no-data">No data available</div>}
              </div>
            </div>

            {/* Top 5 MOM */}
            <div className="performer-category">
              <h3 className="category-title">
                <FaStar className="category-icon" />
                Most Man of the Match
              </h3>
              <div className="performer-list">
                {top5MOM?.map((player, index) => (
                  <div key={index} className={`performer-item rank-${index + 1}`}>
                    <div className="rank-badge">{index + 1}</div>
                    <div className="performer-info">
                      <div className="performer-name">{player.playerName}</div>
                      <div className="performer-team">{player.teamName}</div>
                    </div>
                    <div className="performer-stat">{player.momCount} MoM</div>
                  </div>
                )) || <div className="no-data">No data available</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Records Section */}
        <div className="records-section">
          <div className="section-header">
            <h2 className="section-title">
              <FaMedal className="title-icon" />
              Tournament Records
            </h2>
            <p className="section-subtitle">Centuries, Half-Centuries & Bowling Feats</p>
          </div>
          
          <div className="records-tables-container">
            {/* Centuries Table */}
            <div className="record-table-wrapper">
              <h3 className="table-title">Centuries</h3>
              <div className="table-container">
                <table className="records-table">
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Team</th>
                      <th>Opponent</th>
                      <th>Runs</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {centuries?.map((century, index) => (
                      <tr key={index} className="record-row">
                        <td className="player-cell">
                          <div className="player-info-cell">
                            <img 
                              src={playerImages[century.playerName] || `https://ui-avatars.com/api/?name=${encodeURIComponent(century.playerName)}&background=8b5cf6&color=fff&size=40&font-size=0.3&length=2&rounded=true`}
                              alt={century.playerName}
                              className="player-thumbnail"
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(century.playerName)}&background=8b5cf6&color=fff&size=40&font-size=0.3&length=2&rounded=true`;
                              }}
                            />
                            <span className="player-name-text">{century.playerName}</span>
                          </div>
                        </td>
                        <td>{century.teamName}</td>
                        <td>vs {century.againstTeam}</td>
                        <td className="runs-cell">
                          <span className="runs-badge">{century.runs}</span>
                        </td>
                        <td>{formatDate(century.date)}</td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan="5" className="no-data-cell">No centuries yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Half Centuries Table */}
            <div className="record-table-wrapper">
              <h3 className="table-title">Half Centuries</h3>
              <div className="table-container">
                <table className="records-table">
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Team</th>
                      <th>Opponent</th>
                      <th>Runs</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {halfCenturies?.map((halfCentury, index) => (
                      <tr key={index} className="record-row">
                        <td className="player-cell">
                          <div className="player-info-cell">
                            <img 
                              src={playerImages[halfCentury.playerName] || `https://ui-avatars.com/api/?name=${encodeURIComponent(halfCentury.playerName)}&background=f59e0b&color=fff&size=40&font-size=0.3&length=2&rounded=true`}
                              alt={halfCentury.playerName}
                              className="player-thumbnail"
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(halfCentury.playerName)}&background=f59e0b&color=fff&size=40&font-size=0.3&length=2&rounded=true`;
                              }}
                            />
                            <span className="player-name-text">{halfCentury.playerName}</span>
                          </div>
                        </td>
                        <td>{halfCentury.teamName}</td>
                        <td>vs {halfCentury.againstTeam}</td>
                        <td className="runs-cell">
                          <span className="runs-badge half-century">{halfCentury.runs}</span>
                        </td>
                        <td>{formatDate(halfCentury.date)}</td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan="5" className="no-data-cell">No half centuries yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5-Wicket Hauls Table */}
            <div className="record-table-wrapper">
              <h3 className="table-title">5-Wicket Hauls</h3>
              <div className="table-container">
                <table className="records-table">
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
                    {highestFiveWicketHauls?.map((haul, index) => (
                      <tr key={index} className="record-row">
                        <td className="player-cell">
                          <div className="player-info-cell">
                            <img 
                              src={playerImages[haul.playerName] || `https://ui-avatars.com/api/?name=${encodeURIComponent(haul.playerName)}&background=ef4444&color=fff&size=40&font-size=0.3&length=2&rounded=true`}
                              alt={haul.playerName}
                              className="player-thumbnail"
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(haul.playerName)}&background=ef4444&color=fff&size=40&font-size=0.3&length=2&rounded=true`;
                              }}
                            />
                            <span className="player-name-text">{haul.playerName}</span>
                          </div>
                        </td>
                        <td>{haul.teamName}</td>
                        <td>vs {haul.opponentTeam}</td>
                        <td className="wickets-cell">
                          <span className="wickets-badge">{haul.wickets}</span>
                        </td>
                        <td>{formatDate(haul.date)}</td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan="5" className="no-data-cell">No 5-wicket hauls yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4-Wicket Hauls Table */}
            <div className="record-table-wrapper">
              <h3 className="table-title">4-Wicket Hauls</h3>
              <div className="table-container">
                <table className="records-table">
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
                    {highestFourWicketHauls?.map((haul, index) => (
                      <tr key={index} className="record-row">
                        <td className="player-cell">
                          <div className="player-info-cell">
                            <img 
                              src={playerImages[haul.playerName] || `https://ui-avatars.com/api/?name=${encodeURIComponent(haul.playerName)}&background=fb7185&color=fff&size=40&font-size=0.3&length=2&rounded=true`}
                              alt={haul.playerName}
                              className="player-thumbnail"
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(haul.playerName)}&background=fb7185&color=fff&size=40&font-size=0.3&length=2&rounded=true`;
                              }}
                            />
                            <span className="player-name-text">{haul.playerName}</span>
                          </div>
                        </td>
                        <td>{haul.teamName}</td>
                        <td>vs {haul.opponentTeam}</td>
                        <td className="wickets-cell">
                          <span className="wickets-badge four-wicket">{haul.wickets}</span>
                        </td>
                        <td>{formatDate(haul.date)}</td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan="5" className="no-data-cell">No 4-wicket hauls yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (e) {
    console.error("Error rendering StatsOverview:", e);
    return (
      <div className="stats-overview-wrapper">
        <div className="error-screen">
          <div className="error-content">
            <FaFutbol className="error-icon" />
            <h2>Error Rendering Stats Overview</h2>
            <p>There was an error displaying the cricket stats. Please try refreshing the page.</p>
            <button onClick={() => window.location.reload()} className="retry-button">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default StatsOverview;
