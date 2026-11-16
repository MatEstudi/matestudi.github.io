import { POMO } from './config.js';
import { bell, hm, toast } from './utils.js';
import { S, addTime } from './state.js';
import { save, loadTotals } from './storage.js';

let last = 0;
let loop = null;
let tickCount = 0;
let handlers = {
  paint: () => {},
  render: () => {},
  sync: () => {}
};

export function registerTimerHandlers(h) {
  handlers = { ...handlers, ...h };
}

export function getLast() {
  return last;
}

export function setLast(v) {
  last = v;
}

export function getTickCount() {
  return tickCount;
}

export const ringFrac = () =>
  S.mode === 'free' ? (S.cur % 60) / 60 : 1 - S.rem / POMO[S.phase];

function endSession(note) {
  if (S.cur >= 10) {
    S.sess.unshift({ s: S.run || S.sel, d: S.cur, at: Date.now(), n: note });
    S.sess = S.sess.slice(0, 50);
  }
  S.cur = 0;
}

function tick() {
  const now = Date.now();
  const d = Math.floor((now - last) / 1000);
  if (d < 1 || !S.run) return;
  last += d * 1000;

  if (S.mode === 'free') {
    S.cur += d;
    addTime(S.run, d);
  } else {
    S.rem -= d;
    if (S.phase === 0) {
      S.cur += d;
      addTime(S.run, d);
    }
    if (S.rem <= 0) {
      bell();
      if (S.phase === 0) {
        endSession('Pomodoro');
        S.phase = 1;
        S.rem = POMO[1];
        toast('Pomodoro completado. Descansa 10 minutos.');
      } else {
        S.phase = 0;
        S.rem = POMO[0];
        S.run = null;
        stop();
        toast('Descanso terminado.');
        handlers.render();
      }
    }
  }

  tickCount++;
  handlers.paint();
  if (tickCount % 30 === 0) handlers.sync();
  save();
}

export function start() {
  if (!loop) {
    last = Date.now();
    loop = setInterval(tick, 300);
  }
}

export function stop() {
  clearInterval(loop);
  loop = null;
  S.run = null;
}

export function toggle() {
  if (S.run) {
    stop();
    toast('Pausado');
  } else {
    loadTotals();
    S.run = S.sel;
    start();
  }
  handlers.render();
  handlers.sync(true);
  save(true);
}

export function finish() {
  const had = S.cur;
  stop();
  endSession(S.mode === 'pomo' ? 'Pomodoro' : 'Libre');
  if (had >= 10) toast('Sesión guardada: ' + hm(had));
  S.phase = 0;
  S.rem = POMO[0];
  handlers.render();
  handlers.sync(true);
  save(true);
}