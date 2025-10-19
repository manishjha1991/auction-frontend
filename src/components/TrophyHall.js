import React, { useState, useEffect } from 'react';
import '../css/TrophyHall.css';
import { API_ENDPOINTS } from '../const';
import { FaTrophy, FaCrown, FaMedal, FaStar, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const TrophyHall = () => {
  const [teams, setTeams] = useState([]);
  const [matchResults, setMatchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTeam, setExpandedTeam] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const [teamsRes, matchResultsRes] = await Promise.all([
        fetch(`${API_ENDPOINTS}/api/users/teams`),
        fetch(`${API_ENDPOINTS}/api/match-results/public`)
      ]);

      if (!teamsRes.ok) {
        throw new Error('Failed to fetch teams');
      }
      const teamsData = await teamsRes.json();

      let matchResultsData = [];
      if (matchResultsRes.ok) {
        const matchData = await matchResultsRes.json();
        matchResultsData = matchData.matchResults || [];
        setMatchResults(matchResultsData);
      }

      console.log('Fetched match results:', matchResultsData);

      // Calculate trophy counts from match results
      const teamsWithTrophies = teamsData.map(team => {
        const teamWins = matchResultsData.filter(match => {
          if (match.winner === 'tie' || match.winner === 'no_result') return false;
          const winningTeam = match.winner === 'team1' ? match.team1 : match.team2;
          return winningTeam === team.teamName;
        });

        // Calculate total matches played by this team
        const totalMatches = matchResultsData.filter(match => {
          return match.team1 === team.teamName || match.team2 === team.teamName;
        });

        const trophyCount = teamWins.length;
        const totalMatchesPlayed = totalMatches.length;
        const winRate = totalMatchesPlayed > 0 ? ((trophyCount / totalMatchesPlayed) * 100).toFixed(1) : 0;
        const lastTrophyYear = teamWins.length > 0 
          ? new Date(Math.max(...teamWins.map(w => new Date(w.matchDate)))).getFullYear()
          : null;

        console.log(`Team ${team.teamName}: ${trophyCount} wins out of ${totalMatchesPlayed} matches (${winRate}% win rate)`);

        return {
          ...team,
          trophyCount,
          totalMatchesPlayed,
          winRate: parseFloat(winRate),
          lastTrophyYear,
          matchWins: teamWins,
          allMatches: totalMatches // Store all matches for the team
        };
      });

      console.log('Teams with trophies:', teamsWithTrophies);
      // Filter out teams with 0 trophies
      const teamsWithTrophiesOnly = teamsWithTrophies.filter(team => team.trophyCount > 0);
      setTeams(teamsWithTrophiesOnly.sort((a, b) => b.trophyCount - a.trophyCount));
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load trophy data');
    } finally {
      setLoading(false);
    }
  };

  const toggleTeamExpansion = (teamName) => {
    setExpandedTeam(expandedTeam === teamName ? null : teamName);
  };

  const getTrophyIcon = (count, index) => {
    if (index === 0 && count >= 5) return <FaCrown className="trophy-icon crown" />;
    if (count >= 7) return <FaTrophy className="trophy-icon gold" />;
    if (count >= 5) return <FaMedal className="trophy-icon silver" />;
    return <FaStar className="trophy-icon bronze" />;
  };

  const getTrophyColor = (count, index) => {
    if (index === 0 && count >= 5) return 'crown';
    if (count >= 7) return 'gold';
    if (count >= 5) return 'silver';
    return 'bronze';
  };

  const renderTrophyDisplay = (count) => {
    const trophyElements = [];
    for (let i = 0; i < Math.min(count, 8); i++) {
      trophyElements.push(
        <span key={i} className="trophy-symbol">🏆</span>
      );
    }
    if (count > 8) {
      trophyElements.push(
        <span key="more" className="trophy-count">+{count - 8}</span>
      );
    }
    return trophyElements;
  };

  if (loading) {
    return (
      <div className="trophy-hall-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Trophy Hall...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trophy-hall-container">
        <div className="error-message">
          <FaTrophy className="error-icon" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trophy-hall-container">
      <div className="trophy-header">
        <div className="header-content">
          <FaCrown className="header-icon" />
          <h1 className="header-title">Trophy Hall of Fame</h1>
          <p className="header-subtitle">Celebrating CPL Champions</p>
        </div>
        <div className="header-decoration">
          <div className="trophy-decoration">🏆</div>
          <div className="trophy-decoration">🏆</div>
          <div className="trophy-decoration">🏆</div>
        </div>
      </div>

      <div className="trophy-stats">
        <div className="stat-card">
          <div className="stat-number">{teams.length}</div>
          <div className="stat-label">Champion Teams</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{teams.reduce((sum, team) => sum + team.trophyCount, 0)}</div>
          <div className="stat-label">Total Trophies</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{teams.length > 0 ? Math.max(...teams.map(team => team.trophyCount)) : 0}</div>
          <div className="stat-label">Highest Trophy Count</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{matchResults.length}</div>
          <div className="stat-label">Total Matches</div>
        </div>
      </div>

      <div className="trophy-leaderboard">
        <h2 className="leaderboard-title">
          <FaMedal className="title-icon" />
          Champions Leaderboard
        </h2>
        
        <div className="teams-grid">
          {teams.map((team, index) => (
            <div key={team._id} className={`team-card ${getTrophyColor(team.trophyCount, index)}`}>
              <div className="team-rank">
                {index < 3 ? (
                  <div className={`rank-badge rank-${index + 1}`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                ) : (
                  <div className="rank-number">#{index + 1}</div>
                )}
              </div>
              
              <div className="team-info">
                <div className="team-avatar">
                  {team.teamImage ? (
                    <img src={team.teamImage} alt={team.teamName} />
                  ) : (
                    <div className="default-avatar">
                      {team.teamName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="team-details">
                  <h3 className="team-name">{team.teamName}</h3>
                  <p className="team-abbreviation">{team.abbreviation}</p>
                  <p className="last-trophy">
                    Last Trophy: {team.lastTrophyYear || 'No trophies yet'}
                  </p>
                </div>
              </div>
              
              <div className="trophy-section">
                <div className="trophy-icon-section">
                  {getTrophyIcon(team.trophyCount, index)}
                </div>
                
                <div className="trophy-display">
                  {renderTrophyDisplay(team.trophyCount)}
                </div>
                
                <div className="trophy-count">
                  <span className="count-number">{team.trophyCount}</span>
                  <span className="count-label">Trophies</span>
                </div>
              </div>
              
              <div className="team-stats">
                <div className="stat-item">
                  <span className="stat-value">{team.trophyCount}</span>
                  <span className="stat-label">Wins</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{team.totalMatchesPlayed || 0}</span>
                  <span className="stat-label">Matches</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">
                    {team.winRate || 0}%
                  </span>
                  <span className="stat-label">Win Rate</span>
                </div>
              </div>

              {/* Expandable Match Details */}
              {team.allMatches && team.allMatches.length > 0 && (
                <div className="expand-section">
                  <button 
                    className="expand-button"
                    onClick={() => toggleTeamExpansion(team.teamName)}
                  >
                    <span>View Match Details</span>
                    {expandedTeam === team.teamName ? 
                      <FaChevronUp className="expand-icon" /> : 
                      <FaChevronDown className="expand-icon" />
                    }
                  </button>

                  {expandedTeam === team.teamName && (
                    <div className="match-details">
                      {team.allMatches.map((match, matchIndex) => {
                        // Determine if this team won this match
                        const teamWon = match.winner !== 'tie' && match.winner !== 'no_result' && 
                          ((match.winner === 'team1' && match.team1 === team.teamName) || 
                           (match.winner === 'team2' && match.team2 === team.teamName));
                        
                        return (
                        <div key={match._id} className={`match-card ${teamWon ? 'match-won' : 'match-lost'}`}>
                          <div className="match-header">
                            <span className="match-title">{match.trophyName}</span>
                            <span className="match-type">{match.trophyType}</span>
                            <span className={`match-result ${teamWon ? 'won' : 'lost'}`}>
                              {teamWon ? '🏆 WON' : '❌ LOST'}
                            </span>
                          </div>
                          
                          <div className="match-scores">
                            <div className="team-score">
                              <span className="team-name">{team.teamName}</span>
                              <span className="score">{match.team1Score}/{match.team1Wickets}</span>
                            </div>
                            
                            <div className="vs">vs</div>
                            
                            <div className="team-score">
                              <span className="team-name">
                                {match.team1 === team.teamName ? match.team2 : match.team1}
                              </span>
                              <span className="score">
                                {match.team1 === team.teamName ? 
                                  `${match.team2Score}/${match.team2Wickets}` : 
                                  `${match.team1Score}/${match.team1Wickets}`
                                }
                              </span>
                            </div>
                          </div>

                          <div className="match-mom">
                            <span className="mom-label">Man of the Match:</span>
                            <span className="mom-name">{match.manOfTheMatch.name}</span>
                            <span className="mom-stats">
                              ({match.manOfTheMatch.runs}r - {match.manOfTheMatch.wickets}w)
                            </span>
                          </div>

                          <div className="match-date">
                            <span className="date-label">Date:</span>
                            <span className="date-value">
                              {new Date(match.matchDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrophyHall;
