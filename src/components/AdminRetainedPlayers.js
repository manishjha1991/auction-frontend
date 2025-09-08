import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../const';
import LoadingCube from './CricketAnimation';
import NotificationBell from './NotificationBell';

const AdminRetainedPlayers = () => {
  const [retainedData, setRetainedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [showTeamReleaseConfirm, setShowTeamReleaseConfirm] = useState(false);
  const [releasingTeam, setReleasingTeam] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [adminReleasedPlayers, setAdminReleasedPlayers] = useState(false);
  const [releasedTeams, setReleasedTeams] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchRetainedPlayers();
    
    // Check if mobile on mount and resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchRetainedPlayers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_ENDPOINTS}/api/retained-players/all`, {
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setRetainedData(data);
      setAdminReleasedPlayers(data.adminReleasedPlayers || false);
      setReleasedTeams(data.releasedTeams || []);
    } catch (err) {
      console.error('Failed to fetch retained players:', err);
      setError('Failed to load retained players. Please try again later.');
    } finally {
      setLoading(false);
    }
  };


  const handleReleaseAllOthers = async () => {
    try {
      setReleasing(true);
      const user = JSON.parse(localStorage.getItem('user'));
      const adminUserId = user?.id;
      
      const response = await fetch(`${API_ENDPOINTS}/api/retained-players/release-all-others`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Release all others result:', result);
        
        let message = `Successfully released ${result.releasedCount} players!\n\n${result.purseReset}\n${result.retentionDeduction}`;
        
        if (result.bidCleanup) {
          message += `\n\nBid Cleanup Results:\n`;
          message += `• Bids deleted: ${result.bidCleanup.bidsDeleted}\n`;
          message += `• Bid history deleted: ${result.bidCleanup.bidHistoryDeleted}\n`;
          message += `• Notifications deleted: ${result.bidCleanup.notificationsDeleted}\n`;
          message += `• Comments deleted: ${result.bidCleanup.commentsDeleted}\n`;
          message += `• Pick requests deleted: ${result.bidCleanup.pickRequestsDeleted}\n`;
          message += `• Player stats deleted: ${result.bidCleanup.playerStatsDeleted}\n`;
          message += `• Post likes deleted: ${result.bidCleanup.postLikesDeleted}\n`;
          message += `• Release requests deleted: ${result.bidCleanup.releaseRequestsDeleted}\n`;
          message += `• Trade requests deleted: ${result.bidCleanup.tradeRequestsDeleted}`;
        }
        
        alert(message);
        setShowReleaseConfirm(false);
        fetchRetainedPlayers(); // Refresh data
        // Notify other components about admin release
        window.dispatchEvent(new CustomEvent('adminReleaseChanged'));
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to release all other players');
      }
    } catch (err) {
      console.error('Failed to release all other players:', err);
      setError('Failed to release all other players. Please try again.');
    } finally {
      setReleasing(false);
    }
  };

  const handleReleaseTeamPlayers = async () => {
    try {
      setReleasingTeam(true);
      const user = JSON.parse(localStorage.getItem('user'));
      const adminUserId = user?.id;
      
      console.log('Releasing team players for:', selectedTeam);
      console.log('Admin user ID:', adminUserId);
      
      const requestBody = { 
        adminUserId, 
        teamId: selectedTeam.teamId,
        teamName: selectedTeam.teamName
      };
      
      console.log('Request body:', requestBody);
      
      const response = await fetch(`${API_ENDPOINTS}/api/retained-players/release-team-players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Release team players result:', result);
        
        let message = `Successfully released ${result.releasedCount} non-retained players for ${selectedTeam.teamName}!\n\nRetained players: ${result.retainedCount}\nReleased players: ${result.releasedCount}\nRetention cost: ₹${result.retentionCost} Cr\nFinal purse: ₹${result.finalPurse} Cr\n\n${result.message}`;
        
        if (result.bidCleanup) {
          message += `\n\nBid Cleanup Results:\n`;
          message += `• Bids deleted: ${result.bidCleanup.bidsDeleted}\n`;
          message += `• Bid history deleted: ${result.bidCleanup.bidHistoryDeleted}\n`;
          message += `• Notifications deleted: ${result.bidCleanup.notificationsDeleted}\n`;
          message += `• Comments deleted: ${result.bidCleanup.commentsDeleted}\n`;
          message += `• Pick requests deleted: ${result.bidCleanup.pickRequestsDeleted}\n`;
          message += `• Player stats deleted: ${result.bidCleanup.playerStatsDeleted}\n`;
          message += `• Post likes deleted: ${result.bidCleanup.postLikesDeleted}\n`;
          message += `• Release requests deleted: ${result.bidCleanup.releaseRequestsDeleted}\n`;
          message += `• Trade requests deleted: ${result.bidCleanup.tradeRequestsDeleted}`;
        }
        
        alert(message);
        setShowTeamReleaseConfirm(false);
        setSelectedTeam(null);
        fetchRetainedPlayers(); // Refresh data
        // Notify other components about admin release
        window.dispatchEvent(new CustomEvent('adminReleaseChanged'));
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to release team players');
      }
    } catch (err) {
      console.error('Failed to release team players:', err);
      setError('Failed to release team players. Please try again.');
    } finally {
      setReleasingTeam(false);
    }
  };


  const formatAmount = (amount) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} Lakh`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(2)} K`;
    return `₹${amount}`;
  };

  if (loading) {
    return <LoadingCube animationFile="Profile.json" />;
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh',
        fontSize: '1.2rem',
        color: '#dc3545'
      }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <NotificationBell />
      
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '20px',
        padding: '30px',
        marginBottom: '30px',
        color: 'white',
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '2.5rem', fontWeight: '700' }}>
          💎 Retained Players Management
        </h1>
        <p style={{ margin: '0', fontSize: '1.2rem', opacity: 0.9 }}>
          Manage team-wise retained players and release all other players
        </p>
        {adminReleasedPlayers && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '15px',
            padding: '15px',
            margin: '20px 0',
            border: '2px solid rgba(255, 255, 255, 0.5)',
            textAlign: 'center'
          }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '1.3rem', color: '#fff' }}>
              ✅ Players Released Successfully
            </h4>
            <p style={{ margin: '0', fontSize: '1rem', opacity: 0.9 }}>
              All non-retained players have been released. Undo option is now disabled.
            </p>
          </div>
        )}
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '15px',
          padding: '20px',
          margin: '20px 0',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.5rem' }}>
            📊 Summary
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>
                {retainedData?.totalRetained || 0}
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Total Retained</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>
                {retainedData?.teams?.length || 0}
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Teams</div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Release Status Banner */}
      {adminReleasedPlayers && (
        <div style={{
          background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
          borderRadius: '15px',
          padding: '20px',
          marginBottom: '20px',
          textAlign: 'center',
          boxShadow: '0 8px 25px rgba(40, 167, 69, 0.3)'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>✅</div>
          <h3 style={{ margin: '0 0 10px 0', color: 'white', fontSize: '1.3rem' }}>
            Players Already Released
          </h3>
          <p style={{ margin: '0', color: 'white', opacity: 0.9, fontSize: '1rem' }}>
            You have already released all other players. You can release again if needed.
          </p>
        </div>
      )}


      {/* Release All Others Button */}
      <div style={{
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
          borderRadius: '15px',
          padding: '20px',
          marginBottom: '30px',
          textAlign: 'center',
          boxShadow: '0 8px 25px rgba(255, 107, 107, 0.3)'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: 'white', fontSize: '1.5rem' }}>
            🚨 Release All Other Players
          </h3>
          <p style={{ margin: '0 0 20px 0', color: 'white', opacity: 0.9 }}>
            This will release all players except the retained ones and reset the tournament data.
          </p>
          <button
            onClick={() => setShowReleaseConfirm(true)}
            disabled={releasing}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              padding: '15px 30px',
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: releasing ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: releasing ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!releasing) {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                e.target.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!releasing) {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            {releasing ? '⏳ Releasing...' : '🚀 Release All Others'}
          </button>
        </div>

      {/* Teams and Retained Players */}
      <div style={{ 
        display: 'grid', 
        gap: isMobile ? '20px' : '30px',
        padding: isMobile ? '0 10px' : '0'
      }}>
        {retainedData?.teams?.map((team, teamIndex) => (
          <div
            key={teamIndex}
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: isMobile ? '15px' : '25px',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e0e0e0',
              margin: isMobile ? '0 5px' : '0'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '2px solid #f0f0f0',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                width: isMobile ? '40px' : '50px',
                height: isMobile ? '40px' : '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: isMobile ? '10px' : '15px',
                fontSize: isMobile ? '1.2rem' : '1.5rem',
                color: 'white',
                fontWeight: 'bold',
                flexShrink: 0
              }}>
                {team.teamAbbreviation || team.teamName.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <h3 style={{ 
                  margin: '0 0 5px 0', 
                  fontSize: isMobile ? '1.2rem' : '1.5rem', 
                  color: '#333',
                  wordBreak: 'break-word'
                }}>
                  {team.teamName}
                </h3>
                <p style={{ 
                  margin: '0', 
                  color: '#666', 
                  fontSize: isMobile ? '0.9rem' : '1rem' 
                }}>
                  {team.players.length} retained player{team.players.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              {/* Release Team Players Button - Only show if team hasn't been released */}
              {!releasedTeams.includes(team.teamId) && (
                <button
                    onClick={() => {
                      setSelectedTeam({
                        teamId: team.teamId,
                        teamName: team.teamName,
                        playerCount: team.players.length
                      });
                      setShowTeamReleaseConfirm(true);
                    }}
                    disabled={releasingTeam}
                    style={{
                      background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      padding: isMobile ? '10px 16px' : '12px 20px',
                      color: 'white',
                      fontSize: isMobile ? '12px' : '14px',
                      fontWeight: '600',
                      cursor: releasingTeam ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      opacity: releasingTeam ? 0.6 : 1,
                      boxShadow: '0 4px 15px rgba(220, 53, 69, 0.3)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      if (!releasingTeam) {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 20px rgba(220, 53, 69, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!releasingTeam) {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 15px rgba(220, 53, 69, 0.3)';
                      }
                    }}
                  >
                    {releasingTeam ? '⏳ Releasing...' : '🚀 Release Team Players'}
                  </button>
              )}
              
              {/* Show released status if team has been released */}
              {releasedTeams.includes(team.teamId) && (
                <div style={{
                  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: isMobile ? '10px 16px' : '12px 20px',
                  color: 'white',
                  fontSize: isMobile ? '12px' : '14px',
                  fontWeight: '600',
                  textAlign: 'center',
                  boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}>
                  ✅ Team Released
                </div>
              )}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile 
                ? '1fr' 
                : window.innerWidth < 1024 
                  ? 'repeat(auto-fill, minmax(250px, 1fr))' 
                  : 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: isMobile ? '15px' : '20px'
            }}>
              {team.players.map((retained, playerIndex) => (
                <div
                  key={playerIndex}
                  style={{
                    background: `linear-gradient(135deg, ${
                      retained.playerType === 'Emerald' ? '#28a745, #20c997' :
                      retained.playerType === 'Sapphire' ? '#6f42c1, #e83e8c' :
                      retained.playerType === 'Gold' ? '#ffc107, #fd7e14' :
                      '#6c757d, #495057'
                    })`,
                    borderRadius: '15px',
                    padding: isMobile ? '15px' : '20px',
                    color: 'white',
                    position: 'relative',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                    transition: 'transform 0.3s ease',
                    minHeight: isMobile ? '120px' : '140px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-5px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: isMobile ? '8px' : '10px',
                    right: isMobile ? '8px' : '10px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    padding: isMobile ? '3px 6px' : '4px 8px',
                    fontSize: isMobile ? '10px' : '12px',
                    fontWeight: 'bold'
                  }}>
                    {retained.playerType}
                  </div>
                  
                  <h4 style={{ 
                    margin: '0 0 10px 0', 
                    fontSize: isMobile ? '1rem' : '1.2rem', 
                    fontWeight: '600',
                    lineHeight: '1.2',
                    wordBreak: 'break-word'
                  }}>
                    {retained.playerName}
                  </h4>
                  
                  <p style={{ 
                    margin: '0 0 8px 0', 
                    opacity: 0.9, 
                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                    lineHeight: '1.3'
                  }}>
                    <strong>Role:</strong> {retained.playerRole}
                  </p>
                  
                  <p style={{ 
                    margin: '0 0 8px 0', 
                    opacity: 0.9, 
                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                    lineHeight: '1.3'
                  }}>
                    <strong>Retention Value:</strong> ₹17.00 Cr
                  </p>
                  
                  <p style={{ 
                    margin: '0', 
                    opacity: 0.8, 
                    fontSize: isMobile ? '0.7rem' : '0.8rem',
                    lineHeight: '1.3'
                  }}>
                    <strong>Retained:</strong> {new Date(retained.retainedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Release Confirmation Modal */}
      {showReleaseConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: '20px'
            }}>
              ⚠️
            </div>
            <h2 style={{
              margin: '0 0 15px 0',
              fontSize: '1.8rem',
              color: '#333'
            }}>
              Are you absolutely sure?
            </h2>
            <p style={{
              margin: '0 0 20px 0',
              fontSize: '1.1rem',
              color: '#666',
              lineHeight: '1.5'
            }}>
              This will release <strong>ALL players except the retained ones</strong> and reset all tournament data including fixtures, schedules, and user statistics. This action cannot be undone!
            </p>
            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'center',
              marginTop: '25px'
            }}>
              <button
                onClick={() => setShowReleaseConfirm(false)}
                style={{
                  padding: '12px 25px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  background: 'white',
                  color: '#666',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReleaseAllOthers}
                disabled={releasing}
                style={{
                  padding: '12px 25px',
                  border: 'none',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: releasing ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: releasing ? 0.6 : 1
                }}
              >
                {releasing ? '⏳ Releasing...' : '🚀 Yes, Release All Others'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Release Confirmation Modal */}
      {showTeamReleaseConfirm && selectedTeam && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: '20px'
            }}>
              ⚠️
            </div>
            <h2 style={{
              margin: '0 0 15px 0',
              fontSize: '1.8rem',
              color: '#333'
            }}>
              Release Team Players?
            </h2>
            <p style={{
              margin: '0 0 20px 0',
              fontSize: '1.1rem',
              color: '#666',
              lineHeight: '1.5'
            }}>
              This will release <strong>NON-RETAINED players for {selectedTeam.teamName}</strong>. Retained players will be kept and their base price set to ₹17 Cr. Team purse will be reset to 100 Cr minus retention costs. This action cannot be undone!
            </p>
            <div style={{
              background: '#f8f9fa',
              borderRadius: '10px',
              padding: '15px',
              margin: '20px 0',
              border: '1px solid #e9ecef'
            }}>
              <p style={{ margin: '0', fontSize: '0.9rem', color: '#666' }}>
                <strong>Team:</strong> {selectedTeam.teamName}<br/>
                <strong>Retained Players:</strong> {selectedTeam.playerCount}
              </p>
            </div>
            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'center',
              marginTop: '25px'
            }}>
              <button
                onClick={() => {
                  setShowTeamReleaseConfirm(false);
                  setSelectedTeam(null);
                }}
                style={{
                  padding: '12px 25px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  background: 'white',
                  color: '#666',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReleaseTeamPlayers}
                disabled={releasingTeam}
                style={{
                  padding: '12px 25px',
                  border: 'none',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: releasingTeam ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: releasingTeam ? 0.6 : 1
                }}
              >
                {releasingTeam ? '⏳ Releasing...' : '🚀 Yes, Release Team Players'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminRetainedPlayers;
