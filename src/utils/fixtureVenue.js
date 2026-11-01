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
 */
export function fixtureVenueText(fixture, homeGround1, homeGround2) {
  if (!fixture) return '';
  if (isOpenSlot(fixture.team1) || isOpenSlot(fixture.team2)) return '';

  const played = Boolean(String(fixture.winner || '').trim());
  const toss = String(fixture.tossWinner || '').trim();
  const groundFor = (name) => {
    if (sameName(name, fixture.team1)) return String(homeGround1 || '').trim();
    if (sameName(name, fixture.team2)) return String(homeGround2 || '').trim();
    return '';
  };

  if (played) {
    const ground = groundFor(toss);
    return ground ? `Match played at ${ground}` : '';
  }

  if (toss) {
    const ground = groundFor(toss);
    return ground
      ? `Match will be played at ${ground} — ${toss}'s home ground`
      : `${toss} won the toss — home ground not set yet`;
  }

  const left = homeGround1
    ? `${fixture.team1}: ${homeGround1}`
    : `${fixture.team1}: home ground not set`;
  const right = homeGround2
    ? `${fixture.team2}: ${homeGround2}`
    : `${fixture.team2}: home ground not set`;
  return `${left}  ·  ${right}`;
}
