import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../css/PlayerList.css'; // Import CSS for styling

const PlayerList = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingPlayer, setEditingPlayer] = useState(null); // State for the player being edited
  const [formData, setFormData] = useState({}); // Form data for editing
  const [isAdmin, setIsAdmin] = useState(false); // Simulate admin check (replace with actual logic)
  const playersPerPage = 3; // Number of players per page

  useEffect(() => {
    // Fetch players from the backend
    axios.get('http://localhost:3000/players') // Adjust this URL as per your backend route
      .then((response) => {
        setPlayers(response.data);
        setLoading(false);
      })
      .catch((error) => console.error('Error fetching players:', error));

    // Simulate fetching admin status (replace with actual logic for logged-in user)
    setIsAdmin(true); // Set this to true if the user is an admin
  }, []);

  const placeBid = (playerId, currentBid) => {
    const newBid = currentBid + 1; // Increment bid amount
    console.log(`Placing bid for player ID: ${playerId} with bid: ${newBid}`);
  };

  // Filter players based on the search term
  const filteredPlayers = players.filter((player) =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const indexOfLastPlayer = currentPage * playersPerPage;
  const indexOfFirstPlayer = indexOfLastPlayer - playersPerPage;
  const currentPlayers = filteredPlayers.slice(indexOfFirstPlayer, indexOfLastPlayer);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const openEditPopup = (player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      role: player.role,
      style: player.style,
      basePrice: player.basePrice,
      playerType: player.type,
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const form = new FormData();
      form.append('name', formData.name);
      form.append('role', formData.role);
      form.append('style', formData.style);
      form.append('basePrice', formData.basePrice);
      form.append('playerType', formData.playerType);

      if (formData.image) {
        form.append('image', formData.image);
      }

      const response = await axios.put(`http://localhost:3000/players/${editingPlayer._id}`, form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Player updated successfully:', response.data);
      setPlayers(players.map((p) => (p._id === editingPlayer._id ? response.data : p))); // Update UI
      setEditingPlayer(null); // Close popup
    } catch (error) {
      console.error('Error updating player:', error);
    }
  };

  const closeEditPopup = () => {
    setEditingPlayer(null);
  };

  if (loading) return <p>Loading players...</p>;

  // Function to get color based on player type
  const getCardColor = (playerType) => {
    switch (playerType) {
      case 'Gold':
        return '#fff4cc'; // Slightly darker gold
      case 'Silver':
        return '#e0e0e0'; // Slightly darker silver
      case 'Emerald':
        return '#d1f2d1'; // Slightly darker green
      case 'Sapphire':
        return '#cce4ff'; // Slightly darker blue
      default:
        return '#f5f5f5'; // Default light gray
    }
  };

  return (
    <div className="player-list-container">
      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search players by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Player List */}
      <div className="player-list">
        {currentPlayers.map((player) => (
          <div
            className="player-card"
            key={player._id}
            style={{ backgroundColor: getCardColor(player.type) }} // Apply color coding
          >
            <img src={`http://localhost:3000/${player.image}`} alt={player.name} className="player-image" />
            <div className="player-info">
              <button className="player-button">{player.name}</button>
              <button className="player-button">{player.role}</button>
              <button className="player-button">{player.style}</button>
              <button className="player-button">₹ {player.basePrice}</button>
              <button className="player-button"> {player.currentBid || 'No bids yet'}</button>
              <button className="player-button">{player.currentBidder ? player.currentBidder.name : 'No bidder'}</button>
            </div>

            <div className={`status-box ${player.sold ? 'sold' : 'unsold'}`}>
              {player.sold ? 'Sold' : 'Unsold'}
            </div>

            {/* Remove "Place Bid" button if the player is sold */}
            {!player.sold && (
              <button
                className="bid-button"
                onClick={() => placeBid(player._id, player.currentBid)}
              >
                Place Bid
              </button>
            )}

            {/* Edit Button - Only visible if the user is an admin */}
            {isAdmin && (
              <button className="edit-button" onClick={() => openEditPopup(player)}>
                Edit
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="pagination">
        {Array.from({ length: Math.ceil(filteredPlayers.length / playersPerPage) }, (_, i) => (
          <button
            key={i + 1}
            className={`pagination-button ${currentPage === i + 1 ? 'active' : ''}`}
            onClick={() => paginate(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Edit Popup */}
      {/* Edit Popup */}
{editingPlayer && (
  <div className="edit-popup">
    <div className="edit-popup-content">
      <button className="close-button" onClick={closeEditPopup}>
        ✖
      </button>
      <h3>Edit Player</h3>
      <form onSubmit={handleEditSubmit}>
        {/* Name */}
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleEditChange}
          placeholder="Player Name"
          required
        />
        {/* Role */}
        <select
          name="role"
          value={formData.role}
          onChange={handleEditChange}
          required
        >
          <option value="Batsman">Batsman</option>
          <option value="Bowler">Bowler</option>
          <option value="All-Rounder">All-Rounder</option>
          <option value="Wicket-Keeper">Wicket Keeper</option>
        </select>
        {/* Style */}
        <select
          name="style"
          value={formData.style}
          onChange={handleEditChange}
          required
        >
          <option value="LHB">Left-Handed Bat (LHB)</option>
          <option value="RHB">Right-Handed Bat (RHB)</option>
        </select>
        {/* Base Price */}
        <input
          type="number"
          name="basePrice"
          value={formData.basePrice}
          onChange={handleEditChange}
          placeholder="Base Price"
          required
        />
        {/* Player Type */}
        <select
          name="playerType"
          value={formData.playerType}
          onChange={handleEditChange}
          required
        >
          <option value="Gold">Gold</option>
          <option value="Silver">Silver</option>
          <option value="Emerald">Emerald</option>
          <option value="Sapphire">Sapphire</option>
        </select>
        {/* File Upload */}
        <div className="file-input">
          <label htmlFor="image">Upload New Image</label>
          <input
            type="file"
            id="image"
            onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
          />
        </div>
        {/* Buttons */}
        <button type="submit">Save</button>
        <button type="button" onClick={closeEditPopup}>
          Cancel
        </button>
      </form>
    </div>
  </div>
)}

    </div>
  );
};

export default PlayerList;
