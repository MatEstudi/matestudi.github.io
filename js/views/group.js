import { esc, hm, clock } from '../utils.js';
import { S } from '../state.js';
import { fb, members, sNow } from '../firebase.js';
import { renderChat } from './chat.js';

const ago = t => {
  if (!t) return 'hace tiempo';
  const x = Math.max(0, (sNow() - t) / 1000);
  if (x < 60) return 'hace un momento';
  if (x < 3600) return 'hace ' + Math.floor(x / 60) + ' min';
  if (x < 86400) return 'hace ' + Math.floor(x / 3600) + ' h';
  return 'hace ' + Math.floor(x / 86400) + ' d';
};

function friendCard(m) {
  const st = m.act
    ? `<small class="live">Estudiando ${esc(m.act)}</small>`
    : m.on
      ? '<small class="live">En línea</small>'
      : `<small>Última conexión ${ago(m.seen)}</small>`;

  return `<div class="card fc ${m.me ? 'me1' : ''}"><div class="m0"><div class="av ${m.on ? 'on' : ''}" style="background:${m.color}">${esc(
    m.nick[0].toUpperCase()
  )}</div>
  <div class="n"><b>${esc(m.nick)}${m.me ? ' (tú)' : ''}</b>${st}</div>${
    m.act && m.since
      ? `<div class="el" data-s="${m.since}" title="Tiempo en esta sesión">${clock((sNow() - m.since) / 1000)}</div>`
      : ''
  }</div>
  <div class="fs"><div><b>${hm(m.daily)}</b><span>Hoy</span></div><div><b>${hm(m.weekly)}</b><span>Semana</span></div><div><b>${hm(m.total)}</b><span>Total</span></div></div></div>`;
}

export function renderGroup() {
  const ms = members();
  let h = `<div class="seg" style="margin:0 0 14px"><button data-gv="friends" class="${S.gv === 'friends' ? 'on' : ''}">Amigos</button><button data-gv="rank" class="${S.gv === 'rank' ? 'on' : ''}">Ranking</button><button data-gv="chat" class="${S.gv === 'chat' ? 'on' : ''}">Chat</button></div>`;

  if (!S.nick) {
    h += `<div class="card" style="margin-bottom:14px;text-align:center">Elige un nombre para que tus amigos te vean.<div class="ctl"><button class="mini" data-open="1">Elegir nombre</button></div></div>`;
  }
  if (!fb.ok) {
    h += `<div class="hint" style="margin-bottom:10px">Sin conexión: la comunidad no está disponible, pero tu cronómetro funciona igual.</div>`;
  }
  if (S.gv === 'chat') return h + renderChat();

  if (S.gv === 'friends') {
    const by = (a, k) => a.sort((x, y) => y[k] - x[k]);
    const act = by(ms.filter(m => m.act), 'daily');
    const onl = by(ms.filter(m => m.on && !m.act), 'daily');
    const off = by(ms.filter(m => !m.on), 'seen');
    const sec = (t, a) => (a.length ? `<div class="gh">${t} (${a.length})</div>` + a.map(friendCard).join('') : '');
    h += sec('Estudiando ahora', act) + sec('En línea', onl) + sec('Desconectados', off);
    if (ms.filter(m => !m.me).length === 0) {
      h += `<div class="empty">Aún no hay amigos aquí.<br>Comparte el enlace de la app: aparecerán en cuanto pongan su nombre.</div>`;
    }
    return h;
  }

  const tabs = [
    ['daily', 'Hoy'],
    ['weekly', 'Semana'],
    ['total', 'Total']
  ];
  ms.sort((a, b) => b[S.rank] - a[S.rank]);

  h += `<div class="seg" style="margin:0 0 14px">${tabs
    .map(([k, l]) => `<button data-rank="${k}" class="${S.rank === k ? 'on' : ''}">${l}</button>`)
    .join('')}</div>`;

  h += ms.length
    ? `<div class="list">${ms
        .map(
          (m, i) => `<div class="m ${m.me ? 'me1' : ''}"><div class="pos">${['🥇', '🥈', '🥉'][i] || i + 1}</div>
  <div class="av ${m.on ? 'on' : ''}" style="background:${m.color}">${esc(m.nick[0].toUpperCase())}</div>
  <div class="n"><b>${esc(m.nick)}${m.me ? ' (tú)' : ''}</b><small class="${m.act ? 'live' : ''}">${
            m.act ? 'Estudiando ' + esc(m.act) : m.on ? 'En línea' : 'Visto ' + ago(m.seen)
          }</small></div><div class="t">${hm(m[S.rank])}</div></div>`
        )
        .join('')}</div>`
    : `<div class="empty">Todavía no hay nadie en el ranking.<br>Empieza a estudiar y serás el primero.</div>`;

  return h;
}