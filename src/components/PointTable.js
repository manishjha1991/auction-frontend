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
  width: 95%;
  max-width: 800px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  background: #ffffff;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: center;
  font-size: 0.9rem;
  color: #343a40;
  table-layout: auto;
`;

const TableHead = styled.thead`
  background-color: #f5f5f5;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #7a7a7a;
`;

const TableRow = styled.tr`
  background-color: ${(props) => (props.index % 2 === 0 ? "#f9fdf9" : "#ffffff")};
  height: 50px;
`;

const TableCell = styled.td`
  padding: 0.8rem;
  font-size: 0.9rem;
  border: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const HighlightCell = styled(TableCell)`
  font-weight: bold;
  text-align: left;
  padding-left: 1rem;
  display: flex;
  align-items: center;
  cursor: ${(props) => (props.isAdmin ? "pointer" : "default")};

  img {
    margin-right: 8px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
  }
`;

const RankCell = styled(TableCell)`
  font-weight: bold;
  color: #000;
`;

const Tower = styled.div`
  position: absolute;
  top: ${(props) => props.position.y}px;
  left: ${(props) => props.position.x}px;
  background: #ffffff;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1000;

  button {
    margin-top: 0.5rem;
    font-size: 0.8rem;
    cursor: pointer;
  }
`;

const PopupButton = styled.button`
  background-color: ${(props) =>
    props.variant === "win" ? "#4CAF50" : props.variant === "loss" ? "#F44336" : "#FFC107"};
  color: #fff;
  padding: 0.7rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  margin: 0.5rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }
`;

// Main Component
const PointsTable = () => {
  const [teams, setTeams] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [fairness, setFairness] = useState("");
  const [towerPosition, setTowerPosition] = useState(null);
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setIsAdmin(user?.isAdmin === true);
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS}/api/users/points-table`);
      setTeams(response.data);
    } catch (error) {
      console.error("Error fetching teams data:", error);
    }
  };

  const handleTeamClick = (event, team) => {
    if (isAdmin) {
      const rect = event.target.getBoundingClientRect();
      setTowerPosition({ x: rect.right + 10, y: rect.top });
      setSelectedTeam(team);
    }
  };

  const handleEditClick = () => {
    setTowerPosition(null); // Close the tower
    setShowModal(true); // Open the main modal
  };

  const handleVerifyAndSubmit = (result) => {
    const newPoints = result === "win" ? 2 : 0; // Always send 2 for win, 0 for loss
    const newFairness = Number(fairness);
  
    setPendingUpdate({
      points: newPoints,
      fairness: newFairness,
      result,
    });
  
    setConfirmationModal(true);
  };
  
  const confirmUpdate = async () => {
    try {
      await axios.put(`${API_ENDPOINTS}/api/users/update-points/${selectedTeam._id}`, {
        points: pendingUpdate.points, // Send 2 for win, 0 for loss
        fairness: pendingUpdate.fairness,
      });
  
      alert("Points and fairness updated successfully!");
      setShowModal(false);
      setConfirmationModal(false);
      fetchTeams();
    } catch (error) {
      console.error("Error updating data:", error);
      alert("Failed to update points.");
    }
  };
  
  

  return (
    <>
      {towerPosition && (
        <Tower position={towerPosition}>
          <button onClick={handleEditClick}>✏️ Edit</button>
        </Tower>
      )}

      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#1e3c72",
              padding: "2.5rem",
              borderRadius: "15px",
              width: "400px",
              boxShadow: "0 6px 15px rgba(0, 0, 0, 0.3)",
              textAlign: "center",
              color: "#fff",
            }}
          >
            <h3 style={{ marginBottom: "1rem" }}>Update Points and Fairness</h3>
            <input
              type="number"
              placeholder="Enter Fairness Points"
              value={fairness}
              onChange={(e) => setFairness(e.target.value)}
              style={{
                width: "90%",
                margin: "1.5rem 0",
                padding: "0.8rem",
                fontSize: "1rem",
                border: "none",
                borderRadius: "8px",
                outline: "none",
              }}
            />
            <div>
              <PopupButton
                variant="win"
                onClick={() => handleVerifyAndSubmit("win")}
              >
                Win
              </PopupButton>
              <PopupButton
                variant="loss"
                onClick={() => handleVerifyAndSubmit("loss")}
              >
                Loss
              </PopupButton>
              <PopupButton
                variant="cancel"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </PopupButton>
            </div>
          </div>
        </div>
      )}

      {confirmationModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1001,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "2rem",
              borderRadius: "10px",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
              textAlign: "center",
            }}
          >
            <h3>Confirm Update</h3>
            <p>
              Are you sure you want to update the team points and fairness? <br />
              Points: {pendingUpdate.points} <br />
              Fairness: {pendingUpdate.fairness}
            </p>
            <div>
              <PopupButton
                variant="win"
                onClick={confirmUpdate}
              >
                Confirm
              </PopupButton>
              <PopupButton
                variant="cancel"
                onClick={() => setConfirmationModal(false)}
              >
                Cancel
              </PopupButton>
            </div>
          </div>
        </div>
      )}

      <TableWrapper>
        <h2 style={{ textAlign: "center", color: "#343a40", marginBottom: "1.5rem" }}>
          Points Table
        </h2>
        <Table>
          <TableHead>
            <tr>
              <TableCell>POS</TableCell>
              <TableCell>TEAMS</TableCell>
              <TableCell>W</TableCell>
              <TableCell>L</TableCell>
              <TableCell>FAIR</TableCell>
              <TableCell>PTS</TableCell>
            </tr>
          </TableHead>
          <tbody>
            {teams
              .filter((team) => team.teamName !== "NA")
              .map((team, index) => {
                const losses = team.matchesPlayed - team.wins;
                const teamImage = team.teamImage
                  ? `${API_ENDPOINTS}${team.teamImage}`
                  : "https://via.placeholder.com/100";

                return (
                  <TableRow key={team._id} index={index}>
                    <RankCell>{`${index + 1} -`}</RankCell>
                    <HighlightCell
                      isAdmin={isAdmin}
                      onClick={(event) => handleTeamClick(event, team)}
                    >
                      <img src={teamImage} alt={team.teamName} />
                      {team.teamName.slice(0, 3).toUpperCase()}
                    </HighlightCell>
                    <TableCell>{team.wins}</TableCell>
                    <TableCell>{losses}</TableCell>
                    <TableCell>{team.fairness}</TableCell>
                    <TableCell>{team.points}</TableCell>
                  </TableRow>
                );
              })}
          </tbody>
        </Table>
      </TableWrapper>
    </>
  );
};

export default PointsTable;
