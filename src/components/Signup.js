import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../css/Auth.css';
import { API_ENDPOINTS } from "../const";

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    teamName: '',
    playStationId: '',
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await axios.post(`${API_ENDPOINTS}/api/users/signup`, formData);
      setMessage('Signup successful! Redirecting to login...');
      setError('');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error signing up');
    }
  };

  return (
    <div className="auth-page auth-signup">
      <div className="auth-background">
        <span className="orb orb-one" />
        <span className="orb orb-two" />
        <span className="orb orb-three" />
      </div>

      <div className="auth-content">
        <div className="auth-illustration">
          <p className="eyebrow">Draft your legacy</p>
          <h1>Create your CPL command center.</h1>
          <p className="subtitle">
            Launch your franchise, manage budgets, scout talent, and stay connected with every
            trade—all in one immersive dashboard.
          </p>
          <div className="stat-grid">
            <div>
              <strong>50+</strong>
              <span>Active managers</span>
            </div>
            <div>
              <strong>500+</strong>
              <span>Players tracked</span>
            </div>
            <div>
              <strong>24/7</strong>
              <span>Live sync</span>
            </div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card-heading">
            <div>
              <p className="eyebrow">Get started</p>
              <h2>Create Account</h2>
            </div>
            <span className="badge">Free • Secure • Instant</span>
          </div>

          {message && <p className="auth-success">{message}</p>}
          {error && <p className="auth-error">{error}</p>}

          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              <span>Full Name</span>
              <input
                type="text"
                name="name"
                placeholder="MS Dhoni"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
              <span>Email</span>
              <input
                type="email"
                name="email"
                placeholder="thala@cpl.com"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </label>
            <div className="input-row">
              <label>
                <span>Password</span>
                <input
                  type="password"
                  name="password"
                  placeholder="Create password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <label>
                <span>Confirm Password</span>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Repeat password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </label>
            </div>
            <label>
              <span>Team Name</span>
              <input
                type="text"
                name="teamName"
                placeholder="Chennai Legends"
                value={formData.teamName}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
              <span>PlayStation ID</span>
              <input
                type="text"
                name="playStationId"
                placeholder="PSN / Gamer Tag"
                value={formData.playStationId}
                onChange={handleInputChange}
                required
              />
            </label>

            <button type="submit" className="auth-primary-btn">
              {message ? 'Redirecting…' : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already part of CPL?</p>
            <Link to="/login">Login instead</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
