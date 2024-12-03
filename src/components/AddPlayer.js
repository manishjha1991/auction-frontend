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
    const form = new FormData();
    form.append('firstName', formData.firstName);
    form.append('lastName', formData.lastName);
    form.append('role', formData.role);
    form.append('style', formData.style); // Add style value
    form.append('basePrice', formData.basePrice);
    form.append('playerType', formData.playerType);
    form.append('image', image);

    try {
      const response = await axios.post('https://backend.cpl.in.net/api/players', form, {
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
      });
      setImage(null);
    } catch (error) {
      console.error('Error adding player:', error);
      setMessage('Failed to add player. Please try again.');
    }
  };

  return (
    <div className="add-player-container">
      <h2 className="title">Add Player</h2>
      {message && <p className="message">{message}</p>}
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
        {/* New Style Dropdown */}
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
