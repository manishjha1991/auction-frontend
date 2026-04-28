import React, { useCallback, useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../const';
import {
  FaArrowLeft,
  FaMapMarkerAlt,
  FaChevronRight,
  FaFire,
  FaBowlingBall,
  FaUsers,
  FaStar,
  FaShieldAlt,
  FaListOl,
  FaLongArrowAltUp,
  FaLongArrowAltDown,
} from 'react-icons/fa';
import '../css/VenueExplorerPage.css';

const fmt = (n) => (Number.isFinite(n) ? Number(n).toLocaleString() : '0');

function VenueExplorerPage() {
  const [list, setList] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listErr, setListErr] = useState(null);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailErr, setDetailErr] = useState(null);

  const loadList = useCallback(async () => {
    setListLoading(true);
    setListErr(null);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/player-stats/venue-explorer?scope=all`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setList(Array.isArray(data.venues) ? data.venues : []);
    } catch (e) {
      setListErr(e.message || 'Failed to load venues');
      setList([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const openVenue = async (venue) => {
    setSelectedVenue(venue);
    setDetail(null);
    setDetailErr(null);
    setDetailLoading(true);
    try {
      const q = encodeURIComponent(venue);
      const res = await fetch(
        `${API_ENDPOINTS}/api/player-stats/venue-explorer?scope=all&venue=${q}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDetail(data);
    } catch (e) {
      setDetailErr(e.message || 'Failed to load ground detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedVenue(null);
    setDetail(null);
    setDetailErr(null);
  };

  if (selectedVenue) {
    return (
      <div className="vex vex--detail">
        <header className="vex-hero">
          <button type="button" className="vex-back" onClick={closeDetail} aria-label="Back to all grounds">
            <FaArrowLeft aria-hidden />
          </button>
          <div className="vex-hero-text">
            <p className="vex-kicker">Ground dossier</p>
            <h1 className="vex-title">{selectedVenue}</h1>
          </div>
        </header>

        {detailLoading && <p className="vex-muted vex-pad">Loading…</p>}
        {detailErr && <p className="vex-error vex-pad">{detailErr}</p>}

        {detail && !detailLoading && (
          <>
            <section className="vex-strip vex-strip--totals" aria-label="Venue totals">
              <div className="vex-chip vex-chip--runs">
                <span className="vex-chip-label">Runs</span>
                <strong>{fmt(detail.totals?.runs)}</strong>
              </div>
              <div className="vex-chip vex-chip--wkts">
                <span className="vex-chip-label">Wkts</span>
                <strong>{fmt(detail.totals?.wickets)}</strong>
              </div>
              <div className="vex-chip">
                <span className="vex-chip-label">Matches</span>
                <strong>{fmt(detail.totals?.matches)}</strong>
              </div>
            </section>

            <section className="vex-innings-band" aria-label="Team innings high and low">
              <div className="vex-inn-card vex-inn-card--high">
                <div className="vex-inn-label">
                  <FaLongArrowAltUp aria-hidden style={{ marginRight: 4, opacity: 0.85 }} />
                  Highest team innings
                </div>
                {detail.highestTeamInnings ? (
                  <>
                    <div className="vex-inn-val">{fmt(detail.highestTeamInnings.runs)}</div>
                    <div className="vex-inn-team" title={detail.highestTeamInnings.teamName}>
                      {detail.highestTeamInnings.teamName}
                    </div>
                  </>
                ) : (
                  <p className="vex-inn-empty">—</p>
                )}
              </div>
              <div className="vex-inn-card vex-inn-card--low">
                <div className="vex-inn-label">
                  <FaLongArrowAltDown aria-hidden style={{ marginRight: 4, opacity: 0.85 }} />
                  Lowest team innings
                </div>
                {detail.lowestTeamInnings ? (
                  <>
                    <div className="vex-inn-val">{fmt(detail.lowestTeamInnings.runs)}</div>
                    <div className="vex-inn-team" title={detail.lowestTeamInnings.teamName}>
                      {detail.lowestTeamInnings.teamName}
                    </div>
                  </>
                ) : (
                  <p className="vex-inn-empty">
                    {detail.highestTeamInnings
                      ? 'Same as high, or one innings only'
                      : '—'}
                  </p>
                )}
              </div>
            </section>

            {Array.isArray(detail.matchScores) && detail.matchScores.length > 0 && (
              <section className="vex-section">
                <h2 className="vex-h2">
                  <FaListOl className="vex-h2-ic" aria-hidden />
                  Team scores by match
                </h2>
                <div className="vex-match-list">
                  {detail.matchScores.map((m, idx) => (
                    <div
                      key={m.matchId != null ? String(m.matchId) : `m-${idx}`}
                      className="vex-match-card"
                    >
                      <div className="vex-match-total">
                        Game {idx + 1} · {fmt(m.matchTotal)} runs · {(m.sides || []).length}{' '}
                        {(m.sides || []).length === 1 ? 'team' : 'teams'}
                      </div>
                      <div className="vex-match-sides">
                        {(m.sides || []).map((s, j) => (
                          <div key={`${String(s.userId)}-${j}`} className="vex-match-side">
                            <span className="vex-match-team" title={s.teamName}>
                              {s.teamName}
                            </span>
                            <span className="vex-match-runs">{fmt(s.runs)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="vex-section">
              <h2 className="vex-h2">
                <FaUsers className="vex-h2-ic" aria-hidden />
                All teams — career at this ground
              </h2>
              <div className="vex-team-list" role="list">
                {(detail.teams || []).map((t) => (
                  <div key={String(t.userId)} className="vex-team-row" role="listitem">
                    <span className="vex-team-name" title={t.teamName}>
                      {t.teamName || 'Team'}
                    </span>
                    <span className="vex-team-stat vex-team-stat--bat" title="Runs scored">
                      {fmt(t.runs)} <small>R</small>
                    </span>
                    <span className="vex-team-stat vex-team-stat--bowl" title="Wickets taken">
                      {fmt(t.wickets)} <small>W</small>
                    </span>
                  </div>
                ))}
                {(!detail.teams || detail.teams.length === 0) && (
                  <p className="vex-muted">No team splits yet.</p>
                )}
              </div>
            </section>

            <section className="vex-section">
              <h2 className="vex-h2">
                <FaStar className="vex-h2-ic" aria-hidden />
                Records &amp; heroes
              </h2>
              <div className="vex-spot-grid">
                <article className="vex-spot vex-spot--bat">
                  <div className="vex-spot-head">
                    <FaFire aria-hidden />
                    <span>Highest score</span>
                  </div>
                  {detail.highestScore ? (
                    <>
                      <p className="vex-spot-value">{fmt(detail.highestScore.runs)}</p>
                      <p className="vex-spot-sub">{detail.highestScore.playerName || 'Batter'}</p>
                      <p className="vex-spot-meta">{detail.highestScore.teamName}</p>
                      {detail.highestScore.balls ? (
                        <p className="vex-spot-meta">{fmt(detail.highestScore.balls)} balls</p>
                      ) : null}
                    </>
                  ) : (
                    <p className="vex-muted">—</p>
                  )}
                </article>

                <article className="vex-spot vex-spot--bowl">
                  <div className="vex-spot-head">
                    <FaBowlingBall aria-hidden />
                    <span>Best bowling</span>
                  </div>
                  {detail.bestBowling ? (
                    <>
                      <p className="vex-spot-value">
                        {fmt(detail.bestBowling.wickets)}/{fmt(detail.bestBowling.runsGiven)}
                      </p>
                      <p className="vex-spot-sub">{detail.bestBowling.playerName || 'Bowler'}</p>
                      <p className="vex-spot-meta">{detail.bestBowling.teamName}</p>
                    </>
                  ) : (
                    <p className="vex-muted">—</p>
                  )}
                </article>

                <article className="vex-spot vex-spot--all">
                  <div className="vex-spot-head">
                    <FaShieldAlt aria-hidden />
                    <span>Best all-rounder</span>
                  </div>
                  {detail.bestAllrounder ? (
                    <>
                      <p className="vex-spot-value">
                        {fmt(detail.bestAllrounder.runs)}r · {fmt(detail.bestAllrounder.wickets)}w
                      </p>
                      <p className="vex-spot-sub">{detail.bestAllrounder.playerName || 'Player'}</p>
                      <p className="vex-spot-meta">Career at this ground</p>
                    </>
                  ) : (
                    <p className="vex-muted">Need bat + ball at venue</p>
                  )}
                </article>

                <article className="vex-spot vex-spot--team-bowl">
                  <div className="vex-spot-head">
                    <FaBowlingBall aria-hidden />
                    <span>Most team wickets</span>
                  </div>
                  {detail.bestTeamBowlingInnings ? (
                    <>
                      <p className="vex-spot-value">{fmt(detail.bestTeamBowlingInnings.wickets)}</p>
                      <p className="vex-spot-sub">{detail.bestTeamBowlingInnings.teamName}</p>
                      <p className="vex-spot-meta">One match · all bowlers</p>
                    </>
                  ) : (
                    <p className="vex-muted">—</p>
                  )}
                </article>
              </div>
            </section>

            <p className="vex-footnote">
              All figures from saved scorecards (venue ledger). PlayerStats resets each season; this page does not.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="vex">
      <header className="vex-hero vex-hero--list">
        <div className="vex-pin-wrap" aria-hidden>
          <FaMapMarkerAlt className="vex-pin" />
        </div>
        <div className="vex-hero-text">
          <p className="vex-kicker">Ground atlas</p>
          <h1 className="vex-title">Venues</h1>
          <p className="vex-lede">Every ground, every team score — tap in for match cards and records.</p>
        </div>
      </header>

      {listLoading && <p className="vex-muted vex-pad">Loading grounds…</p>}
      {listErr && <p className="vex-error vex-pad">{listErr}</p>}

      {!listLoading && !listErr && list.length === 0 && (
        <p className="vex-muted vex-pad">No venue data yet. Save scorecards with a venue in OCR Extractor.</p>
      )}

      <ul className="vex-list" role="list">
        {list.map((v) => (
          <li key={v.venue}>
            <button
              type="button"
              className="vex-card"
              onClick={() => openVenue(v.venue)}
            >
              <span className="vex-card-pin" aria-hidden>
                <FaMapMarkerAlt />
              </span>
              <div className="vex-card-body">
                <span className="vex-card-name">{v.venue}</span>
                <span className="vex-card-meta">
                  <span className="vex-tag vex-tag--r">{fmt(v.totalRuns)} runs</span>
                  <span className="vex-tag vex-tag--w">{fmt(v.totalWickets)} wkts</span>
                  {v.matches ? (
                    <span className="vex-tag vex-tag--m">{fmt(v.matches)} {v.matches === 1 ? 'match' : 'matches'}</span>
                  ) : null}
                </span>
              </div>
              <FaChevronRight className="vex-card-chev" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default VenueExplorerPage;
