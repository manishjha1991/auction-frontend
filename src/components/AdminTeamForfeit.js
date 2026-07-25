import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../const';

const deriveAdminId = () => {
  try {
    const stored = JSON.parse(window.localStorage.getItem('user') || '{}');
    return stored?.id || stored?._id || null;
  } catch {
    return null;
  }
};

const colors = {
  text: '#0f172a',
  muted: '#475569',
  border: '#e2e8f0',
  bg: '#f8fafc',
  card: '#ffffff',
  blueBg: '#eff6ff',
  blueBorder: '#93c5fd',
  blueText: '#1e3a8a',
  orangeBg: '#fff7ed',
  orangeBorder: '#fdba74',
  orangeBadge: '#ea580c',
  greenBadge: '#15803d',
  greenBg: '#dcfce7',
};

const FixtureList = ({ title, items, emptyText, accent, itemColor }) => (
  <div
    style={{
      marginBottom: 12,
      padding: 12,
      borderRadius: 10,
      background: colors.bg,
      border: `1px solid ${accent || colors.border}`,
    }}
  >
    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: accent || colors.text }}>
      {title} ({items?.length || 0})
    </div>
    {!items?.length ? (
      <div style={{ fontSize: 12, color: colors.muted }}>{emptyText || 'None'}</div>
    ) : (
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.55, color: itemColor || colors.text }}>
        {items.map((f) => (
          <li key={String(f.fixtureId)} style={{ marginBottom: 6, color: itemColor || colors.text }}>
            <span style={{ fontWeight: 600, color: itemColor || colors.text }}>
              {f.team1} vs {f.team2}
              {f.opponent ? ` → ${f.opponent}` : ''}
            </span>
            {f.detail ? (
              <div style={{ fontSize: 11, color: itemColor ? '#166534' : colors.muted, opacity: 0.85 }}>
                {f.detail}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    )}
  </div>
);

const AdminTeamForfeit = () => {
  const [adminUserId] = useState(() => deriveAdminId());
  const user = (() => {
    try {
      return JSON.parse(window.localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState('');
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  /** Fixture IDs of manual losses to clear on Restore (no 0-run pattern) */
  const [manualClearIds, setManualClearIds] = useState(() => new Set());

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 5000);
  };

  const loadTeams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/participating-teams`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load teams');
      setTeams(data.teams || []);
    } catch (err) {
      showToast(err.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const loadPreview = async (team) => {
    if (!adminUserId || !team?.id) return;
    setSelected(team);
    setPreview(null);
    setManualClearIds(new Set());
    setPreviewLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/fixtures/forfeit-preview/${team.id}`, {
        headers: { 'user-id': adminUserId },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Preview failed');
      setPreview(data);
      // Only pre-select likely manual walkovers — never auto-clear real played losses (e.g. MSD Lions)
      const suggested = (data.suggestedManualClearIds || []).map(String);
      if (suggested.length) {
        setManualClearIds(new Set(suggested));
      } else if (
        (data.alreadyLostLikelyManual || []).length &&
        !(data.walkoverLossesToClearOnRestore || []).length
      ) {
        setManualClearIds(
          new Set((data.alreadyLostLikelyManual || []).map((f) => String(f.fixtureId)))
        );
      }
    } catch (err) {
      showToast(err.message || 'Preview failed');
      setSelected(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const toggleManualClear = (fixtureId) => {
    const id = String(fixtureId);
    setManualClearIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runForfeit = async () => {
    if (!selected?.id || !adminUserId) return;
    setConfirmAction(null);
    setBusyId(selected.id);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/fixtures/forfeit/${selected.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'user-id': adminUserId },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Forfeit failed');
      showToast(
        `Forfeit done for ${data.teamName}: ${data.winsReversed || 0} win(s) given away, ${data.walkovers || 0} walkover(s), ${data.mutualLeftUnplayed || 0} mutual left unplayed`
      );
      await loadTeams();
      await loadPreview({ ...selected, forfeitActive: true });
    } catch (err) {
      showToast(err.message || 'Forfeit failed');
      await loadTeams();
    } finally {
      setBusyId(null);
    }
  };

  const runRestore = async () => {
    if (!selected?.id || !adminUserId) return;
    setConfirmAction(null);
    setBusyId(selected.id);
    try {
      const res = await fetch(`${API_ENDPOINTS}/api/fixtures/restore/${selected.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'user-id': adminUserId },
        body: JSON.stringify({ clearFixtureIds: [...manualClearIds] }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Restore failed');
      showToast(data.message || `Restored ${data.teamName}`);
      await loadTeams();
      await loadPreview({ ...selected, forfeitActive: false });
    } catch (err) {
      showToast(err.message || 'Restore failed');
      await loadTeams();
    } finally {
      setBusyId(null);
    }
  };

  if (!user?.isAdmin) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <div
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '16px 14px 48px',
        minHeight: '100vh',
        boxSizing: 'border-box',
        background: colors.bg,
        color: colors.text,
      }}
    >
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 16,
            left: 16,
            right: 16,
            zIndex: 9999,
            padding: '12px 14px',
            borderRadius: 10,
            background: '#0f172a',
            color: '#fff',
            fontSize: 14,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          }}
        >
          {toast}
        </div>
      )}

      <header style={{ marginBottom: 20 }}>
        <h1
          style={{
            margin: '0 0 8px',
            fontSize: 'clamp(1.35rem, 4vw, 1.75rem)',
            color: colors.text,
            fontWeight: 800,
          }}
        >
          Team Forfeit / Restore
        </h1>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: colors.muted }}>
          Use this page when a team stops mid-season (or comes back). Do not edit walkovers one-by-one
          on Fixtures — walkovers are saved as <strong style={{ color: colors.text }}>0 runs</strong> so
          Restore can find them.
        </p>
      </header>

      <section
        style={{
          marginBottom: 20,
          padding: 14,
          borderRadius: 12,
          background: colors.blueBg,
          border: `1px solid ${colors.blueBorder}`,
          fontSize: 13,
          lineHeight: 1.6,
          color: colors.blueText,
        }}
      >
        <strong style={{ display: 'block', marginBottom: 8, color: colors.text }}>
          How it works (example: Royals)
        </strong>
        <ol style={{ margin: 0, paddingLeft: 18, color: colors.text }}>
          <li style={{ marginBottom: 6 }}>
            <strong>Forfeit</strong> — remaining games → opponent wins (0-run walkover). Games Royals
            already <em>won</em> → given to opponent. Real losses (e.g. vs MSD Lions) stay.
          </li>
          <li style={{ marginBottom: 6 }}>
            <strong>Both forfeiting</strong> (Royals + Apex) — their H2H stays <em>not played</em>.
          </li>
          <li>
            <strong>Restore</strong> — walkovers back to not played; points undone for those only;
            real losses kept; prior real wins put back. Opponents lose only walkover wins, not real wins.
          </li>
        </ol>
      </section>

      {loading ? (
        <div style={{ padding: 24, textAlign: 'center', color: colors.muted }}>Loading teams…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {teams.map((team) => {
            const active = !!team.forfeitActive;
            const isSelected = selected?.id === team.id;
            return (
              <button
                key={team.id}
                type="button"
                onClick={() => loadPreview(team)}
                style={{
                  textAlign: 'left',
                  padding: '14px 14px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  border: isSelected
                    ? '2px solid #2563eb'
                    : active
                    ? `1px solid ${colors.orangeBorder}`
                    : `1px solid ${colors.border}`,
                  background: active ? colors.orangeBg : colors.card,
                  color: colors.text,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  minHeight: 52,
                  boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: colors.text }}>
                    {team.teamName || team.name}
                  </div>
                  {team.abbreviation && (
                    <div style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                      {team.abbreviation}
                    </div>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '5px 9px',
                    borderRadius: 6,
                    background: active ? '#ffedd5' : colors.greenBg,
                    color: active ? colors.orangeBadge : colors.greenBadge,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {active ? 'FORFEITED' : 'Active'}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <section
          style={{
            marginTop: 22,
            padding: 16,
            borderRadius: 14,
            background: colors.card,
            border: `1px solid ${colors.border}`,
            boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
          }}
        >
          <h2 style={{ margin: '0 0 6px', fontSize: 18, color: colors.text }}>
            {selected.teamName || selected.name}
          </h2>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: colors.muted }}>
            Review the lists, then use one button.
          </p>

          {previewLoading && (
            <div style={{ padding: 16, color: colors.muted }}>Loading preview…</div>
          )}

          {preview && !previewLoading && (
            <>
              <FixtureList
                title="Real played losses — keep (will NOT clear)"
                items={preview.alreadyLostReal || []}
                emptyText="No real played losses detected"
                accent="#15803d"
                itemColor="#166534"
              />

              {((preview.alreadyLostLikelyManual || []).length > 0 ||
                (preview.alreadyLostReal || []).length > 0) && (
                <div
                  style={{
                    marginBottom: 12,
                    padding: 12,
                    borderRadius: 10,
                    background: '#fff7ed',
                    border: '1px solid #fdba74',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: '#c2410c' }}>
                    Likely manual walkovers — clear on Restore ({manualClearIds.size} selected)
                  </div>
                  <p style={{ margin: '0 0 10px', fontSize: 12, color: colors.muted, lineHeight: 1.5 }}>
                    Real played losses (MoM / fairness / real overs) stay. Only losses that look like
                    admin bulk updates are selected. Going forward use this page&apos;s Forfeit button
                    (0-run flag) so this is automatic.
                  </p>
                  {(preview.alreadyLostLikelyManual || []).length > 0 && (
                    <>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() =>
                            setManualClearIds(
                              new Set(
                                (preview.alreadyLostLikelyManual || []).map((f) =>
                                  String(f.fixtureId)
                                )
                              )
                            )
                          }
                          style={{
                            fontSize: 12,
                            padding: '6px 10px',
                            borderRadius: 6,
                            border: `1px solid ${colors.border}`,
                            background: '#fff',
                            cursor: 'pointer',
                          }}
                        >
                          Select suggested
                        </button>
                        <button
                          type="button"
                          onClick={() => setManualClearIds(new Set())}
                          style={{
                            fontSize: 12,
                            padding: '6px 10px',
                            borderRadius: 6,
                            border: `1px solid ${colors.border}`,
                            background: '#fff',
                            cursor: 'pointer',
                          }}
                        >
                          Clear selection
                        </button>
                      </div>
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                        {(preview.alreadyLostLikelyManual || []).map((f) => {
                          const id = String(f.fixtureId);
                          const checked = manualClearIds.has(id);
                          return (
                            <li key={id} style={{ marginBottom: 8 }}>
                              <label
                                style={{
                                  display: 'flex',
                                  gap: 10,
                                  alignItems: 'flex-start',
                                  cursor: 'pointer',
                                  fontSize: 13,
                                  color: colors.text,
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleManualClear(id)}
                                  style={{ marginTop: 3, width: 18, height: 18 }}
                                />
                                <span>
                                  {f.team1} vs {f.team2}
                                  <span style={{ color: colors.muted }}>
                                    {' '}
                                    → {f.opponent || 'opponent'}
                                  </span>
                                  {checked ? (
                                    <span style={{ color: '#c2410c', fontWeight: 600 }}>
                                      {' '}
                                      (will clear)
                                    </span>
                                  ) : (
                                    <span style={{ color: '#15803d', fontWeight: 600 }}>
                                      {' '}
                                      (keep loss)
                                    </span>
                                  )}
                                  {f.detail && (
                                    <div style={{ fontSize: 11, color: colors.muted }}>{f.detail}</div>
                                  )}
                                </span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}
                  {(preview.alreadyLostLikelyManual || []).length === 0 && (
                    <div style={{ fontSize: 12, color: colors.muted }}>
                      No legacy manual walkovers detected — only real losses / tool walkovers.
                    </div>
                  )}
                </div>
              )}

              <FixtureList
                title="Auto walkover losses (0-run flag) — Restore clears these"
                items={
                  preview.forfeitActive
                    ? preview.alreadyLostWalkover || preview.walkoverLossesToClearOnRestore || []
                    : preview.walkoverLossesToClearOnRestore || preview.alreadyLostWalkover || []
                }
                emptyText="None with 0-run / walkover margin yet (use Forfeit button next time)"
                accent="#c2410c"
              />
              <FixtureList
                title="Wins to give away on Forfeit"
                items={preview.winsToReverse || []}
                emptyText="No wins to reverse"
                accent="#b91c1c"
              />
              <FixtureList
                title="Unplayed → walkover to opponent on Forfeit"
                items={preview.remainingWalkovers || []}
                emptyText="No remaining fixtures"
                accent="#be123c"
              />
              <FixtureList
                title="Both teams forfeiting — leave not played"
                items={preview.mutualUnplayed || []}
                emptyText="No mutual forfeit fixtures"
                accent="#1d4ed8"
              />

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  marginTop: 16,
                }}
              >
                {!preview.forfeitActive ? (
                  <button
                    type="button"
                    disabled={!!busyId || !adminUserId}
                    onClick={() => setConfirmAction('forfeit')}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      fontSize: 15,
                      fontWeight: 700,
                      minHeight: 48,
                      borderRadius: 10,
                      border: 'none',
                      background: '#dc2626',
                      color: '#fff',
                      cursor: busyId ? 'wait' : 'pointer',
                    }}
                  >
                    {busyId === selected.id ? 'Working…' : 'Forfeit remaining season'}
                  </button>
                ) : null}

                {(preview.canRestore ||
                  preview.forfeitActive ||
                  manualClearIds.size > 0) && (
                  <button
                    type="button"
                    disabled={!!busyId || !adminUserId}
                    onClick={() => setConfirmAction('restore')}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      fontSize: 15,
                      fontWeight: 700,
                      minHeight: 48,
                      borderRadius: 10,
                      border: 'none',
                      background: '#2563eb',
                      color: '#fff',
                      cursor: busyId ? 'wait' : 'pointer',
                    }}
                  >
                    {busyId === selected.id
                      ? 'Working…'
                      : `Restore — play again${
                          manualClearIds.size ? ` (${manualClearIds.size} clear)` : ''
                        }`}
                  </button>
                )}
              </div>
            </>
          )}
        </section>
      )}

      {confirmAction && selected && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.55)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 10000,
            padding: 16,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              background: '#fff',
              borderRadius: 16,
              padding: 20,
              border: `1px solid ${colors.border}`,
              color: colors.text,
            }}
          >
            <h3 style={{ margin: '0 0 10px', fontSize: 18, color: colors.text }}>
              {confirmAction === 'forfeit' ? 'Confirm forfeit?' : 'Confirm restore?'}
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 14, lineHeight: 1.55, color: colors.muted }}>
              {confirmAction === 'forfeit' ? (
                <>
                  <strong style={{ color: colors.text }}>{selected.teamName || selected.name}</strong>:
                  give remaining games (and prior wins) to opponents as 0-run walkovers. Real losses
                  stay. Points table updates automatically.
                </>
              ) : (
                <>
                  <strong style={{ color: colors.text }}>{selected.teamName || selected.name}</strong>:
                  clear selected manual walkovers + auto 0-run walkovers back to not played.
                  Unchecked losses stay. Points table updates for cleared games only.
                  {manualClearIds.size > 0 && (
                    <>
                      <br />
                      <br />
                      <strong style={{ color: colors.text }}>
                        {manualClearIds.size} manual loss(es) selected to clear.
                      </strong>
                    </>
                  )}
                </>
              )}
            </p>
            <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
              <button
                type="button"
                onClick={confirmAction === 'forfeit' ? runForfeit : runRestore}
                style={{
                  width: '100%',
                  padding: 14,
                  minHeight: 48,
                  fontWeight: 700,
                  borderRadius: 10,
                  border: 'none',
                  background: confirmAction === 'forfeit' ? '#dc2626' : '#2563eb',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Yes, {confirmAction === 'forfeit' ? 'forfeit' : 'restore'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                style={{
                  width: '100%',
                  padding: 14,
                  minHeight: 48,
                  borderRadius: 10,
                  border: `1px solid ${colors.border}`,
                  background: colors.bg,
                  color: colors.text,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTeamForfeit;
