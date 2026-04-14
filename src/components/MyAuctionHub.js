import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useSocket } from "../contexts/SocketContext";
import { API_ENDPOINTS } from "../const";
import PlayerAvatar from "./PlayerAvatar";
import PlayerPopup from "./PlayerPopup";
import "../css/MyAuctionHub.css";

function formatCurrency(amount) {
  if (amount == null || Number.isNaN(Number(amount))) return "—";
  const n = Number(amount);
  const r = "\u20B9";
  if (n >= 10000000) return `${r}${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `${r}${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `${r}${(n / 1000).toFixed(2)} K`;
  return `${r}${n.toLocaleString("en-IN")}`;
}

function playerStubFromBid(bid) {
  return {
    id: bid.playerId,
    _id: bid.playerId,
    name: bid.playerName,
    type: bid.playerType || "Gold",
    role: bid.playerRole || "Batsman",
    profilePicture: bid.profilePicture,
    basePrice: bid.basePrice ?? 0,
    status: "Unsold",
  };
}

function playerStubFromQueue(q) {
  return {
    id: q.playerId,
    _id: q.playerId,
    name: q.playerName,
    type: q.playerType || "Gold",
    role: "Batsman",
    profilePicture: q.profilePicture,
    basePrice: 0,
    status: "Unsold",
  };
}

function playerStubFromDemand(d) {
  if (!d?.playerId) return null;
  return {
    id: d.playerId,
    _id: d.playerId,
    name: d.playerName || "?",
    type: "Gold",
    role: "Batsman",
    profilePicture: d.profilePicture,
    basePrice: 0,
    status: "Unsold",
  };
}

function opponentShortLabel(bid) {
  const name = (bid.otherBidderName || "").trim();
  const abbr = (bid.otherBidderAbbr || "").trim();
  if (name && abbr) return `${name} (${abbr})`;
  if (name) return name;
  if (abbr) return abbr;
  return "Opponent";
}

function coachForBid(bid, myPurse) {
  const oppTag = opponentShortLabel(bid);
  if (bid.isLosing) {
    const lines = [
      `${oppTag} is ahead on this lot — stay within your max; one clean counter can swing it.`,
      `Trailing ${oppTag} right now. Auctions turn quickly — bid with a plan, not panic.`,
      `Second highest vs ${oppTag}. Protect your purse and only jump when it fits your squad.`,
      `You're behind ${oppTag} on price, not out of the contest. Know your ceiling and hold your nerve.`,
    ];
    const i = Math.abs((bid.playerName || "").length + (bid.bidAmount || 0)) % lines.length;
    return { tone: "lose", text: lines[i] };
  }
  if (bid.isWinning) {
    const opp = bid.otherBidderPurse;
    const purse = myPurse != null ? Number(myPurse) : null;
    if (opp != null && purse != null && opp < purse * 0.35) {
      return {
        tone: "caution",
        text: `${oppTag}'s purse looks thin — you have leverage, but don't blow past your own cap chasing them.`,
      };
    }
    if (opp != null && purse != null && opp > purse * 1.25) {
      return {
        tone: "caution",
        text: `You're winning, yet ${oppTag} still has more war chest. Raise only if this player is worth it to you.`,
      };
    }
    return {
      tone: "win",
      text: `Highest bidder vs ${oppTag}. If the price already matches your plan, holding is a strong play.`,
    };
  }
  return { tone: "neutral", text: "" };
}

export default function MyAuctionHub() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hubPlayer, setHubPlayer] = useState(null);
  const [clearingNotifs, setClearingNotifs] = useState(false);
  const fetchInFlight = useRef(false);
  const { on } = useSocket();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);
  const userId = user?.id || user?._id;

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setError("Not logged in.");
      return;
    }
    if (fetchInFlight.current) return;
    fetchInFlight.current = true;
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/bids/my-auction-hub/${userId}`);
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e) {
      setError(e.message || "Could not load auction hub.");
    } finally {
      setLoading(false);
      fetchInFlight.current = false;
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!on) return;
    const refresh = () => load();
    const c1 = on("player_bid_update", refresh);
    const c2 = on("bid_notification", refresh);
    const c3 = on("bid_exit_notification", refresh);
    const c4 = on("bid_queue_updated", refresh);
    const c5 = on("bid_queue_personal", refresh);
    const c6 = on("player_sold_update", refresh);
    const c7 = on("player_sold", refresh);
    const c8 = on("player_watchers_update", refresh);
    return () => {
      c1();
      c2();
      c3();
      c4();
      c5();
      c6();
      c7();
      c8();
    };
  }, [on, load]);

  useEffect(() => {
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, [load]);

  const clearMyBidNotifications = useCallback(async () => {
    if (!userId) return;
    setClearingNotifs(true);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/notifications/bid/clear-for-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: String(userId) }),
      });
      if (!res.ok) throw new Error("Could not clear");
      await load();
    } catch (e) {
      setError(e.message || "Clear failed");
    } finally {
      setClearingNotifs(false);
    }
  }, [userId, load]);

  if (loading && !data) {
    return (
      <div className="my-auction-hub">
        <p className="mah-empty" style={{ maxWidth: 1100, margin: "40px auto", textAlign: "center" }}>
          Loading your auction command center…
        </p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="my-auction-hub">
        <div className="mah-error">{error}</div>
      </div>
    );
  }

  const me = data?.me;
  const running = data?.runningBids || [];
  const queues = data?.queueMemberships || [];
  const notifs = data?.bidNotifications || [];
  const demand = data?.demand || { globalTop: null, yourTop: null };

  return (
    <div className="my-auction-hub">
      <header className="mah-header">
        <div className="mah-title-block">
          <h1>My auction HQ</h1>
          <p>Live purses, active duels, queues, and alerts — one screen.</p>
        </div>
        <div className="mah-live-pill">
          <span className="mah-live-dot" aria-hidden />
          Real-time
        </div>
      </header>

      {me?.isAdmin && (
        <div className="mah-admin-note">
          Admin accounts don&apos;t track auction duels here. Use Live Bidding or Teams for board view.
        </div>
      )}

      {error && <div className="mah-error" style={{ marginBottom: 18 }}>{error}</div>}

      <div className="mah-grid">
        <section className="mah-card mah-section-wide">
          <h2>Live demand (watchers)</h2>
          <p className="mah-demand-hint">
            Based on users currently viewing a player profile (socket rooms). Tap a card to open bidding.
          </p>
          <div className="mah-demand-row">
            <button
              type="button"
              className="mah-demand-card"
              disabled={!demand.globalTop}
              onClick={() => demand.globalTop && setHubPlayer(playerStubFromDemand(demand.globalTop))}
            >
              <div className="mah-demand-label">Most watched (platform)</div>
              {demand.globalTop ? (
                <>
                  <div className="mah-demand-name">{demand.globalTop.playerName}</div>
                  <div className="mah-demand-count">{demand.globalTop.count} watching</div>
                </>
              ) : (
                <div className="mah-empty">No live viewers in rooms yet.</div>
              )}
            </button>
            <button
              type="button"
              className="mah-demand-card mah-demand-card--yours"
              disabled={!demand.yourTop}
              onClick={() => demand.yourTop && setHubPlayer(playerStubFromDemand(demand.yourTop))}
            >
              <div className="mah-demand-label">Your hottest lot</div>
              {demand.yourTop ? (
                <>
                  <div className="mah-demand-name">{demand.yourTop.playerName}</div>
                  <div className="mah-demand-count">{demand.yourTop.count} watching</div>
                </>
              ) : (
                <div className="mah-empty">No overlap with your bids/queues, or no viewers.</div>
              )}
            </button>
          </div>
        </section>

        <section className="mah-card mah-section-wide">
          <h2>Purse snapshot</h2>
          <div className="mah-purse-row">
            <div className="mah-purse-chip mah-mine">
              <div className="mah-purse-label">Your purse left</div>
              <div className="mah-purse-value">{formatCurrency(me?.purse)}</div>
            </div>
            {running.length > 0 && (
              <div className="mah-purse-chip">
                <div className="mah-purse-label">Active duels</div>
                <div className="mah-purse-value">{running.length}</div>
              </div>
            )}
          </div>
        </section>

        <section className="mah-card mah-section-wide">
          <h2>Running bids</h2>
          <p className="mah-tap-hint">Tap a row to place a bid, join queue, or exit.</p>
          {running.length === 0 ? (
            <p className="mah-empty">No active bids right now. Open the player board to join a lot.</p>
          ) : (
            running.map((bid) => {
              const coach = coachForBid(bid, me?.purse);
              const oppLabel = opponentShortLabel(bid);
              const roleTitle = bid.isWinning
                ? "You're the highest bidder"
                : bid.isLosing
                  ? "You're the second bidder (trailing)"
                  : "You're in this auction";
              const roleDetail = bid.isWinning
                ? `Leading on ${bid.playerName} — current high ${formatCurrency(bid.leadingBidAmount)}`
                : bid.isLosing
                  ? `Behind on ${bid.playerName} — they lead at ${formatCurrency(bid.leadingBidAmount)}`
                  : `Active on ${bid.playerName}`;
              return (
                <button
                  key={String(bid.playerId)}
                  type="button"
                  className="mah-bid-card"
                  onClick={() => setHubPlayer(playerStubFromBid(bid))}
                >
                  <PlayerAvatar
                    className="mah-bid-avatar"
                    profilePicture={bid.profilePicture}
                    name={bid.playerName}
                    size={48}
                  />
                  <div className="mah-bid-main">
                    <h3 className="mah-duel-player">{bid.playerName}</h3>
                    <p className="mah-duel-role-title">{roleTitle}</p>
                    <p className="mah-duel-role-detail">{roleDetail}</p>
                    <div className="mah-duel-bids-line">
                      Your latest bid <strong>{formatCurrency(bid.bidAmount)}</strong>
                      {(bid.isWinning || bid.isLosing) && (
                        <>
                          {" · "}
                          vs <strong>{oppLabel}</strong>
                        </>
                      )}
                    </div>
                    <div className="mah-duel-purses">
                      <div className="mah-duel-purse-col mah-duel-purse-col--yours">
                        <span className="mah-duel-purse-label">Your purse left</span>
                        <span className="mah-duel-purse-amt">{formatCurrency(me?.purse)}</span>
                      </div>
                      <div className="mah-duel-purse-col mah-duel-purse-col--opp">
                        <span className="mah-duel-purse-label">{oppLabel} · purse left (est.)</span>
                        <span className="mah-duel-purse-amt">
                          {bid.otherBidderPurse != null ? formatCurrency(bid.otherBidderPurse) : "—"}
                        </span>
                      </div>
                    </div>
                    {coach.text && (
                      <div className={`mah-coach ${coach.tone === "lose" ? "lose" : coach.tone === "caution" ? "caution" : ""}`}>
                        <span className="mah-coach-label">Tip</span>
                        {coach.text}
                      </div>
                    )}
                  </div>
                  <span className={`mah-status ${bid.isWinning ? "win" : bid.isLosing ? "lose" : "win"}`}>
                    {bid.isWinning ? "Highest" : bid.isLosing ? "2nd" : "Active"}
                  </span>
                </button>
              );
            })
          )}
        </section>

        <section className="mah-card mah-section-wide">
          <h2>Bid queues</h2>
          {queues.length === 0 ? (
            <p className="mah-empty">You&apos;re not in any queues. Join from a player popup when a duel is on.</p>
          ) : (
            queues.map((q) => (
              <div key={q.playerId} className="mah-queue-item">
                <button
                  type="button"
                  className="mah-queue-open"
                  onClick={() => setHubPlayer(playerStubFromQueue(q))}
                >
                  Open
                </button>
                <div className="mah-queue-body">
                  <strong>{q.playerName}</strong>
                  <div className="mah-bid-meta">{q.label}</div>
                  {q.status === "queued" && q.aheadCount != null && (
                    <div className="mah-queue-detail">
                      Position <strong>{q.position}</strong> of {q.queueLength}:{" "}
                      <strong>{q.aheadCount}</strong> ahead, <strong>{q.behindCount}</strong> behind you
                    </div>
                  )}
                  {q.status === "active_proxy" && (
                    <div className="mah-queue-detail mah-queue-detail--proxy">
                      Promoted — auto-bid only (no manual raise). Use Exit in popup.
                    </div>
                  )}
                </div>
                <div className="mah-queue-pos">
                  Max {formatCurrency(q.maxBid)}
                  {q.maxEditTradesRemaining != null && (
                    <span className="mah-bid-meta"> · edits: {q.maxEditTradesRemaining}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </section>

        <section className="mah-card mah-section-wide">
          <div className="mah-notif-header">
            <h2>Your bid notifications</h2>
            {notifs.length > 0 && (
              <button
                type="button"
                className="mah-clear-notifs"
                disabled={clearingNotifs}
                onClick={clearMyBidNotifications}
              >
                {clearingNotifs ? "Clearing…" : "Clear my alerts"}
              </button>
            )}
          </div>
          <p className="mah-notif-sub">Last 5 alerts where you&apos;re the current or second bidder.</p>
          {notifs.length === 0 ? (
            <p className="mah-empty">No recent alerts where you&apos;re involved.</p>
          ) : (
            notifs.map((n) => (
              <div key={String(n._id)} className="mah-notif">
                <div>{n.message || `${n.playername || "Player"} · bid activity`}</div>
                <div className="mah-bid-meta">
                  {n.playername && <span>{n.playername} · </span>}
                  {n.currentBid != null && <span>Current {formatCurrency(n.currentBid)}</span>}
                </div>
                <time dateTime={n.timestamp}>{n.timestamp ? new Date(n.timestamp).toLocaleString() : ""}</time>
              </div>
            ))
          )}
        </section>
      </div>

      {hubPlayer && (
        <PlayerPopup
          player={hubPlayer}
          onClose={() => setHubPlayer(null)}
          onBidPlaced={() => load()}
          onBidExited={() => load()}
        />
      )}
    </div>
  );
}
