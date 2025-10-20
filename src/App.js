import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
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
import NewsAlerts from './components/NewsAlerts';
import TradeCenter from './components/TradeCenter';
import UnsoldPlayers from './components/UnsoldPlayers';
import AdminSettings from './components/AdminSettings';
import { API_ENDPOINTS } from './const';
import { FaChartPie, FaBullhorn, FaExchangeAlt, FaBoxOpen, FaTrophy } from 'react-icons/fa';
import AdminTrades from './components/AdminTrades';
import MatchScheduler from './components/MatchScheduler';
import GlobalNotification from './components/GlobalNotification';
import TeamDirectory from './components/TeamDirectory';
import AdminUserManagement from './components/AdminUserManagement';
import AdminRetainedPlayers from './components/AdminRetainedPlayers';
import AdminTeamLocks from './components/AdminTeamLocks';
import TournamentList from './components/TournamentList';
import TrophyHall from './components/TrophyHall';
import AdminMatchResults from './components/AdminMatchResults';
// AdminDashboard removed - performance dashboard disabled

import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [appSettings, setAppSettings] = useState({ enableTradeCenter: true, enableUnsoldPlayers: true });

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
        if (typeof j.enableTradeCenter === 'boolean') setAppSettings({ enableTradeCenter: j.enableTradeCenter, enableUnsoldPlayers: j.enableUnsoldPlayers });
      } catch {}
    }
    fetchSettings();
    const handler = () => fetchSettings();
    window.addEventListener('settings-updated', handler);
    return () => window.removeEventListener('settings-updated', handler);
  }, []);

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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const PrivateRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  const getContentClass = () => {
    const location = window.location.pathname;
    if (location === '/login' || location === '/signup') {
      return 'content no-sidebar';
    }
    return `content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`;
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="dashboard-container">
        {isAuthenticated && (
          <>
            <button className="hamburger" onClick={toggleSidebar}>
              ☰
            </button>
            <nav className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
              <div className="sidebar-header">
                <button className="close-btn" onClick={toggleSidebar}>
                  ✖
                </button>
              </div>
              <div className="welcome-message">
                <p>
                  <span className="wave">👋</span> Welcome,
                  <span className="user-name"> {user?.name || 'User'}!</span>
                </p>
              </div>
              <ul className="menu">
                <li><Link to="/players" onClick={toggleSidebar}>Players</Link></li>
                <li><Link to="/profile" onClick={toggleSidebar}>Profile</Link></li>
                {user?.isAdmin && <li><Link to="/add-player" onClick={toggleSidebar}>Add Player</Link></li>}
                
                <li><Link to="/user-purses" onClick={toggleSidebar}>Teams</Link></li>
                <li><Link to="/points-table" onClick={toggleSidebar}>Points Table</Link></li>
                <li><Link to="/player-stats" onClick={toggleSidebar}>Player Stats</Link></li>
                <li><Link to="/fixtures" onClick={toggleSidebar}>Fixtures</Link></li>
                <li><Link to="/match-scheduler" onClick={toggleSidebar}>🏏 Match Scheduler</Link></li>
                <li><Link to="/team-directory" onClick={toggleSidebar}>👥 Team Directory</Link></li>
                <li><Link to="/tournaments" onClick={toggleSidebar}>🏆 Tournaments</Link></li>
                <li><Link to="/trophy-hall" onClick={toggleSidebar}>🏆 Trophy Hall</Link></li>
                {user && user.isAdmin && (
                  <li><Link to="/admin-match-results" onClick={toggleSidebar}>📊 Match Results</Link></li>
                )}
                <li><Link to="/sold-playerslist" onClick={toggleSidebar}>Sold Player List</Link></li>
                
                {/* NEW: Link to Stats Overview */}
                <li>
                  <Link to="/stats-overview" onClick={toggleSidebar}>
                    <FaChartPie /> <span>Stats Overview</span>
                  </Link>
                </li>
                <li>
                  <Link to="/news" onClick={toggleSidebar}>
                    <FaBullhorn /> <span>News Alerts</span>
                  </Link>
                </li>
                {appSettings.enableTradeCenter && (
                  <li>
                    <Link to="/trade" onClick={toggleSidebar}>
                      <FaExchangeAlt /> <span>Trade Center</span>
                    </Link>
                  </li>
                )}
                {appSettings.enableUnsoldPlayers && (
                  <li>
                    <Link to="/unsold" onClick={toggleSidebar}>
                      <FaBoxOpen /> <span>Unsold Players</span>
                    </Link>
                  </li>
                )}
                {/* Performance Dashboard removed */}
                {user?.isAdmin && <li><Link to="/admin/trades" onClick={toggleSidebar}>Admin Trades</Link></li>}
                {user?.isAdmin && <li><Link to="/admin/user-management" onClick={toggleSidebar}>👑 User Management</Link></li>}
                {user?.isAdmin && <li><Link to="/admin/retained-players" onClick={toggleSidebar}>💎 Retained Players</Link></li>}
                {user?.isAdmin && <li><Link to="/admin/team-locks" onClick={toggleSidebar}>🔒 Retention Locks</Link></li>}
                {user?.isAdmin && <li><Link to="/admin/settings" onClick={toggleSidebar}>Admin Settings</Link></li>}

                <li>
                  <button className="logout-btn" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </ul>
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
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/add-player" element={<PrivateRoute><AddPlayer /></PrivateRoute>} />
            <Route path="/user-purses" element={<PrivateRoute><UserPursePage /></PrivateRoute>} />
            <Route path="/points-table" element={<PrivateRoute><PointTable /></PrivateRoute>} />
            <Route path="/sold-playerslist" element={<PrivateRoute><SoldPlayersList /></PrivateRoute>} />
            <Route path="/fixtures" element={<PrivateRoute><Fixtures user={user} /></PrivateRoute>} />
            <Route path="/match-scheduler" element={<PrivateRoute><MatchScheduler /></PrivateRoute>} />
            <Route path="/team-directory" element={<PrivateRoute><TeamDirectory /></PrivateRoute>} />
            <Route path="/tournaments" element={<PrivateRoute><TournamentList /></PrivateRoute>} />
            <Route path="/trophy-hall" element={<PrivateRoute><TrophyHall /></PrivateRoute>} />
            <Route path="/admin-match-results" element={<PrivateRoute><AdminMatchResults /></PrivateRoute>} />
            <Route path="/player-stats" element={<PrivateRoute><PlayerStatsList /></PrivateRoute>} />
            

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
                  {appSettings.enableTradeCenter ? <TradeCenter /> : <Navigate to="/profile" />}
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
              path="/admin/trades"
              element={
                <PrivateRoute>
                  <AdminTrades />
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
  );
}

export default App;
