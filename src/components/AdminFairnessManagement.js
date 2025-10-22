import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import axios from 'axios';
import { API_ENDPOINTS } from '../const';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7);
  }
  70% {
    transform: scale(1.02);
    box-shadow: 0 0 0 10px rgba(102, 126, 234, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(102, 126, 234, 0);
  }
`;

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 1rem 0.5rem;
  }

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    animation: float 20s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    margin-bottom: 2rem;
  }
`;

const Title = styled.h1`
  font-size: 3.5rem;
  font-weight: 800;
  color: white;
  margin-bottom: 1rem;
  text-shadow: 0 4px 20px rgba(0,0,0,0.3);
  background: linear-gradient(45deg, #fff, #f0f8ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${fadeIn} 1s ease-out;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: rgba(255,255,255,0.9);
  margin: 0;
  font-weight: 500;
  animation: ${fadeIn} 1s ease-out 0.2s both;
`;

const SearchBar = styled.div`
  max-width: 600px;
  margin: 0 auto 2rem;
  position: relative;
  z-index: 2;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 25px;
  font-size: 1.1rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  transition: all 0.3s ease;

  @media (max-width: 480px) {
    padding: 0.8rem 1.2rem;
    font-size: 1rem;
    border-radius: 20px;
  }

  &:focus {
    outline: none;
    box-shadow: 0 15px 40px rgba(0,0,0,0.2);
    transform: translateY(-2px);
  }

  @media (max-width: 480px) {
    &:focus {
      transform: translateY(-1px);
    }
  }

  &::placeholder {
    color: #999;
  }
`;

const TeamsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 2rem;
  max-width: 1600px;
  margin: 0 auto;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 0 0.5rem;
  }

  @media (max-width: 480px) {
    gap: 0.8rem;
    padding: 0 0.25rem;
  }
`;

const TeamCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 25px;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  animation: ${fadeIn} 0.6s ease-out;

  @media (max-width: 768px) {
    padding: 1.5rem;
    border-radius: 20px;
  }

  @media (max-width: 480px) {
    padding: 1rem;
    border-radius: 15px;
  }

  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 30px 60px rgba(0,0,0,0.2);
    animation: ${pulse} 2s infinite;
  }

  @media (max-width: 768px) {
    &:hover {
      transform: translateY(-5px);
    }
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c);
    background-size: 300% 100%;
    animation: gradientShift 3s ease infinite;
  }

  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;

const TeamHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;

  @media (max-width: 480px) {
    flex-direction: column;
    text-align: center;
    gap: 0.8rem;
    margin-bottom: 1rem;
  }
`;

const TeamAvatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);

  @media (max-width: 480px) {
    width: 50px;
    height: 50px;
    font-size: 1.2rem;
  }
`;

const TeamInfo = styled.div`
  flex: 1;
`;

const TeamName = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media (max-width: 480px) {
    font-size: 1.3rem;
    margin: 0 0 0.3rem 0;
  }
`;

const TeamAbbreviation = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 15px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  white-space: nowrap;
  display: inline-block;
`;

const StatsSection = styled.div`
  margin-bottom: 1.5rem;

  @media (max-width: 480px) {
    margin-bottom: 1rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 0.8rem;
  }
`;

const StatCard = styled.div`
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 15px;
  padding: 1rem;
  text-align: center;
  border: 2px solid transparent;
  transition: all 0.3s ease;

  &:hover {
    border-color: #667eea;
    transform: translateY(-2px);
  }
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: #666;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
`;

const FormSection = styled.div`
  margin-bottom: 1.5rem;

  @media (max-width: 480px) {
    margin-bottom: 1rem;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;

  @media (max-width: 480px) {
    margin-bottom: 0.8rem;
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;

  @media (max-width: 480px) {
    font-size: 0.85rem;
    margin-bottom: 0.3rem;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  background: white;
  color: #333;
  transition: all 0.3s ease;

  @media (max-width: 480px) {
    padding: 0.7rem;
    font-size: 0.9rem;
    border-radius: 8px;
  }

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 0.8rem;
  }
`;

const Button = styled.button`
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;

  @media (max-width: 480px) {
    padding: 0.7rem 1.2rem;
    font-size: 0.9rem;
    border-radius: 8px;
    min-width: 100px;
  }

  &.save {
    background: linear-gradient(135deg, #28a745, #20c997);
    color: white;
    box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
    }
  }

  &.cancel {
    background: linear-gradient(135deg, #6c757d, #495057);
    color: white;
    box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(108, 117, 125, 0.4);
    }
  }

  &.edit {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }
`;

const LoadingCard = styled.div`
  background: rgba(255, 255, 255, 0.9);
  border-radius: 25px;
  padding: 2rem;
  text-align: center;
  color: #666;
  font-size: 1.1rem;
  animation: ${pulse} 2s infinite;
`;

const SuccessMessage = styled.div`
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  padding: 1rem;
  border-radius: 12px;
  text-align: center;
  font-weight: 600;
  margin-bottom: 1rem;
  animation: ${slideIn} 0.5s ease-out;
`;

const ErrorMessage = styled.div`
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
  padding: 1rem;
  border-radius: 12px;
  text-align: center;
  font-weight: 600;
  margin-bottom: 1rem;
  animation: ${slideIn} 0.5s ease-out;
`;

const AdminFairnessManagement = () => {
  const [teams, setTeams] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingTeam, setEditingTeam] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_ENDPOINTS}/api/users/points-table`);
      console.log("Teams data:", response.data);
      setTeams(response.data || []);
    } catch (error) {
      console.error("Error fetching teams:", error);
      setMessage({ type: 'error', text: 'Failed to fetch teams' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (team) => {
    setEditingTeam(team._id);
    setEditData({
      points: team.points || 0,
      matchesPlayed: team.matchesPlayed || 0,
      fairnessPoint: team.fairness || 0
    });
    setMessage({ type: '', text: '' });
  };

  const handleCancel = () => {
    setEditingTeam(null);
    setEditData({});
    setMessage({ type: '', text: '' });
  };

  const handleSave = async (teamId) => {
    try {
      setSaving(true);
      await axios.put(`${API_ENDPOINTS}/api/users/update-fairness/${teamId}`, {
        points: parseInt(editData.points) || 0,
        matchesPlayed: parseInt(editData.matchesPlayed) || 0,
        fairnessPoint: parseInt(editData.fairnessPoint) || 0
      });
      
      setMessage({ type: 'success', text: 'Team stats updated successfully!' });
      setEditingTeam(null);
      setEditData({});
      fetchTeams();
    } catch (error) {
      console.error("Error updating team:", error);
      setMessage({ type: 'error', text: 'Failed to update team stats' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const filteredTeams = teams.filter(team =>
    team.teamName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.abbreviation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (teamName) => {
    return teamName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Container>
        <Header>
          <Title>⚖️ Admin Fairness Management</Title>
          <Subtitle>Manage team points, matches played, and fairness points</Subtitle>
        </Header>
        <TeamsGrid>
          {[1, 2, 3, 4].map(i => (
            <LoadingCard key={i}>
              <div>Loading teams...</div>
            </LoadingCard>
          ))}
        </TeamsGrid>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>⚖️ Admin Fairness Management</Title>
        <Subtitle>Manage team points, matches played, and fairness points</Subtitle>
      </Header>

      <SearchBar>
        <SearchInput
          type="text"
          placeholder="Search teams by name or abbreviation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </SearchBar>

      <TeamsGrid>
        {filteredTeams.map((team, index) => (
          <TeamCard key={team._id} style={{ animationDelay: `${index * 0.1}s` }}>
            <TeamHeader>
              <TeamAvatar>
                {getInitials(team.teamName)}
              </TeamAvatar>
              <TeamInfo>
                <TeamName>{team.teamName}</TeamName>
                {team.abbreviation && (
                  <TeamAbbreviation>
                    {team.abbreviation}
                  </TeamAbbreviation>
                )}
              </TeamInfo>
            </TeamHeader>

            <StatsSection>
              <StatsGrid>
                <StatCard>
                  <StatLabel>Points</StatLabel>
                  <StatValue>{team.points || 0}</StatValue>
                </StatCard>
                <StatCard>
                  <StatLabel>Matches Played</StatLabel>
                  <StatValue>{team.matchesPlayed || 0}</StatValue>
                </StatCard>
                <StatCard>
                  <StatLabel>Fairness Points</StatLabel>
                  <StatValue>{team.fairness || 0}</StatValue>
                </StatCard>
              </StatsGrid>
            </StatsSection>

            {editingTeam === team._id ? (
              <FormSection>
                {message.text && (
                  message.type === 'success' ? (
                    <SuccessMessage>{message.text}</SuccessMessage>
                  ) : (
                    <ErrorMessage>{message.text}</ErrorMessage>
                  )
                )}

                <FormGroup>
                  <Label>Points</Label>
                  <Input
                    type="number"
                    value={editData.points}
                    onChange={(e) => handleInputChange('points', e.target.value)}
                    placeholder="Enter points"
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Matches Played</Label>
                  <Input
                    type="number"
                    value={editData.matchesPlayed}
                    onChange={(e) => handleInputChange('matchesPlayed', e.target.value)}
                    placeholder="Enter matches played"
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Fairness Points</Label>
                  <Input
                    type="number"
                    value={editData.fairnessPoint}
                    onChange={(e) => handleInputChange('fairnessPoint', e.target.value)}
                    placeholder="Enter fairness points"
                  />
                </FormGroup>

                <ButtonGroup>
                  <Button
                    className="save"
                    onClick={() => handleSave(team._id)}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    className="cancel"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </ButtonGroup>
              </FormSection>
            ) : (
              <FormSection>
                <ButtonGroup>
                  <Button
                    className="edit"
                    onClick={() => handleEdit(team)}
                  >
                    Edit Stats
                  </Button>
                </ButtonGroup>
              </FormSection>
            )}
          </TeamCard>
        ))}
      </TeamsGrid>
    </Container>
  );
};

export default AdminFairnessManagement;
