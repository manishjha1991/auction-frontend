import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import PlayerList from './components/PlayerList';
import Profile from './components/Profile';
import Login from './components/Login';
import Signup from './components/Signup';
import AddPlayer from './components/AddPlayer';
import UserPursePage from './components/UserPurse';
import SoldPlayersList from "./components/SoldPlayersList";
import Fixtures from './components/Fixtures';
import PointTable from './components/PointTable';
import PlayerStatsList from './components/PlayerStatsList';
import StatsOverview from './components/StatsOverview'; // <-- import your new component
import TopRankingsPage from './components/TopRankingsPage';
import VenueExplorerPage from './components/VenueExplorerPage';
import PlayerInsightsPage from './components/PlayerInsightsPage';
import NewsAlerts from './components/NewsAlerts';
import TradeCenter from './components/TradeCenter';
import UnsoldPlayers from './components/UnsoldPlayers';
import AdminSettings from './components/AdminSettings';
import { API_ENDPOINTS } from './const';
import { 
  FaChartPie, FaBullhorn, FaExchangeAlt, FaBoxOpen, FaTrophy, FaMedal,
  FaUsers, FaUser, FaPlus, FaDollarSign, FaTable, FaChartBar, FaLightbulb,
  FaCalendarAlt, FaImage, FaUsersCog, FaCrown, FaBalanceScale, FaGem, FaLock,
  FaCog, FaSignOutAlt, FaFire, FaHome, FaSearch, FaTimes, FaBook,
  FaCalculator, FaCloudRain, FaHistory, FaWrench, FaChartLine, FaAddressCard, FaBullseye,
  FaMapMarkedAlt, FaCheckCircle
} from 'react-icons/fa';
import AdminTrades from './components/AdminTrades';
import MatchScheduler from './components/MatchScheduler';
import GlobalNotification from './components/GlobalNotification';
import TeamDirectory from './components/TeamDirectory';
import TeamSquadsShowcase from './components/TeamSquadsShowcase';
import AdminUserManagement from './components/AdminUserManagement';
import AdminRetainedPlayers from './components/AdminRetainedPlayers';
import AdminTeamLocks from './components/AdminTeamLocks';
import AdminFairnessManagement from './components/AdminFairnessManagement';
import AdminQueueMonitor from './components/AdminQueueMonitor';
import AdminPurseAudit from './components/AdminPurseAudit';
import TournamentList from './components/TournamentList';
import TrophyHall from './components/TrophyHall';
import AdminMatchResults from './components/AdminMatchResults';
import AdminTradeActivity from './components/AdminTradeActivity';
import OcrExtractor from './components/OcrExtractor';
import FixtureOcr from './components/FixtureOcr';
import AdminFixtureApprovals from './components/AdminFixtureApprovals';
import LiveBiddingDashboard from './components/LiveBiddingDashboard';
import MyBids from './components/MyBids';
import MyAuctionHub from './components/MyAuctionHub';
import PositionCalculator from './components/PositionCalculator';
import RulesBook from './components/RulesBook';
import DLSCalculator from './components/DLSCalculator';
import CplHistorySummary from './components/CplHistorySummary';
import CplCompositeReport from './components/CplCompositeReport';
import CplPlayerCareerStats from './components/CplPlayerCareerStats';
import AdminRosterTools from './components/AdminRosterTools';
import AuctionTimeline from './components/AuctionTimeline';

// AdminDashboard removed - performance dashboard disabled

import './App.css';
import { SocketProvider } from './contexts/SocketContext';
import { ToastProvider } from './components/ToastNotification';

const CONSISTENCY_BADGE_KEY = 'adminConsistencyBadgeCount';
const CONSISTENCY_BADGE_UPDATED_EVENT = 'consistency-check-updated';

// Helper component for menu items with search filtering
const MenuItem = ({ to, icon: Icon, children, onClick, searchQuery, location }) => {
  const isActive = location.pathname === to;
  const isVisible = !searchQuery || children.toLowerCase().includes(searchQuery.toLowerCase());
  
  if (!isVisible) return null;
  
  return (
    <li>
      <Link 
        to={to} 
        onClick={onClick} 
        className={`menu-item ${isActive ? 'active' : ''}`}
      >
        {Icon && <Icon className="menu-icon" />}
        <span>{children}</span>
      </Link>
    </li>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [appSettings, setAppSettings] = useState({ enableTradeCenter: true, enableUnsoldPlayers: true, worldCupMode: false });
  const [consistencyBadgeCount, setConsistencyBadgeCount] = useState(0);

  useEffect(() => {
    const cachedAuth = localStorage.getItem('isLoggedIn') === 'true';
    const cachedUser = localStorage.getItem('user');

    if (cachedAuth && cachedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(cachedUser));
    } else {
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch(`${API_ENDPOINTS}/api/settings`);
        const j = await res.json();
        if (typeof j.enableTradeCenter === 'boolean') {
          setAppSettings({ 
            enableTradeCenter: j.enableTradeCenter, 
            enableUnsoldPlayers: j.enableUnsoldPlayers,
            worldCupMode: j.worldCupMode || false
          });
        }
      } catch {}
    }
    fetchSettings();
    const handler = () => fetchSettings();
    window.addEventListener('settings-updated', handler);
    return () => window.removeEventListener('settings-updated', handler);
  }, []);

  useEffect(() => {
    if (!user?.isAdmin) {
      setConsistencyBadgeCount(0);
      return;
    }

    const refreshConsistencyBadge = () => {
      try {
        const raw = window.localStorage.getItem(CONSISTENCY_BADGE_KEY);
        const parsed = Number(raw || 0);
        setConsistencyBadgeCount(Number.isFinite(parsed) && parsed > 0 ? parsed : 0);
      } catch {
        setConsistencyBadgeCount(0);
      }
    };

    refreshConsistencyBadge();

    const onConsistencyUpdated = (evt) => {
      const next = Number(evt?.detail?.totalIssues);
      if (Number.isFinite(next)) {
        setConsistencyBadgeCount(next > 0 ? next : 0);
        return;
      }
      refreshConsistencyBadge();
    };

    const onStorage = (evt) => {
      if (evt.key === CONSISTENCY_BADGE_KEY) refreshConsistencyBadge();
    };

    window.addEventListener(CONSISTENCY_BADGE_UPDATED_EVENT, onConsistencyUpdated);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CONSISTENCY_BADGE_UPDATED_EVENT, onConsistencyUpdated);
      window.removeEventListener('storage', onStorage);
    };
  }, [user?.isAdmin]);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
  };

  const handleToggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    if (newState) {
      document.body.classList.add('sidebar-open');
      setSearchQuery(''); // Clear search when opening
    } else {
      document.body.classList.remove('sidebar-open');
      setSearchQuery('');
    }
  };

  const toggleSidebar = handleToggleSidebar;

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    setSearchQuery('');
    // Remove body class for CSS-based hiding
    document.body.classList.remove('sidebar-open');
  };

  const PrivateRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  const getContentClass = () => {
    const location = window.location.pathname;
    if (location === '/login' || location === '/signup') {
      return 'content no-sidebar';
    }
    if (location === '/grounds') {
      return `content content-venue-atlas ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`;
    }
    return `content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`;
  };

  // Helper functions for menu filtering and active state
  const currentPath = window.location.pathname;
  const isActive = (path) => currentPath === path;
  const filterItem = (text) => !searchQuery || text.toLowerCase().includes(searchQuery.toLowerCase());

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <ToastProvider>
      <SocketProvider>
        <Router>
        <div className="dashboard-container">
        {isAuthenticated && (
          <>
            <button className={`hamburger ${isSidebarOpen ? 'active' : ''}`} onClick={toggleSidebar} aria-label="Toggle menu">
              <span></span>
              <span></span>
              <span></span>
            </button>
            <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={closeSidebar}></div>
            <nav className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
              <div className="sidebar-header">
                <div className="sidebar-header-content">
                  <div className="sidebar-logo">
                    <FaTrophy className="logo-icon" />
                    <span className="logo-text">{appSettings.worldCupMode ? 'World Cup' : 'CPL'}</span>
                  </div>
                  <button className="close-btn logout-header-btn" onClick={handleLogout} aria-label="Logout">
                    <FaSignOutAlt />
                  </button>
                </div>
              <div className="welcome-message">
                <p>
                  <span className="wave">👋</span> Welcome,
                  <span className="user-name"> {user?.name || 'User'}!</span>
                </p>
              </div>
                <div className="search-box">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search menu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="menu-search"
                  />
                </div>
              </div>
              
              <div className="menu-container">
                {/* Quick Actions */}
                <div className="menu-section">
                  <h3 className="menu-section-title">Quick Actions</h3>
              <ul className="menu">
                    {filterItem('Home') && (
                      <li>
                        <Link to="/profile" onClick={closeSidebar} className={`menu-item ${isActive('/profile') ? 'active' : ''}`}>
                          <FaHome className="menu-icon" />
                          <span>Home</span>
                        </Link>
                      </li>
                    )}
                    {filterItem('Live Bidding') && (
                      <li>
                        <Link to="/live-bidding" onClick={closeSidebar} className={`menu-item ${isActive('/live-bidding') ? 'active' : ''}`}>
                          <FaFire className="menu-icon fire-icon" />
                          <span>Live Bidding</span>
                        </Link>
                      </li>
                    )}
                    {filterItem('My Auction') && (
                      <li>
                        <Link to="/my-auction" onClick={closeSidebar} className={`menu-item ${isActive('/my-auction') ? 'active' : ''}`}>
                          <FaBullseye className="menu-icon" />
                          <span>My Auction HQ</span>
                        </Link>
                      </li>
                    )}
                    {filterItem('Players') && (
                      <li>
                        <Link to="/players" onClick={closeSidebar} className={`menu-item ${isActive('/players') ? 'active' : ''}`}>
                          <FaUsers className="menu-icon" />
                          <span>Players</span>
                        </Link>
                      </li>
                    )}
                    {user?.isAdmin && filterItem('Add Player') && (
                      <li>
                        <Link to="/add-player" onClick={closeSidebar} className={`menu-item ${isActive('/add-player') ? 'active' : ''}`}>
                          <FaPlus className="menu-icon" />
                          <span>Add Player</span>
                        </Link>
                      </li>
                    )}
                  </ul>
                </div>

                {/* Teams & Competition */}
                <div className="menu-section">
                  <h3 className="menu-section-title">Teams & Competition</h3>
                  <ul className="menu">
                    <li>
                      <Link to="/user-purses" onClick={closeSidebar} className={`menu-item ${isActive('/user-purses') ? 'active' : ''}`}>
                        <FaUsersCog className="menu-icon" />
                        <span>Teams</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/points-table" onClick={closeSidebar} className={`menu-item ${isActive('/points-table') ? 'active' : ''}`}>
                        <FaTable className="menu-icon" />
                        <span>Points Table</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/cpl-composite-report" onClick={closeSidebar} className={`menu-item ${isActive('/cpl-composite-report') ? 'active' : ''}`}>
                        <FaChartLine className="menu-icon" />
                        <span>Qualification overview</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/position-calculator" onClick={closeSidebar} className={`menu-item ${isActive('/position-calculator') ? 'active' : ''}`}>
                        <FaBook className="menu-icon" />
                        <span>Position Calculator</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/fixtures" onClick={closeSidebar} className={`menu-item ${isActive('/fixtures') ? 'active' : ''}`}>
                        <FaCalendarAlt className="menu-icon" />
                        <span>Fixtures</span>
                      </Link>
                    </li>
                    {filterItem('Confirm Match Results') && (
                      <li>
                        <Link to="/fixture-confirmations" onClick={closeSidebar} className={`menu-item ${isActive('/fixture-confirmations') || isActive('/admin/fixture-approvals') ? 'active' : ''}`}>
                          <FaCheckCircle className="menu-icon" />
                          <span>Confirm Match Results</span>
                        </Link>
                      </li>
                    )}
                    <li>
                      <Link to="/match-scheduler" onClick={closeSidebar} className={`menu-item ${isActive('/match-scheduler') ? 'active' : ''}`}>
                        <FaCalendarAlt className="menu-icon" />
                        <span>Match Scheduler</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/tournaments" onClick={closeSidebar} className={`menu-item ${isActive('/tournaments') ? 'active' : ''}`}>
                        <FaTrophy className="menu-icon" />
                        <span>Tournaments</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/trophy-hall" onClick={closeSidebar} className={`menu-item ${isActive('/trophy-hall') ? 'active' : ''}`}>
                        <FaTrophy className="menu-icon" />
                        <span>Trophy Hall</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/cpl-history" onClick={closeSidebar} className={`menu-item ${isActive('/cpl-history') ? 'active' : ''}`}>
                        <FaHistory className="menu-icon" />
                        <span>CPL History</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/team-directory" onClick={closeSidebar} className={`menu-item ${isActive('/team-directory') ? 'active' : ''}`}>
                        <FaUsers className="menu-icon" />
                        <span>Team Directory</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/team-squads" onClick={closeSidebar} className={`menu-item ${isActive('/team-squads') ? 'active' : ''}`}>
                        <FaAddressCard className="menu-icon" />
                        <span>Team Squads</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/my-bids" onClick={closeSidebar} className={`menu-item ${isActive('/my-bids') ? 'active' : ''}`}>
                        <FaBook className="menu-icon" />
                        <span>My Bids</span>
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Statistics & Analytics */}
                <div className="menu-section">
                  <h3 className="menu-section-title">Statistics & Analytics</h3>
                  <ul className="menu">
                    <li>
                      <Link to="/stats-overview" onClick={closeSidebar} className={`menu-item ${isActive('/stats-overview') ? 'active' : ''}`}>
                        <FaChartPie className="menu-icon" />
                        <span>Stats Overview</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/rankings" onClick={closeSidebar} className={`menu-item ${isActive('/rankings') ? 'active' : ''}`}>
                        <FaMedal className="menu-icon" />
                        <span>Top Rankings</span>
                  </Link>
                </li>
                <li>
                      <Link to="/grounds" onClick={closeSidebar} className={`menu-item ${isActive('/grounds') ? 'active' : ''}`}>
                        <FaMapMarkedAlt className="menu-icon" />
                        <span>Ground atlas</span>
                  </Link>
                </li>
                <li>
                      <Link to="/player-stats" onClick={closeSidebar} className={`menu-item ${isActive('/player-stats') ? 'active' : ''}`}>
                        <FaChartBar className="menu-icon" />
                        <span>Player Stats</span>
                  </Link>
                </li>
                <li>
                      <Link to="/player-insights" onClick={closeSidebar} className={`menu-item ${isActive('/player-insights') ? 'active' : ''}`}>
                        <FaLightbulb className="menu-icon" />
                        <span>Player Insights</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/cpl-player-career-stats" onClick={closeSidebar} className={`menu-item ${isActive('/cpl-player-career-stats') ? 'active' : ''}`}>
                        <FaChartBar className="menu-icon" />
                        <span>CPL Player Career</span>
                      </Link>
                    </li>
                    {user && user.isAdmin && (
                      <li>
                        <Link to="/admin-match-results" onClick={closeSidebar} className={`menu-item ${isActive('/admin-match-results') ? 'active' : ''}`}>
                          <FaChartBar className="menu-icon" />
                          <span>Match Results</span>
                  </Link>
                </li>
                    )}
                  </ul>
                </div>

                {/* Market & Trading */}
                <div className="menu-section">
                  <h3 className="menu-section-title">Market & Trading</h3>
                  <ul className="menu">
                {appSettings.enableTradeCenter && (
                  <li>
                        <Link to="/trade" onClick={closeSidebar} className={`menu-item ${isActive('/trade') ? 'active' : ''}`}>
                          <FaExchangeAlt className="menu-icon" />
                          <span>Trade Center</span>
                    </Link>
                  </li>
                )}
                {appSettings.enableUnsoldPlayers && (
                  <li>
                        <Link to="/unsold" onClick={closeSidebar} className={`menu-item ${isActive('/unsold') ? 'active' : ''}`}>
                          <FaBoxOpen className="menu-icon" />
                          <span>Unsold Players</span>
                    </Link>
                  </li>
                )}
                    <li>
                      <Link to="/sold-playerslist" onClick={closeSidebar} className={`menu-item ${isActive('/sold-playerslist') ? 'active' : ''}`}>
                        <FaDollarSign className="menu-icon" />
                        <span>Sold Players</span>
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* News & Updates */}
                <div className="menu-section">
                  <h3 className="menu-section-title">News & Updates</h3>
                  <ul className="menu">
                    <li>
                      <Link to="/news" onClick={closeSidebar} className={`menu-item ${isActive('/news') ? 'active' : ''}`}>
                        <FaBullhorn className="menu-icon" />
                        <span>News Alerts</span>
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Tools */}
                <div className="menu-section">
                  <h3 className="menu-section-title">Tools</h3>
                  <ul className="menu">
                    <li>
                      <Link to="/ocr" onClick={closeSidebar} className={`menu-item ${isActive('/ocr') ? 'active' : ''}`}>
                        <FaImage className="menu-icon" />
                        <span>OCR Extractor</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/fixture-ocr" onClick={closeSidebar} className={`menu-item ${isActive('/fixture-ocr') ? 'active' : ''}`}>
                        <FaMedal className="menu-icon" />
                        <span>Fixture Result OCR</span>
                      </Link>
                    </li>
                    {filterItem('Confirm Match Results') && (
                      <li>
                        <Link to="/fixture-confirmations" onClick={closeSidebar} className={`menu-item ${isActive('/fixture-confirmations') || isActive('/admin/fixture-approvals') ? 'active' : ''}`}>
                          <FaCheckCircle className="menu-icon" />
                          <span>Confirm Match Results</span>
                        </Link>
                      </li>
                    )}
                    <li>
                      <Link to="/dls-calculator" onClick={closeSidebar} className={`menu-item ${isActive('/dls-calculator') ? 'active' : ''}`}>
                        <FaCalculator className="menu-icon" />
                        <span>Target Calculator</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/rules-book" onClick={closeSidebar} className={`menu-item ${isActive('/rules-book') ? 'active' : ''}`}>
                        <FaBook className="menu-icon" />
                        <span>Rules Book</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/auction-timeline" onClick={closeSidebar} className={`menu-item ${isActive('/auction-timeline') ? 'active' : ''}`}>
                        <FaCalendarAlt className="menu-icon" />
                        <span>Auction Timeline</span>
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Admin Section */}
                {user?.isAdmin && (
                  <div className="menu-section admin-section">
                    <h3 className="menu-section-title">
                      <FaCrown className="admin-crown" />
                      Admin Panel
                    </h3>
                    <ul className="menu">
                      {filterItem('Fixture Approvals') && (
                        <li>
                          <Link to="/fixture-confirmations" onClick={closeSidebar} className={`menu-item ${isActive('/fixture-confirmations') || isActive('/admin/fixture-approvals') ? 'active' : ''}`}>
                            <FaCheckCircle className="menu-icon" />
                            <span>Fixture Approvals</span>
                          </Link>
                        </li>
                      )}
                      <li>
                        <Link to="/admin/trades" onClick={closeSidebar} className={`menu-item ${isActive('/admin/trades') ? 'active' : ''}`}>
                          <FaExchangeAlt className="menu-icon" />
                          <span>Admin Trades</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/admin/roster-tools" onClick={closeSidebar} className={`menu-item ${isActive('/admin/roster-tools') ? 'active' : ''}`}>
                          <FaWrench className="menu-icon" />
                          <span>Roster tools</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/admin/trade-activity" onClick={closeSidebar} className={`menu-item ${isActive('/admin/trade-activity') ? 'active' : ''}`}>
                          <FaChartBar className="menu-icon" />
                          <span>Team Trade Activity</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/admin/user-management" onClick={closeSidebar} className={`menu-item ${isActive('/admin/user-management') ? 'active' : ''}`}>
                          <FaUsersCog className="menu-icon" />
                          <span>User Management</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/admin/fairness-management" onClick={closeSidebar} className={`menu-item ${isActive('/admin/fairness-management') ? 'active' : ''}`}>
                          <FaBalanceScale className="menu-icon" />
                          <span>Fairness Management</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/admin/retained-players" onClick={closeSidebar} className={`menu-item ${isActive('/admin/retained-players') ? 'active' : ''}`}>
                          <FaGem className="menu-icon" />
                          <span>Retained Players</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/admin/team-locks" onClick={closeSidebar} className={`menu-item ${isActive('/admin/team-locks') ? 'active' : ''}`}>
                          <FaLock className="menu-icon" />
                          <span>Retention Locks</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/admin/purse-audit" onClick={closeSidebar} className={`menu-item ${isActive('/admin/purse-audit') ? 'active' : ''}`}>
                          <FaDollarSign className="menu-icon" />
                          <span>Purse Audit Ledger</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/admin/queue-monitor" onClick={closeSidebar} className={`menu-item ${isActive('/admin/queue-monitor') ? 'active' : ''}`}>
                          <FaUsers className="menu-icon" />
                          <span>Queue Monitor</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/admin/settings" onClick={closeSidebar} className={`menu-item ${isActive('/admin/settings') ? 'active' : ''}`}>
                          <FaCog className="menu-icon" />
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            Admin Settings
                            {consistencyBadgeCount > 0 && (
                              <span
                                style={{
                                  minWidth: 18,
                                  height: 18,
                                  borderRadius: 9,
                                  background: '#dc2626',
                                  color: '#fff',
                                  fontSize: 11,
                                  lineHeight: '18px',
                                  textAlign: 'center',
                                  padding: '0 6px',
                                  fontWeight: 700,
                                }}
                              >
                                {consistencyBadgeCount > 99 ? '99+' : consistencyBadgeCount}
                              </span>
                            )}
                          </span>
                        </Link>
                      </li>
                    </ul>
                  </div>
                )}

              </div>
              
              {/* Logout - Outside scrollable area, always visible */}
              <div className="menu-footer">
                <button className="logout-btn" onClick={handleLogout}>
                  <FaSignOutAlt className="logout-icon" />
                  <span>Logout</span>
                </button>
              </div>
            </nav>
          </>
        )}
        
        <main className={getContentClass()}>
          {isAuthenticated && <GlobalNotification />}
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<PrivateRoute><Navigate to="/profile" /></PrivateRoute>} />
            <Route path="/players" element={<PrivateRoute><PlayerList /></PrivateRoute>} />
            <Route path="/live-bidding" element={<PrivateRoute><LiveBiddingDashboard /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/add-player" element={<PrivateRoute><AddPlayer /></PrivateRoute>} />
            <Route path="/user-purses" element={<PrivateRoute><UserPursePage /></PrivateRoute>} />
            <Route path="/points-table" element={<PrivateRoute><PointTable /></PrivateRoute>} />
            <Route path="/position-calculator" element={<PrivateRoute><PositionCalculator /></PrivateRoute>} />
            <Route path="/rules-book" element={<PrivateRoute><RulesBook /></PrivateRoute>} />
            <Route path="/sold-playerslist" element={<PrivateRoute><SoldPlayersList /></PrivateRoute>} />
            <Route path="/fixtures" element={<PrivateRoute><Fixtures user={user} /></PrivateRoute>} />
            <Route path="/match-scheduler" element={<PrivateRoute><MatchScheduler /></PrivateRoute>} />
            <Route path="/team-directory" element={<PrivateRoute><TeamDirectory /></PrivateRoute>} />
            <Route path="/team-squads" element={<PrivateRoute><TeamSquadsShowcase /></PrivateRoute>} />
            <Route path="/tournaments" element={<PrivateRoute><TournamentList /></PrivateRoute>} />
            <Route path="/trophy-hall" element={<PrivateRoute><TrophyHall /></PrivateRoute>} />
            <Route path="/cpl-history" element={<PrivateRoute><CplHistorySummary /></PrivateRoute>} />
            <Route path="/cpl-composite-report" element={<PrivateRoute><CplCompositeReport /></PrivateRoute>} />
            <Route path="/my-bids" element={<PrivateRoute><MyBids /></PrivateRoute>} />
            <Route path="/my-auction" element={<PrivateRoute><MyAuctionHub /></PrivateRoute>} />
            <Route path="/admin-match-results" element={<PrivateRoute><AdminMatchResults /></PrivateRoute>} />
            <Route path="/player-stats" element={<PrivateRoute><PlayerStatsList /></PrivateRoute>} />
            <Route path="/player-insights" element={<PrivateRoute><PlayerInsightsPage /></PrivateRoute>} />
            <Route path="/cpl-player-career-stats" element={<PrivateRoute><CplPlayerCareerStats /></PrivateRoute>} />
            <Route path="/ocr" element={<PrivateRoute><OcrExtractor /></PrivateRoute>} />
            <Route path="/fixture-ocr" element={<PrivateRoute><FixtureOcr /></PrivateRoute>} />
            <Route path="/dls-calculator" element={<PrivateRoute><DLSCalculator /></PrivateRoute>} />
            <Route path="/auction-timeline" element={<PrivateRoute><AuctionTimeline /></PrivateRoute>} />
            

            {/* NEW: StatsOverview Route */}
            <Route
              path="/stats-overview"
              element={
                <PrivateRoute>
                  <StatsOverview />
                </PrivateRoute>
              }
            />
            <Route
              path="/rankings"
              element={
                <PrivateRoute>
                  <TopRankingsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/grounds"
              element={
                <PrivateRoute>
                  <VenueExplorerPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/news"
              element={
                <PrivateRoute>
                  <NewsAlerts />
                </PrivateRoute>
              }
            />
            <Route
              path="/trade"
              element={
                <PrivateRoute>
                  {appSettings.enableTradeCenter ? <TradeCenter user={user} /> : <Navigate to="/profile" />}
                </PrivateRoute>
              }
            />
            <Route
              path="/unsold"
              element={
                <PrivateRoute>
                  {appSettings.enableUnsoldPlayers ? <UnsoldPlayers /> : <Navigate to="/profile" />}
                </PrivateRoute>
              }
            />
            <Route
              path="/fixture-confirmations"
              element={
                <PrivateRoute>
                  <AdminFixtureApprovals />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/fixture-approvals"
              element={
                <PrivateRoute>
                  <AdminFixtureApprovals />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/trades"
              element={
                <PrivateRoute>
                  <AdminTrades />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/roster-tools"
              element={
                <PrivateRoute>
                  <AdminRosterTools />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/trade-activity"
              element={
                <PrivateRoute>
                  <AdminTradeActivity />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/user-management"
              element={
                <PrivateRoute>
                  <AdminUserManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/fairness-management"
              element={
                <PrivateRoute>
                  <AdminFairnessManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/retained-players"
              element={
                <PrivateRoute>
                  <AdminRetainedPlayers />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/team-locks"
              element={
                <PrivateRoute>
                  <AdminTeamLocks />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/purse-audit"
              element={
                <PrivateRoute>
                  <AdminPurseAudit />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/queue-monitor"
              element={
                <PrivateRoute>
                  <AdminQueueMonitor />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <PrivateRoute>
                  <AdminSettings />
                </PrivateRoute>
              }
            />
            {/* Admin Dashboard route removed */}
            <Route
              path="/newsletter"
              element={
                <PrivateRoute>
                  <Navigate to="/news" />
                </PrivateRoute>
              }
            />
          </Routes>
        </main>
      </div>
      </Router>
      </SocketProvider>
    </ToastProvider>
  );
}

export default App;
