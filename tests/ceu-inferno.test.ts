import { describe, expect, it } from 'vitest';
import {
  buildPyramid, matchesForSlot, REVEAL_ORDER, slotName, type PyramidSlot,
} from '../src/games/preto-vermelho/ceu-inferno';
import { c } from './helpers';

describe('buildPyramid', () => {
  it('monta 9 posições na ordem de virada', () => {
    const cards = Array.from({ length: 9 }, (_, i) => c((i + 1) as 1));
    const pyramid = buildPyramid(cards);
    expect(pyramid.map((s) => slotName(s))).toEqual([
      'Céu 1', 'Inferno 1', 'Céu 2', 'Inferno 2', 'Céu 3', 'Inferno 3', 'Céu 4', 'Inferno 4', 'Terra',
    ]);
    expect(pyramid.map((s) => s.card)).toEqual(cards);
    expect(pyramid[8].level).toBe(5);
    expect(REVEAL_ORDER).toHaveLength(9);
  });

  it('exige exatamente 9 cartas', () => {
    expect(() => buildPyramid([c(1)])).toThrow();
  });
});

describe('matchesForSlot', () => {
  const hands = [
    { player: 'Ana', cards: [c(7), c(2), c(3), c(4)] },
    { player: 'Beto', cards: [c(7, 'hearts'), c(7, 'clubs'), c(9), c(10)] },
    { player: 'Bia', cards: [c(1), c(5), c(6), c(8)] },
  ];
  const slot = (kind: PyramidSlot['kind'], level: number): PyramidSlot => ({
    kind, level, card: c(7, 'diamonds'),
  });

  it('Céu: quem tem o valor distribui nível × quantidade', () => {
    expect(matchesForSlot(slot('ceu', 3), hands)).toEqual([
      { player: 'Ana', count: 1, drink: 0, distribute: 3 },
      { player: 'Beto', count: 2, drink: 0, distribute: 6 },
    ]);
  });

  it('Inferno: quem tem o valor bebe nível × quantidade', () => {
    expect(matchesForSlot(slot('inferno', 2), hands)).toEqual([
      { player: 'Ana', count: 1, drink: 2, distribute: 0 },
      { player: 'Beto', count: 2, drink: 4, distribute: 0 },
    ]);
  });

  it('Terra: bebe 5 e distribui 5 por carta', () => {
    expect(matchesForSlot(slot('terra', 5), hands)).toEqual([
      { player: 'Ana', count: 1, drink: 5, distribute: 5 },
      { player: 'Beto', count: 2, drink: 10, distribute: 10 },
    ]);
  });

  it('ninguém tem o valor', () => {
    const k: PyramidSlot = { kind: 'ceu', level: 1, card: c(13) };
    expect(matchesForSlot(k, hands)).toEqual([]);
  });
});
