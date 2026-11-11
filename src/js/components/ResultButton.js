import { html } from 'https://esm.sh/htm/react';
import { PixelText } from './PixelText.js';

export function ResultButton({ label, shortcut, onClick, primary, icon }) {
  return html`<button class=${'stage-action' + (primary ? ' stage-action--challenge' : '')} onClick=${onClick}>
    ${icon && html`<img class="pixel-icon" src=${'art/ui/' + icon + '.png'} alt="" />`}
    <${PixelText}>${label}<//> <kbd><${PixelText}>${shortcut}<//></kbd>
  </button>`;
}
