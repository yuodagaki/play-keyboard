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
  'P':'R_PINKY',';':'R_PINKY','/':'R_PINKY',
};

function getFingerColor(fingerId) {
  if (!fingerId) return '#CFD8DC';
  const type = fingerId.replace('L_','').replace('R_','');
  return FINGER_COLOR[type] ?? '#CFD8DC';
}

function FingerRect({ x, y, w, h, color, pressed }) {
  const pressStyle = pressed
    ? { animation: 'finger-press 0.2s ease-out' }
    : {};
  return html`
    <rect
      x=${x} y=${y} width=${w} height=${h} rx="6"
      fill=${color}
      style=${{ transition: 'fill 0.1s', transformOrigin: `${x + w/2}px ${y}px`, ...pressStyle }}
    />
  `;
}

function Hand({ hand, activeFingers, pressedFinger, flashError }) {
  const isLeft = hand === 'left';

  // 指の定義 (左手座標。右手はscale(-1,1)で反転)
  const fingers = [
    { id: 'PINKY',  x: 6,  y: 28, w: 18, h: 52 },
    { id: 'RING',   x: 28, y: 10, w: 18, h: 68 },
    { id: 'MIDDLE', x: 50, y: 4,  w: 18, h: 74 },
    { id: 'INDEX',  x: 72, y: 16, w: 18, h: 62 },
  ];

  const handId = isLeft ? 'L' : 'R';
  const wrapStyle = flashError ? { animation: 'hand-error-flash 0.3s ease-out' } : {};
  const transform = isLeft ? '' : 'scale(-1,1) translate(-120,0)';

  return html`
    <svg width="96" height="112" viewBox="0 0 120 140" style=${{ overflow:'visible' }}>
      <g transform=${transform} style=${wrapStyle}>
        <rect x="8" y="78" width="104" height="52" rx="10" fill="#ECEFF1"/>
        ${fingers.map(f => {
          const fullId = `${handId}_${f.id}`;
          const isActive = activeFingers.includes(fullId);
          const isPressed = pressedFinger === fullId;
          const color = isActive ? getFingerColor(fullId) : '#CFD8DC';
          return html`<${FingerRect} key=${f.id} ...${f} color=${color} pressed=${isPressed} />`;
        })}
        ${/* ホームポジション突起 (INDEX指先中央に●) */html`
          <circle
            cx="81" cy="16" r="4"
            fill="#1A237E" opacity="0.7"
          />
        `}
      </g>
    </svg>
  `;
}

export function HandSVG({ activeFingers = [], pressedFinger = null, flashError = false }) {
  return html`
    <div class="hands-area">
      <${Hand} hand="left"  activeFingers=${activeFingers} pressedFinger=${pressedFinger} flashError=${flashError} />
      <${Hand} hand="right" activeFingers=${activeFingers} pressedFinger=${pressedFinger} flashError=${flashError} />
    </div>
  `;
}
