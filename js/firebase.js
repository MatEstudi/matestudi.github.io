import { SUBJ, COLORS, FB_CFG } from './config.js';
import { num, dk, monday, toast } from './utils.js';
import { S, stats } from './state.js';

export const fb = {
  ok: false,
  db: null,
  rt: null,
  uid: '',
  users: {},
  pres: {},
  msgs: []
};

let lastFs = 0;
let lastFsSig = '';
let lastProf = '';
let lastPrSig = '';
let unsubFs = null;
let chatRef = null;
let off = 0;
let lastMsg = 0;
let pruned = false;

let handlers = {
  onRender: () => {},
  onBadge: () => {},
  onChatAdd: () => {},
  onChatRemove: () => {},
  onOpenSettings: () => {},
  syncListeners: () => {}
};

export function registerFbHandlers(h) {
  handlers = { ...handlers, ...h };
}

export const sNow = () => Date.now() + off;

export async function initFb() {
  try {
    if (typeof window.firebase === 'undefined') throw new Error('Firebase SDK not loaded');
    const firebase = window.firebase;
    firebase.apps.length || firebase.initializeApp(FB_CFG);
    const au = firebase.auth();
    fb.db = firebase.firestore();
    fb.rt = firebase.database();

    const u = await new Promise((r, j) => {
      const x = au.onAuthStateChanged(v => {
        x();
        r(v);
      }, j);
    });
    if (!u) await au.signInAnonymously();

    fb.uid = au.currentUser.uid;
    fb.ok = true;

    fb.rt.ref('.info/serverTimeOffset').on('value', s => {
      off = s.val() || 0;
    });

    fb.rt.ref('.info/connected').on('value', s => {
      if (s.val()) {
        fb.rt
          .ref('presence/' + fb.uid)
          .onDisconnect()
          .update({
            online: false,
            lastSeen: firebase.database.ServerValue.TIMESTAMP,
            active: null,
            since: null
          })
          .catch(() => {});
        lastPrSig = '';
        sync(true);
      }
    });

    fb.rt.ref('presence').on('value', s => {
      fb.pres = s.val() || {};
      if (S.view === 'group' && S.gv !== 'chat') handlers.onRender();
      else handlers.onBadge();
    });

    handlers.syncListeners();
    handlers.onBadge();
    setTimeout(prune, 8000);
  } catch (e) {
    fb.ok = false;
    console.warn('Modo local:', e);
  }
}

/* Firestore solo se LEE con la pestaña Comunidad abierta y solo usuarios activos en los últimos 30 días. */
export function listenUsers(on) {
  if (!fb.ok) return;
  if (on && !unsubFs) {
    unsubFs = fb.db
      .collection('users')
      .where('updatedAt', '>', Date.now() - 30 * 864e5)
      .onSnapshot(
        s => {
          s.docChanges().forEach(c => {
            if (c.type === 'removed') delete fb.users[c.doc.id];
            else fb.users[c.doc.id] = c.doc.data();
          });
          if (S.view === 'group' && document.activeElement?.tagName !== 'INPUT') {
            handlers.onRender();
          }
        },
        e => {
          console.warn('Firestore:', e);
          unsubFs = null;
        }
      );
  } else if (!on && unsubFs) {
    unsubFs();
    unsubFs = null;
  }
}

export function listenChat(on) {
  if (!fb.ok) return;
  if (on && !chatRef) {
    fb.msgs = [];
    chatRef = fb.rt.ref('chat/general').limitToLast(50);
    chatRef.on(
      'child_added',
      x => {
        const m = { k: x.key, ...x.val() };
        fb.msgs.push(m);
        if (fb.msgs.length > 80) fb.msgs.shift();
        handlers.onChatAdd(m);
      },
      e => {
        console.warn('Chat:', e);
        chatRef = null;
      }
    );
    chatRef.on('child_removed', x => {
      fb.msgs = fb.msgs.filter(m => m.k !== x.key);
      handlers.onChatRemove(x.key);
    });
  } else if (!on && chatRef) {
    chatRef.off();
    chatRef = null;
  }
}

/* Escrituras mínimas:
   - Presencia (Realtime DB): solo cuando cambia tu estado. Sin latidos periódicos.
   - Estadísticas (Firestore): al pausar, al cerrar, o cada 5 min mientras estudias. */
export function sync(force = false, final = false) {
  if (!fb.ok || !S.nick) return;
  const now = Date.now();
  const st = stats();
  const a = S.run ? SUBJ[S.run].n : null;

  const ps = JSON.stringify([S.nick, S.color, a]);
  if (ps !== lastPrSig) {
    lastPrSig = ps;
    fb.rt
      .ref('presence/' + fb.uid)
      .update({
        online: true,
        lastSeen: window.firebase.database.ServerValue.TIMESTAMP,
        nickname: S.nick,
        avatarColor: S.color,
        active: a,
        since: S.run ? now + off - S.cur * 1000 : null
      })
      .catch(() => {});
  }

  const fs = JSON.stringify([
    S.nick,
    S.color,
    Math.floor(st.total / 60),
    Math.floor(st.today / 60),
    Math.floor(st.week / 60)
  ]);
  if (fs === lastFsSig) return;

  const prof = S.nick + S.color;
  const due =
    lastFs === 0 ||
    final ||
    prof !== lastProf ||
    (!S.run && force) ||
    now - lastFs >= 300000;
  if (!due) return;

  lastFs = now;
  lastFsSig = fs;
  lastProf = prof;

  fb.db
    .collection('users')
    .doc(fb.uid)
    .set(
      {
        nickname: S.nick,
        avatarColor: S.color,
        totalSeconds: st.total,
        todaySeconds: st.today,
        todayDateKey: st.todayKey,
        weeklySeconds: st.week,
        weekStartKey: st.weekKey,
        updatedAt: now + off
      },
      { merge: true }
    )
    .catch(() => {});
}

export function members() {
  const tk = dk();
  const wk = dk(monday());
  const now = Date.now();
  const out = [];

  new Set([...Object.keys(fb.users), ...Object.keys(fb.pres)]).forEach(id => {
    const me = id === fb.uid;
    const u = { ...fb.users[id], ...fb.pres[id] };

    if (me && S.nick) {
      const st = stats();
      Object.assign(u, {
        nickname: S.nick,
        avatarColor: S.color,
        totalSeconds: st.total,
        todaySeconds: st.today,
        todayDateKey: tk,
        weeklySeconds: st.week,
        weekStartKey: wk,
        online: fb.ok,
        active: S.run ? SUBJ[S.run].n : null,
        since: S.run ? now + off - S.cur * 1000 : null,
        lastSeen: now,
        updatedAt: now
      });
    }

    if (!u.nickname) return;
    if (!u.online && now - (u.updatedAt || 0) > 30 * 864e5) return;

    const extra =
      !me && u.online && u.active
        ? Math.min(600, Math.max(0, (now + off - (Math.max(+u.updatedAt || 0, +u.since || 0) || now + off)) / 1000))
        : 0;

    out.push({
      id,
      me,
      nick: String(u.nickname).slice(0, 20),
      color: COLORS.includes(u.avatarColor) ? u.avatarColor : COLORS[0],
      on: !!u.online,
      act: u.online ? u.active : null,
      since: +u.since || 0,
      seen: +u.lastSeen || +u.updatedAt || 0,
      daily: (u.todayDateKey === tk ? num(u.todaySeconds, 86400) : 0) + extra,
      weekly: (u.weekStartKey === wk ? num(u.weeklySeconds) : 0) + extra,
      total: num(u.totalSeconds) + extra
    });
  });

  return out;
}

export function sendMsg(inputEl) {
  const t = (inputEl ? inputEl.value : '').trim().slice(0, 300);
  if (!t) return false;
  if (!S.nick) {
    handlers.onOpenSettings();
    return false;
  }
  if (!fb.ok) {
    toast('Sin conexión con la comunidad');
    return false;
  }
  if (Date.now() - lastMsg < 1500) {
    toast('Espera un segundo antes de enviar otro mensaje');
    return false;
  }
  lastMsg = Date.now();
  fb.rt
    .ref('chat/general')
    .push({
      uid: fb.uid,
      nick: S.nick,
      color: S.color,
      text: t,
      ts: window.firebase.database.ServerValue.TIMESTAMP
    })
    .catch(() => toast('No se pudo enviar. Revisa las reglas de Realtime Database.'));

  inputEl.value = '';
  return true;
}

export function deleteMsg(key) {
  if (!fb.ok) return;
  fb.rt
    .ref('chat/general/' + key)
    .remove()
    .catch(() => toast('No se pudo borrar'));
}

/* Limpieza sin servidor: borra mensajes > 7 días y presencias > 30 días (máx. 50 por visita) */
export function prune() {
  if (!fb.ok || pruned) return;
  pruned = true;
  const run = (path, key, ms) =>
    fb.rt
      .ref(path)
      .orderByChild(key)
      .endAt(sNow() - ms - 36e5)
      .limitToFirst(50)
      .once('value')
      .then(sn =>
        Promise.all(
          Object.keys(sn.val() || {})
            .filter(k => path !== 'presence' || k !== fb.uid)
            .map(k => fb.rt.ref(path + '/' + k).remove().catch(() => {}))
        )
      )
      .catch(e => console.warn('Limpieza:', e.message));

  run('chat/general', 'ts', 7 * 864e5);
  run('presence', 'lastSeen', 30 * 864e5);
}