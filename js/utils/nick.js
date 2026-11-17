/** Nickname rules shared by the settings dialog, the community service and the chat. */
import { NICK_MAX, NICK_MIN, NICK_RE } from '../config.js';

/** Names are unique ignoring case, so "Ana" and "ana" are the same name. */
export const nickKey = name => name.toLowerCase();

/** Returns a user-facing error, or '' when the name is valid. */
export function nickError(name) {
  if (name.length < NICK_MIN) return `El nombre debe tener al menos ${NICK_MIN} caracteres.`;
  if (name.length > NICK_MAX) return `El nombre puede tener como máximo ${NICK_MAX} caracteres.`;
  if (!NICK_RE.test(name) || !/[A-Za-z0-9]/.test(name)) {
    return 'Usa solo letras sin tildes, números, guion (-) y guion bajo (_). Sin espacios ni emojis.';
  }
  return '';
}

export const isValidNick = name => typeof name === 'string' && nickError(name) === '';

/** Names coming from other users are never trusted: anything invalid is shown as "anónimo". */
export const displayNick = name => (isValidNick(name) ? name : 'anónimo');
