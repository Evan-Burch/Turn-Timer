import { MAX_TURNS, PHASES } from './config.js';
import { dom } from './dom.js';
import {
  state,
  formatTime,
  getTurnTotal,
  getGameTotalMs,
  getPlayedTurnIndexes
} from './state.js';

export function renderTurns(onOldTurnToggle) {
  dom.turnsContainerEl.innerHTML = '';

  for (let t = 0; t <= state.currentTurn; t += 1) {
    const details = document.createElement('details');
    details.className = 'turn-panel';

    if (t === state.currentTurn || state.expandedTurns.has(t)) {
      details.open = true;
    }
    if (t === state.currentTurn) {
      details.classList.add('active-turn');
    }

    const summary = document.createElement('summary');
    summary.addEventListener('click', (event) => {
      if (t === state.currentTurn) return;
      event.preventDefault();
      onOldTurnToggle(t);
    });

    const title = document.createElement('span');
    title.className = 'turn-title';
    title.textContent = `Turn ${t + 1}`;

    const total = document.createElement('span');
    total.className = 'time';
    total.setAttribute('data-turn-total', String(t));
    let totalMs = getTurnTotal(t);
    if (state.running && t === state.currentTurn) {
      totalMs += performance.now() - state.startTime;
    }
    total.textContent = formatTime(totalMs);

    summary.appendChild(title);
    summary.appendChild(total);
    details.appendChild(summary);

    const phaseList = document.createElement('div');
    phaseList.className = 'phase-list';

    for (let p = 0; p < PHASES.length; p += 1) {
      const row = document.createElement('div');
      row.className = 'phase-row';

      if (t === state.currentTurn && p === state.currentPhase) {
        row.classList.add('current');
      }

      const name = document.createElement('span');
      name.className = 'phase-name';
      name.textContent = PHASES[p];

      const value = document.createElement('span');
      value.className = 'time';
      value.setAttribute('data-phase-time', `${t}-${p}`);

      let ms = state.turns[t].phases[p];
      if (state.running && t === state.currentTurn && p === state.currentPhase) {
        ms += performance.now() - state.startTime;
      }
      value.textContent = formatTime(ms);

      row.appendChild(name);
      row.appendChild(value);
      phaseList.appendChild(row);
    }

    details.appendChild(phaseList);
    dom.turnsContainerEl.appendChild(details);
  }
}

export function renderReport() {
  if (!state.gameEnded) {
    dom.reportSectionEl.hidden = true;
    return;
  }

  const playedTurnIndexes = getPlayedTurnIndexes();
  const turnsCount = playedTurnIndexes.length;

  if (turnsCount === 0) {
    dom.reportSectionEl.hidden = false;
    dom.avgTurnTimeEl.textContent = '00:00';
    dom.turnsCountedEl.textContent = '0';
    dom.phaseAvgListEl.innerHTML = '<li class="phase-avg-item"><span>No timed turns were recorded.</span><span>00:00</span></li>';
    return;
  }

  const totalAcrossTurns = playedTurnIndexes.reduce((sum, turnIndex) => sum + getTurnTotal(turnIndex), 0);
  const avgTurnMs = totalAcrossTurns / turnsCount;

  dom.avgTurnTimeEl.textContent = formatTime(avgTurnMs);
  dom.turnsCountedEl.textContent = String(turnsCount);

  dom.phaseAvgListEl.innerHTML = '';

  for (let p = 0; p < PHASES.length; p += 1) {
    const phaseTotalMs = playedTurnIndexes.reduce((sum, turnIndex) => sum + state.turns[turnIndex].phases[p], 0);
    const phaseAvgMs = phaseTotalMs / turnsCount;

    const item = document.createElement('li');
    item.className = 'phase-avg-item';

    const label = document.createElement('span');
    label.textContent = PHASES[p];

    const value = document.createElement('span');
    value.className = 'time';
    value.textContent = formatTime(phaseAvgMs);

    item.appendChild(label);
    item.appendChild(value);
    dom.phaseAvgListEl.appendChild(item);
  }

  dom.reportSectionEl.hidden = false;
}

export function renderGameTotal(now = performance.now()) {
  dom.gameTotalTimeEl.textContent = formatTime(getGameTotalMs(now));
}

export function updateLiveTimes(now = performance.now()) {
  if (!state.running) return;

  const liveDelta = now - state.startTime;
  renderGameTotal(now);

  const totalEl = dom.turnsContainerEl.querySelector(`[data-turn-total="${state.currentTurn}"]`);
  if (totalEl) {
    totalEl.textContent = formatTime(getTurnTotal(state.currentTurn) + liveDelta);
  }

  const phaseEl = dom.turnsContainerEl.querySelector(`[data-phase-time="${state.currentTurn}-${state.currentPhase}"]`);
  if (phaseEl) {
    phaseEl.textContent = formatTime(state.turns[state.currentTurn].phases[state.currentPhase] + liveDelta);
  }
}

export function renderControls() {
  const atLastPosition =
    state.currentTurn === MAX_TURNS - 1 &&
    state.currentPhase === PHASES.length - 1;

  dom.nextPhaseBtn.disabled = atLastPosition || state.gameEnded;
  dom.toggleBtn.disabled = state.gameEnded;
  dom.endGameBtn.disabled = state.gameEnded;

  if (state.gameEnded || atLastPosition) {
    dom.nextPhaseBtn.textContent = 'End Reached';
  } else {
    dom.nextPhaseBtn.textContent = 'Next Phase';
  }
}
