import { html } from 'https://esm.sh/htm/react';
import { useEffect, useRef, useState } from 'https://esm.sh/react';

const outfits = new Set(['hat', 'helmet', 'cape', 'armor', 'robe', 'shield', 'divine', 'vest', 'radiant']);

export function LittleKnight({ weapon = 'wooden', armor, pose = 'idle' }) {
  const outfit = outfits.has(armor) ? armor : 'hat';
  return html`
    <span class=${'knight knight--' + pose} role="img" aria-label="リトルナイト">
      <img class="knight-body" src=${'art/knight/' + outfit + '.png'} alt="" />
      <img class=${weapon === 'magnum' ? 'knight-blade knight-magnum' : 'knight-blade'}
        src=${'art/forest/' + weapon + '.png'} alt="" />
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
