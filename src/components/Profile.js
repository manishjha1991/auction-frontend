import React, { useState, useEffect } from 'react';
import '../css/Profile.css';
import { API_ENDPOINTS } from "../const";
import LoadingCube from "./CricketAnimation";
import NotificationBell from './NotificationBell';
import TeamStrengthChart from './TeamStrengthChart';
import PlayerAvatar from './PlayerAvatar';
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
  const [showMultiSell, setShowMultiSell] = useState(false);
  const [activeBidPlayers, setActiveBidPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
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

  // Mobile-first section tabs
  const [activeSection, setActiveSection] = useState('squad');

  // Venue stats (this user's per-venue runs/wickets across all match types)
  const [venueStats, setVenueStats] = useState([]);
  const [venueStatsLoading, setVenueStatsLoading] = useState(false);
  const [venueStatsError, setVenueStatsError] = useState(null);

  const updateLocalPurse = (delta) => {
    if (!userData?.user) return;
    const current = parseFloat(userData.user.purse?.["$numberDecimal"] || userData.user.purse || 0);
    const next = current + delta;
    setUserData((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        purse: next,
      },
    }));
    const cached = JSON.parse(localStorage.getItem('user'));
    if (cached) {
      localStorage.setItem('user', JSON.stringify({ ...cached, purse: next }));
    }
  };

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

  const fetchUserData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
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
      setUserData(data);
      setEditData({
        name: data.user.name,
        teamName: data.user.teamName,
        timezone: data.user.timezone || 'Asia/Kolkata',
        streamLink: data.user.streamLink || '',
        abbreviation: data.user.abbreviation || '',
      });

      setIsRetentionLocked(data.user.isRetentionLocked === true);
      setAllPlayersReleased(data.user.allPlayersReleased === true);

      if (user) {
        const updatedUser = {
          ...user,
          purse: data.user.purse,
          isRetentionLocked: data.user.isRetentionLocked,
          allPlayersReleased: data.user.allPlayersReleased
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      setError('Failed to load profile. Please try again later.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData(true);
  }, []);

  // Lazy-load this user's venue stats when the Venues tab is opened.
  useEffect(() => {
    if (activeSection !== 'venues') return;
    const userIdRaw = userData?.user?._id || userData?.user?.id;
    if (!userIdRaw) return;
    let cancelled = false;
    const run = async () => {
      try {
        setVenueStatsLoading(true);
        setVenueStatsError(null);
        const response = await fetch(
          `${API_ENDPOINTS}/api/player-stats/venue-aggregate?scope=all&userId=${userIdRaw}`
        );
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        const data = await response.json();
        if (!cancelled) setVenueStats(Array.isArray(data?.venues) ? data.venues : []);
      } catch (err) {
        if (!cancelled) {
          console.error('Error fetching profile venue stats:', err);
          setVenueStatsError(err.message || 'Failed to load venue stats');
          setVenueStats([]);
        }
      } finally {
        if (!cancelled) setVenueStatsLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [activeSection, userData?.user?._id, userData?.user?.id]);

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

  useEffect(() => {
    const handleLockStatusChange = () => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        setIsRetentionLocked(user.isRetentionLocked === true);
      }
    };

    window.addEventListener('lock-status-changed', handleLockStatusChange);

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
    }, 30000);

    return () => {
      window.removeEventListener('lock-status-changed', handleLockStatusChange);
      clearInterval(interval);
    };
  }, []);

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

  const handleOpenMultiSell = async () => {
    try {
      setShowMultiSell(true);
      setMultiSellSearch('');
      const resp = await fetch(`${API_ENDPOINTS}/api/players/data`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!resp.ok) {
        throw new Error('Could not fetch players');
      }
      const players = await resp.json();
      const activePlayers = players.filter(player =>
        player.status !== "Sold" &&
        player.currentBidder &&
        player.currentBidder !== "N/A"
      );
      setActiveBidPlayers(activePlayers);
      setSelectedPlayers([]);
    } catch (err) {
      console.error('Failed to fetch active bid players:', err);
      setError('Failed to load players for multi-sell. Please try again later.');
    }
  };

  const handleSelectPlayer = (playerId) => {
    setSelectedPlayers(prevSelected => {
      if (prevSelected.includes(playerId)) {
        return prevSelected.filter(id => id !== playerId);
      } else {
        return [...prevSelected, playerId];
      }
    });
  };

  const handleMultiSell = async () => {
    setShowMultiSellConfirm(true);
  };

  const handleConfirmMultiSell = async () => {
    try {
      setShowMultiSellConfirm(false);
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

  const handleRetainPlayer = (playerData) => {
    const player = playerData.player || playerData;

    if (retainedPlayers.length >= 4) {
      setError('You can only retain a maximum of 4 players');
      return;
    }

    const existingCategoryRetained = retainedPlayers.find(rp => rp.playerType === player.type);
    if (existingCategoryRetained) {
      setError(`You already have a ${player.type} player retained. You can only retain one player from each category.`);
      return;
    }

    setSelectedPlayerForRetain(playerData);
    setShowRetainConfirm(true);
  };

  const handleConfirmRetain = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user?.id;

      const player = selectedPlayerForRetain.player || selectedPlayerForRetain;
      const playerId = player._id || player.player?._id;

      if (!playerId) {
        setError('Invalid player data. Please try again.');
        return;
      }

      const response = await fetch(`${API_ENDPOINTS}/api/retained-players/retain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          playerId: playerId
        })
      });

      if (response.ok) {
        const result = await response.json();

        const retainedResponse = await fetch(`${API_ENDPOINTS}/api/retained-players/user/${userId}`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (retainedResponse.ok) {
          const retainedData = await retainedResponse.json();
          setRetainedPlayers(retainedData);
        }

        if (result?.retainedPlayer?.retainedValue) {
          updateLocalPurse(-Number(result.retainedPlayer.retainedValue));
        }
        await fetchUserData(false);

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

  const handleWithdrawRetention = (retained) => {
    if (isRetentionLocked) {
      setError('Your team retention is locked by admin. You cannot remove retained players.');
      return;
    }

    if (!retentionEnabled) {
      setError('Player retention feature is currently disabled.');
      return;
    }

    if (!isRetentionLocked && retentionEnabled) {
      setSelectedRetainedForWithdraw(retained);
      setShowWithdrawConfirm(true);
    }
  };

  const handleConfirmWithdraw = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user?.id;

      const response = await fetch(`${API_ENDPOINTS}/api/retained-players/undo/${selectedRetainedForWithdraw._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
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

        if (selectedRetainedForWithdraw?.retainedValue) {
          updateLocalPurse(Number(selectedRetainedForWithdraw.retainedValue));
        }
        await fetchUserData(false);

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

  const formatAmount = (amount) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Crore`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} Lakh`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(2)} Thousand`;
    return `₹${amount}`;
  };

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

      setUserData(prev => ({
        ...prev,
        user: {
          ...prev.user,
          ...updatedUser.user
        }
      }));

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
  if (error && !userData) {
    return <div className="error">{error}</div>;
  }
  if (!userData) {
    return null;
  }

  // --- ADMIN VIEW (legacy duplicate preserved) ---
  if (isAdmin) {
    const filteredActiveBidPlayers = activeBidPlayers.filter(p =>
      p.name.toLowerCase().includes(multiSellSearch.toLowerCase())
    );

    return (
      <div className="admin-container">
        <h2 className="admin-title">👑 Admin Panel</h2>
        <p className="admin-subtitle">
          Manage user accounts, timezones, and stream links.
        </p>

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
              >
                💎 Retained Players
              </button>
            </div>
          </div>
        </div>

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

        {showMultiSell && (
          <div className="confirm-overlay">
            <div className="confirm-popup" style={{ width: '500px', maxWidth: '90%' }}>
              <h2>Pick your players to sell!</h2>
              <p style={{ marginBottom: '15px' }}>
                Select any players who currently have active bids. Then click <b>Multi-Sell</b>.
              </p>
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

  // Recent form: show every played match, most recent first.
  // Backend returns `allMatches` (new) with fallback to `lastFiveMatches` (legacy).
  const playedMatches = (userData.allMatches && userData.allMatches.length > 0)
    ? userData.allMatches
    : (userData.lastFiveMatches || []).filter(m => m && m.result && m.result !== 'NA');
  const matchesWon = playedMatches.filter(m => (m.result || '').toLowerCase() === 'won').length;
  const matchesLost = playedMatches.filter(m => (m.result || '').toLowerCase() === 'lost').length;
  const recentFormStreak = playedMatches.slice(0, 5);

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

  // ---- Helpers to render player cards ----
  const renderSoldCard = ({ player, bidValue }, idx) => {
    const isRetained = retainedPlayers.some(rp => rp.playerId._id === player._id);
    const canRetainMore = retainedPlayers.length < 4;
    const hasCategoryRetained = retainedPlayers.some(rp => rp.playerType === player.type);
    const canClick = isRetained
      ? (!isRetentionLocked && retentionEnabled)
      : (!isRetentionLocked && retentionEnabled && canRetainMore && !hasCategoryRetained);

    return (
      <div
        className={`up-card up-card--sold player-card ${player.type.toLowerCase()} ${isRetained ? 'retained' : ''}`}
        key={idx}
        style={{ cursor: canClick ? 'pointer' : 'not-allowed' }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();

          if (isRetained) {
            const retainedPlayer = retainedPlayers.find(rp => rp.playerId._id === player._id);
            if (retainedPlayer) {
              handleWithdrawRetention(retainedPlayer);
            } else {
              setError('Retained player data not found. Please refresh the page.');
            }
            return;
          }

          if (!retentionEnabled) {
            setError('Player retention feature is currently disabled by admin');
            return;
          }

          if (isRetentionLocked) {
            setError('Your team retention is locked by admin. You cannot retain players.');
            return;
          }

          if (!canRetainMore) {
            setError('You can only retain a maximum of 4 players');
            return;
          }

          if (hasCategoryRetained) {
            setError(`You already have a ${player.type} player retained. You can only retain one player from each category.`);
            return;
          }

          handleRetainPlayer({ player, bidValue });
        }}
      >
        {isRetained && <span className="up-card-ribbon up-card-ribbon--retained">✅ Retained</span>}

        <div className="up-card-head">
          <PlayerAvatar profilePicture={player.profilePicture} name={player.name} size={48} />
          <div className="up-card-id">
            <p className="up-card-name">{player.name}</p>
            <span className={`up-tier-pill up-tier-pill--${player.type.toLowerCase()}`}>
              {player.type} · {player.role}
            </span>
          </div>
        </div>

        <div className="up-card-stats">
          <div className="up-card-stat">
            <span>Base price</span>
            <strong>{formatAmount(player.basePrice)}</strong>
          </div>
          <div className="up-card-stat up-card-stat--highlight">
            <span>Sold for</span>
            <strong>{formatAmount(bidValue)}</strong>
          </div>
        </div>

        {!isRetained && retentionEnabled && !isRetentionLocked && (() => {
          if (!canRetainMore) {
            return <p className="up-card-hint up-card-hint--error">❌ Max 4 players retained</p>;
          }
          if (hasCategoryRetained) {
            return <p className="up-card-hint up-card-hint--warn">⚠️ {player.type} already retained</p>;
          }
          return <p className="up-card-hint up-card-hint--action">💎 Tap to retain · ₹17 Cr</p>;
        })()}

        {!isRetained && !retentionEnabled && (
          <p className="up-card-hint up-card-hint--muted">🔒 Retention disabled by admin</p>
        )}

        {!isRetained && retentionEnabled && isRetentionLocked && (
          <p className="up-card-hint up-card-hint--error">🔒 Team locked by admin</p>
        )}
      </div>
    );
  };

  const renderActiveBidCard = ({ player, bidAmount }, idx) => (
    <div className={`up-card up-card--bid player-card ${player.type.toLowerCase()}`} key={idx}>
      <div className="up-card-head">
        <PlayerAvatar profilePicture={player.profilePicture} name={player.name} size={44} />
        <div className="up-card-id">
          <p className="up-card-name">{player.name}</p>
          <span className={`up-tier-pill up-tier-pill--${player.type?.toLowerCase?.() || 'default'}`}>
            {player.role}
          </span>
        </div>
      </div>
      <div className="up-card-stats">
        <div className="up-card-stat up-card-stat--highlight">
          <span>Your bid</span>
          <strong>{formatAmount(bidAmount)}</strong>
        </div>
      </div>
    </div>
  );

  const renderPastBidCard = ({ player, bidAmount, status }, idx) => {
    const isWon = (status || '').toLowerCase() === 'won';
    return (
      <div
        className={`up-card up-card--past past-bid-card ${status.toLowerCase()} ${isWon ? 'is-won' : ''}`}
        key={idx}
      >
        <div className="up-card-head">
          <PlayerAvatar profilePicture={player.profilePicture} name={player.name} size={40} />
          <div className="up-card-id">
            <p className="up-card-name">{player.name}</p>
            <span className={`up-status-pill up-status-pill--${status.toLowerCase()}`}>
              {isWon ? '🏆 ' : ''}
              {status}
            </span>
          </div>
        </div>
        <div className="up-card-stats">
          <div className="up-card-stat">
            <span>Base price</span>
            <strong>{formatAmount(player.basePrice)}</strong>
          </div>
          <div className="up-card-stat up-card-stat--highlight">
            <span>Your bid</span>
            <strong>{formatAmount(bidAmount)}</strong>
          </div>
        </div>
      </div>
    );
  };

  const renderRetainedCard = (retained, idx) => (
    <div
      className={`up-card up-card--retained player-card ${retained.playerType.toLowerCase()} retained ${isRetentionLocked ? 'locked' : ''}`}
      key={idx}
      style={isRetentionLocked ? { opacity: 0.6, filter: 'grayscale(0.3)', pointerEvents: 'none', position: 'relative' } : {}}
    >
      <span className={`up-card-ribbon ${isRetentionLocked ? 'up-card-ribbon--locked' : 'up-card-ribbon--retained'}`}>
        {isRetentionLocked ? '🔒 Locked' : '✅ Retained'}
      </span>

      {isRetentionLocked && (
        <div className="up-retained-lock-overlay">
          <span>🔒 Admin locked</span>
        </div>
      )}

      <div className="up-card-head">
        <PlayerAvatar profilePicture={retained.playerId?.profilePicture} name={retained.playerName} size={48} />
        <div className="up-card-id">
          <p className="up-card-name">{retained.playerName}</p>
          <span className={`up-tier-pill up-tier-pill--${retained.playerType.toLowerCase()}`}>
            {retained.playerType} · {retained.playerRole}
          </span>
        </div>
      </div>

      <div className="up-card-stats">
        <div className="up-card-stat up-card-stat--highlight">
          <span>Retention value</span>
          <strong>{formatAmount(retained.retainedValue)}</strong>
        </div>
        <div className="up-card-stat">
          <span>Retained on</span>
          <strong>{new Date(retained.retainedAt).toLocaleDateString()}</strong>
        </div>
      </div>

      {!isRetentionLocked && retentionEnabled && (
        <button
          type="button"
          className="up-withdraw-btn"
          onClick={() => handleWithdrawRetention(retained)}
        >
          🚪 Remove from retention
        </button>
      )}
    </div>
  );

  // Section tabs config
  const squadCount = filteredSoldPlayers?.length || 0;
  const bidsCount = filteredActiveBids?.length || 0;
  const pastCount = userData.pastBids?.length || 0;
  const retainedCount = retainedPlayers?.length || 0;

  const sections = [
    { id: 'squad', label: 'Squad', icon: '🏏', count: squadCount },
    { id: 'active', label: 'Active bids', icon: '⚡', count: bidsCount },
    { id: 'past', label: 'Past bids', icon: '📜', count: pastCount },
    ...(retentionEnabled ? [{ id: 'retained', label: 'Retained', icon: '💎', count: retainedCount }] : []),
    { id: 'form', label: 'Recent form', icon: '📈', count: playedMatches.length },
    { id: 'venues', label: 'Venues', icon: '📍', count: venueStats.length },
  ];

  const purseValue = parseFloat(userData.user.purse?.["$numberDecimal"] || userData.user.purse || 0);
  const userTimezone = userData.user.timezone || 'Asia/Kolkata';
  const localTimeString = new Date().toLocaleString('en-US', {
    timeZone: userTimezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="up-page profile-container">
      <NotificationBell />

      {/* Error toast */}
      {error && (
        <div className="up-toast" onClick={() => setError(null)}>
          <span className="up-toast-icon">⚠️</span>
          <div>
            <strong>{error}</strong>
            <small>Tap to dismiss</small>
          </div>
        </div>
      )}

      {/* Floating retention lock pill (also shown in hero) */}
      {isRetentionLocked && (
        <div className="up-lock-pill">
          <span>🔒</span>
          <div>
            <strong>Retention locked</strong>
            <small>Contact admin to unlock</small>
          </div>
        </div>
      )}

      {/* ===== Hero ===== */}
      <header className="up-hero">
        <div className="up-hero-top">
          <img
            src={
              userData.user.image
                ? `${API_ENDPOINTS}${userData.user.image}`
                : 'https://via.placeholder.com/100'
            }
            alt="User"
            className="up-hero-avatar profile-image"
          />
          <div className="up-hero-identity">
            <span className="up-hero-kicker">Team owner</span>
            <h1 className="up-hero-name user-name">{userData.user.name}</h1>
            <p className="up-hero-team">
              <span>{userData.user.teamName}</span>
              {userData.user.abbreviation ? (
                <span className="up-abbr">{userData.user.abbreviation}</span>
              ) : null}
            </p>
            <p className="up-hero-email">{userData.user.email}</p>
          </div>
          <button
            type="button"
            className="up-hero-edit edit-profile-button"
            onClick={() => setIsEditing(true)}
            aria-label="Edit profile"
          >
            <span aria-hidden>✎</span>
            <span>Edit</span>
          </button>
        </div>

        <div className="up-hero-metrics">
          <div className="up-purse purse-card">
            <span className="purse-label">Total purse remaining</span>
            <span className="purse-value">{formatAmount(purseValue)}</span>
          </div>
          <div
            className={`up-retention-chip ${
              isRetentionLocked ? 'is-locked' : 'is-active'
            }`}
          >
            <span className="up-retention-dot" aria-hidden />
            <div>
              <strong>{isRetentionLocked ? 'Retention locked' : 'Retention active'}</strong>
              <small>
                {retentionEnabled
                  ? `${retainedCount}/4 retained · ₹17 Cr each`
                  : 'Disabled by admin'}
              </small>
            </div>
          </div>
        </div>

        <div className="up-timezone-row">
          <div className="up-tz-icon" aria-hidden>🌍</div>
          <div className="up-tz-meta">
            <span className="up-tz-label">Your timezone</span>
            <strong className="up-tz-name">{userTimezone}</strong>
          </div>
          <div className="up-tz-time">{localTimeString}</div>
        </div>
      </header>

      {/* Edit popup (unchanged markup) */}
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

      {/* Search */}
      <div className="up-search search-bar">
        <span className="up-search-icon" aria-hidden>🔎</span>
        <input
          type="text"
          placeholder="Search by player name…"
          value={searchTerm}
          onChange={handleSearchChange}
          aria-label="Search players"
        />
        {searchTerm && (
          <button
            type="button"
            className="up-search-clear"
            onClick={() => setSearchTerm('')}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Section tabs */}
      <nav className="up-tabs" role="tablist" aria-label="Profile sections">
        {sections.map((sec) => (
          <button
            key={sec.id}
            type="button"
            role="tab"
            aria-selected={activeSection === sec.id}
            className={`up-tab ${activeSection === sec.id ? 'is-active' : ''}`}
            onClick={() => setActiveSection(sec.id)}
          >
            <span className="up-tab-icon" aria-hidden>{sec.icon}</span>
            <span className="up-tab-text">
              <span className="up-tab-label">{sec.label}</span>
              <span className="up-tab-count">{sec.count}</span>
            </span>
          </button>
        ))}
      </nav>

      <div className="up-content profile-content">
        {/* Squad (Sold players) */}
        {activeSection === 'squad' && (
          <section className="up-section section">
            <div className="up-section-head">
              <h3>🏏 Sold players</h3>
              <span className="up-section-count">{squadCount} in squad</span>
            </div>

            {isRetentionLocked && retentionEnabled && (
              <div className="up-banner up-banner--danger">
                <div className="up-banner-icon">🚫</div>
                <div>
                  <strong>Retention locked by admin</strong>
                  <p>You cannot retain any players at this time.</p>
                </div>
              </div>
            )}

            <div className="up-grid up-grid--cards bought-players">
              {filteredSoldPlayers && filteredSoldPlayers.length > 0 ? (
                filteredSoldPlayers.map(renderSoldCard)
              ) : (
                <p className="up-empty">No players found.</p>
              )}
            </div>

            {userData.soldPlayers && userData.soldPlayers.length > 0 && (
              <div className="up-chart-wrap">
                <TeamStrengthChart players={userData.soldPlayers.map(item => item.player)} />
              </div>
            )}
          </section>
        )}

        {/* Active Bids */}
        {activeSection === 'active' && (
          <section className="up-section section">
            <div className="up-section-head">
              <h3>⚡ Active bids</h3>
              <span className="up-section-count">{bidsCount} live</span>
            </div>

            <div className="up-grid up-grid--cards">
              {filteredActiveBids && filteredActiveBids.length > 0 ? (
                filteredActiveBids.map(renderActiveBidCard)
              ) : (
                <p className="up-empty">No active bids found.</p>
              )}
            </div>
          </section>
        )}

        {/* Past bids */}
        {activeSection === 'past' && (
          <section className="up-section section">
            <div className="up-section-head">
              <h3>📜 Past bids</h3>
              <span className="up-section-count">{pastCount} recorded</span>
            </div>

            <div className="up-grid up-grid--cards past-bids">
              {userData.pastBids && userData.pastBids.length > 0 ? (
                userData.pastBids.map(renderPastBidCard)
              ) : (
                <p className="up-empty">No past bids yet.</p>
              )}
            </div>
          </section>
        )}

        {/* Retained Players */}
        {activeSection === 'retained' && retentionEnabled && (
          <section className="up-section section">
            <div className="up-section-head">
              <h3>💎 Retained players</h3>
              <span className="up-section-count">{retainedCount}/4</span>
            </div>

            {isRetentionLocked && (
              <div className="up-banner up-banner--danger up-banner--lg">
                <div className="up-banner-icon">🚫</div>
                <div>
                  <strong>Retention locked by admin</strong>
                  <p>Your team's retention functionality has been locked by admin.</p>
                  <ul>
                    <li>🚫 Cannot retain new players</li>
                    <li>🚫 Cannot remove retained players</li>
                    <li>🚫 Cannot change retention in any way</li>
                  </ul>
                  <small>Contact admin to unlock your retention functionality.</small>
                </div>
              </div>
            )}

            {!isRetentionLocked && (
              <div className="up-banner up-banner--info">
                <div className="up-banner-icon">📋</div>
                <div>
                  <strong>Retention rules</strong>
                  <div className="up-rules">
                    <span>Max 4 players</span>
                    <span>One per category</span>
                    <span>₹17 Cr each</span>
                    <span>{retainedPlayers.length}/4 retained</span>
                  </div>
                </div>
              </div>
            )}

            {allPlayersReleased && !isRetentionLocked && !retentionEnabled && (
              <div className="up-banner up-banner--success">
                <div className="up-banner-icon">✅</div>
                <div>
                  <strong>Admin released players</strong>
                  <p>Admin has released all players. Retention and undo options are now disabled.</p>
                </div>
              </div>
            )}

            {retentionEnabled && !isRetentionLocked && (
              <div className="up-banner up-banner--accent">
                <div className="up-banner-icon">✅</div>
                <div>
                  <strong>Retention enabled by admin</strong>
                </div>
              </div>
            )}

            <div className="up-grid up-grid--cards bought-players">
              {loadingRetained ? (
                <p className="up-empty">Loading retained players…</p>
              ) : retainedPlayers && retainedPlayers.length > 0 ? (
                retainedPlayers.map(renderRetainedCard)
              ) : (
                <p className="up-empty">No retained players yet. Open the Squad tab and tap a sold player to retain them.</p>
              )}
            </div>
          </section>
        )}

        {/* Recent form */}
        {activeSection === 'form' && (
          <section className="up-section section">
            <div className="up-section-head">
              <h3>📈 Recent form</h3>
              <span className="up-section-count">
                {playedMatches.length} {playedMatches.length === 1 ? 'match' : 'matches'} played
              </span>
            </div>

            {playedMatches.length > 0 ? (
              <>
                <div className="up-form-summary">
                  <div className="up-form-stat up-form-stat--won">
                    <strong>{matchesWon}</strong>
                    <span>Won</span>
                  </div>
                  <div className="up-form-stat up-form-stat--lost">
                    <strong>{matchesLost}</strong>
                    <span>Lost</span>
                  </div>
                  <div className="up-form-stat">
                    <strong>{playedMatches.length}</strong>
                    <span>Total</span>
                  </div>
                  <div className="up-form-streak" aria-label="Last 5 results">
                    {recentFormStreak.map((m, i) => {
                      const r = (m.result || '').toLowerCase();
                      const cls = r === 'won' ? 'is-w' : r === 'lost' ? 'is-l' : 'is-n';
                      const ch = r === 'won' ? 'W' : r === 'lost' ? 'L' : '–';
                      return <span key={i} className={`up-form-dot ${cls}`}>{ch}</span>;
                    })}
                  </div>
                </div>

                <div className="up-grid up-grid--matches">
                  {playedMatches.map((match, idx) => {
                    const isWon = (match.result || '').toLowerCase() === 'won';
                    const isLost = (match.result || '').toLowerCase() === 'lost';
                    const dateLabel = match.playedAt
                      ? new Date(match.playedAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })
                      : null;
                    return (
                      <div
                        key={idx}
                        className={`up-match-card past-bid-card ${isWon ? 'is-won' : ''} ${isLost ? 'is-lost' : ''}`}
                      >
                        <div className="up-match-result">{isWon ? '🏆' : isLost ? '💔' : '—'}</div>
                        <div className="up-match-meta">
                          <p className="up-match-opponent"><span>🆚</span> {match.opponentTeam || '—'}</p>
                          <p><span>🏏</span> {match.score}</p>
                          <p><span>⚖️</span> {match.fairness}</p>
                          <p><span>🏆</span> {match.result}</p>
                          {dateLabel && <p className="up-match-date"><span>📅</span> {dateLabel}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="up-empty">No matches played yet. Your results will show up here as you play.</p>
            )}
          </section>
        )}

        {/* Venues — per-venue totals across all match types for this user */}
        {activeSection === 'venues' && (
          <section className="up-section section">
            <div className="up-section-head">
              <h3>📍 Venue performance</h3>
              <span className="up-section-count">
                {venueStats.length} {venueStats.length === 1 ? 'venue' : 'venues'}
              </span>
            </div>

            {venueStatsLoading ? (
              <p className="up-empty">Loading venue stats…</p>
            ) : venueStatsError ? (
              <p className="up-empty">{venueStatsError}</p>
            ) : venueStats.length === 0 ? (
              <p className="up-empty">
                No venue data yet. Once you upload scorecards with a venue tagged, your per-ground performance will appear here.
              </p>
            ) : (
              (() => {
                const totalRuns = venueStats.reduce((s, v) => s + (v.batting?.runs || 0), 0);
                const totalWickets = venueStats.reduce((s, v) => s + (v.bowling?.wickets || 0), 0);
                const totalInnings = venueStats.reduce((s, v) => s + (v.matches || 0), 0);
                const ballsToOvers = (balls) => {
                  if (!balls) return '0';
                  const overs = Math.floor(balls / 6);
                  const rem = balls % 6;
                  return rem ? `${overs}.${rem}` : `${overs}`;
                };
                return (
                  <>
                    <div className="up-form-summary">
                      <div className="up-form-stat up-form-stat--won">
                        <strong>{totalRuns}</strong>
                        <span>Total runs</span>
                      </div>
                      <div className="up-form-stat up-form-stat--lost">
                        <strong>{totalWickets}</strong>
                        <span>Total wickets</span>
                      </div>
                      <div className="up-form-stat">
                        <strong>{totalInnings}</strong>
                        <span>Innings</span>
                      </div>
                    </div>

                    <div className="up-venue-grid">
                      {venueStats.map((v) => (
                        <div key={v.venue} className="up-venue-card">
                          <div className="up-venue-head">
                            <span className="up-venue-pin" aria-hidden>📍</span>
                            <span className="up-venue-name" title={v.venue}>{v.venue}</span>
                            <span className="up-venue-inn">
                              {v.matches} {v.matches === 1 ? 'inn' : 'inns'}
                            </span>
                          </div>
                          <div className="up-venue-tiles">
                            <div className="up-venue-tile up-venue-tile--bat">
                              <span className="up-venue-tile-label">Runs</span>
                              <span className="up-venue-tile-value">{v.batting?.runs ?? 0}</span>
                              <span className="up-venue-tile-meta">
                                {v.batting?.balls ?? 0} balls · SR {v.batting?.strikeRate ?? 0}
                              </span>
                            </div>
                            <div className="up-venue-tile up-venue-tile--bowl">
                              <span className="up-venue-tile-label">Wickets</span>
                              <span className="up-venue-tile-value">{v.bowling?.wickets ?? 0}</span>
                              <span className="up-venue-tile-meta">
                                {ballsToOvers(v.bowling?.ballsBowled || 0)} ov · Eco {v.bowling?.economy ?? 0}
                              </span>
                            </div>
                          </div>
                          {(!!v.batting?.fours || !!v.batting?.sixes) && (
                            <div className="up-venue-pills">
                              {!!v.batting?.fours && (
                                <span className="up-venue-pill four">{v.batting.fours} × 4s</span>
                              )}
                              {!!v.batting?.sixes && (
                                <span className="up-venue-pill six">{v.batting.sixes} × 6s</span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()
            )}
          </section>
        )}
      </div>

      {/* Retain Player Confirmation Popup */}
      {showRetainConfirm && selectedPlayerForRetain && (() => {
        const player = selectedPlayerForRetain.player || selectedPlayerForRetain;
        return (
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, margin: '0 0 10px 0' }}>
                  <PlayerAvatar profilePicture={player.profilePicture} name={player.name} size={48} />
                  <h3 style={{ margin: 0, fontSize: '1.5rem' }}>
                    {player.name}
                  </h3>
                </div>
                <p style={{ margin: '0 0 15px 0', opacity: 0.9 }}>
                  {player.type} • {player.role}
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
                  <p style={{ margin: '0', fontSize: '1.5rem', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
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
        );
      })()}

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
