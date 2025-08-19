import React, { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../const';
import '../css/UnsoldPlayers.css';

function UnsoldPlayers() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [myPicks, setMyPicks] = useState([]);
  const [pickStatusByPlayer, setPickStatusByPlayer] = useState({});

  useEffect(() => {
    const cached = localStorage.getItem('user');
    if (cached) setUser(JSON.parse(cached));
  }, []);

  async function loadUnsold() {
    try {
      setLoading(true);
      const res = await fetch(`${API_ENDPOINTS}/api/picks/unsold?page=${page}&limit=10${type ? `&type=${encodeURIComponent(type)}` : ''}`);
      const j = await res.json();
      if (j && Array.isArray(j.items)) {
        setItems(j.items);
        setTotalPages(j.totalPages || 1);
      } else {
        setItems([]);
        setTotalPages(1);
      }
    } catch (e) {
      setToast('Failed to load unsold players');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUnsold(); }, [page, type]);

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
        <div className="loading">Loading…</div>
      ) : (
        <>
          <div className="grid">
            {items.map(p => (
              <div className="card" key={p._id}>
                <div className="card-top">
                  <div className="name">{p.name}</div>
                  {p.type && <span className={`type-badge ${String(p.type).toLowerCase()}`}>{p.type}</span>}
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
                    return (
                      <button className="btn btn-primary" onClick={() => pickPlayer(p._id)} disabled={!user}>Pick</button>
                    );
                  })()}
                </div>
              </div>
            ))}
            {items.length === 0 && <div className="empty">No unsold players found</div>}
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


