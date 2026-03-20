import React, { useCallback, useEffect, useState } from 'react';
import { FaExchangeAlt, FaHandPaper, FaPlusCircle, FaShieldAlt } from 'react-icons/fa';
import { API_ENDPOINTS } from '../const';
import '../css/AdminRosterTools.css';

function Modal({ title, children, onClose, footer }) {
  if (!title && !children) return null;
  return (
    <div className="admin-roster-modal-overlay" role="dialog" aria-modal="true">
      <div className="admin-roster-modal">
        <div className="admin-roster-modal-head">
          <h3>{title}</h3>
          <button type="button" className="admin-roster-modal-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="admin-roster-modal-body">{children}</div>
        {footer && <div className="admin-roster-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export default function AdminRosterTools() {
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  /* Trade */
  const [tTeamA, setTTeamA] = useState('');
  const [tTeamB, setTTeamB] = useState('');
  const [tPlayersA, setTPlayersA] = useState([]);
  const [tPlayersB, setTPlayersB] = useState([]);
  const [tPlayerA, setTPlayerA] = useState('');
  const [tPlayerB, setTPlayerB] = useState('');
  const [tradePreview, setTradePreview] = useState(null);
  const [tradeBusy, setTradeBusy] = useState(false);

  /* Pick */
  const [pTeam, setPTeam] = useState('');
  const [unsoldSearch, setUnsoldSearch] = useState('');
  const [unsoldList, setUnsoldList] = useState([]);
  const [pPlayer, setPPlayer] = useState('');
  const [pickPreview, setPickPreview] = useState(null);
  const [pickBusy, setPickBusy] = useState(false);

  /* Release */
  const [rTeam, setRTeam] = useState('');
  const [rPlayers, setRPlayers] = useState([]);
  const [rPlayer, setRPlayer] = useState('');
  const [releasePreview, setReleasePreview] = useState(null);
  const [releaseBusy, setReleaseBusy] = useState(false);

  const [resultModal, setResultModal] = useState(null);
  const [activeTab, setActiveTab] = useState('trade');

  const adminId = user?._id || user?.id;

  const loadTeams = useCallback(async () => {
    if (!adminId) return;
    setLoadingTeams(true);
    try {
      const r = await fetch(`${API_ENDPOINTS}/api/admin/roster/teams?adminUserId=${adminId}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || 'Failed to load teams');
      setTeams(j || []);
    } catch (e) {
      setResultModal({ title: 'Error', message: e.message, type: 'error' });
    } finally {
      setLoadingTeams(false);
    }
  }, [adminId]);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (raw) setUser(JSON.parse(raw));
  }, []);

  useEffect(() => {
    if (user?.isAdmin && adminId) loadTeams();
  }, [user, adminId, loadTeams]);

  const loadRoster = async (teamId, which) => {
    if (!adminId || !teamId) return;
    const r = await fetch(
      `${API_ENDPOINTS}/api/admin/roster/team/${teamId}/players?adminUserId=${adminId}`,
    );
    const j = await r.json();
    if (!r.ok) throw new Error(j.message || 'Roster load failed');
    if (which === 'A') setTPlayersA(j);
    if (which === 'B') setTPlayersB(j);
    if (which === 'R') setRPlayers(j);
  };

  useEffect(() => {
    if (!tTeamA || !adminId) {
      setTPlayersA([]);
      setTPlayerA('');
      return;
    }
    loadRoster(tTeamA, 'A').catch((e) => setResultModal({ title: 'Error', message: e.message, type: 'error' }));
  }, [tTeamA, adminId]);

  useEffect(() => {
    if (!tTeamB || !adminId) {
      setTPlayersB([]);
      setTPlayerB('');
      return;
    }
    loadRoster(tTeamB, 'B').catch((e) => setResultModal({ title: 'Error', message: e.message, type: 'error' }));
  }, [tTeamB, adminId]);

  useEffect(() => {
    if (!rTeam || !adminId) {
      setRPlayers([]);
      setRPlayer('');
      return;
    }
    loadRoster(rTeam, 'R').catch((e) => setResultModal({ title: 'Error', message: e.message, type: 'error' }));
  }, [rTeam, adminId]);

  const loadUnsold = async () => {
    if (!adminId) return;
    const q = new URLSearchParams({ adminUserId: adminId, search: unsoldSearch });
    const r = await fetch(`${API_ENDPOINTS}/api/admin/roster/unsold?${q}`);
    const j = await r.json();
    if (!r.ok) throw new Error(j.message || 'Unsold load failed');
    setUnsoldList(j.items || []);
  };

  useEffect(() => {
    if (activeTab === 'pick' && adminId) {
      const t = setTimeout(() => {
        loadUnsold().catch((e) => setResultModal({ title: 'Error', message: e.message, type: 'error' }));
      }, 300);
      return () => clearTimeout(t);
    }
  }, [activeTab, unsoldSearch, adminId]);

  const postJson = async (path, body) => {
    const r = await fetch(`${API_ENDPOINTS}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, adminUserId: adminId }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.message || 'Request failed');
    return j;
  };

  const runTradePreview = async () => {
    if (!tPlayerA || !tPlayerB) {
      setResultModal({ title: 'Select players', message: 'Choose one player from each team.', type: 'warning' });
      return;
    }
    setTradeBusy(true);
    try {
      const j = await postJson('/api/admin/roster/trade/preview', {
        player1Id: tPlayerA,
        player2Id: tPlayerB,
      });
      setTradePreview(j);
    } catch (e) {
      setResultModal({ title: 'Preview failed', message: e.message, type: 'error' });
    } finally {
      setTradeBusy(false);
    }
  };

  const runTradeExecute = async () => {
    setTradeBusy(true);
    try {
      const j = await postJson('/api/admin/roster/trade/execute', {
        player1Id: tPlayerA,
        player2Id: tPlayerB,
      });
      setTradePreview(null);
      setResultModal({
        title: 'Trade completed',
        message: `${j.team1?.name}: purse ₹${j.team1?.purseAfterCr} Cr\n${j.team2?.name}: purse ₹${j.team2?.purseAfterCr} Cr\nOther pending trades auto-rejected: ${j.otherTradeRequestsRejected ?? 0}`,
        type: 'success',
      });
      loadTeams();
      if (tTeamA) loadRoster(tTeamA, 'A');
      if (tTeamB) loadRoster(tTeamB, 'B');
      setTPlayerA('');
      setTPlayerB('');
    } catch (e) {
      setResultModal({ title: 'Trade failed', message: e.message, type: 'error' });
    } finally {
      setTradeBusy(false);
    }
  };

  const runPickPreview = async () => {
    if (!pTeam || !pPlayer) {
      setResultModal({ title: 'Missing', message: 'Select team and player.', type: 'warning' });
      return;
    }
    setPickBusy(true);
    try {
      const j = await postJson('/api/admin/roster/pick/preview', {
        teamUserId: pTeam,
        playerId: pPlayer,
      });
      setPickPreview(j);
    } catch (e) {
      setResultModal({ title: 'Preview failed', message: e.message, type: 'error' });
    } finally {
      setPickBusy(false);
    }
  };

  const runPickExecute = async () => {
    setPickBusy(true);
    try {
      const j = await postJson('/api/admin/roster/pick/execute', {
        teamUserId: pTeam,
        playerId: pPlayer,
      });
      setPickPreview(null);
      setResultModal({
        title: 'Pick completed',
        message: `${j.team?.name} signed ${j.player?.name} for ₹${j.player?.costCr} Cr. Purse now ₹${j.team?.purseAfterCr} Cr.`,
        type: 'success',
      });
      loadTeams();
      loadUnsold();
      setPPlayer('');
    } catch (e) {
      setResultModal({ title: 'Pick failed', message: e.message, type: 'error' });
    } finally {
      setPickBusy(false);
    }
  };

  const runReleasePreview = async () => {
    if (!rTeam || !rPlayer) {
      setResultModal({ title: 'Missing', message: 'Select team and player.', type: 'warning' });
      return;
    }
    setReleaseBusy(true);
    try {
      const j = await postJson('/api/admin/roster/release/preview', {
        teamUserId: rTeam,
        playerId: rPlayer,
      });
      setReleasePreview(j);
    } catch (e) {
      setResultModal({ title: 'Preview failed', message: e.message, type: 'error' });
    } finally {
      setReleaseBusy(false);
    }
  };

  const runReleaseExecute = async () => {
    setReleaseBusy(true);
    try {
      const j = await postJson('/api/admin/roster/release/execute', {
        teamUserId: rTeam,
        playerId: rPlayer,
      });
      setReleasePreview(null);
      setResultModal({
        title: 'Release completed',
        message: `${j.team?.name} released player. Refunded ₹${j.refundedCr} Cr. Purse now ₹${j.team?.purseAfterCr} Cr.`,
        type: 'success',
      });
      loadTeams();
      if (rTeam) loadRoster(rTeam, 'R');
      setRPlayer('');
    } catch (e) {
      setResultModal({ title: 'Release failed', message: e.message, type: 'error' });
    } finally {
      setReleaseBusy(false);
    }
  };

  if (!user) return <div className="admin-roster-page">Loading…</div>;
  if (!user.isAdmin) {
    return (
      <div className="admin-roster-page">
        <p>Admins only.</p>
      </div>
    );
  }

  return (
    <div className="admin-roster-page">
      <header className="admin-roster-header">
        <FaShieldAlt className="admin-roster-crown" />
        <div>
          <h1>Roster tools (commissioner)</h1>
          <p>
            <strong>Player trade:</strong> Same purse swap, type limits, 48h lock, and auto-reject of conflicting
            pending trades as Admin Trades — but <strong>no</strong> <code>tradesUsed</code> limit or increment
            (commissioner bypass). Skips trade request + opponent steps. Pick / release are separate.
          </p>
        </div>
      </header>

      <div className="admin-roster-tabs">
        <button
          type="button"
          className={activeTab === 'trade' ? 'active' : ''}
          onClick={() => setActiveTab('trade')}
        >
          <FaExchangeAlt /> Player trade
        </button>
        <button
          type="button"
          className={activeTab === 'pick' ? 'active' : ''}
          onClick={() => setActiveTab('pick')}
        >
          <FaPlusCircle /> Pick unsold
        </button>
        <button
          type="button"
          className={activeTab === 'release' ? 'active' : ''}
          onClick={() => setActiveTab('release')}
        >
          <FaHandPaper /> Release
        </button>
      </div>

      {loadingTeams && <p className="admin-roster-muted">Loading teams…</p>}

      {activeTab === 'trade' && (
        <section className="admin-roster-card">
          <h2>Swap two players (different teams)</h2>
          <p className="admin-roster-hint">
            Same swap, purse, type limits, 48h lock, and auto-reject as Admin Trades — without trade-quota checks.
          </p>
          <div className="admin-roster-grid2">
            <div>
              <label>Team A</label>
              <select value={tTeamA} onChange={(e) => setTTeamA(e.target.value)}>
                <option value="">— Select —</option>
                {teams.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.teamName || t.abbreviation} (₹{t.purseCr} Cr)
                  </option>
                ))}
              </select>
              <label>Player from team A</label>
              <select value={tPlayerA} onChange={(e) => setTPlayerA(e.target.value)}>
                <option value="">— Select —</option>
                {tPlayersA.map((p) => (
                  <option key={p.playerId} value={p.playerId}>
                    {p.name} ({p.type}) — ₹{p.bidValueCr} Cr
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Team B</label>
              <select value={tTeamB} onChange={(e) => setTTeamB(e.target.value)}>
                <option value="">— Select —</option>
                {teams.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.teamName || t.abbreviation} (₹{t.purseCr} Cr)
                  </option>
                ))}
              </select>
              <label>Player from team B</label>
              <select value={tPlayerB} onChange={(e) => setTPlayerB(e.target.value)}>
                <option value="">— Select —</option>
                {tPlayersB.map((p) => (
                  <option key={p.playerId} value={p.playerId}>
                    {p.name} ({p.type}) — ₹{p.bidValueCr} Cr
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="button" className="admin-roster-btn primary" onClick={runTradePreview} disabled={tradeBusy}>
            Preview trade
          </button>
        </section>
      )}

      {activeTab === 'pick' && (
        <section className="admin-roster-card">
          <h2>Assign unsold player to a team</h2>
          <p className="admin-roster-hint">Cost = player base price. Purse must cover it; roster type limits apply.</p>
          <label>Team</label>
          <select value={pTeam} onChange={(e) => setPTeam(e.target.value)}>
            <option value="">— Select —</option>
            {teams.map((t) => (
              <option key={t._id} value={t._id}>
                {t.teamName || t.abbreviation} (₹{t.purseCr} Cr)
              </option>
            ))}
          </select>
          <label>Search unsold</label>
          <input
            type="search"
            value={unsoldSearch}
            onChange={(e) => setUnsoldSearch(e.target.value)}
            placeholder="Player name…"
          />
          <label>Unsold player</label>
          <select value={pPlayer} onChange={(e) => setPPlayer(e.target.value)}>
            <option value="">— Select —</option>
            {unsoldList.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.type}) — base ₹{p.basePriceCr} Cr
              </option>
            ))}
          </select>
          <button type="button" className="admin-roster-btn primary" onClick={runPickPreview} disabled={pickBusy}>
            Preview pick
          </button>
        </section>
      )}

      {activeTab === 'release' && (
        <section className="admin-roster-card">
          <h2>Release player back to unsold</h2>
          <p className="admin-roster-hint">Refund = recorded salary (bid value). Player becomes unsold; 48h pick block applies.</p>
          <label>Team</label>
          <select value={rTeam} onChange={(e) => setRTeam(e.target.value)}>
            <option value="">— Select —</option>
            {teams.map((t) => (
              <option key={t._id} value={t._id}>
                {t.teamName || t.abbreviation}
              </option>
            ))}
          </select>
          <label>Player</label>
          <select value={rPlayer} onChange={(e) => setRPlayer(e.target.value)}>
            <option value="">— Select —</option>
            {rPlayers.map((p) => (
              <option key={p.playerId} value={p.playerId}>
                {p.name} ({p.type}) — ₹{p.bidValueCr} Cr
              </option>
            ))}
          </select>
          <button type="button" className="admin-roster-btn primary" onClick={runReleasePreview} disabled={releaseBusy}>
            Preview release
          </button>
        </section>
      )}

      {tradePreview && (
        <Modal
          title="Confirm trade"
          onClose={() => setTradePreview(null)}
          footer={
            <>
              <button type="button" className="admin-roster-btn ghost" onClick={() => setTradePreview(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="admin-roster-btn primary"
                onClick={runTradeExecute}
                disabled={!tradePreview.ok || tradeBusy}
              >
                Confirm trade
              </button>
            </>
          }
        >
          {!tradePreview.ok && (
            <div className="admin-roster-errors">
              {tradePreview.errors?.map((err, i) => (
                <p key={i}>{err}</p>
              ))}
            </div>
          )}
          <div className="admin-roster-summary">
            <div>
              <strong>{tradePreview.team1?.name}</strong>
              <p>
                Sends: {tradePreview.team1?.playerOut?.name} (₹{tradePreview.team1?.playerOut?.salaryCr} Cr)
              </p>
              <p>
                Receives: {tradePreview.team1?.playerIn?.name} (₹{tradePreview.team1?.playerIn?.salaryCr} Cr)
              </p>
              <p>
                Purse: ₹{tradePreview.team1?.purseBeforeCr} Cr → ₹{tradePreview.team1?.purseAfterCr} Cr (
                {tradePreview.team1?.purseDeltaCr >= 0 ? '+' : ''}
                {tradePreview.team1?.purseDeltaCr} Cr)
              </p>
            </div>
            <div>
              <strong>{tradePreview.team2?.name}</strong>
              <p>
                Sends: {tradePreview.team2?.playerOut?.name} (₹{tradePreview.team2?.playerOut?.salaryCr} Cr)
              </p>
              <p>
                Receives: {tradePreview.team2?.playerIn?.name} (₹{tradePreview.team2?.playerIn?.salaryCr} Cr)
              </p>
              <p>
                Purse: ₹{tradePreview.team2?.purseBeforeCr} Cr → ₹{tradePreview.team2?.purseAfterCr} Cr (
                {tradePreview.team2?.purseDeltaCr >= 0 ? '+' : ''}
                {tradePreview.team2?.purseDeltaCr} Cr)
              </p>
            </div>
          </div>
          <p className="admin-roster-small">
            48h trade lock and conflicting trade requests rejected (same as Admin Trades). No tradesUsed change.
          </p>
        </Modal>
      )}

      {pickPreview && (
        <Modal
          title="Confirm pick"
          onClose={() => setPickPreview(null)}
          footer={
            <>
              <button type="button" className="admin-roster-btn ghost" onClick={() => setPickPreview(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="admin-roster-btn primary"
                onClick={runPickExecute}
                disabled={!pickPreview.ok || pickBusy}
              >
                Confirm pick
              </button>
            </>
          }
        >
          {!pickPreview.ok && (
            <div className="admin-roster-errors">
              {pickPreview.errors?.map((err, i) => (
                <p key={i}>{err}</p>
              ))}
            </div>
          )}
          <p>
            <strong>{pickPreview.team?.name}</strong> signs <strong>{pickPreview.player?.name}</strong> ({pickPreview.player?.type})
          </p>
          <p>
            Cost: ₹{pickPreview.costCr} Cr · Purse ₹{pickPreview.purseBeforeCr} Cr → ₹{pickPreview.purseAfterCr} Cr
          </p>
        </Modal>
      )}

      {releasePreview && (
        <Modal
          title="Confirm release"
          onClose={() => setReleasePreview(null)}
          footer={
            <>
              <button type="button" className="admin-roster-btn ghost" onClick={() => setReleasePreview(null)}>
                Cancel
              </button>
              <button type="button" className="admin-roster-btn danger" onClick={runReleaseExecute} disabled={releaseBusy}>
                Confirm release
              </button>
            </>
          }
        >
          <p>
            <strong>{releasePreview.team?.name}</strong> releases <strong>{releasePreview.player?.name}</strong>
          </p>
          <p>
            Refund: ₹{releasePreview.refundCr} Cr · Purse ₹{releasePreview.purseBeforeCr} Cr → ₹{releasePreview.purseAfterCr}{' '}
            Cr
          </p>
          {releasePreview.warnings?.length > 0 && (
            <div className="admin-roster-warn">
              {releasePreview.warnings.map((w, i) => (
                <p key={i}>{w}</p>
              ))}
            </div>
          )}
        </Modal>
      )}

      {resultModal && (
        <Modal
          title={resultModal.title}
          onClose={() => setResultModal(null)}
          footer={
            <button type="button" className="admin-roster-btn primary" onClick={() => setResultModal(null)}>
              OK
            </button>
          }
        >
          <pre className="admin-roster-pre">{resultModal.message}</pre>
        </Modal>
      )}
    </div>
  );
}
