import React, { useEffect, useState, useCallback, useMemo } from "react";
import styled from "styled-components";
import axios from "axios";
import ReactSelect from "react-select"; // <-- 1) Import react-select
import { API_ENDPOINTS } from "../const";
import PlayoffFixtures from "./PlayoffFixtures";
import { useToast } from "./ToastNotification";

// We rename the existing styled Select component to StyledSelect:
const StyledSelect = styled.select`
  width: 90%;
  margin: 0.4rem 0;
  padding: 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
  background: white;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const FairnessTag = styled.div`
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #fff;
  background: ${(props) => {
    if (!props.fairness) return "#6b7280";
    if (props.fairness > 7) return "#10b981";
    if (props.fairness > 4) return "#f59e0b";
    return "#ef4444";
  }};
`;

const OversTag = styled.div`
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.3rem 0.7rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #1f2937;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  border: 1px solid #a5b4fc;
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.1);
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(99, 102, 241, 0.15);
  }
`;

const NRRTag = styled.div`
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.3rem 0.7rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #fff;
  background: ${(props) => {
    if (props.nrr > 0) return "linear-gradient(135deg, #10b981 0%, #059669 100%)";
    if (props.nrr < 0) return "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";
    return "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)";
  }};
  border: 1px solid ${(props) => {
    if (props.nrr > 0) return "#10b981";
    if (props.nrr < 0) return "#ef4444";
    return "#6b7280";
  }};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
  }
`;

// Tab styles
const TabContainer = styled.div`
  margin: 2rem auto;
  max-width: 1200px;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const TabHeader = styled.div`
  display: flex;
  background: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
`;

const TabButton = styled.button`
  flex: 1;
  padding: 0.9rem;
  background: ${props => props.active ? '#667eea' : 'transparent'};
  color: ${props => props.active ? '#ffffff' : '#6b7280'};
  border: none;
  font-weight: ${props => props.active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  
  &:hover {
    background: ${props => props.active ? '#667eea' : '#f3f4f6'};
    color: ${props => props.active ? '#ffffff' : '#374151'};
  }
  
  @media (max-width: 600px) {
    padding: 0.75rem 0.5rem;
    font-size: 0.85rem;
  }
`;

const FixtureWrapper = styled.div`
  padding: 1rem;
  background: #f8f9fa;
`;

const SearchBar = styled.input`
  width: 100%;
  padding: 0.65rem;
  margin-bottom: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const FixtureCard = styled.div`
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-left: 4px solid ${(props) => (props.hasMom ? "#10b981" : "#667eea")};
  border: 1px solid #e5e7eb;
  border-left: 4px solid ${(props) => (props.hasMom ? "#10b981" : "#667eea")};
  border-radius: 8px;
  margin-bottom: 1rem;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: ${(props) => (props.hasMom ? "#10b981" : "#667eea")};
  }
`;

const MatchHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f3f4f6;

  .match-number {
    color: #667eea;
    font-weight: 700;
    font-size: 0.95rem;
  }
`;

const MatchDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: ${(props) => (props.hasMom ? "center" : "flex-start")};
  margin-top: 0.5rem;
  flex-direction: ${(props) => (props.hasMom ? "row" : "column")};

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const TeamBox = styled.div`
  flex: 1;
  text-align: ${(props) => (props.hasMom ? "left" : "center")};
  display: flex;
  flex-direction: column;
  align-items: ${(props) => (props.hasMom ? "flex-start" : "center")};
  justify-content: center;
  margin: ${(props) => (props.hasMom ? "0.25rem 0" : "0")};
  padding: 0.75rem;
  gap: 0.5rem;

  .team-name {
    font-size: 0.95rem;
    font-weight: 700;
    color: ${(props) =>
      props.isWinner ? "#10b981" : props.isLoser ? "#ef4444" : "#374151"};
    word-wrap: break-word;
    max-width: 100%;
  }

  .score {
    font-size: 1.1rem;
    font-weight: 700;
    color: white;
    background: ${(props) =>
      props.isWinner ? "#10b981" : props.isLoser ? "#ef4444" : "#6b7280"};
    padding: 0.4rem 0.75rem;
    border-radius: 6px;
    display: inline-block;
    min-width: 50px;
    text-align: center;
  }
`;

const MomDetails = styled.div`
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: #fffbeb;
  border-radius: 6px;
  text-align: center;
  border: 1px solid #fde68a;

  .mom-header,
  .mom-info {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #92400e;
    text-align: center;
  }

  .mom-header {
    font-weight: 700;
    color: #78350f;
    margin-bottom: 0.4rem;
    font-size: 0.9rem;
  }
  
  .mom-info {
    font-weight: 600;
  }
`;

const EditButton = styled.button`
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.2s ease;

  &:hover {
    background: #2563eb;
  }
  
  &:active {
    transform: scale(0.98);
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
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background: #fff;
  padding: 1.5rem;
  border-radius: 12px;
  width: 420px;
  max-width: 95vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  text-align: center;
  
  h3 {
    color: #1f2937;
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 1.25rem;
  }
`;

const Input = styled.input`
  width: 90%;
  margin: 0.4rem 0;
  padding: 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const SubmitButton = styled.button`
  background: #10b981;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.6rem 1.25rem;
  margin-top: 1rem;
  margin-right: 0.5rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #059669;
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

const CloseButton = styled.button`
  background: #6b7280;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.6rem 1.25rem;
  margin-top: 1rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #4b5563;
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

const MarginText = styled.span`
  display: block;
  font-size: 0.8rem;
  color: #78350f;
  font-weight: 600;
  margin-top: 0.35rem;
  padding: 0.35rem 0.7rem;
  background: #fef3c7;
  border-radius: 12px;
  border: 1px solid #fde68a;
  width: fit-content;
  align-self: ${(props) => (props.hasMom ? "flex-start" : "center")};
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
        <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#6c757d' }}>
          Showing {filteredFixtures.length} of {fixtures.length} fixtures
          {activeTab === 'groupA' && ' (Group A only)'}
          {activeTab === 'groupB' && ' (Group B only)'}
          {activeTab === 'all' && ' (All fixtures)'}
          {activeTab === 'playoffs' && ' (Playoff fixtures)'}
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
