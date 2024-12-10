import React, { useState, useEffect } from "react";
import "../css/PlayerPopup.css";
import { FaClock } from "react-icons/fa";
import { API_ENDPOINTS } from "../const";
const PlayerPopup = ({ player, onClose }) => {
  const [playerDetails, setPlayerDetails] = useState(null);
  const [topTwoBids, setTopTwoBids] = useState([]);
  const [allBids, setAllBids] = useState([]);
  const [timer, setTimer] = useState("");
  const [setLastBidTimer] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exitMessage, setExitMessage] = useState(null);
  const [placingBid, setPlacingBid] = useState(false);
  const [bidError, setBidError] = useState(null);
  const [soldMessage, setSoldMessage] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [releaseMessage, setReleaseMessage] = useState(null);
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setIsAdmin(user?.isAdmin === true);
  }, []);
  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_ENDPOINTS}/api/player/${player.id}/bids`, {
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setPlayerDetails(data.player);
        setTopTwoBids(data.topTwoBids);
        setAllBids(data.allBids);
      } catch (err) {
        console.error("Failed to fetch player details:", err);
        setError("Failed to load player details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [player.id]);

  useEffect(() => {
    if (playerDetails && allBids.length > 0 && !playerDetails.status === "Sold") {
      const endTime = new Date();
      endTime.setHours(endTime.getHours() + 72);

      const interval = setInterval(() => {
        const currentTime = new Date();
        const timeRemaining = Math.max(0, endTime - currentTime);
        const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
        setTimer(`${hours}h ${minutes}m ${seconds}s`);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [playerDetails, allBids]);

  useEffect(() => {
    if (topTwoBids.length > 0 && !playerDetails?.status === "Sold") {
      const lastBidEndTime = new Date();
      lastBidEndTime.setHours(lastBidEndTime.getHours() + 48);

      const lastBidInterval = setInterval(() => {
        const currentTime = new Date();
        const timeRemaining = Math.max(0, lastBidEndTime - currentTime);
        const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
        setLastBidTimer(`${hours}h ${minutes}m ${seconds}s`);
      }, 1000);

      return () => clearInterval(lastBidInterval);
    }
  }, [topTwoBids, playerDetails]);
  const formatHumanReadableAmount = (amount) => {
    if (amount >= 10000000) {
      return `${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `${(amount / 100000).toFixed(2)} Lakh`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(2)} Thousand`;
    }
    return amount.toString();
  };
  const handleReleasePlayer = async () => {
    try {
      setReleaseMessage(null);

      const response = await fetch(`${API_ENDPOINTS}/api/bids/release-player`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerId: player.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to release player.");
      }

      setReleaseMessage(result.message || "Player released successfully.");
    } catch (err) {
      setReleaseMessage(err.message || "Failed to release player. Please try again.");
    }
  };
  const handleMarkAsSold = async () => {
    try {
      setSoldMessage(null);

      const response = await fetch(`${API_ENDPOINTS}/api/bids/bid/sold`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerID: player.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to mark player as sold.");
      }

      setSoldMessage(result.message || "Player marked as sold successfully.");
    } catch (err) {
      setSoldMessage(err.message || "Failed to mark player as sold. Please try again.");
    }
  };
  const determineBidIncrement = (playerType, lastBidAmount) => {
    if (playerType === "Sapphire" || playerType === "Gold" || playerType === "Emerald") {
      return 5000000; // ₹50,00,000
    } else if (playerType === "Silver" && lastBidAmount >= 10000000) {
      return 5000000; // ₹50,00,000 if last bid amount is ₹1 Cr or more
    } else if (playerType === "Silver") {
      return 1000000; // ₹10,00,000 for Silver otherwise
    }
    return 1000000; // Default increment
  };
  const handlePlaceBid = async () => {
    try {
      setPlacingBid(true);
      setBidError(null);

      const user = JSON.parse(localStorage.getItem("user"));
      const bidderId = user?.id;

      if (!bidderId) {
        throw new Error("Bidder ID not found in local storage.");
      }
      const lastBidAmount =
        topTwoBids.length > 0 ? topTwoBids[0]?.bidAmount || 0 : playerDetails?.basePrice || 0;

      // Determine the bid increment based on player type and last bid amount
      const bidIncrement = determineBidIncrement(playerDetails?.type, lastBidAmount);

      // Calculate the bid amount
      const bidAmount = lastBidAmount + bidIncrement;
      console.log("Calculated Bid Amount:", bidAmount);

      const payload = {
        bidAmount,
        bidder: bidderId,
      };
      console.log("Payload:", payload);

      const response = await fetch(`${API_ENDPOINTS}/api/bids/${playerDetails.id}/bid`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      // Check if the API responded with a success or failure
      if (!response.ok) {
        throw new Error(result.message || "Failed to place bid.");
      }

      // On success, update the message and state
      setExitMessage(result.message || "Bid placed successfully.");
      setAllBids([...allBids, result.newBid]);
    } catch (err) {
      // Display the error message from the server or a default error
      setExitMessage(err.message || "Failed to place bid.");
    } finally {
      setPlacingBid(false);
    }
  };


  const handleExitAuction = async () => {
    try {
      setExitMessage(null); // Reset the message toggle

      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.id;

      if (!userId) {
        throw new Error("User ID not found in local storage.");
      }

      const response = await fetch(`${API_ENDPOINTS}/api/bids/${player.id}/exit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to exit auction.");
      }

      setExitMessage(result.message || "Successfully exited the auction.");
    } catch (err) {

      setExitMessage(err.message || "Failed to exit the auction. Please try again.");
    }
  };

  if (loading) {
    return <div className="loading">Loading player details...</div>;
  }
  if (error) {
    return <div className="error">{error}</div>;
  }



  if (loading) {
    return <div className="loading">Loading player details...</div>;
  }
  if (error) {
    return <div className="error">{error}</div>;
  }

  const isSold = playerDetails?.status === true;

  return (
    <div className="popup-overlay">
      <div className={`popup-card elegant-card ${playerDetails.type.toLowerCase()}`}>
        <button className="close-btn" onClick={onClose}>✖</button>
        <div className="scrollable-content">
          <img
            src={`https://via.placeholder.com/150?text=${playerDetails.name}`}
            alt={playerDetails.name}
            className="player-image"
          />
          <h2 className="player-name">{playerDetails.name}</h2>

          <div className="player-details">
            <p>
              <span className="player-detail-icon">🧑‍🎤</span>
              <b>Name:</b> <span>{playerDetails.name}</span>
            </p>
            <p>
              <span className="player-detail-icon">🏏</span>
              <b>Role:</b> <span>{playerDetails.role}</span>
            </p>
            <p>
              <span className="player-detail-icon">✋</span>
              <b>Batting Style:</b> <span>{playerDetails.battingStyle || "N/A"}</span>
            </p>
            <p>
              <span className="player-detail-icon">📊</span>
              <b>Overall Score:</b> <span>{playerDetails.score || "N/A"}</span>
            </p>
            <p>
              <span className="player-detail-icon">💰</span>
              <b>Base Price:</b> <span>{formatHumanReadableAmount(playerDetails.basePrice)}</span>
            </p>
            <p>
              <span className="player-detail-icon">💎</span>
              <b>Type:</b> <span>{playerDetails.type}</span>
            </p>
          </div>

          {topTwoBids.length > 0 && (
            <div className="bids-section">
              <h3>Last Two Bids</h3>
              {topTwoBids.map((bid, index) => (
                <div key={bid.id} className="bid-row">
                  <p>
                    <b>Bidder:</b>{" "}
                    <span className="bidder-name">
                      {bid.isBidOn === false && <span className="bid-out-text">Out</span>}{" "}
                      {bid.bidder.name}
                    </span>
                    <span className="bid-amount">{formatHumanReadableAmount(bid.bidAmount)}</span>
                  </p>
                  <p className="bid-time">
                    <FaClock className="timer-icon" /> Last Bid Time:{" "}
                    {new Date(bid.createdAt).toLocaleString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true,
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}


          {allBids.length > 0 && !isSold && (
            <div className="timer-section">
              <p><b>Overall Timer:</b> {timer}</p>
            </div>
          )}

          {!isAdmin && !isSold && (
            <div className="place-bid-section">
              <h3>Place a Bid</h3>
              <button
                className="user-btn place-bid"
                onClick={handlePlaceBid}
                disabled={placingBid}
              >
                {placingBid
                  ? "Placing..."
                  : `Place Bid (₹${formatHumanReadableAmount(
                    determineBidIncrement(playerDetails?.type,
                      topTwoBids.length > 0
                        ? topTwoBids[0]?.bidAmount || 0
                        : playerDetails?.basePrice || 0)
                  )})`}
              </button>
              {bidError && <p className="error">{bidError}</p>}
            </div>
          )}
          {isAdmin && !isSold && (
            <div className="sold-button-section">
              <button
                className="sold-btn"
                onClick={handleMarkAsSold}
                style={{
                  padding: "10px 20px",
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "#fff",
                  backgroundColor: "linear-gradient(to right, #ff416c, #ff4b2b)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                SOLD
              </button>
              {soldMessage && <p className="sold-message">{soldMessage}</p>}
            </div>
          )}
          {isAdmin && isSold && (
            <div className="release-button-section">
              <button
                className="release-btn"
                onClick={handleReleasePlayer}
                style={{
                  padding: "12px 25px",
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#fff",
                  background: "linear-gradient(to right, #4CAF50, #8BC34A)",
                  border: "none",
                  borderRadius: "12px",
                  boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
                  cursor: "pointer",
                  transition: "transform 0.2s, background 0.3s",
                }}
                onMouseOver={(e) => {
                  e.target.style.background = "linear-gradient(to right, #8BC34A, #4CAF50)";
                  e.target.style.transform = "scale(1.05)";
                }}
                onMouseOut={(e) => {
                  e.target.style.background = "linear-gradient(to right, #4CAF50, #8BC34A)";
                  e.target.style.transform = "scale(1)";
                }}
              >
                RELEASE PLAYER
              </button>
              {releaseMessage && <p className="release-message">{releaseMessage}</p>}
            </div>
          )}
          {exitMessage && (
            <div className="exit-message">
              <p>{exitMessage}</p>
            </div>
          )}

          {!isAdmin && !isSold && (
            <div className="exit-auction-section">
              <button className="unique-exit-btn" onClick={handleExitAuction}>
                Exit Auction 🚪
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerPopup;
