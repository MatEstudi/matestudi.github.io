/** "Estadísticas" tab. */
import { SUBJECTS, SUBJECT_IDS } from '../config.js';
import { state } from '../state.js';
import { computeStats, secondsOn } from '../progress.js';
import { esc } from '../utils/dom.js';
import { dateKey, formatDuration, WEEKDAY_LETTERS } from '../utils/format.js';

export function statsView() {
  const stats = computeStats();
  const n = state.range;
  const goalDay = state.goalD * 3600;
  const goalWeek = state.goalW * 3600;

  const days = [...Array(n)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1) + i);
    return d;
  });
  const values = days.map(d => secondsOn(dateKey(d)));
  const max = Math.max(goalDay, ...values);
  const activeDays = values.filter(v => v > 0);
  const average = activeDays.length ? activeDays.reduce((a, b) => a + b, 0) / activeDays.length : 0;
  const goalDaysHit = values.filter(v => v >= goalDay).length;

  const record = Object.values(state.hist).reduce((best, entry) => Math.max(best, entry.t), 0);
  const daysLeftInWeek = 7 - ((new Date().getDay() + 6) % 7);
  const weekLeft = Math.max(0, goalWeek - stats.week);
  const percentDay = Math.min(100, stats.today / goalDay * 100);
  const percentWeek = Math.min(100, stats.week / goalWeek * 100);
  const grandTotal = Math.max(1, stats.total);
  const sessions = state.sess.slice(0, 6);

  return `<div class="goals">
  <div class="card goal"><span>Meta diaria</span><br><b>${formatDuration(stats.today)} / ${state.goalD} h</b><div class="bar"><i style="width:${percentDay}%"></i></div>
    <small>${stats.today >= goalDay ? 'Meta de hoy cumplida.' : 'Te faltan ' + formatDuration(goalDay - stats.today) + ' hoy.'}</small>
    <label for="qd">Horas al día</label><input type="number" id="qd" min="1" max="24" value="${state.goalD}"></div>
  <div class="card goal"><span>Meta semanal</span><br><b>${formatDuration(stats.week)} / ${state.goalW} h</b><div class="bar"><i style="width:${percentWeek}%"></i></div>
    <small>${weekLeft <= 0 ? 'Meta de la semana cumplida.' : 'Te faltan ' + formatDuration(weekLeft) + ': unos ' + formatDuration(weekLeft / daysLeftInWeek) + ' al día hasta el domingo.'}</small>
    <label for="qw">Horas a la semana</label><input type="number" id="qw" min="1" max="168" value="${state.goalW}"></div></div>
  <div class="hd"><h2>Constancia</h2><div class="seg"><button data-range="7" class="${n === 7 ? 'on' : ''}">7 días</button><button data-range="30" class="${n === 30 ? 'on' : ''}">30 días</button></div></div>
  <div class="card"><div class="week ${n > 7 ? 'week--dense' : ''}">${days.map((d, i) =>
    `<div title="${formatDuration(values[i])}"><i style="height:${values[i] / max * 100}%;opacity:${values[i] >= goalDay ? 1 : .4}"></i>${n === 7 ? WEEKDAY_LETTERS[d.getDay()] : (i % 5 === 4 ? d.getDate() : '')}</div>`).join('')}</div>
  <div class="hint">Las barras intensas alcanzaron tu meta diaria (${goalDaysHit} de ${n} días).</div></div>
  <h2>Resumen</h2>
  <div class="kv"><div class="card st"><b>${formatDuration(stats.total)}</b><span>Tiempo total</span></div><div class="card st"><b>${activeDays.length ? formatDuration(average) : '0 min'}</b><span>Media por día activo</span></div><div class="card st"><b>${formatDuration(record)}</b><span>Mejor día</span></div></div>
  <h2>Por asignatura</h2><div class="card dist">${SUBJECT_IDS.map(id => `<div><div><span>${SUBJECTS[id].n}</span><small>${formatDuration(state.tot[id])} (${Math.round(state.tot[id] / grandTotal * 100)}%)</small></div><div class="bar"><i style="width:${state.tot[id] / grandTotal * 100}%;background:${SUBJECTS[id].c}"></i></div></div>`).join('')}</div>
  <h2>Sesiones recientes</h2><div class="card">${sessions.length
    ? sessions.map(x => `<div class="ses"><span>${esc(SUBJECTS[x.s].n)}<br><small>${x.at ? new Date(x.at).toLocaleDateString('es', { day: 'numeric', month: 'short' }) : ''} ${esc(x.n)}</small></span><b>${formatDuration(x.d)}</b></div>`).join('')
    : '<div class="empty empty--compact">Aún no hay sesiones. Pulsa Terminar al acabar una para guardarla.</div>'}</div>`;
}
