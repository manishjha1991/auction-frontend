import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Profile.css'; // Import the CSS for styling

const Profile = () => {
  const navigate = useNavigate(); // For navigation
  const [user, setUser] = useState({
    name: 'John Doe',
    teamName: 'Team Alpha',
    playStationId: 'PSN12345',
    purse: 100,
    image: 'https://via.placeholder.com/100', // Replace with user image URL
    boughtPlayers: [
      { name: 'Player A', price: 50, type: 'Silver' },
      { name: 'Player B', price: 30, type: 'Gold' },
      { name: 'Player C', price: 20, type: 'Emerald' },
    ],
    currentBid: { name: 'Player D', bid: 25, type: 'Sapphire' },
    pastBids: [
      { name: 'Player E', yourBid: 40, soldPrice: 45, goesTo: 'Jane Smith' },
      { name: 'Player F', yourBid: 35, soldPrice: 35, goesTo: 'John Doe' },
      { name: 'Player G', yourBid: 50, soldPrice: 55, goesTo: 'John Doe' },
    ],
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user.name,
    teamName: user.teamName,
    playStationId: user.playStationId,
    image: null,
  });

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const filteredBoughtPlayers = user.boughtPlayers.filter((player) =>
    player.name.toLowerCase().includes(searchTerm)
  );

  const filteredCurrentBid =
    user.currentBid.name.toLowerCase().includes(searchTerm) ? user.currentBid : null;

  const isBidWonByUser = (bid) => bid.goesTo === user.name;

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  const handleImageChange = (e) => {
    setEditData({ ...editData, image: e.target.files[0] });
  };

  const handleSave = () => {
    const updatedUser = {
      ...user,
      name: editData.name,
      teamName: editData.teamName,
      playStationId: editData.playStationId,
      image: editData.image ? URL.createObjectURL(editData.image) : user.image,
    };
    setUser(updatedUser);
    setIsEditing(false);
  };

  // const handleLogout = () => {
  //   navigate('/login'); // Redirect to login page
  // };

  return (
    <div className="profile-container">
      <header className="profile-header">
        <div className="user-info">
          <img src={user.image} alt="User" className="profile-image" />
          <div>
            <h2>{user.name}</h2>
            <p>Total Purse Remaining: <span className="purse-amount">₹{user.purse}</span></p>
          </div>
        </div>
        <div className="additional-info">
          <p><strong>Team Name:</strong> {user.teamName}</p>
          <p><strong>PSN ID:</strong> {user.playStationId}</p>
          <button
            className="edit-profile-button"
            onClick={() => setIsEditing(true)}
          >
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
              <input
                type="text"
                name="playStationId"
                value={editData.playStationId}
                onChange={handleEditChange}
                placeholder="PSN ID"
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
                <button type="button" onClick={handleSave}>
                  Save
                </button>
                <button type="button" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
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
        <div className="section">
          <h3>Player Bought</h3>
          <div className="bought-players">
            {filteredBoughtPlayers.length > 0 ? (
              filteredBoughtPlayers.map((player, index) => (
                <div className={`player-card ${player.type.toLowerCase()}`} key={index}>
                  <p><strong>Name:</strong> {player.name}</p>
                  <p><strong>Price:</strong> ₹{player.price}</p>
                </div>
              ))
            ) : (
              <p>No players found.</p>
            )}
          </div>
        </div>

        <div className="section">
          <h3>Running Bid on Player</h3>
          {filteredCurrentBid ? (
            <div className={`player-card ${filteredCurrentBid.type.toLowerCase()}`}>
              <p><strong>Name:</strong> {filteredCurrentBid.name}</p>
              <p><strong>Current Bid:</strong> ₹{filteredCurrentBid.bid}</p>
            </div>
          ) : (
            <p>No players found.</p>
          )}
        </div>

        <div className="section">
          <h3>Past Bids</h3>
          <div className="past-bids">
            {user.pastBids.map((bid, index) => (
              <div
                className={`past-bid-card ${
                  isBidWonByUser(bid) ? 'won' : 'lost'
                }`}
                key={index}
              >
                <p><strong>Name:</strong> {bid.name}</p>
                <p><strong>Your Bid:</strong> ₹{bid.yourBid}</p>
                <p><strong>Sold Price:</strong> ₹{bid.soldPrice}</p>
                <p><strong>Goes To:</strong> {bid.goesTo}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
