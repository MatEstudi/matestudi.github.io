import { SUBJ, IDS } from '../config.js';
import { esc, hm, dk } from '../utils.js';
import { S, day, stats } from '../state.js';

export function renderStats() {
  const st = stats();
  const n = S.range;
  const gD = S.goalD * 3600;
  const gW = S.goalW * 3600;

  const ds = [...Array(n)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1) + i);
    return d;
  });
  const vals = ds.map(d => day(dk(d)));
  const mx = Math.max(gD, ...vals);
  const act = vals.filter(v => v > 0);
  const avg = act.length ? act.reduce((a, b) => a + b, 0) / act.length : 0;
  const hit = vals.filter(v => v >= gD).length;
  const rec = Object.values(S.hist).reduce((m, v) => Math.max(m, v.t), 0);
  const rd = 7 - ((new Date().getDay() + 6) % 7);
  const left = Math.max(0, gW - st.week);
  const pd = Math.min(100, (st.today / gD) * 100);
  const pw = Math.min(100, (st.week / gW) * 100);
  const tot = Math.max(1, st.total);
  const ses = S.sess.slice(0, 6);

  return `<div class="goals">
  <div class="card goal"><span>Meta diaria</span><br><b>${hm(st.today)} / ${S.goalD} h</b><div class="bar"><i style="width:${pd}%"></i></div>
    <small>${st.today >= gD ? 'Meta de hoy cumplida.' : 'Te faltan ' + hm(gD - st.today) + ' hoy.'}</small>
    <label for="qd">Horas al día</label><input type="number" id="qd" min="1" max="24" value="${S.goalD}"></div>
  <div class="card goal"><span>Meta semanal</span><br><b>${hm(st.week)} / ${S.goalW} h</b><div class="bar"><i style="width:${pw}%"></i></div>
    <small>${left <= 0 ? 'Meta de la semana cumplida.' : 'Te faltan ' + hm(left) + ': unos ' + hm(left / rd) + ' al día hasta el domingo.'}</small>
    <label for="qw">Horas a la semana</label><input type="number" id="qw" min="1" max="168" value="${S.goalW}"></div></div>
  <div class="hd"><h2>Constancia</h2><div class="seg"><button data-range="7" class="${n === 7 ? 'on' : ''}">7 días</button><button data-range="30" class="${n === 30 ? 'on' : ''}">30 días</button></div></div>
  <div class="card"><div class="week" style="gap:${n > 7 ? 3 : 8}px">${ds
    .map(
      (d, i) =>
        `<div title="${hm(vals[i])}"><i style="height:${(vals[i] / mx) * 100}%;opacity:${vals[i] >= gD ? 1 : 0.4}"></i>${
          n === 7 ? 'DLMXJVS'[d.getDay()] : i % 5 === 4 ? d.getDate() : ''
        }</div>`
    )
    .join('')}</div>
  <div class="hint">Las barras intensas alcanzaron tu meta diaria (${hit} de ${n} días).</div></div>
  <h2>Resumen</h2>
  <div class="kv"><div class="card st"><b>${hm(st.total)}</b><span>Tiempo total</span></div><div class="card st"><b>${act.length ? hm(avg) : '0 min'}</b><span>Media por día activo</span></div><div class="card st"><b>${hm(rec)}</b><span>Mejor día</span></div></div>
  <h2>Por asignatura</h2><div class="card dist">${IDS.map(
    i =>
      `<div><div><span>${SUBJ[i].n}</span><small>${hm(S.tot[i])} (${Math.round((S.tot[i] / tot) * 100)}%)</small></div><div class="bar"><i style="width:${(S.tot[i] / tot) * 100}%;background:${SUBJ[i].c}"></i></div></div>`
  ).join('')}</div>
  <h2>Sesiones recientes</h2><div class="card">${
    ses.length
      ? ses
          .map(
            x =>
              `<div class="ses"><span>${esc(SUBJ[x.s].n)}<br><small>${
                x.at ? new Date(x.at).toLocaleDateString('es', { day: 'numeric', month: 'short' }) : ''
              } ${esc(x.n)}</small></span><b>${hm(x.d)}</b></div>`
          )
          .join('')
      : '<div class="empty" style="padding:10px">Aún no hay sesiones. Pulsa Terminar al acabar una para guardarla.</div>'
  }</div>`;
}