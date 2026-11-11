import { html } from 'https://esm.sh/htm/react';

export const FINGER_COLOR = {
  INDEX:  '#FFD700',
  MIDDLE: '#4CAF50',
  RING:   '#5BB8FF',
  PINKY:  '#AB47BC',
};

export const KEY_FINGER = {
  'R':'L_INDEX','F':'L_INDEX','V':'L_INDEX','T':'L_INDEX','G':'L_INDEX','B':'L_INDEX',
  'E':'L_MIDDLE','D':'L_MIDDLE','C':'L_MIDDLE',
  'W':'L_RING','S':'L_RING','X':'L_RING',
  'Q':'L_PINKY','A':'L_PINKY','Z':'L_PINKY',
  'Y':'R_INDEX','H':'R_INDEX','N':'R_INDEX','U':'R_INDEX','J':'R_INDEX','M':'R_INDEX',
  'I':'R_MIDDLE','K':'R_MIDDLE',',':'R_MIDDLE',
  'O':'R_RING','L':'R_RING','.':'R_RING',
  'P':'R_PINKY',';':'R_PINKY','/':'R_PINKY','-':'R_PINKY',
};

const fingers = [
  { type: 'PINKY', name: '小指', frame: 0 },
  { type: 'RING', name: '薬指', frame: 1 },
  { type: 'MIDDLE', name: '中指', frame: 2 },
  { type: 'INDEX', name: '人差し指', frame: 3 },
];

function Hand({ side, activeFingers, pressedFinger, flashError }) {
  const sideName = side === 'L' ? '左手' : '右手';
  const active = fingers.filter(f => activeFingers.includes(side + '_' + f.type));
  return html`
    <span class=${'pixel-hand' + (side === 'R' ? ' pixel-hand--right' : '') + (flashError ? ' pixel-hand--error' : '')}
      role="img" aria-label=${[sideName, ...active.map(f => f.name)].join('の')}>
      ${active.map(f => {
        const id = side + '_' + f.type;
        return html`<i key=${id} class=${'pixel-finger' + (pressedFinger === id ? ' pixel-finger--pressed' : '')}
          style=${{ backgroundPositionY: -112 * f.frame + 'px', color: FINGER_COLOR[f.type] }} />`;
      })}
      <i class="pixel-hand__home" />
    </span>
  `;
}

export function HandGuide({ activeFingers = [], pressedFinger = null, flashError = false }) {
  return html`<div class="hands-area">
    ${['L', 'R'].map(side => html`<${Hand} key=${side} side=${side} activeFingers=${activeFingers}
      pressedFinger=${pressedFinger} flashError=${flashError} />`)}
  </div>`;
}
