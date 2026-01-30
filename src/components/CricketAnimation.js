// components/CricketAnimation.js
import React from "react";
import Lottie from "react-lottie-player";

const CricketAnimation = ({ animationFile = "Profile.json" }) => {
  const animationData = require(`./animations/${animationFile}`); // Dynamically load JSON file

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f8f9fa" }}>
      <Lottie
        loop
        animationData={animationData}
        play
        style={{ width: 300, height: 300 }}
      />
    </div>
  );
};

export default CricketAnimation;
