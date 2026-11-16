export const $ = s => document.querySelector(s);

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

export const num = (v, max = 1e9) => Math.min(max, Math.max(0, Math.floor(+v || 0)));

export const dk = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const monday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
};

export const hm = s => {
  s = Math.floor(s);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h} h ${m} min` : `${m} min`;
};

export const clock = s => {
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const x = s % 60;
  const p = n => String(n).padStart(2, '0');
  return (h ? `${h}:` : '') + p(m) + ':' + p(x);
};

export const hhmm = t => {
  const d = new Date(t || Date.now());
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
};

export function toast(m) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = m;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2600);
}

export function bell() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const a = new AudioCtx();
    const o = a.createOscillator();
    const g = a.createGain();
    o.frequency.value = 880;
    o.connect(g);
    g.connect(a.destination);
    g.gain.setValueAtTime(0.2, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 1.4);
    o.start();
    o.stop(a.currentTime + 1.5);
  } catch (e) {
    // Ignore audio context restriction errors
  }
}