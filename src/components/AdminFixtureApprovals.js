import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { FaCheck, FaEdit, FaTimes } from 'react-icons/fa';
import { API_ENDPOINTS } from '../const';
import '../css/AdminFixtureApprovals.css';

const fmtDate = (d) => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

const SCORE_REGEX = /^\d+\/\d+$/;

const validateEditForm = (form) => {
  const errors = {};
  if (!form.winner) errors.winner = 'Winner is required';
  if (!form.margin?.trim()) errors.margin = 'Margin is required';
  if (!form.team1Score?.trim()) errors.team1Score = 'Score required';
  else if (!SCORE_REGEX.test(form.team1Score.trim())) errors.team1Score = 'Use runs/wickets (e.g. 265/10)';
  if (!form.team2Score?.trim()) errors.team2Score = 'Score required';
  else if (!SCORE_REGEX.test(form.team2Score.trim())) errors.team2Score = 'Use runs/wickets (e.g. 134/10)';
  if (!form.team1Overs?.trim()) errors.team1Overs = 'Overs required';
  if (!form.team2Overs?.trim()) errors.team2Overs = 'Overs required';
  if (!form.momName?.trim()) errors.momName = 'MoM required';
  if (form.team1Fairness === '' || form.team1Fairness == null) errors.team1Fairness = 'Required';
  if (form.team2Fairness === '' || form.team2Fairness == null) errors.team2Fairness = 'Required';
  return errors;
};

const roleLabel = (role) => (role === 'opponent' ? 'Opponent' : 'Admin');

const SubmissionCard = ({
  item,
  mode,
  onReview,
  onQuickApprove,
  onReject,
  loadingId,
}) => {
  const isPending = item.status === 'pending';
  const busy = loadingId === item._id;
  const isAdminMode = mode === 'admin';
  const isOpponentMode = mode === 'opponent';
  const isMineMode = mode === 'mine';

  return (
    <article
      className={`admin-fixture-card${isPending && isAdminMode ? ' admin-fixture-card--clickable' : ''}`}
      onClick={isPending && isAdminMode && !busy ? () => onReview(item) : undefined}
      onKeyDown={
        isPending && isAdminMode && !busy
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onReview(item);
              }
            }
          : undefined
      }
      role={isPending && isAdminMode ? 'button' : undefined}
      tabIndex={isPending && isAdminMode ? 0 : undefined}
    >
      <div className="admin-fixture-card-head">
        <div>
          <div className="admin-fixture-match">
            {item.team1} vs {item.team2}
          </div>
          <div className="admin-fixture-submitter">
            Submitted by <strong>{item.submitterName || 'Unknown'}</strong>
            {item.submitterTeamName ? (
              <>
                {' '}
                · Team <strong>{item.submitterTeamName}</strong>
              </>
            ) : null}
          </div>
        </div>
        <span className={`admin-fixture-status admin-fixture-status--${item.status}`}>
          {item.status}
        </span>
      </div>

      <div className="admin-fixture-grid">
        <div className="admin-fixture-kv">
          <span>Winner</span>
          <strong>{item.winner || '—'}</strong>
        </div>
        <div className="admin-fixture-kv">
          <span>Margin</span>
          <strong>{item.margin || '—'}</strong>
        </div>
        <div className="admin-fixture-kv">
          <span>{item.team1} score</span>
          <strong>{item.team1Score || '—'}</strong>
        </div>
        <div className="admin-fixture-kv">
          <span>{item.team2} score</span>
          <strong>{item.team2Score || '—'}</strong>
        </div>
        <div className="admin-fixture-kv">
          <span>{item.team1} overs</span>
          <strong>{item.team1Overs || '—'}</strong>
        </div>
        <div className="admin-fixture-kv">
          <span>{item.team2} overs</span>
          <strong>{item.team2Overs || '—'}</strong>
        </div>
        <div className="admin-fixture-kv">
          <span>Man of the Match</span>
          <strong>
            {item.mom?.name || '—'}
            {item.mom?.score != null
              ? ` (${item.mom.score}${item.mom?.wickets ? `, ${item.mom.wickets} wkts` : ''})`
              : ''}
          </strong>
        </div>
        <div className="admin-fixture-kv">
          <span>Fairness</span>
          <strong>
            {item.team1}: {item.team1Fairness ?? '—'} · {item.team2}: {item.team2Fairness ?? '—'}
          </strong>
        </div>
      </div>

      {isPending && (isAdminMode || isOpponentMode) && (
        <div className="admin-fixture-actions" onClick={(e) => e.stopPropagation()}>
          {isAdminMode && (
            <button
              type="button"
              className="admin-fixture-btn admin-fixture-btn--edit"
              disabled={busy}
              onClick={() => onReview(item)}
            >
              <FaEdit aria-hidden /> Edit & approve
            </button>
          )}
          <button
            type="button"
            className="admin-fixture-btn admin-fixture-btn--approve"
            disabled={busy}
            onClick={() => onQuickApprove(item)}
          >
            <FaCheck aria-hidden /> {isOpponentMode ? 'Confirm result' : 'Approve as-is'}
          </button>
          <button
            type="button"
            className="admin-fixture-btn admin-fixture-btn--reject"
            disabled={busy}
            onClick={() => onReject(item)}
          >
            <FaTimes aria-hidden /> {isOpponentMode ? 'Dispute' : 'Reject'}
          </button>
        </div>
      )}

      {isPending && isAdminMode && (
        <p className="admin-fixture-tap-hint">Tap card to review and edit all fields before publishing.</p>
      )}

      {isPending && isOpponentMode && (
        <p className="admin-fixture-tap-hint">
          Your opponent submitted this result. Confirm if correct, or dispute if something is wrong.
        </p>
      )}

      {isPending && isMineMode && (
        <p className="admin-fixture-tap-hint">
          Waiting for your opponent or an admin to confirm this result.
        </p>
      )}

      {!isPending && item.adminDecision?.note && (
        <p className="admin-fixture-submitter" style={{ marginTop: '0.5rem' }}>
          Note: {item.adminDecision.note}
        </p>
      )}

      {!isPending && item.adminDecision?.decidedByRole && (
        <p className="admin-fixture-submitter">
          Confirmed by {roleLabel(item.adminDecision.decidedByRole)}
        </p>
      )}

      <p className="admin-fixture-time">
        {isPending ? 'Submitted' : 'Decided'} {fmtDate(isPending ? item.createdAt : item.adminDecision?.decidedAt)}
      </p>
    </article>
  );
};

const AdminFixtureApprovals = () => {
  const [tab, setTab] = useState('confirm');
  const [pending, setPending] = useState([]);
  const [opponentPending, setOpponentPending] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState('');
  const [toast, setToast] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editErrors, setEditErrors] = useState({});

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);
  const userId = user?.id || user?._id || '';
  const isAdmin = !!user?.isAdmin;

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const headers = { 'user-id': userId };
      const requests = [
        axios.get(`${API_ENDPOINTS}/api/fixture-submissions/opponent/pending`, { headers }),
        axios.get(`${API_ENDPOINTS}/api/fixture-submissions/my`, { headers }),
      ];
      if (isAdmin) {
        requests.push(
          axios.get(`${API_ENDPOINTS}/api/fixture-submissions/admin/pending`, { headers }),
          axios.get(`${API_ENDPOINTS}/api/fixture-submissions/admin/history`, { headers })
        );
      }

      const results = await Promise.all(requests);
      setOpponentPending(Array.isArray(results[0].data) ? results[0].data : []);
      setMySubmissions(Array.isArray(results[1].data) ? results[1].data : []);
      if (isAdmin) {
        setPending(Array.isArray(results[2].data) ? results[2].data : []);
        setHistory(Array.isArray(results[3].data) ? results[3].data : []);
      } else {
        setPending([]);
        setHistory([]);
      }
    } catch (err) {
      setToast({ type: 'err', message: err.response?.data?.error || 'Failed to load submissions' });
    } finally {
      setLoading(false);
    }
  }, [userId, isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const openEdit = (item) => {
    setEditErrors({});
    setEditItem(item);
    setEditForm({
      winner: item.winner || '',
      margin: item.margin || '',
      team1Score: item.team1Score || '',
      team2Score: item.team2Score || '',
      team1Overs: item.team1Overs || '',
      team2Overs: item.team2Overs || '',
      momName: item.mom?.name || '',
      momScore: item.mom?.score != null ? String(item.mom.score) : '',
      momWickets: item.mom?.wickets != null ? String(item.mom.wickets) : '',
      team1Fairness: item.team1Fairness != null ? String(item.team1Fairness) : '',
      team2Fairness: item.team2Fairness != null ? String(item.team2Fairness) : '',
      note: '',
    });
  };

  const approve = async (item, overrides = {}) => {
    setLoadingId(item._id);
    try {
      const body = isAdmin
        ? {
            winner: overrides.winner ?? item.winner,
            margin: overrides.margin ?? item.margin,
            team1Score: overrides.team1Score ?? item.team1Score,
            team2Score: overrides.team2Score ?? item.team2Score,
            team1Overs: overrides.team1Overs ?? item.team1Overs,
            team2Overs: overrides.team2Overs ?? item.team2Overs,
            mom: overrides.mom ?? item.mom,
            team1Fairness: overrides.team1Fairness ?? item.team1Fairness,
            team2Fairness: overrides.team2Fairness ?? item.team2Fairness,
            note: overrides.note || '',
          }
        : {};

      await axios.post(
        `${API_ENDPOINTS}/api/fixture-submissions/${item._id}/approve`,
        body,
        { headers: { 'user-id': userId } }
      );
      setToast({ type: 'ok', message: 'Fixture confirmed — points table updated.' });
      setEditItem(null);
      await load();
    } catch (err) {
      setToast({
        type: 'err',
        message: err.response?.data?.error || 'Confirmation failed',
      });
    } finally {
      setLoadingId('');
    }
  };

  const reject = async (item) => {
    const promptText = isAdmin ? 'Rejection reason (optional):' : 'Why are you disputing this result? (optional)';
    const note = window.prompt(promptText) ?? '';
    setLoadingId(item._id);
    try {
      await axios.post(
        `${API_ENDPOINTS}/api/fixture-submissions/${item._id}/reject`,
        { note },
        { headers: { 'user-id': userId } }
      );
      setToast({ type: 'ok', message: isAdmin ? 'Submission rejected.' : 'Result disputed — submitter can resubmit.' });
      await load();
    } catch (err) {
      setToast({ type: 'err', message: err.response?.data?.error || 'Action failed' });
    } finally {
      setLoadingId('');
    }
  };

  const handleEditApprove = () => {
    if (!editItem || !editForm) return;
    const errors = validateEditForm(editForm);
    if (Object.keys(errors).length) {
      setEditErrors(errors);
      setToast({ type: 'err', message: 'Fix the highlighted fields before publishing.' });
      return;
    }
    setEditErrors({});
    approve(editItem, {
      winner: editForm.winner,
      margin: editForm.margin,
      team1Score: editForm.team1Score,
      team2Score: editForm.team2Score,
      team1Overs: editForm.team1Overs,
      team2Overs: editForm.team2Overs,
      mom: {
        name: editForm.momName,
        score: editForm.momScore !== '' ? Number(editForm.momScore) : null,
        wickets: editForm.momWickets !== '' ? Number(editForm.momWickets) : null,
      },
      team1Fairness: Number(editForm.team1Fairness),
      team2Fairness: Number(editForm.team2Fairness),
      note: editForm.note,
    });
  };

  const confirmList = isAdmin ? pending : opponentPending;
  const myPendingCount = mySubmissions.filter((s) => s.status === 'pending').length;

  const list =
    tab === 'confirm'
      ? confirmList
      : tab === 'mine'
        ? mySubmissions
        : history;

  const cardMode =
    tab === 'confirm' ? (isAdmin ? 'admin' : 'opponent') : tab === 'mine' ? 'mine' : 'admin';

  if (!userId) {
    return (
      <div className="admin-fixture-page">
        <div className="admin-fixture-shell">
          <p className="admin-fixture-empty">Please log in to view match confirmations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-fixture-page">
      <div className="admin-fixture-shell">
        <header className="admin-fixture-header">
          <h1>{isAdmin ? 'Fixture Result Approvals' : 'Confirm Match Results'}</h1>
          <p>
            {isAdmin
              ? 'Review OCR submissions from teams. You or the opposing team can confirm a result.'
              : 'When your opponent submits a match result, confirm it here. An admin can also confirm.'}
          </p>
        </header>

        <div className="admin-fixture-tabs">
          <button
            type="button"
            className={`admin-fixture-tab${tab === 'confirm' ? ' is-active' : ''}`}
            onClick={() => setTab('confirm')}
          >
            {isAdmin ? 'All pending' : 'Needs your OK'}
            {confirmList.length > 0 && (
              <span className="admin-fixture-tab-badge">{confirmList.length}</span>
            )}
          </button>
          <button
            type="button"
            className={`admin-fixture-tab${tab === 'mine' ? ' is-active' : ''}`}
            onClick={() => setTab('mine')}
          >
            My submissions
            {myPendingCount > 0 && (
              <span className="admin-fixture-tab-badge">{myPendingCount}</span>
            )}
          </button>
          {isAdmin && (
            <button
              type="button"
              className={`admin-fixture-tab${tab === 'history' ? ' is-active' : ''}`}
              onClick={() => setTab('history')}
            >
              History
            </button>
          )}
        </div>

        {loading ? (
          <p className="admin-fixture-empty">Loading…</p>
        ) : list.length === 0 ? (
          <p className="admin-fixture-empty">
            {tab === 'confirm' &&
              (isAdmin
                ? 'No pending fixture submissions.'
                : 'No results waiting for your confirmation.')}
            {tab === 'mine' && 'You have not submitted any fixture results yet.'}
            {tab === 'history' && 'No approval history yet.'}
          </p>
        ) : (
          list.map((item) => (
            <SubmissionCard
              key={item._id}
              item={item}
              mode={cardMode}
              onReview={openEdit}
              onQuickApprove={approve}
              onReject={reject}
              loadingId={loadingId}
            />
          ))
        )}
      </div>

      {editItem && editForm && isAdmin && (
        <div
          className="admin-fixture-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setEditItem(null)}
        >
          <div className="admin-fixture-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>Edit & approve</h3>
            <p className="admin-fixture-modal-sub">
              {editItem.team1} vs {editItem.team2} · submitted by{' '}
              <strong>{editItem.submitterName}</strong> ({editItem.submitterTeamName})
            </p>
            <p className="admin-fixture-modal-hint">
              Change any incorrect OCR values below, then publish.
            </p>

            <div className={`admin-fixture-modal-field${editErrors.winner ? ' has-error' : ''}`}>
              <label>Winner *</label>
              <select
                value={editForm.winner}
                onChange={(e) => {
                  setEditForm({ ...editForm, winner: e.target.value });
                  setEditErrors((prev) => ({ ...prev, winner: undefined }));
                }}
              >
                <option value="">Select…</option>
                <option value={editItem.team1}>{editItem.team1}</option>
                <option value={editItem.team2}>{editItem.team2}</option>
              </select>
              {editErrors.winner && <span className="field-err">{editErrors.winner}</span>}
            </div>
            <div className={`admin-fixture-modal-field${editErrors.margin ? ' has-error' : ''}`}>
              <label>Margin *</label>
              <input
                value={editForm.margin}
                onChange={(e) => {
                  setEditForm({ ...editForm, margin: e.target.value });
                  setEditErrors((prev) => ({ ...prev, margin: undefined }));
                }}
                placeholder="e.g. 131 runs"
              />
              {editErrors.margin && <span className="field-err">{editErrors.margin}</span>}
            </div>
            <div className="admin-fixture-modal-grid">
              <div className={`admin-fixture-modal-field${editErrors.team1Score ? ' has-error' : ''}`}>
                <label>{editItem.team1} score *</label>
                <input
                  value={editForm.team1Score}
                  onChange={(e) => {
                    setEditForm({ ...editForm, team1Score: e.target.value });
                    setEditErrors((prev) => ({ ...prev, team1Score: undefined }));
                  }}
                  placeholder="265/10"
                />
                {editErrors.team1Score && <span className="field-err">{editErrors.team1Score}</span>}
              </div>
              <div className={`admin-fixture-modal-field${editErrors.team2Score ? ' has-error' : ''}`}>
                <label>{editItem.team2} score *</label>
                <input
                  value={editForm.team2Score}
                  onChange={(e) => {
                    setEditForm({ ...editForm, team2Score: e.target.value });
                    setEditErrors((prev) => ({ ...prev, team2Score: undefined }));
                  }}
                  placeholder="134/10"
                />
                {editErrors.team2Score && <span className="field-err">{editErrors.team2Score}</span>}
              </div>
              <div className={`admin-fixture-modal-field${editErrors.team1Overs ? ' has-error' : ''}`}>
                <label>{editItem.team1} overs *</label>
                <input
                  value={editForm.team1Overs}
                  onChange={(e) => {
                    setEditForm({ ...editForm, team1Overs: e.target.value });
                    setEditErrors((prev) => ({ ...prev, team1Overs: undefined }));
                  }}
                  placeholder="19.5"
                />
                {editErrors.team1Overs && <span className="field-err">{editErrors.team1Overs}</span>}
              </div>
              <div className={`admin-fixture-modal-field${editErrors.team2Overs ? ' has-error' : ''}`}>
                <label>{editItem.team2} overs *</label>
                <input
                  value={editForm.team2Overs}
                  onChange={(e) => {
                    setEditForm({ ...editForm, team2Overs: e.target.value });
                    setEditErrors((prev) => ({ ...prev, team2Overs: undefined }));
                  }}
                  placeholder="16.0"
                />
                {editErrors.team2Overs && <span className="field-err">{editErrors.team2Overs}</span>}
              </div>
            </div>
            <div className={`admin-fixture-modal-field${editErrors.momName ? ' has-error' : ''}`}>
              <label>Man of the Match *</label>
              <input
                value={editForm.momName}
                onChange={(e) => {
                  setEditForm({ ...editForm, momName: e.target.value });
                  setEditErrors((prev) => ({ ...prev, momName: undefined }));
                }}
              />
              {editErrors.momName && <span className="field-err">{editErrors.momName}</span>}
            </div>
            <div className="admin-fixture-modal-grid">
              <div className="admin-fixture-modal-field">
                <label>MoM runs</label>
                <input
                  type="number"
                  value={editForm.momScore}
                  onChange={(e) => setEditForm({ ...editForm, momScore: e.target.value })}
                />
              </div>
              <div className="admin-fixture-modal-field">
                <label>MoM wickets</label>
                <input
                  type="number"
                  value={editForm.momWickets}
                  onChange={(e) => setEditForm({ ...editForm, momWickets: e.target.value })}
                />
              </div>
              <div className={`admin-fixture-modal-field${editErrors.team1Fairness ? ' has-error' : ''}`}>
                <label>{editItem.team1} fairness *</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.team1Fairness}
                  onChange={(e) => {
                    setEditForm({ ...editForm, team1Fairness: e.target.value });
                    setEditErrors((prev) => ({ ...prev, team1Fairness: undefined }));
                  }}
                />
                {editErrors.team1Fairness && <span className="field-err">{editErrors.team1Fairness}</span>}
              </div>
              <div className={`admin-fixture-modal-field${editErrors.team2Fairness ? ' has-error' : ''}`}>
                <label>{editItem.team2} fairness *</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.team2Fairness}
                  onChange={(e) => {
                    setEditForm({ ...editForm, team2Fairness: e.target.value });
                    setEditErrors((prev) => ({ ...prev, team2Fairness: undefined }));
                  }}
                />
                {editErrors.team2Fairness && <span className="field-err">{editErrors.team2Fairness}</span>}
              </div>
            </div>
            <div className="admin-fixture-modal-field">
              <label>Admin note (optional)</label>
              <textarea
                value={editForm.note}
                onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                placeholder="e.g. corrected wickets from screenshot"
              />
            </div>

            <div className="admin-fixture-actions admin-fixture-actions--modal">
              <button
                type="button"
                className="admin-fixture-btn admin-fixture-btn--approve"
                disabled={!!loadingId}
                onClick={handleEditApprove}
              >
                <FaCheck aria-hidden /> Publish to points table
              </button>
              <button
                type="button"
                className="admin-fixture-btn admin-fixture-btn--reject"
                onClick={() => {
                  setEditItem(null);
                  setEditErrors({});
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`admin-fixture-toast admin-fixture-toast--${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default AdminFixtureApprovals;
