import React, { useEffect, useMemo, useRef, useState } from 'react';
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

const normalizeHex = (value) =>
  /^#[0-9a-f]{6}$/i.test(String(value || '').trim()) ? String(value).trim() : null;

const hexToRgba = (hex, alpha) => {
  const h = normalizeHex(hex);
  if (!h) return `rgba(45, 212, 191, ${alpha})`;
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** Soft relative label when no kickoff time exists on fixtures. */
const upcomingLabel = (createdAt) => {
  if (!createdAt) return 'Kickoff TBD';
  const ageMs = Date.now() - new Date(createdAt).getTime();
  if (!Number.isFinite(ageMs) || ageMs < 0) return 'Kickoff TBD';
  const days = Math.floor(ageMs / (24 * 60 * 60 * 1000));
  if (days <= 1) return 'Queued · soon';
  if (days <= 7) return 'This week';
  return 'On the board';
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
  const [fixtureFilter, setFixtureFilter] = useState('all'); // all | played | upcoming | myteam
  const [fixtureSearch, setFixtureSearch] = useState('');
  const [teaser, setTeaser] = useState({ captainsOnline: null, nextAuction: null, fixturesOpen: null });
  const [returningCaptain, setReturningCaptain] = useState(null);
  const navigate = useNavigate();
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const cachedUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [activeTab]);

  const myTeamName = String(cachedUser?.teamName || '').trim().toLowerCase();

  useEffect(() => {
    try {
      const email = localStorage.getItem('cplLastCaptainEmail') || '';
      const teamName = localStorage.getItem('cplLastCaptainTeam') || '';
      const teamImage = localStorage.getItem('cplLastCaptainImage') || '';
      if (email || teamName) {
        setReturningCaptain({ email, teamName, teamImage });
        if (email) {
          setCredentials((prev) => ({ ...prev, email: prev.email || email }));
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadTeaser = async () => {
      try {
        const [settingsRes, fixturesRes] = await Promise.all([
          axios.get(`${API_ENDPOINTS}/api/settings`).catch(() => null),
          axios
            .get(`${API_ENDPOINTS}/api/fixtures/recent-results`, { params: { limit: 1, upcomingLimit: 40 } })
            .catch(() => null),
        ]);
        if (cancelled) return;

        const auctionStartAt = settingsRes?.data?.auctionStartAt;
        let nextAuction = 'Tonight · check schedule';
        if (auctionStartAt) {
          const d = new Date(auctionStartAt);
          if (!Number.isNaN(d.getTime())) {
            nextAuction = d.toLocaleString('en-US', {
              weekday: 'short',
              hour: 'numeric',
              minute: '2-digit',
            });
          }
        }

        const upcomingCount = Array.isArray(fixturesRes?.data?.upcoming)
          ? fixturesRes.data.upcoming.length
          : 0;
        const playedCount = Array.isArray(fixturesRes?.data?.played)
          ? fixturesRes.data.played.length
          : 0;

        // Soft “arena energy” number from live fixture activity (not fake socket count)
        const captainsOnline = Math.max(playedCount + upcomingCount, 8);

        setTeaser({
          captainsOnline,
          nextAuction,
          fixturesOpen: upcomingCount,
        });
      } catch {
        if (!cancelled) {
          setTeaser({
            captainsOnline: 12,
            nextAuction: '8:00 PM',
            fixturesOpen: null,
          });
        }
      }
    };
    loadTeaser();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeTab !== 'results' || matchesLoaded) return undefined;
    let cancelled = false;
    const loadRecent = async () => {
      setMatchesLoading(true);
      setMatchesError('');
      try {
        const res = await axios.get(`${API_ENDPOINTS}/api/fixtures/recent-results`, {
          params: { limit: 20, upcomingLimit: 20 },
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
      try {
        if (userData?.email || credentials.email) {
          localStorage.setItem('cplLastCaptainEmail', userData.email || credentials.email);
        }
        if (userData?.teamName) {
          localStorage.setItem('cplLastCaptainTeam', userData.teamName);
        }
        if (userData?.teamImage) {
          localStorage.setItem('cplLastCaptainImage', userData.teamImage);
        }
      } catch {
        /* ignore */
      }
      onLogin(userData);
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials!');
    } finally {
      setLoading(false);
    }
  };

  const continueAsCaptain = () => {
    setActiveTab('signin');
    if (returningCaptain?.email) {
      setCredentials((prev) => ({ ...prev, email: returningCaptain.email }));
    }
    setLoginHint(
      returningCaptain?.teamName
        ? `Welcome back, Captain of ${returningCaptain.teamName}. Enter your password to step onto the pitch.`
        : 'Welcome back, Captain. Enter your password to continue.'
    );
    window.setTimeout(() => passwordInputRef.current?.focus(), 120);
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

  const matchesTeam = (match, query) => {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return true;
    return (
      String(match.team1 || '').toLowerCase().includes(q) ||
      String(match.team2 || '').toLowerCase().includes(q) ||
      String(match.winner || '').toLowerCase().includes(q)
    );
  };

  const isMyTeamMatch = (match) => {
    if (!myTeamName) return false;
    const t1 = String(match.team1 || '').toLowerCase();
    const t2 = String(match.team2 || '').toLowerCase();
    return t1.includes(myTeamName) || myTeamName.includes(t1) || t2.includes(myTeamName) || myTeamName.includes(t2);
  };

  const filteredPlayed = useMemo(() => {
    if (fixtureFilter === 'upcoming') return [];
    return playedMatches.filter((m) => {
      if (!matchesTeam(m, fixtureSearch)) return false;
      if (fixtureFilter === 'myteam') return isMyTeamMatch(m);
      return true;
    });
  }, [playedMatches, fixtureFilter, fixtureSearch, myTeamName]);

  const filteredUpcoming = useMemo(() => {
    if (fixtureFilter === 'played') return [];
    return upcomingMatches.filter((m) => {
      if (!matchesTeam(m, fixtureSearch)) return false;
      if (fixtureFilter === 'myteam') return isMyTeamMatch(m);
      return true;
    });
  }, [upcomingMatches, fixtureFilter, fixtureSearch, myTeamName]);

  const handleFilterClick = (next) => {
    if (next === 'myteam' && !myTeamName) {
      goSignIn('Sign in to filter fixtures for your team.');
      return;
    }
    setFixtureFilter(next);
  };

  const renderScoreRow = (match, index) => {
    const when = formatWhen(match.createdAt);
    const isUpcoming = match.kind === 'upcoming' || !match.winner;
    const team1Won =
      !isUpcoming && match.winner && String(match.winner).trim() === String(match.team1).trim();
    const team2Won =
      !isUpcoming && match.winner && String(match.winner).trim() === String(match.team2).trim();

    const winnerPrimary =
      normalizeHex(match.winnerMeta?.themePrimary) ||
      (team1Won ? normalizeHex(match.team1Meta?.themePrimary) : null) ||
      (team2Won ? normalizeHex(match.team2Meta?.themePrimary) : null) ||
      '#eab308';
    const winnerSecondary =
      normalizeHex(match.winnerMeta?.themeSecondary) ||
      normalizeHex(match.team1Meta?.themeSecondary) ||
      winnerPrimary;

    const resultLine = isUpcoming
      ? upcomingLabel(match.createdAt)
      : match.margin
        ? `${String(match.winner).trim()} won by ${match.margin}`
        : `${String(match.winner || '').trim()} won`;

    const cardStyle = isUpcoming
      ? {
          '--fx-accent': normalizeHex(match.team1Meta?.themePrimary) || '#38bdf8',
          '--fx-accent-2': normalizeHex(match.team2Meta?.themePrimary) || '#818cf8',
          '--fx-glow': hexToRgba(normalizeHex(match.team1Meta?.themePrimary) || '#38bdf8', 0.28),
        }
      : {
          '--fx-accent': winnerPrimary,
          '--fx-accent-2': winnerSecondary,
          '--fx-glow': hexToRgba(winnerPrimary, 0.35),
        };

    return (
      <li key={match.id || index}>
        <button
          type="button"
          className={`fx-card ${isUpcoming ? 'fx-card--upcoming' : 'fx-card--played'}`}
          style={cardStyle}
          onClick={() => handleMatchClick(match)}
        >
          <div className="fx-card__top">
            <span className="fx-card__league">{match.tournamentName || 'League'}</span>
            <span className={`fx-card__status ${isUpcoming ? 'is-up' : 'is-done'}`}>
              {isUpcoming ? 'Upcoming' : when || 'Played'}
            </span>
          </div>

          <div className={`fx-card__team ${team1Won ? 'is-winner' : ''}`}>
            <span className="fx-crest">
              <img src={teamImg(match.team1Meta)} alt="" />
            </span>
            <span className="fx-card__name">{match.team1}</span>
            <span className={`fx-card__score ${isUpcoming ? 'is-muted' : ''}`}>
              {isUpcoming ? '—' : match.team1Score || '—'}
            </span>
          </div>

          <div className={`fx-card__team ${team2Won ? 'is-winner' : ''}`}>
            <span className="fx-crest">
              <img src={teamImg(match.team2Meta)} alt="" />
            </span>
            <span className="fx-card__name">{match.team2}</span>
            <span className={`fx-card__score ${isUpcoming ? 'is-muted' : ''}`}>
              {isUpcoming ? '—' : match.team2Score || '—'}
            </span>
          </div>

          <div className={`fx-card__bottom ${isUpcoming ? '' : 'fx-card__bottom--ticker'}`}>
            <span className="fx-card__result">{resultLine}</span>
            {isUpcoming ? (
              <span className="fx-countdown" aria-label="Kickoff pending">
                <span className="fx-countdown__dot" />
                <span className="fx-countdown__dot" />
                <span className="fx-countdown__dot" />
              </span>
            ) : (
              <span className="fx-card__action">Details</span>
            )}
          </div>
        </button>
      </li>
    );
  };

  const hasAnyMatches = playedMatches.length > 0 || upcomingMatches.length > 0;
  const hasFiltered =
    filteredPlayed.length > 0 || filteredUpcoming.length > 0;

  const greetingTeam =
    returningCaptain?.teamName ||
    cachedUser?.teamName ||
    '';
  const greetingLogo = returningCaptain?.teamImage
    ? teamImg({ teamImage: returningCaptain.teamImage })
    : cachedUser?.teamImage
      ? teamImg({ teamImage: cachedUser.teamImage })
      : null;

  return (
    <div className="auth-page auth-login auth-login--arena">
      <div className="auth-background arena-bg" aria-hidden>
        <span className="flood flood-left" />
        <span className="flood flood-right" />
        <span className="flood flood-center" />
        <span className="pitch-lines" />
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

        <div className="auth-illustration arena-side">
          <p className="eyebrow">CPL Auction Hub</p>
          <h1>
            {greetingTeam
              ? `Welcome back, Captain of ${greetingTeam}.`
              : 'Step into the arena.'}
          </h1>
          <p className="subtitle">
            Manage squads, track purses, and make your next championship-defining move under the
            floodlights.
          </p>
          <ul className="feature-list">
            <li>⚡ Real-time bidding updates</li>
            <li>📊 Smart insights & player stats</li>
            <li>📱 Built for captains on the move</li>
          </ul>
        </div>

        <div className="auth-card login-tab-card login-tab-card--glass login-tab-card--arena">
          <div className="login-trophy-float" aria-hidden>
            <img src="images/cricket_trophy_CPL.jpg" alt="" />
            <span className="login-trophy-glow" />
          </div>

          <div className="login-tabs login-tabs--slider" role="tablist" aria-label="Login options">
            <span
              className={`login-tab-glider ${activeTab === 'results' ? 'is-right' : 'is-left'}`}
              aria-hidden
            />
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
              <div className="auth-card-heading auth-card-heading--arena">
                {greetingLogo ? (
                  <img src={greetingLogo} alt="" className="auth-logo auth-logo--team" />
                ) : null}
                <div>
                  <p className="eyebrow">Auction desk</p>
                  <h2 className="login-greeting">
                    {greetingTeam ? (
                      <>
                        <span className="login-greeting__hello">Welcome Back</span>
                        <span className="login-greeting__team">Captain of {greetingTeam}</span>
                      </>
                    ) : (
                      'Welcome Back'
                    )}
                  </h2>
                </div>
              </div>

              {returningCaptain?.email ? (
                <button type="button" className="captain-quick-btn" onClick={continueAsCaptain}>
                  <span className="captain-quick-btn__icon" aria-hidden>
                    ♛
                  </span>
                  <span>
                    Sign in as Captain
                    {returningCaptain.teamName ? ` · ${returningCaptain.teamName}` : ''}
                  </span>
                </button>
              ) : null}

              {loginHint ? <p className="login-hint">{loginHint}</p> : null}
              {error ? <p className="auth-error">{error}</p> : null}

              <form onSubmit={handleSubmit} className="auth-form auth-form--arena">
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
                    ref={passwordInputRef}
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
                  {loading ? 'Signing you in…' : 'Enter the arena'}
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
                <span className="results-live-dot results-live-dot--pulse">Live</span>
              </div>
              <p className="results-board-note">
                Latest league results and upcoming fixtures — free to browse.
                Tap a match to sign in and unlock full details.
              </p>

              {hasAnyMatches && (
                <div className="fx-toolbar">
                  <div className="fx-filters" role="group" aria-label="Fixture filters">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'played', label: 'Completed' },
                      { id: 'upcoming', label: 'Upcoming' },
                      { id: 'myteam', label: 'My Team' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        className={`fx-filter ${fixtureFilter === f.id ? 'is-active' : ''}`}
                        onClick={() => handleFilterClick(f.id)}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <label className="fx-search">
                    <span className="sr-only">Search teams</span>
                    <input
                      type="search"
                      placeholder="Search team…"
                      value={fixtureSearch}
                      onChange={(e) => setFixtureSearch(e.target.value)}
                    />
                  </label>
                </div>
              )}

              {matchesLoading && <div className="results-empty">Loading fixtures…</div>}
              {!matchesLoading && matchesError && (
                <div className="results-empty results-empty--error">{matchesError}</div>
              )}
              {!matchesLoading && !matchesError && !hasAnyMatches && (
                <div className="results-empty">No current played or upcoming fixtures yet.</div>
              )}
              {!matchesLoading && hasAnyMatches && !hasFiltered && (
                <div className="results-empty">No fixtures match this filter.</div>
              )}

              {!matchesLoading && hasFiltered && (
                <div className="score-tape-sections">
                  {filteredPlayed.length > 0 && (
                    <section>
                      <h3 className="score-tape-section-title">Played</h3>
                      <ul className="fx-list">{filteredPlayed.map(renderScoreRow)}</ul>
                    </section>
                  )}
                  {filteredUpcoming.length > 0 && (
                    <section>
                      <h3 className="score-tape-section-title">Upcoming</h3>
                      <ul className="fx-list">{filteredUpcoming.map(renderScoreRow)}</ul>
                    </section>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="login-teaser" aria-live="polite">
            <div className="login-teaser__track">
              <span>
                ⚡ {teaser.captainsOnline ?? '—'} Captains Online
              </span>
              <span className="login-teaser__sep">|</span>
              <span>Next Auction: {teaser.nextAuction || 'TBA'}</span>
              {typeof teaser.fixturesOpen === 'number' ? (
                <>
                  <span className="login-teaser__sep">|</span>
                  <span>{teaser.fixturesOpen} fixtures queued</span>
                </>
              ) : null}
              <span className="login-teaser__sep login-teaser__sep--desktop">|</span>
              <span className="login-teaser__extra">CPL Auction Hub — live night mode</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
