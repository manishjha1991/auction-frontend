import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { API_ENDPOINTS } from '../const';
import PlayerAvatar from './PlayerAvatar';
import {
  FaCheck,
  FaTimes,
  FaCopy,
  FaShareAlt,
  FaLink,
  FaExchangeAlt,
  FaArrowLeft,
  FaLayerGroup,
  FaPlus,
} from 'react-icons/fa';
import '../css/TradeBundle.css';

function statusLabel(status) {
  const map = {
    draft: 'Draft',
    pending_acceptance: 'Waiting for accepts',
    ready_for_admin: 'Ready — auto-approve',
    blocked: 'Blocked',
    completed: 'Completed',
    cancelled: 'Cancelled',
    rejected: 'Rejected',
  };
  return map[status] || status;
}

function TradeBundlePage() {
  const { bundleId, shareCode } = useParams();
  const [user, setUser] = useState(null);
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newNote, setNewNote] = useState('');

  const uid = user?.id || user?._id;

  useEffect(() => {
    const cached = localStorage.getItem('user');
    if (cached) setUser(JSON.parse(cached));
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(t);
  }, [toast]);

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
    return `${window.location.origin}/trade/bundle/code/${bundle.shareCode}`;
  }, [bundle]);

  const progressPct = useMemo(() => {
    if (!bundle?.progress?.totalLegs) return 0;
    return Math.round((bundle.progress.acceptedLegs / bundle.progress.totalLegs) * 100);
  }, [bundle]);

  async function createBundle() {
    if (!uid || !newTitle.trim()) {
      setToast('Please enter a bundle title');
      return;
    }
    setCreating(true);
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
    } finally {
      setCreating(false);
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
      if (!r.ok) throw new Error(j.message || 'Failed');
      if (j.bundleAutoResult?.ok) {
        setToast('All legs completed — bundle auto-approved!');
      } else if (j.bundleAutoResult?.blockers?.length) {
        setToast('Bundle blocked — see details below');
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
    navigator.clipboard.writeText(shareUrl).then(() => setToast('Link copied to clipboard!'));
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
      <div className="bundle-page">
        {toast && <div className="bundle-toast">{toast}</div>}
        <Link to="/trade" className="bundle-back-link">
          <FaArrowLeft /> Back to Trade Center
        </Link>

        <div className="bundle-create-hero">
          <h1>
            <FaLayerGroup />
            Create trade bundle
          </h1>
          <p className="bundle-subtitle">
            Link <strong>2 or more</strong> trades into one deal. Everyone accepts → system runs{' '}
            <strong>all legs together</strong> or <strong>none</strong>.
          </p>
          <div className="bundle-steps">
            <div className="bundle-step-pill">
              <strong>1</strong>
              <span>Create &amp; share</span>
            </div>
            <div className="bundle-step-pill">
              <strong>2</strong>
              <span>Add legs</span>
            </div>
            <div className="bundle-step-pill">
              <strong>3</strong>
              <span>All accept</span>
            </div>
            <div className="bundle-step-pill">
              <strong>4</strong>
              <span>Auto-complete</span>
            </div>
          </div>
        </div>

        {!uid ? (
          <div className="bundle-form-card">
            <p style={{ margin: 0, color: '#64748b', fontWeight: 600 }}>
              Please <Link to="/login">log in</Link> to create a bundle.
            </p>
          </div>
        ) : (
          <div className="bundle-form-card">
            <div className="bundle-field">
              <label htmlFor="bundle-title">Bundle title</label>
              <input
                id="bundle-title"
                className="bundle-input"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Warner three-team deal"
              />
            </div>
            <div className="bundle-field">
              <label htmlFor="bundle-note">Commitment note (optional)</label>
              <textarea
                id="bundle-note"
                className="bundle-textarea"
                rows={3}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Describe what every team agreed to..."
              />
            </div>
            <button
              type="button"
              className="bundle-btn-primary"
              onClick={createBundle}
              disabled={creating}
            >
              <FaLayerGroup />
              {creating ? 'Creating…' : 'Create bundle'}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bundle-page">
        <div className="bundle-loading">
          <div className="bundle-loading-spinner" />
          <span>Loading bundle…</span>
        </div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="bundle-page">
        <Link to="/trade" className="bundle-back-link">
          <FaArrowLeft /> Back to Trade Center
        </Link>
        <div className="bundle-empty-legs">
          <div className="empty-icon">📭</div>
          <p>Bundle not found or link expired.</p>
          <Link to="/trade/bundle/create" className="bundle-btn-primary" style={{ textDecoration: 'none' }}>
            Create new bundle
          </Link>
        </div>
      </div>
    );
  }

  const legs = bundle.legs || [];
  const totalLegs = bundle.progress?.totalLegs || legs.length;
  const acceptedLegs = bundle.progress?.acceptedLegs || 0;

  return (
    <div className="bundle-page">
      {toast && <div className="bundle-toast">{toast}</div>}

      <Link to="/trade" className="bundle-back-link">
        <FaArrowLeft /> Back to Trade Center
      </Link>

      <div className="bundle-detail-hero">
        <h1>{bundle.title}</h1>
        <div className="bundle-status-row">
          <span className={`bundle-status-badge ${bundle.status}`}>{statusLabel(bundle.status)}</span>
          <div className="bundle-progress-wrap">
            <div className="bundle-progress-label">
              {acceptedLegs} / {totalLegs} legs accepted (minimum 2)
            </div>
            <div className="bundle-progress-bar">
              <div className="bundle-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>
        {bundle.commitmentNote && (
          <p className="bundle-commitment-note">{bundle.commitmentNote}</p>
        )}
        <div className="bundle-share-row">
          <button type="button" className="bundle-btn-secondary" onClick={copyLink}>
            <FaCopy /> Copy link
          </button>
          <button type="button" className="bundle-btn-secondary" onClick={shareWhatsApp}>
            <FaShareAlt /> WhatsApp
          </button>
          <div className="bundle-link-chip">
            <FaLink />
            {shareUrl}
          </div>
        </div>
      </div>

      {bundle.blockers?.length > 0 && (
        <div className="bundle-warn-box">
          <div className="bundle-warn-title">Bundle blocked — fix these issues</div>
          <ul>
            {bundle.blockers.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      <h2 className="bundle-section-title">Trade legs</h2>

      {legs.length === 0 ? (
        <div className="bundle-empty-legs">
          <div className="empty-icon">🔗</div>
          <p>No legs yet. Add at least 2 trades to this bundle.</p>
          {uid && ['draft', 'pending_acceptance', 'blocked'].includes(bundle.status) && (
            <Link to={`/trade?bundleId=${bundle._id}`} className="bundle-btn-primary" style={{ textDecoration: 'none' }}>
              <FaPlus /> Add first leg
            </Link>
          )}
        </div>
      ) : (
        <div className="bundle-legs-grid">
          {legs.map(({ legIndex, trade, approvalWarnings }) => {
            const isRecipient = uid && String(trade.toUser?._id) === String(uid);
            const canAccept = isRecipient && trade.status === 'pending';
            const hasBlockers = approvalWarnings?.length > 0;
            return (
              <div key={trade._id} className="bundle-leg-card">
                <div className="bundle-leg-header">
                  <div className="bundle-leg-title">
                    <span className="leg-num">Leg {legIndex}</span>
                    {trade.fromUser?.teamName} → {trade.toUser?.teamName}
                  </div>
                  <span className={`bundle-leg-status ${trade.status}`}>{trade.status.replace('_', ' ')}</span>
                </div>
                <div className="bundle-swap-row">
                  <div className="bundle-player-chip">
                    <PlayerAvatar
                      profilePicture={trade.offeredPlayer?.profilePicture}
                      name={trade.offeredPlayer?.name}
                      size={36}
                    />
                    <span>{trade.offeredPlayer?.name}</span>
                  </div>
                  <span className="bundle-swap-arrow">↔</span>
                  <div className="bundle-player-chip">
                    <PlayerAvatar
                      profilePicture={trade.requestedPlayer?.profilePicture}
                      name={trade.requestedPlayer?.name}
                      size={36}
                    />
                    <span>{trade.requestedPlayer?.name}</span>
                  </div>
                </div>
                {hasBlockers && (
                  <div className="bundle-warn-box">
                    <div className="bundle-warn-title">Cannot accept yet</div>
                    <ul>
                      {approvalWarnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {canAccept && (
                  <div className="bundle-leg-actions">
                    <button
                      type="button"
                      className="bundle-btn-accept"
                      disabled={hasBlockers}
                      onClick={() => respondLeg(trade._id, 'accept')}
                    >
                      <FaCheck /> Accept leg
                    </button>
                    <button
                      type="button"
                      className="bundle-btn-reject"
                      onClick={() => respondLeg(trade._id, 'reject')}
                    >
                      <FaTimes /> Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {uid && ['draft', 'pending_acceptance', 'blocked'].includes(bundle.status) && legs.length > 0 && (
        <div className="bundle-cta-card">
          <p>
            <FaExchangeAlt style={{ marginRight: 8 }} />
            Need another swap? Add more legs from Trade Center.
          </p>
          <Link to={`/trade?bundleId=${bundle._id}`} className="bundle-btn-primary" style={{ textDecoration: 'none' }}>
            <FaPlus /> Add leg
          </Link>
        </div>
      )}
    </div>
  );
}

export default TradeBundlePage;
