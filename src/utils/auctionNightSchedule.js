/**
 * CPL auction night schedule (IST).
 * Used by Admin panel, Auction Timeline, My Bids, and WhatsApp copy.
 */

function pad(n) {
  return String(n).padStart(2, '0');
}

function getIstParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const bag = {};
  parts.forEach((p) => {
    if (p.type !== 'literal') bag[p.type] = p.value;
  });
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour: Number(bag.hour),
    minute: Number(bag.minute),
    second: Number(bag.second),
  };
}

function istDate(year, month, day, hour, minute, second = 0) {
  return new Date(
    `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}+05:30`
  );
}

function addIstDays(year, month, day, n) {
  const utc = Date.UTC(year, month - 1, day + n, 6, 30, 0);
  return getIstParts(new Date(utc));
}

function minutesOfDay(hour, minute) {
  return hour * 60 + minute;
}

/**
 * Minutes from 9:00 PM IST. After midnight (until 9:00 AM) continues the same night.
 * Before 9:00 PM (9:00 AM–8:59 PM) returns negative = waiting.
 */
export function minutesFromNinePm(now = new Date()) {
  const { hour, minute } = getIstParts(now);
  const tod = minutesOfDay(hour, minute);
  const ninePm = minutesOfDay(21, 0);
  if (tod >= ninePm) return tod - ninePm;
  if (tod < minutesOfDay(9, 0)) return tod + 24 * 60 - ninePm;
  return tod - ninePm;
}

export const AUCTION_PHASES = [
  {
    id: 'waiting',
    until: 0,
    title: 'Waiting for 9:00 PM',
    meaning: 'Nothing automatic yet. Bidding can still happen. Auto Mode will start categories + bulk exit at 9:00 PM IST.',
    sells: false,
    exits: false,
  },
  {
    id: 'bulk1',
    until: 105, // 10:45 PM
    title: 'Bulk Exit Window 1',
    range: '9:00 PM – 10:45 PM',
    meaning: 'Every 10 minutes: remove 2nd-highest bidder only. NO selling in this window.',
    sells: false,
    exits: true,
  },
  {
    id: 'pauseAfterBulk1',
    until: 120, // 11:00 PM
    title: 'Pause',
    range: '10:45 PM – 11:00 PM',
    meaning: 'Bulk exit stopped. No auto exit. No auto sell. Waiting for lock check at 11:00 PM.',
    sells: false,
    exits: false,
  },
  {
    id: 'lock',
    until: 150, // 11:30 PM
    title: 'Lock check + pause',
    range: '11:00 PM – 11:30 PM',
    meaning: 'At 11:00 PM sharp: lock teams that are under roster limits (categories from Admin). Then pause until 11:30. Still NO sell-after-exit.',
    sells: false,
    exits: false,
  },
  {
    id: 'bulk2',
    until: 210, // 12:30 AM
    title: 'Single-bid sell + Bulk Exit Window 2',
    range: '11:30 PM – 12:30 AM',
    meaning: 'At 11:30 PM: sell players who NEVER got a counter bid (only 1 bid since start). Then until 12:30 AM: bulk exit 2nd-highest every 10 min. NO sell-after-exit yet.',
    sells: 'single-bid-only at 11:30',
    exits: true,
  },
  {
    id: 'pauseBeforeSell',
    until: 225, // 12:45 AM
    title: 'Pause',
    range: '12:30 AM – 12:45 AM',
    meaning: 'Bulk exit stopped. No auto exit. Waiting for 12:45 AM sell-after-exit.',
    sells: false,
    exits: false,
  },
  {
    id: 'sellAfterExit',
    until: 420, // 4:00 AM
    title: 'Sell after 2nd-highest exit',
    range: '12:45 AM – 4:00 AM',
    meaning: 'At 12:45 AM: sell anyone left with only 1 bidder (2nd already exited) — no new exits. From 12:50 AM every 5 min: exit 2nd-highest if 2+ bidders; if 1 bidder left AND 2nd-highest exited at least 2 minutes ago with no new bid → SELL. Continues until players are sold.',
    sells: true,
    exits: true,
  },
  {
    id: 'ended',
    until: Infinity,
    title: 'Night cycle ended',
    range: 'after 4:00 AM',
    meaning: 'Automatic exit/sell cycle has stopped for this night.',
    sells: false,
    exits: false,
  },
];

export function getAuctionNightPhase(now = new Date()) {
  const m = minutesFromNinePm(now);
  let phase = AUCTION_PHASES[AUCTION_PHASES.length - 1];
  if (m < 0) phase = AUCTION_PHASES[0];
  else {
    for (const p of AUCTION_PHASES) {
      if (m < p.until) {
        phase = p;
        break;
      }
    }
  }

  let liveMoment = null;
  if (phase.id === 'lock' && m >= 120 && m < 122) {
    liveMoment = 'LOCK CHECK IS RUNNING NOW (11:00 PM sharp)';
  } else if (phase.id === 'bulk2' && m >= 150 && m < 152) {
    liveMoment = 'SELLING PLAYERS WITH NO COUNTER BID SINCE START (11:30 PM)';
  } else if (phase.id === 'sellAfterExit' && m >= 225 && m < 227) {
    liveMoment = 'SELLING PLAYERS WHERE THE OTHER BID ALREADY EXITED (12:45 AM)';
  }

  return { ...phase, minutesFromStart: m, liveMoment };
}

export function getExpectedCronFlags(phaseId) {
  if (phaseId === 'bulk1') {
    return {
      cronBulkExitEnabled: true,
      cronSingleBidEnabled: false,
      cronSingleBidFinalizerEnabled: false,
      cronLockEnabled: false,
    };
  }
  if (phaseId === 'lock') {
    return {
      cronBulkExitEnabled: false,
      cronSingleBidEnabled: false,
      cronSingleBidFinalizerEnabled: false,
      cronLockEnabled: true,
    };
  }
  if (phaseId === 'bulk2') {
    return {
      cronBulkExitEnabled: true,
      cronSingleBidEnabled: false,
      cronSingleBidFinalizerEnabled: true,
      cronLockEnabled: false,
    };
  }
  if (phaseId === 'sellAfterExit') {
    return {
      cronBulkExitEnabled: false,
      cronSingleBidEnabled: true,
      cronSingleBidFinalizerEnabled: false,
      cronLockEnabled: false,
    };
  }
  return {
    cronBulkExitEnabled: false,
    cronSingleBidEnabled: false,
    cronSingleBidFinalizerEnabled: false,
    cronLockEnabled: false,
  };
}

/** Flags to persist so the 11:00 / 11:30 / 12:45 jobs are armed a couple of minutes early. */
export function getArmedCronFlags(phaseId, minutesFromStart) {
  const flags = getExpectedCronFlags(phaseId);
  const m = minutesFromStart;
  if (typeof m === 'number' && m >= 0) {
    if (m >= 118 && m < 150) flags.cronLockEnabled = true;
    if (m >= 148 && m < 155) flags.cronSingleBidFinalizerEnabled = true;
    if (m >= 223 && m < 420) flags.cronSingleBidEnabled = true;
  }
  return flags;
}

export function formatIstClock(now = new Date()) {
  return now.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

/** Night windows with correct IST dates (handles after-midnight). */
export function getAuctionNightWindows(now = new Date(), cronSettings = {}) {
  const p = getIstParts(now);
  const afterMidnight = p.hour < 9;
  const eve = afterMidnight ? addIstDays(p.year, p.month, p.day, -1) : p;
  const morn = afterMidnight ? p : addIstDays(p.year, p.month, p.day, 1);
  const dEve = (h, m) => istDate(eve.year, eve.month, eve.day, h, m);
  const dMorn = (h, m) => istDate(morn.year, morn.month, morn.day, h, m);

  return [
    {
      key: 'bulk1',
      title: 'Bulk Exit Window 1',
      range: '9:00–10:45 PM',
      start: dEve(21, 0),
      end: dEve(22, 45),
      interval: 10,
      action: 'Every 10 min: remove 2nd-highest only. NO selling.',
      enabled: cronSettings.cronBulkExitEnabled,
    },
    {
      key: 'pause1',
      title: 'Pause',
      range: '10:45–11:00 PM',
      start: dEve(22, 45),
      end: dEve(23, 0),
      interval: null,
      action: 'Bulk stopped. Waiting for 11:00 lock check.',
      enabled: true,
    },
    {
      key: 'lock',
      title: 'Lock check',
      range: '11:00–11:30 PM',
      start: dEve(23, 0),
      end: dEve(23, 30),
      interval: null,
      action: '11:00 sharp: lock under-limit teams (Admin categories). Then pause.',
      enabled: cronSettings.cronLockEnabled,
    },
    {
      key: 'bulk2',
      title: 'No-counter sell + Bulk Exit Window 2',
      range: '11:30 PM–12:30 AM',
      start: dEve(23, 30),
      end: dMorn(0, 30),
      interval: 10,
      action: '11:30: sell never-got-counter-bid. Then bulk exit only until 12:30. NO sell-after-exit.',
      enabled: cronSettings.cronBulkExitEnabled,
    },
    {
      key: 'pause2',
      title: 'Pause',
      range: '12:30–12:45 AM',
      start: dMorn(0, 30),
      end: dMorn(0, 45),
      interval: null,
      action: 'Bulk stopped. Waiting for 12:45 sell-after-exit.',
      enabled: true,
    },
    {
      key: 'sellAfterExit',
      title: 'Sell after 2nd-highest exit',
      range: '12:45 AM–4:00 AM',
      start: dMorn(0, 45),
      end: dMorn(4, 0),
      interval: 5,
      action: '12:45: sell if 2nd already gone (no exit). From 12:50 every 5 min: exit 2nd / sell if exited ≥ 2 min.',
      enabled: cronSettings.cronSingleBidEnabled,
    },
  ];
}

export const WHATSAPP_MESSAGE = `🏏 CPL Auction Night (IST)

📌 All times India time
📌 Auto Mode ON = system switches itself
📌 NO sell-after-exit before 12:45 AM

────────────────────
🕘 9:00 PM
────────────────────
• Auction auto start
• Categories go LIVE
• Bulk Exit ON

────────────────────
🕘 9:00 PM – 10:45 PM
────────────────────
• ONLY bulk exit every 10 minutes
• Removes 2nd highest bidder
• ❌ NO selling

────────────────────
🕥 10:45 PM
────────────────────
• Bulk Exit STOPPED
• ❌ No exit, ❌ no sell

────────────────────
🕚 11:00 PM SHARP
────────────────────
• Account lock check (once)
• Uses categories enabled in Admin
• Teams under limit get LOCKED

────────────────────
🕚 11:00 – 11:30 PM
────────────────────
• Pause
• ❌ No bulk exit
• ❌ No sell

────────────────────
🕚 11:30 PM
────────────────────
• Sell players with NO counter bid since start
  (only 1 bid ever → sold to that bidder)

────────────────────
🕚 11:30 PM – 12:30 AM
────────────────────
• ONLY bulk exit every 10 minutes
• Removes 2nd highest bidder
• ❌ NO sell-after-exit yet

────────────────────
🕧 12:30 AM
────────────────────
• Bulk Exit STOPPED

────────────────────
🕧 12:45 AM
────────────────────
• Sell players where the other bid already exited
  (only 1 bidder left → SOLD)
• ❌ No new exits this minute

────────────────────
🕧 12:50 AM onwards
────────────────────
• Every 5 minutes:
  - If 2+ bidders → exit 2nd highest only
  - If 1 bidder left AND 2nd highest exited ≥ 2 minutes ago
    AND no new bid → SOLD
• Keeps running until players are sold
• ❌ Never sells while 2 bidders are still fighting

────────────────────
🧠 SIMPLE
────────────────────
1️⃣ 9:00–10:45 & 11:30–12:30 → exit only (no sell)
2️⃣ 11:00 → lock under-limit teams
3️⃣ 11:30 → sell “never got a counter bid”
4️⃣ 12:45 → sell already-solo lots only; 12:50+ exit then sell after ≥ 2 min

ℹ️ Queue waiting users can block a sell for that player`;

export const WHATSAPP_MESSAGE_SHORT = `🏏 CPL Auction Night (IST)

• 9:00–10:45 PM: Bulk exit only (no sell)
• 10:45 PM: Bulk stop
• 11:00 PM: Lock check
• 11:30 PM: Sell players with no counter bid since start
• 11:30 PM–12:30 AM: Bulk exit only (no sell)
• 12:45 AM: Sell if 2nd bidder already gone (no exit)
• 12:50 AM onwards: every 5 min exit + sell if 2nd gone ≥ 2 min

❌ No sell-after-exit before 12:45 AM
ℹ️ All times IST`;
