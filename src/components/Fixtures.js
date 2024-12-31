import React, { useEffect, useState } from "react";
import styled from "styled-components";
import axios from "axios";
import { API_ENDPOINTS } from "../const";
import LoadingCube from "./CricketAnimation"; // Import the reusable component
const Input = styled.input`
  width: 90%;
  margin: 0.5rem 0;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 5px;
`;

const FixtureWrapper = styled.div`
  margin: 2rem auto;
  max-width: 1200px;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
`;

const FixtureTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 1rem;
  margin-top: 1rem;

  th,
  td {
    border: 1px solid #dee2e6;
    padding: 1rem;
    text-align: center;
  }

  th {
    background: #343a40;
    color: #fff;
  }

  tr:nth-child(even) {
    background: #f1f3f5;
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

const Fixtures = () => {
  const [fixtures, setFixtures] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentFixture, setCurrentFixture] = useState(null);
  const [winner, setWinner] = useState("");
  const [margin, setMargin] = useState("");
  const [mom, setMom] = useState({ name: "", score: 0, wickets: 0 });
  const [team1Score, setTeam1Score] = useState("");
  const [team2Score, setTeam2Score] = useState("");
  const [players, setPlayers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true); // New loading state

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setIsAdmin(user?.isAdmin === true);

    const fetchFixtures = async () => {
      try {
        const fixtureResponse = await axios.get(`${API_ENDPOINTS}/api/fixtures`);
        const validFixtures = fixtureResponse.data.filter(
          (fixture) => fixture.team1 !== "NA" && fixture.team2 !== "NA"
        );
        setFixtures(validFixtures);
        setLoading(false); // Stop loading after fetching
      } catch (error) {
        setLoading(false); 
        console.error("Error fetching fixtures:", error);
      }
    };

    fetchFixtures();
  }, []);

  const handleEditFixture = (fixture) => {
    setCurrentFixture(fixture);
    setWinner(fixture.winner || "");
    setMargin(fixture.margin || "");
    setPlayers([]);
    setMom({
      name: fixture.mom?.name || "",
      score: fixture.mom?.score || "",
      wickets: fixture.mom?.wickets || "",
    });
    setTeam1Score(fixture.team1Score || "");
    setTeam2Score(fixture.team2Score || "");
    setShowModal(true);
  };

  const handleWinnerChange = (teamName) => {
    setWinner(teamName);

    // Update players based on the selected winner's team
    const teamDetails =
      teamName === currentFixture.team1
        ? currentFixture.team1Details
        : currentFixture.team2Details;

    // Maintain the players in dropdown if available
    setPlayers((prevPlayers) => teamDetails.players.length ? teamDetails.players : prevPlayers);
  };

  const handleSaveFixture = async () => {
    try {
      const payload = {
        team1: currentFixture.team1,
        team2: currentFixture.team2,
        winner,
        margin,
        team1Score,
        team2Score,
        mom,
      };

      await axios.post(`${API_ENDPOINTS}/api/fixtures/save`, payload);

      const updatedFixtures = fixtures.map((fixture) =>
        fixture._id === currentFixture._id
          ? { ...fixture, winner, margin, mom, team1Score, team2Score }
          : fixture
      );

      setFixtures(updatedFixtures);
      setShowModal(false);
      alert("Fixture updated successfully!");
    } catch (error) {
      console.error("Error saving fixture:", error);
      alert("Failed to save fixture.");
    }
  };
  if (loading) {
    return <LoadingCube animationFile="Schedule.json" />;
  }

  return (
    <FixtureWrapper>
      <h2>Fixtures</h2>
      <FixtureTable>
        <thead>
          <tr>
            <th>Team 1</th>
            <th>Team 2</th>
            <th>Winner</th>
            <th>Margin</th>
            <th>Team 1 Score</th>
            <th>Team 2 Score</th>
            <th>Man of the Match</th>
            {isAdmin && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {fixtures.map((fixture) => (
            <tr key={fixture._id}>
              <td>{fixture.team1}</td>
              <td>{fixture.team2}</td>
              <td>{fixture.winner || "TBD"}</td>
              <td>{fixture.margin || "TBD"}</td>
              <td>{fixture.team1Score || "TBD"}</td>
              <td>{fixture.team2Score || "TBD"}</td>
              <td>{fixture.mom?.name || "TBD"}</td>
              {isAdmin && (
                <td>
                  <EditButton onClick={() => handleEditFixture(fixture)}>
                    Edit
                  </EditButton>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </FixtureTable>

      {showModal && (
        <ModalWrapper>
          <ModalContent>
            <h3>Edit Fixture</h3>
            <Select
              value={winner}
              onChange={(e) => handleWinnerChange(e.target.value)}
            >
              <option value="">Select Winner</option>
              <option value={currentFixture.team1}>{currentFixture.team1}</option>
              <option value={currentFixture.team2}>{currentFixture.team2}</option>
            </Select>
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
            <Input
              type="text"
              placeholder="Margin"
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
            />
            <Select
              value={mom.name}
              onChange={(e) => setMom({ ...mom, name: e.target.value })}
            >
              <option value="">Select Man of the Match</option>
              {players.map((player) => (
                <option key={player._id} value={player.name}>
                  {player.name}
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
