import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import styled from "styled-components";
import { useSocket } from "../contexts/SocketContext";
import { API_ENDPOINTS } from "../const";
import LoadingCube from "./CricketAnimation";
import NotificationBell from './NotificationBell';
import PlayerPopup from './PlayerPopup';

// Modern Styled Components - Fresh Design
const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #533483 100%);
  background-attachment: fixed;
  padding: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;
  overflow-x: hidden;
  
  @media (max-width: 768px) {
    padding: 0;
  }
`;

const Header = styled.div`
  position: relative;
  padding: 30px 20px;
  text-align: center;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 20px;
  overflow: hidden;
  
  @media (max-width: 768px) {
    padding: 20px 15px;
    margin-bottom: 15px;
  }
`;

const HeaderContent = styled.div`
  position: relative;
  z-index: 2;
`;

const WalletIcon = styled.div`
  font-size: 40px;
  color: #00d4ff;
  filter: drop-shadow(0 5px 10px rgba(0, 212, 255, 0.4));
  animation: float 4s ease-in-out infinite;
  margin-bottom: 10px;
  
  @media (max-width: 768px) {
    font-size: 30px;
    margin-bottom: 8px;
  }
`;

const PageTitle = styled.h1`
  font-size: 1.8rem;
  font-weight: 900;
  color: #fff;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  background: linear-gradient(45deg, #00d4ff, #ff6b9d, #c44569);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 1px;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
    margin-bottom: 6px;
    letter-spacing: 0.5px;
  }
`;

const PageSubtitle = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  font-weight: 400;
  letter-spacing: 0.3px;
  
  @media (max-width: 768px) {
    font-size: 0.8rem;
    letter-spacing: 0.2px;
  }
`;

const CardsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0 20px 20px;
  max-width: 1400px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    padding: 0 15px 15px;
  }
`;

const TeamSeparator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px 0;
  position: relative;
  
  @media (max-width: 768px) {
    margin: 15px 0;
  }
`;

const SeparatorLine = styled.div`
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, transparent, #00d4ff, #ff6b9d, #c44569, #ff6b9d, #00d4ff, transparent);
  position: relative;
  border-radius: 1px;
`;

const SeparatorText = styled.div`
  background: linear-gradient(135deg, #00d4ff 0%, #ff6b9d 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 25px;
  font-weight: 800;
  font-size: 12px;
  letter-spacing: 1px;
  text-transform: uppercase;
  box-shadow: 0 4px 15px rgba(0, 212, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 2;
  animation: separatorPulse 3s ease-in-out infinite;
  
  @media (max-width: 768px) {
    padding: 6px 12px;
    font-size: 10px;
    letter-spacing: 0.5px;
  }
`;

const UserCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 10px 20px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #00d4ff, #ff6b9d, #c44569, #00d4ff);
    background-size: 200% 200%;
    border-radius: 24px 24px 0 0;
    animation: shimmer 3s linear infinite;
  }
  
  &:hover {
    transform: translateY(-5px) scale(1.01);
    box-shadow: 
      0 15px 30px rgba(0, 0, 0, 0.3),
      0 0 0 1px rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  ${props => props.isCurrentUser && `
    background: rgba(255, 255, 255, 0.08);
    border: 2px solid rgba(0, 212, 255, 0.3);
    box-shadow: 
      0 15px 30px rgba(0, 0, 0, 0.25),
      0 0 0 1px rgba(0, 212, 255, 0.2);
    animation: currentUserGlow 4s ease-in-out infinite;
    
    &::before {
      height: 3px;
      background: linear-gradient(90deg, #00d4ff, #ff6b9d, #c44569, #00d4ff);
      animation: shimmer 2s linear infinite;
    }
  `}
  
  @media (max-width: 768px) {
    padding: 12px;
    border-radius: 12px;
    margin: 0 3px;
    
    &:hover {
      transform: translateY(-3px) scale(1.005);
    }
  }
`;

const UserCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
  padding: 12px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
  backdrop-filter: blur(15px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    gap: 8px;
    padding: 10px;
    margin-bottom: 12px;
  }
`;

const UserAvatar = styled.div`
  position: relative;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00d4ff, #ff6b9d, #c44569);
  background-size: 200% 200%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 5px 15px rgba(0, 212, 255, 0.4),
    0 0 0 2px rgba(255, 255, 255, 0.1),
    inset 0 0 0 1px rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  animation: avatarGlow 5s ease-in-out infinite;
  overflow: visible;
  
  @media (max-width: 768px) {
    width: 45px;
    height: 45px;
  }
`;

const UserInitial = styled.span`
  font-size: 1.4rem;
  font-weight: 900;
  color: #ffffff;
  text-shadow: 
    0 0 5px rgba(255, 255, 255, 0.8),
    0 0 10px rgba(255, 255, 255, 0.6),
    0 0 15px rgba(255, 255, 255, 0.4),
    0 1px 2px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.5px;
  animation: initialPulse 3s ease-in-out infinite;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const CurrentUserBadge = styled.div`
  position: absolute;
  top: -3px;
  right: -3px;
  background: linear-gradient(45deg, #ff6b9d, #c44569);
  color: #fff;
  font-size: 0.6rem;
  font-weight: 900;
  padding: 3px 6px;
  border-radius: 10px;
  box-shadow: 
    0 2px 8px rgba(255, 107, 157, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.3);
  animation: bounce 2s infinite;
  z-index: 10;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  @media (max-width: 768px) {
    font-size: 0.5rem;
    padding: 2px 4px;
    top: -2px;
    right: -2px;
  }
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled.h2`
  font-size: 1.3rem;
  font-weight: 900;
  color: #ffffff;
  margin: 0 0 6px 0;
  text-shadow: 
    0 0 5px rgba(0, 212, 255, 0.8),
    0 0 10px rgba(0, 212, 255, 0.6),
    0 0 15px rgba(0, 212, 255, 0.4),
    0 1px 3px rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
  position: relative;
  animation: nameGlow 4s ease-in-out infinite, nameFloat 5s ease-in-out infinite;
  text-transform: uppercase;
  font-family: 'Arial Black', sans-serif;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
    margin-bottom: 4px;
    letter-spacing: 0.5px;
    flex-direction: row;
    align-items: center;
    gap: 6px;
  }
`;

const UserStats = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    gap: 6px;
    justify-content: center;
  }
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.08);
  padding: 4px 8px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  min-width: 45px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  }
  
  @media (max-width: 768px) {
    padding: 3px 6px;
    min-width: 40px;
  }
`;

const StatNumber = styled.span`
  font-size: 1rem;
  font-weight: 900;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const StatLabel = styled.span`
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-top: 1px;
  font-weight: 600;
  
  @media (max-width: 768px) {
    font-size: 0.5rem;
  }
`;

const PurseContainer = styled.div`
  text-align: center;
  margin-bottom: 15px;
  
  @media (max-width: 768px) {
    margin-bottom: 12px;
  }
`;

const PurseCircle = styled.div`
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00d4ff 0%, #ff6b9d 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 8px 20px rgba(0, 212, 255, 0.4),
    0 0 0 2px rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  animation: pursePulse 4s ease-in-out infinite;
  
  ${props => props.isLow && `
    background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%);
    animation: lowPursePulse 2s ease-in-out infinite;
    box-shadow: 
      0 8px 20px rgba(255, 107, 157, 0.5),
      0 0 0 2px rgba(255, 255, 255, 0.1);
  `}
  
  ${props => props.isHigh && `
    background: linear-gradient(135deg, #00d4ff 0%, #00a8cc 100%);
    animation: highPursePulse 3s ease-in-out infinite;
    box-shadow: 
      0 8px 20px rgba(0, 212, 255, 0.6),
      0 0 0 2px rgba(255, 255, 255, 0.1);
  `}
  
  @media (max-width: 768px) {
    width: 70px;
    height: 70px;
    margin-bottom: 6px;
  }
`;

const PurseAmount = styled.span`
  font-size: 1.2rem;
  font-weight: 900;
  color: #fff;
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.3);
  line-height: 1;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const PurseUnit = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 1px;
  
  @media (max-width: 768px) {
    font-size: 0.6rem;
  }
`;

const PurseStatus = styled.div`
  font-size: 0.7rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  @media (max-width: 768px) {
    font-size: 0.6rem;
  }
`;

const PlayersSection = styled.div`
  margin-top: 12px;
  
  @media (max-width: 768px) {
    margin-top: 10px;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  
  @media (max-width: 768px) {
    margin-bottom: 10px;
    padding-bottom: 4px;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 800;
  color: #fff;
  margin: 0;
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.5px;
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const SectionCount = styled.div`
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 700;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  @media (max-width: 768px) {
    padding: 2px 6px;
    font-size: 0.6rem;
  }
`;

const PlayersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  margin-bottom: 8px;
  width: 100%;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 3px;
    margin-bottom: 6px;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 2px;
  }
`;

const PlayerCard = styled.div`
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(15px);
  border-radius: 4px;
  padding: 4px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  min-width: 0;
  
  &:hover {
    transform: translateY(-1px) scale(1.01);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  ${props => props.isBidding && `
    animation: biddingPulse 2.5s ease-in-out infinite;
    border: 2px solid rgba(255, 255, 255, 0.3);
  `}
  
  ${props => props.isCurrentUserBidding && `
    border: 2px solid rgba(0, 212, 255, 0.5);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  `}
  
  ${props => props.playerType === 'sapphire' && `
    background: linear-gradient(135deg, rgba(0, 100, 150, 0.4), rgba(0, 80, 120, 0.3));
    border: 2px solid rgba(0, 212, 255, 0.5);
    box-shadow: 0 8px 20px rgba(0, 100, 150, 0.4);
    
    &:hover {
      box-shadow: 0 15px 30px rgba(0, 100, 150, 0.5);
    }
  `}
  
  ${props => props.playerType === 'emerald' && `
    background: linear-gradient(135deg, rgba(0, 120, 60, 0.4), rgba(0, 100, 50, 0.3));
    border: 2px solid rgba(0, 255, 136, 0.5);
    box-shadow: 0 8px 20px rgba(0, 120, 60, 0.4);
    
    &:hover {
      box-shadow: 0 15px 30px rgba(0, 120, 60, 0.5);
    }
  `}
  
  ${props => props.playerType === 'gold' && `
    background: linear-gradient(135deg, rgba(180, 140, 0, 0.4), rgba(160, 120, 0, 0.3));
    border: 2px solid rgba(255, 215, 0, 0.5);
    box-shadow: 0 8px 20px rgba(180, 140, 0, 0.4);
    
    &:hover {
      box-shadow: 0 15px 30px rgba(180, 140, 0, 0.5);
    }
  `}
  
  ${props => props.playerType === 'silver' && `
    background: linear-gradient(135deg, rgba(120, 120, 120, 0.4), rgba(100, 100, 100, 0.3));
    border: 2px solid rgba(192, 192, 192, 0.5);
    box-shadow: 0 8px 20px rgba(120, 120, 120, 0.4);
    
    &:hover {
      box-shadow: 0 15px 30px rgba(120, 120, 120, 0.5);
    }
  `}
  
  @media (max-width: 768px) {
    padding: 2px;
    border-radius: 3px;
    
    &:hover {
      transform: translateY(-1px) scale(1.01);
    }
  }
`;

const PlayerName = styled.h3`
  font-size: 0.5rem;
  font-weight: 800;
  color: #fff;
  margin: 1px 0 2px 0;
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.3);
  line-height: 1.1;
  letter-spacing: 0.1px;
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 0.35rem;
    margin: 0px 0 1px 0;
  }
`;

const PlayerPriceCircle = styled.div`
  width: 25px;
  height: 25px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  
  @media (max-width: 768px) {
    width: 18px;
    height: 18px;
  }
`;

const PriceAmount = styled.span`
  font-size: 0.4rem;
  font-weight: 900;
  color: #fff;
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.3);
  line-height: 1;
  
  @media (max-width: 768px) {
    font-size: 0.25rem;
  }
`;

const PriceUnit = styled.span`
  font-size: 0.25rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 1px;
  
  @media (max-width: 768px) {
    font-size: 0.15rem;
  }
`;

const PlayerStatus = styled.div`
  font-size: 0.5rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-top: 6px;
  
  @media (max-width: 768px) {
    font-size: 0.4rem;
    margin-top: 4px;
  }
`;

const BiddingStatus = styled.div`
  position: absolute;
  top: 5px;
  left: 5px;
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(0, 0, 0, 0.8);
  padding: 3px 6px;
  border-radius: 8px;
  font-size: 0.5rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  
  ${props => props.isWinning && `
    background: linear-gradient(45deg, #00d4ff, #00a8cc);
    color: #fff;
    animation: winningGlow 2.5s ease-in-out infinite;
  `}
  
  ${props => props.isSecond && `
    background: linear-gradient(45deg, #ff6b9d, #c44569);
    color: #fff;
    animation: secondGlow 2.5s ease-in-out infinite;
  `}
  
  ${props => props.isLosing && `
    background: linear-gradient(45deg, #ff6b9d, #c44569);
    color: #fff;
    animation: losingGlow 2.5s ease-in-out infinite;
  `}
  
  @media (max-width: 768px) {
    top: 4px;
    left: 4px;
    padding: 2px 4px;
    font-size: 0.4rem;
  }
`;

const LastBidderSection = styled.div`
  margin-top: 4px;
  padding: 3px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  
  @media (max-width: 768px) {
    margin-top: 3px;
    padding: 2px;
  }
`;

const LastBidderInfo = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  
  @media (max-width: 768px) {
    gap: 1px;
  }
`;

const LastBidderName = styled.span`
  font-size: 0.5rem;
  font-weight: 800;
  color: #ffffff;
  text-align: center;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  max-width: 100%;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  
  @media (max-width: 768px) {
    font-size: 0.4rem;
  }
`;

const CompetitorArrow = styled.span`
  font-size: 0.6rem;
  font-weight: 900;
  margin-right: 3px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  
  ${props => props.isUp && `color: #00d4ff;`}
  ${props => props.isDown && `color: #ff6b9d;`}
  
  @media (max-width: 768px) {
    font-size: 0.5rem;
    margin-right: 2px;
  }
`;

const PlayerRole = styled.div`
  position: absolute;
  bottom: 10px;
  left: 10px;
  width: 25px;
  height: 25px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  z-index: 10;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4);
  }
  
  @media (max-width: 768px) {
    bottom: 8px;
    left: 8px;
    width: 22px;
    height: 22px;
  }
`;

const RoleIcon = styled.img`
  width: 18px;
  height: 18px;
  object-fit: contain;
  filter: brightness(1.2) contrast(1.1);
  
  @media (max-width: 768px) {
    width: 16px;
    height: 16px;
  }
`;

// Keyframe animations
const keyframes = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  
  @keyframes separatorPulse {
    0%, 100% { transform: scale(1); box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3); }
    50% { transform: scale(1.05); box-shadow: 0 12px 40px rgba(102, 126, 234, 0.5); }
  }
  
  @keyframes currentUserGlow {
    0%, 100% { box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15); }
    50% { box-shadow: 0 30px 60px rgba(79, 172, 254, 0.3); }
  }
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  @keyframes avatarGlow {
    0%, 100% { 
      box-shadow: 
        0 10px 40px rgba(102, 126, 234, 0.4),
        0 0 0 4px rgba(255, 255, 255, 0.1),
        inset 0 0 0 2px rgba(255, 255, 255, 0.2);
    }
    50% { 
      box-shadow: 
        0 15px 50px rgba(102, 126, 234, 0.6),
        0 0 0 6px rgba(255, 255, 255, 0.2),
        inset 0 0 0 2px rgba(255, 255, 255, 0.3);
    }
  }
  
  @keyframes initialPulse {
    0%, 100% { 
      transform: scale(1);
      text-shadow: 
        0 0 10px rgba(255, 255, 255, 0.8),
        0 0 20px rgba(255, 255, 255, 0.6),
        0 2px 4px rgba(0, 0, 0, 0.3);
    }
    50% { 
      transform: scale(1.05);
      text-shadow: 
        0 0 15px rgba(255, 255, 255, 1),
        0 0 30px rgba(255, 255, 255, 0.8),
        0 2px 4px rgba(0, 0, 0, 0.3);
    }
  }
  
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
    60% { transform: translateY(-5px); }
  }
  
  @keyframes nameGlow {
    0%, 100% { text-shadow: 0 0 10px rgba(102, 126, 234, 0.8), 0 0 20px rgba(102, 126, 234, 0.6), 0 0 30px rgba(102, 126, 234, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3); }
    50% { text-shadow: 0 0 15px rgba(102, 126, 234, 1), 0 0 25px rgba(102, 126, 234, 0.8), 0 0 35px rgba(102, 126, 234, 0.6), 0 4px 8px rgba(0, 0, 0, 0.3); }
  }
  
  @keyframes nameFloat {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    25% { transform: translateY(-3px) rotate(1deg); }
    75% { transform: translateY(3px) rotate(-1deg); }
  }
  
  @keyframes pursePulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  @keyframes lowPursePulse {
    0%, 100% { transform: scale(1); box-shadow: 0 15px 35px rgba(255, 107, 107, 0.4); }
    50% { transform: scale(1.1); box-shadow: 0 20px 40px rgba(255, 107, 107, 0.6); }
  }
  
  @keyframes highPursePulse {
    0%, 100% { transform: scale(1); box-shadow: 0 15px 35px rgba(76, 175, 80, 0.4); }
    50% { transform: scale(1.08); box-shadow: 0 20px 40px rgba(76, 175, 80, 0.6); }
  }
  
  @keyframes biddingPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.02); opacity: 0.9; }
  }
  
  @keyframes winningGlow {
    0%, 100% { box-shadow: 0 0 10px rgba(76, 175, 80, 0.5); }
    50% { box-shadow: 0 0 20px rgba(76, 175, 80, 0.8); }
  }
  
  @keyframes secondGlow {
    0%, 100% { box-shadow: 0 0 10px rgba(255, 152, 0, 0.5); }
    50% { box-shadow: 0 0 20px rgba(255, 152, 0, 0.8); }
  }
  
  @keyframes losingGlow {
    0%, 100% { box-shadow: 0 0 10px rgba(244, 67, 54, 0.5); }
    50% { box-shadow: 0 0 20px rgba(244, 67, 54, 0.8); }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .user-cards-container {
      padding: 0 15px 30px;
    }
    
    .user-card {
      padding: 20px;
    }
    
    .user-card-header {
      padding: 20px;
      gap: 20px;
    }
    
    .user-avatar {
      width: 70px;
      height: 70px;
    }
    
    .user-initial {
      font-size: 1.8rem;
    }
    
    .user-name {
      font-size: 1.6rem;
    }
    
    .user-stats {
      gap: 15px;
    }
    
    .stat-item {
      min-width: 50px;
      padding: 6px 12px;
    }
    
    .stat-number {
      font-size: 1.2rem;
    }
    
    .purse-circle {
      width: 120px;
      height: 120px;
    }
    
    .purse-amount {
      font-size: 1.5rem;
    }
    
    .players-grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 12px;
    }
    
    .player-card {
      padding: 15px;
    }
    
    .team-separator {
      margin: 30px 0;
    }
    
    .separator-text {
      padding: 10px 20px;
      font-size: 12px;
    }
  }
  
  @media (max-width: 480px) {
    .user-card-header {
      flex-direction: column;
      text-align: center;
      gap: 15px;
    }
    
    .players-grid {
      grid-template-columns: 1fr;
    }
    
    .purse-circle {
      width: 100px;
      height: 100px;
    }
    
    .purse-amount {
      font-size: 1.2rem;
    }
  }
`;

const UserPursePage = () => {
  const [usersData, setUsersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState(null);
  const [biddingStatuses, setBiddingStatuses] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [lastBidders, setLastBidders] = useState({});
  const [userBidPositions, setUserBidPositions] = useState({});
  const fetchInFlightRef = useRef(false);
  const pendingFetchRef = useRef(false);
  const competitorFetchRef = useRef(new Set());

  useEffect(() => {
    // Get current user from localStorage
    const user = JSON.parse(localStorage.getItem("user"));
    setCurrentUser(user);
    setIsAdmin(user?.isAdmin === true);
  }, []);

  const handlePlayerClick = useCallback((player) => {
    setSelectedPlayer(player);
  }, []);

  const handleClosePopup = useCallback(() => {
    setSelectedPlayer(null);
  }, []);

  const fetchUserData = useCallback(async () => {
    if (fetchInFlightRef.current) {
      pendingFetchRef.current = true;
      return;
    }
    fetchInFlightRef.current = true;
    try {
      setLoading(true);
      setLoadingProgress(0);
      const startTime = Date.now();
      
      // Smooth progress updates
      setLoadingProgress(20);
      const response = await fetch(`${API_ENDPOINTS}/api/users/purses`);
      setLoadingProgress(60);
      
      if (!response.ok) {
        throw new Error("Failed to fetch user purse data.");
      }
      const data = await response.json();
      setUsersData(data);
      setLoadingProgress(80);
      
      // 🚀 PERFORMANCE: Extract bidding statuses and competitor info efficiently from API response
      if (currentUser) {
        // Try to find user by ID, _id, or userName (robust lookup with string normalization)
        const uid = String(currentUser.id || currentUser._id || '');
        const uname = (currentUser.name || currentUser.userName || '').trim();
        const currentUserData = data.find(user => {
          const uId = String(user.id || user._id || '');
          const uName = (user.userName || user.name || '').trim();
          return (uid && uId && uid === uId) || (uname && uName && uname.toLowerCase() === uName.toLowerCase());
        });
        
        if (currentUserData) {
          // OPTIMIZATION: Use reduce for better performance
          const userStatuses = currentUserData.players.reduce((acc, player) => {
            if (player.isBidOn && player.biddingStatus) {
              acc[player.name] = {
                isHighest: player.biddingStatus.isHighest,
                isSecondHighest: player.biddingStatus.isSecondHighest,
                bidAmount: player.biddingPrice,
                playerName: player.name,
                position: player.biddingStatus.position,
                totalBidders: player.biddingStatus.totalBidders,
                bidderName: currentUserData.userName,
                isCurrentUser: true
              };
            }
            return acc;
          }, {});
          
          setBiddingStatuses(userStatuses);
          
          // 🚀 PERFORMANCE: Extract competitor info from API response (no separate API calls needed)
          const competitorMap = {};
          const positionMap = {};
          
          currentUserData.players.forEach(player => {
            if (player.isBidOn) {
              const pid = String(player.id || player._id || '');
              if (pid) {
                const comp = player.competitorName;
                if (comp != null && String(comp).trim() !== '') {
                  competitorMap[pid] = String(comp).trim();
                  positionMap[pid] = player.bidPosition ?? player.biddingStatus?.position ?? null;
                }
              }
            }
          });
          
          setLastBidders(competitorMap);
          setUserBidPositions(positionMap);
        }
      }
      
      setLoadingProgress(100);
      const loadTime = Date.now() - startTime;
      console.log(`⚡ UserPurse loaded in ${loadTime}ms`);
      
      // Small delay for smooth transition
      setTimeout(() => setLoading(false), 200);
    } catch (err) {
      setError(err.message || "Failed to fetch data.");
      setLoading(false);
    } finally {
      fetchInFlightRef.current = false;
      if (pendingFetchRef.current) {
        pendingFetchRef.current = false;
        fetchUserData();
      }
    }
  }, [currentUser]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Re-extract bidding statuses and competitor info when usersData or currentUser changes
  // (handles race when fetch completes before currentUser is set from localStorage)
  useEffect(() => {
    if (!currentUser || !usersData?.length) return;
    const uid = String(currentUser.id || currentUser._id || '');
    const uname = (currentUser.name || currentUser.userName || '').trim();
    const currentUserData = usersData.find(user => {
      const uId = String(user.id || user._id || '');
      const uName = (user.userName || user.name || '').trim();
      return (uid && uId && uid === uId) || (uname && uName && uname.toLowerCase() === uName.toLowerCase());
    });
    if (!currentUserData) return;
    const userStatuses = currentUserData.players.reduce((acc, player) => {
      if (player.isBidOn && player.biddingStatus) {
        acc[player.name] = {
          isHighest: player.biddingStatus.isHighest,
          isSecondHighest: player.biddingStatus.isSecondHighest,
          bidAmount: player.biddingPrice,
          playerName: player.name,
          position: player.biddingStatus.position,
          totalBidders: player.biddingStatus.totalBidders,
          bidderName: currentUserData.userName,
          isCurrentUser: true
        };
      }
      return acc;
    }, {});
    setBiddingStatuses(userStatuses);
    const competitorMap = {};
    const positionMap = {};
    currentUserData.players.forEach(player => {
      if (player.isBidOn) {
        const pid = String(player.id || player._id || '');
        if (pid) {
          const comp = player.competitorName;
          if (comp != null && String(comp).trim() !== '') {
            competitorMap[pid] = String(comp).trim();
            positionMap[pid] = player.bidPosition ?? player.biddingStatus?.position ?? null;
          }
        }
      }
    });
    setLastBidders(prev => ({ ...prev, ...competitorMap }));
    setUserBidPositions(prev => ({ ...prev, ...positionMap }));
  }, [currentUser, usersData]);

  // 🚀 REALTIME: Listen for real-time bid updates using shared socket
  const { on } = useSocket();
  
  useEffect(() => {
    if (!currentUser || !on) return;
    
    const cleanup1 = on('player_bid_update', (update) => {
      // Update bid values in real-time
      setUsersData(prevUsers => {
        const updatedUsers = prevUsers.map(user => {
          const updatedPlayers = user.players.map(player => {
            if (player.id === update.playerId || player._id === update.playerId) {
              return {
                ...player,
                biddingPrice: update.bidAmount || update.currentBid || player.biddingPrice,
                currentBidder: update.currentBidder || player.currentBidder
              };
            }
            return player;
          });
          
          return {
            ...user,
            players: updatedPlayers
          };
        });
        
        // Update competitor info if current user is involved
        const currentUserData = updatedUsers.find(user => 
          user.id === currentUser.id || 
          user._id === currentUser.id || 
          user.userName === currentUser.name
        );
        
        if (currentUserData) {
          const player = currentUserData.players.find(p => 
            p.id === update.playerId || p._id === update.playerId
          );
          
          if (player && player.isBidOn) {
            // Refresh competitor info by fetching updated data
            if (!competitorFetchRef.current.has(update.playerId)) {
              competitorFetchRef.current.add(update.playerId);
              fetch(`${API_ENDPOINTS}/api/player/${update.playerId}/bids`)
                .then(res => res.json())
                .then(data => {
                  const allBids = data.allBids || [];
                  if (allBids.length > 0) {
                    const sortedBids = allBids.sort((a, b) => b.bidAmount - a.bidAmount);
                    const currentUserId = currentUser?.id || currentUser?._id;
                    const userBidIndex = sortedBids.findIndex(bid => 
                      bid.bidder?.toString() === currentUserId?.toString() || 
                      bid.bidder?._id?.toString() === currentUserId?.toString()
                    );
                    
                    let competitorName = null;
                    if (userBidIndex === 0 && sortedBids.length > 1) {
                      competitorName = sortedBids[1].bidder?.name || sortedBids[1].bidderName || null;
                    } else if (userBidIndex === 1) {
                      competitorName = sortedBids[0].bidder?.name || sortedBids[0].bidderName || null;
                    } else if (userBidIndex > 1) {
                      competitorName = sortedBids[0].bidder?.name || sortedBids[0].bidderName || null;
                    }
                    
                    const pid = String(update.playerId || '');
                    if (pid) {
                      setLastBidders(prev => ({
                        ...prev,
                        [pid]: competitorName && competitorName.trim() ? competitorName : null
                      }));
                      setUserBidPositions(prev => ({
                        ...prev,
                        [pid]: userBidIndex >= 0 ? userBidIndex : null
                      }));
                    }
                  }
                })
                .catch(err => console.error('Failed to fetch competitor info:', err))
                .finally(() => {
                  competitorFetchRef.current.delete(update.playerId);
                });
            }
          }
        }
        
        return updatedUsers;
      });
    });
    
    const cleanup2 = on('player_sold_update', (update) => {
      setUsersData(prevUsers => {
        return prevUsers.map(user => {
          const updatedPlayers = user.players.map(player => {
            if (player.id === update.playerId || player._id === update.playerId) {
              return {
                ...player,
                status: 'Sold',
                isBidOn: false
              };
            }
            return player;
          });
          
          return {
            ...user,
            players: updatedPlayers
          };
        });
      });
    });
    
    return () => {
      cleanup1();
      cleanup2();
    };
  }, [currentUser, on]);

  // 🚀 PERFORMANCE: Removed N+1 query - competitor info now comes from main API response
  // No need for separate API calls per player


  // Get bidding status for a specific player
  const getBiddingStatus = (playerName) => {
    if (!biddingStatuses[playerName]) return null;
    const status = biddingStatuses[playerName];
    if (status.isHighest) return 'winning';
    if (status.isSecondHighest) return 'second';
    if (status.position > 2) return 'losing';
    return 'neutral';
  };

  // Get status display text and icon
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'winning':
        return { text: 'W', icon: '', className: 'winning-bid' };
      case 'second':
        return { text: 'L', icon: '', className: 'second-bid' };
      case 'losing':
        return { text: '', icon: '🔥', className: 'losing-bid' };
      case 'neutral':
        return { text: '', icon: '', className: '' };
      default:
        return { text: '', icon: '' };
    }
  };

  const getPlayerColor = (playerType) => {
    switch (playerType) {
      case "Sapphire":
        return "linear-gradient(135deg, #3a7bd5, #3a6073)";
      case "Gold":
        return "linear-gradient(135deg, #f7971e, #ffd200)";
      case "Emerald":
        return "linear-gradient(135deg, #56ab2f, #a8e063)";
      case "Silver":
        return "linear-gradient(135deg, #6c757d, #495057)";
      default:
        return "linear-gradient(135deg, #d3d3d3, #8c8c8c)";
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Batsman':
        return '/images/batsman copy.png';
      case 'Bowler':
        return '/images/bowl copy.png';
      case 'Allrounder':
        return '/images/allrounder copy.png';
      case 'WicketKeeper':
        return '/images/wicket copy.png';
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <PageContainer>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
          height: '100vh'
      }}>
        <LoadingCube animationFile="Purse.json" />
        <div style={{
          marginTop: '20px',
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          Loading Purse Data...
        </div>
        <div style={{
          width: '300px',
          height: '6px',
          backgroundColor: 'rgba(255,255,255,0.3)',
          borderRadius: '3px',
          marginTop: '20px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${loadingProgress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
            borderRadius: '3px',
            transition: 'width 0.3s ease-in-out'
          }} />
        </div>
        <div style={{
          marginTop: '10px',
          color: 'rgba(255,255,255,0.8)',
          fontSize: '14px'
        }}>
          {loadingProgress}%
        </div>
      </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#fff',
          fontSize: '1.2rem',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          margin: '20px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          {error}
        </div>
      </PageContainer>
    );
  }

  // Sort users to put current user first
  const sortedUsersData = [...usersData].sort((a, b) => {
    const aIsCurrentUser = a.id === currentUser?.id || a._id === currentUser?.id || a.userName === currentUser?.name;
    const bIsCurrentUser = b.id === currentUser?.id || b._id === currentUser?.id || b.userName === currentUser?.name;
    
    if (aIsCurrentUser && !bIsCurrentUser) return -1;
    if (!aIsCurrentUser && bIsCurrentUser) return 1;
    return 0;
  });

  return (
    <PageContainer>
      <style>{keyframes}</style>
       <NotificationBell />
      
      <Header>
        <HeaderContent>
          <WalletIcon>💰</WalletIcon>
          <PageTitle>Teams</PageTitle>
          <PageSubtitle>Track team performance, finances, and player investments</PageSubtitle>
        </HeaderContent>
      </Header>

      <CardsContainer>
        {sortedUsersData.map((user, index) => {
          const isCurrentUser = user.id === currentUser?.id || user._id === currentUser?.id || user.userName === currentUser?.name;
          const isFirstTeam = index === 0;
          const isLastTeam = index === sortedUsersData.length - 1;
          
          // Calculate player type breakdown
          const playerTypeCounts = user.players.reduce((acc, player) => {
            const type = player.type || 'Unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {});
          
          // Fix player filtering - check actual data structure
          console.log('User data for', user.userName, ':', {
            totalPlayers: user.players.length,
            players: user.players.map(p => ({
              name: p.name,
              isBidOn: p.isBidOn,
              status: p.status,
              type: p.type
            }))
          });
          
          const ownedPlayers = user.players.filter(p => !p.isBidOn);
          const biddingPlayers = user.players.filter(p => p.isBidOn);
          
          console.log('Filtered players:', {
            owned: ownedPlayers.length,
            bidding: biddingPlayers.length
          });
          
          return (
            <div key={index}>
              {/* Team Separator */}
              {!isFirstTeam && (
                <TeamSeparator>
                  <SeparatorLine />
                  <SeparatorText>VS</SeparatorText>
                  <SeparatorLine />
                </TeamSeparator>
              )}
              
              <UserCard isCurrentUser={isCurrentUser}>
                {/* User Card Header */}
                <UserCardHeader>
                  <UserAvatar>
                    <UserInitial>{user.userName.split(' ')[0].charAt(0).toUpperCase()}</UserInitial>
                    {isCurrentUser && <CurrentUserBadge>YOU</CurrentUserBadge>}
                  </UserAvatar>
                  <UserInfo>
                    <UserName>
                      {user.userName.split(' ')[0]}
                      {user.teamName && (
                        <span style={{
                          fontSize: '0.7rem',
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontWeight: '600',
                          textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                          letterSpacing: '0.3px',
                          whiteSpace: 'nowrap'
                        }}>
                          ({user.teamName})
                        </span>
                      )}
                    </UserName>
                    <UserStats>
                      <StatItem>
                        <StatNumber>{ownedPlayers.length}</StatNumber>
                        <StatLabel>Owned</StatLabel>
                      </StatItem>
                      <StatItem>
                        <StatNumber>{biddingPlayers.length}</StatNumber>
                        <StatLabel>Bidding</StatLabel>
                      </StatItem>
                      <StatItem>
                        <StatNumber>{user.players.length}</StatNumber>
                        <StatLabel>Total</StatLabel>
                      </StatItem>
                    </UserStats>
                  </UserInfo>
                </UserCardHeader>

                {/* Purse Value */}
                <PurseContainer>
                  <PurseCircle 
                    isLow={(user.purseValue / 10000000) < 5}
                    isHigh={(user.purseValue / 10000000) > 30}
                  >
                    <PurseAmount>₹{(user.purseValue / 10000000).toFixed(2)}</PurseAmount>
                    <PurseUnit>Cr</PurseUnit>
                  </PurseCircle>
                  <PurseStatus>
                {(user.purseValue / 10000000) < 5 ? 'Low Funds' : 
                 (user.purseValue / 10000000) > 30 ? 'Rich' : 'Good'}
                  </PurseStatus>
                </PurseContainer>

            {/* Trophy Display */}
            {(user.trophyCount > 0 || user.runnerUpCount > 0 || (user.worldCupCount > 0) || (user.worldCupRunnerUpCount > 0)) && (
              <div style={{ 
                marginBottom: '15px',
                padding: '12px',
                background: 'rgba(255, 215, 0, 0.1)',
                borderRadius: '10px',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                backdropFilter: 'blur(10px)'
              }}>
                <h3 style={{
                  fontSize: '0.9rem',
                  fontWeight: '800',
                  color: '#ffd700',
                  margin: '0 0 8px 0',
                  textShadow: '0 1px 5px rgba(0, 0, 0, 0.3)',
                  letterSpacing: '0.5px'
                }}>🏆 Achievements</h3>
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}>
                  {user.trophyCount > 0 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'rgba(255, 215, 0, 0.2)',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 215, 0, 0.4)'
                    }}>
                      <span style={{ fontSize: '1.2rem' }}>🏆</span>
                      <span style={{ 
                        fontSize: '0.9rem', 
                        fontWeight: '700', 
                        color: '#ffd700' 
                      }}>CPL: {user.trophyCount}</span>
                    </div>
                  )}
                  {user.worldCupCount > 0 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'rgba(255, 140, 0, 0.2)',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 140, 0, 0.4)',
                      position: 'relative'
                    }}>
                      <span style={{ fontSize: '1.2rem' }}>🌍</span>
                      <span style={{ 
                        fontSize: '0.9rem', 
                        fontWeight: '700', 
                        color: '#ff8c00' 
                      }}>World Cup: {user.worldCupCount}</span>
                    </div>
                  )}
                  {user.worldCupRunnerUpCount > 0 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'rgba(255, 140, 0, 0.15)',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 140, 0, 0.3)'
                    }}>
                      <span style={{ fontSize: '1.2rem' }}>🌍🥈</span>
                      <span style={{ 
                        fontSize: '0.9rem', 
                        fontWeight: '700', 
                        color: '#ff8c00' 
                      }}>WC Runner-up: {user.worldCupRunnerUpCount}</span>
                    </div>
                  )}
                  {user.runnerUpCount > 0 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'rgba(192, 192, 192, 0.2)',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(192, 192, 192, 0.4)'
                    }}>
                      <span style={{ fontSize: '1.2rem' }}>🥈</span>
                      <span style={{ 
                        fontSize: '0.9rem', 
                        fontWeight: '700', 
                        color: '#c0c0c0' 
                      }}>CPL Runner-up: {user.runnerUpCount}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Player Type Breakdown */}
            <div style={{ 
              marginBottom: '15px',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{
                fontSize: '0.9rem',
                fontWeight: '800',
                color: '#fff',
                margin: '0 0 8px 0',
                textShadow: '0 1px 5px rgba(0, 0, 0, 0.3)',
                letterSpacing: '0.5px'
              }}>Player Types</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                gap: '6px',
                '@media (max-width: 768px)': {
                  gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))',
                  gap: '4px'
                }
              }}>
                {Object.entries(playerTypeCounts).map(([type, count]) => {
                  const getTypeColor = (type) => {
                    switch(type.toLowerCase()) {
                      case 'sapphire': return '#00d4ff';
                      case 'emerald': return '#00ff88';
                      case 'gold': return '#ffd700';
                      case 'silver': return '#c0c0c0';
                      default: return '#ff6b9d';
                    }
                  };
                  
                  const getTypeGradient = (type) => {
                    switch(type.toLowerCase()) {
                      case 'sapphire': return 'linear-gradient(135deg, #00d4ff, #0099cc)';
                      case 'emerald': return 'linear-gradient(135deg, #00ff88, #00cc66)';
                      case 'gold': return 'linear-gradient(135deg, #ffd700, #ffb300)';
                      case 'silver': return 'linear-gradient(135deg, #c0c0c0, #999999)';
                      default: return 'linear-gradient(135deg, #ff6b9d, #c44569)';
                    }
                  };
                  
                  return (
                    <div key={type} style={{
                      background: getTypeGradient(type),
                      padding: window.innerWidth <= 768 ? '6px 8px' : '8px 10px',
                      borderRadius: '8px',
                      textAlign: 'center',
                      border: `1px solid ${getTypeColor(type)}40`,
                      boxShadow: `0 2px 8px ${getTypeColor(type)}30`,
                      transition: 'all 0.3s ease'
                    }}>
                      <div style={{
                        fontSize: window.innerWidth <= 768 ? '0.9rem' : '1rem',
                        fontWeight: '900',
                        color: '#fff',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                        marginBottom: '2px'
                      }}>{count}</div>
                      <div style={{
                        fontSize: window.innerWidth <= 768 ? '0.5rem' : '0.6rem',
                        fontWeight: '700',
                        color: '#fff',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                      }}>{type}</div>
                  </div>
                  );
                })}
              </div>
            </div>

            {/* Players Section */}
                <PlayersSection>
                  <SectionHeader>
                    <SectionTitle>Owned Players</SectionTitle>
                    <SectionCount>{user.players.filter(p => !p.isBidOn).length}</SectionCount>
                  </SectionHeader>
                  <PlayersGrid>
              {user.players
                .filter((player) => !player.isBidOn)
                  .sort((a, b) => {
                    // Normalize type to handle any casing issues
                    const typeA = (a.type || '').toString().trim();
                    const typeB = (b.type || '').toString().trim();
                    
                    const typeOrder = { 
                      'Sapphire': 0, 'sapphire': 0, 'SAPPHIRE': 0,
                      'Emerald': 1, 'emerald': 1, 'EMERALD': 1,
                      'Gold': 2, 'gold': 2, 'GOLD': 2,
                      'Silver': 3, 'silver': 3, 'SILVER': 3
                    };
                    
                    const orderA = typeOrder[typeA] !== undefined ? typeOrder[typeA] : 4;
                    const orderB = typeOrder[typeB] !== undefined ? typeOrder[typeB] : 4;
                    
                    return orderA - orderB;
                  })
                  .map((player, idx) => (
                  <PlayerCard
                    key={idx}
                    playerType={player.type?.toLowerCase()}
                      onClick={() => handlePlayerClick(player)}
                  >
                    <PlayerName>{player.name}</PlayerName>
                    <PlayerPriceCircle>
                      <PriceAmount>₹{(player.boughtValue / 10000000).toFixed(2)}</PriceAmount>
                      <PriceUnit>Cr</PriceUnit>
                    </PlayerPriceCircle>
                  </PlayerCard>
                ))}
                  </PlayersGrid>

              {user.players.some((player) => player.isBidOn) && (
                    <>
                      <SectionHeader>
                        <SectionTitle>Bidding Players</SectionTitle>
                        <SectionCount>{user.players.filter(p => p.isBidOn).length}</SectionCount>
                      </SectionHeader>
                      <PlayersGrid>
              {user.players
                .filter((player) => player.isBidOn)
                .map((player, idx) => {
                  const isCurrentUser = user.id === currentUser?.id || user._id === currentUser?.id || user.userName === currentUser?.name;
                  
                  let status = null;
                  let displayInfo = { text: '', icon: '', className: '' };
                  
                  if (isCurrentUser) {
                    status = getBiddingStatus(player.name);
                    displayInfo = getStatusDisplay(status);
                  }
                  
                  return (
                              <PlayerCard
                      key={idx}
                                playerType={player.type?.toLowerCase()}
                                isBidding={true}
                                isCurrentUserBidding={isCurrentUser}
                        onClick={() => handlePlayerClick(player)}
                    >
                                <PlayerName>{player.name}</PlayerName>
                                <PlayerPriceCircle>
                                  <PriceAmount>₹{(player.biddingPrice / 10000000).toFixed(2)}</PriceAmount>
                                  <PriceUnit>Cr</PriceUnit>
                                </PlayerPriceCircle>
                                
                      {isCurrentUser && (displayInfo.text || displayInfo.icon) && (
                                  <BiddingStatus 
                                    isWinning={status === 'winning'}
                                    isSecond={status === 'second'}
                                    isLosing={status === 'losing'}
                                  >
                            {displayInfo.icon && <span className="status-icon">{displayInfo.icon}</span>}
                            {displayInfo.text && <span className="status-text">{displayInfo.text}</span>}
                                  </BiddingStatus>
                      )}
                      
                      {isCurrentUser && (
                                  <LastBidderSection>
                          {(() => {
                            const pid = String(player.id || player._id || '');
                            const competitor = pid ? lastBidders[pid] : null;
                            const pos = pid ? userBidPositions[pid] : null;
                            const totalBidders = biddingStatuses[player.name]?.totalBidders ?? 0;
                            if (competitor) {
                              return (
                                      <LastBidderInfo>
                                        <CompetitorArrow 
                                          isUp={pos !== 0}
                                          isDown={pos === 0}
                                        >
                                {pos === 0 ? '↓' : '↑'}
                                        </CompetitorArrow>
                                        <LastBidderName>
                                {competitor}
                                        </LastBidderName>
                                      </LastBidderInfo>
                              );
                            }
                            return (
                                      <LastBidderInfo style={{ 
                                        opacity: 0.6,
                                        fontStyle: 'italic',
                                        fontSize: '0.45rem',
                                        color: 'rgba(255, 255, 255, 0.7)'
                                      }}>
                                        {totalBidders <= 1 ? (
                                          <>Waiting for counter bid...</>
                                        ) : (
                                          <>
                                            <span style={{ 
                                              display: 'inline-block',
                                              width: '8px',
                                              height: '8px',
                                              border: '2px solid rgba(255, 255, 255, 0.5)',
                                              borderTop: '2px solid transparent',
                                              borderRadius: '50%',
                                              animation: 'spin 1s linear infinite',
                                              marginRight: '4px'
                                            }}></span>
                                            Loading...
                                          </>
                                        )}
                                      </LastBidderInfo>
                            );
                          })()}
                                  </LastBidderSection>
                      )}
                              </PlayerCard>
                  );
                })}
                      </PlayersGrid>
                    </>
                  )}
                </PlayersSection>
              </UserCard>
            </div>
        );
        })}
      </CardsContainer>

      {/* Player Popup */}
      {selectedPlayer && (
        <PlayerPopup
          player={selectedPlayer}
          onClose={handleClosePopup}
          isAdmin={isAdmin}
        />
      )}
    </PageContainer>
  );
};

export default UserPursePage;
