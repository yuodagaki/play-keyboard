import { html } from 'https://esm.sh/htm/react';

export const journeyNames = {
  rabbit: 'ほしみみウサギ', glider: 'ほしくずモモンガ', owl: 'つきかげフクロウ',
  mouse: 'しおりヤマネ', penguin: 'インクペンギン', turtle: '大じてんガメ',
  hedgehog: 'やりもちハリネズミ', cat: 'まほうつかいネコ', lion: 'たてがみ騎士団長',
  rhino: 'はんこのサイ', snake: 'まきものヘビ', peacock: 'クジャクのことば王',
  swallow: 'かざきりツバメ', gorilla: 'たいこゴリラ', whale: 'くもくじら船長',
  armadillo: 'いわよろいアルマジロ', iguana: 'ようがんイグアナ', elephant: 'だいちのゾウ王',
};

export const journeys = {
  5: { first: 26, last: 30, cast: ['rabbit','glider','owl'], route: [0,1,2,2,2], scenes: ['stars','meteor'] },
  6: { first: 31, last: 36, cast: ['mouse','penguin','turtle'], route: [0,0,0,1,1,1], scenes: ['shelves','study'] },
  7: { first: 37, last: 42, cast: ['hedgehog','cat','lion'], route: [0,0,0,1,1,1], scenes: ['bridge','hall'] },
  8: { first: 43, last: 46, cast: ['rhino','snake','peacock'], route: [0,1,0,1], scenes: ['gate','throne'] },
  9: { first: 47, last: 51, cast: ['swallow','gorilla','whale'], route: [0,0,1,1,1], scenes: ['clouds','storm'] },
  10: { first: 52, last: 56, cast: ['armadillo','iguana','elephant'], route: [0,0,1,1,1], scenes: ['canyon','crater'] },
};

export function journeyEncounter(stage, index) {
  const world = journeys[stage.world];
  if (!world) return null;
  const group = world.route[stage.id - world.first];
  const boss = stage.id === world.last && index === stage.enemyCount - 1;
  const actor = world.cast[boss ? 2 : group === 2 ? index % 2 : group];
  const scene = world.scenes[group === 0 ? 0 : 1];
  return { actor, scene, boss, name: journeyNames[actor] };
}

export function JourneyAnimal({ actor, boss, flash, falling }) {
  return html`<span class=${'journey-animal animal-' + actor + (boss ? ' journey-boss' : '') + (falling ? ' journey-fall' : flash ? ' journey-hit' : '')}>
    <img src=${'art/journey/' + actor + '.png'} alt=${journeyNames[actor]} />
  </span>`;
}

const scenes = {
  owl: ['星の妖精を翼で守る', 'くしゃみをしながら道案内'],
  turtle: ['本棚にかくれたカメのしっぽを引くヤマネ', '本の挿絵とおなじ勝利のポーズ'],
  lion: ['中庭で敬礼のおけいこ', '光の下を騎士が凱旋'],
  peacock: ['尾羽を広げてお出迎え', '翼の切符を手渡す'],
  whale: ['島に見えたのは船長の背中', '船長の背中で出航'],
  elephant: ['丸太橋を渡るアルマジロを受け止める', 'みんなで勝ちどき'],
};

export function JourneyScene({ world, children }) {
  const [first, second, boss] = world.cast;
  const ending = Boolean(children);
  const companions = ending || boss === 'elephant' || boss === 'lion' || boss === 'whale' || boss === 'turtle';
  return html`<div class=${'journey-scene vignette-' + boss + (ending ? ' journey-ending' : ' journey-map')}
    aria-label=${scenes[boss][Number(ending)]} role="img"
    style=${{backgroundImage: 'url(art/journey/' + world.scenes[ending ? 1 : 0] + '.png)'}}>
    <div class="journey-company">
      ${companions && html`<${JourneyAnimal} actor=${first} />`}
      ${ending && html`<${JourneyAnimal} actor=${second} />`}
      <${JourneyAnimal} actor=${boss} boss=${true} />
      ${children}
      <span class="journey-prop" aria-hidden="true">${boss === 'peacock' ? (ending ? 'ぼうけんのそら' : 'ようこそ') : ''}</span>
    </div>
  </div>`;
}
