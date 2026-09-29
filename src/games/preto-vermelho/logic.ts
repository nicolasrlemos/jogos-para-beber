import { isRed, type Card, type Suit } from '../../core/cards';

export type Guess = 'black' | 'red' | 'higher' | 'lower' | 'inside' | 'outside' | Suit;
export type GuessRound = 1 | 2 | 3 | 4;

export const ROUND_NAMES: Record<GuessRound, string> = {
  1: 'Preto ou Vermelho',
  2: 'Maior ou Menor',
  3: 'Dentro ou Fora',
  4: 'Naipe',
};

export const GUESS_OPTIONS: Record<GuessRound, readonly { guess: Guess; label: string }[]> = {
  1: [
    { guess: 'black', label: 'Preto' },
    { guess: 'red', label: 'Vermelho' },
  ],
  2: [
    { guess: 'higher', label: 'Maior' },
    { guess: 'lower', label: 'Menor' },
  ],
  3: [
    { guess: 'inside', label: 'Dentro' },
    { guess: 'outside', label: 'Fora' },
  ],
  4: [
    { guess: 'spades', label: '♠ Espadas' },
    { guess: 'hearts', label: '♥ Copas' },
    { guess: 'diamonds', label: '♦ Ouros' },
    { guess: 'clubs', label: '♣ Paus' },
  ],
};

export function isGuessValidForRound(round: GuessRound, guess: Guess): boolean {
  return GUESS_OPTIONS[round].some((o) => o.guess === guess);
}

export function evaluateGuess(
  round: GuessRound,
  guess: Guess,
  hand: readonly Card[],
  card: Card,
): boolean {
  if (!isGuessValidForRound(round, guess)) {
    throw new Error(`Palpite inválido para a rodada ${round}`);
  }
  if (hand.length < round - 1) throw new Error('Mão incompleta para a rodada');

  switch (round) {
    case 1:
      return (guess === 'red') === isRed(card);
    case 2: {
      const first = hand[0].rank;
      return guess === 'higher' ? card.rank > first : card.rank < first;
    }
    case 3: {
      const a = Math.min(hand[0].rank, hand[1].rank);
      const b = Math.max(hand[0].rank, hand[1].rank);
      const v = card.rank;
      if (v === a || v === b) return false;
      const inside = v > a && v < b;
      return guess === 'inside' ? inside : !inside;
    }
    case 4:
      return card.suit === guess;
  }
}

export function sipsForRound(round: GuessRound): number {
  return round;
}

export function formatSips(n: number): string {
  return `${n} ${n === 1 ? 'gole' : 'goles'}`;
}
