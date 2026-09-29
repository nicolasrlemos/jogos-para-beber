import { describe, expect, it } from 'vitest';
import { nextIndex, validatePlayers } from '../src/core/players';

describe('nextIndex', () => {
  it('avança no sentido horário e volta ao primeiro', () => {
    expect(nextIndex(0, 3)).toBe(1);
    expect(nextIndex(1, 3)).toBe(2);
    expect(nextIndex(2, 3)).toBe(0);
  });
});

describe('validatePlayers', () => {
  const limits = { min: 2, max: 10 };

  it('aceita lista válida', () => {
    expect(validatePlayers(['Ana', 'Beto'], limits, 1)).toBeNull();
  });

  it('rejeita nome vazio', () => {
    expect(validatePlayers(['Ana', '  '], limits, 1)).toBe('Nomes não podem ficar vazios.');
  });

  it('rejeita nomes repetidos ignorando maiúsculas e espaços', () => {
    expect(validatePlayers(['Ana', ' ana '], limits, 1)).toBe('Há nomes repetidos.');
  });

  it('rejeita abaixo do mínimo', () => {
    expect(validatePlayers(['Ana'], limits, 1)).toBe('Mínimo de 2 jogadores.');
  });

  it('acima do máximo com 1 baralho sugere 2 baralhos', () => {
    const names = Array.from({ length: 11 }, (_, i) => `J${i}`);
    expect(validatePlayers(names, limits, 1)).toBe(
      'Máximo de 10 jogadores com 1 baralho — use 2 baralhos.',
    );
  });

  it('acima do máximo com 2 baralhos', () => {
    const names = Array.from({ length: 24 }, (_, i) => `J${i}`);
    expect(validatePlayers(names, { min: 2, max: 23 }, 2)).toBe(
      'Máximo de 23 jogadores com 2 baralhos.',
    );
  });

  it('sem máximo quando max é Infinity', () => {
    const names = Array.from({ length: 40 }, (_, i) => `J${i}`);
    expect(validatePlayers(names, { min: 2, max: Infinity }, 1)).toBeNull();
  });
});
