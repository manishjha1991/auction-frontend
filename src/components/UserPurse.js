import React, { useEffect, useState } from "react";
import "../css/UserPurse.css"; // Custom CSS file
import { API_ENDPOINTS } from "../const";
import { FaWallet } from "react-icons/fa"; // Import Wallet Icon
import LoadingCube from "./CricketAnimation"; // Import the reusable component
import NotificationBell from './NotificationBell';

const UserPursePage = () => {
  const [usersData, setUsersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState(null);
  const [biddingStatuses, setBiddingStatuses] = useState({});
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Get current user from localStorage
    const user = JSON.parse(localStorage.getItem("user"));
    setCurrentUser(user);
  }, []);

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
        return "linear-gradient(135deg, #ffffff, #e0e0e0)";
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

  return (
    <div className="user-purse-page">
       {/* Include the NotificationBell component */}
       <NotificationBell />
      <div className="page-header" style={{ textAlign: "center", marginTop: "20px" }}>
        <FaWallet
          style={{
            fontSize: "50px", // Make it bigger
            color: "#16a085", // Cool greenish color
            textShadow: "0px 4px 6px rgba(0, 0, 0, 0.3)", // Subtle shadow
            animation: "pop-in 0.5s ease-out", // Animation
          }}
        />
        {/* Removed refresh button */}
      </div>
      <div className="user-cards-container">
        {usersData.map((user, index) => (
          <div key={index} className="user-card">
            <h2 className="user-name">{user.userName}</h2>
            <div className="purse-value-container">
              <div className={`purse-circle ${
                (user.purseValue / 10000000) < 5 ? 'low-purse' : 
                (user.purseValue / 10000000) > 30 ? 'high-purse' : ''
              }`}>
                <span className="purse-amount">₹{(user.purseValue / 10000000).toFixed(2)}</span>
                <span className="purse-unit">Cr</span>
              </div>
            </div>
            <div className="players-container">
              {user.players
                .filter((player) => !player.isBidOn)
                .map((player, idx) => (
                  <div
                    key={idx}
                    className="player-card sold"
                    style={{
                      background: getPlayerColor(player.type),
                    }}
                  >
                    <h3 className="player-name">{player.name}</h3>
                    <div className="player-value-container">
                      <div className="player-price-circle sold-price">
                        <span className="price-amount">₹{(player.boughtValue / 10000000).toFixed(2)}</span>
                        <span className="price-unit">Cr</span>
                      </div>
                    </div>
                  </div>
                ))}

              {user.players.some((player) => player.isBidOn) && <hr className="divider" />}

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
                      className="player-card bidding"
                      style={{
                        animation: "blink 1s infinite",
                        background: getPlayerColor(player.type), // Ensure the player type matches the expected type
                      }}
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
                          {displayInfo.text}
                        </div>
                      )}
                    </div>
                  );
                })}

            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserPursePage;
