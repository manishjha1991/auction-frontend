import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import axios from "axios";
import { API_ENDPOINTS } from "../const";
import { useMemo } from "react";

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
  overflow-x: auto;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  background: #ffffff !important;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: center;
  font-size: 0.9rem;
  color: #343a40;
  table-layout: auto;

  @media (max-width: 600px) {
    font-size: 0.8rem; /* Adjust font size for smaller screens */
  }
`;

const TableHead = styled.thead`
  background-color: #ffffff !important;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #343a40;

  @media (max-width: 600px) {
    font-size: 0.75rem; /* Reduce font size on mobile screens */
  }
`;

const TableRow = styled.tr`
  background-color: ${(props) =>
    props.variant === "top"
      ? "#d4edda"
      : props.variant === "bottom"
      ? "#f8d7da"
      : props.variant === "eliminated"
      ? "#f8d7da"
      : "#fff3cd"} !important;
  height: 50px;
  ${(props) =>
    props.variant === "eliminated" &&
    `
    border-left: 4px solid #dc3545;
    box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
    `}
`;

const TableCell = styled.td`
  padding: 0.5rem; /* Reduce padding for better fit */
  font-size: 0.9rem;
  border: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 600px) {
    padding: 0.3rem; /* Adjust padding for smaller screens */
  }
`;

const HighlightCell = styled(TableCell)`
  font-weight: bold;
  text-align: left;
  padding-left: 1rem;
  display: flex;
  align-items: center;
  cursor: default;

  img {
    margin-right: 8px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
  }

  @media (max-width: 600px) {
    padding-left: 0.5rem; /* Reduce padding on mobile screens */
  }
`;

const QualifierBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #28a745; /* green */
  color: #ffffff;
  font-size: 12px;
  line-height: 1;
  font-weight: 800;
`;

const EliminatedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #dc3545; /* red */
  color: #ffffff;
  font-size: 12px;
  line-height: 1;
  font-weight: 800;
`;

const RankCell = styled(TableCell)`
  font-weight: bold;
  color: #000;
`;





const PointsTable = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const TOTAL_MATCHES = 12;
  const NUM_QUALIFIERS = 6; // always top-6 qualify

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await axios.get(
        `${API_ENDPOINTS}/api/users/points-table`
      );
      setTeams(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching teams data:", error);
    }
  };



  // Filter out placeholder teams once
  const filteredTeams = useMemo(
    () => teams.filter((team) => team.teamName !== "NA"),
    [teams]
  );

  // Sort teams: eliminated teams go to bottom, others by points
  const sortedTeams = useMemo(() => {
    return [...filteredTeams].sort((a, b) => {
      const pointsA = Number(a.points) || 0;
      const pointsB = Number(b.points) || 0;
      const playedA = Number(a.matchesPlayed) || 0;
      const playedB = Number(b.matchesPlayed) || 0;
      
      // Check if teams are eliminated based on early thresholds
      const isEliminatedA = (
        (playedA >= 12 && pointsA <= 10) ||
        (playedA >= 11 && pointsA <= 8) ||
        (playedA >= 10 && pointsA <= 6) ||
        (playedA >= 9 && pointsA <= 4)
      );
      
      const isEliminatedB = (
        (playedB >= 12 && pointsB <= 10) ||
        (playedB >= 11 && pointsB <= 8) ||
        (playedB >= 10 && pointsB <= 6) ||
        (playedB >= 9 && pointsB <= 4)
      );
      
      // Eliminated teams go to bottom
      if (isEliminatedA && !isEliminatedB) return 1;
      if (!isEliminatedA && isEliminatedB) return -1;
      
      // If both eliminated or both not eliminated, sort by points (descending)
      if (pointsB !== pointsA) return pointsB - pointsA;
      
      // If points are equal, sort by fairness (descending)
      const fairnessA = Number(a.fairness) || 0;
      const fairnessB = Number(b.fairness) || 0;
      return fairnessB - fairnessA;
    });
  }, [filteredTeams]);



  // Current top-N based on points (fairness tie-breaker)
  const currentTopMap = useMemo(() => {
    const ids = {};
    if (filteredTeams.length === 0) return ids;
    const sorted = [...filteredTeams].sort((a, b) => {
      const pa = Number(a.points) || 0;
      const pb = Number(b.points) || 0;
      if (pb !== pa) return pb - pa;
      const fa = Number(a.fairness) || 0;
      const fb = Number(b.fairness) || 0;
      return fb - fa;
    });
    sorted.slice(0, NUM_QUALIFIERS).forEach((t) => {
      ids[t._id] = true;
    });
    return ids;
  }, [filteredTeams, NUM_QUALIFIERS]);

  // Mathematical status map (Q/E/NONE) from previous logic (kept for reference, not used when season incomplete)
  const mathStatusMap = useMemo(() => {
    const result = {};
    const isThirteen = TOTAL_MATCHES === 13;
    if (!isThirteen || loading || filteredTeams.length === 0) return result;

    filteredTeams.forEach((team) => {
      const points = Number(team.points) || 0;
      const played = Number(team.matchesPlayed) || 0;
      const remaining = Math.max(0, TOTAL_MATCHES - played);
      const teamMin = points; // lose out
      const teamMax = points + remaining * 2; // win out

      const others = filteredTeams.filter((t) => t._id !== team._id);
      const othersMax = others
        .map((t) => {
          const tp = Number(t.points) || 0;
          const pl = Number(t.matchesPlayed) || 0;
          const rem = Math.max(0, TOTAL_MATCHES - pl);
          return tp + rem * 2;
        })
        .sort((a, b) => b - a);

      const othersCurrent = others
        .map((t) => Number(t.points) || 0)
        .sort((a, b) => b - a);

      const kthIndex = NUM_QUALIFIERS - 1;
      const kthMax = othersMax[kthIndex];
      const kthCurrent = othersCurrent[kthIndex];

      const clinched = othersMax.length < NUM_QUALIFIERS
        ? true
        : teamMin > (kthMax ?? -Infinity); // must be strictly greater than others' best

      const eliminated = othersCurrent.length >= NUM_QUALIFIERS
        ? teamMax < (kthCurrent ?? Infinity) // strictly less than current kth team's points
        : false;

      result[team._id] = clinched ? 'Q' : eliminated ? 'E' : 'NONE';
    });

    return result;
  }, [filteredTeams, TOTAL_MATCHES, NUM_QUALIFIERS, loading]);

  // Season completion flag: everyone played all matches
  const allCompleted = useMemo(() => {
    if (filteredTeams.length === 0) return false;
    return filteredTeams.every(t => Number(t.matchesPlayed) >= TOTAL_MATCHES);
  }, [filteredTeams, TOTAL_MATCHES]);

  // Top-N map at completion (used when allCompleted)
  const completedTopMap = useMemo(() => {
    const ids = {};
    if (!allCompleted) return ids;
    const sorted = [...filteredTeams].sort((a, b) => {
      const pa = Number(a.points) || 0;
      const pb = Number(b.points) || 0;
      if (pb !== pa) return pb - pa;
      const fa = Number(a.fairness) || 0;
      const fb = Number(b.fairness) || 0;
      return fb - fa;
    });
    sorted.slice(0, NUM_QUALIFIERS).forEach((t) => { ids[t._id] = true; });
    return ids;
  }, [allCompleted, filteredTeams, NUM_QUALIFIERS]);

  return (
    <>
      <TableWrapper>
        <h2
          style={{ textAlign: "center", color: "#343a40", marginBottom: "1.5rem" }}
        >
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
              <TableCell>MP</TableCell>
            </tr>
          </TableHead>
          <tbody>
            {sortedTeams.map((team, index) => {
              const losses = team.matchesPlayed - team.wins;
              const teamImage = team.teamImage
                ? `${API_ENDPOINTS}${team.teamImage}`
                : "https://via.placeholder.com/100";

              const points = Number(team.points) || 0;
              const playedNow = Number(team.matchesPlayed) || 0;

              // Check if team is eliminated based on early thresholds
              const isEliminated = (
                (playedNow >= 12 && points <= 10) ||
                (playedNow >= 11 && points <= 8) ||
                (playedNow >= 10 && points <= 6) ||
                (playedNow >= 9 && points <= 4)
              );

              // Variant logic: eliminated teams get red card, others by position
              let variant;
              if (isEliminated) {
                variant = "eliminated"; // Red card design
              } else if (index < 6) {
                variant = "top";
              } else if (index >= sortedTeams.length - 3) {
                variant = "bottom";
              } else {
                variant = "middle";
              }

              const isTop = allCompleted ? Boolean(completedTopMap[team._id]) : false;
              const mathStatus = mathStatusMap[team._id]; // 'Q' | 'E' | 'NONE' | undefined
              // Rules:
              // - During season (not allCompleted):
              //   Q if points > 20
              //   E if team meets early thresholds:
              //       >=12 MP and PTS <= 10
              //       >=11 MP and PTS <= 8
              //       >=10 MP and PTS <= 6
              //       >=9  MP and PTS <= 4
              // - After season complete: Q for final Top-6; E for non Top-6
              const earlyEliminated = (
                (playedNow >= 12 && points <= 10) ||
                (playedNow >= 11 && points <= 8)  ||
                (playedNow >= 10 && points <= 6)  ||
                (playedNow >= 9  && points <= 4)
              );
              const showQ = allCompleted ? isTop : points > 20;
              const showE = allCompleted ? !isTop : earlyEliminated;
              const qTitle = allCompleted ? "Qualified (Final)" : "Qualified (20+ points)";
              const eTitle = allCompleted ? "Eliminated (Final)" : "Eliminated (early threshold)";

              return (
                <TableRow key={team._id} index={index} variant={variant}>
                  <RankCell>{`${index + 1} -`}</RankCell>
                  <HighlightCell>
                    <img src={teamImage} alt={team.teamName} />
                    {team.teamName}
                    {showQ ? (
                      <QualifierBadge title={qTitle}>Q</QualifierBadge>
                    ) : showE ? (
                      <EliminatedBadge title={eTitle}>E</EliminatedBadge>
                    ) : null}
                  </HighlightCell>
                  <TableCell>{team.wins}</TableCell>
                  <TableCell>{losses}</TableCell>
                  <TableCell>{team.fairness}</TableCell>
                  <TableCell>{team.points}</TableCell>
                  <TableCell>{team.matchesPlayed}</TableCell>
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
