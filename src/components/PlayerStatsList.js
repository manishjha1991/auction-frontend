import React, { useState, useEffect } from 'react';
import { FaBowlingBall } from 'react-icons/fa';
import { MdSportsCricket } from 'react-icons/md';
import { GiGloves } from 'react-icons/gi'; // Icon for wicketkeeper
import '../css/PlayerStatsList.css';
import { API_ENDPOINTS } from "../const";

const PlayerStatsList = () => {
  // Initialize current user only once
  const [currentUser] = useState(() => JSON.parse(localStorage.getItem("user")));
  
  const [expandedPlayer, setExpandedPlayer] = useState(null);
  const [activeTab, setActiveTab] = useState("batting");
  const [players, setPlayers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [allTeams, setAllTeams] = useState([]);
  const [submitMessage, setSubmitMessage] = useState('');
  const [formData, setFormData] = useState({
    battingRuns: '',
    battingBalls: '',
    bowlingRunsGiven: '',
    bowlingBallsBowled: '',
    wicketsTaken: '', // NEW FIELD for wickets taken
    opponentUserId: '',
    isMom: false,
  });

  // Fetch players (only once on mount)
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const userId = currentUser?.id;
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
            id: player._id || `player-${index}`,
            name: player.name || "Unknown Player",
            type: player.type,
            role: player.role, // Expected: "Batsman", "Bowler", "Allrounder", "WicketKeeper"
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
  }, []); // Empty dependency array: runs only once

  // Fetch teams from your teams API
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS}/api/users/teams`);
        if (response.ok) {
          const data = await response.json();
          console.log("Teams API Response:", data);
          setAllTeams(data.teams || []);
        } else {
          console.error("Failed to fetch teams");
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };

    fetchTeams();
  }, []);

  // Open modal for a player; reset edit mode and form data.
  const openModal = (playerName) => {
    setExpandedPlayer(playerName);
    setActiveTab("batting");
    setIsEditing(false);
    setSubmitMessage('');
    setFormData({
      battingRuns: '',
      battingBalls: '',
      bowlingRunsGiven: '',
      bowlingBallsBowled: '',
      wicketsTaken: '', // Reset new field
      opponentUserId: '',
      isMom: false,
    });
  };

  // Close the modal and reset edit mode.
  const closeModal = () => {
    setExpandedPlayer(null);
    setIsEditing(false);
  };

  const toggleTab = (tab) => {
    setActiveTab(tab);
  };

  // Find the selected player from the players array.
  const selectedPlayer = players.find((player) => player.name === expandedPlayer);

  // Handle changes in the form inputs.
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle form submission that calls the store API.
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const userId = currentUser?.id;
      if (!userId) {
        setSubmitMessage("User not found!");
        return;
      }

      const payload = {
        playerId: selectedPlayer.id,
        userId,
        opponentUserId: formData.opponentUserId,
        battingStats: {
          runs: Number(formData.battingRuns),
          balls: Number(formData.battingBalls),
        },
        bowlingStats: {
          runsGiven: Number(formData.bowlingRunsGiven),
          ballsBowled: Number(formData.bowlingBallsBowled),
        },
        // Add extra field "wicketsTaken"
        wicketsTaken: Number(formData.wicketsTaken),
        isMom: formData.isMom,
      };

      const res = await fetch(`${API_ENDPOINTS}/api/player-stats/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        setSubmitMessage("Stats saved successfully!");
      } else {
        setSubmitMessage("Error saving stats.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitMessage("Error submitting form.");
    }
  };

  return (
    <div className="player-list-wrapper">
      <h2 style={{ textAlign: "center", color: "#1565c0", fontWeight: "bold" }}>
        Player Stats
      </h2>
      <div className="player-cards-container">
        {players.map((player) => (
          <div
            className="player-card"
            key={player.name}
            onClick={() => openModal(player.name)}
          >
            <div className="player-details">
              <div className="player-icon">
                {player.role === "WicketKeeper" ? (
                  <GiGloves style={{ color: "#4caf50", fontSize: "1.2rem" }} />
                ) : player.role === "Bowler" ? (
                  <FaBowlingBall style={{ color: "#ff5722", fontSize: "1.2rem" }} />
                ) : (
                  <MdSportsCricket style={{ color: "#1e88e5", fontSize: "1.2rem" }} />
                )}
              </div>
              <h3 className="player-name">{player.name}</h3>
            </div>
            <div className="player-stats">
              <div className="icon-with-text color-batting">
                <MdSportsCricket /> {player.totalStats.batting.runs}{" "}
                <span style={{ fontWeight: "bold" }}></span>
              </div>
              <div className="icon-with-text color-bowling">
                <FaBowlingBall /> {player.totalStats.bowling.wickets}{" "}
                <span style={{ fontWeight: "bold" }}></span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {expandedPlayer && selectedPlayer && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Super Sexy Edit Button */}
            <button
              className="modal-edit-btn"
              onClick={() => setIsEditing(true)}
            >
              ✎ Edit Stats
            </button>
            <button className="modal-close-btn" onClick={closeModal}>
              &times;
            </button>
            <h2>{selectedPlayer.name}</h2>
            {isEditing ? (
              <form onSubmit={handleFormSubmit} className="stats-form">
                <div className="form-group">
                  <label>Batting Runs:</label>
                  <input
                    type="number"
                    name="battingRuns"
                    value={formData.battingRuns}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Batting Balls:</label>
                  <input
                    type="number"
                    name="battingBalls"
                    value={formData.battingBalls}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Bowling Runs Given:</label>
                  <input
                    type="number"
                    name="bowlingRunsGiven"
                    value={formData.bowlingRunsGiven}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Bowling Balls Bowled:</label>
                  <input
                    type="number"
                    name="bowlingBallsBowled"
                    value={formData.bowlingBallsBowled}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                {/* New field: Wickets Taken */}
                <div className="form-group">
                  <label>Wickets Taken:</label>
                  <input
                    type="number"
                    name="wicketsTaken"
                    value={formData.wicketsTaken}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                {/* Opponent Team Dropdown */}
                <div className="form-group">
                  <label>Opponent Team:</label>
                  <select
                    name="opponentUserId"
                    value={formData.opponentUserId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Opponent Team</option>
                    {allTeams
                      .filter(team => team.teamName !== currentUser.teamName)
                      .map(team => (
                        <option key={team._id} value={team._id}>
                          {team.teamName}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      name="isMom"
                      checked={formData.isMom}
                      onChange={handleInputChange}
                    />{" "}
                    Man of the Match?
                  </label>
                </div>
                <button type="submit" className="form-submit-btn">
                  Save Stats
                </button>
                {submitMessage && <p className="submit-message">{submitMessage}</p>}
              </form>
            ) : (
              <>
                <div className="tab-wrapper">
                  <button
                    className={`tab ${activeTab === "batting" ? "active" : ""}`}
                    onClick={() => toggleTab("batting")}
                  >
                    BAT
                  </button>
                  <button
                    className={`tab ${activeTab === "bowling" ? "active" : ""}`}
                    onClick={() => toggleTab("bowling")}
                  >
                    BOWL
                  </button>
                </div>
                {activeTab === "batting" && (
                  <div className="match-grid">
                    {selectedPlayer.matchPerformance.batting.length > 0 ? (
                      selectedPlayer.matchPerformance.batting.map((match, index) => (
                        <div className="match-stat" key={index}>
                          <strong>
                            {match.match} (vs {match.against})
                          </strong>
                          <p>Runs: {match.runs}</p>
                          <p>Balls: {match.balls}</p>
                          {match.mom && <p style={{ color: "#ff5722" }}>MOM</p>}
                        </div>
                      ))
                    ) : (
                      <p>No batting stats available.</p>
                    )}
                  </div>
                )}
                {activeTab === "bowling" && (
                  <div className="match-grid">
                    {selectedPlayer.matchPerformance.bowling.length > 0 ? (
                      selectedPlayer.matchPerformance.bowling.map((match, index) => (
                        <div className="match-stat" key={index}>
                          <strong>
                            {match.match} (vs {match.against})
                          </strong>
                          <p>Overs: {match.overs}</p>
                          <p>Wickets: {match.wickets}</p>
                          <p>Runs: {match.runs}</p>
                          {match.mom && <p style={{ color: "#ff5722" }}>MOM</p>}
                        </div>
                      ))
                    ) : (
                      <p>No bowling stats available.</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerStatsList;
