import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../const';
import '../css/Betting.css';

const Betting = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam1, setSelectedTeam1] = useState('');
  const [selectedTeam2, setSelectedTeam2] = useState('');
  const [betAmount, setBetAmount] = useState('');
  const [selectedBetTeam, setSelectedBetTeam] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [user, setUser] = useState(null);
  const [odds, setOdds] = useState(null);
  const [team1Rank, setTeam1Rank] = useState(null);
  const [team2Rank, setTeam2Rank] = useState(null);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [reservedAmount, setReservedAmount] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingBetData, setPendingBetData] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || 'null');
    if (userData) {
      // Parse betWallet value properly - handle Decimal128, string, or number
      // Use betWallet for betting, NOT purse
      let walletValue = 0;
      if (userData.betWallet) {
        if (typeof userData.betWallet === 'object' && userData.betWallet.$numberDecimal) {
          // MongoDB Decimal128 format
          walletValue = parseFloat(userData.betWallet.$numberDecimal);
        } else if (typeof userData.betWallet === 'string') {
          walletValue = parseFloat(userData.betWallet);
        } else if (typeof userData.betWallet === 'number') {
          walletValue = userData.betWallet;
        }
      } else {
        // Default to 100 CR if betWallet not set
        walletValue = 1000000000;
      }
      
      // If wallet is 0 or missing, try to fetch from API
      if (walletValue === 0 && userData._id) {
        fetchUserWallet(userData._id);
      } else {
        // Update user object with parsed betWallet
        const updatedUser = { ...userData, betWallet: walletValue };
        setUser(updatedUser);
        
        // Also update localStorage with parsed value
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    }
    fetchTeams();
    if (userData?._id) {
      fetchPendingBets(userData._id);
    }
  }, []);

  const fetchPendingBets = async (userId) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS}/api/betting/my-bets?status=pending`, {
        headers: {
          'user-id': userId
        }
      });
      
      const pendingBets = response.data.bets || [];
      const totalReserved = pendingBets.reduce((sum, bet) => sum + (bet.betAmount || 0), 0);
      setReservedAmount(totalReserved);
      
      // Calculate available balance using betWallet, NOT purse
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const totalWallet = getWalletValue(currentUser.betWallet);
      setAvailableBalance(totalWallet - totalReserved);
    } catch (error) {
      console.error('Error fetching pending bets:', error);
    }
  };

  const fetchUserWallet = async (userId) => {
    try {
      // Try to get user details from profile endpoint
      const response = await axios.get(`${API_ENDPOINTS}/api/users/${userId}/details`, {
        headers: {
          'user-id': userId
        }
      });
      
      if (response.data && response.data.user) {
        // Use betWallet for betting, NOT purse
        const walletValue = response.data.user.betWallet 
          ? parseFloat(response.data.user.betWallet.toString()) 
          : 1000000000; // Default to 100 CR if not set
        
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...currentUser, betWallet: walletValue };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error fetching user bet wallet:', error);
      // If fetch fails, set wallet to default 100 CR
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, betWallet: 1000000000 };
      setUser(updatedUser);
    }
  };

  useEffect(() => {
    if (selectedTeam1 && selectedTeam2) {
      calculateOdds();
    }
  }, [selectedTeam1, selectedTeam2, selectedBetTeam]);

  const fetchTeams = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS}/api/users/points-table`);
      const filteredTeams = response.data.filter(team => team.teamName !== 'NA');
      // Sort by points and fairness to get rankings (same logic as point table)
      const sortedTeams = filteredTeams.sort((a, b) => {
        const pointsA = Number(a.points) || 0;
        const pointsB = Number(b.points) || 0;
        // First sort by points (descending)
        if (pointsB !== pointsA) return pointsB - pointsA;
        // If points are equal, sort by fairness (descending)
        const fairnessA = Number(a.fairness) || Number(a.fairnessPoint) || 0;
        const fairnessB = Number(b.fairness) || Number(b.fairnessPoint) || 0;
        return fairnessB - fairnessA;
      });
      // Add rank to each team
      const teamsWithRank = sortedTeams.map((team, index) => ({
        ...team,
        rank: index + 1
      }));
      setTeams(teamsWithRank);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setMessage({ type: 'error', text: 'Failed to fetch teams' });
    }
  };

  const calculateOdds = () => {
    if (!selectedTeam1 || !selectedTeam2) return;

    const team1 = teams.find(t => t.teamName === selectedTeam1);
    const team2 = teams.find(t => t.teamName === selectedTeam2);

    if (!team1 || !team2) return;

    // Use rank from point table (already calculated in fetchTeams)
    const rank1 = team1.rank || teams.findIndex(t => t.teamName === selectedTeam1) + 1;
    const rank2 = team2.rank || teams.findIndex(t => t.teamName === selectedTeam2) + 1;

    setTeam1Rank(rank1);
    setTeam2Rank(rank2);

    if (!selectedBetTeam) {
      setOdds(null);
      return;
    }

    const isTeam1Favorite = rank1 < rank2;
    const isTeam2Favorite = rank2 < rank1;

    let isUnderdog = false;
    let winMultiplier = 1.5; // 50% gain
    let loseMultiplier = 0.6; // 60% loss

    if (selectedBetTeam === 'team1') {
      if (isTeam1Favorite) {
        // Betting on favorite
        winMultiplier = 1.5;
        loseMultiplier = 0.6;
        isUnderdog = false;
      } else {
        // Betting on underdog
        winMultiplier = 1.6;
        loseMultiplier = 0.4;
        isUnderdog = true;
      }
    } else if (selectedBetTeam === 'team2') {
      if (isTeam2Favorite) {
        // Betting on favorite
        winMultiplier = 1.5;
        loseMultiplier = 0.6;
        isUnderdog = false;
      } else {
        // Betting on underdog
        winMultiplier = 1.6;
        loseMultiplier = 0.4;
        isUnderdog = true;
      }
    }

    setOdds({
      isUnderdog,
      winMultiplier,
      loseMultiplier,
      potentialWin: betAmount ? Math.floor(betAmount * winMultiplier) : 0,
      potentialLoss: betAmount ? Math.floor(betAmount * loseMultiplier) : 0
    });
  };

  const handleQuickBetClick = (amount) => {
    if (!selectedTeam1 || !selectedTeam2 || !selectedBetTeam) {
      setMessage({ type: 'error', text: 'Please select both teams and choose which team to bet on' });
      return;
    }

    if (amount > currentWallet) {
      setMessage({ type: 'error', text: 'Insufficient available balance' });
      return;
    }

    // Calculate odds for this amount
    const tempBetAmount = amount.toString();
    setBetAmount(tempBetAmount);
    
    // Calculate odds
    const team1 = teams.find(t => t.teamName === selectedTeam1);
    const team2 = teams.find(t => t.teamName === selectedTeam2);
    
    if (!team1 || !team2) return;

    const rank1 = team1.rank || teams.findIndex(t => t.teamName === selectedTeam1) + 1;
    const rank2 = team2.rank || teams.findIndex(t => t.teamName === selectedTeam2) + 1;

    const isTeam1Favorite = rank1 < rank2;
    const isTeam2Favorite = rank2 < rank1;

    let isUnderdog = false;
    let winMultiplier = 1.5;
    let loseMultiplier = 0.6;

    if (selectedBetTeam === 'team1') {
      if (isTeam1Favorite) {
        winMultiplier = 1.5;
        loseMultiplier = 0.6;
        isUnderdog = false;
      } else {
        winMultiplier = 1.6;
        loseMultiplier = 0.4;
        isUnderdog = true;
      }
    } else if (selectedBetTeam === 'team2') {
      if (isTeam2Favorite) {
        winMultiplier = 1.5;
        loseMultiplier = 0.6;
        isUnderdog = false;
      } else {
        winMultiplier = 1.6;
        loseMultiplier = 0.4;
        isUnderdog = true;
      }
    }

    const potentialWin = Math.floor(amount * winMultiplier);
    const potentialLoss = Math.floor(amount * loseMultiplier);
    const newReservedAmount = reservedAmount + amount;
    const newAvailableBalance = totalWallet - newReservedAmount;

    // Set pending bet data for confirmation
    setPendingBetData({
      amount,
      selectedTeam: selectedBetTeam === 'team1' ? selectedTeam1 : selectedTeam2,
      team1,
      team2,
      isUnderdog,
      potentialWin,
      potentialLoss,
      newReservedAmount,
      newAvailableBalance,
      currentAvailable: currentWallet
    });

    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const handlePlaceBet = async (e) => {
    e.preventDefault();
    
    if (!selectedTeam1 || !selectedTeam2 || !betAmount || !selectedBetTeam) {
      setMessage({ type: 'error', text: 'Please fill all fields' });
      return;
    }

    const betAmountNum = Number(betAmount);
    const MIN_BET = 1000000; // 10 Lakh minimum (1,000,000 = 0.10 Cr)
    
    if (isNaN(betAmountNum) || betAmountNum <= 0) {
      setMessage({ type: 'error', text: 'Invalid bet amount' });
      return;
    }

    if (betAmountNum < MIN_BET) {
      setMessage({ type: 'error', text: `Minimum bet amount is ${formatCurrency(MIN_BET)}` });
      return;
    }

    if (!user) {
      setMessage({ type: 'error', text: 'User not found. Please login again.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const team1Data = teams.find(t => t.teamName === selectedTeam1);
      const team2Data = teams.find(t => t.teamName === selectedTeam2);

      const response = await axios.post(
        `${API_ENDPOINTS}/api/betting/place`,
        {
          team1: selectedTeam1,
          team2: selectedTeam2,
          selectedTeam: selectedBetTeam,
          betAmount: betAmountNum,
          team1UserId: team1Data?._id || null,
          team2UserId: team2Data?._id || null,
          team1Rank,
          team2Rank
        },
        {
          headers: {
            'user-id': user._id
          }
        }
      );

      setMessage({ type: 'success', text: 'Bet placed successfully! You can place more bets on other matches.' });
      
      // Reset form but keep teams selected for easy betting on same match
      // Only reset bet amount and selected team
      setBetAmount('');
      setSelectedBetTeam('');
      setOdds(null);
      
      // Update available balance and reserved amount from response
      if (response.data.bet) {
        setAvailableBalance(response.data.bet.availableBalance || 0);
        setReservedAmount(response.data.bet.reservedAmount || 0);
        
        // Update user betWallet (total, not available) - NOT purse
        if (response.data.bet.betWallet || response.data.bet.totalWallet) {
          const walletValue = response.data.bet.betWallet || response.data.bet.totalWallet;
          const updatedUser = { ...user, betWallet: walletValue };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
      }
      
      // Refresh pending bets to get updated amounts
      if (user?._id) {
        fetchPendingBets(user._id);
      }

      // Refresh teams to get updated rankings
      setTimeout(() => {
        fetchTeams();
      }, 1000);
    } catch (error) {
      console.error('Error placing bet:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to place bet'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0';
    const crores = amount / 10000000;
    return crores.toFixed(2) + ' Cr';
  };

  // Parse betWallet value properly (for betting, NOT purse)
  const getWalletValue = (wallet) => {
    if (!wallet) return 1000000000; // Default to 100 CR if not set
    if (typeof wallet === 'object' && wallet.$numberDecimal) {
      return parseFloat(wallet.$numberDecimal);
    }
    if (typeof wallet === 'string') {
      return parseFloat(wallet);
    }
    if (typeof wallet === 'number') {
      return wallet;
    }
    return 1000000000; // Default to 100 CR
  };

  const totalWallet = user ? getWalletValue(user.betWallet) : 1000000000;
  // Use available balance (total - reserved) for validation
  const currentWallet = availableBalance > 0 ? availableBalance : (totalWallet - reservedAmount);

  return (
    <div className="betting-container">
      <div className="betting-header">
        <h1>Place Your Bet</h1>
        <div className="purse-display">
          <div className="purse-info">
            <div className="purse-row">
              <span className="purse-label">Bet Wallet:</span>
              <span className="purse-amount">{formatCurrency(totalWallet)}</span>
            </div>
            {reservedAmount > 0 && (
              <div className="purse-row reserved">
                <span className="purse-label">Reserved (Pending):</span>
                <span className="purse-amount">-{formatCurrency(reservedAmount)}</span>
              </div>
            )}
            <div className="purse-row available">
              <span className="purse-label">Available:</span>
              <span className="purse-amount available-amount">{formatCurrency(currentWallet)}</span>
            </div>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="betting-form">
        <div className="form-group">
          <label>Select Team 1</label>
          <select
            value={selectedTeam1}
            onChange={(e) => {
              setSelectedTeam1(e.target.value);
              if (e.target.value === selectedTeam2) {
                setSelectedTeam2('');
                setSelectedBetTeam('');
              }
            }}
            required
          >
            <option value="">Choose Team 1</option>
            {teams.map((team) => (
              <option key={team._id} value={team.teamName}>
                {team.teamName} {team.rank && `(Rank #${team.rank})`}
              </option>
            ))}
          </select>
        </div>

        <div className="vs-divider">VS</div>

        <div className="form-group">
          <label>Select Team 2</label>
          <select
            value={selectedTeam2}
            onChange={(e) => {
              setSelectedTeam2(e.target.value);
              if (e.target.value === selectedTeam1) {
                setSelectedTeam1('');
                setSelectedBetTeam('');
              }
            }}
            required
          >
            <option value="">Choose Team 2</option>
            {teams.map((team) => (
              <option key={team._id} value={team.teamName}>
                {team.teamName} {team.rank && `(Rank #${team.rank})`}
              </option>
            ))}
          </select>
        </div>

        {selectedTeam1 && selectedTeam2 && (
          <>
            <div className="form-group">
              <label>Select Team to Bet On</label>
              <div className="team-selection">
                <button
                  type="button"
                  className={`team-option ${selectedBetTeam === 'team1' ? 'active' : ''}`}
                  onClick={() => setSelectedBetTeam('team1')}
                >
                  {selectedTeam1}
                </button>
                <button
                  type="button"
                  className={`team-option ${selectedBetTeam === 'team2' ? 'active' : ''}`}
                  onClick={() => setSelectedBetTeam('team2')}
                >
                  {selectedTeam2}
                </button>
              </div>
            </div>

            {selectedBetTeam && odds && (
              <div className="odds-display">
                <div className="odds-info">
                  <div className="odds-badge">
                    {odds.isUnderdog ? 'Underdog' : 'Favorite'}
                  </div>
                  <div className="odds-details">
                    <div className="odds-row">
                      <span>If Win:</span>
                      <span className="win-amount">+{formatCurrency(odds.potentialWin)}</span>
                    </div>
                    <div className="odds-row">
                      <span>If Lose:</span>
                      <span className="loss-amount">-{formatCurrency(odds.potentialLoss)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Bet Amount (in ₹)</label>
              
              {/* Quick Bet Amount Buttons */}
              <div className="quick-bet-buttons">
                <button
                  type="button"
                  className="quick-bet-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleQuickBetClick(1000000);
                  }}
                  disabled={1000000 > currentWallet || !selectedBetTeam}
                  style={{ pointerEvents: (1000000 > currentWallet || !selectedBetTeam) ? 'none' : 'auto' }}
                >
                  10 Lakh
                </button>
                <button
                  type="button"
                  className="quick-bet-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleQuickBetClick(5000000);
                  }}
                  disabled={5000000 > currentWallet || !selectedBetTeam}
                  style={{ pointerEvents: (5000000 > currentWallet || !selectedBetTeam) ? 'none' : 'auto' }}
                >
                  50 Lakh
                </button>
                <button
                  type="button"
                  className="quick-bet-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleQuickBetClick(10000000);
                  }}
                  disabled={10000000 > currentWallet || !selectedBetTeam}
                  style={{ pointerEvents: (10000000 > currentWallet || !selectedBetTeam) ? 'none' : 'auto' }}
                >
                  1 Cr
                </button>
                <button
                  type="button"
                  className="quick-bet-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleQuickBetClick(50000000);
                  }}
                  disabled={50000000 > currentWallet || !selectedBetTeam}
                  style={{ pointerEvents: (50000000 > currentWallet || !selectedBetTeam) ? 'none' : 'auto' }}
                >
                  5 Cr
                </button>
              </div>
              {!selectedBetTeam && (
                <div className="amount-hint" style={{ color: '#ef4444', textAlign: 'center', marginTop: '0.5rem', fontWeight: '600' }}>
                  ⚠️ Please select a team to bet on first
                </div>
              )}
              {selectedBetTeam && currentWallet < 1000000 && (
                <div className="amount-hint" style={{ color: '#ef4444', textAlign: 'center', marginTop: '0.5rem', fontWeight: '600' }}>
                  ⚠️ Insufficient balance. You need at least 10 Lakh (0.10 Cr) to place a bet. Your available: {formatCurrency(currentWallet)}
                </div>
              )}
            </div>


          </>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && pendingBetData && (
        <div className="confirm-modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-header">
              <h2>Confirm Your Bet</h2>
              <button className="close-modal-btn" onClick={() => setShowConfirmModal(false)}>×</button>
            </div>
            
            <div className="confirm-modal-content">
              <div className="confirm-section">
                <h3>Match Details</h3>
                <div className="confirm-row">
                  <span className="confirm-label">Team 1:</span>
                  <span className="confirm-value">{pendingBetData.team1.teamName} (Rank #{pendingBetData.team1.rank})</span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-label">Team 2:</span>
                  <span className="confirm-value">{pendingBetData.team2.teamName} (Rank #{pendingBetData.team2.rank})</span>
                </div>
                <div className="confirm-row highlight">
                  <span className="confirm-label">Betting On:</span>
                  <span className="confirm-value">{pendingBetData.selectedTeam}</span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-label">Type:</span>
                  <span className="confirm-value">{pendingBetData.isUnderdog ? 'Underdog' : 'Favorite'}</span>
                </div>
              </div>

              <div className="confirm-section">
                <h3>Bet Amount</h3>
                <div className="confirm-row highlight">
                  <span className="confirm-label">Bet Amount:</span>
                  <span className="confirm-value">{formatCurrency(pendingBetData.amount)}</span>
                </div>
              </div>

              <div className="confirm-section">
                <h3>Potential Outcomes</h3>
                <div className="confirm-row win">
                  <span className="confirm-label">If Win:</span>
                  <span className="confirm-value">+{formatCurrency(pendingBetData.potentialWin)}</span>
                </div>
                <div className="confirm-row loss">
                  <span className="confirm-label">If Lose:</span>
                  <span className="confirm-value">-{formatCurrency(pendingBetData.potentialLoss)}</span>
                </div>
              </div>

              <div className="confirm-section">
                <h3>Balance Impact</h3>
                <div className="confirm-row">
                  <span className="confirm-label">Current Available:</span>
                  <span className="confirm-value">{formatCurrency(pendingBetData.currentAvailable)}</span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-label">Amount to Reserve:</span>
                  <span className="confirm-value">-{formatCurrency(pendingBetData.amount)}</span>
                </div>
                <div className="confirm-row highlight">
                  <span className="confirm-label">New Available After Bet:</span>
                  <span className="confirm-value">{formatCurrency(pendingBetData.newAvailableBalance)}</span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-label">Total Reserved (All Pending):</span>
                  <span className="confirm-value">{formatCurrency(pendingBetData.newReservedAmount)}</span>
                </div>
              </div>
            </div>

            <div className="confirm-modal-footer">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingBetData(null);
                  setBetAmount('');
                }}
              >
                Cancel
              </button>
              <button
                className="confirm-bet-btn"
                onClick={async () => {
                  setShowConfirmModal(false);
                  // Use the pending bet data to place the bet
                  const betAmountNum = pendingBetData.amount;
                  setLoading(true);
                  setMessage({ type: '', text: '' });

                  try {
                    const team1Data = teams.find(t => t.teamName === selectedTeam1);
                    const team2Data = teams.find(t => t.teamName === selectedTeam2);

                    const response = await axios.post(
                      `${API_ENDPOINTS}/api/betting/place`,
                      {
                        team1: selectedTeam1,
                        team2: selectedTeam2,
                        selectedTeam: selectedBetTeam,
                        betAmount: betAmountNum,
                        team1UserId: team1Data?._id || null,
                        team2UserId: team2Data?._id || null,
                        team1Rank: team1Data?.rank,
                        team2Rank: team2Data?.rank
                      },
                      {
                        headers: {
                          'user-id': user._id
                        }
                      }
                    );

                    setMessage({ type: 'success', text: 'Bet placed successfully! You can place more bets on other matches.' });
                    
                    // Reset form
                    setBetAmount('');
                    setSelectedBetTeam('');
                    setOdds(null);
                    setPendingBetData(null);
                    
                    // Update available balance and reserved amount from response
                    if (response.data.bet) {
                      setAvailableBalance(response.data.bet.availableBalance || 0);
                      setReservedAmount(response.data.bet.reservedAmount || 0);
                      
                      // Update betWallet, NOT purse
                      if (response.data.bet.betWallet || response.data.bet.totalWallet) {
                        const walletValue = response.data.bet.betWallet || response.data.bet.totalWallet;
                        const updatedUser = { ...user, betWallet: walletValue };
                        localStorage.setItem('user', JSON.stringify(updatedUser));
                        setUser(updatedUser);
                      }
                    }
                    
                    // Refresh pending bets
                    if (user?._id) {
                      fetchPendingBets(user._id);
                    }

                    // Refresh teams
                    setTimeout(() => {
                      fetchTeams();
                    }, 1000);
                  } catch (error) {
                    console.error('Error placing bet:', error);
                    setMessage({
                      type: 'error',
                      text: error.response?.data?.error || 'Failed to place bet'
                    });
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                {loading ? 'Placing Bet...' : 'Confirm & Place Bet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Betting;

