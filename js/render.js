import { MAX_TURNS, PHASES, PHASE_LIMITS_MS, TURN_LIMIT_MS } from './config.js';
import { dom } from './dom.js';
import {
  state,
  formatTime,
  formatGameTotalTime,
  getTurnTotal,
  getGameTotalMs,
  getPlayedTurnIndexes
} from './state.js';

function formatLimitText(ms) {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const minutePart = minutes > 0 ? `${minutes} minute${minutes === 1 ? '' : 's'}` : '';
  const secondPart = seconds > 0 ? `${seconds} second${seconds === 1 ? '' : 's'}` : '';

  if (minutePart && secondPart) return `${minutePart} ${secondPart}`;
  if (minutePart) return minutePart;
  return secondPart || '0 seconds';
}

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

    const summaryMain = document.createElement('div');
    summaryMain.className = 'turn-summary-main';

    const title = document.createElement('span');
    title.className = 'turn-title';
    title.textContent = `Turn ${t + 1}`;

    const turnGoal = document.createElement('span');
    turnGoal.className = 'turn-goal';
    turnGoal.textContent = `Average Time Goal: ${formatLimitText(TURN_LIMIT_MS)}`;

    const total = document.createElement('span');
    total.className = 'time';
    total.setAttribute('data-turn-total', String(t));
    let totalMs = getTurnTotal(t);
    if (state.running && t === state.currentTurn) {
      totalMs += performance.now() - state.startTime;
    }
    total.textContent = formatTime(totalMs);
    total.classList.toggle('over-limit', totalMs >= TURN_LIMIT_MS);

    summaryMain.appendChild(title);
    summaryMain.appendChild(turnGoal);
    summaryMain.appendChild(total);

    summary.appendChild(summaryMain);
    details.appendChild(summary);

    const phaseList = document.createElement('div');
    phaseList.className = 'phase-list';

    for (let p = 0; p < PHASES.length; p += 1) {
      const row = document.createElement('div');
      row.className = 'phase-row';

      if (t === state.currentTurn && p === state.currentPhase) {
        row.classList.add('current');
      }

      const phaseName = document.createElement('span');
      phaseName.className = 'phase-name';
      phaseName.textContent = PHASES[p];

      const phaseGoal = document.createElement('span');
      phaseGoal.className = 'phase-goal';
      phaseGoal.textContent = formatLimitText(PHASE_LIMITS_MS[p]);

      const value = document.createElement('span');
      value.className = 'time';
      value.setAttribute('data-phase-time', `${t}-${p}`);

      let ms = state.turns[t].phases[p];
      if (state.running && t === state.currentTurn && p === state.currentPhase) {
        ms += performance.now() - state.startTime;
      }
      value.textContent = formatTime(ms);
      value.classList.toggle('over-limit', ms >= PHASE_LIMITS_MS[p]);

      row.appendChild(phaseName);
      row.appendChild(phaseGoal);
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
  dom.gameTotalTimeEl.textContent = formatGameTotalTime(getGameTotalMs(now));
}

export function updateLiveTimes(now = performance.now()) {
  if (!state.running) return;

  const liveDelta = now - state.startTime;
  renderGameTotal(now);

  const totalEl = dom.turnsContainerEl.querySelector(`[data-turn-total="${state.currentTurn}"]`);
  if (totalEl) {
    const liveTurnMs = getTurnTotal(state.currentTurn) + liveDelta;
    totalEl.textContent = formatTime(liveTurnMs);
    totalEl.classList.toggle('over-limit', liveTurnMs >= TURN_LIMIT_MS);
  }

  const phaseEl = dom.turnsContainerEl.querySelector(`[data-phase-time="${state.currentTurn}-${state.currentPhase}"]`);
  if (phaseEl) {
    const livePhaseMs = state.turns[state.currentTurn].phases[state.currentPhase] + liveDelta;
    phaseEl.textContent = formatTime(livePhaseMs);
    phaseEl.classList.toggle('over-limit', livePhaseMs >= PHASE_LIMITS_MS[state.currentPhase]);
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
