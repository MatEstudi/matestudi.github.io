/** "Comunidad" tab: friends, ranking and chat. */
import { state } from '../state.js';
import { community, members, serverNow } from '../services/community.js';
import { esc } from '../utils/dom.js';
import { formatClock, formatDuration } from '../utils/format.js';
import { chatView } from './chat-view.js';

const ago = timestamp => {
  if (!timestamp) return 'hace tiempo';
  const seconds = Math.max(0, (serverNow() - timestamp) / 1000);
  if (seconds < 60) return 'hace un momento';
  if (seconds < 3600) return 'hace ' + Math.floor(seconds / 60) + ' min';
  if (seconds < 86400) return 'hace ' + Math.floor(seconds / 3600) + ' h';
  return 'hace ' + Math.floor(seconds / 86400) + ' d';
};

function friendCard(m) {
  const status = m.act
    ? `<small class="live">Estudiando ${esc(m.act)}</small>`
    : m.on
      ? '<small class="live">En línea</small>'
      : `<small>Última conexión ${ago(m.seen)}</small>`;
  const elapsed = m.act && m.since
    ? `<div class="el" data-s="${m.since}" title="Tiempo en esta sesión">${formatClock((serverNow() - m.since) / 1000)}</div>`
    : '';
  return `<div class="card fc ${m.me ? 'me1' : ''}"><div class="m0"><div class="av ${m.on ? 'on' : ''}" style="background:${m.color}">${esc(m.nick[0].toUpperCase())}</div>
  <div class="n"><b>${esc(m.nick)}${m.me ? ' (tú)' : ''}</b>${status}</div>${elapsed}</div>
  <div class="fs"><div><b>${formatDuration(m.daily)}</b><span>Hoy</span></div><div><b>${formatDuration(m.weekly)}</b><span>Semana</span></div><div><b>${formatDuration(m.total)}</b><span>Total</span></div></div></div>`;
}

const sortDesc = (list, key) => list.sort((a, b) => b[key] - a[key]);

function friendsList(list) {
  const studying = sortDesc(list.filter(m => m.act), 'daily');
  const online = sortDesc(list.filter(m => m.on && !m.act), 'daily');
  const offline = sortDesc(list.filter(m => !m.on), 'seen');
  const section = (title, group) => group.length
    ? `<div class="gh">${title} (${group.length})</div>` + group.map(friendCard).join('')
    : '';

  let html = section('Estudiando ahora', studying) + section('En línea', online) + section('Desconectados', offline);
  if (list.filter(m => !m.me).length === 0) {
    html += '<div class="empty">Aún no hay amigos aquí.<br>Comparte el enlace de la app: aparecerán en cuanto pongan su nombre.</div>';
  }
  return html;
}

function ranking(list) {
  const tabs = [['daily', 'Hoy'], ['weekly', 'Semana'], ['total', 'Total']];
  sortDesc(list, state.rank);
  const tabsHtml = `<div class="seg seg--tabs">${tabs.map(([key, label]) => `<button data-rank="${key}" class="${state.rank === key ? 'on' : ''}">${label}</button>`).join('')}</div>`;
  if (!list.length) {
    return tabsHtml + '<div class="empty">Todavía no hay nadie en el ranking.<br>Empieza a estudiar y serás el primero.</div>';
  }
  return tabsHtml + `<div class="list">${list.map((m, i) => `<div class="m ${m.me ? 'me1' : ''}"><div class="pos">${['🥇', '🥈', '🥉'][i] || i + 1}</div>
  <div class="av ${m.on ? 'on' : ''}" style="background:${m.color}">${esc(m.nick[0].toUpperCase())}</div>
  <div class="n"><b>${esc(m.nick)}${m.me ? ' (tú)' : ''}</b><small class="${m.act ? 'live' : ''}">${m.act ? 'Estudiando ' + esc(m.act) : m.on ? 'En línea' : 'Visto ' + ago(m.seen)}</small></div><div class="t">${formatDuration(m[state.rank])}</div></div>`).join('')}</div>`;
}

export function communityView() {
  const list = members();
  const subTabs = [['friends', 'Amigos'], ['rank', 'Ranking'], ['chat', 'Chat']];
  let html = `<div class="seg seg--tabs">${subTabs.map(([key, label]) => `<button data-gv="${key}" class="${state.gv === key ? 'on' : ''}">${label}</button>`).join('')}</div>`;

  if (!state.nick) {
    html += '<div class="card card--notice">Elige un nombre para que tus amigos te vean.<div class="ctl"><button class="mini" data-open="1">Elegir nombre</button></div></div>';
  }
  if (!community.ok) {
    html += '<div class="hint hint--offline">Sin conexión: la comunidad no está disponible, pero tu cronómetro funciona igual.</div>';
  }

  if (state.gv === 'chat') return html + chatView();
  if (state.gv === 'friends') return html + friendsList(list);
  return html + ranking(list);
}
