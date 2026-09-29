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
