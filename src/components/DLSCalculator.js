import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaCalculator, FaCloudRain, FaBaseballBall, FaUsers, FaChartLine, FaTrophy } from 'react-icons/fa';
import { API_ENDPOINTS } from '../const';

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  background: rgba(255, 255, 255, 0.95);
  padding: 2rem;
  border-radius: 20px;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  text-align: center;
  
  h1 {
    margin: 0;
    font-size: 2.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    
    @media (max-width: 768px) {
      font-size: 1.8rem;
    }
  }
  
  p {
    margin: 0.5rem 0 0 0;
    color: #666;
    font-size: 1.1rem;
  }
`;

const FormCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  margin: 0 0 1.5rem 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 1rem;
  border-bottom: 3px solid #667eea;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  label {
    font-weight: 600;
    color: #555;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  input, select {
    padding: 0.75rem 1rem;
    border: 2px solid #e0e0e0;
    border-radius: 10px;
    font-size: 1rem;
    transition: all 0.3s ease;
    
    &:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  }
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
`;

const RadioOption = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  
  input[type="radio"] {
    margin: 0;
    cursor: pointer;
  }
  
  &:has(input:checked) {
    border-color: #667eea;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 600;
  }
  
  &:hover {
    border-color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  }
`;

const CalculateButton = styled.button`
  width: 100%;
  padding: 1.25rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 15px;
  font-size: 1.25rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
  }
  
  &:active {
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ResultCard = styled.div`
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  border: 3px solid #28a745;
  
  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const ResultHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  
  h2 {
    margin: 0;
    font-size: 2rem;
    color: #155724;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }
`;

const ResultGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const ResultItem = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  
  .label {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }
  
  .value {
    font-size: 1.8rem;
    font-weight: 700;
    color: #155724;
  }
  
  .sub-value {
    font-size: 0.9rem;
    color: #888;
    margin-top: 0.25rem;
  }
`;

const TargetDisplay = styled.div`
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  padding: 2rem;
  border-radius: 15px;
  text-align: center;
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
  border: 3px solid #ffc107;
  margin-top: 1.5rem;
  
  .target-label {
    font-size: 1.2rem;
    color: #856404;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  
  .target-value {
    font-size: 3.5rem;
    font-weight: 900;
    color: #856404;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
    
    @media (max-width: 768px) {
      font-size: 2.5rem;
    }
  }
  
  .target-sub {
    font-size: 1rem;
    color: #856404;
    margin-top: 0.5rem;
  }
`;

const ErrorMessage = styled.div`
  background: #f8d7da;
  color: #721c24;
  padding: 1.5rem;
  border-radius: 15px;
  border: 2px solid #f5c6cb;
  margin-bottom: 2rem;
  font-weight: 600;
`;

const LoadingSpinner = styled.div`
  text-align: center;
  padding: 3rem;
  
  .spinner {
    border: 4px solid #f3f3f3;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const DLSCalculator = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    team1Score: '',
    team1Wickets: '',
    team1Overs: '',
    team2OversAvailable: '20',
    onStrikePower: '',
    nonStrikePower: '',
    nextPlayer1Power: '',
    nextPlayer2Power: '',
    nextPlayer3Power: ''
  });

  useEffect(() => {
    const cached = localStorage.getItem('user');
    if (cached) {
      const userData = JSON.parse(cached);
      setUser(userData);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: value
      };
      
      // If wickets changed, clear all next player fields to avoid stale data
      if (name === 'team1Wickets') {
        const wicketsLost = parseInt(value) || 0;
        const totalPlayers = 11;
        const remainingBatsmen = totalPlayers - wicketsLost;
        const nextPlayersCount = Math.max(0, remainingBatsmen - 2);
        
        // Clear fields beyond the new count
        for (let i = nextPlayersCount + 1; i <= 9; i++) {
          updated[`nextPlayer${i}Power`] = '';
        }
      }
      
      return updated;
    });
    setError(null);
    setResult(null);
  };

  const handleCalculate = async () => {
    // Validation
    if (!formData.team1Score || !formData.team1Overs || !formData.team2OversAvailable) {
      setError('Please fill in all required fields: Team 1 Score, Team 1 Overs, and Team 2 Overs Available');
      return;
    }

    if (!user) {
      setError('Please log in to use the calculator');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const userId = user.id || user._id;
      
      // Build next players array dynamically (only include non-empty values)
      const nextPlayersPower = [];
      const wicketsLost = parseInt(formData.team1Wickets) || 0;
      const totalPlayers = 11;
      const remainingBatsmen = totalPlayers - wicketsLost;
      const nextPlayersCount = Math.max(0, remainingBatsmen - 2);
      
      // Collect all next player power ratings
      for (let i = 1; i <= nextPlayersCount; i++) {
        const fieldName = `nextPlayer${i}Power`;
        if (formData[fieldName]) {
          nextPlayersPower.push(parseInt(formData[fieldName]));
        } else {
          // If not provided, default to 60 (bowler)
          nextPlayersPower.push(60);
        }
      }
      
      const response = await fetch(`${API_ENDPOINTS}/api/admin-tools/target/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          matchData: {
            team1Score: formData.team1Score,
            team1Wickets: parseInt(formData.team1Wickets) || 0,
            team1Overs: formData.team1Overs,
            team2OversAvailable: formData.team2OversAvailable,
            onStrikePower: parseInt(formData.onStrikePower) || 60,
            nonStrikePower: parseInt(formData.nonStrikePower) || 60,
            nextPlayersPower: nextPlayersPower
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to calculate target');
      }

      setResult(data.calculation);
    } catch (err) {
      console.error('Target calculation error:', err);
      setError(err.message || 'Failed to calculate target. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container>
        <LoadingSpinner>
          <div className="spinner"></div>
          <p>Loading...</p>
        </LoadingSpinner>
      </Container>
    );
  }


  return (
    <Container>
      <Header>
        <h1><FaCalculator /> Target Calculator</h1>
        <p>Run Rate Based Target Calculation for Rain-Affected Matches</p>
      </Header>

      <FormCard>
        <SectionTitle>
          <FaBaseballBall /> Match Details
        </SectionTitle>
        
        <FormGrid>
          <FormGroup>
            <label><FaChartLine /> Team 1 Score (Runs)</label>
            <input
              type="text"
              name="team1Score"
              value={formData.team1Score}
              onChange={handleInputChange}
              placeholder="e.g., 160"
            />
          </FormGroup>

          <FormGroup>
            <label><FaUsers /> Team 1 Wickets Lost</label>
            <input
              type="number"
              name="team1Wickets"
              value={formData.team1Wickets}
              onChange={handleInputChange}
              placeholder="e.g., 4"
              min="0"
              max="10"
            />
          </FormGroup>

          <FormGroup>
            <label><FaBaseballBall /> Team 1 Overs Faced</label>
            <input
              type="text"
              name="team1Overs"
              value={formData.team1Overs}
              onChange={handleInputChange}
              placeholder="e.g., 15.3 or 15"
            />
          </FormGroup>

          <FormGroup>
            <label><FaBaseballBall /> Team 2 Overs Available</label>
            <input
              type="text"
              name="team2OversAvailable"
              value={formData.team2OversAvailable}
              onChange={handleInputChange}
              placeholder="e.g., 20"
            />
          </FormGroup>
        </FormGrid>

        <SectionTitle style={{ marginTop: '1.5rem' }}>
          <FaUsers /> Player Power Ratings
        </SectionTitle>
        <div style={{ 
          background: '#f8f9fa', 
          padding: '1rem', 
          borderRadius: '10px', 
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
          color: '#666'
        }}>
          <strong>Power Rating Guide:</strong> 80+ = Excellent hitter (10 runs bonus), 70-79 = Good hitter (6 runs bonus), 60-69 = Bowler/Moderate (2 runs bonus)
          <br />
          <small style={{ color: '#888', marginTop: '0.5rem', display: 'block' }}>
            <strong>Note:</strong> 60-69 power players & any bowler = 2 runs bonus. 70+ power = 6 runs/over for remaining overs.
          </small>
        </div>

        <FormGrid>
          <FormGroup>
            <label><FaUsers /> On-Strike Player Power</label>
            <input
              type="number"
              name="onStrikePower"
              value={formData.onStrikePower}
              onChange={handleInputChange}
              placeholder="e.g., 80"
              min="0"
              max="100"
              required
            />
            <small style={{ color: '#666', fontSize: '0.85rem' }}>Power rating of player on strike</small>
          </FormGroup>

          <FormGroup>
            <label><FaUsers /> Non-Strike Player Power</label>
            <input
              type="number"
              name="nonStrikePower"
              value={formData.nonStrikePower}
              onChange={handleInputChange}
              placeholder="e.g., 75 or 78"
              min="0"
              max="100"
              required
            />
            <small style={{ color: '#666', fontSize: '0.85rem' }}>Power rating of non-strike player</small>
          </FormGroup>
        </FormGrid>

        <SectionTitle style={{ marginTop: '1.5rem', fontSize: '1.2rem' }}>
          Next Players (If Wickets Fall)
        </SectionTitle>
        {(() => {
          const wicketsLost = parseInt(formData.team1Wickets) || 0;
          const totalPlayers = 11;
          const remainingBatsmen = totalPlayers - wicketsLost;
          const nextPlayersCount = Math.max(0, remainingBatsmen - 2); // Minus on-strike and non-strike
          
          if (nextPlayersCount === 0) {
            return (
              <div style={{ 
                padding: '1rem', 
                background: '#fff3cd', 
                borderRadius: '10px',
                color: '#856404',
                fontSize: '0.9rem'
              }}>
                ⚠️ No remaining players. All 11 players have been used or wickets lost is invalid.
              </div>
            );
          }

          return (
            <div>
          <div style={{ 
            marginBottom: '1rem', 
            padding: '0.75rem', 
            background: '#e7f3ff', 
            borderRadius: '8px',
            fontSize: '0.9rem',
            color: '#004085'
          }}>
            <strong>Remaining Players:</strong> {remainingBatsmen} total - 2 (on-strike & non-strike) = <strong>{nextPlayersCount} next players</strong>
            <br />
            <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
              Power normalization: &lt;70 → 60, 70-79 → 78, 80+ → as entered
            </small>
          </div>
              <FormGrid>
                {Array.from({ length: nextPlayersCount }, (_, index) => {
                  const fieldName = `nextPlayer${index + 1}Power`;
                  return (
                    <FormGroup key={index}>
                      <label><FaUsers /> Next Player {index + 1} Power</label>
                      <input
                        type="number"
                        name={fieldName}
                        value={formData[fieldName] || ''}
                        onChange={handleInputChange}
                        placeholder="e.g., 60 (bowler)"
                        min="0"
                        max="100"
                      />
                    </FormGroup>
                  );
                })}
              </FormGrid>
            </div>
          );
        })()}

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <CalculateButton onClick={handleCalculate} disabled={loading}>
          {loading ? (
            <>
              <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
              Calculating...
            </>
          ) : (
            <>
              <FaCalculator />
              Calculate Target
            </>
          )}
        </CalculateButton>
      </FormCard>

      {result && (
        <ResultCard>
          <ResultHeader>
            <h2><FaTrophy /> Target Calculation Result</h2>
          </ResultHeader>

          <ResultGrid>
            <ResultItem>
              <div className="label">Team 1 Score</div>
              <div className="value">{result.team1Score}</div>
              <div className="sub-value">{result.team1Overs} overs / {result.team1Wickets} wickets</div>
            </ResultItem>

            <ResultItem>
              <div className="label">Remaining Overs</div>
              <div className="value">{result.remainingOvers}</div>
              <div className="sub-value">overs left to play</div>
            </ResultItem>

            <ResultItem>
              <div className="label">Runs Per Over</div>
              <div className="value">{result.runsPerOver}</div>
              <div className="sub-value">
                {result.has70PlusPlayer ? '70+ power player exists' : 'No 70+ power players'}
              </div>
            </ResultItem>

            <ResultItem>
              <div className="label">Remaining Overs Runs</div>
              <div className="value">{result.remainingOversRuns}</div>
              <div className="sub-value">{result.remainingOvers} × {result.runsPerOver}</div>
            </ResultItem>

            <ResultItem>
              <div className="label">Total Power Bonus</div>
              <div className="value">{result.totalPowerBonus}</div>
              <div className="sub-value">from all remaining players</div>
            </ResultItem>

            <ResultItem>
              <div className="label">Projected Total</div>
              <div className="value">{result.projectedTotal}</div>
              <div className="sub-value">Score + Overs Runs + Bonus</div>
            </ResultItem>

            <ResultItem>
              <div className="label">Required Run Rate</div>
              <div className="value">{result.requiredRunRate}</div>
              <div className="sub-value">runs per over</div>
            </ResultItem>

            <ResultItem>
              <div className="label">Overs Available</div>
              <div className="value">{result.team2OversAvailable}</div>
              <div className="sub-value">for Team 2</div>
            </ResultItem>
          </ResultGrid>

          <TargetDisplay>
            <div className="target-label">TARGET FOR TEAM 2</div>
            <div className="target-value">{result.target}</div>
            <div className="target-sub">runs in {result.team2OversAvailable} overs</div>
          </TargetDisplay>

          {result.powerAnalysis && result.powerAnalysis.length > 0 && (
            <div style={{ 
              marginTop: '2rem', 
              padding: '1.5rem', 
              background: 'rgba(255, 255, 255, 0.7)', 
              borderRadius: '10px'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#155724' }}>Player Contribution Analysis</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {result.powerAnalysis.map((player, index) => {
                  return (
                    <div key={index} style={{ 
                      background: 'white', 
                      padding: '1rem', 
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ fontWeight: '600', color: '#333' }}>{player.player}</div>
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>
                        Power: {player.power}
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#155724', marginTop: '0.5rem' }}>
                        +{player.bonus} runs bonus
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ 
            marginTop: '2rem', 
            padding: '1.5rem', 
            background: 'rgba(255, 255, 255, 0.7)', 
            borderRadius: '10px',
            fontSize: '0.9rem',
            color: '#155724'
          }}>
            <strong>Calculation Details:</strong> {result.calculationDetails}
            <br />
            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
              <strong>Formula:</strong> Target = {result.team1Score} (Current) + {result.remainingOversRuns} (Overs) + {result.totalPowerBonus} (Power Bonus) = {result.projectedTotal} + 1 = <strong>{result.target}</strong>
            </div>
          </div>
        </ResultCard>
      )}
    </Container>
  );
};

export default DLSCalculator;

