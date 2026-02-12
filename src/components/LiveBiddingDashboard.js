import React, { useEffect, useState, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import { API_ENDPOINTS } from '../const';
import '../css/LiveBiddingDashboard.css';

const LiveBiddingDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatedUserIds, setUpdatedUserIds] = useState(new Set());
  const [previousPurses, setPreviousPurses] = useState(new Map());
  const user = JSON.parse(localStorage.getItem('user'));
  const fetchInFlightRef = useRef(false);
  const pendingFetchRef = useRef(false);

  // Format currency
  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(2)} K`;
    }
    return `₹${amount}`;
  };

  // Fetch users with purse and active bids
  const fetchUsersData = useCallback(async () => {
    if (fetchInFlightRef.current) {
      pendingFetchRef.current = true;
      return;
    }
    fetchInFlightRef.current = true;
    try {
      const response = await fetch(`${API_ENDPOINTS}/api/bids/users-dashboard`);
      if (response.ok) {
        const data = await response.json();
        const usersData = data.users || [];
        
        // Detect purse changes for animation
        const currentPurses = new Map();
        const updatedIds = new Set();
        
        usersData.forEach(userData => {
          const userId = userData.userId.toString();
          const currentPurse = userData.purse;
          const previousPurse = previousPurses.get(userId);
          
          if (previousPurse !== undefined && previousPurse !== currentPurse) {
            // Purse changed - user made a bid or got refunded
            updatedIds.add(userId);
          }
          
          currentPurses.set(userId, currentPurse);
        });
        
        // Update animation state
        if (updatedIds.size > 0) {
          setUpdatedUserIds(updatedIds);
          setTimeout(() => {
            setUpdatedUserIds(new Set());
          }, 1500);
        }
        
        setPreviousPurses(currentPurses);
        
        // Sort: My user first, then others
        const userId = user ? (user.id || user._id)?.toString() : null;
        const sortedUsers = usersData.sort((a, b) => {
          const aId = a.userId.toString();
          const bId = b.userId.toString();
          if (aId === userId) return -1;
          if (bId === userId) return 1;
          return 0;
        });
        
        setUsers(sortedUsers);
      }
    } catch (error) {
      console.error('Error fetching users data:', error);
    } finally {
      setLoading(false);
      fetchInFlightRef.current = false;
      if (pendingFetchRef.current) {
        pendingFetchRef.current = false;
        fetchUsersData();
      }
    }
  }, [previousPurses, user]);

  useEffect(() => {
    fetchUsersData();
    
    // Set up socket connection for live updates
    const socket = io(API_ENDPOINTS);
    
    socket.on('bid_notification', (data) => {
      // Refresh when new bid is placed (purse decreases)
      fetchUsersData();
    });
    
    socket.on('bid_exit_notification', (data) => {
      // Refresh when someone exits (purse increases - refund)
      fetchUsersData();
    });

    socket.on('player_sold', (data) => {
      // Refresh when player is sold (purse changes for winner and others)
      fetchUsersData();
    });

    // Poll every 1.5 seconds for real-time purse updates
    const pollInterval = setInterval(() => {
      fetchUsersData();
    }, 1500);

    return () => {
      socket.disconnect();
      clearInterval(pollInterval);
    };
  }, []);

  // Get type color
  const getTypeColor = (type) => {
    switch (type) {
      case 'Sapphire': return '#4A90E2';
      case 'Gold': return '#FFD700';
      case 'Emerald': return '#50C878';
      case 'Silver': return '#C0C0C0';
      default: return '#666';
    }
  };

  const getPurseClass = (purse) => {
    const cr = Number(purse || 0) / 10000000;
    if (cr < 5) return 'purse-low';
    if (cr > 15) return 'purse-high';
    return 'purse-mid';
  };

  // Render user card
  const renderUserCard = (userData) => {
    const userId = user ? (user.id || user._id)?.toString() : null;
    const isMyUser = userData.userId.toString() === userId;
    const isUpdated = updatedUserIds.has(userData.userId.toString());
    
    return (
      <div key={userData.userId} className={`user-card ${isMyUser ? 'my-user' : ''} ${isUpdated ? 'updated-animation' : ''}`}>
        <div className="user-card-header">
          <div className="user-info">
            <h3 className="user-abbreviation">{userData.abbreviation || 'N/A'}</h3>
          </div>
          <div className={`purse-display ${getPurseClass(userData.purse)}`}>
            <span className="purse-label">Purse</span>
            <span className="purse-value">{formatCurrency(userData.purse)}</span>
          </div>
        </div>
        
        <div className="user-active-bids">
          <div className="bids-header">
            <span className="bids-count">Bids: {userData.activeBids.length}</span>
          </div>

          {userData.activeBids.length === 0 ? (
            <div className="no-active-bids">No active bids</div>
          ) : (
            <>
              {(() => {
                const winningBids = userData.activeBids.filter((bid) => bid.isWinning);
                const losingBids = userData.activeBids.filter((bid) => !bid.isWinning);

                const renderBidList = (bids) => (
                  <div className="bids-list">
                    {bids.map((bid, index) => (
                      <div key={`${bid.playerId}-${index}`} className={`bid-item ${bid.isWinning ? 'winning' : ''} ${bid.isLosing ? 'losing' : ''}`}>
                        <div className="bid-player-info">
                          <span className="bid-player-name">{bid.playerName}</span>
                          <span className="bid-player-type" style={{ backgroundColor: getTypeColor(bid.playerType) }}>
                            {bid.playerType.charAt(0)}
                          </span>
                    {/* Only show 1st/2nd bidder when it's a counter bid (no exit). Once someone exits, don't show. */}
                    {bid.otherBidderName && !bid.lastExitUser && (
                      <span className="counter-bid-badge">
                        {bid.isWinning ? "2nd: " : "1st: "}
                        {bid.otherBidderName}
                      </span>
                    )}
                        </div>
                        <div className="bid-amount-display">
                          <span className={`bid-amount-circle ${bid.isWinning ? 'winning-circle' : ''} ${bid.isLosing ? 'losing-circle' : ''}`}>
                            {formatCurrency(bid.bidAmount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                );

                return (
                  <>
                    {winningBids.length > 0 && (
                      <div className="bids-group">
                        <div className="bids-subheader winning">Winning</div>
                        {renderBidList(winningBids)}
                      </div>
                    )}
                    {losingBids.length > 0 && (
                      <div className="bids-group">
                        <div className="bids-subheader losing">Losing</div>
                        {renderBidList(losingBids)}
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="live-dashboard-loading">
        <div className="spinner"></div>
        <p>Loading live dashboard...</p>
      </div>
    );
  }

  const myUser = users.find(u => u.userId.toString() === (user ? (user.id || user._id)?.toString() : null));
  const otherUsers = users.filter(u => u.userId.toString() !== (user ? (user.id || user._id)?.toString() : null));

  return (
    <div className="live-bidding-dashboard">
      <div className="dashboard-header-fixed">
        <div className="header-left">
          <h1>🏏 Live Bidding Dashboard</h1>
          <div className="stats">
            <span className="stat-item">
              <span className="stat-label">Total Users:</span>
              <span className="stat-value">{users.length}</span>
            </span>
            <span className="stat-item">
              <span className="stat-label">Total Active Bids:</span>
              <span className="stat-value">{users.reduce((sum, u) => sum + u.activeBids.length, 0)}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-content-no-scroll">
        {users.length === 0 ? (
          <div className="no-bids">
            <p>No users found</p>
          </div>
        ) : (
          <div className="users-grid">
            {/* My User First */}
            {myUser && renderUserCard(myUser)}
            
            {/* Other Users */}
            {otherUsers.map(userData => renderUserCard(userData))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveBiddingDashboard;
