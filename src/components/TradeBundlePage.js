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
  FaPaperPlane,
  FaTrash,
} from 'react-icons/fa';
import '../css/TradeBundle.css';

function normalizeTeamsResponse(json) {
  const data = json?.teams ?? json;
  return Array.isArray(data) ? data : [];
}

function normalizePlayersResponse(json) {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.players)) return json.players;
  return [];
}

function playerId(p) {
  const raw = p?.id ?? p?._id;
  if (raw == null) return '';
  if (typeof raw === 'object' && raw.$oid) return String(raw.$oid);
  return String(raw);
}

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

function BundleAddLegForm({
  uid,
  user,
  bundle,
  onAdded,
  onError,
}) {
  const [teams, setTeams] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState('');
  const [targetTeamId, setTargetTeamId] = useState('');
  const [targetPlayerId, setTargetPlayerId] = useState('');

  const teamName = user?.teamName;

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    (async () => {
      setDataLoading(true);
      try {
        const [teamsRes, playersRes] = await Promise.all([
          fetch(`${API_ENDPOINTS}/api/users/teams`),
          fetch(`${API_ENDPOINTS}/api/players/data`),
        ]);
        if (!teamsRes.ok || !playersRes.ok) throw new Error('Could not load teams or players');
        const teamsJson = await teamsRes.json();
        const playersJson = await playersRes.json();
        if (!cancelled) {
          setTeams(normalizeTeamsResponse(teamsJson));
          setAllPlayers(normalizePlayersResponse(playersJson));
        }
      } catch (e) {
        if (!cancelled) onError(e.message || 'Failed to load roster data');
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [uid, onError]);

  const myRoster = useMemo(() => {
    if (!teamName || !allPlayers.length) return [];
    return allPlayers.filter((p) => {
      if (p.teamName === teamName) return true;
      if (p.status === 'Sold' && uid && p.currentBidderId && String(p.currentBidderId) === String(uid)) {
        return true;
      }
      return false;
    });
  }, [allPlayers, teamName, uid]);

  const otherTeams = useMemo(
    () => teams.filter((t) => String(t._id || t.id) !== String(uid)),
    [teams, uid]
  );

  const selectedTargetTeam = useMemo(
    () => teams.find((t) => String(t._id || t.id) === String(targetTeamId)),
    [teams, targetTeamId]
  );

  const targetRoster = useMemo(() => {
    if (!selectedTargetTeam?.teamName) return [];
    return allPlayers.filter((p) => p.teamName === selectedTargetTeam.teamName);
  }, [selectedTargetTeam, allPlayers]);

  const selectedMyPlayer = myRoster.find((p) => String(playerId(p)) === String(myPlayerId));
  const selectedTheirPlayer = targetRoster.find((p) => String(playerId(p)) === String(targetPlayerId));

  async function submitLeg(e) {
    e.preventDefault();
    if (!myPlayerId || !targetTeamId || !targetPlayerId) {
      onError('Pick your player, target team, and their player.');
      return;
    }
    setAdding(true);
    try {
      const r = await fetch(`${API_ENDPOINTS}/api/trades/bundles/${bundle._id}/legs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: String(uid),
          offeredPlayerId: String(myPlayerId),
          requestedPlayerId: String(targetPlayerId),
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || 'Could not add leg');
      setMyPlayerId('');
      setTargetTeamId('');
      setTargetPlayerId('');
      onAdded(j);
    } catch (err) {
      onError(err.message || 'Could not add leg');
    } finally {
      setAdding(false);
    }
  }

  if (!teamName) {
    return (
      <div className="bundle-form-card bundle-add-leg-card">
        <h3 className="bundle-add-leg-title">Add a leg (your swap)</h3>
        <p className="bundle-add-leg-hint">
          Log in as a <strong>team owner</strong> to add a trade leg. Each team adds their own swap here.
        </p>
      </div>
    );
  }

  return (
    <div className="bundle-form-card bundle-add-leg-card">
      <div className="bundle-add-leg-header">
        <h3 className="bundle-add-leg-title">
          <FaPlus />
          Add a leg
        </h3>
        <span className="bundle-add-leg-team-badge">{teamName}</span>
      </div>
      <p className="bundle-add-leg-hint">
        Step 1 → your player · Step 2 → other team · Step 3 → their player · then tap <strong>Add to bundle</strong>.
      </p>

      {dataLoading ? (
        <div className="bundle-loading-inline">
          <div className="bundle-loading-spinner" />
          Loading teams &amp; players…
        </div>
      ) : (
        <form className="bundle-leg-form" onSubmit={submitLeg}>
          <div className="bundle-leg-steps">
            <div className="bundle-leg-step">
              <span className="bundle-leg-step-num">1</span>
              <div className="bundle-field bundle-field-compact">
                <label htmlFor="leg-my-player">Your player (you give)</label>
                <select
                  id="leg-my-player"
                  className="bundle-select"
                  value={myPlayerId}
                  onChange={(ev) => setMyPlayerId(ev.target.value)}
                >
                  <option value="">Tap to choose…</option>
                  {myRoster.length === 0 ? (
                    <option value="" disabled>No players on your roster</option>
                  ) : (
                    myRoster.map((p) => (
                      <option key={playerId(p)} value={playerId(p)}>
                        {p.name} ({p.role})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="bundle-leg-step">
              <span className="bundle-leg-step-num">2</span>
              <div className="bundle-field bundle-field-compact">
                <label htmlFor="leg-target-team">Other team</label>
                <select
                  id="leg-target-team"
                  className="bundle-select"
                  value={targetTeamId}
                  onChange={(ev) => {
                    setTargetTeamId(ev.target.value);
                    setTargetPlayerId('');
                  }}
                >
                  <option value="">Tap to choose team…</option>
                  {otherTeams.length === 0 ? (
                    <option value="" disabled>No other teams found</option>
                  ) : (
                    otherTeams.map((t) => (
                      <option key={t._id || t.id} value={t._id || t.id}>
                        {t.teamName}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="bundle-leg-step">
              <span className="bundle-leg-step-num">3</span>
              <div className="bundle-field bundle-field-compact">
                <label htmlFor="leg-target-player">Their player (you get)</label>
                <select
                  id="leg-target-player"
                  className="bundle-select"
                  value={targetPlayerId}
                  onChange={(ev) => setTargetPlayerId(ev.target.value)}
                  disabled={!targetTeamId}
                >
                  <option value="">
                    {targetTeamId ? 'Tap to choose player…' : 'Pick a team first'}
                  </option>
                  {targetRoster.map((p) => (
                    <option key={playerId(p)} value={playerId(p)}>
                      {p.name} ({p.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {selectedMyPlayer && selectedTheirPlayer && selectedTargetTeam && (
            <div className="bundle-leg-preview">
              <div className="bundle-leg-preview-chip give">
                <small>You give</small>
                <strong>{selectedMyPlayer.name}</strong>
              </div>
              <span className="bundle-swap-arrow">↔</span>
              <div className="bundle-leg-preview-chip get">
                <small>From {selectedTargetTeam.teamName}</small>
                <strong>{selectedTheirPlayer.name}</strong>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="bundle-btn-primary bundle-btn-full"
            disabled={adding || !myPlayerId || !targetTeamId || !targetPlayerId}
          >
            <FaPaperPlane />
            {adding ? 'Adding…' : 'Add to bundle'}
          </button>
        </form>
      )}
    </div>
  );
}

function TradeBundlePage() {
  const { bundleId, shareCode } = useParams();
  const [user, setUser] = useState(null);
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
    const t = setTimeout(() => setToast(''), 5000);
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

  const isCreator = bundle && uid && String(bundle.createdBy) === String(uid);
  const canEditBundle = bundle && ['draft', 'pending_acceptance', 'blocked'].includes(bundle.status);
  const canDeleteBundle =
    bundle &&
    isCreator &&
    !['completed', 'cancelled', 'rejected'].includes(bundle.status) &&
    !(bundle.legs || []).some((leg) =>
      ['admin_pending', 'completed'].includes(leg.trade?.status)
    );

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
      `CPL bundle: ${bundle.title}\nOpen: ${shareUrl}\nAdd your leg on this page, then accept when ready.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }

  function handleLegAdded(updatedBundle) {
    setBundle(updatedBundle);
    const n = updatedBundle?.progress?.totalLegs || updatedBundle?.legs?.length || 0;
    setToast(`Leg ${n} added! ${n < 2 ? 'Add at least one more leg.' : 'Share link so other teams can accept.'}`);
  }

  async function deleteBundle() {
    if (!uid || !bundle?._id) return;
    const legCount = bundle.legs?.length || 0;
    const msg =
      legCount > 0
        ? `Delete "${bundle.title}"? This withdraws ${legCount} pending leg(s) and removes the bundle.`
        : `Delete draft bundle "${bundle.title}"?`;
    if (!window.confirm(msg)) return;

    setDeleting(true);
    try {
      const r = await fetch(
        `${API_ENDPOINTS}/api/trades/bundles/${bundle._id}?byUserId=${encodeURIComponent(uid)}`,
        { method: 'DELETE' }
      );
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || 'Could not delete bundle');
      setToast('Bundle deleted');
      setTimeout(() => {
        window.location.href = '/trade';
      }, 800);
    } catch (e) {
      setToast(e.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
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
              <span>Add legs here</span>
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
  const legsNeeded = Math.max(0, 2 - totalLegs);

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
              {acceptedLegs} / {totalLegs} legs accepted
              {legsNeeded > 0 && ` — need ${legsNeeded} more leg${legsNeeded > 1 ? 's' : ''}`}
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
          {canDeleteBundle && (
            <button
              type="button"
              className="bundle-btn-delete"
              onClick={deleteBundle}
              disabled={deleting}
            >
              <FaTrash /> {deleting ? 'Deleting…' : 'Delete bundle'}
            </button>
          )}
          <div className="bundle-link-chip">
            <FaLink />
            {shareUrl}
          </div>
        </div>
      </div>

      <div className="bundle-how-to-card">
        <strong>How it works</strong>
        <ol>
          <li>Each team opens this link and uses <strong>Add a leg</strong> below.</li>
          <li>Need at least <strong>2 legs</strong> in the bundle.</li>
          <li>Receiving team clicks <strong>Accept leg</strong> on their swap.</li>
          <li>When everyone accepts → all trades complete together.</li>
        </ol>
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

      {canEditBundle && (
        uid ? (
          <BundleAddLegForm
            uid={uid}
            user={user}
            bundle={bundle}
            onAdded={handleLegAdded}
            onError={setToast}
          />
        ) : (
          <div className="bundle-form-card">
            <p style={{ margin: 0, fontWeight: 600, color: '#64748b' }}>
              <Link to="/login">Log in</Link> to add a leg or accept your swap.
            </p>
          </div>
        )
      )}

      {legs.length > 0 && legs.some((l) => l.approvalWarnings?.length > 0) && (
        <div className="bundle-warn-box">
          <div className="bundle-warn-title">Bundle checks (all legs together)</div>
          <ul>
            {[...new Set(legs.flatMap((l) => l.approvalWarnings || []))].map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
          <p style={{ margin: '10px 0 0', fontSize: '0.85rem', color: '#92400e' }}>
            These checks run when <strong>all legs are accepted</strong>. You can still accept each leg — the deal completes only if the full package passes.
          </p>
        </div>
      )}

      <h2 className="bundle-section-title">Trade legs ({totalLegs})</h2>

      {legs.length === 0 ? (
        <div className="bundle-empty-legs">
          <div className="empty-icon">🔗</div>
          <p>No legs yet. Use the form above to add your first swap.</p>
        </div>
      ) : (
        <div className="bundle-legs-grid">
          {legs.map(({ legIndex, trade, approvalWarnings, acceptBlockers }) => {
            const toUserId = trade.toUser?._id || trade.toUser;
            const isRecipient = uid && String(toUserId) === String(uid);
            const canAccept = isRecipient && trade.status === 'pending';
            const legBlockers = acceptBlockers?.length ? acceptBlockers : [];
            const hasLegBlockers = legBlockers.length > 0;
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
                {hasLegBlockers && (
                  <div className="bundle-warn-box">
                    <div className="bundle-warn-title">Cannot accept this leg yet</div>
                    <ul>
                      {legBlockers.map((w, i) => (
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
                      disabled={hasLegBlockers}
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
    </div>
  );
}

export default TradeBundlePage;
