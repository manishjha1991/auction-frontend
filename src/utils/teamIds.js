export function idStr(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'object') {
    if (value._id) return String(value._id);
    return '';
  }
  return String(value);
}

export function idsEqual(a, b) {
  const x = idStr(a);
  const y = idStr(b);
  return Boolean(x && y && x === y);
}

export function team1Won(fixture) {
  if (!fixture) return false;
  if (fixture.winnerUserId && fixture.team1UserId) {
    return idsEqual(fixture.winnerUserId, fixture.team1UserId);
  }
  return Boolean(fixture.winner && fixture.winner === fixture.team1);
}

export function team2Won(fixture) {
  if (!fixture) return false;
  if (fixture.winnerUserId && fixture.team2UserId) {
    return idsEqual(fixture.winnerUserId, fixture.team2UserId);
  }
  return Boolean(fixture.winner && fixture.winner === fixture.team2);
}

export function winnerSelectValue(fixture) {
  if (!fixture) return '';
  if (fixture.winnerUserId) return idStr(fixture.winnerUserId);
  if (team1Won(fixture)) return idStr(fixture.team1UserId);
  if (team2Won(fixture)) return idStr(fixture.team2UserId);
  return '';
}

export function userOnTeam1(fixture, userId) {
  return idsEqual(userId, fixture?.team1UserId);
}
