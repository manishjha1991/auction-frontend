import React, { useEffect, useState } from "react";
import styled from "styled-components";
import axios from "axios";
import ReactSelect from "react-select"; // <-- 1) Import react-select
import { API_ENDPOINTS } from "../const";
import PlayoffFixtures from "./PlayoffFixtures";

// We rename the existing styled Select component to StyledSelect:
const StyledSelect = styled.select`
  width: 90%;
  margin: 0.5rem 0;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 5px;
`;

const FairnessTag = styled.div`
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.3rem 0.6rem;
  border-radius: 5px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #fff;
  background: ${(props) => {
    if (!props.fairness) return "#6c757d"; // default if no fairness
    if (props.fairness > 7) return "#28a745"; // greenish
    if (props.fairness > 4) return "#ffc107"; // yellowish
    return "#dc3545"; // red
  }};
`;

// Tab styles
const TabContainer = styled.div`
  margin: 2rem auto;
  max-width: 1200px;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const TabHeader = styled.div`
  display: flex;
  background: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
`;

const TabButton = styled.button`
  flex: 1;
  padding: 1rem;
  background: ${props => props.active ? '#007bff' : 'transparent'};
  color: ${props => props.active ? '#ffffff' : '#6c757d'};
  border: none;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  
  &:hover {
    background: ${props => props.active ? '#007bff' : '#e9ecef'};
  }
  
  @media (max-width: 600px) {
    padding: 0.8rem 0.5rem;
    font-size: 0.8rem;
  }
`;

const FixtureWrapper = styled.div`
  padding: 1rem;
  background: #f8f9fa;
`;

const SearchBar = styled.input`
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1rem;
`;

const FixtureCard = styled.div`
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  margin-bottom: 1rem;
  padding: ${(props) => (props.hasMom ? "1rem" : "0.5rem")};
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const MatchHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
  font-weight: bold;
  color: #495057;

  .match-number {
    color: #007bff;
  }
`;

const MatchDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: ${(props) => (props.hasMom ? "center" : "flex-start")};
  margin-top: 0.5rem;
  flex-direction: ${(props) => (props.hasMom ? "row" : "column")};

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const TeamBox = styled.div`
  flex: 1;
  text-align: ${(props) => (props.hasMom ? "left" : "center")};
  display: flex;
  align-items: center;
  justify-content: ${(props) => (props.hasMom ? "flex-start" : "center")};
  margin: ${(props) => (props.hasMom ? "0.5rem 0" : "0")};

  .team-name {
    font-size: 1.2rem;
    font-weight: bold;
    color: ${(props) =>
      props.isWinner ? "green" : props.isLoser ? "red" : "#343a40"};
  }

  .score {
    font-size: 1rem;
    margin-left: ${(props) => (props.hasMom ? "1rem" : "0")};
    color: ${(props) =>
      props.isWinner ? "white" : props.isLoser ? "white" : "#495057"};
    background-color: ${(props) =>
      props.isWinner ? "green" : props.isLoser ? "red" : "#f8f9fa"};
    padding: 0.5rem;
    border-radius: 8px;
    display: inline-block;
    min-width: 60px;
    text-align: center;
  }
`;

const MomDetails = styled.div`
  margin-top: 0.5rem;
  padding: 0.8rem;
  background: #e9ecef;
  border-radius: 8px;
  text-align: center;

  .mom-header,
  .mom-info {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: #6c757d;
    text-align: center;
  }

  .mom-header {
    font-weight: bold;
    color: #495057;
  }
`;

const EditButton = styled.button`
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 0.5rem 1rem;
  cursor: pointer;

  &:hover {
    background: #0056b3;
  }
`;

const ModalWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background: #fff;
  padding: 2rem;
  border-radius: 10px;
  width: 400px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  text-align: center;
`;

const Input = styled.input`
  width: 90%;
  margin: 0.5rem 0;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 5px;
`;

const SubmitButton = styled.button`
  background: #28a745;
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 0.5rem 1rem;
  margin-top: 1rem;

  &:hover {
    background: #218838;
  }
`;

const CloseButton = styled.button`
  background: #dc3545;
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 0.5rem 1rem;
  margin-top: 1rem;

  &:hover {
    background: #c82333;
  }
`;

const MarginText = styled.span`
  font-size: 0.85rem;
  color: #6c757d;
  font-weight: 400;
  margin-left: 0.5rem;
`;

// Abbreviation helper for fairness display
const getAbbreviation = (name) => {
  if (!name) return "UNK";
  return name.slice(0, 3).toUpperCase();
};

const Fixtures = () => {
  const [fixtures, setFixtures] = useState([]);
  const [filteredFixtures, setFilteredFixtures] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentFixture, setCurrentFixture] = useState(null);
  const [teams, setTeams] = useState([]);
  const [groupFilter, setGroupFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [mode, setMode] = useState('overall');
  const [top6Teams, setTop6Teams] = useState([]);

  // Using empty strings here so placeholder shows up until user enters something
  const [winner, setWinner] = useState("");
  const [margin, setMargin] = useState("");
  const [mom, setMom] = useState({ name: "", score: "", wickets: "" });
  const [team1Score, setTeam1Score] = useState("");
  const [team2Score, setTeam2Score] = useState("");
  const [players, setPlayers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Using empty strings so "Fairness" fields show placeholders initially
  const [team1Fairness, setTeam1Fairness] = useState("");
  const [team2Fairness, setTeam2Fairness] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setIsAdmin(user?.isAdmin === true);

    const fetchFixtures = async () => {
      try {
        const response = await axios.get(`${API_ENDPOINTS}/api/fixtures`);
        const sortedFixtures = response.data.sort((a, b) => {
          if (a.winner && !b.winner) return -1;
          if (!a.winner && b.winner) return 1;
          return new Date(a.date) - new Date(b.date);
        });
        setFixtures(sortedFixtures);
        setFilteredFixtures(sortedFixtures);
      } catch (error) {
        console.error("Error fetching fixtures:", error);
      }
    };
    const fetchTeams = async () => {
      try {
        const t = await axios.get(`${API_ENDPOINTS}/api/users/teams`);
        setTeams(t.data?.teams || []);
      } catch {}
    };
    const fetchMode = async () => {
      try {
        const settings = await axios.get(`${API_ENDPOINTS}/api/settings`);
        const pmode = settings?.data?.pointsMode || 'overall';
        setMode(pmode);
      } catch (error) {
        console.error("Error fetching mode:", error);
      }
    };
    const fetchTop6Teams = async () => {
      try {
        const response = await axios.get(`${API_ENDPOINTS}/api/users/points-table`);
        const teams = response.data.filter(team => team.teamName !== "NA");
        const sortedTeams = teams.sort((a, b) => {
          const pointsA = Number(a.points) || 0;
          const pointsB = Number(b.points) || 0;
          if (pointsB !== pointsA) return pointsB - pointsA;
          const fairnessA = Number(a.fairness) || 0;
          const fairnessB = Number(b.fairness) || 0;
          return fairnessB - fairnessA;
        });
        setTop6Teams(sortedTeams.slice(0, 6));
      } catch (error) {
        console.error("Error fetching top 6 teams:", error);
      }
    };
    fetchFixtures();
    fetchTeams();
    fetchMode();
    fetchTop6Teams();
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = fixtures.filter(
      (fixture) =>
        fixture.team1.toLowerCase().includes(query) ||
        fixture.team2.toLowerCase().includes(query)
    );
    setFilteredFixtures(applyGroupFilter(filtered, groupFilter));
  };

  const getGroupForTeam = (teamName) => {
    const team = teams.find(t => t.teamName === teamName);
    return team?.group || null;
  };

  const applyGroupFilter = (list, filter) => {
    if (filter === 'all') return list;
    return list.filter(fx => {
      const g1 = getGroupForTeam(fx.team1);
      const g2 = getGroupForTeam(fx.team2);
      if (filter === 'A') return g1 === 'A' && g2 === 'A';
      if (filter === 'B') return g1 === 'B' && g2 === 'B';
      return true;
    });
  };

  useEffect(() => {
    setFilteredFixtures(applyGroupFilter(fixtures, groupFilter));
  }, [fixtures, groupFilter]);

  const handleWinnerChange = (selectedTeam) => {
    setWinner(selectedTeam);
    // If you still want to maintain "players" for any reason,
    // you can combine both teams' details or keep existing logic:
    const playersList =
      selectedTeam === currentFixture?.team1
        ? currentFixture?.team1Details?.players || []
        : currentFixture?.team2Details?.players || [];
    setPlayers(playersList.map((player) => player.name));
  };

  const handleEditFixture = (fixture) => {
    setCurrentFixture(fixture);

    // Populate fields with existing values or empty strings
    setWinner(fixture.winner || "");
    setMargin(fixture.margin || "");
    setTeam1Score(fixture.team1Score || "");
    setTeam2Score(fixture.team2Score || "");

    // Convert numeric fields to string so placeholders can show up
    setMom({
      name: fixture.mom?.name || "",
      score: fixture.mom?.score?.toString() || "",
      wickets: fixture.mom?.wickets?.toString() || "",
    });

    setTeam1Fairness(
      fixture.team1Fairness ? fixture.team1Fairness.toString() : ""
    );
    setTeam2Fairness(
      fixture.team2Fairness ? fixture.team2Fairness.toString() : ""
    );

    setPlayers([]);
    setShowModal(true);
  };

  const handleSaveFixture = async () => {
    try {
      // Convert string inputs back to numbers safely
      const updatedMom = {
        ...mom,
        score: mom.score ? Number(mom.score) : 0,
        wickets: mom.wickets ? Number(mom.wickets) : 0,
      };

      const updatedFixture = {
        ...currentFixture,
        winner,
        margin,
        team1Score,
        team2Score,
        mom: updatedMom,
        team1Fairness: team1Fairness ? Number(team1Fairness) : 0,
        team2Fairness: team2Fairness ? Number(team2Fairness) : 0,
      };

      await axios.post(`${API_ENDPOINTS}/api/fixtures/save`, updatedFixture);

      setFixtures((prevFixtures) =>
        prevFixtures.map((fx) =>
          fx._id === currentFixture._id ? updatedFixture : fx
        )
      );

      setFilteredFixtures((prevFixtures) =>
        prevFixtures.map((fx) =>
          fx._id === currentFixture._id ? updatedFixture : fx
        )
      );

      setShowModal(false);
      alert("Fixture updated successfully!");
    } catch (error) {
      console.error("Error saving fixture:", error);
      alert("Failed to save fixture.");
    }
  };

  // Combine both teams' players for the Mom dropdown (with search)
  // We'll build this array whenever we render the modal.
  let playerOptions = [];
  if (currentFixture) {
    const allPlayers = [
      ...(currentFixture.team1Details?.players || []),
      ...(currentFixture.team2Details?.players || []),
    ];
    playerOptions = allPlayers.map((p) => ({
      value: p.name,
      label: p.name,
    }));
  }

  return (
    <TabContainer>
      <TabHeader>
        <TabButton 
          active={activeTab === 'all'} 
          onClick={() => setActiveTab('all')}
        >
          All Fixtures
        </TabButton>
        {mode === 'groups' && (
          <>
            <TabButton 
              active={activeTab === 'groupA'} 
              onClick={() => setActiveTab('groupA')}
            >
              Group A
            </TabButton>
            <TabButton 
              active={activeTab === 'groupB'} 
              onClick={() => setActiveTab('groupB')}
            >
              Group B
            </TabButton>
          </>
        )}
        <TabButton 
          active={activeTab === 'playoffs'} 
          onClick={() => setActiveTab('playoffs')}
        >
          Playoffs
        </TabButton>
      </TabHeader>
      
      <FixtureWrapper>
        <h2>Fixtures</h2>
        <SearchBar
          type="text"
          placeholder="Search by team name"
          value={searchQuery}
          onChange={handleSearch}
        />
        
                {/* Show group filter buttons only when in group mode and on specific group tabs */}
        {mode === 'groups' && (activeTab === 'groupA' || activeTab === 'groupB') && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button 
              className={`btn ${groupFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`} 
              onClick={() => setGroupFilter('all')}
            >
              All
            </button>
            <button 
              className={`btn ${groupFilter === 'A' ? 'btn-primary' : 'btn-ghost'}`} 
              onClick={() => setGroupFilter('A')}
            >
              Group A
            </button>
            <button 
              className={`btn ${groupFilter === 'B' ? 'btn-primary' : 'btn-ghost'}`} 
              onClick={() => setGroupFilter('B')}
            >
              Group B
            </button>
          </div>
        )}

        {/* Show fixtures based on active tab */}
        {activeTab === 'playoffs' ? (
          <PlayoffFixtures top6Teams={top6Teams} />
        ) : (
          filteredFixtures.map((fixture, index) => (
        <FixtureCard key={fixture._id} hasMom={!!fixture.mom?.name}>
          <MatchHeader>
            <div className="match-number">
              T20 {index + 1} of {filteredFixtures.length}
            </div>
            <div className="match-date">{fixture.date || ""}</div>
          </MatchHeader>

          <MatchDetails hasMom={!!fixture.mom?.name}>
            {Number(fixture.team1Score || 0) >= Number(fixture.team2Score || 0) ? (
              <>
                <TeamBox
                  isWinner={fixture.winner === fixture.team1}
                  isLoser={fixture.winner === fixture.team2}
                  hasMom={!!fixture.mom?.name}
                >
                  <div className="team-name">
                    {fixture.team1}
                    {getGroupForTeam(fixture.team1) ? (
                      <span style={{ marginLeft: '6px', fontSize: '0.72rem', color: '#0d6efd', background: 'rgba(13,110,253,0.08)', border: '1px solid rgba(13,110,253,0.2)', padding: '2px 6px', borderRadius: '999px' }}>
                        G{getGroupForTeam(fixture.team1)}
                      </span>
                    ) : null}
                    {fixture.winner === fixture.team1 && fixture.margin && (
                      <MarginText>(Won by {fixture.margin})</MarginText>
                    )}
                  </div>
                  <div className="score">{fixture.team1Score || "TBD"}</div>
                </TeamBox>
                <TeamBox
                  isWinner={fixture.winner === fixture.team2}
                  isLoser={fixture.winner === fixture.team1}
                  hasMom={!!fixture.mom?.name}
                >
                  <div className="team-name">
                    {fixture.team2}
                    {getGroupForTeam(fixture.team2) ? (
                      <span style={{ marginLeft: '6px', fontSize: '0.72rem', color: '#20c997', background: 'rgba(32,201,151,0.08)', border: '1px solid rgba(32,201,151,0.2)', padding: '2px 6px', borderRadius: '999px' }}>
                        G{getGroupForTeam(fixture.team2)}
                      </span>
                    ) : null}
                    {fixture.winner === fixture.team2 && fixture.margin && (
                      <MarginText>(Won by {fixture.margin})</MarginText>
                    )}
                  </div>
                  <div className="score">{fixture.team2Score || "TBD"}</div>
                </TeamBox>
              </>
            ) : (
              <>
                <TeamBox
                  isWinner={fixture.winner === fixture.team2}
                  isLoser={fixture.winner === fixture.team1}
                  hasMom={!!fixture.mom?.name}
                >
                  <div className="team-name">
                    {fixture.team2}
                    {getGroupForTeam(fixture.team2) ? (
                      <span style={{ marginLeft: '6px', fontSize: '0.72rem', color: '#20c997', background: 'rgba(32,201,151,0.08)', border: '1px solid rgba(32,201,151,0.2)', padding: '2px 6px', borderRadius: '999px' }}>
                        G{getGroupForTeam(fixture.team2)}
                      </span>
                    ) : null}
                    {fixture.winner === fixture.team2 && fixture.margin && (
                      <MarginText>(Won by {fixture.margin})</MarginText>
                    )}
                  </div>
                  <div className="score">{fixture.team2Score || "TBD"}</div>
                </TeamBox>
                <TeamBox
                  isWinner={fixture.winner === fixture.team1}
                  isLoser={fixture.winner === fixture.team2}
                  hasMom={!!fixture.mom?.name}
                >
                  <div className="team-name">
                    {fixture.team1}
                    {getGroupForTeam(fixture.team1) ? (
                      <span style={{ marginLeft: '6px', fontSize: '0.72rem', color: '#0d6efd', background: 'rgba(13,110,253,0.08)', border: '1px solid rgba(13,110,253,0.2)', padding: '2px 6px', borderRadius: '999px' }}>
                        G{getGroupForTeam(fixture.team1)}
                      </span>
                    ) : null}
                    {fixture.winner === fixture.team1 && fixture.margin && (
                      <MarginText>(Won by {fixture.margin})</MarginText>
                    )}
                  </div>
                  <div className="score">{fixture.team1Score || "TBD"}</div>
                </TeamBox>
              </>
            )}
          </MatchDetails>

          {/* Show both teams' fairness on the same line */}
          <div
            style={{
              marginTop: "0.5rem",
              textAlign: "left",
              display: "flex",
              gap: "1rem",
            }}
          >
            <div>
              <strong>{getAbbreviation(fixture.team1)}:&nbsp;</strong>
              <FairnessTag fairness={fixture.team1Fairness}>
                {fixture.team1Fairness || "N/A"}
              </FairnessTag>
            </div>
            <div>
              <strong>{getAbbreviation(fixture.team2)}:&nbsp;</strong>
              <FairnessTag fairness={fixture.team2Fairness}>
                {fixture.team2Fairness || "N/A"}
              </FairnessTag>
            </div>
          </div>

          {fixture.mom?.name && (
            <MomDetails>
              <div className="mom-header">
                <span>Name</span>
                <span>Run</span>
                <span>Wkt</span>
              </div>
              <div className="mom-info">
                <span>{fixture.mom.name}</span>
                <span>{fixture.mom.score}</span>
                <span>{fixture.mom.wickets}</span>
              </div>
            </MomDetails>
          )}
          {isAdmin && (
            <div style={{ textAlign: "right", marginTop: "1rem" }}>
              <EditButton onClick={() => handleEditFixture(fixture)}>
                Edit
              </EditButton>
            </div>
          )}
        </FixtureCard>
      ))
        )}

      {showModal && (
        <ModalWrapper>
          <ModalContent>
            <h3>Edit Fixture</h3>

            {/* Winner selection (unchanged, now uses StyledSelect) */}
            <StyledSelect
              value={winner}
              onChange={(e) => handleWinnerChange(e.target.value)}
            >
              <option value="">Select Winner</option>
              <option value={currentFixture?.team1}>
                {currentFixture?.team1}
              </option>
              <option value={currentFixture?.team2}>
                {currentFixture?.team2}
              </option>
            </StyledSelect>

            <Input
              type="text"
              placeholder="Margin (e.g. 5 runs or 2 wickets)"
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
            />
            <Input
              type="text"
              placeholder={`Team 1 Score (${currentFixture?.team1})`}
              value={team1Score}
              onChange={(e) => setTeam1Score(e.target.value)}
            />
            <Input
              type="text"
              placeholder={`Team 2 Score (${currentFixture?.team2})`}
              value={team2Score}
              onChange={(e) => setTeam2Score(e.target.value)}
            />

            {/* New searchable dropdown with both teams' players */}
            <ReactSelect
              placeholder="Select Man of the Match"
              value={
                playerOptions.find((opt) => opt.value === mom.name) || null
              }
              onChange={(selectedOption) =>
                setMom({ ...mom, name: selectedOption?.value || "" })
              }
              options={playerOptions}
              isClearable
            />

            <Input
              type="number"
              placeholder="Batting Score"
              value={mom.score}
              onChange={(e) => setMom({ ...mom, score: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Bowling Wickets"
              value={mom.wickets}
              onChange={(e) => setMom({ ...mom, wickets: e.target.value })}
            />

            <Input
              type="number"
              placeholder={`Fairness for ${currentFixture?.team1}`}
              value={team1Fairness}
              onChange={(e) => setTeam1Fairness(e.target.value)}
            />
            <Input
              type="number"
              placeholder={`Fairness for ${currentFixture?.team2}`}
              value={team2Fairness}
              onChange={(e) => setTeam2Fairness(e.target.value)}
            />

            <SubmitButton onClick={handleSaveFixture}>Save</SubmitButton>
            <CloseButton onClick={() => setShowModal(false)}>Close</CloseButton>
          </ModalContent>
        </ModalWrapper>
      )}
      </FixtureWrapper>
    </TabContainer>
  );
};

export default Fixtures;
