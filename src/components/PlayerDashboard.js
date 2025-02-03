import React from "react";
import "../css/PlayerDashboard.css";

const PlayerDashboard = () => {
  const bowlers = [
    {
      id: 1,
      name: "Harshal Patel",
      team: "RCB",
      matches: 15,
      innings: 15,
      wickets: 32,
      teamLogo:
        "https://upload.wikimedia.org/wikipedia/en/thumb/f/f1/Royal_Challengers_Bangalore_Logo.svg/1200px-Royal_Challengers_Bangalore_Logo.svg.png",
    },
    {
      id: 2,
      name: "Avesh Khan",
      team: "DC",
      matches: 16,
      innings: 16,
      wickets: 24,
      teamLogo:
        "https://upload.wikimedia.org/wikipedia/en/thumb/d/da/Delhi_Capitals_Logo.svg/1200px-Delhi_Capitals_Logo.svg.png",
    },
    {
      id: 3,
      name: "Jasprit Bumrah",
      team: "MI",
      matches: 14,
      innings: 14,
      wickets: 21,
      teamLogo:
        "https://upload.wikimedia.org/wikipedia/en/thumb/7/7e/Mumbai_Indians_Logo.svg/1200px-Mumbai_Indians_Logo.svg.png",
    },
  ];

  return (
    <div className="bowler-leaderboard">
      <table>
        <thead>
          <tr>
            <th>POS</th>
            <th>PLAYER</th>
            <th>MAT</th>
            <th>INN</th>
            <th>WKTS</th>
          </tr>
        </thead>
        <tbody>
          {bowlers.map((bowler, index) => (
            <tr key={bowler.id} className={index === 0 ? "highlighted-row" : ""}>
              <td>{index + 1}</td>
              <td className="player-info">
                <div className="player-details">
                  <span className="player-name">{bowler.name}</span>
                  <img
                    src={bowler.teamLogo}
                    alt={`${bowler.team} logo`}
                    className="team-logo"
                  />
                </div>
              </td>
              <td>{bowler.matches}</td>
              <td>{bowler.innings}</td>
              <td>{bowler.wickets}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PlayerDashboard;
