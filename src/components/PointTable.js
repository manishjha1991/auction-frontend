import React, { useEffect, useState } from "react";
import styled from "styled-components";
import axios from "axios";
import { API_ENDPOINTS } from "../const";
import { useMemo } from "react";
import PlayoffFixtures from "./PlayoffFixtures";

// Keyframes for subtle animations (removed unused fadeIn)

// Tab styles
const TabContainer = styled.div`
  margin: 0.5rem auto;
  width: 98%;
  max-width: 100%;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const TabHeader = styled.div`
  display: flex;
  background: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
`;

const TabButton = styled.button`
  flex: 1;
  padding: 0.5rem 0.75rem;
  background: ${props => props.active ? '#007bff' : 'transparent'};
  color: ${props => props.active ? '#ffffff' : '#6c757d'};
  border: none;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.8rem;
  
  &:hover {
    background: ${props => props.active ? '#007bff' : '#e9ecef'};
  }
  
  @media (max-width: 600px) {
    padding: 0.4rem 0.5rem;
    font-size: 0.7rem;
  }
`;

// Styled components
const TableWrapper = styled.div`
  padding: 0.5rem;
  background: #ffffff;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: center;
  font-size: 0.75rem;
  color: #343a40;
  table-layout: fixed;

  @media (max-width: 600px) {
    font-size: 0.7rem;
    table-layout: auto;
  }
`;

const TableHead = styled.thead`
  background-color: #ffffff !important;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #343a40;

  @media (max-width: 600px) {
    font-size: 0.65rem;
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
  height: 35px;
  ${(props) =>
    props.variant === "eliminated" &&
    `
    border-left: 3px solid #dc3545;
    box-shadow: 0 1px 4px rgba(220, 53, 69, 0.3);
    `}
`;

const TableCell = styled.td`
  padding: 0.25rem 0.4rem;
  font-size: 0.75rem;
  border: none;
  overflow: visible;
  text-overflow: clip;
  white-space: normal;
  word-wrap: break-word;

  @media (max-width: 600px) {
    padding: 0.2rem 0.3rem;
    font-size: 0.7rem;
  }
`;

const HighlightCell = styled(TableCell)`
  font-weight: bold;
  text-align: left;
  padding-left: 0.5rem;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #e9ecef;
  }

  img {
    margin-right: 6px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    object-fit: cover;
  }

  @media (max-width: 600px) {
    padding-left: 0.3rem;
  }
`;

const QualifierBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #28a745; /* green */
  color: #ffffff;
  font-size: 10px;
  line-height: 1;
  font-weight: 800;
`;

const EliminatedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #dc3545; /* red */
  color: #ffffff;
  font-size: 10px;
  line-height: 1;
  font-weight: 800;
`;

const RankCell = styled(TableCell)`
  font-weight: bold;
  color: #000;
  padding: 0.25rem 0.2rem;
  font-size: 0.75rem;
  width: 50px;
`;

// Team Details Modal Styles
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 10px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #dee2e6;
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: #343a40;
  display: flex;
  align-items: center;
  
  img {
    margin-right: 10px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }
`;

const CloseButton = styled.button`
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: #c82333;
  }
`;

const TeamStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  border-left: 4px solid ${props => props.color || '#007bff'};
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #343a40;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #6c757d;
  margin-top: 0.25rem;
`;

const MatchTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  font-size: 0.9rem;
`;

const MatchTableHead = styled.thead`
  background-color: #f8f9fa;
  font-weight: 600;
`;

const MatchTableRow = styled.tr`
  border-bottom: 1px solid #dee2e6;
  
  &:hover {
    background-color: #f8f9fa;
  }
`;

const MatchTableCell = styled.td`
  padding: 0.75rem 0.5rem;
  text-align: left;
  
  &:first-child {
    font-weight: 500;
  }
`;

const MatchTableHeader = styled.th`
  padding: 0.75rem 0.5rem;
  text-align: left;
  font-weight: 600;
  color: #343a40;
`;

const ResultCell = styled(MatchTableCell)`
  color: ${props => 
    props.result === 'win' ? '#28a745' : 
    props.result === 'loss' ? '#dc3545' : '#6c757d'
  };
  font-weight: bold;
`;

const FairnessCell = styled(MatchTableCell)`
  text-align: center;
  font-weight: 500;
`;

const PointsTable = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('overall');
  const [groups, setGroups] = useState({ A: [], B: [] });
  const [activeTab, setActiveTab] = useState('overall');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamFixtures, setTeamFixtures] = useState([]);
  const [showTeamDetails, setShowTeamDetails] = useState(false);

  const TOTAL_MATCHES = 12;
  const [worldCupMode, setWorldCupMode] = useState(false);
  const NUM_QUALIFIERS = worldCupMode ? 8 : 6; // top-8 if World Cup enabled, top-6 otherwise
  const GROUP_MATCHES = 6; // matches per team in group stage
  const GROUP_QUALIFIERS = 3; // top-3 qualify from each group

  useEffect(() => {
    fetchModeAndData();
  }, []);

  const fetchTeamFixtures = async (teamName) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS}/api/fixtures`);
      const allFixtures = response.data;
      
      // Filter fixtures where the team is either team1 or team2
      const teamMatches = allFixtures.filter(fixture => 
        fixture.team1 === teamName || fixture.team2 === teamName
      );
      
      // Sort: completed matches first (by creation date), then pending matches
      teamMatches.sort((a, b) => {
        const aHasResult = !!a.winner;
        const bHasResult = !!b.winner;
        
        // If one has result and other doesn't, prioritize the one with result
        if (aHasResult && !bHasResult) return -1;
        if (!aHasResult && bHasResult) return 1;
        
        // If both have same status, sort by creation date (most recent first)
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      setTeamFixtures(teamMatches);
    } catch (error) {
      console.error("Error fetching team fixtures:", error);
      setTeamFixtures([]);
    }
  };

  const handleTeamClick = async (team) => {
    setSelectedTeam(team);
    
    // Use the original team name for fixture matching (not the abbreviation)
    const teamNameForFixtures = team.originalTeamName || team.teamName;
    
    await fetchTeamFixtures(teamNameForFixtures);
    setShowTeamDetails(true);
  };

  const closeTeamDetails = () => {
    setShowTeamDetails(false);
    setSelectedTeam(null);
    setTeamFixtures([]);
  };

  const fetchModeAndData = async () => {
    try {
      setLoading(true);
      const settings = await axios.get(`${API_ENDPOINTS}/api/settings`);
      const pmode = settings?.data?.pointsMode || 'overall';
      const wcMode = settings?.data?.worldCupMode === true;
      setMode(pmode);
      setWorldCupMode(wcMode);
      
      // Set default tab based on mode
      if (pmode === 'groups') {
        setActiveTab('groupA');
        const resp = await axios.get(`${API_ENDPOINTS}/api/users/points-table-grouped`);
        setGroups(resp.data?.groups || { A: [], B: [] });
      } else {
        setActiveTab('overall');
        const response = await axios.get(`${API_ENDPOINTS}/api/users/points-table`);
        setTeams(response.data);
      }
    } catch (error) {
      console.error("Error fetching points data:", error);
    } finally {
      setLoading(false);
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

  // Removed unused currentTopMap

  // Mathematical status map (Q/E/NONE) from previous logic (kept for reference, not used when season incomplete)
  const _mathStatusMap = useMemo(() => {
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

  // Group completion flag: everyone in groups played all group matches
  const groupsCompleted = useMemo(() => {
    if (mode !== 'groups' || Object.keys(groups).length === 0) return false;
    const allGroupTeams = [...groups.A, ...groups.B];
    if (allGroupTeams.length === 0) return false;
    return allGroupTeams.every(t => Number(t.matchesPlayed) >= GROUP_MATCHES);
  }, [groups, mode, GROUP_MATCHES]);

  // Top-N map at completion (used when allCompleted)
  const _completedTopMap = useMemo(() => {
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

  const renderTableBody = (list) => (
    <tbody>
      {list.map((team, index) => {
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

        // Qualification logic based on mode and completion status
        let showQ = false;
        let showE = false;
        let qTitle = "";
        let eTitle = "";

        if (mode === 'groups') {
          // Group mode logic
          if (groupsCompleted) {
            // All teams completed 6 matches - show Q for top 3, E for others
            showQ = index < GROUP_QUALIFIERS;
            showE = index >= GROUP_QUALIFIERS;
            qTitle = "Qualified (Top 3)";
            eTitle = "Eliminated";
          } else {
            // During group stage - use early elimination thresholds
            const earlyEliminated = (
              (playedNow >= 6 && points <= 4) ||
              (playedNow >= 5 && points <= 3) ||
              (playedNow >= 4 && points <= 2) ||
              (playedNow >= 3 && points <= 1)
            );
            showQ = points > 10; // High points during group stage
            showE = earlyEliminated;
            qTitle = "Qualified (10+ points)";
            eTitle = "Eliminated (early threshold)";
          }
        } else {
          // Overall mode logic
          if (allCompleted) {
            // All teams completed 12 matches - show Q for top 6 or top 8 (based on World Cup mode)
            showQ = index < NUM_QUALIFIERS;
            showE = index >= NUM_QUALIFIERS; // E badges for teams not in top qualifiers
            qTitle = worldCupMode ? "Qualified (Top 8)" : "Qualified (Top 6)";
            eTitle = "Eliminated";
          } else {
            // During overall season - use existing early elimination logic
            const earlyEliminated = (
              (playedNow >= 12 && points <= 10) ||
              (playedNow >= 11 && points <= 8)  ||
              (playedNow >= 10 && points <= 6)  ||
              (playedNow >= 9  && points <= 4)
            );
            showQ = points > 20;
            showE = earlyEliminated;
            qTitle = "Qualified (20+ points)";
            eTitle = "Eliminated (early threshold)";
          }
        }

        // Variant logic: different for groups vs overall
        let variant;
        if (mode === 'groups') {
          // Group mode: Top 3 green, E teams red, others yellow
          if (showE) {
            variant = "eliminated"; // Red
          } else if (showQ) {
            variant = "top"; // Green for qualified teams
          } else {
            variant = "middle"; // Yellow for others
          }
        } else {
          // Overall mode: original logic
          if (showE) {
            variant = "eliminated"; // Red card design
          } else if (showQ) {
            variant = "top"; // Green for qualified teams
          } else if (index >= list.length - 3) {
            variant = "bottom";
          } else {
            variant = "middle";
          }
        }

        // Format NRR with proper sign and 3 decimal places
        const formatNRR = (nrr) => {
          if (nrr === null || nrr === undefined || isNaN(nrr)) {
            return '0.000';
          }
          const formatted = parseFloat(nrr).toFixed(3);
          return formatted >= 0 ? `+${formatted}` : formatted;
        };

        return (
          <TableRow key={team._id || `${team.teamName}-${index}`} index={index} variant={variant}>
            <RankCell>{`${index + 1} -`}</RankCell>
            <HighlightCell onClick={() => handleTeamClick(team)}>
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
            <TableCell>{formatNRR(team.nrr)}</TableCell>
          </TableRow>
        );
      })}
    </tbody>
  );

  return (
    <>
      {mode === 'groups' ? (
        // Group mode - show tabs for Group A, Group B, and Playoffs
        <TabContainer>
          <TabHeader>
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
            <TabButton 
              active={activeTab === 'playoffs'} 
              onClick={() => setActiveTab('playoffs')}
            >
              Playoffs
            </TabButton>
          </TabHeader>
          
          <TableWrapper>
            {activeTab === 'groupA' && (
              <>
                <h2 style={{ textAlign: "center", color: "#343a40", marginBottom: "0.5rem", fontSize: "1.2rem", marginTop: "0.5rem" }}>
                  Group A
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
                      <TableCell>NRR</TableCell>
                    </tr>
                  </TableHead>
                  {renderTableBody(groups.A)}
                </Table>
              </>
            )}
            
            {activeTab === 'groupB' && (
              <>
                <h2 style={{ textAlign: "center", color: "#343a40", marginBottom: "0.5rem", fontSize: "1.2rem", marginTop: "0.5rem" }}>
                  Group B
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
                      <TableCell>NRR</TableCell>
                    </tr>
                  </TableHead>
                  {renderTableBody(groups.B)}
                </Table>
              </>
            )}
            
            {activeTab === 'playoffs' && (
              <PlayoffFixtures 
                top6Teams={mode === 'groups' ? 
                  [...groups.A.slice(0, 3), ...groups.B.slice(0, 3)] : 
                  sortedTeams.slice(0, 6)
                } 
                mode={mode}
                groups={groups}
              />
            )}
          </TableWrapper>
        </TabContainer>
      ) : (
        // Overall mode - show tabs for Overall Table and Playoffs
        <TabContainer>
          <TabHeader>
            <TabButton 
              active={activeTab === 'overall'} 
              onClick={() => setActiveTab('overall')}
            >
              Overall Table
            </TabButton>
            <TabButton 
              active={activeTab === 'playoffs'} 
              onClick={() => setActiveTab('playoffs')}
            >
              Playoffs
            </TabButton>
          </TabHeader>
          
          <TableWrapper>
            {activeTab === 'overall' && (
              <>
                <h2 style={{ textAlign: "center", color: "#343a40", marginBottom: "0.5rem", fontSize: "1.2rem", marginTop: "0.5rem" }}>
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
                      <TableCell>NRR</TableCell>
                    </tr>
                  </TableHead>
                  {renderTableBody(sortedTeams)}
                </Table>
              </>
            )}
            
            {activeTab === 'playoffs' && (
              <PlayoffFixtures 
                top6Teams={sortedTeams.slice(0, NUM_QUALIFIERS)} 
                mode={mode}
                groups={groups}
              />
            )}
          </TableWrapper>
        </TabContainer>
      )}

      {/* Team Details Modal */}
      {showTeamDetails && selectedTeam && (
        <ModalOverlay onClick={closeTeamDetails}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <img 
                  src={selectedTeam.teamImage ? `${API_ENDPOINTS}${selectedTeam.teamImage}` : "https://via.placeholder.com/100"} 
                  alt={selectedTeam.teamName} 
                />
                {selectedTeam.teamName} - Match Details
              </ModalTitle>
              <CloseButton onClick={closeTeamDetails}>×</CloseButton>
            </ModalHeader>

            <TeamStats>
              <StatCard color="#28a745">
                <StatValue>{selectedTeam.wins}</StatValue>
                <StatLabel>Wins</StatLabel>
              </StatCard>
              <StatCard color="#dc3545">
                <StatValue>{selectedTeam.losses}</StatValue>
                <StatLabel>Losses</StatLabel>
              </StatCard>
              <StatCard color="#007bff">
                <StatValue>{selectedTeam.points}</StatValue>
                <StatLabel>Points</StatLabel>
              </StatCard>
              <StatCard color="#ffc107">
                <StatValue>{selectedTeam.fairness}</StatValue>
                <StatLabel>Fairness</StatLabel>
              </StatCard>
              <StatCard color="#6c757d">
                <StatValue>{selectedTeam.matchesPlayed}</StatValue>
                <StatLabel>Matches Played</StatLabel>
              </StatCard>
            </TeamStats>

            <h3 style={{ color: '#343a40', marginBottom: '1rem' }}>Match History</h3>
            {teamFixtures.length > 0 ? (
              <MatchTable>
                <MatchTableHead>
                  <tr>
                    <MatchTableHeader>Opponent</MatchTableHeader>
                    <MatchTableHeader>Result</MatchTableHeader>
                    <MatchTableHeader>Date</MatchTableHeader>
                    <MatchTableHeader>Fairness</MatchTableHeader>
                  </tr>
                </MatchTableHead>
                <tbody>
                  {teamFixtures.map((fixture, index) => {
                    const isTeam1 = fixture.team1 === selectedTeam.originalTeamName;
                    const opponent = isTeam1 ? fixture.team2 : fixture.team1;
                    
                    let result = 'vs';
                    let resultText = 'vs';
                    
                    if (fixture.winner) {
                      if (fixture.winner === selectedTeam.originalTeamName) {
                        result = 'win';
                        resultText = 'Won';
                        if (fixture.margin) {
                          resultText += ` by ${fixture.margin}`;
                        }
                      } else {
                        result = 'loss';
                        resultText = 'Lost';
                        if (fixture.margin) {
                          resultText += ` by ${fixture.margin}`;
                        }
                      }
                    }

                    // Format date
                    const matchDate = new Date(fixture.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short'
                    });

                    // Get fairness for this team
                    const teamFairness = isTeam1 ? fixture.team1Fairness : fixture.team2Fairness;

                    return (
                      <MatchTableRow key={index}>
                        <MatchTableCell>{opponent}</MatchTableCell>
                        <ResultCell result={result}>{resultText}</ResultCell>
                        <MatchTableCell>{matchDate}</MatchTableCell>
                        <FairnessCell>{teamFairness || '-'}</FairnessCell>
                      </MatchTableRow>
                    );
                  })}
                </tbody>
              </MatchTable>
            ) : (
              <div style={{ textAlign: 'center', color: '#6c757d', padding: '2rem' }}>
                No matches found for this team.
              </div>
            )}
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
};

export default PointsTable;