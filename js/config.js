/** Application-wide constants. */

export const STORAGE_KEY = 'matestudi_v1';
/** Keys used before the app was renamed. They are only read, to migrate existing data. */
export const LEGACY_STORAGE_KEYS = ['mathstudy_hub_v2', 'mathstudy_hub_v1'];

export const DAY_SECONDS = 86400;
export const DAY_MS = DAY_SECONDS * 1000;

/** Pomodoro phases in seconds: [study, break]. */
export const POMODORO_SECONDS = [50 * 60, 10 * 60];
/** Shorter sessions are discarded instead of being added to the history. */
export const MIN_SESSION_SECONDS = 10;
export const MAX_SESSIONS = 50;

export const NICK_MAX = 20;
export const NICK_MIN = 3;
/** Allowed nickname characters: ASCII letters, digits, "-" and "_" (no accents, spaces or emojis). */
export const NICK_RE = /^[A-Za-z0-9_-]+$/;
/** Realtime Database path of the nickname registry: usernames/<lowercase name> = uid of its owner. */
export const USERNAMES_PATH = 'usernames';
export const MESSAGE_MAX = 300;

export const SUBJECTS = {
  fonaments: { n: 'Fonaments', c: '#6366f1' },
  algebra: { n: 'Àlgebra Lineal I', c: '#10b981' },
  analisi: { n: 'Anàlisi Matemàtic I', c: '#f43f5e' },
};
export const SUBJECT_IDS = Object.keys(SUBJECTS);

export const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#0ea5e9', '#ec4899', '#14b8a6'];

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDtBjHqSx7QyJZXlR7EsYAPmTadIu2hmnU',
  authDomain: 'math-study-df821.firebaseapp.com',
  databaseURL: 'https://math-study-df821-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'math-study-df821',
  storageBucket: 'math-study-df821.firebasestorage.app',
  messagingSenderId: '278188701491',
  appId: '1:278188701491:web:703b085ecc312d0f9ef046',
};

/** Realtime Database path of the public chat room. */
export const CHAT_PATH = 'chat/general';

/** Custom DOM events emitted by the services so they stay independent from the UI. */
export const EVENTS = {
  ready: 'community:ready',
  presence: 'community:presence',
  users: 'community:users',
  chatAdded: 'chat:added',
  chatRemoved: 'chat:removed',
};
