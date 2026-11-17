/** "Perfil y ajustes" dialog: nickname, colour, goals, backup export and import. */
import { COLORS, NICK_MAX } from '../config.js';
import { state, replaceState } from '../state.js';
import { sanitizeState, save } from '../storage.js';
import { sync } from '../services/community.js';
import { stop } from '../timer.js';
import { $, esc, toast } from '../utils/dom.js';
import { clampInt, dateKey } from '../utils/format.js';
import { render } from './renderer.js';

const MAX_BACKUP_BYTES = 2e6;

export function openSettings() {
  const dialog = $('#dlg');
  if (dialog.open) return;

  dialog.innerHTML = `<h2>Perfil y ajustes</h2>
  <label for="set-name">Nombre en el ranking</label><input type="text" id="set-name" maxlength="${NICK_MAX}" value="${esc(state.nick)}" placeholder="Tu nombre">
  <label>Color</label><div class="cols">${COLORS.map(c => `<button type="button" data-col="${c}" class="${c === state.color ? 'on' : ''}" style="background:${c}" aria-label="Color ${c}"></button>`).join('')}</div>
  <label for="set-goal-day">Meta diaria (horas)</label><input type="number" id="set-goal-day" min="1" max="24" value="${state.goalD}">
  <label for="set-goal-week">Meta semanal (horas)</label><input type="number" id="set-goal-week" min="1" max="168" value="${state.goalW}">
  <div class="acts"><button class="mini" id="set-save">Guardar</button><button class="ghost" id="set-export">Exportar copia</button><label class="ghost file">Importar<input type="file" id="set-import" accept=".json" hidden></label><button class="ghost" id="set-close">Cerrar</button></div>`;
  dialog.showModal();

  let color = state.color;
  const find = selector => dialog.querySelector(selector);

  dialog.onclick = e => {
    const swatch = e.target.closest('[data-col]');
    if (!swatch) return;
    color = swatch.dataset.col;
    dialog.querySelectorAll('[data-col]').forEach(b => b.classList.toggle('on', b === swatch));
  };

  find('#set-close').onclick = () => dialog.close();

  find('#set-save').onclick = () => {
    state.nick = find('#set-name').value.trim().slice(0, NICK_MAX);
    state.color = color;
    state.goalD = Math.min(24, clampInt(find('#set-goal-day').value) || 3);
    state.goalW = Math.min(168, clampInt(find('#set-goal-week').value) || 15);
    save(true);
    dialog.close();
    render();
    sync(true);
    toast('Guardado');
  };

  find('#set-export').onclick = () => {
    const link = document.createElement('a');
    const backup = new Blob([JSON.stringify({ ...state, run: null }, null, 1)], { type: 'application/json' });
    link.href = URL.createObjectURL(backup);
    link.download = `matestudi_${dateKey()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  find('#set-import').onchange = e => {
    const file = e.target.files[0];
    if (!file || file.size > MAX_BACKUP_BYTES) return toast('Archivo no válido');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data !== 'object' || !(data.tot || data.subjects)) throw new Error('Not a backup');
        const view = state.view;
        stop();
        replaceState(sanitizeState(data));
        state.view = view;
        save(true);
        dialog.close();
        render();
        sync(true);
        toast('Datos importados');
      } catch {
        toast('El archivo no es una copia válida');
      }
    };
    reader.readAsText(file);
  };
}
