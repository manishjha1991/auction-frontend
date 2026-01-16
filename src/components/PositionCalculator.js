import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../const';
import styled, { keyframes } from 'styled-components';
import { FaCalculator, FaTrophy, FaChartLine, FaInfoCircle, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

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

const sparkle = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1) rotate(180deg);
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
  font-size: 1rem;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
  
  &:focus {
    outline: none;
    border-color: #667eea;
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
  transition: transform 0.2s, box-shadow 0.2s;
  width: 100%;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
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
  margin-bottom: 2rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: ${props => props.highlight ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8f9fa'};
  color: ${props => props.highlight ? 'white' : '#333'};
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  opacity: ${props => props.highlight ? 0.9 : 0.7};
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
`;

const RequirementsSection = styled.div`
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
`;

const RequirementsTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const RequirementItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e0e0e0;
  
  &:last-child {
    border-bottom: none;
  }
`;

const RequirementLabel = styled.span`
  font-weight: 500;
  color: #666;
`;

const RequirementValue = styled.span`
  font-weight: 700;
  color: #333;
`;

const ScenarioCard = styled.div`
  background: ${props => props.willReach 
    ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)' 
    : 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)'};
  border: 2px solid ${props => props.willReach ? '#28a745' : '#ffc107'};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: ${props => props.willReach 
    ? '0 4px 12px rgba(40, 167, 69, 0.2)' 
    : '0 4px 12px rgba(255, 193, 7, 0.2)'};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => props.willReach 
      ? 'linear-gradient(90deg, #28a745, #20c997)' 
      : 'linear-gradient(90deg, #ffc107, #ff9800)'};
  }
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${props => props.willReach 
      ? '0 8px 20px rgba(40, 167, 69, 0.3)' 
      : '0 8px 20px rgba(255, 193, 7, 0.3)'};
  }
`;

const ScenarioTitle = styled.h4`
  margin: 0 0 1rem 0;
  color: ${props => props.willReach ? '#155724' : '#856404'};
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.1rem;
  font-weight: 700;
`;

const ScenarioDescription = styled.p`
  margin: 0.5rem 0;
  color: #555;
  font-weight: 500;
`;

const ScenarioNote = styled.p`
  margin: 0.75rem 0 0 0;
  font-size: 0.875rem;
  font-style: italic;
  color: #666;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
`;

const ScenarioGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.5);
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
  color: ${props => props.highlight ? '#28a745' : '#333'};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${props => {
    if (props.type === 'success') return 'linear-gradient(135deg, #28a745, #20c997)';
    if (props.type === 'warning') return 'linear-gradient(135deg, #ffc107, #ff9800)';
    if (props.type === 'info') return 'linear-gradient(135deg, #17a2b8, #138496)';
    return 'linear-gradient(135deg, #6c757d, #5a6268)';
  }};
  color: white;
  margin-left: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const SectionHeader = styled.h3`
  margin: 2rem 0 1.5rem 0;
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
  background: #e7f3ff;
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

const Loading = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
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

const PositionCalculator = () => {
  const [pointTable, setPointTable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [targetPosition, setTargetPosition] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [qualifyFor, setQualifyFor] = useState('top1');
  const [showAnimations, setShowAnimations] = useState(true);

  useEffect(() => {
    // Get current user
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    
    // Fetch point table
    fetchPointTable();
  }, []);

  const fetchPointTable = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_ENDPOINTS}/api/users/points-table`);
      setPointTable(response.data);
      
      // Auto-select current user's team if available
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (userData._id || userData.id) {
        const userId = userData._id || userData.id;
        const userTeam = response.data.find(t => t._id.toString() === userId.toString());
        if (userTeam) {
          setSelectedTeam(userTeam._id);
        }
      }
    } catch (err) {
      console.error('Error fetching point table:', err);
      setError('Failed to load point table. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateRequirements = async () => {
    if (!selectedTeam || !targetPosition) {
      setError('Please select your team and enter a target position');
      return;
    }

    const targetPos = parseInt(targetPosition);
    if (isNaN(targetPos) || targetPos < 1 || targetPos > 6) {
      setError('Target position must be a number between 1 and 6');
      return;
    }

    try {
      setCalculating(true);
      setError(null);
      
      // Use advanced endpoint if advanced mode is enabled
      const endpoint = advancedMode 
        ? `${API_ENDPOINTS}/api/users/position-calculator-advanced/${selectedTeam}`
        : `${API_ENDPOINTS}/api/users/position-calculator/${selectedTeam}`;
      
      const params = advancedMode 
        ? { targetPosition: targetPos, qualifyFor }
        : { targetPosition: targetPos };
      
      const response = await axios.get(endpoint, { params });
      setResults(response.data);
      
      // Trigger animation if enabled
      if (showAnimations && advancedMode) {
        // Animation will be handled by CSS
        setTimeout(() => {
          const elements = document.querySelectorAll('.scenario-card, .permutation-card');
          elements.forEach((el, index) => {
            setTimeout(() => {
              el.style.animation = 'fadeInUp 0.5s ease forwards';
            }, index * 100);
          });
        }, 100);
      }
    } catch (err) {
      console.error('Error calculating requirements:', err);
      setError(err.response?.data?.message || 'Failed to calculate requirements. Please try again.');
      setResults(null);
    } finally {
      setCalculating(false);
    }
  };

  const selectedTeamData = pointTable.find(t => t._id === selectedTeam);
  const currentPosition = selectedTeamData?.rank || null;

  if (loading) {
    return (
      <Container>
        <Loading>Loading point table...</Loading>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <FaCalculator />
          Position Calculator
        </Title>
        <Subtitle>
          Calculate what you need to achieve to reach your target position in the points table
        </Subtitle>
      </Header>

      <CalculatorCard>
        <FormGroup>
          <Label>Select Your Team</Label>
          <Select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
          >
            <option value="">-- Select Team --</option>
            {pointTable.map(team => (
              <option key={team._id} value={team._id}>
                {team.teamName} (Current Position: {team.rank})
              </option>
            ))}
          </Select>
        </FormGroup>

        {selectedTeamData && (
          <>
            <FormGroup>
              <Label>Target Position</Label>
            <Input
              type="number"
              min="1"
              max="6"
              value={targetPosition}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 6)) {
                  setTargetPosition(val);
                }
              }}
              placeholder="Enter position (1-6 only)"
            />
              <InfoBox>
                <FaInfoCircle />
              <InfoText>
                Your current position is <strong>{currentPosition}</strong>. 
                Enter a position number (1-6 only) to see all possible scenarios to reach it, including which matches to watch and what needs to happen if you win or lose your remaining matches.
              </InfoText>
              </InfoBox>
            </FormGroup>

            <FormGroup>
              <Label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={advancedMode}
                  onChange={(e) => setAdvancedMode(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <span>✨ Advanced Mode - Show All Permutations & Match Scenarios</span>
              </Label>
              {advancedMode && (
                <>
                  <Label style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Qualify For:</Label>
                  <Select
                    value={qualifyFor}
                    onChange={(e) => setQualifyFor(e.target.value)}
                    style={{ marginBottom: '0.5rem' }}
                  >
                    <option value="top1">Top 1 (Champion)</option>
                    <option value="top2">Top 2</option>
                    <option value="top3">Top 3</option>
                    <option value={targetPosition || '1'}>Position {targetPosition || 1}</option>
                  </Select>
                  <InfoBox style={{ background: '#fff3cd', borderLeftColor: '#ffc107' }}>
                    <FaInfoCircle />
                    <InfoText style={{ color: '#856404' }}>
                      Advanced mode calculates all possible match outcome combinations and shows you exactly what needs to happen in each match for you to qualify. This includes considering all teams' remaining matches.
                    </InfoText>
                  </InfoBox>
                </>
              )}
            </FormGroup>
          </>
        )}

        {error && (
          <Error>
            <FaExclamationTriangle />
            {error}
          </Error>
        )}

        <Button
          onClick={calculateRequirements}
          disabled={!selectedTeam || !targetPosition || calculating}
        >
          {calculating ? 'Calculating...' : 'Calculate Requirements'}
        </Button>
      </CalculatorCard>

      {results && (
        <ResultsCard>
          <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#333' }}>
            <FaTrophy style={{ marginRight: '0.5rem' }} />
            Calculation Results
          </h2>

          {results.message && (
            <InfoBox>
              <FaInfoCircle />
              <InfoText>{results.message}</InfoText>
            </InfoBox>
          )}

          {/* Show basic stats for both modes */}
          {(results.currentPosition || results.currentStats) && (
            <StatsGrid>
              <StatCard highlight>
                <StatLabel>Current Position</StatLabel>
                <StatValue>#{results.currentPosition || 'N/A'}</StatValue>
              </StatCard>
              <StatCard highlight>
                <StatLabel>Target Position</StatLabel>
                <StatValue>#{results.targetPosition || 'N/A'}</StatValue>
              </StatCard>
              <StatCard>
                <StatLabel>Remaining Matches</StatLabel>
                <StatValue>{results.remainingMatches || results.currentStats?.remainingMatches || 0}</StatValue>
              </StatCard>
              {results.currentStats && (
                <>
                  <StatCard>
                    <StatLabel>Current Points</StatLabel>
                    <StatValue>{results.currentStats.points || 0}</StatValue>
                  </StatCard>
                  <StatCard>
                    <StatLabel>Current NRR</StatLabel>
                    <StatValue>{results.currentStats.nrr?.toFixed(3) || '0.000'}</StatValue>
                  </StatCard>
                </>
              )}
            </StatsGrid>
          )}

          {/* Regular mode requirements - only show if not in advanced mode */}
          {!advancedMode && results.requirements && (
            <RequirementsSection>
                <RequirementsTitle>
                  <FaChartLine />
                  What You Need to Achieve
                </RequirementsTitle>
                <RequirementItem>
                  <RequirementLabel>Points Needed:</RequirementLabel>
                  <RequirementValue>+{results.requirements.pointsNeeded} points</RequirementValue>
                </RequirementItem>
                <RequirementItem>
                  <RequirementLabel>Minimum Wins Required:</RequirementLabel>
                  <RequirementValue>{results.requirements.minWinsNeeded} wins</RequirementValue>
                </RequirementItem>
                {results.requirements.nrrImprovementNeeded > 0 && (
                  <RequirementItem>
                    <RequirementLabel>NRR Improvement Needed:</RequirementLabel>
                    <RequirementValue>+{results.requirements.nrrImprovementNeeded}</RequirementValue>
                  </RequirementItem>
                )}
                {results.requirements.fairnessImprovementNeeded > 0 && (
                  <RequirementItem>
                    <RequirementLabel>Fairness Improvement Needed:</RequirementLabel>
                    <RequirementValue>+{results.requirements.fairnessImprovementNeeded}</RequirementValue>
                  </RequirementItem>
                )}
              </RequirementsSection>
            )}

              {!advancedMode && results.matchScenarios && results.matchScenarios.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                  <SectionHeader>
                    <FaChartLine />
                    Next Match Scenarios
                  </SectionHeader>
                  <InfoBox>
                    <FaInfoCircle />
                    <InfoText>
                      <strong>What You Need to Do:</strong> These scenarios show specific match outcomes that would help you surpass the target position. 
                      <Badge type="success">Green scenarios</Badge> will definitely help you reach your goal, while 
                      <Badge type="warning">yellow scenarios</Badge> may need additional improvements.
                    </InfoText>
                  </InfoBox>
                  {results.matchScenarios.map((match, index) => (
                    <ScenarioCard key={index} willReach={match.willSurpass}>
                      <ScenarioTitle willReach={match.willSurpass}>
                        {match.willSurpass ? (
                          <>
                            <FaCheckCircle style={{ color: '#28a745', fontSize: '1.2rem' }} /> 
                            Scenario {index + 1}: {match.description}
                            <Badge type="success">Will Surpass</Badge>
                          </>
                        ) : (
                          <>
                            <FaExclamationTriangle style={{ color: '#ffc107', fontSize: '1.2rem' }} /> 
                            Scenario {index + 1}: {match.description}
                            <Badge type="warning">May Need More</Badge>
                          </>
                        )}
                      </ScenarioTitle>
                      <ScenarioGrid>
                        <ScenarioStat>
                          <ScenarioStatLabel>Your Score</ScenarioStatLabel>
                          <ScenarioStatValue highlight={match.willSurpass}>
                            {match.yourScore} <span style={{ fontSize: '0.85rem', color: '#666' }}>runs</span>
                            <span style={{ fontSize: '0.75rem', color: '#999' }}>in {match.yourOvers.toFixed(1)} ov</span>
                          </ScenarioStatValue>
                        </ScenarioStat>
                        <ScenarioStat>
                          <ScenarioStatLabel>Opponent Score</ScenarioStatLabel>
                          <ScenarioStatValue>
                            {match.opponentScore} <span style={{ fontSize: '0.85rem', color: '#666' }}>runs</span>
                            <span style={{ fontSize: '0.75rem', color: '#999' }}>in {match.opponentOvers.toFixed(1)} ov</span>
                          </ScenarioStatValue>
                        </ScenarioStat>
                        <ScenarioStat>
                          <ScenarioStatLabel>Win Margin</ScenarioStatLabel>
                          <ScenarioStatValue highlight={match.willSurpass}>
                            {match.margin}
                          </ScenarioStatValue>
                        </ScenarioStat>
                        <ScenarioStat>
                          <ScenarioStatLabel>New Points</ScenarioStatLabel>
                          <ScenarioStatValue highlight={match.willSurpass}>
                            {match.newPoints} <span style={{ fontSize: '0.75rem', color: '#28a745' }}>(+2)</span>
                          </ScenarioStatValue>
                        </ScenarioStat>
                        <ScenarioStat>
                          <ScenarioStatLabel>New NRR</ScenarioStatLabel>
                          <ScenarioStatValue highlight={match.newNRR > 0}>
                            {match.newNRR > 0 ? '+' : ''}{match.newNRR.toFixed(3)}
                            {match.newNRR > results.currentStats.nrr && (
                              <span style={{ fontSize: '0.75rem', color: '#28a745' }}>↑</span>
                            )}
                          </ScenarioStatValue>
                        </ScenarioStat>
                        <ScenarioStat>
                          <ScenarioStatLabel>Status</ScenarioStatLabel>
                          <ScenarioStatValue>
                            {match.willSurpass ? (
                              <Badge type="success">✅ Will Surpass</Badge>
                            ) : (
                              <Badge type="warning">⚠️ May Need More</Badge>
                            )}
                          </ScenarioStatValue>
                        </ScenarioStat>
                      </ScenarioGrid>
                    </ScenarioCard>
                  ))}
                </div>
              )}

              {results.scenarios && results.scenarios.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                  <SectionHeader>
                    <FaTrophy />
                    General Scenarios
                  </SectionHeader>
                  {results.scenarios.map((scenario, index) => (
                    <ScenarioCard key={index} willReach={scenario.willReach}>
                      <ScenarioTitle willReach={scenario.willReach}>
                        {scenario.willReach ? (
                          <>
                            <FaCheckCircle style={{ color: '#28a745', fontSize: '1.2rem' }} /> 
                            {scenario.description}
                            <Badge type="success">Recommended</Badge>
                          </>
                        ) : (
                          <>
                            <FaExclamationTriangle style={{ color: '#ffc107', fontSize: '1.2rem' }} /> 
                            {scenario.description}
                            <Badge type="warning">May Need More</Badge>
                          </>
                        )}
                      </ScenarioTitle>
                      <ScenarioGrid>
                        <ScenarioStat>
                          <ScenarioStatLabel>Projected Points</ScenarioStatLabel>
                          <ScenarioStatValue highlight={scenario.willReach}>
                            {scenario.points}
                          </ScenarioStatValue>
                        </ScenarioStat>
                        <ScenarioStat>
                          <ScenarioStatLabel>NRR</ScenarioStatLabel>
                          <ScenarioStatValue>
                            {scenario.nrr > 0 ? '+' : ''}{scenario.nrr.toFixed(3)}
                          </ScenarioStatValue>
                        </ScenarioStat>
                        <ScenarioStat>
                          <ScenarioStatLabel>Fairness</ScenarioStatLabel>
                          <ScenarioStatValue>
                            {scenario.fairness}
                          </ScenarioStatValue>
                        </ScenarioStat>
                      </ScenarioGrid>
                      <ScenarioNote>{scenario.note}</ScenarioNote>
                    </ScenarioCard>
                  ))}
                </div>
              )}

              {/* Advanced Mode - Permutation Scenarios */}
              {advancedMode && results && (
                <>
                  {results.qualificationScenarios && Array.isArray(results.qualificationScenarios) && results.qualificationScenarios.length > 0 ? (
                    <div style={{ marginTop: '2rem' }}>
                      <SectionHeader>
                        <FaTrophy />
                        🎯 Qualification Scenarios (All Permutations)
                      </SectionHeader>
                      <InfoBox style={{ background: '#e8f5e9', borderLeftColor: '#4caf50' }}>
                        <FaInfoCircle />
                        <InfoText style={{ color: '#2e7d32' }}>
                          <strong>Magic Calculation Complete! ✨</strong> These scenarios show all possible match outcome combinations. 
                          Each scenario considers your matches AND all other teams' remaining matches. 
                          <Badge type="success">Green scenarios</Badge> guarantee qualification, while others show what else might be needed.
                        </InfoText>
                      </InfoBox>
                      
                      {results.qualificationScenarios.map((scenario, index) => (
                    <ScenarioCard 
                      key={index} 
                      willReach={scenario.qualifies}
                      className="scenario-card"
                      style={{
                        animation: showAnimations ? 'fadeInUp 0.5s ease forwards' : 'none',
                        animationDelay: `${index * 0.1}s`,
                        opacity: showAnimations ? 0 : 1
                      }}
                    >
                      <ScenarioTitle willReach={scenario.qualifies}>
                        {scenario.qualifies ? (
                          <>
                            <FaCheckCircle style={{ color: '#28a745', fontSize: '1.2rem' }} /> 
                            Scenario {scenario.scenarioNumber}: {scenario.userWins} Wins, {scenario.userLosses} Losses
                            <Badge type="success">✅ QUALIFIES</Badge>
                          </>
                        ) : (
                          <>
                            <FaExclamationTriangle style={{ color: '#ffc107', fontSize: '1.2rem' }} /> 
                            Scenario {scenario.scenarioNumber}: {scenario.userWins} Wins, {scenario.userLosses} Losses
                            <Badge type="warning">⚠️ May Not Qualify</Badge>
                          </>
                        )}
                      </ScenarioTitle>
                      
                      <ScenarioGrid>
                        <ScenarioStat>
                          <ScenarioStatLabel>Your Wins</ScenarioStatLabel>
                          <ScenarioStatValue highlight={scenario.qualifies}>
                            {scenario.userWins} / {results.remainingFixtures?.length || 0}
                          </ScenarioStatValue>
                        </ScenarioStat>
                        <ScenarioStat>
                          <ScenarioStatLabel>New Points</ScenarioStatLabel>
                          <ScenarioStatValue highlight={scenario.qualifies}>
                            {scenario.newUserPoints}
                            <span style={{ fontSize: '0.75rem', color: '#28a745' }}>
                              (+{scenario.userWins * 2})
                            </span>
                          </ScenarioStatValue>
                        </ScenarioStat>
                        <ScenarioStat>
                          <ScenarioStatLabel>New NRR</ScenarioStatLabel>
                          <ScenarioStatValue highlight={scenario.newUserNRR > results.currentStats.nrr}>
                            {scenario.newUserNRR > 0 ? '+' : ''}{scenario.newUserNRR.toFixed(3)}
                            {scenario.newUserNRR > results.currentStats.nrr && (
                              <span style={{ fontSize: '0.75rem', color: '#28a745' }}>↑</span>
                            )}
                          </ScenarioStatValue>
                        </ScenarioStat>
                        <ScenarioStat>
                          <ScenarioStatLabel>New Rank</ScenarioStatLabel>
                          <ScenarioStatValue highlight={scenario.newRank <= parseInt(results.targetPosition || 6)}>
                            #{scenario.newRank}
                            {scenario.newRank < results.currentPosition && (
                              <span style={{ fontSize: '0.75rem', color: '#28a745' }}>↑</span>
                            )}
                          </ScenarioStatValue>
                        </ScenarioStat>
                        <ScenarioStat>
                          <ScenarioStatLabel>Status</ScenarioStatLabel>
                          <ScenarioStatValue>
                            {scenario.qualifies ? (
                              <Badge type="success">🎉 QUALIFIED</Badge>
                            ) : (
                              <Badge type="warning">Need More Wins/NRR</Badge>
                            )}
                          </ScenarioStatValue>
                        </ScenarioStat>
                      </ScenarioGrid>

                      {/* Detailed Match Scenarios */}
                      {scenario.matchScenarios && scenario.matchScenarios.length > 0 && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.8)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}>
                          <strong style={{ color: '#333', fontSize: '0.95rem', display: 'block', marginBottom: '0.75rem' }}>
                            📋 Match-by-Match Breakdown:
                          </strong>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {scenario.matchScenarios.map((match, matchIdx) => (
                              <div 
                                key={matchIdx}
                                style={{
                                  padding: '0.75rem',
                                  background: match.matchType === 'your_match' 
                                    ? (match.outcome === 'win' ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)')
                                    : 'rgba(255, 193, 7, 0.1)',
                                  borderRadius: '6px',
                                  borderLeft: `3px solid ${
                                    match.matchType === 'your_match' 
                                      ? (match.outcome === 'win' ? '#28a745' : '#dc3545')
                                      : '#ffc107'
                                  }`,
                                  fontSize: '0.85rem'
                                }}
                              >
                                {match.matchType === 'your_match' ? (
                                  <div>
                                    <strong style={{ color: match.outcome === 'win' ? '#28a745' : '#dc3545' }}>
                                      {match.outcome === 'win' ? '✅ WIN' : '❌ LOSE'}
                                    </strong>
                                    {' '}vs <strong>{match.opponent}</strong>
                                    {match.yourScore && (
                                      <div style={{ marginTop: '0.25rem', color: '#666', fontSize: '0.8rem' }}>
                                        You: {match.yourScore} runs ({match.yourOvers?.toFixed(1)} ov) | 
                                        {match.opponent}: {match.opponentScore} runs ({match.opponentOvers?.toFixed(1)} ov)
                                        {match.battingFirst === 'yes' && ' | Batting First'}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    <span style={{ color: '#ffc107', fontWeight: 'bold' }}>🎯 CRITICAL:</span>
                                    {' '}<strong>{match.teamAbove}</strong> must <strong style={{ color: '#dc3545' }}>LOSE</strong> to <strong>{match.opponent}</strong>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Critical Matches to Watch */}
                      {scenario.criticalMatches && scenario.criticalMatches.length > 0 && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255, 193, 7, 0.15)', borderRadius: '8px', border: '2px solid #ffc107' }}>
                          <strong style={{ color: '#856404', fontSize: '0.95rem', display: 'block', marginBottom: '0.75rem' }}>
                            👀 CRITICAL MATCHES TO WATCH:
                          </strong>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {scenario.criticalMatches.map((match, matchIdx) => (
                              <div 
                                key={matchIdx}
                                style={{
                                  padding: '0.75rem',
                                  background: 'white',
                                  borderRadius: '6px',
                                  borderLeft: '4px solid #ffc107',
                                  fontSize: '0.85rem'
                                }}
                              >
                                <div style={{ fontWeight: 'bold', color: '#856404', marginBottom: '0.25rem' }}>
                                  {match.teamAbove} vs {match.opponent}
                                </div>
                                <div style={{ color: '#666', fontSize: '0.8rem' }}>
                                  <div>Required: <strong style={{ color: '#dc3545' }}>{match.requiredOutcome}</strong></div>
                                  <div>Reason: {match.reason}</div>
                                  <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#999' }}>
                                    {match.teamAbove}: {match.teamAbovePoints} pts, NRR: {match.teamAboveNRR?.toFixed(3) || '0.000'} | 
                                    {match.opponent}: {match.opponentPoints} pts, NRR: {match.opponentNRR?.toFixed(3) || '0.000'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {scenario.summary && (
                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '6px', fontSize: '0.85rem' }}>
                          <strong style={{ color: '#667eea' }}>Summary:</strong>
                          <div style={{ marginTop: '0.25rem', color: '#666' }}>
                            <div>Scenario Type: <strong>{scenario.scenarioType || 'Standard'}</strong></div>
                            <div>Your Matches: {scenario.summary.yourMatches} | 
                            Critical Matches: {scenario.summary.criticalMatches} | 
                            New Rank: <strong>#{scenario.newRank || results.currentPosition}</strong></div>
                            <div>Teams That Must Lose: {scenario.summary.teamsThatMustLose?.join(', ') || 'None'}</div>
                            {scenario.summary.matchesToWatch && scenario.summary.matchesToWatch.length > 0 && (
                              <div style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>
                                Matches to Watch: {scenario.summary.matchesToWatch.join('; ')}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {scenario.requirements && (
                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.7)', borderRadius: '8px' }}>
                          <strong style={{ color: '#333', fontSize: '0.9rem' }}>Requirements:</strong>
                          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                            <div>Min Wins Needed: {scenario.requirements.minWinsNeeded}</div>
                            <div>NRR Needed: +{scenario.requirements.nrrNeeded.toFixed(3)}</div>
                          </div>
                        </div>
                      )}
                    </ScenarioCard>
                      ))}
                    </div>
                  ) : (
                    <div style={{ marginTop: '2rem', padding: '2rem', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
                      <FaInfoCircle style={{ fontSize: '2rem', color: '#6c757d', marginBottom: '1rem' }} />
                      <h3 style={{ color: '#333', marginBottom: '0.5rem' }}>No Qualification Scenarios Found</h3>
                      <p style={{ color: '#666' }}>
                        {results.qualificationScenarios 
                          ? 'No scenarios were generated. This might mean there are no remaining matches or the calculation could not find viable paths to qualification.'
                          : 'The advanced calculator did not return qualification scenarios. Please check the browser console for errors.'}
                      </p>
                      {results.remainingFixtures && results.remainingFixtures.length === 0 && (
                        <p style={{ color: '#dc3545', marginTop: '0.5rem' }}>
                          ⚠️ You have no remaining matches. Cannot calculate qualification scenarios.
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Show ALL remaining matches with required outcomes */}
              {advancedMode && results.allRemainingMatchesAnalysis && results.allRemainingMatchesAnalysis.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                  <SectionHeader>
                    <FaChartLine />
                    📋 ALL Remaining Matches - Who Should Win/Lose
                  </SectionHeader>
                  <InfoBox style={{ background: '#e3f2fd', borderLeftColor: '#2196F3' }}>
                    <FaInfoCircle />
                    <InfoText style={{ color: '#1565C0' }}>
                      <strong>Complete Match Analysis:</strong> This shows ALL remaining matches across ALL teams and what needs to happen in each match for you to qualify. 
                      <Badge type="success">Critical matches</Badge> are where teams above you must lose.
                    </InfoText>
                  </InfoBox>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                    {results.allRemainingMatchesAnalysis.map((match, idx) => (
                      <div 
                        key={match.matchId || idx}
                        style={{
                          background: match.importance === 'critical' 
                            ? 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)'
                            : match.importance === 'high'
                            ? 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'
                            : 'white',
                          padding: '1rem',
                          borderRadius: '8px',
                          border: `2px solid ${
                            match.importance === 'critical' ? '#ffc107' :
                            match.importance === 'high' ? '#2196F3' : '#e0e0e0'
                          }`,
                          boxShadow: match.importance === 'critical' 
                            ? '0 4px 12px rgba(255, 193, 7, 0.3)'
                            : '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontSize: '1.1rem', 
                              fontWeight: 'bold', 
                              color: match.importance === 'critical' ? '#856404' : '#333',
                              marginBottom: '0.5rem'
                            }}>
                              {match.team1} <span style={{ color: '#999' }}>vs</span> {match.team2}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                              <strong>Required Outcome:</strong> <span style={{ 
                                color: match.importance === 'critical' ? '#dc3545' : '#333',
                                fontWeight: 'bold'
                              }}>{match.requiredOutcome}</span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
                              {match.reason}
                            </div>
                          </div>
                          <div style={{ 
                            padding: '0.5rem 1rem', 
                            background: match.importance === 'critical' ? '#ffc107' : '#e0e0e0',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            color: match.importance === 'critical' ? '#856404' : '#666',
                            textTransform: 'uppercase'
                          }}>
                            {match.importance}
                          </div>
                        </div>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                          gap: '0.75rem',
                          marginTop: '0.75rem',
                          padding: '0.75rem',
                          background: 'rgba(255, 255, 255, 0.5)',
                          borderRadius: '6px',
                          fontSize: '0.85rem'
                        }}>
                          <div>
                            <strong>{match.team1}:</strong><br/>
                            Rank: {match.team1Rank} | Points: {match.team1Points} | NRR: {match.team1NRR?.toFixed(3) || '0.000'}
                          </div>
                          <div>
                            <strong>{match.team2}:</strong><br/>
                            Rank: {match.team2Rank} | Points: {match.team2Points} | NRR: {match.team2NRR?.toFixed(3) || '0.000'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show remaining fixtures for all teams (simplified view) */}
              {advancedMode && results.allTeamsRemainingFixtures && (
                <div style={{ marginTop: '2rem' }}>
                  <SectionHeader>
                    <FaChartLine />
                    📅 All Teams' Remaining Matches (Quick View)
                  </SectionHeader>
                  <InfoBox>
                    <FaInfoCircle />
                    <InfoText>
                      Quick reference: Remaining matches for each team. See the detailed analysis above for required outcomes.
                    </InfoText>
                  </InfoBox>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                    {Object.entries(results.allTeamsRemainingFixtures).map(([teamName, fixtures]) => (
                      <div key={teamName} style={{ 
                        background: 'white', 
                        padding: '1rem', 
                        borderRadius: '8px', 
                        border: '1px solid #e0e0e0',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        <strong style={{ color: '#667eea', display: 'block', marginBottom: '0.5rem' }}>
                          {teamName}
                        </strong>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>
                          {fixtures.length > 0 ? (
                            fixtures.map((f, idx) => (
                              <div key={idx} style={{ marginBottom: '0.25rem' }}>
                                vs {f.opponent}
                              </div>
                            ))
                          ) : (
                            <div style={{ color: '#999', fontStyle: 'italic' }}>No remaining matches</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Target Team Stats - only show in regular mode */}
              {!advancedMode && results.targetStats && (
                <div style={{ marginTop: '2rem', background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#333' }}>Target Team Stats</h3>
                  <StatsGrid>
                    <StatCard>
                      <StatLabel>Team</StatLabel>
                      <StatValue>{results.targetStats.teamName}</StatValue>
                    </StatCard>
                    <StatCard>
                      <StatLabel>Points</StatLabel>
                      <StatValue>{results.targetStats.points}</StatValue>
                    </StatCard>
                    <StatCard>
                      <StatLabel>NRR</StatLabel>
                      <StatValue>{results.targetStats.nrr.toFixed(3)}</StatValue>
                    </StatCard>
                    <StatCard>
                      <StatLabel>Fairness</StatLabel>
                      <StatValue>{results.targetStats.fairness}</StatValue>
                    </StatCard>
                    <StatCard>
                      <StatLabel>Wins</StatLabel>
                      <StatValue>{results.targetStats.wins}</StatValue>
                    </StatCard>
                    <StatCard>
                      <StatLabel>Losses</StatLabel>
                      <StatValue>{results.targetStats.losses}</StatValue>
                    </StatCard>
                  </StatsGrid>
                </div>
              )}
        </ResultsCard>
      )}
    </Container>
  );
};

export default PositionCalculator;

