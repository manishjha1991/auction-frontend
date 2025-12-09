import React, { useState, useEffect } from "react";
import styled from "styled-components";
import axios from "axios";
import { API_ENDPOINTS } from "../const";

const PlayoffContainer = styled.div`
  margin: 2rem auto;
  width: 95%;
  max-width: 800px;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  @media (max-width: 600px) {
    width: 98%;
    margin: 1rem auto;
  }
`;

const PlayoffHeader = styled.div`
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: #ffffff;
  padding: 1rem;
  text-align: center;
  font-weight: bold;
  font-size: 1.2rem;

  @media (max-width: 600px) {
    font-size: 1rem;
    padding: 0.8rem;
  }
`;

const PlayoffSubtitle = styled.div`
  background: #d4edda;
  color: #155724;
  padding: 0.5rem;
  text-align: center;
  font-weight: bold;
  font-size: 0.9rem;

  @media (max-width: 600px) {
    font-size: 0.8rem;
    padding: 0.4rem;
  }
`;

const FixtureCard = styled.div`
  display: flex;
  flex-direction: column;
  background: ${props => props.isFinal ? 'linear-gradient(135deg, #ffd700, #ffed4e)' : 
                props.isSemi ? 'linear-gradient(135deg, #e3f2fd, #bbdefb)' : '#ffffff'};
  border: ${props => props.isFinal ? '3px solid #ff8f00' : 
           props.isSemi ? '3px solid #1976d2' : '1px solid #dee2e6'};
  border-radius: 8px;
  margin: 1rem;
  padding: 1rem;
  box-shadow: ${props => props.isFinal ? '0 8px 25px rgba(255, 215, 0, 0.4)' : 
               props.isSemi ? '0 6px 20px rgba(25, 118, 210, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.1)'};
  position: relative;
  overflow: hidden;

  ${props => props.isFinal && `
    &::before {
      content: '🏆 FINAL 🏆';
      position: absolute;
      top: 0;
      right: 0;
      background: #ff8f00;
      color: white;
      padding: 0.3rem 0.8rem;
      font-size: 0.8rem;
      font-weight: bold;
      border-radius: 0 8px 0 8px;
      z-index: 1;
    }
  `}

  ${props => props.isSemi && `
    &::before {
      content: '⚡ SEMI-FINAL ⚡';
      position: absolute;
      top: 0;
      right: 0;
      background: #1976d2;
      color: white;
      padding: 0.3rem 0.8rem;
      font-size: 0.8rem;
      font-weight: bold;
      border-radius: 0 8px 0 8px;
      z-index: 1;
    }
  `}

  @media (max-width: 600px) {
    margin: 0.5rem;
    padding: 0.8rem;
  }
`;

const MatchHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
  font-weight: bold;
  color: #495057;
  margin-bottom: 1rem;

  .match-number {
    color: #dc3545;
    font-size: 1.1rem;
  }

  .match-stage {
    color: #6c757d;
    font-size: 0.9rem;
  }

  @media (max-width: 600px) {
    font-size: 0.9rem;
    margin-bottom: 0.8rem;
    flex-direction: column;
    gap: 0.3rem;

    .match-number {
      font-size: 1rem;
    }

    .match-stage {
      font-size: 0.8rem;
    }
  }
`;

const MatchDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const TeamBox = styled.div`
  flex: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  border-radius: 15px;
  background: ${props => props.isWinner 
    ? 'linear-gradient(135deg, #d4edda, #c3e6cb)' 
    : props.isLoser 
    ? 'linear-gradient(135deg, #f8d7da, #f5c6cb)' 
    : 'linear-gradient(135deg, #f8f9fa, #e9ecef)'};
  border: 3px solid ${props => props.isWinner ? '#28a745' : props.isLoser ? '#dc3545' : '#dee2e6'};
  box-shadow: ${props => props.isWinner 
    ? '0 8px 25px rgba(40, 167, 69, 0.3)' 
    : props.isLoser 
    ? '0 8px 25px rgba(220, 53, 69, 0.3)' 
    : '0 4px 15px rgba(0, 0, 0, 0.1)'};
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;

  ${props => props.isWinner && `
    &::before {
      content: '🏆';
      position: absolute;
      top: -5px;
      right: -5px;
      font-size: 1.5rem;
      opacity: 0.8;
      transform: rotate(15deg);
    }
  `}

  ${props => props.isLoser && `
    &::before {
      content: '💔';
      position: absolute;
      top: -5px;
      right: -5px;
      font-size: 1.5rem;
      opacity: 0.8;
      transform: rotate(15deg);
    }
  `}

  .team-image {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    object-fit: cover;
    margin-bottom: 0.8rem;
    border: 4px solid ${props => props.isWinner ? '#28a745' : props.isLoser ? '#dc3545' : '#dee2e6'};
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
  }

  .team-name {
    font-size: 1.3rem;
    font-weight: bold;
    color: ${props => props.isWinner ? '#155724' : props.isLoser ? '#721c24' : '#343a40'};
    margin-bottom: 0.8rem;
    text-shadow: ${props => props.isWinner || props.isLoser ? '1px 1px 2px rgba(0,0,0,0.1)' : 'none'};
    letter-spacing: 0.5px;
  }

  .team-status {
    font-size: 0.8rem;
    color: #6c757d;
    font-style: italic;
  }

  .score {
    font-size: 1.2rem;
    color: ${props => props.isWinner ? '#155724' : props.isLoser ? '#721c24' : '#495057'};
    background: ${props => props.isWinner 
      ? 'linear-gradient(135deg, #28a745, #20c997)' 
      : props.isLoser 
      ? 'linear-gradient(135deg, #dc3545, #c82333)' 
      : 'linear-gradient(135deg, #6c757d, #495057)'};
    color: white;
    padding: 0.6rem 1.2rem;
    border-radius: 25px;
    display: inline-block;
    min-width: 80px;
    text-align: center;
    font-weight: bold;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.isWinner 
      ? '0 12px 35px rgba(40, 167, 69, 0.4)' 
      : props.isLoser 
      ? '0 12px 35px rgba(220, 53, 69, 0.4)' 
      : '0 8px 25px rgba(0, 0, 0, 0.15)'};
  }

  @media (max-width: 600px) {
    padding: 1rem;
    width: 100%;

    .team-image {
      width: 50px;
      height: 50px;
      border-width: 3px;
    }

    .team-name {
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
    }

    .score {
      font-size: 1rem;
      padding: 0.5rem 1rem;
      min-width: 60px;
    }
  }
`;

const VS = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #dc3545;
  margin: 0 1.5rem;
  text-shadow: 2px 2px 4px rgba(220, 53, 69, 0.3);
  position: relative;
  z-index: 2;

  &::before {
    content: '⚡';
    position: absolute;
    top: -15px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 1rem;
    opacity: 0.7;
  }

  &::after {
    content: '🔥';
    position: absolute;
    bottom: -15px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 1rem;
    opacity: 0.7;
  }

  @media (max-width: 600px) {
    font-size: 1.5rem;
    margin: 0.8rem 0;

    &::before, &::after {
      font-size: 0.8rem;
    }
  }
`;

const MatchDescription = styled.div`
  margin-top: 1rem;
  padding: 0.8rem;
  background: #e9ecef;
  border-radius: 8px;
  text-align: center;
  font-size: 0.9rem;
  color: #495057;
  font-style: italic;

  @media (max-width: 600px) {
    margin-top: 0.8rem;
    padding: 0.6rem;
    font-size: 0.8rem;
  }
`;

const MomSection = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  border-radius: 8px;
  text-align: center;
  color: white;
  position: relative;
  overflow: hidden;

  &::before {
    content: '🏆';
    position: absolute;
    top: -5px;
    left: -5px;
    font-size: 2rem;
    opacity: 0.3;
    transform: rotate(-15deg);
  }

  &::after {
    content: '⭐';
    position: absolute;
    bottom: -5px;
    right: -5px;
    font-size: 2rem;
    opacity: 0.3;
    transform: rotate(15deg);
  }

  .mom-title {
    font-size: 1rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .mom-name {
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
  }

  .mom-stats {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 0.5rem;
  }

  .mom-stat {
    background: rgba(255,255,255,0.2);
    padding: 0.3rem 0.8rem;
    border-radius: 15px;
    font-size: 0.9rem;
    font-weight: bold;
  }

  @media (max-width: 600px) {
    padding: 0.8rem;
    
    .mom-title {
      font-size: 0.9rem;
    }
    
    .mom-name {
      font-size: 1.1rem;
    }
    
    .mom-stats {
      gap: 0.5rem;
    }
    
    .mom-stat {
      font-size: 0.8rem;
      padding: 0.2rem 0.6rem;
    }
  }
`;

const MatchResultSection = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #28a745, #20c997);
  border-radius: 8px;
  text-align: center;
  color: white;
  position: relative;
  overflow: hidden;

  &::before {
    content: '🎯';
    position: absolute;
    top: -5px;
    left: -5px;
    font-size: 2rem;
    opacity: 0.3;
    transform: rotate(-15deg);
  }

  &::after {
    content: '🏅';
    position: absolute;
    bottom: -5px;
    right: -5px;
    font-size: 2rem;
    opacity: 0.3;
    transform: rotate(15deg);
  }

  .result-title {
    font-size: 1rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .winner-name {
    font-size: 1.3rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
  }

  .result-stats {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 0.5rem;
    flex-wrap: wrap;
  }

  .result-stat {
    background: rgba(255,255,255,0.2);
    padding: 0.4rem 1rem;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: bold;
  }

  @media (max-width: 600px) {
    padding: 0.8rem;
    
    .result-title {
      font-size: 0.9rem;
    }
    
    .winner-name {
      font-size: 1.2rem;
    }
    
    .result-stats {
      gap: 0.5rem;
    }
    
    .result-stat {
      font-size: 0.8rem;
      padding: 0.3rem 0.8rem;
    }
  }
`;

const EditButton = styled.button`
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  margin-top: 1rem;

  &:hover {
    background: #0056b3;
  }

  @media (max-width: 600px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
    margin-top: 0.8rem;
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
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: #fff;
  padding: 2rem;
  border-radius: 10px;
  width: 400px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  text-align: center;

  @media (max-width: 600px) {
    width: 90%;
    padding: 1.5rem;
    margin: 1rem;
  }
`;

const Input = styled.input`
  width: 90%;
  margin: 0.5rem 0;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 5px;

  @media (max-width: 600px) {
    width: 95%;
    padding: 0.4rem;
    font-size: 0.9rem;
  }
`;

const SubmitButton = styled.button`
  background: #28a745;
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 0.5rem 1rem;
  margin-top: 1rem;
  margin-right: 0.5rem;

  &:hover {
    background: #218838;
  }

  @media (max-width: 600px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
    margin-top: 0.8rem;
    margin-right: 0.3rem;
  }
`;

const CloseButton = styled.button`
  background: #dc3545;
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 0.5rem 1rem;
  margin-top: 1rem;

  &:hover {
    background: #c82333;
  }

  @media (max-width: 600px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
    margin-top: 0.8rem;
  }
`;

const PlayoffFixtures = ({ top6Teams, mode, groups }) => {
  const [playoffFixtures, setPlayoffFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentFixture, setCurrentFixture] = useState(null);
  const [winner, setWinner] = useState("");
  const [margin, setMargin] = useState("");
  const [team1Score, setTeam1Score] = useState("");
  const [team2Score, setTeam2Score] = useState("");
  const [mom, setMom] = useState({ name: "", score: "", wickets: "" });
  const [team1Fairness, setTeam1Fairness] = useState("");
  const [team2Fairness, setTeam2Fairness] = useState("");
  const [teams, setTeams] = useState([]);
  const [requiredGames, setRequiredGames] = useState(12); // Configurable number of games
  const [worldCupMode, setWorldCupMode] = useState(false);
  const [top8Teams, setTop8Teams] = useState([]);
  const [hasWorldCupTournament, setHasWorldCupTournament] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setIsAdmin(user?.isAdmin === true);
    fetchPlayoffFixtures();
    fetchTeams();
    fetchRequiredGames();
    fetchWorldCupMode();
    fetchTop8Teams();
    checkWorldCupTournament();
  }, []);

  const checkWorldCupTournament = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS}/api/tournaments`);
      const tournaments = Array.isArray(response.data) ? response.data : [];
      // Check if there's a running World Cup tournament
      const runningWorldCup = tournaments.find(t => 
        t.name && t.name.startsWith('World Cup') && t.status === 'running'
      );
      setHasWorldCupTournament(!!runningWorldCup);
    } catch (error) {
      console.error("Error checking World Cup tournament:", error);
      setHasWorldCupTournament(false);
    }
  };

  const fetchRequiredGames = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS}/api/settings`);
      const games = response?.data?.requiredGames || 12;
      setRequiredGames(games);
    } catch (error) {
      console.error("Error fetching required games:", error);
      setRequiredGames(12); // Default fallback
    }
  };

  const fetchWorldCupMode = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS}/api/settings`);
      setWorldCupMode(response?.data?.worldCupMode === true);
    } catch (error) {
      console.error("Error fetching World Cup mode:", error);
      setWorldCupMode(false);
    }
  };

  const fetchTop8Teams = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS}/api/users/points-table`);
      if (Array.isArray(response.data)) {
        const sorted = response.data.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          return b.fairness - a.fairness;
        });
        setTop8Teams(sorted.slice(0, 8));
      }
    } catch (error) {
      console.error("Error fetching top 8 teams:", error);
      setTop8Teams([]);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS}/api/users/teams`);
      // API returns { teams: [...] }, so access response.data.teams
      const teamsData = response.data?.teams || response.data;
      setTeams(Array.isArray(teamsData) ? teamsData : []);
    } catch (error) {
      console.error("Error fetching teams:", error);
      setTeams([]); // Set empty array on error
    }
  };

  const fetchPlayoffFixtures = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS}/api/playoff-fixtures`);
      console.log('Fetched playoff fixtures:', response.data.map(f => `${f.matchId}: ${f.team1} vs ${f.team2}`));
      setPlayoffFixtures(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching playoff fixtures:", error);
      setLoading(false);
    }
  };

  const initializePlayoffs = async () => {
    try {
      await axios.post(`${API_ENDPOINTS}/api/playoff-fixtures/initialize`, {
        mode: mode // Pass the current mode (groups or normal)
      });
      fetchPlayoffFixtures();
      alert("Playoff fixtures initialized successfully!");
    } catch (error) {
      console.error("Error initializing playoffs:", error);
      alert(error.response?.data?.message || "Failed to initialize playoff fixtures.");
    }
  };

  const handleWorldCupInitialized = () => {
    fetchPlayoffFixtures();
    checkWorldCupTournament();
  };

  const initializeWorldCup = async () => {
    try {
      // Get user ID from localStorage
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user?.id || user?._id;
      
      if (!userId) {
        alert("User ID not found. Please login again.");
        return;
      }

      const response = await axios.post(
        `${API_ENDPOINTS}/api/tournaments/world-cup/initialize`,
        {},
        {
          headers: {
            'user-id': userId.toString()
          }
        }
      );
      alert(`World Cup tournament "${response.data.tournament.name}" created successfully! You can view it in the Tournaments section.`);
      // Optionally redirect to tournaments page
      window.location.href = '/tournaments';
    } catch (error) {
      console.error("Error initializing World Cup:", error);
      alert(error.response?.data?.error || "Failed to initialize World Cup tournament.");
    } finally {
      handleWorldCupInitialized();
    }
  };

  const areTop8TeamsEligible = () => {
    return top8Teams.length >= 8 && top8Teams.every(team => (team.matchesPlayed || 0) >= requiredGames);
  };

  const handleEditFixture = (fixture) => {
    console.log('Opening edit modal for fixture:', fixture);
    setCurrentFixture(fixture);
    setWinner(fixture.winner || "");
    setMargin(fixture.margin || "");
    setTeam1Score(fixture.team1Score || "");
    setTeam2Score(fixture.team2Score || "");
    setMom({
      name: fixture.mom?.name || "",
      score: fixture.mom?.score?.toString() || "",
      wickets: fixture.mom?.wickets?.toString() || "",
    });
    setTeam1Fairness(fixture.team1Fairness ? fixture.team1Fairness.toString() : "");
    setTeam2Fairness(fixture.team2Fairness ? fixture.team2Fairness.toString() : "");
    setShowModal(true);
  };

  const handleSaveFixture = async () => {
    try {
      const updatedFixture = {
        winner,
        margin,
        team1Score,
        team2Score,
        mom: {
          ...mom,
          score: mom.score ? Number(mom.score) : 0,
          wickets: mom.wickets ? Number(mom.wickets) : 0,
        },
        team1Fairness: team1Fairness ? Number(team1Fairness) : 0,
        team2Fairness: team2Fairness ? Number(team2Fairness) : 0,
        isCompleted: !!winner
      };

      console.log('Sending playoff fixture update:', {
        matchId: currentFixture.matchId,
        winner: winner,
        isCompleted: !!winner,
        data: updatedFixture
      });

      await axios.post(`${API_ENDPOINTS}/api/playoff-fixtures/update/${currentFixture.matchId}`, updatedFixture);
      fetchPlayoffFixtures();
      setShowModal(false);
      alert("Playoff fixture updated successfully!");
    } catch (error) {
      console.error("Error saving playoff fixture:", error);
      alert("Failed to save playoff fixture.");
    }
  };

  const getTeamData = (teamName) => {
    // Ensure teams is an array before calling .find()
    const teamsArray = Array.isArray(teams) ? teams : [];
    const team = teamsArray.find(t => t.teamName === teamName);
    return {
      name: teamName,
      image: team?.teamImage ? `${API_ENDPOINTS}${team.teamImage}` : "https://via.placeholder.com/50",
      group: team?.group || null
    };
  };

  const isMatchDisabled = (fixture) => {
    // Check if both teams are actual team names (not placeholder text)
    const isTeam1Placeholder = fixture.team1.includes('Winner of') || fixture.team1.includes('Loser of');
    const isTeam2Placeholder = fixture.team2.includes('Winner of') || fixture.team2.includes('Loser of');
    const isDisabled = isTeam1Placeholder || isTeam2Placeholder;
    console.log(`Match ${fixture.matchId} disabled check:`, { 
      team1: fixture.team1, 
      team2: fixture.team2, 
      isTeam1Placeholder, 
      isTeam2Placeholder, 
      isDisabled 
    });
    return isDisabled;
  };

  const areAllTeamsEligible = () => {
    if (!top6Teams || top6Teams.length < 6) return false;
    if (mode === 'groups') {
      // In group mode, check if top 3 from each group completed 6 matches
      // top6Teams should be [A1, A2, A3, B1, B2, B3] when in groups mode
      return top6Teams.every(team => (team.matchesPlayed || 0) >= 6);
    } else {
      // In overall mode, check if all teams completed required games (12)
      return top6Teams.every(team => (team.matchesPlayed || 0) >= requiredGames);
    }
  };

  const getDisplayTeamName = (teamName) => {
    // For placeholder teams, show TBA until they're replaced with actual team names
    if (teamName.includes('Winner of') || teamName.includes('Loser of')) {
      return 'TBA';
    }
    return teamName;
  };

  if (loading) {
    return (
      <PlayoffContainer>
        {worldCupMode ? (
          <>
            <PlayoffHeader>🏆 WORLD CUP</PlayoffHeader>
            <PlayoffSubtitle>
              ( TOP 8 TEAMS GOES TO WORLD CUP )
            </PlayoffSubtitle>
          </>
        ) : (
          <>
            <PlayoffHeader>CPL  PLAYOFFS SCENARIO</PlayoffHeader>
            <PlayoffSubtitle>
              {mode === 'groups' ? 
                '( TOP 3 FROM EACH GROUP GOES TO PLAYOFFS )' : 
                '( TOP 6 TEAMS GOES TO PLAYOFFS )'
              }
            </PlayoffSubtitle>
          </>
        )}
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
          Loading playoff fixtures...
        </div>
      </PlayoffContainer>
    );
  }

  if (playoffFixtures.length === 0) {
    return (
      <PlayoffContainer>
        {worldCupMode ? (
          <>
            <PlayoffHeader>🏆 WORLD CUP</PlayoffHeader>
            <PlayoffSubtitle>
              ( TOP 8 TEAMS GOES TO WORLD CUP )
            </PlayoffSubtitle>
          </>
        ) : (
          <>
            <PlayoffHeader>CPL  PLAYOFFS SCENARIO</PlayoffHeader>
            <PlayoffSubtitle>
              {mode === 'groups' ? 
                '( TOP 3 FROM EACH GROUP GOES TO PLAYOFFS )' : 
                '( TOP 6 TEAMS GOES TO PLAYOFFS )'
              }
            </PlayoffSubtitle>
          </>
        )}
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
          {top6Teams && top6Teams.length >= 6 ? (
            <div>
              {areAllTeamsEligible() ? (
                <div>
                  <p>Playoff fixtures not initialized yet.</p>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
                      <button 
                        onClick={initializePlayoffs}
                        style={{
                          background: '#007bff',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '5px',
                          padding: '0.5rem 1.5rem',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          fontWeight: '600'
                        }}
                      >
                        Initialize Playoff
                      </button>
                      {worldCupMode && top8Teams.length >= 8 && areTop8TeamsEligible() && (
                        <button 
                          onClick={initializeWorldCup}
                          style={{
                            background: '#28a745',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '5px',
                            padding: '0.5rem 1.5rem',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: '600'
                          }}
                        >
                          Initialize World Cup
                        </button>
                      )}
                    </div>
                  )}
                  {worldCupMode && top8Teams.length >= 8 && !areTop8TeamsEligible() && isAdmin && (
                    <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#fff3cd', borderRadius: '5px', color: '#856404' }}>
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>
                        ⏳ World Cup requires top 8 teams to complete {requiredGames} games
                      </p>
                      <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem' }}>
                        {top8Teams.filter(team => (team.matchesPlayed || 0) < requiredGames).length} teams still need to complete their games
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p>⏳ Waiting for all teams to complete {mode === 'groups' ? '6' : requiredGames} games</p>
                  <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    {top6Teams.filter(team => (team.matchesPlayed || 0) < (mode === 'groups' ? 6 : requiredGames)).length} teams still need to complete their games
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p>Need at least 6 teams to show playoff fixtures</p>
          )}
        </div>
      </PlayoffContainer>
    );
  }

  return (
    <PlayoffContainer>
      {worldCupMode ? (
        <>
          <PlayoffHeader>🏆 WORLD CUP</PlayoffHeader>
          <PlayoffSubtitle>
            ( TOP 8 TEAMS GOES TO WORLD CUP )
          </PlayoffSubtitle>
        </>
      ) : (
        <>
          <PlayoffHeader>CPL  PLAYOFFS SCENARIO</PlayoffHeader>
          <PlayoffSubtitle>
            {mode === 'groups' ? 
              '( TOP 3 FROM EACH GROUP GOES TO PLAYOFFS )' : 
              '( TOP 6 TEAMS GOES TO PLAYOFFS )'
            }
          </PlayoffSubtitle>
        </>
      )}
      
      {/* World Cup Initialize Button - Show even when playoff fixtures exist */}
      {isAdmin && worldCupMode && top8Teams.length >= 8 && (
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          justifyContent: 'center', 
          flexWrap: 'wrap', 
          marginBottom: '1.5rem',
          padding: '1rem',
          background: hasWorldCupTournament ? '#d1ecf1' : '#f8f9fa',
          borderRadius: '8px',
          border: hasWorldCupTournament ? '2px solid #0c5460' : 'none'
        }}>
          {hasWorldCupTournament && (
            <div style={{ 
              width: '100%', 
              textAlign: 'center', 
              marginBottom: '0.5rem',
              color: '#0c5460',
              fontWeight: '600',
              fontSize: '0.9rem'
            }}>
              ℹ️ A World Cup tournament is already running. You can initialize a new one.
            </div>
          )}
          {areTop8TeamsEligible() ? (
            <button 
              onClick={initializeWorldCup}
              style={{
                background: '#28a745',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                padding: '0.75rem 2rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              🏆 {hasWorldCupTournament ? 'Initialize New World Cup' : 'Initialize World Cup'}
            </button>
          ) : (
            <div style={{ 
              padding: '0.75rem 1.5rem', 
              background: '#fff3cd', 
              borderRadius: '5px', 
              color: '#856404',
              fontSize: '0.9rem'
            }}>
              <p style={{ margin: 0, fontWeight: '600' }}>
                ⏳ World Cup requires top 8 teams to complete {requiredGames} games
              </p>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem' }}>
                {top8Teams.filter(team => (team.matchesPlayed || 0) < requiredGames).length} teams still need to complete their games
              </p>
            </div>
          )}
        </div>
      )}
      
             {playoffFixtures.map((fixture, index) => {
         const team1Data = getTeamData(fixture.team1);
         const team2Data = getTeamData(fixture.team2);
         const isFinal = fixture.matchId === 'F';
         const isSemi = fixture.matchId === 'C' || fixture.matchId === 'E' || fixture.matchId === 'SF1' || fixture.matchId === 'SF2';
         const isDisabled = isMatchDisabled(fixture);
         const displayTeam1Name = getDisplayTeamName(fixture.team1);
         const displayTeam2Name = getDisplayTeamName(fixture.team2);

         return (
           <FixtureCard 
             key={fixture.matchId} 
             isFinal={isFinal} 
             isSemi={isSemi}
             style={{
               opacity: isDisabled ? 0.6 : 1,
               filter: isDisabled ? 'grayscale(50%)' : 'none'
             }}
           >
             <MatchHeader>
               <div className="match-number">MATCH {fixture.matchId}</div>
               <div className="match-stage">{fixture.stage}</div>
             </MatchHeader>

             <MatchDetails>
               <TeamBox 
                 isWinner={fixture.winner === fixture.team1}
                 isLoser={fixture.winner === fixture.team2}
               >
                 <img 
                   src={team1Data.image} 
                   alt={displayTeam1Name} 
                   className="team-image"
                   onError={(e) => {
                     e.target.src = "https://via.placeholder.com/50";
                   }}
                 />
                 <div className="team-name">{displayTeam1Name}</div>
                 <div className="score">{fixture.team1Score}</div>
               </TeamBox>
               
               <VS>VS</VS>
               
               <TeamBox
                 isWinner={fixture.winner === fixture.team2}
                 isLoser={fixture.winner === fixture.team1}
               >
                 <img 
                   src={team2Data.image} 
                   alt={displayTeam2Name} 
                   className="team-image"
                   onError={(e) => {
                     e.target.src = "https://via.placeholder.com/50";
                   }}
                 />
                 <div className="team-name">{displayTeam2Name}</div>
                 <div className="score">{fixture.team2Score}</div>
               </TeamBox>
             </MatchDetails>

             <MatchDescription>
               {fixture.matchId === 'A' || fixture.matchId === 'B' ? 
                 (fixture.winner ? `${fixture.winner === fixture.team1 ? fixture.team2 : fixture.team1} ELIMINATED` : 'LOOSER IS ELIMINATED') :
                fixture.matchId === 'C' ? 
                 (fixture.winner ? `${fixture.winner} GOES TO FINAL, ${fixture.winner === fixture.team1 ? fixture.team2 : fixture.team1} GETS A CHANCE` : 'WINNER GOES TO FINAL, LOOSER GETS A CHANCE') :
                fixture.matchId === 'D' ? 
                 (fixture.winner ? `${fixture.winner === fixture.team1 ? fixture.team2 : fixture.team1} ELIMINATED` : 'LOOSER ELIMINATED') :
                fixture.matchId === 'E' ? 
                 (fixture.winner ? `${fixture.winner} GOES FINAL` : 'WINNER GOES FINAL') :
                // Group mode descriptions
                fixture.matchId === 'Q1' || fixture.matchId === 'Q2' ?
                 (fixture.winner ? `${fixture.winner} ADVANCES TO SEMI-FINAL` : 'WINNER ADVANCES TO SEMI-FINAL') :
                fixture.matchId === 'SF1' || fixture.matchId === 'SF2' ?
                 (fixture.winner ? `${fixture.winner} GOES TO FINAL` : 'WINNER GOES TO FINAL') :
                fixture.matchId === 'F' ?
                 (fixture.winner ? `${fixture.winner} IS THE CHAMPION!` : 'CHAMPIONSHIP MATCH') :
                'CHAMPIONSHIP MATCH'}
             </MatchDescription>

             {fixture.winner && (
               <MatchResultSection>
                 <div className="result-title">Match Result</div>
                 <div className="winner-name">🏆 {fixture.winner} 🏆</div>
                 <div className="result-stats">
                   <div className="result-stat">📊 {fixture.margin}</div>
                   <div className="result-stat">⚖️ {fixture.team1Fairness || 0} vs {fixture.team2Fairness || 0}</div>
                 </div>
               </MatchResultSection>
             )}

             {fixture.mom?.name && (
               <MomSection>
                 <div className="mom-title">Man of the Match</div>
                 <div className="mom-name">{fixture.mom.name}</div>
                 <div className="mom-stats">
                   <div className="mom-stat">🏏 {fixture.mom.score || 0} Runs</div>
                   <div className="mom-stat">🎯 {fixture.mom.wickets || 0} Wickets</div>
                 </div>
               </MomSection>
             )}

             {isAdmin && !isDisabled && (
               <div style={{ textAlign: "right", marginTop: "1rem" }}>
                 <EditButton onClick={() => handleEditFixture(fixture)}>
                   Edit
                 </EditButton>
               </div>
             )}
             {isDisabled && (
               <div style={{ 
                 textAlign: "center", 
                 marginTop: "1rem", 
                 padding: "0.5rem",
                 background: "#f8f9fa",
                 borderRadius: "5px",
                 color: "#6c757d",
                 fontStyle: "italic"
               }}>
                 ⏳ Waiting for previous matches to complete
               </div>
             )}
           </FixtureCard>
         );
       })}

       {showModal && (
         <ModalWrapper>
           <ModalContent>
             <h3>Edit Playoff Fixture</h3>

             <select
               value={winner}
               onChange={(e) => {
                 console.log('Winner selected:', e.target.value);
                 setWinner(e.target.value);
               }}
               style={{ 
                 width: '90%', 
                 margin: '0.5rem 0', 
                 padding: '0.5rem', 
                 border: '1px solid #ccc', 
                 borderRadius: '5px',
                 fontSize: window.innerWidth <= 600 ? '0.9rem' : '1rem'
               }}
             >
               <option value="">Select Winner</option>
               <option value={currentFixture?.team1}>{currentFixture?.team1}</option>
               <option value={currentFixture?.team2}>{currentFixture?.team2}</option>
             </select>

             <Input
               type="text"
               placeholder="Margin (e.g. 5 runs or 2 wickets)"
               value={margin}
               onChange={(e) => setMargin(e.target.value)}
             />
             <Input
               type="text"
               placeholder={`Team 1 Score (${currentFixture?.team1})`}
               value={team1Score}
               onChange={(e) => setTeam1Score(e.target.value)}
             />
             <Input
               type="text"
               placeholder={`Team 2 Score (${currentFixture?.team2})`}
               value={team2Score}
               onChange={(e) => setTeam2Score(e.target.value)}
             />

             <Input
               type="text"
               placeholder="Man of the Match"
               value={mom.name}
               onChange={(e) => setMom({ ...mom, name: e.target.value })}
             />
             <Input
               type="number"
               placeholder="Batting Score"
               value={mom.score}
               onChange={(e) => setMom({ ...mom, score: e.target.value })}
             />
             <Input
               type="number"
               placeholder="Bowling Wickets"
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
    </PlayoffContainer>
  );
};

export default PlayoffFixtures;
