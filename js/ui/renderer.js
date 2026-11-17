/** Renders the active tab and keeps the shell (header, tab bar, listeners) in sync. */
import { SUBJECTS } from '../config.js';
import { state } from '../state.js';
import { listenUsers, members } from '../services/community.js';
import { listenChat } from '../services/chat.js';
import { $ } from '../utils/dom.js';
import { chatDraft } from '../views/chat-view.js';
import { communityView } from '../views/community-view.js';
import { statsView } from '../views/stats-view.js';
import { paint, studyView } from '../views/study-view.js';

const VIEWS = { study: studyView, stats: statsView, group: communityView };

/** The accent colour follows the selected subject. */
function applyAccent() {
  document.documentElement.style.setProperty('--acc', SUBJECTS[state.sel].c);
}

/** Shows how many friends are online on the Community tab. */
export function updateBadge() {
  const online = members().filter(m => m.on && !m.me).length;
  const tab = $('#nav [data-v=group]');
  if (tab) tab.innerHTML = 'Comunidad' + (online ? `<span class="bd">${online}</span>` : '');
}

/** Only listens to Firebase while the relevant Community sub-view is visible. */
export function syncListeners() {
  const inCommunity = state.view === 'group' && !document.hidden;
  listenUsers(inCommunity && state.gv !== 'chat');
  listenChat(inCommunity && state.gv === 'chat');
}

export function render() {
  applyAccent();
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.v === state.view));

  const avatar = $('#meav');
  avatar.textContent = state.nick ? state.nick[0].toUpperCase() : '?';
  avatar.style.background = state.color;
  $('#mename').textContent = state.nick || 'Tu nombre';

  // The listeners must be updated before the view is built: the chat resets its messages when it starts listening.
  updateBadge();
  syncListeners();

  $('#main').innerHTML = (VIEWS[state.view] || studyView)();

  if (state.view === 'study') paint();
  if (state.view === 'group' && state.gv === 'chat') {
    const input = $('#ci');
    const list = $('#cl');
    if (input) input.value = chatDraft.text;
    if (list) list.scrollTop = list.scrollHeight;
  }
}
