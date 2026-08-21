import React, { useEffect, useState } from 'react';
import '../css/AdminProfile.css';
import { API_ENDPOINTS } from '../const';
import PlayerTypeControls from './PlayerTypeControls';
import CommissionerTradeMonitor from './CommissionerTradeMonitor';

const formatCr = (value) => `${value.toFixed(2)} Cr`;
const CONSISTENCY_BADGE_KEY = 'adminConsistencyBadgeCount';
const CONSISTENCY_BADGE_UPDATED_EVENT = 'consistency-check-updated';

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
  const [consistencyLoading, setConsistencyLoading] = useState(false);
  const [consistencyReport, setConsistencyReport] = useState(null);

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
    tradeApprovalMode: 'any_admin',
    enableTradeBundles: true,
    bundleAutoApprove: true,
  });
  const [tradeCommissionerAdmins, setTradeCommissionerAdmins] = useState([]);
  const [selectedCommissionerId, setSelectedCommissionerId] = useState('');
  const [tradeGovernanceSaving, setTradeGovernanceSaving] = useState(false);
  const [revokeTeamAdminsLoading, setRevokeTeamAdminsLoading] = useState(false);
  const [cronLoading, setCronLoading] = useState(false);
  const [cronSaving, setCronSaving] = useState(false);
  const [tradeRulesSaving, setTradeRulesSaving] = useState(false);
  const [releasePickRepairPreview, setReleasePickRepairPreview] = useState(null);
  const [releasePickRepairLoading, setReleasePickRepairLoading] = useState(false);
  const [releasePickRepairApplying, setReleasePickRepairApplying] = useState(false);
  const [releasePickRepairSelected, setReleasePickRepairSelected] = useState({});
  const [tradesUsedReconcilePreview, setTradesUsedReconcilePreview] = useState(null);
  const [tradesUsedReconcileLoading, setTradesUsedReconcileLoading] = useState(false);
  const [tradesUsedReconcileApplying, setTradesUsedReconcileApplying] = useState(false);
  const [tradesUsedReconcileSelected, setTradesUsedReconcileSelected] = useState({});
  const [playerTypeRefreshTrigger, setPlayerTypeRefreshTrigger] = useState(0);
  const [worldCupMode, setWorldCupMode] = useState(false);
  const [worldCupSaving, setWorldCupSaving] = useState(false);

  const [databases, setDatabases] = useState([]);

  // CPL Report Configuration
  const [cplReportStartDb, setCplReportStartDb] = useState('');
  const [cplReportLoading, setCplReportLoading] = useState(false);
  const [cplReportSaving, setCplReportSaving] = useState(false);

  // Team Participation Management
  const [participatingTeams, setParticipatingTeams] = useState([]);
  const [participatingTeamsLoading, setParticipatingTeamsLoading] = useState(false);
  const [participatingTeamsSaving, setParticipatingTeamsSaving] = useState(false);
  const [showParticipationConfirm, setShowParticipationConfirm] = useState(false);
  const [participationConfirmData, setParticipationConfirmData] = useState(null);

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
        tradeApprovalMode: data.tradeApprovalMode === 'commissioner_only' ? 'commissioner_only' : 'any_admin',
        enableTradeBundles: data.enableTradeBundles !== false,
        bundleAutoApprove: data.bundleAutoApprove !== false,
      });
      setWorldCupMode(data.worldCupMode === true);
    } catch (err) {
      if (!silent) handleToast(err.message || 'Unable to load cron settings');
    } finally {
      if (!silent) setCronLoading(false);
    }
  }, []);

  const fetchTradeCommissioners = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/settings/trade-commissioners`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load commissioner settings');
      setTradeCommissionerAdmins(Array.isArray(data.admins) ? data.admins : []);
      setSelectedCommissionerId(data.commissionerUserId ? String(data.commissionerUserId) : '');
      setCronSettings((prev) => ({
        ...prev,
        tradeApprovalMode: data.tradeApprovalMode === 'commissioner_only' ? 'commissioner_only' : 'any_admin',
        enableTradeBundles: data.enableTradeBundles !== false,
        bundleAutoApprove: data.bundleAutoApprove !== false,
      }));
    } catch (err) {
      handleToast(err.message || 'Unable to load commissioner settings');
    }
  }, []);

  useEffect(() => {
    fetchCronSettings();
    fetchTradeCommissioners();
  }, [fetchCronSettings]);

  useEffect(() => {
    if (window.location.hash === '#trade-commissioner') {
      const t = setTimeout(() => {
        document.getElementById('trade-commissioner')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
      return () => clearTimeout(t);
    }
  }, []);

  const loadReleasePickRepairPreview = React.useCallback(async () => {
    if (!adminUserId) {
      handleToast('Admin session required');
      return;
    }
    setReleasePickRepairLoading(true);
    setReleasePickRepairPreview(null);
    try {
      const r = await fetch(
        `${API_ENDPOINTS}/api/admin-tools/release-pick-repair/preview?adminUserId=${encodeURIComponent(adminUserId)}`
      );
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || 'Scan failed');
      setReleasePickRepairPreview(j);
      const sel = {};
      (j.teams || []).forEach((t) => {
        sel[t.userId] = true;
      });
      setReleasePickRepairSelected(sel);
    } catch (err) {
      handleToast(err.message || 'Scan failed');
    } finally {
      setReleasePickRepairLoading(false);
    }
  }, [adminUserId]);

  const toggleReleasePickRepairTeam = (userId) => {
    setReleasePickRepairSelected((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const applyReleasePickRepair = async () => {
    if (!adminUserId) return;
    const userIds = Object.entries(releasePickRepairSelected)
      .filter(([, on]) => on)
      .map(([id]) => id);
    if (!userIds.length) {
      handleToast('Select at least one team');
      return;
    }
    const msg = `Apply repair to ${userIds.length} team(s)? This will link each suggested release-to-pick pair and reduce tradesUsed by the number of pairs per team.`;
    if (!window.confirm(msg)) return;
    setReleasePickRepairApplying(true);
    try {
      const r = await fetch(`${API_ENDPOINTS}/api/admin-tools/release-pick-repair/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId, userIds }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || 'Apply failed');
      handleToast(
        `Done: ${j.summary?.pairsApplied ?? 0} pair(s) applied across ${j.summary?.teamsProcessed ?? 0} team(s).`
      );
      await loadReleasePickRepairPreview();
    } catch (err) {
      handleToast(err.message || 'Apply failed');
    } finally {
      setReleasePickRepairApplying(false);
    }
  };

  const loadTradesUsedReconcilePreview = React.useCallback(async () => {
    if (!adminUserId) {
      handleToast('Admin session required');
      return;
    }
    setTradesUsedReconcileLoading(true);
    setTradesUsedReconcilePreview(null);
    try {
      const r = await fetch(
        `${API_ENDPOINTS}/api/admin-tools/trades-used-reconcile/preview?adminUserId=${encodeURIComponent(adminUserId)}`
      );
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || 'Scan failed');
      setTradesUsedReconcilePreview(j);
      const sel = {};
      (j.teams || []).forEach((t) => {
        sel[t.userId] = true;
      });
      setTradesUsedReconcileSelected(sel);
    } catch (err) {
      handleToast(err.message || 'Scan failed');
    } finally {
      setTradesUsedReconcileLoading(false);
    }
  }, [adminUserId]);

  const toggleTradesUsedReconcileTeam = (userId) => {
    setTradesUsedReconcileSelected((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const applyTradesUsedReconcile = async () => {
    if (!adminUserId) return;
    const userIds = Object.entries(tradesUsedReconcileSelected)
      .filter(([, on]) => on)
      .map(([id]) => id);
    if (!userIds.length) {
      handleToast('Select at least one team');
      return;
    }
    if (
      !window.confirm(
        `Set tradesUsed to the event-based expected value for ${userIds.length} team(s)? This only raises under-counted values (capped at season cap).`
      )
    )
      return;
    setTradesUsedReconcileApplying(true);
    try {
      const r = await fetch(`${API_ENDPOINTS}/api/admin-tools/trades-used-reconcile/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId, userIds }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || 'Apply failed');
      handleToast(`Updated ${j.updated ?? 0} team(s).`);
      await loadTradesUsedReconcilePreview();
    } catch (err) {
      handleToast(err.message || 'Apply failed');
    } finally {
      setTradesUsedReconcileApplying(false);
    }
  };

  // When Auto Mode is on, poll every 60s so Cron Controls + Player Availability reflect cron-driven changes (10:30 PM, etc.)
  useEffect(() => {
    if (!cronSettings.auctionAutoModeEnabled) return;
    const interval = setInterval(() => {
      fetchCronSettings(true);
      setPlayerTypeRefreshTrigger((t) => t + 1); // refresh Player Availability (10:30 PM enables categories)
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

  const runConsistencyCheck = async () => {
    if (!adminUserId) return;
    setConsistencyLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/admin-tools/consistency-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to run consistency check');
      setConsistencyReport(data);
      const retainedIssues = data?.retained?.issueCount || 0;
      const purseIssues = data?.purse?.mismatchCount || 0;
      const totalIssues = retainedIssues + purseIssues;
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(CONSISTENCY_BADGE_KEY, String(totalIssues));
          window.dispatchEvent(
            new CustomEvent(CONSISTENCY_BADGE_UPDATED_EVENT, { detail: { totalIssues } })
          );
        } catch {}
      }
      handleToast(`Consistency check done: retained=${retainedIssues}, purse=${purseIssues}`);
    } catch (err) {
      handleToast(err.message || 'Unable to run consistency check');
    } finally {
      setConsistencyLoading(false);
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
        tradeApprovalMode:
          data.tradeApprovalMode === 'commissioner_only' ? 'commissioner_only' : cronSettings.tradeApprovalMode,
        enableTradeBundles: data.enableTradeBundles !== false ? data.enableTradeBundles : cronSettings.enableTradeBundles,
        bundleAutoApprove: data.bundleAutoApprove !== false ? data.bundleAutoApprove : cronSettings.bundleAutoApprove,
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

  const saveTradeGovernance = async () => {
    if (!adminUserId || tradeGovernanceSaving) return;
    if (cronSettings.tradeApprovalMode === 'commissioner_only' && !selectedCommissionerId) {
      handleToast('Select a commissioner account before enabling commissioner-only mode');
      return;
    }
    setTradeGovernanceSaving(true);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/settings/trade-commissioners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId,
          commissionerUserId: selectedCommissionerId || undefined,
          tradeApprovalMode: cronSettings.tradeApprovalMode,
          enableTradeBundles: cronSettings.enableTradeBundles,
          bundleAutoApprove: cronSettings.bundleAutoApprove,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save trade governance');
      setTradeCommissionerAdmins(Array.isArray(data.admins) ? data.admins : []);
      setSelectedCommissionerId(data.commissionerUserId ? String(data.commissionerUserId) : '');
      handleToast('Trade commissioner settings saved');
    } catch (err) {
      handleToast(err.message || 'Unable to save trade governance');
    } finally {
      setTradeGovernanceSaving(false);
    }
  };

  const revokeTeamOwnerAdmins = async () => {
    if (!adminUserId || revokeTeamAdminsLoading) return;
    if (
      !window.confirm(
        'Remove isAdmin from all accounts that have a team name? Neutral commissioner accounts (no team) keep admin. Continue?'
      )
    ) {
      return;
    }
    setRevokeTeamAdminsLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/settings/revoke-team-owner-admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to revoke');
      handleToast(data.message || 'Team owner admin access revoked');
      await fetchTradeCommissioners();
    } catch (err) {
      handleToast(err.message || 'Unable to revoke team owner admins');
    } finally {
      setRevokeTeamAdminsLoading(false);
    }
  };

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

  const loadDatabases = async () => {
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/cpl-report/databases`);
      const data = await res.json();
      const dbs = Array.isArray(data.databases) ? data.databases : [];
      setDatabases(dbs);
      if (!res.ok) throw new Error(data.message || 'Failed to load databases');
    } catch (err) {
      // Keep dropdown usable even if listing endpoint fails.
      if (cplReportStartDb) {
        setDatabases([{ name: cplReportStartDb }]);
      }
      handleToast(err.message || 'Failed to load databases');
    }
  };

  useEffect(() => {
    if (adminUserId) {
      loadDatabases();
      loadCplReportConfig();
      loadParticipatingTeams();
    }
  }, [adminUserId]);

  useEffect(() => {
    if (!cplReportStartDb) return;
    if (databases.some((db) => db.name === cplReportStartDb)) return;
    setDatabases((prev) => [...prev, { name: cplReportStartDb }]);
  }, [cplReportStartDb, databases]);

  // Team Participation Management Functions
  const loadParticipatingTeams = async () => {
    setParticipatingTeamsLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/participating-teams`);
      const data = await res.json();
      if (res.ok && data.success) {
        setParticipatingTeams(data.teams || []);
      }
    } catch (err) {
      console.error('Failed to load participating teams:', err);
    } finally {
      setParticipatingTeamsLoading(false);
    }
  };

  const toggleTeamParticipation = (teamId) => {
    setParticipatingTeams(prev => 
      prev.map(team => 
        team.id === teamId 
          ? { ...team, isParticipating: !team.isParticipating }
          : team
      )
    );
  };

  const saveParticipatingTeams = async () => {
    // Build confirmation data
    const participating = participatingTeams.filter(t => t.isParticipating);
    const notParticipating = participatingTeams.filter(t => !t.isParticipating);
    
    setParticipationConfirmData({
      participating,
      notParticipating,
      totalTeams: participatingTeams.length
    });
    setShowParticipationConfirm(true);
  };

  const executeParticipationSave = async () => {
    setShowParticipationConfirm(false);
    setParticipatingTeamsSaving(true);
    try {
      const teamUpdates = participatingTeams.map(team => ({
        teamId: team.id,
        isParticipating: team.isParticipating,
      }));

      const res = await fetch(`${API_ENDPOINTS}/api/participating-teams/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamUpdates }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save');
      
      handleToast(`✅ Updated ${data.updated} team(s) participation status`);
      
      // Invalidate cache to force refresh of point tables and fixtures
      await fetch(`${API_ENDPOINTS}/api/cache/invalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch(err => console.warn('Cache invalidation failed:', err));
      
      await loadParticipatingTeams();
    } catch (err) {
      handleToast(err.message || 'Failed to save team participation');
    } finally {
      setParticipatingTeamsSaving(false);
    }
  };

  // CPL Report Configuration Functions
  const loadCplReportConfig = async () => {
    setCplReportLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/cpl-report/config`);
      const data = await res.json();
      if (res.ok) {
        setCplReportStartDb(data.cplReportStartDb || '');
      }
    } catch (err) {
      console.error('Failed to load CPL report config:', err);
    } finally {
      setCplReportLoading(false);
    }
  };

  const saveCplReportConfig = async () => {
    if (!cplReportStartDb) {
      handleToast('Please select a starting database');
      return;
    }
    setCplReportSaving(true);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/cpl-report/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cplReportStartDb }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save config');
      handleToast('CPL report configuration saved!');
    } catch (err) {
      handleToast(err.message || 'Failed to save config');
    } finally {
      setCplReportSaving(false);
    }
  };

  const cronDefinitions = [
    {
      key: 'cronSingleBidEnabled',
      title: '1:30 AM–4:30 AM: Exit/Sell Windows (5 min / 2 min cycle)',
      description:
        '1:30–2:10 AM: exit-only every 5 min (no selling). 2:18 AM: one-time immediate sell sweep (second already exited). 2:20–3:15 AM: every 5 min – if 2 bidders → exit only; if 1 bidder + 5 min since exit → sell. 3:16–4:30 AM: same logic every 2 min (2-min check). Never sells when 2 bidders are active. Enabling this pauses bulk cleanup.',
    },
    {
      key: 'cronSingleBidFinalizerEnabled',
      title: '1:30 AM: Sell Single-Bid-Only Players',
      description:
        'At 1:30 AM IST sell players who have only ever received one bid (no counter bid since auction start). Skips if second bidder is still active.',
    },
    {
      key: 'cronBulkExitEnabled',
      title: '10:30 PM–12:10 AM & 1:05–1:35 AM: Bulk Exit Second-Highest',
      description:
        'Window 1: 10:30 PM–12:10 AM IST every 10 min. Window 2: 1:05–1:35 AM every 10 min. Then stops. No selling. Enabling this pauses the 1:30 AM–4:30 AM timed windows.',
    },
    {
      key: 'cronLockEnabled',
      title: 'Lock Under Limit',
      description: 'Nightly at 1:00 AM IST lock teams that violate roster rules. Choose which categories to check (only active auction categories).',
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
        <div className="section-header" style={{ flexDirection: isCompact ? 'column' : 'row', gap: isCompact ? '12px' : '0' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: isCompact ? '18px' : '20px' }}>CPL Composite Report Configuration</h2>
            <p style={{ fontSize: isCompact ? '13px' : '14px' }}>
              Configure which database to start from for the CPL composite report. The report will include the selected database and all subsequent databases that exist. For example, if you select <code>cpl_22</code> and <code>cpl_23</code> exists, it will include both <code>cpl_22</code> and <code>cpl_23</code>.
            </p>
          </div>
          <div className="section-actions" style={{ 
            flexDirection: isCompact ? 'column' : 'row', 
            width: isCompact ? '100%' : 'auto',
            gap: isCompact ? '8px' : '12px'
          }}>
            <button
              className="btn primary"
              onClick={saveCplReportConfig}
              disabled={!cplReportStartDb || cplReportSaving}
              style={{ 
                width: isCompact ? '100%' : 'auto',
                padding: isCompact ? '10px 16px' : '8px 16px',
                fontSize: isCompact ? '14px' : '15px'
              }}
            >
              {cplReportSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isCompact ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 16, 
          marginBottom: 16,
          width: '100%'
        }}>
          <label className="field-label" style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
            <span style={{ fontSize: isCompact ? '13px' : '14px', fontWeight: 500 }}>
              Starting Database for Report
              {cplReportLoading && <span style={{ fontSize: '11px', color: '#3498db', marginLeft: '8px' }}>(Loading...)</span>}
            </span>
            <select
              className="select"
              value={cplReportStartDb}
              onChange={(e) => setCplReportStartDb(e.target.value)}
              disabled={cplReportSaving}
              style={{ width: '100%', fontSize: isCompact ? '14px' : '15px', padding: isCompact ? '8px' : '10px' }}
            >
              <option value="">Select starting database...</option>
              {databases.map((db) => (
                <option key={db.name} value={db.name}>
                  {db.name} → includes {db.name} and subsequent DBs that exist
                </option>
              ))}
            </select>
          </label>
        </div>

        {cplReportStartDb && (
          <div style={{ 
            padding: '12px', 
            background: 'rgba(52, 152, 219, 0.1)', 
            borderRadius: '6px',
            border: '1px solid rgba(52, 152, 219, 0.3)'
          }}>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
              <strong>Current Configuration:</strong>
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
              📊 Composite report starts from: <strong>{cplReportStartDb}</strong>
              <br />
              💡 Will include: <strong>{cplReportStartDb}</strong> and all subsequent databases that exist (e.g., if {cplReportStartDb.replace(/\d+$/, (m) => `cpl_${parseInt(m) + 1}`)} and {cplReportStartDb.replace(/\d+$/, (m) => `cpl_${parseInt(m) + 2}`)} exist, they'll be included)
            </div>
          </div>
        )}
      </section>

      <section className="admin-section">
        <div className="section-header" style={{ flexDirection: isCompact ? 'column' : 'row', gap: isCompact ? '12px' : '0' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: isCompact ? '18px' : '20px' }}>Team Participation Management</h2>
            <p style={{ fontSize: isCompact ? '13px' : '14px' }}>
              Mark teams as participating or not participating in the current season. Non-participating teams will be hidden from point tables, fixtures, and playoffs. They also cannot make trades.
            </p>
          </div>
          <div className="section-actions" style={{ 
            flexDirection: isCompact ? 'column' : 'row', 
            width: isCompact ? '100%' : 'auto',
            gap: isCompact ? '8px' : '12px'
          }}>
            <button
              className="btn primary"
              onClick={saveParticipatingTeams}
              disabled={participatingTeamsSaving || participatingTeamsLoading}
              style={{ 
                width: isCompact ? '100%' : 'auto',
                padding: isCompact ? '10px 16px' : '8px 16px',
                fontSize: isCompact ? '14px' : '15px'
              }}
            >
              {participatingTeamsSaving ? 'Saving...' : 'Save Participation Status'}
            </button>
          </div>
        </div>

        {participatingTeamsLoading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
            Loading teams...
          </div>
        ) : (
          <>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isCompact ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 12,
              marginBottom: 16
            }}>
              {participatingTeams.map(team => (
                <label 
                  key={team.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px',
                    background: team.isParticipating 
                      ? 'rgba(46, 204, 113, 0.1)' 
                      : 'rgba(231, 76, 60, 0.1)',
                    border: team.isParticipating 
                      ? '1px solid rgba(46, 204, 113, 0.3)' 
                      : '1px solid rgba(231, 76, 60, 0.3)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={team.isParticipating}
                    onChange={() => toggleTeamParticipation(team.id)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>
                      {team.teamName || team.name}
                    </div>
                    {team.abbreviation && (
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                        {team.abbreviation}
                      </div>
                    )}
                  </div>
                  <div style={{ 
                    fontSize: '11px', 
                    fontWeight: 600,
                    color: team.isParticipating ? '#2ecc71' : '#e74c3c'
                  }}>
                    {team.isParticipating ? '✓ Participating' : '✗ Not Participating'}
                  </div>
                </label>
              ))}
            </div>

            <div style={{ 
              padding: '12px', 
              background: 'rgba(241, 196, 15, 0.1)', 
              borderRadius: '6px',
              border: '1px solid rgba(241, 196, 15, 0.3)',
              fontSize: '13px',
              lineHeight: '1.6'
            }}>
              <strong>⚠️ Important:</strong>
              <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
                <li>Non-participating teams will be hidden from point tables and fixtures</li>
                <li>Playoff calculations will be adjusted based on participating teams only</li>
                <li>Non-participating teams cannot make trades</li>
                <li>Required games per team will be calculated based on participating teams</li>
              </ul>
            </div>

            {participatingTeams.length > 0 && (
              <div style={{ marginTop: '12px', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                Total: {participatingTeams.length} teams • 
                Participating: {participatingTeams.filter(t => t.isParticipating).length} • 
                Not Participating: {participatingTeams.filter(t => !t.isParticipating).length}
              </div>
            )}
          </>
        )}
      </section>

      <section className="admin-section">
        <div className="section-header">
          <div>
            <h2>Player Availability</h2>
            <p>Toggle unsold players for each tier to quickly gate auction pools.</p>
            {cronSettings.auctionAutoModeEnabled ? (
              <p style={{ marginTop: 8, fontSize: 12, color: 'rgba(46, 204, 113, 0.9)' }}>
                ✓ Auto Mode on – toggles update every 60s to match cron schedule (10:30 PM, 12:10 AM, etc.)
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

      <section className="admin-section" id="trade-commissioner">
        <div className="section-header">
          <div>
            <h2>Trade commissioner &amp; bundles</h2>
            <p>
              <strong>Commissioner account</strong> approves simple 1-for-1 trades (when commissioner-only mode is on).
              <strong> Bundles</strong> (2+ legs) can auto-execute when all teams accept, or wait for manual commissioner approval.
              Start with <em>Any admin</em> mode, assign a neutral commissioner, then switch to <em>Commissioner only</em> if needed.
            </p>
          </div>
          {tradeGovernanceSaving && <span className="cron-saving-pill">Saving…</span>}
        </div>
        <div className="cron-toggle-grid" style={{ alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <label className="field-label" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span>Standalone trade approval</span>
            <select
              className="select"
              value={cronSettings.tradeApprovalMode}
              onChange={(e) =>
                setCronSettings((prev) => ({ ...prev, tradeApprovalMode: e.target.value }))
              }
              disabled={tradeGovernanceSaving || !adminUserId}
            >
              <option value="any_admin">Any admin (default — no break)</option>
              <option value="commissioner_only">Commissioner only</option>
            </select>
          </label>
          <label className="field-label" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span>League commissioner</span>
            <select
              className="select"
              value={selectedCommissionerId}
              onChange={(e) => setSelectedCommissionerId(e.target.value)}
              disabled={tradeGovernanceSaving || !adminUserId}
            >
              <option value="">— Select admin account —</option>
              {tradeCommissionerAdmins.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name || a.email}
                  {a.teamName ? ` (${a.teamName})` : ' (no team — recommended)'}
                  {a.isCommissioner ? ' ★' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="cron-toggle" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={cronSettings.enableTradeBundles !== false}
              onChange={(e) =>
                setCronSettings((prev) => ({ ...prev, enableTradeBundles: e.target.checked }))
              }
              disabled={tradeGovernanceSaving || !adminUserId}
            />
            <span>Enable trade bundles</span>
          </label>
          <label className="cron-toggle" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={cronSettings.bundleAutoApprove !== false}
              onChange={(e) =>
                setCronSettings((prev) => ({ ...prev, bundleAutoApprove: e.target.checked }))
              }
              disabled={tradeGovernanceSaving || !adminUserId || cronSettings.enableTradeBundles === false}
            />
            <span>Auto-approve bundles when all legs ready</span>
          </label>
          <button
            type="button"
            className="btn primary"
            onClick={saveTradeGovernance}
            disabled={tradeGovernanceSaving || !adminUserId}
          >
            {tradeGovernanceSaving ? 'Saving…' : 'Save commissioner settings'}
          </button>
          <button
            type="button"
            className="btn"
            onClick={revokeTeamOwnerAdmins}
            disabled={revokeTeamAdminsLoading || !adminUserId}
            style={{ borderColor: '#dc2626', color: '#dc2626' }}
          >
            {revokeTeamAdminsLoading ? 'Working…' : 'Revoke admin from team owners'}
          </button>
        </div>
        <CommissionerTradeMonitor adminUserId={adminUserId} />
        <p className="admin-section-tip">
          Tip: Sign up a dedicated account with <strong>no team name</strong>, select it as commissioner, then save.
          Use &quot;Revoke admin from team owners&quot; so team accounts lose admin access. With auto-approve off,
          bundles appear in Admin Trades for manual <strong>Complete bundle</strong> after all legs are accepted.
        </p>
      </section>

      <section className="admin-section">
        <div className="section-header">
          <div>
            <h2>Fix release + same-tier pick double count (over-count only)</h2>
            <p>
              Use this only when <code>tradesUsed</code> is <strong>too high</strong>: a same-tier release and pick
              should share one slot but were never linked in the database. Scan links them and <strong>lowers</strong>{' '}
              <code>tradesUsed</code>. It does <strong>not</strong> help teams like FXD where the count is{' '}
              <strong>too low</strong> (wrong pairing ate a slot)—use <strong>Sync under-counted trades used</strong>{' '}
              below instead.
            </p>
          </div>
        </div>
        <div className="cron-toggle-grid" style={{ alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn primary"
            onClick={loadReleasePickRepairPreview}
            disabled={releasePickRepairLoading || !adminUserId}
          >
            {releasePickRepairLoading ? 'Scanning…' : 'Scan for teams needing fix'}
          </button>
          {releasePickRepairPreview?.totalTeams > 0 && (
            <>
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  const sel = {};
                  (releasePickRepairPreview.teams || []).forEach((t) => {
                    sel[t.userId] = true;
                  });
                  setReleasePickRepairSelected(sel);
                }}
                disabled={releasePickRepairApplying}
              >
                Select all
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  const sel = {};
                  (releasePickRepairPreview.teams || []).forEach((t) => {
                    sel[t.userId] = false;
                  });
                  setReleasePickRepairSelected(sel);
                }}
                disabled={releasePickRepairApplying}
              >
                Clear selection
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={applyReleasePickRepair}
                disabled={
                  releasePickRepairApplying ||
                  !adminUserId ||
                  !Object.values(releasePickRepairSelected).some(Boolean)
                }
              >
                {releasePickRepairApplying ? 'Applying…' : 'Apply fix to selected teams'}
              </button>
            </>
          )}
        </div>
        {releasePickRepairPreview?.note && (
          <p className="admin-hint" style={{ marginTop: 12, color: '#64748b', fontSize: 13 }}>
            {releasePickRepairPreview.note}
          </p>
        )}
        {releasePickRepairPreview?.teams?.length > 0 && (
          <div className="release-pick-repair-table-wrap" style={{ marginTop: 16, overflowX: 'auto' }}>
            <table className="release-pick-repair-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '8px 6px' }}>Include</th>
                  <th style={{ padding: '8px 6px' }}>Team</th>
                  <th style={{ padding: '8px 6px' }}>Pairs</th>
                  <th style={{ padding: '8px 6px' }}>tradesUsed now → after</th>
                  <th style={{ padding: '8px 6px' }}>Suggested links</th>
                </tr>
              </thead>
              <tbody>
                {releasePickRepairPreview.teams.map((t) => (
                  <tr key={t.userId} style={{ borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' }}>
                    <td style={{ padding: '10px 6px' }}>
                      <input
                        type="checkbox"
                        checked={!!releasePickRepairSelected[t.userId]}
                        onChange={() => toggleReleasePickRepairTeam(t.userId)}
                        aria-label={`Include ${t.teamName}`}
                      />
                    </td>
                    <td style={{ padding: '10px 6px', fontWeight: 600 }}>{t.teamName}</td>
                    <td style={{ padding: '10px 6px' }}>{t.pairs.length}</td>
                    <td style={{ padding: '10px 6px' }}>
                      {t.tradesUsedBefore} → {t.tradesUsedAfter}
                    </td>
                    <td style={{ padding: '10px 6px' }}>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {t.pairs.map((p, i) => (
                          <li key={`${p.releaseId}-${p.pickId}-${i}`}>
                            <span style={{ fontWeight: 600, color: '#0d6efd' }}>{p.tier}</span>: release{' '}
                            {p.releasePlayerName} ↔ pick {p.pickPlayerName}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {releasePickRepairPreview && releasePickRepairPreview.totalTeams === 0 && !releasePickRepairLoading && (
          <p style={{ marginTop: 12, color: '#16a34a' }}>No unlinked same-tier release/pick pairs found.</p>
        )}
      </section>

      <section className="admin-section">
        <div className="section-header">
          <div>
            <h2>Sync under-counted trades used</h2>
            <p>
              Compares <code>tradesUsed</code> to completed <strong>trades + releases + standalone picks</strong> (same
              formula as Team Trade Activity). If stored usage is <strong>lower</strong> than events imply—e.g. a pick
              wrongly paired to an old release and never charged—scan lists those teams. Apply sets{' '}
              <code>tradesUsed</code> to <code>min(expected, season cap)</code>. Review Team Trade Activity first; this
              does not change release/pick rows, only the user counter.
            </p>
          </div>
        </div>
        <div className="cron-toggle-grid" style={{ alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn primary"
            onClick={loadTradesUsedReconcilePreview}
            disabled={tradesUsedReconcileLoading || !adminUserId}
          >
            {tradesUsedReconcileLoading ? 'Scanning…' : 'Scan for under-counted teams'}
          </button>
          {tradesUsedReconcilePreview?.totalTeams > 0 && (
            <>
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  const sel = {};
                  (tradesUsedReconcilePreview.teams || []).forEach((t) => {
                    sel[t.userId] = true;
                  });
                  setTradesUsedReconcileSelected(sel);
                }}
                disabled={tradesUsedReconcileApplying}
              >
                Select all
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  const sel = {};
                  (tradesUsedReconcilePreview.teams || []).forEach((t) => {
                    sel[t.userId] = false;
                  });
                  setTradesUsedReconcileSelected(sel);
                }}
                disabled={tradesUsedReconcileApplying}
              >
                Clear selection
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={applyTradesUsedReconcile}
                disabled={
                  tradesUsedReconcileApplying ||
                  !adminUserId ||
                  !Object.values(tradesUsedReconcileSelected).some(Boolean)
                }
              >
                {tradesUsedReconcileApplying ? 'Applying…' : 'Apply sync to selected teams'}
              </button>
            </>
          )}
        </div>
        {tradesUsedReconcilePreview?.note && (
          <p className="admin-hint" style={{ marginTop: 12, color: '#64748b', fontSize: 13 }}>
            {tradesUsedReconcilePreview.note}
          </p>
        )}
        {tradesUsedReconcilePreview?.teams?.length > 0 && (
          <div style={{ marginTop: 16, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '8px 6px' }}>Include</th>
                  <th style={{ padding: '8px 6px' }}>Team</th>
                  <th style={{ padding: '8px 6px' }}>Stored</th>
                  <th style={{ padding: '8px 6px' }}>Expected</th>
                  <th style={{ padding: '8px 6px' }}>After sync</th>
                </tr>
              </thead>
              <tbody>
                {tradesUsedReconcilePreview.teams.map((t) => (
                  <tr key={t.userId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 6px' }}>
                      <input
                        type="checkbox"
                        checked={!!tradesUsedReconcileSelected[t.userId]}
                        onChange={() => toggleTradesUsedReconcileTeam(t.userId)}
                        aria-label={`Include ${t.teamName}`}
                      />
                    </td>
                    <td style={{ padding: '10px 6px', fontWeight: 600 }}>{t.teamName}</td>
                    <td style={{ padding: '10px 6px' }}>{t.tradesUsed}</td>
                    <td style={{ padding: '10px 6px' }}>{t.expectedTradesUsed}</td>
                    <td style={{ padding: '10px 6px' }}>{t.suggestedTradesUsed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tradesUsedReconcilePreview &&
          tradesUsedReconcilePreview.totalTeams === 0 &&
          !tradesUsedReconcileLoading && (
            <p style={{ marginTop: 12, color: '#16a34a' }}>No under-counted teams found.</p>
          )}
      </section>

      <section className="admin-section">
        <div className="section-header">
          <div>
            <h2>Auction Auto Mode</h2>
            <p>When enabled: 10:30 PM start categories + bulk; 12:10 AM bulk off / single-bid on; 1:04 AM bulk on; 1:25 AM single-bid finalizer on; 1:50 AM bulk off; 2:20 AM sell-after-exit on. No manual toggling. When disabled, manually control Cron Controls and Player Availability. Turning Auto Mode OFF does not change Player Availability—it stays as is.</p>
          </div>
          {cronSaving && <span className="cron-saving-pill">Saving…</span>}
        </div>
        {!cronLoading && (
          <div className="cron-toggle-grid">
            <div className="cron-toggle-card">
              <div className="cron-toggle-info">
                <div className="data-card-title">Auto Mode</div>
                <p>10:30 PM: categories + bulk. 12:10 AM: bulk off, exit-only on. 1:25 AM: finalizer on. 1:05 AM: bulk on. 1:50 AM: bulk off. 2:20 AM: sell-after-exit on.</p>
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
            <div className="auto-mode-categories-title">Categories to enable at 10:30 PM</div>
            <p className="auto-mode-categories-hint">Tap to toggle. Checked = enabled now and at 10:30 PM.</p>
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
            <p>Toggle background jobs on or off. The 1:30 AM–4:30 AM exit/sell windows and the bulk exit (10:30 PM–12:10 AM & 1:05–1:35 AM) cannot run at the same time.</p>
            {cronSettings.auctionAutoModeEnabled ? (
              <p style={{ marginTop: 8, fontSize: 12, color: 'rgba(46, 204, 113, 0.9)' }}>
                ✓ Auto Mode on – toggles update every 60s to match cron schedule (10:30 PM, 12:10 AM, etc.)
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
            <p>
              Preview purse adjustments using full consistency math:
              100 Cr - players value - active bid locks - queue locks.
            </p>
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
                    <span>Bid Locks</span>
                    <strong>{formatCr(team.bidLocksCr || 0)}</strong>
                  </div>
                  <div className="data-card-row">
                    <span>Queue Locks</span>
                    <strong>{formatCr(team.queueLocksCr || 0)}</strong>
                  </div>
                  <div className="data-card-row">
                    <span>Expected Purse</span>
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
                    <th>Bid Locks</th>
                    <th>Queue Locks</th>
                    <th>Expected Purse</th>
                    <th>Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {actionableTeams.length === 0 && (
                    <tr>
                      <td colSpan={7} className="muted">
                        All purses are aligned. No changes needed.
                      </td>
                    </tr>
                  )}
                  {actionableTeams.map((team) => (
                    <tr key={team.userId}>
                      <td>{team.teamName}</td>
                      <td>{formatCr(team.currentPurseCr)}</td>
                      <td>{formatCr(team.playersValueCr)}</td>
                      <td>{formatCr(team.bidLocksCr || 0)}</td>
                      <td>{formatCr(team.queueLocksCr || 0)}</td>
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

      {/* Team Participation Confirmation Modal */}
      {showParticipationConfirm && participationConfirmData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: isCompact ? '16px' : '20px',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            borderRadius: '16px',
            padding: isCompact ? '20px' : '32px',
            maxWidth: isCompact ? '95%' : '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            animation: 'slideIn 0.3s ease-out'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '2px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                fontSize: isCompact ? '32px' : '40px',
                animation: 'pulse 2s infinite'
              }}>🔔</div>
              <div>
                <h2 style={{
                  margin: 0,
                  fontSize: isCompact ? '20px' : '24px',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>Confirm Participation Changes</h2>
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: isCompact ? '12px' : '13px',
                  color: 'rgba(255, 255, 255, 0.6)'
                }}>Review the changes before saving</p>
              </div>
            </div>

            {/* Participating Teams */}
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              background: 'rgba(46, 204, 113, 0.1)',
              borderRadius: '12px',
              border: '2px solid rgba(46, 204, 113, 0.3)'
            }}>
              <div style={{
                fontSize: isCompact ? '14px' : '16px',
                fontWeight: 700,
                color: '#2ecc71',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>✅</span>
                <span>PARTICIPATING TEAMS ({participationConfirmData.participating.length})</span>
              </div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                maxHeight: '150px',
                overflowY: 'auto'
              }}>
                {participationConfirmData.participating.length > 0 ? (
                  participationConfirmData.participating.map((team, idx) => (
                    <div key={idx} style={{
                      padding: '6px 12px',
                      background: 'rgba(46, 204, 113, 0.2)',
                      borderRadius: '6px',
                      fontSize: isCompact ? '12px' : '13px',
                      color: '#2ecc71',
                      fontWeight: 600
                    }}>
                      {team.teamName || team.name}
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>(none)</div>
                )}
              </div>
            </div>

            {/* Not Participating Teams */}
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              background: 'rgba(231, 76, 60, 0.1)',
              borderRadius: '12px',
              border: '2px solid rgba(231, 76, 60, 0.3)'
            }}>
              <div style={{
                fontSize: isCompact ? '14px' : '16px',
                fontWeight: 700,
                color: '#e74c3c',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>❌</span>
                <span>NOT PARTICIPATING TEAMS ({participationConfirmData.notParticipating.length})</span>
              </div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                maxHeight: '150px',
                overflowY: 'auto'
              }}>
                {participationConfirmData.notParticipating.length > 0 ? (
                  participationConfirmData.notParticipating.map((team, idx) => (
                    <div key={idx} style={{
                      padding: '6px 12px',
                      background: 'rgba(231, 76, 60, 0.2)',
                      borderRadius: '6px',
                      fontSize: isCompact ? '12px' : '13px',
                      color: '#e74c3c',
                      fontWeight: 600
                    }}>
                      {team.teamName || team.name}
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>(none)</div>
                )}
              </div>
            </div>

            {/* Impact Warning */}
            {participationConfirmData.notParticipating.length > 0 && (
              <div style={{
                marginBottom: '20px',
                padding: '16px',
                background: 'rgba(241, 196, 15, 0.1)',
                borderRadius: '12px',
                border: '2px solid rgba(241, 196, 15, 0.3)'
              }}>
                <div style={{
                  fontSize: isCompact ? '14px' : '15px',
                  fontWeight: 700,
                  color: '#f1c40f',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>⚠️</span>
                  <span>IMPACT OF THIS CHANGE</span>
                </div>
                <ul style={{
                  margin: 0,
                  paddingLeft: '20px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: isCompact ? '12px' : '13px',
                  lineHeight: '1.8'
                }}>
                  <li>Non-participating teams will be <strong>HIDDEN from point tables</strong></li>
                  <li>Non-participating teams will be <strong>HIDDEN from fixtures</strong></li>
                  <li>Non-participating teams will be <strong>HIDDEN from playoff fixtures</strong></li>
                  <li>Non-participating teams <strong>CANNOT make trades</strong></li>
                  <li>Playoff requirement will adjust to <strong>{participationConfirmData.participating.length - 1} matches</strong></li>
                </ul>
              </div>
            )}

            {/* Statistics */}
            <div style={{
              marginBottom: '24px',
              padding: '16px',
              background: 'rgba(52, 152, 219, 0.1)',
              borderRadius: '12px',
              border: '2px solid rgba(52, 152, 219, 0.3)'
            }}>
              <div style={{
                fontSize: isCompact ? '14px' : '15px',
                fontWeight: 700,
                color: '#3498db',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>📊</span>
                <span>SUMMARY</span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: isCompact ? '12px' : '13px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: isCompact ? '20px' : '24px', fontWeight: 700, color: '#3498db' }}>
                    {participationConfirmData.totalTeams}
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Total</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: isCompact ? '20px' : '24px', fontWeight: 700, color: '#2ecc71' }}>
                    {participationConfirmData.participating.length}
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Participating</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: isCompact ? '20px' : '24px', fontWeight: 700, color: '#e74c3c' }}>
                    {participationConfirmData.notParticipating.length}
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Not Playing</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              flexDirection: isCompact ? 'column' : 'row'
            }}>
              <button
                onClick={() => setShowParticipationConfirm(false)}
                style={{
                  flex: 1,
                  padding: isCompact ? '14px' : '16px',
                  fontSize: isCompact ? '14px' : '16px',
                  fontWeight: 700,
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  ':hover': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.3)'
                  }
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                ❌ Cancel
              </button>
              <button
                onClick={executeParticipationSave}
                disabled={participatingTeamsSaving}
                style={{
                  flex: 1,
                  padding: isCompact ? '14px' : '16px',
                  fontSize: isCompact ? '14px' : '16px',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  cursor: participatingTeamsSaving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: participatingTeamsSaving ? 0.6 : 1,
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                }}
                onMouseEnter={(e) => {
                  if (!participatingTeamsSaving) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                }}
              >
                {participatingTeamsSaving ? '⏳ Saving...' : '✅ Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminControlPanel;

