import './styles.css';
import { GAMES, type GameConfig, type GameDef } from './games/registry';
import { escapeHtml } from './ui/html';
import { mountSetup } from './ui/setup';

const root = document.querySelector<HTMLElement>('#app')!;
let lastConfig: GameConfig = { players: [], deckCount: 1 };

function showMenu(): void {
  root.innerHTML = `
    <main class="screen menu">
      <h1 class="logo">🍻 Jogos para Beber</h1>
      <p class="subtitle">Escolha um jogo</p>
      <div class="game-list">
        ${GAMES.map(
          (g) => `
          <button class="game-tile" data-id="${g.id}">
            <strong>${escapeHtml(g.name)}</strong>
            <span>${escapeHtml(g.description)}</span>
          </button>`,
        ).join('')}
      </div>
      <p class="disclaimer">Beba com responsabilidade. Proibido para menores de 18 anos.</p>
    </main>`;
  root.querySelectorAll<HTMLButtonElement>('.game-tile').forEach((btn) => {
    btn.addEventListener('click', () => {
      const game = GAMES.find((g) => g.id === btn.dataset.id);
      if (game) showSetup(game);
    });
  });
}

function showSetup(game: GameDef): void {
  mountSetup(root, game, lastConfig, {
    onStart: (config) => {
      lastConfig = config;
      startGame(game, config);
    },
    onBack: showMenu,
  });
}

function startGame(game: GameDef, config: GameConfig): void {
  game.mount(root, config, {
    onExit: showMenu,
    onReplay: () => startGame(game, config),
  });
}

showMenu();
