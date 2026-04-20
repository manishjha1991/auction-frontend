import React, { useEffect, useState } from "react";
import styled from "styled-components";
import axios from "axios";
import { API_ENDPOINTS } from "../const";
import { useMemo } from "react";
import PlayoffFixtures from "./PlayoffFixtures";

/* =========================================================
   Points Table — mobile-first redesign
   Same JSX/state/logic; only the styled-components change.
   On narrow screens each row becomes a compact grid-card so
   the whole table fits without horizontal scroll and there's
   no inner-table vertical scroll.
   ========================================================= */

// Tab styles -------------------------------------------------
const TabContainer = styled.div`
  margin: 0.75rem auto 2rem;
  width: calc(100% - 1rem);
  max-width: 1100px;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 10px 30px -22px rgba(15, 23, 42, 0.25);
  border: 1px solid #e2e8f0;
  overflow: hidden;

  @media (max-width: 600px) {
    width: calc(100% - 0.5rem);
    margin: 0.5rem auto 1.25rem;
    border-radius: 12px;
  }
`;

const TabHeader = styled.div`
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  gap: 0.25rem;
  padding: 0.35rem 0.35rem 0;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar { display: none; }
`;

const TabButton = styled.button`
  flex: 0 0 auto;
  padding: 0.7rem 1.1rem 0.75rem;
  min-height: 42px;
  background: transparent;
  color: ${props => props.active ? "#2563eb" : "#64748b"};
  border: none;
  border-bottom: 2px solid ${props => props.active ? "#2563eb" : "transparent"};
  border-radius: 0;
  font-weight: ${props => props.active ? "700" : "500"};
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
  font-size: 0.9rem;
  white-space: nowrap;
  margin-bottom: -1px;

  &:hover { color: ${props => props.active ? "#2563eb" : "#0f172a"}; }

  @media (max-width: 600px) {
    padding: 0.6rem 0.85rem 0.65rem;
    font-size: 0.82rem;
  }
`;

// Table container --------------------------------------------
const TableWrapper = styled.div`
  padding: clamp(0.5rem, 2vw, 1rem) clamp(0.5rem, 2vw, 1.25rem) clamp(0.75rem, 2vw, 1.25rem);
  background: #ffffff;

  h2 {
    margin: 0.25rem 0 0.85rem;
    color: #0f172a;
    font-size: clamp(0.95rem, 3.2vw, 1.15rem);
    font-weight: 700;
    letter-spacing: -0.01em;
    text-align: left;
  }

  @media (max-width: 600px) {
    padding: 0.5rem 0.5rem 0.75rem;
    overflow: visible;
  }
`;

/* Clean spreadsheet-style table: white rows, thin dividers, no pill chips. */
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 0.9rem;
  color: #0f172a;
  font-variant-numeric: tabular-nums;

  /* Desktop column widths */
  th:nth-child(1), td:nth-child(1) { width: 38px; text-align: left; }          /* POS */
  th:nth-child(2), td:nth-child(2) { width: auto; min-width: 150px; text-align: left; } /* TEAM */
  th:nth-child(3), td:nth-child(3),
  th:nth-child(4), td:nth-child(4),
  th:nth-child(5), td:nth-child(5) { width: 52px; text-align: right; }         /* M W L */
  th:nth-child(6), td:nth-child(6) { width: 80px; text-align: center; }        /* NRR */
  th:nth-child(7), td:nth-child(7) { width: 64px; text-align: right; }         /* PTS */
  th:nth-child(8), td:nth-child(8) { width: 60px; text-align: right; padding-right: 0.4rem; } /* FAIR */

  @media (max-width: 600px) {
    font-size: 0.8rem;

    th:nth-child(1), td:nth-child(1) { width: 24px; }
    th:nth-child(2), td:nth-child(2) { min-width: 0; }
    th:nth-child(3), td:nth-child(3),
    th:nth-child(4), td:nth-child(4),
    th:nth-child(5), td:nth-child(5) { width: 26px; }
    th:nth-child(6), td:nth-child(6) { width: 64px; }  /* NRR needs room for +1.420 */
    th:nth-child(7), td:nth-child(7) { width: 36px; }  /* PTS */
    th:nth-child(8), td:nth-child(8) { width: 34px; padding-right: 0.1rem; } /* FAIR */
  }

  /* Extra-narrow phones: hide FAIR column to keep single-screen fit (all other data stays). */
  @media (max-width: 360px) {
    th:nth-child(8), td:nth-child(8) { display: none; }
    font-size: 0.76rem;
    th:nth-child(6), td:nth-child(6) { width: 60px; }
  }
`;

const TableHead = styled.thead`
  tr { background: transparent; }

  td {
    /* Match body padding exactly so right-aligned headers sit above values. */
    padding: 0.55rem 0.4rem;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #94a3b8;
    border-bottom: 1px solid #e2e8f0;
    background: transparent;
  }

  td.pts-cell { color: #0f172a; }

  @media (max-width: 600px) {
    td {
      padding: 0.45rem 0.2rem;
      font-size: 0.62rem;
    }
  }
`;

const TableRow = styled.tr`
  background: #ffffff;
  transition: background-color 0.15s ease;
  cursor: pointer;

  td {
    padding: 0.7rem 0.4rem;
    border-bottom: 1px solid #eef2f7;
    background: transparent;
    font-weight: 500;
    color: #0f172a;
    vertical-align: middle;
  }

  &:hover td { background: #f8fafc; }
  &:focus { outline: none; }
  &:focus-visible td { background: #eff6ff; }
  &:last-child td { border-bottom: none; }

  /* NRR sign colour */
  td.nrr-cell {
    color: ${(props) =>
      props.variant === "top" ? "#059669"
      : props.variant === "eliminated" || props.variant === "bottom" ? "#dc2626"
      : "#0f172a"};
    font-weight: 600;
  }

  /* PTS highlighted — colour depends on qualifying zone */
  td.pts-cell {
    font-weight: 800;
    font-size: 1em;
    color: #0f172a;
  }
  td.pts-cell.pts-top { color: #047857; }  /* dark bold green for top qualifiers */
  td.pts-cell.pts-mid { color: #b45309; }  /* bold amber/yellow for upper-half of rest */
  td.pts-cell.pts-low { color: #b91c1c; }  /* bold dark red for lower-half of rest */

  @media (max-width: 600px) {
    td { padding: 0.6rem 0.2rem; }
    td.pts-cell { font-size: 1em; }
  }
`;

const TableCell = styled.td`
  white-space: nowrap;
`;

const HighlightCell = styled(TableCell)`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  color: #0f172a;
  font-weight: 600;
  min-width: 0;

  tr:hover & .team-name { color: #4f46e5; }

  img {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    object-fit: cover;
    background: #f1f5f9;
    flex-shrink: 0;
  }

  .team-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    transition: color 0.15s ease;
  }

  @media (max-width: 600px) {
    gap: 0.45rem;
    img { width: 22px; height: 22px; }
  }
`;

const QualifierBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #10b981;
  color: #ffffff;
  font-size: 10px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: 0.04em;
  flex-shrink: 0;
`;

const EliminatedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #ef4444;
  color: #ffffff;
  font-size: 10px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: 0.04em;
  flex-shrink: 0;
`;

const RankCell = styled(TableCell)`
  color: #64748b;
  font-weight: 500;
  text-align: left;
  padding-left: 0.25rem !important;

  @media (max-width: 600px) {
    font-size: 0.82rem;
    padding-left: 0.1rem !important;
  }
`;

// Team Details Modal Styles ---------------------------------
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(6px);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: clamp(0.75rem, 3vw, 2rem);
  overflow-y: auto;
  z-index: 9999;
  animation: pt-fade 0.2s ease-out;

  @keyframes pt-fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContent = styled.div`
  background: #ffffff;
  border-radius: 20px;
  padding: clamp(1rem, 3vw, 1.75rem);
  max-width: 640px;
  width: 100%;
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  box-shadow: 0 30px 60px -20px rgba(15, 23, 42, 0.45);
  animation: pt-pop 0.25s ease-out;
  -webkit-overflow-scrolling: touch;
  margin: auto;

  @keyframes pt-pop {
    from { transform: translateY(12px) scale(0.98); opacity: 0; }
    to { transform: translateY(0) scale(1); opacity: 1; }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px dashed rgba(148, 163, 184, 0.4);
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
  font-size: clamp(1rem, 3.5vw, 1.2rem);
  font-weight: 800;
  letter-spacing: -0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  img {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #ffffff;
    box-shadow: 0 6px 14px -8px rgba(15, 23, 42, 0.4);
    flex-shrink: 0;
  }
`;

const CloseButton = styled.button`
  background: linear-gradient(135deg, #ef4444, #b91c1c);
  color: #ffffff;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  cursor: pointer;
  font-size: 20px;
  font-weight: 600;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 10px 20px -12px rgba(239, 68, 68, 0.6);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 14px 26px -12px rgba(239, 68, 68, 0.7);
  }
`;

const TeamStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;

  @media (max-width: 520px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.5rem;
  }
`;

const StatCard = styled.div`
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  padding: 0.75rem;
  border-radius: 12px;
  text-align: center;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-left: 4px solid ${props => props.color || '#6366f1'};
  box-shadow: 0 6px 16px -12px rgba(15, 23, 42, 0.3);
  transition: transform 0.15s ease;

  &:hover {
    transform: translateY(-2px);
  }
`;

const StatValue = styled.div`
  font-size: clamp(1.2rem, 4vw, 1.55rem);
  font-weight: 900;
  color: #0f172a;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
`;

const StatLabel = styled.div`
  font-size: 0.72rem;
  color: #64748b;
  margin-top: 0.25rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const MatchTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.75rem;
  font-size: 0.88rem;

  @media (max-width: 520px) {
    display: block;
    thead { display: none; }
    tbody { display: block; }
  }
`;

const MatchTableHead = styled.thead`
  background: #f8fafc;
  font-weight: 700;
`;

const MatchTableRow = styled.tr`
  border-bottom: 1px solid rgba(148, 163, 184, 0.25);
  transition: background-color 0.15s ease;

  &:hover {
    background-color: rgba(99, 102, 241, 0.05);
  }

  @media (max-width: 520px) {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.35rem 0.75rem;
    align-items: center;
    padding: 0.6rem 0.75rem;
    margin-bottom: 0.5rem;
    border: 1px solid rgba(148, 163, 184, 0.25);
    border-radius: 10px;
    background: #ffffff;
  }
`;

const MatchTableCell = styled.td`
  padding: 0.65rem 0.55rem;
  text-align: left;
  color: #0f172a;

  &:first-child {
    font-weight: 700;
  }

  @media (max-width: 520px) {
    padding: 0 !important;
    font-size: 0.85rem;

    &:nth-child(1) { grid-column: 1; grid-row: 1; }
    &:nth-child(2) { grid-column: 2; grid-row: 1; }
    &:nth-child(3) { grid-column: 1; grid-row: 2; color: #64748b; font-size: 0.78rem; }
    &:nth-child(4) { grid-column: 2; grid-row: 2; }
  }
`;

const MatchTableHeader = styled.th`
  padding: 0.65rem 0.55rem;
  text-align: left;
  font-weight: 700;
  font-size: 0.72rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const ResultCell = styled(MatchTableCell)`
  color: ${props =>
    props.result === 'win' ? '#047857' :
    props.result === 'loss' ? '#b91c1c' : '#64748b'};
  font-weight: 800;

  @media (max-width: 520px) {
    text-align: right;
    font-size: 0.85rem;
  }
`;

const FairnessCell = styled(MatchTableCell)`
  text-align: center;
  font-weight: 700;
  font-variant-numeric: tabular-nums;

  @media (max-width: 520px) {
    text-align: right;

    &::before {
      content: 'Fair ';
      font-size: 0.62rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      margin-right: 0.25rem;
    }
  }
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

  const TOTAL_MATCHES = 13;
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
      
      // If points are equal, sort by NRR (descending)
      const nrrA = Number(a.nrr) || 0;
      const nrrB = Number(b.nrr) || 0;
      if (nrrB !== nrrA) return nrrB - nrrA;
      
      // If NRR is equal, sort by fairness (descending)
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

  const renderTableBody = (list) => {
    const qualifiers = mode === 'groups' ? GROUP_QUALIFIERS : NUM_QUALIFIERS;
    const totalTeams = list.length;
    const remaining = Math.max(0, totalTeams - qualifiers);
    // Upper half of the remaining rows get yellow, lower half get red.
    // If the remainder is odd, the extra row goes to yellow (nicer for tight tables).
    const yellowCount = Math.ceil(remaining / 2);

    return (
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
            // All teams completed 13 matches - show Q for top 6/8, E for rest
            showQ = index < NUM_QUALIFIERS;
            showE = index >= NUM_QUALIFIERS;
            qTitle = worldCupMode ? "Qualified (Top 8)" : "Qualified (Top 6)";
            eTitle = "Eliminated";
          } else {
            // During season: progressive Q for teams with 13 games + 18+ points
            const earlyEliminated = (
              (playedNow >= 12 && points <= 10) ||
              (playedNow >= 11 && points <= 8)  ||
              (playedNow >= 10 && points <= 6)  ||
              (playedNow >= 9  && points <= 4)
            );
            showQ = playedNow >= TOTAL_MATCHES && points >= 18; // 13 games done + 18+ points = qualified early
            showE = earlyEliminated;
            qTitle = "Qualified (13 games, 18+ pts)";
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
          <TableRow
            key={team._id || `${team.teamName}-${index}`}
            index={index}
            variant={variant}
            onClick={() => handleTeamClick(team)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTeamClick(team);
              }
            }}
          >
            <RankCell>{index + 1}</RankCell>
            <HighlightCell>
              <img src={teamImage} alt={team.teamName} />
              <span className="team-name">{team.teamName}</span>
              {showQ ? (
                <QualifierBadge title={qTitle}>Q</QualifierBadge>
              ) : showE ? (
                <EliminatedBadge title={eTitle}>E</EliminatedBadge>
              ) : null}
            </HighlightCell>
            <TableCell>{team.matchesPlayed}</TableCell>
            <TableCell>{team.wins}</TableCell>
            <TableCell>{losses}</TableCell>
            <TableCell className="nrr-cell">{formatNRR(team.nrr)}</TableCell>
            <TableCell
              className={`pts-cell ${
                index < qualifiers
                  ? 'pts-top'
                  : (index - qualifiers) < yellowCount
                  ? 'pts-mid'
                  : 'pts-low'
              }`}
            >
              {String(Math.max(0, Number(team.points) || 0)).padStart(2, '0')}
            </TableCell>
            <TableCell>{team.fairness}</TableCell>
          </TableRow>
        );
      })}
    </tbody>
    );
  };

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
                      <TableCell>TEAM</TableCell>
                      <TableCell>M</TableCell>
                      <TableCell>W</TableCell>
                      <TableCell>L</TableCell>
                      <TableCell className="nrr-cell">NRR</TableCell>
                      <TableCell className="pts-cell">PTS</TableCell>
                      <TableCell>FAIR</TableCell>
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
                      <TableCell>TEAM</TableCell>
                      <TableCell>M</TableCell>
                      <TableCell>W</TableCell>
                      <TableCell>L</TableCell>
                      <TableCell className="nrr-cell">NRR</TableCell>
                      <TableCell className="pts-cell">PTS</TableCell>
                      <TableCell>FAIR</TableCell>
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
                      <TableCell>TEAM</TableCell>
                      <TableCell>M</TableCell>
                      <TableCell>W</TableCell>
                      <TableCell>L</TableCell>
                      <TableCell className="nrr-cell">NRR</TableCell>
                      <TableCell className="pts-cell">PTS</TableCell>
                      <TableCell>FAIR</TableCell>
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