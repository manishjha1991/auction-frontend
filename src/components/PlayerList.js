import React, { useState, useEffect } from "react";
import "../css/PlayerList.css";
import PlayerPopup from "./PlayerPopup";
import { API_ENDPOINTS } from "../const";

const PlayerList = () => {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_ENDPOINTS}/api/players/data`, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setPlayers(data);
      } catch (err) {
        console.error("Failed to fetch players:", err);
        setError("Failed to load players. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const handlePlayerClick = (player) => {
    setSelectedPlayer(player);
  };

  const handleClosePopup = () => {
    setSelectedPlayer(null);
  };

  const formatBasePrice = (price) => {
    const value = Number(price);
    if (value >= 10000000) return `${(value / 10000000).toFixed(2)} CR`;
    if (value >= 100000) return `${(value / 100000).toFixed(2)} Lakh`;
    return `${(value / 1000).toFixed(2)} K`;
  };

  const sortedPlayers = [...players]
  .filter((player) =>
    player.name.toLowerCase().includes(search.toLowerCase())
  )
  .sort((a, b) => {
    switch (sortOption) {
      case "Sold":
        return a.status === "Sold" && b.status !== "Sold" ? -1 : b.status === "Sold" && a.status !== "Sold" ? 1 : 0;

      case "Unsold":
        return a.status !== "Sold" && b.status === "Sold" ? -1 : b.status !== "Sold" && a.status === "Sold" ? 1 : 0;

      case "Type":
        return a.type.localeCompare(b.type);

      case "Bidding":
        // Prioritize players with a non-empty currentBidder
        if (a.currentBidder && !b.currentBidder) return -1;
        if (!a.currentBidder && b.currentBidder) return 1;
        return 0; // If both have or don't have currentBidder, keep order unchanged

      default:
        const maxA = Math.max(a.biddingPrice || 0, a.basePrice || 0);
        const maxB = Math.max(b.biddingPrice || 0, b.basePrice || 0);
        return maxB - maxA;
    }
  });



  const getRoleIcon = (role) => {
    switch (role.toLowerCase()) {
      case "batsman":
        return "🏌️";
      case "bowler":
        return "🏐";
      case "wicketkeeper":
        return "🧤";
      case "allrounder":
        return "🏏";
      default:
        return "🏏";
    }
  };

  const getStatusIcon = (player) => {
    if (player.status === "Sold") {
      return (
        <span>
          🏆 <b style={{ color: "red" }}>Sold to {player.teamName}</b>
        </span>
      );
    } else if (player.currentBidder !== "N/A" && player.currentBidder) {
      return (
        <span style={{ color: "#000000", fontWeight: "bold" }}>
          💰 Bidding is On
        </span>
      );
    } else {
      return (
        <span>
          ✅ <b>Available</b>
        </span>
      );
    }
  };

  const shouldBlink = (player) => {
    const biddingPrice = player.biddingPrice || player.basePrice || 0;
    return (
      player.currentBidder &&
      biddingPrice > 100000000 &&
      player.status !== "Sold"
    );
  };

  if (loading) {
    return <div className="loading">Loading players...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="player-list">
      <div className="list-header">
        <div className="right-actions">
          <div className="search-wrapper">
            {!showSearch && (
              <button
                className="search-icon"
                onClick={() => setShowSearch(true)}
              >
                🔍
              </button>
            )}
            {showSearch && (
              <input
                type="text"
                placeholder="Search players..."
                className="search-bar-small"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onBlur={() => setShowSearch(false)}
                autoFocus
              />
            )}
          </div>

          <select
            className="sort-dropdown-small"
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="">Sort</option>
            <option value="Sold">Sold</option>
            <option value="Unsold">Unsold</option>
            <option value="Type">Type</option>
            <option value="Bidding">Bidding is On</option>
          </select>
        </div>
      </div>

      <div className="player-grid">
        {sortedPlayers.map((player) => (
          <div
            key={player.id}
            className={`player-row ${player.type.toLowerCase()} ${
              shouldBlink(player) ? "blinking" : ""
            }`}
            onClick={() => handlePlayerClick(player)}
          >
            <div className="player-cell player-icon">{getRoleIcon(player.role)}</div>
            <div className="player-cell">{player.name}</div>
            <div className="player-cell player-price">
              {formatBasePrice(player.biddingPrice || player.basePrice || 0)}
            </div>
            <div className="player-cell team-sold">{getStatusIcon(player)}</div>
          </div>
        ))}
      </div>

      {selectedPlayer && (
        <PlayerPopup
          player={selectedPlayer}
          onClose={handleClosePopup}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};

export default PlayerList;
