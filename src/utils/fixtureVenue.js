function sameName(a, b) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
}

function isOpenSlot(name) {
  const s = String(name || '').trim();
  if (!s || /^(tba|tbd|na|n\/a)$/i.test(s)) return true;
  if (/winner of|loser of|^top \d+$/i.test(s)) return true;
  return false;
}

export function homeGroundForTeam(teams, teamName) {
  const want = String(teamName || '').trim().toLowerCase();
  if (!want || isOpenSlot(teamName)) return '';
  const hit = (teams || []).find((t) => {
    const names = [t?.teamName, t?.originalTeamName, t?.abbreviation, t?.name]
      .map((n) => String(n || '').trim().toLowerCase())
      .filter(Boolean);
    return names.includes(want);
  });
  return hit?.homeGround || '';
}

/**
 * Before a result: both home grounds.
 * After the toss: the toss winner's home ground.
 * After the fixture is updated: the ground the match was played on.
 * @returns {null | { mode: 'played' | 'toss' | 'homes', items: { ground: string, team?: string, caption?: string, unset?: boolean }[] }}
 */
export function fixtureVenueParts(fixture, homeGround1, homeGround2) {
  if (!fixture) return null;
  if (isOpenSlot(fixture.team1) || isOpenSlot(fixture.team2)) return null;

  const played = Boolean(String(fixture.winner || '').trim());
  const toss = String(fixture.tossWinner || '').trim();
  const groundFor = (name) => {
    if (sameName(name, fixture.team1)) return String(homeGround1 || '').trim();
    if (sameName(name, fixture.team2)) return String(homeGround2 || '').trim();
    return '';
  };

  if (played) {
    const ground = groundFor(toss);
    if (!ground) return null;
    return { mode: 'played', items: [{ ground, caption: 'Played at' }] };
  }

  if (toss) {
    const ground = groundFor(toss);
    if (!ground) return { mode: 'toss', items: [{ ground: 'Home ground not set', unset: true }] };
    return { mode: 'toss', items: [{ ground }] };
  }

  return {
    mode: 'homes',
    items: [
      { team: fixture.team1, ground: homeGround1 || 'Not set', unset: !homeGround1 },
      { team: fixture.team2, ground: homeGround2 || 'Not set', unset: !homeGround2 },
    ],
  };
}

export function fixtureVenueText(fixture, homeGround1, homeGround2) {
  const view = fixtureVenueParts(fixture, homeGround1, homeGround2);
  if (!view) return '';
  if (view.mode === 'played') return `Match played at ${view.items[0].ground}`;
  if (view.mode === 'toss') return view.items[0].ground;
  return view.items
    .map((item) => `${item.team}: ${item.unset ? 'home ground not set' : item.ground}`)
    .join('  ·  ');
}
