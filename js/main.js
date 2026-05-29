import { MAX_TURNS, PHASES } from './config.js';
import { dom } from './dom.js';
import { state, commitLiveTime, resetGameState } from './state.js';
import {
  renderTurns,
  renderReport,
  renderControls,
  renderGameTotal,
  updateLiveTimes
} from './render.js';
import { bindEvents } from './events.js';

function renderStatus() {
  renderTurns((turnIndex) => {
    if (state.expandedTurns.has(turnIndex)) {
      state.expandedTurns.delete(turnIndex);
    } else {
      state.expandedTurns.add(turnIndex);
    }
    renderStatus();
  });

  renderGameTotal();
  renderReport();
  renderControls();
}

function stopAnimationLoop() {
  if (state.rafId !== null) {
    cancelAnimationFrame(state.rafId);
    state.rafId = null;
  }
}

function update() {
  updateLiveTimes();
  state.rafId = requestAnimationFrame(update);
}

function endGame() {
  commitLiveTime();
  state.running = false;
  state.gameEnded = true;
  dom.toggleBtn.textContent = 'Start';
  stopAnimationLoop();
  renderStatus();
}

bindEvents({
  onToggle: () => {
    if (state.gameEnded) return;

    if (!state.running) {
      state.running = true;
      state.startTime = performance.now();
      dom.toggleBtn.textContent = 'Pause';
      state.rafId = requestAnimationFrame(update);
      return;
    }

    commitLiveTime();
    state.running = false;
    dom.toggleBtn.textContent = 'Start';
    stopAnimationLoop();
    renderStatus();
  },

  onNextPhase: () => {
    const atLastPosition =
      state.currentTurn === MAX_TURNS - 1 &&
      state.currentPhase === PHASES.length - 1;

    if (atLastPosition) {
      endGame();
      return;
    }

    commitLiveTime();

    if (state.currentPhase < PHASES.length - 1) {
      state.currentPhase += 1;
    } else if (state.currentTurn < MAX_TURNS - 1) {
      state.currentTurn += 1;
      state.currentPhase = 0;
      state.expandedTurns.clear();
    }

    if (state.running) {
      state.startTime = performance.now();
    }

    renderStatus();
  },

  onEndGame: () => {
    endGame();
  },

  onReset: () => {
    resetGameState();
    dom.toggleBtn.textContent = 'Start';
    stopAnimationLoop();
    renderStatus();
  }
});

renderStatus();
