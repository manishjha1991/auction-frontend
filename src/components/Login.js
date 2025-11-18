import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../css/Auth.css';
import { API_ENDPOINTS } from "../const";

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // State for loading spinner
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Start loading spinner

    try {
      const response = await axios.post(`${API_ENDPOINTS}/api/users/login`, credentials);
      const userData = response.data;

      // Set logged-in state in cache
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user', JSON.stringify(userData));

      // Trigger onLogin with user data
      onLogin(userData);

      // Redirect to Profile page
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials!');
    } finally {
      setLoading(false); // Stop loading spinner
    }
  };

  return (
    <div className="auth-page auth-login">
      <div className="auth-background">
        <span className="orb orb-one" />
        <span className="orb orb-two" />
        <span className="orb orb-three" />
      </div>

      <div className="auth-content">
        <div className="auth-illustration">
          <p className="eyebrow">CPL Auction Hub</p>
          <h1>Welcome back to the arena.</h1>
          <p className="subtitle">
            Manage squads, track purses, and make your next championship-defining move.
          </p>
          <ul className="feature-list">
            <li>⚡ Real-time bidding updates</li>
            <li>📊 Smart insights & player stats</li>
            <li>📱 Optimised for every screen</li>
          </ul>
        </div>

        <div className="auth-card">
          <div className="auth-card-heading">
            <img
              src="images/cricket_trophy_CPL.jpg"
              alt="Cricket Trophy"
              className="auth-logo"
            />
            <div>
              <p className="eyebrow">Sign in</p>
              <h2>Welcome Back</h2>
            </div>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              <span>Email</span>
              <input
                type="email"
                name="email"
                placeholder="captain@cpl.com"
                value={credentials.email}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={credentials.password}
                onChange={handleChange}
                required
              />
            </label>

            <button type="submit" className="auth-primary-btn" disabled={loading}>
              {loading ? 'Signing you in…' : 'Login'}
            </button>
          </form>

          <div className="auth-footer">
            <p>New to CPL?</p>
            <Link to="/signup">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
