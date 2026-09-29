import { describe, expect, it } from 'vitest';
import { cardLabel, createDeck, isRed, rankLabel, shuffle } from '../src/core/cards';
import { c } from './helpers';

describe('createDeck', () => {
  it('cria 52 cartas únicas com 1 baralho', () => {
    const deck = createDeck(1);
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map((x) => x.id)).size).toBe(52);
    for (const suit of ['spades', 'hearts', 'diamonds', 'clubs'] as const) {
      expect(deck.filter((x) => x.suit === suit)).toHaveLength(13);
    }
  });

  it('cria 104 cartas únicas com 2 baralhos', () => {
    const deck = createDeck(2);
    expect(deck).toHaveLength(104);
    expect(new Set(deck.map((x) => x.id)).size).toBe(104);
  });
});

describe('shuffle', () => {
  it('preserva as cartas e não altera a entrada', () => {
    const deck = createDeck(1);
    const copy = [...deck];
    const shuffled = shuffle(deck);
    expect(deck).toEqual(copy);
    expect(shuffled.map((x) => x.id).sort()).toEqual(deck.map((x) => x.id).sort());
  });

  it('é determinístico com rng injetado (Fisher-Yates)', () => {
    expect(shuffle([1, 2, 3, 4], () => 0)).toEqual([2, 3, 4, 1]);
  });
});

describe('helpers de carta', () => {
  it('isRed: copas e ouros são vermelhos', () => {
    expect(isRed(c(5, 'hearts'))).toBe(true);
    expect(isRed(c(5, 'diamonds'))).toBe(true);
    expect(isRed(c(5, 'spades'))).toBe(false);
    expect(isRed(c(5, 'clubs'))).toBe(false);
  });

  it('rankLabel e cardLabel', () => {
    expect(rankLabel(1)).toBe('A');
    expect(rankLabel(10)).toBe('10');
    expect(rankLabel(11)).toBe('J');
    expect(rankLabel(12)).toBe('Q');
    expect(rankLabel(13)).toBe('K');
    expect(cardLabel(c(12, 'hearts'))).toBe('Q♥');
  });
});
