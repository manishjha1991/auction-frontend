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

const H2HSection = styled.section`
  margin-top: 2.5rem;
  animation: ${fadeIn} 0.8s ease forwards;
  max-width: 680px;
  margin-left: auto;
  margin-right: auto;
`;

const H2HTitle = styled.h2`
  margin: 0 0 1.25rem;
  font-size: 1.25rem;
  font-weight: 600;
  text-align: center;
`;

const TeamSelectRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    gap: 0.4rem;
  }
`;

const TeamSelectBox = styled.div`
  flex: 1;
  min-width: 0;
  max-width: 160px;
  padding: 0.65rem 0.85rem;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.25);
  background: ${(p) => (p.$accent === 'gold' ? 'linear-gradient(135deg, rgba(234,179,8,0.25), rgba(202,138,4,0.2))' : p.$accent === 'red' ? 'linear-gradient(135deg, rgba(239,68,68,0.25), rgba(185,28,28,0.2))' : 'rgba(255,255,255,0.08)')};
  color: #f8fafc;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  position: relative;

  @media (max-width: 480px) {
    max-width: 140px;
    padding: 0.55rem 0.7rem;
    font-size: 0.85rem;
  }
`;

const TeamSelect = styled.select`
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
`;

const VsBall = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(145deg, #dc2626, #991b1b);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 0.75rem;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(220,38,38,0.4);

  @media (max-width: 480px) {
    width: 38px;
    height: 38px;
    font-size: 0.7rem;
  }
`;

const MatchesCard = styled.div`
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 14px;
  padding: 0.6rem 1rem;
  text-align: center;
  margin-bottom: 1.25rem;
`;

const MatchesLabel = styled.div`
  font-size: 0.75rem;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MatchesValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #f87171;
`;

const StatBarSection = styled.div`
  margin-bottom: 1rem;
`;

const StatBarLabel = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.4rem;
  text-align: center;
`;

const StatBarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatBarNum = styled.div`
  min-width: 36px;
  text-align: center;
  font-weight: 700;
  font-size: 1.1rem;
`;

const StatBarTrack = styled.div`
  flex: 1;
  height: 10px;
  background: rgba(255,255,255,0.15);
  border-radius: 999px;
  overflow: hidden;
  display: flex;
`;

const StatBarFill = styled.div`
  height: 100%;
  background: ${(p) => (p.$green ? 'linear-gradient(90deg, #22c55e, #16a34a)' : 'linear-gradient(90deg, #ef4444, #dc2626)')};
  border-radius: 999px;
  transition: width 0.3s ease;
  min-width: ${(p) => (p.$pct > 0 && p.$pct < 100 ? '4px' : '0')};
`;

const ScorecardSection = styled.div`
  margin-top: 1.5rem;
`;

const ScorecardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const ScorecardTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  opacity: 0.9;
`;

const ScrollArrows = styled.div`
  display: flex;
  gap: 0.35rem;
`;

const ArrowBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.25);
  background: rgba(255,255,255,0.08);
  color: #f8fafc;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: rgba(59,130,246,0.3);
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const ScorecardScroll = styled.div`
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  padding-bottom: 0.5rem;

  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(255,255,255,0.05);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.2);
    border-radius: 3px;
  }
`;

const ScorecardTrack = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 0.25rem 0;
  min-width: min-content;
`;

const MatchCard = styled.div`
  flex: 0 0 min(280px, 85vw);
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 14px;
  padding: 1rem;
  min-height: 140px;

  @media (max-width: 480px) {
    flex: 0 0 min(260px, 88vw);
    padding: 0.85rem;
    min-height: 130px;
  }
`;

const MatchCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
`;

const MatchCardTeam = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.35rem;
  font-size: 0.9rem;
`;

const MatchCardTeamName = styled.span`
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const MatchCardScore = styled.span`
  font-weight: 600;
  color: #60a5fa;
  margin-left: auto;
`;

const MatchCardResult = styled.div`
  margin-top: 0.6rem;
  padding-top: 0.6rem;
  border-top: 1px solid rgba(255,255,255,0.1);
  font-size: 0.85rem;
  color: #4ade80;
  font-weight: 600;
`;

const EmptyState = styled.p`
  text-align: center;
  opacity: 0.7;
  margin: 0;
  padding: 1rem;
`;

const TeamDirectory = () => {
  const [teams, setTeams] = useState([]);
  const [headToHead, setHeadToHead] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedTeam1, setSelectedTeam1] = useState('');
  const [selectedTeam2, setSelectedTeam2] = useState('');
  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const scorecardRef = React.useRef(null);
  const [userTimezone, setUserTimezone] = useState('Asia/Kolkata');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const trophyImage = `${process.env.PUBLIC_URL}/images/Trophy.png`;

  useEffect(() => {
    fetchTeams();
    fetchHeadToHead();
    fetchUserTimezone();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!selectedTeam1 || !selectedTeam2 || selectedTeam1 === selectedTeam2) {
      setMatches([]);
      return;
    }
    const fetchMatches = async () => {
      setMatchesLoading(true);
      try {
        const res = await axios.get(
          `${API_ENDPOINTS}/api/head-to-head/matches/${selectedTeam1}/${selectedTeam2}`
        );
        setMatches(res.data?.matches || []);
      } catch (err) {
        console.error('Matches fetch:', err);
        setMatches([]);
      } finally {
        setMatchesLoading(false);
      }
    };
    fetchMatches();
  }, [selectedTeam1, selectedTeam2]);

  const fetchHeadToHead = async () => {
    try {
      const res = await axios.get(`${API_ENDPOINTS}/api/head-to-head`);
      setHeadToHead(res.data?.records || []);
    } catch (err) {
      console.error('Head-to-head fetch:', err);
    }
  };

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

  const h2hRecord = useMemo(() => {
    if (!selectedTeam1 || !selectedTeam2 || selectedTeam1 === selectedTeam2) return null;
    const s1 = String(selectedTeam1);
    const s2 = String(selectedTeam2);
    return headToHead.find(
      (r) =>
        (String(r.team1UserId) === s1 && String(r.team2UserId) === s2) ||
        (String(r.team1UserId) === s2 && String(r.team2UserId) === s1)
    );
  }, [headToHead, selectedTeam1, selectedTeam2]);

  const scrollScorecard = (dir) => {
    const el = scorecardRef.current;
    if (!el) return;
    const step = Math.min(280, el.offsetWidth * 0.9);
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  const getOrdinal = (n) => {
    const v = n % 100;
    if (v >= 11 && v <= 13) return `${n}th`;
    const s = ['th', 'st', 'nd', 'rd'];
    return `${n}${s[v % 10] || 'th'}`;
  };

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

      <H2HSection>
        <H2HTitle>Head to Head</H2HTitle>

        <TeamSelectRow>
          <TeamSelectBox $accent="gold">
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ringTeams.find((t) => String(t._id) === String(selectedTeam1))?.teamName || 'Select team 1'}
            </span>
            <span style={{ opacity: 0.7, marginLeft: 4 }}>▾</span>
            <TeamSelect value={selectedTeam1} onChange={(e) => setSelectedTeam1(e.target.value)}>
              <option value="">Select team 1</option>
              {ringTeams.map((t) => (
                <option key={t._id} value={t._id}>{t.teamName}</option>
              ))}
            </TeamSelect>
          </TeamSelectBox>
          <VsBall>VS</VsBall>
          <TeamSelectBox $accent="red">
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ringTeams.find((t) => String(t._id) === String(selectedTeam2))?.teamName || 'Select team 2'}
            </span>
            <span style={{ opacity: 0.7, marginLeft: 4 }}>▾</span>
            <TeamSelect value={selectedTeam2} onChange={(e) => setSelectedTeam2(e.target.value)}>
              <option value="">Select team 2</option>
              {ringTeams.map((t) => (
                <option key={t._id} value={t._id}>{t.teamName}</option>
              ))}
            </TeamSelect>
          </TeamSelectBox>
        </TeamSelectRow>

        {selectedTeam1 && selectedTeam2 && selectedTeam1 !== selectedTeam2 && (
          <>
            <MatchesCard>
              <MatchesLabel>Matches</MatchesLabel>
              <MatchesValue>{matches.length}</MatchesValue>
            </MatchesCard>

            {!matchesLoading && matches.length > 0 && (() => {
              const t1Name = ringTeams.find((t) => String(t._id) === String(selectedTeam1))?.teamName || '';
              const t2Name = ringTeams.find((t) => String(t._id) === String(selectedTeam2))?.teamName || '';
              const w1 = matches.filter((m) => m.winner === t1Name).length;
              const w2 = matches.filter((m) => m.winner === t2Name).length;
              const total = w1 + w2 || 1;
              const w1Pct = total ? (w1 / total) * 100 : 50;
              const w2Pct = total ? (w2 / total) * 100 : 50;
              const l1 = w2;
              const l2 = w1;
              const l1Pct = total ? (l1 / total) * 100 : 50;
              const l2Pct = total ? (l2 / total) * 100 : 50;
              return (
                <>
                  <StatBarSection>
                    <StatBarLabel>Won</StatBarLabel>
                    <StatBarRow>
                      <StatBarNum>{w1}</StatBarNum>
                      <StatBarTrack>
                        <StatBarFill $green $pct={w1Pct} style={{ width: `${w1Pct}%` }} />
                      </StatBarTrack>
                      <StatBarNum>{w2}</StatBarNum>
                    </StatBarRow>
                  </StatBarSection>
                  <StatBarSection>
                    <StatBarLabel>Lost</StatBarLabel>
                    <StatBarRow>
                      <StatBarNum>{l1}</StatBarNum>
                      <StatBarTrack>
                        <StatBarFill $pct={l1Pct} style={{ width: `${l1Pct}%` }} />
                      </StatBarTrack>
                      <StatBarNum>{l2}</StatBarNum>
                    </StatBarRow>
                  </StatBarSection>
                </>
              );
            })()}

            <ScorecardSection>
              <ScorecardHeader>
                <ScorecardTitle>Scorecard</ScorecardTitle>
                {matches.length > 1 && (
                  <ScrollArrows>
                    <ArrowBtn type="button" onClick={() => scrollScorecard(-1)} aria-label="Scroll left">
                      ‹
                    </ArrowBtn>
                    <ArrowBtn type="button" onClick={() => scrollScorecard(1)} aria-label="Scroll right">
                      ›
                    </ArrowBtn>
                  </ScrollArrows>
                )}
              </ScorecardHeader>
              {matchesLoading ? (
                <EmptyState>Loading matches…</EmptyState>
              ) : matches.length === 0 ? (
                <EmptyState>No match details yet. Results from fixtures and match results will appear here.</EmptyState>
              ) : (
                <ScorecardScroll ref={scorecardRef}>
                  <ScorecardTrack>
                    {matches.map((m, i) => (
                      <MatchCard key={i}>
                        <MatchCardHeader>
                          <span>{getOrdinal(i + 1)} Match</span>
                          <span>{m.date ? new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                        </MatchCardHeader>
                        <MatchCardTeam>
                          <MatchCardTeamName>{m.team1}</MatchCardTeamName>
                          <MatchCardScore>{m.team1Score}</MatchCardScore>
                        </MatchCardTeam>
                        <MatchCardTeam>
                          <MatchCardTeamName>{m.team2}</MatchCardTeamName>
                          <MatchCardScore>{m.team2Score}</MatchCardScore>
                        </MatchCardTeam>
                        <MatchCardResult>
                          {m.winner} won{m.margin ? ` by ${m.margin}` : ''}
                        </MatchCardResult>
                      </MatchCard>
                    ))}
                  </ScorecardTrack>
                </ScorecardScroll>
              )}
            </ScorecardSection>
          </>
        )}

        {(!selectedTeam1 || !selectedTeam2 || selectedTeam1 === selectedTeam2) && (
          <EmptyState>Select two different teams to see head-to-head record and scorecard.</EmptyState>
        )}
      </H2HSection>
    </Container>
  );
};

export default TeamDirectory;

