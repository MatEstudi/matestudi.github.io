/** Public chat room on the Realtime Database. Only listened to while the chat is open. */
import { CHAT_PATH, EVENTS } from '../config.js';
import { state } from '../state.js';
import { emit } from '../utils/dom.js';
import { community, serverTimestamp } from './community.js';

const HISTORY_LIMIT = 50; // messages requested from the server
const MEMORY_LIMIT = 80; // messages kept in memory

let query = null;

/** Starts or stops listening to the last messages. Emits chatAdded / chatRemoved. */
export function listenChat(on) {
  if (!community.ok) return;
  if (on && !query) {
    community.msgs = [];
    query = community.rt.ref(CHAT_PATH).limitToLast(HISTORY_LIMIT);
    query.on('child_added', snap => {
      const message = { ...snap.val(), k: snap.key };
      community.msgs.push(message);
      if (community.msgs.length > MEMORY_LIMIT) community.msgs.shift();
      emit(EVENTS.chatAdded, message);
    }, err => {
      console.warn('Chat:', err);
      query = null;
    });
    query.on('child_removed', snap => {
      community.msgs = community.msgs.filter(m => m.k !== snap.key);
      emit(EVENTS.chatRemoved, snap.key);
    });
  } else if (!on && query) {
    query.off();
    query = null;
  }
}

export const postMessage = text => community.rt.ref(CHAT_PATH).push({
  uid: community.uid,
  nick: state.nick,
  color: state.color,
  text,
  ts: serverTimestamp(),
});

export const deleteMessage = key => community.rt.ref(`${CHAT_PATH}/${key}`).remove();
