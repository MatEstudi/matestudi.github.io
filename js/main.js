import { KEY, POMO, SUBJ } from './config.js';
import { $, num, clock, toast } from './utils.js';
import { S } from './state.js';
import { load, save } from './storage.js';
import {
  registerTimerHandlers,
  getLast,
  setLast,
  getTickCount,
  stop,
  toggle,
  finish
} from './timer.js';
import {
  registerFbHandlers,
  initFb,
  listenUsers,
  listenChat,
  sync,
  members,
  sendMsg,
  deleteMsg,
  sNow
} from './firebase.js';
import { renderStudy, paintStudy } from './views/study.js';
import { renderStats } from './views/stats.js';
import { renderGroup } from './views/group.js';
import { getDraft, setDraft, chatAdd, chatRemove } from './views/chat.js';
import { openSettings } from './modal.js';

const darkMQ = window.matchMedia('(prefers-color-scheme: dark)');

function resolvedTheme() {
  if (S.theme === 'dark' || S.theme === 'light') return S.theme;
  return darkMQ.matches ? 'dark' : 'light';
}

function setAcc() {
  const r = document.documentElement;
  const activeTheme = resolvedTheme();
  r.dataset.t = activeTheme;
  r.dataset.style = S.brutal ? 'brutal' : 'modern';
  r.style.setProperty('--acc', SUBJ[S.sel].c);
  $('#thm').textContent = activeTheme === 'dark' ? '☀︎' : '☾';
}

function badge() {
  const on = members().filter(m => m.on && !m.me).length;
  const b = $('#nav [data-v=group]');
  if (b) b.innerHTML = 'Comunidad' + (on ? `<span class="bd">${on}</span>` : '');
}

function syncListeners() {
  const g = S.view === 'group' && !document.hidden;
  listenUsers(g && S.gv !== 'chat');
  listenChat(g && S.gv === 'chat');
}

function paint() {
  if (S.view === 'study') paintStudy();
  if (
    ((S.view === 'group' && S.gv !== 'chat') || S.view === 'stats') &&
    getTickCount() % 10 === 0 &&
    document.activeElement?.tagName !== 'INPUT'
  ) {
    render();
  }
}

function render() {
  setAcc();
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.v === S.view));
  $('#meav').textContent = S.nick ? S.nick[0].toUpperCase() : '?';
  $('#meav').style.background = S.color;
  $('#mename').textContent = S.nick || 'Tu nombre';
  badge();
  syncListeners();

  $('#main').innerHTML =
    S.view === 'study' ? renderStudy() : S.view === 'stats' ? renderStats() : renderGroup();

  if (S.view === 'study') paintStudy();
  if (S.view === 'group' && S.gv === 'chat') {
    const ci = $('#ci');
    const cl = $('#cl');
    if (ci) ci.value = getDraft();
    if (cl) cl.scrollTop = cl.scrollHeight;
  }
}

function showSettings() {
  openSettings({
    onSave: () => {
      render();
      sync(true);
    },
    onImport: () => {
      render();
      sync(true);
    }
  });
}

registerTimerHandlers({ paint, render, sync });
registerFbHandlers({
  onRender: render,
  onBadge: badge,
  onChatAdd: chatAdd,
  onChatRemove: chatRemove,
  onOpenSettings: showSettings,
  syncListeners
});

darkMQ.addEventListener('change', () => {
  if (S.theme === 'auto') setAcc();
});

document.addEventListener('click', e => {
  const t = e.target;
  const q = s => t.closest(s);
  let x;

  if ((x = q('#nav button'))) {
    S.view = x.dataset.v;
    return render();
  }
  if ((x = q('[data-sub]'))) {
    if (S.run) return toast('Pausa el cronómetro para cambiar de asignatura');
    S.sel = x.dataset.sub;
    save();
    return render();
  }
  if (q('#go')) return toggle();
  if (q('#fin')) return finish();
  if ((x = q('[data-mode]'))) {
    if (S.run) return toast('Pausa el cronómetro para cambiar de modo');
    S.mode = x.dataset.mode;
    S.cur = 0;
    S.phase = 0;
    S.rem = POMO[0];
    save();
    return render();
  }
  if ((x = q('[data-range]'))) {
    S.range = +x.dataset.range;
    save();
    return render();
  }
  if ((x = q('[data-gv]'))) {
    S.gv = x.dataset.gv;
    return render();
  }
  if (q('#cs')) {
    if (sendMsg($('#ci'))) setDraft('');
    return;
  }
  if ((x = q('[data-delm]'))) return deleteMsg(x.dataset.delm);
  if ((x = q('[data-rank]'))) {
    S.rank = x.dataset.rank;
    return render();
  }
  if (q('[data-open]') || q('#me')) return showSettings();
  if (q('#thm')) {
    if (e.shiftKey) {
      S.brutal = !S.brutal;
      save(true);
      render();
      return toast(S.brutal ? 'Estilo brutalista activado' : 'Estilo moderno activado');
    }
    S.theme = resolvedTheme() === 'dark' ? 'light' : 'dark';
    save(true);
    return render();
  }
});

document.addEventListener('change', e => {
  const g = e.target.id;
  if (g === 'qd' || g === 'qw') {
    const mx = g === 'qd' ? 24 : 168;
    const v = Math.min(mx, Math.max(1, num(e.target.value) || 1));
    if (g === 'qd') S.goalD = v;
    else S.goalW = v;
    save(true);
    return render();
  }
});

document.addEventListener('input', e => {
  if (e.target.id === 'ci') setDraft(e.target.value);
});

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'ci') {
    if (sendMsg($('#ci'))) setDraft('');
  }
});

document.addEventListener('visibilitychange', () => {
  syncListeners();
  if (S.run) {
    setLast(Date.now() - Math.min(Date.now() - getLast(), 864e5));
  }
});

window.addEventListener('pagehide', () => {
  save(true);
  sync(true, true);
});

/* Sincronización entre pestañas */
window.addEventListener('storage', e => {
  if (e.key !== KEY || !e.newValue) return;
  const v = S.view;
  const gv = S.gv;
  const rank = S.rank;
  load();
  S.view = v;
  S.gv = gv;
  S.rank = rank;
  stop();
  render();
  sync();
});

setInterval(() => {
  if (S.view === 'group' && S.gv !== 'chat' && !S.run) render();
}, 15000);

setInterval(() => {
  document.querySelectorAll('.el[data-s]').forEach(el => {
    el.textContent = clock((sNow() - el.dataset.s) / 1000);
  });
}, 1000);

load();
render();
initFb();