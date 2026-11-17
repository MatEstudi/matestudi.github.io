/**
 * The single, mutable application state.
 *
 * The keys are short on purpose: they are persisted in localStorage and in the
 * backup files, so renaming them would break existing data.
 *
 *   view   active tab: 'study' | 'stats' | 'group'
 *   sel    selected subject id
 *   mode   timer mode: 'free' | 'pomo'
 *   rank   ranking period: 'daily' | 'weekly' | 'total'
 *   gv     community sub-view: 'friends' | 'rank' | 'chat'
 *   range  days shown in the consistency chart: 7 | 30
 *   nick   nickname shown to the community
 *   color  avatar colour
 *   goalD  daily goal (hours)        goalW  weekly goal (hours)
 *   tot    total seconds per subject
 *   hist   per-day seconds: { 'YYYY-MM-DD': { t: total, <subjectId>: seconds } }
 *   sess   most recent finished sessions
 *   run    id of the subject being timed, or null when paused (never persisted)
 *   cur    seconds of the current session
 *   phase  pomodoro phase: 0 = study, 1 = break
 *   rem    seconds left in the current pomodoro phase
 */
import { COLORS, POMODORO_SECONDS, SUBJECT_IDS } from './config.js';

export const emptyTotals = () => Object.fromEntries(SUBJECT_IDS.map(id => [id, 0]));

export const createBlankState = () => ({
  view: 'study',
  sel: SUBJECT_IDS[0],
  mode: 'free',
  rank: 'daily',
  gv: 'friends',
  range: 7,
  nick: '',
  color: COLORS[0],
  goalD: 3,
  goalW: 15,
  tot: emptyTotals(),
  hist: {},
  sess: [],
  run: null,
  cur: 0,
  phase: 0,
  rem: POMODORO_SECONDS[0],
});

export const state = createBlankState();

/** Replaces every field of the shared state in place (modules keep the same reference). */
export const replaceState = next => Object.assign(state, next);
