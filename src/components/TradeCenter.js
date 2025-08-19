import React, { useEffect, useMemo, useState } from 'react';
import { API_ENDPOINTS } from '../const';
import '../css/TradeCenter.css';
import Lottie from 'react-lottie-player';
import { FaExchangeAlt, FaCheck, FaTimes, FaPaperPlane, FaRetweet, FaUsers, FaUnlock } from 'react-icons/fa';
import handAnimation from './animations/HandToHand.json';
import hittingAnimation from './animations/HittingSix.json';

function TradeCenter() {
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]); // all teams
  const [allPlayers, setAllPlayers] = useState([]); // from /api/players/data
  const [myRoster, setMyRoster] = useState([]);
  const [selectedMyPlayer, setSelectedMyPlayer] = useState('');
  const [targetTeamId, setTargetTeamId] = useState('');
  const [targetRoster, setTargetRoster] = useState([]);
  const [selectedTargetPlayer, setSelectedTargetPlayer] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [trades, setTrades] = useState([]);
  // removed server roster cache; we derive from allPlayers by teamName
  const [limitReached, setLimitReached] = useState(false);
  const [releasePlayerId, setReleasePlayerId] = useState('');
  const [tradeUsage, setTradeUsage] = useState({ tradesUsed: 0, cap: 4, remaining: 4 });
  const [myReleases, setMyReleases] = useState([]);
  const [unsoldPlayers, setUnsoldPlayers] = useState([]);
  const [unsoldPage, setUnsoldPage] = useState(1);
  const [unsoldTotalPages, setUnsoldTotalPages] = useState(1);
  const [unsoldType, setUnsoldType] = useState('');

  const isMe = (maybeId) => {
    if (!user) return false;
    const uid = user.id || user._id;
    return String(maybeId) === String(uid);
  };
  const isFromMe = (trade) => isMe(trade?.fromUser?._id || trade?.fromUser);
  const isToMe = (trade) => isMe(trade?.toUser?._id || trade?.toUser);

  useEffect(() => {
    const cachedUser = localStorage.getItem('user');
    if (cachedUser) {
      setUser(JSON.parse(cachedUser));
    }
  }, []);

  useEffect(() => {
    async function bootstrap() {
      try {
        setLoading(true);
        const [teamsRes, tradesRes, playersRes, usageRes, releasesRes, unsoldRes] = await Promise.all([
          fetch(`${API_ENDPOINTS}/api/users/teams`),
          user ? fetch(`${API_ENDPOINTS}/api/trades/user/${user.id}`) : Promise.resolve({ ok: true, json: async () => [] }),
          fetch(`${API_ENDPOINTS}/api/players/data`),
          user ? fetch(`${API_ENDPOINTS}/api/users/${user.id}/trades-usage`) : Promise.resolve({ ok: true, json: async () => ({ tradesUsed: 0, cap: 4, remaining: 4 }) }),
          user ? fetch(`${API_ENDPOINTS}/api/releases/user/${user.id}`) : Promise.resolve({ ok: true, json: async () => [] }),
          fetch(`${API_ENDPOINTS}/api/picks/unsold?page=${unsoldPage}&limit=10${unsoldType ? `&type=${encodeURIComponent(unsoldType)}` : ''}`)
        ]);
        const teamsJson = await teamsRes.json();
        const tradesJson = user ? await tradesRes.json() : [];
        const playersJson = await playersRes.json();
        const usageJson = user ? await usageRes.json() : { tradesUsed: 0, cap: 4, remaining: 4 };
        const releasesJson = user ? await releasesRes.json() : [];
        const unsoldJson = await unsoldRes.json();
        setTeams(teamsJson.teams || []);
        setTrades(tradesJson || []);
        setAllPlayers(Array.isArray(playersJson) ? playersJson : []);
        if (usageJson && typeof usageJson.tradesUsed !== 'undefined') setTradeUsage({ tradesUsed: usageJson.tradesUsed, cap: usageJson.cap || 4, remaining: usageJson.remaining });
        setMyReleases(Array.isArray(releasesJson) ? releasesJson : []);
        if (unsoldJson && Array.isArray(unsoldJson.items)) {
          setUnsoldPlayers(unsoldJson.items);
          setUnsoldTotalPages(unsoldJson.totalPages || 1);
        } else {
          setUnsoldPlayers([]);
          setUnsoldTotalPages(1);
        }
        if (Array.isArray(tradesJson)) {
          const active = tradesJson.filter(t => ['pending', 'admin_pending'].includes(t.status) && String(t.fromUser?._id) === String(user?.id));
          setLimitReached(active.length >= 4);
        }
      } catch (e) {
        setToast('Failed to load trade data.');
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, [user]);

  // periodic refresh so roster updates after admin approval are reflected without manual reload
  useEffect(() => {
    let timer;
    async function refreshData() {
      try {
        const [tradesRes, playersRes, usageRes, releasesRes, unsoldRes] = await Promise.all([
          user ? fetch(`${API_ENDPOINTS}/api/trades/user/${user.id}`) : Promise.resolve({ ok: true, json: async () => [] }),
          fetch(`${API_ENDPOINTS}/api/players/data`),
          user ? fetch(`${API_ENDPOINTS}/api/users/${user.id}/trades-usage`) : Promise.resolve({ ok: true, json: async () => ({ tradesUsed: 0, cap: 4, remaining: 4 }) }),
          user ? fetch(`${API_ENDPOINTS}/api/releases/user/${user.id}`) : Promise.resolve({ ok: true, json: async () => [] }),
          fetch(`${API_ENDPOINTS}/api/picks/unsold?page=${unsoldPage}&limit=10${unsoldType ? `&type=${encodeURIComponent(unsoldType)}` : ''}`)
        ]);
        const tradesJson = user ? await tradesRes.json() : [];
        const playersJson = await playersRes.json();
        const usageJson = user ? await usageRes.json() : { tradesUsed: 0, cap: 4, remaining: 4 };
        const releasesJson = user ? await releasesRes.json() : [];
        const unsoldJson = await unsoldRes.json();
        setTrades(Array.isArray(tradesJson) ? tradesJson : []);
        setAllPlayers(Array.isArray(playersJson) ? playersJson : []);
        if (usageJson && typeof usageJson.tradesUsed !== 'undefined') setTradeUsage({ tradesUsed: usageJson.tradesUsed, cap: usageJson.cap || 4, remaining: usageJson.remaining });
        setMyReleases(Array.isArray(releasesJson) ? releasesJson : []);
        if (unsoldJson && Array.isArray(unsoldJson.items)) {
          setUnsoldPlayers(unsoldJson.items);
          setUnsoldTotalPages(unsoldJson.totalPages || 1);
        } else {
          setUnsoldPlayers([]);
          setUnsoldTotalPages(1);
        }
        if (Array.isArray(tradesJson)) {
          const active = tradesJson.filter(t => ['pending', 'admin_pending'].includes(t.status) && String(t.fromUser?._id) === String(user?.id));
          setLimitReached(active.length >= 4);
        }
      } catch {}
    }
    // refresh every 8 seconds when user is present
    if (user) {
      timer = setInterval(refreshData, 8000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [user]);

  // Derive my roster from allPlayers using my teamName
  useEffect(() => {
    if (!user) return;
    const mine = (allPlayers || []).filter(p => p.teamName && user.teamName && p.teamName === user.teamName);
    setMyRoster(mine.map(p => ({ id: p.id, name: p.name, role: p.role })));
  }, [user, allPlayers]);

  // Derive target roster from allPlayers using selected teamName
  useEffect(() => {
    if (!targetTeamId) { setTargetRoster([]); return; }
    const team = (teams || []).find(t => t._id === targetTeamId);
    if (!team) { setTargetRoster([]); return; }
    const roster = (allPlayers || []).filter(p => p.teamName && p.teamName === team.teamName);
    setTargetRoster(roster.map(p => ({ id: p.id, name: p.name, role: p.role })));
  }, [targetTeamId, teams, allPlayers]);

  const otherTeams = useMemo(() => (teams || []).filter(t => t._id !== (user && user.id)), [teams, user]);
  const findTeamByName = (teamName) => (teams || []).find(t => t.teamName === teamName);

  async function proposeTrade() {
    if (!selectedMyPlayer || !selectedTargetPlayer || !targetTeamId) {
      setToast('Select player, target team, and target player.');
      return;
    }
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/trades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromUserId: user.id, offeredPlayerId: selectedMyPlayer, requestedPlayerId: selectedTargetPlayer })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed');
      }
      const j = await res.json();
      const updated = [j, ...trades];
      setTrades(updated);
      const activeMine = updated.filter(t => ['pending', 'admin_pending'].includes(t.status) && String(t.fromUser?._id) === String(user?.id));
      setLimitReached(activeMine.length >= 4);
      setToast('Trade proposal sent!');
      // Refresh usage (actual increment happens on admin approval, but we keep UI fresh)
      try {
        const ures = await fetch(`${API_ENDPOINTS}/api/users/${user.id}/trades-usage`);
        const ujson = await ures.json();
        if (typeof ujson.tradesUsed !== 'undefined') setTradeUsage({ tradesUsed: ujson.tradesUsed, cap: ujson.cap || 4, remaining: ujson.remaining });
      } catch {}
      setSelectedMyPlayer('');
      setTargetTeamId('');
      setSelectedTargetPlayer('');
      setTargetRoster([]);
    } catch (e) {
      setToast(String(e.message || 'Could not send trade.'));
    }
  }

  async function requestRelease() {
    if (!releasePlayerId) { setToast('Select a player to release'); return; }
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/releases`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, playerId: releasePlayerId })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed');
      }
      setReleasePlayerId('');
      setToast('Release request sent to admin');
      try {
        const ures = await fetch(`${API_ENDPOINTS}/api/users/${user.id}/trades-usage`);
        const ujson = await ures.json();
        if (typeof ujson.tradesUsed !== 'undefined') setTradeUsage({ tradesUsed: ujson.tradesUsed, cap: ujson.cap || 4, remaining: ujson.remaining });
      } catch {}
    } catch { setToast('Failed to request release'); }
  }

  async function respondTrade(tradeId, decision) {
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/trades/${tradeId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ byUserId: user.id, decision })
      });
      const j = await res.json();
      setTrades(trades.map(t => (t._id === tradeId ? j : t)));
      setToast(decision === 'accept' ? 'Accepted! Awaiting admin approval.' : 'Rejected.');
    } catch (e) {
      setToast('Action failed.');
    }
  }

  // Counter feature removed

  if (loading) {
    return (
      <div className="trade-loading">
        <Lottie loop play animationData={handAnimation} style={{ width: 160, height: 160 }} />
      </div>
    );
  }

  return (
    <div className="trade-page">
      {toast && <div className="toast">{toast}</div>}
      <div className="trade-hero">
        <div className="hero-text">
          <h1 className="gradient-title"><FaExchangeAlt style={{ marginRight: 10 }} />Trade Center</h1>
          <p>Propose trades and finalize with admin approval.</p>
          <div className="usage-row">
            <span className="usage-badge usage-used"><FaExchangeAlt style={{ marginRight: 6 }} />Used: {tradeUsage.tradesUsed}</span>
            <span className="usage-badge usage-left"><FaRetweet style={{ marginRight: 6 }} />Left: {tradeUsage.remaining}</span>
            {tradeUsage.remaining === 0 && (<span className="usage-cap">You have reached your 4 trades cap.</span>)}
          </div>
        </div>
        <div className="hero-art">
          <Lottie loop play animationData={handAnimation} style={{ width: 200, height: 200 }} />
        </div>
      </div>

      <div className="trade-propose">
        <div className="card glass propose-card">
          <div className="card-header">
            <h3 className="card-title"><FaPaperPlane style={{ marginRight: 8 }} />Create Trade Inquiry</h3>
            <p className="card-subtitle">Pick one from your roster and one from a target team to propose a swap.</p>
          </div>
          <div className="grid">
            <div className="field-group">
              <label className="field-label">Your Player</label>
              <select className="select" value={selectedMyPlayer} onChange={(e) => setSelectedMyPlayer(e.target.value)}>
                <option value="">Select player</option>
                {myRoster.map(p => {
                  const meta = (allPlayers || []).find(ap => ap.id === p.id);
                  const typ = meta?.type ? ` - ${meta.type}` : '';
                  return (
                    <option key={p.id} value={p.id}>{p.name} ({p.role}){typ}</option>
                  );
                })}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Target Team</label>
              <select className="select" value={targetTeamId} onChange={(e) => setTargetTeamId(e.target.value)}>
                <option value="">Select team</option>
                {otherTeams.map(t => (
                  <option key={t._id} value={t._id}>{t.teamName}</option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Target Player</label>
              <select className="select" value={selectedTargetPlayer} onChange={(e) => setSelectedTargetPlayer(e.target.value)} disabled={!targetTeamId}>
                <option value="">Select player</option>
                {targetRoster.map(p => {
                  const meta = (allPlayers || []).find(ap => ap.id === p.id);
                  const typ = meta?.type ? ` - ${meta.type}` : '';
                  return (
                    <option key={p.id} value={p.id}>{p.name} ({p.role}){typ}</option>
                  );
                })}
              </select>
            </div>
            <div className="actions cta-row">
              <button className="btn btn-info" title="Send trade proposal" onClick={proposeTrade} disabled={limitReached || tradeUsage.remaining === 0}>
                <FaPaperPlane style={{ marginRight: 8 }} />{limitReached ? 'Limit Reached (4)' : 'Send Proposal'}
              </button>
              <button className="btn btn-refresh" style={{ marginLeft: 8 }} onClick={async () => {
                try {
                  const [tradesRes, playersRes, usageRes, releasesRes, unsoldRes] = await Promise.all([
                    user ? fetch(`${API_ENDPOINTS}/api/trades/user/${user.id}`) : Promise.resolve({ ok: true, json: async () => [] }),
                    fetch(`${API_ENDPOINTS}/api/players/data`),
                    user ? fetch(`${API_ENDPOINTS}/api/users/${user.id}/trades-usage`) : Promise.resolve({ ok: true, json: async () => ({ tradesUsed: 0, cap: 4, remaining: 4 }) }),
                    user ? fetch(`${API_ENDPOINTS}/api/releases/user/${user.id}`) : Promise.resolve({ ok: true, json: async () => [] }),
                    fetch(`${API_ENDPOINTS}/api/picks/unsold?page=${unsoldPage}&limit=10${unsoldType ? `&type=${encodeURIComponent(unsoldType)}` : ''}`)
                  ]);
                  const tradesJson = user ? await tradesRes.json() : [];
                  const playersJson = await playersRes.json();
                  const usageJson = user ? await usageRes.json() : { tradesUsed: 0, cap: 4, remaining: 4 };
                  const releasesJson = user ? await releasesRes.json() : [];
                  const unsoldJson = await unsoldRes.json();
                  setTrades(Array.isArray(tradesJson) ? tradesJson : []);
                  setAllPlayers(Array.isArray(playersJson) ? playersJson : []);
                  if (usageJson && typeof usageJson.tradesUsed !== 'undefined') setTradeUsage({ tradesUsed: usageJson.tradesUsed, cap: usageJson.cap || 4, remaining: usageJson.remaining });
                  setMyReleases(Array.isArray(releasesJson) ? releasesJson : []);
                  if (unsoldJson && Array.isArray(unsoldJson.items)) {
                    setUnsoldPlayers(unsoldJson.items);
                    setUnsoldTotalPages(unsoldJson.totalPages || 1);
                  } else {
                    setUnsoldPlayers([]);
                    setUnsoldTotalPages(1);
                  }
                  if (Array.isArray(tradesJson)) {
                    const active = tradesJson.filter(t => ['pending', 'counter', 'admin_pending'].includes(t.status) && String(t.fromUser?._id) === String(user?.id));
                    setLimitReached(active.length >= 4);
                  }
                  setToast('Refreshed');
                } catch { setToast('Refresh failed'); }
              }}>Refresh</button>
            </div>
          <div className="release-box">
            <label className="field-label">Request Release</label>
            <div className="release-row">
              <select className="select" value={releasePlayerId} onChange={(e) => setReleasePlayerId(e.target.value)}>
                <option value="">Select player</option>
                {myRoster.map(p => {
                  const meta = (allPlayers || []).find(ap => ap.id === p.id);
                  const typ = meta?.type ? ` - ${meta.type}` : '';
                  return (
                    <option key={p.id} value={p.id}>{p.name} ({p.role}){typ}</option>
                  );
                })}
              </select>
              <button className="btn btn-danger" onClick={requestRelease} disabled={tradeUsage.remaining === 0}>Request Release</button>
            </div>
          </div>
          </div>
          {(selectedMyPlayer || selectedTargetPlayer) && (
            <div className="preview-row">
              {(() => {
                const mine = (allPlayers || []).find(p => p.id === selectedMyPlayer);
                const theirs = (allPlayers || []).find(p => p.id === selectedTargetPlayer);
                const typeClass = (t) => t ? `type-badge ${String(t).toLowerCase()}` : 'type-badge';
                return (
                  <div className="chips">
                    <div className="player-chip">
                      <span className="name">{mine ? mine.name : 'Player'}</span>
                      {mine?.type && <span className={typeClass(mine.type)}>{mine.type}</span>}
                    </div>
                    <span className="chip-arrow">↔</span>
                    <div className="player-chip">
                      <span className="name">{theirs ? theirs.name : 'Target player'}</span>
                      {theirs?.type && <span className={typeClass(theirs.type)}>{theirs.type}</span>}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      <div className="trade-inbox">
        <div className="card glass">
          <h3><FaUsers style={{ marginRight: 8 }} />Your Trades</h3>
          <div className="trade-list">
            {trades.map(t => (
              <div key={t._id} className={`trade-item ${['completed','rejected','withdrawn'].includes(t.status) ? 'disabled' : ''}`}>
                <div className="meta">
                  <div className="line team-line">
                    <strong>From:</strong>
                    {(() => {
                      const tm = findTeamByName(t.fromUser?.teamName || '');
                      const img = tm?.teamImage ? `${API_ENDPOINTS}${tm.teamImage}` : '';
                      return (
                        <span className="team-pill">
                          {img ? (
                            <img className="team-avatar" src={img} alt={tm?.teamName || 'Team'} />
                          ) : (
                            <span className="team-initial">{(tm?.teamName || '?').substring(0,1).toUpperCase()}</span>
                          )}
                          <span className="team-name">{t.fromUser?.teamName}</span>
                        </span>
                      );
                    })()}
                  </div>
                  <div className="line team-line">
                    <strong>To:</strong>
                    {(() => {
                      const tm = findTeamByName(t.toUser?.teamName || '');
                      const img = tm?.teamImage ? `${API_ENDPOINTS}${tm.teamImage}` : '';
                      return (
                        <span className="team-pill">
                          {img ? (
                            <img className="team-avatar" src={img} alt={tm?.teamName || 'Team'} />
                          ) : (
                            <span className="team-initial">{(tm?.teamName || '?').substring(0,1).toUpperCase()}</span>
                          )}
                          <span className="team-name">{t.toUser?.teamName}</span>
                        </span>
                      );
                    })()}
                  </div>
                  <div className="line offer-line">
                    <strong>Offer:</strong>
                    <span className="offer-chip">
                      <span className="nm">{t.offeredPlayer?.name}</span>
                      {t.offeredPlayer?.type && <span className={`type-badge ${String(t.offeredPlayer.type).toLowerCase()}`}>{t.offeredPlayer.type}</span>}
                    </span>
                    <span className="chip-arrow">↔</span>
                    <span className="offer-chip">
                      <span className="nm">{t.requestedPlayer?.name}</span>
                      {t.requestedPlayer?.type && <span className={`type-badge ${String(t.requestedPlayer.type).toLowerCase()}`}>{t.requestedPlayer.type}</span>}
                    </span>
                  </div>
                  <div className={`status ${t.status}`}>{t.status}</div>
                </div>
                <div className="history">
                  {t.history?.map((h, idx) => (
                    <div key={idx} className="hline">
                      <span>{h.action}</span>
                      {h.message ? <span> — {h.message}</span> : null}
                    </div>
                  ))}
                </div>
                <div className="item-actions">
                  {user && isToMe(t) && t.status === 'pending' && (
                    <>
                      <button className="btn btn-success" onClick={() => respondTrade(t._id, 'accept')}><FaCheck style={{ marginRight: 6 }} />Accept</button>
                      <button className="btn btn-danger" onClick={() => respondTrade(t._id, 'reject')}><FaTimes style={{ marginRight: 6 }} />Reject</button>
                    </>
                  )}
                  {user && isFromMe(t) && !['completed','rejected','withdrawn'].includes(t.status) && (
                    <button className="btn btn-withdraw" onClick={async () => {
                      try {
                        const r = await fetch(`${API_ENDPOINTS}/api/trades/${t._id}/withdraw`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ byUserId: user.id }) });
                        const j = await r.json();
                        const updated = trades.map(x => (x._id === t._id ? j : x));
                        setTrades(updated);
                        const activeMine = updated.filter(u => ['pending','admin_pending'].includes(u.status) && String(u.fromUser?._id) === String(user?.id));
                        setLimitReached(activeMine.length >= 4);
                        setToast('Trade withdrawn');
                      } catch { setToast('Failed to withdraw'); }
                    }}>Withdraw</button>
                  )}
                </div>
              </div>
            ))}
            {trades.length === 0 && (
              <div className="empty-card">
                <Lottie loop play animationData={hittingAnimation} style={{ width: 200, height: 200 }} />
                <p>No trades yet. Kick things off with a cool proposal!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="release-history">
        <div className="card glass">
          <h3>My Release History</h3>
          <div className="release-list">
            {myReleases
              .filter(r => r.status === 'completed')
              .map(r => (
                <div key={r._id} className="release-item">
                  <span className="player-chip">
                    {r.player?.name}
                    {r.player?.type && (<span className={`type-badge ${String(r.player.type).toLowerCase()}`}>{r.player.type}</span>)}
                  </span>
                  <span className="release-icon" title="Released">
                    <FaUnlock />
                  </span>
                </div>
              ))}
            {myReleases.filter(r => r.status === 'completed').length === 0 && (
              <div className="empty">No releases yet</div>
            )}
          </div>
        </div>
      </div>

      
    </div>
  );
}

export default TradeCenter;


