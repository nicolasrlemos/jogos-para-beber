import type { GameContext } from '../games/registry';
import { escapeHtml } from './html';

export function mountEnd(root: HTMLElement, title: string, message: string, ctx: GameContext): void {
  root.innerHTML = `
    <main class="screen end">
      <h2>${escapeHtml(title)}</h2>
      <p class="subtitle">${escapeHtml(message)}</p>
      <button class="btn btn-primary btn-big" data-action="replay">Jogar de novo</button>
      <button class="btn btn-big" data-action="menu">Menu</button>
    </main>`;
  root.querySelector('[data-action="replay"]')!.addEventListener('click', ctx.onReplay);
  root.querySelector('[data-action="menu"]')!.addEventListener('click', ctx.onExit);
}
