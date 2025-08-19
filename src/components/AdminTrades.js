import React, { useEffect, useState } from 'react';
import { FaShieldAlt, FaThumbsUp, FaBan, FaCheckCircle, FaTimesCircle, FaCalendarAlt, FaUserShield } from 'react-icons/fa';
import { API_ENDPOINTS } from '../const';
import '../css/AdminTrades.css';

function AdminTrades() {
  const [user, setUser] = useState(null);
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [releasePending, setReleasePending] = useState([]);
  const [releaseHistory, setReleaseHistory] = useState([]);
  const [pickPending, setPickPending] = useState([]);
  const [pickHistory, setPickHistory] = useState([]);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const cachedUser = localStorage.getItem('user');
    if (cachedUser) setUser(JSON.parse(cachedUser));
  }, []);

  async function loadPending() {
    const r = await fetch(`${API_ENDPOINTS}/api/trades/admin/pending`);
    const j = await r.json();
    setPending(j || []);
  }

  async function loadHistory() {
    const r = await fetch(`${API_ENDPOINTS}/api/trades/admin/history`);
    const j = await r.json();
    setHistory(j || []);
  }

  async function loadReleasePending() {
    const r = await fetch(`${API_ENDPOINTS}/api/releases/admin/pending`);
    const j = await r.json();
    setReleasePending(j || []);
  }

  async function loadReleaseHistory() {
    const r = await fetch(`${API_ENDPOINTS}/api/releases/admin/history`);
    const j = await r.json();
    setReleaseHistory(j || []);
  }

  async function loadPickPending() {
    const r = await fetch(`${API_ENDPOINTS}/api/picks/admin/pending`);
    const j = await r.json();
    setPickPending(j || []);
  }

  async function loadPickHistory() {
    const r = await fetch(`${API_ENDPOINTS}/api/picks/admin/history`);
    const j = await r.json();
    setPickHistory(j || []);
  }

  useEffect(() => { loadPending(); loadHistory(); loadReleasePending(); loadReleaseHistory(); loadPickPending(); loadPickHistory(); }, []);

  async function decide(tradeId, decision) {
    try {
      const r = await fetch(`${API_ENDPOINTS}/api/trades/admin/${tradeId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId: user?.id, decision })
      });
      if (!r.ok) throw new Error('Failed');
      await loadPending();
      await loadHistory();
      setToast(decision === 'approve' ? 'Approved' : 'Rejected');
    } catch (e) {
      setToast('Action failed');
    }
  }

  async function decideRelease(releaseId, decision) {
    try {
      const r = await fetch(`${API_ENDPOINTS}/api/releases/admin/${releaseId}/decide`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminUserId: user?.id, decision })
      });
      if (!r.ok) throw new Error('Failed');
      await loadReleasePending();
      await loadReleaseHistory();
      setToast(decision === 'approve' ? 'Release Approved' : 'Release Rejected');
    } catch { setToast('Release action failed'); }
  }

  async function decidePick(pickId, decision) {
    try {
      const r = await fetch(`${API_ENDPOINTS}/api/picks/admin/${pickId}/decide`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminUserId: user?.id, decision })
      });
      if (!r.ok) throw new Error('Failed');
      await loadPickPending();
      await loadPickHistory();
      setToast(decision === 'approve' ? 'Pick Approved' : 'Pick Rejected');
    } catch { setToast('Pick action failed'); }
  }

  return (
    <div className="admin-trades-page">
      {toast && <div className="toast">{toast}</div>}
      <h1 className="gradient-title"><FaShieldAlt style={{ marginRight: 10 }} />Admin Trade Approvals</h1>
      <div className="list">
        {pending.map(t => (
          <div className="item" key={t._id}>
            <div className="line"><strong>{t.fromUser?.teamName}</strong> ↔ <strong>{t.toUser?.teamName}</strong></div>
            <div className="line players-inline">
              <span className="player-chip">
                {t.offeredPlayer?.name}
                {t.offeredPlayer?.type && (
                  <span className={`type-badge ${String(t.offeredPlayer.type).toLowerCase()}`}>{t.offeredPlayer.type}</span>
                )}
              </span>
              <span className="arrow">↔</span>
              <span className="player-chip">
                {t.requestedPlayer?.name}
                {t.requestedPlayer?.type && (
                  <span className={`type-badge ${String(t.requestedPlayer.type).toLowerCase()}`}>{t.requestedPlayer.type}</span>
                )}
              </span>
            </div>
            <div className="actions">
              <button className="btn btn-success" onClick={() => decide(t._id, 'approve')}><FaThumbsUp style={{ marginRight: 6 }} />Approve</button>
              <button className="btn btn-danger" onClick={() => decide(t._id, 'reject')}><FaBan style={{ marginRight: 6 }} />Reject</button>
            </div>
          </div>
        ))}
        {pending.length === 0 && <div className="empty">No pending trades</div>}
      </div>
      <h2>Admin Decisions</h2>
      <div className="history-grid">
        {history.map(t => {
          const approved = t.adminDecision?.status === 'approved';
          return (
            <div className="decision-card" key={t._id}>
              <div className="decision-header">
                <div className="status-wrap">
                  {approved ? (
                    <span className="badge badge-approved"><FaCheckCircle style={{ marginRight: 6 }} />Approved</span>
                  ) : (
                    <span className="badge badge-rejected"><FaTimesCircle style={{ marginRight: 6 }} />Rejected</span>
                  )}
                </div>
                <div className="meta-row">
                  <span className="meta-chip"><FaUserShield style={{ marginRight: 6 }} />{t.adminDecision?.decidedBy?.name || 'Admin'}</span>
                  <span className="meta-chip"><FaCalendarAlt style={{ marginRight: 6 }} />{t.adminDecision?.decidedAt ? new Date(t.adminDecision.decidedAt).toLocaleString() : '-'}</span>
                </div>
              </div>
              <div className="teams-row">
                <span className="team-pill"><strong>{t.fromUser?.teamName}</strong></span>
                <span className="arrow">↔</span>
                <span className="team-pill"><strong>{t.toUser?.teamName}</strong></span>
              </div>
              <div className="players-row">
                <span className="player-chip">
                  {t.offeredPlayer?.name}
                  {t.offeredPlayer?.type && (
                    <span className={`type-badge ${String(t.offeredPlayer.type).toLowerCase()}`}>{t.offeredPlayer.type}</span>
                  )}
                </span>
                <span className="arrow">↔</span>
                <span className="player-chip">
                  {t.requestedPlayer?.name}
                  {t.requestedPlayer?.type && (
                    <span className={`type-badge ${String(t.requestedPlayer.type).toLowerCase()}`}>{t.requestedPlayer.type}</span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
        {history.length === 0 && <div className="empty">No history yet</div>}
      </div>

      <h2>Release Requests (Pending)</h2>
      <div className="list">
        {releasePending.map(r => (
          <div className="item" key={r._id}>
            <div className="line"><strong>{r.user?.teamName}</strong> — {r.player?.name}
              {r.player?.type && (<span className={`type-badge ${String(r.player.type).toLowerCase()}`} style={{ marginLeft: 8 }}>{r.player.type}</span>)}
            </div>
            <div className="actions">
              <button className="btn btn-success" onClick={() => decideRelease(r._id, 'approve')}><FaThumbsUp style={{ marginRight: 6 }} />Approve</button>
              <button className="btn btn-danger" onClick={() => decideRelease(r._id, 'reject')}><FaBan style={{ marginRight: 6 }} />Reject</button>
            </div>
          </div>
        ))}
        {releasePending.length === 0 && <div className="empty">No pending release requests</div>}
      </div>

      <h2>Release Decisions</h2>
      <div className="history-grid">
        {releaseHistory.map(r => (
          <div className="decision-card" key={r._id}>
            <div className="decision-header">
              <div className="status-wrap">
                {r.adminDecision?.status === 'approved' ? (
                  <span className="badge badge-approved">Approved</span>
                ) : (
                  <span className="badge badge-rejected">Rejected</span>
                )}
              </div>
              <div className="meta-row">
                <span className="meta-chip">{r.adminDecision?.decidedBy?.name || 'Admin'}</span>
                <span className="meta-chip">{r.adminDecision?.decidedAt ? new Date(r.adminDecision.decidedAt).toLocaleString() : '-'}</span>
              </div>
            </div>
            <div className="teams-row">
              <span className="team-pill"><strong>{r.user?.teamName}</strong></span>
              <span className="arrow">→</span>
              <span className="player-chip">{r.player?.name}{r.player?.type && (<span className={`type-badge ${String(r.player.type).toLowerCase()}`} style={{ marginLeft: 8 }}>{r.player.type}</span>)}</span>
            </div>
          </div>
        ))}
        {releaseHistory.length === 0 && <div className="empty">No release history</div>}
      </div>

      <h2>Pick Requests (Pending)</h2>
      <div className="list">
        {pickPending.map(p => (
          <div className="item" key={p._id}>
            <div className="line"><strong>{p.user?.teamName}</strong> — {p.player?.name}{p.player?.type && (<span className={`type-badge ${String(p.player.type).toLowerCase()}`} style={{ marginLeft: 8 }}>{p.player.type}</span>)}</div>
            <div className="actions">
              <button className="btn btn-success" onClick={() => decidePick(p._id, 'approve')}>Approve</button>
              <button className="btn btn-danger" onClick={() => decidePick(p._id, 'reject')}>Reject</button>
            </div>
          </div>
        ))}
        {pickPending.length === 0 && <div className="empty">No pending pick requests</div>}
      </div>

      <h2>Pick Decisions</h2>
      <div className="history-grid">
        {pickHistory.map(p => (
          <div className="decision-card" key={p._id}>
            <div className="decision-header">
              <div className="status-wrap">
                {p.adminDecision?.status === 'approved' ? (
                  <span className="badge badge-approved">Approved</span>
                ) : (
                  <span className="badge badge-rejected">Rejected</span>
                )}
              </div>
              <div className="meta-row">
                <span className="meta-chip">{p.adminDecision?.decidedBy?.name || 'Admin'}</span>
                <span className="meta-chip">{p.adminDecision?.decidedAt ? new Date(p.adminDecision.decidedAt).toLocaleString() : '-'}</span>
              </div>
            </div>
            <div className="teams-row">
              <span className="team-pill"><strong>{p.user?.teamName}</strong></span>
              <span className="arrow">→</span>
              <span className="player-chip">{p.player?.name}{p.player?.type && (<span className={`type-badge ${String(p.player.type).toLowerCase()}`} style={{ marginLeft: 8 }}>{p.player.type}</span>)}</span>
            </div>
          </div>
        ))}
        {pickHistory.length === 0 && <div className="empty">No pick history</div>}
      </div>
    </div>
  );
}

export default AdminTrades;


