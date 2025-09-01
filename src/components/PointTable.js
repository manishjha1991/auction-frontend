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
  max-width: 900px;
  border-radius: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  box-shadow: 0 18px 50px rgba(13,110,253,0.08);
  background: linear-gradient(180deg, #ffffff, #f7fbff) !important;
  border: 1px solid rgba(13,110,253,0.08);
`;

const Table = styled.table`
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
  text-align: center;
  font-size: 0.9rem;
  color: #343a40;
  table-layout: auto;

  @media (max-width: 600px) {
    font-size: 0.8rem; /* Adjust font size for smaller screens */
    min-width: 100%;
  }
`;

const TableHead = styled.thead`
  background: linear-gradient(90deg, rgba(13,110,253,0.06), rgba(32,201,151,0.06)) !important;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #343a40;
  letter-spacing: .02em;
  position: sticky;
  top: 0;
  z-index: 2;
  backdrop-filter: saturate(140%) blur(4px);

  @media (max-width: 600px) {
    font-size: 0.75rem;
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
  transition: transform .12s ease, box-shadow .12s ease;
  &:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,0.06); }
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
  font-weight: 800;
  color: #0d6efd;
`;

const SectionTitle = styled.h2`
  text-align: center;
  color: #0b132b;
  margin: 18px 0 8px;
  background: linear-gradient(90deg, #0d6efd, #20c997);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
`;

const FairnessPill = styled.span`
  display: inline-block;
  min-width: 34px;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.8rem;
  color: #0b132b;
  background: ${(props) => {
    const f = Number(props.value) || 0;
    if (f >= 8) return 'linear-gradient(135deg, rgba(32,201,151,.18), rgba(13,110,253,.18))';
    if (f >= 5) return 'rgba(255,193,7,.18)';
    return 'rgba(220,53,69,.18)';
  }};
  border: ${(props) => {
    const f = Number(props.value) || 0;
    if (f >= 8) return '1px solid rgba(32,201,151,.35)';
    if (f >= 5) return '1px solid rgba(255,193,7,.35)';
    return '1px solid rgba(220,53,69,.35)';
  }};
`;

const PointsBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(13,110,253,.12);
  border-radius: 999px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 1px 2px rgba(0,0,0,.05);
  @media (max-width: 600px) {
    display: none;
  }
`;

const PointsFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #0d6efd, #20c997);
  width: ${(props) => `${props.pct}%`};
  transition: width .3s ease;
`;

const HideOnMobile = styled(TableCell)`
  @media (max-width: 600px) {
    display: none;
  }
`;

const MobileMeta = styled.div`
  display: none;
  @media (max-width: 600px) {
    display: flex;
    gap: 6px;
    margin-left: 8px;
    font-size: 0.72rem;
    color: #6c757d;
  }
`;

const Chip = styled.span`
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid rgba(0,0,0,0.12);
  background: #f5f7fb;
`;





const PointsTable = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('overall');
  const [groups, setGroups] = useState({ A: [], B: [] });

  const TOTAL_MATCHES = 12;
  const NUM_QUALIFIERS = 6; // always top-6 qualify

  useEffect(() => {
    fetchModeAndData();
  }, []);

  const fetchModeAndData = async () => {
    try {
      setLoading(true);
      const settings = await axios.get(`${API_ENDPOINTS}/api/settings`);
      const pmode = settings?.data?.pointsMode || 'overall';
      setMode(pmode);
      if (pmode === 'groups') {
        const resp = await axios.get(`${API_ENDPOINTS}/api/users/points-table-grouped`);
        setGroups(resp.data?.groups || { A: [], B: [] });
      } else {
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

              const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
              return (
                <TableRow key={team._id} index={index} variant={variant}>
                  <RankCell>{medal ? medal : `${index + 1} -`}</RankCell>
                  <HighlightCell>
                    <img src={teamImage} alt={team.teamName} />
                    {team.teamName}
                    <MobileMeta>
                      <Chip>W {team.wins}</Chip>
                      <Chip>L {losses}</Chip>
                      <Chip>MP {team.matchesPlayed}</Chip>
                    </MobileMeta>
                    {showQ ? (
                      <QualifierBadge title={qTitle}>Q</QualifierBadge>
                    ) : showE ? (
                      <EliminatedBadge title={eTitle}>E</EliminatedBadge>
                    ) : null}
                  </HighlightCell>
                  <HideOnMobile>{team.wins}</HideOnMobile>
                  <HideOnMobile>{losses}</HideOnMobile>
                  <HideOnMobile><FairnessPill value={team.fairness}>{team.fairness}</FairnessPill></HideOnMobile>
                  <HideOnMobile>
                    <div style={{ minWidth: 90 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{team.points}</div>
                      <PointsBar>
                        <PointsFill pct={Math.min(100, Math.round(((Number(team.points)||0) / 24) * 100))} />
                      </PointsBar>
                    </div>
                  </HideOnMobile>
                  <HideOnMobile>{team.matchesPlayed}</HideOnMobile>
                </TableRow>
              );
            })}
    </tbody>
  );

  return (
    <>
      {mode === 'groups' ? (
        <>
          <TableWrapper>
            <SectionTitle>Group A</SectionTitle>
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
              {renderTableBody(groups.A)}
            </Table>
          </TableWrapper>
          <TableWrapper>
            <SectionTitle>Group B</SectionTitle>
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
              {renderTableBody(groups.B)}
            </Table>
          </TableWrapper>
        </>
      ) : (
        <TableWrapper>
          <SectionTitle>Points Table</SectionTitle>
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
            {renderTableBody(sortedTeams)}
          </Table>
        </TableWrapper>
      )}
    </>
  );
};

export default PointsTable;
