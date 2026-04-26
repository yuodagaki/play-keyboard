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

  return html`
    <div class="screen endless-gameover-screen">
      <div class="endless-gameover-card">
        <div class="endless-gameover-title">ゲームオーバー</div>

        <div class="endless-gameover-stats">
          <div class="endless-gameover-stat__label">とうたつループ</div>
          <div class="endless-gameover-stat__value">${loop} ループ</div>

          <div class="endless-gameover-stat__label">さいこうレベル</div>
          <div class="endless-gameover-stat__value">Lv.${heroLevel}</div>

          <div class="endless-gameover-stat__label">たおした雑魚</div>
          <div class="endless-gameover-stat__value">${sessionMobs} たい</div>

          <div class="endless-gameover-stat__label">たおしたボス</div>
          <div class="endless-gameover-stat__value">${sessionBosses} たい</div>
        </div>

        ${isBest && html`
          <div class="endless-gameover-best">🎉 ベスト記録こうしん！</div>
        `}

        <div class="endless-gameover-btns">
          <button class="btn-ghost" onClick=${onWorldMap}>
            ワールドマップへ <span class="kbd">Esc</span>
          </button>
          <button class="btn-primary" onClick=${onRetry}>
            もういちど！ <span class="kbd">Enter</span>
          </button>
        </div>
      </div>
    </div>
  `;
}
