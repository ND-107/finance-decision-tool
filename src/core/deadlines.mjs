// deadlines.mjs — pure deadline overlay for plan actions.
//
// v1 had no way to represent statutory deadlines on actions (V2_REBUILD_PLAN.md
// §2.2). This module attaches deadline urgency to a plan's actions by matching
// each action TITLE against the deadline records in src/data/deadlines.json.
// It does NOT touch plan-rules.mjs or plan-engine.mjs — the overlay is a
// disjoint layer that runs over a computed plan.
//
// PURITY: nothing here reads the wall clock. Every function takes `today` as an
// ISO `YYYY-MM-DD` string and parses dates from strings, so the whole module is
// deterministic and testable with explicit dates.
//
// Deadline record shape (src/data/deadlines.json):
//   { matchTitle, match: "exact"|"prefix", kind: "fixed"|"relative",
//     date?  (ISO, for fixed),  offset? (e.g. "grantDate+30d", for relative),
//     source, note }
//
// Urgency tiers (relative to `today`):
//   "overdue"   dueDate is strictly before today
//   "critical"  due within 30 days (inclusive)
//   "soon"      due within 90 days (inclusive)
//   "upcoming"  due more than 90 days out
//   "unknown"   a relative deadline whose grantDate is not supplied

import DEADLINES from '../data/deadlines.json' with { type: 'json' };

const CRITICAL_DAYS = 30;
const SOON_DAYS = 90;

/**
 * Parse an ISO `YYYY-MM-DD` string to an integer count of days since the Unix
 * epoch (UTC). Pure: does not read the system clock and ignores any time zone.
 * @param {string} iso
 * @returns {number} epoch-day integer
 */
function isoToEpochDay(iso) {
  if (typeof iso !== 'string') throw new Error(`expected ISO date string, got ${typeof iso}`);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`invalid ISO date "${iso}" (want YYYY-MM-DD)`);
  const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Math.floor(ms / 86400000);
}

/** Inverse of isoToEpochDay — epoch-day integer → `YYYY-MM-DD`. */
function epochDayToIso(day) {
  const d = new Date(day * 86400000); // a fixed epoch arithmetic, not "now"
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
  const da = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

/**
 * Parse a relative offset like "grantDate+30d" → { base, days }.
 * @param {string} offset
 * @returns {{ base: string, days: number }}
 */
function parseOffset(offset) {
  const m = /^([A-Za-z][A-Za-z0-9]*)\+(\d+)d$/.exec(offset || '');
  if (!m) throw new Error(`invalid relative offset "${offset}" (want e.g. "grantDate+30d")`);
  return { base: m[1], days: Number(m[2]) };
}

/** Map a signed day-delta (dueDate − today) to an urgency tier. */
function urgencyFor(daysRemaining) {
  if (daysRemaining < 0) return 'overdue';
  if (daysRemaining <= CRITICAL_DAYS) return 'critical';
  if (daysRemaining <= SOON_DAYS) return 'soon';
  return 'upcoming';
}

/**
 * Find the deadline record matching an action title (exact, else prefix).
 * Exact matches win over prefix matches.
 * @param {string} title
 * @returns {object|null}
 */
function matchRecord(title) {
  if (typeof title !== 'string') return null;
  let prefixHit = null;
  for (const rec of DEADLINES) {
    if (rec.match === 'prefix') {
      if (prefixHit == null && title.startsWith(rec.matchTitle)) prefixHit = rec;
    } else if (title === rec.matchTitle) {
      return rec; // exact beats prefix
    }
  }
  return prefixHit;
}

/**
 * Resolve the deadline (if any) for a single action title.
 * @param {string} actionTitle
 * @param {string} today  ISO `YYYY-MM-DD`
 * @param {{ grantDate?: string }} [ctx]  context for relative deadlines
 * @returns {null | {
 *   kind: 'fixed'|'relative',
 *   dueDate: string|null,
 *   daysRemaining: number|null,
 *   urgency: 'overdue'|'critical'|'soon'|'upcoming'|'unknown',
 *   source: string,
 *   note: string,
 *   expired: boolean
 * }}
 */
export function deadlineFor(actionTitle, today, ctx = {}) {
  const rec = matchRecord(actionTitle);
  if (!rec) return null;

  const todayDay = isoToEpochDay(today);

  // Resolve the due date as an epoch-day (or null when a relative deadline
  // lacks the grantDate it needs).
  let dueDay = null;
  if (rec.kind === 'fixed') {
    dueDay = isoToEpochDay(rec.date);
  } else {
    const { base, days } = parseOffset(rec.offset);
    const baseIso = ctx && ctx[base];
    if (baseIso != null) dueDay = isoToEpochDay(baseIso) + days;
  }

  if (dueDay == null) {
    // Relative deadline with no base date supplied — due date is unknown.
    return {
      kind: rec.kind,
      dueDate: null,
      daysRemaining: null,
      urgency: 'unknown',
      source: rec.source,
      note: rec.note,
      expired: false,
    };
  }

  const daysRemaining = dueDay - todayDay;
  return {
    kind: rec.kind,
    dueDate: epochDayToIso(dueDay),
    daysRemaining,
    urgency: urgencyFor(daysRemaining),
    source: rec.source,
    note: rec.note,
    expired: daysRemaining < 0,
  };
}

/**
 * Return a NEW plan-like object where each action gains an optional `deadline`
 * field (from deadlineFor). Does not mutate the input plan or its actions.
 * @param {{ actions?: object[] }} plan
 * @param {string} today  ISO `YYYY-MM-DD`
 * @param {{ grantDate?: string }} [ctx]
 * @returns {object} a shallow clone of `plan` with cloned, annotated actions
 */
export function annotateDeadlines(plan, today, ctx = {}) {
  const actions = (plan && plan.actions) || [];
  const annotated = actions.map((act) => {
    const deadline = deadlineFor(act.title, today, ctx);
    return deadline ? { ...act, deadline } : { ...act };
  });
  return { ...plan, actions: annotated };
}

export const __internal = { isoToEpochDay, epochDayToIso, parseOffset, urgencyFor, matchRecord };
