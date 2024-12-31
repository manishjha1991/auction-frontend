import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../css/Login.css'; // Import CSS for styling
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
    <div className="login-container">
      <img 
        src="images/cricket_trophy_CPL.jpg" 
        alt="Cricket Trophy" 
        className="trophy-image" 
      />
      <h2>Welcome Back!</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={credentials.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={credentials.password}
          onChange={handleChange}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Login'}
        </button>
      </form>
      {loading && <div className="loading-spinner"></div>}
      <p className="signup-redirect">
        Don't have an account? <Link to="/signup">Sign up here</Link>
      </p>
    </div>
  );
};

export default Login;
