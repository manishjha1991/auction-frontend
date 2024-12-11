import React, { useState, useEffect } from "react";
import { API_ENDPOINTS } from "../const";
import {
  SoldPlayersContainer,
  Title,
  SearchBar,
  FilterSelect,
  PlayerList,
  PlayerItem,
  Modal,
  Overlay,
  TabContainer,
  Tab,
  Form,
  StyledInput,
  StyledSelect,
  SubmitButton,
} from "../css/styles";

const SoldPlayers = () => {
  const [soldPlayers, setSoldPlayers] = useState([]);
  const [unsoldPlayers, setUnsoldPlayers] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [activeTab, setActiveTab] = useState("batting");
  const [battingData, setBattingData] = useState({ opponent: "", runs: "", balls: "" });
  const [bowlingData, setBowlingData] = useState({ opponent: "", runsGiven: "", ballsBowled: "" });
  const [isMom, setIsMom] = useState(false); // New state for MOM checkbox

  // Fetch players and users from the API
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const userId = user?.id;
        const response = await fetch(`${API_ENDPOINTS}/api/player-stats/list?userId=${userId}`);
        const data = await response.json();

        // Assuming data structure has soldPlayers and unsoldPlayers
        setSoldPlayers(data.soldPlayers || []);
        setUnsoldPlayers(data.unsoldPlayers || []);
        setUsers(data.soldPlayers.map((player) => player.team));
      } catch (error) {
        console.error("Error fetching player list:", error);
      }
    };

    fetchPlayers();
  }, []);

  const filteredPlayers = soldPlayers.filter(
    (player) =>
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (teamFilter === "" || player.team.userName === teamFilter)
  );

  const handlePlayerClick = (player) => {
    setSelectedPlayer(player);
    setBattingData({ opponent: "", runs: "", balls: "" });
    setBowlingData({ opponent: "", runsGiven: "", ballsBowled: "" });
    setIsMom(false); // Reset MOM checkbox
  };

  const handleSubmit = async () => {
    if (!selectedPlayer) return;

    const payload = {
      playerId: selectedPlayer.playerId,
      userId: selectedPlayer.team?.userId, // Updated to use userId
      opponentUserId: battingData.opponent || bowlingData.opponent,
      battingStats: battingData,
      bowlingStats: bowlingData,
      isMom, // Include MOM state
    };

    try {
      const response = await fetch(`${API_ENDPOINTS}/api/player-stats/store`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Player stats saved:", data);
        setSelectedPlayer(null);
      } else {
        console.error("Error saving player stats:", await response.json());
      }
    } catch (error) {
      console.error("Error submitting player stats:", error);
    }
  };

  return (
    <SoldPlayersContainer>
      <Title>Sold Players</Title>
      <SearchBar
        type="text"
        placeholder="Search by player name..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <FilterSelect
        value={teamFilter}
        onChange={(e) => setTeamFilter(e.target.value)}
      >
        <option value="">All Teams</option>
        {users.map((user, index) => (
          <option key={index} value={user.userName}>
            {user.teamName}
          </option>
        ))}
      </FilterSelect>
      <PlayerList>
        {filteredPlayers.map((player, index) => (
          <PlayerItem key={index}>
            <span onClick={() => handlePlayerClick(player)}>{player.name}</span>
          </PlayerItem>
        ))}
      </PlayerList>

      {selectedPlayer && (
        <>
          <Overlay onClick={() => setSelectedPlayer(null)} />
          <Modal>
            <h2 style={{ textAlign: "center", marginBottom: "20px" }}>{selectedPlayer.name}</h2>
            <TabContainer>
              <Tab active={activeTab === "batting"} onClick={() => setActiveTab("batting")}>Batting</Tab>
              <Tab active={activeTab === "bowling"} onClick={() => setActiveTab("bowling")}>Bowling</Tab>
            </TabContainer>

            {activeTab === "batting" && (
              <Form>
                <StyledSelect
                  value={battingData.opponent}
                  onChange={(e) => setBattingData({ ...battingData, opponent: e.target.value })}
                >
                  <option value="">Select Opponent</option>
                  {users
                    .filter((user) => user.userId !== selectedPlayer.team.userId) // Exclude the player's own team
                    .map((user, index) => (
                      <option key={index} value={user.userId}>
                        {user.teamName}
                      </option>
                    ))}
                </StyledSelect>
                <StyledInput
                  type="number"
                  placeholder="Total Runs"
                  value={battingData.runs}
                  onChange={(e) => setBattingData({ ...battingData, runs: e.target.value })}
                />
                <StyledInput
                  type="number"
                  placeholder="Total Balls"
                  value={battingData.balls}
                  onChange={(e) => setBattingData({ ...battingData, balls: e.target.value })}
                />
              </Form>
            )}

            {activeTab === "bowling" && (
              <Form>
                <StyledSelect
                  value={bowlingData.opponent}
                  onChange={(e) => setBowlingData({ ...bowlingData, opponent: e.target.value })}
                >
                  <option value="">Select Opponent</option>
                  {users
                    .filter((user) => user.userId !== selectedPlayer.team.userId) // Exclude the player's own team
                    .map((user, index) => (
                      <option key={index} value={user.userId}>
                        {user.teamName}
                      </option>
                    ))}
                </StyledSelect>
                <StyledInput
                  type="number"
                  placeholder="Runs Given"
                  value={bowlingData.runsGiven}
                  onChange={(e) => setBowlingData({ ...bowlingData, runsGiven: e.target.value })}
                />
                <StyledInput
                  type="number"
                  placeholder="Balls Bowled"
                  value={bowlingData.ballsBowled}
                  onChange={(e) => setBowlingData({ ...bowlingData, ballsBowled: e.target.value })}
                />
              </Form>
            )}

            <label>
              <input
                type="checkbox"
                checked={isMom}
                onChange={(e) => setIsMom(e.target.checked)}
              />
              Man of the Match
            </label>

            <SubmitButton onClick={handleSubmit}>Submit</SubmitButton>
          </Modal>
        </>
      )}
    </SoldPlayersContainer>
  );
};

export default SoldPlayers;