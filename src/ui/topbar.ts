import { escapeHtml } from './html';

export function renderTopbar(title: string, subtitle?: string): string {
  return `
    <header class="topbar">
      <div class="topbar-text">
        <h2>${escapeHtml(title)}</h2>
        ${subtitle ? `<p class="topbar-subtitle">${escapeHtml(subtitle)}</p>` : ''}
      </div>
      <button class="btn-ghost" data-action="exit">Sair</button>
    </header>`;
}

export function bindTopbar(root: HTMLElement, onExit: () => void): void {
  root.querySelector('[data-action="exit"]')?.addEventListener('click', () => {
    if (confirm('Sair da partida?')) onExit();
  });
}
