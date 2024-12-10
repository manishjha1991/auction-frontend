import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        const user = JSON.parse(localStorage.getItem('user'));
        const userId = user?.id;

        if (!userId) {
          throw new Error('User ID not found in local storage.');
        }

        const response = await fetch(`https://cpl.in.net/api/users/${userId}/details`, {
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
  }, []);

  const formatAmount = (amount) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Crore`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} Lakh`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(2)} Thousand`;
    return `₹${amount}`;
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  const handleImageChange = (e) => {
    setEditData({ ...editData, image: e.target.files[0] });
  };

  const handleSave = () => {
    const updatedUser = {
      ...userData.user,
      name: editData.name,
      teamName: editData.teamName,
      image: editData.image ? URL.createObjectURL(editData.image) : userData.user.image,
    };
    setUserData({ ...userData, user: updatedUser });
    setIsEditing(false);
  };

  const filteredSoldPlayers = userData?.soldPlayers.filter(({ player }) =>
    player.name.toLowerCase().includes(searchTerm)
  );

  const filteredActiveBids = userData?.activeBids.filter(({ player }) =>
    player.name.toLowerCase().includes(searchTerm)
  );

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="profile-container">
      <header className="profile-header">
        <div className="user-info">
          <img src={userData.user.image || 'https://via.placeholder.com/100'} alt="User" className="profile-image" />
          <div>
            <h2>{userData.user.name}</h2>
            <p>
              Total Purse Remaining: <span className="purse-amount">{formatAmount(parseFloat(userData.user.purse["$numberDecimal"]))}</span>
            </p>
          </div>
        </div>
        <div className="additional-info">
          <p><strong>Team Name:</strong> {userData.user.teamName}</p>
          <p><strong>Email:</strong> {userData.user.email}</p>
          <button className="edit-profile-button" onClick={() => setIsEditing(true)}>Edit Profile</button>
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
                <input type="file" id="image" onChange={handleImageChange} />
              </div>
              <div className="popup-buttons">
                <button type="button" onClick={handleSave}>Save</button>
                <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by player name..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      <div className="profile-content">
        <div className="section">
          <h3>Sold Players</h3>
          <div className="bought-players">
            {filteredSoldPlayers?.length > 0 ? (
              filteredSoldPlayers.map(({ player, bidValue }, index) => (
                <div className={`player-card ${player.type.toLowerCase()}`} key={index}>
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

        <div className="section">
          <h3>Active Bids</h3>
          <div className="bids-section">
            {filteredActiveBids?.length > 0 ? (
              filteredActiveBids.map(({ player, bidAmount }, index) => (
                <div className={`player-card ${player.type.toLowerCase()}`} key={index}>
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

        <div className="section">
          <h3>Past Bids</h3>
          <div className="past-bids">
            {userData.pastBids.map(({ player, bidAmount, status }, index) => (
              <div
                className={`past-bid-card ${status.toLowerCase()}`}
                style={{
                  border: status === "Won" ? "2px solid gold" : "1px solid #ccc",
                  backgroundColor: status === "Won" ? "#fffbea" : "transparent",
                  boxShadow: status === "Won" ? "0px 4px 8px rgba(255, 215, 0, 0.4)" : "none",
                  transition: "all 0.3s ease-in-out",
                }}
                key={index}
              >
                <p><strong>Name:</strong> {player.name}</p>
                <p><strong>Your Bid:</strong> {formatAmount(bidAmount)}</p>
                <p><strong>Base Price:</strong> {formatAmount(player.basePrice)}</p>
                <p><strong>Status:</strong> {status}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
