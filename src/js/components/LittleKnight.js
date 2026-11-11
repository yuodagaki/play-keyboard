import { html } from 'https://esm.sh/htm/react';
import { useEffect, useRef, useState } from 'https://esm.sh/react';

const art = name => 'art/forest/' + name + '.png';

const armorHue = { hat: 0, helmet: 25, cape: 215, armor: 170, robe: 270, shield: 80, divine: 45 };

export function LittleKnight({ weapon, armor, pose = 'idle' }) {
  return html`
    <span class=${'knight knight--' + pose} role="img" aria-label="リトルナイト">
      <img class="knight-coat" src=${art('coat')} alt=""
        style=${{ filter: 'hue-rotate(' + (armorHue[armor] ?? 0) + 'deg)' }} />
      ${['hat', 'helmet', 'cape', 'robe', 'divine', 'vest', 'radiant'].includes(armor) && html`
        <img class=${`knight-outfit knight-outfit--${armor}`} src=${'art/shop/' + armor + '.png'} alt="" />
      `}
      <img class="knight-helm" src=${art('helm')} alt="" />
      ${['armor', 'shield'].includes(armor) && html`<img class="knight-shield" src=${`art/shop/${armor}.png`} alt="" />`}
      <img class=${weapon === 'magnum' ? 'knight-blade knight-magnum' : 'knight-blade'} src=${art(weapon)} alt="" />
    </span>
  `;
}

// Restart the pose on each reaction, even for two consecutive strikes.
const poseDuration = { attack: 360, happy: 550, sad: 350 };

export function useKnightReaction() {
  const [reaction, setReaction] = useState({ pose: 'idle', id: 0 });
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  function react(pose) {
    clearTimeout(timer.current);
    setReaction(prev => ({ pose, id: prev.id + 1 }));
    timer.current = setTimeout(() => {
      setReaction(prev => ({ ...prev, pose: 'idle' }));
    }, poseDuration[pose]);
  }
  return [reaction, react];
}
