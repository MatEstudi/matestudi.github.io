/** Derived study statistics. */
import { SUBJECT_IDS } from './config.js';
import { state } from './state.js';
import { dateKey, startOfWeek } from './utils/format.js';

/** Seconds studied on a given 'YYYY-MM-DD' day. */
export const secondsOn = key => state.hist[key]?.t || 0;

export function computeStats() {
  const todayKey = dateKey();
  const monday = startOfWeek();
  let week = 0;
  Object.entries(state.hist).forEach(([key, entry]) => {
    const [y, m, d] = key.split('-').map(Number);
    if (new Date(y, m - 1, d) >= monday) week += entry.t;
  });
  return {
    total: SUBJECT_IDS.reduce((sum, id) => sum + state.tot[id], 0),
    today: secondsOn(todayKey),
    todayKey,
    week,
    weekKey: dateKey(monday),
  };
}

/** Consecutive days with study time, ending today (or yesterday if today has none yet). */
export function currentStreak() {
  const d = new Date();
  if (!secondsOn(dateKey(d))) d.setDate(d.getDate() - 1);
  let days = 0;
  while (secondsOn(dateKey(d)) > 0) {
    days++;
    d.setDate(d.getDate() - 1);
  }
  return days;
}
