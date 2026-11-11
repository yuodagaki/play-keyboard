import { PixelText } from '../components/PixelText.js';
import { JourneyScene, journeys } from '../components/JourneySprites.js';
import { MistShelter } from '../components/MistSprites.js';
import { IslandSprite } from '../components/IslandSprites.js';
import { CaveSprite } from '../components/CaveSprites.js';
import { LittleKnight } from '../components/LittleKnight.js';
import { ForestBoar } from '../components/ForestSprites.js';
import { html } from 'https://esm.sh/htm/react';
import { useState, useEffect } from 'https://esm.sh/react';
import { TutorialOverlay } from '../components/TutorialOverlay.js';
import { getWorlds, getStages } from '../data/loader.js';
import { startBgm, stopBgm, playSound } from '../utils/sound.js';

function MapStars({ stars }) {
  return [1, 2, 3].map(n => html`
    <img key=${n} class=${'pixel-icon map-star' + (n > stars ? ' unearned' : '')}
      src="art/shop/star.png" alt=${n <= stars ? '★' : '☆'} />
  `);
}

function StageNode({ stage, status, stars, onClick }) {
  const btnClass = `stage-node__btn stage-node__btn--${status}`;
  const label = status === 'locked' ? html`<img class="pixel-icon" src="art/shop/lock.png" alt="" />` :
    String(stage.id).split('').map((digit, index) => html`
      <span key=${index} class="stage-digit" aria-hidden="true"
        style=${{ backgroundPositionX: (-12 * Number(digit)) + 'px' }} />
    `);

  return html`
    <div class="stage-node" onClick=${status !== 'locked' ? onClick : undefined}>
      <button class=${btnClass} aria-label=${`ステージ ${stage.id}`} disabled=${status === 'locked'}>
        ${label}
      </button>
      <div class="stage-node__stars">
        ${status === 'cleared' && html`<${MapStars} stars=${stars} />`}
      </div>
    </div>
  `;
}

function WorldSection({ world, stages, slot, onStageClick }) {
  const stageStatus = (stageId) => {
    if (stageId > slot.maxUnlocked) return 'locked';
    if (stageId === slot.maxUnlocked) return 'current';
    return 'cleared';
  };

  return html`
    <div class="world-section">
      <div class="world-section__label">
        <div class="world-section__line" style=${{ background: world.color }} />
        <div class="world-section__name" style=${{ background: world.color }}>
          <img class="pixel-icon world-marker" src=${world.icon} alt="" /> ${world.name}
        </div>
        <div class="world-section__line" style=${{ background: world.color }} />
      </div>
      ${journeys[world.id] && html`<${JourneyScene} world=${journeys[world.id]} />`}
      ${world.id === 4 && html`<${MistShelter} />`}
      ${world.id === 3 && html`
        <div class="island-trail island-scene island-ring"><i class="island-petal" aria-hidden="true" /><${IslandSprite} kind="pair" /></div>
      `}
      ${world.id === 2 && html`
        <div class="cave-trail cave-mine"><${CaveSprite} kind="chief" scene="map" /></div>
      `}
      ${world.id === 1 && html`
        <div class="forest-trail"><${ForestBoar} boss=${true} sleeping=${true} /></div>
      `}
      <div class="world-section__stages" style=${{ gap: 0 }}>
        <div class="world-section__path" style=${{ background: world.color, opacity: 0.25 }} />
        ${stages.map(stage => html`
          <${StageNode}
            key=${stage.id}
            stage=${stage}
            status=${stageStatus(stage.id)}
            stars=${slot.progress?.[stage.id]?.stars ?? 0}
            onClick=${() => onStageClick(stage, world)}
          />
        `)}
      </div>
    </div>
  `;
}

function StagePopup({ stage, world, slot, onChallenge, onClose }) {
  if (!stage) return null;
  const status = stage.id > slot.maxUnlocked ? 'locked'
               : stage.id === slot.maxUnlocked ? 'current' : 'cleared';
  const stars = slot.progress?.[stage.id]?.stars ?? 0;
  const phaseLabel = {
    A:'アルファベット', B:'ひらがな（清音）', B2:'ひらがな（濁音）', B3:'ようおん',
    C:'たんご２文字', D:'たんご３文字', E:'たんご４文字', F:'たんご５文字',
  };

  return html`
    <div class="stage-popup-overlay" onClick=${onClose}>
      <div class="stage-popup" role="dialog" aria-modal="true" aria-labelledby="stage-popup-title" onClick=${e => e.stopPropagation()}>
        <div class="stage-popup__title" id="stage-popup-title"><img class="pixel-icon world-marker" src=${world.icon} alt="" /> ステージ ${stage.id}</div>
        <div class="stage-popup__info">${phaseLabel[stage.phase] ?? stage.phase}</div>
        <div class="stage-popup__info">
          てき: ${stage.enemyCount}たい・さいだいHP ${stage.enemyMaxHP}
        </div>
        <div class="stage-popup__coins"><img class="pixel-icon" src="art/shop/coin.png" alt="コイン" /> クリア報酬: ${stage.coinReward}コイン</div>
        ${status === 'cleared' && html`
          <div class="stage-popup__stars">
            <${MapStars} stars=${stars} />
          </div>
        `}
        <div class="stage-popup__btns">
          <button class="stage-action" onClick=${onClose}>
            もどる <span class="kbd">Esc</span>
          </button>
          <button class="stage-action stage-action--challenge" onClick=${onChallenge}>
            ${status === 'cleared' ? 'もう一度！' : 'ちょうせん！'} <span class="kbd">Enter</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

export function WorldMapScreen({ slot, onSelectStage, onOpenShop, onOpenEndless, tutorialStep, onTutorialNext }) {
  const [worlds, setWorlds] = useState([]);
  const [stages, setStages] = useState([]);
  const [selectedStage, setSelectedStage] = useState(null);
  const [selectedWorld, setSelectedWorld] = useState(null);

  useEffect(() => {
    Promise.all([getWorlds(), getStages()]).then(([w, s]) => {
      setWorlds(w);
      setStages(s);
    });
  }, []);

  useEffect(() => { startBgm('map'); return stopBgm; }, []);

  useEffect(() => {
    const handler = (e) => {
      const key = e.key;
      if (selectedStage) {
        if (key === 'Escape') { setSelectedStage(null); setSelectedWorld(null); return; }
        if (key === 'Enter') { handleChallenge(); return; }
        return;
      }
      if (key === 's' || key === 'S') { onOpenShop(); return; }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedStage, onOpenShop]);

  const endlessUnlocked = slot.ownedSpecials?.includes('endless');

  const stagesFor = (world) => stages.filter(s => world.stages.includes(s.id));

  const handleStageClick = (stage, world) => {
    playSound('uiClick');
    setSelectedStage(stage);
    setSelectedWorld(world);
  };

  const handleChallenge = () => {
    if (selectedStage) { playSound('uiClick'); onSelectStage(selectedStage.id); }
  };

  return html`
    <div class="screen worldmap-screen">
      <!-- ヘッダー -->
      <div class="header">
        <div style=${{ display:'flex', alignItems:'center', gap:'12px' }}>
          <${LittleKnight} weapon=${slot.weapon} armor=${slot.armor} />
          <div>
            <div style=${{ fontSize:'13px', color:'rgba(255,255,255,0.65)', fontWeight:'700' }}>いまのそうび</div>
            <div style=${{ fontSize:'15px', color:'white', fontWeight:'900' }}>
              ⚔️ ${{ wooden:'木の剣', iron:'鉄の剣', flame:'炎の剣', thunder:'かみなりの剣', ice:'こおりの剣', dragon:'りゅうの剣', legendary:'でんせつの剣', lightsaber:'ライトセイバー', magnum:'マグナム' }[slot.weapon] ?? slot.weapon}
              🛡️ ${{ hat:'たびびとのふく', helmet:'きのよろい', cape:'くさりかたびら', armor:'てつのたて', robe:'まほうのローブ', shield:'せいなるたて', divine:'しんせいのよろい', vest:'ぼうだんチョッキ', radiant:'ひかりのよろい' }[slot.armor] ?? slot.armor}
            </div>
          </div>
        </div>

        <div style=${{ display:'flex', alignItems:'center', gap:'12px', marginLeft:'auto' }}>
          <div style=${{ fontSize:'20px', fontWeight:'900', color:'#FFD700' }}>
            <img class="pixel-icon" src="art/shop/coin.png" alt="コイン" /> ${slot.coins}
          </div>
          <button class="pixel-button" onClick=${onOpenShop}>
            <img src="art/ui/stall.png" alt="" /> ショップ <span class="kbd">S</span>
          </button>
          <button class="pixel-button" disabled=${!endlessUnlocked}
            title=${endlessUnlocked ? undefined : 'ショップで購入できるよ！'} onClick=${onOpenEndless}>
            <img src=${endlessUnlocked ? 'art/shop/endless.png' : 'art/shop/lock.png'} alt="" /> エンドレス
          </button>
        </div>
      </div>

      <!-- ワールド一覧 -->
      <div class="worldmap-body">
        ${worlds.map(world => html`
          <${WorldSection}
            key=${world.id}
            world=${world}
            stages=${stagesFor(world)}
            slot=${slot}
            onStageClick=${handleStageClick}
          />
        `)}

        <!-- エンドレス記録バッジ -->
        ${endlessUnlocked && slot.endlessRecord && html`
          <div class="endless-record-badge">
            <img class="record-trophy" src="art/ui/trophy.png" alt="" />
            <div>
              <div class="endless-record-badge__title"><${PixelText} color="#885323">エンドレス さいこうきろく<//></div>
              <div class="endless-record-badge__stats">
                <${PixelText}>${`ループ ${slot.endlessRecord.maxLoop}`}<//>
                <${PixelText}>${`Lv.${slot.endlessRecord.maxLevel}`}<//>
                <${PixelText}>${`雑魚 ${slot.endlessRecord.totalMobs}たい`}<//>
                <${PixelText}>${`ボス ${slot.endlessRecord.totalBosses}たい`}<//>
              </div>
            </div>
          </div>
        `}
      </div>

      <!-- ステージポップアップ -->
      ${selectedStage && html`
        <${StagePopup}
          stage=${selectedStage}
          world=${selectedWorld}
          slot=${slot}
          onChallenge=${handleChallenge}
          onClose=${() => { setSelectedStage(null); setSelectedWorld(null); }}
        />
      `}

      <!-- チュートリアル（ステップ1-2はワールドマップ） -->
      ${(tutorialStep === 1 || tutorialStep === 2) && html`
        <${TutorialOverlay} step=${tutorialStep} onNext=${onTutorialNext} />
      `}
    </div>
  `;
}
