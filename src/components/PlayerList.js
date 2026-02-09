import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import styled, { keyframes } from "styled-components";
import { useSocket } from "../contexts/SocketContext";
import "../css/PlayerList.css";
import PlayerPopup from "./PlayerPopup";
import { API_ENDPOINTS } from "../const";
import TrophyLoader from "./TrophyLoader";
import NotificationBell from './NotificationBell';




const PlayerList = () => {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserName, setCurrentUserName] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [myActiveBidPlayerIds, setMyActiveBidPlayerIds] = useState([]);
  const [flashNotice, setFlashNotice] = useState(null);
  const flashTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_ENDPOINTS}/api/players/data`, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setPlayers(data);
      } catch (err) {
        console.error("Failed to fetch players:", err);
        setError("Failed to load players. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const showFlashNotice = useCallback((type, message) => {
    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current);
    }
    setFlashNotice({ type, message });
    flashTimeoutRef.current = setTimeout(() => {
      setFlashNotice(null);
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setCurrentUserName(user?.name || "");
    setCurrentUserId(user?.id || "");
    const userId = user?.id;
    if (!userId) return;
    const fetchMyActiveBids = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS}/api/users/${userId}/details`, {
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) return;
        const data = await response.json();
        const activeIds = (data.activeBids || [])
          .map((b) => b.player?._id || b.player?.id)
          .filter(Boolean);
        setMyActiveBidPlayerIds(activeIds);
      } catch {}
    };
    fetchMyActiveBids();
  }, []);
  
  // 🚀 REALTIME: Listen for real-time bid updates using shared socket
  const { on } = useSocket();
  
  useEffect(() => {
    if (!on) return;
    
    const cleanup1 = on('player_bid_update', (update) => {
      setPlayers(prevPlayers => {
        return prevPlayers.map(player => {
          if (player.id === update.playerId || player._id === update.playerId) {
            return {
              ...player,
              biddingPrice: update.bidAmount || update.currentBid || player.biddingPrice,
              currentBid: update.currentBid || update.bidAmount || player.currentBid,
              currentBidder: update.currentBidder || player.currentBidder,
              currentBidderId: update.currentBidder || player.currentBidderId,
              basePrice: update.bidAmount || update.currentBid || player.basePrice,
              isBidOn: update.currentBidder ? true : (player.isBidOn || false) // Mark as bidding if there's a current bidder
            };
          }
          return player;
        });
      });

      if (update.currentBidder && currentUserId && String(update.currentBidder) === String(currentUserId)) {
        setMyActiveBidPlayerIds((prev) =>
          prev.includes(update.playerId) ? prev : [...prev, update.playerId]
        );
      }
      if (
        update.playerId &&
        myActiveBidPlayerIds.includes(update.playerId) &&
        currentUserId &&
        String(update.currentBidder) !== String(currentUserId)
      ) {
        showFlashNotice("counter", `Counter bid on ${update.playerName || "your player"}`);
      }
    });
    
    const cleanup2 = on('player_sold_update', (update) => {
      setPlayers(prevPlayers => {
        return prevPlayers.map(player => {
          if (player.id === update.playerId || player._id === update.playerId) {
            return {
              ...player,
              status: 'Sold'
            };
          }
          return player;
        });
      });
    });
    
    const cleanup3 = on('bid_exit_notification', (update) => {
      if (update.playerId && myActiveBidPlayerIds.includes(update.playerId)) {
        showFlashNotice("exit", `Bid exit on ${update.playername || "your player"}`);
      }
    });

    return () => {
      cleanup1();
      cleanup2();
      cleanup3();
    };
  }, [on, currentUserId, myActiveBidPlayerIds, showFlashNotice]);

  const handlePlayerClick = useCallback((player) => {
    setSelectedPlayer(player);
  }, []);

  const handleClosePopup = useCallback(() => {
    setSelectedPlayer(null);
  }, []);

  const formatBasePrice = useCallback((price) => {
    const value = Number(price);
    if (value >= 10000000) return `${(value / 10000000).toFixed(2)} CR`;
    if (value >= 100000) return `${(value / 100000).toFixed(2)} Lakh`;
    return `${(value / 1000).toFixed(2)} K`;
  }, []);
  
  const unsoldPlayers = useMemo(() => 
    players.filter((player) => player.status !== "Sold"), 
    [players]
  );
  
  const sortedPlayers = useMemo(() => [...players]
    .filter((player) =>
      player.name.toLowerCase().includes(search.toLowerCase())
    )
    .filter((player) => (roleFilter ? player.role.toLowerCase() === roleFilter.toLowerCase() : true))
    .sort((a, b) => {
      switch (sortOption) {
        case "Sold":
          return a.status === "Sold" && b.status !== "Sold" ? -1 : b.status === "Sold" && a.status !== "Sold" ? 1 : 0;

        case "Unsold":
          return a.status !== "Sold" && b.status === "Sold" ? -1 : b.status !== "Sold" && a.status === "Sold" ? 1 : 0;

        case "Type":
          return a.type.localeCompare(b.type);

        case "Bidding":
          if (a.currentBidder && !b.currentBidder) return -1;
          if (!a.currentBidder && b.currentBidder) return 1;
          return 0;

        default:
          const maxA = Math.max(a.biddingPrice || 0, a.basePrice || 0);
          const maxB = Math.max(b.biddingPrice || 0, b.basePrice || 0);
          return maxB - maxA;
      }
    }), [players, search, roleFilter, sortOption]);

  const getRoleIcon = useCallback((role) => {
    switch (role.toLowerCase()) {
      case "batsman":
        return "🏌️";
      case "bowler":
        return "🏐";
      case "wicketkeeper":
        return "🧤";
      case "allrounder":
        return "🏏";
      default:
        return "🏏";
    }
  }, []);

  const getStatusIcon = useCallback((player) => {
    if (player.status === "Sold") {
      return (
        <span>

        </span>
      );
    } else {
      // Show "Bidding is On" if player has currentBidder OR isBidOn flag OR has active bids
      const isBidding = (player.currentBidder && player.currentBidder !== "N/A") || 
                       player.isBidOn || 
                       (player.currentBid && player.currentBid > 0);
      
      if (isBidding && player.status !== "Sold") {
        const type = (player.type || "").toLowerCase();
        const indicatorClass = type === "emerald" ? "bidding-indicator yellow" : "bidding-indicator green";
        return <span className={indicatorClass} title="Bidding is on" />;
      } else {
        return (
          <span className="flash-available">
            💎 <b>Available</b>
          </span>
        );
      }
    }
  }, []);


  const shouldBlink = useCallback((player) => {
    const biddingPrice = player.biddingPrice || player.basePrice || 0;
    return (
      player.currentBidder &&
      biddingPrice > 200000000 &&
      player.status !== "Sold"
    );
  }, []);

  const getMyBidIndicator = useCallback((player) => {
    if (!currentUserName) return null;
    const playerId = player.id || player._id;
    if (!myActiveBidPlayerIds.includes(playerId)) return null;
    const isWinning =
      (currentUserId && String(player.currentBidderId || player.currentBidder) === String(currentUserId)) ||
      (currentUserName && player.currentBidder === currentUserName);
    return (
      <span className={`my-bid-indicator ${isWinning ? "up" : "down"}`}>
        {isWinning ? "▲" : "▼"}
      </span>
    );
  }, [myActiveBidPlayerIds, currentUserName]);

  if (loading) {
    return <TrophyLoader message="Loading player board…" />;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="player-list">
      {flashNotice && (
        <div className={`player-flash ${flashNotice.type}`}>
          <div className="player-flash-card">
            <div className="player-flash-title">
              {flashNotice.type === "counter" ? "Counter Bid" : "Bid Exit"}
            </div>
            <div className="player-flash-message">{flashNotice.message}</div>
          </div>
        </div>
      )}
      <NotificationBell />
      {unsoldPlayers.length === 0 ? (
        <TrophyLoader message="No squads detected. Waiting for live feed…" />
      ) : (
      <>
      <div className="list-header">
        <div className="search-container">
          {!showSearch && (
            <button
              className="search-toggle-btn"
              onClick={() => setShowSearch(true)}
            >
              <span className="search-icon">🔍</span>
              <span className="search-text">Search Players</span>
            </button>
          )}
          {showSearch && (
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Search players by name..."
                className="modern-search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onBlur={() => setShowSearch(false)}
                autoFocus
              />
              <button 
                className="search-clear-btn"
                onClick={() => {
                  setSearch("");
                  setShowSearch(false);
                }}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* <div
          className="filter-sort-wrapper"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <select
            className="filter-dropdown-small super-cool-filter"
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "14px",
              backgroundColor: "#f8f9fa",
            }}
          >
            <option value="">Filter by Role</option>
            <option value="Batsman">🏌️ Batsman</option>
            <option value="Bowler">🏐 Bowler</option>
            <option value="Allrounder">🏏 Allrounder</option>
            <option value="WicketKeeper">🧤 WicketKeeper</option>
          </select>

          <select
            className="sort-dropdown-small"
            onChange={(e) => setSortOption(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "14px",
              background: "linear-gradient(90deg, #ff9a9e, #fad0c4)",
              color: "#fff",
              width: "25px"
            }}
          >
            <option value="">🎲 Sort</option>
            <option value="Sold">✨ Sold</option>
            <option value="Unsold">🛒 Unsold</option>
            <option value="Type">📋 Type</option>
            <option value="Bidding">🎯 Bidding is On</option>
          </select>
        </div> */}
      </div>
      <div className="player-grid">
        {sortedPlayers.map((player) => {
          if (player.status === "Sold") return null; // Don't render if the player is sold

          return (
            <div
              key={player.id}
              className={`player-row ${player.type.toLowerCase()} ${shouldBlink(player) ? "blinking" : ""
                }`}
              onClick={() => handlePlayerClick(player)}
            >
              <div className="player-cell player-icon">{getRoleIcon(player.role)}</div>
              <div className="player-cell">{player.name}</div>
              <div className="player-cell player-price">
                <div className="player-price-circle">
                  <span className="price-amount">{formatBasePrice(player.biddingPrice || player.basePrice || 0)}</span>
                </div>
              </div>
              <div className="player-cell team-sold">
                {getStatusIcon(player)}
                {getMyBidIndicator(player)}
              </div>
            </div>
          );
        })}

      </div>
      </>
      )}


      {selectedPlayer && (
        <PlayerPopup
          player={selectedPlayer}
          onClose={handleClosePopup}
          isAdmin={isAdmin}
          onDeactivated={(playerId) => {
            setPlayers((prevPlayers) =>
              prevPlayers.filter(
                (p) => (p.id || p._id) !== playerId
              )
            );
            handleClosePopup();
          }}
          onBidPlaced={(playerId) => {
            setMyActiveBidPlayerIds((prev) =>
              prev.includes(playerId) ? prev : [...prev, playerId]
            );
          }}
          onBidExited={(playerId) => {
            setMyActiveBidPlayerIds((prev) =>
              prev.filter((id) => id !== playerId)
            );
          }}
        />
      )}
    </div>
  );
};

// 🚀 PERFORMANCE: Memoize component to prevent unnecessary re-renders
export default React.memo(PlayerList);