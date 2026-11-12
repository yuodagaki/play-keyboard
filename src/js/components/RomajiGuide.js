import { html } from 'https://esm.sh/htm/react';

export function RomajiGuide({ guide, typed }) {
  return html`<div class="battle-progress">
    ${Array.from(guide, (ch, i) => {
      const state = i < typed.length ? 'done' : i === typed.length ? 'next' : 'pending';
      return html`<span key=${i} class=${'battle-progress__cell battle-progress__cell--' + state}>${ch.toUpperCase()}</span>`;
    })}
  </div>`;
}
