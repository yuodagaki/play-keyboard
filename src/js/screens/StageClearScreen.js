import { html } from 'https://esm.sh/htm/react';
import { useState, useEffect } from 'https://esm.sh/react';
import { StickFigure } from '../components/StickFigure.js';
import { Confetti } from '../components/Confetti.js';

const ARMOR_BONUS_PCT = { hat: 10, helmet: 20, cape: 30 };

function StarRow({ stars }) {
  return html`
    <div style=${{ display:'flex', gap:'12px', justifyContent:'center', margin:'16px 0' }}>
      ${[1, 2, 3].map(n => html`
        <span key=${n} style=${{
          fontSize: '52px',
          filter: n <= stars ? 'none' : 'grayscale(1) opacity(0.3)',
          animation: n <= stars ? `star-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) ${(n - 1) * 0.12}s both` : 'none',
        }}>⭐</span>
      `)}
    </div>
  `;
}

export function StageClearScreen({ result, slot, onNext, onWorldMap, onRetry }) {
  const { stageId, stars, coinReward, bonusCoins, accuracy } = result;
  const totalCoins = coinReward + bonusCoins;
  const isFail = stars === 0;

  const [displayCoins, setDisplayCoins] = useState(0);

  useEffect(() => {
    const handler = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'm') { onWorldMap(); return; }
      if (!isFail && key === 'n') { onNext(); return; }
      if (isFail && key === 'r') { onRetry(); return; }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onNext, onWorldMap, onRetry, isFail]);

  useEffect(() => {
    if (isFail) return;
    let start = null;
    const duration = 1200;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setDisplayCoins(Math.floor(totalCoins * progress));
      if (progress < 1) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [totalCoins, isFail]);

  if (isFail) {
    return html`
      <div class="screen fail-screen">
        <div style=${{ textAlign:'center' }}>
          <div style=${{ fontSize:'64px', marginBottom:'16px' }}>😓</div>
          <div style=${{ fontSize:'36px', fontWeight:'900', color:'var(--color-text)', marginBottom:'8px' }}>
            もう少し！
          </div>
          <div style=${{ fontSize:'18px', color:'var(--color-muted)', marginBottom:'6px' }}>
            せいかく: ${accuracy}%
          </div>
          <div style=${{ fontSize:'16px', color:'var(--color-muted)', marginBottom:'32px' }}>
            せいかく50%いじょうでクリアだよ！
          </div>
          <svg width="120" height="140" viewBox="0 0 120 160" style=${{ overflow:'visible', marginBottom:'24px' }}>
            <${StickFigure} weapon=${slot.weapon} armor=${slot.armor} pose="scratch" />
          </svg>
          <div style=${{ display:'flex', gap:'16px', justifyContent:'center' }}>
            <button class="btn-ghost" onClick=${onWorldMap}>
              マップへもどる <span class="kbd">M</span>
            </button>
            <button class="btn-primary" onClick=${onRetry}>
              もう一度！ <span class="kbd">R</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  return html`
    <div class="screen clear-screen">
      <${Confetti} />

      <div style=${{ textAlign:'center', position:'relative', zIndex:1 }}>
        <div style=${{ fontSize:'48px', fontWeight:'900', color:'var(--color-text)', marginBottom:'4px' }}>
          ステージクリア！
        </div>
        <div style=${{ fontSize:'18px', color:'var(--color-muted)', marginBottom:'4px' }}>
          ステージ ${stageId}
        </div>

        <${StarRow} stars=${stars} />

        <div style=${{ fontSize:'16px', color:'var(--color-muted)', marginBottom:'20px' }}>
          せいかく: ${accuracy}%
        </div>

        <!-- コイン獲得 -->
        <div style=${{
          background: 'white',
          borderRadius: '20px',
          padding: '20px 40px',
          display: 'inline-block',
          boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
          marginBottom: '24px',
        }}>
          <div style=${{ fontSize:'14px', color:'var(--color-muted)', fontWeight:'700', marginBottom:'4px' }}>
            コイン獲得
          </div>
          <div style=${{ fontSize:'42px', fontWeight:'900', color:'#F57F17', animation:'coin-bounce 0.5s ease-out' }}>
            +${displayCoins} 💰
          </div>
          ${bonusCoins > 0 && html`
            <div style=${{ fontSize:'13px', color:'var(--color-success)', fontWeight:'700', marginTop:'4px' }}>
              ボーナス +${bonusCoins}（${ARMOR_BONUS_PCT[slot.armor]}%）
            </div>
          `}
        </div>

        <!-- ヒーロー -->
        <div style=${{ marginBottom:'24px' }}>
          <svg width="120" height="140" viewBox="0 0 120 160" style=${{ overflow:'visible' }}>
            <${StickFigure}
              weapon=${slot.weapon}
              armor=${slot.armor}
              pose="victory"
              animStyle=${{ animation: 'idle-bob 2s ease-in-out infinite' }}
            />
          </svg>
        </div>

        <div style=${{ display:'flex', gap:'16px', justifyContent:'center' }}>
          <button class="btn-ghost" onClick=${onWorldMap}>
            マップへもどる <span class="kbd">M</span>
          </button>
          <button class="btn-primary" onClick=${onNext}>
            つぎへすすむ ▶ <span class="kbd">N</span>
          </button>
        </div>
      </div>
    </div>
  `;
}
