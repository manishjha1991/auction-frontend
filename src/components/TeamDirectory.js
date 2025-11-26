import React, { useEffect, useMemo, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import axios from 'axios';
import { API_ENDPOINTS } from '../const';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59,130,246,0.35); }
  70% { transform: scale(1.02); box-shadow: 0 0 0 25px rgba(59,130,246,0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59,130,246,0); }
`;

const Container = styled.div`
  min-height: 100vh;
  background: radial-gradient(circle at top, #0f172a 0%, #020617 55%, #000);
  color: #f8fafc;
  padding: 2rem;
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.header`
  text-align: center;
  max-width: 640px;
  margin: 0 auto 2.5rem;
  animation: ${fadeIn} 0.8s ease forwards;
`;

const Title = styled.h1`
  margin: 0 0 0.5rem;
  font-size: clamp(2rem, 5vw, 3.5rem);
  letter-spacing: 1px;
`;

const Subtitle = styled.p`
  margin: 0;
  opacity: 0.85;
  font-size: 1rem;
`;

const CircleWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  z-index: 2;
`;

const Ring = styled.div`
  position: relative;
  width: clamp(220px, 70vw, 360px);
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(26, 37, 72, 0.95), rgba(9, 13, 30, 0.95));
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 55px rgba(0, 0, 0, 0.45);
  padding: clamp(1rem, 4vw, 2rem);
`;

const RingItem = styled.button`
  position: absolute;
  transform: translate(-50%, -50%);
  border: none;
  border-radius: 999px;
  padding: clamp(0.3rem, 1vw, 0.5rem) clamp(0.5rem, 2vw, 0.8rem);
  background: rgba(255, 255, 255, 0.08);
  color: #f8fafc;
  font-weight: 600;
  font-size: clamp(0.7rem, 2.2vw, 0.9rem);
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;

  &:hover {
    background: rgba(59, 130, 246, 0.3);
    transform: translate(-50%, -50%) scale(1.05);
  }
`;

const TrophyColumn = styled.div`
  position: absolute;
  inset: clamp(1.8rem, 8vw, 3rem);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TrophyImage = styled.img`
  width: clamp(70px, 20vw, 120px);
  height: clamp(70px, 20vw, 120px);
  border-radius: 50%;
  object-fit: cover;
  filter: drop-shadow(0 15px 25px rgba(0,0,0,0.45));
  animation: ${pulse} 3.2s ease-in-out infinite;
`;

const Loader = styled.div`
  padding: 5rem 1rem;
  text-align: center;
  opacity: 0.75;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 20;
`;

const ModalCard = styled.div`
  width: min(520px, 95vw);
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 14px;
  right: 14px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: rgba(0,0,0,0.6);
  color: white;
  cursor: pointer;
  font-size: 1.1rem;
`;

const DetailCard = styled.div`
  background: rgba(255,255,255,0.95);
  color: #0f172a;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 25px 45px rgba(0,0,0,0.35);
`;

const DetailHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const DetailAvatar = styled.div`
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: linear-gradient(140deg, #1d4ed8, #0ea5e9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
`;

const DetailSection = styled.div`
  margin-top: 1rem;
  line-height: 1.4;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
`;

const StatCard = styled.div`
  border-radius: 16px;
  padding: 1rem;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  text-align: center;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  opacity: 0.85;
  margin-bottom: 0.4rem;
`;

const StatValue = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
`;

const StreamLink = styled.a`
  color: #1d4ed8;
  font-weight: 600;
`;

const TeamDirectory = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [userTimezone, setUserTimezone] = useState('Asia/Kolkata');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const trophyImage = `${process.env.PUBLIC_URL}/images/Trophy.png`;

  useEffect(() => {
    fetchTeams();
    fetchUserTimezone();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_ENDPOINTS}/api/users/teams`);
      const data = Array.isArray(response.data) ? response.data : response.data?.teams || [];
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTimezone = async () => {
    try {
      const cached = JSON.parse(localStorage.getItem('user') || '{}');
      const id = cached.id || cached._id;
      if (!id) return;
      const res = await axios.get(`${API_ENDPOINTS}/api/users/${id}/details`);
      if (res.data?.user?.timezone) setUserTimezone(res.data.user.timezone);
    } catch (err) {
      console.error('Error fetching timezone:', err);
    }
  };

  const ringTeams = useMemo(
    () => [...teams].sort((a, b) => (a.teamName || '').localeCompare(b.teamName || '')),
    [teams]
  );

  const timeIn = (tz) =>
    new Date().toLocaleString('en-US', {
      timeZone: tz || 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

  const diffLabel = (tz) => {
    const now = new Date();
    const user = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
    const team = new Date(now.toLocaleString('en-US', { timeZone: tz || 'Asia/Kolkata' }));
    const diff = Math.round((team - user) / (1000 * 60 * 60));
    if (diff === 0) return 'Same time';
    return diff > 0 ? `+${diff}h ahead` : `${Math.abs(diff)}h behind`;
  };

  if (loading) {
    return (
      <Container>
        <Header>
          <Title>🌐 CPL Team Grid</Title>
          <Subtitle>Syncing live squads...</Subtitle>
        </Header>
        <Loader>Fetching franchise data…</Loader>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>🌐 CPL Team Grid</Title>
        <Subtitle>Tap a franchise to open its command card</Subtitle>
      </Header>

      <CircleWrapper>
        <Ring>
          <TrophyColumn>
            <TrophyImage src={trophyImage} alt="CPL Trophy" />
          </TrophyColumn>

          {ringTeams.length === 0 ? (
            <RingItem style={{ left: '50%', top: '50%' }}>No teams</RingItem>
          ) : (
            ringTeams.map((team, index) => {
              const angle = (index / ringTeams.length) * 2 * Math.PI - Math.PI / 2;
              const radius = ringTeams.length > 10 ? 45 : 40;
              const left = `calc(50% + ${Math.cos(angle) * radius}%)`;
              const top = `calc(50% + ${Math.sin(angle) * radius}%)`;
              return (
                <RingItem
                  key={team._id || team.teamName}
                  style={{ left, top }}
                  onClick={() => setSelectedTeam(team)}
                >
                  {team.teamName}
                </RingItem>
              );
            })
          )}
        </Ring>
      </CircleWrapper>

      {selectedTeam && (
        <ModalOverlay onClick={() => setSelectedTeam(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={() => setSelectedTeam(null)}>×</CloseButton>
            <DetailCard>
              <DetailHeader>
                <DetailAvatar>{selectedTeam.teamName?.slice(0, 2)}</DetailAvatar>
                <div>
                  <h2 style={{ margin: 0 }}>{selectedTeam.teamName}</h2>
                  <small>{selectedTeam.timezone || 'Asia/Kolkata'}</small>
                </div>
              </DetailHeader>

              {selectedTeam.streamLink && (
                <DetailSection>
                  🔴 Stream:{' '}
                  <StreamLink href={selectedTeam.streamLink} target="_blank" rel="noreferrer">
                    {selectedTeam.streamLink}
                  </StreamLink>
                </DetailSection>
              )}

              <StatGrid>
                <StatCard>
                  <StatLabel>Your Time</StatLabel>
                  <StatValue>{timeIn(userTimezone)}</StatValue>
                </StatCard>
                <StatCard>
                  <StatLabel>{selectedTeam.teamName}</StatLabel>
                  <StatValue>{timeIn(selectedTeam.timezone)}</StatValue>
                </StatCard>
                <StatCard>
                  <StatLabel>Difference</StatLabel>
                  <StatValue>{diffLabel(selectedTeam.timezone)}</StatValue>
                </StatCard>
              </StatGrid>
            </DetailCard>
          </ModalCard>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default TeamDirectory;

