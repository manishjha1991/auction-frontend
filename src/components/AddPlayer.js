import React, { useState } from 'react';
import axios from 'axios';
import '../css/AddPlayer.css'; // Import CSS for styling
import { API_ENDPOINTS } from "../const";
const AddPlayer = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: '',
    style: '',
    basePrice: '',
    playerType: '',
    score: '',
  });
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const calculateBasePriceUnit = (basePrice) => {
      if (basePrice < 100000) return 'K'; // Use the unit "K" for Thousands
      if (basePrice < 10000000) return 'Lakh'; // Use the unit "Lakh" for Lakhs
      return 'CR'; // Use the unit "CR" for Crores
    };
  
    const basePriceUnit = calculateBasePriceUnit(Number(formData.basePrice));
  
    // Ensure role formatting matches backend expectations
    const roleMapping = {
      'All-Rounder': 'Allrounder',
      'Bowling-All-Rounder': 'BowlingAllrounder',
      'Batting-All-Rounder': 'BattingAllrounder',
    };
  
    const role = roleMapping[formData.role] || formData.role;
  
    const form = new FormData();
    form.append('name', `${formData.firstName} ${formData.lastName}`);
    form.append('type', formData.playerType);
    form.append('role', role); // Ensure the role matches backend
    form.append('basePrice', formData.basePrice);
    form.append('overallScore', formData.score);
    form.append('style', formData.style); // Include batting style
    form.append('profilePicture', image); // Match Postman field name
  
    try {
      const response = await axios.post(`${API_ENDPOINTS}/api/player`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(`Player added successfully: ${response.data.name}`);
      setFormData({
        firstName: '',
        lastName: '',
        role: '',
        style: '',
        basePrice: '',
        playerType: '',
        score: '',
      });
      setImage(null);
    } catch (error) {
      console.error('Error adding player:', error);
      setMessage(`Failed to add player. Please try again.${error}`);
    }
  };
  
  
  

  return (
    <div className="add-player-page">
      <div className="add-player-hero">
        <div>
          <p className="eyebrow">Admin Console</p>
          <h1>Onboard new CPL talent with confidence.</h1>
          <p className="hero-subtitle">
            Capture every detail—role, skillset, valuation, and profile imagery—in one seamless flow.
            The roster updates everywhere instantly.
          </p>
          <div className="hero-stats">
            <div>
              <strong>4+</strong>
              <span>Player tiers</span>
            </div>
            <div>
              <strong>15s</strong>
              <span>Average entry time</span>
            </div>
            <div>
              <strong>100%</strong>
              <span>Roster sync</span>
            </div>
          </div>
        </div>
        <div className="hero-card">
          <p className="eyebrow">Checklist</p>
          <h3>Consistency that scouts trust.</h3>
          <ul>
            <li>✅ Use official auction valuations</li>
            <li>✅ Match batting style with role</li>
            <li>✅ Square images (min 600px) preferred</li>
            <li>✅ Keep overall score 0-100</li>
          </ul>
        </div>
      </div>

      <div className="add-player-grid">
        <div className="form-card">
          <div className="form-header">
            <div>
              <p className="eyebrow">Player dossier</p>
              <h2>Profile Details</h2>
            </div>
            <span className="badge">Step 01</span>
          </div>

          {message && (
            <p className={`form-message ${message.includes('Failed') ? 'error' : 'success'}`}>
              {message}
            </p>
          )}

          <form className="add-player-form" onSubmit={handleSubmit}>
            <div className="input-row">
              <label>
                <span>First Name</span>
                <input
                  type="text"
                  name="firstName"
                  placeholder="Virat"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <label>
                <span>Last Name</span>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Kohli"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </label>
            </div>

            <div className="input-row">
              <label>
                <span>Primary Role</span>
                <select name="role" value={formData.role} onChange={handleInputChange} required>
                  <option value="">Select Role</option>
                  <option value="Batsman">Batsman</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All-Rounder">All-Rounder</option>
                  <option value="WicketKeeper">Wicket Keeper</option>
                </select>
              </label>
              <label>
                <span>Batting Style</span>
                <select name="style" value={formData.style} onChange={handleInputChange} required>
                  <option value="">Select Style</option>
                  <option value="LHB">Left-Handed Bat (LHB)</option>
                  <option value="RHB">Right-Handed Bat (RHB)</option>
                </select>
              </label>
            </div>

            <div className="input-row">
              <label>
                <span>Player Tier</span>
                <select
                  name="playerType"
                  value={formData.playerType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Gold">Gold</option>
                  <option value="Silver">Silver</option>
                  <option value="Emerald">Emerald</option>
                  <option value="Sapphire">Sapphire</option>
                </select>
              </label>
              <label>
                <span>Base Price (₹)</span>
                <input
                  type="number"
                  name="basePrice"
                  placeholder="5000000"
                  value={formData.basePrice}
                  onChange={handleInputChange}
                  required
                />
              </label>
            </div>

            <label>
              <span>Overall Score</span>
              <input
                type="number"
                name="score"
                placeholder="0 - 100"
                value={formData.score}
                onChange={handleInputChange}
                required
              />
            </label>

            <label className="upload-label">
              <span>Profile Image</span>
              <div className="upload-dropzone">
                <p>Drag & drop or click to upload</p>
                <small>Accepts JPG, PNG. Max 5 MB.</small>
                <input type="file" id="image" onChange={handleImageChange} />
              </div>
            </label>

            <button type="submit" className="auth-primary-btn">
              Submit Player
            </button>
          </form>
        </div>

        <div className="info-card">
          <h3>Why it matters</h3>
          <p>
            Accurate player records power live bidding, scoreboard overlays, team analytics, and more.
            Keep data sharp for a seamless auction experience.
          </p>
          <h4>Quick tips</h4>
          <ul>
            <li>Use camelCase for Batting vs Bowling all-rounders.</li>
            <li>Record left/right batting preference correctly.</li>
            <li>Higher tiers demand ≥ ₹1 Cr base price.</li>
            <li>Score reflects fitness + form (0-100).</li>
          </ul>
          <div className="info-footnote">
            Need bulk uploads? Reach out to the data ops team for CSV templates.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPlayer;
