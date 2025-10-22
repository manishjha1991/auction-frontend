import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../const';
const TrophyHall = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showMatchDetails, setShowMatchDetails] = useState(false);
  const [matchResultsData, setMatchResultsData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch teams
      const teamsResponse = await fetch(`${API_ENDPOINTS}/api/users/teams`);
      if (!teamsResponse.ok) {
        throw new Error(`Failed to fetch teams: ${teamsResponse.status}`);
      }
      const teamsData = await teamsResponse.json();
      
      // Fetch match results from backend MatchResult public API
      const matchResponse = await fetch(`${API_ENDPOINTS}/api/match-results/public`);
      if (!matchResponse.ok) {
        throw new Error(`Failed to fetch match results: ${matchResponse.status}`);
      }
      const matchResponseData = await matchResponse.json();
      const matchResultsData = matchResponseData.matchResults || [];
      setMatchResultsData(matchResultsData);
      
      // Calculate trophy counts and runner-up data
      const teamsWithData = teamsData.map(team => {
        const teamWins = matchResultsData.filter(match => {
          if (!match.winner || match.winner === 'tie' || match.winner === 'no_result') return false;
          // Check if this team won by comparing winner field with team1/team2
          const winningTeam = match.winner === 'team1' ? match.team1 : match.team2;
          return winningTeam === team.teamName;
        });

        const teamLosses = matchResultsData.filter(match => {
          if (!match.winner || match.winner === 'tie' || match.winner === 'no_result') return false;
          // Check if this team played but didn't win
          const winningTeam = match.winner === 'team1' ? match.team1 : match.team2;
          return (match.team1 === team.teamName || match.team2 === team.teamName) && winningTeam !== team.teamName;
        });

        const trophyCount = teamWins.length;
        const runnerUpCount = teamLosses.length;

        return {
          _id: team._id,
          teamName: team.teamName,
          teamImage: team.teamImage,
          abbreviation: team.abbreviation,
          trophyCount,
          runnerUpCount
        };
      });
      
      // Show all teams if no match results exist, otherwise filter teams with trophies or runner-ups
      if (matchResultsData.length === 0) {
        // No match results yet, show all teams with 0 trophies and 0 runner-ups
        setTeams(teamsWithData.sort((a, b) => a.teamName.localeCompare(b.teamName)));
      } else {
        // Filter out teams with 0 trophies and 0 runner-ups
        const teamsWithTrophiesOrRunnerUps = teamsWithData.filter(team => team.trophyCount > 0 || team.runnerUpCount > 0);
        setTeams(teamsWithTrophiesOrRunnerUps.sort((a, b) => b.trophyCount - a.trophyCount));
      }
      
    } catch (error) {
      console.error('Error fetching trophy hall data:', error);
      setError('Failed to load trophy hall data');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamClick = (team) => {
    setSelectedTeam(team);
    setShowMatchDetails(true);
  };

  const getTeamMatches = (teamName) => {
    const matches = matchResultsData.filter(match => 
      match.team1 === teamName || match.team2 === teamName
    );
    console.log('Team matches for', teamName, ':', matches);
    return matches;
  };

  const closeMatchDetails = () => {
    setShowMatchDetails(false);
    setSelectedTeam(null);
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading Trophy Hall...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Error: {error}</h2>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '15px', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 15px 30px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <h1 style={{ 
            fontSize: '1.8rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 5px 0',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            🏆 CPL Trophy Hall
          </h1>
          <p style={{ 
            color: '#666', 
            fontSize: '0.9rem',
            margin: '0',
            fontWeight: '500'
          }}>
            Champions of Cricket Premier League
          </p>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '15px',
            color: 'white'
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr 1fr 1fr',
              gap: '15px',
              fontWeight: '700',
              fontSize: '1rem'
            }}>
              <div style={{ textAlign: 'left' }}>🏆</div>
              <div style={{ textAlign: 'center' }}>🥇</div>
              <div style={{ textAlign: 'center' }}>🥈</div>
            </div>
          </div>
          
          <div style={{ padding: '0' }}>
            {teams.length === 0 ? (
              <div style={{ 
                padding: '40px 20px', 
                textAlign: 'center',
                color: '#666',
                fontSize: '1rem'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '15px' }}>🏆</div>
                <div>No teams found or no trophies awarded yet.</div>
                <div style={{ fontSize: '0.8rem', marginTop: '8px', opacity: 0.7 }}>
                  Teams will appear here once they win their first trophy!
                </div>
              </div>
            ) : (
              teams.map((team, index) => (
                <div key={team._id} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr',
                  gap: '15px',
                  padding: '15px',
                  borderBottom: index < teams.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  background: index % 2 === 0 ? 'rgba(255,255,255,0.5)' : 'rgba(248,249,255,0.5)'
                }}
                onClick={() => handleTeamClick(team)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = index % 2 === 0 ? 'rgba(255,255,255,0.5)' : 'rgba(248,249,255,0.5)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    textAlign: 'left'
                  }}>
                    <div style={{ position: 'relative' }}>
                      {team.teamImage ? (
                        <img 
                          src={`${API_ENDPOINTS}${team.teamImage}`}
                          alt={team.teamName}
                          style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '50%', 
                            objectFit: 'cover',
                            border: '2px solid #fff',
                            boxShadow: '0 3px 8px rgba(0,0,0,0.15)'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%', 
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        display: team.teamImage ? 'none' : 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        border: '2px solid #fff',
                        boxShadow: '0 3px 8px rgba(0,0,0,0.15)'
                      }}>
                        {team.teamName.charAt(0).toUpperCase()}
                      </div>
                      {index < 3 && (
                        <div style={{
                          position: 'absolute',
                          top: '-3px',
                          right: '-3px',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: index === 0 ? 'linear-gradient(135deg, #ffd700, #ffed4e)' : 
                                     index === 1 ? 'linear-gradient(135deg, #c0c0c0, #e5e5e5)' : 
                                     'linear-gradient(135deg, #cd7f32, #daa520)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.6rem',
                          fontWeight: 'bold',
                          color: 'white',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                        }}>
                          {index + 1}
                        </div>
                      )}
                    </div>
                    <div style={{ 
                      fontWeight: '700', 
                      fontSize: '1.1rem',
                      color: '#333'
                    }}>
                      {team.abbreviation}
                    </div>
                  </div>
                  
                  <div style={{ 
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: '800',
                      background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {team.trophyCount}
                    </div>
                  </div>
                  
                  <div style={{ 
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: '800',
                      background: 'linear-gradient(135deg, #c0c0c0, #e5e5e5)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {team.runnerUpCount}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Match Details Popup */}
      {showMatchDetails && selectedTeam && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            padding: '0',
            maxWidth: '95vw',
            maxHeight: '95vh',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Header */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                color: 'white',
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: '700'
              }}>
                🏆 {selectedTeam.abbreviation} Match History
              </h2>
              <button
                onClick={closeMatchDetails}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: 'white',
                  fontSize: '1.5rem',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            {/* Match List */}
            <div style={{
              padding: '20px',
              maxHeight: '70vh',
              overflowY: 'auto'
            }}>
              {getTeamMatches(selectedTeam.teamName).length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: 'white',
                  padding: '40px',
                  fontSize: '1.1rem'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🏏</div>
                  <div>No matches found for {selectedTeam.abbreviation}</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {getTeamMatches(selectedTeam.teamName).map((match, index) => {
                    const isWinner = (match.winner === 'team1' && match.team1 === selectedTeam.teamName) || 
                                   (match.winner === 'team2' && match.team2 === selectedTeam.teamName);
                    const isRunnerUp = (match.winner === 'team1' && match.team2 === selectedTeam.teamName) || 
                                      (match.winner === 'team2' && match.team1 === selectedTeam.teamName);
                    
                    return (
                      <div key={index} style={{
                        background: isWinner ? 'rgba(34, 197, 94, 0.2)' : 
                                   isRunnerUp ? 'rgba(234, 179, 8, 0.2)' : 
                                   'rgba(255, 255, 255, 0.1)',
                        border: isWinner ? '2px solid rgba(34, 197, 94, 0.5)' : 
                               isRunnerUp ? '2px solid rgba(234, 179, 8, 0.5)' : 
                               '2px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '15px',
                        padding: '15px',
                        color: 'white'
                      }}>
                        {/* Match Header */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '10px',
                          flexWrap: 'wrap',
                          gap: '10px'
                        }}>
                          <div style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            {isWinner ? '🏆' : isRunnerUp ? '🥈' : '⚔️'}
                            <span>{match.team1} vs {match.team2}</span>
                          </div>
                          <div style={{
                            fontSize: '0.8rem',
                            opacity: 0.8
                          }}>
                            {match.matchDate ? new Date(match.matchDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            }) : 'Date N/A'}
                          </div>
                        </div>

                        {/* Scorecard */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr auto 1fr',
                          gap: '15px',
                          alignItems: 'center',
                          marginBottom: '10px'
                        }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{match.team1}</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>
                              {match.team1Score || 'N/A'}
                              {match.team1Wickets !== undefined && match.team1Wickets !== null && (
                                <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>/{match.team1Wickets}</span>
                              )}
                            </div>
                            {match.team1Overs && (
                              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                ({match.team1Overs} ov)
                              </div>
                            )}
                          </div>
                          <div style={{
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            textAlign: 'center'
                          }}>
                            VS
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{match.team2}</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>
                              {match.team2Score || 'N/A'}
                              {match.team2Wickets !== undefined && match.team2Wickets !== null && (
                                <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>/{match.team2Wickets}</span>
                              )}
                            </div>
                            {match.team2Overs && (
                              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                ({match.team2Overs} ov)
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Match Details */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                          gap: '10px',
                          fontSize: '0.85rem',
                          opacity: 0.9
                        }}>
                          {match.matchVenue && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <span>📍</span>
                              <span>{match.matchVenue}</span>
                            </div>
                          )}
                          {match.manOfTheMatch && match.manOfTheMatch.name && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <span>⭐</span>
                              <span>{match.manOfTheMatch.name} ({match.manOfTheMatch.runs || 0}-{match.manOfTheMatch.wickets || 0})</span>
                            </div>
                          )}
                          {match.trophyName && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <span>🏆</span>
                              <span>{match.trophyName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrophyHall;
