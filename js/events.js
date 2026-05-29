import { dom } from './dom.js';

export function bindEvents(handlers) {
  dom.toggleBtn.addEventListener('click', handlers.onToggle);
  dom.nextPhaseBtn.addEventListener('click', handlers.onNextPhase);
  dom.endGameBtn.addEventListener('click', handlers.onEndGame);
  dom.resetBtn.addEventListener('click', handlers.onReset);
}
