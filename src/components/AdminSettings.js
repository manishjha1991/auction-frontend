import React, { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../const';
import '../css/AdminSettings.css';

function AdminSettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [enableTradeCenter, setEnableTradeCenter] = useState(true);
  const [enableUnsoldPlayers, setEnableUnsoldPlayers] = useState(true);

  useEffect(() => {
    const cached = localStorage.getItem('user');
    if (cached) setUser(JSON.parse(cached));
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const res = await fetch(`${API_ENDPOINTS}/api/settings`);
      const j = await res.json();
      if (typeof j.enableTradeCenter === 'boolean') setEnableTradeCenter(j.enableTradeCenter);
      if (typeof j.enableUnsoldPlayers === 'boolean') setEnableUnsoldPlayers(j.enableUnsoldPlayers);
    } catch (e) {
      setToast('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSettings(); }, []);

  async function save(partial) {
    try {
      setSaving(true);
      const res = await fetch(`${API_ENDPOINTS}/api/settings`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId: user?.id, ...partial })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.message || 'Failed');
      if (typeof j.enableTradeCenter === 'boolean') setEnableTradeCenter(j.enableTradeCenter);
      if (typeof j.enableUnsoldPlayers === 'boolean') setEnableUnsoldPlayers(j.enableUnsoldPlayers);
      setToast('Saved');
      try { window.dispatchEvent(new Event('settings-updated')); } catch {}
    } catch (e) {
      setToast(String(e.message || 'Save failed'));
    } finally {
      setSaving(false);
    }
  }

  if (!user?.isAdmin) {
    return <div className="admin-settings-page"><div className="warn">Admin only</div></div>;
  }

  return (
    <div className="admin-settings-page">
      {toast && <div className="toast">{toast}</div>}
      <h1 className="gradient-title">Admin Settings</h1>
      {loading ? (
        <div className="loading">Loading…</div>
      ) : (
        <div className="panel">
          <div className="setting-row">
            <div className="info">
              <div className="label">Trade Center</div>
              <div className="desc">Show or hide Trade Center from the menu.</div>
            </div>
            <label className="switch">
              <input type="checkbox" checked={enableTradeCenter} onChange={(e) => save({ enableTradeCenter: e.target.checked })} disabled={saving} />
              <span className="slider" />
            </label>
          </div>
          <div className="setting-row">
            <div className="info">
              <div className="label">Unsold Players</div>
              <div className="desc">Show or hide Unsold Players page from the menu.</div>
            </div>
            <label className="switch">
              <input type="checkbox" checked={enableUnsoldPlayers} onChange={(e) => save({ enableUnsoldPlayers: e.target.checked })} disabled={saving} />
              <span className="slider" />
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-ghost" onClick={loadSettings} disabled={saving}>Refresh</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSettings;


