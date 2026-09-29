import type { DeckCount } from '../core/cards';
import { validatePlayers } from '../core/players';
import type { GameConfig, GameDef } from '../games/registry';
import { escapeHtml } from './html';

export interface SetupHandlers {
  onStart(config: GameConfig): void;
  onBack(): void;
}

export function mountSetup(
  root: HTMLElement,
  game: GameDef,
  initial: GameConfig,
  handlers: SetupHandlers,
): void {
  const players = [...initial.players];
  let deckCount: DeckCount = initial.deckCount;
  let error: string | null = null;

  function render(focusInput = false, draft = ''): void {
    const limits = game.limits(deckCount);
    const limitText = Number.isFinite(limits.max)
      ? `${limits.min} a ${limits.max} jogadores`
      : `mínimo de ${limits.min} jogadores`;

    root.innerHTML = `
      <main class="screen setup">
        <header class="topbar">
          <button class="btn-ghost" data-action="back">← Voltar</button>
          <div class="topbar-text"><h2>${escapeHtml(game.name)}</h2></div>
        </header>
        <form class="add-player">
          <input name="name" placeholder="Nome do jogador" maxlength="20" autocomplete="off" />
          <button class="btn" type="submit">Adicionar</button>
        </form>
        <ol class="player-list">
          ${players
            .map(
              (p, i) => `
            <li class="player-row">
              <span>${escapeHtml(p)}</span>
              <button class="btn-icon" data-action="up" data-index="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Subir">↑</button>
              <button class="btn-icon" data-action="down" data-index="${i}" ${i === players.length - 1 ? 'disabled' : ''} aria-label="Descer">↓</button>
              <button class="btn-icon" data-action="remove" data-index="${i}" aria-label="Remover">✕</button>
            </li>`,
            )
            .join('')}
        </ol>
        <p class="hint">A ordem da lista é o sentido horário · ${limitText}</p>
        <div class="deck-toggle">
          <span>Baralhos:</span>
          <button class="chip ${deckCount === 1 ? 'active' : ''}" data-action="decks" data-count="1">1 (52 cartas)</button>
          <button class="chip ${deckCount === 2 ? 'active' : ''}" data-action="decks" data-count="2">2 (104 cartas)</button>
        </div>
        ${error ? `<p class="error">${escapeHtml(error)}</p>` : ''}
        <button class="btn btn-primary btn-big" data-action="start">Começar</button>
      </main>`;

    const input = root.querySelector<HTMLInputElement>('input[name="name"]')!;
    input.value = draft;
    if (focusInput) input.focus();
    root.querySelector('form')!.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = input.value.trim();
      if (!name) return;
      players.push(name);
      error = null;
      render(true);
    });
    root.querySelectorAll<HTMLButtonElement>('button[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => handle(btn));
    });
  }

  function handle(btn: HTMLButtonElement): void {
    const i = Number(btn.dataset.index);
    const action = btn.dataset.action;
    const draft = root.querySelector<HTMLInputElement>('input[name="name"]')!.value.trim();
    if (action !== 'start') error = null;
    switch (action) {
      case 'back':
        handlers.onBack();
        return;
      case 'up':
        [players[i - 1], players[i]] = [players[i], players[i - 1]];
        break;
      case 'down':
        [players[i], players[i + 1]] = [players[i + 1], players[i]];
        break;
      case 'remove':
        players.splice(i, 1);
        break;
      case 'decks':
        deckCount = Number(btn.dataset.count) as DeckCount;
        break;
      case 'start':
        if (draft) players.push(draft);
        error = validatePlayers(players, game.limits(deckCount), deckCount);
        if (!error) {
          handlers.onStart({ players: players.map((p) => p.trim()), deckCount });
          return;
        }
        break;
    }
    render(false, action === 'start' ? '' : draft);
  }

  render();
}
