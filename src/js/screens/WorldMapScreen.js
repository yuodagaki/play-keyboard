import { html } from 'https://esm.sh/htm/react';
import { useState, useEffect } from 'https://esm.sh/react';
import { StickFigure } from '../components/StickFigure.js';
import { TutorialOverlay } from '../components/TutorialOverlay.js';
import { getWorlds, getStages } from '../data/loader.js';

function StageNode({ stage, status, stars, onClick }) {
  const btnClass = `stage-node__btn stage-node__btn--${status}`;
  const label = status === 'locked' ? '🔒' : stage.id;

  return html`
    <div class="stage-node" onClick=${status !== 'locked' ? onClick : undefined}>
      <button class=${btnClass} disabled=${status === 'locked'}>
        ${label}
      </button>
      <div class="stage-node__stars">
        ${status === 'cleared' && [1,2,3].map(n => html`
          <span key=${n} style=${{ fontSize:'12px' }}>${n <= stars ? '⭐' : '☆'}</span>
        `)}
      </div>
      <div class="stage-node__id">
        ${status !== 'locked' ? `S${stage.id}` : ''}
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
          ${world.emoji} ${world.name}
        </div>
        <div class="world-section__line" style=${{ background: world.color }} />
      </div>
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
      <div class="stage-popup" onClick=${e => e.stopPropagation()}>
        <div class="stage-popup__title">${world.emoji} ステージ ${stage.id}</div>
        <div class="stage-popup__info">${phaseLabel[stage.phase] ?? stage.phase}</div>
        <div class="stage-popup__info">
          てき: ${stage.enemyCount}たい・さいだいHP ${stage.enemyMaxHP}
        </div>
        <div class="stage-popup__coins">💰 クリア報酬: ${stage.coinReward}コイン</div>
        ${status === 'cleared' && html`
          <div class="stage-popup__stars">
            ${[1,2,3].map(n => html`<span key=${n}>${n <= stars ? '⭐' : '☆'}</span>`)}
          </div>
        `}
        <div class="stage-popup__btns">
          <button class="btn-ghost" onClick=${onClose}>
            もどる <span class="kbd">Esc</span>
          </button>
          <button class="btn-primary" onClick=${onChallenge}>
            ${status === 'cleared' ? 'もう一度！' : 'ちょうせん！'} <span class="kbd">Enter</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

export function WorldMapScreen({ slot, onSelectStage, onOpenShop, tutorialStep, onTutorialNext }) {
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

  const stagesFor = (world) => stages.filter(s => world.stages.includes(s.id));

  const handleStageClick = (stage, world) => {
    setSelectedStage(stage);
    setSelectedWorld(world);
  };

  const handleChallenge = () => {
    if (selectedStage) onSelectStage(selectedStage.id);
  };

  return html`
    <div class="screen worldmap-screen">
      <!-- ヘッダー -->
      <div class="header">
        <div style=${{ display:'flex', alignItems:'center', gap:'12px' }}>
          <svg width="44" height="52" viewBox="0 0 120 160" style=${{ overflow:'visible' }}>
            <${StickFigure} weapon=${slot.weapon} armor=${slot.armor} pose="idle" color="white" />
          </svg>
          <div>
            <div style=${{ fontSize:'13px', color:'rgba(255,255,255,0.65)', fontWeight:'700' }}>${slot.name}</div>
            <div style=${{ fontSize:'15px', color:'white', fontWeight:'900' }}>
              ⚔️ ${{ wooden:'木の剣', iron:'鉄の剣', flame:'炎の剣', thunder:'かみなりの剣', ice:'こおりの剣', dragon:'りゅうの剣', legendary:'でんせつの剣' }[slot.weapon] ?? slot.weapon}
              🛡️ ${{ hat:'ぼうし', helmet:'かぶと', cape:'マント', armor:'よろい', robe:'まほうのローブ', shield:'せいなるたて', divine:'しんせいのよろい' }[slot.armor] ?? slot.armor}
            </div>
          </div>
        </div>

        <div style=${{ display:'flex', alignItems:'center', gap:'20px', marginLeft:'auto' }}>
          <div style=${{ fontSize:'20px', fontWeight:'900', color:'#FFD700' }}>
            💰 ${slot.coins}
          </div>
          <button class="btn-secondary" onClick=${onOpenShop}>
            🛒 ショップ <span class="kbd">S</span>
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
