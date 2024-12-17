import React, { useState, useEffect } from "react";
import "../css/PlayerList.css";
import PlayerPopup from "./PlayerPopup";
import { API_ENDPOINTS } from "../const";

const PlayerList = () => {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
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
    .filter((player) => (roleFilter ? player.role.toLowerCase() === roleFilter.toLowerCase() : true))
    .sort((a, b) => {
      switch (sortOption) {
        case "Sold":
          return a.status === "Sold" && b.status !== "Sold" ? -1 : b.status === "Sold" && a.status !== "Sold" ? 1 : 0;

        case "Unsold":
          return a.status !== "Sold" && b.status === "Sold" ? -1 : b.status !== "Sold" && a.status === "Sold" ? 1 : 0;

        case "Type":
          return a.type.localeCompare(b.type);

        case "Bidding":
          if (a.currentBidder && !b.currentBidder) return -1;
          if (!a.currentBidder && b.currentBidder) return 1;
          return 0;

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

        </span>
      );
    } else
      if (player.currentBidder !== "N/A" && player.currentBidder) {
        return (
          <span style={{ color: "#000000", fontWeight: "bold" }}>
            🎯 Bidding is On
          </span>
        );
      } else {
        return (
          <span className="flash-available">
            💎 <b>Available</b>
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
        <div
          className="search-wrapper"
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "20px",
            marginLeft: "50px"
          }}
        >
          {!showSearch && (
            <button
              className="search-icon"
              onClick={() => setShowSearch(true)}
              style={{
                padding: "6px 10px",
                fontSize: "14px",
                borderRadius: "8px",
                backgroundColor: "#007bff",
                color: "#fff",
                cursor: "pointer",
                border: "none",
              }}
            >
              🔍 Search
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
              style={{
                padding: "6px 10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "14px",

              }}
            />
          )}
        </div>

        <div
          className="filter-sort-wrapper"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <select
            className="filter-dropdown-small super-cool-filter"
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "14px",
              backgroundColor: "#f8f9fa",
            }}
          >
            <option value="">Filter by Role</option>
            <option value="Batsman">🏌️ Batsman</option>
            <option value="Bowler">🏐 Bowler</option>
            <option value="Allrounder">🏏 Allrounder</option>
            <option value="WicketKeeper">🧤 WicketKeeper</option>
          </select>

          <select
            className="sort-dropdown-small"
            onChange={(e) => setSortOption(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "14px",
              background: "linear-gradient(90deg, #ff9a9e, #fad0c4)",
              color: "#fff",
              width: "25px"
            }}
          >
            <option value="">🎲 Sort</option>
            <option value="Sold">✨ Sold</option>
            <option value="Unsold">🛒 Unsold</option>
            <option value="Type">📋 Type</option>
            <option value="Bidding">🎯 Bidding is On</option>
          </select>
        </div>
      </div>
      <div className="player-grid">
        {sortedPlayers.map((player) => {
          if (player.status === "Sold") return null; // Don't render if the player is sold

          return (
            <div
              key={player.id}
              className={`player-row ${player.type.toLowerCase()} ${shouldBlink(player) ? "blinking" : ""
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
          );
        })}

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