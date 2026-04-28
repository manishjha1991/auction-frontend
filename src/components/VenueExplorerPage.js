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
  FaLightbulb,
  FaBalanceScale,
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
  const [insight, setInsight] = useState(null);
  const [insightErr, setInsightErr] = useState(null);

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
    setInsight(null);
    setInsightErr(null);
    setDetailLoading(true);
    try {
      const q = encodeURIComponent(venue);
      const [dResult, iResult] = await Promise.allSettled([
        fetch(`${API_ENDPOINTS}/api/player-stats/venue-explorer?scope=all&venue=${q}`).then(
          async (r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
          }
        ),
        fetch(`${API_ENDPOINTS}/api/player-stats/venue-insight?scope=all&venue=${q}`).then(
          async (r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
          }
        ),
      ]);

      if (dResult.status === 'fulfilled') {
        setDetail(dResult.value);
      } else {
        setDetailErr(dResult.reason?.message || 'Failed to load ground detail');
      }

      if (iResult.status === 'fulfilled') {
        setInsight(iResult.value);
      } else {
        setInsightErr(
          iResult.reason?.message ? String(iResult.reason.message) : 'Analyst unavailable'
        );
      }
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
    setInsight(null);
    setInsightErr(null);
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

        {detailLoading && (
          <div className="vex-ground-loader" role="status" aria-live="polite" aria-busy="true">
            <div className="vex-ground-loader__glow" aria-hidden />
            <div className="vex-ground-loader__rings" aria-hidden>
              <span className="vex-ground-loader__orbit vex-ground-loader__orbit--outer" />
              <span className="vex-ground-loader__orbit vex-ground-loader__orbit--inner" />
              <span className="vex-ground-loader__core" />
            </div>
            <p className="vex-ground-loader__title">Opening this ground</p>
            <p className="vex-ground-loader__hint">Scorecards, match cards &amp; analyst</p>
          </div>
        )}
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

            {(insight || insightErr) && (
              <section className="vex-section vex-insight" aria-label="Ground analyst">
                <h2 className="vex-h2">
                  <FaLightbulb className="vex-h2-ic" aria-hidden />
                  Ground analyst
                </h2>
                <p className="vex-insight-disclaimer">
                  {insight?.disclaimer ||
                    'Hints from your saved games only — not a real pitch report.'}
                </p>
                {insightErr && <p className="vex-error vex-insight-soft-err">{insightErr}</p>}
                {insight && (
                  <>
                    <div
                      className={
                        insight.spinVsPace?.recommendation === 'insufficient_data'
                          ? 'vex-insight-grid vex-insight-grid--single'
                          : 'vex-insight-grid'
                      }
                    >
                      <article className="vex-insight-card">
                        <div className="vex-insight-card-head">
                          <FaBalanceScale aria-hidden />
                          If you won the toss
                        </div>
                        <p className="vex-insight-label">{insight.toss?.label}</p>
                        <p className="vex-insight-body">{insight.toss?.summary}</p>
                        {insight.metrics?.inningsOrderMatchesUsed >= 2 && (
                          <p className="vex-insight-meta vex-insight-meta--pad">
                            First vs second innings: {insight.metrics.inningsOrderMatchesUsed} matches
                            in the ledger have batting order recorded.
                          </p>
                        )}
                      </article>
                      {insight.spinVsPace?.recommendation !== 'insufficient_data' && (
                        <article className="vex-insight-card">
                          <div className="vex-insight-card-head">
                            <FaBowlingBall aria-hidden />
                            Spin vs pace
                          </div>
                          <p className="vex-insight-label">{insight.spinVsPace?.label}</p>
                          <p className="vex-insight-body">{insight.spinVsPace?.summary}</p>
                          {insight.spinVsPace?.spinWicketShare != null &&
                            insight.spinVsPace?.paceWicketShare != null && (
                              <p className="vex-insight-meta">
                                Wicket share (classified): spin{' '}
                                {Math.round(insight.spinVsPace.spinWicketShare * 100)}% · pace{' '}
                                {Math.round(insight.spinVsPace.paceWicketShare * 100)}%
                              </p>
                            )}
                        </article>
                      )}
                    </div>

                    {insight.metrics?.twoTeamMatchesSampled > 0 &&
                      insight.metrics?.closeGameRate != null && (
                        <p className="vex-insight-meta vex-insight-meta--pad">
                          Tight games (loser ≥85% of winner’s score):{' '}
                          {Math.round(insight.metrics.closeGameRate * 100)}% of{' '}
                          {insight.metrics.twoTeamMatchesSampled} two-team matches in the ledger.
                        </p>
                      )}

                    <div className="vex-insight-assets">
                      <h3 className="vex-insight-h3">Main assets at this ground</h3>
                      <ul className="vex-insight-asset-list">
                        {(insight.mainAssets?.batters || []).slice(0, 3).map((b) => (
                          <li key={`b-${b.playerId}`}>
                            <strong>{b.name}</strong>
                            <span className="vex-insight-asset-stat">{fmt(b.runs)} runs</span>
                            {b.role ? (
                              <span className="vex-insight-role">{b.role}</span>
                            ) : null}
                          </li>
                        ))}
                        {(insight.mainAssets?.bowlers || []).slice(0, 3).map((b) => (
                          <li key={b.playerId ? `w-${b.playerId}` : `w-${b.name}-${b.wickets}`}>
                            <strong>{b.name}</strong>
                            <span className="vex-insight-asset-stat">{fmt(b.wickets)} wkts</span>
                          </li>
                        ))}
                        {(insight.mainAssets?.allrounders || []).slice(0, 2).map((a) => (
                          <li key={`ar-${a.playerId}`}>
                            <strong>{a.name}</strong>
                            <span className="vex-insight-asset-stat">
                              {fmt(a.runs)}r · {fmt(a.wickets)}w
                            </span>
                            <span className="vex-insight-role">All-round</span>
                          </li>
                        ))}
                      </ul>
                      {(!insight.mainAssets?.batters?.length &&
                        !insight.mainAssets?.bowlers?.length &&
                        !insight.mainAssets?.allrounders?.length) && (
                        <p className="vex-muted">No player highlights yet — play more games here.</p>
                      )}
                    </div>

                    {insight.narratives?.aiMarkdown && (
                      <div className="vex-insight-narrative vex-insight-narrative--ai">
                        <h3 className="vex-insight-h3">
                          AI summary
                          {insight.narratives.aiProvider === 'gemini'
                            ? ' (Gemini)'
                            : insight.narratives.aiProvider === 'openai'
                              ? ' (OpenAI)'
                              : ''}
                        </h3>
                        <div className="vex-insight-md">{insight.narratives.aiMarkdown}</div>
                      </div>
                    )}
                    {insight.narratives?.aiError && (
                      <div className="vex-insight-soft-err">
                        {insight.narratives.aiErrorKind === 'quota' ? (
                          <>
                            <p className="vex-muted" style={{ margin: 0 }}>
                              <strong>
                                {insight.narratives.aiProvider === 'gemini'
                                  ? 'Gemini summary paused'
                                  : 'AI summary paused'}
                              </strong>
                              {' — '}
                              {insight.narratives.aiProvider === 'gemini'
                                ? 'often daily free-tier or project limits. Wait and retry, or confirm the key in '
                                : 'billing or usage limits. Check '}
                              <a
                                href={
                                  insight.narratives.aiProvider === 'gemini'
                                    ? 'https://aistudio.google.com/app/apikey'
                                    : 'https://platform.openai.com/account/billing'
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="vex-insight-link"
                              >
                                {insight.narratives.aiProvider === 'gemini'
                                  ? 'Google AI Studio'
                                  : 'OpenAI billing'}
                              </a>
                              . The rest of this panel is from your saved games only.
                            </p>
                            {insight.narratives.aiError && insight.narratives.aiError.length > 0 && (
                              <p className="vex-insight-err-detail">{insight.narratives.aiError}</p>
                            )}
                          </>
                        ) : (
                          <p className="vex-muted" style={{ margin: 0 }}>
                            AI summary unavailable — {insight.narratives.aiError}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="vex-insight-narrative">
                      <h3 className="vex-insight-h3">Numbers story</h3>
                      <div className="vex-insight-md">
                        {(insight.narratives?.heuristicMarkdown || '').split(/\n\n+/).map((para, i) => (
                          <p key={i}>{para.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </section>
            )}

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
                              <span className="vex-match-team-name">{s.teamName}</span>
                              {s.inningsOrder === 1 ? (
                                <span className="vex-inn-badge" title="First innings (from scorecard save)">
                                  1st
                                </span>
                              ) : s.inningsOrder === 2 ? (
                                <span className="vex-inn-badge vex-inn-badge--2" title="Second innings (from scorecard save)">
                                  2nd
                                </span>
                              ) : null}
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
              1st/2nd tags appear when you choose &quot;Who batted first?&quot; in OCR Extractor for that match; older saves may not show them.
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
