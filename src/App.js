import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import PlayerList from './components/PlayerList';
import Profile from './components/Profile';
import Login from './components/Login';
import Signup from './components/Signup'; // Import Signup component
import AddPlayer from './components/AddPlayer'; // Import AddPlayer component
import './App.css'; // Import CSS for styling

function App() {
  const [user, setUser] = useState(null); // State to hold user info
  const [isAuthenticated, setIsAuthenticated] = useState(false); // User authentication state
  const [loading, setLoading] = useState(true); // Loading state to prevent flicker
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State to manage sidebar visibility

  useEffect(() => {
    // Check cached authentication status
    const cachedAuth = localStorage.getItem('isLoggedIn') === 'true';
    const cachedUser = localStorage.getItem('user');

    if (cachedAuth && cachedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(cachedUser)); // Parse and set the cached user
    } else {
      setIsAuthenticated(false);
    }

    setLoading(false); // End loading state
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
    setIsSidebarOpen(!isSidebarOpen); // Toggle sidebar visibility
  };

  // Protects private routes from unauthenticated access
  const PrivateRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  if (loading) {
    // Display a loading spinner or message while checking authentication
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
              <h1>Dashboard</h1>
              <p>Welcome, {user?.name || 'User'}!</p>
              <ul className="menu">
                <li><Link to="/players">Players</Link></li>
                <li><Link to="/profile">Profile</Link></li>
                {user?.isAdmin && <li><Link to="/add-player">Add Player</Link></li>}
                <li>
                  <button onClick={handleLogout}>Logout</button>
                </li>
              </ul>
            </nav>
          </>
        )}

        <main className="content">
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/signup" element={<Signup />} /> {/* Signup Route */}
            <Route
              path="/"
              element={<PrivateRoute><Navigate to="/profile" /></PrivateRoute>}
            />
            <Route
              path="/players"
              element={<PrivateRoute><PlayerList /></PrivateRoute>}
            />
            <Route
              path="/profile"
              element={<PrivateRoute><Profile /></PrivateRoute>}
            />
            <Route
              path="/add-player"
              element={<PrivateRoute><AddPlayer /></PrivateRoute>}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
