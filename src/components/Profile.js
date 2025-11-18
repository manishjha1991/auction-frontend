import React, { useState, useEffect } from 'react';
import '../css/Profile.css';
import { API_ENDPOINTS } from "../const";
import LoadingCube from "./CricketAnimation";
import NotificationBell from './NotificationBell';
import TeamStrengthChart from './TeamStrengthChart';
import AdminControlPanel from './AdminControlPanel';
const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminProfileUser, setAdminProfileUser] = useState(null);

  // Confirmation popups
  const [showConfirmSell, setShowConfirmSell] = useState(false);
  const [showConfirmRemoveSecond, setShowConfirmRemoveSecond] = useState(false);

  // NEW STATE for multi-sell
  const [showMultiSell, setShowMultiSell] = useState(false);        // controls the multi-sell popup
  const [activeBidPlayers, setActiveBidPlayers] = useState([]);       // players with ongoing bids
  const [selectedPlayers, setSelectedPlayers] = useState([]);         // IDs of players selected for multi-sell
  const [showMultiSellConfirm, setShowMultiSellConfirm] = useState(false);

  // NEW: State for search inside the multi-sell popup
  const [multiSellSearch, setMultiSellSearch] = useState('');

  // Retain player states
  const [showRetainConfirm, setShowRetainConfirm] = useState(false);
  const [selectedPlayerForRetain, setSelectedPlayerForRetain] = useState(null);
  const [retainedPlayers, setRetainedPlayers] = useState([]);
  const [loadingRetained, setLoadingRetained] = useState(false);
  const [retentionEnabled, setRetentionEnabled] = useState(true);
  const [isRetentionLocked, setIsRetentionLocked] = useState(false);
  const [adminReleasedPlayers, setAdminReleasedPlayers] = useState(false);
  const [releasedTeams, setReleasedTeams] = useState([]);
  const [allPlayersReleased, setAllPlayersReleased] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [selectedRetainedForWithdraw, setSelectedRetainedForWithdraw] = useState(null);
  


  // Check localStorage for user.isAdmin
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      setIsAdmin(user?.isAdmin === true);
      setAdminProfileUser(user);
    } catch (err) {
      console.error('Failed to parse user from storage', err);
      setIsAdmin(false);
    }
  }, []);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem('user'));
        const userId = user?.id;
        if (!userId) {
          throw new Error('User ID not found in local storage.');
        }
        const response = await fetch(`${API_ENDPOINTS}/api/users/${userId}/details`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched user data from API:', data);
        console.log('User timezone from API:', data.user.timezone);
        console.log('User isRetentionLocked from API:', data.user.isRetentionLocked);
        setUserData(data);
        setEditData({
          name: data.user.name,
          teamName: data.user.teamName,
          timezone: data.user.timezone || 'Asia/Kolkata',
          streamLink: data.user.streamLink || '',
          abbreviation: data.user.abbreviation || '',
        });
        
        // Set retention lock status from initial data
        console.log('Setting initial retention lock status:', data.user.isRetentionLocked);
        setIsRetentionLocked(data.user.isRetentionLocked === true);
        
        // Set allPlayersReleased status from initial data
        setAllPlayersReleased(data.user.allPlayersReleased === true);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setError('Failed to load profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);


  // Fetch retained players and check retention setting
  useEffect(() => {
    const fetchRetainedPlayers = async () => {
      try {
        setLoadingRetained(true);
        const user = JSON.parse(localStorage.getItem('user'));
        const userId = user?.id;
        if (!userId) return;

        const response = await fetch(`${API_ENDPOINTS}/api/retained-players/user/${userId}`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          const data = await response.json();
          setRetainedPlayers(data);
        }
      } catch (err) {
        console.error('Failed to fetch retained players:', err);
      } finally {
        setLoadingRetained(false);
      }
    };

    const fetchRetentionSetting = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS}/api/settings`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          const data = await response.json();
          setRetentionEnabled(data.enablePlayerRetention !== false);
        }
      } catch (err) {
        console.error('Failed to fetch retention setting:', err);
      }
    };

    fetchRetainedPlayers();
    fetchRetentionSetting();
  }, []);

  // Check if team is locked - removed duplicate check, using initial data fetch instead

  // Listen for lock status changes (when admin locks/unlocks)
  useEffect(() => {
    const handleLockStatusChange = () => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        setIsRetentionLocked(user.isRetentionLocked === true);
      }
    };

    // Listen for custom events
    window.addEventListener('lock-status-changed', handleLockStatusChange);
    
    // Periodic check for lock status changes (every 30 seconds)
    const interval = setInterval(async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
          const response = await fetch(`${API_ENDPOINTS}/api/users/${user.id}/details`, {
            headers: { 'Content-Type': 'application/json' },
          });
          if (response.ok) {
            const userData = await response.json();
            if (userData.user.isRetentionLocked !== isRetentionLocked) {
              setIsRetentionLocked(userData.user.isRetentionLocked === true);
              const updatedUser = { ...user, isRetentionLocked: userData.user.isRetentionLocked };
              localStorage.setItem('user', JSON.stringify(updatedUser));
            }
            if (userData.user.allPlayersReleased !== allPlayersReleased) {
              setAllPlayersReleased(userData.user.allPlayersReleased === true);
            }
          }
        }
      } catch (err) {
        console.error('Failed to check lock status:', err);
      }
    }, 30000); // Check every 30 seconds
    
    return () => {
      window.removeEventListener('lock-status-changed', handleLockStatusChange);
      clearInterval(interval);
    };
  }, []);


  // Single-bid sale API
  const handleSingleBidSale = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS}/api/bids/sold/single-bid`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const result = await response.json();
      console.log("Single-bid sale result:", result);
    } catch (err) {
      console.error('Failed to finalize single-bid sale:', err);
      setError('Failed to finalize single-bid sale. Please try again later.');
    }
  };

  const handleConfirmSell = () => {
    setShowConfirmSell(false);
    handleSingleBidSale();
  };

  // Remove second-highest bidders
  const handleRemoveAllSecondHighest = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS}/api/bids/exit-second-highest/all`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const result = await response.json();
      console.log("Remove second-highest result:", result);
    } catch (err) {
      console.error('Failed to remove second-highest bidders:', err);
      setError('Failed to remove second-highest bidders. Please try again later.');
    }
  };

  const handleConfirmRemoveSecond = () => {
    setShowConfirmRemoveSecond(false);
    handleRemoveAllSecondHighest();
  };

  // Multi-sell logic using all players data
  const handleOpenMultiSell = async () => {
    try {
      // Show the multi-sell popup
      setShowMultiSell(true);
      // Reset the search field whenever popup is opened
      setMultiSellSearch('');
      // Fetch all players from the data endpoint
      const resp = await fetch(`${API_ENDPOINTS}/api/players/data`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!resp.ok) {
        throw new Error('Could not fetch players');
      }
      const players = await resp.json();
      
      // Filter players with active bids:
      // They are not sold and have a valid currentBidder (not "N/A")
      const activePlayers = players.filter(player => 
        player.status !== "Sold" &&
        player.currentBidder &&
        player.currentBidder !== "N/A"
      );
      setActiveBidPlayers(activePlayers);
      setSelectedPlayers([]); // Reset any previous selection
    } catch (err) {
      console.error('Failed to fetch active bid players:', err);
      setError('Failed to load players for multi-sell. Please try again later.');
    }
  };

  const handleSelectPlayer = (playerId) => {
    // Toggle player selection using a functional update
    setSelectedPlayers(prevSelected => {
      if (prevSelected.includes(playerId)) {
        return prevSelected.filter(id => id !== playerId);
      } else {
        return [...prevSelected, playerId];
      }
    });
  };

  const handleMultiSell = async () => {
    // Show confirmation popup before finalizing
    setShowMultiSellConfirm(true);
  };

  const handleConfirmMultiSell = async () => {
    try {
      setShowMultiSellConfirm(false);
      // Call the multi-sell API with the selected player IDs
      const resp = await fetch(`${API_ENDPOINTS}/api/bids/bid/sold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerIDs: selectedPlayers })
      });
      if (!resp.ok) {
        throw new Error(`HTTP error! Status: ${resp.status}`);
      }
      const result = await resp.json();
      console.log('Multi-sell result:', result);
      setShowMultiSell(false);
    } catch (err) {
      console.error('Failed to multi-sell players:', err);
      setError('Failed to multi-sell players. Please try again.');
    }
  };

  const handleCancelMultiSell = () => {
    setShowMultiSellConfirm(false);
  };

  // Retain player functionality
  const handleRetainPlayer = (player) => {
    // Check if user can retain more players
    if (retainedPlayers.length >= 4) {
      setError('You can only retain a maximum of 4 players');
      return;
    }

    // Check if user already has a player from this category
    const existingCategoryRetained = retainedPlayers.find(rp => rp.playerType === player.type);
    if (existingCategoryRetained) {
      setError(`You already have a ${player.type} player retained. You can only retain one player from each category.`);
      return;
    }

    setSelectedPlayerForRetain(player);
    setShowRetainConfirm(true);
  };

  const handleConfirmRetain = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user?.id;
      
      const response = await fetch(`${API_ENDPOINTS}/api/retained-players/retain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          playerId: selectedPlayerForRetain.player._id
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Player retained successfully:', result);
        
        // Refresh retained players list
        const retainedResponse = await fetch(`${API_ENDPOINTS}/api/retained-players/user/${userId}`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (retainedResponse.ok) {
          const retainedData = await retainedResponse.json();
          setRetainedPlayers(retainedData);
        }
        
        // Note: Purse will be updated when admin releases all other players
        // No need to refresh user data now
        
        setShowRetainConfirm(false);
        setSelectedPlayerForRetain(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to retain player');
      }
    } catch (err) {
      console.error('Failed to retain player:', err);
      setError('Failed to retain player. Please try again.');
    }
  };

  const handleCancelRetain = () => {
    setShowRetainConfirm(false);
    setSelectedPlayerForRetain(null);
  };


  // Remove from retention functionality (simple - no admin approval needed)
  const handleWithdrawRetention = (retained) => {
    // Check if retention is locked
    if (isRetentionLocked) {
      setError('Your team retention is locked by admin. You cannot remove retained players.');
      return;
    }

    // Check if admin has released players
    if (adminReleasedPlayers) {
      setError('Cannot remove retained players after admin has released all other players. This action is no longer available.');
      return;
    }

    // Check if retention is enabled
    if (!retentionEnabled) {
      setError('Player retention feature is currently disabled.');
      return;
    }

    // Only proceed if all conditions are met
    if (!isRetentionLocked && !allPlayersReleased && retentionEnabled) {
      setSelectedRetainedForWithdraw(retained);
      setShowWithdrawConfirm(true);
    }
  };

  const handleConfirmWithdraw = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user?.id;
      
      // Use the simple undo API to remove from retention
      const response = await fetch(`${API_ENDPOINTS}/api/retained-players/undo/${selectedRetainedForWithdraw._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        console.log('Player removed from retention successfully');
        
        // Refresh retained players list
        const retainedResponse = await fetch(`${API_ENDPOINTS}/api/retained-players/user/${userId}`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (retainedResponse.ok) {
          const retainedData = await retainedResponse.json();
          setRetainedPlayers(retainedData);
        }
        
        setShowWithdrawConfirm(false);
        setSelectedRetainedForWithdraw(null);
        setError('Player removed from retention successfully. You can now retain another player.');
        
        // Auto-refresh the page after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to remove player from retention');
      }
    } catch (err) {
      console.error('Failed to remove player from retention:', err);
      setError('Failed to remove player from retention. Please try again.');
    }
  };

  const handleCancelWithdraw = () => {
    setShowWithdrawConfirm(false);
    setSelectedRetainedForWithdraw(null);
  };

  // Format amounts nicely
  const formatAmount = (amount) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Crore`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} Lakh`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(2)} Thousand`;
    return `₹${amount}`;
  };

  // Input handlers
  const handleSearchChange = (e) => setSearchTerm(e.target.value.toLowerCase());
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    console.log('Edit change:', name, value);
    setEditData({ ...editData, [name]: value });
  };
  const handleImageChange = (e) => {
    setEditData({ ...editData, image: e.target.files[0] });
  };

  const handleSave = async () => {
    try {
      console.log('Saving profile with data:', editData);
      const formData = new FormData();
      formData.append('name', editData.name);
      formData.append('teamName', editData.teamName);
      formData.append('timezone', editData.timezone);
      formData.append('streamLink', editData.streamLink || '');
      formData.append('abbreviation', editData.abbreviation || '');
      if (editData.image) {
        formData.append('teamImage', editData.image);
      }
      
      // Debug: Log FormData contents
      for (let [key, value] of formData.entries()) {
        console.log('FormData:', key, value);
      }
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user?.id;
      const response = await fetch(`${API_ENDPOINTS}/api/users/${userId}`, {
        method: 'PUT',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const updatedUser = await response.json();
      console.log('Updated user data:', updatedUser);
      
      // Update the userData state with the new timezone
      setUserData(prev => ({
        ...prev,
        user: {
          ...prev.user,
          ...updatedUser.user
        }
      }));
      
      // Also update editData to reflect the new timezone and streamLink
      setEditData(prev => ({
        ...prev,
        timezone: updatedUser.user.timezone,
        streamLink: updatedUser.user.streamLink,
        abbreviation: updatedUser.user.abbreviation
      }));
      
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to update profile. Please try again later.');
    }
  };

  if (isAdmin) {
    return (
      <div className="admin-profile-container">
        <NotificationBell />
        <AdminControlPanel adminUser={adminProfileUser || userData?.user} />
      </div>
    );
  }

  if (loading) {
    return <LoadingCube animationFile="Profile.json" />;
  }
  if (error) {
    return <div className="error">{error}</div>;
  }
  if (!userData) {
    return null;
  }

  // --- ADMIN VIEW ---
  if (isAdmin) {
    // Filter the active bid players based on the search query in the multi-sell popup
    const filteredActiveBidPlayers = activeBidPlayers.filter(p =>
      p.name.toLowerCase().includes(multiSellSearch.toLowerCase())
    );

    return (
      <div className="admin-container">
        <h2 className="admin-title">👑 Admin Panel</h2>
        <p className="admin-subtitle">
          Manage user accounts, timezones, and stream links.
        </p>

        {/* User Management Section */}
        <div style={{ marginTop: '20px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '15px',
            padding: '20px',
            color: 'white',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.5rem' }}>👥 User Management</h3>
            <p style={{ margin: '0 0 15px 0', opacity: 0.9 }}>
              Manage user timezones, stream links, and account settings.
            </p>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <button
              onClick={() => window.location.href = '/admin/user-management'}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '10px',
                padding: '12px 24px',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
                🚀 User Management
              </button>
              <button
                onClick={() => window.location.href = '/admin/retained-players'}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '10px',
                  padding: '12px 24px',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                💎 Retained Players
            </button>
            </div>
          </div>
        </div>

        {/* Existing SELL Single-Bid Confirmation */}
        {showConfirmSell && (
          <div className="confirm-overlay">
            <div className="confirm-popup">
              <h2>Are You Absolutely Sure?!</h2>
              <p>
                This will <strong>sell all players</strong> with exactly one bid.<br/>
                We hope your fellow owners won't mind...<br/>
                Once you do this, there's no going back!
              </p>
              <div className="popup-buttons">
                <button className="confirm-button" onClick={handleConfirmSell}>
                  Yes, let's do this!
                </button>
                <button className="cancel-button" onClick={() => setShowConfirmSell(false)}>
                  Hmm, better not...
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Existing Remove 2nd Highest Confirmation */}
        {showConfirmRemoveSecond && (
          <div className="confirm-overlay">
            <div className="confirm-popup">
              <h2>Double Check, My Lord!</h2>
              <p>
                This will <strong>remove every second-highest bidder</strong> from active bids.<br/>
                Brace yourself—some people might get upset!<br/>
                Proceed only if you can handle the drama...
              </p>
              <div className="popup-buttons">
                <button className="confirm-button" onClick={handleConfirmRemoveSecond}>
                  Do it. I'm ready!
                </button>
                <button className="cancel-button" onClick={() => setShowConfirmRemoveSecond(false)}>
                  Actually, nevermind...
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NEW: Multi-Sell Popup with Search Bar */}
        {showMultiSell && (
          <div className="confirm-overlay">
            <div className="confirm-popup" style={{ width: '500px', maxWidth: '90%' }}>
              <h2>Pick your players to sell!</h2>
              <p style={{ marginBottom: '15px' }}>
                Select any players who currently have active bids. Then click <b>Multi-Sell</b>.
              </p>
              {/* Super Cool Sexy Search Bar */}
              <div style={{ marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder="Search bidding players..."
                  value={multiSellSearch}
                  onChange={(e) => setMultiSellSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc'
                  }}
                />
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
                {filteredActiveBidPlayers.map((p) => (
                  <label key={p.id} style={{ display: 'block', marginBottom: '8px' }}>
                    <input
                      type="checkbox"
                      checked={selectedPlayers.includes(p.id)}
                      onChange={() => handleSelectPlayer(p.id)}
                      style={{ marginRight: '8px' }}
                    />
                    {p.name} ({p.type})
                  </label>
                ))}
              </div>
              <div className="popup-buttons" style={{ marginTop: '15px' }}>
                <button className="confirm-button" onClick={handleMultiSell}>
                  Multi-Sell
                </button>
                <button className="cancel-button" onClick={() => setShowMultiSell(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NEW: Comedic confirmation for the multi-sell */}
        {showMultiSellConfirm && (
          <div className="confirm-overlay">
            <div className="confirm-popup">
              <h2>Are you TOTALLY sure?!</h2>
              <p>
                You're about to <b>mass-sell</b> multiple players. 
                <br />Some might cry, some might rejoice. 
                <br />This can't be undone!
              </p>
              <div className="popup-buttons">
                <button className="confirm-button" onClick={handleConfirmMultiSell}>
                  Yes, do it!
                </button>
                <button className="cancel-button" onClick={handleCancelMultiSell}>
                  Wait, no!!
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // --- NON-ADMIN (REGULAR) VIEW ---
  const filteredSoldPlayers = userData.soldPlayers?.filter(({ player }) =>
    player.name.toLowerCase().includes(searchTerm)
  );
  const filteredActiveBids = userData.activeBids?.filter(({ player }) =>
    player.name.toLowerCase().includes(searchTerm)
  );

  let lastFiveMatches = userData.lastFiveMatches || [];
  if (lastFiveMatches.length < 5) {
    while (lastFiveMatches.length < 5) {
      lastFiveMatches.push({
        score: "NA",
        fairness: "NA",
        result: "NA",
      });
    }
  }

  // Debug: Log the current state
  console.log('Profile render - isRetentionLocked:', isRetentionLocked, 'type:', typeof isRetentionLocked);
  
  // Function to refresh lock status from backend
  const refreshLockStatus = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        const response = await fetch(`${API_ENDPOINTS}/api/users/${user.id}/details`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          const userData = await response.json();
          console.log('Refreshing lock status from backend:', userData.user.isRetentionLocked);
          setIsRetentionLocked(userData.user.isRetentionLocked === true);
          setAllPlayersReleased(userData.user.allPlayersReleased === true);
          // Update localStorage with fresh data
          const updatedUser = { ...user, isRetentionLocked: userData.user.isRetentionLocked, allPlayersReleased: userData.user.allPlayersReleased };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
    } catch (err) {
      console.error('Failed to refresh lock status:', err);
    }
  };

  // Temporary test button - remove this later
  const toggleLockStatus = () => {
    console.log('Toggling lock status from', isRetentionLocked, 'to', !isRetentionLocked);
    setIsRetentionLocked(!isRetentionLocked);
  };
  
  // If retention is locked, show only lock message
  if (isRetentionLocked === true) {
    return (
      <div className="profile-container">
        <div style={{
          background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
          borderRadius: '20px',
          padding: '40px',
          margin: '20px auto',
          color: 'white',
          textAlign: 'center',
          border: '3px solid #dc3545',
          boxShadow: '0 8px 30px rgba(220, 53, 69, 0.4)',
          maxWidth: '600px'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔒</div>
          <h1 style={{ margin: '0 0 15px 0', fontSize: '2.5rem', fontWeight: 'bold' }}>
            PROFILE LOCKED
          </h1>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5rem', opacity: 0.9 }}>
            Your team retention has been locked by admin
          </h2>
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '15px',
            padding: '25px',
            fontSize: '1.1rem',
            fontWeight: '600',
            margin: '20px 0'
          }}>
            <div style={{ marginBottom: '15px' }}>❌ Cannot access profile features</div>
            <div style={{ marginBottom: '15px' }}>❌ Cannot retain players</div>
            <div style={{ marginBottom: '15px' }}>❌ Cannot undo retained players</div>
            <div>🔒 All profile functionality is disabled</div>
          </div>
          <p style={{ margin: '20px 0 0 0', fontSize: '1rem', opacity: 0.8 }}>
            Contact admin to unlock your profile
          </p>
          
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Include the NotificationBell component */}
      <NotificationBell />
      
      {/* Retention Locked Floating Notification */}
      {isRetentionLocked && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                color: 'white',
          padding: '15px 20px',
          borderRadius: '12px',
          boxShadow: '0 8px 25px rgba(220, 53, 69, 0.4)',
          zIndex: 1000,
          border: '2px solid rgba(255, 255, 255, 0.2)',
          animation: 'slideInRight 0.5s ease-out',
          maxWidth: '300px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '1.5rem' }}>🔒</div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                Retention Locked
              </div>
              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                Contact admin to unlock
              </div>
            </div>
          </div>
        </div>
      )}
      
      
      <header className="profile-header">
        <div className="user-info">
          <img
            src={
              userData.user.image
                ? `${API_ENDPOINTS}${userData.user.image}`
                : 'https://via.placeholder.com/100'
            }
            alt="User"
            className="profile-image"
          />
          <div>
            <h2>{userData.user.name}</h2>
            <p>
              Total Purse Remaining:{' '}
              <span className="purse-amount">
                {formatAmount(parseFloat(userData.user.purse?.["$numberDecimal"] || userData.user.purse || 0))}
              </span>
            </p>
          </div>
        </div>
        <div className="additional-info">
          <p><strong>Team Name:</strong> {userData.user.teamName}</p>
          <p><strong>Email:</strong> {userData.user.email}</p>
          
          {/* Retention Status Indicator */}
          <div style={{
            background: isRetentionLocked 
              ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)' 
              : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
            borderRadius: '10px',
            padding: '8px 15px',
            marginTop: '10px',
            textAlign: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            boxShadow: isRetentionLocked 
              ? '0 4px 15px rgba(220, 53, 69, 0.3)' 
              : '0 4px 15px rgba(40, 167, 69, 0.3)'
          }}>
            {isRetentionLocked ? '🔒 Retention Locked' : '✅ Retention Active'}
          </div>
          
          {/* Cool Timezone Display */}
          {userData && userData.user && (
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '15px',
            padding: '20px',
            margin: '20px 0',
            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%'
            }} />
            
            <div style={{
              position: 'relative',
              zIndex: 2,
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '24px',
                marginBottom: '10px',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
              }}>
                🌍
              </div>
              <div style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.8)',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '8px'
              }}>
                Your Timezone
              </div>
              <div style={{
                fontSize: '18px',
                color: '#ffffff',
                fontWeight: '700',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                marginBottom: '8px'
              }}>
                {(() => {
                  if (!userData || !userData.user) {
                    console.log('UserData not loaded yet');
                    return 'Loading...';
                  }
                  const timezone = userData.user.timezone || 'Asia/Kolkata';
                  console.log('Displaying timezone:', timezone, 'from userData:', userData.user.timezone);
                  return timezone;
                })()}
              </div>
              <div style={{
                fontSize: '16px',
                color: 'rgba(255,255,255,0.9)',
                fontWeight: '500',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '8px 12px',
                display: 'inline-block',
                backdropFilter: 'blur(10px)'
              }}>
                {(() => {
                  if (!userData || !userData.user) {
                    return 'Loading...';
                  }
                  const timezone = userData.user.timezone || 'Asia/Kolkata';
                  return new Date().toLocaleString('en-US', { 
                    timeZone: timezone,
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  });
                })()}
              </div>
            </div>
          </div>
          )}
          
          <button className="edit-profile-button" onClick={() => setIsEditing(true)}>
            Edit Profile
          </button>
        </div>
      </header>

      {isEditing && (
        <div className="edit-popup">
          <div className="edit-popup-content">
            <h3>Edit Profile</h3>
            <form>
              <input
                type="text"
                name="name"
                value={editData.name}
                onChange={handleEditChange}
                placeholder="Name"
              />
              <input
                type="text"
                name="teamName"
                value={editData.teamName}
                onChange={handleEditChange}
                placeholder="Team Name"
              />
              <div className="timezone-selector">
                <label htmlFor="timezone">Timezone</label>
                <select
                  id="timezone"
                  name="timezone"
                  value={editData.timezone}
                  onChange={handleEditChange}
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (India)</option>
                  <option value="America/New_York">America/New_York (Eastern Time)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (Pacific Time)</option>
                  <option value="America/Chicago">America/Chicago (Central Time)</option>
                  <option value="America/Denver">America/Denver (Mountain Time)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Europe/Paris">Europe/Paris (CET)</option>
                  <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  <option value="Asia/Shanghai">Asia/Shanghai (CST)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                  <option value="Australia/Melbourne">Australia/Melbourne (AEST)</option>
                  <option value="Pacific/Auckland">Pacific/Auckland (NZST)</option>
                  <option value="America/Toronto">America/Toronto (Eastern Time)</option>
                  <option value="America/Vancouver">America/Vancouver (Pacific Time)</option>
                  <option value="Europe/Moscow">Europe/Moscow (MSK)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                  <option value="Asia/Bangkok">Asia/Bangkok (ICT)</option>
                  <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                  <option value="Asia/Manila">Asia/Manila (PST)</option>
                  <option value="Asia/Seoul">Asia/Seoul (KST)</option>
                  <option value="Asia/Hong_Kong">Asia/Hong_Kong (HKT)</option>
                  <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
                  <option value="Asia/Dhaka">Asia/Dhaka (BST)</option>
                  <option value="Asia/Colombo">Asia/Colombo (SLST)</option>
                  <option value="Africa/Cairo">Africa/Cairo (EET)</option>
                  <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                  <option value="America/Sao_Paulo">America/Sao_Paulo (BRT)</option>
                  <option value="America/Argentina/Buenos_Aires">America/Argentina/Buenos_Aires (ART)</option>
                  <option value="America/Mexico_City">America/Mexico_City (CST)</option>
                </select>
              </div>
              <div className="stream-link-input">
                <label htmlFor="streamLink">Stream Link (Optional)</label>
                <input
                  type="url"
                  id="streamLink"
                  name="streamLink"
                  value={editData.streamLink || ''}
                  onChange={handleEditChange}
                  placeholder="https://twitch.tv/yourchannel or https://youtube.com/yourchannel"
                />
              </div>
              <div className="abbreviation-input">
                <label htmlFor="abbreviation">Team Abbreviation (Optional)</label>
                <input
                  type="text"
                  id="abbreviation"
                  name="abbreviation"
                  value={editData.abbreviation || ''}
                  onChange={handleEditChange}
                  placeholder="e.g., CSK, MI, RCB (max 4 characters)"
                  maxLength="4"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              <div className="file-input">
                <label htmlFor="image">Upload New Image</label>
                <input
                  type="file"
                  id="image"
                  onChange={handleImageChange}
                />
              </div>
              <div className="popup-buttons">
                <button type="button" onClick={handleSave}>Save</button>
                <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by player name..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      <div className="profile-content">
        {/* Sold Players */}
        <div className="section">
          <h3>Sold Players</h3>
          
          {/* Admin Lock Banner for Sold Players - Show when retention is locked */}
          {isRetentionLocked && retentionEnabled && (
            <div style={{
              background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
              borderRadius: '15px',
              padding: '25px',
              marginBottom: '25px',
              color: 'white',
              textAlign: 'center',
              border: '3px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 6px 25px rgba(220, 53, 69, 0.4)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                width: '40px',
                height: '40px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem'
              }}>
                🔒
              </div>
              <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>🚫</div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '1.4rem', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
                RETENTION LOCKED BY ADMIN
              </h4>
              <p style={{ margin: '0', fontSize: '1rem', opacity: 0.95, fontWeight: '500' }}>
                You cannot retain any players at this time
              </p>
            </div>
          )}
          
          <div className="bought-players">
            {filteredSoldPlayers && filteredSoldPlayers.length > 0 ? (
              filteredSoldPlayers.map(({ player, bidValue }, idx) => {
                const isRetained = retainedPlayers.some(rp => rp.playerId._id === player._id);
                return (
                  <div 
                    className={`player-card ${player.type.toLowerCase()} ${isRetained ? 'retained' : ''}`} 
                    key={idx}
                    style={{
                      position: 'relative',
                      cursor: (() => {
                        if (isRetained) return 'default';
                        if (!retentionEnabled || isRetentionLocked || adminReleasedPlayers) return 'not-allowed';
                        const canRetainMore = retainedPlayers.length < 4;
                        const hasCategoryRetained = retainedPlayers.some(rp => rp.playerType === player.type);
                        return (canRetainMore && !hasCategoryRetained) ? 'pointer' : 'not-allowed';
                      })(),
                      transition: 'all 0.3s ease',
                      opacity: isRetained ? 0.7 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isRetained && !adminReleasedPlayers) {
                        const canRetainMore = retainedPlayers.length < 4;
                        const hasCategoryRetained = retainedPlayers.some(rp => rp.playerType === player.type);
                        
                        if (canRetainMore && !hasCategoryRetained) {
                          e.target.style.transform = 'translateY(-5px)';
                          e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                        }
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isRetained && !adminReleasedPlayers) {
                        const canRetainMore = retainedPlayers.length < 4;
                        const hasCategoryRetained = retainedPlayers.some(rp => rp.playerType === player.type);
                        
                        if (canRetainMore && !hasCategoryRetained) {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                        }
                      }
                    }}
                    onClick={() => {
                      if (!isRetained && retentionEnabled && !isRetentionLocked && !allPlayersReleased) {
                        const canRetainMore = retainedPlayers.length < 4;
                        const hasCategoryRetained = retainedPlayers.some(rp => rp.playerType === player.type);
                        
                        if (canRetainMore && !hasCategoryRetained) {
                          handleRetainPlayer({ player, bidValue });
                        }
                      }
                    }}
                  >
                    {isRetained && (
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'linear-gradient(135deg, #28a745, #20c997)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 8px rgba(40, 167, 69, 0.3)'
                      }}>
                        ✅ RETAINED
                      </div>
                    )}
                  <p><strong>Name:</strong> {player.name}</p>
                  <p><strong>Type:</strong> {player.type}</p>
                  <p><strong>Role:</strong> {player.role}</p>
                  <p><strong>Base Price:</strong> {formatAmount(player.basePrice)}</p>
                  <p><strong>Sold For:</strong> {formatAmount(bidValue)}</p>
                    {!isRetained && retentionEnabled && !isRetentionLocked && !allPlayersReleased && (() => {
                      // Check if user can retain more players
                      const canRetainMore = retainedPlayers.length < 4;
                      const hasCategoryRetained = retainedPlayers.some(rp => rp.playerType === player.type);
                      
                      if (!canRetainMore) {
                        return (
                          <div style={{
                            marginTop: '10px',
                            padding: '8px',
                            background: 'rgba(220, 53, 69, 0.1)',
                            borderRadius: '8px',
                            textAlign: 'center',
                            fontSize: '12px',
                            color: '#dc3545',
                            fontWeight: '600'
                          }}>
                            ❌ Max 4 players retained
                </div>
                        );
                      }
                      
                      if (hasCategoryRetained) {
                        return (
                          <div style={{
                            marginTop: '10px',
                            padding: '8px',
                            background: 'rgba(255, 193, 7, 0.1)',
                            borderRadius: '8px',
                            textAlign: 'center',
                            fontSize: '12px',
                            color: '#ffc107',
                            fontWeight: '600'
                          }}>
                            ⚠️ {player.type} already retained
                          </div>
                        );
                      }
                      
                      return (
                        <div style={{
                          marginTop: '10px',
                          padding: '8px',
                          background: 'rgba(102, 126, 234, 0.1)',
                          borderRadius: '8px',
                          textAlign: 'center',
                          fontSize: '12px',
                          color: '#667eea',
                          fontWeight: '600'
                        }}>
                          💎 Click to retain (₹17 Cr)
                        </div>
                      );
                    })()}
                    
                    {!isRetained && !retentionEnabled && (
                      <div style={{
                        marginTop: '10px',
                        padding: '8px',
                        background: 'rgba(108, 117, 125, 0.1)',
                        borderRadius: '8px',
                        textAlign: 'center',
                        fontSize: '12px',
                        color: '#6c757d',
                        fontWeight: '600'
                      }}>
                        🔒 Retention disabled by admin
                      </div>
                    )}

                    {!isRetained && retentionEnabled && isRetentionLocked && (
                      <div style={{
                        marginTop: '10px',
                        padding: '8px',
                        background: 'rgba(220, 53, 69, 0.1)',
                        borderRadius: '8px',
                        textAlign: 'center',
                        fontSize: '12px',
                        color: '#dc3545',
                        fontWeight: '600'
                      }}>
                        🔒 Team locked by admin
                      </div>
                    )}

                  </div>
                );
              })
            ) : (
              <p>No players found.</p>
            )}
          </div>
        </div>
 {/* Add the chart here for normal users based on sold players */}
 {!isAdmin && userData.soldPlayers && userData.soldPlayers.length > 0 && (
        <TeamStrengthChart players={userData.soldPlayers.map(item => item.player)} />
      )}
        {/* Active Bids */}
        <div className="section">
          <h3>Active Bids</h3>
          <div className="bids-section">
            {filteredActiveBids && filteredActiveBids.length > 0 ? (
              filteredActiveBids.map(({ player, bidAmount }, idx) => (
                <div className={`player-card ${player.type.toLowerCase()}`} key={idx}>
                  <p><strong>Name:</strong> {player.name}</p>
                  <p><strong>Role:</strong> {player.role}</p>
                  <p><strong>Bid Amount:</strong> {formatAmount(bidAmount)}</p>
                </div>
              ))
            ) : (
              <p>No active bids found.</p>
            )}
          </div>
        </div>

        {/* Past Bids */}
        <div className="section">
          <h3>Past Bids</h3>
          <div className="past-bids">
            {userData.pastBids.map(({ player, bidAmount, status }, idx) => (
              <div
                className={`past-bid-card ${status.toLowerCase()}`}
                style={{
                  border: status === "Won" ? "2px solid gold" : "1px solid #ccc",
                  backgroundColor: status === "Won" ? "#fffbea" : "transparent",
                  boxShadow: status === "Won" ? "0px 4px 8px rgba(255, 215, 0, 0.4)" : "none",
                  transition: "all 0.3s ease-in-out",
                }}
                key={idx}
              >
                <p><strong>Name:</strong> {player.name}</p>
                <p><strong>Your Bid:</strong> {formatAmount(bidAmount)}</p>
                <p><strong>Base Price:</strong> {formatAmount(player.basePrice)}</p>
                <p><strong>Status:</strong> {status}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Retained Players */}
        {retentionEnabled && (
          <div className="section">
            <h3>💎 Retained Players</h3>
            
            
            
            {/* Admin Lock Banner - Show when retention is locked */}
            {isRetentionLocked && (
              <div style={{
                background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                borderRadius: '20px',
                padding: '30px',
                marginBottom: '25px',
                color: 'white',
                textAlign: 'center',
                border: '3px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 30px rgba(220, 53, 69, 0.4)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  width: '60px',
                  height: '60px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>
                  🔒
                </div>
                <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>🚫</div>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '1.8rem', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                  RETENTION LOCKED BY ADMIN
                </h3>
                <p style={{ margin: '0 0 20px 0', fontSize: '1.1rem', opacity: 0.95, fontWeight: '500' }}>
                  Your team's retention functionality has been locked by admin
                </p>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '15px',
                  padding: '20px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <div style={{ marginBottom: '8px', fontSize: '1.1rem' }}>
                    🚫 Cannot retain new players
                  </div>
                  <div style={{ marginBottom: '8px', fontSize: '1.1rem' }}>
                    🚫 Cannot remove retained players
                  </div>
                  <div style={{ marginBottom: '8px', fontSize: '1.1rem' }}>
                    🚫 Cannot change retention in any way
                  </div>
                  <div style={{ fontSize: '1.1rem', color: '#ffeb3b' }}>
                    🔒 All retention functionality is locked
                  </div>
                </div>
                <p style={{ margin: '15px 0 0 0', fontSize: '1rem', opacity: 0.9, fontWeight: '500' }}>
                  Contact admin to unlock your retention functionality
                </p>
              </div>
            )}
            
            {/* Retention Rules Info - Only show when not locked */}
            {!isRetentionLocked && (
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '15px',
                padding: '20px',
                marginBottom: '20px',
                color: 'white',
                textAlign: 'center'
              }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '1.2rem' }}>
                  📋 Retention Rules
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '15px', fontSize: '0.9rem' }}>
                  <div>• Max 4 players</div>
                  <div>• One per category</div>
                  <div>• ₹17 Cr each</div>
                  <div>• {retainedPlayers.length}/4 retained</div>
                </div>
              </div>
            )}


            {/* Admin Released Players Banner - Show when all players are released */}
            {allPlayersReleased && !isRetentionLocked && (
              <div style={{
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                borderRadius: '15px',
                padding: '25px',
                marginBottom: '20px',
                color: 'white',
                textAlign: 'center',
                border: '2px solid #28a745',
                boxShadow: '0 4px 20px rgba(40, 167, 69, 0.3)'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '15px' }}>✅</div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '1.4rem', fontWeight: 'bold' }}>
                  ADMIN RELEASED PLAYERS
                </h4>
                <p style={{ margin: '0 0 15px 0', fontSize: '1rem', opacity: 0.9 }}>
                  Admin has released all players. Retention and undo options are now disabled.
                </p>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  padding: '15px',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  ✅ Players released by admin<br/>
                  ❌ Cannot retain new players<br/>
                  ❌ Cannot undo retained players<br/>
                  🔒 All retention functionality is disabled
                </div>
              </div>
            )}
            
            {/* Retained Players List */}
            <div className="bought-players">
              {loadingRetained ? (
                <p>Loading retained players...</p>
              ) : retainedPlayers && retainedPlayers.length > 0 ? (
                retainedPlayers.map((retained, idx) => (
                  <div 
                    className={`player-card ${retained.playerType.toLowerCase()} retained ${isRetentionLocked ? 'locked' : ''}`} 
                    key={idx}
                    style={isRetentionLocked ? {
                      opacity: 0.6,
                      filter: 'grayscale(0.3)',
                      pointerEvents: 'none',
                      position: 'relative'
                    } : {}}
                  >
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: isRetentionLocked 
                        ? 'linear-gradient(135deg, #6c757d, #495057)' 
                        : 'linear-gradient(135deg, #28a745, #20c997)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      boxShadow: isRetentionLocked 
                        ? '0 2px 8px rgba(108, 117, 125, 0.3)'
                        : '0 2px 8px rgba(40, 167, 69, 0.3)'
                    }}>
                      {isRetentionLocked ? '🔒 LOCKED' : '✅ RETAINED'}
                    </div>
                    
                    {/* Lock overlay when retention is locked */}
                    {isRetentionLocked && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.1)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10
                      }}>
                        <div style={{
                          background: 'rgba(220, 53, 69, 0.9)',
                          color: 'white',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          textAlign: 'center'
                        }}>
                          🔒 ADMIN LOCKED
                        </div>
                      </div>
                    )}
                    
                    <p><strong>Name:</strong> {retained.playerName}</p>
                    <p><strong>Type:</strong> {retained.playerType}</p>
                    <p><strong>Role:</strong> {retained.playerRole}</p>
                    <p><strong>Retention Value:</strong> {formatAmount(retained.retainedValue)}</p>
                    <p><strong>Retained On:</strong> {new Date(retained.retainedAt).toLocaleDateString()}</p>
                    
                    {/* Withdraw Button - Only show when not locked and all players not released */}
                    {(() => {
                      const shouldShowButton = !isRetentionLocked && !allPlayersReleased && retentionEnabled;
                      console.log('Remove from Retention button visibility:', {
                        isRetentionLocked,
                        allPlayersReleased,
                        retentionEnabled,
                        shouldShowButton
                      });
                      return shouldShowButton;
                    })() && (
                      <div style={{
                        marginTop: '15px',
                        textAlign: 'center'
                      }}>
                        <button
                          onClick={() => handleWithdrawRetention(retained)}
                          style={{
                            background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '10px 20px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 15px rgba(255, 107, 107, 0.3)';
                          }}
                        >
                          🚪 Remove from Retention
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p>No retained players yet. Click on any sold player to retain them!</p>
              )}
            </div>
          </div>
        )}

        {/* Last 5 Matches */}
        <div className="section">
          <h3>Your Last 5 Match Results</h3>
          <div className="bought-players" style={{ display: "grid", gap: "15px" }}>
            {lastFiveMatches.map((match, idx) => {
              const isWon = (match.result || "").toLowerCase() === "won";
              return (
                <div
                  key={idx}
                  className="past-bid-card"
                  style={{
                    border: isWon ? "2px solid gold" : "1px solid #ccc",
                    backgroundColor: isWon ? "#fffbea" : "transparent",
                    boxShadow: isWon ? "0px 4px 8px rgba(255, 215, 0, 0.4)" : "none",
                    transition: "all 0.3s ease-in-out",
                  }}
                >
                  <p><strong>🆚</strong> {match.opponentTeam}</p>
                  <p><strong>🏏</strong> {match.score}</p>
                  <p><strong>⚖️</strong> {match.fairness}</p>
                  <p><strong>🏆</strong> {match.result}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Retain Player Confirmation Popup */}
      {showRetainConfirm && selectedPlayerForRetain && (
        <div className="confirm-overlay">
          <div className="confirm-popup" style={{ maxWidth: '500px' }}>
            <h2>💎 Retain Player</h2>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '15px',
              padding: '20px',
              margin: '20px 0',
              color: 'white',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '1.5rem' }}>
                {selectedPlayerForRetain.player.name}
              </h3>
              <p style={{ margin: '0 0 15px 0', opacity: 0.9 }}>
                {selectedPlayerForRetain.player.type} • {selectedPlayerForRetain.player.role}
              </p>
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                padding: '15px',
                margin: '15px 0'
              }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: '600' }}>
                  Retention Value:
                </p>
                <p style={{ 
                  margin: '0', 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  ₹17.00 Crore
                </p>
              </div>
              <p style={{ margin: '0', fontSize: '0.9rem', opacity: 0.8 }}>
                This amount will be deducted from your purse when the admin releases all other players and resets the tournament.
              </p>
            </div>
            <div className="popup-buttons">
              <button className="confirm-button" onClick={handleConfirmRetain}>
                💎 Yes, Retain Player
              </button>
              <button className="cancel-button" onClick={handleCancelRetain}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove from Retention Confirmation Popup */}
      {showWithdrawConfirm && selectedRetainedForWithdraw && (
        <div className="confirm-overlay">
          <div className="confirm-popup" style={{ maxWidth: '500px' }}>
            <h2>🚪 Remove from Retention</h2>
            <div style={{
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
              borderRadius: '15px',
              padding: '20px',
              margin: '20px 0',
              color: 'white',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>⚠️</div>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '1.4rem' }}>
                Are You Sure You Want to Remove This Player?
              </h3>
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                padding: '15px',
                margin: '15px 0',
                fontSize: '1rem',
                fontWeight: '600'
              }}>
                <p style={{ margin: '0 0 10px 0' }}>
                  <strong>Player:</strong> {selectedRetainedForWithdraw.playerName}
                </p>
                <p style={{ margin: '0 0 10px 0' }}>
                  <strong>Type:</strong> {selectedRetainedForWithdraw.playerType}
                </p>
                <p style={{ margin: '0 0 10px 0' }}>
                  <strong>Retention Value:</strong> {formatAmount(selectedRetainedForWithdraw.retainedValue)}
                </p>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '0.9rem',
                lineHeight: '1.4'
              }}>
                <p style={{ margin: '0 0 8px 0' }}>
                  ℹ️ <strong>This will:</strong>
                </p>
                <ul style={{ margin: '0', paddingLeft: '20px', textAlign: 'left' }}>
                  <li>Remove this player from your retained list</li>
                  <li>Make the player available for auction again</li>
                  <li>Refund the retention amount to your purse</li>
                  <li>Allow you to retain a different player</li>
                </ul>
                <p style={{ margin: '8px 0 0 0', fontWeight: 'bold', color: '#ffeb3b' }}>
                  You can change your mind anytime until admin locks retention!
                </p>
              </div>
            </div>
            <div className="popup-buttons">
              <button className="confirm-button" onClick={handleConfirmWithdraw}>
                🚪 Yes, Remove from Retention
              </button>
              <button className="cancel-button" onClick={handleCancelWithdraw}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
