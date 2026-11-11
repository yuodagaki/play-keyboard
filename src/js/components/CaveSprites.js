import { html } from 'https://esm.sh/htm/react';

export const caveNames = { bat: 'ランタンコウモリ', mole: 'つるはしモグラ', chief: '親方モグラ' };

export function CaveSprite({ kind, flash, falling, scene = 'battle' }) {
  const state = falling ? 'fall' : flash ? 'hit' : 'idle';
  return html`
    <span class=${'cave-sprite cave-' + kind + ' cave-' + state + ' cave-' + scene}
      role="img" aria-label=${caveNames[kind]}>
      <img class="cave-body" src=${'art/cave/' + kind + '.png'} alt="" />
      ${kind === 'chief' && html`<img class="cave-cap" src="art/cave/cap.png" alt="" />`}
      ${scene === 'map' && html`<i class="cave-ore" />`}
      ${scene === 'exit' && html`<img class="cave-cart" src="art/cave/cart.png" alt="" />`}
    </span>
  `;
}
