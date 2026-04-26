import { html } from 'https://esm.sh/htm/react';

function damageStyle(flash, falling) {
  if (falling) return { animation: 'enemy-fall 0.5s ease-in forwards', transformOrigin: '70px 130px' };
  if (flash)   return { filter: 'brightness(2.8) saturate(0) sepia(1) hue-rotate(310deg)' };
  return {};
}

function Slime({ style }) {
  return html`<g style=${style}>
    <ellipse cx="70" cy="98" rx="50" ry="42" fill="#5BB8FF" stroke="#1565C0" strokeWidth="3"/>
    <ellipse cx="70" cy="80" rx="38" ry="30" fill="#90D4FF"/>
    <circle cx="56" cy="90" r="8" fill="white"/><circle cx="84" cy="90" r="8" fill="white"/>
    <circle cx="58" cy="91" r="4" fill="#1A237E"/><circle cx="86" cy="91" r="4" fill="#1A237E"/>
    <circle cx="56" cy="88" r="2" fill="white"/><circle cx="84" cy="88" r="2" fill="white"/>
    <ellipse cx="52" cy="74" rx="11" ry="7" fill="white" opacity="0.35"/>
    <path d="M 58 106 Q 70 116 82 106" fill="none" stroke="#1565C0" strokeWidth="3" strokeLinecap="round"/>
  </g>`;
}

function Mushroom({ style }) {
  return html`<g style=${style}>
    <rect x="46" y="94" width="48" height="46" rx="10" fill="#F5E6C8" stroke="#8B6914" strokeWidth="3"/>
    <ellipse cx="70" cy="90" rx="56" ry="38" fill="#F44336" stroke="#C62828" strokeWidth="3"/>
    <circle cx="54" cy="73" r="12" fill="white"/><circle cx="76" cy="64" r="9" fill="white"/>
    <circle cx="64" cy="87" r="7" fill="white"/><circle cx="90" cy="80" r="8" fill="white"/>
    <circle cx="57" cy="105" r="6" fill="#4A2000"/><circle cx="83" cy="105" r="6" fill="#4A2000"/>
    <circle cx="58" cy="103" r="2" fill="white"/><circle cx="84" cy="103" r="2" fill="white"/>
    <path d="M 60 116 Q 70 124 80 116" fill="none" stroke="#4A2000" strokeWidth="2.5"/>
  </g>`;
}

function Goblin({ style }) {
  return html`<g style=${style}>
    <polygon points="55,44 46,18 65,40" fill="#388E3C" stroke="#1B5E20" strokeWidth="1.5"/>
    <polygon points="85,44 94,18 75,40" fill="#388E3C" stroke="#1B5E20" strokeWidth="1.5"/>
    <circle cx="70" cy="56" r="22" fill="#4CAF50" stroke="#2E7D32" strokeWidth="3"/>
    <circle cx="62" cy="50" r="7" fill="white"/><circle cx="78" cy="50" r="7" fill="white"/>
    <circle cx="63" cy="51" r="3.5" fill="#1B5E20"/><circle cx="79" cy="51" r="3.5" fill="#1B5E20"/>
    <circle cx="63" cy="49" r="1.5" fill="white"/><circle cx="79" cy="49" r="1.5" fill="white"/>
    <path d="M 61 66 Q 70 76 79 66" fill="none" stroke="#1B5E20" strokeWidth="3" strokeLinecap="round"/>
    <line x1="70" y1="78" x2="70" y2="118" stroke="#2E7D32" strokeWidth="5" strokeLinecap="round"/>
    <line x1="70" y1="88" x2="44" y2="108" stroke="#2E7D32" strokeWidth="4" strokeLinecap="round"/>
    <line x1="70" y1="88" x2="96" y2="108" stroke="#2E7D32" strokeWidth="4" strokeLinecap="round"/>
    <line x1="70" y1="118" x2="52" y2="146" stroke="#2E7D32" strokeWidth="4" strokeLinecap="round"/>
    <line x1="70" y1="118" x2="88" y2="146" stroke="#2E7D32" strokeWidth="4" strokeLinecap="round"/>
  </g>`;
}

function Bat({ style }) {
  return html`<g style=${style}>
    <polygon points="70,78 4,44 20,88 70,82" fill="#37474F" stroke="#263238" strokeWidth="2"/>
    <polygon points="70,78 136,44 120,88 70,82" fill="#37474F" stroke="#263238" strokeWidth="2"/>
    <polygon points="64,72 44,80 48,95" fill="#455A64"/>
    <polygon points="76,72 96,80 92,95" fill="#455A64"/>
    <ellipse cx="70" cy="84" rx="24" ry="30" fill="#546E7A" stroke="#37474F" strokeWidth="2.5"/>
    <circle cx="70" cy="58" r="20" fill="#455A64" stroke="#37474F" strokeWidth="2"/>
    <polygon points="56,46 48,20 66,42" fill="#37474F"/>
    <polygon points="84,46 92,20 74,42" fill="#37474F"/>
    <circle cx="63" cy="56" r="6" fill="#FF5252"/><circle cx="77" cy="56" r="6" fill="#FF5252"/>
    <circle cx="64" cy="56" r="2.8" fill="#B71C1C"/><circle cx="78" cy="56" r="2.8" fill="#B71C1C"/>
    <path d="M 64 72 Q 70 78 76 72" fill="none" stroke="#37474F" strokeWidth="2" strokeLinecap="round"/>
  </g>`;
}

function Skeleton({ style }) {
  return html`<g style=${style}>
    <circle cx="70" cy="36" r="26" fill="white" stroke="#BDBDBD" strokeWidth="3"/>
    <ellipse cx="62" cy="32" rx="8" ry="9" fill="#1A237E"/>
    <ellipse cx="78" cy="32" rx="8" ry="9" fill="#1A237E"/>
    <circle cx="62" cy="30" r="3" fill="white" opacity="0.4"/>
    <circle cx="78" cy="30" r="3" fill="white" opacity="0.4"/>
    <path d="M 65 50 L 70 56 L 75 50" fill="#BDBDBD"/>
    <rect x="59" y="56" width="5" height="10" rx="2" fill="#BDBDBD"/>
    <rect x="68" y="56" width="5" height="10" rx="2" fill="#BDBDBD"/>
    <rect x="77" y="56" width="5" height="10" rx="2" fill="#BDBDBD"/>
    <line x1="70" y1="62" x2="70" y2="108" stroke="#E0E0E0" strokeWidth="5" strokeLinecap="round"/>
    <line x1="70" y1="74" x2="42" y2="96" stroke="#E0E0E0" strokeWidth="4.5" strokeLinecap="round"/>
    <line x1="70" y1="74" x2="98" y2="96" stroke="#E0E0E0" strokeWidth="4.5" strokeLinecap="round"/>
    <line x1="70" y1="108" x2="50" y2="138" stroke="#E0E0E0" strokeWidth="4.5" strokeLinecap="round"/>
    <line x1="70" y1="108" x2="90" y2="138" stroke="#E0E0E0" strokeWidth="4.5" strokeLinecap="round"/>
  </g>`;
}

function Golem({ style }) {
  return html`<g style=${style}>
    <rect x="44" y="8" width="52" height="46" rx="5" fill="#78909C" stroke="#546E7A" strokeWidth="3"/>
    <rect x="51" y="20" width="14" height="12" rx="3" fill="#FF9500"/>
    <rect x="75" y="20" width="14" height="12" rx="3" fill="#FF9500"/>
    <rect x="52" y="40" width="36" height="7" rx="3" fill="#546E7A"/>
    <rect x="33" y="57" width="74" height="60" rx="5" fill="#90A4AE" stroke="#546E7A" strokeWidth="3"/>
    <rect x="7"   y="60" width="24" height="50" rx="5" fill="#78909C" stroke="#546E7A" strokeWidth="2.5"/>
    <rect x="109" y="60" width="24" height="50" rx="5" fill="#78909C" stroke="#546E7A" strokeWidth="2.5"/>
    <rect x="38" y="119" width="28" height="24" rx="4" fill="#78909C" stroke="#546E7A" strokeWidth="2"/>
    <rect x="74" y="119" width="28" height="24" rx="4" fill="#78909C" stroke="#546E7A" strokeWidth="2"/>
    <line x1="70" y1="58" x2="68" y2="118" stroke="#546E7A" strokeWidth="2.5" opacity="0.5"/>
  </g>`;
}

const RENDERERS = { slime: Slime, mushroom: Mushroom, goblin: Goblin, bat: Bat, skeleton: Skeleton, golem: Golem };

export function EnemySVG({ type, flash = false, falling = false, boss = false }) {
  const style = damageStyle(flash, falling);
  const Renderer = RENDERERS[type] ?? Slime;
  const bossStyle = boss ? { transform: `scale(${1.7})`, transformOrigin: '70px 100px' } : {};
  return html`
    <svg width="160" height="175" viewBox="0 0 140 160" style=${{ overflow:'visible', ...bossStyle }}>
      <${Renderer} style=${style} />
    </svg>
  `;
}
