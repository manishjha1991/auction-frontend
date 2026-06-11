import React, { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../const';
import '../css/UnsoldPlayers.css';

function UnsoldPlayers() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [type, setType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [toast, setToast] = useState('');
  const [myPicks, setMyPicks] = useState([]);
  const [pickStatusByPlayer, setPickStatusByPlayer] = useState({});
  const [pickButtonEnabled, setPickButtonEnabled] = useState(true);
  const [sameTierPickCredits, setSameTierPickCredits] = useState([]);

  useEffect(() => {
    const cached = localStorage.getItem('user');
    if (cached) setUser(JSON.parse(cached));
  }, []);

  async function loadUnsold() {
    try {
      setLoading(true);
      setLoadingProgress(10);
      
      const res = await fetch(`${API_ENDPOINTS}/api/picks/unsold?page=${page}&limit=10${type ? `&type=${encodeURIComponent(type)}` : ''}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`);
      setLoadingProgress(50);
      
      if (!res.ok) {
        throw new Error('Failed to load unsold players');
      }
      
      const j = await res.json();
      setLoadingProgress(80);
      
      if (j && Array.isArray(j.items)) {
        setItems(j.items);
        setTotalPages(j.totalPages || 1);
      } else {
        setItems([]);
        setTotalPages(1);
      }
      
      setLoadingProgress(100);
    } catch (e) {
      setToast('Failed to load unsold players');
    } finally {
      setLoading(false);
      setLoadingProgress(0);
    }
  }

  useEffect(() => { loadUnsold(); }, [page, type, searchQuery]);

  // Load app settings to check if pick button is enabled
  async function loadAppSettings() {
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/settings`);
      const j = await res.json();
      if (typeof j.enablePickButton === 'boolean') {
        setPickButtonEnabled(j.enablePickButton);
      }
    } catch (e) {
      console.error('Failed to load app settings');
    }
  }

  useEffect(() => { loadAppSettings(); }, []);

  // Handle search input with debouncing
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setPage(1); // Reset to first page when searching
  };

  async function loadMyPicks() {
    if (!user) return;
    try {
      const r = await fetch(`${API_ENDPOINTS}/api/picks/user/${user.id}`);
      const j = await r.json();
      setMyPicks(Array.isArray(j) ? j : []);
      const map = {};
      (Array.isArray(j) ? j : []).forEach(pr => { map[pr.player?._id || pr.player] = pr.status; });
      setPickStatusByPlayer(map);
    } catch {}
  }

  useEffect(() => { loadMyPicks(); }, [user]);

  async function loadTradeUsage() {
    if (!user?.id) return;
    try {
      const r = await fetch(`${API_ENDPOINTS}/api/users/${user.id}/trades-usage`, { cache: 'no-store' });
      const j = await r.json();
      setSameTierPickCredits(Array.isArray(j.sameTierPickCredits) ? j.sameTierPickCredits : []);
    } catch {
      setSameTierPickCredits([]);
    }
  }

  useEffect(() => {
    loadTradeUsage();
  }, [user?.id]);

  function canPickPlayerType(playerType) {
    if (!playerType) return true;
    return sameTierPickCredits.includes(playerType);
  }

  async function pickPlayer(playerId) {
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/picks`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, playerId })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.message || 'Failed');
      setToast('Pick request sent to admin');
      // Mark as requested locally and refresh pick list
      setPickStatusByPlayer(prev => ({ ...prev, [playerId]: 'pending' }));
      loadMyPicks();
      loadTradeUsage();
    } catch (e) {
      setToast(String(e.message || 'Failed to pick'));
    }
  }

  return (
    <div className="unsold-page">
      {toast && <div className="toast">{toast}</div>}
      <div className="header">
        <h1 className="gradient-title">Unsold Players</h1>
        <div className="toolbar">
          <div className="search-container">
            <div className="search-icon">🔍</div>
            <input
              type="text"
              className="search-input"
              placeholder="Search players by name..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <button 
                className="clear-search" 
                onClick={() => { setSearchQuery(''); setPage(1); }}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <select className="select" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            <option value="Sapphire">Sapphire</option>
            <option value="Gold">Gold</option>
            <option value="Emerald">Emerald</option>
            <option value="Silver">Silver</option>
          </select>
          <button className="btn btn-ghost" onClick={loadUnsold}>Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className="unsold-loading">
          <div className="loading-container">
            <div className="loading-circle">
              <div className="loading-progress" style={{ transform: `rotate(${loadingProgress * 3.6}deg)` }}></div>
              <div className="loading-text">{loadingProgress}%</div>
            </div>
            <div className="loading-label">Loading Unsold Players...</div>
          </div>
        </div>
      ) : (
        <>
          {searchQuery && (
            <div className="search-results-info">
              <span className="search-highlight">🔍</span>
              <span className="search-text">Search results for "{searchQuery}"</span>
              <span className="results-count">({items.length} players found)</span>
            </div>
          )}
          {!pickButtonEnabled && (
            <div className="pick-disabled-info">
              <span className="warning-icon">⚠️</span>
              <span className="warning-text">Pick button is currently disabled by admin</span>
            </div>
          )}
          {sameTierPickCredits.length > 0 && (
            <div className="pick-disabled-info" style={{ background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.35)' }}>
              <span className="warning-icon">✓</span>
              <span className="warning-text">
                Same-tier replacement available: you released {sameTierPickCredits.join(', ')} — picking that tier
                uses <strong>no extra</strong> trade slot (counts as one move with your release).
              </span>
            </div>
          )}
          <div className="grid">
            {items.map(p => (
              <div className={`card ${p.hasPendingRequest ? 'card-disabled' : ''}`} key={p._id}>
                <div className="card-top">
                  <div className="name">{p.name}</div>
                  <div className="badges">
                    {p.hasPendingRequest && <span className="request-icon" title="Request already raised">📋</span>}
                    {p.type && <span className={`type-badge ${String(p.type).toLowerCase()}`}>{p.type}</span>}
                  </div>
                </div>
                <div className="meta">{p.role} • ₹{Number(p.basePrice || 0).toLocaleString('en-IN')}</div>
                <div className="actions">
                  {(() => {
                    const st = pickStatusByPlayer[p._id];
                    if (st === 'pending' || st === 'admin_pending') {
                      return <span className="requested-badge" title="Requested to admin">Requested</span>;
                    }
                    if (st === 'completed') {
                      return <span className="picked-badge" title="Approved by admin">Picked</span>;
                    }
                    if (p.hasPendingRequest) {
                      return <span className="request-raised-badge" title="Request already raised">Request Raised</span>;
                    }
                    const sameTierCredit = canPickPlayerType(p.type);
                    return (
                      <button 
                        className="btn btn-primary" 
                        onClick={() => pickPlayer(p._id)} 
                        disabled={!user || !pickButtonEnabled}
                        title={
                          !pickButtonEnabled
                            ? 'Pick button is currently disabled by admin'
                            : sameTierCredit
                              ? `Pairs with your ${p.type} release — no extra trade slot`
                              : ''
                        }
                      >
                        {pickButtonEnabled
                          ? sameTierCredit
                            ? `Pick ${p.type} (no extra slot)`
                            : 'Pick'
                          : 'Pick Disabled'}
                      </button>
                    );
                  })()}
                </div>
              </div>
            ))}
            {items.length === 0 && (
            <div className="empty">
              {searchQuery ? `No players found matching "${searchQuery}"` : 'No unsold players found'}
            </div>
          )}
          </div>
          <div className="pagination">
            <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
            <span className="page">Page {page} / {totalPages}</span>
            <button className="btn btn-ghost" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
          </div>

          <div className="pick-history">
            <h3>My Pick History</h3>
            <div className="pick-list">
              {myPicks.map(pr => (
                <div key={pr._id} className="pick-item">
                  <span className="player-chip">
                    {pr.player?.name}
                    {pr.player?.type && (<span className={`type-badge ${String(pr.player.type).toLowerCase()}`}>{pr.player.type}</span>)}
                  </span>
                  <span className={`status-badge ${pr.status}`}>
                    {pr.status === 'completed' ? 'Approved' : pr.status === 'rejected' ? 'Rejected' : 'Requested'}
                  </span>
                </div>
              ))}
              {myPicks.length === 0 && (
                <div className="empty">No pick requests yet</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default UnsoldPlayers;


