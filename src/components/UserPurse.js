import React, { useEffect, useState } from "react";
import "../css/UserPurse.css"; // Custom CSS file
import { API_ENDPOINTS } from "../const";
import LoadingCube from "./CricketAnimation"; // Import the reusable component
import NotificationBell from './NotificationBell';
import PlayerPopup from './PlayerPopup';

const UserPursePage = () => {
  const [usersData, setUsersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState(null);
  const [biddingStatuses, setBiddingStatuses] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [lastBidders, setLastBidders] = useState({});
  const [userBidPositions, setUserBidPositions] = useState({});

  useEffect(() => {
    // Get current user from localStorage
    const user = JSON.parse(localStorage.getItem("user"));
    setCurrentUser(user);
    setIsAdmin(user?.isAdmin === true);
  }, []);

  const handlePlayerClick = (player) => {
    console.log('Player clicked:', player);
    setSelectedPlayer(player);
  };

  const handleClosePopup = () => {
    setSelectedPlayer(null);
  };

  const fetchCompetitorBidder = async (playerId, playerName) => {
    if (lastBidders[playerId]) {
      return; // Already fetched
    }
    
    try {
      const response = await fetch(`${API_ENDPOINTS}/api/player/${playerId}/bids`, {
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const allBids = data.allBids || [];
      
      if (allBids.length === 0) {
        setLastBidders(prev => ({
          ...prev,
          [playerId]: null
        }));
        setUserBidPositions(prev => ({
          ...prev,
          [playerId]: null
        }));
        return;
      }

      // Get current user info
      const currentUserId = currentUser?.id || currentUser?._id;
      
      // Sort bids by amount (highest first)
      const sortedBids = allBids.sort((a, b) => b.bidAmount - a.bidAmount);
      
      // Find current user's position
      const userBidIndex = sortedBids.findIndex(bid => 
        bid.bidder?.toString() === currentUserId?.toString() || 
        bid.bidder?._id?.toString() === currentUserId?.toString()
      );
      
      let competitorName = null;
      
      if (userBidIndex === 0) {
        // User is highest bidder, show second highest
        if (sortedBids.length > 1) {
          competitorName = sortedBids[1].bidder?.name || sortedBids[1].bidderName || 'Unknown';
        }
      } else if (userBidIndex === 1) {
        // User is second highest, show highest bidder
        competitorName = sortedBids[0].bidder?.name || sortedBids[0].bidderName || 'Unknown';
      } else if (userBidIndex > 1) {
        // User is lower, show highest bidder
        competitorName = sortedBids[0].bidder?.name || sortedBids[0].bidderName || 'Unknown';
      }
      
      setLastBidders(prev => ({
        ...prev,
        [playerId]: competitorName
      }));
      
      setUserBidPositions(prev => ({
        ...prev,
        [playerId]: userBidIndex
      }));
    } catch (err) {
      console.error(`Failed to fetch competitor for ${playerName}:`, err);
      setLastBidders(prev => ({
        ...prev,
        [playerId]: null
      }));
      setUserBidPositions(prev => ({
        ...prev,
        [playerId]: null
      }));
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setLoadingProgress(0);
        const startTime = Date.now();
        
        // Smooth progress updates
        setLoadingProgress(20);
        const response = await fetch(`${API_ENDPOINTS}/api/users/purses`);
        setLoadingProgress(60);
        
        if (!response.ok) {
          throw new Error("Failed to fetch user purse data.");
        }
        const data = await response.json();
        setUsersData(data);
        setLoadingProgress(80);
        
        // OPTIMIZATION: Extract bidding statuses efficiently
        if (currentUser) {
          // Try to find user by ID, _id, or userName (optimized lookup)
          const currentUserData = data.find(user => 
            user.id === currentUser.id || 
            user._id === currentUser.id || 
            user.userName === currentUser.name
          );
          
          if (currentUserData) {
            // OPTIMIZATION: Use reduce for better performance
            const userStatuses = currentUserData.players.reduce((acc, player) => {
              if (player.isBidOn && player.biddingStatus) {
                acc[player.name] = {
                  isHighest: player.biddingStatus.isHighest,
                  isSecondHighest: player.biddingStatus.isSecondHighest,
                  bidAmount: player.biddingPrice,
                  playerName: player.name,
                  position: player.biddingStatus.position,
                  totalBidders: player.biddingStatus.totalBidders,
                  bidderName: currentUserData.userName,
                  isCurrentUser: true
                };
              }
              return acc;
            }, {});
            
            setBiddingStatuses(userStatuses);
          }
        }
        
        setLoadingProgress(100);
        const loadTime = Date.now() - startTime;
        console.log(`⚡ UserPurse loaded in ${loadTime}ms`);
        
        // Small delay for smooth transition
        setTimeout(() => setLoading(false), 200);
      } catch (err) {
        setError(err.message || "Failed to fetch data.");
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  // Auto-fetch competitor info for current user's bidding players
  useEffect(() => {
    if (currentUser && usersData.length > 0) {
      const currentUserData = usersData.find(user => 
        user.id === currentUser.id || 
        user._id === currentUser.id || 
        user.userName === currentUser.name
      );
      
      if (currentUserData) {
        const biddingPlayers = currentUserData.players.filter(p => p.isBidOn);
        biddingPlayers.forEach(player => {
          if (player.id && !lastBidders[player.id]) {
            fetchCompetitorBidder(player.id, player.name);
          }
        });
      }
    }
  }, [currentUser, usersData, lastBidders]);


  // Get bidding status for a specific player
  const getBiddingStatus = (playerName) => {
    console.log('=== getBiddingStatus called ===');
    console.log('Player name:', playerName);
    console.log('Available bidding statuses:', biddingStatuses);
    console.log('Bidding statuses keys:', Object.keys(biddingStatuses));
    
    if (!biddingStatuses[playerName]) {
      console.log('❌ No status found for player:', playerName);
      return null;
    }
    
    const status = biddingStatuses[playerName];
    console.log('✅ Status found for player:', playerName, ':', status);
    console.log('Status.isHighest:', status.isHighest);
    console.log('Status.isSecondHighest:', status.isSecondHighest);
    console.log('Status.position:', status.position);
    
    // Since we're only processing current user's players, determine status based on position
    if (status.isHighest) {
      console.log('🎯 Returning: winning (highest bid)');
      return 'winning';
    } else if (status.isSecondHighest) {
      console.log('🎯 Returning: second (second highest bid)');
      return 'second';
    } else if (status.position > 2) {
      console.log('🎯 Returning: losing (out of top 2)');
      return 'losing';
    } else {
      console.log('🎯 Returning: neutral (no clear status)');
      return 'neutral';
    }
  };

  // Get status display text and icon
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'winning':
        return { text: 'W', icon: '', className: 'winning-bid' };
      case 'second':
        return { text: 'L', icon: '', className: 'second-bid' };
      case 'losing':
        return { text: '', icon: '🔥', className: 'losing-bid' };
      case 'neutral':
        return { text: '', icon: '', className: '' };
      default:
        return { text: '', icon: '' };
    }
  };

  const getPlayerColor = (playerType) => {
    switch (playerType) {
      case "Sapphire":
        return "linear-gradient(135deg, #3a7bd5, #3a6073)";
      case "Gold":
        return "linear-gradient(135deg, #f7971e, #ffd200)";
      case "Emerald":
        return "linear-gradient(135deg, #56ab2f, #a8e063)";
      case "Silver":
        return "linear-gradient(135deg, #6c757d, #495057)";
      default:
        return "linear-gradient(135deg, #d3d3d3, #8c8c8c)";
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <LoadingCube animationFile="Purse.json" />
        <div style={{
          marginTop: '20px',
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          Loading Purse Data...
        </div>
        <div style={{
          width: '300px',
          height: '6px',
          backgroundColor: 'rgba(255,255,255,0.3)',
          borderRadius: '3px',
          marginTop: '20px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${loadingProgress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
            borderRadius: '3px',
            transition: 'width 0.3s ease-in-out'
          }} />
        </div>
        <div style={{
          marginTop: '10px',
          color: 'rgba(255,255,255,0.8)',
          fontSize: '14px'
        }}>
          {loadingProgress}%
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  // Sort users to put current user first
  const sortedUsersData = [...usersData].sort((a, b) => {
    const aIsCurrentUser = a.id === currentUser?.id || a._id === currentUser?.id || a.userName === currentUser?.name;
    const bIsCurrentUser = b.id === currentUser?.id || b._id === currentUser?.id || b.userName === currentUser?.name;
    
    if (aIsCurrentUser && !bIsCurrentUser) return -1;
    if (!aIsCurrentUser && bIsCurrentUser) return 1;
    return 0;
  });

  return (
    <div className="user-purse-page">
       {/* Include the NotificationBell component */}
       <NotificationBell />
      


      <div className="user-cards-container">
        {sortedUsersData.map((user, index) => {
          const isCurrentUser = user.id === currentUser?.id || user._id === currentUser?.id || user.userName === currentUser?.name;
          const isFirstTeam = index === 0;
          const isLastTeam = index === sortedUsersData.length - 1;
          
          // Calculate player type breakdown
          const playerTypeCounts = user.players.reduce((acc, player) => {
            const type = player.type || 'Unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {});
          
          // Fix player filtering - check actual data structure
          console.log('User data for', user.userName, ':', {
            totalPlayers: user.players.length,
            players: user.players.map(p => ({
              name: p.name,
              isBidOn: p.isBidOn,
              status: p.status,
              type: p.type
            }))
          });
          
          const ownedPlayers = user.players.filter(p => !p.isBidOn);
          const biddingPlayers = user.players.filter(p => p.isBidOn);
          
          console.log('Filtered players:', {
            owned: ownedPlayers.length,
            bidding: biddingPlayers.length
          });
          
          return (
            <div key={index}>
              {/* Team Separator */}
              {!isFirstTeam && (
                <div className="team-separator">
                  <div className="separator-line"></div>
                  <div className="separator-text">VS</div>
                  <div className="separator-line"></div>
                </div>
              )}
              
              <div className={`user-card ${isCurrentUser ? 'current-user' : ''}`}>
                {/* User Card Header */}
                <div className="user-card-header">
                  <div className="user-avatar">
                    <span className="user-initial">{user.userName.charAt(0).toUpperCase()}</span>
                    {isCurrentUser && <div className="current-user-badge">YOU</div>}
                  </div>
                  <div className="user-info">
            <h2 className="user-name">{user.userName}</h2>
                    <div className="user-stats">
                      <div className="stat-item">
                        <span className="stat-number">{ownedPlayers.length}</span>
                        <span className="stat-label">Owned</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">{biddingPlayers.length}</span>
                        <span className="stat-label">Bidding</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">{user.players.length}</span>
                        <span className="stat-label">Total</span>
                      </div>
                    </div>
                  </div>
            </div>

            {/* Purse Value with Modern Design */}
            <div className="purse-value-container">
              <div className={`purse-circle ${
                (user.purseValue / 10000000) < 5 ? 'low-purse' : 
                (user.purseValue / 10000000) > 30 ? 'high-purse' : ''
              }`}>
                <div className="purse-inner">
                <span className="purse-amount">₹{(user.purseValue / 10000000).toFixed(2)}</span>
                <span className="purse-unit">Cr</span>
                </div>
                <div className="purse-ring"></div>
              </div>
              <div className="purse-status">
                {(user.purseValue / 10000000) < 5 ? 'Low Funds' : 
                 (user.purseValue / 10000000) > 30 ? 'Rich' : 'Good'}
              </div>
            </div>

            {/* Player Type Breakdown */}
            <div className="player-type-breakdown">
              <h3 className="breakdown-title">Player Types</h3>
              <div className="type-stats-grid">
                {Object.entries(playerTypeCounts).map(([type, count]) => (
                  <div key={type} className={`type-stat-item ${type.toLowerCase()}`}>
                    <span className="type-count">{count}</span>
                    <span className="type-name">{type}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Players Section */}
            <div className="players-section">
              <div className="section-header">
                <h3 className="section-title">Owned Players</h3>
                <div className="section-count">{user.players.filter(p => !p.isBidOn).length}</div>
            </div>
            <div className="players-container">
              {user.players
                .filter((player) => !player.isBidOn)
                  .sort((a, b) => {
                    // Normalize type to handle any casing issues
                    const typeA = (a.type || '').toString().trim();
                    const typeB = (b.type || '').toString().trim();
                    
                    const typeOrder = { 
                      'Sapphire': 0, 'sapphire': 0, 'SAPPHIRE': 0,
                      'Emerald': 1, 'emerald': 1, 'EMERALD': 1,
                      'Gold': 2, 'gold': 2, 'GOLD': 2,
                      'Silver': 3, 'silver': 3, 'SILVER': 3
                    };
                    
                    const orderA = typeOrder[typeA] !== undefined ? typeOrder[typeA] : 4;
                    const orderB = typeOrder[typeB] !== undefined ? typeOrder[typeB] : 4;
                    
                    return orderA - orderB;
                  })
                .map((player, idx) => (
                  <div
                    key={idx}
                      className={`player-card sold ${player.type.toLowerCase()}`}
                    style={{
                      background: getPlayerColor(player.type),
                        cursor: 'pointer'
                    }}
                      onClick={() => handlePlayerClick(player)}
                  >
                      <div className="player-type-badge">{player.type}</div>
                    <h3 className="player-name">{player.name}</h3>
                    <div className="player-value-container">
                      <div className="player-price-circle sold-price">
                        <span className="price-amount">₹{(player.boughtValue / 10000000).toFixed(2)}</span>
                        <span className="price-unit">Cr</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {user.players.some((player) => player.isBidOn) && (
                <div className="section-divider">
                  <div className="divider-line"></div>
                  <div className="divider-text">Bidding</div>
                  <div className="divider-line"></div>
                </div>
              )}

              {user.players.some((player) => player.isBidOn) && (
                <div className="section-header">
                  <h3 className="section-title">Bidding Players</h3>
                  <div className="section-count">{user.players.filter(p => p.isBidOn).length}</div>
                </div>
              )}
              <div className="players-container bidding-players">
              {user.players
                .filter((player) => player.isBidOn)
                .map((player, idx) => {
                  console.log('Processing player:', player.name, 'for user:', user.userName);
                  console.log('Complete player object:', player);
                  
                  // Only show status indicators for the current logged-in user's players
                  const isCurrentUser = user.id === currentUser?.id || user._id === currentUser?.id || user.userName === currentUser?.name;
                  console.log('Is current user?', isCurrentUser);
                  console.log('  - User ID from API:', user.id);
                  console.log('  - User _id from API:', user._id);
                  console.log('  - User name from API:', user.userName);
                  console.log('  - Current user ID from localStorage:', currentUser?.id);
                  console.log('  - Current user name from localStorage:', currentUser?.name);
                  
                  let status = null;
                  let displayInfo = { text: '', icon: '', className: '' };
                  
                  if (isCurrentUser) {
                    // Only get status for current user's players
                    status = getBiddingStatus(player.name);
                    console.log('Bidding status result:', status);
                    displayInfo = getStatusDisplay(status);
                    console.log('Display info:', displayInfo);
                  } else {
                    console.log('Not current user, no status indicator shown');
                  }
                  
                  return (
                    <div
                      key={idx}
                        className={`player-card bidding ${player.type.toLowerCase()} ${isCurrentUser ? 'current-user-bidding' : ''}`}
                      style={{
                          animation: "biddingPulse 2s ease-in-out infinite",
                          background: getPlayerColor(player.type),
                          cursor: 'pointer'
                      }}
                        onClick={() => handlePlayerClick(player)}
                    >
                      <h3 className="player-name">{player.name}</h3>
                      <div className="player-value-container">
                        <div className="player-price-circle bidding-price">
                          <span className="price-amount">₹{(player.biddingPrice / 10000000).toFixed(2)}</span>
                          <span className="price-unit">Cr</span>
                        </div>
                      </div>
                      {isCurrentUser && displayInfo.text && (
                        <div className={`bidding-status ${displayInfo.className}`}>
                            <span className="status-icon">{displayInfo.icon}</span>
                            <span className="status-text">{displayInfo.text}</span>
                        </div>
                      )}
                      
                      {/* Competitor Display for Current User */}
                      {isCurrentUser && (
                        <div className="last-bidder-section">
                          {lastBidders[player.id] ? (
                            <div className="last-bidder-info">
                              <span className={`competitor-arrow ${
                                userBidPositions[player.id] === 0 ? 'arrow-down' : 'arrow-up'
                              }`}>
                                {userBidPositions[player.id] === 0 ? '↓' : '↑'}
                              </span>
                              <span className="last-bidder-name">
                                {lastBidders[player.id]}
                              </span>
                            </div>
                          ) : (
                            <div className="last-bidder-loading">
                              <span className="last-bidder-label">Loading...</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                        <div className="player-status bidding-status-text">🔥 Bidding</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
            </div>
        );
        })}
      </div>

      {/* Player Popup */}
      {selectedPlayer && (
        <PlayerPopup
          player={selectedPlayer}
          onClose={handleClosePopup}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};

export default UserPursePage;
