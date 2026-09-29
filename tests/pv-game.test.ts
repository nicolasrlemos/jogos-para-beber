import { describe, expect, it } from 'vitest';
import { matchesForSlot } from '../src/games/preto-vermelho/ceu-inferno';
import {
  advance, createPretoVermelho, createPvStateFromPile, currentSlot, finishGame,
  handsForMatching, isPyramidComplete, maxPlayersPv, revealNextSlot, submitGuess, type PvState,
} from '../src/games/preto-vermelho/game';
import type { Guess } from '../src/games/preto-vermelho/logic';
import { c } from './helpers';

// Monte na ordem de compra: rodada a rodada, Ana e depois Beto; depois 9 da pirâmide; 1 sobra.
function scriptedPile() {
  return [
    c(5, 'hearts'), c(9, 'spades'),     // r1
    c(8, 'clubs'), c(9, 'diamonds'),    // r2
    c(6, 'spades'), c(13, 'hearts'),    // r3
    c(2, 'hearts'), c(3, 'clubs'),      // r4
    c(5, 'spades'), c(1, 'spades'), c(7, 'hearts'), c(9, 'clubs'), c(10, 'hearts'),
    c(11, 'clubs'), c(12, 'hearts'), c(4, 'diamonds'), c(13, 'spades'), // pirâmide
    c(1, 'hearts'),                     // sobra
  ];
}

// Ana: vermelho ✓, maior ✓ (8>5), dentro ✓ (5<6<8), copas ✓
// Beto: vermelho ✗ (♠), maior ✗ (empate 9), fora ✓ (13 fora de 9..9), espadas ✗ (♣)
const GUESSES: Guess[] = ['red', 'red', 'higher', 'higher', 'inside', 'outside', 'hearts', 'spades'];

function playGuessRounds(state: PvState): { state: PvState; results: boolean[] } {
  const results: boolean[] = [];
  for (const g of GUESSES) {
    state = submitGuess(state, g);
    results.push(state.lastCorrect as boolean);
    state = advance(state);
  }
  return { state, results };
}

describe('limites', () => {
  it('máximo de jogadores por baralhos', () => {
    expect(maxPlayersPv(1)).toBe(10);
    expect(maxPlayersPv(2)).toBe(23);
  });

  it('createPretoVermelho valida o número de jogadores', () => {
    expect(() => createPretoVermelho(['Ana'], 1)).toThrow();
    const eleven = Array.from({ length: 11 }, (_, i) => `J${i}`);
    expect(() => createPretoVermelho(eleven, 1)).toThrow();
    expect(createPretoVermelho(eleven, 2).pile).toHaveLength(104);
  });
});

describe('rodadas 1–4', () => {
  it('estado inicial', () => {
    const s = createPvStateFromPile(['Ana', 'Beto'], scriptedPile());
    expect(s).toMatchObject({ round: 1, current: 0, phase: 'guess', lastCard: null, revealedCount: 0 });
    expect(s.hands).toEqual([[], []]);
  });

  it('palpite compra carta, avalia e vai para resultado', () => {
    const pile = scriptedPile();
    const s = submitGuess(createPvStateFromPile(['Ana', 'Beto'], pile), 'red');
    expect(s.phase).toBe('result');
    expect(s.lastCorrect).toBe(true);
    expect(s.lastCard).toBe(pile[0]);
    expect(s.hands[0]).toEqual([pile[0]]);
    expect(s.pile).toHaveLength(pile.length - 1);
  });

  it('não aceita palpite fora da fase ou inválido para a rodada', () => {
    const s = createPvStateFromPile(['Ana', 'Beto'], scriptedPile());
    expect(() => submitGuess(s, 'higher')).toThrow();
    expect(() => submitGuess(submitGuess(s, 'red'), 'red')).toThrow();
    expect(() => advance(s)).toThrow();
  });

  it('advance passa ao próximo jogador e depois à próxima rodada', () => {
    let s = createPvStateFromPile(['Ana', 'Beto'], scriptedPile());
    s = advance(submitGuess(s, 'red'));
    expect(s).toMatchObject({ round: 1, current: 1, phase: 'guess', lastCard: null, lastCorrect: null });
    s = advance(submitGuess(s, 'red'));
    expect(s).toMatchObject({ round: 2, current: 0, phase: 'guess' });
  });

  it('partida roteirizada dá os acertos esperados e entra no Céu e Inferno', () => {
    const { state, results } = playGuessRounds(createPvStateFromPile(['Ana', 'Beto'], scriptedPile()));
    expect(results).toEqual([true, false, true, false, true, true, true, false]);
    expect(state).toMatchObject({ round: 5, phase: 'pyramid', revealedCount: 0 });
    expect(state.hands[0]).toHaveLength(4);
    expect(state.hands[1]).toHaveLength(4);
    expect(state.pyramid).toHaveLength(9);
    expect(state.pyramid[0].card.rank).toBe(5);
    expect(state.pile).toHaveLength(1);
  });
});

describe('Céu e Inferno', () => {
  function atPyramid() {
    return playGuessRounds(createPvStateFromPile(['Ana', 'Beto'], scriptedPile())).state;
  }

  it('vira as cartas em ordem e só finaliza no fim', () => {
    let s = atPyramid();
    expect(currentSlot(s)).toBeNull();
    expect(() => finishGame(s)).toThrow();
    for (let i = 0; i < 9; i++) s = revealNextSlot(s);
    expect(isPyramidComplete(s)).toBe(true);
    expect(currentSlot(s)?.kind).toBe('terra');
    expect(() => revealNextSlot(s)).toThrow();
    expect(finishGame(s).phase).toBe('over');
  });

  it('correspondências usam as mãos dos jogadores', () => {
    let s = atPyramid();
    s = revealNextSlot(s); // Céu 1 = 5♠ → Ana tem 5♥
    expect(matchesForSlot(currentSlot(s)!, handsForMatching(s))).toEqual([
      { player: 'Ana', count: 1, drink: 0, distribute: 1 },
    ]);
    s = revealNextSlot(revealNextSlot(revealNextSlot(s))); // Inferno 2 = 9♣ → Beto tem dois 9
    expect(matchesForSlot(currentSlot(s)!, handsForMatching(s))).toEqual([
      { player: 'Beto', count: 2, drink: 4, distribute: 0 },
    ]);
    for (let i = 0; i < 5; i++) s = revealNextSlot(s); // Terra = K♠ → Beto tem K♥
    expect(matchesForSlot(currentSlot(s)!, handsForMatching(s))).toEqual([
      { player: 'Beto', count: 1, drink: 5, distribute: 5 },
    ]);
  });
});
