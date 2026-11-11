import { html } from 'https://esm.sh/htm/react';

export const islandNames = {
  tanuki: '花がさタヌキ',
  fox: 'つばき剣士キツネ',
  pair: '横綱タヌキと剣豪キツネ',
};

export function islandEnemy(stageId, index, count) {
  if (stageId === 21 && index === count - 1) return 'pair';
  if (stageId < 16) return 'tanuki';
  if (stageId < 19) return 'fox';
  return index % 2 === 0 ? 'tanuki' : 'fox';
}

export function IslandSprite({ kind, flash, falling }) {
  const members = kind === 'pair' ? ['yokozuna', 'master'] : [kind];
  return html`
    <span role="img" aria-label=${islandNames[kind]}
      class=${'island-party island-' + kind + (falling ? ' island-fall' : flash ? ' island-hit' : '')}>
      ${members.map(member => html`<img key=${member} src=${'art/island/' + member + '.png'} alt="" />`)}
    </span>
  `;
}
