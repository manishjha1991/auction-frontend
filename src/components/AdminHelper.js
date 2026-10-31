import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { API_ENDPOINTS } from '../const';
import '../css/AdminSettings.css';
import '../css/AdminHelper.css';

const TYPES = ['Sapphire', 'Emerald', 'Gold', 'Silver'];
const ROLES = ['Batsman', 'Bowler', 'Allrounder', 'WicketKeeper'];
const COUNTRIES = [
  'India',
  'Australia',
  'England',
  'New Zealand',
  'South Africa',
  'West Indies',
  'Pakistan',
  'Sri Lanka',
  'Bangladesh',
  'Afghanistan',
  'Ireland',
  'Zimbabwe',
  'Netherlands',
  'Scotland',
];

const adminIdFromUser = (user) => user?._id || user?.id || '';

export default function AdminHelper() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('locks');
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState('');
  const [lockFilter, setLockFilter] = useState('locked');
  const [accountSearch, setAccountSearch] = useState('');
  const [accounts, setAccounts] = useState({ locked: [], unlocked: [], lockedCount: 0, unlockedCount: 0 });

  const [playerSearch, setPlayerSearch] = useState('');
  const [players, setPlayers] = useState([]);
  const [editing, setEditing] = useState(null);

  const [minFilter, setMinFilter] = useState('short');
  const [minSearch, setMinSearch] = useState('');
  const [minReport, setMinReport] = useState({ caps: null, shortCount: 0, okCount: 0, teams: [] });
  const [deleteAsk, setDeleteAsk] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  useEffect(() => {
    const cached = localStorage.getItem('user');
    if (cached) {
      try {
        setUser(JSON.parse(cached));
      } catch (_) {}
    }
  }, []);

  const adminUserId = adminIdFromUser(user);

  const showToast = (msg) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 4000);
  };

  const loadAccounts = useCallback(async () => {
    if (!adminUserId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_ENDPOINTS}/api/admin-tools/helper/accounts?adminUserId=${encodeURIComponent(adminUserId)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load accounts');
      setAccounts(data);
    } catch (err) {
      showToast(err.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, [adminUserId]);

  const loadRosterMins = useCallback(async () => {
    if (!adminUserId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_ENDPOINTS}/api/admin-tools/helper/roster-mins?adminUserId=${encodeURIComponent(adminUserId)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load roster mins');
      setMinReport(data);
    } catch (err) {
      showToast(err.message || 'Failed to load roster mins');
    } finally {
      setLoading(false);
    }
  }, [adminUserId]);

  const loadPlayers = useCallback(async (search) => {
    if (!adminUserId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ adminUserId, search: search || '' });
      const res = await fetch(`${API_ENDPOINTS}/api/admin-tools/helper/players?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load players');
      setPlayers(data.players || []);
    } catch (err) {
      showToast(err.message || 'Failed to load players');
    } finally {
      setLoading(false);
    }
  }, [adminUserId]);

  useEffect(() => {
    if (!adminUserId) return;
    if (tab === 'locks') loadAccounts();
    if (tab === 'players') loadPlayers(playerSearch);
    if (tab === 'mins') loadRosterMins();
  }, [adminUserId, tab, loadAccounts, loadPlayers, loadRosterMins]);

  useEffect(() => {
    if (tab !== 'players') return;
    const t = window.setTimeout(() => loadPlayers(playerSearch), 350);
    return () => window.clearTimeout(t);
  }, [playerSearch, tab, loadPlayers]);

  const setLockState = async (account, isLocked) => {
    setSavingId(String(account._id));
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/admin-tools/helper/accounts/${account._id}/lock-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId, isLocked }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      showToast(data.message);
      await loadAccounts();
    } catch (err) {
      showToast(err.message || 'Failed to update lock');
    } finally {
      setSavingId('');
    }
  };

  const savePlayer = async (e) => {
    e.preventDefault();
    if (!editing?._id) return;
    setSavingId(String(editing._id));
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/admin-tools/helper/players/${editing._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId,
          name: editing.name,
          type: editing.type,
          role: editing.role,
          style: editing.style,
          bowlingStyle: editing.bowlingStyle,
          country: editing.country,
          overallScore: Number(editing.overallScore),
          basePrice: Number(editing.basePrice),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save');
      showToast(data.message);
      setEditing(null);
      setDeleteAsk(false);
      setDeleteConfirmName('');
      await loadPlayers(playerSearch);
    } catch (err) {
      showToast(err.message || 'Failed to save player');
    } finally {
      setSavingId('');
    }
  };

  const deletePlayer = async () => {
    if (!editing?._id) return;
    setSavingId(String(editing._id));
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/admin-tools/helper/players/${editing._id}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId,
          confirmName: deleteConfirmName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete');
      showToast(data.message);
      setEditing(null);
      setDeleteAsk(false);
      setDeleteConfirmName('');
      await loadPlayers(playerSearch);
    } catch (err) {
      showToast(err.message || 'Failed to delete player');
    } finally {
      setSavingId('');
    }
  };

  const visibleAccounts = useMemo(() => {
    const list = lockFilter === 'unlocked' ? accounts.unlocked : lockFilter === 'all'
      ? [...(accounts.locked || []), ...(accounts.unlocked || [])]
      : accounts.locked;
    const q = accountSearch.trim().toLowerCase();
    if (!q) return list || [];
    return (list || []).filter((a) =>
      `${a.teamName || ''} ${a.name || ''} ${a.abbreviation || ''} ${a.email || ''}`.toLowerCase().includes(q)
    );
  }, [accounts, lockFilter, accountSearch]);

  const visibleMinTeams = useMemo(() => {
    const list = (minReport.teams || []).filter((t) => (minFilter === 'ok' ? t.ok : minFilter === 'all' ? true : !t.ok));
    const q = minSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((t) =>
      `${t.teamName || ''} ${t.ownerName || ''} ${t.abbreviation || ''}`.toLowerCase().includes(q)
    );
  }, [minReport, minFilter, minSearch]);

  if (!user?.isAdmin) {
    return (
      <div className="admin-settings-page">
        <div className="warn">Admin only</div>
      </div>
    );
  }

  return (
    <div className="admin-settings-page admin-helper-page">
      {toast ? <div className="toast">{toast}</div> : null}
      <h1 className="gradient-title">Admin Helper</h1>
      <p className="admin-helper-sub">Unlock bidding accounts, see who is short of category mins, and fix player details.</p>

      <div className="admin-helper-tabs">
        <button type="button" className={tab === 'locks' ? 'on' : ''} onClick={() => setTab('locks')}>
          Account locks ({accounts.lockedCount || 0} locked)
        </button>
        <button type="button" className={tab === 'mins' ? 'on' : ''} onClick={() => setTab('mins')}>
          Category mins ({minReport.shortCount || 0} short)
        </button>
        <button type="button" className={tab === 'players' ? 'on' : ''} onClick={() => setTab('players')}>
          Edit players
        </button>
      </div>

      {tab === 'locks' && (
        <div className="panel">
          <div className="admin-helper-toolbar">
            <input
              value={accountSearch}
              onChange={(e) => setAccountSearch(e.target.value)}
              placeholder="Search team, owner, email"
            />
            <select value={lockFilter} onChange={(e) => setLockFilter(e.target.value)}>
              <option value="locked">Locked only</option>
              <option value="unlocked">Unlocked only</option>
              <option value="all">All teams</option>
            </select>
            <button type="button" className="btn" onClick={loadAccounts} disabled={loading}>
              Refresh
            </button>
          </div>
          <p className="admin-helper-meta">
            Locked {accounts.lockedCount || 0} · Unlocked {accounts.unlockedCount || 0}
          </p>
          {loading ? <p>Loading…</p> : null}
          <div className="admin-helper-list">
            {visibleAccounts.map((account) => (
              <div key={account._id} className={`admin-helper-row ${account.isLocked ? 'is-locked' : ''}`}>
                <div>
                  <div className="team-name">{account.teamName || account.name}</div>
                  <div className="admin-helper-muted">
                    {account.abbreviation ? `${account.abbreviation} · ` : ''}
                    {account.name}
                    {account.email ? ` · ${account.email}` : ''}
                  </div>
                </div>
                <div className="admin-helper-actions">
                  <span className={`admin-helper-badge ${account.isLocked ? 'bad' : 'ok'}`}>
                    {account.isLocked ? 'LOCKED' : 'UNLOCKED'}
                  </span>
                  {account.isLocked ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={savingId === String(account._id)}
                      onClick={() => setLockState(account, false)}
                    >
                      Unlock
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn"
                      disabled={savingId === String(account._id)}
                      onClick={() => setLockState(account, true)}
                    >
                      Lock
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!loading && visibleAccounts.length === 0 ? <p>No accounts in this view.</p> : null}
          </div>
        </div>
      )}

      {tab === 'mins' && (
        <div className="panel">
          <div className="admin-helper-toolbar">
            <input
              value={minSearch}
              onChange={(e) => setMinSearch(e.target.value)}
              placeholder="Search team"
            />
            <select value={minFilter} onChange={(e) => setMinFilter(e.target.value)}>
              <option value="short">Short of min only</option>
              <option value="ok">Meeting mins</option>
              <option value="all">All teams</option>
            </select>
            <button type="button" className="btn" onClick={loadRosterMins} disabled={loading}>
              Refresh
            </button>
          </div>
          <p className="admin-helper-meta">
            Short {minReport.shortCount || 0} · Meeting mins {minReport.okCount || 0}
            {minReport.caps
              ? ` · Gold ≥${minReport.caps.goldMin}, Silver ≥${minReport.caps.silverMin}, Emerald ≥${minReport.caps.emeraldMin}, S+E ≥${minReport.caps.sapphireEmeraldMin}`
              : ''}
          </p>
          <p className="admin-helper-muted">Counts are owned roster + live bids/pending unsold picks. Same rules as the 11:00 PM lock check.</p>
          {loading ? <p>Loading…</p> : null}
          <div className="admin-helper-list">
            {visibleMinTeams.map((team) => (
              <div key={team.userId} className={`admin-helper-row ${team.ok ? '' : 'is-locked'}`}>
                <div>
                  <div className="team-name">
                    {team.teamName}
                    {team.abbreviation ? ` (${team.abbreviation})` : ''}
                  </div>
                  <div className="admin-helper-muted">
                    {team.isLocked ? 'Locked · ' : ''}
                    Indians {team.india?.total || 0}/{team.india?.max || 3}
                    {team.missingLabels?.length ? ` · short: ${team.missingLabels.join(', ')}` : ''}
                  </div>
                  <div className="admin-helper-caps">
                    {[
                      { label: 'Gold', have: team.total?.Gold, min: minReport.caps?.goldMin },
                      { label: 'Silver', have: team.total?.Silver, min: minReport.caps?.silverMin },
                      { label: 'Emerald', have: team.total?.Emerald, min: minReport.caps?.emeraldMin },
                      { label: 'Sapphire', have: team.total?.Sapphire, min: minReport.caps?.sapphireMin },
                      {
                        label: 'S+E',
                        have: (team.total?.Sapphire || 0) + (team.total?.Emerald || 0),
                        min: minReport.caps?.sapphireEmeraldMin,
                      },
                    ].map((row) => (
                      <span
                        key={row.label}
                        className={`admin-helper-badge ${(row.have || 0) >= (row.min || 0) ? 'ok' : 'bad'}`}
                      >
                        {row.label} {row.have}/{row.min}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="admin-helper-actions">
                  <span className={`admin-helper-badge ${team.ok ? 'ok' : 'bad'}`}>
                    {team.ok ? 'OK' : 'SHORT'}
                  </span>
                </div>
              </div>
            ))}
            {!loading && visibleMinTeams.length === 0 ? <p>No teams in this view.</p> : null}
          </div>
        </div>
      )}

      {tab === 'players' && (
        <div className="panel">
          <div className="admin-helper-toolbar">
            <input
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
              placeholder="Search player, country, type"
            />
            <button type="button" className="btn" onClick={() => loadPlayers(playerSearch)} disabled={loading}>
              Search
            </button>
          </div>
          {editing ? (
            <form className="admin-helper-form" onSubmit={savePlayer}>
              <div className="admin-helper-form-title">Edit {editing.name}</div>
              <label>
                Name
                <input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </label>
              <label>
                Country
                <input
                  list="helper-countries"
                  value={editing.country || ''}
                  onChange={(e) => setEditing({ ...editing, country: e.target.value })}
                />
                <datalist id="helper-countries">
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </label>
              <label>
                Type
                <select value={editing.type || ''} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>
                  {TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label>
                Role
                <select value={editing.role || ''} onChange={(e) => setEditing({ ...editing, role: e.target.value })}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>
              <label>
                Batting
                <input value={editing.style || ''} onChange={(e) => setEditing({ ...editing, style: e.target.value })} />
              </label>
              <label>
                Bowling
                <input value={editing.bowlingStyle || ''} onChange={(e) => setEditing({ ...editing, bowlingStyle: e.target.value })} />
              </label>
              <label>
                Overall
                <input
                  type="number"
                  value={editing.overallScore ?? ''}
                  onChange={(e) => setEditing({ ...editing, overallScore: e.target.value })}
                />
              </label>
              <label>
                Base price
                <input
                  type="number"
                  value={editing.basePrice ?? ''}
                  onChange={(e) => setEditing({ ...editing, basePrice: e.target.value })}
                />
              </label>
              <div className="admin-helper-actions">
                <button type="submit" className="btn btn-primary" disabled={!!savingId}>Save</button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setEditing(null);
                    setDeleteAsk(false);
                    setDeleteConfirmName('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}
          {editing && !(editing.isSold || editing.owner) && (
            deleteAsk ? (
              <div className="admin-helper-delete">
                <p>
                  Permanently delete <strong>{editing.name}</strong> from the database? This cannot be undone.
                </p>
                <label>
                  Type DELETE to confirm
                  <input
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="DELETE"
                    autoComplete="off"
                  />
                </label>
                <div className="admin-helper-actions">
                  <button
                    type="button"
                    className="btn admin-helper-danger"
                    disabled={!!savingId || deleteConfirmName.trim().toUpperCase() !== 'DELETE'}
                    onClick={deletePlayer}
                  >
                    Yes, delete forever
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setDeleteAsk(false);
                      setDeleteConfirmName('');
                    }}
                  >
                    Keep player
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="btn admin-helper-danger" onClick={() => setDeleteAsk(true)}>
                Delete from database
              </button>
            )
          )}
          {editing && (editing.isSold || editing.owner) ? (
            <p className="admin-helper-muted">Delete is only allowed for unsold players who are not on a roster.</p>
          ) : null}
          {loading ? <p>Loading…</p> : null}
          <div className="admin-helper-list">
            {players.map((p) => (
              <div key={p._id} className="admin-helper-row">
                <div>
                  <div className="team-name">{p.name}</div>
                  <div className="admin-helper-muted">
                    {p.type} · {p.role} · {p.country || 'No country'} · OVR {p.overallScore ?? '—'}
                    {p.owner ? ` · ${p.owner.teamName || p.owner.name}` : ' · unsold'}
                    {p.isSold ? ' · SOLD' : ''}
                  </div>
                </div>
                <button type="button" className="btn btn-primary" onClick={() => setEditing({ ...p })}>
                  Edit
                </button>
              </div>
            ))}
            {!loading && players.length === 0 ? <p>No players found.</p> : null}
          </div>
        </div>
      )}
    </div>
  );
}
