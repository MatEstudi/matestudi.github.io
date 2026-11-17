/** Small DOM helpers. */

export const $ = selector => document.querySelector(selector);

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapes a value so it can be safely interpolated into an HTML template. */
export const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => HTML_ESCAPES[ch]);

/** Dispatches a custom event on the document. */
export const emit = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }));

export function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 2600);
}
