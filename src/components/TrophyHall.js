import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../const';

// Add CSS for animation (only once)
if (!document.getElementById('trophy-hall-animations')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'trophy-hall-animations';
  styleSheet.textContent = `
    @keyframes pulse {
      0%, 100% {
        transform: scale(1) rotate(0deg);
        opacity: 1;
      }
      50% {
        transform: scale(1.1) rotate(5deg);
        opacity: 0.8;
      }
    }
    @keyframes trophyFloat {
      0%, 100% { transform: translateY(0) rotate(-2deg); }
      50% { transform: translateY(-10px) rotate(3deg); }
    }
    @keyframes championShine {
      0% { transform: translateX(-140%) rotate(18deg); opacity: 0; }
      20% { opacity: 0.55; }
      55% { opacity: 0.2; }
      100% { transform: translateX(160%) rotate(18deg); opacity: 0; }
    }
    .world-cup-carousel {
      overflow-x: auto;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      padding: 8px 4px 18px;
      scroll-snap-type: x mandatory;
    }
    .world-cup-carousel::-webkit-scrollbar {
      display: none;
    }
    .world-cup-track {
      display: flex;
      gap: 20px;
      width: max-content;
    }
    @media (max-width: 768px) {
      .world-cup-track {
        gap: 14px;
      }
    }
  `;
  document.head.appendChild(styleSheet);
}
const TrophyHall = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showMatchDetails, setShowMatchDetails] = useState(false);
  const [matchResultsData, setMatchResultsData] = useState([]);
  const [worldCupWinners, setWorldCupWinners] = useState([]);
  const [worldCupTournaments, setWorldCupTournaments] = useState([]); // Store full tournament data

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
      const teamsResponseData = await teamsResponse.json();
      // Handle response format: { teams: [...] } or direct array
      const teamsData = teamsResponseData.teams || teamsResponseData || [];
      
      // Fetch match results from backend MatchResult public API
      const matchResponse = await fetch(`${API_ENDPOINTS}/api/match-results/public`);
      if (!matchResponse.ok) {
        throw new Error(`Failed to fetch match results: ${matchResponse.status}`);
      }
      const matchResponseData = await matchResponse.json();
      // Handle response format: { matchResults: [...] } or direct array
      const matchResultsData = matchResponseData.matchResults || matchResponseData || [];
      setMatchResultsData(matchResultsData);
      
      // Fetch World Cup tournament winners separately
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user?.id || user?._id;
      let fetchedWorldCupWinners = [];
      
      if (userId) {
        try {
          // Fetch all tournaments and then include only World Cups that have a recorded winner.
          const tournamentsResponse = await fetch(`${API_ENDPOINTS}/api/tournaments?limit=100`, {
            headers: {
              'user-id': userId
            }
          });
          if (tournamentsResponse.ok) {
            const tournamentsData = await tournamentsResponse.json();
            const tournaments = tournamentsData.tournaments || tournamentsData || [];

            // Filter completed World Cup tournaments with winners
            fetchedWorldCupWinners = tournaments
              .filter(t => {
                const isWorldCup = t.name && t.name.startsWith('World Cup');
                const hasWinner = t.winner && t.winner.teamName;

                return isWorldCup && hasWinner;
              })
              .map(t => {
                // Helper function to normalize team names for matching
                const normalizeTeamName = (name) => {
                  if (!name) return '';
                  return name.trim().toLowerCase();
                };
                
                // Try to find the team in teamsData to get teamImage
                const winnerTeamName = t.winner.teamName;
                const matchingTeam = teamsData.find(team => 
                  normalizeTeamName(team.teamName) === normalizeTeamName(winnerTeamName)
                );
                
                // Use team details from matching team, falling back to tournament winner data.
                const teamImage = matchingTeam?.teamImage || t.winner.teamImage || null;
                
                return {
                  tournamentName: t.name,
                  winner: {
                    teamName: winnerTeamName,
                    teamImage: teamImage,
                    abbreviation: matchingTeam?.abbreviation || null,
                    themePrimary: matchingTeam?.themePrimary || null,
                    themeSecondary: matchingTeam?.themeSecondary || null,
                    wonAt: t.winner.wonAt || t.endDate || new Date()
                  },
                  endDate: t.endDate,
                  startDate: t.startDate
                };
              })
              .sort((a, b) => new Date(b.winner?.wonAt || b.endDate) - new Date(a.winner?.wonAt || a.endDate)); // Most recent first
          }
        } catch (tournamentError) {
          console.warn('Error fetching World Cup tournaments:', tournamentError);
          // Continue without World Cup data if fetch fails
        }
      }
      
      setWorldCupWinners(fetchedWorldCupWinners);
      
      // Fetch tournaments again to calculate World Cup runner-ups (need tournamentFixtures)
      let allWorldCupTournaments = [];
      if (userId) {
        try {
          const tournamentsResponse = await fetch(`${API_ENDPOINTS}/api/tournaments?limit=100`, {
            headers: {
              'user-id': userId
            }
          });
          if (tournamentsResponse.ok) {
            const tournamentsData = await tournamentsResponse.json();
            const tournaments = tournamentsData.tournaments || tournamentsData || [];
            allWorldCupTournaments = tournaments.filter(t => 
              t.name && t.name.startsWith('World Cup') && t.winner && t.winner.teamName
            );
            // Store full tournament data for match display
            setWorldCupTournaments(allWorldCupTournaments);
          }
        } catch (error) {
          console.warn('Error fetching tournaments for runner-up calculation:', error);
        }
      }
      
      // Ensure teamsData is an array
      if (!Array.isArray(teamsData)) {
        throw new Error('Teams data is not in expected format');
      }
      
      // Helper function to normalize team names
      const normalizeTeamName = (name) => {
        if (!name) return '';
        return name.trim().toLowerCase();
      };
      
      // Calculate trophy counts and runner-up data
      const teamsWithData = teamsData.map(team => {
        const normalizedTeamName = normalizeTeamName(team.teamName);

        // Regular match wins (from MatchResult)
        const teamWins = matchResultsData.filter(match => {
          if (!match.winner || match.winner === 'tie' || match.winner === 'no_result') return false;
          // Check if this team won by comparing winner field with team1/team2
          const winningTeam = match.winner === 'team1' ? match.team1 : match.team2;
          return normalizeTeamName(winningTeam) === normalizedTeamName;
        });

        const teamLosses = matchResultsData.filter(match => {
          if (!match.winner || match.winner === 'tie' || match.winner === 'no_result') return false;
          // Check if this team played but didn't win
          const winningTeam = match.winner === 'team1' ? match.team1 : match.team2;
          const playedMatch =
            normalizeTeamName(match.team1) === normalizedTeamName ||
            normalizeTeamName(match.team2) === normalizedTeamName;
          return playedMatch && normalizeTeamName(winningTeam) !== normalizedTeamName;
        });

        // Trophy count = only regular match wins (World Cup is separate)
        const trophyCount = teamWins.length;
        const runnerUpCount = teamLosses.length;

        // World Cup wins
        const worldCupWins = fetchedWorldCupWinners.filter(wc => {
          const normalizedWinner = normalizeTeamName(wc.winner.teamName);
          return normalizedWinner === normalizedTeamName;
        });
        const worldCupCount = worldCupWins.length;
        
        // World Cup runner-ups (teams that reached final but lost)
        const worldCupRunnerUpCount = allWorldCupTournaments.filter(tournament => {
          const normalizedTournamentWinner = normalizeTeamName(tournament.winner.teamName);
          // If this team is the winner, they're not a runner-up
          if (normalizedTeamName === normalizedTournamentWinner) return false;
          
          // Check if this team was in the final match
          if (tournament.tournamentFixtures && tournament.tournamentFixtures.length > 0) {
            const finalFixture = tournament.tournamentFixtures[tournament.tournamentFixtures.length - 1];
            if (finalFixture) {
              const normalizedTeam1 = normalizeTeamName(finalFixture.team1);
              const normalizedTeam2 = normalizeTeamName(finalFixture.team2);
              const wasInFinal = (normalizedTeam1 === normalizedTeamName || normalizedTeam2 === normalizedTeamName);
              return wasInFinal;
            }
          }
          return false;
        }).length;

        return {
          _id: team._id,
          teamName: team.teamName,
          teamImage: team.teamImage,
          abbreviation: team.abbreviation,
          trophyCount,
          runnerUpCount,
          worldCupCount,
          worldCupRunnerUpCount
        };
      });
      
      // Show all teams if no match results exist, otherwise filter teams with trophies or runner-ups
      if (matchResultsData.length === 0 && fetchedWorldCupWinners.length === 0) {
        // No match results yet, show all teams with 0 trophies and 0 runner-ups
        setTeams(teamsWithData.sort((a, b) => a.teamName.localeCompare(b.teamName)));
      } else {
        // Filter out teams with 0 trophies, 0 runner-ups, 0 World Cup wins, and 0 World Cup runner-ups
        const teamsWithTrophiesOrRunnerUps = teamsWithData.filter(team => 
          team.trophyCount > 0 || 
          team.runnerUpCount > 0 || 
          team.worldCupCount > 0 || 
          team.worldCupRunnerUpCount > 0
        );
        setTeams(teamsWithTrophiesOrRunnerUps.sort((a, b) => {
          // Sort by total achievements (CPL + World Cup)
          const totalA = a.trophyCount + a.worldCupCount;
          const totalB = b.trophyCount + b.worldCupCount;
          if (totalB !== totalA) return totalB - totalA;
          return b.trophyCount - a.trophyCount;
        }));
      }
      
    } catch (error) {
      console.error('Error fetching trophy hall data:', error);
      setError(`Failed to load trophy hall data: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamClick = (team) => {
    setSelectedTeam(team);
    setShowMatchDetails(true);
  };

  const getTeamMatches = (teamName) => {
    const normalizeTeamName = (name) => name ? name.trim().toLowerCase() : '';
    const selectedTeamName = normalizeTeamName(teamName);

    // Get CPL matches
    const cplMatches = matchResultsData.filter(match => 
      normalizeTeamName(match.team1) === selectedTeamName || normalizeTeamName(match.team2) === selectedTeamName
    );
    
    // Get World Cup tournament final matches where this team participated
    const worldCupMatches = [];
    worldCupTournaments.forEach(tournament => {
      if (tournament.tournamentFixtures && tournament.tournamentFixtures.length > 0) {
        // Find final match
        const finalFixture = tournament.tournamentFixtures.find(f => 
          f.isFinal || f.matchType === 'final' || tournament.tournamentFixtures.indexOf(f) === tournament.tournamentFixtures.length - 1
        ) || tournament.tournamentFixtures[tournament.tournamentFixtures.length - 1];
        
        if (
          finalFixture &&
          (normalizeTeamName(finalFixture.team1) === selectedTeamName ||
            normalizeTeamName(finalFixture.team2) === selectedTeamName)
        ) {
          // Create a match object similar to CPL matches for consistency
          worldCupMatches.push({
            team1: finalFixture.team1,
            team2: finalFixture.team2,
            winner: finalFixture.winner === finalFixture.team1 ? 'team1' : 
                   finalFixture.winner === finalFixture.team2 ? 'team2' : null,
            team1Score: finalFixture.team1Score || '',
            team2Score: finalFixture.team2Score || '',
            team1Overs: finalFixture.team1Overs || '',
            team2Overs: finalFixture.team2Overs || '',
            team1Wickets: finalFixture.team1Wickets,
            team2Wickets: finalFixture.team2Wickets,
            matchDate: finalFixture.matchDate || tournament.endDate || tournament.startDate,
            tournamentName: tournament.name,
            isWorldCup: true,
            venue: finalFixture.venue || tournament.venue || 'World Cup Final',
            matchVenue: finalFixture.venue || tournament.venue || 'World Cup Final'
          });
        }
      }
    });
    
    // Combine CPL and World Cup matches
    const allMatches = [...cplMatches, ...worldCupMatches];
    return allMatches;
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

        {/* World Cup Winners Section */}
        <div style={{
          marginBottom: '30px',
          background: worldCupWinners.length > 0 
            ? 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)' 
            : 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 237, 78, 0.1) 100%)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: worldCupWinners.length > 0 
            ? '0 10px 30px rgba(255, 215, 0, 0.3)' 
            : '0 6px 20px rgba(0, 0, 0, 0.1)',
          border: worldCupWinners.length > 0 
            ? '3px solid rgba(255, 215, 0, 0.5)' 
            : '2px dashed rgba(255, 215, 0, 0.3)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '800',
              color: worldCupWinners.length > 0 ? '#1a1a1a' : '#666',
              margin: '0 0 8px 0',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              🌍 WORLD CUP CHAMPIONS
            </h2>
            <p style={{
              color: worldCupWinners.length > 0 ? '#333' : '#888',
              fontSize: '0.85rem',
              margin: '0',
              fontWeight: '600',
              opacity: 0.9
            }}>
              {worldCupWinners.length > 0 
                ? 'Elite Champions of the World Cup Tournament' 
                : 'The ultimate glory awaits...'}
            </p>
          </div>

          {worldCupWinners.length > 0 ? (

            <div className="world-cup-carousel">
              <div className="world-cup-track">
              {worldCupWinners.map((worldCup, index) => {
                const primary = worldCup.winner.themePrimary || '#facc15';
                const secondary = worldCup.winner.themeSecondary || '#f97316';
                const teamInitial = (worldCup.winner.abbreviation || worldCup.winner.teamName || '?')
                  .trim()
                  .charAt(0)
                  .toUpperCase();

                return (
                <div
                  key={`${worldCup.tournamentName}-${index}`}
                  style={{
                    width: 'min(82vw, 360px)',
                    minHeight: '315px',
                    background: `linear-gradient(145deg, ${primary} 0%, ${secondary} 52%, #111827 100%)`,
                    borderRadius: '28px',
                    padding: '20px',
                    boxShadow: `0 18px 40px ${primary}55, 0 8px 18px rgba(0, 0, 0, 0.22)`,
                    border: '1px solid rgba(255, 255, 255, 0.45)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    flex: '0 0 auto',
                    scrollSnapAlign: 'center',
                    color: 'white'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                    e.currentTarget.style.boxShadow = `0 24px 55px ${primary}66, 0 12px 24px rgba(0, 0, 0, 0.28)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = `0 18px 40px ${primary}55, 0 8px 18px rgba(0, 0, 0, 0.22)`;
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at 25% 15%, rgba(255,255,255,0.52), transparent 34%), radial-gradient(circle at 82% 80%, rgba(255,255,255,0.2), transparent 36%)',
                    pointerEvents: 'none'
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: '-30%',
                    left: 0,
                    width: '45%',
                    height: '160%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)',
                    animation: 'championShine 5s ease-in-out infinite',
                    pointerEvents: 'none'
                  }} />
                  {/* Trophy Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '14px',
                    right: '16px',
                    fontSize: '2.3rem',
                    opacity: 0.34,
                    animation: 'trophyFloat 3.6s ease-in-out infinite',
                    filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.25))'
                  }}>
                    🏆
                  </div>

                  {/* Tournament Name */}
                  <div style={{
                    fontSize: 'clamp(1rem, 3vw, 1.25rem)',
                    fontWeight: '900',
                    color: 'white',
                    marginBottom: '18px',
                    textAlign: 'center',
                    letterSpacing: '0.04em',
                    textShadow: '0 3px 12px rgba(0, 0, 0, 0.35)',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    {worldCup.tournamentName}
                  </div>

                  {/* Winner Team */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    {/* Team Logo/Image in Circle */}
                    <div style={{
                      position: 'relative',
                      width: '112px',
                      height: '112px',
                      borderRadius: '50%',
                      border: '5px solid rgba(255, 255, 255, 0.86)',
                      boxShadow: '0 14px 30px rgba(0, 0, 0, 0.28), inset 0 0 24px rgba(255, 255, 255, 0.3)',
                      overflow: 'hidden',
                      background: `linear-gradient(135deg, ${secondary}, ${primary})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      animation: 'pulse 3s ease-in-out infinite'
                    }}>
                      {worldCup.winner.teamImage ? (
                        <img
                          src={`${API_ENDPOINTS}${worldCup.winner.teamImage}`}
                          alt={worldCup.winner.teamName}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'center center',
                            borderRadius: '50%',
                            display: 'block'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const fallback = e.target.parentElement;
                            if (fallback) {
                              const fallbackDiv = fallback.querySelector('.fallback-initial');
                              if (fallbackDiv) {
                                fallbackDiv.style.display = 'flex';
                              }
                            }
                          }}
                        />
                      ) : null}
                      <div 
                        className="fallback-initial"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          display: worldCup.winner.teamImage ? 'none' : 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '2.5rem',
                          textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                          background: `linear-gradient(135deg, ${primary}, ${secondary})`,
                          borderRadius: '50%'
                        }}
                      >
                        {teamInitial}
                      </div>
                    </div>

                    <div style={{
                      textAlign: 'center'
                    }}>
                      <div 
                        style={{
                          fontSize: 'clamp(1.15rem, 4vw, 1.45rem)',
                          fontWeight: '900',
                          color: 'white',
                          marginBottom: '5px',
                          cursor: 'pointer',
                          textShadow: '0 3px 14px rgba(0, 0, 0, 0.45)'
                        }}
                        onClick={() => {
                          // Find the team from teams list
                          const team = teams.find(t => {
                            const normalizeTeamName = (name) => name ? name.trim().toLowerCase() : '';
                            return normalizeTeamName(t.teamName) === normalizeTeamName(worldCup.winner.teamName);
                          });
                          if (team) {
                            handleTeamClick(team);
                          }
                        }}
                        title="Click to view match details"
                      >
                        {worldCup.winner.teamName?.trim()}
                      </div>
                      <div style={{
                        fontSize: '0.8rem',
                        color: 'rgba(255, 255, 255, 0.86)',
                        fontWeight: '700'
                      }}>
                        {(() => {
                          const displayDate = worldCup.endDate || worldCup.winner?.wonAt || worldCup.startDate;
                          return displayDate ? new Date(displayDate).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                          }) : 'Date N/A';
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Champion Badge */}
                  <div style={{
                    position: 'absolute',
                    bottom: '14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(255, 255, 255, 0.92)',
                    color: '#111827',
                    padding: '7px 18px',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: '900',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.22)',
                    letterSpacing: '0.08em',
                    zIndex: 1
                  }}>
                    🏆 CHAMPION
                  </div>
                </div>
                );
              })}
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '12px',
              border: '2px dashed rgba(255, 215, 0, 0.4)'
            }}>
              {/* Animated Trophy */}
              <div style={{
                fontSize: '5rem',
                marginBottom: '20px',
                animation: 'pulse 2s ease-in-out infinite',
                display: 'inline-block'
              }}>
                🏆
              </div>
              
              {/* Loading Text */}
              <div style={{
                fontSize: '1.3rem',
                fontWeight: '800',
                color: '#333',
                marginBottom: '15px',
                background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Winner is Loading... ⏳
              </div>
              
              {/* Funny Subtext */}
              <div style={{
                fontSize: '1rem',
                color: '#666',
                marginBottom: '10px',
                fontWeight: '600',
                fontStyle: 'italic'
              }}>
                The battle for glory continues! 🔥
              </div>
              
              <div style={{
                fontSize: '0.9rem',
                color: '#888',
                marginTop: '20px',
                lineHeight: '1.6'
              }}>
                <div>🏏 Top 8 teams will compete</div>
                <div>⚔️ Round-robin matches await</div>
                <div>🏆 Only one will be crowned champion</div>
              </div>
              
              {/* Decorative Elements */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '15px',
                marginTop: '30px',
                opacity: 0.6
              }}>
                <span style={{ fontSize: '1.5rem' }}>⚡</span>
                <span style={{ fontSize: '1.5rem' }}>💫</span>
                <span style={{ fontSize: '1.5rem' }}>⭐</span>
                <span style={{ fontSize: '1.5rem' }}>✨</span>
                <span style={{ fontSize: '1.5rem' }}>🌟</span>
              </div>
            </div>
          )}
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
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
              gap: '15px',
              fontWeight: '700',
              fontSize: '1rem'
            }}>
              <div style={{ textAlign: 'left' }}>🏆</div>
              <div style={{ textAlign: 'center' }}>🥇 CPL</div>
              <div style={{ textAlign: 'center' }}>🥈 CPL</div>
              <div style={{ textAlign: 'center' }}>🌍 WC</div>
              <div style={{ textAlign: 'center' }}>🌍🥈 WC</div>
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
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
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
                  
                  <div style={{ 
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: '800',
                      background: 'linear-gradient(135deg, #ff8c00, #ffa500)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {team.worldCupCount || 0}
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
                      color: '#ff8c00',
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {team.worldCupRunnerUpCount || 0}
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
                            {match.isWorldCup ? '🌍' : ''}
                            {isWinner ? '🏆' : isRunnerUp ? '🥈' : '⚔️'}
                            <span>{match.team1} vs {match.team2}</span>
                            {match.isWorldCup && (
                              <span style={{ fontSize: '0.75rem', opacity: 0.7, marginLeft: '5px' }}>
                                ({match.tournamentName || 'World Cup'})
                              </span>
                            )}
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
                          {match.isWorldCup && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '3px 8px',
                              background: 'rgba(255, 215, 0, 0.2)',
                              borderRadius: '5px',
                              fontWeight: '600'
                            }}>
                              <span>🌍</span>
                              <span>World Cup Final</span>
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
