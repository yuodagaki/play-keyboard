import { PixelText } from '../components/PixelText.js';
import { ResultButton } from '../components/ResultButton.js';
import { LittleKnight } from '../components/LittleKnight.js';
import { html } from 'https://esm.sh/htm/react';
import { useEffect } from 'https://esm.sh/react';

export function EndlessGameOverScreen({ result, slot, onRetry, onWorldMap }) {
  const { loop, sessionMobs, sessionBosses, heroLevel, isBest } = result;

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter') onRetry();
      if (e.key === 'Escape') onWorldMap();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onRetry, onWorldMap]);

  const stats = [
    ['とうたつループ', loop + ' ループ'],
    ['さいこうレベル', 'Lv.' + heroLevel],
    ['たおした雑魚', sessionMobs + ' たい'],
    ['たおしたボス', sessionBosses + ' たい'],
  ];
  return html`
    <div class="screen endless-gameover-screen result-screen">
      <div class="result-panel">
        <h1><${PixelText} scale=${3}>ゲームオーバー<//></h1>
        <${LittleKnight} weapon=${slot.weapon} armor=${slot.armor} pose="sad" />
        <dl class="endless-gameover-stats">
          ${stats.map(([label, value]) => html`<div key=${label}>
            <dt><${PixelText}>${label}<//></dt>
            <dd><${PixelText}>${value}<//></dd>
          </div>`)}
        </dl>
        ${isBest && html`<p><img class="result-coin" src="art/ui/trophy.png" alt="" /> <${PixelText}>ベスト記録こうしん！<//></p>`}
        <div class="result-actions">
          <${ResultButton} label="ワールドマップへ" icon="back" shortcut="Esc" onClick=${onWorldMap} />
          <${ResultButton} label="もういちど！" shortcut="Enter" primary onClick=${onRetry} />
        </div>
      </div>
    </div>
  `;
}
