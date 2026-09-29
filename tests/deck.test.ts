import { describe, expect, it } from 'vitest';
import { drawCard, drawMany } from '../src/core/deck';
import { c } from './helpers';

describe('drawCard', () => {
  it('tira a carta do topo e devolve o monte restante', () => {
    const a = c(1), b = c(2);
    const pile = [a, b];
    const result = drawCard(pile);
    expect(result.card).toBe(a);
    expect(result.pile).toEqual([b]);
    expect(pile).toHaveLength(2);
  });

  it('lança erro com monte vazio', () => {
    expect(() => drawCard([])).toThrow('Monte vazio');
  });
});

describe('drawMany', () => {
  it('tira n cartas do topo', () => {
    const pile = [c(1), c(2), c(3)];
    const result = drawMany(pile, 2);
    expect(result.cards).toEqual([pile[0], pile[1]]);
    expect(result.pile).toEqual([pile[2]]);
  });

  it('lança erro se não houver cartas suficientes', () => {
    expect(() => drawMany([c(1)], 2)).toThrow('Monte vazio');
  });
});
