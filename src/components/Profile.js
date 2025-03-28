import React, { useState, useEffect } from 'react';
import '../css/Profile.css';
import { API_ENDPOINTS } from "../const";
import LoadingCube from "./CricketAnimation";

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);

  // NEW state for showing the confirmation popup
  const [showConfirm, setShowConfirm] = useState(false);

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

  // Handler for actually finalizing single-bid sale
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

      // Optionally re-fetch user data or show a toast
      // (If you want to refresh the UI to reflect changes)
      // fetchUserData();
    } catch (err) {
      console.error('Failed to finalize single-bid sale:', err);
      setError('Failed to finalize single-bid sale. Please try again later.');
    }
  };

  // CONFIRM button inside the popup
  const handleConfirmSale = () => {
    setShowConfirm(false); // Hide the popup
    handleSingleBidSale(); // Trigger the sale
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
      setUserData((prev) => ({
        ...prev,
        user: updatedUser.user,
      }));

      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to update profile. Please try again later.');
    }
  };

  // Loading or error states
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
    return (
      <div className="admin-container">
        <h2 className="admin-title">Welcome, Admin {userData.user.name}!</h2>
        <p className="admin-subtitle">
          Manage auctions, finalize single-bid sales & more.
        </p>

        <button
          className="glow-button"
          onClick={() => setShowConfirm(true)}
        >
          Sell All Single-Bid Players
        </button>

        {/* Funny Confirmation Popup */}
        {showConfirm && (
          <div className="confirm-overlay">
            <div className="confirm-popup">
              <h2>Are You Absolutely Sure?!</h2>
              <p>
                This will sell all players with exactly one bid.<br/>
                We hope your fellow owners won't mind...<br/>
                Once you do this, there's no going back!
              </p>
              <div className="popup-buttons">
                <button
                  className="confirm-button"
                  onClick={handleConfirmSale}
                >
                  Yes, let's do this!
                </button>
                <button
                  className="cancel-button"
                  onClick={() => setShowConfirm(false)}
                >
                  Hmm, better not...
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

  // Last 5 matches fallback
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
