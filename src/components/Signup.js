import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import navigation hooks
import axios from 'axios';
import '../css/Signup.css'; // Import CSS for styling

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
  const navigate = useNavigate(); // Hook for navigation

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
      const response = await axios.post('https://backend.cpl.in.net/api/users/signup', formData);
      setMessage('Signup successful! Redirecting to login...');
      setError('');
      setTimeout(() => {
        navigate('/login'); // Redirect to login page after 2 seconds
      }, 2000); // Delay for user to see the success message
    } catch (err) {
      setError(err.response?.data?.message || 'Error signing up');
    }
  };

  return (
    <div className="signup-container">
      <h2>Create Your Account</h2>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit} className="signup-form">
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleInputChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleInputChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleInputChange}
          required
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          required
        />
        <input
          type="text"
          name="teamName"
          placeholder="Team Name"
          value={formData.teamName}
          onChange={handleInputChange}
          required
        />
        <input
          type="text"
          name="playStationId"
          placeholder="PlayStation ID"
          value={formData.playStationId}
          onChange={handleInputChange}
          required
        />
        <button type="submit" className="signup-button">Sign Up</button>
      </form>
      <div className="login-redirect">
        <p>Already have an account?</p>
        <Link to="/login" className="login-link">Go to Login</Link>
      </div>
    </div>
  );
};

export default Signup;
