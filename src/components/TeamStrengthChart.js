import React, { useMemo } from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, Title);

const TeamStrengthChart = ({ players }) => {
  // Calculate team strength distribution by role.
  // Each player's overallScore is summed per role.
  const roleStrength = players.reduce((acc, player) => {
    const role = player.role || 'Unknown';
    acc[role] = (acc[role] || 0) + (player.overallScore || 0);
    return acc;
  }, {});

  // Calculate total overall team score across all players
  const totalTeamScore = players.reduce((sum, player) => sum + (player.overallScore || 0), 0);

  const labels = Object.keys(roleStrength);
  const dataValues = Object.values(roleStrength);

  // Define a static color palette
  const backgroundColors = [
    'rgba(255, 99, 132, 0.4)',
    'rgba(54, 162, 235, 0.4)',
    'rgba(255, 206, 86, 0.4)',
    'rgba(75, 192, 192, 0.4)',
    'rgba(153, 102, 255, 0.4)',
    'rgba(255, 159, 64, 0.4)'
  ];
  const borderColors = [
    'rgba(255, 99, 132, 1)',
    'rgba(54, 162, 235, 1)',
    'rgba(255, 206, 86, 1)',
    'rgba(75, 192, 192, 1)',
    'rgba(153, 102, 255, 1)',
    'rgba(255, 159, 64, 1)'
  ];
  const getColor = (index, colors) => colors[index % colors.length];

  const data = useMemo(() => ({
    labels,
    datasets: [
      {
        label: 'Team Strength',
        data: dataValues,
        backgroundColor: labels.map((_, i) => getColor(i, backgroundColors)),
        borderColor: labels.map((_, i) => getColor(i, borderColors)),
        borderWidth: 2,
        pointBackgroundColor: labels.map((_, i) => getColor(i, borderColors)),
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: labels.map((_, i) => getColor(i, borderColors)),
        fill: true,
      }
    ]
  }), [labels, dataValues]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#fff',
          font: { size: 14 }
        },
      },
      title: {
        display: true,
        text: `Team Strength by Role (Total Team Score: ${totalTeamScore})`,
        color: '#fff',
        font: { size: 20, weight: 'bold' }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#fff',
        borderWidth: 1,
      },
    },
    scales: {
      r: {
        grid: { color: 'rgba(255,255,255,0.2)' },
        angleLines: { color: 'rgba(255,255,255,0.3)' },
        ticks: {
          backdropColor: 'rgba(0,0,0,0)',
          color: '#fff',
          font: { size: 12 }
        },
        suggestedMin: 0,
        suggestedMax: Math.max(...dataValues) + 10,
      }
    }
  };

  return (
    <div style={{
      position: 'relative',
      height: '450px',
      width: '90%',
      maxWidth: '450px',
      margin: '20px auto',
      backgroundColor: '#333',
      padding: '10px',
      borderRadius: '12px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
    }}>
      <Radar data={data} options={options} />
    </div>
  );
};

export default TeamStrengthChart;
