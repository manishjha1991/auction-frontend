import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../css/Auth.css';
import { API_ENDPOINTS } from '../const';

const teamImg = (meta) => {
  const src = meta?.teamImage || meta?.image;
  if (!src) return '/images/default-team.png';
  if (String(src).startsWith('http')) return String(src);
  return `${API_ENDPOINTS}${src}`;
};

const formatWhen = (dateValue) => {
  if (!dateValue) return '';
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin'); // signin | results
  const [playedMatches, setPlayedMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState('');
  const [matchesLoaded, setMatchesLoaded] = useState(false);
  const [loginHint, setLoginHint] = useState('');
  const navigate = useNavigate();
  const emailInputRef = useRef(null);

  useEffect(() => {
    if (activeTab !== 'results' || matchesLoaded) return undefined;
    let cancelled = false;
    const loadRecent = async () => {
      setMatchesLoading(true);
      setMatchesError('');
      try {
        const res = await axios.get(`${API_ENDPOINTS}/api/fixtures/recent-results`, {
          params: { limit: 12, upcomingLimit: 12 },
        });
        if (!cancelled) {
          const played = Array.isArray(res.data?.played)
            ? res.data.played
            : (res.data?.matches || []).filter((m) => m.kind !== 'upcoming');
          const upcoming = Array.isArray(res.data?.upcoming)
            ? res.data.upcoming
            : (res.data?.matches || []).filter((m) => m.kind === 'upcoming');
          setPlayedMatches(played);
          setUpcomingMatches(upcoming);
          setMatchesLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setMatchesError('Could not load recent results right now.');
          setPlayedMatches([]);
          setUpcomingMatches([]);
        }
      } finally {
        if (!cancelled) setMatchesLoading(false);
      }
    };
    loadRecent();
    return () => {
      cancelled = true;
    };
  }, [activeTab, matchesLoaded]);

  const goSignIn = (hint) => {
    setActiveTab('signin');
    setLoginHint(hint || 'Sign in to open full match details.');
    window.setTimeout(() => emailInputRef.current?.focus(), 120);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API_ENDPOINTS}/api/users/login`, credentials);
      const userData = response.data;
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user', JSON.stringify(userData));
      onLogin(userData);
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials!');
    } finally {
      setLoading(false);
    }
  };

  const handleMatchClick = (match) => {
    goSignIn(
      match?.kind === 'upcoming'
        ? `Sign in to follow ${String(match.team1 || '').trim()} vs ${String(match.team2 || '').trim()}.`
        : match?.winner
          ? `Sign in to open full details for ${String(match.winner).trim()}.`
          : 'Sign in to open full match details.'
    );
  };

  const renderScoreRow = (match, index) => {
    const when = formatWhen(match.createdAt);
    const isUpcoming = match.kind === 'upcoming' || !match.winner;
    const team1Won =
      !isUpcoming && match.winner && String(match.winner).trim() === String(match.team1).trim();
    const team2Won =
      !isUpcoming && match.winner && String(match.winner).trim() === String(match.team2).trim();
    const resultLine = isUpcoming
      ? 'Sign in to follow this fixture'
      : match.margin
        ? `${String(match.winner).trim()} won by ${match.margin}`
        : `${String(match.winner || '').trim()} won`;

    return (
      <li key={match.id || index}>
        <button
          type="button"
          className={`fx-card ${isUpcoming ? 'fx-card--upcoming' : 'fx-card--played'}`}
          onClick={() => handleMatchClick(match)}
        >
          <div className="fx-card__top">
            <span className="fx-card__league">{match.tournamentName || 'League'}</span>
            <span className={`fx-card__status ${isUpcoming ? 'is-up' : 'is-final'}`}>
              {isUpcoming ? 'Upcoming' : when ? `Final · ${when}` : 'Final'}
            </span>
          </div>

          <div className={`fx-card__team ${team1Won ? 'is-winner' : ''}`}>
            <img src={teamImg(match.team1Meta)} alt="" />
            <span className="fx-card__name">{match.team1}</span>
            <span className={`fx-card__score ${isUpcoming ? 'is-muted' : ''}`}>
              {isUpcoming ? '—' : match.team1Score || '—'}
            </span>
          </div>

          <div className={`fx-card__team ${team2Won ? 'is-winner' : ''}`}>
            <img src={teamImg(match.team2Meta)} alt="" />
            <span className="fx-card__name">{match.team2}</span>
            <span className={`fx-card__score ${isUpcoming ? 'is-muted' : ''}`}>
              {isUpcoming ? '—' : match.team2Score || '—'}
            </span>
          </div>

          <div className="fx-card__bottom">
            <span className="fx-card__result">{resultLine}</span>
            <span className="fx-card__action">Details</span>
          </div>
        </button>
      </li>
    );
  };

  const hasAnyMatches = playedMatches.length > 0 || upcomingMatches.length > 0;

  return (
    <div className="auth-page auth-login">
      <div className="auth-background">
        <span className="orb orb-one" />
        <span className="orb orb-two" />
        <span className="orb orb-three" />
      </div>

      <div className="auth-content login-tabbed">
        <div className="login-mobile-brand" aria-hidden="false">
          <img src="images/cricket_trophy_CPL.jpg" alt="" className="login-mobile-brand__logo" />
          <div>
            <p className="eyebrow">CPL Auction Hub</p>
            <strong>Captain login</strong>
          </div>
        </div>

        <div className="auth-illustration">
          <p className="eyebrow">CPL Auction Hub</p>
          <h1>Welcome back to the arena.</h1>
          <p className="subtitle">
            Manage squads, track purses, and make your next championship-defining move.
          </p>
          <ul className="feature-list">
            <li>⚡ Real-time bidding updates</li>
            <li>📊 Smart insights & player stats</li>
            <li>📱 Optimised for every screen</li>
          </ul>
        </div>

        <div className="auth-card login-tab-card">
          <div className="login-tabs" role="tablist" aria-label="Login options">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'signin'}
              className={`login-tab ${activeTab === 'signin' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('signin')}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'results'}
              className={`login-tab ${activeTab === 'results' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('results')}
            >
              Recent Matches
            </button>
          </div>

          {activeTab === 'signin' ? (
            <div role="tabpanel" className="login-tab-panel">
              <div className="auth-card-heading">
                <img
                  src="images/cricket_trophy_CPL.jpg"
                  alt="Cricket Trophy"
                  className="auth-logo"
                />
                <div>
                  <p className="eyebrow">Account</p>
                  <h2>Welcome Back</h2>
                </div>
              </div>

              {loginHint ? <p className="login-hint">{loginHint}</p> : null}
              {error ? <p className="auth-error">{error}</p> : null}

              <form onSubmit={handleSubmit} className="auth-form">
                <label>
                  <span>Email</span>
                  <input
                    ref={emailInputRef}
                    type="email"
                    name="email"
                    placeholder="captain@cpl.com"
                    value={credentials.email}
                    onChange={handleChange}
                    required
                    autoComplete="username"
                  />
                </label>
                <label>
                  <span>Password</span>
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={credentials.password}
                    onChange={handleChange}
                    required
                    autoComplete="current-password"
                  />
                </label>

                <button type="submit" className="auth-primary-btn" disabled={loading}>
                  {loading ? 'Signing you in…' : 'Login'}
                </button>
              </form>

              <div className="auth-footer">
                <p>New to CPL?</p>
                <Link to="/signup">Create an account</Link>
              </div>
            </div>
          ) : (
            <div role="tabpanel" className="login-tab-panel login-results-panel">
              <div className="results-board-head">
                <div>
                  <p className="eyebrow">Public board</p>
                  <h2>Fixtures</h2>
                </div>
                <span className="results-live-dot">Live</span>
              </div>
              <p className="results-board-note">
                Latest league results and upcoming fixtures — free to browse.
                Tap a match to sign in and unlock full details.
              </p>

              {matchesLoading && <div className="results-empty">Loading fixtures…</div>}
              {!matchesLoading && matchesError && (
                <div className="results-empty results-empty--error">{matchesError}</div>
              )}
              {!matchesLoading && !matchesError && !hasAnyMatches && (
                <div className="results-empty">No current played or upcoming fixtures yet.</div>
              )}

              {!matchesLoading && hasAnyMatches && (
                <div className="score-tape-sections">
                  {playedMatches.length > 0 && (
                    <section>
                      <h3 className="score-tape-section-title">Played</h3>
                      <ul className="fx-list">{playedMatches.map(renderScoreRow)}</ul>
                    </section>
                  )}
                  {upcomingMatches.length > 0 && (
                    <section>
                      <h3 className="score-tape-section-title">Upcoming</h3>
                      <ul className="fx-list">{upcomingMatches.map(renderScoreRow)}</ul>
                    </section>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
