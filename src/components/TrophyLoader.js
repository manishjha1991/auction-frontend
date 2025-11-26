import React from 'react';
import '../css/TrophyLoader.css';

const TrophyLoader = ({ message = 'Syncing live squads…' }) => {
  const trophyImage = `${process.env.PUBLIC_URL}/images/Trophy.png`;
  return (
    <div
      className="trophy-loader"
      style={{
        backgroundImage: `radial-gradient(circle at top, rgba(15, 27, 70, 0.85), rgba(4, 9, 23, 0.95)), url(${trophyImage})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: 'contain',
      }}
    >
      <div className="trophy-loader-content">
        <h2 className="trophy-loader-title">CPL LIVE ROOM</h2>
        <p className="trophy-loader-subtitle">{message}</p>
        <div className="trophy-loader-ring" />
      </div>
    </div>
  );
};

export default TrophyLoader;

