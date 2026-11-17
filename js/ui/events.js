/** Global event handling (event delegation) and wiring between services and UI. */
import { EVENTS, MESSAGE_MAX, POMODORO_SECONDS, STORAGE_KEY } from '../config.js';
import { state } from '../state.js';
import { loadState, save } from '../storage.js';
import { community, sync } from '../services/community.js';
import { deleteMessage, postMessage } from '../services/chat.js';
import { capCatchUp, finish, stop, toggle } from '../timer.js';
import { $, toast } from '../utils/dom.js';
import { clampInt } from '../utils/format.js';
import { chatAdd, chatDraft, chatRemove } from '../views/chat-view.js';
import { render, syncListeners, updateBadge } from './renderer.js';
import { openSettings } from './settings.js';

const CHAT_COOLDOWN_MS = 1500;
let lastSentAt = 0;

function sendMessage() {
  const input = $('#ci');
  const text = (input ? input.value : '').trim().slice(0, MESSAGE_MAX);
  if (!text) return;
  if (!state.nick) return openSettings();
  if (!community.ok) return toast('Sin conexión con la comunidad');
  if (Date.now() - lastSentAt < CHAT_COOLDOWN_MS) return toast('Espera un segundo antes de enviar otro mensaje');
  lastSentAt = Date.now();
  postMessage(text).catch(() => toast('No se pudo enviar. Revisa las reglas de Realtime Database.'));
  input.value = '';
  chatDraft.text = '';
}

function onClick(e) {
  const closest = selector => e.target.closest(selector);
  let el;

  if ((el = closest('#nav button'))) {
    state.view = el.dataset.v;
    return render();
  }
  if ((el = closest('[data-sub]'))) {
    if (state.run) return toast('Pausa el cronómetro para cambiar de asignatura');
    state.sel = el.dataset.sub;
    save();
    return render();
  }
  if (closest('#go')) return toggle();
  if (closest('#fin')) return finish();
  if ((el = closest('[data-mode]'))) {
    if (state.run) return toast('Pausa el cronómetro para cambiar de modo');
    state.mode = el.dataset.mode;
    state.cur = 0;
    state.phase = 0;
    state.rem = POMODORO_SECONDS[0];
    save();
    return render();
  }
  if ((el = closest('[data-range]'))) {
    state.range = +el.dataset.range;
    save();
    return render();
  }
  if ((el = closest('[data-gv]'))) {
    state.gv = el.dataset.gv;
    return render();
  }
  if (closest('#cs')) return sendMessage();
  if ((el = closest('[data-delm]'))) {
    if (community.ok) deleteMessage(el.dataset.delm).catch(() => toast('No se pudo borrar'));
    return;
  }
  if ((el = closest('[data-rank]'))) {
    state.rank = el.dataset.rank;
    return render();
  }
  if (closest('[data-open]') || closest('#me')) return openSettings();
}

/** Goal inputs of the stats tab. */
function onChange(e) {
  const id = e.target.id;
  if (id !== 'qd' && id !== 'qw') return;
  const max = id === 'qd' ? 24 : 168;
  const hours = Math.min(max, Math.max(1, clampInt(e.target.value) || 1));
  if (id === 'qd') state.goalD = hours;
  else state.goalW = hours;
  save(true);
  render();
}

function onInput(e) {
  if (e.target.id === 'ci') chatDraft.text = e.target.value;
}

function onKeydown(e) {
  if (e.key === 'Enter' && e.target.id === 'ci') sendMessage();
}

export function registerEvents() {
  document.addEventListener('click', onClick);
  document.addEventListener('change', onChange);
  document.addEventListener('input', onInput);
  document.addEventListener('keydown', onKeydown);

  document.addEventListener('visibilitychange', () => {
    syncListeners();
    capCatchUp();
  });

  window.addEventListener('pagehide', () => {
    save(true);
    sync(true, true);
  });

  // Several tabs: the one that starts the timer wins; the others update and pause.
  window.addEventListener('storage', e => {
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    const view = state.view;
    loadState();
    state.view = view;
    stop();
    render();
    sync();
  });

  // Community service events.
  document.addEventListener(EVENTS.ready, () => {
    syncListeners();
    updateBadge();
  });
  document.addEventListener(EVENTS.presence, () => {
    if (state.view === 'group' && state.gv !== 'chat') render();
    else updateBadge();
  });
  document.addEventListener(EVENTS.users, () => {
    if (state.view === 'group' && document.activeElement.tagName !== 'INPUT') render();
  });
  document.addEventListener(EVENTS.chatAdded, e => chatAdd(e.detail));
  document.addEventListener(EVENTS.chatRemoved, e => chatRemove(e.detail));
}
