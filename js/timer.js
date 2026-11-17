/** Study timer: free mode and Pomodoro 50/10. */
import { DAY_MS, MAX_SESSIONS, MIN_SESSION_SECONDS, POMODORO_SECONDS } from './config.js';
import { state, emptyTotals } from './state.js';
import { pullProgressFromStorage, save } from './storage.js';
import { sync } from './services/community.js';
import { render } from './ui/renderer.js';
import { paint } from './views/study-view.js';
import { toast } from './utils/dom.js';
import { dateKey, formatDuration } from './utils/format.js';

let lastTick = 0;
let loop = null;
let tickCount = 0;

function addTime(subjectId, seconds) {
  state.tot[subjectId] += seconds;
  const key = dateKey();
  const entry = state.hist[key] || (state.hist[key] = { t: 0, ...emptyTotals() });
  entry[subjectId] += seconds;
  entry.t += seconds;
}

function bell() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + 1.4);
    osc.start();
    osc.stop(ctx.currentTime + 1.5);
  } catch { /* audio not available */ }
}

/** Saves the current session in the history (if long enough) and resets it. */
function endSession(note) {
  if (state.cur >= MIN_SESSION_SECONDS) {
    state.sess.unshift({ s: state.run || state.sel, d: state.cur, at: Date.now(), n: note });
    state.sess = state.sess.slice(0, MAX_SESSIONS);
  }
  state.cur = 0;
}

/** Re-renders the tabs that show live data (stats, community) every ~10 s while timing. */
function refreshPassiveViews() {
  const passive = (state.view === 'group' && state.gv !== 'chat') || state.view === 'stats';
  if (passive && tickCount % 10 === 0 && document.activeElement.tagName !== 'INPUT') render();
}

function tick() {
  const elapsed = Math.floor((Date.now() - lastTick) / 1000);
  if (elapsed < 1 || !state.run) return;
  lastTick += elapsed * 1000;

  if (state.mode === 'free') {
    state.cur += elapsed;
    addTime(state.run, elapsed);
  } else {
    state.rem -= elapsed;
    if (state.phase === 0) {
      state.cur += elapsed;
      addTime(state.run, elapsed);
    }
    if (state.rem <= 0) {
      bell();
      if (state.phase === 0) {
        endSession('Pomodoro');
        state.phase = 1;
        state.rem = POMODORO_SECONDS[1];
        toast('Pomodoro completado. Descansa 10 minutos.');
      } else {
        state.phase = 0;
        state.rem = POMODORO_SECONDS[0];
        stop();
        toast('Descanso terminado.');
        render();
      }
    }
  }

  paint();
  refreshPassiveViews();
  if (++tickCount % 30 === 0) sync();
  save();
}

function start() {
  if (!loop) {
    lastTick = Date.now();
    loop = setInterval(tick, 300);
  }
}

export function stop() {
  clearInterval(loop);
  loop = null;
  state.run = null;
}

export function toggle() {
  if (state.run) {
    stop();
    toast('Pausado');
  } else {
    pullProgressFromStorage();
    state.run = state.sel;
    start();
  }
  render();
  sync(true);
  save(true);
}

export function finish() {
  const elapsed = state.cur;
  stop();
  endSession(state.mode === 'pomo' ? 'Pomodoro' : 'Libre');
  if (elapsed >= MIN_SESSION_SECONDS) toast('Sesión guardada: ' + formatDuration(elapsed));
  state.phase = 0;
  state.rem = POMODORO_SECONDS[0];
  render();
  sync(true);
  save(true);
}

/** Caps the time to catch up after the tab was hidden to 24 h. */
export function capCatchUp() {
  if (state.run) lastTick = Date.now() - Math.min(Date.now() - lastTick, DAY_MS);
}
