import { html } from 'https://esm.sh/htm/react';

export const mistNames = { frog: 'ごろごろガエル', otter: 'どろはねカワウソ', deer: 'シカのおおぬし' };

export function mistEnemy(id, index, count) {
  if (id === 25 && index === count - 1) return 'deer';
  if (id === 22) return 'frog';
  if (id === 23) return 'otter';
  return index % 2 === 0 ? 'frog' : 'otter';
}

export function MistSprite({ kind, flash, falling }) {
  return html`<span class=${'mist-animal mist-' + kind + (falling ? ' mist-fall' : flash ? ' mist-hit' : '')}>
    <img src=${'art/mist/' + kind + '.png'} alt=${mistNames[kind]} />
  </span>`;
}

export function MistShelter({ children }) {
  return html`<div class="mist-shelter mist-grove">
    <div class="mist-family">
      <${MistSprite} kind="deer" /><${MistSprite} kind="frog" /><${MistSprite} kind="otter" />
      ${children}
    </div>
  </div>`;
}
