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
        body: JSON.stringify({ adminUserId: user?.id, group })
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
            <PlayerTypeControls adminUserId={user?.id} showHeader={false} />
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSettings;


