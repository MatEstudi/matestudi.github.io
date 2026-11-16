import { COLORS } from '../config.js';
import { esc, hhmm } from '../utils.js';
import { S } from '../state.js';
import { fb } from '../firebase.js';

let draft = '';

export const getDraft = () => draft;
export const setDraft = v => {
  draft = v;
};

function bubble(m) {
  const me = m.uid === fb.uid;
  const col = COLORS.includes(m.color) ? m.color : COLORS[0];
  return `<div class="msg ${me ? 'mine' : ''}" id="m_${esc(m.k)}"><div class="av" style="background:${col}">${esc(
    String(m.nick || '?')[0].toUpperCase()
  )}</div>
  <div class="bb"><small>${me ? 'Tú' : esc(m.nick)} ${hhmm(m.ts)}${
    me ? `<button class="lk" data-delm="${esc(m.k)}">borrar</button>` : ''
  }</small><p>${esc(m.text)}</p></div></div>`;
}

export function renderChat() {
  const ms = fb.msgs || [];
  return `<div class="card chat"><div class="cl" id="cl">${
    ms.length ? ms.map(bubble).join('') : '<div class="empty" id="ce">Aún no hay mensajes. Escribe el primero.</div>'
  }</div>
  <div class="cin"><input type="text" id="ci" maxlength="300" placeholder="Escribe un mensaje" autocomplete="off"><button class="mini" id="cs">Enviar</button></div></div>
  <div class="hint">Lo ven todos los usuarios de la app. Se muestran los últimos 50 mensajes.</div>`;
}

export function chatAdd(m) {
  const l = document.getElementById('cl');
  if (!l || S.view !== 'group' || S.gv !== 'chat') return;
  const near = l.scrollHeight - l.scrollTop - l.clientHeight < 80 || m.uid === fb.uid;
  document.getElementById('ce')?.remove();
  l.insertAdjacentHTML('beforeend', bubble(m));
  while (l.children.length > 80) l.firstChild.remove();
  if (near) l.scrollTop = l.scrollHeight;
}

export function chatRemove(key) {
  document.getElementById('m_' + key)?.remove();
}