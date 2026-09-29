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
