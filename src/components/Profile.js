import React, { useState, useEffect } from 'react';
import '../css/Profile.css';
import { API_ENDPOINTS } from "../const";
import LoadingCube from "./CricketAnimation";
import NotificationBell from './NotificationBell';
import TeamStrengthChart from './TeamStrengthChart';
const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);

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

  // Check localStorage for user.isAdmin
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setIsAdmin(user?.isAdmin === true);
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
        setUserData(data);
        setEditData({
          name: data.user.name,
          teamName: data.user.teamName,
        });
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setError('Failed to load profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [API_ENDPOINTS]);

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
    setEditData({ ...editData, [name]: value });
  };
  const handleImageChange = (e) => {
    setEditData({ ...editData, image: e.target.files[0] });
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append('name', editData.name);
      formData.append('teamName', editData.teamName);
      if (editData.image) {
        formData.append('teamImage', editData.image);
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
      setUserData(prev => ({
        ...prev,
        user: updatedUser.user,
      }));
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to update profile. Please try again later.');
    }
  };

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
        <h2 className="admin-title">Welcome, Admin {userData.user.name}!</h2>
        <p className="admin-subtitle">
          Manage auctions, finalize single-bid sales & more.
        </p>

        {/* Admin Buttons */}
        <div style={{ marginTop: '20px' }}>
          <button
            className="glow-button glow-button-sell"
            onClick={() => setShowConfirmSell(true)}
            style={{ marginRight: '10px' }}
          >
            Sell All Single-Bid Players
          </button>
          <button
            className="glow-button glow-button-remove"
            onClick={() => setShowConfirmRemoveSecond(true)}
            style={{ marginRight: '10px' }}
          >
            Remove All Second-Highest Bidders
          </button>
          <button
            className="glow-button glow-button-sell"
            onClick={handleOpenMultiSell}
          >
            Multi-Sell Bidding Players
          </button>
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

  return (
    <div className="profile-container">
      {/* Include the NotificationBell component */}
      <NotificationBell />
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
                {formatAmount(parseFloat(userData.user.purse["$numberDecimal"]))}
              </span>
            </p>
          </div>
        </div>
        <div className="additional-info">
          <p><strong>Team Name:</strong> {userData.user.teamName}</p>
          <p><strong>Email:</strong> {userData.user.email}</p>
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
          <div className="bought-players">
            {filteredSoldPlayers && filteredSoldPlayers.length > 0 ? (
              filteredSoldPlayers.map(({ player, bidValue }, idx) => (
                <div className={`player-card ${player.type.toLowerCase()}`} key={idx}>
                  <p><strong>Name:</strong> {player.name}</p>
                  <p><strong>Type:</strong> {player.type}</p>
                  <p><strong>Role:</strong> {player.role}</p>
                  <p><strong>Base Price:</strong> {formatAmount(player.basePrice)}</p>
                  <p><strong>Sold For:</strong> {formatAmount(bidValue)}</p>
                </div>
              ))
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
    </div>
  );
};

export default Profile;
