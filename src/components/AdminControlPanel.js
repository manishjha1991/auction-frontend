import React, { useEffect, useState } from 'react';
import '../css/AdminProfile.css';
import { API_ENDPOINTS } from '../const';
import PlayerTypeControls from './PlayerTypeControls';

const formatCr = (value) => `${value.toFixed(2)} Cr`;

const AdminControlPanel = ({ adminUser }) => {
  const adminUserId = adminUser?.id || adminUser?._id || adminUser?._id?.toString();
  const [toast, setToast] = useState('');
  const [isCompact, setIsCompact] = useState(false);

  const [pursePreview, setPursePreview] = useState(null);
  const [purseLoading, setPurseLoading] = useState(false);
  const [purseExecuting, setPurseExecuting] = useState(false);
  const [purseResult, setPurseResult] = useState(null);

  const [syncPreview, setSyncPreview] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncExecuting, setSyncExecuting] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const [fixPreview, setFixPreview] = useState(null);
  const [fixLoading, setFixLoading] = useState(false);
  const [fixExecuting, setFixExecuting] = useState(false);
  const [fixResult, setFixResult] = useState(null);

  const handleToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 4000);
  };

  useEffect(() => {
    const updateCompact = () => setIsCompact(window.innerWidth < 768);
    updateCompact();
    window.addEventListener('resize', updateCompact);
    return () => window.removeEventListener('resize', updateCompact);
  }, []);

  const requestPursePreview = async () => {
    if (!adminUserId) return;
    setPurseLoading(true);
    setPurseResult(null);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/admin-tools/scripts/purse/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to build preview');
      setPursePreview(data);
      handleToast('Purse preview ready');
    } catch (err) {
      handleToast(err.message || 'Unable to build purse preview');
    } finally {
      setPurseLoading(false);
    }
  };

  const executePurseUpdate = async () => {
    if (!adminUserId) return;
    setPurseExecuting(true);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/admin-tools/scripts/purse/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to run purse update');
      setPurseResult(data);
      handleToast('Purse update completed');
      await requestPursePreview();
    } catch (err) {
      handleToast(err.message || 'Unable to execute purse update');
    } finally {
      setPurseExecuting(false);
    }
  };

  const requestSyncPreview = async () => {
    if (!adminUserId) return;
    setSyncLoading(true);
    setSyncResult(null);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/admin-tools/scripts/sync/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to build sync preview');
      setSyncPreview(data);
      handleToast('Sync preview ready');
    } catch (err) {
      handleToast(err.message || 'Unable to build sync preview');
    } finally {
      setSyncLoading(false);
    }
  };

  const executeSync = async () => {
    if (!adminUserId) return;
    setSyncExecuting(true);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/admin-tools/scripts/sync/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to run sync');
      setSyncResult(data);
      handleToast('Sync completed successfully');
      await requestSyncPreview();
    } catch (err) {
      handleToast(err.message || 'Unable to execute sync');
    } finally {
      setSyncExecuting(false);
    }
  };

  const actionableTeams =
    pursePreview?.updates.filter((row) => Math.abs(row.differenceCr) > 0.01) || [];

  const syncActionUsers =
    syncPreview?.users.filter((user) => user.missingPlayers.length > 0) || [];

  const fixActionPlayers =
    fixPreview?.players.filter((player) => player.status === 'needs-fix') || [];
  const fixCandidateIds = fixActionPlayers.map((player) => player.playerId);

  const requestFixPreview = async () => {
    if (!adminUserId) return;
    setFixLoading(true);
    setFixResult(null);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/admin-tools/scripts/auction-fix/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to build auction fix preview');
      setFixPreview(data);
      handleToast('Auction fix preview ready');
    } catch (err) {
      handleToast(err.message || 'Unable to build auction fix preview');
    } finally {
      setFixLoading(false);
    }
  };

  const executeAuctionFix = async () => {
    if (!adminUserId) return;
    if (!fixPreview) {
      handleToast('Run the preview before executing the fix');
      return;
    }
    if (fixCandidateIds.length === 0) {
      handleToast('No players require fixing based on the latest preview');
      return;
    }

    const pending = fixPreview.summary.needsFix;
    const confirmMessage =
      pending > 0
        ? `This will automatically reassign ${pending} player(s) to their correct teams. Continue?`
        : 'No players currently need fixing. Run the cleanup anyway?';
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setFixExecuting(true);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/admin-tools/scripts/auction-fix/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId, playerIds: fixCandidateIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to execute auction fix');
      setFixResult(data);
      handleToast('Auction fix completed');
      await requestFixPreview();
    } catch (err) {
      handleToast(err.message || 'Unable to execute auction fix');
    } finally {
      setFixExecuting(false);
    }
  };

  return (
    <div className="admin-control-panel">
      {toast && <div className="admin-toast">{toast}</div>}

      <section className="admin-section">
        <div className="section-header">
          <div>
            <h2>Player Availability</h2>
            <p>Toggle unsold players for each tier to quickly gate auction pools.</p>
          </div>
        </div>
        <PlayerTypeControls adminUserId={adminUserId} showHeader={false} />
      </section>

      <section className="admin-section">
        <div className="section-header">
          <div>
            <h2>Purse Audit (100 - Players)</h2>
            <p>Preview purse adjustments before applying them to every team.</p>
          </div>
          <div className="section-actions">
            <button
              className="btn ghost"
              onClick={requestPursePreview}
              disabled={purseLoading || !adminUserId}
            >
              {purseLoading ? 'Building preview…' : 'Preview Impact'}
            </button>
            <button
              className="btn primary"
              onClick={executePurseUpdate}
              disabled={purseExecuting || actionableTeams.length === 0}
            >
              {purseExecuting ? 'Updating…' : 'Confirm Update'}
            </button>
          </div>
        </div>

        {pursePreview && (
          <div className="summary-grid">
            <div className="summary-card">
              <span>Total Teams</span>
              <strong>{pursePreview.summary.totalUsers}</strong>
            </div>
            <div className="summary-card">
              <span>Needs Update</span>
              <strong>{pursePreview.summary.usersToUpdate}</strong>
            </div>
            <div className="summary-card">
              <span>No Change</span>
              <strong>{pursePreview.summary.usersUnchanged}</strong>
            </div>
          </div>
        )}

        {pursePreview && (
          isCompact ? (
            <div className="card-list">
              {actionableTeams.length === 0 && (
                <div className="data-card muted-card">
                  All purses are aligned. No changes needed.
                </div>
              )}
              {actionableTeams.map((team) => (
                <div className="data-card" key={team.userId}>
                  <div className="data-card-title">{team.teamName}</div>
                  <div className="data-card-row">
                    <span>Current</span>
                    <strong>{formatCr(team.currentPurseCr)}</strong>
                  </div>
                  <div className="data-card-row">
                    <span>Players Value</span>
                    <strong>{formatCr(team.playersValueCr)}</strong>
                  </div>
                  <div className="data-card-row">
                    <span>New Purse</span>
                    <strong>{formatCr(team.newPurseCr)}</strong>
                  </div>
                  <div className="data-card-row">
                    <span>Difference</span>
                    <strong className={team.differenceCr < 0 ? 'negative' : 'positive'}>
                      {team.differenceCr > 0 ? '+' : ''}
                      {team.differenceCr.toFixed(2)} Cr
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Current Purse</th>
                    <th>Players Value</th>
                    <th>New Purse</th>
                    <th>Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {actionableTeams.length === 0 && (
                    <tr>
                      <td colSpan={5} className="muted">
                        All purses are aligned. No changes needed.
                      </td>
                    </tr>
                  )}
                  {actionableTeams.map((team) => (
                    <tr key={team.userId}>
                      <td>{team.teamName}</td>
                      <td>{formatCr(team.currentPurseCr)}</td>
                      <td>{formatCr(team.playersValueCr)}</td>
                      <td>{formatCr(team.newPurseCr)}</td>
                      <td className={team.differenceCr < 0 ? 'negative' : 'positive'}>
                        {team.differenceCr > 0 ? '+' : ''}
                        {team.differenceCr.toFixed(2)} Cr
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {purseResult && (
          <div className="result-banner">
            <strong>{purseResult.updatedCount} teams updated.</strong>
            {purseResult.failures.length > 0 && (
              <span>{purseResult.failures.length} teams failed to update.</span>
            )}
          </div>
        )}
      </section>

      <section className="admin-section">
        <div className="section-header">
          <div>
            <h2>User & Player Sync</h2>
            <p>Ensure every userPlayer record exists in boughtPlayers and players are marked sold.</p>
          </div>
          <div className="section-actions">
            <button
              className="btn ghost"
              onClick={requestSyncPreview}
              disabled={syncLoading || !adminUserId}
            >
              {syncLoading ? 'Scanning…' : 'Preview Changes'}
            </button>
            <button
              className="btn primary"
              onClick={executeSync}
              disabled={syncExecuting || syncActionUsers.length === 0}
            >
              {syncExecuting ? 'Syncing…' : 'Confirm Sync'}
            </button>
          </div>
        </div>

        {syncPreview && (
          <div className="summary-grid">
            <div className="summary-card">
              <span>Users</span>
              <strong>{syncPreview.summary.totalUsers}</strong>
            </div>
            <div className="summary-card">
              <span>With Records</span>
              <strong>{syncPreview.summary.usersWithUserPlayers}</strong>
            </div>
            <div className="summary-card">
              <span>Needs Fix</span>
              <strong>{syncPreview.summary.usersNeedingUpdates}</strong>
            </div>
            <div className="summary-card">
              <span>Players to Add</span>
              <strong>{syncPreview.summary.totalPlayersToAdd}</strong>
            </div>
          </div>
        )}

        {syncPreview && (
          isCompact ? (
            <div className="card-list">
              {syncActionUsers.length === 0 && (
                <div className="data-card muted-card">
                  Everything is in sync. No action needed.
                </div>
              )}
              {syncActionUsers.map((user) => (
                <div className="data-card" key={user.userId}>
                  <div className="data-card-title">{user.teamName}</div>
                  <div className="data-card-row">
                    <span>UserPlayers</span>
                    <strong>{user.userPlayerCount}</strong>
                  </div>
                  <div className="data-card-row">
                    <span>Bought Players</span>
                    <strong>{user.boughtPlayersCount}</strong>
                  </div>
                  <div className="data-card-row">
                    <span>Missing Entries</span>
                    <div className="pill-column">
                      {user.missingPlayers.slice(0, 3).map((player) => (
                        <span key={player.playerId} className="pill">
                          {player.name} · {player.type}
                        </span>
                      ))}
                      {user.missingPlayers.length > 3 && (
                        <span className="pill muted">
                          +{user.missingPlayers.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>UserPlayers</th>
                    <th>Bought Players</th>
                    <th>Missing Entries</th>
                  </tr>
                </thead>
                <tbody>
                  {syncActionUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="muted">
                        Everything is in sync. No action needed.
                      </td>
                    </tr>
                  )}
                  {syncActionUsers.map((user) => (
                    <tr key={user.userId}>
                      <td>{user.teamName}</td>
                      <td>{user.userPlayerCount}</td>
                      <td>{user.boughtPlayersCount}</td>
                      <td>
                        <div className="pill-row">
                          {user.missingPlayers.slice(0, 4).map((player) => (
                            <span key={player.playerId} className="pill">
                              {player.name} · {player.type}
                            </span>
                          ))}
                          {user.missingPlayers.length > 4 && (
                            <span className="pill muted">
                              +{user.missingPlayers.length - 4} more
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {syncResult && (
          <div className="result-banner">
            <strong>{syncResult.usersUpdated} teams updated • {syncResult.playersUpdated} players marked active.</strong>
          </div>
        )}
      </section>

      <section className="admin-section">
        <div className="section-header">
          <div>
            <h2>Ownership Fix (Bidding Cleanup)</h2>
            <p>Detect and repair players sold to the wrong teams after manual overrides.</p>
          </div>
          <div className="section-actions">
            <button
              className="btn ghost"
              onClick={requestFixPreview}
              disabled={fixLoading || !adminUserId}
            >
              {fixLoading ? 'Scanning…' : 'Preview Issues'}
            </button>
            <button
              className="btn danger"
              onClick={executeAuctionFix}
              disabled={fixExecuting || !fixPreview || fixCandidateIds.length === 0}
            >
              {fixExecuting ? 'Fixing…' : 'Confirm & Fix'}
            </button>
          </div>
        </div>

        {fixPreview && (
          <div className="summary-grid">
            <div className="summary-card">
              <span>Players Checked</span>
              <strong>{fixPreview.summary.totalPlayersChecked}</strong>
            </div>
            <div className="summary-card">
              <span>Sold Players</span>
              <strong>{fixPreview.summary.totalSoldPlayers}</strong>
            </div>
            <div className="summary-card">
              <span>In Current Bids</span>
              <strong>{fixPreview.summary.referencedInCurrentBids}</strong>
            </div>
            <div className="summary-card">
              <span>Needs Fix</span>
              <strong>{fixPreview.summary.needsFix}</strong>
            </div>
            <div className="summary-card">
              <span>Missing Winner</span>
              <strong>{fixPreview.summary.missingWinner}</strong>
            </div>
            <div className="summary-card">
              <span>Already Correct</span>
              <strong>{fixPreview.summary.alreadyCorrect}</strong>
            </div>
          </div>
        )}

        {fixPreview && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Type</th>
                  <th>Source</th>
                  <th>Current Owner</th>
                  <th>Correct Owner</th>
                  <th>Locked Bidders</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {fixActionPlayers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="muted">
                      No ownership discrepancies detected.
                    </td>
                  </tr>
                )}
                {fixActionPlayers.map((player) => (
                  <tr key={player.playerId}>
                    <td>{player.name}</td>
                    <td>{player.type}</td>
                    <td>{player.fromCurrentBids ? 'Current Bid' : 'Sold'}</td>
                    <td>{player.currentOwner?.teamName || player.currentOwner?.name || '—'}</td>
                    <td>{player.desiredOwner?.teamName || player.desiredOwner?.name || '—'}</td>
                    <td>{player.hasLockedBidders ? 'Yes' : 'No'}</td>
                    <td>{player.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {fixResult && (
          <div className="result-banner">
            <strong>
              {fixResult.summary.fixed} players fixed • {fixResult.summary.unchanged} already aligned •{' '}
              {fixResult.summary.skipped} skipped • {fixResult.summary.errors} errors.
            </strong>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminControlPanel;

