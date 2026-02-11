import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "../contexts/SocketContext";
import "../css/PlayerPopup.css";
import { FaClock } from "react-icons/fa";
import { API_ENDPOINTS } from "../const";

const getPopupTypeStyles = (type) => {
  const baseStyles = {
    background: "linear-gradient(135deg, rgba(18, 31, 45, 0.95), rgba(10, 15, 25, 0.9))",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    boxShadow: "0 25px 50px rgba(0, 0, 0, 0.45)",
  };

  switch ((type || "").toLowerCase()) {
    case "sapphire":
      return {
        ...baseStyles,
        background: "linear-gradient(135deg, rgba(0, 100, 150, 0.75), rgba(0, 80, 120, 0.6))",
        border: "2px solid rgba(0, 212, 255, 0.45)",
        boxShadow: "0 30px 55px rgba(0, 100, 150, 0.55)",
      };
    case "emerald":
      return {
        ...baseStyles,
        background: "linear-gradient(135deg, rgba(0, 120, 60, 0.75), rgba(0, 100, 50, 0.6))",
        border: "2px solid rgba(0, 255, 136, 0.45)",
        boxShadow: "0 30px 55px rgba(0, 120, 60, 0.55)",
      };
    case "gold":
      return {
        ...baseStyles,
        background: "linear-gradient(135deg, rgba(180, 140, 0, 0.75), rgba(160, 120, 0, 0.6))",
        border: "2px solid rgba(255, 215, 0, 0.45)",
        boxShadow: "0 30px 55px rgba(180, 140, 0, 0.55)",
      };
    case "silver":
      return {
        ...baseStyles,
        background: "linear-gradient(135deg, rgba(120, 120, 120, 0.75), rgba(100, 100, 100, 0.6))",
        border: "2px solid rgba(192, 192, 192, 0.35)",
        boxShadow: "0 30px 55px rgba(120, 120, 120, 0.5)",
      };
    default:
      return baseStyles;
  }
};

const PlayerPopup = ({ player, onClose, onDeactivated, onBidPlaced, onBidExited }) => {
  const [playerDetails, setPlayerDetails] = useState(null);
  const [topTwoBids, setTopTwoBids] = useState([]);
  const [allBids, setAllBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [placingBid, setPlacingBid] = useState(false);
  const [bidError, setBidError] = useState(null);
  const [bidAlert, setBidAlert] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [cronSettings, setCronSettings] = useState({
    cronSingleBidEnabled: true,
    cronBulkExitEnabled: true,
  });
  const [now, setNow] = useState(new Date());
  const fetchInFlightRef = useRef(false);
  const pendingFetchRef = useRef(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setIsAdmin(user?.isAdmin === true);
    setCurrentUserId(user?.id || user?._id || null);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_ENDPOINTS}/api/settings`);
        if (!res.ok) return;
        const data = await res.json();
        setCronSettings({
          cronSingleBidEnabled: data.cronSingleBidEnabled !== false,
          cronBulkExitEnabled: data.cronBulkExitEnabled !== false,
        });
      } catch (err) {
        console.error("Failed to load cron settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const fetchPlayerData = useCallback(async (showLoading = true) => {
    if (fetchInFlightRef.current) {
      pendingFetchRef.current = true;
      return;
    }
    fetchInFlightRef.current = true;
    try {
      if (showLoading) setLoading(true);
      const response = await fetch(`${API_ENDPOINTS}/api/player/${player.id}/bids`, {
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setPlayerDetails(data.player);
      setTopTwoBids(data.topTwoBids);
      setAllBids(data.allBids);
    } catch (err) {
      console.error("Failed to fetch player details:", err);
      if (showLoading) {
        setError("Failed to load player details. Please try again later.");
      }
    } finally {
      if (showLoading) setLoading(false);
      fetchInFlightRef.current = false;
      if (pendingFetchRef.current) {
        pendingFetchRef.current = false;
        fetchPlayerData(false);
      }
    }
  }, [player.id]);

  useEffect(() => {
    fetchPlayerData(true);
  }, [fetchPlayerData]);
  
  // 🚀 REALTIME: Listen for real-time bid updates using shared socket
  const { on } = useSocket();
  const currentPlayerId = player.id || player._id;
  
  useEffect(() => {
    if (!on) return;
    
    const cleanup1 = on('player_bid_update', (update) => {
      if (update.playerId === currentPlayerId || update.playerId?.toString() === currentPlayerId?.toString()) {
        // Refresh player data when bid updates (silently, no loading spinner)
        fetchPlayerData(false);
      }
    });
    
    const cleanup2 = on('player_sold_update', (update) => {
      if (update.playerId === currentPlayerId || update.playerId?.toString() === currentPlayerId?.toString()) {
        // Refresh player data when sold (silently, no loading spinner)
        fetchPlayerData(false);
      }
    });
    
    return () => {
      cleanup1();
      cleanup2();
    };
  }, [on, currentPlayerId, fetchPlayerData]);

  // Auto-hide bid alert after 5 seconds
  useEffect(() => {
    if (bidAlert) {
      const timer = setTimeout(() => {
        setBidAlert(null);
        if (onClose) {
          onClose();
        }
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [bidAlert, onClose]);

  const formatHumanReadableAmount = (amount) => {
    if (amount >= 10000000) {
      return `${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `${(amount / 100000).toFixed(2)} Lakh`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(2)} Thousand`;
    }
    return amount.toString();
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
  const autoExitInfo = (() => {
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
        title: "Bulk Exit",
        start: buildIstDate(18, 0),
        end: buildIstDate(22, 0),
        interval: 10,
        enabled: cronSettings.cronBulkExitEnabled,
      },
      {
        key: "exitOnly",
        title: "Exit-Only",
        start: buildIstDate(22, 30),
        end: buildIstDate(23, 0),
        interval: 5,
        enabled: cronSettings.cronSingleBidEnabled,
      },
      {
        key: "sellAfterExit5",
        title: "Sell-After-Exit (5m)",
        start: buildIstDate(23, 30),
        end: buildIstDate(0, 30, 0, 1),
        interval: 5,
        enabled: cronSettings.cronSingleBidEnabled,
      },
      {
        key: "sellAfterExit2",
        title: "Sell-After-Exit (2m)",
        start: buildIstDate(0, 30, 0, 1),
        end: buildIstDate(2, 0, 0, 1),
        interval: 2,
        enabled: cronSettings.cronSingleBidEnabled,
      },
    ];

    const enabledWindows = windows.filter((w) => w.enabled);
    if (enabledWindows.length === 0) {
      return { status: "OFF", nextExitAt: null };
    }

    const currentWindow = enabledWindows.find((w) => nowIst >= w.start && nowIst < w.end);
    const getNextTick = (window) => {
      if (!window?.interval) return null;
      if (nowIst < window.start) return window.start;
      const intervalMs = window.interval * 60 * 1000;
      const elapsed = nowIst.getTime() - window.start.getTime();
      const ticks = Math.ceil(elapsed / intervalMs);
      const next = new Date(window.start.getTime() + ticks * intervalMs);
      return next < window.end ? next : null;
    };

    if (currentWindow) {
      const nextTick = getNextTick(currentWindow);
      if (nextTick) return { status: "ACTIVE", nextExitAt: nextTick };
    }

    const nextWindow = enabledWindows.find((w) => nowIst < w.start);
    const fallback = nextWindow || enabledWindows[0];
    return { status: "WAITING", nextExitAt: fallback.start };
  })();

  const secondBidderId =
    topTwoBids[1]?.bidder?._id ||
    topTwoBids[1]?.bidder?.id ||
    topTwoBids[1]?.bidder;
  const isSecondHighestUser =
    currentUserId &&
    secondBidderId &&
    String(secondBidderId) === String(currentUserId) &&
    topTwoBids[1]?.isBidOn !== false;

  const handleReleasePlayer = async () => {
    try {
      setBidAlert(null);

      const response = await fetch(`${API_ENDPOINTS}/api/bids/release-player`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerId: player.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to release player.");
      }

      setBidAlert({
        message: result.message || "Player released successfully.",
        amount: null,
        playerName: playerDetails.name,
        isSuccess: true,
        isRelease: true
      });
    } catch (err) {
      setBidAlert({
        message: err.message || "Failed to release player. Please try again.",
        amount: null,
        playerName: playerDetails.name,
        isSuccess: false,
        isRelease: true
      });
    }
  };

  const handleMarkAsSold = async () => {
    try {
      setBidAlert(null);

      const response = await fetch(`${API_ENDPOINTS}/api/bids/bid/sold`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerID: player.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to mark player as sold.");
      }

      setBidAlert({
        message: result.message || "Player marked as sold successfully.",
        amount: null,
        playerName: playerDetails.name,
        isSuccess: true,
        isSold: true
      });
    } catch (err) {
      setBidAlert({
        message: err.message || "Failed to mark player as sold. Please try again.",
        amount: null,
        playerName: playerDetails.name,
        isSuccess: false,
        isSold: true
      });
    }
  };

  const handleDeactivatePlayer = async () => {
    try {
      setBidAlert(null);
      const admin = JSON.parse(localStorage.getItem("user"));
      const adminUserId = admin?.id;
      if (!adminUserId) {
        throw new Error("Admin user ID not found.");
      }

      const response = await fetch(`${API_ENDPOINTS}/api/player/${player.id}/deactivate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUserId }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to deactivate player.");
      }

      setPlayerDetails((prev) => (prev ? { ...prev, isActive: false } : prev));
      if (onDeactivated) {
        onDeactivated(player.id || player._id);
      }
      setBidAlert({
        message: result.message || "Player deactivated successfully.",
        amount: null,
        playerName: playerDetails.name,
        isSuccess: true,
      });
    } catch (err) {
      setBidAlert({
        message: err.message || "Failed to deactivate player. Please try again.",
        amount: null,
        playerName: playerDetails?.name || "",
        isSuccess: false,
      });
    }
  };

  const determineBidIncrement = (playerType, lastBidAmount) => {
    if (playerType === "Sapphire" || playerType === "Gold" || playerType === "Emerald") {
      return 5000000; // ₹50,00,000
    } else if (playerType === "Silver" && lastBidAmount >= 10000000) {
      return 5000000; // ₹50,00,000 if last bid amount is ₹1 Cr or more
    } else if (playerType === "Silver") {
      return 1000000; // ₹10,00,000 for Silver otherwise
    }
    return 1000000; // Default increment
  };

  const handlePlaceBid = async () => {
    try {
      setPlacingBid(true);
      setBidError(null);

      const user = JSON.parse(localStorage.getItem("user"));
      const bidderId = user?.id;
      const token = user?.token; // Get JWT token from user object

      if (!bidderId) {
        throw new Error("Bidder ID not found in local storage.");
      }
      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }
      const lastBidAmount =
        topTwoBids.length > 0 ? topTwoBids[0]?.bidAmount || 0 : playerDetails?.basePrice || 0;

      // Determine the bid increment based on player type and last bid amount
      const bidIncrement = determineBidIncrement(playerDetails?.type, lastBidAmount);

      // Calculate the bid amount
      // For first bidder, bid amount should be base price, not base price + increment
      const bidAmount = topTwoBids.length > 0 ? lastBidAmount + bidIncrement : playerDetails?.basePrice || 0;
      console.log("Calculated Bid Amount:", bidAmount);

      const payload = {
        bidAmount,
        bidder: bidderId,
      };
      console.log("Payload:", payload);

      const response = await fetch(`${API_ENDPOINTS}/api/bids/${playerDetails.id}/bid`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Include JWT token in Authorization header
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      // Check if the API responded with a success or failure
      if (!response.ok) {
        throw new Error(result.message || "Failed to place bid.");
      }

      // On success, update the message and state
      const isFirstBid = topTwoBids.length === 0;
      const message = isFirstBid 
        ? `₹${formatHumanReadableAmount(bidAmount)} bid placed on ${playerDetails.name}!`
        : `₹${formatHumanReadableAmount(bidAmount)} bid placed on ${playerDetails.name}!`;
      
      setBidAlert({
        message: message,
        amount: bidAmount,
        playerName: playerDetails.name,
        isSuccess: true
      });
      if (onBidPlaced) {
        onBidPlaced(playerDetails.id || playerDetails._id);
      }
      setAllBids([...allBids, result.newBid]);
    } catch (err) {
      // Display the error message from the server or a default error
      setBidAlert({
        message: err.message || "Failed to place bid.",
        amount: null,
        playerName: playerDetails.name,
        isSuccess: false
      });
    } finally {
      setPlacingBid(false);
    }
  };

  const handleExitAuction = async () => {
    try {
      setBidAlert(null); // Reset the alert

      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.id;

      if (!userId) {
        throw new Error("User ID not found in local storage.");
      }

      const response = await fetch(`${API_ENDPOINTS}/api/bids/${player.id}/exit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to exit auction.");
      }

      setBidAlert({
        message: result.message || "Successfully exited the auction.",
        amount: null,
        playerName: playerDetails.name,
        isSuccess: true,
        isExit: true
      });
      if (onBidExited) {
        onBidExited(player.id || player._id);
      }
    } catch (err) {
      setBidAlert({
        message: err.message || "Failed to exit the auction. Please try again.",
        amount: null,
        playerName: playerDetails.name,
        isSuccess: false,
        isExit: true
      });
    }
  };

  if (loading) {
    return <div className="loading">Loading player details...</div>;
  }
  if (error) {
    return <div className="error">{error}</div>;
  }

  const isSold = playerDetails?.status === true;
  const isActive = playerDetails?.isActive !== false;
  const popupTypeStyles = getPopupTypeStyles(playerDetails?.type);
  const getPlayerStatValue = (field) => {
    const detailValue = playerDetails?.[field];
    if (typeof detailValue === "number" && detailValue > 0) {
      return detailValue;
    }
    const fallbackValue = player?.[field];
    if (typeof fallbackValue === "number" && fallbackValue > 0) {
      return fallbackValue;
    }
    return detailValue ?? fallbackValue ?? 0;
  };

  return (
    <>
      {/* Super Sexy Bid Loading Popup */}
      {placingBid && (
        <div className="bid-loading-overlay">
          <div className="bid-loading-card">
            <div className="bid-loading-icon">🚀</div>
            <div className="bid-loading-title">PLACING BID</div>
            <div className="bid-loading-subtitle">
              Your bid is being processed...<br />
              Please wait while we confirm your bid
            </div>
            <div className="bid-loading-progress">
              <div className="bid-loading-progress-bar"></div>
            </div>
            <div className="bid-loading-status">Processing...</div>
          </div>
        </div>
      )}
      
      {/* Centered Bid Alert Popup */}
      {bidAlert && (
        <div className="bid-alert-overlay">
          <div className={`bid-alert-card ${bidAlert.isSuccess ? 'success' : 'error'}`}>
            <div className="bid-alert-icon">
              {bidAlert.isExit 
                ? (bidAlert.isSuccess ? '🚪' : '❌')
                : bidAlert.isSold
                ? (bidAlert.isSuccess ? '🏆' : '❌')
                : bidAlert.isRelease
                ? (bidAlert.isSuccess ? '🔄' : '❌')
                : (bidAlert.isSuccess ? '🎯' : '⚠️')
              }
            </div>
            <div className="bid-alert-title">
              {bidAlert.isExit 
                ? (bidAlert.isSuccess ? 'EXIT SUCCESSFUL!' : 'EXIT FAILED!')
                : bidAlert.isSold
                ? (bidAlert.isSuccess ? 'PLAYER SOLD!' : 'SOLD FAILED!')
                : bidAlert.isRelease
                ? (bidAlert.isSuccess ? 'PLAYER RELEASED!' : 'RELEASE FAILED!')
                : (bidAlert.isSuccess ? 'BID PLACED!' : 'BID FAILED!')
              }
            </div>
            <div className="bid-alert-message">
              {bidAlert.isExit ? (
                bidAlert.isSuccess ? (
                  <>
                    Successfully exited auction for<br />
                    <strong>{bidAlert.playerName}</strong>
                  </>
                ) : (
                  <>
                    Failed to exit auction for<br />
                    <strong>{bidAlert.playerName}</strong>
                  </>
                )
              ) : bidAlert.isSold ? (
                bidAlert.isSuccess ? (
                  <>
                    Successfully marked as sold<br />
                    <strong>{bidAlert.playerName}</strong>
                  </>
                ) : (
                  <>
                    Failed to mark as sold<br />
                    <strong>{bidAlert.playerName}</strong>
                  </>
                )
              ) : bidAlert.isRelease ? (
                bidAlert.isSuccess ? (
                  <>
                    Successfully released<br />
                    <strong>{bidAlert.playerName}</strong>
                  </>
                ) : (
                  <>
                    Failed to release<br />
                    <strong>{bidAlert.playerName}</strong>
                  </>
                )
              ) : (
                bidAlert.isSuccess ? (
                  <>
                    Your bid has been successfully placed for<br />
                    <strong>{bidAlert.playerName}</strong>
                  </>
                ) : (
                  <>
                    Failed to place bid for<br />
                    <strong>{bidAlert.playerName}</strong>
                  </>
                )
              )}
            </div>
            {bidAlert.isSuccess && bidAlert.amount && !bidAlert.isExit && !bidAlert.isSold && !bidAlert.isRelease && (
              <div className="bid-alert-amount">
                ₹{formatHumanReadableAmount(bidAlert.amount)}
              </div>
            )}
            <div className="bid-alert-api-message">
              {bidAlert.message}
            </div>
            <button 
              className="bid-alert-close" 
              onClick={() => {
                setBidAlert(null);
                if (onClose) {
                  onClose();
                }
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      <div className="popup-overlay">
        <div className="popup-card elegant-card" style={popupTypeStyles}>
          <button className="close-btn" onClick={onClose}>✖</button>
          <div className="scrollable-content">
            <img
              src={`https://via.placeholder.com/150?text=${playerDetails.name}`}
              alt={playerDetails.name}
              className="player-image"
            />
            <h2 className="player-name">{playerDetails.name}</h2>

            <div className="player-details">
              <p>
                <span className="player-detail-icon">🧑‍🎤</span>
                <b>Name:</b> <span>{playerDetails.name}</span>
              </p>
              <p>
                <span className="player-detail-icon">🏏</span>
                <b>Role:</b> <span>{playerDetails.role}</span>
              </p>
              <p>
                <span className="player-detail-icon">✋</span>
                <b>Batting Style:</b> <span>{playerDetails.battingStyle || "N/A"}</span>
              </p>
              <p>
                <span className="player-detail-icon">📊</span>
                <b>Overall Score:</b> <span>{playerDetails.score || "N/A"}</span>
              </p>
              <p>
                <span className="player-detail-icon">💰</span>
                <b>Base Price:</b> <span>{formatHumanReadableAmount(playerDetails.basePrice)}</span>
              </p>
              <p>
                <span className="player-detail-icon">💎</span>
                <b>Type:</b> <span>{playerDetails.type}</span>
              </p>
              {/* NEW LINES FOR TOTAL RUNS & TOTAL WICKETS */}
              <p>
                <span className="player-detail-icon">⚾</span>
                <b>Total Runs:</b> <span>{getPlayerStatValue("totalRuns")}</span>
              </p>
              <p>
                <span className="player-detail-icon">🔥</span>
                <b>Total Wickets:</b> <span>{getPlayerStatValue("totalWickets")}</span>
              </p>
              <p>
                <span className="player-detail-icon">🏆</span>
                <b>Total MoM:</b> <span>{getPlayerStatValue("momCount")}</span>
              </p>
            </div>

            {topTwoBids.length > 0 && (
              <div className="bids-section">
                <h3>Last Two Bids</h3>
                    {topTwoBids.map((bid, index) => {
                  return (
                    <div key={bid.id} className={`bid-row ${index === 0 ? 'first-bid' : 'second-bid'}`}>
                      <p>
                        <b>Bidder:</b>{" "}
                        <span className="bidder-name">
                          {bid.isBidOn === false && <span className="bid-out-text">Out</span>}{" "}
                          {bid.bidder?.name || bid.bidderName || 'Unknown Bidder'}
                        </span>
                        <span className="bid-amount">
                          {formatHumanReadableAmount(bid.bidAmount)}
                        </span>
                      </p>
                      <p className="bid-time">
                        <FaClock className="timer-icon" /> Last Bid Time:{" "}
                        {new Date(bid.createdAt).toLocaleString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: true,
                        })}
                      </p>
                      {index === 1 && (
                        <p className="bid-time">
                          <FaClock className="timer-icon" /> Auto Exit (System):{" "}
                          {autoExitInfo.status === "OFF"
                            ? "OFF by Admin"
                            : autoExitInfo.nextExitAt
                              ? formatCountdown(autoExitInfo.nextExitAt - now)
                              : "—"}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {playerDetails?.lastExitTime && (
              <p className="bid-time">
                <FaClock className="timer-icon" /> Last Exit Time:{" "}
                {new Date(playerDetails.lastExitTime).toLocaleString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                })}
                {playerDetails?.lastExitUser ? ` — ${playerDetails.lastExitUser}` : ''}
              </p>
            )}

            {!isAdmin && !isSold && (
              <div className="place-bid-section">
                <h3>Place a Bid</h3>
                <button
                  className="user-btn place-bid"
                  onClick={handlePlaceBid}
                  disabled={placingBid}
                >
                  {placingBid
                    ? "Placing..."
                    : `Place Bid (₹${formatHumanReadableAmount(
                        determineBidIncrement(
                          playerDetails?.type,
                          topTwoBids.length > 0
                            ? topTwoBids[0]?.bidAmount || 0
                            : playerDetails?.basePrice || 0
                        )
                      )})`}
                </button>
                {bidError && <p className="error">{bidError}</p>}
              </div>
            )}

            {isAdmin && !isSold && (
              <div className="admin-action-buttons">
                <button
                  className="sold-btn"
                  onClick={handleMarkAsSold}
                  style={{
                    padding: "10px 20px",
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#fff",
                    backgroundColor: "linear-gradient(to right, #ff416c, #ff4b2b)",
                    borderRadius: "8px",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                >
                  SOLD
                </button>
                {isActive && (
                  <button
                    className="deactivate-btn"
                    onClick={handleDeactivatePlayer}
                    style={{
                      padding: "10px 20px",
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: "#fff",
                      background: "linear-gradient(to right, #6c757d, #495057)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      marginLeft: "10px",
                    }}
                  >
                    DEACTIVATE
                  </button>
                )}
                <button
                  className="exit-btn"
                  onClick={handleExitAuction}
                  style={{
                    padding: "10px 20px",
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#fff",
                    background: "linear-gradient(to right, #ff7e5f, #feb47b)",
                    borderRadius: "8px",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    marginLeft: "10px",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = "linear-gradient(to right, #feb47b, #ff7e5f)";
                    e.target.style.transform = "scale(1.05)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = "linear-gradient(to right, #ff7e5f, #feb47b)";
                    e.target.style.transform = "scale(1)";
                  }}
                >
                  EXIT
                </button>
                {/* soldMessage && <p className="sold-message">{soldMessage}</p> */}
                {/* exitMessage && <p className="exit-message">{exitMessage}</p> */}
              </div>
            )}

            {isAdmin && isSold && (
              <div className="release-button-section">
                <button
                  className="release-btn"
                  onClick={handleReleasePlayer}
                  style={{
                    padding: "12px 25px",
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#fff",
                    background: "linear-gradient(to right, #4CAF50, #8BC34A)",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
                    cursor: "pointer",
                    transition: "transform 0.2s, background 0.3s",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = "linear-gradient(to right, #8BC34A, #4CAF50)";
                    e.target.style.transform = "scale(1.05)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = "linear-gradient(to right, #4CAF50, #8BC34A)";
                    e.target.style.transform = "scale(1)";
                  }}
                >
                  RELEASE PLAYER
                </button>
                {/* releaseMessage && <p className="release-message">{releaseMessage}</p> */}
              </div>
            )}
            
            {/* exitMessage && (
              <div className="exit-message">
                <p>{exitMessage}</p>
              </div>
            ) */}

            {!isAdmin && !isSold && (
              <div className="exit-auction-section">
                <button className="unique-exit-btn" onClick={handleExitAuction}>
                  Exit Auction 🚪
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PlayerPopup;
