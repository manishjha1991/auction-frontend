import React, { useEffect, useState } from "react";
import styled from "styled-components";
import axios from "axios";
import { API_ENDPOINTS } from "../const";

const FixtureWrapper = styled.div`
  margin: 2rem auto;
  max-width: 1200px;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
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
    color: ${(props) => (props.isWinner ? "white" : props.isLoser ? "white" : "#495057")};
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
    gap: 0.5rem; /* Optional for spacing */
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

const Select = styled.select`
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
const Fixtures = () => {
  const [fixtures, setFixtures] = useState([]);
  const [filteredFixtures, setFilteredFixtures] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentFixture, setCurrentFixture] = useState(null);
  const [winner, setWinner] = useState("");
  const [margin, setMargin] = useState("");
  const [mom, setMom] = useState({ name: "", score: 0, wickets: 0 });
  const [team1Score, setTeam1Score] = useState("");
  const [team2Score, setTeam2Score] = useState("");
  const [players, setPlayers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

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
    fetchFixtures();
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = fixtures.filter(
      (fixture) =>
        fixture.team1.toLowerCase().includes(query) ||
        fixture.team2.toLowerCase().includes(query)
    );

    setFilteredFixtures(filtered);
  };

  const handleWinnerChange = (selectedTeam) => {
    setWinner(selectedTeam);
    const playersList =
      selectedTeam === currentFixture.team1
        ? currentFixture.team1Details?.players || []
        : currentFixture.team2Details?.players || [];
    setPlayers(playersList.map((player) => player.name)); // Extract player names
  };

  const handleEditFixture = (fixture) => {
    setCurrentFixture(fixture);
    setWinner(fixture.winner || "");
    setMargin(fixture.margin || "");
    setMom(fixture.mom || { name: "", score: 0, wickets: 0 });
    setTeam1Score(fixture.team1Score || "");
    setTeam2Score(fixture.team2Score || "");
    setPlayers([]);
    setShowModal(true);
  };

  const handleSaveFixture = async () => {
    try {
      const updatedFixture = {
        ...currentFixture,
        winner,
        margin,
        team1Score,
        team2Score,
        mom,
      };

      await axios.post(`${API_ENDPOINTS}/api/fixtures/save`, updatedFixture);

      setFixtures((prevFixtures) =>
        prevFixtures.map((fixture) =>
          fixture._id === currentFixture._id ? updatedFixture : fixture
        )
      );

      setFilteredFixtures((prevFixtures) =>
        prevFixtures.map((fixture) =>
          fixture._id === currentFixture._id ? updatedFixture : fixture
        )
      );

      setShowModal(false);
      alert("Fixture updated successfully!");
    } catch (error) {
      console.error("Error saving fixture:", error);
      alert("Failed to save fixture.");
    }
  };

  return (
    <FixtureWrapper>
      <h2>Fixtures</h2>
      <SearchBar
        type="text"
        placeholder="Search by team name"
        value={searchQuery}
        onChange={handleSearch}
      />
      {filteredFixtures.map((fixture, index) => (
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
                    {fixture.winner === fixture.team1 && fixture.margin && (
                      <MarginText>(Won by {fixture.margin})</MarginText>
                    )}
                  </div>
                  <div className="score">{fixture.team1Score || "TBD"}</div>
                </TeamBox>
              </>
            )}
          </MatchDetails>

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
              <EditButton onClick={() => handleEditFixture(fixture)}>Edit</EditButton>
            </div>
          )}
        </FixtureCard>
      ))}


      {showModal && (
        <ModalWrapper>
          <ModalContent>
            <h3>Edit Fixture</h3>
            <Select value={winner} onChange={(e) => handleWinnerChange(e.target.value)}>
              <option value="">Select Winner</option>
              <option value={currentFixture.team1}>{currentFixture.team1}</option>
              <option value={currentFixture.team2}>{currentFixture.team2}</option>
            </Select>
            <Input
              type="text"
              placeholder="Margin"
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
            />
            <Input
              type="text"
              placeholder="Team 1 Score"
              value={team1Score}
              onChange={(e) => setTeam1Score(e.target.value)}
            />
            <Input
              type="text"
              placeholder="Team 2 Score"
              value={team2Score}
              onChange={(e) => setTeam2Score(e.target.value)}
            />
            <Select
              value={mom.name}
              onChange={(e) => setMom({ ...mom, name: e.target.value })}
            >
              <option value="">Select Man of the Match</option>
              {players.map((player) => (
                <option key={player} value={player}>
                  {player}
                </option>
              ))}
            </Select>
            <Input
              type="number"
              placeholder="MoM Score"
              value={mom.score}
              onChange={(e) => setMom({ ...mom, score: Number(e.target.value) })}
            />
            <Input
              type="number"
              placeholder="MoM Wickets"
              value={mom.wickets}
              onChange={(e) => setMom({ ...mom, wickets: Number(e.target.value) })}
            />
            <SubmitButton onClick={handleSaveFixture}>Save</SubmitButton>
            <CloseButton onClick={() => setShowModal(false)}>Close</CloseButton>
          </ModalContent>
        </ModalWrapper>
      )}
    </FixtureWrapper>
  );
};

export default Fixtures;
