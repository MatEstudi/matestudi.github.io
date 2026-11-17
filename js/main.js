/** Entry point: loads the saved data, draws the UI and connects to the community. */
import { state } from './state.js';
import { loadState, save } from './storage.js';
import { claimNick, community, initCommunity, serverNow, sync } from './services/community.js';
import { registerEvents } from './ui/events.js';
import { render } from './ui/renderer.js';
import { openSettings } from './ui/settings.js';
import { toast } from './utils/dom.js';
import { formatClock } from './utils/format.js';

registerEvents();

// Keeps "hace X min" fresh in the community tab even when your own timer is paused.
setInterval(() => {
  if (state.view === 'group' && state.gv !== 'chat' && !state.run) render();
}, 15000);

// Ticks the running session clocks of the friends who are studying.
setInterval(() => {
  document.querySelectorAll('.el[data-s]').forEach(el => {
    el.textContent = formatClock((serverNow() - el.dataset.s) / 1000);
  });
}, 1000);

loadState();
render();
initCommunity().then(confirmNick);

/**
 * Registers the saved nickname. Old names (spaces, emojis, accents…) or names that someone else
 * took first are removed so the person has to choose a valid, unique one.
 */
async function confirmNick() {
  if (!state.nick || !community.ok) return;
  const result = await claimNick(state.nick);
  if (result.ok) return sync(true);
  if (result.code === 'error') return toast(result.reason);
  state.nick = '';
  save(true);
  render();
  toast(result.reason);
  openSettings();
}
