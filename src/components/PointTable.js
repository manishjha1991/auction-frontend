// Import required dependencies
import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import axios from "axios";
import { API_ENDPOINTS } from "../const";

// Keyframes for subtle animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Styled components
const TableWrapper = styled.div`
  margin: 2rem auto;
  width: 90%;
  max-width: 1200px;
  background: linear-gradient(to right, #1e3c72, #2a5298);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
  overflow-x: auto;
  animation: ${fadeIn} 0.5s ease-in-out;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 15px;
  font-size: 1rem;
  color: #f8f9fa;

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const TableHead = styled.thead`
  background: linear-gradient(to right, #ff7e5f, #feb47b);
  color: #fff;
  font-size: 1.3rem;
  text-transform: uppercase;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const TableRow = styled.tr`
  background: #2a2a72;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.02);
    background: #343a40;
  }
`;

const TableCell = styled.td`
  padding: 1rem;
  text-align: center;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-weight: 500;

  @media (max-width: 768px) {
    padding: 0.7rem;
  }
`;

const HighlightCell = styled(TableCell)`
  font-weight: bold;
  color: #fff;
  background: ${(props) => props.bgColor || "#6c757d"};
  border-radius: 10px;
  font-size: 1.1rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
`;

const Button = styled.button`
  background: linear-gradient(to right, #ff7e5f, #feb47b);
  color: #fff;
  padding: 0.7rem 1.5rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(to right, #feb47b, #ff7e5f);
    transform: translateY(-3px);
  }
`;

const WinButton = styled(Button)`
  background: linear-gradient(to right, #43cea2, #185a9d);

  &:hover {
    background: linear-gradient(to right, #185a9d, #43cea2);
  }
`;

const LossButton = styled(Button)`
  background: linear-gradient(to right, #f85032, #e73827);

  &:hover {
    background: linear-gradient(to right, #e73827, #f85032);
  }
`;

const ModalWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: #1e3c72;
  padding: 2.5rem;
  border-radius: 15px;
  width: 400px;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
  text-align: center;
  color: #fff;
  animation: ${fadeIn} 0.5s ease;
`;

const ModalInput = styled.input`
  width: 90%;
  margin: 1.5rem 0;
  padding: 0.8rem;
  font-size: 1rem;
  border: none;
  border-radius: 8px;
  outline: none;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

// Component definition
const PointTable = () => {
  const [teams, setTeams] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false); // Admin flag
  const [showModal, setShowModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [fairness, setFairness] = useState(""); // New fairness state

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setIsAdmin(user?.isAdmin === true);
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS}/api/users/points-table`);
      setTeams(response.data);
    } catch (error) {
      console.error("Error fetching teams data:", error);
    }
  };

  const handleAddMatchPlayed = (team) => {
    setSelectedTeam(team);
    setFairness(""); // Reset fairness
    setShowModal(true);
  };

  const handleSubmit = async (result) => {
    try {
      const points = result === "win" ? 2 : 0; // Win adds 2 points, Loss adds 0 points
      await axios.put(`${API_ENDPOINTS}/api/users/update-points/${selectedTeam._id}`, {
        points,
        fairness: Number(fairness), // Include fairness in API call
      });
      alert("Points and fairness updated successfully!");
      setShowModal(false);
      fetchTeams();
    } catch (error) {
      console.error("Error updating data:", error);
      alert("Failed to update points.");
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const topFourColor = "#FFD700"; // Gold color for top 4 teams
  const dangerColor = "#FF4500"; // Eye-catching red color for danger
  const seaColor = "#4682B4"; // Sea color for the top 5 teams
  const defaultColor = "#6c757d"; // Default color for all other teams

  return (
    <>
      {showModal && (
        <ModalWrapper>
          <ModalContent>
            <h3 style={{ marginBottom: "1rem" }}>Update Points and Fairness</h3>
            <ModalInput
              type="number"
              placeholder="Enter Fairness Points"
              value={fairness}
              onChange={(e) => setFairness(e.target.value)}
            />
            <div>
              <WinButton onClick={() => handleSubmit("win")}>Win</WinButton>
              <LossButton onClick={() => handleSubmit("loss")}>Loss</LossButton>
            </div>
            <Button onClick={() => setShowModal(false)}>Close</Button>
          </ModalContent>
        </ModalWrapper>
      )}

      <TableWrapper>
        <h2
          style={{
            textAlign: "center",
            color: "#f8f9fa",
            fontWeight: "bold",
            marginBottom: "1.5rem",
          }}
        >
          Points Table
        </h2>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Team Name</TableCell>
              <TableCell>Points</TableCell>
              <TableCell>Matches Played</TableCell>
              <TableCell>Fairness</TableCell>
              {isAdmin && <TableCell>Action</TableCell>}
            </TableRow>
          </TableHead>
          <tbody>
  {teams
    .filter((team) => team.teamName !== "NA")
    .sort((a, b) => b.points - a.points)
    .map((team, index) => {
      const dangerCondition =
        team.matchesPlayed === 4 && team.fairness < 1000;
      return (
        <TableRow
        key={team._id}
        style={{
          background:
            index < 4
              ? "linear-gradient(to right, #ff7e5f, #feb47b)" // Gradient for top four
              : dangerCondition
              ? dangerColor
              : "#2a2a72",
          color: index < 4 ? "#000" : dangerCondition ? "#fff" : "inherit", // Black text for top four, white for danger
          boxShadow: index < 4 ? "0 0 15px rgba(255, 255, 255, 0.8)" : "none", // Soft glow for top four
          transform: index < 4 ? "scale(1.05)" : "none", // Slight scale-up effect
          transition: "transform 0.3s ease, box-shadow 0.3s ease", // Smooth transitions for hover effect
        }}
      >
        <TableCell>{index + 1}</TableCell>
        <HighlightCell
          bgColor={
            index < 4
              ? seaColor
              : dangerCondition
              ? dangerColor
              : defaultColor
          }
          style={{
            fontSize: index < 4 ? "1.2rem" : "1rem", // Slightly larger font for top four
            fontWeight: "bold", // Emphasize text weight for top four
            textShadow: index < 4 ? "0 0 10px rgba(255, 255, 255, 0.7)" : "none", // Glow effect on team names
          }}
        >
          {team.teamName}
        </HighlightCell>
        <TableCell>{team.points}</TableCell>
        <TableCell>{team.matchesPlayed}</TableCell>
        <TableCell>{team.fairness}</TableCell>
        {isAdmin && (
          <TableCell>
            <Button onClick={() => handleAddMatchPlayed(team)}>
              Add Match Played
            </Button>
          </TableCell>
        )}
      </TableRow>
      
      );
    })}
</tbody>

        </Table>
      </TableWrapper>
    </>
  );
};

export default PointTable;
