import { KEY, OLD_KEYS, IDS, COLORS } from './config.js';
import { num } from './utils.js';
import { S, blank, setState } from './state.js';

let saveT = 0;

function readRawStorage() {
  const raw = localStorage.getItem(KEY);
  if (raw) return raw;
  for (const oldKey of OLD_KEYS) {
    const legacy = localStorage.getItem(oldKey);
    if (legacy) return legacy;
  }
  return null;
}

export function clean(p) {
  const b = blank();
  const o = p && typeof p === 'object' ? p : {};

  b.theme = o.theme === 'dark' || o.theme === 'light' ? o.theme : 'auto';
  b.brutal = !!o.brutal;
  b.nick = String(o.nick ?? o.userProfile?.nickname ?? '').trim().slice(0, 20);

  const col = o.color ?? o.userProfile?.avatarColor;
  b.color = COLORS.includes(col) ? col : COLORS[0];

  b.goalD = Math.min(24, num(o.goalD ?? o.dailyGoalHours) || 3);
  b.goalW = Math.min(168, num(o.goalW ?? o.weeklyGoalHours) || 15);
  b.sel = IDS.includes(o.sel) ? o.sel : 'fonaments';
  b.range = o.range === 30 ? 30 : 7;
  b.mode = o.mode === 'pomo' ? 'pomo' : 'free';

  IDS.forEach(i => {
    b.tot[i] = num(o.tot?.[i] ?? o.subjects?.[i]?.totalSeconds);
  });

  const h = o.hist ?? o.dailyHistory;
  if (h && typeof h === 'object') {
    Object.keys(h)
      .filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k))
      .forEach(k => {
        const e = { t: 0 };
        IDS.forEach(i => {
          e[i] = num(h[k]?.[i], 86400);
          e.t += e[i];
        });
        if (e.t) b.hist[k] = e;
      });
  }

  const sess = o.sess ?? o.sessions;
  b.sess = (Array.isArray(sess) ? sess : [])
    .map(x => ({
      s: x.s ?? x.subjectId,
      d: num(x.d ?? x.durationSeconds, 86400),
      at: x.at ?? (Date.parse(x.dateISO) || 0),
      n: String(x.n ?? x.note ?? '').slice(0, 60)
    }))
    .filter(x => IDS.includes(x.s) && x.d > 0)
    .slice(0, 50);

  return b;
}

export function load() {
  let r;
  try {
    r = JSON.parse(readRawStorage());
  } catch (e) {
    r = null;
  }
  setState(clean(r));
}

export function loadTotals() {
  try {
    const r = JSON.parse(readRawStorage());
    if (r) {
      const o = clean(r);
      S.tot = o.tot;
      S.hist = o.hist;
      S.sess = o.sess;
    }
  } catch (e) {
    // Ignore parse failures
  }
}

export function save(now = false) {
  clearTimeout(saveT);
  const go = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...S, run: null }));
    } catch (e) {
      // Ignore quota/private-mode storage errors
    }
  };
  if (now) go();
  else saveT = setTimeout(go, 3000);
}