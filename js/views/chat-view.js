/** Chat sub-view of the Community tab. */
import { COLORS, MESSAGE_MAX } from '../config.js';
import { state } from '../state.js';
import { community } from '../services/community.js';
import { esc } from '../utils/dom.js';
import { formatTime } from '../utils/format.js';
import { displayNick } from '../utils/nick.js';

/** Text typed but not sent yet; it survives re-renders. */
export const chatDraft = { text: '' };

const MAX_BUBBLES = 80;

function bubble(m) {
  const mine = m.uid === community.uid;
  const color = COLORS.includes(m.color) ? m.color : COLORS[0];
  const nick = displayNick(m.nick);
  return `<div class="msg ${mine ? 'mine' : ''}" id="m_${esc(m.k)}"><div class="av" style="background:${color}">${esc(nick[0].toUpperCase())}</div>
  <div class="bb"><small>${mine ? 'Tú' : esc(nick)} ${formatTime(m.ts)}${mine ? `<button class="lk" data-delm="${esc(m.k)}">borrar</button>` : ''}</small><p>${esc(m.text)}</p></div></div>`;
}

export function chatView() {
  const messages = community.msgs || [];
  return `<div class="card chat"><div class="cl" id="cl">${messages.length ? messages.map(bubble).join('') : '<div class="empty" id="ce">Aún no hay mensajes. Escribe el primero.</div>'}</div>
  <div class="cin"><input type="text" id="ci" maxlength="${MESSAGE_MAX}" placeholder="Escribe un mensaje" autocomplete="off"><button class="mini" id="cs">Enviar</button></div></div>
  <div class="hint">Lo ven todos los usuarios de la app. Se muestran los últimos 50 mensajes.</div>`;
}

/** Appends a message to the open chat without re-rendering the whole view. */
export function chatAdd(message) {
  const list = document.getElementById('cl');
  if (!list || state.view !== 'group' || state.gv !== 'chat') return;
  const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 80 || message.uid === community.uid;
  document.getElementById('ce')?.remove();
  list.insertAdjacentHTML('beforeend', bubble(message));
  while (list.children.length > MAX_BUBBLES) list.firstChild.remove();
  if (nearBottom) list.scrollTop = list.scrollHeight;
}

export function chatRemove(key) {
  document.getElementById('m_' + key)?.remove();
}
