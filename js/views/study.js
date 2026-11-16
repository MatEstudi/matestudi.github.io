import { POMO, SUBJ, IDS } from '../config.js';
import { $, esc, hm, clock, dk } from '../utils.js';
import { S, day, stats, streak } from '../state.js';
import { ringFrac } from '../timer.js';

let ringPrev = 0;

function weekChart() {
  const ds = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    return d;
  });
  const vals = ds.map(d => day(dk(d)));
  const mx = Math.max(3600, ...vals);

  return `<div class="card"><div class="week">${ds
    .map(
      (d, i) =>
        `<div title="${hm(vals[i])}"><i style="height:${(vals[i] / mx) * 100}%"></i>${'DLMXJVS'[d.getDay()]}</div>`
    )
    .join('')}</div></div>`;
}

export function renderStudy() {
  const circ = 2 * Math.PI * 45;
  const f0 = ringFrac();
  ringPrev = f0;
  const st = streak();

  return `<div class="card focus">
  <div class="chips">${IDS.map(
    i => `<button class="chip ${i === S.sel ? 'on' : ''}" data-sub="${i}"><b style="background:${SUBJ[i].c}"></b>${SUBJ[i].n}</button>`
  ).join('')}</div>
  <div class="ring"><svg viewBox="0 0 100 100"><circle class="tr" cx="50" cy="50" r="45" style="stroke-width:5"/><circle class="pg" id="pg" cx="50" cy="50" r="45" style="stroke-width:5;stroke-dasharray:${circ};stroke-dashoffset:${circ * (1 - f0)};stroke-opacity:${f0 > 0.002 ? 1 : 0}"/></svg>
  <div class="clock"><b id="tm"></b><span id="sub"></span></div></div>
  <div class="ctl"><button class="go" id="go">${S.run ? 'Pausar' : 'Empezar'}</button>${
    S.cur > 0 || S.run ? '<button class="sec" id="fin">Terminar</button>' : ''
  }</div>
  <div class="seg"><button data-mode="free" class="${S.mode === 'free' ? 'on' : ''}">Libre</button><button data-mode="pomo" class="${S.mode === 'pomo' ? 'on' : ''}">Pomodoro 50/10</button></div></div>
  <div class="row"><div class="card st"><b id="v-today"></b><span>Hoy</span><div class="bar"><i id="gbar"></i></div><div class="hint" id="gtxt" style="text-align:left;margin-top:6px"></div></div>
  <div class="card st"><b id="v-week"></b><span>Esta semana (meta ${S.goalW} h)</span></div>
  <div class="card st"><b>${st} ${st === 1 ? 'día' : 'días'}</b><span>Racha seguida</span></div></div>
  <h2>Últimos 7 días</h2>${weekChart()}
  <div class="hint">${esc(SUBJ[S.sel].n)}: <b id="v-sel"></b> acumuladas</div>`;
}

export function paintStudy() {
  const t = $('#tm');
  if (!t) return;

  const st = stats();
  const g = S.goalD * 3600;
  t.textContent = clock(S.mode === 'free' ? S.cur : S.rem);

  const circ = 2 * Math.PI * 45;
  const frac = ringFrac();
  const pg = $('#pg');
  if (frac < ringPrev) {
    pg.style.transition = 'none';
    pg.style.strokeDashoffset = circ * (1 - frac);
    pg.getBoundingClientRect();
    pg.style.transition = '';
  } else {
    pg.style.strokeDashoffset = circ * (1 - frac);
  }
  pg.style.strokeOpacity = frac > 0.002 ? 1 : 0;
  ringPrev = frac;

  $('#sub').textContent =
    S.mode === 'pomo' && S.phase
      ? 'Descanso'
      : S.run
        ? 'Estudiando ' + SUBJ[S.run].n
        : 'Sesión de hoy';

  $('#v-today').textContent = hm(st.today);
  $('#gbar').style.width = Math.min(100, (st.today / g) * 100) + '%';
  $('#gtxt').textContent = `${Math.round(Math.min(100, (st.today / g) * 100))}% de tu meta de ${S.goalD} h`;
  $('#v-week').textContent = hm(st.week);
  $('#v-sel').textContent = hm(S.tot[S.sel]);
}