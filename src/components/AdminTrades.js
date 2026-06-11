import React, { useEffect, useState } from 'react';
import { FaShieldAlt, FaThumbsUp, FaBan, FaCheckCircle, FaTimesCircle, FaCalendarAlt, FaUserShield, FaCheckCircle as FaCheckCircleIcon, FaTimesCircle as FaTimesCircleIcon, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { API_ENDPOINTS } from '../const';
import '../css/AdminTrades.css';

// Sexy Alert Component
const SexyAlert = ({ alert, onClose }) => {
  if (!alert) return null;

  const getIcon = () => {
    switch (alert.type) {
      case 'success': return <FaCheckCircleIcon />;
      case 'error': return <FaTimesCircleIcon />;
      case 'warning': return <FaExclamationTriangle />;
      default: return <FaInfoCircle />;
    }
  };

  const getBgColor = () => {
    switch (alert.type) {
      case 'success': return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      case 'error': return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
      case 'warning': return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
      default: return 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
    }
  };

  return (
    <div className="sexy-alert-overlay">
      <div className="sexy-alert" style={{ background: getBgColor() }}>
        <div className="alert-icon">{getIcon()}</div>
        <div className="alert-content">
          <h3 className="alert-title">{alert.title}</h3>
          <p className="alert-message">{alert.message}</p>
        </div>
        <button className="alert-close" onClick={onClose}>×</button>
        <div className="alert-particles">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="particle" style={{ '--delay': `${i * 0.1}s` }}></div>
          ))}
        </div>
      </div>
    </div>
  );
};

function AdminTrades() {
  const [user, setUser] = useState(null);
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [releasePending, setReleasePending] = useState([]);
  const [releaseHistory, setReleaseHistory] = useState([]);
  const [pickPending, setPickPending] = useState([]);
  const [pickHistory, setPickHistory] = useState([]);
  const [bundlePending, setBundlePending] = useState([]);
  const [bundleAutoApprove, setBundleAutoApprove] = useState(true);
  const [bundleLoading, setBundleLoading] = useState(false);
  const [bundleError, setBundleError] = useState('');
  const [toast, setToast] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingStates, setLoadingStates] = useState({
    tradeApprove: {},
    tradeReject: {},
    releaseApprove: {},
    releaseReject: {},
    pickApprove: {},
    pickReject: {}
  });
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const cachedUser = localStorage.getItem('user');
    if (cachedUser) setUser(JSON.parse(cachedUser));
  }, []);

  useEffect(() => {
    if (window.location.hash === '#trade-bundles') {
      const t = setTimeout(() => {
        document.getElementById('trade-bundles')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
      return () => clearTimeout(t);
    }
  }, [bundlePending.length]);

  async function loadPending() {
    const q = user?.id ? `?adminUserId=${user.id}` : '';
    const r = await fetch(`${API_ENDPOINTS}/api/trades/admin/pending${q}`);
    const j = await r.json();
    setPending(Array.isArray(j) ? j : []);
  }

  async function loadBundlePending() {
    setBundleLoading(true);
    setBundleError('');
    try {
      const q = user?.id ? `?adminUserId=${encodeURIComponent(user.id)}` : '';
      const r = await fetch(`${API_ENDPOINTS}/api/trades/bundles/admin/pending${q}`);
      const j = await r.json();
      if (!r.ok) {
        throw new Error(j.message || 'Failed to load bundle trades');
      }
      if (Array.isArray(j)) {
        setBundlePending(j);
        setBundleAutoApprove(true);
      } else {
        setBundlePending(Array.isArray(j.bundles) ? j.bundles : []);
        setBundleAutoApprove(j.bundleAutoApprove !== false);
      }
    } catch (err) {
      setBundlePending([]);
      setBundleError(err.message || 'Could not load bundle trades');
    } finally {
      setBundleLoading(false);
    }
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
    try {
      const r = await fetch(`${API_ENDPOINTS}/api/picks/admin/history`);
      const j = await r.json();
      setPickHistory(j || []);
    } catch (error) {
      console.error('Error loading pick history:', error);
      setPickHistory([]);
    }
  }

  useEffect(() => {
    if (!user?.id) return;
    loadPending();
    loadHistory();
    loadBundlePending();
    loadReleasePending();
    loadReleaseHistory();
    loadPickPending();
    loadPickHistory();
    const timer = setInterval(loadBundlePending, 20000);
    return () => clearInterval(timer);
  }, [user?.id]);

  async function decide(tradeId, decision) {
    const loadingKey = decision === 'approve' ? 'tradeApprove' : 'tradeReject';
    setLoadingStates(prev => ({ ...prev, [loadingKey]: { ...prev[loadingKey], [tradeId]: true } }));
    
    try {
      const r = await fetch(`${API_ENDPOINTS}/api/trades/admin/${tradeId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId: user?.id, decision })
      });
      
      if (!r.ok) {
        let errorMessage = 'Failed to process your decision.';
        try {
          const err = await r.json();
          errorMessage = err?.message || err?.error || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }
      
      await loadPending();
      await loadHistory();
      
      // Show sexy success alert
      setAlert({
        type: 'success',
        title: decision === 'approve' ? 'Trade Approved! ✅' : 'Trade Rejected! ❌',
        message: decision === 'approve' 
          ? 'Trade has been successfully approved and players have been swapped.' 
          : 'Trade has been rejected.'
      });
      
      setToast(decision === 'approve' ? 'Approved' : 'Rejected');
    } catch (e) {
      // Show sexy error alert
      setAlert({
        type: 'error',
        title: 'Action Failed! ❌',
        message: String(e.message || 'Failed to process your decision. Please try again.')
      });
      setToast('Action failed');
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: { ...prev[loadingKey], [tradeId]: false } }));
    }
  }

  async function decideRelease(releaseId, decision) {
    const loadingKey = decision === 'approve' ? 'releaseApprove' : 'releaseReject';
    setLoadingStates(prev => ({ ...prev, [loadingKey]: { ...prev[loadingKey], [releaseId]: true } }));
    
    try {
      const r = await fetch(`${API_ENDPOINTS}/api/releases/admin/${releaseId}/decide`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminUserId: user?.id, decision })
      });
      
      if (!r.ok) {
        let errorMessage = 'Failed to process your release decision.';
        try {
          const err = await r.json();
          errorMessage = err?.message || err?.error || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }
      
      await loadReleasePending();
      await loadReleaseHistory();
      
      // Show sexy success alert
      setAlert({
        type: 'success',
        title: decision === 'approve' ? 'Release Approved! 🔓' : 'Release Rejected! ❌',
        message: decision === 'approve' 
          ? 'Player release has been successfully approved.' 
          : 'Player release has been rejected.'
      });
      
      setToast(decision === 'approve' ? 'Release Approved' : 'Release Rejected');
    } catch (e) {
      // Show sexy error alert
      setAlert({
        type: 'error',
        title: 'Release Action Failed! ❌',
        message: String(e.message || 'Failed to process your release decision. Please try again.')
      });
      setToast('Release action failed');
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: { ...prev[loadingKey], [releaseId]: false } }));
    }
  }

  async function decidePick(pickId, decision) {
    const loadingKey = decision === 'approve' ? 'pickApprove' : 'pickReject';
    setLoadingStates(prev => ({ ...prev, [loadingKey]: { ...prev[loadingKey], [pickId]: true } }));
    
    try {
      const r = await fetch(`${API_ENDPOINTS}/api/picks/admin/${pickId}/decide`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminUserId: user?.id, decision })
      });
      
      if (!r.ok) {
        let errorMessage = 'Failed to process your pick decision.';
        try {
          const err = await r.json();
          errorMessage = err?.message || err?.error || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }
      
      await loadPickPending();
      await loadPickHistory();
      
      // Show sexy success alert
      setAlert({
        type: 'success',
        title: decision === 'approve' ? 'Pick Approved! ✅' : 'Pick Rejected! ❌',
        message: decision === 'approve' 
          ? 'Player pick has been successfully approved.' 
          : 'Player pick has been rejected.'
      });
      
      setToast(decision === 'approve' ? 'Pick Approved' : 'Pick Rejected');
    } catch (e) {
      // Show sexy error alert
      setAlert({
        type: 'error',
        title: 'Pick Action Failed! ❌',
        message: String(e.message || 'Failed to process your pick decision. Please try again.')
      });
      setToast('Pick action failed');
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: { ...prev[loadingKey], [pickId]: false } }));
    }
  }

  const formatCr = value => {
    if (value === null || typeof value === 'undefined') return '—';
    return `₹${Number(value || 0).toFixed(2)} Cr`;
  };

  // Filter trades based on search query
  const filterTrades = (trades) => {
    if (!searchQuery.trim()) return trades;
    const query = searchQuery.toLowerCase();
    return trades.filter(trade => {
      const team1 = trade.fromUser?.teamName || '';
      const team2 = trade.toUser?.teamName || '';
      const player1 = trade.offeredPlayer?.name || '';
      const player2 = trade.requestedPlayer?.name || '';
      return team1.toLowerCase().includes(query) ||
             team2.toLowerCase().includes(query) ||
             player1.toLowerCase().includes(query) ||
             player2.toLowerCase().includes(query);
    });
  };

  const filterReleases = (releases) => {
    if (!searchQuery.trim()) return releases;
    const query = searchQuery.toLowerCase();
    return releases.filter(release => {
      const team = release.user?.teamName || '';
      const player = release.player?.name || '';
      return team.toLowerCase().includes(query) ||
             player.toLowerCase().includes(query);
    });
  };

  const filterPicks = (picks) => {
    if (!searchQuery.trim()) return picks;
    const query = searchQuery.toLowerCase();
    return picks.filter(pick => {
      const team = pick.user?.teamName || '';
      const player = pick.player?.name || '';
      return team.toLowerCase().includes(query) ||
             player.toLowerCase().includes(query);
    });
  };

  return (
    <div className="admin-trades-page">
      {toast && <div className="toast">{toast}</div>}
      <SexyAlert alert={alert} onClose={() => setAlert(null)} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="gradient-title"><FaShieldAlt style={{ marginRight: 10 }} />Admin Trade Approvals</h1>
        <input
          type="text"
          placeholder="🔍 Search by team or player name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: '0.75rem 1rem',
            fontSize: '1rem',
            border: '2px solid #667eea',
            borderRadius: '8px',
            minWidth: '250px',
            flex: '1',
            maxWidth: '400px',
            outline: 'none',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)'
          }}
        />
      </div>

      <section id="trade-bundles" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>
            {bundleAutoApprove
              ? 'Trade bundles (auto-approve when all legs ready)'
              : 'Trade bundles (manual commissioner approval)'}
          </h2>
          <button
            type="button"
            className="btn"
            onClick={loadBundlePending}
            disabled={bundleLoading}
            style={{ padding: '6px 14px' }}
          >
            {bundleLoading ? 'Refreshing…' : 'Refresh bundles'}
          </button>
        </div>
        {bundleError && (
          <p style={{ color: '#dc2626', fontWeight: 600, marginBottom: 12 }}>{bundleError}</p>
        )}
        {!bundleError && !bundleLoading && bundlePending.length === 0 && (
          <p className="empty">No active trade bundles right now.</p>
        )}
        {bundlePending.map((b) => (
            <div className="item" key={b._id} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: 8 }}>
              <div className="line"><strong>{b.title}</strong> — {b.status}</div>
              <div className="line">Code: {b.shareCode} · {b.progress?.acceptedLegs || 0}/{b.progress?.totalLegs || 0} legs</div>
              {(b.legs || []).map(({ legIndex, trade }) => {
                const statusColor =
                  trade.status === 'admin_pending' ? '#16a34a'
                  : trade.status === 'rejected' || trade.status === 'withdrawn' ? '#dc2626'
                  : '#d97706';
                const statusLabel =
                  trade.status === 'admin_pending' ? 'Accepted'
                  : trade.status === 'pending' ? 'Awaiting response'
                  : trade.status === 'counter' ? 'Counter offered'
                  : trade.status;
                return (
                  <div key={trade._id} className="line" style={{ fontSize: 13, marginTop: 6 }}>
                    Leg {legIndex}: {trade.fromUser?.teamName} ↔ {trade.toUser?.teamName} ({trade.offeredPlayer?.name} ↔ {trade.requestedPlayer?.name})
                    {' — '}
                    <span style={{ color: statusColor, fontWeight: 600 }}>{statusLabel}</span>
                  </div>
                );
              })}
              {b.blockers?.length > 0 && (
                <div style={{ color: '#b45309', marginTop: 8 }}>{b.blockers.join(' · ')}</div>
              )}
              {(b.legs || []).some((l) => l.trade?.status === 'rejected') && (
                <p style={{ marginTop: 8, color: '#b91c1c', fontWeight: 600 }}>
                  One leg was rejected — bundle cannot complete. Reject the bundle and start a new deal if needed.
                </p>
              )}
              {b.status === 'ready_for_admin' && (
                <p style={{ marginTop: 8, color: '#16a34a' }}>
                  {bundleAutoApprove
                    ? 'All teams accepted every leg. Bundle should auto-complete; use Complete bundle if it did not.'
                    : 'All teams accepted every leg. Commissioner must click Complete bundle to run all swaps.'}
                </p>
              )}
              {b.status === 'pending_acceptance' &&
                !(b.legs || []).some((l) => ['rejected', 'withdrawn'].includes(l.trade?.status)) && (
                <p style={{ marginTop: 8, color: '#64748b' }}>
                  Waiting for all teams to accept every leg. No admin approval until all legs show <em>admin_pending</em>.
                </p>
              )}
              {b.status === 'blocked' && (
                <p style={{ marginTop: 8, color: '#b45309' }}>
                  {bundleAutoApprove
                    ? 'Auto-approve blocked (purse, roster, or slots). Fix issues or reject the bundle.'
                    : 'Bundle blocked (purse, roster, or slots). Fix issues, retry Complete bundle, or reject.'}
                </p>
              )}
              {(b.status === 'ready_for_admin' || b.status === 'blocked') && (
                <button
                  className="btn btn-success"
                  style={{ marginTop: 8, marginRight: 8 }}
                  onClick={async () => {
                    try {
                      const r = await fetch(`${API_ENDPOINTS}/api/trades/bundles/${b._id}/retry-auto`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ adminUserId: user?.id }),
                      });
                      const j = await r.json();
                      if (j.ok) {
                        setToast('Bundle completed — all legs executed');
                      } else if (j.blockers?.length) {
                        setAlert({ type: 'warning', title: 'Bundle blocked', message: j.blockers.join(' ') });
                      } else {
                        setAlert({ type: 'info', title: 'Not ready', message: j.message || 'Not all legs are ready yet.' });
                      }
                      await loadBundlePending();
                      await loadPending();
                    } catch (e) {
                      setAlert({ type: 'error', title: 'Failed', message: e.message });
                    }
                  }}
                >
                  Complete bundle
                </button>
              )}
              {['blocked', 'ready_for_admin', 'pending_acceptance'].includes(b.status) && (
                <button
                  className="btn btn-danger"
                  style={{ marginTop: 8 }}
                  onClick={async () => {
                    if (!window.confirm('Reject entire bundle?')) return;
                    try {
                      const r = await fetch(`${API_ENDPOINTS}/api/trades/bundles/${b._id}/reject`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ adminUserId: user?.id, note: 'Commissioner rejected bundle' }),
                      });
                      const j = await r.json();
                      if (!r.ok) throw new Error(j.message || 'Failed');
                      await loadBundlePending();
                      setToast('Bundle rejected');
                    } catch (e) {
                      setAlert({ type: 'error', title: 'Failed', message: e.message });
                    }
                  }}
                >
                  Reject bundle
                </button>
              )}
            </div>
          ))}
      </section>
      
      {/* Group trades by user */}
      {(() => {
        const filteredPending = filterTrades(pending);
        const groupedTrades = {};
        filteredPending.forEach(trade => {
          const userId = trade.fromUser?._id;
          if (!groupedTrades[userId]) {
            groupedTrades[userId] = [];
          }
          groupedTrades[userId].push(trade);
        });

        return Object.entries(groupedTrades).map(([userId, userTrades]) => {
          const firstTrade = userTrades[0];
          const teamName = firstTrade.fromUser?.teamName || 'Unknown Team';
          const userName = firstTrade.fromUser?.name || 'Unknown User';
          
          return (
            <div key={userId} className="user-group">
              <div className="group-header">
                <h3 className="team-name">{teamName}</h3>
                <span className="user-info">by {userName}</span>
                <span className="trade-count">{userTrades.length} trade request{userTrades.length > 1 ? 's' : ''}</span>
              </div>
              
              <div className="trades-list">
                {userTrades.map(t => (
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
                      <button 
                        className="btn btn-success" 
                        disabled={loadingStates.tradeApprove[t._id] || loadingStates.tradeReject[t._id]}
                        onClick={() => decide(t._id, 'approve')}
                      >
                        {loadingStates.tradeApprove[t._id] ? (
                          <>
                            <div className="loading-spinner"></div>
                            Approving...
                          </>
                        ) : (
                          <>
                            <FaThumbsUp style={{ marginRight: 6 }} />
                            Approve
                          </>
                        )}
                      </button>
                      <button 
                        className="btn btn-danger" 
                        disabled={loadingStates.tradeApprove[t._id] || loadingStates.tradeReject[t._id]}
                        onClick={() => decide(t._id, 'reject')}
                      >
                        {loadingStates.tradeReject[t._id] ? (
                          <>
                            <div className="loading-spinner"></div>
                            Rejecting...
                          </>
                        ) : (
                          <>
                            <FaBan style={{ marginRight: 6 }} />
                            Reject
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        });
      })()}
      
      {filterTrades(pending).length === 0 && <div className="empty">No pending trades{searchQuery ? ' matching search' : ''}</div>}
      <h2>Admin Decisions</h2>
      <div className="history-grid">
        {filterTrades(history).map(t => {
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
      
      {/* Group release requests by user */}
      {(() => {
        const filteredReleasePending = filterReleases(releasePending);
        const groupedReleases = {};
        // Ensure releasePending is an array
        if (!Array.isArray(filteredReleasePending)) {
          console.error('releasePending is not an array:', filteredReleasePending);
          return <div className="empty">Error loading release requests</div>;
        }
        filteredReleasePending.forEach(release => {
          const userId = release.user?._id;
          if (!groupedReleases[userId]) {
            groupedReleases[userId] = [];
          }
          groupedReleases[userId].push(release);
        });

        return Object.entries(groupedReleases).map(([userId, userReleases]) => {
          const firstRelease = userReleases[0];
          const teamName = firstRelease.user?.teamName || 'Unknown Team';
          const userName = firstRelease.user?.name || 'Unknown User';
          
          return (
            <div key={userId} className="user-group">
              <div className="group-header">
                <h3 className="team-name">{teamName}</h3>
                <span className="user-info">by {userName}</span>
                <span className="trade-count">{userReleases.length} release request{userReleases.length > 1 ? 's' : ''}</span>
              </div>
              
              <div className="trades-list">
                {userReleases.map(r => (
                  <div className="item" key={r._id}>
                    <div className="line"><strong>{r.user?.teamName}</strong> — {r.player?.name}
                      {r.player?.type && (<span className={`type-badge ${String(r.player.type).toLowerCase()}`} style={{ marginLeft: 8 }}>{r.player.type}</span>)}
                    </div>
                    <div className="actions">
                      <button 
                        className="btn btn-success" 
                        disabled={loadingStates.releaseApprove[r._id] || loadingStates.releaseReject[r._id]}
                        onClick={() => decideRelease(r._id, 'approve')}
                      >
                        {loadingStates.releaseApprove[r._id] ? (
                          <>
                            <div className="loading-spinner"></div>
                            Approving...
                          </>
                        ) : (
                          <>
                            <FaThumbsUp style={{ marginRight: 6 }} />
                            Approve
                          </>
                        )}
                      </button>
                      <button 
                        className="btn btn-danger" 
                        disabled={loadingStates.releaseApprove[r._id] || loadingStates.releaseReject[r._id]}
                        onClick={() => decideRelease(r._id, 'reject')}
                      >
                        {loadingStates.releaseReject[r._id] ? (
                          <>
                            <div className="loading-spinner"></div>
                            Rejecting...
                          </>
                        ) : (
                          <>
                            <FaBan style={{ marginRight: 6 }} />
                            Reject
                          </>
                        )}
                      </button>
                    </div>
                {r.aiInsight && (
                  <div className="ai-insight-card">
                    <div className="ai-insight-title">AI Insight</div>
                    <p className="ai-insight-summary">{r.aiInsight.summary}</p>
                    <div className="ai-insight-metrics">
                      <span>Refund: {formatCr(r.aiInsight.refundCr)}</span>
                      <span>Projected Purse: {formatCr(r.aiInsight.projectedPurseCr)}</span>
                      <span>Players After Release: {r.aiInsight.remainingPlayers}</span>
                    </div>
                    {r.aiInsight.warnings && r.aiInsight.warnings.length > 0 && (
                      <ul className="ai-insight-warnings">
                        {r.aiInsight.warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                  </div>
                ))}
              </div>
            </div>
          );
        });
      })()}
      
      {filterReleases(releasePending).length === 0 && <div className="empty">No pending release requests{searchQuery ? ' matching search' : ''}</div>}

      <h2>Release Decisions</h2>
      <div className="history-grid">
        {filterReleases(releaseHistory).map(r => (
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
          {r.aiInsight && (
            <div className="ai-insight-card subtle">
              <div className="ai-insight-title">AI Insight Snapshot</div>
              <p className="ai-insight-summary">{r.aiInsight.summary}</p>
              <div className="ai-insight-metrics">
                <span>Refund: {formatCr(r.aiInsight.refundCr)}</span>
                <span>Projected Purse: {formatCr(r.aiInsight.projectedPurseCr)}</span>
                <span>Players After Release: {r.aiInsight.remainingPlayers}</span>
              </div>
              {r.aiInsight.warnings && r.aiInsight.warnings.length > 0 && (
                <ul className="ai-insight-warnings">
                  {r.aiInsight.warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          </div>
        ))}
        {releaseHistory.length === 0 && <div className="empty">No release history</div>}
      </div>

      <h2>Pick Requests (Pending)</h2>
      
      {/* Group pick requests by user */}
      {(() => {
        const filteredPickPending = filterPicks(pickPending);
        const groupedPicks = {};
        // Ensure pickPending is an array
        if (!Array.isArray(filteredPickPending)) {
          console.error('pickPending is not an array:', filteredPickPending);
          return <div className="empty">Error loading pick requests</div>;
        }
        filteredPickPending.forEach(pick => {
          const userId = pick.user?._id;
          if (!groupedPicks[userId]) {
            groupedPicks[userId] = [];
          }
          groupedPicks[userId].push(pick);
        });

        return Object.entries(groupedPicks).map(([userId, userPicks]) => {
          const firstPick = userPicks[0];
          const teamName = firstPick.user?.teamName || 'Unknown Team';
          const userName = firstPick.user?.name || 'Unknown User';
          
          return (
            <div key={userId} className="user-group">
              <div className="group-header">
                <h3 className="team-name">{teamName}</h3>
                <span className="user-info">by {userName}</span>
                <span className="trade-count">{userPicks.length} pick request{userPicks.length > 1 ? 's' : ''}</span>
              </div>
              
              <div className="trades-list">
                {userPicks.map(p => (
                  <div className="item" key={p._id}>
                    <div className="line"><strong>{p.user?.teamName}</strong> — {p.player?.name}{p.player?.type && (<span className={`type-badge ${String(p.player.type).toLowerCase()}`} style={{ marginLeft: 8 }}>{p.player.type}</span>)}</div>
                    <div className="actions">
                      <button 
                        className="btn btn-success" 
                        disabled={loadingStates.pickApprove[p._id] || loadingStates.pickReject[p._id]}
                        onClick={() => decidePick(p._id, 'approve')}
                      >
                        {loadingStates.pickApprove[p._id] ? (
                          <>
                            <div className="loading-spinner"></div>
                            Approving...
                          </>
                        ) : (
                          'Approve'
                        )}
                      </button>
                      <button 
                        className="btn btn-danger" 
                        disabled={loadingStates.pickApprove[p._id] || loadingStates.pickReject[p._id]}
                        onClick={() => decidePick(p._id, 'reject')}
                      >
                        {loadingStates.pickReject[p._id] ? (
                          <>
                            <div className="loading-spinner"></div>
                            Rejecting...
                          </>
                        ) : (
                          'Reject'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        });
      })()}
      
      {filterPicks(pickPending).length === 0 && <div className="empty">No pending pick requests{searchQuery ? ' matching search' : ''}</div>}

      <h2>Pick Decisions</h2>
      <div className="history-grid">
        {filterPicks(pickHistory).map(p => (
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
              <span className="player-chip">
                {p.player?.name}
                {p.player?.type && (
                  <span
                    className={`type-badge ${String(p.player.type).toLowerCase()}`}
                    style={{ marginLeft: 8 }}
                  >
                    {p.player.type}
                  </span>
                )}
              </span>
            </div>
            {p.adminDecision?.note && (
              <div className="decision-note">
                <strong>Note:</strong> {p.adminDecision.note}
              </div>
            )}
          </div>
        ))}
        {pickHistory.length === 0 && <div className="empty">No pick history</div>}
      </div>
    </div>
  );
}

export default AdminTrades;