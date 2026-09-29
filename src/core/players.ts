import type { DeckCount } from './cards';

export interface PlayerLimits {
  readonly min: number;
  readonly max: number;
}

export function nextIndex(current: number, count: number): number {
  return (current + 1) % count;
}

/** Devolve a mensagem de erro, ou null se a lista for válida. */
export function validatePlayers(
  names: readonly string[],
  limits: PlayerLimits,
  deckCount: DeckCount,
): string | null {
  const trimmed = names.map((n) => n.trim());
  if (trimmed.some((n) => n === '')) return 'Nomes não podem ficar vazios.';
  const normalized = trimmed.map((n) => n.toLocaleLowerCase('pt-BR'));
  if (new Set(normalized).size !== normalized.length) return 'Há nomes repetidos.';
  if (trimmed.length < limits.min) return `Mínimo de ${limits.min} jogadores.`;
  if (trimmed.length > limits.max) {
    return deckCount === 1
      ? `Máximo de ${limits.max} jogadores com 1 baralho — use 2 baralhos.`
      : `Máximo de ${limits.max} jogadores com ${deckCount} baralhos.`;
  }
  return null;
}
