import { html } from 'https://esm.sh/htm/react';

const art = name => 'art/forest/' + name + '.png';

export function ForestBoar({ boss, sleeping, entrance, flash, falling }) {
  const state = sleeping ? 'sleep' : falling ? 'fall' : flash ? 'hit' : 'idle';
  return html`
    <span class=${'boar boar--' + state + (boss ? ' boar--boss' : '')}
      role="img" aria-label=${sleeping ? 'ねむっている大イノシシ' : boss ? '大イノシシ' : 'うりぼう'}>
      <span class="boar-body">
        <img src=${art(boss ? 'chief' : 'boar')} alt="" />
        ${sleeping && html`<i class="boar-eyelid" aria-hidden="true" />`}
      </span>
      ${boss && html`<img class="boar-shield" src=${art('stump')} alt="" />`}
      ${(sleeping || entrance) && html`<i class=${'boar-scrape' + (sleeping ? ' boar-scrape--sleep' : '')} aria-hidden="true" />`}
      ${sleeping && html`<i class="boar-bubble" />`}
    </span>
  `;
}
