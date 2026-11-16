import { POMO, IDS, COLORS } from './config.js';
import { dk, monday } from './utils.js';

export const blank = () => ({
  theme: 'auto',
  brutal: false,
  view: 'study',
  sel: 'fonaments',
  mode: 'free',
  rank: 'daily',
  gv: 'friends',
  range: 7,
  nick: '',
  color: COLORS[0],
  goalD: 3,
  goalW: 15,
  tot: { fonaments: 0, algebra: 0, analisi: 0 },
  hist: {},
  sess: [],
  run: null,
  cur: 0,
  phase: 0,
  rem: POMO[0]
});

export let S = blank();

export function setState(next) {
  S = next;
}

export const day = k => S.hist[k]?.t || 0;

export function addTime(id, d) {
  S.tot[id] += d;
  const k = dk();
  const e = S.hist[k] || (S.hist[k] = { t: 0, fonaments: 0, algebra: 0, analisi: 0 });
  e[id] += d;
  e.t += d;
}

export function stats() {
  const k = dk();
  const m = monday();
  let w = 0;
  Object.entries(S.hist).forEach(([d, v]) => {
    const [y, mo, da] = d.split('-').map(Number);
    if (new Date(y, mo - 1, da) >= m) w += v.t;
  });
  return {
    total: IDS.reduce((a, i) => a + S.tot[i], 0),
    today: day(k),
    todayKey: k,
    week: w,
    weekKey: dk(m)
  };
}

export function streak() {
  let n = 0;
  const d = new Date();
  if (!day(dk(d))) d.setDate(d.getDate() - 1);
  while (day(dk(d)) > 0) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}