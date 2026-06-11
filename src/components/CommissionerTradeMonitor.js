import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS } from '../const';

const LEG_STATUS_LABELS = {
  pending: 'Awaiting response',
  counter: 'Counter offered',
  admin_pending: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  completed: 'Completed',
};

function legStatusLabel(status) {
  return LEG_STATUS_LABELS[status] || status || '—';
}

function legStatusColor(status) {
  if (status === 'admin_pending') return '#16a34a';
  if (status === 'pending' || status === 'counter') return '#d97706';
  if (status === 'rejected' || status === 'withdrawn') return '#dc2626';
  return '#64748b';
}

const CommissionerTradeMonitor = ({ adminUserId }) => {
  const [standalonePending, setStandalonePending] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [bundleAutoApprove, setBundleAutoApprove] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!adminUserId) return;
    setLoading(true);
    setError('');
    try {
      const q = `?adminUserId=${encodeURIComponent(adminUserId)}`;
      const [tradesRes, bundlesRes] = await Promise.all([
        fetch(`${API_ENDPOINTS}/api/trades/admin/pending${q}`),
        fetch(`${API_ENDPOINTS}/api/trades/bundles/admin/pending${q}`),
      ]);
      const tradesJson = await tradesRes.json();
      const bundlesJson = await bundlesRes.json();

      if (!tradesRes.ok) {
        throw new Error(tradesJson.message || 'Failed to load pending trades');
      }
      if (!bundlesRes.ok) {
        throw new Error(bundlesJson.message || 'Failed to load bundle trades');
      }

      setStandalonePending(Array.isArray(tradesJson) ? tradesJson : []);
      if (Array.isArray(bundlesJson)) {
        setBundles(bundlesJson);
        setBundleAutoApprove(true);
      } else {
        setBundles(Array.isArray(bundlesJson.bundles) ? bundlesJson.bundles : []);
        setBundleAutoApprove(bundlesJson.bundleAutoApprove !== false);
      }
    } catch (err) {
      setError(err.message || 'Could not load trade status');
      setStandalonePending([]);
      setBundles([]);
    } finally {
      setLoading(false);
    }
  }, [adminUserId]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 20000);
    return () => clearInterval(timer);
  }, [load]);

  if (!adminUserId) return null;

  const hasActivity = standalonePending.length > 0 || bundles.length > 0;

  return (
    <div className="commissioner-trade-monitor">
      <div className="commissioner-trade-monitor__header">
        <h3 className="commissioner-trade-monitor__title">Live trade status</h3>
        <div className="commissioner-trade-monitor__actions">
          <button type="button" className="btn ghost" onClick={load} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <Link to="/admin/trades#trade-bundles" className="btn primary commissioner-trade-monitor__link">
            Open Admin Trades
          </Link>
        </div>
      </div>

      {error && <p className="commissioner-trade-monitor__error">{error}</p>}

      {!error && !loading && !hasActivity && (
        <p className="commissioner-trade-monitor__empty">No active trades or bundles awaiting action.</p>
      )}

      {standalonePending.length > 0 && (
        <div className="commissioner-trade-monitor__group">
          <h4 className="commissioner-trade-monitor__subtitle">Standalone trades ({standalonePending.length})</h4>
          {standalonePending.map((t) => (
            <div key={t._id} className="commissioner-trade-monitor__row">
              <strong>{t.fromUser?.teamName}</strong> ↔ <strong>{t.toUser?.teamName}</strong>
              {' — '}
              {t.offeredPlayer?.name} ↔ {t.requestedPlayer?.name}
              <span className="commissioner-trade-monitor__status commissioner-trade-monitor__status--ready">Ready to approve</span>
            </div>
          ))}
        </div>
      )}

      {bundles.length > 0 && (
        <div className="commissioner-trade-monitor__group">
          <h4 className="commissioner-trade-monitor__subtitle">
            Trade bundles ({bundles.length})
            {!bundleAutoApprove && (
              <span className="commissioner-trade-monitor__hint"> (manual approval)</span>
            )}
          </h4>
          {bundles.map((b) => (
            <div key={b._id} className="commissioner-trade-monitor__card">
              <div className="commissioner-trade-monitor__card-title">
                {b.title} <span className="commissioner-trade-monitor__hint">— {b.status}</span>
              </div>
              <div className="commissioner-trade-monitor__meta">
                Code {b.shareCode} · {b.progress?.acceptedLegs || 0}/{b.progress?.totalLegs || 0} legs accepted
              </div>
              {(b.legs || []).map(({ legIndex, trade }) => {
                const sideA = trade.fromUser?.teamName || trade.fromUser?.name || 'Team A';
                const sideB = trade.toUser?.teamName || trade.toUser?.name || 'Team B';
                const players = [trade.offeredPlayer?.name, trade.requestedPlayer?.name].filter(Boolean).join(' ↔ ');
                return (
                  <div key={trade._id} className="commissioner-trade-monitor__leg">
                    <div>
                      Leg {legIndex}: <strong>{sideA}</strong> ↔ <strong>{sideB}</strong>
                      {players ? ` (${players})` : ''}
                    </div>
                    <span
                      className="commissioner-trade-monitor__status"
                      style={{ color: legStatusColor(trade.status) }}
                    >
                      {legStatusLabel(trade.status)}
                    </span>
                  </div>
                );
              })}
              {b.status === 'ready_for_admin' && (
                <p className="commissioner-trade-monitor__ready-note">
                  All legs accepted — {bundleAutoApprove ? 'should auto-complete soon' : 'approve in Admin Trades'}.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommissionerTradeMonitor;
