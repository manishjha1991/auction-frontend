import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Tesseract from 'tesseract.js';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import { API_ENDPOINTS } from '../const';
import '../css/OcrExtractor.css';

const STATUS_COPY = {
  idle: 'Pick an image to get started.',
  ready: 'Image loaded. Run OCR when you are ready.',
  processing: 'Extracting text from the image…',
  done: 'Text extracted. You can edit or export it.',
  exporting: 'Generating the Word document…',
  error: 'Something went wrong. Please try again.'
};

const CARD_CONFIGS = [
  {
    key: 'homeBatting',
    label: 'Team Batting',
    description: 'Upload the batting scorecard for your roster only.',
    type: 'batting',
    isHomeTeam: true,
    allowMom: true,
    columns: [
      { key: 'name', label: 'Batter', type: 'text' },
      { key: 'runs', label: 'Runs', type: 'number' },
      { key: 'balls', label: 'Balls', type: 'number' },
      { key: 'dismissal', label: 'Dismissal', type: 'text' },
      { key: 'bowler', label: 'Bowler', type: 'text' }
    ]
  },
  {
    key: 'homeBowling',
    label: 'Team Bowling',
    description: 'Upload the bowling figures for your bowlers only.',
    type: 'bowling',
    isHomeTeam: true,
    columns: [
      { key: 'name', label: 'Bowler', type: 'text' },
      { key: 'overs', label: 'Overs', type: 'text' },
      { key: 'runs', label: 'Runs', type: 'number' },
      { key: 'wickets', label: 'Wkts', type: 'number' }
    ]
  },
  {
    key: 'opponentBatting',
    label: 'Opponent Batting',
    description: 'Upload the opponent team batting scorecard (for reference only).',
    type: 'batting',
    isHomeTeam: false,
    allowMom: true,
    columns: [
      { key: 'name', label: 'Batter', type: 'text' },
      { key: 'runs', label: 'Runs', type: 'number' },
      { key: 'balls', label: 'Balls', type: 'number' },
      { key: 'dismissal', label: 'Dismissal', type: 'text' },
      { key: 'bowler', label: 'Bowler', type: 'text' }
    ]
  },
  {
    key: 'opponentBowling',
    label: 'Opponent Bowling',
    description: 'Upload the opponent team bowling figures (for reference only).',
    type: 'bowling',
    isHomeTeam: false,
    columns: [
      { key: 'name', label: 'Bowler', type: 'text' },
      { key: 'overs', label: 'Overs', type: 'text' },
      { key: 'runs', label: 'Runs', type: 'number' },
      { key: 'wickets', label: 'Wkts', type: 'number' }
    ]
  }
];

const createEmptyRow = (columns = []) => ({
  ...columns.reduce((acc, column) => ({ ...acc, [column.key]: '' }), {}),
  playerId: '',
  isMom: false,
});

const buildInitialCardState = () =>
  CARD_CONFIGS.reduce((acc, config) => {
    acc[config.key] = {
      file: null,
      previewUrl: '',
      enhancedPreviewUrl: '',
      processedBlob: null,
      ocrText: '',
      manualRows: [],
      columns: config.columns.map((column) => ({ ...column })),
      status: 'idle',
      progress: 0,
      error: '',
      teamRole: config.teamRole || null
    };
    return acc;
  }, {});

const normalizeName = (value = '') =>
  value
    .toLowerCase()
    .replace(/(^|\s)([a-z])/g, (match, space, letter) => `${space}${letter.toUpperCase()}`)
    .trim();

const VISUAL_DIGIT_MAP = {
  '@': '3',
  '₃': '3',
  '⁵': '5',
  '₅': '5',
  '⁷': '7',
  '₇': '7',
  '⁰': '0',
  '₀': '0',
  O: '0',
  o: '0',
  Q: '0',
  S: '5',
  s: '5',
  B: '8',
  I: '1',
  l: '1',
  '|': '1'
};

const RUN_TOKEN_MAP = {
  duck: 0,
  m: 0,
  mm: 0,
  'm m': 0,
  n: 11
};

const BALL_TOKEN_MAP = {
  y: 7,
  yy: 77,
  l: 1,
  i: 1
};

const mapVisualDigits = (value = '') =>
  value
    .split('')
    .map((char) => VISUAL_DIGIT_MAP[char] ?? char)
    .join('');

const extractRuns = (tokens = []) => {
  const normalized = tokens
    .map((token) => mapVisualDigits(token.replace(/[^0-9a-z]/gi, '')))
    .find((token) => /^\d{1,3}$/.test(token));
  if (normalized) return Number(normalized);

  const fallback = tokens
    .map((token) => token.replace(/[^a-z]/gi, '').toLowerCase())
    .find((token) => RUN_TOKEN_MAP.hasOwnProperty(token));
  return fallback !== undefined ? RUN_TOKEN_MAP[fallback] : null;
};

const extractBalls = (text = '') => {
  const bracketMatch = text.match(/[\(\[]([^)\]]{1,5})[\)\]]/);
  if (bracketMatch) {
    const digits = mapVisualDigits(bracketMatch[1]).replace(/[^0-9]/g, '');
    if (digits) return Number(digits);
  }
  const fallback = text
    .split(' ')
    .map((token) => token.replace(/[^a-z]/gi, '').toLowerCase())
    .find((token) => BALL_TOKEN_MAP.hasOwnProperty(token));
  return fallback ? BALL_TOKEN_MAP[fallback] : null;
};

const parseBattingRows = (text = '') =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !SCORECARD_EXCLUDE_PATTERN.test(line))
    .map((line) => {
      const tokens = line.split(/\s+/);
      if (tokens.length < 2) return null;
      const name = normalizeName(`${tokens[0]} ${tokens[1]}`);
      const detailTokens = tokens.slice(2);
      const runs = extractRuns(detailTokens);
      const balls = extractBalls(line);
      return {
        name,
        runs,
        balls,
        dismissal: '',
        bowler: '',
        raw: line,
        playerId: '',
        isMom: false
      };
    })
    .filter((row) => row && row.name);

const parseSummaryMeta = (text = '') => {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const meta = {};
  const headerIdx = lines.findIndex((line) => /T20\s+AT/i.test(line));
  if (headerIdx > 0) {
    meta.teamName = normalizeName(lines[headerIdx - 1]);
  }
  if (headerIdx !== -1) {
    const venueMatch = lines[headerIdx].match(/T20\s+AT\s+(.+)/i);
    if (venueMatch) {
      meta.venue = venueMatch[1].replace(/-.+/, '').trim();
    }
  }
  const winnerLine = lines.find((line) => /won\s+by/i.test(line));
  if (winnerLine) {
    const parts = winnerLine.split(/won\s+by/i);
    meta.winnerTeamName = normalizeName(parts[0]);
    meta.margin = parts[1]?.trim() || '';
  }
  const playerLine = lines.find((line) => /Player\s+of\s+the\s+Match/i.test(line));
  if (playerLine) {
    meta.playerOfMatch = playerLine.replace(/Player\s+of\s+the\s+Match[:\-]?\s*/i, '').trim();
  }
  const timeMatch = lines
    .map((line) => line.match(/\b(\d{1,2}:\d{2}\s?(?:AM|PM))\b/i))
    .find(Boolean);
  if (timeMatch) {
    meta.matchTime = timeMatch[1].toUpperCase().replace(/\s+/, '');
  }
  return meta;
};


const parseBowlingRows = (text = '') =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !SCORECARD_EXCLUDE_PATTERN.test(line))
    .map((line) => {
      const tokens = line.split(/\s+/);
      const firstMetricIdx = tokens.findIndex((token) => /[\d]/.test(token));
      if (firstMetricIdx <= 0) return null;
      const name = normalizeName(tokens.slice(0, firstMetricIdx).join(' '));
      const stats = tokens.slice(firstMetricIdx);
      if (!name || !stats.length) return null;
      const [overs = '', maidens = '', runs = '', wickets = '', economy = '', extras = ''] = stats;
      return {
        name,
        overs,
        maidens: Number(maidens ?? 0) || 0,
        runs: Number(runs ?? 0) || 0,
        wickets: Number(wickets ?? 0) || 0,
        economy,
        extras: Number(extras ?? 0) || 0,
        raw: line,
        playerId: ''
      };
    })
    .filter((row) => row && row.name);

const convertBallsToOvers = (balls) => {
  const totalBalls = Number(balls);
  if (!Number.isFinite(totalBalls) || totalBalls <= 0) return '';
  const overs = Math.floor(totalBalls / 6);
  const remainder = totalBalls % 6;
  return remainder ? `${overs}.${remainder}` : String(overs);
};

const SCORECARD_EXCLUDE_PATTERN =
  /(T20\s+AT|FALL\s+OF\s+WICKET|EXTRAS\b|CHANGE\s+SCORECARD|PLAYER\s+OF\s+THE\s+MATCH)/i;

const normalizePlayerKey = (value = '') => value.replace(/[^a-z]/gi, '').toLowerCase();

// Enhanced matching for abbreviated names (e.g., "J. Clark" matches "Jordan Clark")
const matchPlayerName = (extractedName = '', rosterName = '') => {
  if (!extractedName || !rosterName) return false;
  
  // Normalize both names
  const extracted = extractedName.trim().toLowerCase();
  const roster = rosterName.trim().toLowerCase();
  
  // Exact match after normalization
  if (normalizePlayerKey(extracted) === normalizePlayerKey(roster)) {
    return true;
  }
  
  // Split into parts
  const extractedParts = extracted.split(/\s+/).filter(Boolean);
  const rosterParts = roster.split(/\s+/).filter(Boolean);
  
  if (extractedParts.length === 0 || rosterParts.length === 0) return false;
  
  // Get last names (usually the last part)
  const extractedLastName = extractedParts[extractedParts.length - 1];
  const rosterLastName = rosterParts[rosterParts.length - 1];
  
  // Last names must match
  if (normalizePlayerKey(extractedLastName) !== normalizePlayerKey(rosterLastName)) {
    return false;
  }
  
  // Check if extracted name has an initial (single letter or letter with period)
  const extractedFirst = extractedParts[0];
  const isInitial = /^[a-z]\.?$/i.test(extractedFirst);
  
  if (isInitial) {
    // If extracted is an initial, check if it matches the first letter of roster first name
    const rosterFirst = rosterParts[0];
    const extractedInitial = extractedFirst.replace(/\./g, '').toLowerCase();
    const rosterFirstInitial = rosterFirst.charAt(0).toLowerCase();
    return extractedInitial === rosterFirstInitial;
  }
  
  // If not an initial, check if first names match (fuzzy)
  const extractedFirstName = extractedParts[0];
  const rosterFirstName = rosterParts[0];
  
  // Check if extracted first name starts with roster first name or vice versa
  const extractedFirstNorm = normalizePlayerKey(extractedFirstName);
  const rosterFirstNorm = normalizePlayerKey(rosterFirstName);
  
  return extractedFirstNorm === rosterFirstNorm || 
         extractedFirstNorm.startsWith(rosterFirstNorm) || 
         rosterFirstNorm.startsWith(extractedFirstNorm);
};

const convertOversToBalls = (oversValue) => {
  if (oversValue === undefined || oversValue === null || oversValue === '') return null;
  const str = String(oversValue).trim();
  if (!str.length) return null;
  if (str.includes(':')) {
    const [o, b] = str.split(':');
    const overs = Number.parseInt(o, 10) || 0;
    const balls = Number.parseInt(b, 10) || 0;
    return overs * 6 + Math.min(Math.max(balls, 0), 5);
  }
  const parts = str.split('.');
  const overs = Number.parseInt(parts[0], 10) || 0;
  const balls = parts[1] ? Number.parseInt(parts[1], 10) || 0 : 0;
  return overs * 6 + Math.min(Math.max(balls, 0), 5);
};

const MAX_BOWLING_OVERS = 4;
const MAX_BOWLING_BALLS = MAX_BOWLING_OVERS * 6;
const MAX_WICKETS = 10;

const clampOversInput = (value) => {
  if (value === undefined || value === null) return '';
  const sanitized = String(value).replace(/[^\d.:]/g, '');
  if (!sanitized) return '';
  const balls = convertOversToBalls(sanitized);
  if (balls === null) return sanitized;
  const clampedBalls = Math.min(balls, MAX_BOWLING_BALLS);
  return clampedBalls === balls ? sanitized : convertBallsToOvers(clampedBalls);
};

const clampWicketsValue = (rawValue) => {
  const numeric = Number(rawValue);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(Math.max(numeric, 0), MAX_WICKETS);
};

const parseCardByType = (config, text = '') => {
  if (!text.trim()) return { rows: [], meta: {} };
  switch (config.type) {
    case 'batting':
      return { rows: parseBattingRows(text), meta: parseSummaryMeta(text) };
    case 'bowling':
      return { rows: parseBowlingRows(text), meta: {} };
    default:
      return { rows: [], meta: {} };
  }
};

const OcrExtractor = () => {
  const [cardState, setCardState] = useState(buildInitialCardState());
  const [fixtures, setFixtures] = useState([]);
  const [fixtureSearch, setFixtureSearch] = useState('');
  const [fixturesLoading, setFixturesLoading] = useState(false);
  const [fixturesError, setFixturesError] = useState('');
  const [selectedFixtureId, setSelectedFixtureId] = useState('');
  const [primaryTeamName, setPrimaryTeamName] = useState('');
  const [opponentTeamName, setOpponentTeamName] = useState('');
  const [venue, setVenue] = useState('');
  const [matchLabel, setMatchLabel] = useState('');
  const [roster, setRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState('');
  const [opponentRoster, setOpponentRoster] = useState([]);
  const [opponentRosterLoading, setOpponentRosterLoading] = useState(false);
  const [opponentRosterError, setOpponentRosterError] = useState('');
  const [language, setLanguage] = useState('eng');
  const [applyEnhancement, setApplyEnhancement] = useState(true);
  const [upscaleFactor, setUpscaleFactor] = useState(2);
  const [contrast, setContrast] = useState(1.35);
  const [brightness, setBrightness] = useState(1.05);
  const [pageSegMode, setPageSegMode] = useState('6');
  const [charWhitelist, setCharWhitelist] = useState(
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-–:()./% '
  );
  const [copyToast, setCopyToast] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [toast, setToast] = useState(null);
  const [isPlayoff, setIsPlayoff] = useState(false);
  // wcStage is mutually exclusive: 'super8' | 'semi' | 'final' | '' (no WC)
  const [wcStage, setWcStage] = useState('');
  const [tournaments, setTournaments] = useState([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(false);
  const [tournamentId, setTournamentId] = useState('');
  const enhancedUrlRef = useRef({});

  const isWc = !!wcStage;

  // The WC stage card is gated on having at least one running tournament.
  // Admins activate tournaments however they like (name varies — "T20 World Cup",
  // "WorldCup 2026", "Super 8 Cup", etc.), so we don't try to match the name.
  // Tournaments here are already pre-filtered to `status === 'running'`,
  // and tournaments matching common WC keywords are surfaced first.
  const wcTournaments = useMemo(() => {
    if (!tournaments.length) return [];
    const isWcLike = (tn) => /world\s*cup|\bwc\b/.test((tn?.name || '').toLowerCase());
    const wcLike = tournaments.filter(isWcLike);
    const others = tournaments.filter((tn) => !isWcLike(tn));
    return [...wcLike, ...others];
  }, [tournaments]);
  const hasActiveWorldCup = wcTournaments.length > 0;

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (err) {
      return {};
    }
  }, []);
  const currentUserId = currentUser?.id || '';
  const currentUserTeamName = currentUser?.teamName || '';

  const updateCardState = useCallback((cardKey, updater) => {
    setCardState((prev) => {
      const card = prev[cardKey];
      if (!card) return prev;
      const updatedCard =
        typeof updater === 'function' ? updater(card) : { ...card, ...updater };
      return { ...prev, [cardKey]: updatedCard };
    });
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    const fetchRoster = async () => {
      setRosterLoading(true);
      setRosterError('');
      try {
        const res = await fetch(`${API_ENDPOINTS}/api/player-stats/list?userId=${currentUserId}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Unable to load roster.');
        }
        const data = await res.json();
        setRoster(data.players || []);
      } catch (err) {
        console.error('Failed to load roster', err);
        setRosterError(err.message || 'Failed to load roster.');
      } finally {
        setRosterLoading(false);
      }
    };
    fetchRoster();
  }, [currentUserId]);

  useEffect(() => {
    const fetchTournaments = async () => {
      setTournamentsLoading(true);
      try {
        const headers = {};
        if (currentUserId) headers['user-id'] = currentUserId;
        const res = await fetch(`${API_ENDPOINTS}/api/tournaments?limit=100`, { headers });
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.tournaments)
          ? data.tournaments
          : [];
        // Strict "running only": surface a tournament if EITHER
        //   1. status === 'running', OR
        //   2. current time is within [startDate, endDate]
        // (rule #2 covers the case where the stored status is stale because
        // it's only recomputed on .save()).
        const now = Date.now();
        const selectable = list.filter((tn) => {
          if (!tn) return false;
          if (tn.status === 'running') return true;
          const start = tn.startDate ? new Date(tn.startDate).getTime() : null;
          const end = tn.endDate ? new Date(tn.endDate).getTime() : null;
          if (start && end && start <= now && now <= end) return true;
          return false;
        });
        // Most-recently-started first.
        selectable.sort((a, b) => {
          const ad = a?.startDate ? new Date(a.startDate).getTime() : 0;
          const bd = b?.startDate ? new Date(b.startDate).getTime() : 0;
          return bd - ad;
        });
        setTournaments(selectable);
      } catch (err) {
        console.error('Failed to load tournaments', err);
      } finally {
        setTournamentsLoading(false);
      }
    };
    fetchTournaments();
  }, [currentUserId]);

  // If no active World Cup tournament exists, force-clear any WC selection so
  // the user can't accidentally submit WC-tagged entries.
  useEffect(() => {
    if (!hasActiveWorldCup) {
      if (wcStage) setWcStage('');
      if (tournamentId) setTournamentId('');
    }
  }, [hasActiveWorldCup, wcStage, tournamentId]);

  // Reset tournament selection if WC is unticked
  useEffect(() => {
    if (!isWc) {
      setTournamentId('');
    }
  }, [isWc]);

  useEffect(() => {
    const fetchFixtures = async () => {
      setFixturesLoading(true);
      setFixturesError('');
      try {
        const res = await fetch(`${API_ENDPOINTS}/api/fixtures`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Unable to load fixtures.');
        }
        const data = await res.json();
        if (!Array.isArray(data)) {
          throw new Error('Unexpected fixture response.');
        }
        const sorted = [...data].sort((a, b) => {
          const aHasUser =
            a.team1 === currentUserTeamName || a.team2 === currentUserTeamName ? 1 : 0;
          const bHasUser =
            b.team1 === currentUserTeamName || b.team2 === currentUserTeamName ? 1 : 0;
          if (aHasUser !== bHasUser) return bHasUser - aHasUser;
          const aTime = new Date(a.createdAt || a.matchDate || 0).getTime();
          const bTime = new Date(b.createdAt || b.matchDate || 0).getTime();
          return bTime - aTime;
        });
        setFixtures(sorted);
      } catch (err) {
        console.error('Failed to load fixtures', err);
        setFixturesError(err.message || 'Failed to load fixtures.');
      } finally {
        setFixturesLoading(false);
      }
    };
    fetchFixtures();
  }, [currentUserTeamName]);

  const selectedFixture = useMemo(
    () => fixtures.find((fixture) => String(fixture._id) === String(selectedFixtureId)),
    [fixtures, selectedFixtureId]
  );

  const getTeamDetails = useCallback(
    (teamName) => {
      if (!selectedFixture || !teamName) return null;
      if (selectedFixture.team1 === teamName) return selectedFixture.team1Details;
      if (selectedFixture.team2 === teamName) return selectedFixture.team2Details;
      return null;
    },
    [selectedFixture]
  );

  const opponentTeamDetails = useMemo(
    () => getTeamDetails(opponentTeamName),
    [getTeamDetails, opponentTeamName]
  );
  const resolvedOpponentUserId = useMemo(() => {
    if (!opponentTeamDetails) return '';
    return String(opponentTeamDetails.userId || opponentTeamDetails._id || opponentTeamDetails.id || '');
  }, [opponentTeamDetails]);

  // Fetch opponent roster when opponent is selected
  useEffect(() => {
    if (!resolvedOpponentUserId) {
      setOpponentRoster([]);
      return;
    }
    const fetchOpponentRoster = async () => {
      setOpponentRosterLoading(true);
      setOpponentRosterError('');
      try {
        const res = await fetch(`${API_ENDPOINTS}/api/player-stats/list?userId=${resolvedOpponentUserId}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Unable to load opponent roster.');
        }
        const data = await res.json();
        setOpponentRoster(data.players || []);
      } catch (err) {
        console.error('Failed to load opponent roster', err);
        setOpponentRosterError(err.message || 'Failed to load opponent roster.');
      } finally {
        setOpponentRosterLoading(false);
      }
    };
    fetchOpponentRoster();
  }, [resolvedOpponentUserId]);

  useEffect(() => {
    setCardState(buildInitialCardState());
    if (!selectedFixture) {
      setMatchLabel('');
      setVenue('');
      setPrimaryTeamName('');
      setOpponentTeamName('');
      return;
    }
    const teams = [selectedFixture.team1, selectedFixture.team2].filter(Boolean);
    let primary = teams.find((team) => team === currentUserTeamName) || teams[0] || '';
    const secondary = teams.find((team) => team !== primary) || teams[1] || '';
    if (!primary && secondary) {
      primary = secondary;
    }
    setPrimaryTeamName(primary || '');
    setOpponentTeamName(secondary || '');
    setMatchLabel(
      selectedFixture.matchTitle ||
        `${selectedFixture.team1 || 'Team 1'} vs ${selectedFixture.team2 || 'Team 2'}`
    );
    setVenue(selectedFixture.matchVenue || '');
  }, [selectedFixture, currentUserTeamName]);

  const filteredFixtures = useMemo(() => {
    const baseFixtures = currentUser?.isAdmin
      ? fixtures
      : fixtures.filter(
          (fx) =>
            fx.team1?.toLowerCase() === currentUserTeamName.toLowerCase() ||
            fx.team2?.toLowerCase() === currentUserTeamName.toLowerCase()
        );

    if (!fixtureSearch.trim()) return baseFixtures;
    const term = fixtureSearch.trim().toLowerCase();
    return baseFixtures.filter(
      (fx) =>
        fx.team1?.toLowerCase().includes(term) ||
        fx.team2?.toLowerCase().includes(term) ||
        (fx.matchTitle || '').toLowerCase().includes(term)
    );
  }, [fixtures, fixtureSearch]);

  const rosterOptions = useMemo(
    () =>
      (roster || []).map((player) => ({
        value: player._id,
        label: player.name,
      })),
    [roster]
  );

  const opponentRosterOptions = useMemo(
    () =>
      (opponentRoster || []).map((player) => ({
        value: player._id,
        label: player.name,
      })),
    [opponentRoster]
  );

  const findPlayerIdByName = useCallback(
    (name = '') => {
      if (!name) return '';
      
      // First try exact match
      const key = normalizePlayerKey(name);
      if (key) {
        const exactMatch = rosterOptions.find(
          (option) => normalizePlayerKey(option.label) === key
        );
        if (exactMatch) return exactMatch.value;
      }
      
      // Then try enhanced matching for abbreviated names
      const enhancedMatch = rosterOptions.find(
        (option) => matchPlayerName(name, option.label)
      );
      return enhancedMatch?.value || '';
    },
    [rosterOptions]
  );

  const findOpponentPlayerIdByName = useCallback(
    (name = '') => {
      if (!name) return '';
      
      // First try exact match
      const key = normalizePlayerKey(name);
      if (key) {
        const exactMatch = opponentRosterOptions.find(
          (option) => normalizePlayerKey(option.label) === key
        );
        if (exactMatch) return exactMatch.value;
      }
      
      // Then try enhanced matching for abbreviated names
      const enhancedMatch = opponentRosterOptions.find(
        (option) => matchPlayerName(name, option.label)
      );
      return enhancedMatch?.value || '';
    },
    [opponentRosterOptions]
  );

  // Get card configuration
  const getCardConfig = useCallback((cardKey) => CARD_CONFIGS.find((cfg) => cfg.key === cardKey), []);

  // Check if a player name matches the roster
  const checkPlayerMatch = useCallback(
    (name = '', isHomeTeam = true) => {
      if (!name) return { matched: false, playerId: '' };
      const findPlayer = isHomeTeam ? findPlayerIdByName : findOpponentPlayerIdByName;
      const playerId = findPlayer(name);
      return { matched: !!playerId, playerId };
    },
    [findPlayerIdByName, findOpponentPlayerIdByName]
  );

  // Get matching statistics for a card
  const getCardMatchStats = useCallback(
    (cardKey) => {
      const card = cardState[cardKey];
      if (!card || !card.manualRows.length) return { total: 0, matched: 0, unmatched: 0 };
      const cfg = getCardConfig(cardKey);
      const isHomeTeam = cfg?.isHomeTeam !== false;
      
      let matched = 0;
      let unmatched = 0;
      
      card.manualRows.forEach((row) => {
        if (row.playerId) {
          matched++;
        } else if (row.name) {
          const match = checkPlayerMatch(row.name, isHomeTeam);
          if (match.matched) {
            matched++;
          } else {
            unmatched++;
          }
        }
      });
      
      return { total: card.manualRows.length, matched, unmatched };
    },
    [cardState, getCardConfig, checkPlayerMatch]
  );

  // Auto-match players when roster loads (for existing rows)
  useEffect(() => {
    if (!rosterOptions.length && !opponentRosterOptions.length) return;
    setCardState((prev) => {
      let changed = false;
      const nextState = { ...prev };
      CARD_CONFIGS.forEach((cfg) => {
        const card = prev[cfg.key];
        if (!card || !card.manualRows.length) return;
        const isHomeTeam = cfg.isHomeTeam !== false;
        const options = isHomeTeam ? rosterOptions : opponentRosterOptions;
        const findPlayer = isHomeTeam ? findPlayerIdByName : findOpponentPlayerIdByName;
        
        if (!options.length) return;
        
        const nextRows = card.manualRows.map((row) => {
          if (row.playerId) return row;
          const matchedId = findPlayer(row.name);
          if (!matchedId) return row;
          // Find the roster player's name to replace the extracted name
          const matchedPlayer = options.find((opt) => opt.value === matchedId);
          changed = true;
          return { 
            ...row, 
            playerId: matchedId,
            name: matchedPlayer?.label || row.name // Replace with roster name
          };
        });
        nextState[cfg.key] = { ...card, manualRows: nextRows };
      });
      return changed ? nextState : prev;
    });
  }, [findPlayerIdByName, findOpponentPlayerIdByName, rosterOptions.length, opponentRosterOptions.length]);

  const acceptFile = useCallback(
    (cardKey, file) => {
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        updateCardState(cardKey, (card) => ({ ...card, error: 'Only images are supported.' }));
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        updateCardState(cardKey, (card) => ({ ...card, error: 'Use images smaller than 8 MB.' }));
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      updateCardState(cardKey, (card) => {
        if (card.previewUrl) URL.revokeObjectURL(card.previewUrl);
        if (card.enhancedPreviewUrl) URL.revokeObjectURL(card.enhancedPreviewUrl);
        return {
          ...card,
          file,
          previewUrl,
          enhancedPreviewUrl: '',
          processedBlob: null,
          status: 'ready',
          progress: 0,
          error: '',
          ocrText: '',
          meta: card.meta || {}
        };
      });
    },
    [updateCardState]
  );

  const resetCard = useCallback(
    (cardKey) => {
      updateCardState(cardKey, (card) => {
        if (card.previewUrl) URL.revokeObjectURL(card.previewUrl);
        if (card.enhancedPreviewUrl) URL.revokeObjectURL(card.enhancedPreviewUrl);
        const cfg = getCardConfig(cardKey);
        return {
          file: null,
          previewUrl: '',
          enhancedPreviewUrl: '',
          processedBlob: null,
          ocrText: '',
          manualRows: [],
          columns: (cfg?.columns || []).map((col) => ({ ...col })),
          status: 'idle',
          progress: 0,
          error: '',
          meta: {},
          teamRole: card.teamRole || cfg?.teamRole || null
        };
      });
    },
    [getCardConfig, updateCardState]
  );

  const readImage = useCallback(
    (file) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = (event) => {
          URL.revokeObjectURL(url);
          reject(event);
        };
        img.crossOrigin = 'anonymous';
        img.src = url;
      }),
    []
  );

  const preprocessImage = useCallback(
    async (file) => {
      if (!file) return null;
      const imgEl = await readImage(file);
      const canvas = document.createElement('canvas');
      const scale = Math.min(Math.max(Number(upscaleFactor) || 1, 1), 3);
      canvas.width = imgEl.width * scale;
      canvas.height = imgEl.height * scale;
      const ctx = canvas.getContext('2d');
      if (applyEnhancement) {
        ctx.filter = [
          `brightness(${Math.max(Number(brightness) || 1, 0.5)})`,
          `contrast(${Math.max(Number(contrast) || 1, 0.5)})`,
          'grayscale(1)'
        ].join(' ');
      } else {
        ctx.filter = 'none';
      }
      ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Unable to preprocess image'));
          },
          'image/png',
          1
        );
      });
    },
    [applyEnhancement, brightness, contrast, readImage, upscaleFactor]
  );

  const runOcr = useCallback(
    async (cardKey) => {
      const card = cardState[cardKey];
      const config = getCardConfig(cardKey);
      if (!card?.file) {
        updateCardState(cardKey, (prev) => ({ ...prev, error: 'Please select an image first.' }));
        return;
      }
      const isHomeTeam = config?.isHomeTeam !== false;
      const optionsToUse = isHomeTeam ? rosterOptions : opponentRosterOptions;
      const findPlayer = isHomeTeam ? findPlayerIdByName : findOpponentPlayerIdByName;
      updateCardState(cardKey, (prev) => ({ ...prev, status: 'processing', progress: 0, error: '' }));
      try {
        const sourceImage = applyEnhancement
          ? card.processedBlob || (await preprocessImage(card.file))
          : card.file;

        const processedBlob =
          applyEnhancement && !card.processedBlob ? sourceImage : card.processedBlob || null;

        const { data } = await Tesseract.recognize(sourceImage, language, {
          tessedit_char_whitelist: charWhitelist || undefined,
          tessedit_pageseg_mode: pageSegMode,
          logger: (message) => {
            if (message.status === 'recognizing text') {
              updateCardState(cardKey, (prev) => ({
                ...prev,
                progress: Math.round(message.progress * 100)
              }));
            }
          }
        });

        const text = data?.text?.trim() || '';
        const parsed = parseCardByType(config, text);
        const rowsToUse =
          parsed.rows.length > 0
            ? parsed.rows.map((row) => ({
                ...createEmptyRow(config.columns),
                ...row
              }))
            : card.manualRows.length
            ? card.manualRows
            : [];

        if (parsed.meta?.teamName && !primaryTeamName) {
          setPrimaryTeamName(parsed.meta.teamName);
        }
        if (parsed.meta?.venue && !venue) {
          setVenue(parsed.meta.venue);
        }

        // Auto-match players immediately after OCR extraction
        let matchedRows = rowsToUse;
        if (optionsToUse.length > 0 && rowsToUse.length > 0) {
          matchedRows = rowsToUse.map((row) => {
            if (row.playerId) return row;
            const matchedId = findPlayer(row.name);
            if (!matchedId) return row;
            const matchedPlayer = optionsToUse.find((opt) => opt.value === matchedId);
            return {
              ...row,
              playerId: matchedId,
              name: matchedPlayer?.label || row.name
            };
          });
        }

        updateCardState(cardKey, (prev) => ({
          ...prev,
          ocrText: text,
          manualRows: matchedRows,
          status: 'done',
          progress: 100,
          processedBlob,
          meta: parsed.meta || {},
          error: ''
        }));
      } catch (err) {
        console.error('OCR failed', err);
        updateCardState(cardKey, (prev) => ({
          ...prev,
          status: 'error',
          error: 'OCR failed, try adjusting enhancement settings.'
        }));
      } finally {
        // no-op
      }
    },
    [
      applyEnhancement,
      cardState,
      charWhitelist,
      getCardConfig,
      language,
      preprocessImage,
      primaryTeamName,
      updateCardState,
      venue,
      pageSegMode
    ]
  );

  const exportDocx = useCallback(
    async (cardKey) => {
      const card = cardState[cardKey];
      if (!card?.ocrText?.trim()) {
        setGlobalError('Run OCR for this card before exporting.');
        return;
      }
      updateCardState(cardKey, (prev) => ({ ...prev, status: 'exporting' }));
      try {
        const paragraphs = card.ocrText.split('\n').map(
          (line) =>
            new Paragraph({
              children: [new TextRun(line || ' ')]
            })
        );
        const doc = new Document({
          sections: [
            {
              properties: {},
              children: paragraphs
            }
          ]
        });
        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ocr-${cardKey}-${Date.now()}.docx`;
        link.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('DOCX export failed', err);
      } finally {
        updateCardState(cardKey, (prev) => ({ ...prev, status: 'done' }));
      }
    },
    [cardState, updateCardState]
  );

  const handleAddRow = useCallback(
    (cardKey) => {
      const cfg = getCardConfig(cardKey);
      if (!cfg) return;
      updateCardState(cardKey, (card) => ({
        ...card,
        manualRows: [...card.manualRows, createEmptyRow(card.columns || cfg.columns)]
      }));
    },
    [getCardConfig, updateCardState]
  );

  const handleRemoveRow = useCallback(
    (cardKey, rowIndex) => {
      updateCardState(cardKey, (card) => ({
        ...card,
        manualRows: card.manualRows.filter((_, idx) => idx !== rowIndex)
      }));
    },
    [updateCardState]
  );

  const updateManualRow = useCallback(
    (cardKey, rowIndex, updates) => {
      updateCardState(cardKey, (card) => ({
        ...card,
        manualRows: card.manualRows.map((row, idx) =>
          idx === rowIndex ? { ...row, ...updates } : row
        )
      }));
    },
    [updateCardState]
  );

  const handlePlayerSelect = useCallback(
    (cardKey, rowIndex, playerId) => {
      const cardConfig = getCardConfig(cardKey);
      const isHomeTeam = cardConfig?.isHomeTeam !== false;
      const optionsToUse = isHomeTeam ? rosterOptions : opponentRosterOptions;
      const selected = optionsToUse.find((option) => option.value === playerId);
      updateManualRow(cardKey, rowIndex, {
        playerId,
        name: selected?.label || ''
      });
    },
    [getCardConfig, rosterOptions, opponentRosterOptions, updateManualRow]
  );

  const handleMomToggle = useCallback((targetCardKey, targetRowIdx, checked) => {
    setCardState((prev) => {
      let changed = false;
      const nextState = {};
      CARD_CONFIGS.forEach((cfg) => {
        const card = prev[cfg.key];
        if (!card) return;
        const nextRows = card.manualRows.map((row, idx) => {
          const shouldBeMom = checked && cfg.key === targetCardKey && idx === targetRowIdx;
          if ((row.isMom || false) !== shouldBeMom) {
            changed = true;
            return { ...row, isMom: shouldBeMom };
          }
          return row;
        });
        nextState[cfg.key] = {
          ...card,
          manualRows: nextRows
        };
      });
      return changed ? nextState : prev;
    });
  }, [setCardState]);

  const hasMeaningfulData = useCallback(
    (cardKey) => {
      const card = cardState[cardKey];
      if (!card) return false;
      return card.manualRows.some((row) =>
        Object.entries(row).some(
          ([key, value]) =>
            key !== 'playerId' &&
            key !== 'isMom' &&
            value !== '' &&
            value !== null &&
            value !== undefined
        )
      );
    },
    [cardState]
  );

  const sanitizeBattingRows = useCallback((rows = []) => {
    return (rows || [])
      .filter((row) => row?.name)
      .map((row) => ({
        name: row.name.trim(),
        runs: row.runs === '' || row.runs === null ? null : Number(row.runs),
        balls: row.balls === '' || row.balls === null ? null : Number(row.balls),
        dismissal: row.dismissal || '',
        bowler: row.bowler || '',
        playerId: row.playerId || '',
        isMom: !!row.isMom
      }))
      .filter(
        (row) =>
          row.playerId ||
          row.runs !== null ||
          row.balls !== null ||
          row.dismissal ||
          row.bowler
      );
  }, []);

  const sanitizeBowlingRows = useCallback((rows = []) => {
    return (rows || [])
      .filter((row) => row?.name && row?.playerId) // Bowling requires playerId
      .map((row) => {
        const oversStr = clampOversInput(row.overs ?? '');
        const ballsBowledCandidate =
          row.ballsBowled !== undefined && row.ballsBowled !== null && row.ballsBowled !== ''
            ? Number(row.ballsBowled)
            : convertOversToBalls(oversStr);
        const runs = row.runs === '' || row.runs === null ? 0 : Number(row.runs);
        const wickets =
          row.wickets === '' || row.wickets === null ? 0 : clampWicketsValue(row.wickets);
        const maidens = row.maidens === '' || row.maidens === null ? 0 : Number(row.maidens);
        const extras = row.extras === '' || row.extras === null ? 0 : Number(row.extras);
        const providedEconomy =
          row.economy === '' || row.economy === null || row.economy === undefined
            ? null
            : Number(row.economy);
        const computedEconomy =
          ballsBowledCandidate && ballsBowledCandidate > 0
            ? Number((runs / (ballsBowledCandidate / 6)).toFixed(2))
            : null;

        return {
          name: row.name.trim(),
          overs: oversStr,
          maidens,
          runs,
          wickets,
          economy: providedEconomy ?? computedEconomy ?? '',
          extras,
          ballsBowled: ballsBowledCandidate,
          playerId: row.playerId || ''
        };
      })
      .filter(
        (row) =>
          row.playerId ||
          row.runs ||
          row.wickets ||
          row.overs ||
          (row.ballsBowled !== null && row.ballsBowled !== undefined)
      );
  }, []);

  const playerEntries = useMemo(() => {
    const entryMap = new Map();
    const ensureEntry = (playerId, name) => {
      if (!playerId) return null;
      if (!entryMap.has(playerId)) {
        entryMap.set(playerId, {
          playerId,
          name,
          battingStats: { runs: 0, balls: 0 },
          bowlingStats: {
            runsGiven: 0,
            ballsBowled: 0,
            wickets: 0,
            overs: null,
            economy: null,
            maidens: 0,
            extras: 0
          },
          isMom: false
        });
      }
      return entryMap.get(playerId);
    };

    sanitizeBattingRows(cardState.homeBatting?.manualRows).forEach((row) => {
      const entry = ensureEntry(row.playerId, row.name);
      if (!entry) return;
      entry.battingStats = {
        runs: Number.isFinite(row.runs) ? row.runs : 0,
        balls: Number.isFinite(row.balls) ? row.balls : 0
      };
      entry.isMom = entry.isMom || row.isMom;
    });

    sanitizeBowlingRows(cardState.homeBowling?.manualRows).forEach((row) => {
      const entry = ensureEntry(row.playerId, row.name);
      if (!entry) return;
      const ballsBowled =
        row.ballsBowled && Number.isFinite(row.ballsBowled)
          ? row.ballsBowled
          : convertOversToBalls(row.overs) || 0;
      const runsGiven = Number.isFinite(row.runs) ? row.runs : row.runsGiven || 0;
      const economy =
        row.economy !== '' && row.economy !== null && row.economy !== undefined
          ? Number(row.economy)
          : ballsBowled > 0
          ? Number((runsGiven / (ballsBowled / 6)).toFixed(2))
          : null;

      entry.bowlingStats = {
        runsGiven,
        ballsBowled,
        wickets: Number.isFinite(row.wickets) ? row.wickets : 0,
        overs: ballsBowled ? Number((ballsBowled / 6).toFixed(2)) : null,
        economy,
        maidens: Number.isFinite(row.maidens) ? row.maidens : 0,
        extras: Number.isFinite(row.extras) ? row.extras : 0
      };
    });

    return Array.from(entryMap.values());
  }, [cardState.homeBatting, cardState.homeBowling, sanitizeBattingRows, sanitizeBowlingRows]);

  const opponentPlayerEntries = useMemo(() => {
    const entryMap = new Map();
    const ensureEntry = (playerId, name) => {
      if (!playerId) return null;
      if (!entryMap.has(playerId)) {
        entryMap.set(playerId, {
          playerId,
          name,
          battingStats: { runs: 0, balls: 0 },
          bowlingStats: {
            runsGiven: 0,
            ballsBowled: 0,
            wickets: 0,
            overs: null,
            economy: null,
            maidens: 0,
            extras: 0
          },
          isMom: false
        });
      }
      return entryMap.get(playerId);
    };

    sanitizeBattingRows(cardState.opponentBatting?.manualRows).forEach((row) => {
      const entry = ensureEntry(row.playerId, row.name);
      if (!entry) return;
      entry.battingStats = {
        runs: Number.isFinite(row.runs) ? row.runs : 0,
        balls: Number.isFinite(row.balls) ? row.balls : 0
      };
      entry.isMom = entry.isMom || row.isMom;
    });

    sanitizeBowlingRows(cardState.opponentBowling?.manualRows).forEach((row) => {
      const entry = ensureEntry(row.playerId, row.name);
      if (!entry) return;
      const ballsBowled =
        row.ballsBowled && Number.isFinite(row.ballsBowled)
          ? row.ballsBowled
          : convertOversToBalls(row.overs) || 0;
      const runsGiven = Number.isFinite(row.runs) ? row.runs : row.runsGiven || 0;
      const economy =
        row.economy !== '' && row.economy !== null && row.economy !== undefined
          ? Number(row.economy)
          : ballsBowled > 0
          ? Number((runsGiven / (ballsBowled / 6)).toFixed(2))
          : null;

      entry.bowlingStats = {
        runsGiven,
        ballsBowled,
        wickets: Number.isFinite(row.wickets) ? row.wickets : 0,
        overs: ballsBowled ? Number((ballsBowled / 6).toFixed(2)) : null,
        economy,
        maidens: Number.isFinite(row.maidens) ? row.maidens : 0,
        extras: Number.isFinite(row.extras) ? row.extras : 0
      };
    });

    return Array.from(entryMap.values());
  }, [cardState.opponentBatting, cardState.opponentBowling, sanitizeBattingRows, sanitizeBowlingRows]);

  const handleSubmitScorecard = useCallback(async () => {
    if (!currentUserId) {
      setGlobalError('User session expired; please log in again.');
      return;
    }
    if (!rosterOptions.length) {
      setGlobalError('Roster not loaded yet. Please wait a moment and try again.');
      return;
    }
    const missingRows = [];
    const checkRows = (rows = [], label, isHomeTeam) => {
      rows.forEach((row, idx) => {
        const hasStats = Object.entries(row).some(
          ([key, value]) =>
            key !== 'playerId' &&
            key !== 'isMom' &&
            value !== '' &&
            value !== null &&
            value !== undefined
        );
        if (hasStats && !row.playerId) {
          missingRows.push(`${isHomeTeam ? 'Your' : 'Opponent'} ${label} row ${idx + 1}`);
        }
      });
    };
    checkRows(cardState.homeBatting?.manualRows, 'batting', true);
    checkRows(cardState.homeBowling?.manualRows, 'bowling', true);
    checkRows(cardState.opponentBatting?.manualRows, 'batting', false);
    checkRows(cardState.opponentBowling?.manualRows, 'bowling', false);

    if (missingRows.length) {
      setGlobalError(`Assign roster players for: ${missingRows.join(', ')}`);
      return;
    }

    if (!playerEntries.length && !opponentPlayerEntries.length) {
      setGlobalError('No player stats detected. Please add batting or bowling data first.');
      return;
    }

    if (!resolvedOpponentUserId) {
      setGlobalError('Select a fixture/team so we know which opponent user to update.');
      return;
    }

    if (isWc && !tournamentId) {
      setGlobalError('Pick a tournament before saving as a World Cup score (Super 8 / Semi / Final).');
      return;
    }

    const trimmedVenue = (venue || '').trim();
    if (!trimmedVenue) {
      setGlobalError('Venue is required. Please enter the ground/venue before saving.');
      setToast({
        type: 'warning',
        message: 'Venue required',
        details: 'Add the venue (e.g. "Melbourne Cricket Ground") so this match shows up in venue stats.'
      });
      return;
    }

    setSaving(true);
    setGlobalError('');
    setSaveMessage('');
    setToast(null);

    try {
      const matchKeyBase =
        matchLabel?.trim() ||
        `${primaryTeamName || 'Team'} vs ${opponentTeamName || 'Opponent'}`;
      const matchName = `${matchKeyBase} @ ${trimmedVenue}`;
      const timestamp = Date.now();
      // Single stable matchId shared by every player save (home + opponent)
      // for this one match. The venue ledger uses it to count distinct
      // matches at a venue (so 21 player rows = 1 match, not 21 matches).
      const matchId = `${matchKeyBase}-${timestamp}`;
      let successCount = 0;
      const errors = [];

      // Save home team stats (userId = currentUserId, opponentUserId = resolvedOpponentUserId)
      for (const entry of playerEntries) {
        const payload = {
          playerId: entry.playerId,
          opponentTeamName,
          opponentUserId: resolvedOpponentUserId,
          battingStats: entry.battingStats,
          bowlingStats: entry.bowlingStats,
          wicketsTaken: entry.bowlingStats?.wickets ?? 0,
          isMom: entry.isMom || false,
          isPlayoffScore: isPlayoff,
          isWcScore: isWc,
          wcStage: isWc ? wcStage : null,
          tournamentId: isWc ? tournamentId : null,
          venue: trimmedVenue,
          economy: entry.bowlingStats?.economy ?? null,
          extras: entry.bowlingStats?.extras ?? null,
          matchName,
          matchKey: `${matchKeyBase}-${entry.playerId}-${timestamp}`,
          matchId,
        };

        try {
          const res = await fetch(`${API_ENDPOINTS}/api/player-stats/store`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });
          const json = await res.json();
          if (!res.ok) {
            throw new Error(json.message || 'Failed to save player stats');
          }
          successCount += 1;
        } catch (err) {
          errors.push(`Home team: ${err.message}`);
        }
      }

      // Save opponent team stats (userId = resolvedOpponentUserId, opponentUserId = currentUserId) - FLIPPED
      for (const entry of opponentPlayerEntries) {
        const payload = {
          playerId: entry.playerId,
          opponentTeamName: primaryTeamName,
          opponentUserId: currentUserId, // Flipped: opponent's opponent is us
          battingStats: entry.battingStats,
          bowlingStats: entry.bowlingStats,
          wicketsTaken: entry.bowlingStats?.wickets ?? 0,
          isMom: entry.isMom || false,
          isPlayoffScore: isPlayoff,
          isWcScore: isWc,
          wcStage: isWc ? wcStage : null,
          tournamentId: isWc ? tournamentId : null,
          venue: trimmedVenue,
          economy: entry.bowlingStats?.economy ?? null,
          extras: entry.bowlingStats?.extras ?? null,
          matchName,
          matchKey: `${matchKeyBase}-opponent-${entry.playerId}-${timestamp}`,
          matchId,
        };

        try {
          const res = await fetch(`${API_ENDPOINTS}/api/player-stats/store`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });
          const json = await res.json();
          if (!res.ok) {
            throw new Error(json.message || 'Failed to save opponent player stats');
          }
          successCount += 1;
        } catch (err) {
          errors.push(`Opponent team: ${err.message}`);
        }
      }

      if (errors.length > 0) {
        const errorMsg = `Some entries failed: ${errors.join('; ')}`;
        setGlobalError(errorMsg);
        setToast({
          type: 'warning',
          message: 'Partial Success',
          details: `Successfully saved ${successCount} entries, but ${errors.length} failed. ${errors.slice(0, 2).join('; ')}${errors.length > 2 ? '...' : ''}`
        });
      } else {
        const successMsg = `Saved ${successCount} player stat ${successCount === 1 ? 'entry' : 'entries'} successfully!`;
        setSaveMessage(successMsg);
        setToast({
          type: 'success',
          message: 'Stats Saved Successfully!',
          details: `All ${successCount} player stat ${successCount === 1 ? 'entry has' : 'entries have'} been saved and rankings updated.`
        });
      }
    } catch (err) {
      console.error('Player stats save failed', err);
      const errorMsg = err.message || 'Failed to save player stats';
      setGlobalError(errorMsg);
      setToast({
        type: 'error',
        message: 'Save Failed',
        details: errorMsg
      });
    } finally {
      setSaving(false);
    }
  }, [
    API_ENDPOINTS,
    cardState.homeBatting,
    cardState.homeBowling,
    cardState.opponentBatting,
    cardState.opponentBowling,
    currentUserId,
    isPlayoff,
    isWc,
    wcStage,
    tournamentId,
    matchLabel,
    opponentPlayerEntries,
    opponentTeamName,
    playerEntries,
    primaryTeamName,
    resolvedOpponentUserId,
    rosterOptions.length,
    venue
  ]);

  useEffect(() => {
    const summaryCard = cardState.summary;
    if (!summaryCard) return;
    if (!summaryCard.manualRows.length) {
      updateCardState('summary', (prev) => ({
        ...prev,
        manualRows: [createEmptyRow(prev.columns)]
      }));
    }
  }, [cardState.summary, updateCardState]);

  const renderBattingTable = (cardKey, card) => {
    const cardConfig = getCardConfig(cardKey);
    const isHomeTeam = cardConfig?.isHomeTeam !== false;
    const allowMomColumn = cardConfig?.allowMom === true;
    const rosterOptionsToUse = isHomeTeam ? rosterOptions : opponentRosterOptions;
    
    return (
      <div className="table-wrapper">
        <table className="scorecard-table">
          <thead>
            <tr>
              <th className="col-player">Player</th>
              <th className="col-runs">R</th>
              <th className="col-balls">B</th>
              {allowMomColumn && <th className="col-mom">MoM</th>}
              <th className="col-delete" />
            </tr>
          </thead>
          <tbody>
            {card.manualRows.map((row, rowIdx) => {
              const isMatched = !!row.playerId;
              // Always check name match (even if already selected) to determine if it was auto-matched
              const nameMatch = row.name ? checkPlayerMatch(row.name, isHomeTeam) : null;
              const needsAttention = !isMatched && row.name && !nameMatch?.matched;
              // Check if this was auto-matched (playerId matches the name match result)
              const wasAutoMatched = isMatched && nameMatch?.matched && nameMatch?.playerId === row.playerId;
              
              return (
              <tr key={`bat-row-${rowIdx}`} className={needsAttention ? 'row-unmatched' : isMatched ? 'row-matched' : ''}>
                <td>
                  {!row.playerId && (
                    <input
                      type="text"
                      value={row.name}
                      onChange={(event) =>
                        updateManualRow(cardKey, rowIdx, { name: event.target.value })
                      }
                      placeholder="Player name"
                      className={needsAttention ? 'input-unmatched' : ''}
                    />
                  )}
                  {/* For batting: Only show dropdown if NOT matched */}
                  {!isMatched && (
                    <div className="player-select-wrapper">
                      <select
                        value={row.playerId || ''}
                        onChange={(event) => handlePlayerSelect(cardKey, rowIdx, event.target.value)}
                        className={needsAttention ? 'select-unmatched' : ''}
                      >
                        <option value="">Select roster player</option>
                        {rosterOptionsToUse.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {needsAttention && (
                        <span className="match-indicator unmatched" title="Player not found in roster - please select">
                          ⚠
                        </span>
                      )}
                    </div>
                  )}
                  {/* For batting: Show matched indicator if matched (no dropdown) */}
                  {isMatched && (
                    <div className="player-select-wrapper">
                      <span className="matched-name-display">{row.name}</span>
                      <span 
                        className={`match-indicator ${wasAutoMatched ? 'matched-auto' : 'matched-manual'}`} 
                        title={wasAutoMatched ? "Auto-matched with roster" : "Manually selected from roster"}
                      >
                        ✓
                      </span>
                    </div>
                  )}
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    value={row.runs ?? ''}
                    onChange={(event) =>
                      updateManualRow(cardKey, rowIdx, {
                        runs: event.target.value === '' ? '' : Number(event.target.value),
                      })
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    value={row.balls ?? ''}
                    onChange={(event) =>
                      updateManualRow(cardKey, rowIdx, {
                        balls: event.target.value === '' ? '' : Number(event.target.value),
                      })
                    }
                  />
                </td>
                {allowMomColumn && (
                  <td>
                    <input
                      type="checkbox"
                      checked={row.isMom || false}
                      onChange={(event) => handleMomToggle(cardKey, rowIdx, event.target.checked)}
                    />
                  </td>
                )}
                <td>
                  <button type="button" className="link-btn" onClick={() => handleRemoveRow(cardKey, rowIdx)}>
                    ✕
                  </button>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderBowlingTable = (cardKey, card) => {
    const cardConfig = getCardConfig(cardKey);
    const isHomeTeam = cardConfig?.isHomeTeam !== false;
    const allowMomColumn = cardConfig?.allowMom === true;
    const rosterOptionsToUse = isHomeTeam ? rosterOptions : opponentRosterOptions;
    
    return (
      <div className="table-wrapper">
        <table className="scorecard-table">
          <thead>
            <tr>
              <th className="col-player">Player</th>
              <th className="col-overs">Ov</th>
              <th className="col-runs">Runs</th>
              <th className="col-wickets">Wkts</th>
              {allowMomColumn && <th className="col-mom">MoM</th>}
              <th className="col-delete" />
            </tr>
          </thead>
          <tbody>
            {card.manualRows.map((row, rowIdx) => {
              const isMatched = !!row.playerId;
              // Always check name match (even if already selected) to determine if it was auto-matched
              const nameMatch = row.name ? checkPlayerMatch(row.name, isHomeTeam) : null;
              const needsAttention = !isMatched && row.name && !nameMatch?.matched;
              // Check if this was auto-matched (playerId matches the name match result)
              const wasAutoMatched = isMatched && nameMatch?.matched && nameMatch?.playerId === row.playerId;
              
              return (
              <tr key={`bowl-row-${rowIdx}`} className={needsAttention ? 'row-unmatched' : isMatched ? 'row-matched' : ''}>
                <td>
                  {!row.playerId && (
                    <input
                      type="text"
                      value={row.name || ''}
                      onChange={(event) =>
                        updateManualRow(cardKey, rowIdx, { name: event.target.value })
                      }
                      placeholder="Bowler name"
                      className={needsAttention ? 'input-unmatched' : ''}
                    />
                  )}
                  {/* For bowling: Always show dropdown (mandatory for all players) */}
                  <div className="player-select-wrapper">
                    <select
                      value={row.playerId || ''}
                      onChange={(event) => handlePlayerSelect(cardKey, rowIdx, event.target.value)}
                      className={needsAttention ? 'select-unmatched' : isMatched ? 'select-matched' : ''}
                      required
                    >
                      <option value="">Select roster player *</option>
                      {rosterOptionsToUse.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {isMatched && (
                      <span 
                        className={`match-indicator ${wasAutoMatched ? 'matched-auto' : 'matched-manual'}`} 
                        title={wasAutoMatched ? "Auto-matched with roster" : "Manually selected from roster"}
                      >
                        ✓
                      </span>
                    )}
                    {needsAttention && (
                      <span className="match-indicator unmatched" title="Player not found in roster - please select">
                        ⚠
                      </span>
                    )}
                  </div>
                </td>
              <td>
                <input
                  type="text"
                  value={row.overs ?? ''}
                  onChange={(event) =>
                    updateManualRow(cardKey, rowIdx, { overs: clampOversInput(event.target.value) })
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  min="0"
                  value={row.runs ?? 0}
                  onChange={(event) =>
                    updateManualRow(cardKey, rowIdx, {
                      runs: event.target.value === '' ? 0 : Number(event.target.value),
                    })
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  min="0"
                  max={MAX_WICKETS}
                  value={row.wickets ?? 0}
                  onChange={(event) => {
                    const val = event.target.value;
                    const nextValue = val === '' ? 0 : clampWicketsValue(val);
                    updateManualRow(cardKey, rowIdx, {
                      wickets: nextValue,
                    });
                  }}
                />
              </td>
              {allowMomColumn && (
                <td>
                  <input
                    type="checkbox"
                    checked={row.isMom || false}
                    onChange={(event) => handleMomToggle(cardKey, rowIdx, event.target.checked)}
                  />
                </td>
              )}
              <td>
                <button type="button" className="link-btn" onClick={() => handleRemoveRow(cardKey, rowIdx)}>
                  ✕
                </button>
              </td>
            </tr>
          );
          })}
        </tbody>
      </table>
    </div>
  );
  };

  const renderCardSection = (cfg) => {
    const card = cardState[cfg.key];
    if (!card) return null;
    const statusText = STATUS_COPY[card.status] ?? STATUS_COPY.idle;
    const cardComplete = hasMeaningfulData(cfg.key);

    return (
      <section key={cfg.key} className="scorecard-panel">
        <div className="panel-heading scorecard-heading">
          <div>
            <div>{cfg.label}</div>
            <p className="muted">{cfg.description}</p>
          </div>
          <span className="scorecard-meta">
            {cardComplete ? '✅ Data captured' : '⚠️ Awaiting data'} · {statusText}
          </span>
        </div>

        <section
          className="upload-zone"
          onDrop={(event) => {
            event.preventDefault();
            acceptFile(cfg.key, event.dataTransfer.files?.[0]);
          }}
          onDragOver={(event) => event.preventDefault()}
        >
          <input
            id={`ocr-file-input-${cfg.key}`}
            type="file"
            accept="image/*"
            onChange={(event) => acceptFile(cfg.key, event.target.files?.[0])}
          />
          <label htmlFor={`ocr-file-input-${cfg.key}`}>
            <strong>Drop an image</strong> or click to browse
          </label>
          {card.file && (
            <p className="file-meta">
              Selected: {card.file.name} · {(card.file.size / 1024).toFixed(0)} KB
            </p>
          )}
          <p className="helper-text">{statusText}</p>
          {card.status === 'processing' && (
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${card.progress}%` }} />
              <span>{card.progress}%</span>
            </div>
          )}
        </section>

        {card.previewUrl && (
          <div className="preview-panel">
            <div className="panel-heading">Image preview</div>
            <img src={card.previewUrl} alt={`${cfg.label} upload`} />
          </div>
        )}

        {card.error && <div className="error-banner">{card.error}</div>}

        {card.manualRows.length > 0 && (
          <div className="match-summary">
            {(() => {
              const stats = getCardMatchStats(cfg.key);
              if (stats.total === 0) return null;
              return (
                <div className={`match-summary-content ${stats.unmatched > 0 ? 'has-unmatched' : 'all-matched'}`}>
                  <span className="match-count">
                    {stats.matched > 0 && (
                      <span className="matched-count">✓ {stats.matched} matched</span>
                    )}
                    {stats.unmatched > 0 && (
                      <span className="unmatched-count">⚠ {stats.unmatched} need selection</span>
                    )}
                    {stats.unmatched === 0 && stats.matched === stats.total && (
                      <span className="all-matched-text">All players matched!</span>
                    )}
                  </span>
                </div>
              );
            })()}
          </div>
        )}

        <div className="action-row">
          <button
            type="button"
            className="primary-btn"
            onClick={() => runOcr(cfg.key)}
            disabled={!card.file || card.status === 'processing'}
          >
            {card.status === 'processing' ? 'Extracting…' : 'Extract Text'}
          </button>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => exportDocx(cfg.key)}
            disabled={!card.ocrText}
          >
            Download Word (.docx)
          </button>
          <button type="button" className="ghost-btn" onClick={() => resetCard(cfg.key)}>
            Reset
          </button>
        </div>

        <div className="table-controls">
          <button type="button" className="secondary-btn" onClick={() => handleAddRow(cfg.key)}>
            Add Row
          </button>
        </div>

        {cfg.type === 'batting'
          ? renderBattingTable(cfg.key, card)
          : renderBowlingTable(cfg.key, card)}
      </section>
    );
  };

  const requiredCards = CARD_CONFIGS.map((cfg) => cfg.key);
  const hasAtLeastOneRequiredCard = requiredCards.some(hasMeaningfulData);
  const canSubmit =
    hasAtLeastOneRequiredCard &&
    playerEntries.length > 0 &&
    primaryTeamName.trim().length > 0 &&
    !saving &&
    !rosterLoading;

  return (
    <div className="ocr-page">
      <div className="ocr-card">
        <header className="ocr-header">
          <div>
            <h1>Team OCR Upload</h1>
            <p>
              Drop just your team&apos;s batting and bowling cards, map each row to your roster, then push
              everything straight into Player Stats with MoM and playoff tagging.
            </p>
          </div>
          <button type="button" className="ghost-btn" onClick={() => window.location.reload()}>
            Reset All
          </button>
        </header>

        <section className="fixture-meta">
          <label>
            Fixture
            {fixturesLoading ? (
              <div className="muted">Loading fixtures…</div>
            ) : (
              <>
                <input
                  type="text"
                  className="fixture-search-input"
                  placeholder="Search team or match..."
                  value={fixtureSearch}
                  onChange={(event) => setFixtureSearch(event.target.value)}
                />
                <select
                  value={selectedFixtureId}
                  onChange={(event) => setSelectedFixtureId(event.target.value)}
                >
                  <option value="">Select a fixture</option>
                  {filteredFixtures.map((fx) => (
                    <option key={fx._id} value={fx._id}>
                      {fx.team1} vs {fx.team2}
                    </option>
                  ))}
                </select>
              </>
            )}
          </label>
          <label>
            Your Team
            <input
              type="text"
              value={primaryTeamName}
              onChange={(event) => setPrimaryTeamName(event.target.value)}
              placeholder="e.g. Bluefire Legion"
            />
          </label>
          <label>
            Opponent Team
            {selectedFixture ? (
              <select
                value={opponentTeamName}
                onChange={(event) => setOpponentTeamName(event.target.value)}
              >
                <option value="">Select opponent</option>
                {[selectedFixture.team1, selectedFixture.team2]
                  .filter(Boolean)
                  .map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
              </select>
            ) : (
              <input
                type="text"
                value={opponentTeamName}
                onChange={(event) => setOpponentTeamName(event.target.value)}
                placeholder="Opponent as shown on scoreboard"
              />
            )}
          </label>
          <label className={`venue-field ${!venue.trim() ? 'venue-field--missing' : ''}`}>
            <span className="venue-label">
              Venue <span className="venue-required" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </span>
            <input
              type="text"
              value={venue}
              onChange={(event) => setVenue(event.target.value)}
              placeholder="e.g. Melbourne Cricket Ground"
              required
              aria-required="true"
              aria-invalid={!venue.trim()}
            />
            {!venue.trim() && (
              <span className="venue-hint">
                Required — needed so this match shows up in venue stats.
              </span>
            )}
          </label>
          <label>
            Match Label
            <input
              type="text"
              value={matchLabel}
              onChange={(event) => setMatchLabel(event.target.value)}
              placeholder="Qualifier 1 vs Royals"
            />
          </label>
          <label className={`playoff-checkbox-wrapper ${isPlayoff ? 'checked' : ''}`}>
            <input
              type="checkbox"
              className="playoff-checkbox"
              checked={isPlayoff}
              onChange={(event) => setIsPlayoff(event.target.checked)}
            />
            <span className="playoff-checkbox-label">
              <span className="playoff-icon">🏆</span>
              Count this match as a playoff score
            </span>
          </label>

          {hasActiveWorldCup && (
            <div className="wc-stage-card" role="group" aria-label="World Cup stage selector">
              <div className="wc-stage-card__header">
                <div className="wc-stage-card__title">
                  <span className="wc-stage-card__icon" aria-hidden>🌍</span>
                  <span>World Cup stage</span>
                  <span className="wc-stage-card__live-dot" aria-hidden />
                </div>
                {isWc && (
                  <button
                    type="button"
                    className="wc-stage-card__clear"
                    onClick={() => {
                      setWcStage('');
                      setTournamentId('');
                    }}
                    aria-label="Clear World Cup selection"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="wc-stage-card__hint">
                Tag this match against a stage. Leave unselected for regular matches.
              </div>

              <div className="wc-stage-card__pills" role="radiogroup" aria-label="World Cup stage">
                {[
                  { value: 'super8', label: 'Super 8', icon: '8️⃣' },
                  { value: 'semi', label: 'Semi-Final', icon: '🥈' },
                  { value: 'final', label: 'Final', icon: '🏆' },
                ].map((opt) => {
                  const checked = wcStage === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      className={`wc-stage-pill${checked ? ' is-active' : ''}`}
                      onClick={() => setWcStage(checked ? '' : opt.value)}
                    >
                      <span className="wc-stage-pill__icon" aria-hidden>{opt.icon}</span>
                      <span className="wc-stage-pill__label">{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {isWc && (
                <div className="wc-stage-card__tournament">
                  <label className="wc-stage-card__field-label" htmlFor="wc-tournament-id">
                    Tournament <span className="wc-stage-card__required">*</span>
                  </label>
                  {tournamentsLoading ? (
                    <div className="wc-stage-card__muted">Loading tournaments…</div>
                  ) : wcTournaments.length === 0 ? (
                    <div className="wc-stage-card__muted">No running tournament.</div>
                  ) : (
                    <select
                      id="wc-tournament-id"
                      className="wc-stage-card__select"
                      value={tournamentId}
                      onChange={(event) => setTournamentId(event.target.value)}
                    >
                      <option value="">Select tournament</option>
                      {wcTournaments.map((tn) => (
                        <option key={tn._id} value={tn._id}>
                          {tn.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="wc-stage-card__field-help">
                    Required so the same opponent in different tournaments stays as separate entries.
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <div className="roster-hint">
          {rosterLoading ? (
            <span>Loading your roster…</span>
          ) : rosterOptions.length ? (
            <span>
              Your roster loaded · {rosterOptions.length} players available · {playerEntries.length} mapped in this upload
            </span>
          ) : (
            <span>No active roster players found for this account.</span>
          )}
          {opponentTeamName && (
            <>
              {opponentRosterLoading ? (
                <span> · Loading opponent roster…</span>
              ) : opponentRosterOptions.length ? (
                <span> · Opponent roster loaded · {opponentRosterOptions.length} players available</span>
              ) : opponentRosterError ? (
                <span> · Opponent roster: {opponentRosterError}</span>
              ) : (
                <span> · Opponent roster: Not available</span>
              )}
            </>
          )}
        </div>

        {/* OCR Controls disabled */}
        {/* <section className="ocr-controls">
          <div className="control-group">
            <label htmlFor="ocr-language">Language</label>
            <select id="ocr-language" value={language} onChange={(event) => setLanguage(event.target.value)}>
              <option value="eng">English</option>
              <option value="hin">Hindi</option>
              <option value="ben">Bengali</option>
              <option value="tam">Tamil</option>
              <option value="tel">Telugu</option>
              <option value="spa">Spanish</option>
              <option value="fra">French</option>
              <option value="deu">German</option>
            </select>
          </div>
          <div className="control-group checkbox">
            <label htmlFor="enhance-toggle">
              <input
                id="enhance-toggle"
                type="checkbox"
                checked={applyEnhancement}
                onChange={(event) => setApplyEnhancement(event.target.checked)}
              />
              Auto enhance before OCR
            </label>
          </div>
          <div className="control-group">
            <label htmlFor="upscale-range">Upscale ×{upscaleFactor.toFixed(1)}</label>
            <input
              id="upscale-range"
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={upscaleFactor}
              onChange={(event) => setUpscaleFactor(Number(event.target.value))}
              disabled={!applyEnhancement}
            />
          </div>
          <div className="control-group">
            <label htmlFor="contrast-range">Contrast {contrast.toFixed(2)}x</label>
            <input
              id="contrast-range"
              type="range"
              min="0.8"
              max="2"
              step="0.05"
              value={contrast}
              onChange={(event) => setContrast(Number(event.target.value))}
              disabled={!applyEnhancement}
            />
          </div>
          <div className="control-group">
            <label htmlFor="brightness-range">Brightness {brightness.toFixed(2)}x</label>
            <input
              id="brightness-range"
              type="range"
              min="0.7"
              max="1.5"
              step="0.05"
              value={brightness}
              onChange={(event) => setBrightness(Number(event.target.value))}
              disabled={!applyEnhancement}
            />
          </div>
          <div className="control-group">
            <label htmlFor="psm">Page layout</label>
            <select id="psm" value={pageSegMode} onChange={(event) => setPageSegMode(event.target.value)}>
              <option value="6">Uniform text block</option>
              <option value="3">Fully automatic</option>
              <option value="4">Column of text</option>
              <option value="5">Single line</option>
              <option value="11">Sparse text</option>
            </select>
          </div>
          <div className="control-group full-width">
            <label htmlFor="whitelist">Character whitelist</label>
            <input
              id="whitelist"
              type="text"
              value={charWhitelist}
              onChange={(event) => setCharWhitelist(event.target.value)}
              placeholder="Characters you expect in the document"
            />
          </div>
        </section> */}

        {rosterError && <div className="error-banner">{rosterError}</div>}
        {globalError && <div className="error-banner">{globalError}</div>}
        {saveMessage && <div className="success-banner">{saveMessage}</div>}
        
        {/* Beautiful Toast Notification */}
        {toast && (
          <div className={`toast-notification toast-${toast.type}`}>
            <div className="toast-content">
              <div className="toast-icon">
                {toast.type === 'success' && <FaCheckCircle />}
                {toast.type === 'error' && <FaTimesCircle />}
                {toast.type === 'warning' && <FaExclamationTriangle />}
              </div>
              <div className="toast-text">
                <div className="toast-message">{toast.message}</div>
                {toast.details && <div className="toast-details">{toast.details}</div>}
              </div>
              <button 
                className="toast-close" 
                onClick={() => setToast(null)}
                aria-label="Close notification"
              >
                <FaTimes />
              </button>
            </div>
            <div className="toast-progress"></div>
          </div>
        )}

        <section className="card-status-grid">
          {CARD_CONFIGS.map((cfg) => (
            <div key={`status-${cfg.key}`} className="card-status-chip">
              <span>{cfg.label}</span>
              <strong>{hasMeaningfulData(cfg.key) ? 'Ready' : 'Pending'}</strong>
            </div>
          ))}
        </section>

        {CARD_CONFIGS.map((cfg) => renderCardSection(cfg))}

        <div className="submit-row">
          <div>
            <p className="helper-text subtle">
              Upload at least one scorecard (team or opponent), map every row to a roster player, flag
              MoM where needed, then hit save to push each entry into Player Stats automatically.
            </p>
          </div>
          <button
            type="button"
            className="primary-btn"
            onClick={handleSubmitScorecard}
            disabled={!canSubmit}
          >
            {saving ? 'Saving stats…' : 'Save Player Stats'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OcrExtractor;

