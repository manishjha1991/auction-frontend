import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "../contexts/SocketContext";
import "../css/PlayerPopup.css";
import { FaBolt, FaClock, FaEye, FaHourglassHalf, FaListOl } from "react-icons/fa";
import { API_ENDPOINTS } from "../const";
import { resolvePlayerImageUrl } from "../utils/resolvePlayerImageUrl";

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

const PlayerPopup = ({
  player,
  onClose,
  onDeactivated,
  onBidPlaced,
  onBidExited,
  hideAuctionActions = false,
}) => {
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
  const profilePicInputRef = useRef(null);
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [portraitBroken, setPortraitBroken] = useState(false);
  const [viewerOwnsPlayer, setViewerOwnsPlayer] = useState(false);
  const [portraitLightboxOpen, setPortraitLightboxOpen] = useState(false);
  const [bidQueueState, setBidQueueState] = useState({
    enabled: false,
    manualBidsFrozen: false,
    queueCount: 0,
    you: null,
    queueJoinAllowed: false,
    canJoinQueue: false,
    activeBidderCount: 0,
  });
  const [queueMaxInput, setQueueMaxInput] = useState("");
  const [queueMaxUnit, setQueueMaxUnit] = useState("cr");
  const [queueBusy, setQueueBusy] = useState(false);
  const [liveWatcherCount, setLiveWatcherCount] = useState(0);
  const QUEUE_UNIT_MULTIPLIER = { lakh: 100000, cr: 10000000 };
  const MAX_QUEUE_BID_RUPEES = 1000000000; // 100 Cr hard cap

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
      let viewerQs = "";
      try {
        const u = JSON.parse(localStorage.getItem("user"));
        const uid = u?.id || u?._id;
        if (uid) viewerQs = `?viewerUserId=${encodeURIComponent(uid)}`;
      } catch {
        /* ignore */
      }
      const response = await fetch(
        `${API_ENDPOINTS}/api/player/${player.id}/bids${viewerQs}`,
        { headers: { "Content-Type": "application/json" } }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setViewerOwnsPlayer(data.viewerOwnsPlayer === true);
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

  useEffect(() => {
    setPortraitBroken(false);
  }, [playerDetails?.profilePicture, player.id]);
  
  // 🚀 REALTIME: Listen for real-time bid updates using shared socket
  const { on, socket, isConnected } = useSocket();
  const currentPlayerId = player.id || player._id;
  const watchedPlayerId =
    playerDetails?.id || playerDetails?._id || player.id || player._id;

  useEffect(() => {
    setLiveWatcherCount(0);
  }, [watchedPlayerId]);

  /* Join watch room so this client counts toward demand; count updates via socket. */
  useEffect(() => {
    if (!socket || !isConnected || !watchedPlayerId) return;
    const pid = String(watchedPlayerId);
    socket.emit("watch_player", { playerId: pid });
    return () => {
      socket.emit("unwatch_player", { playerId: pid });
    };
  }, [socket, isConnected, watchedPlayerId]);

  useEffect(() => {
    if (!on) return;

    const cleanupWatchers = on("player_watchers_update", (payload) => {
      const pid = payload?.playerId != null ? String(payload.playerId) : "";
      const ours = String(watchedPlayerId || "");
      if (!pid || !ours || pid !== ours) return;
      const count = typeof payload.count === "number" ? payload.count : 0;
      setLiveWatcherCount(count);
    });

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
      cleanupWatchers();
      cleanup1();
      cleanup2();
    };
  }, [on, watchedPlayerId, currentPlayerId, fetchPlayerData]);

  const fetchBidQueueState = useCallback(async () => {
    const pid = playerDetails?.id || playerDetails?._id || player.id || player._id;
    if (!pid) return;
    try {
      const u = JSON.parse(localStorage.getItem("user"));
      const token = u?.token;
      if (!token) return;
      const res = await fetch(`${API_ENDPOINTS}/api/bid-queue/${pid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const canJoinQueue =
        typeof data.canJoinQueue === "boolean"
          ? data.canJoinQueue
          : !!(data.queueJoinAllowed && !data.you);
      setBidQueueState({
        enabled: !!data.enabled,
        manualBidsFrozen: !!data.manualBidsFrozen,
        queueCount: data.queueCount || 0,
        you: data.you || null,
        queueJoinAllowed: !!data.queueJoinAllowed,
        canJoinQueue,
        activeBidderCount: typeof data.activeBidderCount === "number" ? data.activeBidderCount : 0,
      });
    } catch (e) {
      console.warn("bid queue state", e);
    }
  }, [playerDetails?.id, playerDetails?._id, player.id, player._id]);

  useEffect(() => {
    if (!playerDetails || hideAuctionActions) return;
    fetchBidQueueState();
  }, [playerDetails, hideAuctionActions, fetchBidQueueState]);

  useEffect(() => {
    if (!on) return;
    const c1 = on("bid_queue_updated", (payload) => {
      const id = payload?.playerId;
      if (id === currentPlayerId || id?.toString() === currentPlayerId?.toString()) {
        fetchBidQueueState();
        fetchPlayerData(false);
      }
    });
    const c2 = on("bid_queue_personal", () => {
      fetchBidQueueState();
      fetchPlayerData(false);
    });
    return () => {
      c1();
      c2();
    };
  }, [on, currentPlayerId, fetchBidQueueState, fetchPlayerData]);

  // Auto-hide bid alert after 5 seconds (do not close popup after photo-only alerts)
  useEffect(() => {
    if (bidAlert) {
      const timer = setTimeout(() => {
        setBidAlert(null);
        if (onClose && !bidAlert.isPhoto) {
          onClose();
        }
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [bidAlert, onClose]);

  useEffect(() => {
    if (!portraitLightboxOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setPortraitLightboxOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [portraitLightboxOpen]);

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
        key: "bulk1",
        title: "Bulk Exit (6–9:40 PM)",
        start: buildIstDate(18, 0),
        end: buildIstDate(21, 40),
        interval: 10,
        enabled: cronSettings.cronBulkExitEnabled,
      },
      {
        key: "bulk2",
        title: "Bulk Exit (10:35–11:05 PM)",
        start: buildIstDate(22, 35),
        end: buildIstDate(23, 5),
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

  const canReplaceProfilePhoto = isAdmin || viewerOwnsPlayer;

  const handleAdminProfileFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !canReplaceProfilePhoto) return;
    let userId;
    try {
      const u = JSON.parse(localStorage.getItem("user"));
      userId = u?.id || u?._id;
    } catch {
      userId = null;
    }
    if (!userId) {
      setBidAlert({
        message: "Please sign in to replace this photo.",
        playerName: playerDetails?.name || "",
        isSuccess: false,
        isPhoto: true,
      });
      return;
    }
    const fd = new FormData();
    fd.append("profilePicture", file);
    fd.append("userId", userId);
    setUploadingProfilePic(true);
    try {
      const res = await fetch(
        `${API_ENDPOINTS}/api/player/${player.id}/admin/profile-picture`,
        { method: "POST", body: fd }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Upload failed");
      setPlayerDetails((prev) =>
        prev ? { ...prev, profilePicture: data.profilePicture } : prev
      );
      setBidAlert({
        message: data.message || "Photo updated.",
        playerName: playerDetails?.name,
        isSuccess: true,
        isPhoto: true,
      });
    } catch (err) {
      setBidAlert({
        message: err.message || "Upload failed",
        playerName: playerDetails?.name,
        isSuccess: false,
        isPhoto: true,
      });
    } finally {
      setUploadingProfilePic(false);
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

  const bidderIdMatchesTopTwo = () => {
    if (!currentUserId) return false;
    return topTwoBids.some((b) => {
      const id = b.bidder?._id || b.bidder?.id || b.bidder;
      return id && String(id) === String(currentUserId);
    });
  };

  const manualBidBlockedByQueue =
    bidQueueState.enabled &&
    bidQueueState.manualBidsFrozen &&
    !bidderIdMatchesTopTwo();

  /** Promoted from queue: auto-bids only — no manual Place Bid (server enforces too). */
  const promotedFromQueue = !!(bidQueueState.you?.isPromotedProxy);

  const queueYouPosition = bidQueueState.you?.position;
  const queueYouTotal =
    typeof bidQueueState.you?.queueLength === "number"
      ? bidQueueState.you.queueLength
      : bidQueueState.queueCount;

  /** Queue UI only when two active bidders (third+ can join), or you are already queued. */
  const showBidQueuePanel =
    bidQueueState.enabled &&
    !hideAuctionActions &&
    (bidQueueState.queueJoinAllowed || !!bidQueueState.you);

  /** Server sets canJoinQueue; also hide if top-two bids say you are already in the duel (legacy API). */
  const showJoinQueueControls =
    bidQueueState.canJoinQueue && !bidderIdMatchesTopTwo();

  const parseQueueMaxBid = () => {
    const raw = String(queueMaxInput || "").replace(/,/g, "").trim();
    const unit = queueMaxUnit === "lakh" ? "lakh" : "cr";
    if (!raw) {
      return { ok: false, message: "Enter max bid value." };
    }
    if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
      return { ok: false, message: "Use number format like 1 or 1.5 (up to 2 decimals)." };
    }
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, message: "Enter a valid positive max bid value." };
    }
    const maxBid = Math.round(amount * QUEUE_UNIT_MULTIPLIER[unit]);
    if (!Number.isFinite(maxBid) || maxBid <= 0) {
      return { ok: false, message: "Converted max bid is invalid. Please adjust value." };
    }
    return { ok: true, amount, unit, maxBid };
  };
  const handleQueueMaxInputChange = (event) => {
    const next = String(event.target.value ?? "");
    // Allow only up to 2 decimal places while typing.
    if (!/^\d*(\.\d{0,2})?$/.test(next)) {
      return;
    }
    setQueueMaxInput(next);
  };
  const queueMaxPreview = (() => {
    const p = parseQueueMaxBid();
    return p.ok ? p.maxBid : null;
  })();

  const handleJoinBidQueue = async () => {
    const pid = playerDetails?.id || playerDetails?._id;
    const parsed = parseQueueMaxBid();
    if (!pid || !parsed.ok) {
      setBidAlert({
        message: parsed?.message || "Enter a valid max bid number and choose unit (Lakh/Cr).",
        amount: null,
        playerName: playerDetails?.name,
        isSuccess: false,
      });
      return;
    }
    if (parsed.maxBid > MAX_QUEUE_BID_RUPEES) {
      setBidAlert({
        message: "Queue max cannot exceed 100 Cr.",
        amount: null,
        playerName: playerDetails?.name,
        isSuccess: false,
      });
      return;
    }
    setQueueBusy(true);
    try {
      const u = JSON.parse(localStorage.getItem("user"));
      const res = await fetch(`${API_ENDPOINTS}/api/bid-queue/${pid}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${u?.token}`,
        },
        body: JSON.stringify({ maxBid: parsed.maxBid }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Could not join queue");
      setBidAlert({
        message: data.message || "Joined bid queue.",
        amount: null,
        playerName: playerDetails?.name,
        isSuccess: true,
      });
      setQueueMaxInput("");
      await fetchBidQueueState();
    } catch (e) {
      setBidAlert({
        message: e.message || "Queue error",
        amount: null,
        playerName: playerDetails?.name,
        isSuccess: false,
      });
    } finally {
      setQueueBusy(false);
    }
  };

  const handleResignProxyToManual = async () => {
    const pid = playerDetails?.id || playerDetails?._id;
    if (!pid) return;
    setQueueBusy(true);
    try {
      const u = JSON.parse(localStorage.getItem("user"));
      const res = await fetch(`${API_ENDPOINTS}/api/bid-queue/${pid}/resign-proxy`, {
        method: "POST",
        headers: { Authorization: `Bearer ${u?.token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Could not switch to manual bidding");
      setBidAlert({
        message:
          data.message ||
          "Auto-bid is off. You can place bids manually. To use queue auto-bid again, exit, re-join the queue, and get promoted.",
        amount: null,
        playerName: playerDetails?.name,
        isSuccess: true,
      });
      await fetchBidQueueState();
      await fetchPlayerData(false);
    } catch (e) {
      setBidAlert({
        message: e.message || "Queue error",
        amount: null,
        playerName: playerDetails?.name,
        isSuccess: false,
      });
    } finally {
      setQueueBusy(false);
    }
  };

  const handleUpdateQueueMax = async () => {
    const pid = playerDetails?.id || playerDetails?._id;
    const parsed = parseQueueMaxBid();
    if (!pid || !parsed.ok) {
      setBidAlert({
        message: parsed?.message || "Enter a valid new max bid number and choose unit (Lakh/Cr).",
        amount: null,
        playerName: playerDetails?.name,
        isSuccess: false,
      });
      return;
    }
    if (parsed.maxBid > MAX_QUEUE_BID_RUPEES) {
      setBidAlert({
        message: "Queue max cannot exceed 100 Cr.",
        amount: null,
        playerName: playerDetails?.name,
        isSuccess: false,
      });
      return;
    }
    setQueueBusy(true);
    try {
      const u = JSON.parse(localStorage.getItem("user"));
      const res = await fetch(`${API_ENDPOINTS}/api/bid-queue/${pid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${u?.token}`,
        },
        body: JSON.stringify({ maxBid: parsed.maxBid }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Could not update max");
      setBidAlert({
        message: data.message || "Max updated.",
        amount: null,
        playerName: playerDetails?.name,
        isSuccess: true,
      });
      setQueueMaxInput("");
      await fetchBidQueueState();
    } catch (e) {
      setBidAlert({
        message: e.message || "Queue error",
        amount: null,
        playerName: playerDetails?.name,
        isSuccess: false,
      });
    } finally {
      setQueueBusy(false);
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

  const portraitFullUrl = resolvePlayerImageUrl(playerDetails?.profilePicture);
  const otherWatchersCount = Math.max(0, liveWatcherCount - 1);

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
              {bidAlert.isPhoto
                ? (bidAlert.isSuccess ? '📷' : '❌')
                : bidAlert.isExit 
                ? (bidAlert.isSuccess ? '🚪' : '❌')
                : bidAlert.isSold
                ? (bidAlert.isSuccess ? '🏆' : '❌')
                : bidAlert.isRelease
                ? (bidAlert.isSuccess ? '🔄' : '❌')
                : (bidAlert.isSuccess ? '🎯' : '⚠️')
              }
            </div>
            <div className="bid-alert-title">
              {bidAlert.isPhoto
                ? (bidAlert.isSuccess ? "PHOTO UPDATED" : "PHOTO UPLOAD FAILED")
                : bidAlert.isExit 
                ? (bidAlert.isSuccess ? 'EXIT SUCCESSFUL!' : 'EXIT FAILED!')
                : bidAlert.isSold
                ? (bidAlert.isSuccess ? 'PLAYER SOLD!' : 'SOLD FAILED!')
                : bidAlert.isRelease
                ? (bidAlert.isSuccess ? 'PLAYER RELEASED!' : 'RELEASE FAILED!')
                : (bidAlert.isSuccess ? 'BID PLACED!' : 'BID FAILED!')
              }
            </div>
            <div className="bid-alert-message">
              {bidAlert.isPhoto ? (
                bidAlert.isSuccess ? (
                  <>
                    Profile picture saved for<br />
                    <strong>{bidAlert.playerName}</strong>
                  </>
                ) : (
                  <>
                    Could not update photo for<br />
                    <strong>{bidAlert.playerName}</strong>
                  </>
                )
              ) : bidAlert.isExit ? (
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
            {bidAlert.isSuccess && bidAlert.amount && !bidAlert.isExit && !bidAlert.isSold && !bidAlert.isRelease && !bidAlert.isPhoto && (
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
      
      <div
        className={`popup-overlay${hideAuctionActions ? " player-popup--squad" : ""}`}
      >
        <div className="popup-card elegant-card" style={popupTypeStyles}>
          <button className="close-btn" onClick={onClose}>✖</button>
          <div className="scrollable-content">
            <div className="player-image-wrap">
              {(() => {
                const portraitUrl = resolvePlayerImageUrl(playerDetails.profilePicture);
                const showImg = portraitUrl && !portraitBroken;
                return showImg ? (
                  <img
                    key={portraitUrl}
                    src={portraitUrl}
                    alt=""
                    className="player-image player-image-clickable"
                    role="button"
                    tabIndex={0}
                    onClick={() => setPortraitLightboxOpen(true)}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault();
                        setPortraitLightboxOpen(true);
                      }
                    }}
                    onError={() => setPortraitBroken(true)}
                  />
                ) : (
                  <div className="player-image player-image-placeholder" aria-hidden>
                    {(playerDetails.name || "?").trim().charAt(0).toUpperCase()}
                  </div>
                );
              })()}
              {canReplaceProfilePhoto && (
                <div className="player-photo-admin">
                  <input
                    ref={profilePicInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    style={{ display: "none" }}
                    onChange={handleAdminProfileFile}
                  />
                  <button
                    type="button"
                    className="player-photo-replace-btn"
                    disabled={uploadingProfilePic}
                    onClick={() => profilePicInputRef.current?.click()}
                  >
                    {uploadingProfilePic ? "Uploading…" : "Replace photo"}
                  </button>
                </div>
              )}
            </div>
            <div className="player-name-demand-wrap">
              <h2 className="player-name">{playerDetails.name}</h2>
              {otherWatchersCount >= 1 && (
                <div
                  className="player-demand-indicator"
                  title={`${otherWatchersCount} other viewer${otherWatchersCount === 1 ? "" : "s"} on this profile (live)`}
                >
                  <span className="player-demand-live-dot" aria-hidden />
                  <FaEye className="player-demand-eye" aria-hidden />
                  <span className="player-demand-count">{otherWatchersCount}</span>
                  <span className="player-demand-label">viewing</span>
                  <span
                    className={
                      otherWatchersCount >= 3 ? "player-demand-hot" : "player-demand-warm"
                    }
                  >
                    {otherWatchersCount >= 3 ? "hot" : "warm"}
                  </span>
                </div>
              )}
            </div>

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

            {!hideAuctionActions && topTwoBids.length > 0 && (
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
            {!hideAuctionActions && playerDetails?.lastExitTime && (
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
                {playerDetails?.lastExitBy
                  ? ` (by ${playerDetails.lastExitBy === 'system' ? 'System' : 'User'})`
                  : ''}
              </p>
            )}

            {!isAdmin && !isSold && (
              <div className="place-bid-section">
                <h3>Place a Bid</h3>
                {showBidQueuePanel && bidQueueState.queueCount > 0 && (
                  <div className="bid-queue-callout" role="status">
                    <span className="bid-queue-callout-icon" aria-hidden>
                      <FaHourglassHalf />
                    </span>
                    <div className="bid-queue-callout-text">
                      <span className="bid-queue-callout-title">
                        {bidQueueState.queueCount === 1
                          ? "1 team is waiting in the bid queue"
                          : `${bidQueueState.queueCount} teams are waiting in the bid queue`}
                      </span>
                      <span className="bid-queue-callout-detail">
                        {manualBidBlockedByQueue
                          ? "Manual raises are limited to the two active bidders until the queue clears."
                          : "Others are lined up for the next open slot on this player."}
                      </span>
                    </div>
                  </div>
                )}
                {showBidQueuePanel && bidQueueState.you && (
                  <div
                    className={`bid-queue-you-card ${promotedFromQueue ? "bid-queue-you-card--promoted" : ""}`}
                    role="status"
                  >
                    <span className="bid-queue-you-card-icon" aria-hidden>
                      {promotedFromQueue ? <FaBolt /> : <FaListOl />}
                    </span>
                    <div className="bid-queue-you-card-body">
                      {promotedFromQueue ? (
                        <>
                          <span className="bid-queue-you-card-title">Promoted — auto-bid on</span>
                          <p className="bid-queue-you-card-detail">
                            Auto-bid is active up to{" "}
                            <strong>{formatHumanReadableAmount(bidQueueState.you.maxBid)}</strong>. Use{" "}
                            <strong>Switch to manual bidding</strong> below or <strong>Exit Auction</strong>{" "}
                            to leave. For auto-bid again: exit, re-join the queue, get promoted.
                            {bidQueueState.you.maxEditTradesRemaining != null ? (
                              <>
                                {" "}
                                <span className="bid-queue-you-card-meta">
                                  Max-edits left:{" "}
                                  <strong>{bidQueueState.you.maxEditTradesRemaining}</strong>
                                </span>
                              </>
                            ) : null}
                          </p>
                        </>
                      ) : (
                        <>
                          <span className="bid-queue-you-card-title">You&apos;re in the bid queue</span>
                          <div className="bid-queue-you-card-stats">
                            <div className="bid-queue-you-stat-pill">
                              <span className="bid-queue-you-stat-pill-label">Position</span>
                              <span className="bid-queue-you-stat-pill-value">
                                {queueYouPosition ?? "—"}
                                <span className="bid-queue-you-stat-pill-of"> / {queueYouTotal}</span>
                              </span>
                            </div>
                            <div className="bid-queue-you-stat-pill bid-queue-you-stat-pill--max">
                              <span className="bid-queue-you-stat-pill-label">Your max</span>
                              <span className="bid-queue-you-stat-pill-value">
                                {formatHumanReadableAmount(bidQueueState.you.maxBid)}
                              </span>
                            </div>
                          </div>
                          {bidQueueState.you.maxEditTradesRemaining != null ? (
                            <p className="bid-queue-you-card-meta">
                              Max-edits remaining:{" "}
                              <strong>{bidQueueState.you.maxEditTradesRemaining}</strong>
                            </p>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>
                )}
                {showBidQueuePanel && promotedFromQueue && bidQueueState.you && (
                  <div className="bid-queue-actions bid-queue-actions--promoted">
                    <button
                      type="button"
                      className="user-btn bid-queue-manual"
                      disabled={queueBusy}
                      onClick={handleResignProxyToManual}
                    >
                      Switch to manual bidding
                    </button>
                  </div>
                )}
                {showBidQueuePanel &&
                  !promotedFromQueue &&
                  (bidQueueState.you || showJoinQueueControls) && (
                  <div className="bid-queue-actions">
                    {showJoinQueueControls && (
                      <p className="bid-queue-hint">
                        Two bidders are active — join the queue below to wait for a slot. Your max
                        is locked until you are promoted; you cannot leave the queue early.
                      </p>
                    )}
                    <div className="bid-queue-max-row">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="bid-queue-max-input bid-queue-max-value"
                        placeholder="Enter value"
                        value={queueMaxInput}
                        onChange={handleQueueMaxInputChange}
                        disabled={queueBusy}
                      />
                      <select
                        className="bid-queue-max-input bid-queue-max-unit"
                        value={queueMaxUnit}
                        onChange={(e) => setQueueMaxUnit(e.target.value)}
                        disabled={queueBusy}
                      >
                        <option value="lakh">Lakh</option>
                        <option value="cr">Cr</option>
                      </select>
                    </div>
                    <p className="bid-queue-hint" style={{ marginTop: 6 }}>
                      Example: 6 + Cr means 6 Cr, 1.5 + Cr means 1.5 Cr, 30 + Lakh means 30 Lakh. Max allowed: 100 Cr.
                      {queueMaxPreview != null ? ` Converted value: ${formatHumanReadableAmount(queueMaxPreview)}.` : ""}
                    </p>
                    {showJoinQueueControls ? (
                      <button
                        type="button"
                        className="user-btn bid-queue-join"
                        disabled={queueBusy}
                        onClick={handleJoinBidQueue}
                      >
                        Join queue
                      </button>
                    ) : bidQueueState.you ? (
                      <>
                        {!promotedFromQueue ? (
                          <p className="bid-queue-no-leave-hint">
                            You can&apos;t leave the queue until you&apos;re promoted into the
                            auction. After that, use <strong>Exit Auction</strong> if you need to
                            stop.
                          </p>
                        ) : null}
                        <button
                          type="button"
                          className="user-btn bid-queue-update"
                          disabled={queueBusy}
                          onClick={handleUpdateQueueMax}
                        >
                          Update max
                        </button>
                      </>
                    ) : null}
                  </div>
                )}
                <button
                  className="user-btn place-bid"
                  onClick={handlePlaceBid}
                  disabled={placingBid || manualBidBlockedByQueue || promotedFromQueue}
                >
                  {promotedFromQueue
                    ? "Manual bid off — switch to manual or Exit"
                    : manualBidBlockedByQueue
                      ? "Manual bid paused (queue active)"
                      : placingBid
                        ? "Placing..."
                        : `Place Bid (${formatHumanReadableAmount(
                            determineBidIncrement(
                              playerDetails?.type,
                              topTwoBids.length > 0
                                ? topTwoBids[0]?.bidAmount || 0
                                : playerDetails?.basePrice || 0
                            )
                          )} step)`}
                </button>
                {bidError && <p className="error">{bidError}</p>}
              </div>
            )}

            {!hideAuctionActions && isAdmin && !isSold && (
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

            {!hideAuctionActions && isAdmin && isSold && (
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

            {!hideAuctionActions && !isAdmin && !isSold && (
              <div className="exit-auction-section">
                <button className="unique-exit-btn" onClick={handleExitAuction}>
                  Exit Auction 🚪
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {portraitLightboxOpen && portraitFullUrl && (
        <div
          className={`portrait-lightbox-overlay${hideAuctionActions ? ' portrait-lightbox--stack' : ''}`}
          onClick={() => setPortraitLightboxOpen(false)}
          role="presentation"
        >
          <button
            type="button"
            className="portrait-lightbox-close"
            aria-label="Close full image"
            onClick={(e) => {
              e.stopPropagation();
              setPortraitLightboxOpen(false);
            }}
          >
            {'\u00d7'}
          </button>
          <img
            src={portraitFullUrl}
            alt=""
            className="portrait-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default PlayerPopup;
