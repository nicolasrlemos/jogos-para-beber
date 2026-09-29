import { rankLabel } from '../../core/cards';
import { renderCard } from '../../ui/card';
import { mountEnd } from '../../ui/end';
import { escapeHtml } from '../../ui/html';
import { bindTopbar, renderTopbar } from '../../ui/topbar';
import type { GameConfig, GameContext } from '../registry';
import { matchesForSlot, REVEAL_ORDER, slotName, type PyramidSlot, type SlotKind } from './ceu-inferno';
import {
  advance, createPretoVermelho, currentSlot, finishGame, handsForMatching,
  isPyramidComplete, revealNextSlot, submitGuess, type PvState,
} from './game';
import { formatSips, GUESS_OPTIONS, ROUND_NAMES, sipsForRound, type Guess, type GuessRound } from './logic';

export function mountPretoVermelho(root: HTMLElement, config: GameConfig, ctx: GameContext): void {
  let state: PvState = createPretoVermelho(config.players, config.deckCount);

  function update(next: PvState): void {
    state = next;
    render();
  }

  function render(): void {
    switch (state.phase) {
      case 'guess':
      case 'result':
        renderGuessRound();
        break;
      case 'pyramid':
        renderPyramid();
        break;
      case 'over':
        mountEnd(root, 'Fim de jogo', 'Céu e Inferno concluídos.', ctx);
        break;
    }
  }

  function renderGuessRound(): void {
    const round = state.round as GuessRound;
    const sips = sipsForRound(round);
    const inResult = state.phase === 'result';
    const hand = state.hands[state.current];
    const previous = inResult ? hand.slice(0, -1) : hand;

    root.innerHTML = `
      <main class="screen game">
        ${renderTopbar('Preto ou Vermelho', `Rodada ${round} · ${ROUND_NAMES[round]} · vale ${formatSips(sips)}`)}
        <p class="turn">Vez de: <strong>${escapeHtml(state.players[state.current])}</strong></p>
        <div class="hand">
          ${previous.length ? previous.map((c) => renderCard(c, { small: true })).join('') : '<span class="hint">Sem cartas ainda</span>'}
        </div>
        <div class="table">
          ${inResult && state.lastCard ? renderCard(state.lastCard, { flip: true }) : renderCard(null)}
        </div>
        ${
          inResult
            ? `<p class="result ${state.lastCorrect ? 'ok' : 'fail'}">
                 ${state.lastCorrect ? `✅ Acertou! Distribua ${formatSips(sips)}` : `❌ Errou! Beba ${formatSips(sips)}`}
               </p>
               <button class="btn btn-primary btn-big" data-action="next">Próximo</button>`
            : `<div class="guess-options">
                 ${GUESS_OPTIONS[round].map((o) => `<button class="btn btn-guess" data-guess="${o.guess}">${o.label}</button>`).join('')}
               </div>`
        }
      </main>`;

    bindTopbar(root, ctx.onExit);
    const guessButtons = root.querySelectorAll<HTMLButtonElement>('[data-guess]');
    guessButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        guessButtons.forEach((b) => (b.disabled = true));
        update(submitGuess(state, btn.dataset.guess as Guess));
      });
    });
    root.querySelector('[data-action="next"]')?.addEventListener('click', () => update(advance(state)), { once: true });
  }

  function renderSlot(kind: SlotKind, level: number): string {
    const index = REVEAL_ORDER.findIndex((p) => p.kind === kind && p.level === level);
    const slot = state.pyramid[index];
    const isOpen = index < state.revealedCount;
    const isCurrent = index === state.revealedCount - 1;
    return `
      <div class="slot ${isCurrent ? 'current' : ''}">
        ${renderCard(isOpen ? slot.card : null, { small: true, flip: isCurrent })}
        <span class="slot-label">${kind === 'terra' ? 'Terra' : level}</span>
      </div>`;
  }

  function renderMatches(slot: PyramidSlot | null): string {
    if (!slot) return `<p class="hint">Toque em "Virar próxima" para começar pelo Céu 1</p>`;
    const matches = matchesForSlot(slot, handsForMatching(state));
    const value = rankLabel(slot.card.rank);
    const lines = matches.map((m) => {
      const who = `<strong>${escapeHtml(m.player)}</strong> tem ${m.count > 1 ? `${m.count}× ` : ''}${value}`;
      switch (slot.kind) {
        case 'ceu':
          return `<li>${who} → distribua ${formatSips(m.distribute)}</li>`;
        case 'inferno':
          return `<li>${who} → beba ${formatSips(m.drink)}</li>`;
        case 'terra':
          return `<li>${who} → beba ${formatSips(m.drink)} e distribua ${formatSips(m.distribute)}</li>`;
      }
    });
    return `
      <section class="matches">
        <h3>${slotName(slot)} · ${value}</h3>
        ${lines.length ? `<ul>${lines.join('')}</ul>` : '<p>Ninguém tem — sorte!</p>'}
      </section>`;
  }

  function renderPyramid(): void {
    const levels = [1, 2, 3, 4];
    const done = isPyramidComplete(state);

    root.innerHTML = `
      <main class="screen game">
        ${renderTopbar('Preto ou Vermelho', 'Rodada 5 · Céu e Inferno')}
        <div class="pyramid">
          <p class="row-title ceu">Céu</p>
          <div class="pyramid-row">${levels.map((l) => renderSlot('ceu', l)).join('')}</div>
          <p class="row-title terra">Terra</p>
          <div class="pyramid-row">${renderSlot('terra', 5)}</div>
          <p class="row-title inferno">Inferno</p>
          <div class="pyramid-row">${levels.map((l) => renderSlot('inferno', l)).join('')}</div>
        </div>
        ${renderMatches(currentSlot(state))}
        <button class="btn btn-primary btn-big" data-action="${done ? 'finish' : 'reveal'}">
          ${done ? 'Finalizar' : 'Virar próxima'}
        </button>
        <div class="hands-list">
          ${state.players
            .map(
              (p, i) => `
            <div class="hand-row">
              <span class="name">${escapeHtml(p)}</span>
              <div class="hand">${state.hands[i].map((c) => renderCard(c, { small: true })).join('')}</div>
            </div>`,
            )
            .join('')}
        </div>
      </main>`;

    bindTopbar(root, ctx.onExit);
    root.querySelector('[data-action="reveal"]')?.addEventListener('click', () => update(revealNextSlot(state)), { once: true });
    root.querySelector('[data-action="finish"]')?.addEventListener('click', () => update(finishGame(state)), { once: true });
  }

  render();
}
