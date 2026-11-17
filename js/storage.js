/** Persistence in localStorage, with validation and migration of older data. */
import {
  COLORS, DAY_SECONDS, LEGACY_STORAGE_KEYS, MAX_SESSIONS, NICK_MAX, STORAGE_KEY, SUBJECT_IDS,
} from './config.js';
import { createBlankState, replaceState, state } from './state.js';
import { clampInt } from './utils/format.js';

/**
 * Builds a valid state from untrusted data (localStorage, imported backups, or the
 * older v1 format). Unknown fields are dropped, so data saved by earlier versions
 * (such as notes, tasks or the old theme setting) is simply ignored.
 */
export function sanitizeState(raw) {
  const next = createBlankState();
  const o = raw && typeof raw === 'object' ? raw : {};

  next.nick = String(o.nick ?? o.userProfile?.nickname ?? '').trim().slice(0, NICK_MAX);
  const color = o.color ?? o.userProfile?.avatarColor;
  next.color = COLORS.includes(color) ? color : COLORS[0];
  next.goalD = Math.min(24, clampInt(o.goalD ?? o.dailyGoalHours) || 3);
  next.goalW = Math.min(168, clampInt(o.goalW ?? o.weeklyGoalHours) || 15);
  next.sel = SUBJECT_IDS.includes(o.sel) ? o.sel : SUBJECT_IDS[0];
  next.range = o.range === 30 ? 30 : 7;
  next.mode = o.mode === 'pomo' ? 'pomo' : 'free';

  SUBJECT_IDS.forEach(id => {
    next.tot[id] = clampInt(o.tot?.[id] ?? o.subjects?.[id]?.totalSeconds);
  });

  const hist = o.hist ?? o.dailyHistory;
  if (hist && typeof hist === 'object') {
    Object.keys(hist)
      .filter(key => /^\d{4}-\d{2}-\d{2}$/.test(key))
      .forEach(key => {
        const entry = { t: 0 };
        SUBJECT_IDS.forEach(id => {
          entry[id] = clampInt(hist[key]?.[id], DAY_SECONDS);
          entry.t += entry[id];
        });
        if (entry.t) next.hist[key] = entry;
      });
  }

  const sessions = o.sess ?? o.sessions;
  next.sess = (Array.isArray(sessions) ? sessions : [])
    .filter(x => x && typeof x === 'object')
    .map(x => ({
      s: x.s ?? x.subjectId,
      d: clampInt(x.d ?? x.durationSeconds, DAY_SECONDS),
      at: x.at ?? (Date.parse(x.dateISO) || 0),
      n: String(x.n ?? x.note ?? '').slice(0, 60),
    }))
    .filter(x => SUBJECT_IDS.includes(x.s) && x.d > 0)
    .slice(0, MAX_SESSIONS);

  return next;
}

/** Reads the stored state, falling back to the keys used before the rename. */
function readStored() {
  try {
    for (const key of [STORAGE_KEY, ...LEGACY_STORAGE_KEYS]) {
      const value = localStorage.getItem(key);
      if (value) return JSON.parse(value);
    }
  } catch { /* storage unavailable or corrupted: start from a blank state */ }
  return null;
}

export function loadState() {
  replaceState(sanitizeState(readStored()));
}

let saveTimer = 0;

/** Saves the state: immediately, or debounced by 3 s when `immediate` is false. */
export function save(immediate = false) {
  clearTimeout(saveTimer);
  const write = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, run: null }));
    } catch { /* storage full or unavailable */ }
  };
  if (immediate) write();
  else saveTimer = setTimeout(write, 3000);
}

/**
 * With several tabs open, the one that starts the timer is the source of truth:
 * before starting, pull the progress another tab may have stored in the meantime.
 */
export function pullProgressFromStorage() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (raw) {
      const stored = sanitizeState(raw);
      state.tot = stored.tot;
      state.hist = stored.hist;
      state.sess = stored.sess;
    }
  } catch { /* ignore */ }
}
