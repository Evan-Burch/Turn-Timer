import { MAX_TURNS, PHASES } from './config.js';

export const state = {
  running: false,
  startTime: 0,
  rafId: null,
  currentTurn: 0,
  currentPhase: 0,
  gameEnded: false,
  expandedTurns: new Set(),
  turns: Array.from({ length: MAX_TURNS }, () => ({
    phases: Array(PHASES.length).fill(0)
  }))
};

export function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatGameTotalTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function getTurnTotal(turnIndex) {
  return state.turns[turnIndex].phases.reduce((sum, ms) => sum + ms, 0);
}

export function getGameTotalMs(now = performance.now()) {
  const finishedMs = state.turns.reduce(
    (sum, turn) => sum + turn.phases.reduce((phaseSum, ms) => phaseSum + ms, 0),
    0
  );

  if (!state.running) return finishedMs;
  return finishedMs + (now - state.startTime);
}

export function commitLiveTime(now = performance.now()) {
  if (!state.running) return;
  const delta = now - state.startTime;
  state.turns[state.currentTurn].phases[state.currentPhase] += delta;
  state.startTime = now;
}

export function getPlayedTurnIndexes() {
  const indexes = [];
  for (let t = 0; t < MAX_TURNS; t += 1) {
    if (getTurnTotal(t) > 0) {
      indexes.push(t);
    }
  }
  return indexes;
}

export function resetGameState() {
  state.running = false;
  state.gameEnded = false;
  state.currentTurn = 0;
  state.currentPhase = 0;
  state.expandedTurns.clear();

  for (const turn of state.turns) {
    turn.phases.fill(0);
  }
}
