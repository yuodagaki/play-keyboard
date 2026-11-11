import { html } from 'https://esm.sh/htm/react';

const COLORS = ['#FFD700','#FF5252','#5BB8FF','#4CAF50','#FF9800','#E040FB','#00BCD4'];

export function Confetti() {
  const pieces = Array.from({ length: 48 }, (_, i) => {
    const left  = Math.random() * 100;
    const delay = Math.random() * 1.5;
    const dur   = 2 + Math.random() * 1.5;
    const size  = 4 + 2 * Math.floor(Math.random() * 4);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    return html`
      <div key=${i} style=${{
        position: 'absolute',
        left: `${left}%`,
        top: 0,
        width: size,
        height: size,
        background: color,

        animation: `confetti-fall ${dur}s steps(36) forwards`,
        animationDelay: `${delay}s`,
        opacity: 0,
      }} />
    `;
  });

  return html`
    <div style=${{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
      ${pieces}
    </div>
  `;
}
