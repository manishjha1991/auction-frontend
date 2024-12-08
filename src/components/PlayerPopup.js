import React, { useState, useEffect } from "react";
import "../css/PlayerPopup.css";
import { FaClock } from "react-icons/fa";

const PlayerPopup = ({ player, onClose, isAdmin }) => {
  const [playerDetails, setPlayerDetails] = useState(null);
  const [topTwoBids, setTopTwoBids] = useState([]);
  const [allBids, setAllBids] = useState([]);
  const [timer, setTimer] = useState("");
  const [lastBidTimer, setLastBidTimer] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [placingBid, setPlacingBid] = useState(false);
  const [bidError, setBidError] = useState(null);

  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3000/api/player/${player.id}/bids`, {
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
  const parseHumanReadableAmount = (amount) => {
    if (typeof amount === "string") {
      if (amount.toLowerCase().includes("lakh")) {
        return parseFloat(amount) * 100000; // Convert "lakh" to numerical value
      } else if (amount.toLowerCase().includes("crore")) {
        return parseFloat(amount) * 10000000; // Convert "crore" to numerical value
      } else if (amount.toLowerCase().includes("thousand")) {
        return parseFloat(amount) * 1000; // Convert "thousand" to numerical value
      }
    }
    return parseFloat(amount); // Return as-is if already numeric
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
  
      // Convert last bid amount and base price if in human-readable format
      const lastBidAmount = topTwoBids.length > 0
        ? parseHumanReadableAmount(topTwoBids[0]?.bidAmount || 0) // Convert last bid
        : parseHumanReadableAmount(playerDetails?.basePrice || 0); // Convert base price
  
      const bidAmount = lastBidAmount + 1000000; // Add ₹10,00,000
      console.log("Calculated Bid Amount:", bidAmount);
  
      const payload = {
        bidAmount,
        bidder: bidderId,
      };
      console.log("Payload:", payload);
  
      const response = await fetch(`http://localhost:3000/api/bids/${playerDetails.id}/bid`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        throw new Error(`Failed to place bid: ${response.status}`);
      }
  
      const result = await response.json();
      console.log("Bid placed successfully:", result);
  
      setAllBids([...allBids, result.newBid]);
    } catch (err) {
      console.error("Failed to place bid:", err);
      setBidError("Failed to place bid. Please try again.");
    } finally {
      setPlacingBid(false);
    }
  };
  
  
  

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
              <b>Base Price:</b> <span>{playerDetails.basePrice}</span>
            </p>
            <p>
              <span className="player-detail-icon">💎</span>
              <b>Type:</b> <span>{playerDetails.type}</span>
            </p>
          </div>

          {topTwoBids.length > 0 && !isSold && (
            <div className="bids-section">
              <h3>Last Two Bids</h3>
              {topTwoBids.map((bid, index) => (
                <div key={bid.id} className="bid-row">
                  <p>
                    <b>Bidder:</b> {bid.bidder.name} <span className="bid-amount">{bid.bidAmount}</span>
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

          {!isSold && (
            <div className="place-bid-section">
              <h3>Place a Bid</h3>
              <button
                className="user-btn place-bid"
                onClick={handlePlaceBid}
                disabled={placingBid}
              >
                {placingBid ? "Placing..." : "Place Bid (₹10,00,000)"}
              </button>
              {bidError && <p className="error">{bidError}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerPopup;
