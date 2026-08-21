import React, { useEffect, useMemo, useState } from 'react';
import { API_ENDPOINTS } from '../const';

const IST_OFFSET_MINUTES = 330;

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

function makeIstDate(year, month, day, hour, minute) {
  return new Date(Date.UTC(year, month - 1, day, hour, minute) - IST_OFFSET_MINUTES * 60 * 1000);
}

function addDaysIst(parts, delta) {
  const base = makeIstDate(parts.year, parts.month, parts.day, 0, 0);
  const next = new Date(base.getTime() + delta * 24 * 60 * 60 * 1000);
  return getIstParts(next);
}

function formatLeft(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}h ${m}m ${s}s`;
}

function toDateOnlyMsFromParts(parts) {
  return makeIstDate(parts.year, parts.month, parts.day, 0, 0).getTime();
}

const SCHEDULE = [
  { key: 'bulkStart', label: 'Auction bulk exits start', hour: 22, minute: 30, note: 'Every 10 min: second-highest exit starts' },
  { key: 'bulkStop', label: 'Bulk window 1 ends', hour: 0, minute: 10, note: 'First 10-min bulk window closes' },
  { key: 'lock', label: 'Team lock check', hour: 1, minute: 0, note: 'Lock under-limit teams' },
  { key: 'singleBidStart', label: 'Single-bid since start sell', hour: 1, minute: 30, note: 'One-time single-bid sell run' },
  { key: 'exitOnlyStart', label: 'Exit-only cycle starts', hour: 1, minute: 30, note: '1:30-2:10 AM: remove second-highest only' },
  { key: 'oneTimeSweep', label: 'One-time 2:18 sweep', hour: 2, minute: 18, note: 'Sell immediate where single bidder remains after second exit' },
  { key: 'counterWindowStart', label: 'Sell/exit cycle starts', hour: 2, minute: 20, note: '2:20-3:15 AM: 5-min sell/exit logic' },
  { key: 'counterWindowEnd', label: '5-min cycle ends', hour: 3, minute: 15, note: 'End of 2:20-3:15 AM block' },
  { key: 'twoMinWindowStart', label: '2-min fast cycle starts', hour: 3, minute: 16, note: '3:16-4:30 AM: every 2 min with 2-min exit check' },
  { key: 'twoMinWindowEnd', label: 'Night cycle ends', hour: 4, minute: 30, note: 'End of automated post-3:15 flow' },
];

const WHATSAPP_MESSAGE = `🏏 Auction Night Schedule (IST) - Updated

✅ 10:30 PM to 12:10 AM
• Bulk cycle every 10 min:
  - Remove second-highest bidder (exit)

✅ 1:00 AM
• Team lock check (under-limit lock process)

✅ 1:30 AM
• Single-bid since-start sell run begins
• Exit-only window starts (1:30 AM to 2:10 AM):
  - Remove second-highest bidder only

✅ 2:18 AM (ONE TIME ONLY)
• Special sweep:
  - If player has only one active bidder and second-highest already exited, sell immediately
  - No 5-minute new-bid wait check in this one-time sweep

✅ 2:20 AM to 3:15 AM
• Every 5 min cycle:
  - Remove second-highest bidder
  - If second-highest exit is older than 5 min, sell to highest bidder
  - Else keep in exit flow and continue cycle

✅ 3:16 AM to 4:30 AM
• Every 2 min cycle (same logic, faster):
  - Remove second-highest bidder
  - If second-highest exit is older than 2 min, sell to highest bidder
  - Else keep in exit flow and continue cycle

✅ Bid Queue Logic (Important)
• Queue joins only when exactly 2 active bidders exist
• Manual bidding is frozen for outside users while queue is waiting
• After second-highest exit, queue promotion is auto-triggered
• Promotion runs only if:
  - player is unsold
  - exactly 1 active bidder remains
  - queue head entry is valid for next bid
• Sell is blocked if queue has waiting users (status: queued)
• Sell is also blocked if 2+ active bidders still exist

ℹ️ All timings are in India time (IST).
ℹ️ Schedule shifted +2h30m from previous 8:00 PM start.`;

const WHATSAPP_MESSAGE_SHORT = `🏏 Auction Night Schedule (IST)

• 10:30 PM-12:10 AM: Bulk exit every 10 min
• 1:00 AM: Team lock check
• 1:30 AM-2:10 AM: Exit-only every 5 min
• 2:18 AM: One-time special sell sweep
• 2:20 AM-3:15 AM: 5-min sell/exit cycle (5-min check)
• 3:16 AM-4:30 AM: 2-min fast sell/exit cycle (2-min check)

Queue:
• Promotion auto-triggers after second-highest exits
• Sell blocked if queue has waiting users
• Sell blocked if 2+ active bidders remain

ℹ️ All timings are IST.`;

const QUEUE_RULES_EXAMPLE = `📢 Queue + Manual Bid Rules (Examples)

Core limits:
- Gold max 8
- Silver max 6
- Sapphire max 2
- Emerald max 4
- Emerald + Sapphire combined max 5
- Retained players are counted in the above limits

Queue join:
- You can join queue only when exactly 2 active bidders exist on that player
- If not exactly 2, queue join is blocked

Auto-promotion:
- After second-highest exits (manual/bulk/scheduler), queue promotion auto-check runs
- Promotion needs: player unsold + exactly 1 active bidder left + queue head valid for next bid

Manual bid + queue slot consumption:
- Queue slots consume bid capacity
- If active bids + queue entries already fill your category/concurrent slots, manual bid is blocked

Example A (Gold):
- Retained 1 Gold + bought 1 Gold + active bids on 5 Gold = 7 used
- Join queue on one more Gold => capacity reaches 8
- Now another new Gold manual bid is blocked until one active/queue slot frees up

Example B (Emerald + Sapphire):
- Retained: 1 Sapphire + 1 Emerald (2 used)
- Active bids: 2 Emerald (total 4 used)
- Join queue on 1 Sapphire => total reaches 5
- Now new Emerald/Sapphire manual bid is blocked until one ES slot is freed

Max exceeded behavior:
- If next legal bid becomes greater than your queue max, queue entry is removed and locked amount is refunded
- If already promoted and max is crossed during auto-bid, proxy exits and refund is processed`;

const QUEUE_MAX_RULE_UPDATE = `Queue Max Bid Rule (Latest Update)

- Max bid must match legal bid ladder only (no random values)
- Max must cover at least next 4 legal bid steps from current top
- Purse must be >= selected max lock amount
- Silver ladder:
  - 10L steps below 1 Cr
  - 50L steps at/after 1 Cr`;

function getCycleEvents(now = new Date(), auctionStartAt = null) {
  const nowIst = getIstParts(now);
  let anchor = nowIst.hour < 6 ? addDaysIst(nowIst, -1) : nowIst; // 00:xx belongs to previous evening cycle

  if (auctionStartAt) {
    const startDate = new Date(auctionStartAt);
    if (!Number.isNaN(startDate.getTime())) {
      const startParts = getIstParts(startDate);
      const startDateMs = toDateOnlyMsFromParts(startParts);
      const anchorDateMs = toDateOnlyMsFromParts(anchor);
      if (anchorDateMs < startDateMs) {
        anchor = startParts;
      }
    }
  }

  return SCHEDULE.map((item) => {
    const useNextDay = item.hour < 6;
    const dateParts = useNextDay ? addDaysIst(anchor, 1) : anchor;
    const at = makeIstDate(dateParts.year, dateParts.month, dateParts.day, item.hour, item.minute);
    return { ...item, at };
  });
}

export default function AuctionTimeline() {
  const [now, setNow] = useState(() => new Date());
  const [copyStatus, setCopyStatus] = useState('');
  const [auctionStartAt, setAuctionStartAt] = useState(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
  const [whatsAppMode, setWhatsAppMode] = useState('detailed');

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    let alive = true;
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_ENDPOINTS}/api/settings`);
        if (!res.ok) return;
        const data = await res.json();
        if (!alive) return;
        setAuctionStartAt(data?.auctionStartAt || null);
      } catch (_err) {
        // Keep timeline working with fallback cycle date when settings fetch fails.
      }
    };
    fetchSettings();
    return () => {
      alive = false;
    };
  }, []);

  const events = useMemo(() => getCycleEvents(now, auctionStartAt), [now, auctionStartAt]);

  const auctionStartLabel = useMemo(() => {
    if (!auctionStartAt) return 'Not set';
    const parsed = new Date(auctionStartAt);
    if (Number.isNaN(parsed.getTime())) return 'Not set';
    return parsed.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }, [auctionStartAt]);

  const whatsappText = whatsAppMode === 'short' ? WHATSAPP_MESSAGE_SHORT : WHATSAPP_MESSAGE;

  const handleCopyWhatsappFormat = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(whatsappText);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = whatsappText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopyStatus('WhatsApp format copied.');
    } catch (err) {
      setCopyStatus('Copy failed. Please copy manually from this page.');
    }
  };

  let currentIdx = -1;
  for (let i = 0; i < events.length - 1; i += 1) {
    if (now >= events[i].at && now < events[i + 1].at) {
      currentIdx = i;
      break;
    }
  }

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: isMobile ? 10 : 16 }}>
      <h2 style={{ marginBottom: 8 }}>Auction Time and Rules (IST)</h2>
      <p style={{ marginTop: 0, color: '#6b7280' }}>
        Human-readable nightly flow with live countdown. Lightweight page: no backend polling.
      </p>
      <p style={{ marginTop: 0, color: '#4b5563', fontSize: 13 }}>
        Base date source: admin setting <strong>Auction Start Time</strong> ({auctionStartLabel === 'Not set' ? 'fallback to current day' : auctionStartLabel + ' IST'}).
      </p>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setWhatsAppMode('short')}
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              padding: '6px 10px',
              cursor: 'pointer',
              background: whatsAppMode === 'short' ? '#e2e8f0' : '#fff',
              fontWeight: 600,
            }}
          >
            Short WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setWhatsAppMode('detailed')}
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              padding: '6px 10px',
              cursor: 'pointer',
              background: whatsAppMode === 'detailed' ? '#e2e8f0' : '#fff',
              fontWeight: 600,
            }}
          >
            Detailed WhatsApp
          </button>
        </div>
        <button
          type="button"
          onClick={handleCopyWhatsappFormat}
          style={{
            background: '#0f766e',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: isMobile ? '10px 12px' : '8px 12px',
            cursor: 'pointer',
            fontWeight: 600,
            width: isMobile ? '100%' : 'auto',
          }}
        >
          Copy WhatsApp Format
        </button>
        {copyStatus ? (
          <span style={{ marginLeft: isMobile ? 0 : 10, display: isMobile ? 'block' : 'inline', marginTop: isMobile ? 8 : 0, color: '#374151', fontSize: 13 }}>
            {copyStatus}
          </span>
        ) : null}
      </div>
      <div
        style={{
          marginBottom: 14,
          border: '1px solid #dbeafe',
          borderRadius: 10,
          padding: isMobile ? 10 : 12,
          background: '#eff6ff',
          fontSize: isMobile ? 12 : 13,
          color: '#1e3a8a',
          lineHeight: 1.5,
        }}
      >
        <strong>Queue Flow (auto-promotion):</strong> after each second-highest exit (manual + bulk + scheduler), the system tries queue promotion.
        Promotion happens only when player is unsold, exactly one active bidder remains, and queue head is eligible for next bid.
        Selling is blocked if queue has waiting users.
      </div>
      <div
        style={{
          marginBottom: 14,
          border: '1px solid #fde68a',
          borderRadius: 10,
          padding: isMobile ? 10 : 12,
          background: '#fffbeb',
          fontSize: isMobile ? 12 : 13,
          color: '#92400e',
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
        }}
      >
        {QUEUE_MAX_RULE_UPDATE}
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {events.map((event, idx) => {
          const isPast = now >= event.at;
          const isCurrent = currentIdx === idx;
          const nextMs = event.at.getTime() - now.getTime();
          return (
            <div
              key={event.key}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                padding: isMobile ? 10 : 12,
                background: isCurrent ? '#ecfeff' : '#fff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <strong>{event.label}</strong>
                <span style={{ color: isCurrent ? '#0f766e' : '#374151' }}>
                  {event.at.toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    day: '2-digit',
                    month: 'short',
                    hour12: true,
                  })}
                </span>
              </div>
              <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>{event.note}</div>
              <div style={{ marginTop: 6, fontSize: isMobile ? 12 : 13 }}>
                {isCurrent
                  ? 'Live now'
                  : isPast
                  ? 'Done'
                  : `Starts in ${formatLeft(nextMs)}`}
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          marginTop: 16,
          border: '1px dashed #d1d5db',
          borderRadius: 10,
          padding: 12,
          background: '#fafafa',
          whiteSpace: 'pre-wrap',
          fontSize: isMobile ? 12 : 13,
          color: '#1f2937',
        }}
      >
        {whatsappText}
      </div>
      <div
        style={{
          marginTop: 14,
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          padding: 12,
          background: '#ffffff',
          whiteSpace: 'pre-wrap',
          fontSize: isMobile ? 12 : 13,
          color: '#111827',
          lineHeight: 1.5,
        }}
      >
        {QUEUE_RULES_EXAMPLE}
      </div>
    </div>
  );
}

