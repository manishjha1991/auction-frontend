import React, { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../const';
import '../css/AdminSettings.css';
import PlayerTypeControls from './PlayerTypeControls';

function AdminSettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [enableTradeCenter, setEnableTradeCenter] = useState(true);
  const [enableUnsoldPlayers, setEnableUnsoldPlayers] = useState(true);
  const [enablePickButton, setEnablePickButton] = useState(true);
  const [enablePlayerRetention, setEnablePlayerRetention] = useState(true);
  const [pointsMode, setPointsMode] = useState('overall');
  const [teams, setTeams] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [auctionStartAt, setAuctionStartAt] = useState('');
  const [auctionSaving, setAuctionSaving] = useState(false);

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
      if (typeof j.enablePickButton === 'boolean') setEnablePickButton(j.enablePickButton);
      if (typeof j.enablePlayerRetention === 'boolean') setEnablePlayerRetention(j.enablePlayerRetention);
      if (typeof j.pointsMode === 'string') setPointsMode(j.pointsMode);
      if (j.auctionStartAt) {
        setAuctionStartAt(formatAuctionInput(j.auctionStartAt));
      } else {
        setAuctionStartAt('');
      }
    } catch (e) {
      setToast('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSettings(); }, []);

  const adminId = user?.id || user?._id || null;

  const formatAuctionInput = (isoString) => {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '';
    const IST_OFFSET_MS = 330 * 60 * 1000;
    const ist = new Date(date.getTime() + IST_OFFSET_MS);
    const pad = (v) => String(v).padStart(2, '0');
    return `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(ist.getUTCDate())}T${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}`;
  };

  const toAuctionIsoFromInput = (value) => {
    if (!value) return null;
    const [datePart, timePart] = value.split('T');
    if (!datePart || !timePart) return null;
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    if ([year, month, day, hour, minute].some((v) => Number.isNaN(v))) return null;
    const istMs = Date.UTC(year, month - 1, day, hour, minute, 0);
    const utcMs = istMs - 330 * 60 * 1000;
    return new Date(utcMs).toISOString();
  };

  const saveAuctionStart = async () => {
    if (!adminId || auctionSaving) return;
    setAuctionSaving(true);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: adminId,
          auctionStartAt: toAuctionIsoFromInput(auctionStartAt),
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.message || 'Failed to update auction time');
      setAuctionStartAt(j.auctionStartAt ? formatAuctionInput(j.auctionStartAt) : '');
      setToast('Auction start time updated');
    } catch (e) {
      setToast(e.message || 'Failed to update auction time');
    } finally {
      setAuctionSaving(false);
    }
  };

  async function save(partial) {
    try {
      setSaving(true);
      const res = await fetch(`${API_ENDPOINTS}/api/settings`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId: adminId, ...partial })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.message || 'Failed');
      if (typeof j.enableTradeCenter === 'boolean') setEnableTradeCenter(j.enableTradeCenter);
      if (typeof j.enableUnsoldPlayers === 'boolean') setEnableUnsoldPlayers(j.enableUnsoldPlayers);
      if (typeof j.enablePickButton === 'boolean') setEnablePickButton(j.enablePickButton);
      if (typeof j.enablePlayerRetention === 'boolean') setEnablePlayerRetention(j.enablePlayerRetention);
      if (typeof j.pointsMode === 'string') setPointsMode(j.pointsMode);
      setToast('Saved');
      try { window.dispatchEvent(new Event('settings-updated')); } catch {}
    } catch (e) {
      setToast(String(e.message || 'Save failed'));
    } finally {
      setSaving(false);
    }
  }

  async function loadGroups() {
    try {
      setGroupsLoading(true);
      const res = await fetch(`${API_ENDPOINTS}/api/users/groups`);
      const j = await res.json();
      if (Array.isArray(j.teams)) setTeams(j.teams);
    } catch (e) {
      console.error(e);
      setToast('Failed to load groups');
    } finally {
      setGroupsLoading(false);
    }
  }

  useEffect(() => { loadGroups(); }, []);

  async function updateGroup(teamId, group) {
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/users/${teamId}/group`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId: adminId, group })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.message || 'Failed');
      setTeams(prev => prev.map(t => t._id === teamId ? { ...t, group } : t));
      setToast('Group updated');
    } catch (e) {
      setToast(String(e.message || 'Failed to update group'));
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
          <div className="setting-row">
            <div className="info">
              <div className="label">Pick Button</div>
              <div className="desc">Enable or disable the pick button for users to request players.</div>
            </div>
            <label className="switch">
              <input type="checkbox" checked={enablePickButton} onChange={(e) => save({ enablePickButton: e.target.checked })} disabled={saving} />
              <span className="slider" />
            </label>
          </div>
          <div className="setting-row">
            <div className="info">
              <div className="label">Auction Start Time (IST)</div>
              <div className="desc">Select the auction start date & time for the countdown on the player page.</div>
            </div>
            <div className="action-inline">
              <input
                type="datetime-local"
                className="auction-datetime-input"
                value={auctionStartAt}
                onChange={(e) => setAuctionStartAt(e.target.value)}
                disabled={saving || auctionSaving}
              />
              <button
                className="btn btn-primary"
                onClick={saveAuctionStart}
                disabled={saving || auctionSaving}
              >
                {auctionSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
          <div className="setting-row">
            <div className="info">
              <div className="label">Player Retention</div>
              <div className="desc">Enable or disable the player retention feature for users to retain their players.</div>
            </div>
            <label className="switch">
              <input type="checkbox" checked={enablePlayerRetention} onChange={(e) => save({ enablePlayerRetention: e.target.checked })} disabled={saving} />
              <span className="slider" />
            </label>
          </div>
          <div className="setting-row">
            <div className="info">
              <div className="label">Points Table Mode</div>
              <div className="desc">Switch between overall table and group-wise tables.</div>
            </div>
            <label className="switch">
              <input type="checkbox" checked={pointsMode === 'groups'} onChange={(e) => save({ pointsMode: e.target.checked ? 'groups' : 'overall' })} disabled={saving} />
              <span className="slider" />
            </label>
          </div>
          {pointsMode === 'groups' && (
            <div className="subpanel">
              <div className="subpanel-title">Group Assignment</div>
              {groupsLoading ? (
                <div className="loading">Loading groups…</div>
              ) : (
                <div className="groups-grid">
                  {teams.map(t => (
                    <div key={t._id} className="group-row">
                      <div className="team-cell">
                        <img src={t.teamImage ? `${API_ENDPOINTS}${t.teamImage}` : 'https://via.placeholder.com/40'} alt={t.teamName} className="team-avatar" />
                        <div className="team-name">{t.teamName} ({t.abbreviation || '-'})</div>
                      </div>
                      <div className="group-actions">
                        <button className={`btn ${t.group === 'A' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => updateGroup(t._id, 'A')} disabled={saving}>Group A</button>
                        <button className={`btn ${t.group === 'B' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => updateGroup(t._id, 'B')} disabled={saving}>Group B</button>
                        <button className={`btn ${!t.group ? 'btn-primary' : 'btn-ghost'}`} onClick={() => updateGroup(t._id, null)} disabled={saving}>Clear</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="actions">
            <button className="btn btn-ghost" onClick={loadSettings} disabled={saving}>Refresh</button>
          </div>
          <div className="subpanel">
            <div className="subpanel-title">Player Type Availability</div>
            <PlayerTypeControls adminUserId={adminId} showHeader={false} />
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSettings;


