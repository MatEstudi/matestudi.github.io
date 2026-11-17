/** "Estudiar" tab. */
import { POMODORO_SECONDS, SUBJECTS, SUBJECT_IDS } from '../config.js';
import { state } from '../state.js';
import { computeStats, currentStreak, secondsOn } from '../progress.js';
import { $, esc } from '../utils/dom.js';
import { dateKey, formatClock, formatDuration, WEEKDAY_LETTERS } from '../utils/format.js';

const RING_CIRCUMFERENCE = 2 * Math.PI * 45;
let previousFraction = 0;

const ringFraction = () => state.mode === 'free'
  ? (state.cur % 60) / 60
  : 1 - state.rem / POMODORO_SECONDS[state.phase];

/** Updates the live parts of the tab (clock, ring, summary) without rebuilding it. */
export function paint() {
  const clock = $('#tm');
  if (!clock) return; // another tab is showing
  const stats = computeStats();
  const goalSeconds = state.goalD * 3600;

  clock.textContent = formatClock(state.mode === 'free' ? state.cur : state.rem);

  const fraction = ringFraction();
  const ring = $('#pg');
  if (fraction < previousFraction) { // the ring wrapped around: jump back without animating
    ring.style.transition = 'none';
    ring.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - fraction);
    ring.getBoundingClientRect(); // force a reflow so the change is applied before the transition returns
    ring.style.transition = '';
  } else {
    ring.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - fraction);
  }
  ring.style.strokeOpacity = fraction > .002 ? 1 : 0;
  previousFraction = fraction;

  $('#sub').textContent = state.mode === 'pomo' && state.phase
    ? 'Descanso'
    : (state.run ? 'Estudiando ' + SUBJECTS[state.run].n : 'Sesión de hoy');

  const percent = Math.min(100, stats.today / goalSeconds * 100);
  $('#v-today').textContent = formatDuration(stats.today);
  $('#gbar').style.width = percent + '%';
  $('#gtxt').textContent = `${Math.round(percent)}% de tu meta de ${state.goalD} h`;
  $('#v-week').textContent = formatDuration(stats.week);
  $('#v-sel').textContent = formatDuration(state.tot[state.sel]);
}

function weekChart() {
  const days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    return d;
  });
  const values = days.map(d => secondsOn(dateKey(d)));
  const max = Math.max(3600, ...values);
  return `<div class="card"><div class="week">${days.map((d, i) =>
    `<div title="${formatDuration(values[i])}"><i style="height:${values[i] / max * 100}%"></i>${WEEKDAY_LETTERS[d.getDay()]}</div>`).join('')}</div></div>`;
}

export function studyView() {
  const fraction = ringFraction();
  previousFraction = fraction;
  const streak = currentStreak();

  return `<div class="card focus">
  <div class="chips">${SUBJECT_IDS.map(id => `<button class="chip ${id === state.sel ? 'on' : ''}" data-sub="${id}"><b style="background:${SUBJECTS[id].c}"></b>${SUBJECTS[id].n}</button>`).join('')}</div>
  <div class="ring"><svg viewBox="0 0 100 100"><circle class="tr" cx="50" cy="50" r="45"/><circle class="pg" id="pg" cx="50" cy="50" r="45" style="stroke-dasharray:${RING_CIRCUMFERENCE};stroke-dashoffset:${RING_CIRCUMFERENCE * (1 - fraction)};stroke-opacity:${fraction > .002 ? 1 : 0}"/></svg>
  <div class="clock"><b id="tm"></b><span id="sub"></span></div></div>
  <div class="ctl"><button class="go" id="go">${state.run ? 'Pausar' : 'Empezar'}</button>${state.cur > 0 || state.run ? '<button class="sec" id="fin">Terminar</button>' : ''}</div>
  <div class="seg"><button data-mode="free" class="${state.mode === 'free' ? 'on' : ''}">Libre</button><button data-mode="pomo" class="${state.mode === 'pomo' ? 'on' : ''}">Pomodoro 50/10</button></div></div>
  <div class="row"><div class="card st"><b id="v-today"></b><span>Hoy</span><div class="bar"><i id="gbar"></i></div><div class="hint hint--goal" id="gtxt"></div></div>
  <div class="card st"><b id="v-week"></b><span>Esta semana (meta ${state.goalW} h)</span></div>
  <div class="card st"><b>${streak} ${streak === 1 ? 'día' : 'días'}</b><span>Racha seguida</span></div></div>
  <h2>Últimos 7 días</h2>${weekChart()}
  <div class="hint">${esc(SUBJECTS[state.sel].n)}: <b id="v-sel"></b> acumuladas</div>`;
}
