import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import PlayerList from './components/PlayerList';
import Profile from './components/Profile';
import Login from './components/Login';
import Signup from './components/Signup';
import AddPlayer from './components/AddPlayer';
import UserPursePage from './components/UserPurse';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
                <h1>Dashboard</h1>
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
                <li><Link to="/user-purses" onClick={toggleSidebar}>User Purses</Link></li>
                <li>
                  <button className="logout-btn" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </ul>
            </nav>
          </>
        )}

        <main className="content">
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<PrivateRoute><Navigate to="/profile" /></PrivateRoute>} />
            <Route path="/players" element={<PrivateRoute><PlayerList /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/add-player" element={<PrivateRoute><AddPlayer /></PrivateRoute>} />
            <Route path="/user-purses" element={<PrivateRoute><UserPursePage /></PrivateRoute>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
