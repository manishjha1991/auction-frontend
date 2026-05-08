import React, { useEffect, useMemo, useState } from "react";
import { API_ENDPOINTS } from "../const";

function formatAmount(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n)) return "-";
  if (n >= 10000000) return `Rs ${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `Rs ${(n / 100000).toFixed(2)} Lakh`;
  return `Rs ${n.toLocaleString("en-IN")}`;
}

export default function AdminQueueMonitor() {
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const isAdmin = !!currentUser?.isAdmin;

  const totals = useMemo(() => {
    const players = rows.length;
    const queuedUsers = rows.reduce((acc, r) => acc + (r.queueCount || 0), 0);
    const proxyUsers = rows.reduce((acc, r) => acc + (r.activeProxy ? 1 : 0), 0);
    return { players, queuedUsers, proxyUsers };
  }, [rows]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = user?.token;
      if (!token) throw new Error("Authentication required. Please login again.");

      const res = await fetch(`${API_ENDPOINTS}/api/bid-queue/admin/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to load queue overview");
      setRows(Array.isArray(data.rows) ? data.rows : []);
      setLastUpdatedAt(new Date());
    } catch (e) {
      setError(e.message || "Failed to load queue overview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    if (!autoRefresh) return undefined;
    const id = setInterval(() => {
      load();
    }, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, isAdmin]);

  if (!isAdmin) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
        <h2>Admin Queue Monitor</h2>
        <div style={{ color: "#b91c1c" }}>Only admin can view this page.</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 16 }}>
      <h2 style={{ marginBottom: 8 }}>Admin Queue Monitor</h2>
      <p style={{ marginTop: 0, color: "#6b7280" }}>
        Live view of who is in queue, on which player, with max bid and queue position.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <button type="button" onClick={load} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh now"}
        </button>
        <button type="button" onClick={() => setAutoRefresh((v) => !v)}>
          Auto refresh: {autoRefresh ? "ON (5s)" : "OFF"}
        </button>
        <span style={{ color: "#4b5563", fontSize: 13, alignSelf: "center" }}>
          Last updated: {lastUpdatedAt ? lastUpdatedAt.toLocaleTimeString("en-IN") : "-"}
        </span>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 12px" }}>
          Players in queue list: <strong>{totals.players}</strong>
        </div>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 12px" }}>
          Total waiting users: <strong>{totals.queuedUsers}</strong>
        </div>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 12px" }}>
          Active proxy users: <strong>{totals.proxyUsers}</strong>
        </div>
      </div>

      {error ? <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div> : null}

      {rows.length === 0 ? (
        <div style={{ color: "#6b7280" }}>No queue rows found right now.</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {rows.map((row) => (
            <div
              key={row.playerId}
              style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: "#fff" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <strong>{row.playerName}</strong> ({row.playerType})
                  <div style={{ fontSize: 13, color: "#6b7280" }}>
                    Queue: {row.queueCount} | Active: {row.isActive ? "Yes" : "No"} | Sold:{" "}
                    {row.isSold ? "Yes" : "No"}
                  </div>
                </div>
                <div style={{ textAlign: "right", fontSize: 13 }}>
                  <div>
                    Top bid:{" "}
                    <strong>
                      {row.topActiveBid
                        ? `${formatAmount(row.topActiveBid.amount)} (${row.topActiveBid.bidderTeam || row.topActiveBid.bidderName})`
                        : "-"}
                    </strong>
                  </div>
                  <div>Updated: {row.updatedAt ? new Date(row.updatedAt).toLocaleTimeString("en-IN") : "-"}</div>
                </div>
              </div>

              {row.activeProxy ? (
                <div style={{ marginTop: 8, fontSize: 13, color: "#0f766e" }}>
                  Auto-bid proxy active: <strong>{row.activeProxy.teamName || row.activeProxy.name}</strong> up to{" "}
                  <strong>{formatAmount(row.activeProxy.maxBid)}</strong>
                </div>
              ) : null}

              <div style={{ marginTop: 10, overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 6 }}>Pos</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 6 }}>Team</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 6 }}>Max Bid</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 6 }}>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(row.queued || []).map((q) => (
                      <tr key={`${row.playerId}-${q.userId || q.position}`}>
                        <td style={{ padding: 6, borderBottom: "1px solid #f3f4f6" }}>{q.position}</td>
                        <td style={{ padding: 6, borderBottom: "1px solid #f3f4f6" }}>{q.teamName || q.name}</td>
                        <td style={{ padding: 6, borderBottom: "1px solid #f3f4f6" }}>{formatAmount(q.maxBid)}</td>
                        <td style={{ padding: 6, borderBottom: "1px solid #f3f4f6" }}>
                          {q.joinedAt ? new Date(q.joinedAt).toLocaleTimeString("en-IN") : "-"}
                        </td>
                      </tr>
                    ))}
                    {(!row.queued || row.queued.length === 0) && (
                      <tr>
                        <td colSpan={4} style={{ padding: 8, color: "#6b7280" }}>
                          No waiting queue users on this player.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
