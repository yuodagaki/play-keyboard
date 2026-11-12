import { ResultButton } from '../components/ResultButton.js';
import { PixelText } from '../components/PixelText.js';
import { JourneyScene, journeys } from '../components/JourneySprites.js';
import { MistShelter } from '../components/MistSprites.js';
import { IslandSprite } from '../components/IslandSprites.js';
import { CaveSprite } from '../components/CaveSprites.js';
import { LittleKnight } from '../components/LittleKnight.js';
import { html } from 'https://esm.sh/htm/react';
import { useState, useEffect } from 'https://esm.sh/react';
import { Confetti } from '../components/Confetti.js';
import { playSound } from '../utils/sound.js';

const ARMOR_BONUS_PCT = { hat:10, helmet:20, cape:30, armor:40, robe:50, shield:60, divine:70, vest:80, radiant:90 };

function cpmRank(cpm) {
  if (cpm >= 150) return { rank: 'S', label: 'チャンピオン！', color: '#E53935' };
  if (cpm >= 100) return { rank: 'A', label: 'すごい！',        color: '#FF8F00' };
  if (cpm >= 60)  return { rank: 'B', label: 'はやい！',          color: '#4CAF50' };
  if (cpm >= 30)  return { rank: 'C', label: 'ふつう',              color: '#546E7A' };
  return           { rank: 'D', label: 'ゆっくり',                  color: '#90A4AE' };
}

function StarRow({ stars }) {
  return html`<div class="result-stars" role="img" aria-label=${'星 ' + stars + ' / 3'}>
    ${[1, 2, 3].map(n => html`<img key=${n} class=${n <= stars ? 'earned' : 'unearned'}
      style=${{ animationDelay: (n - 1) * .12 + 's' }} src="art/shop/star.png" alt="" />`)}
  </div>`;
}

export function StageClearScreen({ result, slot, onOpenShop, onNext, onWorldMap, onRetry }) {
  const { stageId, stars, coinReward, bonusCoins, accuracy, cpm = 0, prevBestCpm = 0 } = result;
  const totalCoins = coinReward + bonusCoins;
  const journey = Object.values(journeys).find(world => world.last === stageId);
  const isFail = stars === 0;
  const isNewCpmRecord = cpm > 0 && cpm > prevBestCpm;
  const rankInfo = cpm > 0 ? cpmRank(cpm) : null;

  const [displayCoins, setDisplayCoins] = useState(0);

  const [victoryParade, setVictoryParade] = useState(stageId === 56 && !isFail);
  useEffect(() => {
    if (!victoryParade) return;
    const timer = setTimeout(() => setVictoryParade(false), 2800);
    return () => clearTimeout(timer);
  }, [victoryParade]);

  useEffect(() => {
    playSound(isFail ? 'stageFail' : 'stageClear');
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const key = e.key.toLowerCase();
      if (!isFail && key === 's') { onOpenShop(); return; }
      if (key === 'm') { onWorldMap(); return; }
      if (!isFail && key === 'n') { onNext(); return; }
      if (isFail && key === 'r') { onRetry(); return; }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onOpenShop, onNext, onWorldMap, onRetry, isFail]);

  useEffect(() => {
    if (isFail) return;
    let start = null;
    let prevCoins = 0;
    const duration = 1200;
    let raf;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const newCoins = Math.floor(totalCoins * progress);
      if (Math.floor(newCoins / 50) > Math.floor(prevCoins / 50)) {
        playSound('coinCount');
      }
      prevCoins = newCoins;
      setDisplayCoins(newCoins);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [totalCoins, isFail]);

  if (victoryParade) {
    return html`<div class="screen journey-finale">
      <${JourneyScene} world=${journey}><${LittleKnight} weapon=${slot.weapon} armor=${slot.armor} pose="happy" /><//>
    </div>`;
  }

  if (isFail) {
    return html`<div class="screen fail-screen result-screen"><div class="result-panel">
      <h1><${PixelText} scale=${2}>もう少し！<//></h1>
      <div><${PixelText}>${'せいかくさ ' + accuracy + '%'}<//></div>
      <div><${PixelText}>せいかく50%いじょうでクリアだよ！<//></div>
      <${LittleKnight} weapon=${slot.weapon} armor=${slot.armor} pose="sad" />
      <div class="result-actions">
        <${ResultButton} label="マップへもどる" icon="back" shortcut="M" onClick=${onWorldMap} />
        <${ResultButton} label="もう一度！" shortcut="R" primary onClick=${onRetry} />
      </div>
    </div></div>`;
  }

  return html`
    <div class="screen clear-screen result-screen">
      <${Confetti} />
      <div class="result-panel">
        <h1><${PixelText} scale=${3} color="#66422c">ステージクリア！<//></h1>
        <div><${PixelText}>${'ステージ ' + stageId}<//></div>
        <div><${PixelText}>${'せいかくさ ' + accuracy + '% で ほし ' + stars + 'こ！'}<//></div>
        <${StarRow} stars=${stars} />
        <div class="result-cards">
          <div class="result-card">
            <div><${PixelText}>コイン獲得<//></div>
            <div><img class="result-coin" src="art/shop/coin.png" alt="" /> <${PixelText} scale=${2} color="#895027">${'+' + displayCoins}<//></div>
            ${bonusCoins > 0 && html`<div><${PixelText}>${'ボーナス +' + bonusCoins + '（' + ARMOR_BONUS_PCT[slot.armor] + '%）'}<//></div>`}
          </div>
          ${rankInfo && html`<div class="result-card">
            <div><${PixelText}>1ぷんに<//></div>
            <div><${PixelText} scale=${2}>${cpm + 'かい'}<//></div>
            <div><${PixelText}>うてたよ！<//></div>
            <div><${PixelText}>${rankInfo.rank + ' ' + rankInfo.label}<//></div>
            ${isNewCpmRecord && html`<div><${PixelText} color="#885225">じこベスト！<//></div>`}
          </div>`}
        </div>
        <!-- ヒーロー -->
        ${journey ? html`<${JourneyScene} world=${journey}><${LittleKnight} weapon=${slot.weapon} armor=${slot.armor} pose="happy" /><//>` : stageId === 25 ? html`<${MistShelter}><${LittleKnight} weapon=${slot.weapon} armor=${slot.armor} pose="happy" /></${MistShelter}>` : html`<div class=${stageId === 21 ? "island-farewell island-scene island-ring" : stageId === 12 ? "cave-farewell cave-mine" : ""} style=${{ marginBottom:'24px' }}>
          <${LittleKnight} weapon=${slot.weapon} armor=${slot.armor} pose="happy" />
          ${stageId === 21 && html`<${IslandSprite} kind="pair" />`}
          ${stageId === 12 && html`<${CaveSprite} kind="chief" scene="exit" />`}
        </div>`}

        <div class="result-actions">
          <${ResultButton} label="マップへもどる" icon="back" shortcut="M" onClick=${onWorldMap} />
          <${ResultButton} label="どうぐ屋へ" icon="stall" shortcut="S" onClick=${onOpenShop} />
          <${ResultButton} label="つぎへすすむ" shortcut="N" primary onClick=${onNext} />
        </div>
      </div>
    </div>
  `;
}
