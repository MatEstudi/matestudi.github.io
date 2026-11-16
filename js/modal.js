import { COLORS } from './config.js';
import { $, esc, num, dk, toast } from './utils.js';
import { S, setState } from './state.js';
import { clean, save } from './storage.js';
import { stop } from './timer.js';

export function openSettings({ onSave, onImport }) {
  const d = $('#dlg');
  d.innerHTML = `<h2 style="margin-top:0">Perfil y ajustes</h2>
  <label for="pn">Nombre en el ranking</label><input type="text" id="pn" maxlength="20" value="${esc(S.nick)}" placeholder="Tu nombre">
  <label>Color</label><div class="cols">${COLORS.map(
    c => `<button type="button" data-col="${c}" class="${c === S.color ? 'on' : ''}" style="background:${c}" aria-label="Color ${c}"></button>`
  ).join('')}</div>
  <label for="gd">Meta diaria (horas)</label><input type="number" id="gd" min="1" max="24" value="${S.goalD}">
  <label for="gw">Meta semanal (horas)</label><input type="number" id="gw" min="1" max="168" value="${S.goalW}">
  <label for="pt">Tema</label>
  <select id="pt">
    <option value="auto" ${S.theme === 'auto' ? 'selected' : ''}>Automático (sistema)</option>
    <option value="light" ${S.theme === 'light' ? 'selected' : ''}>Claro</option>
    <option value="dark" ${S.theme === 'dark' ? 'selected' : ''}>Oscuro</option>
  </select>
  <label for="ps">Estilo visual</label>
  <select id="ps">
    <option value="modern" ${!S.brutal ? 'selected' : ''}>Moderno</option>
    <option value="brutal" ${S.brutal ? 'selected' : ''}>Minimalista brutalista</option>
  </select>
  <div class="acts"><button class="mini" id="ok">Guardar</button><button class="ghost" id="ex">Exportar copia</button><label class="ghost" style="margin:0;cursor:pointer">Importar<input type="file" id="im" accept=".json" hidden></label><button class="ghost" id="cl">Cerrar</button></div>`;

  d.showModal();
  let col = S.color;

  d.onclick = e => {
    const c = e.target.closest('[data-col]');
    if (c) {
      col = c.dataset.col;
      d.querySelectorAll('[data-col]').forEach(b => b.classList.toggle('on', b === c));
    }
  };

  $('#cl').onclick = () => d.close();

  $('#ok').onclick = () => {
    S.nick = $('#pn').value.trim().slice(0, 20);
    S.color = col;
    S.goalD = Math.min(24, num($('#gd').value) || 3);
    S.goalW = Math.min(168, num($('#gw').value) || 15);
    const tVal = $('#pt').value;
    S.theme = tVal === 'light' || tVal === 'dark' ? tVal : 'auto';
    S.brutal = $('#ps').value === 'brutal';
    save(true);
    d.close();
    onSave();
    toast('Guardado');
  };

  $('#ex').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify({ ...S, run: null }, null, 1)], { type: 'application/json' })
    );
    a.download = `matestudi_${dk()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  $('#im').onchange = e => {
    const f = e.target.files[0];
    if (!f || f.size > 2e6) return toast('Archivo no válido');
    const r = new FileReader();
    r.onload = () => {
      try {
        const o = JSON.parse(r.result);
        if (!o || typeof o !== 'object' || !(o.tot || o.subjects)) throw new Error('Invalid backup');
        const v = S.view;
        stop();
        setState(clean(o));
        S.view = v;
        save(true);
        d.close();
        onImport();
        toast('Datos importados');
      } catch (x) {
        toast('El archivo no es una copia válida');
      }
    };
    r.readAsText(f);
  };
}