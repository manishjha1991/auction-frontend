import React, { useEffect, useMemo, useState } from 'react';
import { API_ENDPOINTS } from '../const';
import '../css/TradeCenter.css';
import { FaExchangeAlt, FaCheck,FaClock, FaBoxOpen,FaTimes, FaPaperPlane, FaRetweet, FaUsers, FaUnlock, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

// Sexy Dropdown Loader Component
const SexyDropdownLoader = ({ isLoading, children, placeholder = "Loading...", dataLength = 0, dataType = "", isStale = false, onRefresh, loadingProgress = 0 }) => {
  if (isLoading) {
    let message = placeholder;
    
    // Show different messages based on data type and loading state
    if (dataType === "roster" && dataLength === 0) {
      message = loadingProgress > 0 ? `Fetching your players... ${loadingProgress}%` : "Fetching your players...";
    } else if (dataType === "teams" && dataLength === 0) {
      message = loadingProgress > 0 ? `Loading all teams... ${loadingProgress}%` : "Loading all teams...";
    } else if (dataType === "targetRoster" && dataLength === 0) {
      message = loadingProgress > 0 ? `Loading team roster... ${loadingProgress}%` : "Loading team roster...";
    }
    
    return (
      <div className="sexy-dropdown-loader">
        <div className="loader-content">
          <div className="loader-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <span className="loader-text">{message}</span>
          {loadingProgress > 0 && (
            <div className="loader-progress">
              <div className="progress-bar" style={{ width: `${loadingProgress}%` }}></div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Show stale data state with refresh option
  if (isStale && dataLength === 0) {
    return (
      <div className="sexy-stale-data">
        <div className="stale-data-content">
          <div className="stale-data-icon">🔄</div>
          <span className="stale-data-text">Data may be outdated</span>
          <button className="refresh-btn" onClick={onRefresh}>
            <span>↻</span> Refresh
          </button>
        </div>
      </div>
    );
  }
  
  // Show cool "no data" state if data is empty after loading
  if (dataLength === 0 && !isLoading) {
    return (
      <div className="sexy-no-data">
        <div className="no-data-content">
          <div className="no-data-icon">📭</div>
          <span className="no-data-text">No {dataType === "roster" ? "players" : dataType === "teams" ? "teams" : "data"} available</span>
        </div>
      </div>
    );
  }
  
  return children;
};

// Sexy Alert Component
const SexyAlert = ({ alert, onClose }) => {
  if (!alert) return null;

  const getIcon = () => {
    switch (alert.type) {
      case 'success': return <FaCheckCircle />;
      case 'error': return <FaTimesCircle />;
      case 'warning': return <FaExclamationTriangle />;
      default: return <FaInfoCircle />;
    }
  };

  const getBgColor = () => {
    switch (alert.type) {
      case 'success': return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      case 'error': return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
      case 'warning': return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
      default: return 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
    }
  };

  return (
    <div className="sexy-alert-overlay">
      <div className="sexy-alert" style={{ background: getBgColor() }}>
        <div className="alert-icon">{getIcon()}</div>
        <div className="alert-content">
          <h3 className="alert-title">{alert.title}</h3>
          <p className="alert-message">{alert.message}</p>
        </div>
        <button className="alert-close" onClick={onClose}>×</button>
        <div className="alert-particles">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="particle" style={{ '--delay': `${i * 0.1}s` }}></div>
          ))}
        </div>
      </div>
    </div>
  );
};

function TradeCenter() {
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]); // all teams
  const [allPlayers, setAllPlayers] = useState([]); // from /api/players/data
  const [selectedMyPlayer, setSelectedMyPlayer] = useState('');
  const [targetTeamId, setTargetTeamId] = useState('');
  const [selectedTargetPlayer, setSelectedTargetPlayer] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [toast, setToast] = useState('');
  const [trades, setTrades] = useState([]);
  // removed server roster cache; we derive from allPlayers by teamName
  const [limitReached, setLimitReached] = useState(false);
  const [pendingTradesCount, setPendingTradesCount] = useState(0);
  const [releasePlayerId, setReleasePlayerId] = useState('');
  const [tradeUsage, setTradeUsage] = useState({ tradesUsed: 0, cap: 4, remaining: 4 });
  const [myReleases, setMyReleases] = useState([]);

  const [loadingStates, setLoadingStates] = useState({
    propose: false,
    withdraw: false,
    release: false,
    respond: false
  });
  
  // Track when user is selecting trade options vs release options
  const [isSelectingTrade, setIsSelectingTrade] = useState(false);
  const [isSelectingRelease, setIsSelectingRelease] = useState(false);
  const [alert, setAlert] = useState(null);
  
  // Dropdown loading states
  const [dropdownLoading, setDropdownLoading] = useState({
    myRoster: true,
    teams: true,
    targetRoster: true
  });
  
  // Track when data was last fetched
  const [lastFetchTime, setLastFetchTime] = useState({
    teams: 0,
    players: 0,
    trades: 0
  });
  
  // Derive my roster from allPlayers using my teamName - OPTIMIZED with memoization
  const myRoster = useMemo(() => {
    if (!user || !allPlayers.length) return [];
    
    // Use Set for faster team name comparison
    const userTeamName = user.teamName;
    if (!userTeamName) return [];
    
    // Filter players efficiently
    return allPlayers
      .filter(p => p.teamName === userTeamName)
      .map(p => ({ id: p.id, name: p.name, role: p.role }));
  }, [user?.teamName, allPlayers]);

  // Derive target roster from allPlayers using selected teamName - OPTIMIZED
  const targetRoster = useMemo(() => {
    if (!targetTeamId || !teams.length || !allPlayers.length) return [];
    
    const team = teams.find(t => t._id === targetTeamId);
    if (!team?.teamName) return [];
    
    // Filter players efficiently
    return allPlayers
      .filter(p => p.teamName === team.teamName)
      .map(p => ({ id: p.id, name: p.name, role: p.role }));
  }, [targetTeamId, teams, allPlayers]);

  // Derive other teams - OPTIMIZED
  const otherTeams = useMemo(() => {
    if (!teams.length || !user?.id) return [];
    return teams.filter(t => t._id !== user.id);
  }, [teams, user?.id]);

  // Simple stale data detection
  const isDataStale = (dataType) => {
    const now = Date.now();
    const staleThreshold = 30000; // 30 seconds
    return (now - lastFetchTime[dataType]) > staleThreshold;
  };

  // Track when user is selecting trade options
  useEffect(() => {
    const hasTradeSelection = selectedMyPlayer || selectedTargetPlayer || targetTeamId;
    setIsSelectingTrade(!!hasTradeSelection);
  }, [selectedMyPlayer, selectedTargetPlayer, targetTeamId]);
  
  // Track when user is selecting release options
  useEffect(() => {
    setIsSelectingRelease(!!releasePlayerId);
  }, [releasePlayerId]);

  // Update loading states when data changes
  useEffect(() => {
    if (allPlayers.length > 0 && user?.teamName) {
      setDropdownLoading(prev => ({ ...prev, myRoster: false }));
    }
  }, [allPlayers, user?.teamName]);
  
  useEffect(() => {
    if (teams.length > 0) {
      setDropdownLoading(prev => ({ ...prev, teams: false }));
    }
  }, [teams]);
  
  useEffect(() => {
    if (targetTeamId && targetRoster.length > 0) {
      setDropdownLoading(prev => ({ ...prev, targetRoster: false }));
    }
  }, [targetTeamId, targetRoster]);
  
  // Set target roster loading when team is selected
  useEffect(() => {
    if (targetTeamId) {
      setDropdownLoading(prev => ({ ...prev, targetRoster: true }));
      // Small delay to show loading animation
      const timer = setTimeout(() => {
        setDropdownLoading(prev => ({ ...prev, targetRoster: false }));
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [targetTeamId]);

  const isMe = (maybeId) => {
    if (!user) return false;
    const uid = user.id || user._id;
    return String(maybeId) === String(uid);
  };
  const isFromMe = (trade) => isMe(trade?.fromUser?._id || trade?.fromUser);
  const isToMe = (trade) => isMe(trade?.toUser?._id || trade?.toUser);

  useEffect(() => {
    const cachedUser = localStorage.getItem('user');
    if (cachedUser) {
      setUser(JSON.parse(cachedUser));
    }
  }, []);

  useEffect(() => {
    async function bootstrap() {
      try {
        setLoading(true);
        setLoadingProgress(10);
        
        // Cache user data to avoid repeated localStorage access
        const cachedUser = localStorage.getItem('user');
        const currentUser = cachedUser ? JSON.parse(cachedUser) : null;
        
        // Fetch user-specific data and general data in parallel for better performance
        const userSpecificPromises = currentUser ? [
          fetch(`${API_ENDPOINTS}/api/trades/user/${currentUser.id}`),
          fetch(`${API_ENDPOINTS}/api/users/${currentUser.id}/trades-usage`),
          fetch(`${API_ENDPOINTS}/api/releases/user/${currentUser.id}`)
        ] : [
          Promise.resolve({ ok: true, json: async () => [] }),
          Promise.resolve({ ok: true, json: async () => ({ tradesUsed: 0, cap: 4, remaining: 4 }) }),
          Promise.resolve({ ok: true, json: async () => [] })
        ];
        
        // Fetch teams and players data in parallel
        const [teamsRes, playersRes, ...userSpecificResults] = await Promise.all([
          fetch(`${API_ENDPOINTS}/api/users/teams`),
          fetch(`${API_ENDPOINTS}/api/players/data`),
          ...userSpecificPromises
        ]);
        
        setLoadingProgress(30);
        
        // Parse responses in parallel
        const [teamsJson, playersJson, tradesJson, usageJson, releasesJson] = await Promise.all([
          teamsRes.json(),
          playersRes.json(),
          userSpecificResults[0].json(),
          userSpecificResults[1].json(),
          userSpecificResults[2].json()
        ]);
        
        setLoadingProgress(70);
        
        // Set all data at once to reduce re-renders
        // The /api/users/teams endpoint returns teams array directly, not wrapped in teams property
        setTeams(Array.isArray(teamsJson) ? teamsJson : []);
        setTrades(tradesJson || []);
        setAllPlayers(Array.isArray(playersJson) ? playersJson : []);
        
        // Set fetch times
        const now = Date.now();
        setLastFetchTime({
          teams: now,
          players: now,
          trades: now
        });
        
        // Set dropdown loading states to false when data is loaded
        setDropdownLoading(prev => ({
          ...prev,
          teams: false,
          myRoster: false
        }));
        
        if (usageJson && typeof usageJson.tradesUsed !== 'undefined') {
          setTradeUsage({ 
            tradesUsed: usageJson.tradesUsed, 
            cap: usageJson.cap || 4, 
            remaining: usageJson.remaining 
          });
        }
        
        setMyReleases(Array.isArray(releasesJson) ? releasesJson : []);
        
        if (Array.isArray(tradesJson) && currentUser) {
          const activeTrades = tradesJson.filter(t => 
            ['pending', 'admin_pending'].includes(t.status) && 
            String(t.fromUser?._id) === String(currentUser?.id)
          );
          const activeReleases = releasesJson.filter(r => 
            ['pending', 'admin_pending'].includes(r.status) && 
            String(r.user) === String(currentUser?.id)
          );
          const totalActive = activeTrades.length + activeReleases.length;
          setLimitReached(totalActive >= 6);
          setPendingTradesCount(totalActive);
        }
        
        setLoadingProgress(100);
      } catch (e) {
        console.error('Bootstrap error:', e);
        setToast('Failed to load trade data.');
      } finally {
        setLoading(false);
        setLoadingProgress(0);
      }
    }
    
    if (user) {
      bootstrap();
    }
  }, [user]);

  // periodic refresh so roster updates after admin approval are reflected without manual reload
  useEffect(() => {
    let timer;
    async function refreshData() {
      try {
        // Only refresh if user exists and component is mounted
        if (!user) return;
        
        const [tradesRes, playersRes, usageRes, releasesRes] = await Promise.all([
          fetch(`${API_ENDPOINTS}/api/trades/user/${user.id}`),
          fetch(`${API_ENDPOINTS}/api/players/data`),
          fetch(`${API_ENDPOINTS}/api/users/${user.id}/trades-usage`),
          fetch(`${API_ENDPOINTS}/api/releases/user/${user.id}`)
        ]);
        
        const tradesJson = await tradesRes.json();
        const playersJson = await playersRes.json();
        const usageJson = await usageRes.json();
        const releasesJson = await releasesRes.json();

        setTrades(Array.isArray(tradesJson) ? tradesJson : []);
        setAllPlayers(Array.isArray(playersJson) ? playersJson : []);
        
        if (usageJson && typeof usageJson.tradesUsed !== 'undefined') {
          setTradeUsage({ 
            tradesUsed: usageJson.tradesUsed, 
            cap: usageJson.cap || 4, 
            remaining: usageJson.remaining 
          });
        }
        
        setMyReleases(Array.isArray(releasesJson) ? releasesJson : []);

        if (Array.isArray(tradesJson)) {
          const activeTrades = tradesJson.filter(t => 
            ['pending', 'admin_pending'].includes(t.status) && 
            String(t.fromUser?._id) === String(user?.id)
          );
          const activeReleases = releasesJson.filter(r => 
            ['pending', 'admin_pending'].includes(r.status) && 
            String(r.user) === String(user?.id)
          );
          const totalActive = activeTrades.length + activeReleases.length;
          setLimitReached(totalActive >= 6);
          setPendingTradesCount(totalActive);
        }
      } catch (error) {
        console.error('Refresh error:', error);
        // Don't show error to user for background refresh
      }
    }
    
    // Increase refresh interval to 15 seconds to reduce server load
    if (user) {
      timer = setInterval(refreshData, 15000);
    }
    
    return () => { 
      if (timer) clearInterval(timer); 
    };
  }, [user]);

  // Function to refresh specific data - OPTIMIZED
  const refreshData = async (dataType) => {
    const startTime = performance.now();
    try {
      setDropdownLoading(prev => ({ ...prev, [dataType]: true }));
      
      if (dataType === 'teams') {
        const teamsRes = await fetch(`${API_ENDPOINTS}/api/users/teams`);
        if (!teamsRes.ok) throw new Error('Failed to fetch teams');
        const teamsJson = await teamsRes.json();
        // The /api/users/teams endpoint returns teams array directly, not wrapped in teams property
        setTeams(Array.isArray(teamsJson) ? teamsJson : []);
        setLastFetchTime(prev => ({ ...prev, teams: Date.now() }));
      } else if (dataType === 'players') {
        const playersRes = await fetch(`${API_ENDPOINTS}/api/players/data`);
        if (!playersRes.ok) throw new Error('Failed to fetch players');
        const playersJson = await playersRes.json();
        setAllPlayers(Array.isArray(playersJson) ? playersJson : []);
        setLastFetchTime(prev => ({ ...prev, players: Date.now() }));
      }
      
      const loadTime = performance.now() - startTime;
      console.log(`🔄 ${dataType} refreshed in ${loadTime.toFixed(2)}ms`);
      
      setDropdownLoading(prev => ({ ...prev, [dataType]: false }));
    } catch (error) {
      console.error(`Error refreshing ${dataType}:`, error);
      setDropdownLoading(prev => ({ ...prev, [dataType]: false }));
      setToast(`Failed to refresh ${dataType}. Please try again.`);
    }
  };

  const findTeamByName = (teamName) => (teams || []).find(t => t.teamName === teamName);

  async function proposeTrade() {
    if (!selectedMyPlayer || !selectedTargetPlayer || !targetTeamId) {
      setToast('Select player, target team, and target player.');
      return;
    }
    
    setLoadingStates(prev => ({ ...prev, propose: true }));
    
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/trades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromUserId: user.id, offeredPlayerId: selectedMyPlayer, requestedPlayerId: selectedTargetPlayer })
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed');
      }
      
      const j = await res.json();
      const updated = [j, ...trades];
      setTrades(updated);
      const activeMine = updated.filter(t => ['pending', 'admin_pending'].includes(t.status) && String(t.fromUser?._id) === String(user?.id));
      setLimitReached(activeMine.length >= 6);
      setPendingTradesCount(activeMine.length);
      
      // Show sexy success alert
      setAlert({
        type: 'success',
        title: 'Trade Proposal Sent! 🚀',
        message: 'Your trade proposal has been successfully sent and is awaiting approval.'
      });
      
      // Refresh usage (actual increment happens on admin approval, but we keep UI fresh)
      try {
        const ures = await fetch(`${API_ENDPOINTS}/api/users/${user.id}/trades-usage`);
        const ujson = await ures.json();
        if (typeof ujson.tradesUsed !== 'undefined') setTradeUsage({ tradesUsed: ujson.tradesUsed, cap: ujson.cap || 4, remaining: ujson.remaining });
      } catch {}
      
      setSelectedMyPlayer('');
      setTargetTeamId('');
      setSelectedTargetPlayer('');
      setReleasePlayerId(''); // Also reset release selection
    } catch (e) {
      // Show sexy error alert
      setAlert({
        type: 'error',
        title: 'Trade Failed! ❌',
        message: String(e.message || 'Could not send trade. Please try again.')
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, propose: false }));
    }
  }

  async function requestRelease() {
    if (!releasePlayerId) { setToast('Select a player to release'); return; }
    
    setLoadingStates(prev => ({ ...prev, release: true }));
    
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/releases`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, playerId: releasePlayerId })
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed');
      }
      
      setReleasePlayerId('');
      
      // Also reset trade selections
      setSelectedMyPlayer('');
      setTargetTeamId('');
      setSelectedTargetPlayer('');
      
      // Refresh data to update pending count
      try {
        const [tradesRes, releasesRes, usageRes] = await Promise.all([
          fetch(`${API_ENDPOINTS}/api/trades/user/${user.id}`),
          fetch(`${API_ENDPOINTS}/api/releases/user/${user.id}`),
          fetch(`${API_ENDPOINTS}/api/users/${user.id}/trades-usage`)
        ]);
        
        const tradesJson = await tradesRes.json();
        const releasesJson = await releasesRes.json();
        const usageJson = await usageRes.json();
        
        setTrades(Array.isArray(tradesJson) ? tradesJson : []);
        setMyReleases(Array.isArray(releasesJson) ? releasesJson : []);
        
        // Update pending count including both trades and releases
        const activeTrades = tradesJson.filter(t => ['pending', 'admin_pending'].includes(t.status) && String(t.fromUser?._id) === String(user?.id));
        const activeReleases = releasesJson.filter(r => ['pending', 'admin_pending'].includes(r.status) && String(r.user) === String(user?.id));
        const totalActive = activeTrades.length + activeReleases.length;
        
        setLimitReached(totalActive >= 6);
        setPendingTradesCount(totalActive);
        
        if (typeof usageJson.tradesUsed !== 'undefined') {
          setTradeUsage({ tradesUsed: usageJson.tradesUsed, cap: usageJson.cap || 4, remaining: usageJson.remaining });
        }
      } catch {}
      
      // Show sexy success alert
      setAlert({
        type: 'success',
        title: 'Release Request Sent! 🔓',
        message: 'Your release request has been sent to admin for approval.'
      });
    } catch (e) {
      // Show sexy error alert
      setAlert({
        type: 'error',
        title: 'Release Failed! ❌',
        message: 'Failed to request release. Please try again.'
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, release: false }));
    }
  }

  async function respondTrade(tradeId, decision) {
    setLoadingStates(prev => ({ ...prev, respond: true }));
    
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/trades/${tradeId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ byUserId: user.id, decision })
      });
      
      const j = await res.json();
      const updated = trades.map(t => (t._id === tradeId ? j : t));
      setTrades(updated);
      
      // Update pending count including both trades and releases
      const activeTrades = updated.filter(t => ['pending', 'admin_pending'].includes(t.status) && String(t.fromUser?._id) === String(user?.id));
      const activeReleases = myReleases.filter(r => ['pending', 'admin_pending'].includes(r.status) && String(r.user) === String(user?.id));
      const totalActive = activeTrades.length + activeReleases.length;
      
      setLimitReached(totalActive >= 6);
      setPendingTradesCount(totalActive);
      
      // Show sexy success alert
      setAlert({
        type: 'success',
        title: decision === 'accept' ? 'Trade Accepted! ✅' : 'Trade Rejected! ❌',
        message: decision === 'accept' 
          ? 'Trade accepted! Awaiting admin approval.' 
          : 'Trade has been rejected.'
      });
    } catch (e) {
      // Show sexy error alert
      setAlert({
        type: 'error',
        title: 'Action Failed! ❌',
        message: 'Failed to process your response. Please try again.'
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, respond: false }));
    }
  }



  // Counter feature removed

  if (loading) {
    return (
      <div className="trade-loading">
        <div className="loading-container">
          <div className="loading-circle">
            <div className="loading-progress" style={{ transform: `rotate(${loadingProgress * 3.6}deg)` }}></div>
            <div className="loading-text">{loadingProgress}%</div>
          </div>
          <div className="loading-label">Loading Trade Center...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="trade-page">
      {toast && <div className="toast">{toast}</div>}
      <SexyAlert alert={alert} onClose={() => setAlert(null)} />
      <div className="trade-hero">
        <div className="hero-text">
          <h1 className="gradient-title"><FaExchangeAlt style={{ marginRight: 10 }} />Trade Center</h1>
          <p>Propose trades and finalize with admin approval.</p>
          <div className="usage-row">
            <span className="usage-badge usage-used"><FaExchangeAlt style={{ marginRight: 6 }} />Completed: {tradeUsage.tradesUsed}</span>
            <span className="usage-badge usage-left"><FaRetweet style={{ marginRight: 6 }} />Remaining: {Math.max(0, 6 - tradeUsage.tradesUsed)}</span>
            <span className="usage-badge usage-pending"><FaClock style={{ marginRight: 6 }} />Pending: {pendingTradesCount}</span>
            {pendingTradesCount >= 6 && (<span className="usage-cap">You have reached your 4 pending requests limit (trades + releases).</span>)}
            {tradeUsage.tradesUsed >= 6 && (<span className="usage-cap">You have used all 4 trades.</span>)}
          </div>
        </div>
        
      </div>

      <div className="trade-propose">
        <div className="card glass propose-card">
          <div className="card-header">
            <h3 className="card-title"><FaPaperPlane style={{ marginRight: 8 }} />Create Trade Inquiry</h3>
            <p className="card-subtitle">Pick one from your roster and one from a target team to propose a swap.</p>
          </div>
          <div className="grid">
            <div className="field-group">
              <label className="field-label">Your Player</label>
              <SexyDropdownLoader isLoading={dropdownLoading.myRoster} placeholder="Loading your roster..." dataLength={myRoster.length} dataType="roster" isStale={isDataStale('players') && myRoster.length === 0} onRefresh={() => refreshData('players')} loadingProgress={loadingProgress}>
                <select className="select" value={selectedMyPlayer} onChange={(e) => setSelectedMyPlayer(e.target.value)} disabled={isSelectingRelease}>
                  <option value="">Select player</option>
                  {myRoster.map(p => {
                    const meta = (allPlayers || []).find(ap => ap.id === p.id);
                    const typ = meta?.type ? ` - ${meta.type}` : '';
                    return (
                      <option key={p.id} value={p.id}>{p.name} ({p.role}){typ}</option>
                    );
                  })}
                </select>
              </SexyDropdownLoader>
            </div>
            <div className="field-group">
              <label className="field-label">Target Team</label>
              <SexyDropdownLoader isLoading={dropdownLoading.teams} placeholder="Loading teams..." dataLength={otherTeams.length} dataType="teams" isStale={isDataStale('teams') && otherTeams.length === 0} onRefresh={() => refreshData('teams')} loadingProgress={loadingProgress}>
                <select className="select" value={targetTeamId} onChange={(e) => setTargetTeamId(e.target.value)} disabled={isSelectingRelease}>
                  <option value="">Select team</option>
                  {otherTeams.map(t => (
                    <option key={t._id} value={t._id}>{t.teamName}</option>
                  ))}
                </select>
              </SexyDropdownLoader>
            </div>
            <div className="field-group">
              <label className="field-label">Target Player</label>
              <SexyDropdownLoader isLoading={dropdownLoading.targetRoster} placeholder="Loading target roster..." dataLength={targetRoster.length} dataType="targetRoster" isStale={isDataStale('players') && targetRoster.length === 0} onRefresh={() => refreshData('players')} loadingProgress={loadingProgress}>
                <select className="select" value={selectedTargetPlayer} onChange={(e) => setSelectedTargetPlayer(e.target.value)} disabled={!targetTeamId || isSelectingRelease}>
                  <option value="">Select player</option>
                  {targetRoster.map(p => {
                    const meta = (allPlayers || []).find(ap => ap.id === p.id);
                    const typ = meta?.type ? ` - ${meta.type}` : '';
                    return (
                      <option key={p.id} value={p.id}>{p.name} ({p.role}){typ}</option>
                    );
                  })}
                </select>
              </SexyDropdownLoader>
            </div>
            <div className="actions cta-row">
              <button 
                className="btn btn-info" 
                title="Send trade proposal" 
                onClick={proposeTrade} 
                disabled={limitReached || tradeUsage.tradesUsed >= 6 || loadingStates.propose || isSelectingRelease}
              >
                {loadingStates.propose ? (
                  <>
                    <div className="loading-spinner"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <FaPaperPlane style={{ marginRight: 8 }} />
                    {limitReached ? 'Pending Limit (4)' : isSelectingRelease ? 'Complete Release First' : 'Send Proposal'}
                  </>
                )}
              </button>

            </div>
          <div className="release-box">
            <label className="field-label">Request Release</label>
            <div className="release-row">
              <SexyDropdownLoader isLoading={dropdownLoading.myRoster} placeholder="Loading your roster..." dataLength={myRoster.length} dataType="roster" isStale={isDataStale('players') && myRoster.length === 0} onRefresh={() => refreshData('players')} loadingProgress={loadingProgress}>
                <select className="select" value={releasePlayerId} onChange={(e) => setReleasePlayerId(e.target.value)} disabled={isSelectingTrade}>
                  <option value="">Select player</option>
                  {myRoster.map(p => {
                    const meta = (allPlayers || []).find(ap => ap.id === p.id);
                    const typ = meta?.type ? ` - ${meta.type}` : '';
                    return (
                      <option key={p.id} value={p.id}>{p.name} ({p.role}){typ}</option>
                    );
                  })}
                </select>
              </SexyDropdownLoader>
              <button 
                className="btn btn-danger" 
                onClick={requestRelease} 
                disabled={loadingStates.release || isSelectingTrade}
              >
                {loadingStates.release ? (
                  <>
                    <div className="loading-spinner"></div>
                    Requesting...
                  </>
                ) : (
                  isSelectingTrade ? 'Complete Trade First' : 'Request Release'
                )}
              </button>
            </div>
          </div>
          </div>
          {(selectedMyPlayer || selectedTargetPlayer) && (
            <div className="preview-row">
              {(() => {
                const mine = (allPlayers || []).find(p => p.id === selectedMyPlayer);
                const theirs = (allPlayers || []).find(p => p.id === selectedTargetPlayer);
                const typeClass = (t) => t ? `type-badge ${String(t).toLowerCase()}` : 'type-badge';
                return (
                  <div className="chips">
                    <div className="player-chip">
                      <span className="name">{mine ? mine.name : 'Player'}</span>
                      {mine?.type && <span className={typeClass(mine.type)}>{mine.type}</span>}
                    </div>
                    <span className="chip-arrow">↔</span>
                    <div className="player-chip">
                      <span className="name">{theirs ? theirs.name : 'Target player'}</span>
                      {theirs?.type && <span className={typeClass(theirs.type)}>{theirs.type}</span>}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      <div className="trade-inbox">
        <div className="card glass">
          <h3><FaUsers style={{ marginRight: 8 }} />Your Trades</h3>
          <div className="trade-list">
            {trades.map(t => (
              <div key={t._id} className={`trade-item ${['completed','rejected','withdrawn'].includes(t.status) ? 'disabled' : ''}`}>
                <div className="meta">
                  <div className="line team-line">
                    <strong>From:</strong>
                    {(() => {
                      const tm = findTeamByName(t.fromUser?.teamName || '');
                      const img = tm?.teamImage ? `${API_ENDPOINTS}${tm.teamImage}` : '';
                      return (
                        <span className="team-pill">
                          {img ? (
                            <img className="team-avatar" src={img} alt={tm?.teamName || 'Team'} />
                          ) : (
                            <span className="team-initial">{(tm?.teamName || '?').substring(0,1).toUpperCase()}</span>
                          )}
                          <span className="team-name">{t.fromUser?.teamName}</span>
                        </span>
                      );
                    })()}
                  </div>
                  <div className="line team-line">
                    <strong>To:</strong>
                    {(() => {
                      const tm = findTeamByName(t.toUser?.teamName || '');
                      const img = tm?.teamImage ? `${API_ENDPOINTS}${tm.teamImage}` : '';
                      return (
                        <span className="team-pill">
                          {img ? (
                            <img className="team-avatar" src={img} alt={tm?.teamName || 'Team'} />
                          ) : (
                            <span className="team-initial">{(tm?.teamName || '?').substring(0,1).toUpperCase()}</span>
                          )}
                          <span className="team-name">{t.toUser?.teamName}</span>
                        </span>
                      );
                    })()}
                  </div>
                  <div className="line offer-line">
                    <strong>Offer:</strong>
                    <span className="offer-chip">
                      <span className="nm">{t.offeredPlayer?.name}</span>
                      {t.offeredPlayer?.type && <span className={`type-badge ${String(t.offeredPlayer.type).toLowerCase()}`}>{t.offeredPlayer.type}</span>}
                    </span>
                    <span className="chip-arrow">↔</span>
                    <span className="offer-chip">
                      <span className="nm">{t.requestedPlayer?.name}</span>
                      {t.requestedPlayer?.type && <span className={`type-badge ${String(t.requestedPlayer.type).toLowerCase()}`}>{t.requestedPlayer.type}</span>}
                    </span>
                  </div>
                  <div className={`status ${t.status}`}>{t.status}</div>
                </div>
                <div className="history">
                  {t.history?.map((h, idx) => (
                    <div key={idx} className="hline">
                      <span>{h.action}</span>
                      {h.message ? <span> — {h.message}</span> : null}
                    </div>
                  ))}
                </div>
                <div className="item-actions">
                  {user && isToMe(t) && t.status === 'pending' && (
                    <>
                      <button 
                        className="btn btn-success" 
                        disabled={loadingStates.respond}
                        onClick={() => respondTrade(t._id, 'accept')}
                      >
                        {loadingStates.respond ? (
                          <>
                            <div className="loading-spinner"></div>
                            Accepting...
                          </>
                        ) : (
                          <>
                            <FaCheck style={{ marginRight: 6 }} />
                            Accept
                          </>
                        )}
                      </button>
                      <button 
                        className="btn btn-danger" 
                        disabled={loadingStates.respond}
                        onClick={() => respondTrade(t._id, 'reject')}
                      >
                        {loadingStates.respond ? (
                          <>
                            <div className="loading-spinner"></div>
                            Rejecting...
                          </>
                        ) : (
                          <>
                            <FaTimes style={{ marginRight: 6 }} />
                            Reject
                          </>
                        )}
                      </button>
                    </>
                  )}
                  {user && isFromMe(t) && !['completed','rejected','withdrawn'].includes(t.status) && (
                    <button 
                      className="btn btn-withdraw" 
                      disabled={loadingStates.withdraw}
                      onClick={async () => {
                        setLoadingStates(prev => ({ ...prev, withdraw: true }));
                        try {
                          const r = await fetch(`${API_ENDPOINTS}/api/trades/${t._id}/withdraw`, { 
                            method: 'POST', 
                            headers: { 'Content-Type': 'application/json' }, 
                            body: JSON.stringify({ byUserId: user.id }) 
                          });
                          const j = await r.json();
                        const updated = trades.map(x => (x._id === t._id ? j : x));
                        setTrades(updated);
                        
                        // Update pending count including both trades and releases
                        const activeTrades = updated.filter(u => ['pending','admin_pending'].includes(u.status) && String(u.fromUser?._id) === String(user?.id));
                        const activeReleases = myReleases.filter(r => ['pending','admin_pending'].includes(r.status) && String(r.user) === String(user?.id));
                        const totalActive = activeTrades.length + activeReleases.length;
                        
                        setLimitReached(totalActive >= 6);
                        setPendingTradesCount(totalActive);
                          
                          // Show sexy success alert
                          setAlert({
                            type: 'success',
                            title: 'Trade Withdrawn! 🔄',
                            message: 'Trade has been successfully withdrawn.'
                          });
                        } catch (e) {
                          // Show sexy error alert
                          setAlert({
                            type: 'error',
                            title: 'Withdrawal Failed! ❌',
                            message: 'Failed to withdraw trade. Please try again.'
                          });
                        } finally {
                          setLoadingStates(prev => ({ ...prev, withdraw: false }));
                        }
                      }}
                    >
                      {loadingStates.withdraw ? (
                        <>
                          <div className="loading-spinner"></div>
                          Withdrawing...
                        </>
                      ) : (
                        'Withdraw'
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {trades.length === 0 && (
              <div className="empty-card">
                <div className="empty-icon">📊</div>
                <p>No trades yet. Kick things off with a cool proposal!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="release-inbox">
        <div className="card glass">
          <h3><FaUnlock style={{ marginRight: 8 }} />Release Requests</h3>
          <div className="release-list">
            {myReleases
              .filter(r => ['pending', 'admin_pending', 'withdrawn'].includes(r.status))
              .map(r => (
                <div key={r._id} className={`release-item ${['completed','rejected','withdrawn'].includes(r.status) ? 'disabled' : ''}`}>
                  <div className="meta">
                    <div className="line player-line">
                      <strong>Player:</strong>
                      <span className="player-chip">
                        <span className="nm">{r.player?.name}</span>
                        {r.player?.type && <span className={`type-badge ${String(r.player.type).toLowerCase()}`}>{r.player.type}</span>}
                      </span>
                    </div>
                    <div className="line status-line">
                      <strong>Status:</strong>
                      <span className={`status ${r.status}`}>
                        {r.status === 'withdrawn' && <span style={{ marginRight: 6 }}>↩️</span>}
                        {r.status}
                      </span>
                    </div>
                    {r.adminDecision && (
                      <div className="line admin-line">
                        <strong>Admin Note:</strong>
                        <span className="admin-note">{r.adminDecision.note || 'No note provided'}</span>
                      </div>
                    )}
                  </div>
                  <div className="history">
                    {r.history?.map((h, idx) => (
                      <div key={idx} className="hline">
                        <span>{h.action}</span>
                        {h.message ? <span> — {h.message}</span> : null}
                      </div>
                    ))}
                  </div>
                  <div className="item-actions">
                    {user && String(r.user) === String(user?.id) && ['pending', 'admin_pending'].includes(r.status) && (
                      <button 
                        className="btn btn-withdraw" 
                        disabled={loadingStates.withdraw}
                        onClick={async () => {
                          setLoadingStates(prev => ({ ...prev, withdraw: true }));
                          try {
                            const res = await fetch(`${API_ENDPOINTS}/api/releases/${r._id}/withdraw`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ byUserId: user.id })
                            });
                            
                            if (!res.ok) {
                              const err = await res.json().catch(() => ({}));
                              throw new Error(err.message || 'Failed to withdraw');
                            }
                            
                            const updatedRelease = await res.json();
                            
                            // Update the releases list
                            const updatedReleases = myReleases.map(rel => 
                              rel._id === r._id ? updatedRelease : rel
                            );
                            setMyReleases(updatedReleases);
                            
                            // Update pending count
                            const activeTrades = trades.filter(t => ['pending', 'admin_pending'].includes(t.status) && String(t.fromUser?._id) === String(user?.id));
                            const activeReleases = updatedReleases.filter(rel => ['pending', 'admin_pending'].includes(rel.status) && String(rel.user) === String(user?.id));
                            const totalActive = activeTrades.length + activeReleases.length;
                            
                            setLimitReached(totalActive >= 6);
                            setPendingTradesCount(totalActive);
                            
                            // Show sexy success alert
                            setAlert({
                              type: 'success',
                              title: 'Release Withdrawn! 🔄',
                              message: 'Release request has been successfully withdrawn.'
                            });
                          } catch (e) {
                            // Show sexy error alert
                            setAlert({
                              type: 'error',
                              title: 'Withdrawal Failed! ❌',
                              message: e.message || 'Failed to withdraw release request. Please try again.'
                            });
                          } finally {
                            setLoadingStates(prev => ({ ...prev, withdraw: false }));
                          }
                        }}
                      >
                        {loadingStates.withdraw ? (
                          <>
                            <div className="loading-spinner"></div>
                            Withdrawing...
                          </>
                        ) : (
                          'Withdraw Request'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            {myReleases.filter(r => ['pending', 'admin_pending', 'withdrawn'].includes(r.status)).length === 0 && (
              <div className="empty">No release requests</div>
            )}
          </div>
        </div>
      </div>

      <div className="release-history">
        <div className="card glass">
          <h3>My Release History</h3>
          <div className="release-list">
            {myReleases
              .filter(r => ['completed', 'rejected'].includes(r.status))
              .map(r => (
                <div key={r._id} className={`release-item ${r.status === 'rejected' ? 'rejected' : ''}`}>
                  <div className="release-info">
                    <span className="player-chip">
                      {r.player?.name}
                      {r.player?.type && (<span className={`type-badge ${String(r.player.type).toLowerCase()}`}>{r.player.type}</span>)}
                    </span>
                    <span className="status-label">
                      {r.status === 'completed' ? 'Released by admin' : 'Rejected by admin'}
                    </span>
                  </div>
                  <span className="release-icon" title={r.status === 'completed' ? 'Released' : 'Rejected'}>
                    {r.status === 'completed' ? <FaUnlock /> : <FaTimes />}
                  </span>
                  {r.status === 'rejected' && r.adminDecision?.note && (
                    <span className="rejection-note" title="Admin Note">
                      {r.adminDecision.note}
                    </span>
                  )}
                </div>
              ))}
            {myReleases.filter(r => ['completed', 'rejected'].includes(r.status)).length === 0 && (
              <div className="empty">No releases yet</div>
            )}
          </div>
        </div>
      </div>

            
    </div>
  );
}

export default TradeCenter;


