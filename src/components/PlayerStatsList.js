import React, { useState, useEffect } from 'react';
import { FaBowlingBall, FaBaseballBall } from 'react-icons/fa';
import { MdSportsCricket } from 'react-icons/md';
import '../css/PlayerStatsList.css';
import { API_ENDPOINTS } from "../const";
const PlayerStatsList = () => {
  const [expandedPlayer, setExpandedPlayer] = useState(null);
  const [activeTab, setActiveTab] = useState("batting");

  const [players, setPlayers] = useState([]);
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const userId = user?.id;

        if (!userId) {
          console.error("User ID not found in localStorage");
          return;
        }
        // Fetch data from API
        const response = await fetch(
          `${API_ENDPOINTS}/api/player-stats/list?userId=${userId}`,
          { method: "GET" }
        );

        if (response.ok) {
          const data = await response.json();
          console.log("API Response:", data);

          // Map fetched data into the desired format
          const formattedPlayers = data.players.map((player, index) => ({
            id: player.playerId || `player-${index}`, // Use playerId or fallback to a generated ID
            name: player.name || "Unknown Player",
            matchPerformance: {
              batting: player.matchPerformance?.batting || [],
              bowling: player.matchPerformance?.bowling || [],
            },
            totalStats: {
              batting: { runs: player.totalStats?.batting?.runs || 0 },
              bowling: { wickets: player.totalStats?.bowling?.wickets || 0 },
            },
          }));
          setPlayers(formattedPlayers);
        } else {
          console.error("Failed to fetch player stats");
        }
      } catch (error) {
        console.error("Error fetching player stats:", error);
      }
    };

    fetchPlayers();
  }, []);


  const toggleDetails = (playerName) => {
    setExpandedPlayer(expandedPlayer === playerName ? null : playerName);
  };

  const toggleTab = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="player-list-wrapper">
      <h2 style={{ textAlign: "center", color: "#1565c0", fontWeight: "bold" }}>Player Stats</h2>
      {players.map((player) => (
        <div
          className="player-card"
          key={player.name}
          onClick={() => toggleDetails(player.name)}
        >
          <div className="player-details">
            <div className="player-icon">
              <FaBaseballBall />
            </div>
            <h3 className="player-name">{player.name}</h3>
          </div>
          <div className="player-stats">
            <div className="icon-with-text color-batting">
              <MdSportsCricket /> {player.totalStats.batting.runs}
            </div>
            <div className="icon-with-text color-bowling">
              <FaBowlingBall /> {player.totalStats.bowling.wickets}
            </div>
          </div>
        </div>
      ))}
      {expandedPlayer && (
        <div className="expanded-details">
          <div className="tab-wrapper">
            <button
              className={`tab ${activeTab === "batting" ? "active" : ""}`}
              onClick={() => toggleTab("batting")}
            >
              Batting
            </button>
            <button
              className={`tab ${activeTab === "bowling" ? "active" : ""}`}
              onClick={() => toggleTab("bowling")}
            >
              Bowling
            </button>
          </div>
          {activeTab === "batting" && (
            <div className="match-grid">
              {players
                .find((player) => player.name === expandedPlayer)
                .matchPerformance.batting.map((match, index) => (
                  <div className="match-stat" key={index}>
                    <strong>{match.match} (vs {match.against})</strong>
                    <p>Runs: {match.runs}</p>
                    <p>Balls: {match.balls}</p>
                    {match.mom && <p style={{ color: "#ff5722" }}>MOM</p>}
                  </div>
                ))}
            </div>
          )}
          {activeTab === "bowling" && (
            <div className="match-grid">
              {players
                .find((player) => player.name === expandedPlayer)
                .matchPerformance.bowling.map((match, index) => (
                  <div className="match-stat" key={index}>
                    <strong>{match.match} (vs {match.against})</strong>
                    <p>Overs: {match.overs}</p>
                    <p>Wickets: {match.wickets}</p>
                    <p>Runs: {match.runs}</p>
                    {match.mom && <p style={{ color: "#ff5722" }}>MOM</p>}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerStatsList;
