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
