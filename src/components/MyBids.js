import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import styled from "styled-components";
import { API_ENDPOINTS } from "../const";
import { useSocket } from "../contexts/SocketContext";
import NotificationBell from "./NotificationBell";
import LoadingCube from "./CricketAnimation";
import PlayerPopup from "./PlayerPopup";

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #533483 100%);
  background-attachment: fixed;
  padding: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;
  overflow-x: hidden;
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

const PlayersSection = styled.div`
  margin-top: 12px;
`;

const TimingSection = styled.div`
  margin: 10px 0 14px;
  padding: 10px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(88, 28, 135, 0.35), rgba(30, 64, 175, 0.25));
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.25);
`;

const TimingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const TimingCard = styled.div`
  background: linear-gradient(160deg, rgba(15, 23, 42, 0.75), rgba(30, 41, 59, 0.55));
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  padding: 12px 12px;
  color: #fff;
  position: relative;
  overflow: hidden;
`;

const TimingTitle = styled.div`
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 6px;
`;

const TimingValue = styled.div`
  font-size: 1.05rem;
  font-weight: 900;
  color: #38bdf8;
  text-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
`;

const TimingHint = styled.div`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.65);
  margin-top: 6px;
  line-height: 1.2;
`;

const TimingBadge = styled.span`
  display: inline-block;
  margin-top: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.3px;
  background: rgba(239, 68, 68, 0.18);
  color: #fecaca;
  border: 1px solid rgba(239, 68, 68, 0.35);
`;

const SummaryRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  margin: 8px 0 12px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 3px;
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 2px;
  }
`;

const SummaryLabel = styled.div`
  font-size: 0.5rem;
  font-weight: 800;
  color: #fff;
  margin: 1px 0 2px 0;
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.1px;
  text-align: center;
`;

const PurseList = styled.div`
  display: grid;
  gap: 6px;
`;

const PurseRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 8px 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 0.85rem;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 800;
  color: #fff;
  margin: 0;
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.5px;
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

  ${({ playerType }) => playerType === 'sapphire' && `
    background: linear-gradient(135deg, rgba(0, 100, 150, 0.4), rgba(0, 80, 120, 0.3));
    border: 2px solid rgba(0, 212, 255, 0.5);
  `}

  ${({ playerType }) => playerType === 'emerald' && `
    background: linear-gradient(135deg, rgba(0, 120, 60, 0.4), rgba(0, 100, 50, 0.3));
    border: 2px solid rgba(0, 255, 136, 0.5);
  `}

  ${({ playerType }) => playerType === 'gold' && `
    background: linear-gradient(135deg, rgba(180, 140, 0, 0.4), rgba(160, 120, 0, 0.3));
    border: 2px solid rgba(255, 215, 0, 0.5);
  `}

  ${({ playerType }) => playerType === 'silver' && `
    background: linear-gradient(135deg, rgba(120, 120, 120, 0.4), rgba(100, 100, 100, 0.3));
    border: 2px solid rgba(192, 192, 192, 0.5);
  `}

  ${({ variant }) => variant === 'my-purse' && `
    background: linear-gradient(135deg, rgba(88, 28, 135, 0.45), rgba(37, 99, 235, 0.35));
    border: 2px solid rgba(147, 197, 253, 0.6);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.35);
  `}

  ${({ variant }) => variant === 'active-bids' && `
    background: linear-gradient(135deg, rgba(20, 83, 45, 0.45), rgba(16, 185, 129, 0.25));
    border: 2px solid rgba(34, 197, 94, 0.6);
  `}

  ${({ variant }) => variant === 'purse-low' && `
    background: linear-gradient(135deg, rgba(153, 27, 27, 0.5), rgba(239, 68, 68, 0.25));
    border: 2px solid rgba(248, 113, 113, 0.7);
  `}

  ${({ variant }) => variant === 'purse-mid' && `
    background: linear-gradient(135deg, rgba(120, 53, 15, 0.5), rgba(250, 204, 21, 0.25));
    border: 2px solid rgba(253, 224, 71, 0.7);
  `}

  ${({ variant }) => variant === 'purse-high' && `
    background: linear-gradient(135deg, rgba(20, 83, 45, 0.5), rgba(34, 197, 94, 0.25));
    border: 2px solid rgba(74, 222, 128, 0.7);
  `}

  ${({ variant }) => variant === 'bid-winning' && `
    background: linear-gradient(135deg, rgba(5, 150, 105, 0.45), rgba(16, 185, 129, 0.2));
    border: 2px solid rgba(16, 185, 129, 0.75);
  `}

  ${({ variant }) => variant === 'bid-losing' && `
    background: linear-gradient(135deg, rgba(185, 28, 28, 0.45), rgba(239, 68, 68, 0.2));
    border: 2px solid rgba(239, 68, 68, 0.75);
  `}
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
`;

const PriceAmount = styled.span`
  font-size: 0.4rem;
  font-weight: 900;
  color: #fff;
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.3);
  line-height: 1;
`;

const PriceUnit = styled.span`
  font-size: 0.25rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 1px;
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

  ${({ isWinning }) => isWinning && `
    background: linear-gradient(45deg, #00d4ff, #00a8cc);
    color: #fff;
    animation: winningGlow 2.5s ease-in-out infinite;
  `}

  ${({ isLosing }) => isLosing && `
    background: linear-gradient(45deg, #ff6b9d, #c44569);
    color: #fff;
    animation: losingGlow 2.5s ease-in-out infinite;
  `}
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 30;
`;

const ModalCard = styled.div`
  width: min(720px, 95vw);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 16px;
  color: #fff;
  position: relative;
`;

const ModalTitle = styled.h3`
  margin: 0 0 10px 0;
  font-size: 1.1rem;
  font-weight: 800;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  cursor: pointer;
`;

const ModalGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const keyframes = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  @keyframes winningGlow {
    0%, 100% { box-shadow: 0 0 10px rgba(76, 175, 80, 0.5); }
    50% { box-shadow: 0 0 20px rgba(76, 175, 80, 0.8); }
  }
  @keyframes losingGlow {
    0%, 100% { box-shadow: 0 0 10px rgba(244, 67, 54, 0.5); }
    50% { box-shadow: 0 0 20px rgba(244, 67, 54, 0.8); }
  }
`;

const formatAmount = (value) => {
  const amount = Number(value || 0);
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `${(amount / 100000).toFixed(2)} Lakh`;
  return `${amount}`;
};

const formatCountdown = (ms) => {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

const MyBids = () => {
  const [user, setUser] = useState(null);
  const [myBids, setMyBids] = useState([]);
  const [allPurses, setAllPurses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [now, setNow] = useState(new Date());
  const [cronSettings, setCronSettings] = useState({
    cronSingleBidEnabled: true,
    cronSingleBidFinalizerEnabled: true,
    cronBulkExitEnabled: true,
  });
  const { on } = useSocket();
  const fetchInFlightRef = useRef(false);
  const pendingFetchRef = useRef(false);
  const settingsCacheRef = useRef({ ts: 0, value: null });
  const SETTINGS_TTL_MS = 60 * 1000;

  const fetchData = useCallback(async () => {
    if (fetchInFlightRef.current) {
      pendingFetchRef.current = true;
      return;
    }
    fetchInFlightRef.current = true;
    try {
      const cachedUser = JSON.parse(localStorage.getItem("user"));
      if (!cachedUser?.id) return;
      setUser(cachedUser);

      const nowTs = Date.now();
      const shouldFetchSettings = !settingsCacheRef.current.value || (nowTs - settingsCacheRef.current.ts) > SETTINGS_TTL_MS;
      const [bidsRes, pursesRes, settingsRes] = await Promise.all([
        fetch(`${API_ENDPOINTS}/api/users/${cachedUser.id}/bids`),
        fetch(`${API_ENDPOINTS}/api/users/purses`),
        shouldFetchSettings ? fetch(`${API_ENDPOINTS}/api/settings`) : Promise.resolve(null)
      ]);

      if (!bidsRes.ok || !pursesRes.ok) {
        throw new Error("Failed to load bids data.");
      }

      const bidsJson = await bidsRes.json();
      const pursesJson = await pursesRes.json();
      if (shouldFetchSettings && settingsRes && settingsRes.ok) {
        const settingsJson = await settingsRes.json();
        const newSettings = {
          cronSingleBidEnabled: settingsJson.cronSingleBidEnabled !== false,
          cronSingleBidFinalizerEnabled: settingsJson.cronSingleBidFinalizerEnabled !== false,
          cronBulkExitEnabled: settingsJson.cronBulkExitEnabled !== false,
        };
        settingsCacheRef.current = { ts: nowTs, value: newSettings };
        setCronSettings(newSettings);
      } else if (settingsCacheRef.current.value) {
        setCronSettings(settingsCacheRef.current.value);
      }
      setMyBids(bidsJson?.bids || []);
      const purseList = Array.isArray(pursesJson) ? pursesJson : pursesJson?.users || pursesJson?.data || [];
      setAllPurses(purseList);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load bids data.");
    } finally {
      setLoading(false);
      fetchInFlightRef.current = false;
      if (pendingFetchRef.current) {
        pendingFetchRef.current = false;
        fetchData();
      }
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!on) return;
    const cleanup1 = on("player_bid_update", fetchData);
    const cleanup2 = on("player_sold_update", fetchData);
    const cleanup3 = on("bid_exit_notification", fetchData);
    return () => {
      cleanup1();
      cleanup2();
      cleanup3();
    };
  }, [on, fetchData]);

  const runningBids = useMemo(
    () => myBids.filter((b) => b.status === "Winning" || b.status === "Losing"),
    [myBids]
  );

  const uniqueRunningBids = useMemo(() => {
    const byPlayer = new Map();
    runningBids.forEach((bid) => {
      const key = String(bid.playerId || "");
      const prev = byPlayer.get(key);
      if (!prev || Number(bid.bidAmount || 0) > Number(prev.bidAmount || 0)) {
        byPlayer.set(key, bid);
      }
    });
    return Array.from(byPlayer.values());
  }, [runningBids]);

  const myPurse = useMemo(() => {
    const entry = allPurses.find((p) => String(p._id || p.id) === String(user?.id));
    return entry?.purseValue || 0;
  }, [allPurses, user]);

  const getPurseVariant = (purseValue) => {
    const cr = Number(purseValue || 0) / 10000000;
    if (cr < 5) return "purse-low";
    if (cr > 15) return "purse-high";
    return "purse-mid";
  };

  const getBidStatus = (player) => {
    const status = player?.biddingStatus;
    if (status?.isHighest) return "winning";
    if (status?.isSecondHighest) return "losing";
    if (typeof status?.position === "number") {
      return status.position === 1 ? "winning" : "losing";
    }
    return "losing";
  };

  const timingInfo = useMemo(() => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(now);
    const bag = {};
    parts.forEach((p) => {
      if (p.type !== "literal") bag[p.type] = p.value;
    });

    const year = Number(bag.year);
    const month = Number(bag.month);
    const day = Number(bag.day);

    const buildIstDate = (h, m, s = 0, addDays = 0) =>
      new Date(`${year}-${String(month).padStart(2, "0")}-${String(day + addDays).padStart(2, "0")}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}+05:30`);

    const nowIst = new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${bag.hour}:${bag.minute}:${bag.second}+05:30`);

    const windows = [
      {
        key: "bulk",
        title: "Second Bidder Cleanup",
        range: "6:00–10:00 PM",
        start: buildIstDate(18, 0),
        end: buildIstDate(22, 0),
        interval: 10,
        action: "Removes second-highest (no selling).",
        enabled: cronSettings.cronBulkExitEnabled,
      },
      {
        key: "pause1",
        title: "System Pause",
        range: "10:00–10:30 PM",
        start: buildIstDate(22, 0),
        end: buildIstDate(22, 30),
        interval: null,
        action: "No auto exits.",
        enabled: true,
      },
      {
        key: "exitOnly",
        title: "Exit-Only Window",
        range: "10:30–11:00 PM",
        start: buildIstDate(22, 30),
        end: buildIstDate(23, 0),
        interval: 5,
        action: "Removes second-highest only.",
        enabled: cronSettings.cronSingleBidEnabled,
      },
      {
        key: "pause2",
        title: "System Pause",
        range: "11:00–11:30 PM",
        start: buildIstDate(23, 0),
        end: buildIstDate(23, 30),
        interval: null,
        action: "No auto exits.",
        enabled: true,
      },
      {
        key: "sellAfterExit5",
        title: "Sell-After-Exit (5-min)",
        range: "11:30 PM–12:30 AM",
        start: buildIstDate(23, 30),
        end: buildIstDate(0, 30, 0, 1),
        interval: 5,
        action: "Exit if counter bid; sell if no new bid after exit.",
        enabled: cronSettings.cronSingleBidEnabled,
      },
      {
        key: "sellAfterExit2",
        title: "Sell-After-Exit (2-min)",
        range: "12:30–2:00 AM",
        start: buildIstDate(0, 30, 0, 1),
        end: buildIstDate(2, 0, 0, 1),
        interval: 2,
        action: "Faster sell-after-exit checks.",
        enabled: cronSettings.cronSingleBidEnabled,
      },
    ];

    const singleBidFinalizer = buildIstDate(22, 30);
    const nextSingleBidFinalizer =
      nowIst <= singleBidFinalizer
        ? singleBidFinalizer
        : buildIstDate(22, 30, 0, 1);

    const currentWindow = windows.find((w) => nowIst >= w.start && nowIst < w.end);
    const nextWindow = windows.find((w) => nowIst < w.start) || windows[0];

    const getNextTick = (window) => {
      if (!window?.interval) return null;
      if (nowIst < window.start) return window.start;
      const intervalMs = window.interval * 60 * 1000;
      const elapsed = nowIst.getTime() - window.start.getTime();
      const ticks = Math.ceil(elapsed / intervalMs);
      const next = new Date(window.start.getTime() + ticks * intervalMs);
      return next < window.end ? next : null;
    };

    const nextTick = getNextTick(currentWindow);

    return {
      nowIst,
      currentWindow,
      nextWindow,
      nextTick,
      nextSingleBidFinalizer,
      nextWindowStart: nextWindow?.start || null,
    };
  }, [now, cronSettings]);

  if (loading) {
    return <LoadingCube />;
  }

  if (error) {
    return <div style={{ color: "#f87171" }}>{error}</div>;
  }

  return (
    <PageContainer>
      <style>{keyframes}</style>
      <NotificationBell />
      <Header>
        <HeaderContent>
          <WalletIcon>💰</WalletIcon>
          <PageTitle>My Active Bids</PageTitle>
          <PageSubtitle>Realtime view of your active bids</PageSubtitle>
        </HeaderContent>
      </Header>

      <CardsContainer>
        <PlayersSection>
          <SectionHeader>
            <SectionTitle>Counter Bid Timing</SectionTitle>
            <SectionCount>IST</SectionCount>
          </SectionHeader>
          <TimingSection>
            <TimingGrid>
              <TimingCard>
                <TimingTitle>Single-Bid Finalizer</TimingTitle>
                <TimingValue>{formatCountdown(timingInfo.nextSingleBidFinalizer - timingInfo.nowIst)}</TimingValue>
                <TimingHint>Next run at 10:30 PM IST</TimingHint>
                {!cronSettings.cronSingleBidFinalizerEnabled && (
                  <TimingBadge>OFF BY ADMIN</TimingBadge>
                )}
              </TimingCard>
              <TimingCard>
                <TimingTitle>Current Phase</TimingTitle>
                <TimingValue>{timingInfo.currentWindow ? timingInfo.currentWindow.title : "Outside Window"}</TimingValue>
                <TimingHint>{timingInfo.currentWindow ? `${timingInfo.currentWindow.range} • ${timingInfo.currentWindow.action}` : "Waiting for next window"}</TimingHint>
                {timingInfo.currentWindow && timingInfo.currentWindow.enabled === false && (
                  <TimingBadge>OFF BY ADMIN</TimingBadge>
                )}
              </TimingCard>
              <TimingCard>
                <TimingTitle>Next Auto Action</TimingTitle>
                <TimingValue>{timingInfo.nextTick ? formatCountdown(timingInfo.nextTick - timingInfo.nowIst) : "—"}</TimingValue>
                <TimingHint>{timingInfo.nextTick ? "Next scheduled exit/sell check" : "No auto action in this phase"}</TimingHint>
                {timingInfo.currentWindow && timingInfo.currentWindow.enabled === false && (
                  <TimingBadge>OFF BY ADMIN</TimingBadge>
                )}
              </TimingCard>
              <TimingCard>
                <TimingTitle>Next Phase</TimingTitle>
                <TimingValue>{timingInfo.nextWindow ? timingInfo.nextWindow.title : "—"}</TimingValue>
                <TimingHint>{timingInfo.nextWindowStart ? `Starts in ${formatCountdown(timingInfo.nextWindowStart - timingInfo.nowIst)}` : "—"}</TimingHint>
                {timingInfo.nextWindow && timingInfo.nextWindow.enabled === false && (
                  <TimingBadge>OFF BY ADMIN</TimingBadge>
                )}
              </TimingCard>
            </TimingGrid>
          </TimingSection>
          <SectionHeader>
            <SectionTitle>Winning Bids</SectionTitle>
            <SectionCount>{uniqueRunningBids.filter((b) => b.status === "Winning").length}</SectionCount>
          </SectionHeader>
          <PlayersGrid>
            {uniqueRunningBids.filter((b) => b.status === "Winning").map((bid) => (
              <PlayerCard
                key={`${bid.playerId}-${bid.status}-${bid.bidAmount}`}
                playerType={bid.playerType?.toLowerCase()}
                variant="bid-winning"
                onClick={() => setSelectedPlayer({ id: bid.playerId })}
              >
                <PlayerName>{bid.playerName}</PlayerName>
                <PlayerPriceCircle>
                  <PriceAmount>₹{(Number(bid.bidAmount || 0) / 10000000).toFixed(2)}</PriceAmount>
                  <PriceUnit>Cr</PriceUnit>
                </PlayerPriceCircle>
                <BiddingStatus isWinning={true} isLosing={false}>W</BiddingStatus>
              </PlayerCard>
            ))}
          </PlayersGrid>
        </PlayersSection>

        <PlayersSection>
          <SectionHeader>
            <SectionTitle>Losing Bids</SectionTitle>
            <SectionCount>{uniqueRunningBids.filter((b) => b.status === "Losing").length}</SectionCount>
          </SectionHeader>
          <PlayersGrid>
            {uniqueRunningBids.filter((b) => b.status === "Losing").map((bid) => (
              <PlayerCard
                key={`${bid.playerId}-${bid.status}-${bid.bidAmount}`}
                playerType={bid.playerType?.toLowerCase()}
                variant="bid-losing"
                onClick={() => setSelectedPlayer({ id: bid.playerId })}
              >
                <PlayerName>{bid.playerName}</PlayerName>
                <PlayerPriceCircle>
                  <PriceAmount>₹{(Number(bid.bidAmount || 0) / 10000000).toFixed(2)}</PriceAmount>
                  <PriceUnit>Cr</PriceUnit>
                </PlayerPriceCircle>
                <BiddingStatus isWinning={false} isLosing={true}>L</BiddingStatus>
              </PlayerCard>
            ))}
          </PlayersGrid>
        </PlayersSection>

        <SummaryRow>
          <PlayerCard variant={getPurseVariant(myPurse)}>
            <SummaryLabel>My Purse</SummaryLabel>
            <PlayerPriceCircle>
              <PriceAmount>₹{(Number(myPurse || 0) / 10000000).toFixed(2)}</PriceAmount>
              <PriceUnit>Cr</PriceUnit>
            </PlayerPriceCircle>
          </PlayerCard>
          <PlayerCard variant="active-bids">
            <SummaryLabel>Active Bids</SummaryLabel>
            <PlayerPriceCircle>
              <PriceAmount>{runningBids.length}</PriceAmount>
              <PriceUnit>LIVE</PriceUnit>
            </PlayerPriceCircle>
          </PlayerCard>
        </SummaryRow>

        <PlayersSection>
          <SectionHeader>
            <SectionTitle>All Team Purses</SectionTitle>
            <SectionCount>{allPurses.length}</SectionCount>
          </SectionHeader>
          <PlayersGrid>
            {allPurses.map((p) => (
              <PlayerCard
                key={p._id || p.id}
                variant={getPurseVariant(p.purseValue)}
                onClick={() => setSelectedUser(p)}
              >
                <PlayerName>{p.teamName || p.userName || p.name}</PlayerName>
                <PlayerPriceCircle>
                  <PriceAmount>₹{(Number(p.purseValue || 0) / 10000000).toFixed(2)}</PriceAmount>
                  <PriceUnit>Cr</PriceUnit>
                </PlayerPriceCircle>
              </PlayerCard>
            ))}
          </PlayersGrid>
        </PlayersSection>
      </CardsContainer>
      {selectedPlayer && (
        <PlayerPopup
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
      {selectedUser && (
        <ModalOverlay onClick={() => setSelectedUser(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={() => setSelectedUser(null)}>×</CloseButton>
            <ModalTitle>
              {selectedUser.teamName || selectedUser.userName || selectedUser.name} - Active Bids
            </ModalTitle>
            <ModalGrid>
              {(selectedUser.players || [])
                .filter((player) => player.isBidOn)
                .map((player) => {
                  const status = getBidStatus(player);
                  return (
                    <PlayerCard
                      key={player.id || player._id || player.name}
                      playerType={player.type?.toLowerCase()}
                    >
                      <PlayerName>{player.name}</PlayerName>
                      <PlayerPriceCircle>
                        <PriceAmount>₹{(Number(player.biddingPrice || 0) / 10000000).toFixed(2)}</PriceAmount>
                        <PriceUnit>Cr</PriceUnit>
                      </PlayerPriceCircle>
                      <BiddingStatus isWinning={status === "winning"} isLosing={status === "losing"}>
                        {status === "winning" ? "W" : "L"}
                      </BiddingStatus>
                    </PlayerCard>
                  );
                })}
            </ModalGrid>
          </ModalCard>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default MyBids;
