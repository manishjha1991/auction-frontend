import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSocket } from "../contexts/SocketContext";
import { API_ENDPOINTS } from "../const";
import "../css/AdminPurseAudit.css";

function formatAmount(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "-";
  if (n >= 10000000) return `Rs ${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `Rs ${(n / 100000).toFixed(2)} Lakh`;
  return `Rs ${n.toLocaleString("en-IN")}`;
}

function formatSignedAmount(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "-";
  if (n === 0) return "Rs 0";
  return `${n > 0 ? "+" : "-"} ${formatAmount(Math.abs(n))}`;
}

export default function AdminPurseAudit() {
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const loadInFlightRef = useRef(false);
  const pendingRef = useRef(false);
  const refreshSoonRef = useRef(null);
  const { on } = useSocket();

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const isAdmin = !!currentUser?.isAdmin;

  const load = useCallback(async () => {
    if (!isAdmin) return;
    if (loadInFlightRef.current) {
      pendingRef.current = true;
      return;
    }
    loadInFlightRef.current = true;
    setLoading(true);
    setError("");
    try {
      const token = currentUser?.token;
      if (!token) throw new Error("Authentication required. Please login again.");

      const res = await fetch(`${API_ENDPOINTS}/api/users/admin/purse-audit`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to load purse audit");
      setRows(Array.isArray(data.teams) ? data.teams : []);
      setTotals(data.totals || null);
      setLastUpdatedAt(new Date());
    } catch (e) {
      setError(e.message || "Failed to load purse audit");
    } finally {
      setLoading(false);
      loadInFlightRef.current = false;
      if (pendingRef.current) {
        pendingRef.current = false;
        load();
      }
    }
  }, [currentUser?.token, isAdmin]);

  const scheduleRefreshSoon = useCallback(() => {
    if (refreshSoonRef.current) return;
    refreshSoonRef.current = setTimeout(() => {
      refreshSoonRef.current = null;
      load();
    }, 500);
  }, [load]);

  useEffect(() => {
    if (!isAdmin) return;
    load();
  }, [isAdmin, load]);

  useEffect(() => {
    if (!isAdmin || !autoRefresh) return undefined;
    const id = setInterval(() => {
      load();
    }, 5000);
    return () => clearInterval(id);
  }, [autoRefresh, isAdmin, load]);

  useEffect(() => {
    if (!on || !isAdmin) return undefined;
    const c1 = on("player_bid_update", scheduleRefreshSoon);
    const c2 = on("bid_exit_notification", scheduleRefreshSoon);
    const c3 = on("bid_queue_updated", scheduleRefreshSoon);
    const c4 = on("bid_queue_personal", scheduleRefreshSoon);
    const c5 = on("player_sold_update", scheduleRefreshSoon);
    const c6 = on("player_sold", scheduleRefreshSoon);
    return () => {
      c1();
      c2();
      c3();
      c4();
      c5();
      c6();
    };
  }, [isAdmin, on, scheduleRefreshSoon]);

  useEffect(() => {
    return () => {
      if (refreshSoonRef.current) clearTimeout(refreshSoonRef.current);
    };
  }, []);

  if (!isAdmin) {
    return (
      <div className="admin-purse-audit">
        <h2>Purse Audit Ledger</h2>
        <p className="audit-error">Only admin can access this page.</p>
      </div>
    );
  }

  return (
    <div className="admin-purse-audit">
      <div className="audit-header">
        <div>
          <h2>Purse Audit Ledger</h2>
          <p>
            Live financial audit by team: sold spend, manual bid locks, queue locks, promoted queue
            locks, and expected vs actual purse.
          </p>
        </div>
        <div className="audit-actions">
          <button type="button" onClick={load} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh now"}
          </button>
          <button type="button" onClick={() => setAutoRefresh((v) => !v)}>
            Auto: {autoRefresh ? "ON (5s)" : "OFF"}
          </button>
        </div>
      </div>

      <div className="audit-meta">
        Last updated: {lastUpdatedAt ? lastUpdatedAt.toLocaleTimeString("en-IN") : "-"}
      </div>

      {error ? <div className="audit-error">{error}</div> : null}

      {totals ? (
        <div className="audit-summary-grid">
          <div className="audit-summary-card">
            <span>Teams</span>
            <strong>{totals.teamCount || 0}</strong>
          </div>
          <div className="audit-summary-card">
            <span>Committed Total</span>
            <strong>{formatAmount(totals.committedTotal)}</strong>
          </div>
          <div className="audit-summary-card">
            <span>Actual Purse</span>
            <strong>{formatAmount(totals.actualPurse)}</strong>
          </div>
          <div className="audit-summary-card">
            <span>Expected Purse</span>
            <strong>{formatAmount(totals.expectedPurse)}</strong>
          </div>
          <div className={`audit-summary-card ${Number(totals.delta) === 0 ? "ok" : "warn"}`}>
            <span>Total Delta</span>
            <strong>{formatSignedAmount(totals.delta)}</strong>
          </div>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="audit-empty">No team rows available right now.</div>
      ) : (
        <div className="audit-team-list">
          {rows.map((team) => {
            const isBalanced = Number(team?.purse?.delta || 0) === 0;
            return (
              <div key={team.userId} className="audit-team-card">
                <div className="audit-team-top">
                  <div>
                    <h3>{team.teamName}</h3>
                    <p>{team.displayName}</p>
                  </div>
                  <span className={`audit-balance-pill ${isBalanced ? "ok" : "warn"}`}>
                    {isBalanced ? "Balanced" : `Delta ${formatSignedAmount(team.purse.delta)}`}
                  </span>
                </div>

                <div className="audit-team-metrics">
                  <div>
                    <span>Actual Purse</span>
                    <strong>{formatAmount(team.purse.actual)}</strong>
                  </div>
                  <div>
                    <span>Expected Purse</span>
                    <strong>{formatAmount(team.purse.expected)}</strong>
                  </div>
                  <div>
                    <span>Committed</span>
                    <strong>{formatAmount(team.breakdown.committedTotal)}</strong>
                  </div>
                  <div>
                    <span>Sold Players</span>
                    <strong>
                      {team.counts.soldPlayers}
                      {team.counts.retainedSoldPlayers > 0 ? (
                        <em className="retained-inline-count">
                          {" "}
                          ({team.counts.retainedSoldPlayers} retained)
                        </em>
                      ) : null}
                    </strong>
                  </div>
                </div>

                <div className="audit-breakdown-grid">
                  <div className="audit-chip">
                    <span>Sold Spend</span>
                    <strong>{formatAmount(team.breakdown.soldSpent)}</strong>
                  </div>
                  <div className="audit-chip">
                    <span>Manual Bid Locked</span>
                    <strong>{formatAmount(team.breakdown.manualBidLocked)}</strong>
                  </div>
                  <div className="audit-chip">
                    <span>Queue-Promoted Bid Locked</span>
                    <strong>{formatAmount(team.breakdown.queuePromotedBidLocked)}</strong>
                  </div>
                  <div className="audit-chip">
                    <span>Queue Waiting Lock</span>
                    <strong>{formatAmount(team.breakdown.queueLockedWaiting)}</strong>
                  </div>
                  <div className="audit-chip">
                    <span>Queue Proxy Reserve</span>
                    <strong>{formatAmount(team.breakdown.queueLockedProxyReserve)}</strong>
                  </div>
                </div>

                <div className="audit-detail-wrap">
                  <details>
                    <summary>
                      Active bids ({team.details.activeBids.length})
                    </summary>
                    <div className="audit-detail-table">
                      <div className="row head">
                        <span>Player</span>
                        <span>Source</span>
                        <span>Amount</span>
                      </div>
                      {team.details.activeBids.map((r, idx) => (
                        <div className="row" key={`${team.userId}-bid-${idx}`}>
                          <span>{r.playerName}</span>
                          <span>{r.source === "queue_promoted" ? "Queue promoted" : "Manual"}</span>
                          <span>{formatAmount(r.amount)}</span>
                        </div>
                      ))}
                      {team.details.activeBids.length === 0 ? (
                        <div className="row empty">
                          <span>No active bid locks</span>
                        </div>
                      ) : null}
                    </div>
                  </details>

                  <details>
                    <summary>
                      Queue locks ({team.details.queueLocks.length})
                    </summary>
                    <div className="audit-detail-table">
                      <div className="row head">
                        <span>Player</span>
                        <span>Status</span>
                        <span>Locked</span>
                      </div>
                      {team.details.queueLocks.map((r, idx) => (
                        <div className="row" key={`${team.userId}-queue-${idx}`}>
                          <span>{r.playerName}</span>
                          <span>{r.status === "active_proxy" ? "Promoted proxy" : "Queued"}</span>
                          <span>{formatAmount(r.amount)}</span>
                        </div>
                      ))}
                      {team.details.queueLocks.length === 0 ? (
                        <div className="row empty">
                          <span>No queue locks</span>
                        </div>
                      ) : null}
                    </div>
                  </details>

                  <details>
                    <summary>
                      Sold players ({team.details.soldPlayers.length})
                    </summary>
                    <div className="audit-detail-table">
                      <div className="row head">
                        <span>Player</span>
                        <span>Type</span>
                        <span>Spent</span>
                      </div>
                      {team.details.soldPlayers.map((r, idx) => (
                        <div className="row" key={`${team.userId}-sold-${idx}`}>
                          <span>{r.playerName}</span>
                          <span>
                            {r.playerType || "-"}
                            {r.isRetained ? (
                              <span className="retained-badge">Retained</span>
                            ) : null}
                          </span>
                          <span>{formatAmount(r.amount)}</span>
                        </div>
                      ))}
                      {team.details.soldPlayers.length === 0 ? (
                        <div className="row empty">
                          <span>No sold players yet</span>
                        </div>
                      ) : null}
                    </div>
                  </details>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
