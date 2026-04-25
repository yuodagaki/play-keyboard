import { html } from 'https://esm.sh/htm/react';
import { useState } from 'https://esm.sh/react';
import { HandSVG, KEY_FINGER, FINGER_COLOR } from './HandSVG.js';

const KB_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L',';'],
  ['Z','X','C','V','B','N','M',',','.'],
];
const HOME_KEYS = new Set(['F','J']);

function keyColor(key, nextChar, availKeys) {
  const isNext = key === nextChar;
  const isAvail = availKeys.has(key);
  if (isNext || isAvail) {
    const fingerId = KEY_FINGER[key];
    if (!fingerId) return '#5BB8FF';
    const type = fingerId.replace('L_','').replace('R_','');
    return FINGER_COLOR[type] ?? '#5BB8FF';
  }
  return '#CFD8DC';
}

function keyTextColor(key, nextChar, availKeys) {
  const isNext = key === nextChar;
  const isAvail = availKeys.has(key);
  if (isNext || isAvail) {
    const fingerId = KEY_FINGER[key];
    const type = fingerId?.replace('L_','').replace('R_','');
    return type === 'INDEX' ? '#1A237E' : 'white';
  }
  return '#90A4AE';
}

function keyShadow(key, nextChar, availKeys) {
  if (key === nextChar) {
    return '0 0 0 2.5px white, 0 0 0 4.5px rgba(26,35,126,0.55)';
  }
  if (availKeys.has(key)) {
    const fingerId = KEY_FINGER[key];
    if (!fingerId) return '0 3px 0 #1E88E5';
    const type = fingerId.replace('L_','').replace('R_','');
    const colors = { INDEX:'#F9A825', MIDDLE:'#388E3C', RING:'#1E88E5', PINKY:'#7B1FA2' };
    return `0 3px 0 ${colors[type] ?? '#1E88E5'}`;
  }
  return '0 2px 0 #B0BEC5';
}

export function KeyboardGuide({ nextChar, availableKeys, flashError }) {
  const [visible, setVisible] = useState(true);
  const upperNext = nextChar?.toUpperCase();
  const availKeys = new Set((availableKeys ?? '').toUpperCase().split(''));

  const activeFinger = upperNext ? [KEY_FINGER[upperNext]].filter(Boolean) : [];

  return html`
    <div class="keyboard-guide">
      <button class="keyboard-guide__toggle" onClick=${() => setVisible(v => !v)}>
        ${visible ? 'かくす' : 'みせる'}
      </button>

      ${visible && html`
        <${HandSVG}
          activeFingers=${activeFinger}
          pressedFinger=${null}
          flashError=${flashError}
        />

        <div class="keyboard-rows">
          ${KB_ROWS.map((row, ri) => html`
            <div key=${ri} class="keyboard-row keyboard-row--${ri + 1}">
              ${row.map(k => {
                const isNext  = k === upperNext;
                const isAvail = availKeys.has(k);
                const isHome  = HOME_KEYS.has(k);
                const bg      = keyColor(k, upperNext, availKeys);
                const color   = keyTextColor(k, upperNext, availKeys);
                const shadow  = keyShadow(k, upperNext, availKeys);
                return html`
                  <div
                    key=${k}
                    class="key-cap ${isNext ? 'key-cap--next' : isAvail ? 'key-cap--available' : 'key-cap--inactive'} ${isHome ? 'key-cap--home' : ''}"
                    style=${{
                      background: bg,
                      color,
                      boxShadow: shadow,
                      border: '2px solid transparent',
                    }}
                  >${k}</div>
                `;
              })}
            </div>
          `)}
        </div>
      `}
    </div>
  `;
}
