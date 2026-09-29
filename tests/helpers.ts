import type { Card, Rank, Suit } from '../src/core/cards';

let seq = 0;

/** Cria uma carta de teste com id único. */
export function c(rank: Rank, suit: Suit = 'spades'): Card {
  seq += 1;
  return { id: `t${seq}-${suit}-${rank}`, suit, rank };
}
