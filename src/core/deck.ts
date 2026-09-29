import type { Card } from './cards';

export function drawCard(pile: readonly Card[]): { card: Card; pile: Card[] } {
  if (pile.length === 0) throw new Error('Monte vazio');
  return { card: pile[0], pile: pile.slice(1) };
}

export function drawMany(pile: readonly Card[], n: number): { cards: Card[]; pile: Card[] } {
  if (n > pile.length) throw new Error('Monte vazio');
  return { cards: pile.slice(0, n), pile: pile.slice(n) };
}
