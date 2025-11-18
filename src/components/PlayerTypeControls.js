import React, { useEffect, useState } from 'react';
import '../css/PlayerTypeControls.css';
import { API_ENDPOINTS } from '../const';

const TYPE_META = {
  Sapphire: { accent: '#00d4ff', gradient: 'linear-gradient(135deg, rgba(0, 100, 150, 0.3), rgba(0, 60, 100, 0.4))' },
  Emerald: { accent: '#00ff88', gradient: 'linear-gradient(135deg, rgba(0, 120, 60, 0.3), rgba(0, 70, 40, 0.4))' },
  Gold: { accent: '#ffd700', gradient: 'linear-gradient(135deg, rgba(180, 140, 0, 0.3), rgba(140, 100, 0, 0.4))' },
  Silver: { accent: '#c0c0c0', gradient: 'linear-gradient(135deg, rgba(120, 120, 120, 0.3), rgba(80, 80, 80, 0.4))' },
};

const PlayerTypeControls = ({ adminUserId, showHeader = true }) => {
  const [typeStatus, setTypeStatus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState('');
  const [error, setError] = useState('');

  const fetchStatus = async () => {
    if (!adminUserId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `${API_ENDPOINTS}/api/admin-tools/player-type/status?adminUserId=${adminUserId}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Unable to load status');
      setTypeStatus(data.types || []);
    } catch (err) {
      setError(err.message || 'Failed to load player type status');
    } finally {
      setLoading(false);
      setActionType('');
    }
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminUserId]);

  const handleToggle = async (type, enable) => {
    if (!adminUserId) return;
    setActionType(type);
    setError('');
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/admin-tools/player-type/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId, type, enable }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Unable to update players');
      await fetchStatus();
    } catch (err) {
      setError(err.message || 'Failed to update player type');
      setActionType('');
    }
  };

  return (
    <div className="ptc-wrapper">
      {showHeader && (
        <div className="ptc-header">
          <div>
            <h3>Player Availability Controls</h3>
            <p>Enable or disable unsold players from the auction pool by tier.</p>
          </div>
          <button
            className="ptc-refresh"
            onClick={fetchStatus}
            disabled={loading || !adminUserId}
          >
            Refresh
          </button>
        </div>
      )}
      {error && <div className="ptc-error">{error}</div>}
      <div className="ptc-grid">
        {typeStatus.map((item) => {
          const meta = TYPE_META[item.type] || {};
          return (
            <div
              key={item.type}
              className={`ptc-card ${item.type.toLowerCase()}`}
              style={{ background: meta.gradient }}
            >
              <div className="ptc-card-header">
                <span className="ptc-type">{item.type}</span>
                <span
                  className={`ptc-status ${item.isEnabled ? 'enabled' : 'disabled'}`}
                  style={{ color: meta.accent }}
                >
                  {item.isEnabled ? 'Active' : 'Paused'}
                </span>
              </div>
              <div className="ptc-card-body">
                <div className="ptc-stat">
                  <span>Unsold</span>
                  <strong>{item.totalUnsold}</strong>
                </div>
                <div className="ptc-stat">
                  <span>Available</span>
                  <strong>{item.activeUnsold}</strong>
                </div>
                <div className="ptc-stat">
                  <span>Hidden</span>
                  <strong>{item.inactiveUnsold}</strong>
                </div>
              </div>
              <label className="ptc-switch">
                <input
                  type="checkbox"
                  checked={item.isEnabled}
                  onChange={(e) => handleToggle(item.type, e.target.checked)}
                  disabled={loading || actionType === item.type || !adminUserId}
                />
                <span className="ptc-slider" />
              </label>
            </div>
          );
        })}
        {!loading && typeStatus.length === 0 && (
          <div className="ptc-empty">No player tiers found.</div>
        )}
      </div>
    </div>
  );
};

export default PlayerTypeControls;

