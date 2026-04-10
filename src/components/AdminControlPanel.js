import React, { useEffect, useState } from 'react';
import '../css/AdminProfile.css';
import { API_ENDPOINTS } from '../const';
import PlayerTypeControls from './PlayerTypeControls';

const formatCr = (value) => `${value.toFixed(2)} Cr`;

const deriveAdminId = (adminUser) => {
  if (adminUser?.id) return adminUser.id;
  if (adminUser?._id) return adminUser._id.toString();
  if (typeof window !== 'undefined') {
    try {
      const stored = JSON.parse(window.localStorage.getItem('user') || '{}');
      return stored?.id || stored?._id || null;
    } catch {
      return null;
    }
  }
  return null;
};

const AdminControlPanel = ({ adminUser }) => {
  const [adminUserId, setAdminUserId] = useState(() => deriveAdminId(adminUser));
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

  const [careerHistoryExecuting, setCareerHistoryExecuting] = useState(false);
  const [careerHistoryResult, setCareerHistoryResult] = useState(null);
  const [careerConfigPreview, setCareerConfigPreview] = useState(null);
  const [careerConfigLoading, setCareerConfigLoading] = useState(false);

  const [dupPreview, setDupPreview] = useState(null);
  const [dupPreviewLoading, setDupPreviewLoading] = useState(false);
  const [dupExecuting, setDupExecuting] = useState(false);
  const [dupResult, setDupResult] = useState(null);
  const [dupBattingOnly, setDupBattingOnly] = useState(false);
  const [dupKeepNewest, setDupKeepNewest] = useState(false);

  const [migratePreview, setMigratePreview] = useState(null);
  const [migratePreviewLoading, setMigratePreviewLoading] = useState(false);
  const [migrateExecuting, setMigrateExecuting] = useState(false);
  const [migrateResult, setMigrateResult] = useState(null);

  const [fixPreview, setFixPreview] = useState(null);
  const [fixLoading, setFixLoading] = useState(false);
  const [fixExecuting, setFixExecuting] = useState(false);
  const [fixResult, setFixResult] = useState(null);
  const [auctionResetting, setAuctionResetting] = useState(false);
  const [auctionResetResult, setAuctionResetResult] = useState(null);

  const [cronSettings, setCronSettings] = useState({
    cronSingleBidEnabled: true,
    cronSingleBidFinalizerEnabled: true,
    cronBulkExitEnabled: true,
    cronLockEnabled: true,
    lockCheckCategories: ['sapphireEmerald', 'gold', 'silver'],
    auctionAutoModeEnabled: false,
    auctionAutoModeCategories: ['Gold', 'Silver', 'Sapphire', 'Emerald'],
    tradeSeasonCap: 3,
    maxTradesPerOpponentPair: 1,
  });
  const [cronLoading, setCronLoading] = useState(false);
  const [cronSaving, setCronSaving] = useState(false);
  const [tradeRulesSaving, setTradeRulesSaving] = useState(false);
  const [playerTypeRefreshTrigger, setPlayerTypeRefreshTrigger] = useState(0);
  const [worldCupMode, setWorldCupMode] = useState(false);
  const [worldCupSaving, setWorldCupSaving] = useState(false);

  const handleToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 4000);
  };

  useEffect(() => {
    setAdminUserId(deriveAdminId(adminUser));
  }, [adminUser]);

  useEffect(() => {
    const updateCompact = () => setIsCompact(window.innerWidth < 768);
    updateCompact();
    window.addEventListener('resize', updateCompact);
    return () => window.removeEventListener('resize', updateCompact);
  }, []);

  const fetchCronSettings = React.useCallback(async (silent = false) => {
    if (!silent) setCronLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/settings`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load cron settings');
      setCronSettings({
        cronSingleBidEnabled: data.cronSingleBidEnabled !== false,
        cronSingleBidFinalizerEnabled: data.cronSingleBidFinalizerEnabled !== false,
        cronBulkExitEnabled: data.cronBulkExitEnabled !== false,
        cronLockEnabled: data.cronLockEnabled !== false,
        lockCheckCategories: data.lockCheckCategories || ['sapphireEmerald', 'gold', 'silver'],
        auctionAutoModeEnabled: data.auctionAutoModeEnabled === true,
        auctionAutoModeCategories: data.auctionAutoModeCategories || ['Gold', 'Silver', 'Sapphire', 'Emerald'],
        tradeSeasonCap: typeof data.tradeSeasonCap === 'number' ? data.tradeSeasonCap : 3,
        maxTradesPerOpponentPair: typeof data.maxTradesPerOpponentPair === 'number' ? data.maxTradesPerOpponentPair : 1,
      });
      setWorldCupMode(data.worldCupMode === true);
    } catch (err) {
      if (!silent) handleToast(err.message || 'Unable to load cron settings');
    } finally {
      if (!silent) setCronLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCronSettings();
  }, [fetchCronSettings]);

  // When Auto Mode is on, poll every 60s so Cron Controls + Player Availability reflect cron-driven changes (6 PM, etc.)
  useEffect(() => {
    if (!cronSettings.auctionAutoModeEnabled) return;
    const interval = setInterval(() => {
      fetchCronSettings(true);
      setPlayerTypeRefreshTrigger((t) => t + 1); // refresh Player Availability (6 PM enables categories)
    }, 60000);
    return () => clearInterval(interval);
  }, [cronSettings.auctionAutoModeEnabled, fetchCronSettings]);

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

  const requestDupPlayerStatsPreview = async () => {
    if (!adminUserId) return;
    setDupPreviewLoading(true);
    setDupResult(null);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/admin-tools/scripts/duplicate-player-stats/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId, battingOnly: dupBattingOnly }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to scan for duplicates');
      setDupPreview(data);
      handleToast('Duplicate scan complete');
    } catch (err) {
      handleToast(err.message || 'Unable to scan for duplicate stats');
    } finally {
      setDupPreviewLoading(false);
    }
  };

  const executeDupPlayerStatsDelete = async () => {
    if (!adminUserId || !dupPreview) return;
    const groups = dupPreview.summary?.duplicateGroups ?? 0;
    const extra = dupPreview.summary?.extraDocumentsToDelete ?? 0;
    if (groups === 0) return;
    const ok = window.confirm(
      `Delete ${extra} duplicate PlayerStats row(s) across ${groups} group(s)? One row per group will be kept (${dupKeepNewest ? 'newest' : 'oldest'}). This cannot be undone.`
    );
    if (!ok) return;
    setDupExecuting(true);
    setDupResult(null);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/admin-tools/scripts/duplicate-player-stats/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId,
          battingOnly: dupBattingOnly,
          keepNewest: dupKeepNewest,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete duplicates');
      setDupResult(data);
      handleToast('Duplicate stats removed');
      await requestDupPlayerStatsPreview();
    } catch (err) {
      handleToast(err.message || 'Unable to delete duplicate stats');
    } finally {
      setDupExecuting(false);
    }
  };

  const requestMigratePlayerTotalsPreview = async () => {
    if (!adminUserId) return;
    setMigratePreviewLoading(true);
    setMigrateResult(null);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/admin-tools/scripts/player-totals-migrate/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to preview migration');
      setMigratePreview(data);
      handleToast('Top Rankings migration preview ready');
    } catch (err) {
      handleToast(err.message || 'Unable to preview migration');
    } finally {
      setMigratePreviewLoading(false);
    }
  };

  const confirmMigratePlayerTotalsFromHistory = async () => {
    if (!adminUserId || !migratePreview?.summary?.uniqueNamesFromSources) return;
    const ok = window.confirm(
      'This resets ALL active players’ totalRuns, totalWickets, and matchesPlayed to 0, then sets them from aggregated PlayerStats across the configured historical databases (name-matched to current players). This replaces Player-level totals used on Top Rankings — it does not copy PlayerStats rows. Continue?'
    );
    if (!ok) return;
    setMigrateExecuting(true);
    setMigrateResult(null);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/admin-tools/scripts/player-totals-migrate/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to run migration');
      setMigrateResult(data);
      handleToast(data.aborted ? 'Migration skipped (no source data)' : 'Top Rankings totals migration completed');
      await requestMigratePlayerTotalsPreview();
    } catch (err) {
      handleToast(err.message || 'Unable to run migration');
    } finally {
      setMigrateExecuting(false);
    }
  };

  const requestCareerHistoryConfigPreview = async () => {
    if (!adminUserId) return;
    setCareerConfigLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/admin-tools/scripts/career-history-sync/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load config');
      setCareerConfigPreview(data);
      handleToast('Career seed config loaded');
    } catch (err) {
      handleToast(err.message || 'Unable to load career seed config');
    } finally {
      setCareerConfigLoading(false);
    }
  };

  const runCareerHistorySync = async () => {
    if (!adminUserId) return;
    setCareerHistoryExecuting(true);
    setCareerHistoryResult(null);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/admin-tools/scripts/career-history-sync/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to run career history sync');
      setCareerHistoryResult(data);
      handleToast('Historical career seed & rankings refresh completed');
    } catch (err) {
      handleToast(err.message || 'Unable to run career history sync');
    } finally {
      setCareerHistoryExecuting(false);
    }
  };

  const dupDeletableGroups = dupPreview?.summary?.duplicateGroups ?? 0;
  const migrateCanRun =
    (migratePreview?.summary?.uniqueNamesFromSources ?? 0) > 0;

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

  const runAuctionReset = async () => {
    if (!adminUserId) return;
    const confirmed = window.confirm(
      "This will clear auction collections and reset user stats/retention flags. Continue?"
    );
    if (!confirmed) return;
    setAuctionResetting(true);
    setAuctionResetResult(null);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/admin-tools/auction/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reset auction');
      setAuctionResetResult(data);
      handleToast('Auction reset completed');
    } catch (err) {
      handleToast(err.message || 'Unable to reset auction');
    } finally {
      setAuctionResetting(false);
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

  const updateCronToggle = async (key, value) => {
    if (!adminUserId || cronSaving) return;
    setCronSaving(true);
    try {
      const payload = { adminUserId, [key]: value };
      if (key === 'cronSingleBidEnabled' && value) {
        payload.cronBulkExitEnabled = false;
      }
      if (key === 'cronBulkExitEnabled' && value) {
        payload.cronSingleBidEnabled = false;
      }
      const res = await fetch(`${API_ENDPOINTS}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update cron setting');
      setCronSettings({
        cronSingleBidEnabled: data.cronSingleBidEnabled !== false,
        cronSingleBidFinalizerEnabled: data.cronSingleBidFinalizerEnabled !== false,
        cronBulkExitEnabled: data.cronBulkExitEnabled !== false,
        cronLockEnabled: data.cronLockEnabled !== false,
        lockCheckCategories: data.lockCheckCategories || cronSettings.lockCheckCategories,
        auctionAutoModeEnabled: data.auctionAutoModeEnabled === true,
        auctionAutoModeCategories: data.auctionAutoModeCategories || cronSettings.auctionAutoModeCategories,
        tradeSeasonCap: typeof data.tradeSeasonCap === 'number' ? data.tradeSeasonCap : cronSettings.tradeSeasonCap,
        maxTradesPerOpponentPair:
          typeof data.maxTradesPerOpponentPair === 'number'
            ? data.maxTradesPerOpponentPair
            : cronSettings.maxTradesPerOpponentPair,
      });
      handleToast('Cron setting updated');
    } catch (err) {
      handleToast(err.message || 'Unable to update cron setting');
    } finally {
      setCronSaving(false);
    }
  };

  const updateLockCategories = async (category, checked) => {
    if (!adminUserId || cronSaving) return;
    const current = cronSettings.lockCheckCategories || [];
    const next = checked
      ? [...(current.includes(category) ? current : [...current, category])]
      : current.filter((c) => c !== category);
    if (next.length === 0) {
      handleToast('At least one category must be checked');
      return;
    }
    setCronSaving(true);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId, lockCheckCategories: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update lock categories');
      setCronSettings((prev) => ({ ...prev, lockCheckCategories: data.lockCheckCategories || next }));
      handleToast('Lock categories updated');
    } catch (err) {
      handleToast(err.message || 'Unable to update lock categories');
    } finally {
      setCronSaving(false);
    }
  };

  const updateAuctionAutoModeCategories = async (category, checked) => {
    if (!adminUserId || cronSaving) return;
    const current = cronSettings.auctionAutoModeCategories || [];
    const next = checked
      ? [...(current.includes(category) ? current : [...current, category])]
      : current.filter((c) => c !== category);
    if (next.length === 0) {
      handleToast('At least one category must be checked');
      return;
    }
    setCronSaving(true);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId, auctionAutoModeCategories: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update auto mode categories');
      setCronSettings((prev) => ({ ...prev, auctionAutoModeCategories: data.auctionAutoModeCategories || next }));
      setPlayerTypeRefreshTrigger((t) => t + 1); // refresh Player Availability to show updated state
      handleToast('Auto mode categories updated');
    } catch (err) {
      handleToast(err.message || 'Unable to update auto mode categories');
    } finally {
      setCronSaving(false);
    }
  };

  const updateWorldCupMode = async (value) => {
    if (!adminUserId || worldCupSaving) return;
    setWorldCupSaving(true);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId, worldCupMode: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update World Cup mode');
      setWorldCupMode(data.worldCupMode === true);
      handleToast(`World Cup mode ${value ? 'enabled' : 'disabled'}`);
    } catch (err) {
      handleToast(err.message || 'Unable to update World Cup mode');
    } finally {
      setWorldCupSaving(false);
    }
  };

  const tradeRuleNumberOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const saveTradeRules = async () => {
    if (!adminUserId || tradeRulesSaving) return;
    setTradeRulesSaving(true);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId,
          tradeSeasonCap: Number(cronSettings.tradeSeasonCap),
          maxTradesPerOpponentPair: Number(cronSettings.maxTradesPerOpponentPair),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save trade rules');
      setCronSettings((prev) => ({
        ...prev,
        tradeSeasonCap: typeof data.tradeSeasonCap === 'number' ? data.tradeSeasonCap : prev.tradeSeasonCap,
        maxTradesPerOpponentPair:
          typeof data.maxTradesPerOpponentPair === 'number'
            ? data.maxTradesPerOpponentPair
            : prev.maxTradesPerOpponentPair,
      }));
      handleToast('Trade rules saved');
    } catch (err) {
      handleToast(err.message || 'Unable to save trade rules');
    } finally {
      setTradeRulesSaving(false);
    }
  };

  const cronDefinitions = [
    {
      key: 'cronSingleBidEnabled',
      title: '11:30 PM–2:00 AM: Exit & Sell (5 min / 2 min cycle)',
      description:
        '10:30–11:20 PM: exit second-highest only (no selling). 11:30 PM–12:30 AM: every 5 min – if 2 bidders → exit only; if 1 bidder + 5 min since exit → sell. 12:30–2:00 AM: same logic every 2 min. Never sells when 2 bidders active. Enabling this pauses bulk cleanup.',
    },
    {
      key: 'cronSingleBidFinalizerEnabled',
      title: '10:30 PM: Sell Single-Bid-Only Players',
      description:
        'At 10:30 PM IST sell players who have only ever received one bid (no counter bid since auction start). Skips if second bidder is still active.',
    },
    {
      key: 'cronBulkExitEnabled',
      title: '6:00–9:40 PM & 10:35–11:05 PM: Bulk Exit Second-Highest',
      description:
        'Window 1: 6:00–9:40 PM IST every 10 min. Window 2: 10:35–11:05 PM every 10 min. Then stops. No selling. Enabling this pauses the 11:30 PM–2:00 AM timed windows.',
    },
    {
      key: 'cronLockEnabled',
      title: 'Lock Under Limit',
      description: 'Nightly at 10:00 PM IST lock teams that violate roster rules. Choose which categories to check (only active auction categories).',
    },
  ];

  const lockCategoryOptions = [
    { key: 'sapphireEmerald', label: 'Sapphire + Emerald', hint: 'S≥1, E≥2, total≥4' },
    { key: 'gold', label: 'Gold', hint: 'min 8 total' },
    { key: 'silver', label: 'Silver', hint: 'min 6 total' },
  ];

  return (
    <div className="admin-control-panel">
      {toast && <div className="admin-toast">{toast}</div>}

      <section className="admin-section">
        <div className="section-header">
          <div>
            <h2>Player Availability</h2>
            <p>Toggle unsold players for each tier to quickly gate auction pools.</p>
            {cronSettings.auctionAutoModeEnabled ? (
              <p style={{ marginTop: 8, fontSize: 12, color: 'rgba(46, 204, 113, 0.9)' }}>
                ✓ Auto Mode on – toggles update every 60s to match cron schedule (6 PM, 9:40 PM, etc.)
              </p>
            ) : (
              <p style={{ marginTop: 8, fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>
                Auto Mode off – turning it off does not change Player Availability.
              </p>
            )}
          </div>
        </div>
        <PlayerTypeControls adminUserId={adminUserId} showHeader={false} refreshTrigger={playerTypeRefreshTrigger} />
      </section>

      <section className="admin-section">
        <div className="section-header">
          <div>
            <h2>Auction Ready</h2>
            <p>Clear auction collections and reset user stats/retention flags.</p>
          </div>
          <div className="section-actions">
            <button
              className="btn danger"
              onClick={runAuctionReset}
              disabled={auctionResetting || !adminUserId}
            >
              {auctionResetting ? 'Resetting…' : 'Make Auction Ready'}
            </button>
          </div>
        </div>
        {auctionResetResult && (
          <div className="summary-grid">
            <div className="summary-card">
              <span>Collections Cleared</span>
              <strong>{auctionResetResult.cleared?.length || 0}</strong>
            </div>
            <div className="summary-card">
              <span>Users Updated</span>
              <strong>{auctionResetResult.users?.modified || 0}</strong>
            </div>
          </div>
        )}
      </section>

      <section className="admin-section">
        <div className="section-header">
          <div>
            <h2>Trade Center rules</h2>
            <p>
              Season trade slots count: each <strong>completed</strong> player-for-player trade (+1 per team), each{' '}
              <strong>approved release</strong> (+1), and each <strong>approved unsold pick</strong> (+1) unless it
              replaces a release of the <strong>same tier</strong> (Gold / Sapphire / Silver / Emerald)—then release +
              pick still use only <strong>one</strong> slot together. Releasing one tier and picking another tier uses{' '}
              <strong>two</strong> slots. The season cap also limits how many outgoing trade proposals plus pending
              releases a team may have at once. The opponent limit counts completed and pending deals between any two
              teams (both directions).
            </p>
          </div>
          {tradeRulesSaving && <span className="cron-saving-pill">Saving…</span>}
        </div>
        <div className="cron-toggle-grid" style={{ alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <label className="field-label" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span>Season trades per team (1–10)</span>
            <select
              className="select"
              value={cronSettings.tradeSeasonCap}
              onChange={(e) =>
                setCronSettings((prev) => ({ ...prev, tradeSeasonCap: Number(e.target.value) }))
              }
              disabled={tradeRulesSaving || !adminUserId}
            >
              {tradeRuleNumberOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span>Max deals between same two teams (1–10)</span>
            <select
              className="select"
              value={cronSettings.maxTradesPerOpponentPair}
              onChange={(e) =>
                setCronSettings((prev) => ({
                  ...prev,
                  maxTradesPerOpponentPair: Number(e.target.value),
                }))
              }
              disabled={tradeRulesSaving || !adminUserId}
            >
              {tradeRuleNumberOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn primary"
            onClick={saveTradeRules}
            disabled={tradeRulesSaving || !adminUserId}
          >
            {tradeRulesSaving ? 'Saving…' : 'Save trade rules'}
          </button>
        </div>
      </section>

      <section className="admin-section">
        <div className="section-header">
          <div>
            <h2>Auction Auto Mode</h2>
            <p>When enabled: 6 PM categories + bulk; 9:40 bulk off; 10:25 finalizer on; 10:35 bulk on; 11:20 bulk off; 11:25 sell-after-exit on. No manual toggling. When disabled, you must manually control Cron Controls and Player Availability. Turning Auto Mode OFF does not change Player Availability—it stays as is.</p>
          </div>
          {cronSaving && <span className="cron-saving-pill">Saving…</span>}
        </div>
        {!cronLoading && (
          <div className="cron-toggle-grid">
            <div className="cron-toggle-card">
              <div className="cron-toggle-info">
                <div className="data-card-title">Auto Mode</div>
                <p>6 PM: categories + bulk. 9:40: bulk off, exit-only on. 10:25: finalizer on. 10:35: bulk on. 11:20: bulk off. 11:25: sell-after-exit on.</p>
              </div>
              <div className="cron-toggle-switch">
                <span className={`cron-status ${cronSettings.auctionAutoModeEnabled ? 'on' : 'off'}`}>
                  {cronSettings.auctionAutoModeEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={!!cronSettings.auctionAutoModeEnabled}
                    onChange={(e) => updateCronToggle('auctionAutoModeEnabled', e.target.checked)}
                    disabled={cronSaving}
                  />
                  <span className="slider" />
                </label>
              </div>
            </div>
          </div>
        )}
        {!cronLoading && cronSettings.auctionAutoModeEnabled && (
          <div className="auto-mode-categories">
            <div className="auto-mode-categories-title">Categories to enable at 6 PM</div>
            <p className="auto-mode-categories-hint">Tap to toggle. Checked = enabled now and at 6 PM.</p>
            <div className="auto-mode-chips">
              {['Gold', 'Silver', 'Sapphire', 'Emerald'].map((cat) => {
                const checked = (cronSettings.auctionAutoModeCategories || []).includes(cat);
                return (
                  <label
                    key={cat}
                    className={`auto-mode-chip ${cat.toLowerCase()} ${checked ? 'checked' : ''} ${cronSaving ? 'disabled' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => updateAuctionAutoModeCategories(cat, e.target.checked)}
                      disabled={cronSaving}
                    />
                    <span className="auto-mode-chip-check" />
                    <span>{cat}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="admin-section">
        <div className="section-header">
          <div>
            <h2>Cron Controls</h2>
            <p>Toggle background jobs on or off. The 11:30 PM–2:00 AM exit/sell cycle and the bulk exit (6–9:40 PM & 10:35–11:05 PM) cannot run at the same time.</p>
            {cronSettings.auctionAutoModeEnabled ? (
              <p style={{ marginTop: 8, fontSize: 12, color: 'rgba(46, 204, 113, 0.9)' }}>
                ✓ Auto Mode on – toggles update every 60s to match cron schedule (6 PM, 9:40 PM, etc.)
              </p>
            ) : (
              <p style={{ marginTop: 8, fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>
                Auto Mode off – you must manually toggle Cron Controls and Player Availability. Turning Auto Mode off does not change Player Availability.
              </p>
            )}
          </div>
          {cronSaving && <span className="cron-saving-pill">Saving…</span>}
        </div>
        {cronLoading ? (
          <div className="loading">Loading cron settings…</div>
        ) : (
          <div className="cron-toggle-grid">
            {cronDefinitions.map((job) => (
              <div className="cron-toggle-card" key={job.key}>
                <div className="cron-toggle-info">
                  <div className="data-card-title">{job.title}</div>
                  <p>{job.description}</p>
                </div>
                <div className="cron-toggle-switch">
                  <span className={`cron-status ${cronSettings[job.key] ? 'on' : 'off'}`}>
                    {cronSettings[job.key] ? 'Enabled' : 'Disabled'}
                  </span>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={!!cronSettings[job.key]}
                      onChange={(e) => updateCronToggle(job.key, e.target.checked)}
                      disabled={cronSaving}
                    />
                    <span className="slider" />
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
        {!cronLoading && cronSettings.cronLockEnabled && (
          <div className="lock-categories-wrap" style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(0,0,0,0.03)', borderRadius: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Lock checks only these categories:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {lockCategoryOptions.map((opt) => (
                <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={(cronSettings.lockCheckCategories || []).includes(opt.key)}
                    onChange={(e) => updateLockCategories(opt.key, e.target.checked)}
                    disabled={cronSaving}
                  />
                  <span>{opt.label}</span>
                  <span style={{ color: '#666', fontSize: 12 }}>({opt.hint})</span>
                </label>
              ))}
            </div>
            <p style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              When only Sapphire+Emerald auction is running, uncheck Gold and Silver to avoid locking everyone.
            </p>
          </div>
        )}
      </section>

      <section className="admin-section">
        <div className="section-header">
          <div>
            <h2>World Cup Mode</h2>
            <p>Enable World Cup playoff format: Top 8 teams play round-robin, then top 4 play semi-finals and finals.</p>
          </div>
          {worldCupSaving && <span className="cron-saving-pill">Saving…</span>}
        </div>
        <div className="cron-toggle-grid">
          <div className="cron-toggle-card">
            <div className="cron-toggle-info">
              <div className="data-card-title">World Cup Playoff Format</div>
              <p>When enabled, playoffs will use World Cup format: Top 8 teams selected, they play each other in round-robin, top 4 advance to semi-finals (1 vs 4, 2 vs 3), then finals.</p>
            </div>
            <div className="cron-toggle-switch">
              <span className={`cron-status ${worldCupMode ? 'on' : 'off'}`}>
                {worldCupMode ? 'Enabled' : 'Disabled'}
              </span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={worldCupMode}
                  onChange={(e) => updateWorldCupMode(e.target.checked)}
                  disabled={worldCupSaving}
                />
                <span className="slider" />
              </label>
            </div>
          </div>
        </div>
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
            <h2>Duplicate match stat rows</h2>
            <p>
              Finds extra <code>PlayerStats</code> documents for the same player vs same opponent with the same score
              line (full batting + bowling match by default). Preview first, then delete extras — keeps one row per group
              (oldest by default).
            </p>
          </div>
          <div className="section-actions">
            <label className="admin-check-label muted">
              <input
                type="checkbox"
                checked={dupBattingOnly}
                onChange={(e) => {
                  setDupBattingOnly(e.target.checked);
                  setDupPreview(null);
                  setDupResult(null);
                }}
              />
              Batting-only (ignore bowling numbers)
            </label>
            <label className="admin-check-label muted">
              <input type="checkbox" checked={dupKeepNewest} onChange={(e) => setDupKeepNewest(e.target.checked)} />
              Keep newest when deleting
            </label>
            <button
              type="button"
              className="btn ghost"
              onClick={requestDupPlayerStatsPreview}
              disabled={dupPreviewLoading || !adminUserId}
            >
              {dupPreviewLoading ? 'Scanning…' : 'Preview duplicate rows'}
            </button>
            <button
              type="button"
              className="btn danger"
              onClick={executeDupPlayerStatsDelete}
              disabled={dupExecuting || dupDeletableGroups === 0 || !adminUserId}
            >
              {dupExecuting ? 'Deleting…' : 'Confirm: delete duplicate rows'}
            </button>
          </div>
        </div>

        {dupPreview && (
          <>
            <div className="summary-grid">
              <div className="summary-card">
                <span>Duplicate groups</span>
                <strong>{dupPreview.summary?.duplicateGroups ?? 0}</strong>
              </div>
              <div className="summary-card">
                <span>Extra rows to remove</span>
                <strong>{dupPreview.summary?.extraDocumentsToDelete ?? 0}</strong>
              </div>
            </div>
            <p className="muted" style={{ marginTop: '0.5rem' }}>
              <strong>Scan mode:</strong> {dupPreview.modeLabel}
            </p>
          </>
        )}

        {dupPreview?.summary?.groupsTruncated && (
          <p className="muted" style={{ marginTop: '0.75rem' }}>
            Showing first {dupPreview.summary.groupsShown} groups in the table below (list truncated for performance).
          </p>
        )}

        {dupPreview && dupPreview.groups?.length > 0 && (
          <div className="table-wrapper" style={{ marginTop: '0.75rem' }}>
            <table>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>vs Opponent</th>
                  <th>Line</th>
                  <th>Rows</th>
                </tr>
              </thead>
              <tbody>
                {dupPreview.groups.map((g, idx) => (
                  <tr key={`dup-row-${idx}-${g.playerId}-${g.opponentUserId}`}>
                    <td>{g.playerName}</td>
                    <td>{g.opponentName || '—'}</td>
                    <td>
                      {g.battingLine}
                      {g.bowlingLine ? ` · ${g.bowlingLine}` : ''}
                    </td>
                    <td>{g.duplicateCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {dupPreview && dupPreview.summary?.duplicateGroups === 0 && (
          <div className="result-banner" style={{ opacity: 0.85 }}>
            No duplicate stat rows found for the current mode.
          </div>
        )}

        {dupResult && (
          <div className="result-banner">
            <strong>
              Deleted {dupResult.deletedCount ?? 0} row(s) • {dupResult.affectedPlayerCount ?? 0} player(s) updated
              (totals + career).
            </strong>
          </div>
        )}
      </section>

      <section className="admin-section">
        <div className="section-header">
          <div>
            <h2>Top Rankings — migrate from historical DBs</h2>
            <p>
              Reads <code>PlayerStats</code> from each database in <code>CPL_PLAYER_TOTALS_MIGRATE_DBS</code> (default{' '}
              cpl_12–cpl_19, same cluster as this app). Aggregates runs / wickets / matches by player name across those
              DBs, then writes those three fields onto active players in the <strong>current</strong> database.{' '}
              <strong>Preview first.</strong> Destructive: it resets all active players’ totals before applying.
            </p>
          </div>
          <div className="section-actions">
            <button
              type="button"
              className="btn ghost"
              onClick={requestMigratePlayerTotalsPreview}
              disabled={migratePreviewLoading || !adminUserId}
            >
              {migratePreviewLoading ? 'Scanning…' : 'Preview migration (Top Rankings totals)'}
            </button>
            <button
              type="button"
              className="btn danger"
              onClick={confirmMigratePlayerTotalsFromHistory}
              disabled={migrateExecuting || !migrateCanRun || !adminUserId}
            >
              {migrateExecuting ? 'Migrating…' : 'Confirm: reset & apply historical totals'}
            </button>
          </div>
        </div>

        {migratePreview && (
          <>
            <div className="summary-grid">
              <div className="summary-card">
                <span>Current DB</span>
                <strong style={{ fontSize: '1rem' }}>{migratePreview.currentDatabase ?? '—'}</strong>
              </div>
              <div className="summary-card">
                <span>Stat rows read (all sources)</span>
                <strong>{migratePreview.summary?.totalStatRowsRead ?? 0}</strong>
              </div>
              <div className="summary-card">
                <span>Unique names in sources</span>
                <strong>{migratePreview.summary?.uniqueNamesFromSources ?? 0}</strong>
              </div>
              <div className="summary-card">
                <span>Would match players</span>
                <strong>{migratePreview.summary?.wouldMatchTargetPlayers ?? 0}</strong>
              </div>
              <div className="summary-card">
                <span>Names not in current DB</span>
                <strong>{migratePreview.summary?.wouldNotFindInTarget ?? 0}</strong>
              </div>
              <div className="summary-card">
                <span>Active players (target)</span>
                <strong>{migratePreview.summary?.activePlayersInTarget ?? 0}</strong>
              </div>
            </div>
            <p className="muted" style={{ marginTop: '0.75rem' }}>
              <strong>Source DBs:</strong>{' '}
              {(migratePreview.sourceDatabases || []).join(', ') || '—'}
            </p>
            {migratePreview.perDb?.length > 0 && (
              <div className="table-wrapper" style={{ marginTop: '0.75rem' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Database</th>
                      <th>Innings rows</th>
                      <th>Distinct players</th>
                    </tr>
                  </thead>
                  <tbody>
                    {migratePreview.perDb.map((row) => (
                      <tr key={row.database}>
                        <td>{row.database}</td>
                        <td>{row.inningsCount}</td>
                        <td>{row.distinctPlayersInDb}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {migratePreview.notFoundSample?.length > 0 && (
              <p className="muted" style={{ marginTop: '0.75rem' }}>
                Sample names from sources with no matching player in current DB (first{' '}
                {migratePreview.notFoundSample.length}):{' '}
                {migratePreview.notFoundSample.map((p) => p.name).join(', ')}
              </p>
            )}
          </>
        )}

        {migrateResult && (
          <div className="result-banner">
            <strong>
              {migrateResult.aborted
                ? migrateResult.message || 'Aborted.'
                : `Updated ${migrateResult.playersUpdated ?? 0} player(s) • ${migrateResult.playersNotFoundInTarget ?? 0} source name(s) had no match.`}
            </strong>
          </div>
        )}
      </section>

      <section className="admin-section">
        <div className="section-header">
          <div>
            <h2>Historical career + Top Rankings</h2>
            <p>
              Pulls past-season innings from other MongoDB databases (<code>CPL_HISTORY_SEED_DBS</code>, default{' '}
              cpl_12–cpl_18) into <code>PlayerCareerSummary</code>, rebuilds live career from this DB&apos;s{' '}
              <code>playerstats</code>, then refreshes each <code>Player</code>&apos;s totals used on Top Rankings.
              Use <strong>Preview DB list</strong> to see which databases the server will read.
            </p>
          </div>
          <div className="section-actions">
            <button
              type="button"
              className="btn ghost"
              onClick={requestCareerHistoryConfigPreview}
              disabled={careerConfigLoading || !adminUserId}
            >
              {careerConfigLoading ? 'Loading…' : 'Preview DB list'}
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={runCareerHistorySync}
              disabled={careerHistoryExecuting || !adminUserId}
            >
              {careerHistoryExecuting
                ? 'Running…'
                : 'Seed historical career (past seasons) + refresh Top Rankings'}
            </button>
          </div>
        </div>

        {careerConfigPreview && (
          <div className="muted" style={{ marginTop: '0.75rem' }}>
            <strong>Current database:</strong> {careerConfigPreview.currentDatabase ?? '—'}
            <br />
            <strong>Historical sources:</strong>{' '}
            {(careerConfigPreview.sourceDatabases || []).join(', ') || '(none configured)'}
          </div>
        )}

        {careerHistoryResult && (
          <div className="result-banner">
            <strong>
              Career summaries upserted: {careerHistoryResult.career?.upserts ?? '—'} • Player totals rebuilt from
              stats: {careerHistoryResult.playerTotals?.playersUpdated ?? '—'}
            </strong>
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
          isCompact ? (
            <div className="card-list">
              {fixActionPlayers.length === 0 && (
                <div className="data-card muted-card">
                  No ownership discrepancies detected.
                </div>
              )}
              {fixActionPlayers.map((player) => (
                <div className="data-card" key={player.playerId}>
                  <div className="data-card-title">{player.name}</div>
                  <div className="data-card-row">
                    <span>Status</span>
                    <strong>{player.status}</strong>
                  </div>
                  <div className="data-card-row">
                    <span>Type</span>
                    <span>{player.type}</span>
                  </div>
                  <div className="data-card-row">
                    <span>Source</span>
                    <span>{player.fromCurrentBids ? 'Current Bid' : 'Sold'}</span>
                  </div>
                  <div className="data-card-row">
                    <span>Current Owner</span>
                    <span>{player.currentOwner?.teamName || player.currentOwner?.name || '—'}</span>
                  </div>
                  <div className="data-card-row">
                    <span>Correct Owner</span>
                    <span>{player.desiredOwner?.teamName || player.desiredOwner?.name || '—'}</span>
                  </div>
                  <div className="data-card-row">
                    <span>Locked Bidders</span>
                    <span>{player.hasLockedBidders ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
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
          )
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

