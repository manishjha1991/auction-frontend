import React, { useState, useEffect } from "react";
import "../css/PlayerList.css";
import PlayerPopup from "./PlayerPopup";
import { API_ENDPOINTS } from "../const";
import { FaWallet } from "react-icons/fa"; // Wallet Icon

const SoldPlayers = () => {
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSoldPlayers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_ENDPOINTS}/api/players/data`, {
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        setPlayers(data.filter((player) => player.status === "Sold"));
      } catch (err) {
        console.error("Failed to fetch sold players:", err);
        setError("Failed to load sold players. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchSoldPlayers();
  }, []);

  const handlePlayerClick = (player) => setSelectedPlayer(player);
  const handleClosePopup = () => setSelectedPlayer(null);

  const formatBasePrice = (price) => {
    const value = Number(price);
    if (value >= 10000000) return `${(value / 10000000).toFixed(2)} CR`;
    if (value >= 100000) return `${(value / 100000).toFixed(2)} Lakh`;
    return `${(value / 1000).toFixed(2)} K`;
  };

  const getTypeColor = (type) => {
    switch (type.toLowerCase()) {
      case "gold":
        return "#FFD700";
      case "silver":
        return "#C0C0C0";
      case "emerald":
        return "#50C878";
      case "sapphire":
        return "#0F52BA";
      default:
        return "#BDBDBD";
    }
  };

  if (loading) return <div className="loading">Loading sold players...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="sold-players-container" style={{ padding: "20px" }}>
      <h2
        style={{
          textAlign: "center",
          fontSize: "28px",
          marginBottom: "20px",
          background: "linear-gradient(to right, #ff7eb3, #ff758c)",
          WebkitBackgroundClip: "text",
          color: "transparent",
          fontWeight: "bold",
        }}
      >
        🎉 Sold Players 🎉
      </h2>

      <div
        className="player-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "15px",
        }}
      >
        {players.map((player) => (
          <div
            key={player.id}
            className="player-card"
            style={{
              maxWidth: "180px",
              backgroundColor: getTypeColor(player.type),
              borderRadius: "10px",
              position: "relative",
              boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
              padding: "10px",
              textAlign: "center",
              cursor: "pointer",
              transition: "transform 0.3s ease",
            }}
            onClick={() => handlePlayerClick(player)}
            onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {/* Sold Banner */}
            <div
              style={{
                position: "absolute",
                top: "8px",
                right: "-10px",
                backgroundColor: "#ff4b5c",
                color: "#fff",
                padding: "5px 8px",
                borderRadius: "8px 0 0 8px",
                fontSize: "12px",
                fontWeight: "bold",
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              }}
            >
              🏠 {player.teamName || "N/A"}
            </div>

            {/* Player Name */}
            <h3
              style={{
                margin: "10px 0 5px",
                fontSize: "16px",
                fontWeight: "bold",
                color: "#fff",
                textTransform: "capitalize",
              }}
            >
              ✨ {player.name} ✨
            </h3>

            {/* Wallet Icon and Price */}
            <p
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                color: "#f9f9f9",
                fontWeight: "bold",
                gap: "5px",
                marginTop: "10px",
              }}
            >
              <FaWallet style={{ color: "#2ecc71" }} />{" "}
              {formatBasePrice(player.biddingPrice || player.basePrice)}
            </p>
          </div>
        ))}
      </div>

      {/* Player Popup */}
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

export default SoldPlayers;
