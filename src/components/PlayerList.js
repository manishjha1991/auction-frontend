import React, { useState, useEffect } from "react";
import "../css/PlayerList.css";
import PlayerPopup from "./PlayerPopup";

const PlayerList = () => {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); // Toggle this to test admin mode
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:3000/api/players/data", {
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
      if (sortOption === "Sold") return a.status === "Sold" ? -1 : 1;
      if (sortOption === "Unsold") return a.status === "Unsold" ? -1 : 1;
      if (sortOption === "Type") return a.type.localeCompare(b.type);
      return 0;
    });

  const getRoleIcon = (role) => {
    switch (role.toLowerCase()) {
      case "batsman":
        return "🏌️"; // Bat icon
      case "bowler":
        return "🏐"; // Cricket ball icon
      case "wicketkeeper":
        return "🧤"; // Glove icon
      case "allrounder":
        return "🏏"; // Bat and ball icon
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
        <span>
          💰 <b>Bidding is On</b>
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
          </select>
        </div>
      </div>

      <div className="player-grid">
        {sortedPlayers.map((player) => (
          <div
            key={player.id}
            className={`player-row ${player.type.toLowerCase()}`}
            onClick={() => handlePlayerClick(player)}
          >
            <div className="player-cell player-icon">{getRoleIcon(player.role)}</div>
            <div className="player-cell">{player.name}</div>
            <div className="player-cell player-price">
              {formatBasePrice(player.basePrice)}
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
