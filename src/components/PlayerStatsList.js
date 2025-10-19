import React, { useState, useEffect } from 'react';
import { FaBowlingBall } from 'react-icons/fa';
import { MdSportsCricket } from 'react-icons/md';
import { GiGloves } from 'react-icons/gi'; // Icon for wicketkeeper
import '../css/PlayerStatsList.css';
import { API_ENDPOINTS } from "../const";

const PlayerStatsList = () => {
  // Initialize current user only once
  const [currentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      return null;
    }
  });

  const [expandedPlayer, setExpandedPlayer] = useState(null);
  const [activeTab, setActiveTab] = useState("batting");
  const [players, setPlayers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [allTeams, setAllTeams] = useState([]);
  const [submitMessage, setSubmitMessage] = useState('');

  // NEW: Local state for the search term
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    battingRuns: '',
    battingBalls: '',
    bowlingRunsGiven: '',
    bowlingBallsBowled: '',
    wicketsTaken: '', // NEW FIELD for wickets taken
    opponentUserId: '',
    isMom: false,
    isPlayoffScore:false,
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
            role: player.role, // "Batsman", "Bowler", "Allrounder", "WicketKeeper", etc.
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
          // The API returns an array directly, not wrapped in a teams property
          const teamsArray = Array.isArray(data) ? data : [];
          console.log("Setting teams array:", teamsArray);
          setAllTeams(teamsArray);
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
      wicketsTaken: '',
      opponentUserId: '',
      isMom: false,
      isPlayoffScore:false,
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
    setFormData((prev) => ({
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
        isPlayoffScore: formData.isPlayoffScore,
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

  // FILTER the players by the search term:
  const filteredPlayers = players.filter((player) =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="player-list-wrapper">
      <h2 style={{ textAlign: "center", color: "#1565c0", fontWeight: "bold" }}>
        Player Stats
      </h2>

      {/* NEW: Search Bar */}
      <div className="search-bar-container">
        <input
          type="text"
          className="player-search-input"
          placeholder="Search Player..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="player-cards-container">
        {filteredPlayers.map((player) => (
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
                <MdSportsCricket /> {player.totalStats.batting.runs}
              </div>
              <div className="icon-with-text color-bowling">
                <FaBowlingBall /> {player.totalStats.bowling.wickets}
              </div>
            </div>
          </div>
        ))}
      </div>

      {expandedPlayer && selectedPlayer && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{selectedPlayer.name}</h2>
              <button className="modal-close-btn" onClick={closeModal}>
                &times;
              </button>
            </div>
            
            {!isEditing && (
              <button
                className="modal-edit-btn"
                onClick={() => setIsEditing(true)}
              >
                ✎ Edit Stats
              </button>
            )}
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
                    {(() => {
                      console.log("Rendering teams dropdown:");
                      console.log("allTeams:", allTeams);
                      console.log("currentUser:", currentUser);
                      console.log("selectedPlayer:", selectedPlayer);
                      
                      const filteredTeams = allTeams.filter(team => {
                        // 1) Exclude the current user's team.
                        if (currentUser && team.teamName === currentUser.teamName) return false;

                        // 2) Exclude the team that actually owns this player.
                        //    (Only if 'ownerTeamName' is different from currentUser.)
                        //    If the player is owned by the same user, we're already filtering above.
                        if (selectedPlayer && team.teamName === selectedPlayer.ownerTeamName) return false;

                        return true;
                      });
                      
                      console.log("Filtered teams:", filteredTeams);
                      return filteredTeams.map(team => (
                        <option key={team._id} value={team._id}>
                          {team.teamName}
                        </option>
                      ));
                    })()}
                  </select>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isMom"
                      checked={formData.isMom}
                      onChange={handleInputChange}
                    />{" "}
                    Man of the Match?
                  </label>
                </div>
                <div className="form-group checkbox-group">
                  <label className="checkbox-label playoff-checkbox">
                    <input
                      type="checkbox"
                      name="isPlayoffScore"
                      checked={formData.isPlayoffScore}
                      onChange={handleInputChange}
                    />{' '}
                    Playoff Score
                  </label>
                </div>

                <div className="form-buttons">
                  <button 
                    type="button" 
                    className="form-cancel-btn"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="form-submit-btn">
                    Save Stats
                  </button>
                </div>
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
