import React, { useEffect, useState } from "react";
import "../css/UserPurse.css"; // Custom CSS file
import { API_ENDPOINTS } from "../const";
import { FaWallet } from "react-icons/fa"; // Import Wallet Icon
const UserPursePage = () => {
  const [usersData, setUsersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_ENDPOINTS}/api/users/purses`);
        if (!response.ok) {
          throw new Error("Failed to fetch user purse data.");
        }
        const data = await response.json();
        setUsersData(data);
      } catch (err) {
        setError(err.message || "Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const getPlayerColor = (playerType) => {
    switch (playerType) {
      case "Sapphire":
        return "linear-gradient(135deg, #3a7bd5, #3a6073)";
      case "Gold":
        return "linear-gradient(135deg, #f7971e, #ffd200)";
      case "Emerald":
        return "linear-gradient(135deg, #56ab2f, #a8e063)";
      case "Silver":
        return "linear-gradient(135deg, #bdc3c7, #2c3e50)";
      default:
        return "linear-gradient(135deg, #d3d3d3, #8c8c8c)";
    }
  };

  if (loading) {
    return <div className="loading">Loading user data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="user-purse-page">
      <div className="page-header" style={{ textAlign: "center", marginTop: "20px" }}>
        <FaWallet
          style={{
            fontSize: "50px", // Make it bigger
            color: "#16a085", // Cool greenish color
            textShadow: "0px 4px 6px rgba(0, 0, 0, 0.3)", // Subtle shadow
            animation: "pop-in 0.5s ease-out", // Animation
          }}
        />
      </div>
      <div className="user-cards-container">
        {usersData.map((user, index) => (
          <div key={index} className="user-card">
            <h2 className="user-name">{user.userName}</h2>
            <p className="purse-value">
              Purse Remaining: <strong>₹{(user.purseValue / 10000000).toFixed(2)} Cr</strong>
            </p>
            <div className="players-container">
              {user.players
                .filter((player) => !player.isBidOn)
                .map((player, idx) => (
                  <div
                    key={idx}
                    className="player-card sold"
                    style={{
                      background: getPlayerColor(player.type),
                    }}
                  >
                    <h3 className="player-name">{player.name}</h3>
                    <p className="player-value">
                      Sold For: <strong>₹{(player.boughtValue / 10000000).toFixed(2)} Cr</strong>
                    </p>
                  </div>
                ))}

              {user.players.some((player) => player.isBidOn) && <hr className="divider" />}

              {user.players
                .filter((player) => player.isBidOn)
                .map((player, idx) => (
                  <div
                    key={idx}
                    className="player-card bidding"
                    style={{
                      animation: "blink 1s infinite",
                    }}
                  >
                    <h3 className="player-name">{player.name}</h3>
                    <p className="player-value">
                      Current Bid: <strong>₹{(player.biddingPrice / 10000000).toFixed(2)} Cr</strong>
                    </p>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserPursePage;
