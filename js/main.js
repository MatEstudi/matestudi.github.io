/** Entry point: loads the saved data, draws the UI and connects to the community. */
import { state } from './state.js';
import { loadState } from './storage.js';
import { initCommunity, serverNow } from './services/community.js';
import { registerEvents } from './ui/events.js';
import { render } from './ui/renderer.js';
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
initCommunity();
