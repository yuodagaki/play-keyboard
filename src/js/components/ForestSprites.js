import { html } from 'https://esm.sh/htm/react';

const art = name => 'art/forest/' + name + '.png';

export function ForestBoar({ boss, sleeping, flash, falling }) {
  const state = sleeping ? 'sleep' : falling ? 'fall' : flash ? 'hit' : 'idle';
  return html`
    <span class=${'boar boar--' + state + (boss ? ' boar--boss' : '')}
      role="img" aria-label=${sleeping ? 'ねむっている大イノシシ' : boss ? '大イノシシ' : 'うりぼう'}>
      <img class="boar-body" src=${art(boss ? 'chief' : 'boar')} alt="" />
      ${boss && html`<img class="boar-shield" src=${art('stump')} alt="" />`}
      ${sleeping && html`<i class="boar-bubble" />`}
    </span>
  `;
}
