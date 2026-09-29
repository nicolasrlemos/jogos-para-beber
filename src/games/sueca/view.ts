import { rankLabel } from '../../core/cards';
import { renderCard } from '../../ui/card';
import { mountEnd } from '../../ui/end';
import { escapeHtml } from '../../ui/html';
import { bindTopbar, renderTopbar } from '../../ui/topbar';
import type { GameConfig, GameContext } from '../registry';
import { SUECA_RULES } from './rules';
import { createSueca, currentPlayer, isSuecaOver, nextTurn, revealCard } from './sueca';

export function mountSueca(root: HTMLElement, config: GameConfig, ctx: GameContext): void {
  let state = createSueca(config.players, config.deckCount);

  function render(): void {
    if (isSuecaOver(state)) {
      mountEnd(root, 'Fim do baralho', 'Todas as cartas foram tiradas.', ctx);
      return;
    }
    const card = state.revealed;
    const rule = card ? SUECA_RULES[card.rank] : null;

    root.innerHTML = `
      <main class="screen game">
        ${renderTopbar('Suéca Alcoólico')}
        <p class="turn">Vez de: <strong>${escapeHtml(currentPlayer(state))}</strong></p>
        <div class="table">
          ${
            card
              ? renderCard(card, { flip: true })
              : `<button class="pile" data-action="reveal" aria-label="Tirar carta">${renderCard(null)}</button>`
          }
          <p class="pile-count">${state.pile.length} cartas no monte</p>
        </div>
        ${
          card && rule
            ? `<section class="rule">
                 <h3>${rankLabel(card.rank)} · ${escapeHtml(rule.title)}</h3>
                 <p>${escapeHtml(rule.text)}</p>
               </section>
               <button class="btn btn-primary btn-big" data-action="next">Próximo</button>`
            : `<p class="hint">Toque no monte para tirar uma carta</p>`
        }
      </main>`;

    bindTopbar(root, ctx.onExit);
    root.querySelector('[data-action="reveal"]')?.addEventListener(
      'click',
      () => {
        state = revealCard(state);
        render();
      },
      { once: true },
    );
    root.querySelector('[data-action="next"]')?.addEventListener(
      'click',
      () => {
        state = nextTurn(state);
        render();
      },
      { once: true },
    );
  }

  render();
}
