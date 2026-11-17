/** Number, date and duration helpers. */

/** Single-letter weekday labels in Spanish, indexed by Date#getDay() (0 = Sunday). */
export const WEEKDAY_LETTERS = 'DLMXJVS';

const pad2 = n => String(n).padStart(2, '0');

/** Coerces any value to an integer in the range [0, max]. */
export const clampInt = (value, max = 1e9) => Math.min(max, Math.max(0, Math.floor(+value || 0)));

/** Local date as 'YYYY-MM-DD'. */
export const dateKey = (date = new Date()) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

/** Midnight of the Monday of the current week. */
export const startOfWeek = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
};

/** Seconds as '2 h 5 min' or '45 min'. */
export const formatDuration = seconds => {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h} h ${m} min` : `${m} min`;
};

/** Seconds as 'mm:ss' or 'h:mm:ss'. */
export const formatClock = seconds => {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return (h ? h + ':' : '') + pad2(m) + ':' + pad2(s % 60);
};

/** Timestamp as 'hh:mm' (local time). */
export const formatTime = timestamp => {
  const d = new Date(timestamp || Date.now());
  return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
};
