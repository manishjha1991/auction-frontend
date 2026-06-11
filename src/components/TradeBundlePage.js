import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { API_ENDPOINTS } from '../const';
import PlayerAvatar from './PlayerAvatar';
import { FaCheck, FaTimes, FaCopy, FaShareAlt, FaLink, FaExchangeAlt } from 'react-icons/fa';
import '../css/TradeCenter.css';

function TradeBundlePage() {
  const { bundleId, shareCode } = useParams();
  const [user, setUser] = useState(null);
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newNote, setNewNote] = useState('');

  const uid = user?.id || user?._id;

  useEffect(() => {
    const cached = localStorage.getItem('user');
    if (cached) setUser(JSON.parse(cached));
  }, []);

  async function loadBundle() {
    setLoading(true);
    try {
      let url = '';
      if (shareCode) url = `${API_ENDPOINTS}/api/trades/bundles/code/${shareCode}`;
      else if (bundleId) url = `${API_ENDPOINTS}/api/trades/bundles/${bundleId}`;
      if (!url) return;
      const r = await fetch(url);
      if (!r.ok) throw new Error('Bundle not found');
      setBundle(await r.json());
    } catch (e) {
      setToast(e.message || 'Failed to load bundle');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (bundleId || shareCode) loadBundle();
    else setLoading(false);
  }, [bundleId, shareCode]);

  const shareUrl = useMemo(() => {
    if (!bundle?.shareCode) return '';
    const base = window.location.origin;
    return `${base}/trade/bundle/code/${bundle.shareCode}`;
  }, [bundle]);

  async function createBundle() {
    if (!uid || !newTitle.trim()) {
      setToast('Title required');
      return;
    }
    try {
      const r = await fetch(`${API_ENDPOINTS}/api/trades/bundles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          createdBy: uid,
          title: newTitle.trim(),
          commitmentNote: newNote,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || 'Failed');
      window.location.href = `/trade/bundle/code/${j.shareCode}`;
    } catch (e) {
      setToast(e.message || 'Create failed');
    }
  }

  async function respondLeg(tradeId, decision) {
    try {
      const r = await fetch(`${API_ENDPOINTS}/api/trades/${tradeId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ byUserId: uid, decision }),
      });
      const j = await r.json();
      if (!r.ok) {
        throw new Error(j.message || 'Failed');
      }
      if (j.bundleAutoResult?.ok) {
        setToast('Bundle auto-approved — all legs completed!');
      } else if (j.bundleAutoResult?.blockers?.length) {
        setToast(`Bundle blocked: ${j.bundleAutoResult.blockers.join(' ')}`);
      } else {
        setToast(decision === 'accept' ? 'Leg accepted' : 'Leg rejected');
      }
      await loadBundle();
    } catch (e) {
      setToast(e.message || 'Action failed');
    }
  }

  function copyLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => setToast('Link copied!'));
  }

  function shareWhatsApp() {
    if (!shareUrl || !bundle) return;
    const text = encodeURIComponent(
      `CPL bundle: ${bundle.title}\nOpen: ${shareUrl}\nAll legs must complete together.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }

  if (!bundleId && !shareCode) {
    return (
      <div className="trade-page" style={{ padding: 24 }}>
        <h1><FaExchangeAlt style={{ marginRight: 8 }} />Create trade bundle</h1>
        <p>Link 2 or more trades for all-or-nothing commitment.</p>
        {!uid ? (
          <p>Please <Link to="/login">log in</Link> first.</p>
        ) : (
          <div style={{ maxWidth: 480 }}>
            <label>Bundle title</label>
            <input className="form-control" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Double swap deal" />
            <label style={{ marginTop: 12 }}>Commitment note (optional)</label>
            <textarea className="form-control" rows={3} value={newNote} onChange={(e) => setNewNote(e.target.value)} />
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={createBundle}>Create bundle</button>
          </div>
        )}
        <p style={{ marginTop: 24 }}><Link to="/trade">← Back to Trade Center</Link></p>
      </div>
    );
  }

  if (loading) return <div className="trade-page" style={{ padding: 24 }}>Loading bundle...</div>;
  if (!bundle) return <div className="trade-page" style={{ padding: 24 }}>Bundle not found. <Link to="/trade">Trade Center</Link></div>;

  return (
    <div className="trade-page" style={{ padding: 24 }}>
      {toast && <div className="toast">{toast}</div>}
      <div className="trade-hero">
        <h1>{bundle.title}</h1>
        <p>Status: <strong>{bundle.status}</strong> — {bundle.progress?.acceptedLegs || 0} / {bundle.progress?.totalLegs || 0} legs accepted (min 2)</p>
        {bundle.commitmentNote && <p>{bundle.commitmentNote}</p>}
        <div className="usage-row">
          <button className="btn btn-secondary" onClick={copyLink}><FaCopy style={{ marginRight: 6 }} />Copy link</button>
          <button className="btn btn-secondary" onClick={shareWhatsApp}><FaShareAlt style={{ marginRight: 6 }} />WhatsApp</button>
          <span className="usage-badge"><FaLink style={{ marginRight: 6 }} />{shareUrl}</span>
        </div>
      </div>

      {bundle.blockers?.length > 0 && (
        <div className="trade-approval-warn">
          <div className="trade-approval-warn-title">Bundle blocked</div>
          <ul className="trade-approval-warn-list">
            {bundle.blockers.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        </div>
      )}

      <h2>Legs</h2>
      {(bundle.legs || []).map(({ legIndex, trade, approvalWarnings }) => {
        const isRecipient = uid && String(trade.toUser?._id) === String(uid);
        const canAccept = isRecipient && trade.status === 'pending';
        const hasBlockers = approvalWarnings?.length > 0;
        return (
          <div key={trade._id} className="trade-item" style={{ marginBottom: 16 }}>
            <div className="trade-item-header">
              <span>Leg {legIndex}: {trade.fromUser?.teamName} → {trade.toUser?.teamName}</span>
              <span className={`status ${trade.status}`}>{trade.status}</span>
            </div>
            <div className="offer-line">
              <span className="offer-chip">
                <PlayerAvatar profilePicture={trade.offeredPlayer?.profilePicture} name={trade.offeredPlayer?.name} size={22} />
                <span className="nm">{trade.offeredPlayer?.name}</span>
              </span>
              <span className="chip-arrow">↔</span>
              <span className="offer-chip">
                <PlayerAvatar profilePicture={trade.requestedPlayer?.profilePicture} name={trade.requestedPlayer?.name} size={22} />
                <span className="nm">{trade.requestedPlayer?.name}</span>
              </span>
            </div>
            {hasBlockers && (
              <div className="trade-approval-warn">
                <ul className="trade-approval-warn-list">
                  {approvalWarnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}
            {canAccept && (
              <div className="item-actions">
                <button className="btn btn-success" disabled={hasBlockers} onClick={() => respondLeg(trade._id, 'accept')}>
                  <FaCheck style={{ marginRight: 6 }} />Accept
                </button>
                <button className="btn btn-danger" onClick={() => respondLeg(trade._id, 'reject')}>
                  <FaTimes style={{ marginRight: 6 }} />Reject
                </button>
              </div>
            )}
            {canAccept && hasBlockers && (
              <p style={{ color: '#b45309', fontSize: 13 }}>Fix purse/roster issues before accepting.</p>
            )}
          </div>
        );
      })}

      {uid && ['draft', 'pending_acceptance', 'blocked'].includes(bundle.status) && (
        <p>
          <Link className="btn btn-primary" to={`/trade?bundleId=${bundle._id}`}>Add leg in Trade Center</Link>
          {' '}(propose swaps while this bundle is linked)
        </p>
      )}

      <p style={{ marginTop: 24 }}><Link to="/trade">← Back to Trade Center</Link></p>
    </div>
  );
}

export default TradeBundlePage;
