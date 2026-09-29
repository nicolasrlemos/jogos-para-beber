import { describe, expect, it } from 'vitest';
import {
  evaluateGuess, formatSips, GUESS_OPTIONS, isGuessValidForRound, sipsForRound,
} from '../src/games/preto-vermelho/logic';
import { c } from './helpers';

describe('rodada 1 — cor', () => {
  it('acerta vermelho com copas/ouros e preto com espadas/paus', () => {
    expect(evaluateGuess(1, 'red', [], c(5, 'hearts'))).toBe(true);
    expect(evaluateGuess(1, 'red', [], c(5, 'diamonds'))).toBe(true);
    expect(evaluateGuess(1, 'black', [], c(5, 'spades'))).toBe(true);
    expect(evaluateGuess(1, 'black', [], c(5, 'clubs'))).toBe(true);
  });

  it('erra a cor', () => {
    expect(evaluateGuess(1, 'red', [], c(5, 'clubs'))).toBe(false);
    expect(evaluateGuess(1, 'black', [], c(5, 'hearts'))).toBe(false);
  });
});

describe('rodada 2 — maior ou menor', () => {
  const hand = [c(7)];
  it('maior', () => {
    expect(evaluateGuess(2, 'higher', hand, c(8))).toBe(true);
    expect(evaluateGuess(2, 'higher', hand, c(6))).toBe(false);
  });
  it('menor', () => {
    expect(evaluateGuess(2, 'lower', hand, c(1))).toBe(true);
    expect(evaluateGuess(2, 'lower', hand, c(13))).toBe(false);
  });
  it('empate é erro nos dois palpites', () => {
    expect(evaluateGuess(2, 'higher', hand, c(7, 'hearts'))).toBe(false);
    expect(evaluateGuess(2, 'lower', hand, c(7, 'hearts'))).toBe(false);
  });
});

describe('rodada 3 — dentro ou fora', () => {
  const hand = [c(7), c(2)]; // ordem não importa
  it('dentro: estritamente entre', () => {
    expect(evaluateGuess(3, 'inside', hand, c(5))).toBe(true);
    expect(evaluateGuess(3, 'inside', hand, c(10))).toBe(false);
  });
  it('fora: abaixo ou acima', () => {
    expect(evaluateGuess(3, 'outside', hand, c(1))).toBe(true);
    expect(evaluateGuess(3, 'outside', hand, c(10))).toBe(true);
    expect(evaluateGuess(3, 'outside', hand, c(5))).toBe(false);
  });
  it('valor igual a uma das cartas é erro nos dois palpites', () => {
    expect(evaluateGuess(3, 'inside', hand, c(2, 'hearts'))).toBe(false);
    expect(evaluateGuess(3, 'outside', hand, c(2, 'hearts'))).toBe(false);
    expect(evaluateGuess(3, 'inside', hand, c(7, 'hearts'))).toBe(false);
    expect(evaluateGuess(3, 'outside', hand, c(7, 'hearts'))).toBe(false);
  });
  it('com as duas cartas iguais, dentro nunca acerta', () => {
    const pair = [c(7), c(7, 'hearts')];
    expect(evaluateGuess(3, 'inside', pair, c(8))).toBe(false);
    expect(evaluateGuess(3, 'outside', pair, c(8))).toBe(true);
    expect(evaluateGuess(3, 'outside', pair, c(7, 'clubs'))).toBe(false);
  });
});

describe('rodada 4 — naipe', () => {
  it('acerta só o naipe exato', () => {
    const hand = [c(1), c(2), c(3)];
    expect(evaluateGuess(4, 'hearts', hand, c(9, 'hearts'))).toBe(true);
    expect(evaluateGuess(4, 'diamonds', hand, c(9, 'hearts'))).toBe(false);
  });
});

describe('validação e goles', () => {
  it('rejeita palpite de outra rodada', () => {
    expect(isGuessValidForRound(1, 'higher')).toBe(false);
    expect(() => evaluateGuess(1, 'higher', [], c(5))).toThrow();
  });
  it('rejeita mão incompleta', () => {
    expect(() => evaluateGuess(3, 'inside', [c(2)], c(5))).toThrow();
  });
  it('cada rodada tem opções', () => {
    expect(GUESS_OPTIONS[1]).toHaveLength(2);
    expect(GUESS_OPTIONS[4]).toHaveLength(4);
  });
  it('goles = número da rodada', () => {
    expect(sipsForRound(1)).toBe(1);
    expect(sipsForRound(4)).toBe(4);
  });
  it('formatSips', () => {
    expect(formatSips(1)).toBe('1 gole');
    expect(formatSips(3)).toBe('3 goles');
  });
});
