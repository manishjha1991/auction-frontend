import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../const';
import '../css/LiveBettingDashboard.css';

const LiveBettingDashboard = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [settling, setSettling] = useState(false);
  const [settlementData, setSettlementData] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [myBets, setMyBets] = useState([]);
  const [activeTab, setActiveTab] = useState('live'); // 'live', 'my-bets', or 'settled'
  const [showSettlementSummary, setShowSettlementSummary] = useState(false);
  const [settlementSummary, setSettlementSummary] = useState(null);
  const [settledBets, setSettledBets] = useState([]);
  const [loadingSettled, setLoadingSettled] = useState(false);
  const [expandedSettledMatch, setExpandedSettledMatch] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || 'null');
    setUser(userData);
    setIsAdmin(userData?.isAdmin === true);
    fetchLiveBets();
    
    if (userData?.isAdmin) {
      fetchSettledBets();
      // Set default tab to settled for admins
      setActiveTab('settled');
    } else {
      fetchMyBets();
      // Set default tab to my-bets for regular users
      setActiveTab('my-bets');
    }
    
    // Refresh every 5 seconds
    const interval = setInterval(() => {
      fetchLiveBets();
      if (userData?.isAdmin) {
        fetchSettledBets();
      } else {
        fetchMyBets();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMyBets = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || 'null');
      if (!userData?._id) return;
      
      const response = await axios.get(`${API_ENDPOINTS}/api/betting/my-bets`, {
        headers: {
          'user-id': userData._id
        }
      });
      setMyBets(response.data.bets || []);
    } catch (error) {
      console.error('Error fetching my bets:', error);
    }
  };

  const fetchLiveBets = async () => {
    try {
      setLoading(true);
      const userData = JSON.parse(localStorage.getItem('user') || 'null');
      const response = await axios.get(`${API_ENDPOINTS}/api/betting/live`, {
        headers: {
          'user-id': userData?._id
        }
      });
      setMatches(response.data.matches || []);
    } catch (error) {
      console.error('Error fetching live bets:', error);
      setMessage({ type: 'error', text: 'Failed to fetch live bets' });
    } finally {
      setLoading(false);
    }
  };

  const fetchSettledBets = async () => {
    try {
      setLoadingSettled(true);
      const userData = JSON.parse(localStorage.getItem('user') || 'null');
      const response = await axios.get(`${API_ENDPOINTS}/api/betting/settled`, {
        headers: {
          'user-id': userData?._id
        }
      });
      setSettledBets(response.data.matches || []);
    } catch (error) {
      console.error('Error fetching settled bets:', error);
      setMessage({ type: 'error', text: 'Failed to fetch settled bets' });
    } finally {
      setLoadingSettled(false);
    }
  };

  const handleSettleMatch = async (matchKey, team1, team2) => {
    const winner = settlementData[matchKey];
    if (!winner || (winner !== 'team1' && winner !== 'team2')) {
      setMessage({ type: 'error', text: 'Please select a winner' });
      return;
    }

    if (!window.confirm(`Settle all bets for ${team1} vs ${team2}? Winner: ${winner === 'team1' ? team1 : team2}`)) {
      return;
    }

    setSettling(true);
    setMessage({ type: '', text: '' });

    try {
      const userData = JSON.parse(localStorage.getItem('user') || 'null');
      const response = await axios.post(
        `${API_ENDPOINTS}/api/betting/settle/${matchKey}`,
        { winner },
        {
          headers: {
            'user-id': userData?._id
          }
        }
      );

      // Show settlement summary
      if (response.data && response.data.summary) {
        setSettlementSummary({
          match: response.data.match,
          summary: response.data.summary,
          results: response.data.results
        });
        setShowSettlementSummary(true);
      }

      setMessage({ type: 'success', text: 'Bets settled successfully!' });
      setSettlementData({ ...settlementData, [matchKey]: '' });
      setTimeout(() => {
        fetchLiveBets();
      }, 1000);
    } catch (error) {
      console.error('Error settling bets:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to settle bets'
      });
    } finally {
      setSettling(false);
    }
  };

  const handleSettleAll = async () => {
    // Build match results from settlement data
    const matchResults = matches
      .filter(match => settlementData[`${match.team1}_vs_${match.team2}`])
      .map(match => ({
        team1: match.team1,
        team2: match.team2,
        winner: settlementData[`${match.team1}_vs_${match.team2}`]
      }));

    if (matchResults.length === 0) {
      setMessage({ type: 'error', text: 'Please select winners for at least one match' });
      return;
    }

    if (!window.confirm(`Settle ${matchResults.length} match(es)? This will process all pending bets.`)) {
      return;
    }

    setSettling(true);
    setMessage({ type: '', text: '' });

    try {
      const userData = JSON.parse(localStorage.getItem('user') || 'null');
      await axios.post(
        `${API_ENDPOINTS}/api/betting/settle-all`,
        { matchResults },
        {
          headers: {
            'user-id': userData?._id
          }
        }
      );

      setMessage({ type: 'success', text: `Successfully settled ${matchResults.length} match(es)!` });
      setSettlementData({});
      setTimeout(() => {
        fetchLiveBets();
      }, 1000);
    } catch (error) {
      console.error('Error settling all bets:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to settle all bets'
      });
    } finally {
      setSettling(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0';
    const crores = amount / 10000000;
    return crores.toFixed(2) + ' Cr';
  };

  const totalPendingBets = matches.reduce((sum, match) => sum + match.totalBets, 0);
  const totalBetAmount = matches.reduce((sum, match) => sum + match.totalAmount, 0);
  const hasSettlements = Object.values(settlementData).some(v => v);

  // My Bets calculations
  const myPendingBets = myBets.filter(b => b.status === 'pending');
  const myWonBets = myBets.filter(b => b.status === 'won');
  const myLostBets = myBets.filter(b => b.status === 'lost');
  const myTotalReserved = myPendingBets.reduce((sum, b) => sum + (b.betAmount || 0), 0);
  const myTotalWinnings = myWonBets.reduce((sum, b) => sum + (b.actualPayout || 0), 0);
  const myTotalLosses = myLostBets.reduce((sum, b) => sum + Math.abs(b.actualPayout || 0), 0);

  if (loading && matches.length === 0) {
    return (
      <div className="live-betting-dashboard">
        <div className="loading">Loading live bets...</div>
      </div>
    );
  }

  return (
    <div className="live-betting-dashboard">
      <div className="dashboard-header">
        <h1>Live Betting Dashboard</h1>
        {isAdmin && (
          <button
            className="settle-all-btn"
            onClick={handleSettleAll}
            disabled={settling || !hasSettlements}
          >
            {settling ? 'Settling...' : 'Settle All Selected'}
          </button>
        )}
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Settlement Summary Modal */}
      {showSettlementSummary && settlementSummary && (
        <div className="settlement-summary-modal">
          <div className="settlement-summary-content">
            <div className="settlement-summary-header">
              <h2>Settlement Summary</h2>
              <button 
                className="close-settlement-btn"
                onClick={() => {
                  setShowSettlementSummary(false);
                  setSettlementSummary(null);
                }}
              >
                ×
              </button>
            </div>
            
            <div className="settlement-match-info">
              <h3>{settlementSummary.match.team1} vs {settlementSummary.match.team2}</h3>
              <p className="winner-text">Winner: <strong>{settlementSummary.match.winner === 'team1' ? settlementSummary.match.team1 : settlementSummary.match.team2}</strong></p>
            </div>

            <div className="settlement-summary-stats">
              <div className="summary-stat-card">
                <div className="stat-label">Total Bets</div>
                <div className="stat-value">{settlementSummary.summary.totalBets}</div>
              </div>
              <div className="summary-stat-card win">
                <div className="stat-label">Winners</div>
                <div className="stat-value">{settlementSummary.summary.totalWinners}</div>
                <div className="stat-amount">+{formatCurrency(settlementSummary.summary.totalWinnings)}</div>
              </div>
              <div className="summary-stat-card loss">
                <div className="stat-label">Losers</div>
                <div className="stat-value">{settlementSummary.summary.totalLosers}</div>
                <div className="stat-amount">-{formatCurrency(settlementSummary.summary.totalLosses)}</div>
              </div>
              <div className="summary-stat-card total">
                <div className="stat-label">Net Amount</div>
                <div className="stat-value">{formatCurrency(settlementSummary.summary.netAmount)}</div>
              </div>
            </div>

            <div className="settlement-details-table">
              <h4>Bet Details</h4>
              <table className="settlement-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Bet On</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {settlementSummary.results.map((result, idx) => (
                    <tr key={idx} className={result.status === 'won' ? 'won-row' : 'lost-row'}>
                      <td>{result.teamName || 'Unknown'}</td>
                      <td>{result.selectedTeam === 'team1' ? settlementSummary.match.team1 : settlementSummary.match.team2}</td>
                      <td>{formatCurrency(result.betAmount)}</td>
                      <td>
                        <span className={`status-badge ${result.status}`}>
                          {result.status === 'won' ? 'Won' : 'Lost'}
                        </span>
                      </td>
                      <td className={result.status === 'won' ? 'win-amount' : 'loss-amount'}>
                        {result.status === 'won' ? '+' : '-'}{formatCurrency(Math.abs(result.payout))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'live' ? 'active' : ''}`}
          onClick={() => setActiveTab('live')}
        >
          Live Bets ({matches.reduce((sum, m) => sum + m.totalBets, 0)})
        </button>
        {isAdmin ? (
          <button
            className={`tab-btn ${activeTab === 'settled' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('settled');
              fetchSettledBets();
            }}
          >
            Settled Bets ({settledBets.reduce((sum, m) => sum + m.totalBets, 0)})
          </button>
        ) : (
          <button
            className={`tab-btn ${activeTab === 'my-bets' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-bets')}
          >
            My Bets ({myBets.length})
          </button>
        )}
      </div>

      {activeTab === 'live' && (
        <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-label">Active Matches:</span>
          <span className="stat-value">{matches.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Bets:</span>
          <span className="stat-value">{totalPendingBets}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Amount:</span>
          <span className="stat-value">{formatCurrency(totalBetAmount)}</span>
        </div>
      </div>
      )}

      {activeTab === 'my-bets' ? (
        <div className="my-bets-section">
          {/* My Bets Summary */}
          <div className="my-bets-summary">
            <div className="summary-card">
              <div className="summary-label">Pending Bets</div>
              <div className="summary-value">{myPendingBets.length}</div>
              <div className="summary-amount">{formatCurrency(myTotalReserved)} Reserved</div>
            </div>
            <div className="summary-card win">
              <div className="summary-label">Won</div>
              <div className="summary-value">{myWonBets.length}</div>
              <div className="summary-amount">+{formatCurrency(myTotalWinnings)}</div>
            </div>
            <div className="summary-card loss">
              <div className="summary-label">Lost</div>
              <div className="summary-value">{myLostBets.length}</div>
              <div className="summary-amount">-{formatCurrency(myTotalLosses)}</div>
            </div>
            <div className="summary-card total">
              <div className="summary-label">Net Result</div>
              <div className="summary-value">{formatCurrency(myTotalWinnings - myTotalLosses)}</div>
              <div className="summary-amount">{myBets.length} Total Bets</div>
            </div>
          </div>

          {/* My Bets List */}
          <div className="my-bets-table-container">
            {myBets.length === 0 ? (
              <div className="no-bets">
                <p>You haven't placed any bets yet</p>
              </div>
            ) : (
              <table className="my-bets-table">
                <thead>
                  <tr>
                    <th>Match</th>
                    <th>Bet On</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Win/Loss</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {myBets.map((bet) => (
                    <tr key={bet._id} className={`my-bet-row ${bet.status}`}>
                      <td className="my-bet-match-cell">
                        <div className="my-bet-match-compact">
                          <span className="my-bet-team-compact">{bet.team1}</span>
                          <span className="my-bet-vs-compact">VS</span>
                          <span className="my-bet-team-compact">{bet.team2}</span>
                        </div>
                      </td>
                      <td className="my-bet-selected-cell">
                        <span className="my-bet-selected-badge">
                          {bet.selectedTeam === 'team1' ? bet.team1 : bet.team2}
                        </span>
                      </td>
                      <td className="my-bet-amount-cell">{formatCurrency(bet.betAmount)}</td>
                      <td className="my-bet-status-cell">
                        <span className={`my-bet-status-badge ${bet.status}`}>
                          {bet.status === 'pending' && '⏳ Pending'}
                          {bet.status === 'won' && '✅ Won'}
                          {bet.status === 'lost' && '❌ Lost'}
                        </span>
                      </td>
                      <td className="my-bet-outcome-cell">
                        {bet.status === 'pending' && (
                          <div className="my-bet-outcome-pending">
                            <span className="win-text">+{formatCurrency(bet.potentialWin)}</span>
                            <span className="loss-text">-{formatCurrency(bet.potentialLoss)}</span>
                          </div>
                        )}
                        {bet.status === 'won' && bet.actualPayout && (
                          <span className="win-text">+{formatCurrency(bet.actualPayout)}</span>
                        )}
                        {bet.status === 'lost' && bet.actualPayout && (
                          <span className="loss-text">-{formatCurrency(Math.abs(bet.actualPayout))}</span>
                        )}
                      </td>
                      <td className="my-bet-date-cell">
                        <div className="my-bet-date-compact">
                          <div className="date-time-row">
                            <span className="date-label">Placed:</span>
                            <span className="date-value">{new Date(bet.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                          </div>
                          <div className="date-time-row">
                            <span className="time-value">{new Date(bet.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          {bet.settledAt && (
                            <>
                              <div className="date-time-row">
                                <span className="date-label">Settled:</span>
                                <span className="date-value">{new Date(bet.settledAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                              </div>
                              <div className="date-time-row">
                                <span className="time-value">{new Date(bet.settledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : activeTab === 'settled' ? (
        loadingSettled ? (
          <div className="loading">Loading settled bets...</div>
        ) : settledBets.length === 0 ? (
          <div className="no-bets">
            <p>No settled bets yet</p>
          </div>
        ) : (
          <div className="settled-bets-section">
            <div className="stats-bar">
              <div className="stat-item">
                <span className="stat-label">Settled Matches:</span>
                <span className="stat-value">{settledBets.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Settled Bets:</span>
                <span className="stat-value">{settledBets.reduce((sum, m) => sum + m.totalBets, 0)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Winnings:</span>
                <span className="stat-value">{formatCurrency(settledBets.reduce((sum, m) => sum + m.totalWinnings, 0))}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Losses:</span>
                <span className="stat-value">{formatCurrency(settledBets.reduce((sum, m) => sum + m.totalLosses, 0))}</span>
              </div>
            </div>

            <div className="matches-table-container">
              <table className="matches-table">
                <thead>
                  <tr>
                    <th>Match</th>
                    <th>Winner</th>
                    <th>Team1 Bets</th>
                    <th>Team2 Bets</th>
                    <th>Total Amount</th>
                    <th>Won/Lost</th>
                    <th>Settled Date</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {settledBets.map((match) => {
                    const matchKey = `${match.team1}_vs_${match.team2}`;
                    const winnerName = match.winner === 'team1' ? match.team1 : match.team2;

                    return (
                      <React.Fragment key={matchKey}>
                        <tr className="match-row">
                          <td className="match-cell">
                            <div className="match-teams-compact">
                              <span className="team-name-compact">{match.team1}</span>
                              <span className="vs-compact">VS</span>
                              <span className="team-name-compact">{match.team2}</span>
                            </div>
                          </td>
                          <td className="match-cell">
                            <span className="winner-badge">{winnerName}</span>
                          </td>
                          <td className="team-bets-cell">
                            <div className="team-bets-info">
                              <span className="bets-count">{match.bets.filter(b => b.selectedTeam === 'team1').length}</span>
                              <span className="bets-amount">{formatCurrency(match.team1Total)}</span>
                            </div>
                          </td>
                          <td className="team-bets-cell">
                            <div className="team-bets-info">
                              <span className="bets-count">{match.bets.filter(b => b.selectedTeam === 'team2').length}</span>
                              <span className="bets-amount">{formatCurrency(match.team2Total)}</span>
                            </div>
                          </td>
                          <td className="total-amount-cell">
                            <span className="total-amount-value">{formatCurrency(match.totalAmount)}</span>
                          </td>
                          <td className="match-cell">
                            <div className="won-lost-stats">
                              <span className="won-count">Won: {match.wonBets}</span>
                              <span className="lost-count">Lost: {match.lostBets}</span>
                            </div>
                          </td>
                          <td className="match-cell">
                            {match.settledAt ? (
                              <div className="settled-date-compact">
                                <div>{new Date(match.settledAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                <div className="time-value">{new Date(match.settledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                              </div>
                            ) : (
                              <span>-</span>
                            )}
                          </td>
                          <td className="actions-cell">
                            <button
                              className="view-details-btn"
                              onClick={() => setExpandedSettledMatch(expandedSettledMatch === matchKey ? null : matchKey)}
                            >
                              {expandedSettledMatch === matchKey ? 'Hide' : 'View'} Details
                            </button>
                          </td>
                        </tr>
                        {expandedSettledMatch === matchKey && (
                          <tr className="bets-detail-row">
                            <td colSpan="8" className="bets-detail-cell">
                              <div className="bets-detail-content">
                                <div className="bets-detail-header">
                                  <h4 className="bets-detail-title">All Bets for {match.team1} vs {match.team2}</h4>
                                </div>
                                <div className="bets-detail-table-wrapper">
                                  <table className="bets-detail-table">
                                    <thead>
                                      <tr>
                                        <th>User</th>
                                        <th>Bet On</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Payout</th>
                                        <th>Placed Date</th>
                                        <th>Settled Date</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {match.allBets.map((bet, idx) => (
                                        <tr key={idx} className={`bet-detail-row ${bet.status}`}>
                                          <td className="bet-user-cell">
                                            <div className="bet-user-info">
                                              <span className="bet-user-name">{bet.userId?.teamName || bet.userId?.name || 'Unknown'}</span>
                                            </div>
                                          </td>
                                          <td className="bet-team-cell">
                                            <span className={`bet-team-badge ${bet.selectedTeam}`}>
                                              {bet.selectedTeam === 'team1' ? match.team1 : match.team2}
                                            </span>
                                          </td>
                                          <td className="bet-amount-cell">{formatCurrency(bet.betAmount)}</td>
                                          <td className="bet-status-cell">
                                            <span className={`status-badge ${bet.status}`}>
                                              {bet.status === 'won' ? 'Won' : 'Lost'}
                                            </span>
                                          </td>
                                          <td className={bet.status === 'won' ? 'bet-win-cell' : 'bet-loss-cell'}>
                                            {bet.status === 'won' ? '+' : '-'}{formatCurrency(Math.abs(bet.actualPayout || 0))}
                                          </td>
                                          <td className="bet-date-cell">
                                            {new Date(bet.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} {new Date(bet.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                          </td>
                                          <td className="bet-date-cell">
                                            {bet.settledAt ? (
                                              <>
                                                {new Date(bet.settledAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} {new Date(bet.settledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                              </>
                                            ) : (
                                              '-'
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : activeTab === 'live' && matches.length === 0 ? (
        <div className="no-bets">
          <p>No active bets at the moment</p>
        </div>
      ) : (
        <div className="matches-table-container">
          <table className="matches-table">
            <thead>
              <tr>
                <th>Match</th>
                <th>Team1 Bets</th>
                <th>Team2 Bets</th>
                <th>Total Amount</th>
                <th>Total Bets</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => {
                const matchKey = `${match.team1}_vs_${match.team2}`;
                const selectedWinner = settlementData[matchKey] || '';
                const team1Bets = match.bets.filter(b => b.selectedTeam === 'team1');
                const team2Bets = match.bets.filter(b => b.selectedTeam === 'team2');

                return (
                  <React.Fragment key={matchKey}>
                    <tr className="match-row">
                      <td className="match-cell">
                        <div className="match-teams-compact">
                          <span className="team-name-compact">{match.team1}</span>
                          <span className="vs-compact">VS</span>
                          <span className="team-name-compact">{match.team2}</span>
                        </div>
                      </td>
                      <td className="team-bets-cell">
                        <div className="team-bets-info">
                          <span className="bets-count">{team1Bets.length}</span>
                          <span className="bets-amount">{formatCurrency(match.team1Total)}</span>
                        </div>
                      </td>
                      <td className="team-bets-cell">
                        <div className="team-bets-info">
                          <span className="bets-count">{team2Bets.length}</span>
                          <span className="bets-amount">{formatCurrency(match.team2Total)}</span>
                        </div>
                      </td>
                      <td className="total-amount-cell">
                        <span className="total-amount-value">{formatCurrency(match.totalAmount)}</span>
                      </td>
                      <td className="total-bets-cell">
                        <span className="total-bets-value">{match.totalBets}</span>
                      </td>
                      {isAdmin && (
                        <td className="actions-cell">
                          <div className="admin-actions-compact">
                            <button
                              type="button"
                              className={`winner-btn-compact ${selectedWinner === 'team1' ? 'active' : ''}`}
                              onClick={() => setSettlementData({ ...settlementData, [matchKey]: selectedWinner === 'team1' ? '' : 'team1' })}
                              title={match.team1}
                            >
                              T1
                            </button>
                            <button
                              type="button"
                              className={`winner-btn-compact ${selectedWinner === 'team2' ? 'active' : ''}`}
                              onClick={() => setSettlementData({ ...settlementData, [matchKey]: selectedWinner === 'team2' ? '' : 'team2' })}
                              title={match.team2}
                            >
                              T2
                            </button>
                            <button
                              className="settle-btn-compact"
                              onClick={() => handleSettleMatch(matchKey, match.team1, match.team2)}
                              disabled={settling || !selectedWinner}
                              title="Settle Match"
                            >
                              ✓
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                    {/* Expandable bets detail row */}
                    <tr className="bets-detail-row">
                      <td colSpan={isAdmin ? 6 : 5} className="bets-detail-cell">
                        <div className="bets-detail-content">
                          <div className="bets-detail-header">
                            <span className="bets-detail-title">All Bets ({match.totalBets})</span>
                          </div>
                          <div className="bets-detail-table-wrapper">
                            <table className="bets-detail-table">
                              <thead>
                                <tr>
                                  <th>User</th>
                                  <th>Bet On</th>
                                  <th>Amount</th>
                                  <th>Win</th>
                                  <th>Loss</th>
                                </tr>
                              </thead>
                              <tbody>
                                {match.allBets.map((bet) => (
                                  <tr key={bet._id} className="bet-detail-row">
                                    <td className="bet-user-cell">
                                      <div className="bet-user-info">
                                        <span className="bet-user-name">{bet.userId?.teamName || bet.userId?.name || 'Unknown'}</span>
                                        {bet.createdAt && (
                                          <span className="bet-time">{new Date(bet.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} {new Date(bet.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="bet-team-cell">
                                      <span className={`bet-team-badge ${bet.selectedTeam === 'team1' ? 'team1' : 'team2'}`}>
                                        {bet.selectedTeam === 'team1' ? match.team1 : match.team2}
                                      </span>
                                    </td>
                                    <td className="bet-amount-cell">{formatCurrency(bet.betAmount)}</td>
                                    <td className="bet-win-cell">+{formatCurrency(bet.potentialWin)}</td>
                                    <td className="bet-loss-cell">-{formatCurrency(bet.potentialLoss)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LiveBettingDashboard;

