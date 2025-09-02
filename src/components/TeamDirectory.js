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

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    animation: ${float} 20s ease-in-out infinite;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.2) 0%, transparent 50%);
    animation: ${float} 25s ease-in-out infinite reverse;
  }

  @media (max-width: 768px) {
    padding: 0.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    
    &::before {
      animation: ${float} 15s ease-in-out infinite;
    }
    
    &::after {
      animation: ${float} 20s ease-in-out infinite reverse;
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
    padding: 0 1rem;
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
  position: relative;

  &::after {
    content: '✨';
    position: absolute;
    top: -10px;
    right: -20px;
    font-size: 1.5rem;
    animation: ${float} 2s ease-in-out infinite;
  }

  @media (max-width: 768px) {
    font-size: 2.2rem;
    margin-bottom: 0.5rem;
    
    &::after {
      font-size: 1.2rem;
      top: -5px;
      right: -15px;
    }
  }
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: rgba(255,255,255,0.9);
  margin: 0;
  font-weight: 500;
  animation: ${fadeIn} 1s ease-out 0.2s both;
`;

const TeamsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 0 0.5rem;
    max-width: 100%;
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

  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 30px 60px rgba(0,0,0,0.2);
    animation: ${pulse} 2s infinite;
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

  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
    animation: shimmer 4s infinite;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover::after {
    opacity: 1;
  }

  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
    100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
  }

  @media (max-width: 768px) {
    padding: 1.5rem;
    border-radius: 20px;
    margin: 0.5rem 0;
    
    &:hover {
      transform: translateY(-5px);
    }
  }

  @media (max-width: 480px) {
    padding: 1rem;
    border-radius: 15px;
    margin: 0.25rem 0;
  }
`;

const TeamHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;

  @media (max-width: 768px) {
    margin-bottom: 1rem;
    gap: 0.8rem;
  }

  @media (max-width: 480px) {
    margin-bottom: 0.8rem;
    gap: 0.6rem;
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
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(255,255,255,0.2), transparent);
    animation: shimmer 3s infinite;
  }

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 12px 30px rgba(102, 126, 234, 0.5);
  }

  @media (max-width: 768px) {
    width: 50px;
    height: 50px;
    font-size: 1.2rem;
  }

  @media (max-width: 480px) {
    width: 45px;
    height: 45px;
    font-size: 1rem;
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
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    font-size: 1.3rem;
    margin: 0 0 0.3rem 0;
  }

  @media (max-width: 480px) {
    font-size: 1.1rem;
    margin: 0 0 0.2rem 0;
  }
`;

const TeamTimezone = styled.p`
  font-size: 0.9rem;
  color: #666;
  margin: 0;
  font-weight: 500;
`;

const StreamSection = styled.div`
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 15px;
  color: white;
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
    animation: shimmer 3s infinite;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(240, 147, 251, 0.3);
  }

  @media (max-width: 768px) {
    margin-bottom: 1rem;
    padding: 0.8rem;
    border-radius: 12px;
  }

  @media (max-width: 480px) {
    margin-bottom: 0.8rem;
    padding: 0.6rem;
    border-radius: 10px;
  }
`;

const StreamTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const StreamLink = styled.a`
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  background: rgba(255,255,255,0.2);
  border-radius: 10px;
  display: inline-block;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255,255,255,0.3);
    transform: translateY(-2px);
  }
`;

const TimeSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    gap: 0.8rem;
    margin-bottom: 1rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 0.6rem;
    margin-bottom: 0.8rem;
  }
`;

const TimeCard = styled.div`
  background: ${props => props.isCurrent ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' : 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'};
  padding: 1rem;
  border-radius: 15px;
  color: white;
  text-align: center;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
    animation: shimmer 3s infinite;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.2);
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
    100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
  }

  @media (max-width: 768px) {
    padding: 0.8rem;
    border-radius: 12px;
  }

  @media (max-width: 480px) {
    padding: 0.6rem;
    border-radius: 10px;
  }
`;

const TimeLabel = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  opacity: 0.9;
`;

const TimeValue = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    font-size: 1rem;
  }

  @media (max-width: 480px) {
    font-size: 0.9rem;
  }
`;

const DifferenceCard = styled.div`
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  padding: 1rem;
  border-radius: 15px;
  text-align: center;
  color: #8b4513;
  font-weight: 600;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(255,255,255,0.2), transparent);
    animation: shimmer 4s infinite;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(252, 182, 159, 0.3);
  }

  @media (max-width: 768px) {
    padding: 0.8rem;
    border-radius: 12px;
  }

  @media (max-width: 480px) {
    padding: 0.6rem;
    border-radius: 10px;
  }
`;

const DifferenceLabel = styled.div`
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
  opacity: 0.8;
`;

const DifferenceValue = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
`;

const AbbreviationBadge = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(255,255,255,0.2), transparent);
    animation: shimmer 3s infinite;
  }

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  @media (max-width: 768px) {
    padding: 0.25rem 0.6rem;
    font-size: 0.7rem;
  }

  @media (max-width: 480px) {
    padding: 0.2rem 0.5rem;
    font-size: 0.65rem;
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

const TeamDirectory = () => {
  const [teams, setTeams] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userTimezone, setUserTimezone] = useState('Asia/Kolkata');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
    fetchUserTimezone();
    
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchUserTimezone = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (userData) {
        const response = await axios.get(`${API_ENDPOINTS}/api/users/${userData.id}/details`);
        if (response.data?.user?.timezone) {
          setUserTimezone(response.data.user.timezone);
        }
      }
    } catch (error) {
      console.error("Error fetching user timezone:", error);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS}/api/users/teams`);
      setTeams(response.data || []);
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTimeInTimezone = (timezone) => {
    return new Date().toLocaleString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeDifference = (teamTimezone) => {
    const now = new Date();
    const userTime = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
    const teamTime = new Date(now.toLocaleString('en-US', { timeZone: teamTimezone }));
    
    const diffMs = teamTime.getTime() - userTime.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    
    if (diffHours === 0) {
      return 'Same time';
    } else if (diffHours > 0) {
      return `+${diffHours}h ahead`;
    } else {
      return `${Math.abs(diffHours)}h behind`;
    }
  };

  const getTeamInitials = (teamName) => {
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
          <Title>🏏 Team Directory</Title>
          <Subtitle>Live time comparisons and team information</Subtitle>
        </Header>
        <TeamsGrid>
          {[1, 2, 3, 4].map(i => (
            <LoadingCard key={i}>
              <div>Loading team information...</div>
            </LoadingCard>
          ))}
        </TeamsGrid>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>🏏 Team Directory</Title>
        <Subtitle>Live time comparisons and team information</Subtitle>
      </Header>
      
      <TeamsGrid>
        {teams.map((team, index) => (
          <TeamCard key={team._id || index} style={{ animationDelay: `${index * 0.1}s` }}>
            <TeamHeader>
              <TeamAvatar>
                {getTeamInitials(team.teamName)}
              </TeamAvatar>
              <TeamInfo>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                  <TeamName>{team.teamName}</TeamName>
                  {team.abbreviation && (
                    <AbbreviationBadge>
                      {team.abbreviation}
                    </AbbreviationBadge>
                  )}
                </div>
                <TeamTimezone>📍 {team.timezone || 'Asia/Kolkata'}</TeamTimezone>
              </TeamInfo>
            </TeamHeader>

            {team.streamLink && (
              <StreamSection>
                <StreamTitle>
                  📺 Live Stream
                </StreamTitle>
                <StreamLink 
                  href={team.streamLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  🎬 Watch Now
                </StreamLink>
                <div style={{ 
                  fontSize: '0.7rem', 
                  opacity: 0.8, 
                  marginTop: '0.3rem',
                  wordBreak: 'break-all',
                  fontFamily: 'monospace'
                }}>
                  {team.streamLink}
                </div>
              </StreamSection>
            )}

            <TimeSection>
              <TimeCard isCurrent={true}>
                <TimeLabel>Your Time</TimeLabel>
                <TimeValue>{getCurrentTimeInTimezone(userTimezone)}</TimeValue>
              </TimeCard>
              
              <TimeCard isCurrent={false}>
                <TimeLabel>Their Time</TimeLabel>
                <TimeValue>{getCurrentTimeInTimezone(team.timezone || 'Asia/Kolkata')}</TimeValue>
              </TimeCard>
            </TimeSection>

            <DifferenceCard>
              <DifferenceLabel>Time Difference</DifferenceLabel>
              <DifferenceValue>
                {getTimeDifference(team.timezone || 'Asia/Kolkata')}
              </DifferenceValue>
            </DifferenceCard>
          </TeamCard>
        ))}
      </TeamsGrid>
    </Container>
  );
};

export default TeamDirectory;
