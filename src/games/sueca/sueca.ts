import { createDeck, shuffle, type Card, type DeckCount, type Rng } from '../../core/cards';
import { drawCard } from '../../core/deck';
import { nextIndex, type PlayerLimits } from '../../core/players';

export const SUECA_LIMITS: PlayerLimits = { min: 2, max: Infinity };

export interface SuecaState {
  readonly players: readonly string[];
  readonly pile: readonly Card[];
  readonly current: number;
  readonly revealed: Card | null;
}

export function createSuecaFromPile(players: readonly string[], pile: readonly Card[]): SuecaState {
  return { players: [...players], pile: [...pile], current: 0, revealed: null };
}

export function createSueca(
  players: readonly string[],
  deckCount: DeckCount,
  rng: Rng = Math.random,
): SuecaState {
  return createSuecaFromPile(players, shuffle(createDeck(deckCount), rng));
}

export function revealCard(state: SuecaState): SuecaState {
  if (state.revealed) throw new Error('Carta já revelada');
  const { card, pile } = drawCard(state.pile);
  return { ...state, pile, revealed: card };
}

export function nextTurn(state: SuecaState): SuecaState {
  if (!state.revealed) throw new Error('Revele a carta primeiro');
  return { ...state, revealed: null, current: nextIndex(state.current, state.players.length) };
}

export function isSuecaOver(state: SuecaState): boolean {
  return state.pile.length === 0 && state.revealed === null;
}

export function currentPlayer(state: SuecaState): string {
  return state.players[state.current];
}
