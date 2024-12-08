import React, { useState } from 'react';
import axios from 'axios';
import '../css/AddPlayer.css'; // Import CSS for styling

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
    form.append('basePriceUnit', basePriceUnit); // Ensure the unit matches backend
    form.append('overallScore', formData.score);
    form.append('style', formData.style); // Include batting style
    form.append('profilePicture', image); // Match Postman field name
  
    try {
      const response = await axios.post('http://localhost:3000/api/player', form, {
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
    <div className="add-player-container enhanced-ui">
      <h2 className="title">Add Player</h2>
      {message && <p className={`message ${message.includes('Failed') ? 'error' : ''}`}>{message}</p>}
      <form className="add-player-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="firstName"
          placeholder="First Name"
          value={formData.firstName}
          onChange={handleInputChange}
          required
        />
        <input
          type="text"
          name="lastName"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={handleInputChange}
          required
        />
        <select name="role" value={formData.role} onChange={handleInputChange} required>
          <option value="">Select Role</option>
          <option value="Batsman">Batsman</option>
          <option value="Bowler">Bowler</option>
          <option value="All-Rounder">All-Rounder</option>
          <option value="Bowling-All-Rounder">Bowling-All-Rounder</option>
          <option value="Batting-All-Rounder">Batting-All-Rounder</option>
          <option value="Wicket-Keeper">Wicket Keeper</option>
        </select>
        <select name="style" value={formData.style} onChange={handleInputChange} required>
          <option value="">Select Style</option>
          <option value="LHB">Left-Handed Bat (LHB)</option>
          <option value="RHB">Right-Handed Bat (RHB)</option>
        </select>
        <select name="playerType" value={formData.playerType} onChange={handleInputChange} required>
          <option value="">Select Type</option>
          <option value="Gold">Gold</option>
          <option value="Silver">Silver</option>
          <option value="Emerald">Emerald</option>
          <option value="Sapphire">Sapphire</option>
        </select>
        <input
          type="number"
          name="basePrice"
          placeholder="Base Price"
          value={formData.basePrice}
          onChange={handleInputChange}
          required
        />
        <input
          type="number"
          name="score"
          placeholder="Player Overall Score"
          value={formData.score}
          onChange={handleInputChange}
          required
        />
        <div className="file-input">
          <label htmlFor="image">Upload Image</label>
          <input type="file" id="image" onChange={handleImageChange} required />
        </div>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default AddPlayer;
