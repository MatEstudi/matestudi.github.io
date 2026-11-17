/**
 * Community backend (Firebase), kept free of any UI code.
 *
 *  - Auth:      anonymous sign-in.
 *  - Presence:  Realtime Database. Written only when your status changes (no heartbeats).
 *  - Stats:     Firestore. Written when pausing, closing, every 5 min while studying,
 *               and never if nothing changed. Read only while the Community tab is open.
 *
 * Changes are announced with custom DOM events (see EVENTS in config.js).
 */
import {
  CHAT_PATH, COLORS, DAY_MS, DAY_SECONDS, EVENTS, FIREBASE_CONFIG, NICK_MAX, SUBJECTS,
} from '../config.js';
import { state } from '../state.js';
import { computeStats } from '../progress.js';
import { emit } from '../utils/dom.js';
import { clampInt, dateKey, startOfWeek } from '../utils/format.js';

export const community = {
  ok: false, // true once signed in; false means "local mode"
  db: null, // Firestore
  rt: null, // Realtime Database
  uid: '',
  users: {}, // Firestore profiles by uid
  pres: {}, // presence by uid
  msgs: [], // chat messages currently loaded
};

let serverOffset = 0;
let lastFirestoreWrite = 0;
let lastFirestoreSig = '';
let lastProfile = '';
let lastPresenceSig = '';
let stopUsersListener = null;
let pruned = false;

/** Current time according to the Firebase server clock (ms). */
export const serverNow = () => Date.now() + serverOffset;
export const serverTimestamp = () => window.firebase.database.ServerValue.TIMESTAMP;

export async function initCommunity() {
  try {
    const firebase = window.firebase;
    if (!firebase) throw new Error('Firebase SDK not loaded');
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);

    const auth = firebase.auth();
    community.db = firebase.firestore();
    community.rt = firebase.database();

    const user = await new Promise((resolve, reject) => {
      const unsubscribe = auth.onAuthStateChanged(u => { unsubscribe(); resolve(u); }, reject);
    });
    if (!user) await auth.signInAnonymously();
    community.uid = auth.currentUser.uid;
    community.ok = true;

    community.rt.ref('.info/serverTimeOffset').on('value', snap => { serverOffset = snap.val() || 0; });
    community.rt.ref('.info/connected').on('value', snap => {
      if (!snap.val()) return;
      community.rt.ref('presence/' + community.uid).onDisconnect()
        .update({ online: false, lastSeen: serverTimestamp(), active: null, since: null })
        .catch(() => {});
      lastPresenceSig = '';
      sync(true);
    });
    community.rt.ref('presence').on('value', snap => {
      community.pres = snap.val() || {};
      emit(EVENTS.presence);
    });

    emit(EVENTS.ready);
    setTimeout(pruneStale, 8000);
  } catch (err) {
    community.ok = false;
    console.warn('Modo local:', err);
  }
}

/** Subscribes to (or unsubscribes from) the profiles of users active in the last 30 days. */
export function listenUsers(on) {
  if (!community.ok) return;
  if (on && !stopUsersListener) {
    stopUsersListener = community.db.collection('users')
      .where('updatedAt', '>', Date.now() - 30 * DAY_MS)
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'removed') delete community.users[change.doc.id];
          else community.users[change.doc.id] = change.doc.data();
        });
        emit(EVENTS.users);
      }, err => {
        console.warn('Firestore:', err);
        stopUsersListener = null;
      });
  } else if (!on && stopUsersListener) {
    stopUsersListener();
    stopUsersListener = null;
  }
}

/** Publishes your presence and stats, skipping writes when nothing relevant changed. */
export function sync(force = false, final = false) {
  if (!community.ok || !state.nick) return;
  const now = Date.now();
  const stats = computeStats();
  const active = state.run ? SUBJECTS[state.run].n : null;

  const presenceSig = JSON.stringify([state.nick, state.color, active]);
  if (presenceSig !== lastPresenceSig) {
    lastPresenceSig = presenceSig;
    community.rt.ref('presence/' + community.uid).update({
      online: true,
      lastSeen: serverTimestamp(),
      nickname: state.nick,
      avatarColor: state.color,
      active,
      since: state.run ? now + serverOffset - state.cur * 1000 : null,
    }).catch(() => {});
  }

  const statsSig = JSON.stringify([
    state.nick, state.color,
    Math.floor(stats.total / 60), Math.floor(stats.today / 60), Math.floor(stats.week / 60),
  ]);
  if (statsSig === lastFirestoreSig) return;

  const profile = state.nick + state.color;
  const due = lastFirestoreWrite === 0 || final || profile !== lastProfile
    || (!state.run && force) || now - lastFirestoreWrite >= 300000;
  if (!due) return;

  lastFirestoreWrite = now;
  lastFirestoreSig = statsSig;
  lastProfile = profile;
  community.db.collection('users').doc(community.uid).set({
    nickname: state.nick,
    avatarColor: state.color,
    totalSeconds: stats.total,
    todaySeconds: stats.today,
    todayDateKey: stats.todayKey,
    weeklySeconds: stats.week,
    weekStartKey: stats.weekKey,
    updatedAt: now + serverOffset,
  }, { merge: true }).catch(() => {});
}

/** Merges Firestore profiles and live presence into a flat list of community members. */
export function members() {
  const todayKey = dateKey();
  const weekKey = dateKey(startOfWeek());
  const now = Date.now();
  const out = [];

  new Set([...Object.keys(community.users), ...Object.keys(community.pres)]).forEach(id => {
    const isMe = id === community.uid;
    const u = { ...community.users[id], ...community.pres[id] };

    if (isMe && state.nick) { // your own entry always reflects the live local data
      const stats = computeStats();
      Object.assign(u, {
        nickname: state.nick,
        avatarColor: state.color,
        totalSeconds: stats.total,
        todaySeconds: stats.today,
        todayDateKey: todayKey,
        weeklySeconds: stats.week,
        weekStartKey: weekKey,
        online: community.ok,
        active: state.run ? SUBJECTS[state.run].n : null,
        since: state.run ? now + serverOffset - state.cur * 1000 : null,
        lastSeen: now,
        updatedAt: now,
      });
    }

    if (!u.nickname) return;
    if (!u.online && now - (u.updatedAt || 0) > 30 * DAY_MS) return; // ghost users

    // Other people's stats are only written every few minutes: estimate the time since then.
    const lastKnown = Math.max(+u.updatedAt || 0, +u.since || 0) || now + serverOffset;
    const extra = (!isMe && u.online && u.active)
      ? Math.min(600, Math.max(0, (now + serverOffset - lastKnown) / 1000))
      : 0;

    out.push({
      id,
      me: isMe,
      nick: String(u.nickname).slice(0, NICK_MAX),
      color: COLORS.includes(u.avatarColor) ? u.avatarColor : COLORS[0],
      on: !!u.online,
      act: u.online ? u.active : null,
      since: +u.since || 0,
      seen: +u.lastSeen || +u.updatedAt || 0,
      daily: (u.todayDateKey === todayKey ? clampInt(u.todaySeconds, DAY_SECONDS) : 0) + extra,
      weekly: (u.weekStartKey === weekKey ? clampInt(u.weeklySeconds) : 0) + extra,
      total: clampInt(u.totalSeconds) + extra,
    });
  });
  return out;
}

/**
 * Serverless cleanup, once per visit: removes (at most 50 of each) chat messages older
 * than 7 days and presence records older than 30 days.
 */
function pruneStale() {
  if (!community.ok || pruned) return;
  pruned = true;
  const run = (path, orderKey, maxAgeMs) => community.rt.ref(path)
    .orderByChild(orderKey)
    .endAt(serverNow() - maxAgeMs - 36e5)
    .limitToFirst(50)
    .once('value')
    .then(snap => Promise.all(
      Object.keys(snap.val() || {})
        .filter(key => path !== 'presence' || key !== community.uid)
        .map(key => community.rt.ref(path + '/' + key).remove().catch(() => {})),
    ))
    .catch(err => console.warn('Limpieza:', err.message));
  run(CHAT_PATH, 'ts', 7 * DAY_MS);
  run('presence', 'lastSeen', 30 * DAY_MS);
}
