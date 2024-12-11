// Import required dependencies
import React from 'react';
import styled from 'styled-components';

// Styled components
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

// Define team data
const teams = [
  { name: "Team A", points: 50, fairness: "Excellent" },
  { name: "Team B", points: 48, fairness: "Good" },
  { name: "Team C", points: 46, fairness: "Excellent" },
  { name: "Team D", points: 45, fairness: "Fair" },
  { name: "Team E", points: 44, fairness: "Good" },
  { name: "Team F", points: 40, fairness: "Fair" },
  { name: "Team G", points: 38, fairness: "Fair" },
  { name: "Team H", points: 35, fairness: "Good" },
];

const seaColor = "#4682B4"; // Sea color for the top 5 teams
const defaultColor = "#6c757d"; // Default color for all other teams

const PointTable = () => {
  return (
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
            <TableCell>Fairness</TableCell>
          </TableRow>
        </TableHead>
        <tbody>
          {teams
            .sort((a, b) => b.points - a.points)
            .map((team, index) => (
              <TableRow key={team.name}>
                <TableCell>{index + 1}</TableCell>
                <HighlightCell bgColor={index < 5 ? seaColor : defaultColor}>
                  {team.name}
                </HighlightCell>
                <TableCell>{team.points}</TableCell>
                <TableCell>{team.fairness}</TableCell>
              </TableRow>
            ))}
        </tbody>
      </Table>
    </TableWrapper>
  );
};

export default PointTable;
