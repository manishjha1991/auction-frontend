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
      : "#fff3cd"} !important;
  height: 50px;
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
  cursor: ${(props) => (props.isAdmin ? "pointer" : "default")};

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
    props.variant === "win"
      ? "#4CAF50"
      : props.variant === "loss"
      ? "#F44336"
      : "#FFC107"};
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

const PointsTable = () => {
  const [teams, setTeams] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [fairness, setFairness] = useState("");
  const [towerPosition, setTowerPosition] = useState(null);
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(null);
  const [loading, setLoading] = useState(true);

  const TOTAL_MATCHES = 12;
  const NUM_QUALIFIERS = 6; // always top-6 qualify

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setIsAdmin(user?.isAdmin === true);
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
      await axios.put(
        `${API_ENDPOINTS}/api/users/update-points/${selectedTeam._id}`,
        {
          points: pendingUpdate.points, // Send 2 for win, 0 for loss
          fairness: pendingUpdate.fairness,
        }
      );

      alert("Points and fairness updated successfully!");
      setShowModal(false);
      setConfirmationModal(false);
      fetchTeams();
    } catch (error) {
      console.error("Error updating data:", error);
      alert("Failed to update points.");
    }
  };

  // Filter out placeholder teams once
  const filteredTeams = useMemo(
    () => teams.filter((team) => team.teamName !== "NA"),
    [teams]
  );

  useEffect(() => {
    console.log(filteredTeams, '@@@@@');
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
              placeholder={`Enter fairness for ${selectedTeam?.teamName || ""}`}
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
              Are you sure you want to update the team points and fairness?
              <br />
              Team: {selectedTeam?.teamName}
              <br />
              Points: {pendingUpdate?.points}
              <br />
              Fairness: {pendingUpdate?.fairness}
            </p>
            <div>
              <PopupButton variant="win" onClick={confirmUpdate}>
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
            {filteredTeams.map((team, index) => {
              const losses = team.matchesPlayed - team.wins;
              const teamImage = team.teamImage
                ? `${API_ENDPOINTS}${team.teamImage}`
                : "https://via.placeholder.com/100";

              const variant =
                index < 6
                  ? "top"
                  : index >= filteredTeams.length - 3
                  ? "bottom"
                  : "middle";

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
              const points = Number(team.points) || 0;
              const playedNow = Number(team.matchesPlayed) || 0;
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
                  <HighlightCell
                    isAdmin={isAdmin}
                    onClick={(event) => handleTeamClick(event, team)}
                  >
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
