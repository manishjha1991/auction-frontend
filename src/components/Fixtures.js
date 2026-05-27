import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import ReactSelect from "react-select"; // <-- 1) Import react-select
import { API_ENDPOINTS } from "../const";
import PlayoffFixtures from "./PlayoffFixtures";
import { useToast } from "./ToastNotification";

/* =========================================================
   Fixtures — mobile-first redesign
   Only styled-components are redesigned; all component names,
   props, JSX and logic stay identical.
   ========================================================= */

const StyledSelect = styled.select`
  width: 100%;
  margin: 0.35rem 0;
  padding: 0.75rem 0.85rem;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  background: white;
  cursor: pointer;
  min-height: 44px;
  color: #1f2937;

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
  }
`;

const FairnessTag = styled.div`
  display: inline-flex;
  align-items: center;
  margin-left: 0.35rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.02em;
  background: ${(props) => {
    if (!props.fairness) return "linear-gradient(135deg, #94a3b8, #64748b)";
    if (props.fairness > 7) return "linear-gradient(135deg, #10b981, #059669)";
    if (props.fairness > 4) return "linear-gradient(135deg, #f59e0b, #d97706)";
    return "linear-gradient(135deg, #ef4444, #dc2626)";
  }};
  box-shadow: 0 4px 10px -6px rgba(15, 23, 42, 0.4);
`;

const OversTag = styled.div`
  display: inline-flex;
  align-items: center;
  margin-left: 0.3rem;
  padding: 0.22rem 0.6rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #1e293b;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  border: 1px solid #a5b4fc;
  box-shadow: 0 4px 10px -6px rgba(99, 102, 241, 0.35);
  font-variant-numeric: tabular-nums;
`;

const NRRTag = styled.div`
  display: inline-flex;
  align-items: center;
  margin-left: 0.3rem;
  padding: 0.22rem 0.65rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
  background: ${(props) => {
    if (props.nrr > 0) return "linear-gradient(135deg, #10b981 0%, #059669 100%)";
    if (props.nrr < 0) return "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";
    return "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)";
  }};
  box-shadow: 0 6px 14px -8px rgba(15, 23, 42, 0.45);
`;

/* Tabs --------------------------------------------------- */
const TabContainer = styled.div`
  margin: 1rem auto 3rem;
  max-width: 1200px;
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 20px 45px -28px rgba(15, 23, 42, 0.35);
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.2);

  @media (max-width: 600px) {
    margin: 0.5rem auto 2rem;
    border-radius: 14px;
    border-left: none;
    border-right: none;
  }
`;

const TabHeader = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 0.25rem;
  padding: 0.4rem;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid rgba(148, 163, 184, 0.25);
  scrollbar-width: none;
  -ms-overflow-style: none;
  position: sticky;
  top: 0;
  z-index: 30;
  backdrop-filter: blur(10px);

  &::-webkit-scrollbar { display: none; }
`;

const TabButton = styled.button`
  flex: 1 1 auto;
  min-width: max-content;
  padding: 0.7rem 0.95rem;
  min-height: 44px;
  background: ${props => props.active
    ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
    : "transparent"};
  color: ${props => props.active ? "#ffffff" : "#475569"};
  border: none;
  border-radius: 10px;
  font-weight: ${props => props.active ? "700" : "600"};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.92rem;
  white-space: nowrap;
  box-shadow: ${props => props.active
    ? "0 12px 22px -14px rgba(79, 70, 229, 0.7)"
    : "none"};

  &:hover {
    background: ${props => props.active
      ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
      : "rgba(99, 102, 241, 0.08)"};
    color: ${props => props.active ? "#ffffff" : "#312e81"};
  }

  @media (max-width: 600px) {
    padding: 0.6rem 0.8rem;
    font-size: 0.85rem;
  }
`;

const FixtureWrapper = styled.div`
  padding: clamp(0.9rem, 3vw, 1.4rem);
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);

  h2 {
    margin: 0 0 0.5rem;
    font-size: clamp(1.2rem, 4vw, 1.55rem);
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.01em;
  }

  /* Let the inline fairness/overs/NRR strips breathe on mobile. */
  @media (max-width: 520px) {
    [class*="FairnessTag"],
    [class*="OversTag"],
    [class*="NRRTag"] {
      margin-left: 0.25rem;
    }
  }
`;

const SearchBar = styled.input`
  width: 100%;
  padding: 0.8rem 1rem 0.8rem 2.5rem;
  margin-bottom: 1rem;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 14px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  background: #ffffff
    url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'/%3E%3C/svg%3E")
    no-repeat 0.85rem center;
  box-shadow: 0 4px 14px -10px rgba(15, 23, 42, 0.3);
  min-height: 44px;

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18), 0 4px 14px -10px rgba(15, 23, 42, 0.3);
  }

  &::placeholder { color: #94a3b8; }
`;

const FixtureCard = styled.div`
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-left: 4px solid ${(props) => (props.hasMom ? "#10b981" : "#6366f1")};
  border-radius: 16px;
  margin-bottom: 0.85rem;
  padding: clamp(0.85rem, 3vw, 1.15rem);
  box-shadow: 0 12px 30px -22px rgba(15, 23, 42, 0.4);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 140px;
    height: 140px;
    background: radial-gradient(circle, ${(props) => (props.hasMom ? "rgba(16, 185, 129, 0.08)" : "rgba(99, 102, 241, 0.08)")}, transparent 70%);
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 18px 40px -22px rgba(15, 23, 42, 0.45);
    border-color: ${(props) => (props.hasMom ? "#10b981" : "#6366f1")};
  }
`;

const MatchHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 0.85rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px dashed rgba(148, 163, 184, 0.35);
  position: relative;
  z-index: 1;

  .match-number {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    color: #4338ca;
    font-weight: 800;
    font-size: 0.85rem;
    padding: 0.25rem 0.65rem;
    background: rgba(99, 102, 241, 0.1);
    border-radius: 999px;
  }

  .match-date {
    font-size: 0.78rem;
    color: #64748b;
    font-weight: 600;
  }
`;

const MatchDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.25rem;
  position: relative;
  z-index: 1;

  &::before {
    content: 'VS';
    grid-column: 2;
    grid-row: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f8fafc, #e2e8f0);
    border: 1px solid rgba(148, 163, 184, 0.35);
    font-size: 0.72rem;
    font-weight: 800;
    color: #64748b;
    letter-spacing: 0.05em;
    box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 2px 6px rgba(15, 23, 42, 0.08);
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
    gap: 0.5rem;

    &::before {
      grid-column: 1;
      grid-row: 2;
      justify-self: center;
      width: 32px;
      height: 32px;
      font-size: 0.65rem;
    }
  }
`;

const TeamBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 0.6rem;
  border-radius: 12px;
  background: ${(props) =>
    props.isWinner
      ? "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.03))"
      : props.isLoser
      ? "linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.02))"
      : "rgba(248, 250, 252, 0.6)"};
  border: 1px solid ${(props) =>
    props.isWinner
      ? "rgba(16, 185, 129, 0.4)"
      : props.isLoser
      ? "rgba(239, 68, 68, 0.25)"
      : "rgba(148, 163, 184, 0.2)"};
  text-align: center;
  min-width: 0;

  .team-name {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.25rem 0.4rem;
    font-size: 0.9rem;
    font-weight: 800;
    letter-spacing: -0.01em;
    line-height: 1.2;
    color: ${(props) =>
      props.isWinner ? "#047857" : props.isLoser ? "#b91c1c" : "#0f172a"};
    word-break: break-word;
    max-width: 100%;
  }

  .score {
    font-size: clamp(1rem, 3.5vw, 1.2rem);
    font-weight: 800;
    letter-spacing: 0.02em;
    color: #ffffff;
    background: ${(props) =>
      props.isWinner
        ? "linear-gradient(135deg, #10b981, #047857)"
        : props.isLoser
        ? "linear-gradient(135deg, #ef4444, #b91c1c)"
        : "linear-gradient(135deg, #64748b, #475569)"};
    padding: 0.4rem 0.9rem;
    border-radius: 10px;
    display: inline-block;
    min-width: 72px;
    text-align: center;
    font-variant-numeric: tabular-nums;
    box-shadow: 0 6px 14px -8px
      ${(props) =>
        props.isWinner
          ? "rgba(16, 185, 129, 0.6)"
          : props.isLoser
          ? "rgba(239, 68, 68, 0.55)"
          : "rgba(100, 116, 139, 0.5)"};
  }

  @media (max-width: 520px) {
    padding: 0.6rem 0.5rem;

    .team-name { font-size: 0.85rem; }
    .score { min-width: 64px; padding: 0.35rem 0.7rem; }
  }
`;

const MomDetails = styled.div`
  margin-top: 0.85rem;
  padding: 0.75rem 0.85rem;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border-radius: 12px;
  border: 1px solid #fcd34d;
  position: relative;
  z-index: 1;
  box-shadow: 0 4px 14px -10px rgba(245, 158, 11, 0.6);

  &::before {
    content: '🏅 Man of the match';
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.68rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-weight: 800;
    color: #92400e;
    margin-bottom: 0.55rem;
  }

  .mom-header,
  .mom-info {
    display: grid;
    grid-template-columns: 1.6fr 1fr 1fr;
    gap: 0.5rem;
    align-items: center;
    font-size: 0.82rem;
    color: #78350f;
    text-align: center;
  }

  .mom-header {
    font-weight: 700;
    color: #78350f;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding-bottom: 0.3rem;
    border-bottom: 1px dashed rgba(180, 83, 9, 0.3);
    margin-bottom: 0.35rem;
  }

  .mom-info {
    font-weight: 800;
    font-size: 0.95rem;
    color: #7c2d12;
  }

  .mom-info > span:first-child {
    text-align: left;
    color: #78350f;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mom-info > span:not(:first-child) {
    font-variant-numeric: tabular-nums;
  }
`;

const EditButton = styled.button`
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 0.55rem 1.1rem;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.88rem;
  min-height: 40px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 10px 20px -10px rgba(79, 70, 229, 0.65);
  letter-spacing: 0.02em;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 26px -10px rgba(79, 70, 229, 0.75);
  }

  &:active { transform: scale(0.98); }
`;

const ModalWrapper = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(6px);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: clamp(0.75rem, 3vw, 2rem);
  overflow-y: auto;
  z-index: 1000;
  animation: up-fx-fade 0.2s ease-out;

  @keyframes up-fx-fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContent = styled.div`
  background: #ffffff;
  padding: clamp(1rem, 3vw, 1.6rem);
  border-radius: 20px;
  width: 100%;
  max-width: 480px;
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  box-shadow: 0 30px 60px -20px rgba(15, 23, 42, 0.4);
  text-align: left;
  margin: 1rem auto;
  animation: up-fx-pop 0.25s ease-out;
  -webkit-overflow-scrolling: touch;

  h3 {
    color: #0f172a;
    font-size: 1.15rem;
    font-weight: 800;
    margin: 0 0 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px dashed rgba(148, 163, 184, 0.4);
    letter-spacing: -0.01em;
  }

  @keyframes up-fx-pop {
    from { transform: translateY(12px) scale(0.98); opacity: 0; }
    to { transform: translateY(0) scale(1); opacity: 1; }
  }

  @media (max-width: 520px) {
    border-radius: 18px;
    max-height: calc(100vh - 1.5rem);
    padding: 1rem;
  }
`;

const Input = styled.input`
  width: 100%;
  margin: 0.35rem 0;
  padding: 0.75rem 0.85rem;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  min-height: 44px;
  background: #ffffff;
  color: #0f172a;

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
  }

  &::placeholder { color: #94a3b8; }
`;

const SubmitButton = styled.button`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 0.8rem 1.25rem;
  margin-top: 0.85rem;
  margin-right: 0.5rem;
  font-weight: 800;
  font-size: 0.95rem;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  min-height: 46px;
  box-shadow: 0 14px 26px -12px rgba(16, 185, 129, 0.65);
  letter-spacing: 0.02em;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 18px 32px -14px rgba(16, 185, 129, 0.7);
  }

  &:active { transform: scale(0.98); }

  @media (max-width: 520px) {
    width: 100%;
    margin-right: 0;
    margin-top: 0.75rem;
  }
`;

const CloseButton = styled.button`
  background: #f1f5f9;
  color: #334155;
  border: 1px solid rgba(148, 163, 184, 0.4);
  border-radius: 12px;
  padding: 0.8rem 1.25rem;
  margin-top: 0.85rem;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
  min-height: 46px;
  letter-spacing: 0.02em;

  &:hover {
    background: #e2e8f0;
    color: #0f172a;
  }

  &:active { transform: scale(0.98); }

  @media (max-width: 520px) {
    width: 100%;
  }
`;

const MarginText = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.74rem;
  color: #78350f;
  font-weight: 700;
  margin-top: 0.35rem;
  padding: 0.28rem 0.65rem;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 999px;
  border: 1px solid #fcd34d;
  width: fit-content;
  box-shadow: 0 4px 10px -6px rgba(245, 158, 11, 0.55);
`;

// Abbreviation helper for fairness display
const getAbbreviation = (name) => {
  if (!name) return "UNK";
  return name.slice(0, 3).toUpperCase();
};

const Fixtures = () => {
  const { showToast } = useToast();
  const [fixtures, setFixtures] = useState([]);
  const [filteredFixtures, setFilteredFixtures] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentFixture, setCurrentFixture] = useState(null);
  const [teams, setTeams] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [mode, setMode] = useState('overall');
  const [top6Teams, setTop6Teams] = useState([]);

  // Using empty strings here so placeholder shows up until user enters something
  const [winner, setWinner] = useState("");
  const [margin, setMargin] = useState("");
  const [mom, setMom] = useState({ name: "", score: "", wickets: "" });
  const [team1Score, setTeam1Score] = useState("");
  const [team2Score, setTeam2Score] = useState("");
  const [team1Overs, setTeam1Overs] = useState("");
  const [team2Overs, setTeam2Overs] = useState("");
  const [players, setPlayers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Using empty strings so "Fairness" fields show placeholders initially
  const [team1Fairness, setTeam1Fairness] = useState("");
  const [team2Fairness, setTeam2Fairness] = useState("");

  // Define fetchFixtures function with useCallback to prevent infinite loops
  const fetchFixtures = useCallback(async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS}/api/fixtures?mode=${mode}`);
      const sortedFixtures = response.data.sort((a, b) => {
        if (a.winner && !b.winner) return -1;
        if (!a.winner && b.winner) return 1;
        return new Date(a.date) - new Date(b.date);
      });
      
      // Debug logging
      console.log('📊 Fixtures data:', {
        total: sortedFixtures.length,
        groupA: sortedFixtures.filter(fx => fx.group === 'A').length,
        groupB: sortedFixtures.filter(fx => fx.group === 'B').length,
        normal: sortedFixtures.filter(fx => fx.matchType === 'normal').length,
        sample: sortedFixtures.slice(0, 3).map(fx => ({
          teams: `${fx.team1} vs ${fx.team2}`,
          group: fx.group,
          matchType: fx.matchType
        }))
      });
      
      setFixtures(sortedFixtures);
      setFilteredFixtures(sortedFixtures);
    } catch (error) {
      console.error("Error fetching fixtures:", error);
    }
  }, [mode]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setIsAdmin(user?.isAdmin === true);
    
    const fetchTeams = async () => {
      try {
        const t = await axios.get(`${API_ENDPOINTS}/api/users/teams`);
        setTeams(t.data?.teams || []);
      } catch {}
    };
    
    const fetchMode = async () => {
      try {
        const settings = await axios.get(`${API_ENDPOINTS}/api/settings`);
        const pmode = settings?.data?.pointsMode || 'overall';
        setMode(pmode);
        
        // Set default active tab based on mode
        if (pmode === 'groups') {
          setActiveTab('groupA'); // Default to Group A when in group mode
        } else {
          setActiveTab('all'); // Default to All when in normal mode
        }
      } catch (error) {
        console.error("Error fetching mode:", error);
      }
    };
    
    const fetchTop6Teams = async () => {
      try {
        const response = await axios.get(`${API_ENDPOINTS}/api/users/points-table`);
        const teams = response.data.filter(team => team.teamName !== "NA");
        const sortedTeams = teams.sort((a, b) => {
          const pointsA = Number(a.points) || 0;
          const pointsB = Number(b.points) || 0;
          if (pointsB !== pointsA) return pointsB - pointsA;
          const fairnessA = Number(a.fairness) || 0;
          const fairnessB = Number(b.fairness) || 0;
          return fairnessB - fairnessA;
        });
        setTop6Teams(sortedTeams.slice(0, 6));
      } catch (error) {
        console.error("Error fetching top 6 teams:", error);
      }
    };
    
    fetchFixtures();
    fetchTeams();
    fetchMode();
    fetchTop6Teams();
  }, []);

  // Refetch fixtures when mode changes
  useEffect(() => {
    if (mode) {
      fetchFixtures();
    }
  }, [mode, fetchFixtures]);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    // The useEffect will handle the filtering automatically
  };

  const getGroupForTeam = (teamName) => {
    const team = teams.find(t => t.teamName === teamName);
    return team?.group || null;
  };

  const applyFilters = (list) => {
    let filtered = list;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (fixture) =>
          fixture.team1.toLowerCase().includes(searchQuery.toLowerCase()) ||
          fixture.team2.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply group filter based on active tab
    if (activeTab === 'groupA') {
      filtered = filtered.filter(fx => fx.group === 'A');
    } else if (activeTab === 'groupB') {
      filtered = filtered.filter(fx => fx.group === 'B');
    } else if (activeTab === 'all') {
      // Show all fixtures (only available in normal mode)
      filtered = filtered;
    }

    // Debug logging
    console.log('🔍 Filtering fixtures:', {
      totalFixtures: list.length,
      activeTab,
      searchQuery,
      filteredCount: filtered.length,
      groupA: list.filter(fx => fx.group === 'A').length,
      groupB: list.filter(fx => fx.group === 'B').length,
      normal: list.filter(fx => fx.matchType === 'normal').length
    });

    return filtered;
  };

  useEffect(() => {
    setFilteredFixtures(applyFilters(fixtures));
  }, [fixtures, activeTab, searchQuery]);

  const handleWinnerChange = (selectedTeam) => {
    setWinner(selectedTeam);
    // If you still want to maintain "players" for any reason,
    // you can combine both teams' details or keep existing logic:
    const playersList =
      selectedTeam === currentFixture?.team1
        ? currentFixture?.team1Details?.players || []
        : currentFixture?.team2Details?.players || [];
    setPlayers(playersList.map((player) => player.name));
  };

  const handleEditFixture = (fixture) => {
    setCurrentFixture(fixture);

    // Populate fields with existing values or empty strings
    setWinner(fixture.winner || "");
    setMargin(fixture.margin || "");
    setTeam1Score(fixture.team1Score || "");
    setTeam2Score(fixture.team2Score || "");
    setTeam1Overs(fixture.team1Overs || "");
    setTeam2Overs(fixture.team2Overs || "");

    // Convert numeric fields to string so placeholders can show up
    setMom({
      name: fixture.mom?.name || "",
      score: fixture.mom?.score?.toString() || "",
      wickets: fixture.mom?.wickets?.toString() || "",
    });

    setTeam1Fairness(
      fixture.team1Fairness ? fixture.team1Fairness.toString() : ""
    );
    setTeam2Fairness(
      fixture.team2Fairness ? fixture.team2Fairness.toString() : ""
    );

    setPlayers([]);
    setShowModal(true);
  };

  const handleSaveFixture = async () => {
    try {
      // Get user ID from localStorage for admin authentication
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user?.id || user?._id;
      
      if (!userId) {
        showToast('User not authenticated. Please log in again.', 'error');
        return;
      }

      // Validate score format: must be in "runs/wickets" format (e.g., "107/10", "150/5")
      const scoreFormatRegex = /^\d+\/\d+$/; // Matches "number/number" format
      
      if (team1Score && !scoreFormatRegex.test(team1Score.trim())) {
        showToast({
          title: 'Invalid Score Format',
          message: `${currentFixture?.team1} score format is invalid. Expected format: runs/wickets (e.g., "107/10", "150/5"). Received: "${team1Score}"`
        }, 'error');
        return;
      }
      
      if (team2Score && !scoreFormatRegex.test(team2Score.trim())) {
        showToast({
          title: 'Invalid Score Format',
          message: `${currentFixture?.team2} score format is invalid. Expected format: runs/wickets (e.g., "107/10", "150/5"). Received: "${team2Score}"`
        }, 'error');
        return;
      }

      // Validate required fields - overs are mandatory
      if (!team1Overs || team1Overs.trim() === '') {
        showToast(`${currentFixture?.team1} overs is required`, 'error');
        return;
      }
      if (!team2Overs || team2Overs.trim() === '') {
        showToast(`${currentFixture?.team2} overs is required`, 'error');
        return;
      }

      // Convert string inputs back to numbers safely - MOM stats are optional
      const updatedMom = {
        name: mom.name || null,
        score: mom.score ? Number(mom.score) : null,
        wickets: mom.wickets ? Number(mom.wickets) : null,
      };

      const updatedFixture = {
        ...currentFixture,
        winner,
        margin,
        team1Score,
        team2Score,
        team1Overs: team1Overs.trim(),
        team2Overs: team2Overs.trim(),
        mom: updatedMom,
        team1Fairness: team1Fairness ? Number(team1Fairness) : 0,
        team2Fairness: team2Fairness ? Number(team2Fairness) : 0,
      };

      await axios.post(`${API_ENDPOINTS}/api/fixtures/save`, updatedFixture, {
        headers: {
          'user-id': userId
        }
      });

      setFixtures((prevFixtures) =>
        prevFixtures.map((fx) =>
          fx._id === currentFixture._id ? updatedFixture : fx
        )
      );

      setFilteredFixtures((prevFixtures) =>
        prevFixtures.map((fx) =>
          fx._id === currentFixture._id ? updatedFixture : fx
        )
      );

      setShowModal(false);
      showToast("Fixture updated successfully!", 'success');
    } catch (error) {
      console.error("Error saving fixture:", error);
      showToast(error.response?.data?.error || "Failed to save fixture.", 'error');
    }
  };

  // Combine both teams' players for the Mom dropdown (with search)
  // Use useMemo to ensure it updates when currentFixture changes
  const playerOptions = useMemo(() => {
    if (!currentFixture) return [];
    
    const team1Players = currentFixture.team1Details?.players || [];
    const team2Players = currentFixture.team2Details?.players || [];
    
    console.log('🔍 Building MOM player options:', {
      team1: currentFixture.team1,
      team1PlayersCount: team1Players.length,
      team2: currentFixture.team2,
      team2PlayersCount: team2Players.length,
      team1Players: team1Players.map(p => p.name),
      team2Players: team2Players.map(p => p.name)
    });
    
    // Combine both teams' players
    const allPlayers = [
      ...team1Players,
      ...team2Players,
    ];
    
    // Remove duplicates (in case same player appears in both teams - shouldn't happen but safe)
    const uniquePlayers = Array.from(
      new Map(allPlayers.map(p => [p.name || p._id, p])).values()
    );
    
    const options = uniquePlayers.map((p) => ({
      value: p.name,
      label: p.name,
    }));
    
    console.log('✅ Total MOM player options:', options.length, options.map(o => o.label));
    
    return options;
  }, [currentFixture]);

  return (
    <TabContainer>
      <TabHeader>
        {mode !== 'groups' && (
          <TabButton 
            active={activeTab === 'all'} 
            onClick={() => setActiveTab('all')}
          >
            All Fixtures ({fixtures.length})
          </TabButton>
        )}
        {mode === 'groups' && (
          <>
            <TabButton 
              active={activeTab === 'groupA'} 
              onClick={() => setActiveTab('groupA')}
            >
              Group A ({fixtures.filter(fx => fx.group === 'A').length})
            </TabButton>
            <TabButton 
              active={activeTab === 'groupB'} 
              onClick={() => setActiveTab('groupB')}
            >
              Group B ({fixtures.filter(fx => fx.group === 'B').length})
            </TabButton>
          </>
        )}
        <TabButton 
          active={activeTab === 'playoffs'} 
          onClick={() => setActiveTab('playoffs')}
        >
          Playoffs
        </TabButton>
      </TabHeader>
      
      <FixtureWrapper>
        <h2>Fixtures {mode === 'groups' && <span style={{ fontSize: '0.8rem', color: '#007bff', fontWeight: 'normal' }}>(Group Stage Mode)</span>}</h2>
        {isAdmin && (
          <p style={{ margin: '0 0 1rem' }}>
            <Link
              to="/fixture-confirmations"
              style={{
                color: '#2563eb',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Review pending fixture OCR submissions →
            </Link>
          </p>
        )}
        {!isAdmin && (
          <p style={{ margin: '0 0 1rem' }}>
            <Link
              to="/fixture-confirmations"
              style={{
                color: '#2563eb',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Confirm opponent match results →
            </Link>
          </p>
        )}
        <div style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600, color: '#374151' }}>
          {activeTab === 'playoffs' ? (
            'Playoff fixtures'
          ) : (() => {
            const baseList = activeTab === 'groupA' ? fixtures.filter(fx => fx.group === 'A')
              : activeTab === 'groupB' ? fixtures.filter(fx => fx.group === 'B')
              : fixtures;
            const completed = baseList.filter(f => f.winner || (f.team1Score && f.team2Score)).length;
            const remaining = baseList.length - completed;
            return (
              <>{remaining} matches remaining out of {baseList.length} matches</>
            );
          })()}
        </div>
        <SearchBar
          type="text"
          placeholder="Search by team name"
          value={searchQuery}
          onChange={handleSearch}
        />
        

        {/* Show fixtures based on active tab */}
        {activeTab === 'playoffs' ? (
          <PlayoffFixtures top6Teams={top6Teams} mode={mode} />
        ) : (
          filteredFixtures.map((fixture, index) => (
        <FixtureCard key={fixture._id} hasMom={!!fixture.mom?.name}>
          <MatchHeader>
            <div className="match-number">
              T20 {index + 1} of {filteredFixtures.length}
            </div>
            <div className="match-date">{fixture.date || ""}</div>
          </MatchHeader>

          <MatchDetails hasMom={!!fixture.mom?.name}>
            {Number(fixture.team1Score || 0) >= Number(fixture.team2Score || 0) ? (
              <>
                <TeamBox
                  isWinner={fixture.winner === fixture.team1}
                  isLoser={fixture.winner === fixture.team2}
                  hasMom={!!fixture.mom?.name}
                >
                  <div className="team-name">
                    {fixture.team1}
                    {getGroupForTeam(fixture.team1) ? (
                      <span style={{ marginLeft: '6px', fontSize: '0.72rem', color: '#0d6efd', background: 'rgba(13,110,253,0.08)', border: '1px solid rgba(13,110,253,0.2)', padding: '2px 6px', borderRadius: '999px' }}>
                        G{getGroupForTeam(fixture.team1)}
                      </span>
                    ) : null}
                    {fixture.winner === fixture.team1 && fixture.margin && (
                      <MarginText>(Won by {fixture.margin})</MarginText>
                    )}
                  </div>
                  <div className="score">{fixture.team1Score || "TBD"}</div>
                </TeamBox>
                <TeamBox
                  isWinner={fixture.winner === fixture.team2}
                  isLoser={fixture.winner === fixture.team1}
                  hasMom={!!fixture.mom?.name}
                >
                  <div className="team-name">
                    {fixture.team2}
                    {getGroupForTeam(fixture.team2) ? (
                      <span style={{ marginLeft: '6px', fontSize: '0.72rem', color: '#20c997', background: 'rgba(32,201,151,0.08)', border: '1px solid rgba(32,201,151,0.2)', padding: '2px 6px', borderRadius: '999px' }}>
                        G{getGroupForTeam(fixture.team2)}
                      </span>
                    ) : null}
                    {fixture.winner === fixture.team2 && fixture.margin && (
                      <MarginText>(Won by {fixture.margin})</MarginText>
                    )}
                  </div>
                  <div className="score">{fixture.team2Score || "TBD"}</div>
                </TeamBox>
              </>
            ) : (
              <>
                <TeamBox
                  isWinner={fixture.winner === fixture.team2}
                  isLoser={fixture.winner === fixture.team1}
                  hasMom={!!fixture.mom?.name}
                >
                  <div className="team-name">
                    {fixture.team2}
                    {getGroupForTeam(fixture.team2) ? (
                      <span style={{ marginLeft: '6px', fontSize: '0.72rem', color: '#20c997', background: 'rgba(32,201,151,0.08)', border: '1px solid rgba(32,201,151,0.2)', padding: '2px 6px', borderRadius: '999px' }}>
                        G{getGroupForTeam(fixture.team2)}
                      </span>
                    ) : null}
                    {fixture.winner === fixture.team2 && fixture.margin && (
                      <MarginText>(Won by {fixture.margin})</MarginText>
                    )}
                  </div>
                  <div className="score">{fixture.team2Score || "TBD"}</div>
                </TeamBox>
                <TeamBox
                  isWinner={fixture.winner === fixture.team1}
                  isLoser={fixture.winner === fixture.team2}
                  hasMom={!!fixture.mom?.name}
                >
                  <div className="team-name">
                    {fixture.team1}
                    {getGroupForTeam(fixture.team1) ? (
                      <span style={{ marginLeft: '6px', fontSize: '0.72rem', color: '#0d6efd', background: 'rgba(13,110,253,0.08)', border: '1px solid rgba(13,110,253,0.2)', padding: '2px 6px', borderRadius: '999px' }}>
                        G{getGroupForTeam(fixture.team1)}
                      </span>
                    ) : null}
                    {fixture.winner === fixture.team1 && fixture.margin && (
                      <MarginText>(Won by {fixture.margin})</MarginText>
                    )}
                  </div>
                  <div className="score">{fixture.team1Score || "TBD"}</div>
                </TeamBox>
              </>
            )}
          </MatchDetails>

          {/* Show both teams' fairness on the same line */}
          <div
            style={{
              marginTop: "0.5rem",
              textAlign: "left",
              display: "flex",
              gap: "1rem",
            }}
          >
            <div>
              <strong>{getAbbreviation(fixture.team1)}:&nbsp;</strong>
              <FairnessTag fairness={fixture.team1Fairness}>
                {fixture.team1Fairness || "N/A"}
              </FairnessTag>
            </div>
            <div>
              <strong>{getAbbreviation(fixture.team2)}:&nbsp;</strong>
              <FairnessTag fairness={fixture.team2Fairness}>
                {fixture.team2Fairness || "N/A"}
              </FairnessTag>
            </div>
          </div>

          {/* Show both teams' overs played on the same line */}
          {fixture.winner && (fixture.team1Overs || fixture.team2Overs) && (
            <div
              style={{
                marginTop: "0.75rem",
                padding: "0.75rem",
                background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <span style={{ 
                fontSize: "0.75rem", 
                color: "#64748b", 
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                Overs
              </span>
              <div style={{
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                gap: "0.75rem",
                alignItems: "center"
              }}>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "0.5rem",
                  padding: "0.25rem 0.75rem",
                  background: "white",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  flex: "1 1 auto",
                  minWidth: 0
                }}>
                  <span style={{ 
                    fontSize: "0.75rem", 
                    color: "#475569", 
                    fontWeight: "600",
                    whiteSpace: "nowrap"
                  }}>
                    {getAbbreviation(fixture.team1)}
                  </span>
                  <OversTag>
                    {fixture.team1Overs || "N/A"}
                  </OversTag>
                </div>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "0.5rem",
                  padding: "0.25rem 0.75rem",
                  background: "white",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  flex: "1 1 auto",
                  minWidth: 0
                }}>
                  <span style={{ 
                    fontSize: "0.75rem", 
                    color: "#475569", 
                    fontWeight: "600",
                    whiteSpace: "nowrap"
                  }}>
                    {getAbbreviation(fixture.team2)}
                  </span>
                  <OversTag>
                    {fixture.team2Overs || "N/A"}
                  </OversTag>
                </div>
              </div>
            </div>
          )}

          {/* Show NRR gained/lost for both teams */}
          {fixture.winner && fixture.team1Score && fixture.team2Score && fixture.team1Overs && fixture.team2Overs && (() => {
            // Helper function to parse runs from score string
            const parseRuns = (scoreString) => {
              if (!scoreString) return 0;
              const scoreStr = String(scoreString).trim();
              if (scoreStr === 'null' || scoreStr === 'TBD' || scoreStr === 'NA' || scoreStr === '' || scoreStr === 'undefined') return 0;
              const match = scoreStr.match(/^(\d+)/);
              if (match) {
                const runs = parseInt(match[1], 10);
                return isNaN(runs) ? 0 : runs;
              }
              const num = parseFloat(scoreStr);
              return isNaN(num) ? 0 : Math.floor(num);
            };

            // Helper function to parse overs
            const parseOvers = (oversString) => {
              if (!oversString) return 20;
              const oversStr = String(oversString).trim();
              if (oversStr === 'null' || oversStr === 'TBD' || oversStr === 'NA' || oversStr === '' || oversStr === 'undefined') return 20;
              const decimalMatch = oversStr.match(/^(\d+)\.(\d+)$/);
              if (decimalMatch) {
                const overs = parseInt(decimalMatch[1], 10);
                const balls = parseInt(decimalMatch[2], 10);
                if (!isNaN(overs) && !isNaN(balls) && balls >= 0 && balls <= 5) {
                  return overs + (balls / 6);
                }
              }
              const wholeMatch = oversStr.match(/^(\d+)$/);
              if (wholeMatch) {
                const overs = parseInt(wholeMatch[1], 10);
                if (!isNaN(overs)) return overs;
              }
              const num = parseFloat(oversStr);
              return isNaN(num) ? 20 : num;
            };

            // Parse wickets to check for all-out
            const parseWickets = (scoreString) => {
              if (!scoreString) return 0;
              const scoreStr = String(scoreString).trim();
              const slashMatch = scoreStr.match(/\/(\d+)/);
              if (slashMatch) {
                const wickets = parseInt(slashMatch[1], 10);
                if (!isNaN(wickets) && wickets >= 0 && wickets <= 10) return wickets;
              }
              return 0;
            };

            const team1Runs = parseRuns(fixture.team1Score);
            const team2Runs = parseRuns(fixture.team2Score);
            const team1Wickets = parseWickets(fixture.team1Score);
            const team2Wickets = parseWickets(fixture.team2Score);
            
            let team1OversActual = parseOvers(fixture.team1Overs);
            let team2OversActual = parseOvers(fixture.team2Overs);

            // ICC Rule 1 & 2: Overs FACED
            // If team is all out (10 wickets), use 20.0 overs, otherwise use actual overs
            let team1OversFaced = (team1Wickets === 10) ? 20.0 : team1OversActual;
            let team2OversFaced = (team2Wickets === 10) ? 20.0 : team2OversActual;

            // ICC Rule 3: Overs BOWLED
            // If opposition is all out, use 20.0 overs, otherwise use actual overs
            let team1OversBowled = (team2Wickets === 10) ? 20.0 : team2OversActual;
            let team2OversBowled = (team1Wickets === 10) ? 20.0 : team1OversActual;

            // Calculate NRR for each team: (Runs Scored / Overs Faced) - (Runs Conceded / Overs Bowled)
            const team1NRR = team1OversFaced > 0 && team1OversBowled > 0 
              ? (team1Runs / team1OversFaced) - (team2Runs / team1OversBowled)
              : 0;
            const team2NRR = team2OversFaced > 0 && team2OversBowled > 0
              ? (team2Runs / team2OversFaced) - (team1Runs / team2OversBowled)
              : 0;

            return (
              <div
                style={{
                  marginTop: "0.75rem",
                  padding: "0.75rem",
                  background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                  borderRadius: "8px",
                  border: "1px solid #fbbf24",
                  textAlign: "left",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <span style={{ 
                  fontSize: "0.75rem", 
                  color: "#92400e", 
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  NRR (This Match)
                </span>
                <div style={{
                  display: "flex",
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  alignItems: "center"
                }}>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "0.5rem",
                    padding: "0.25rem 0.75rem",
                    background: "white",
                    borderRadius: "6px",
                    border: "1px solid #fbbf24",
                    flex: "1 1 auto",
                    minWidth: 0
                  }}>
                    <span style={{ 
                      fontSize: "0.75rem", 
                      color: "#475569", 
                      fontWeight: "600",
                      whiteSpace: "nowrap"
                    }}>
                      {getAbbreviation(fixture.team1)}
                    </span>
                    <NRRTag nrr={team1NRR}>
                      {team1NRR > 0 ? '+' : ''}{team1NRR.toFixed(3)}
                    </NRRTag>
                  </div>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "0.5rem",
                    padding: "0.25rem 0.75rem",
                    background: "white",
                    borderRadius: "6px",
                    border: "1px solid #fbbf24",
                    flex: "1 1 auto",
                    minWidth: 0
                  }}>
                    <span style={{ 
                      fontSize: "0.75rem", 
                      color: "#475569", 
                      fontWeight: "600",
                      whiteSpace: "nowrap"
                    }}>
                      {getAbbreviation(fixture.team2)}
                    </span>
                    <NRRTag nrr={team2NRR}>
                      {team2NRR > 0 ? '+' : ''}{team2NRR.toFixed(3)}
                    </NRRTag>
                  </div>
                </div>
              </div>
            );
          })()}

          {fixture.mom?.name && (
            <MomDetails>
              <div className="mom-header">
                <span>Name</span>
                <span>Run</span>
                <span>Wkt</span>
              </div>
              <div className="mom-info">
                <span>{fixture.mom.name}</span>
                <span>{fixture.mom.score}</span>
                <span>{fixture.mom.wickets}</span>
              </div>
            </MomDetails>
          )}
          {isAdmin && (
            <div style={{ textAlign: "right", marginTop: "1rem" }}>
              <EditButton onClick={() => handleEditFixture(fixture)}>
                Edit
              </EditButton>
            </div>
          )}
        </FixtureCard>
      ))
        )}

      {showModal && (
        <ModalWrapper>
          <ModalContent>
            <h3>Edit Fixture</h3>

            {/* Winner selection (unchanged, now uses StyledSelect) */}
            <StyledSelect
              value={winner}
              onChange={(e) => handleWinnerChange(e.target.value)}
            >
              <option value="">Select Winner</option>
              <option value={currentFixture?.team1}>
                {currentFixture?.team1}
              </option>
              <option value={currentFixture?.team2}>
                {currentFixture?.team2}
              </option>
            </StyledSelect>

            <Input
              type="text"
              placeholder="Margin (e.g. 5 runs or 2 wickets)"
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
            />
            <Input
              type="text"
              placeholder={`Team 1 Score (${currentFixture?.team1}) - Format: runs/wickets (e.g., 107/10)`}
              value={team1Score}
              onChange={(e) => setTeam1Score(e.target.value)}
            />
            <Input
              type="text"
              placeholder={`Team 2 Score (${currentFixture?.team2}) - Format: runs/wickets (e.g., 107/10)`}
              value={team2Score}
              onChange={(e) => setTeam2Score(e.target.value)}
            />
            <Input
              type="text"
              placeholder={`Team 1 Overs (e.g., 20.0, 19.3) *`}
              value={team1Overs}
              onChange={(e) => setTeam1Overs(e.target.value)}
              required
            />
            <Input
              type="text"
              placeholder={`Team 2 Overs (e.g., 20.0, 19.3) *`}
              value={team2Overs}
              onChange={(e) => setTeam2Overs(e.target.value)}
              required
            />

            {/* New searchable dropdown with both teams' players */}
            <ReactSelect
              placeholder="Select Man of the Match *"
              value={
                playerOptions.find((opt) => opt.value === mom.name) || null
              }
              onChange={(selectedOption) =>
                setMom({ ...mom, name: selectedOption?.value || "" })
              }
              options={playerOptions}
              isClearable
            />

            <Input
              type="number"
              placeholder="Batting Score (Optional)"
              value={mom.score}
              onChange={(e) => setMom({ ...mom, score: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Bowling Wickets (Optional)"
              value={mom.wickets}
              onChange={(e) => setMom({ ...mom, wickets: e.target.value })}
            />

            <Input
              type="number"
              placeholder={`Fairness for ${currentFixture?.team1}`}
              value={team1Fairness}
              onChange={(e) => setTeam1Fairness(e.target.value)}
            />
            <Input
              type="number"
              placeholder={`Fairness for ${currentFixture?.team2}`}
              value={team2Fairness}
              onChange={(e) => setTeam2Fairness(e.target.value)}
            />

            <SubmitButton onClick={handleSaveFixture}>Save</SubmitButton>
            <CloseButton onClick={() => setShowModal(false)}>Close</CloseButton>
          </ModalContent>
        </ModalWrapper>
      )}
      </FixtureWrapper>
    </TabContainer>
  );
};

export default Fixtures;
