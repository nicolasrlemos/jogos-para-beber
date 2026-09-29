import { createDeck, shuffle, type Card, type DeckCount, type Rng } from '../../core/cards';
import { drawCard, drawMany } from '../../core/deck';
import type { PlayerLimits } from '../../core/players';
import { buildPyramid, PYRAMID_SIZE, type Hand, type PyramidSlot } from './ceu-inferno';
import { evaluateGuess, type Guess, type GuessRound } from './logic';

export type PvPhase = 'guess' | 'result' | 'pyramid' | 'over';
export type PvRound = GuessRound | 5;

export interface PvState {
  readonly players: readonly string[];
  readonly hands: readonly (readonly Card[])[];
  readonly pile: readonly Card[];
  readonly round: PvRound;
  readonly current: number;
  readonly phase: PvPhase;
  readonly lastCard: Card | null;
  readonly lastCorrect: boolean | null;
  readonly pyramid: readonly PyramidSlot[];
  readonly revealedCount: number;
}

const CARDS_PER_PLAYER = 4;
const MIN_PLAYERS = 2;

export function maxPlayersPv(deckCount: DeckCount): number {
  return Math.floor((52 * deckCount - PYRAMID_SIZE) / CARDS_PER_PLAYER);
}

export function pvLimits(deckCount: DeckCount): PlayerLimits {
  return { min: MIN_PLAYERS, max: maxPlayersPv(deckCount) };
}

export function createPvStateFromPile(players: readonly string[], pile: readonly Card[]): PvState {
  return {
    players: [...players],
    hands: players.map(() => []),
    pile: [...pile],
    round: 1,
    current: 0,
    phase: 'guess',
    lastCard: null,
    lastCorrect: null,
    pyramid: [],
    revealedCount: 0,
  };
}

export function createPretoVermelho(
  players: readonly string[],
  deckCount: DeckCount,
  rng: Rng = Math.random,
): PvState {
  const { min, max } = pvLimits(deckCount);
  if (players.length < min || players.length > max) {
    throw new Error(`Preto ou Vermelho aceita de ${min} a ${max} jogadores`);
  }
  return createPvStateFromPile(players, shuffle(createDeck(deckCount), rng));
}

export function submitGuess(state: PvState, guess: Guess): PvState {
  if (state.phase !== 'guess' || state.round === 5) throw new Error('Não é hora de palpite');
  const hand = state.hands[state.current];
  const { card, pile } = drawCard(state.pile);
  const correct = evaluateGuess(state.round, guess, hand, card);
  const hands = state.hands.map((h, i) => (i === state.current ? [...h, card] : h));
  return { ...state, pile, hands, phase: 'result', lastCard: card, lastCorrect: correct };
}

export function advance(state: PvState): PvState {
  if (state.phase !== 'result' || state.round === 5) throw new Error('Nada para avançar');
  const cleared = { ...state, phase: 'guess' as const, lastCard: null, lastCorrect: null };
  if (state.current < state.players.length - 1) {
    return { ...cleared, current: state.current + 1 };
  }
  if (state.round < 4) {
    return { ...cleared, current: 0, round: (state.round + 1) as GuessRound };
  }
  const { cards, pile } = drawMany(state.pile, PYRAMID_SIZE);
  return {
    ...cleared,
    phase: 'pyramid',
    round: 5,
    current: 0,
    pile,
    pyramid: buildPyramid(cards),
    revealedCount: 0,
  };
}

export function isPyramidComplete(state: PvState): boolean {
  return state.revealedCount === PYRAMID_SIZE;
}

export function revealNextSlot(state: PvState): PvState {
  if (state.phase !== 'pyramid' || isPyramidComplete(state)) {
    throw new Error('Nenhuma carta para virar');
  }
  return { ...state, revealedCount: state.revealedCount + 1 };
}

export function currentSlot(state: PvState): PyramidSlot | null {
  return state.revealedCount === 0 ? null : state.pyramid[state.revealedCount - 1];
}

export function finishGame(state: PvState): PvState {
  if (state.phase !== 'pyramid' || !isPyramidComplete(state)) {
    throw new Error('A pirâmide ainda não terminou');
  }
  return { ...state, phase: 'over' };
}

export function handsForMatching(state: PvState): Hand[] {
  return state.players.map((player, i) => ({ player, cards: state.hands[i] }));
}
