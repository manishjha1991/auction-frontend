import React, { useEffect, useState } from "react";
import axios from "axios";
import "../css/PlayerList.css"; // Import CSS for styling

const PlayerList = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentBidPlayer, setCurrentBidPlayer] = useState(null); // Track player for bidding modal
  const [bidAmount, setBidAmount] = useState(""); // Bid amount input
  const [bidMessage, setBidMessage] = useState(""); // Track bid message for a player
  const [bidHistory, setBidHistory] = useState([]); // Track bid history for a player
  const [activeBidPlayerId, setActiveBidPlayerId] = useState(null); // Track active player for bidding

  const [loggedUser, setLoggedUser] = useState(null); // Store logged-in user details
  const playersPerPage = 4;

  useEffect(() => {
    // Fetch players from the backend
    axios
      .get("https://cpl.in.net/players") // Update as per your backend URL
      .then((response) => {
        setPlayers(response.data);
        setLoading(false);
      })
      .catch((error) => console.error("Error fetching players:", error));

    // Fetch user data from localStorage
   const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setLoggedUser(user);
      setIsAdmin(user.isAdmin);
    }
  }, []);
  useEffect(() => {
    // Determine active bid player for logged-in user
    const activePlayer = players.find(
      (player) => player.currentBidder && player.currentBidder.id === loggedUser?.id
    );
    setActiveBidPlayerId(activePlayer ? activePlayer._id : null);
  }, [players, loggedUser]);
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

  const closeEditPopup = () => {
    setEditingPlayer(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const form = new FormData();
      form.append("name", formData.name);
      form.append("role", formData.role);
      form.append("style", formData.style);
      form.append("basePrice", formData.basePrice);
      form.append("playerType", formData.playerType);

      if (formData.image) {
        form.append("image", formData.image);
      }

      const response = await axios.put(
        `https://cpl.in.net/players/${editingPlayer._id}`,
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Player updated successfully:", response.data);
      setPlayers(players.map((p) => (p._id === editingPlayer._id ? response.data : p)));
      closeEditPopup();
    } catch (error) {
      console.error("Error updating player:", error);
    }
  };

  const markAsSold = async (playerId) => {
    try {
      const response = await axios.put(`https://cpl.in.net/players/${playerId}/sold`);
      setPlayers(players.map((p) =>
        p._id === playerId ? { ...p, sold: true } : p
      ));
      console.log(response.data.message);
    } catch (error) {
      console.error("Error marking player as sold:", error);
    }
  };

  const openBidModal = async (player) => {
    if (activeBidPlayerId && activeBidPlayerId !== player._id) {
      setBidMessage("You can only bid on the player you last bid on. Click 'Out from Bidding' to switch.");
      return;
    }
    setCurrentBidPlayer(player);
    setBidAmount(""); // Reset bid amount

    // Fetch bid history for the player
    try {
      const response = await axios.get(`https://cpl.in.net/api/bids/${player._id}`);
      setBidHistory(response.data); // Set bid history
    } catch (error) {
      console.error("Error fetching bid history:", error);
    }
  };

  const closeBidModal = () => {
    setCurrentBidPlayer(null);
    setBidMessage("");
    setBidHistory([]); // Clear bid history on modal close
  };
  const handleOutFromBidding = async () => {
    try {
      await axios.put(`https://cpl.in.net/api/players/${activeBidPlayerId}/out`, {
        userId: loggedUser.id,
      });
      setActiveBidPlayerId(null); // Clear active bid player ID
      closeBidModal(); // Close bid modal if open
    } catch (error) {
      console.error("Error handling out from bidding:", error);
    }
  };
  const handlePlaceBid = async () => {
    const loggedUser = JSON.parse(localStorage.getItem("user"));
    if (!loggedUser) {
      setBidMessage("User not logged in. Please log in to place a bid.");
      return;
    }
    if (!bidAmount || isNaN(bidAmount) || bidAmount <= 0) {
      setBidMessage("Please enter a valid bid amount.");
      return;
    }

    const newBid = parseInt(bidAmount);
    if (newBid < currentBidPlayer.basePrice || newBid < currentBidPlayer.currentBid + 1000000) {
      setBidMessage("Your bid must be at least ₹10 Lakh higher than the current bid.");
      return;
    }

    try {
      setBidMessage("Submitting your bid...");
      // Send bid to the backend
      const response = await axios.put(`https://cpl.in.net/players/${currentBidPlayer._id}/bid`, {
        playerId: currentBidPlayer._id, // Include the player ID
        bidAmount: newBid,
        bidder: { id: loggedUser.id, name: loggedUser.name }, // Use actual logged-in user data
      });

      // Update the player list locally
      setPlayers(players.map((p) =>
        p._id === currentBidPlayer._id
          ? { ...p, currentBid: response.data.currentBid, currentBidder: response.data.currentBidder }
          : p
      ));

      setBidMessage("Your bid has been submitted successfully!");

      // Refresh bid history
      const updatedHistory = await axios.get(`https://cpl.in.net/api/bids/${currentBidPlayer._id}`);
      setBidHistory(updatedHistory.data);

      setTimeout(() => {
        closeBidModal(); // Close modal after success
      }, 2000);
    } catch (error) {
      setBidMessage(
        error.response && error.response.data && error.response.data.message
          ? error.response.data.message
          : "Error submitting your bid. Please try again."
      );
    }
  };

  const getCardColor = (playerType) => {
    switch (playerType) {
      case "Gold":
        return "#fff4cc"; // Gold color
      case "Silver":
        return "#e0e0e0"; // Silver color
      case "Emerald":
        return "#d1f2d1"; // Green color
      case "Sapphire":
        return "#cce4ff"; // Blue color
      default:
        return "#f5f5f5"; // Default light gray
    }
  };

  const filteredPlayers = players.filter((player) =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastPlayer = currentPage * playersPerPage;
  const indexOfFirstPlayer = indexOfLastPlayer - playersPerPage;
  const currentPlayers = filteredPlayers.slice(indexOfFirstPlayer, indexOfLastPlayer);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <p>Loading players...</p>;

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
            className={`player-card ${
              player.sold || (activeBidPlayerId && activeBidPlayerId !== player._id) ? "disabled" : ""
            }`}
            key={player._id}
            style={{ backgroundColor: getCardColor(player.type) }}
          >
            <img
              src={`http://localhost:3000/${player.image}`}
              alt={player.name}
              className="player-image"
            />
            <div className="player-info">
              <button className="player-button">{player.name}</button>
              <button className="player-button">{player.role}</button>
              <button className="player-button">{player.style}</button>
              <button className="player-button">₹ {player.basePrice}</button>
              <button className="player-button">
                {player.currentBid || "No bids yet"}
              </button>
              <button className="player-button">
              {player.currentBidder ? player.currentBidder.name : "No bidder"}
              </button>
            </div>

            <div className={`status-box ${player.sold ? "sold" : "unsold"}`}>
              {player.sold ? "Sold" : "Unsold"}
            </div>

            {/* Buttons */}
            <div className="card-buttons">
              {isAdmin && (
                <>
                  <button
                    className="edit-button-cool"
                    onClick={() => openEditPopup(player)}
                  >
                    Edit
                  </button>
                  <button
                    className="mark-as-sold-button"
                    onClick={() => markAsSold(player._id)}
                    disabled={player.sold}
                  >
                    {player.sold ? "Sold" : "Mark as Sold"}
                  </button>
                </>
              )}
              {/* {!player.sold && (
                <button
                  className="bid-button"
                  onClick={() => openBidModal(player)}
                >
                  Place Bid
                </button>
              )} */}
              <div className="card-buttons">
              {!player.sold && (
                 <>
                <button
                className="bid-button"
                onClick={() => openBidModal(player)}
                disabled={
                  (player.currentBidder && player.currentBidder.id === loggedUser?.id) || // Disable if logged user is current bidder
                  (activeBidPlayerId && activeBidPlayerId !== player._id) // Disable other cards
                }
              >
                Place Bid
              </button>
              {activeBidPlayerId !== player._id && (
                <button className="out-bid-button" onClick={handleOutFromBidding}>
                  Out from Bidding
                </button>
              )}
              </>
              )}
              
            </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Popup */}
      {editingPlayer && (
        <div className="edit-popup">
          <div className="edit-popup-content">
            <button className="close-button" onClick={closeEditPopup}>
              ✖
            </button>
            <h3>Edit Player</h3>
            <form onSubmit={handleEditSubmit}>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleEditChange}
                placeholder="Player Name"
                required
              />
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
              <select
                name="style"
                value={formData.style}
                onChange={handleEditChange}
                required
              >
                <option value="LHB">Left-Handed Bat (LHB)</option>
                <option value="RHB">Right-Handed Bat (RHB)</option>
              </select>
              <input
                type="number"
                name="basePrice"
                value={formData.basePrice}
                onChange={handleEditChange}
                placeholder="Base Price"
                required
              />
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
              <div className="file-input">
                <label htmlFor="image">Upload New Image</label>
                <input
                  type="file"
                  id="image"
                  onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                />
              </div>
              <div className="form-buttons">
                <button type="submit" className="save-button">Save</button>
                <button type="button" className="cancel-button" onClick={closeEditPopup}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bid Modal */}
      {currentBidPlayer && (
        <div className="bid-popup">
          <div className="bid-popup-content">
            <button className="close-button" onClick={closeBidModal}>
              ✖
            </button>
            <h3>Place Your Bid</h3>
            <p>Current Bid: ₹ {currentBidPlayer.currentBid || currentBidPlayer.basePrice}</p>
            <input
              type="number"
              placeholder="Enter your bid amount"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
            />
            <button className="submit-bid-button" onClick={handlePlaceBid}>
              Submit Bid
            </button>
            {bidMessage && <p className="bid-message">{bidMessage}</p>}

            {/* Display Bid History */}
            <div className="bid-history">
              <h4>Bid History</h4>
              {bidHistory.length > 0 ? (
                bidHistory.map((bid) => (
                  <div key={bid._id} className="bid-item">
                    <p>
                      ₹{bid.bidAmount} by {bid.bidder.name} at{" "}
                      {new Date(bid.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p>No bids yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="pagination">
        {Array.from(
          { length: Math.ceil(filteredPlayers.length / playersPerPage) },
          (_, i) => (
            <button
              key={i + 1}
              className={`pagination-button ${currentPage === i + 1 ? "active" : ""}`}
              onClick={() => paginate(i + 1)}
            >
              {i + 1}
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default PlayerList;
