// Import required dependencies
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import axios from "axios";
import { API_ENDPOINTS } from "../const";

// Styled components (same as before)
const TableWrapper = styled.div`
  margin: 2rem auto;
  width: 90%;
  max-width: 1000px;
  background: linear-gradient(to right, #f8f9fa, #e9ecef);
  border-radius: 15px;
  padding: 1rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  font-size: 1rem;

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const TableHead = styled.thead`
  background: #343a40;
  color: #fff;
  font-size: 1.2rem;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background: #f1f3f5;
  }
  &:hover {
    background: #dee2e6;
  }
`;

const TableCell = styled.td`
  padding: 0.8rem;
  text-align: center;
  border: 1px solid #dee2e6;

  @media (max-width: 768px) {
    padding: 0.5rem;
  }
`;

const HighlightCell = styled(TableCell)`
  font-weight: bold;
  color: #fff;
  background: ${(props) => props.bgColor || "#6c757d"};
  border-radius: 5px;
`;

const Button = styled.button`
  background: #007bff;
  color: #fff;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;

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
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: #fff;
  padding: 2rem;
  border-radius: 10px;
  width: 400px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  text-align: center;
`;

const ModalInput = styled.input`
  width: 90%;
  margin: 1rem 0;
  padding: 0.5rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 5px;
`;

const ModalButton = styled(Button)`
  width: 90%;
`;

// Component definition
const PointTable = () => {
  const [teams, setTeams] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false); // Admin flag
  const [showModal, setShowModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [points, setPoints] = useState("");
  const [matchesPlayed, setMatchesPlayed] = useState("");

  // Check admin status from localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setIsAdmin(user?.isAdmin === true);
  }, []);

  // Fetch teams data from the API
  const fetchTeams = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS}/api/users/points-table`);
      setTeams(response.data);
    } catch (error) {
      console.error("Error fetching teams data:", error);
    }
  };

  // Open the modal for adding points and matches
  const handleAddMatchPlayed = (team) => {
    if (!team._id) {
      console.error("Team ID is missing:", team);
      alert("Team ID is missing. Cannot proceed.");
      return;
    }
    setSelectedTeam(team);
    setPoints("");
    setMatchesPlayed("");
    setShowModal(true);
  };

  // Submit the updated points and matches
  const handleSubmit = async () => {
    if (!points || !matchesPlayed) return alert("Both fields are required!");
    if (!selectedTeam?._id) return alert("Team ID is missing!");

    try {
      await axios.put(`${API_ENDPOINTS}/api/users/update-points/${selectedTeam._id}`, {
        points: Number(points),
        matchesPlayed: Number(matchesPlayed),
      });

      alert("Points and matches updated successfully!");
      setShowModal(false);
      fetchTeams();
    } catch (error) {
      console.error("Error updating points:", error);
      alert("Failed to update points and matches played.");
    }
  };


  // Fetch data on component mount
  useEffect(() => {
    fetchTeams();
  }, []);

  const seaColor = "#4682B4"; // Sea color for the top 5 teams
  const defaultColor = "#6c757d"; // Default color for all other teams

  return (
    <>
      {showModal && (
        <ModalWrapper>
          <ModalContent>
            <h3>Update Points and Matches</h3>
            <ModalInput
              type="number"
              placeholder="Enter Points"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
            />
            <ModalInput
              type="number"
              placeholder="Enter Matches Played"
              value={matchesPlayed}
              onChange={(e) => setMatchesPlayed(e.target.value)}
            />
            <ModalButton onClick={handleSubmit}>Submit</ModalButton>
            <Button onClick={() => setShowModal(false)}>Close</Button>
          </ModalContent>
        </ModalWrapper>
      )}

      <TableWrapper>
        <h2 style={{ textAlign: "center", color: "#343a40", fontWeight: "bold" }}>
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
              .filter((team) => team.teamName !== "NA") // Exclude teams with teamName "NA"
              .sort((a, b) => {
                // Move teams with 0 points to the bottom
                if (b.points > 0 && a.points === 0) return 1;
                if (a.points > 0 && b.points === 0) return -1;

                // If both teams have points > 0 or both have 0, sort by points descending
                return b.points - a.points;
              })
              .map((team, index) => (
                <TableRow key={team._id}>
                  <TableCell>{index + 1}</TableCell>
                  <HighlightCell bgColor={index < 5 ? seaColor : defaultColor}>
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
              ))}
          </tbody>


        </Table>
      </TableWrapper>
    </>
  );
};

export default PointTable;
