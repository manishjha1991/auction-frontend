/**
 * Parse Cricket 22/24 end-of-match summary OCR text into fixture fields.
 */

const normalizeLine = (line = '') => line.trim().replace(/\s+/g, ' ');

const titleCase = (value = '') =>
  value
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .trim();

export const getTeamAbbreviation = (teamName = '') => {
  if (!teamName) return '';
  const words = teamName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join('').toUpperCase();
};

export const normalizeTeamKey = (value = '') =>
  value.replace(/[^a-z0-9]/gi, '').toLowerCase();

const teamMatchScore = (raw = '', candidate = '') => {
  if (!raw || !candidate) return 0;
  const key = normalizeTeamKey(raw);
  const ck = normalizeTeamKey(candidate);
  if (!key || !ck) return 0;
  if (key === ck) return 100;
  if (getTeamAbbreviation(candidate).toLowerCase() === raw.trim().toLowerCase()) return 90;
  if (getTeamAbbreviation(candidate).toLowerCase() === key) return 90;
  // Require meaningful length for partial match (avoid "bl" matching random strings)
  if (key.length >= 4 && (ck.includes(key) || key.includes(ck))) return 70;
  if (key.length >= 3 && ck.length >= 4 && (ck.startsWith(key) || key.startsWith(ck))) return 60;
  const rawWords = raw.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const cWords = candidate.toLowerCase().split(/\s+/).filter(Boolean);
  if (rawWords.length >= 2 && rawWords.every((w) => cWords.some((cw) => cw === w || cw.startsWith(w)))) {
    return 80;
  }
  return 0;
};

/** Fuzzy-match OCR team text to a fixture team name. */
export const matchTeamName = (raw = '', candidates = []) => {
  if (!raw || !candidates.length) return '';
  let best = '';
  let bestScore = 0;
  candidates.forEach((c) => {
    const s = teamMatchScore(raw, c);
    if (s > bestScore) {
      bestScore = s;
      best = c;
    }
  });
  return bestScore >= 60 ? best : '';
};

const parseBattingLine = (line = '') => {
  const trimmed = normalizeLine(line);
  if (!trimmed || /^(runs|overs|extras|total|player)/i.test(trimmed)) return null;
  const parenBalls = trimmed.match(/^(.+?)\s+(\d+)\s*[\(\[](\d+)[\)\]]/);
  if (parenBalls) {
    return {
      name: titleCase(parenBalls[1].replace(/\*$/, '').trim()),
      runs: Number(parenBalls[2]),
      balls: Number(parenBalls[3]),
    };
  }
  const tokens = trimmed.split(/\s+/);
  if (tokens.length < 3) return null;
  const runsIdx = tokens.findIndex((t, i) => i >= 2 && /^\d+$/.test(t));
  if (runsIdx <= 1) return null;
  const name = titleCase(tokens.slice(0, runsIdx).join(' ').replace(/\*$/, ''));
  const runs = Number(tokens[runsIdx]);
  let balls = null;
  if (runsIdx + 1 < tokens.length && /^\d+$/.test(tokens[runsIdx + 1])) {
    balls = Number(tokens[runsIdx + 1]);
  }
  if (!name || !Number.isFinite(runs)) return null;
  return { name, runs, balls };
};

const parseBowlingWickets = (line = '') => {
  const m = normalizeLine(line).match(/(\d+)\s*[-–]\s*(\d+)\s*$/);
  if (!m) return 0;
  return Number(m[1]) || 0;
};

const sumBowlingWickets = (lines = []) =>
  lines.reduce((sum, line) => sum + parseBowlingWickets(line), 0);

const cleanMargin = (raw = '') =>
  raw
    .replace(/\s*@.*$/i, '')
    .replace(/\s*-\s*$/,'')
    .replace(/\s+/g, ' ')
    .trim();

const extractRunsFromLine = (line = '') => {
  const nums = line.match(/\b(\d{2,3})\b/g);
  if (!nums) return null;
  const candidates = nums.map(Number).filter((n) => n >= 20 && n <= 400);
  return candidates.length ? candidates[candidates.length - 1] : null;
};

const extractOversFromLine = (line = '') => {
  const m = line.match(/(?:overs?\s*[:\s]*|)(\d{1,2}\.\d|\d{1,2})\s*overs?/i);
  if (m) return m[1];
  const dec = line.match(/\b(\d{1,2}\.\d)\b/);
  if (dec) return dec[1];
  const whole = line.match(/\b(\d{1,2})\s*overs?\b/i);
  if (whole) return whole[1];
  return '';
};

/** Cricket 22 summary: innings totals often appear as "265" + "OVERS: 19.5" not "265 runs". */
const parseCricket22Innings = (lines = []) => {
  const blocks = [];
  const seen = new Set();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const overs = extractOversFromLine(line);
    if (!overs) continue;

    let runs = extractRunsFromLine(line);
    if (runs == null && i > 0) runs = extractRunsFromLine(lines[i - 1]);
    if (runs == null && i + 1 < lines.length) runs = extractRunsFromLine(lines[i + 1]);
    if (runs == null) continue;

    let label = '';
    for (let j = i - 1; j >= Math.max(0, i - 4); j--) {
      const prev = lines[j];
      if (/T20\s+AT/i.test(prev)) break;
      if (/^\d{2,3}$/.test(prev)) continue;
      if (/overs/i.test(prev) && prev.length < 20) continue;
      if (/^[A-Z0-9][A-Z0-9\s]{1,22}$/.test(prev) && !parseBattingLine(prev)) {
        label = prev;
        break;
      }
    }

    const key = `${label}|${runs}|${overs}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const bowlingLines = [];
    const battingRows = [];
    for (let k = i + 1; k < Math.min(lines.length, i + 12); k++) {
      const next = lines[k];
      if (/T20\s+AT/i.test(next)) break;
      if (extractOversFromLine(next) && extractRunsFromLine(next) != null) break;
      if (/\bwon\s+by\b/i.test(next)) break;
      if (/\d+\s*[-–]\s*\d+/.test(next) && !parseBattingLine(next)) bowlingLines.push(next);
      else {
        const bat = parseBattingLine(next);
        if (bat) battingRows.push(bat);
      }
    }

    blocks.push({
      label: titleCase(label),
      runs,
      overs,
      bowlingLines,
      battingRows,
      wickets: null,
    });
  }

  blocks.forEach((block) => {
    const wkts = sumBowlingWickets(block.bowlingLines);
    block.wickets = wkts > 0 && wkts <= 10 ? wkts : null;
  });

  return blocks;
};

const parseClassicInnings = (lines = []) => {
  const blocks = [];
  let currentInnings = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const runsOnly = line.match(/^(\d{1,3})\s+runs?$/i);
    if (runsOnly) {
      const oversLine = lines[i + 1] || '';
      const oversMatch = oversLine.match(/^([\d.]+)\s+overs?$/i);
      let label = '';
      for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
        const prev = lines[j];
        if (
          prev.length <= 22 &&
          !/\d+\s*[-–]\s*\d+/.test(prev) &&
          !/^\d+\s+runs?$/i.test(prev) &&
          !/T20/i.test(prev)
        ) {
          label = prev;
          break;
        }
      }
      const block = {
        label: titleCase(label),
        runs: Number(runsOnly[1]),
        overs: oversMatch ? oversMatch[1] : '',
        bowlingLines: [],
        battingRows: [],
      };
      blocks.push(block);
      currentInnings = block;
      if (oversMatch) i += 1;
      continue;
    }

    if (currentInnings) {
      if (/\d+\s*[-–]\s*\d+/.test(line) && !parseBattingLine(line)) {
        currentInnings.bowlingLines.push(line);
      } else {
        const bat = parseBattingLine(line);
        if (bat) {
          currentInnings.battingRows.push(bat);
        }
      }
    }
  }

  blocks.forEach((block) => {
    const wkts = sumBowlingWickets(block.bowlingLines);
    block.wickets = wkts > 0 && wkts <= 10 ? wkts : null;
  });

  return blocks;
};

const parseTeamNamesFromHeader = (lines = []) => {
  const t20Idx = lines.findIndex((l) => /T20\s+AT/i.test(l));
  if (t20Idx === -1) return { team1Name: '', team2Name: '' };

  const headerLines = lines
    .slice(0, t20Idx)
    .map(normalizeLine)
    .filter((l) => l.length > 2 && !/^\d/.test(l) && !/change scorecard/i.test(l));

  if (headerLines.length >= 2) {
    return { team1Name: titleCase(headerLines[0]), team2Name: titleCase(headerLines[1]) };
  }

  if (headerLines.length === 1) {
    const combined = headerLines[0];
    // Two ALL-CAPS team names sometimes OCR'd onto one line
    const split = combined.match(/^([A-Z][A-Z\s]{2,30}?)\s+([A-Z0-9][A-Z0-9\s]{2,30})$/);
    if (split) {
      return { team1Name: titleCase(split[1]), team2Name: titleCase(split[2]) };
    }
    return { team1Name: titleCase(combined), team2Name: '' };
  }

  return { team1Name: '', team2Name: '' };
};

/**
 * @param {string} text Raw OCR text from match summary screenshot
 * @returns {object} Parsed summary with confidence hints per field
 */
export const parseMatchSummaryOcr = (text = '') => {
  const lines = text
    .split('\n')
    .map(normalizeLine)
    .filter(Boolean);

  const result = {
    team1Name: '',
    team2Name: '',
    venue: '',
    innings: [],
    winnerRaw: '',
    winnerName: '',
    margin: '',
    momName: '',
    momScore: null,
    momWickets: null,
    battingRows: [],
    fieldConfidence: {},
    rawOcrText: text,
  };

  const { team1Name, team2Name } = parseTeamNamesFromHeader(lines);
  result.team1Name = team1Name;
  result.team2Name = team2Name;
  if (team1Name) result.fieldConfidence.team1Name = team2Name ? 'high' : 'low';
  if (team2Name) result.fieldConfidence.team2Name = 'high';

  const t20Line = lines.find((l) => /T20\s+AT/i.test(l));
  if (t20Line) {
    const venueMatch = t20Line.match(/T20\s+AT\s+(.+)/i);
    if (venueMatch) {
      result.venue = venueMatch[1].replace(/\s*-\s*.+$/, '').replace(/\s*@.*$/,'').trim();
      result.fieldConfidence.venue = 'high';
    }
  }

  const wonLine = lines.find((l) => /\bwon\s+by\b/i.test(l));
  if (wonLine) {
    const parts = wonLine.split(/\bwon\s+by\b/i);
    result.winnerRaw = parts[0].replace(/[^a-z0-9\s]/gi, '').trim();
    result.margin = cleanMargin(parts[1] || '');
    result.fieldConfidence.winner = result.winnerRaw ? 'high' : 'missing';
    result.fieldConfidence.margin = result.margin ? 'high' : 'missing';
  }

  const momLine = lines.find((l) => /player\s+of\s+the\s+match/i.test(l));
  if (momLine) {
    result.momName = titleCase(
      momLine.replace(/player\s+of\s+the\s+match[:\s]*/i, '').replace(/\s*-\s*$/, '')
    );
    result.fieldConfidence.momName = result.momName ? 'high' : 'missing';
  }

  const c22Blocks = parseCricket22Innings(lines);
  const classicBlocks = parseClassicInnings(lines);
  const inningsBlocks = c22Blocks.length >= classicBlocks.length ? c22Blocks : classicBlocks;

  // Fill team names from innings labels if header failed
  if (!result.team2Name && inningsBlocks.length >= 2) {
    result.team1Name = result.team1Name || inningsBlocks[0].label;
    result.team2Name = inningsBlocks[1].label;
  }

  inningsBlocks.forEach((block) => {
    result.battingRows.push(...(block.battingRows || []));
  });

  result.innings = inningsBlocks;

  if (result.momName) {
    const momKey = normalizeTeamKey(result.momName);
    const momBat = result.battingRows.find(
      (r) => normalizeTeamKey(r.name) === momKey || normalizeTeamKey(r.name).includes(momKey)
    );
    if (momBat) {
      result.momScore = momBat.runs;
      result.fieldConfidence.momScore = 'high';
    }
    inningsBlocks.forEach((block) => {
      block.bowlingLines.forEach((line) => {
        const namePart = line.replace(/\s+\d+\s*[-–]\s*\d+\s*$/, '').trim();
        if (
          normalizeTeamKey(namePart).includes(momKey) ||
          momKey.includes(normalizeTeamKey(namePart))
        ) {
          const wkts = parseBowlingWickets(line);
          if (wkts > 0) {
            result.momWickets = wkts;
            result.fieldConfidence.momWickets = 'high';
          }
        }
      });
    });
  }

  if (inningsBlocks.length >= 1) {
    result.fieldConfidence.team1Score = inningsBlocks[0].runs ? 'high' : 'missing';
    result.fieldConfidence.team1Overs = inningsBlocks[0].overs ? 'high' : 'missing';
  }
  if (inningsBlocks.length >= 2) {
    result.fieldConfidence.team2Score = inningsBlocks[1].runs ? 'high' : 'missing';
    result.fieldConfidence.team2Overs = inningsBlocks[1].overs ? 'high' : 'missing';
  }

  return result;
};

const mapInningsToFixtureSlots = (parsed, fixture) => {
  let team1Innings = parsed.innings[0] || null;
  let team2Innings = parsed.innings[1] || null;

  if (!fixture || parsed.innings.length < 2) {
    return { team1Innings, team2Innings };
  }

  const slotForInnings = (inn) => {
    const label = inn.label || '';
    const s1 = teamMatchScore(label, fixture.team1);
    const s2 = teamMatchScore(label, fixture.team2);
    if (s1 > s2 && s1 >= 60) return 'team1';
    if (s2 > s1 && s2 >= 60) return 'team2';
    // Also try OCR header team names against innings order
    const h1 = teamMatchScore(parsed.team1Name, fixture.team1);
    const h2 = teamMatchScore(parsed.team2Name, fixture.team2);
    if (inn === parsed.innings[0] && h1 >= 60) return 'team1';
    if (inn === parsed.innings[0] && h2 >= 60) return 'team2';
    if (inn === parsed.innings[1] && h2 >= 60) return 'team2';
    if (inn === parsed.innings[1] && h1 >= 60) return 'team1';
    return null;
  };

  const slot0 = slotForInnings(parsed.innings[0]);
  const slot1 = slotForInnings(parsed.innings[1]);

  if (slot0 === 'team1' && slot1 === 'team2') {
    team1Innings = parsed.innings[0];
    team2Innings = parsed.innings[1];
  } else if (slot0 === 'team2' && slot1 === 'team1') {
    team1Innings = parsed.innings[1];
    team2Innings = parsed.innings[0];
  } else if (slot0 === 'team1') {
    team1Innings = parsed.innings[0];
    team2Innings = parsed.innings[1];
  } else if (slot1 === 'team2') {
    team2Innings = parsed.innings[1];
    team1Innings = parsed.innings[0];
  }

  return { team1Innings, team2Innings };
};

/**
 * Map parsed OCR result onto a fixture's team1/team2 slots.
 */
export const buildFormFromParse = (parsed, fixture) => {
  const teamNames = fixture ? [fixture.team1, fixture.team2].filter(Boolean) : [];

  const { team1Innings, team2Innings } = mapInningsToFixtureSlots(parsed, fixture);

  const formatScore = (inn) => {
    if (!inn || !Number.isFinite(inn.runs)) return '';
    const wkts = inn.wickets != null ? inn.wickets : 10;
    return `${inn.runs}/${wkts}`;
  };

  const winnerCandidates = fixture ? [fixture.team1, fixture.team2] : teamNames;
  let winner = matchTeamName(parsed.winnerRaw, winnerCandidates);

  // Map abbreviation winner (BL) using innings labels + fixture list
  if (!winner && parsed.winnerRaw && fixture) {
    const raw = parsed.winnerRaw.toUpperCase();
    if (raw === getTeamAbbreviation(fixture.team1).toUpperCase()) winner = fixture.team1;
    if (raw === getTeamAbbreviation(fixture.team2).toUpperCase()) winner = fixture.team2;
    parsed.innings.forEach((inn) => {
      if (raw === inn.label.toUpperCase() || raw === getTeamAbbreviation(inn.label).toUpperCase()) {
        winner = matchTeamName(inn.label, winnerCandidates) || winner;
      }
    });
  }

  const confidence = { ...parsed.fieldConfidence };
  if (!team1Innings?.wickets) confidence.team1Score = 'low';
  if (!team2Innings?.wickets) confidence.team2Score = 'low';
  if (!winner) confidence.winner = 'missing';
  confidence.team1Fairness = 'manual';
  confidence.team2Fairness = 'manual';

  if (fixture) {
    const t1Match = Math.max(
      teamMatchScore(parsed.team1Name, fixture.team1),
      teamMatchScore(parsed.team1Name, fixture.team2)
    );
    const t2Match = Math.max(
      teamMatchScore(parsed.team2Name, fixture.team1),
      teamMatchScore(parsed.team2Name, fixture.team2)
    );
    if (t1Match < 60 || t2Match < 60) {
      confidence.fixtureMatch = 'low';
    } else {
      confidence.fixtureMatch = 'high';
    }
  }

  return {
    winner,
    margin: parsed.margin || '',
    team1Score: formatScore(team1Innings),
    team2Score: formatScore(team2Innings),
    team1Overs: team1Innings?.overs || '',
    team2Overs: team2Innings?.overs || '',
    mom: {
      name: parsed.momName || '',
      score: parsed.momScore != null ? String(parsed.momScore) : '',
      wickets: parsed.momWickets != null ? String(parsed.momWickets) : '',
    },
    team1Fairness: '',
    team2Fairness: '',
    venue: parsed.venue || '',
    fieldConfidence: confidence,
    ocrTeams: {
      team1: parsed.team1Name,
      team2: parsed.team2Name,
    },
  };
};

/** Both OCR teams must match the fixture (different slots). */
export const findMatchingFixture = (fixtures = [], team1Raw = '', team2Raw = '') => {
  if (!fixtures.length || !team1Raw || !team2Raw) return null;

  const scoreFixture = (fx) => {
    const s11 = teamMatchScore(team1Raw, fx.team1);
    const s12 = teamMatchScore(team1Raw, fx.team2);
    const s21 = teamMatchScore(team2Raw, fx.team1);
    const s22 = teamMatchScore(team2Raw, fx.team2);

    const team1Slot = s11 >= s12 ? (s11 >= 60 ? 'team1' : null) : s12 >= 60 ? 'team2' : null;
    const team2Slot = s21 >= s22 ? (s21 >= 60 ? 'team1' : null) : s22 >= 60 ? 'team2' : null;

    if (!team1Slot || !team2Slot || team1Slot === team2Slot) return 0;

    let score = s11 + s12 + s21 + s22;
    if (!fx.winner) score += 5;
    return score;
  };

  const ranked = fixtures
    .map((fx) => ({ fx, score: scoreFixture(fx) }))
    .filter((x) => x.score >= 120)
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.fx || null;
};

export const fixtureMatchesOcrTeams = (fixture, team1Raw, team2Raw) => {
  if (!fixture) return false;
  return scoreFixtureTeams(fixture, team1Raw, team2Raw) >= 120;
};

function scoreFixtureTeams(fx, team1Raw, team2Raw) {
  const s11 = teamMatchScore(team1Raw, fx.team1);
  const s12 = teamMatchScore(team1Raw, fx.team2);
  const s21 = teamMatchScore(team2Raw, fx.team1);
  const s22 = teamMatchScore(team2Raw, fx.team2);
  const team1Slot = s11 >= s12 ? (s11 >= 60 ? 'team1' : null) : s12 >= 60 ? 'team2' : null;
  const team2Slot = s21 >= s22 ? (s21 >= 60 ? 'team1' : null) : s22 >= 60 ? 'team2' : null;
  if (!team1Slot || !team2Slot || team1Slot === team2Slot) return 0;
  return s11 + s12 + s21 + s22;
}
