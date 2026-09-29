# Jogos para Beber — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Site estático (um aparelho só, no centro da roda) com dois jogos de baralho para beber: Suéca Alcoólico e Preto ou Vermelho.

**Architecture:** A lógica fica em módulos TypeScript puros (`src/core`, `src/games/*/` exceto `view.ts`): estado imutável + funções de ação, sem DOM, testados com Vitest. As telas (`view.ts`, `src/ui/*`) renderizam com template strings em `innerHTML` e ligam os cliques às ações. `src/games/registry.ts` lista os jogos; `src/main.ts` navega Menu → Cadastro → Jogo → Fim.

**Tech Stack:** Vite, TypeScript (strict), Vitest, HTML/CSS puro. Node 22.

**Spec:** `docs/superpowers/specs/2026-09-29-jogos-para-beber-design.md`

## Global Constraints

- Sem framework de UI, sem dependências de runtime. Dev deps apenas: `vite`, `typescript`, `vitest`.
- Textos de interface em português (pt-BR). Identificadores de código em inglês.
- Valores: Ás = 1 … Valete = 11, Dama = 12, Rei = 13. Preto = ♠ ♣, Vermelho = ♥ ♦.
- Lógica pura nunca acessa DOM; aleatoriedade sempre injetável (`rng: () => number`, padrão `Math.random`).
- Todo nome de jogador inserido em HTML passa por `escapeHtml`.
- Limites: Suéca mínimo 2, sem máximo. Preto ou Vermelho mínimo 2, máximo `floor((52 × baralhos − 9) / 4)` → 10 (1 baralho), 23 (2 baralhos).
- Estado só em memória. Sem placar, sem distribuição de goles.
- Mensagens de commit terminam com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Estrutura de arquivos

```
index.html
package.json, tsconfig.json, .gitignore
src/main.ts                         # navegação entre telas
src/styles.css                      # tema (feltro verde), cartas, layout mobile
src/core/cards.ts                   # Card/Suit/Rank, createDeck, shuffle, isRed, labels
src/core/deck.ts                    # drawCard, drawMany
src/core/players.ts                 # nextIndex, validatePlayers, PlayerLimits
src/games/registry.ts               # GameDef, GameConfig, GameContext, GAMES
src/games/sueca/rules.ts            # SUECA_RULES
src/games/sueca/sueca.ts            # estado/ações da Suéca
src/games/sueca/view.ts             # tela da Suéca
src/games/preto-vermelho/logic.ts   # palpites das rodadas 1–4, goles
src/games/preto-vermelho/ceu-inferno.ts # pirâmide, ordem, correspondências
src/games/preto-vermelho/game.ts    # máquina de estados
src/games/preto-vermelho/view.ts    # tela
src/ui/html.ts                      # escapeHtml
src/ui/card.ts                      # renderCard
src/ui/topbar.ts                    # renderTopbar, bindTopbar (sair com confirmação)
src/ui/setup.ts                     # tela de cadastro
src/ui/end.ts                       # tela de fim
tests/helpers.ts                    # c(rank, suit) para criar cartas
tests/*.test.ts
```

---

### Task 1: Projeto + cartas

**Files:**
- Create: `package.json`, `tsconfig.json`, `.gitignore`, `src/core/cards.ts`, `tests/helpers.ts`
- Test: `tests/cards.test.ts`

**Interfaces:**
- Produces:
  - `type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'`
  - `type Rank = 1 | … | 13`
  - `interface Card { readonly id: string; readonly suit: Suit; readonly rank: Rank }`
  - `type Rng = () => number`, `type DeckCount = 1 | 2`
  - `SUITS`, `RANKS`, `SUIT_SYMBOLS: Record<Suit, string>`
  - `createDeck(deckCount: DeckCount): Card[]`
  - `shuffle<T>(items: readonly T[], rng?: Rng): T[]`
  - `isRed(card: Card): boolean`, `rankLabel(rank: Rank): string`, `cardLabel(card: Card): string`
  - test helper `c(rank: Rank, suit?: Suit): Card`

- [ ] **Step 1: Criar config do projeto**

`package.json`:
```json
{
  "name": "jogos-para-beber",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  }
}
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client"],
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["src", "tests"]
}
```

`.gitignore`:
```
node_modules
dist
```

Run: `npm install -D vite typescript vitest`
Expected: instala sem erros; `package.json` ganha `devDependencies`.

- [ ] **Step 2: Escrever helper e teste que falha**

`tests/helpers.ts`:
```ts
import type { Card, Rank, Suit } from '../src/core/cards';

let seq = 0;

/** Cria uma carta de teste com id único. */
export function c(rank: Rank, suit: Suit = 'spades'): Card {
  seq += 1;
  return { id: `t${seq}-${suit}-${rank}`, suit, rank };
}
```

`tests/cards.test.ts`:
```ts
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
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run tests/cards.test.ts`
Expected: FAIL — não resolve `../src/core/cards`.

- [ ] **Step 4: Implementar `src/core/cards.ts`**

```ts
export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
export type Rng = () => number;
export type DeckCount = 1 | 2;

export interface Card {
  readonly id: string;
  readonly suit: Suit;
  readonly rank: Rank;
}

export const SUITS: readonly Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
export const RANKS: readonly Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

const RANK_LABELS: Record<Rank, string> = {
  1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7',
  8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K',
};

export function createDeck(deckCount: DeckCount): Card[] {
  const cards: Card[] = [];
  for (let d = 0; d < deckCount; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push({ id: `${d}-${suit}-${rank}`, suit, rank });
      }
    }
  }
  return cards;
}

/** Fisher-Yates; devolve uma cópia embaralhada. */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function isRed(card: Card): boolean {
  return card.suit === 'hearts' || card.suit === 'diamonds';
}

export function rankLabel(rank: Rank): string {
  return RANK_LABELS[rank];
}

export function cardLabel(card: Card): string {
  return `${rankLabel(card.rank)}${SUIT_SYMBOLS[card.suit]}`;
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run tests/cards.test.ts`
Expected: PASS (6 testes).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json .gitignore src/core/cards.ts tests/helpers.ts tests/cards.test.ts
git commit -m "feat: projeto Vite+TS e módulo de cartas"
```

---

### Task 2: Monte e jogadores

**Files:**
- Create: `src/core/deck.ts`, `src/core/players.ts`
- Test: `tests/deck.test.ts`, `tests/players.test.ts`

**Interfaces:**
- Consumes: `Card`, `DeckCount` de `src/core/cards.ts`
- Produces:
  - `drawCard(pile: readonly Card[]): { card: Card; pile: Card[] }` — lança `Error('Monte vazio')` se vazio
  - `drawMany(pile: readonly Card[], n: number): { cards: Card[]; pile: Card[] }` — lança se `n > pile.length`
  - `nextIndex(current: number, count: number): number`
  - `interface PlayerLimits { readonly min: number; readonly max: number }` (`max` pode ser `Infinity`)
  - `validatePlayers(names: readonly string[], limits: PlayerLimits, deckCount: DeckCount): string | null`

- [ ] **Step 1: Escrever testes que falham**

`tests/deck.test.ts`:
```ts
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
```

`tests/players.test.ts`:
```ts
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
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/deck.test.ts tests/players.test.ts`
Expected: FAIL — módulos não existem.

- [ ] **Step 3: Implementar**

`src/core/deck.ts`:
```ts
import type { Card } from './cards';

export function drawCard(pile: readonly Card[]): { card: Card; pile: Card[] } {
  if (pile.length === 0) throw new Error('Monte vazio');
  return { card: pile[0], pile: pile.slice(1) };
}

export function drawMany(pile: readonly Card[], n: number): { cards: Card[]; pile: Card[] } {
  if (n > pile.length) throw new Error('Monte vazio');
  return { cards: pile.slice(0, n), pile: pile.slice(n) };
}
```

`src/core/players.ts`:
```ts
import type { DeckCount } from './cards';

export interface PlayerLimits {
  readonly min: number;
  readonly max: number;
}

export function nextIndex(current: number, count: number): number {
  return (current + 1) % count;
}

/** Devolve a mensagem de erro, ou null se a lista for válida. */
export function validatePlayers(
  names: readonly string[],
  limits: PlayerLimits,
  deckCount: DeckCount,
): string | null {
  const trimmed = names.map((n) => n.trim());
  if (trimmed.some((n) => n === '')) return 'Nomes não podem ficar vazios.';
  const normalized = trimmed.map((n) => n.toLocaleLowerCase('pt-BR'));
  if (new Set(normalized).size !== normalized.length) return 'Há nomes repetidos.';
  if (trimmed.length < limits.min) return `Mínimo de ${limits.min} jogadores.`;
  if (trimmed.length > limits.max) {
    return deckCount === 1
      ? `Máximo de ${limits.max} jogadores com 1 baralho — use 2 baralhos.`
      : `Máximo de ${limits.max} jogadores com ${deckCount} baralhos.`;
  }
  return null;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/deck.test.ts tests/players.test.ts`
Expected: PASS (12 testes).

- [ ] **Step 5: Commit**

```bash
git add src/core/deck.ts src/core/players.ts tests/deck.test.ts tests/players.test.ts
git commit -m "feat: monte de compra e utilitários de jogadores"
```

---

### Task 3: Lógica da Suéca

**Files:**
- Create: `src/games/sueca/rules.ts`, `src/games/sueca/sueca.ts`
- Test: `tests/sueca.test.ts`

**Interfaces:**
- Consumes: `createDeck`, `shuffle`, `Card`, `Rank`, `DeckCount`, `Rng` (cards); `drawCard` (deck); `nextIndex` (players)
- Produces:
  - `interface SuecaRule { readonly title: string; readonly text: string }`
  - `SUECA_RULES: Record<Rank, SuecaRule>`
  - `interface SuecaState { readonly players: readonly string[]; readonly pile: readonly Card[]; readonly current: number; readonly revealed: Card | null }`
  - `createSueca(players: readonly string[], deckCount: DeckCount, rng?: Rng): SuecaState`
  - `createSuecaFromPile(players: readonly string[], pile: readonly Card[]): SuecaState`
  - `revealCard(state: SuecaState): SuecaState` — lança se já revelada
  - `nextTurn(state: SuecaState): SuecaState` — lança se nada revelado
  - `isSuecaOver(state: SuecaState): boolean`
  - `currentPlayer(state: SuecaState): string`
  - `SUECA_LIMITS: PlayerLimits` = `{ min: 2, max: Infinity }`

- [ ] **Step 1: Escrever testes que falham**

`tests/sueca.test.ts`:
```ts
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
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/sueca.test.ts`
Expected: FAIL — módulos não existem.

- [ ] **Step 3: Implementar**

`src/games/sueca/rules.ts`:
```ts
import type { Rank } from '../../core/cards';

export interface SuecaRule {
  readonly title: string;
  readonly text: string;
}

export const SUECA_RULES: Record<Rank, SuecaRule> = {
  1: { title: 'Escolha 1', text: 'Escolha 1 pessoa para beber.' },
  2: { title: 'Escolha 2', text: 'Escolha 2 pessoas para beber.' },
  3: { title: 'Escolha 3', text: 'Escolha 3 pessoas para beber.' },
  4: { title: 'Banheiro', text: 'Guarde esta carta: use-a para ir ao banheiro sem perder a vez.' },
  5: { title: 'Eu Nunca', text: 'Comece uma rodada de "Eu Nunca".' },
  6: {
    title: 'Búfalo Bill',
    text: 'Você é o Búfalo Bill: só pode beber levantando o braço do jeito combinado. Se esquecer, bebe de novo.',
  },
  7: { title: 'Continência', text: 'A qualquer momento, faça continência. O último a imitar bebe 1 gole.' },
  8: { title: 'Regra Nova', text: 'Crie uma regra que vale até o fim da partida.' },
  9: { title: 'Quebra-Regra', text: 'Anule uma regra criada anteriormente.' },
  10: { title: 'Mulheres', text: 'Todas as mulheres bebem.' },
  11: { title: 'Homens', text: 'Todos os homens bebem.' },
  12: { title: 'Dama', text: 'Quem tirou bebe.' },
  13: { title: 'Rei', text: 'Todos bebem juntos.' },
};
```

`src/games/sueca/sueca.ts`:
```ts
import { createDeck, shuffle, type Card, type DeckCount, type Rng } from '../../core/cards';
import { drawCard } from '../../core/deck';
import { nextIndex, type PlayerLimits } from '../../core/players';

export const SUECA_LIMITS: PlayerLimits = { min: 2, max: Infinity };

export interface SuecaState {
  readonly players: readonly string[];
  readonly pile: readonly Card[];
  readonly current: number;
  readonly revealed: Card | null;
}

export function createSuecaFromPile(players: readonly string[], pile: readonly Card[]): SuecaState {
  return { players: [...players], pile: [...pile], current: 0, revealed: null };
}

export function createSueca(
  players: readonly string[],
  deckCount: DeckCount,
  rng: Rng = Math.random,
): SuecaState {
  return createSuecaFromPile(players, shuffle(createDeck(deckCount), rng));
}

export function revealCard(state: SuecaState): SuecaState {
  if (state.revealed) throw new Error('Carta já revelada');
  const { card, pile } = drawCard(state.pile);
  return { ...state, pile, revealed: card };
}

export function nextTurn(state: SuecaState): SuecaState {
  if (!state.revealed) throw new Error('Revele a carta primeiro');
  return { ...state, revealed: null, current: nextIndex(state.current, state.players.length) };
}

export function isSuecaOver(state: SuecaState): boolean {
  return state.pile.length === 0 && state.revealed === null;
}

export function currentPlayer(state: SuecaState): string {
  return state.players[state.current];
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/sueca.test.ts`
Expected: PASS (8 testes).

- [ ] **Step 5: Commit**

```bash
git add src/games/sueca/rules.ts src/games/sueca/sueca.ts tests/sueca.test.ts
git commit -m "feat: regras e estado da Suéca Alcoólico"
```

---

### Task 4: Palpites do Preto ou Vermelho (rodadas 1–4)

**Files:**
- Create: `src/games/preto-vermelho/logic.ts`
- Test: `tests/pv-logic.test.ts`

**Interfaces:**
- Consumes: `Card`, `Suit`, `isRed` (cards)
- Produces:
  - `type Guess = 'black' | 'red' | 'higher' | 'lower' | 'inside' | 'outside' | Suit`
  - `type GuessRound = 1 | 2 | 3 | 4`
  - `GUESS_OPTIONS: Record<GuessRound, readonly { guess: Guess; label: string }[]>`
  - `ROUND_NAMES: Record<GuessRound, string>`
  - `isGuessValidForRound(round: GuessRound, guess: Guess): boolean`
  - `evaluateGuess(round: GuessRound, guess: Guess, hand: readonly Card[], card: Card): boolean` — lança se palpite inválido para a rodada ou mão com menos de `round − 1` cartas
  - `sipsForRound(round: GuessRound): number`
  - `formatSips(n: number): string` → `"1 gole"` / `"3 goles"`

- [ ] **Step 1: Escrever testes que falham**

`tests/pv-logic.test.ts`:
```ts
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
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/pv-logic.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar `src/games/preto-vermelho/logic.ts`**

```ts
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
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/pv-logic.test.ts`
Expected: PASS (15 testes).

- [ ] **Step 5: Commit**

```bash
git add src/games/preto-vermelho/logic.ts tests/pv-logic.test.ts
git commit -m "feat: avaliação de palpites do Preto ou Vermelho"
```

---

### Task 5: Céu e Inferno

**Files:**
- Create: `src/games/preto-vermelho/ceu-inferno.ts`
- Test: `tests/ceu-inferno.test.ts`

**Interfaces:**
- Consumes: `Card` (cards)
- Produces:
  - `type SlotKind = 'ceu' | 'inferno' | 'terra'`
  - `interface PyramidSlot { readonly kind: SlotKind; readonly level: number; readonly card: Card }` (Terra tem `level` 5)
  - `PYRAMID_SIZE = 9`
  - `REVEAL_ORDER: readonly { kind: SlotKind; level: number }[]` — Céu1, Inferno1, Céu2, Inferno2, Céu3, Inferno3, Céu4, Inferno4, Terra
  - `buildPyramid(cards: readonly Card[]): PyramidSlot[]` — lança se `cards.length !== 9`
  - `slotName(slot: { kind: SlotKind; level: number }): string` → `"Céu 2"`, `"Inferno 3"`, `"Terra"`
  - `interface Hand { readonly player: string; readonly cards: readonly Card[] }`
  - `interface SlotMatch { readonly player: string; readonly count: number; readonly drink: number; readonly distribute: number }`
  - `matchesForSlot(slot: PyramidSlot, hands: readonly Hand[]): SlotMatch[]`

- [ ] **Step 1: Escrever testes que falham**

`tests/ceu-inferno.test.ts`:
```ts
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
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/ceu-inferno.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar `src/games/preto-vermelho/ceu-inferno.ts`**

```ts
import type { Card } from '../../core/cards';

export type SlotKind = 'ceu' | 'inferno' | 'terra';

export interface PyramidSlot {
  readonly kind: SlotKind;
  readonly level: number;
  readonly card: Card;
}

export interface Hand {
  readonly player: string;
  readonly cards: readonly Card[];
}

export interface SlotMatch {
  readonly player: string;
  readonly count: number;
  readonly drink: number;
  readonly distribute: number;
}

export const PYRAMID_SIZE = 9;

export const REVEAL_ORDER: readonly { kind: SlotKind; level: number }[] = [
  { kind: 'ceu', level: 1 },
  { kind: 'inferno', level: 1 },
  { kind: 'ceu', level: 2 },
  { kind: 'inferno', level: 2 },
  { kind: 'ceu', level: 3 },
  { kind: 'inferno', level: 3 },
  { kind: 'ceu', level: 4 },
  { kind: 'inferno', level: 4 },
  { kind: 'terra', level: 5 },
];

export function buildPyramid(cards: readonly Card[]): PyramidSlot[] {
  if (cards.length !== PYRAMID_SIZE) {
    throw new Error(`A pirâmide precisa de ${PYRAMID_SIZE} cartas`);
  }
  return REVEAL_ORDER.map((pos, i) => ({ ...pos, card: cards[i] }));
}

export function slotName(slot: { kind: SlotKind; level: number }): string {
  switch (slot.kind) {
    case 'ceu':
      return `Céu ${slot.level}`;
    case 'inferno':
      return `Inferno ${slot.level}`;
    case 'terra':
      return 'Terra';
  }
}

export function matchesForSlot(slot: PyramidSlot, hands: readonly Hand[]): SlotMatch[] {
  const result: SlotMatch[] = [];
  for (const hand of hands) {
    const count = hand.cards.filter((card) => card.rank === slot.card.rank).length;
    if (count === 0) continue;
    const sips = slot.level * count;
    result.push({
      player: hand.player,
      count,
      drink: slot.kind === 'ceu' ? 0 : sips,
      distribute: slot.kind === 'inferno' ? 0 : sips,
    });
  }
  return result;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/ceu-inferno.test.ts`
Expected: PASS (6 testes).

- [ ] **Step 5: Commit**

```bash
git add src/games/preto-vermelho/ceu-inferno.ts tests/ceu-inferno.test.ts
git commit -m "feat: pirâmide Céu e Inferno"
```

---

### Task 6: Máquina de estados do Preto ou Vermelho

**Files:**
- Create: `src/games/preto-vermelho/game.ts`
- Test: `tests/pv-game.test.ts`

**Interfaces:**
- Consumes: `createDeck`, `shuffle`, `Card`, `DeckCount`, `Rng` (cards); `drawCard`, `drawMany` (deck); `PlayerLimits` (players); `evaluateGuess`, `Guess`, `GuessRound` (logic); `buildPyramid`, `PYRAMID_SIZE`, `PyramidSlot`, `Hand` (ceu-inferno)
- Produces:
  - `type PvPhase = 'guess' | 'result' | 'pyramid' | 'over'`
  - `type PvRound = GuessRound | 5`
  - `interface PvState { players; hands: readonly (readonly Card[])[]; pile; round: PvRound; current: number; phase: PvPhase; lastCard: Card | null; lastCorrect: boolean | null; pyramid: readonly PyramidSlot[]; revealedCount: number }` (todos `readonly`)
  - `maxPlayersPv(deckCount: DeckCount): number`
  - `pvLimits(deckCount: DeckCount): PlayerLimits`
  - `createPvStateFromPile(players: readonly string[], pile: readonly Card[]): PvState`
  - `createPretoVermelho(players: readonly string[], deckCount: DeckCount, rng?: Rng): PvState` — lança se jogadores fora do limite
  - `submitGuess(state: PvState, guess: Guess): PvState` — só na fase `guess`
  - `advance(state: PvState): PvState` — só na fase `result`
  - `revealNextSlot(state: PvState): PvState` — só na fase `pyramid` com `revealedCount < 9`
  - `currentSlot(state: PvState): PyramidSlot | null`
  - `isPyramidComplete(state: PvState): boolean`
  - `finishGame(state: PvState): PvState` — só com pirâmide completa
  - `handsForMatching(state: PvState): Hand[]`

- [ ] **Step 1: Escrever testes que falham**

`tests/pv-game.test.ts`:
```ts
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
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/pv-game.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar `src/games/preto-vermelho/game.ts`**

```ts
import { createDeck, shuffle, type Card, type DeckCount, type Rng } from '../../core/cards';
import { drawCard, drawMany } from '../../core/deck';
import type { PlayerLimits } from '../../core/players';
import { buildPyramid, PYRAMID_SIZE, type Hand, type PyramidSlot } from './ceu-inferno';
import { evaluateGuess, type Guess, type GuessRound } from './logic';

export type PvPhase = 'guess' | 'result' | 'pyramid' | 'over';
export type PvRound = GuessRound | 5;

export interface PvState {
  readonly players: readonly string[];
  readonly hands: readonly (readonly Card[])[];
  readonly pile: readonly Card[];
  readonly round: PvRound;
  readonly current: number;
  readonly phase: PvPhase;
  readonly lastCard: Card | null;
  readonly lastCorrect: boolean | null;
  readonly pyramid: readonly PyramidSlot[];
  readonly revealedCount: number;
}

const CARDS_PER_PLAYER = 4;
const MIN_PLAYERS = 2;

export function maxPlayersPv(deckCount: DeckCount): number {
  return Math.floor((52 * deckCount - PYRAMID_SIZE) / CARDS_PER_PLAYER);
}

export function pvLimits(deckCount: DeckCount): PlayerLimits {
  return { min: MIN_PLAYERS, max: maxPlayersPv(deckCount) };
}

export function createPvStateFromPile(players: readonly string[], pile: readonly Card[]): PvState {
  return {
    players: [...players],
    hands: players.map(() => []),
    pile: [...pile],
    round: 1,
    current: 0,
    phase: 'guess',
    lastCard: null,
    lastCorrect: null,
    pyramid: [],
    revealedCount: 0,
  };
}

export function createPretoVermelho(
  players: readonly string[],
  deckCount: DeckCount,
  rng: Rng = Math.random,
): PvState {
  const { min, max } = pvLimits(deckCount);
  if (players.length < min || players.length > max) {
    throw new Error(`Preto ou Vermelho aceita de ${min} a ${max} jogadores`);
  }
  return createPvStateFromPile(players, shuffle(createDeck(deckCount), rng));
}

export function submitGuess(state: PvState, guess: Guess): PvState {
  if (state.phase !== 'guess' || state.round === 5) throw new Error('Não é hora de palpite');
  const hand = state.hands[state.current];
  const { card, pile } = drawCard(state.pile);
  const correct = evaluateGuess(state.round, guess, hand, card);
  const hands = state.hands.map((h, i) => (i === state.current ? [...h, card] : h));
  return { ...state, pile, hands, phase: 'result', lastCard: card, lastCorrect: correct };
}

export function advance(state: PvState): PvState {
  if (state.phase !== 'result' || state.round === 5) throw new Error('Nada para avançar');
  const cleared = { ...state, phase: 'guess' as const, lastCard: null, lastCorrect: null };
  if (state.current < state.players.length - 1) {
    return { ...cleared, current: state.current + 1 };
  }
  if (state.round < 4) {
    return { ...cleared, current: 0, round: (state.round + 1) as GuessRound };
  }
  const { cards, pile } = drawMany(state.pile, PYRAMID_SIZE);
  return {
    ...cleared,
    phase: 'pyramid',
    round: 5,
    current: 0,
    pile,
    pyramid: buildPyramid(cards),
    revealedCount: 0,
  };
}

export function isPyramidComplete(state: PvState): boolean {
  return state.revealedCount === PYRAMID_SIZE;
}

export function revealNextSlot(state: PvState): PvState {
  if (state.phase !== 'pyramid' || isPyramidComplete(state)) {
    throw new Error('Nenhuma carta para virar');
  }
  return { ...state, revealedCount: state.revealedCount + 1 };
}

export function currentSlot(state: PvState): PyramidSlot | null {
  return state.revealedCount === 0 ? null : state.pyramid[state.revealedCount - 1];
}

export function finishGame(state: PvState): PvState {
  if (state.phase !== 'pyramid' || !isPyramidComplete(state)) {
    throw new Error('A pirâmide ainda não terminou');
  }
  return { ...state, phase: 'over' };
}

export function handsForMatching(state: PvState): Hand[] {
  return state.players.map((player, i) => ({ player, cards: state.hands[i] }));
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/pv-game.test.ts`
Expected: PASS (9 testes).

- [ ] **Step 5: Rodar toda a suíte e o typecheck**

Run: `npx vitest run` → Expected: todos PASS.
Run: `npx tsc --noEmit` → Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add src/games/preto-vermelho/game.ts tests/pv-game.test.ts
git commit -m "feat: máquina de estados do Preto ou Vermelho"
```

---

### Task 7: Casca da interface (menu, cadastro, fim, estilos)

**Files:**
- Create: `index.html`, `src/main.ts`, `src/styles.css`, `src/games/registry.ts`, `src/ui/html.ts`, `src/ui/card.ts`, `src/ui/topbar.ts`, `src/ui/setup.ts`, `src/ui/end.ts`, `.claude/launch.json`

**Interfaces:**
- Consumes: `Card`, `DeckCount`, `isRed`, `rankLabel`, `SUIT_SYMBOLS` (cards); `validatePlayers`, `PlayerLimits` (players)
- Produces:
  - `escapeHtml(text: string): string`
  - `renderCard(card: Card | null, opts?: { flip?: boolean; small?: boolean }): string` — `null` = verso
  - `renderTopbar(title: string, subtitle?: string): string` e `bindTopbar(root: HTMLElement, onExit: () => void): void` (botão "Sair" com `confirm('Sair da partida?')`)
  - `mountEnd(root: HTMLElement, title: string, message: string, ctx: GameContext): void`
  - `mountSetup(root: HTMLElement, game: GameDef, initial: GameConfig, handlers: { onStart(config: GameConfig): void; onBack(): void }): void`
  - `interface GameConfig { readonly players: readonly string[]; readonly deckCount: DeckCount }`
  - `interface GameContext { readonly onExit: () => void; readonly onReplay: () => void }`
  - `interface GameDef { readonly id: string; readonly name: string; readonly description: string; limits(deckCount: DeckCount): PlayerLimits; mount(root: HTMLElement, config: GameConfig, ctx: GameContext): void }`
  - `GAMES: GameDef[]` (vazio nesta task; as Tasks 8 e 9 adicionam os jogos)

Sem testes automáticos (camada de DOM); verificação manual no navegador.

- [ ] **Step 1: `index.html`**

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#0a3622" />
    <title>Jogos para Beber</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 2: `src/games/registry.ts`**

```ts
import type { DeckCount } from '../core/cards';
import type { PlayerLimits } from '../core/players';

export interface GameConfig {
  readonly players: readonly string[];
  readonly deckCount: DeckCount;
}

export interface GameContext {
  readonly onExit: () => void;
  readonly onReplay: () => void;
}

export interface GameDef {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  limits(deckCount: DeckCount): PlayerLimits;
  mount(root: HTMLElement, config: GameConfig, ctx: GameContext): void;
}

export const GAMES: GameDef[] = [];
```

- [ ] **Step 3: Helpers de UI**

`src/ui/html.ts`:
```ts
const ESCAPES: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}
```

`src/ui/card.ts`:
```ts
import { isRed, rankLabel, SUIT_SYMBOLS, type Card } from '../core/cards';

export function renderCard(
  card: Card | null,
  opts: { flip?: boolean; small?: boolean } = {},
): string {
  const classes = ['card'];
  if (opts.small) classes.push('card-small');
  if (!card) {
    classes.push('card-back');
    return `<div class="${classes.join(' ')}" aria-label="Carta virada"></div>`;
  }
  if (opts.flip) classes.push('flip-in');
  classes.push(isRed(card) ? 'red' : 'black');
  const label = rankLabel(card.rank);
  const symbol = SUIT_SYMBOLS[card.suit];
  return `
    <div class="${classes.join(' ')}" aria-label="${label}${symbol}">
      <span class="corner top">${label}<br>${symbol}</span>
      <span class="center">${symbol}</span>
      <span class="corner bottom">${label}<br>${symbol}</span>
    </div>`;
}
```

`src/ui/topbar.ts`:
```ts
import { escapeHtml } from './html';

export function renderTopbar(title: string, subtitle?: string): string {
  return `
    <header class="topbar">
      <div class="topbar-text">
        <h2>${escapeHtml(title)}</h2>
        ${subtitle ? `<p class="topbar-subtitle">${escapeHtml(subtitle)}</p>` : ''}
      </div>
      <button class="btn-ghost" data-action="exit">Sair</button>
    </header>`;
}

export function bindTopbar(root: HTMLElement, onExit: () => void): void {
  root.querySelector('[data-action="exit"]')?.addEventListener('click', () => {
    if (confirm('Sair da partida?')) onExit();
  });
}
```

`src/ui/end.ts`:
```ts
import type { GameContext } from '../games/registry';
import { escapeHtml } from './html';

export function mountEnd(root: HTMLElement, title: string, message: string, ctx: GameContext): void {
  root.innerHTML = `
    <main class="screen end">
      <h2>${escapeHtml(title)}</h2>
      <p class="subtitle">${escapeHtml(message)}</p>
      <button class="btn btn-primary btn-big" data-action="replay">Jogar de novo</button>
      <button class="btn btn-big" data-action="menu">Menu</button>
    </main>`;
  root.querySelector('[data-action="replay"]')!.addEventListener('click', ctx.onReplay);
  root.querySelector('[data-action="menu"]')!.addEventListener('click', ctx.onExit);
}
```

- [ ] **Step 4: `src/ui/setup.ts`**

```ts
import type { DeckCount } from '../core/cards';
import { validatePlayers } from '../core/players';
import type { GameConfig, GameDef } from '../games/registry';
import { escapeHtml } from './html';

export interface SetupHandlers {
  onStart(config: GameConfig): void;
  onBack(): void;
}

export function mountSetup(
  root: HTMLElement,
  game: GameDef,
  initial: GameConfig,
  handlers: SetupHandlers,
): void {
  const players = [...initial.players];
  let deckCount: DeckCount = initial.deckCount;
  let error: string | null = null;

  function render(focusInput = false): void {
    const limits = game.limits(deckCount);
    const limitText = Number.isFinite(limits.max)
      ? `${limits.min} a ${limits.max} jogadores`
      : `mínimo de ${limits.min} jogadores`;

    root.innerHTML = `
      <main class="screen setup">
        <header class="topbar">
          <button class="btn-ghost" data-action="back">← Voltar</button>
          <div class="topbar-text"><h2>${escapeHtml(game.name)}</h2></div>
        </header>
        <form class="add-player">
          <input name="name" placeholder="Nome do jogador" maxlength="20" autocomplete="off" />
          <button class="btn" type="submit">Adicionar</button>
        </form>
        <ol class="player-list">
          ${players
            .map(
              (p, i) => `
            <li class="player-row">
              <span>${escapeHtml(p)}</span>
              <button class="btn-icon" data-action="up" data-index="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Subir">↑</button>
              <button class="btn-icon" data-action="down" data-index="${i}" ${i === players.length - 1 ? 'disabled' : ''} aria-label="Descer">↓</button>
              <button class="btn-icon" data-action="remove" data-index="${i}" aria-label="Remover">✕</button>
            </li>`,
            )
            .join('')}
        </ol>
        <p class="hint">A ordem da lista é o sentido horário · ${limitText}</p>
        <div class="deck-toggle">
          <span>Baralhos:</span>
          <button class="chip ${deckCount === 1 ? 'active' : ''}" data-action="decks" data-count="1">1 (52 cartas)</button>
          <button class="chip ${deckCount === 2 ? 'active' : ''}" data-action="decks" data-count="2">2 (104 cartas)</button>
        </div>
        ${error ? `<p class="error">${escapeHtml(error)}</p>` : ''}
        <button class="btn btn-primary btn-big" data-action="start">Começar</button>
      </main>`;

    const input = root.querySelector<HTMLInputElement>('input[name="name"]')!;
    if (focusInput) input.focus();
    root.querySelector('form')!.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = input.value.trim();
      if (!name) return;
      players.push(name);
      error = null;
      render(true);
    });
    root.querySelectorAll<HTMLButtonElement>('button[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => handle(btn));
    });
  }

  function handle(btn: HTMLButtonElement): void {
    const i = Number(btn.dataset.index);
    switch (btn.dataset.action) {
      case 'back':
        handlers.onBack();
        return;
      case 'up':
        [players[i - 1], players[i]] = [players[i], players[i - 1]];
        break;
      case 'down':
        [players[i], players[i + 1]] = [players[i + 1], players[i]];
        break;
      case 'remove':
        players.splice(i, 1);
        break;
      case 'decks':
        deckCount = Number(btn.dataset.count) as DeckCount;
        break;
      case 'start':
        error = validatePlayers(players, game.limits(deckCount), deckCount);
        if (!error) {
          handlers.onStart({ players: players.map((p) => p.trim()), deckCount });
          return;
        }
        break;
    }
    render();
  }

  render();
}
```

- [ ] **Step 5: `src/main.ts`**

```ts
import './styles.css';
import { GAMES, type GameConfig, type GameDef } from './games/registry';
import { escapeHtml } from './ui/html';
import { mountSetup } from './ui/setup';

const root = document.querySelector<HTMLElement>('#app')!;
let lastConfig: GameConfig = { players: [], deckCount: 1 };

function showMenu(): void {
  root.innerHTML = `
    <main class="screen menu">
      <h1 class="logo">🍻 Jogos para Beber</h1>
      <p class="subtitle">Escolha um jogo</p>
      <div class="game-list">
        ${GAMES.map(
          (g) => `
          <button class="game-tile" data-id="${g.id}">
            <strong>${escapeHtml(g.name)}</strong>
            <span>${escapeHtml(g.description)}</span>
          </button>`,
        ).join('')}
      </div>
      <p class="disclaimer">Beba com responsabilidade. Proibido para menores de 18 anos.</p>
    </main>`;
  root.querySelectorAll<HTMLButtonElement>('.game-tile').forEach((btn) => {
    btn.addEventListener('click', () => {
      const game = GAMES.find((g) => g.id === btn.dataset.id);
      if (game) showSetup(game);
    });
  });
}

function showSetup(game: GameDef): void {
  mountSetup(root, game, lastConfig, {
    onStart: (config) => {
      lastConfig = config;
      startGame(game, config);
    },
    onBack: showMenu,
  });
}

function startGame(game: GameDef, config: GameConfig): void {
  game.mount(root, config, {
    onExit: showMenu,
    onReplay: () => startGame(game, config),
  });
}

showMenu();
```

- [ ] **Step 6: `src/styles.css`**

```css
:root {
  --felt: #0f5132;
  --felt-dark: #0a3622;
  --ink: #f8f5ec;
  --muted: #b9d3c4;
  --gold: #f2c14e;
  --gold-ink: #2b2100;
  --red: #c62828;
  --black: #1b1b1b;
  --card: #fffdf7;
  --ok: #7ee2a8;
  --fail: #ff8a80;
  --ceu: #9fd3ff;
  --terra: #d7b98e;
  --radius: 14px;
}

* { box-sizing: border-box; }
html, body { margin: 0; }
body {
  min-height: 100dvh;
  background: radial-gradient(circle at 50% 30%, var(--felt), var(--felt-dark));
  background-attachment: fixed;
  color: var(--ink);
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}
#app { max-width: 560px; margin: 0 auto; padding: 16px; }
h1, h2, h3 { margin: 0; }

.screen { display: flex; flex-direction: column; gap: 16px; }
.logo { font-size: 2rem; text-align: center; margin-top: 24px; }
.subtitle, .hint { color: var(--muted); text-align: center; margin: 0; }
.disclaimer { color: var(--muted); font-size: 0.8rem; text-align: center; }

.game-list { display: grid; gap: 12px; }
.game-tile {
  display: flex; flex-direction: column; gap: 4px; text-align: left;
  padding: 18px; border-radius: var(--radius);
  border: 2px solid rgba(255, 255, 255, 0.15); background: rgba(0, 0, 0, 0.25);
  color: var(--ink); font: inherit; cursor: pointer;
}
.game-tile strong { font-size: 1.25rem; color: var(--gold); }
.game-tile span { color: var(--muted); }

.btn {
  font: inherit; font-weight: 600; padding: 12px 18px; border-radius: var(--radius);
  border: none; background: rgba(255, 255, 255, 0.15); color: var(--ink); cursor: pointer;
}
.btn:disabled { opacity: 0.4; cursor: default; }
.btn-primary { background: var(--gold); color: var(--gold-ink); }
.btn-big { font-size: 1.2rem; padding: 16px; width: 100%; }
.btn-ghost { background: none; border: none; color: var(--muted); font: inherit; cursor: pointer; padding: 8px 0; }
.btn-icon {
  background: rgba(255, 255, 255, 0.12); border: none; color: var(--ink);
  width: 36px; height: 36px; border-radius: 10px; font-size: 1rem; cursor: pointer;
}
.btn-icon:disabled { opacity: 0.3; cursor: default; }

.topbar { display: flex; align-items: center; gap: 12px; }
.topbar-text { flex: 1; }
.topbar h2 { font-size: 1.1rem; }
.topbar-subtitle { margin: 2px 0 0; color: var(--muted); font-size: 0.9rem; }

.add-player { display: flex; gap: 8px; }
.add-player input { flex: 1; min-width: 0; font: inherit; padding: 12px; border-radius: var(--radius); border: none; }
.player-list { margin: 0; padding: 0; list-style: none; display: grid; gap: 8px; }
.player-row { display: flex; align-items: center; gap: 6px; }
.player-row > span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 1.1rem; }
.deck-toggle { display: flex; align-items: center; gap: 8px; justify-content: center; flex-wrap: wrap; }
.chip {
  font: inherit; padding: 8px 14px; border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.25); background: none; color: var(--ink); cursor: pointer;
}
.chip.active { background: var(--gold); color: var(--gold-ink); border-color: var(--gold); }
.error { color: var(--fail); text-align: center; margin: 0; font-weight: 600; }

.turn { text-align: center; font-size: 1.3rem; margin: 0; }
.turn strong { color: var(--gold); }
.table { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; min-height: 220px; }
.pile { background: none; border: none; padding: 0; cursor: pointer; }
.pile-count { color: var(--muted); margin: 0; font-size: 0.9rem; }

.card {
  position: relative; width: 140px; height: 200px; border-radius: 12px;
  background: var(--card); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
  font-family: Georgia, 'Times New Roman', serif; flex-shrink: 0;
}
.card.red { color: var(--red); }
.card.black { color: var(--black); }
.card .corner { position: absolute; font-size: 1.1rem; line-height: 1.1; text-align: center; font-weight: 700; }
.card .corner.top { top: 8px; left: 10px; }
.card .corner.bottom { bottom: 8px; right: 10px; transform: rotate(180deg); }
.card .center { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 4rem; }
.card-back { background: repeating-linear-gradient(45deg, #8e1b1b 0 10px, #a52a2a 10px 20px); border: 6px solid var(--card); }
.card-small { width: 52px; height: 74px; border-radius: 8px; box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3); }
.card-small .corner { font-size: 0.75rem; top: 4px; left: 5px; }
.card-small .corner.bottom { display: none; }
.card-small .center { font-size: 1.6rem; padding-top: 12px; }
.card-small.card-back { border-width: 3px; }
.flip-in { animation: flip-in 0.45s ease-out; }
@keyframes flip-in {
  from { transform: rotateY(90deg); }
  to { transform: rotateY(0); }
}

.rule { background: rgba(0, 0, 0, 0.25); border-radius: var(--radius); padding: 16px; text-align: center; }
.rule h3 { color: var(--gold); font-size: 1.4rem; margin-bottom: 8px; }
.rule p { margin: 0; font-size: 1.1rem; line-height: 1.4; }

.hand { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; align-items: center; min-height: 74px; }
.guess-options { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.btn-guess { font-size: 1.2rem; padding: 18px 10px; background: rgba(0, 0, 0, 0.3); border: 2px solid rgba(255, 255, 255, 0.2); }
.result { text-align: center; font-size: 1.3rem; font-weight: 700; margin: 0; }
.result.ok { color: var(--ok); }
.result.fail { color: var(--fail); }

.pyramid { display: grid; gap: 8px; }
.row-title { text-align: center; font-weight: 700; margin: 0; font-size: 0.9rem; }
.row-title.ceu { color: var(--ceu); }
.row-title.inferno { color: var(--fail); }
.row-title.terra { color: var(--terra); }
.pyramid-row { display: flex; justify-content: center; gap: 6px; }
.slot { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 4px; border-radius: 10px; }
.slot.current { outline: 3px solid var(--gold); }
.slot-label { font-size: 0.75rem; color: var(--muted); }
.matches { background: rgba(0, 0, 0, 0.25); border-radius: var(--radius); padding: 14px; }
.matches h3 { margin-bottom: 8px; }
.matches ul { margin: 0; padding-left: 20px; display: grid; gap: 4px; }
.matches p { margin: 0; }
.hands-list { display: grid; gap: 8px; }
.hand-row { display: flex; align-items: center; gap: 8px; }
.hand-row .name { width: 80px; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hand-row .hand { justify-content: flex-start; min-height: 0; flex-wrap: nowrap; }

.end { text-align: center; margin-top: 48px; }
.end h2 { font-size: 2rem; color: var(--gold); }
```

- [ ] **Step 7: Configuração de preview e verificação**

`.claude/launch.json`:
```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "dev", "runtimeExecutable": "npm", "runtimeArgs": ["run", "dev"], "port": 5173 }
  ]
}
```

Run: `npx tsc --noEmit` → Expected: sem erros.
Abrir o dev server (`preview_start` com `dev`) e verificar: menu mostra título, "Escolha um jogo" (lista vazia) e o aviso de responsabilidade; sem erros no console.

- [ ] **Step 8: Commit**

```bash
git add index.html src/main.ts src/styles.css src/games/registry.ts src/ui .claude/launch.json
git commit -m "feat: casca da interface (menu, cadastro, fim, estilos)"
```

---

### Task 8: Tela da Suéca

**Files:**
- Create: `src/games/sueca/view.ts`
- Modify: `src/games/registry.ts` (adicionar a Suéca em `GAMES`)

**Interfaces:**
- Consumes: `createSueca`, `revealCard`, `nextTurn`, `isSuecaOver`, `currentPlayer`, `SUECA_LIMITS` (sueca.ts); `SUECA_RULES` (rules.ts); `rankLabel` (cards); `renderCard`, `renderTopbar`, `bindTopbar`, `mountEnd`, `escapeHtml` (ui); `GameConfig`, `GameContext` (registry)
- Produces: `mountSueca(root: HTMLElement, config: GameConfig, ctx: GameContext): void`

- [ ] **Step 1: `src/games/sueca/view.ts`**

```ts
import { rankLabel } from '../../core/cards';
import { renderCard } from '../../ui/card';
import { mountEnd } from '../../ui/end';
import { escapeHtml } from '../../ui/html';
import { bindTopbar, renderTopbar } from '../../ui/topbar';
import type { GameConfig, GameContext } from '../registry';
import { SUECA_RULES } from './rules';
import { createSueca, currentPlayer, isSuecaOver, nextTurn, revealCard } from './sueca';

export function mountSueca(root: HTMLElement, config: GameConfig, ctx: GameContext): void {
  let state = createSueca(config.players, config.deckCount);

  function render(): void {
    if (isSuecaOver(state)) {
      mountEnd(root, 'Fim do baralho', 'Todas as cartas foram tiradas.', ctx);
      return;
    }
    const card = state.revealed;
    const rule = card ? SUECA_RULES[card.rank] : null;

    root.innerHTML = `
      <main class="screen game">
        ${renderTopbar('Suéca Alcoólico')}
        <p class="turn">Vez de: <strong>${escapeHtml(currentPlayer(state))}</strong></p>
        <div class="table">
          ${
            card
              ? renderCard(card, { flip: true })
              : `<button class="pile" data-action="reveal" aria-label="Tirar carta">${renderCard(null)}</button>`
          }
          <p class="pile-count">${state.pile.length} cartas no monte</p>
        </div>
        ${
          card && rule
            ? `<section class="rule">
                 <h3>${rankLabel(card.rank)} · ${escapeHtml(rule.title)}</h3>
                 <p>${escapeHtml(rule.text)}</p>
               </section>
               <button class="btn btn-primary btn-big" data-action="next">Próximo</button>`
            : `<p class="hint">Toque no monte para tirar uma carta</p>`
        }
      </main>`;

    bindTopbar(root, ctx.onExit);
    root.querySelector('[data-action="reveal"]')?.addEventListener(
      'click',
      () => {
        state = revealCard(state);
        render();
      },
      { once: true },
    );
    root.querySelector('[data-action="next"]')?.addEventListener(
      'click',
      () => {
        state = nextTurn(state);
        render();
      },
      { once: true },
    );
  }

  render();
}
```

- [ ] **Step 2: Registrar em `src/games/registry.ts`**

Adicionar imports no topo:
```ts
import { mountSueca } from './sueca/view';
import { SUECA_LIMITS } from './sueca/sueca';
```
Substituir `export const GAMES: GameDef[] = [];` por:
```ts
export const GAMES: GameDef[] = [
  {
    id: 'sueca',
    name: 'Suéca Alcoólico',
    description: 'Cada carta tirada tem uma regra. Passa a vez no sentido horário.',
    limits: () => SUECA_LIMITS,
    mount: mountSueca,
  },
];
```

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit` → Expected: sem erros.
Run: `npx vitest run` → Expected: todos PASS.
No navegador (dev server):
1. Menu mostra "Suéca Alcoólico" → clicar.
2. Cadastro: clicar "Começar" sem jogadores → "Mínimo de 2 jogadores.". Adicionar "Ana", "ana" → "Começar" → "Há nomes repetidos.". Remover o duplicado, adicionar "Beto", usar ↑/↓ e ver a ordem mudar.
3. Começar: "Vez de: Ana", monte com "52 cartas no monte". Tocar no monte → carta vira, aparece a regra e "Próximo". Clicar "Próximo" → "Vez de: Beto", "51 cartas no monte".
4. "Sair" → confirmação → volta ao menu.
5. Verificar sem erros no console e com viewport mobile (375×812).

- [ ] **Step 4: Commit**

```bash
git add src/games/sueca/view.ts src/games/registry.ts
git commit -m "feat: tela da Suéca Alcoólico"
```

---

### Task 9: Tela do Preto ou Vermelho

**Files:**
- Create: `src/games/preto-vermelho/view.ts`
- Modify: `src/games/registry.ts` (adicionar o jogo em `GAMES`)

**Interfaces:**
- Consumes: tudo de `game.ts` (Task 6), `GUESS_OPTIONS`, `ROUND_NAMES`, `sipsForRound`, `formatSips`, `Guess`, `GuessRound` (logic.ts), `REVEAL_ORDER`, `matchesForSlot`, `slotName`, `SlotKind` (ceu-inferno.ts), `rankLabel` (cards), UI helpers, `GameConfig`, `GameContext`
- Produces: `mountPretoVermelho(root: HTMLElement, config: GameConfig, ctx: GameContext): void`

- [ ] **Step 1: `src/games/preto-vermelho/view.ts`**

```ts
import { rankLabel } from '../../core/cards';
import { renderCard } from '../../ui/card';
import { mountEnd } from '../../ui/end';
import { escapeHtml } from '../../ui/html';
import { bindTopbar, renderTopbar } from '../../ui/topbar';
import type { GameConfig, GameContext } from '../registry';
import { matchesForSlot, REVEAL_ORDER, slotName, type PyramidSlot, type SlotKind } from './ceu-inferno';
import {
  advance, createPretoVermelho, currentSlot, finishGame, handsForMatching,
  isPyramidComplete, revealNextSlot, submitGuess, type PvState,
} from './game';
import { formatSips, GUESS_OPTIONS, ROUND_NAMES, sipsForRound, type Guess, type GuessRound } from './logic';

export function mountPretoVermelho(root: HTMLElement, config: GameConfig, ctx: GameContext): void {
  let state: PvState = createPretoVermelho(config.players, config.deckCount);

  function update(next: PvState): void {
    state = next;
    render();
  }

  function render(): void {
    switch (state.phase) {
      case 'guess':
      case 'result':
        renderGuessRound();
        break;
      case 'pyramid':
        renderPyramid();
        break;
      case 'over':
        mountEnd(root, 'Fim de jogo', 'Céu e Inferno concluídos.', ctx);
        break;
    }
  }

  function renderGuessRound(): void {
    const round = state.round as GuessRound;
    const sips = sipsForRound(round);
    const inResult = state.phase === 'result';
    const hand = state.hands[state.current];
    const previous = inResult ? hand.slice(0, -1) : hand;

    root.innerHTML = `
      <main class="screen game">
        ${renderTopbar('Preto ou Vermelho', `Rodada ${round} · ${ROUND_NAMES[round]} · vale ${formatSips(sips)}`)}
        <p class="turn">Vez de: <strong>${escapeHtml(state.players[state.current])}</strong></p>
        <div class="hand">
          ${previous.length ? previous.map((c) => renderCard(c, { small: true })).join('') : '<span class="hint">Sem cartas ainda</span>'}
        </div>
        <div class="table">
          ${inResult && state.lastCard ? renderCard(state.lastCard, { flip: true }) : renderCard(null)}
        </div>
        ${
          inResult
            ? `<p class="result ${state.lastCorrect ? 'ok' : 'fail'}">
                 ${state.lastCorrect ? `✅ Acertou! Distribua ${formatSips(sips)}` : `❌ Errou! Beba ${formatSips(sips)}`}
               </p>
               <button class="btn btn-primary btn-big" data-action="next">Próximo</button>`
            : `<div class="guess-options">
                 ${GUESS_OPTIONS[round].map((o) => `<button class="btn btn-guess" data-guess="${o.guess}">${o.label}</button>`).join('')}
               </div>`
        }
      </main>`;

    bindTopbar(root, ctx.onExit);
    const guessButtons = root.querySelectorAll<HTMLButtonElement>('[data-guess]');
    guessButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        guessButtons.forEach((b) => (b.disabled = true));
        update(submitGuess(state, btn.dataset.guess as Guess));
      });
    });
    root.querySelector('[data-action="next"]')?.addEventListener('click', () => update(advance(state)), { once: true });
  }

  function renderSlot(kind: SlotKind, level: number): string {
    const index = REVEAL_ORDER.findIndex((p) => p.kind === kind && p.level === level);
    const slot = state.pyramid[index];
    const isOpen = index < state.revealedCount;
    const isCurrent = index === state.revealedCount - 1;
    return `
      <div class="slot ${isCurrent ? 'current' : ''}">
        ${renderCard(isOpen ? slot.card : null, { small: true, flip: isCurrent })}
        <span class="slot-label">${kind === 'terra' ? 'Terra' : level}</span>
      </div>`;
  }

  function renderMatches(slot: PyramidSlot | null): string {
    if (!slot) return `<p class="hint">Toque em "Virar próxima" para começar pelo Céu 1</p>`;
    const matches = matchesForSlot(slot, handsForMatching(state));
    const value = rankLabel(slot.card.rank);
    const lines = matches.map((m) => {
      const who = `<strong>${escapeHtml(m.player)}</strong> tem ${m.count > 1 ? `${m.count}× ` : ''}${value}`;
      switch (slot.kind) {
        case 'ceu':
          return `<li>${who} → distribua ${formatSips(m.distribute)}</li>`;
        case 'inferno':
          return `<li>${who} → beba ${formatSips(m.drink)}</li>`;
        case 'terra':
          return `<li>${who} → beba ${formatSips(m.drink)} e distribua ${formatSips(m.distribute)}</li>`;
      }
    });
    return `
      <section class="matches">
        <h3>${slotName(slot)} · ${value}</h3>
        ${lines.length ? `<ul>${lines.join('')}</ul>` : '<p>Ninguém tem — sorte!</p>'}
      </section>`;
  }

  function renderPyramid(): void {
    const levels = [1, 2, 3, 4];
    const done = isPyramidComplete(state);

    root.innerHTML = `
      <main class="screen game">
        ${renderTopbar('Preto ou Vermelho', 'Rodada 5 · Céu e Inferno')}
        <div class="pyramid">
          <p class="row-title ceu">Céu</p>
          <div class="pyramid-row">${levels.map((l) => renderSlot('ceu', l)).join('')}</div>
          <p class="row-title terra">Terra</p>
          <div class="pyramid-row">${renderSlot('terra', 5)}</div>
          <p class="row-title inferno">Inferno</p>
          <div class="pyramid-row">${levels.map((l) => renderSlot('inferno', l)).join('')}</div>
        </div>
        ${renderMatches(currentSlot(state))}
        <button class="btn btn-primary btn-big" data-action="${done ? 'finish' : 'reveal'}">
          ${done ? 'Finalizar' : 'Virar próxima'}
        </button>
        <div class="hands-list">
          ${state.players
            .map(
              (p, i) => `
            <div class="hand-row">
              <span class="name">${escapeHtml(p)}</span>
              <div class="hand">${state.hands[i].map((c) => renderCard(c, { small: true })).join('')}</div>
            </div>`,
            )
            .join('')}
        </div>
      </main>`;

    bindTopbar(root, ctx.onExit);
    root.querySelector('[data-action="reveal"]')?.addEventListener('click', () => update(revealNextSlot(state)), { once: true });
    root.querySelector('[data-action="finish"]')?.addEventListener('click', () => update(finishGame(state)), { once: true });
  }

  render();
}
```

- [ ] **Step 2: Registrar em `src/games/registry.ts`**

Adicionar imports no topo:
```ts
import { pvLimits } from './preto-vermelho/game';
import { mountPretoVermelho } from './preto-vermelho/view';
```
Adicionar ao array `GAMES`, depois da Suéca:
```ts
  {
    id: 'preto-vermelho',
    name: 'Preto ou Vermelho',
    description: '4 rodadas de palpites e o Céu e Inferno no final.',
    limits: pvLimits,
    mount: mountPretoVermelho,
  },
```

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit` → Expected: sem erros.
Run: `npx vitest run` → Expected: todos PASS.
No navegador (dev server, viewport 375×812):
1. Menu → "Preto ou Vermelho". Com 1 baralho, cadastrar 11 jogadores → "Começar" → "Máximo de 10 jogadores com 1 baralho — use 2 baralhos.". Trocar para 2 baralhos → começa.
2. Recomeçar com 2 jogadores. Rodada 1: subtítulo "Rodada 1 · Preto ou Vermelho · vale 1 gole", dois botões. Tocar → carta vira, mensagem ✅/❌ condiz com a cor, "Próximo".
3. Rodada 2 mostra a carta anterior do jogador na mão; rodada 3 mostra duas; rodada 4 mostra 4 botões de naipe e "vale 4 goles".
4. Após a rodada 4: pirâmide com 9 cartas viradas, mãos dos jogadores listadas. "Virar próxima" 9 vezes: a posição atual fica destacada na ordem Céu 1, Inferno 1, …, Terra; mensagens de correspondência batem com as mãos exibidas.
5. "Finalizar" → tela de Fim → "Jogar de novo" inicia nova partida com os mesmos jogadores; "Menu" volta ao menu.
6. Sem erros no console.

- [ ] **Step 4: Commit**

```bash
git add src/games/preto-vermelho/view.ts src/games/registry.ts
git commit -m "feat: tela do Preto ou Vermelho"
```

---

### Task 10: Verificação final e build

**Files:**
- Create: `README.md`

- [ ] **Step 1: `README.md`**

```markdown
# Jogos para Beber

Jogos de baralho para beber em roda, num aparelho só no centro da mesa.

- **Suéca Alcoólico** — cada carta tem uma regra.
- **Preto ou Vermelho** — 4 rodadas de palpites e o Céu e Inferno.

## Rodar

    npm install
    npm run dev

## Testes e build

    npm test
    npm run build   # gera dist/ estático

## Adicionar um jogo

Crie `src/games/<id>/` com a lógica pura (testada em `tests/`) e um `view.ts`
exportando `mount(root, config, ctx)`, e registre em `src/games/registry.ts`.

Beba com responsabilidade.
```

- [ ] **Step 2: Rodar tudo**

Run: `npm test` → Expected: todos PASS.
Run: `npm run build` → Expected: `tsc` sem erros e `dist/` gerado.
Run: `npx vite preview --port 4173` e abrir no navegador → Expected: menu carrega com os dois jogos, uma rodada de cada funciona.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: README"
```
