import { describe, expect, it } from 'vitest';
import { RANKS } from '../src/core/cards';
import { SUECA_RULES } from '../src/games/sueca/rules';
import {
  createSueca, createSuecaFromPile, currentPlayer, isSuecaOver, nextTurn, revealCard,
} from '../src/games/sueca/sueca';
import { c } from './helpers';

describe('SUECA_RULES', () => {
  it('tem título e texto para todos os 13 valores', () => {
    for (const rank of RANKS) {
      expect(SUECA_RULES[rank].title.length).toBeGreaterThan(0);
      expect(SUECA_RULES[rank].text.length).toBeGreaterThan(0);
    }
  });

  it('7 é Continência', () => {
    expect(SUECA_RULES[7].title).toBe('Continência');
  });
});

describe('Suéca', () => {
  it('cria com monte embaralhado de 52 ou 104 cartas', () => {
    expect(createSueca(['Ana', 'Beto'], 1).pile).toHaveLength(52);
    expect(createSueca(['Ana', 'Beto'], 2).pile).toHaveLength(104);
  });

  it('revela a carta do topo para o jogador da vez', () => {
    const top = c(7, 'hearts');
    const state = revealCard(createSuecaFromPile(['Ana', 'Beto'], [top, c(2)]));
    expect(state.revealed).toBe(top);
    expect(state.pile).toHaveLength(1);
    expect(currentPlayer(state)).toBe('Ana');
  });

  it('não revela duas vezes na mesma vez', () => {
    const state = revealCard(createSuecaFromPile(['Ana', 'Beto'], [c(1), c(2)]));
    expect(() => revealCard(state)).toThrow();
  });

  it('não passa a vez sem revelar', () => {
    expect(() => nextTurn(createSuecaFromPile(['Ana', 'Beto'], [c(1)]))).toThrow();
  });

  it('passa a vez no sentido horário com wrap', () => {
    let state = createSuecaFromPile(['Ana', 'Beto'], [c(1), c(2), c(3)]);
    state = nextTurn(revealCard(state));
    expect(currentPlayer(state)).toBe('Beto');
    state = nextTurn(revealCard(state));
    expect(currentPlayer(state)).toBe('Ana');
  });

  it('termina quando o monte acaba e a última carta foi passada', () => {
    let state = createSuecaFromPile(['Ana', 'Beto'], [c(1), c(2)]);
    state = nextTurn(revealCard(state));
    state = revealCard(state);
    expect(isSuecaOver(state)).toBe(false);
    state = nextTurn(state);
    expect(isSuecaOver(state)).toBe(true);
  });
});
