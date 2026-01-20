import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../const';
import styled, { keyframes } from 'styled-components';
import { FaCalculator, FaChartLine, FaInfoCircle, FaTrophy, FaBaseballBall } from 'react-icons/fa';

// Animation keyframes
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  background: #f8f9fa;
  min-height: 100vh;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  margin: 0;
  font-size: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Subtitle = styled.p`
  margin: 0.5rem 0 0 0;
  opacity: 0.9;
  font-size: 1rem;
`;

const CalculatorCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const Button = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ResultsCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-top: 2rem;
  animation: ${fadeInUp} 0.5s ease;
`;

const SectionHeader = styled.h3`
  margin: 0 0 1.5rem 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
  position: relative;
  padding-bottom: 0.75rem;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg, #667eea, #764ba2);
    border-radius: 2px;
  }
`;

const InfoBox = styled.div`
  background: linear-gradient(135deg, #e7f3ff 0%, #d1e7ff 100%);
  border-left: 4px solid #2196F3;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: start;
  gap: 0.75rem;
`;

const InfoText = styled.p`
  margin: 0;
  color: #1976D2;
  font-size: 0.9rem;
  line-height: 1.5;
`;

const ScenarioCard = styled.div`
  background: ${props => props.type === 'first' 
    ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)' 
    : 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)'};
  border: 2px solid ${props => props.type === 'first' ? '#28a745' : '#ffc107'};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: ${props => props.type === 'first'
    ? '0 4px 12px rgba(40, 167, 69, 0.2)' 
    : '0 4px 12px rgba(255, 193, 7, 0.2)'};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  animation: ${fadeInUp} 0.5s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => props.type === 'first'
      ? 'linear-gradient(90deg, #28a745, #20c997)' 
      : 'linear-gradient(90deg, #ffc107, #ff9800)'};
  }
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${props => props.type === 'first'
      ? '0 8px 20px rgba(40, 167, 69, 0.3)' 
      : '0 8px 20px rgba(255, 193, 7, 0.3)'};
  }
`;

const ScenarioTitle = styled.h4`
  margin: 0 0 1rem 0;
  color: ${props => props.type === 'first' ? '#155724' : '#856404'};
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.2rem;
  font-weight: 700;
`;

const ScenarioGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
`;

const ScenarioStat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ScenarioStatLabel = styled.span`
  font-size: 0.75rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
`;

const ScenarioStatValue = styled.span`
  font-size: 1.1rem;
  font-weight: 700;
  color: #333;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  margin-left: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Loading = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const Spinner = styled.div`
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: ${spin} 1s linear infinite;
`;

const Error = styled.div`
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const NRRDisplay = styled.div`
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 1rem;
`;

const NRRItem = styled.div`
  text-align: center;
`;

const NRRLabel = styled.div`
  font-size: 0.75rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
`;

const NRRValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  &::placeholder {
    color: #999;
  }
`;

const TabContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e0e0e0;
`;

const Tab = styled.button`
  padding: 1rem 2rem;
  background: ${props => props.active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent'};
  color: ${props => props.active ? 'white' : '#666'};
  border: none;
  border-bottom: 3px solid ${props => props.active ? '#667eea' : 'transparent'};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    color: ${props => props.active ? 'white' : '#667eea'};
  }
`;

const ImpactResultCard = styled.div`
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  border: 2px solid #28a745;
  border-radius: 12px;
  padding: 2rem;
  margin-top: 2rem;
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.2);
  animation: ${fadeInUp} 0.5s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #28a745, #20c997);
  }
`;

const ImpactGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
`;

const ImpactStat = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateY(20px);
  animation: ${fadeInUp} 0.5s ease forwards;
  animation-delay: ${props => props.delay || '0s'};
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const ImpactLabel = styled.div`
  font-size: 0.75rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
  font-weight: 600;
`;

const ImpactValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => {
    if (props.positive) return '#28a745';
    if (props.negative) return '#dc3545';
    return '#333';
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const SparkleAnimation = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.2) rotate(180deg);
  }
`;

const Sparkle = styled.span`
  display: inline-block;
  animation: ${SparkleAnimation} 1s ease-in-out infinite;
  font-size: 1.5rem;
`;

const PositionCalculator = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [calculatingImpact, setCalculatingImpact] = useState(false);
  const [activeTab, setActiveTab] = useState('scenarios'); // 'scenarios' or 'impact'
  const [yourTeamId, setYourTeamId] = useState('');
  const [opponentTeamId, setOpponentTeamId] = useState('');
  const [targetTeamId, setTargetTeamId] = useState('');
  const [results, setResults] = useState(null);
  const [impactResults, setImpactResults] = useState(null);
  const [error, setError] = useState(null);
  
  // NRR Impact Calculator inputs
  const [impactTeamId, setImpactTeamId] = useState('');
  const [runsScored, setRunsScored] = useState('');
  const [oversFaced, setOversFaced] = useState('');
  const [runsConceded, setRunsConceded] = useState('');
  const [oversBowled, setOversBowled] = useState('');
  const [wicketsLost, setWicketsLost] = useState('');
  const [opponentWickets, setOpponentWickets] = useState('');

  useEffect(() => {
    fetchTeams();
    
    // Auto-select current user's team if available
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData._id || userData.id) {
      const userId = userData._id || userData.id;
      // Will set after teams are loaded
    }
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_ENDPOINTS}/api/users/teams`);
      const teamsData = Array.isArray(response.data) ? response.data : response.data?.teams || [];
      setTeams(teamsData);
      
      // Auto-select current user's team
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (userData._id || userData.id) {
        const userId = userData._id || userData.id;
        const userTeam = teamsData.find(t => 
          t._id.toString() === userId.toString() || 
          (t.userId && t.userId.toString() === userId.toString())
        );
        if (userTeam) {
          setYourTeamId(userTeam._id);
          setImpactTeamId(userTeam._id);
        }
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError('Failed to load teams. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateNRR = async () => {
    if (!yourTeamId || !opponentTeamId || !targetTeamId) {
      setError('Please select your team, opponent team, and target team');
      return;
    }

    if (yourTeamId === opponentTeamId || yourTeamId === targetTeamId || opponentTeamId === targetTeamId) {
      setError('All three teams must be different');
      return;
    }

    try {
      setCalculating(true);
      setError(null);
      setResults(null);
      
      const response = await axios.get(`${API_ENDPOINTS}/api/users/nrr-calculator`, {
        params: {
          yourTeamId,
          opponentTeamId,
          targetTeamId
        }
      });
      
      setResults(response.data);
    } catch (err) {
      console.error('Error calculating NRR:', err);
      setError(err.response?.data?.message || 'Failed to calculate NRR scenarios. Please try again.');
      setResults(null);
    } finally {
      setCalculating(false);
    }
  };

  const calculateImpact = async () => {
    if (!impactTeamId || !runsScored || !oversFaced || !runsConceded || !oversBowled) {
      setError('Please fill all required fields');
      return;
    }

    try {
      setCalculatingImpact(true);
      setError(null);
      setImpactResults(null);
      
      const response = await axios.post(`${API_ENDPOINTS}/api/users/nrr-impact`, {
        teamId: impactTeamId,
        runsScored: parseFloat(runsScored),
        oversFaced: oversFaced,
        runsConceded: parseFloat(runsConceded),
        oversBowled: oversBowled,
        wicketsLost: parseInt(wicketsLost) || 0,
        opponentWickets: parseInt(opponentWickets) || 0
      });
      
      setImpactResults(response.data);
    } catch (err) {
      console.error('Error calculating NRR impact:', err);
      setError(err.response?.data?.message || 'Failed to calculate NRR impact. Please try again.');
      setImpactResults(null);
    } finally {
      setCalculatingImpact(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Loading>
          <Spinner />
          <div>Loading teams...</div>
        </Loading>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <FaCalculator />
          NRR Calculator
        </Title>
        <Subtitle>
          Calculate NRR scenarios and impact on point table
        </Subtitle>
      </Header>

      <TabContainer>
        <Tab 
          active={activeTab === 'scenarios'} 
          onClick={() => setActiveTab('scenarios')}
        >
          <FaChartLine style={{ marginRight: '0.5rem' }} />
          NRR Scenarios
        </Tab>
        <Tab 
          active={activeTab === 'impact'} 
          onClick={() => setActiveTab('impact')}
        >
          <FaTrophy style={{ marginRight: '0.5rem' }} />
          NRR Impact Calculator
        </Tab>
      </TabContainer>

      {activeTab === 'scenarios' && (
        <>
        <CalculatorCard>
        <FormGroup>
          <Label>Your Team</Label>
          <Select
            value={yourTeamId}
            onChange={(e) => setYourTeamId(e.target.value)}
          >
            <option value="">Select Your Team</option>
            {teams.map(team => (
              <option key={team._id} value={team._id}>
                {team.teamName} {team.abbreviation ? `(${team.abbreviation})` : ''}
              </option>
            ))}
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>Opponent Team (Match Against)</Label>
          <Select
            value={opponentTeamId}
            onChange={(e) => setOpponentTeamId(e.target.value)}
          >
            <option value="">Select Opponent Team</option>
            {teams
              .filter(team => team._id !== yourTeamId)
              .map(team => (
                <option key={team._id} value={team._id}>
                  {team.teamName} {team.abbreviation ? `(${team.abbreviation})` : ''}
                </option>
              ))}
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>Target Team (Whose NRR to Surpass)</Label>
          <Select
            value={targetTeamId}
            onChange={(e) => setTargetTeamId(e.target.value)}
          >
            <option value="">Select Target Team</option>
            {teams
              .filter(team => team._id !== yourTeamId && team._id !== opponentTeamId)
              .map(team => (
                <option key={team._id} value={team._id}>
                  {team.teamName} {team.abbreviation ? `(${team.abbreviation})` : ''}
                </option>
              ))}
          </Select>
        </FormGroup>

        {error && (
          <Error>
            <FaInfoCircle />
            {error}
          </Error>
        )}

        <Button onClick={calculateNRR} disabled={calculating}>
          {calculating ? (
            <>
              <Spinner style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
              Calculating...
            </>
          ) : (
            <>
              <FaCalculator />
              Calculate NRR Scenarios
            </>
          )}
        </Button>
      </CalculatorCard>

      {results && activeTab === 'scenarios' && (
        <ResultsCard>
          <InfoBox>
            <FaInfoCircle style={{ fontSize: '1.2rem', color: '#1976D2', marginTop: '0.2rem' }} />
            <InfoText>
              <strong>Your Current NRR:</strong> {results.yourTeam.currentNRR.toFixed(3)} | 
              <strong> Target Team NRR:</strong> {results.targetTeam.currentNRR.toFixed(3)} | 
              <strong> Target NRR Needed:</strong> {results.targetNRR.toFixed(3)}
            </InfoText>
          </InfoBox>

          <NRRDisplay>
            <NRRItem>
              <NRRLabel>Your Team</NRRLabel>
              <NRRValue>{results.yourTeam.teamName}</NRRValue>
              <Badge>NRR: {results.yourTeam.currentNRR.toFixed(3)}</Badge>
            </NRRItem>
            <NRRItem>
              <NRRLabel>vs</NRRLabel>
              <NRRValue>{results.opponentTeam.teamName}</NRRValue>
            </NRRItem>
            <NRRItem>
              <NRRLabel>Target</NRRLabel>
              <NRRValue>{results.targetTeam.teamName}</NRRValue>
              <Badge>NRR: {results.targetTeam.currentNRR.toFixed(3)}</Badge>
            </NRRItem>
          </NRRDisplay>

          {results.scenarios.battingFirst.length > 0 && (
            <>
              <SectionHeader>
                <FaBaseballBall />
                Batting First Scenarios
              </SectionHeader>
              {results.scenarios.battingFirst.map((scenario, index) => (
                <ScenarioCard key={index} type="first">
                  <ScenarioTitle type="first">
                    Scenario {index + 1}
                    <Badge>New NRR: {scenario.newNRR.toFixed(3)}</Badge>
                  </ScenarioTitle>
                  <ScenarioGrid>
                    <ScenarioStat>
                      <ScenarioStatLabel>Your Score</ScenarioStatLabel>
                      <ScenarioStatValue>{scenario.yourScore}/{scenario.yourWickets}</ScenarioStatValue>
                    </ScenarioStat>
                    <ScenarioStat>
                      <ScenarioStatLabel>Your Overs</ScenarioStatLabel>
                      <ScenarioStatValue>{scenario.yourOvers}</ScenarioStatValue>
                    </ScenarioStat>
                    <ScenarioStat>
                      <ScenarioStatLabel>Restrict Opponent To</ScenarioStatLabel>
                      <ScenarioStatValue>{scenario.opponentScore}/{scenario.opponentWickets}</ScenarioStatValue>
                    </ScenarioStat>
                    <ScenarioStat>
                      <ScenarioStatLabel>Opponent Overs</ScenarioStatLabel>
                      <ScenarioStatValue>{scenario.opponentOvers}</ScenarioStatValue>
                    </ScenarioStat>
                    <ScenarioStat>
                      <ScenarioStatLabel>Win Margin</ScenarioStatLabel>
                      <ScenarioStatValue>{scenario.winMargin}</ScenarioStatValue>
                    </ScenarioStat>
                    <ScenarioStat>
                      <ScenarioStatLabel>Required Run Rate (Opponent)</ScenarioStatLabel>
                      <ScenarioStatValue>{scenario.requiredRunRate}</ScenarioStatValue>
                    </ScenarioStat>
                  </ScenarioGrid>
                </ScenarioCard>
              ))}
            </>
          )}

          {results.scenarios.battingSecond.length > 0 && (
            <>
              <SectionHeader>
                <FaBaseballBall />
                Batting Second Scenarios
              </SectionHeader>
              {results.scenarios.battingSecond.map((scenario, index) => (
                <ScenarioCard key={index} type="second">
                  <ScenarioTitle type="second">
                    Scenario {index + 1}
                    <Badge>New NRR: {scenario.newNRR.toFixed(3)}</Badge>
                  </ScenarioTitle>
                  <ScenarioGrid>
                    <ScenarioStat>
                      <ScenarioStatLabel>Opponent Sets</ScenarioStatLabel>
                      <ScenarioStatValue>{scenario.opponentScore}/{scenario.opponentWickets}</ScenarioStatValue>
                    </ScenarioStat>
                    <ScenarioStat>
                      <ScenarioStatLabel>Opponent Overs</ScenarioStatLabel>
                      <ScenarioStatValue>{scenario.opponentOvers}</ScenarioStatValue>
                    </ScenarioStat>
                    <ScenarioStat>
                      <ScenarioStatLabel>You Need To Score</ScenarioStatLabel>
                      <ScenarioStatValue>{scenario.yourScore}/{scenario.yourWickets}</ScenarioStatValue>
                    </ScenarioStat>
                    <ScenarioStat>
                      <ScenarioStatLabel>In Overs</ScenarioStatLabel>
                      <ScenarioStatValue>{scenario.yourOvers}</ScenarioStatValue>
                    </ScenarioStat>
                    <ScenarioStat>
                      <ScenarioStatLabel>Required Run Rate</ScenarioStatLabel>
                      <ScenarioStatValue>{scenario.requiredRunRate}</ScenarioStatValue>
                    </ScenarioStat>
                    <ScenarioStat>
                      <ScenarioStatLabel>Balls Remaining</ScenarioStatLabel>
                      <ScenarioStatValue>{scenario.ballsRemaining}</ScenarioStatValue>
                    </ScenarioStat>
                    <ScenarioStat>
                      <ScenarioStatLabel>Wickets Remaining</ScenarioStatLabel>
                      <ScenarioStatValue>{scenario.wicketsRemaining}</ScenarioStatValue>
                    </ScenarioStat>
                    <ScenarioStat>
                      <ScenarioStatLabel>Win Margin</ScenarioStatLabel>
                      <ScenarioStatValue>{scenario.winMargin}</ScenarioStatValue>
                    </ScenarioStat>
                  </ScenarioGrid>
                </ScenarioCard>
              ))}
            </>
          )}

          {results.scenarios.battingFirst.length === 0 && results.scenarios.battingSecond.length === 0 && (
            <InfoBox>
              <FaInfoCircle />
              <InfoText>
                No scenarios found. The target NRR may be too high to achieve in a single match.
                Try selecting a different target team or check your current NRR.
              </InfoText>
            </InfoBox>
          )}
        </ResultsCard>
      )}
        </>
      )}

      {activeTab === 'impact' && (
        <>
          <CalculatorCard>
            <FormGroup>
              <Label>Select Your Team</Label>
              <Select
                value={impactTeamId}
                onChange={(e) => setImpactTeamId(e.target.value)}
              >
                <option value="">Select Your Team</option>
                {teams.map(team => (
                  <option key={team._id} value={team._id}>
                    {team.teamName} {team.abbreviation ? `(${team.abbreviation})` : ''}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <InfoBox>
              <FaInfoCircle style={{ fontSize: '1.2rem', color: '#1976D2', marginTop: '0.2rem' }} />
              <InfoText>
                Enter match statistics to see how it affects your NRR and position in the point table.
                For overs, use format like 7.3 (7 overs 3 balls) or 7.5 (7.5 overs).
              </InfoText>
            </InfoBox>

            <FormGroup>
              <Label>Total Runs Scored</Label>
              <Input
                type="number"
                placeholder="Enter total runs scored"
                value={runsScored}
                onChange={(e) => setRunsScored(e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <Label>Total Overs Faced (e.g., 7.3 for 7 overs 3 balls)</Label>
              <Input
                type="text"
                placeholder="Enter overs faced (Overs.Balls)"
                value={oversFaced}
                onChange={(e) => setOversFaced(e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <Label>Wickets Lost (0-10)</Label>
              <Input
                type="number"
                min="0"
                max="10"
                placeholder="Enter wickets lost"
                value={wicketsLost}
                onChange={(e) => setWicketsLost(e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <Label>Total Runs Conceded</Label>
              <Input
                type="number"
                placeholder="Enter total runs conceded"
                value={runsConceded}
                onChange={(e) => setRunsConceded(e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <Label>Total Overs Bowled (e.g., 8.2 for 8 overs 2 balls)</Label>
              <Input
                type="text"
                placeholder="Enter overs bowled (Overs.Balls)"
                value={oversBowled}
                onChange={(e) => setOversBowled(e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <Label>Opponent Wickets Lost (0-10)</Label>
              <Input
                type="number"
                min="0"
                max="10"
                placeholder="Enter opponent wickets lost"
                value={opponentWickets}
                onChange={(e) => setOpponentWickets(e.target.value)}
              />
            </FormGroup>

            {error && (
              <Error>
                <FaInfoCircle />
                {error}
              </Error>
            )}

            <Button onClick={calculateImpact} disabled={calculatingImpact}>
              {calculatingImpact ? (
                <>
                  <Spinner style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                  Calculating...
                </>
              ) : (
                <>
                  <FaCalculator />
                  Calculate NRR Impact
                </>
              )}
            </Button>
          </CalculatorCard>

          {impactResults && (
            <ImpactResultCard className="impact-result">
              <SectionHeader>
                <Sparkle>✨</Sparkle>
                NRR Impact Results
                <Sparkle>✨</Sparkle>
              </SectionHeader>
              
              <ImpactGrid>
                <ImpactStat delay="0s">
                  <ImpactLabel>Current NRR</ImpactLabel>
                  <ImpactValue>{impactResults.currentNRR}</ImpactValue>
                </ImpactStat>

                <ImpactStat delay="0.1s">
                  <ImpactLabel>New NRR</ImpactLabel>
                  <ImpactValue positive={impactResults.nrrChange > 0} negative={impactResults.nrrChange < 0}>
                    {impactResults.newNRR}
                    {impactResults.nrrChange > 0 && <Sparkle>📈</Sparkle>}
                    {impactResults.nrrChange < 0 && <span>📉</span>}
                  </ImpactValue>
                </ImpactStat>

                <ImpactStat delay="0.2s">
                  <ImpactLabel>NRR Change</ImpactLabel>
                  <ImpactValue positive={impactResults.nrrChange > 0} negative={impactResults.nrrChange < 0}>
                    {impactResults.nrrChange > 0 ? '+' : ''}{impactResults.nrrChange}
                    {impactResults.nrrChangePercent !== 0 && (
                      <span style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                        ({impactResults.nrrChangePercent > 0 ? '+' : ''}{impactResults.nrrChangePercent}%)
                      </span>
                    )}
                  </ImpactValue>
                </ImpactStat>

                <ImpactStat delay="0.3s">
                  <ImpactLabel>Current Position</ImpactLabel>
                  <ImpactValue>#{impactResults.currentPosition}</ImpactValue>
                </ImpactStat>

                <ImpactStat delay="0.4s">
                  <ImpactLabel>New Position</ImpactLabel>
                  <ImpactValue positive={impactResults.positionChange > 0} negative={impactResults.positionChange < 0}>
                    #{impactResults.newPosition}
                    {impactResults.positionChange > 0 && <Sparkle>⬆️</Sparkle>}
                    {impactResults.positionChange < 0 && <span>⬇️</span>}
                    {impactResults.positionChange === 0 && <span>➡️</span>}
                  </ImpactValue>
                </ImpactStat>
              </ImpactGrid>

              <InfoBox style={{ marginTop: '1.5rem' }}>
                <FaInfoCircle style={{ fontSize: '1.2rem', color: '#1976D2', marginTop: '0.2rem' }} />
                <InfoText>
                  <strong>Match Stats:</strong> {impactResults.matchStats.runsScored}/{impactResults.matchStats.wicketsLost} 
                  in {impactResults.matchStats.oversFaced} overs | 
                  Opponent: {impactResults.matchStats.runsConceded}/{impactResults.matchStats.opponentWickets} 
                  in {impactResults.matchStats.oversBowled} overs
                </InfoText>
              </InfoBox>
            </ImpactResultCard>
          )}
        </>
      )}
    </Container>
  );
};

export default PositionCalculator;
