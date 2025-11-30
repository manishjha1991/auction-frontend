import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { API_ENDPOINTS } from '../const';
import '../css/LiveBiddingDashboard.css';

const LiveBiddingDashboard = () => {
  const [allBids, setAllBids] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newBidIds, setNewBidIds] = useState(new Set());
  const [counterBidIds, setCounterBidIds] = useState(new Set());
  const [previousBidCounts, setPreviousBidCounts] = useState(new Map());
  const user = JSON.parse(localStorage.getItem('user'));

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

  // Fetch active bids
  const fetchActiveBids = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS}/api/bids/live-dashboard`);
      if (response.ok) {
        const data = await response.json();
        const bids = data.activeBids || [];
        
        // Detect new/updated bids for animation
        const currentBidCounts = new Map();
        const newIds = new Set();
        const counterBidIds = new Set();
        
        bids.forEach(bid => {
          const playerId = bid.playerId.toString();
          const currentBidAmount = bid.highestBid?.bidAmount || 0;
          const previousBid = previousBidCounts.get(playerId);
          
          if (previousBid && previousBid !== currentBidAmount) {
            // Bid amount changed - this is a counter bid!
            counterBidIds.add(playerId);
          } else if (!previousBid && currentBidAmount > 0) {
            // New player in bidding (first bid)
            newIds.add(playerId);
          }
          
          currentBidCounts.set(playerId, currentBidAmount);
        });
        
        // Update new bid IDs for animation
        if (newIds.size > 0) {
          setNewBidIds(newIds);
          // Clear animation after 2 seconds
          setTimeout(() => {
            setNewBidIds(new Set());
          }, 2000);
        }
        
        // Update counter bid IDs for animation
        if (counterBidIds.size > 0) {
          setCounterBidIds(counterBidIds);
          // Clear animation after 1.5 seconds
          setTimeout(() => {
            setCounterBidIds(new Set());
          }, 1500);
        }
        
        setPreviousBidCounts(currentBidCounts);
        setAllBids(bids);
        
        // Filter my bids
        if (user && (user.id || user._id)) {
          const userId = (user.id || user._id).toString();
          const myBidding = bids.filter(bid => {
            const highestBidderId = bid.highestBid?.bidder?._id?.toString();
            const secondBidderId = bid.secondBid?.bidder?._id?.toString();
            return highestBidderId === userId || secondBidderId === userId;
          });
          setMyBids(myBidding);
        }
      }
    } catch (error) {
      console.error('Error fetching active bids:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveBids();
    
    // Set up socket connection for live updates
    const socket = io(API_ENDPOINTS);
    
    socket.on('bid_notification', (data) => {
      // Refresh bids when new bid is placed
      fetchActiveBids();
    });
    
    socket.on('bid_exit_notification', (data) => {
      // Refresh bids when someone exits
      fetchActiveBids();
    });

    // Poll every 2 seconds as backup
    const pollInterval = setInterval(() => {
      fetchActiveBids();
    }, 2000);

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

  // Render compact bid card for 300+ players
  const renderBidCard = (bid, isMyBid = false) => {
    const userId = user ? (user.id || user._id)?.toString() : null;
    const isHighest = bid.highestBid?.bidder?._id?.toString() === userId;
    const isSecond = bid.secondBid?.bidder?._id?.toString() === userId;
    const isNewBid = newBidIds.has(bid.playerId.toString());
    const isCounterBid = counterBidIds.has(bid.playerId.toString());
    
    return (
      <div key={bid.playerId} className={`compact-bid-card ${isMyBid ? 'my-bid' : ''} ${isHighest ? 'highest' : ''} ${isSecond ? 'second' : ''} ${isNewBid ? 'new-bid-animation' : ''} ${isCounterBid ? 'counter-bid-animation' : ''}`}>
        <div className="compact-player-info">
          <div className="compact-player-name-row">
            <span className="compact-player-name">{bid.playerName}</span>
            <span className="compact-type-badge" style={{ backgroundColor: getTypeColor(bid.playerType) }}>
              {bid.playerType.charAt(0)}
            </span>
          </div>
          <div className="compact-meta-row">
            <span className="compact-role">{bid.playerRole}</span>
            <span className="compact-base">Base: {formatCurrency(bid.basePrice)}</span>
          </div>
        </div>
        
        <div className="compact-bidders-row">
          {/* Highest Bidder */}
          {bid.highestBid && (
            <div className={`compact-bidder highest ${isHighest ? 'my-bid' : ''}`}>
              <span className="compact-arrow up">↑</span>
              <div className="compact-bidder-info">
                <span className="compact-bidder-name">{bid.highestBid.bidder?.name || 'Unknown'}</span>
                <span className="compact-bid-amount">{formatCurrency(bid.highestBid.bidAmount)}</span>
              </div>
            </div>
          )}
          
          {/* Second Bidder */}
          {bid.secondBid ? (
            <div className={`compact-bidder second ${isSecond ? 'my-bid' : ''}`}>
              <span className="compact-arrow down">↓</span>
              <div className="compact-bidder-info">
                <span className="compact-bidder-name">{bid.secondBid.bidder?.name || 'Unknown'}</span>
                <span className="compact-bid-amount">{formatCurrency(bid.secondBid.bidAmount)}</span>
              </div>
            </div>
          ) : (
            <div className="compact-bidder waiting">
              <span className="compact-waiting">Waiting...</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="live-dashboard-loading">
        <div className="spinner"></div>
        <p>Loading live bids...</p>
      </div>
    );
  }

  return (
    <div className="live-bidding-dashboard">
      {/* Fixed Header with My Bidding */}
      <div className="dashboard-header-fixed">
        <div className="header-left">
          <h1>🏏 Live Bidding Dashboard</h1>
          <div className="stats">
            <span className="stat-item">
              <span className="stat-label">Total:</span>
              <span className="stat-value">{allBids.length}</span>
            </span>
            <span className="stat-item">
              <span className="stat-label">My Bids:</span>
              <span className="stat-value my-bids-count">{myBids.length}</span>
            </span>
          </div>
        </div>
        
        {/* My Bidding Horizontal Bar */}
        {myBids.length > 0 && (
          <div className="my-bids-horizontal-bar">
            <span className="my-bids-label">🎯 My Bidding:</span>
            <div className="my-bids-scroll">
              {myBids.map(bid => {
                const userId = user ? (user.id || user._id)?.toString() : null;
                const isHighest = bid.highestBid?.bidder?._id?.toString() === userId;
                const isSecond = bid.secondBid?.bidder?._id?.toString() === userId;
                return (
                  <div key={bid.playerId} className={`my-bid-chip ${isHighest ? 'highest' : ''} ${isSecond ? 'second' : ''}`}>
                    <span className="chip-player-name">{bid.playerName}</span>
                    <span className="chip-bid-amount">
                      {isHighest ? '↑' : '↓'} {formatCurrency(isHighest ? bid.highestBid?.bidAmount : bid.secondBid?.bidAmount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Grid - All Bids - No Scrolling */}
      <div className="dashboard-content-no-scroll">
        {allBids.length === 0 ? (
          <div className="no-bids">
            <p>No active bids at the moment</p>
          </div>
        ) : (
          <div className="bids-grid-no-scroll">
            {allBids.map(bid => renderBidCard(bid, false))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveBiddingDashboard;

