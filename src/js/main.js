import { html } from 'https://esm.sh/htm/react';
import { useState, useEffect } from 'https://esm.sh/react';
import { createRoot } from 'https://esm.sh/react-dom/client';

import { saveSlot } from './utils/save.js';
import { preloadAll } from './data/loader.js';

import { TitleScreen }            from './screens/TitleScreen.js';
import { WorldMapScreen }         from './screens/WorldMapScreen.js';
import { BattleScreen }           from './screens/BattleScreen.js';
import { StageClearScreen }       from './screens/StageClearScreen.js';
import { ShopScreen }             from './screens/ShopScreen.js';
import { EndlessScreen }          from './screens/EndlessScreen.js';
import { EndlessGameOverScreen }  from './screens/EndlessGameOverScreen.js';

function useViewportScale() {
  const calc = () => Math.min(window.innerWidth / 1280, window.innerHeight / 720);
  const [scale, setScale] = useState(calc);
  useEffect(() => {
    const update = () => setScale(calc());
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return scale;
}

function App() {
  const scale = useViewportScale();
  const [screen, setScreen] = useState('title');
  const [slot, setSlot] = useState(null);
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [clearResult, setClearResult] = useState(null);
  const [endlessResult, setEndlessResult] = useState(null);
  const [tutorialStep, setTutorialStep] = useState(() =>
    localStorage.getItem('kba-tutorial-done') ? 0 : 1
  );

  // Preload JSON data on mount
  useEffect(() => { preloadAll(); }, []);

  // ─── ハンドラー ───────────────────────────────────────────

  const handleSelectSlot = (s) => {
    setSlot(s);
    setScreen('worldmap');
  };

  const handleSelectStage = (stageId) => {
    setSelectedStageId(stageId);
    setScreen('battle');
  };

  const handleBattleClear = (result) => {
    const { stageId, stars, coinReward, bonusCoins } = result;
    const isFail = stars === 0;

    let newSlot = slot;
    if (!isFail) {
      const totalCoins = coinReward + bonusCoins;
      const existingStars = slot.progress?.[stageId]?.stars ?? 0;
      const newProgress = {
        ...slot.progress,
        [stageId]: { stars: Math.max(existingStars, stars) },
      };
      const newMaxUnlocked = stageId === slot.maxUnlocked
        ? Math.min(slot.maxUnlocked + 1, 56)
        : slot.maxUnlocked;

      newSlot = {
        ...slot,
        coins: slot.coins + totalCoins,
        progress: newProgress,
        maxUnlocked: newMaxUnlocked,
      };
      setSlot(newSlot);
      saveSlot(newSlot);
    }

    setClearResult(result);
    setScreen('stageclear');
  };

  const handleBattleBack = () => setScreen('worldmap');

  const handleClearNext = () => {
    const nextId = clearResult.stageId + 1;
    if (nextId <= 56) {
      handleSelectStage(nextId);
    } else {
      setScreen('worldmap');
    }
  };

  const handleClearWorldMap = () => setScreen('worldmap');

  const handleClearRetry = () => {
    setSelectedStageId(clearResult.stageId);
    setScreen('battle');
  };

  const handleOpenShop    = () => setScreen('shop');
  const handleOpenEndless = () => setScreen('endless');

  const handleEndlessGameOver = (result) => {
    const { loop, sessionMobs, sessionBosses, heroLevel } = result;
    const prev = slot.endlessRecord;
    const newRecord = {
      maxLoop:     Math.max(prev?.maxLoop    ?? 0, loop),
      maxLevel:    Math.max(prev?.maxLevel   ?? 0, heroLevel),
      totalMobs:   (prev?.totalMobs   ?? 0) + sessionMobs,
      totalBosses: (prev?.totalBosses ?? 0) + sessionBosses,
    };
    const isBest = newRecord.maxLoop > (prev?.maxLoop ?? 0) || newRecord.maxLevel > (prev?.maxLevel ?? 0);
    const newSlot = { ...slot, endlessRecord: newRecord };
    setSlot(newSlot);
    saveSlot(newSlot);
    setEndlessResult({ ...result, isBest });
    setScreen('endlessgameover');
  };

  const handleEndlessRetry    = () => setScreen('endless');
  const handleEndlessWorldMap = () => setScreen('worldmap');

  const handleBuy = (type, item) => {
    const newSlot = type === 'weapon'
      ? {
          ...slot,
          coins: slot.coins - item.cost,
          weapon: item.id,
          ownedWeapons: [...(slot.ownedWeapons ?? []), item.id],
        }
      : {
          ...slot,
          coins: slot.coins - item.cost,
          armor: item.id,
          ownedArmors: [...(slot.ownedArmors ?? []), item.id],
        };
    setSlot(newSlot);
    saveSlot(newSlot);
  };

  const handleEquip = (type, item) => {
    const newSlot = type === 'weapon'
      ? { ...slot, weapon: item.id }
      : { ...slot, armor: item.id };
    setSlot(newSlot);
    saveSlot(newSlot);
  };

  const handleBuySpecial = (item) => {
    const newSlot = {
      ...slot,
      coins: slot.coins - item.cost,
      ownedSpecials: [...(slot.ownedSpecials ?? []), item.id],
    };
    setSlot(newSlot);
    saveSlot(newSlot);
  };

  const handleShopClose = () => setScreen('worldmap');

  const handleTutorialNext = () => {
    setTutorialStep(prev => {
      const next = prev + 1;
      if (next > 4) {
        localStorage.setItem('kba-tutorial-done', '1');
        return 0;
      }
      return next;
    });
  };

  // ─── レンダリング ─────────────────────────────────────────

  const renderScreen = () => {
    if (screen === 'title') {
      return html`<${TitleScreen} onSelectSlot=${handleSelectSlot} />`;
    }
    if (screen === 'worldmap' && slot) {
      return html`
        <${WorldMapScreen}
          slot=${slot}
          onSelectStage=${handleSelectStage}
          onOpenShop=${handleOpenShop}
          onOpenEndless=${handleOpenEndless}
          tutorialStep=${tutorialStep}
          onTutorialNext=${handleTutorialNext}
        />
      `;
    }
    if (screen === 'battle' && slot && selectedStageId) {
      return html`
        <${BattleScreen}
          stageId=${selectedStageId}
          slot=${slot}
          onClear=${handleBattleClear}
          onBack=${handleBattleBack}
          tutorialStep=${tutorialStep}
          onTutorialNext=${handleTutorialNext}
        />
      `;
    }
    if (screen === 'stageclear' && clearResult && slot) {
      return html`
        <${StageClearScreen}
          result=${clearResult}
          slot=${slot}
          onNext=${handleClearNext}
          onWorldMap=${handleClearWorldMap}
          onRetry=${handleClearRetry}
        />
      `;
    }
    if (screen === 'shop' && slot) {
      return html`
        <${ShopScreen}
          slot=${slot}
          onBuy=${handleBuy}
          onEquip=${handleEquip}
          onBuySpecial=${handleBuySpecial}
          onClose=${handleShopClose}
        />
      `;
    }
    if (screen === 'endless' && slot) {
      return html`
        <${EndlessScreen}
          slot=${slot}
          onGameOver=${handleEndlessGameOver}
          onBack=${handleEndlessWorldMap}
        />
      `;
    }
    if (screen === 'endlessgameover' && endlessResult && slot) {
      return html`
        <${EndlessGameOverScreen}
          result=${endlessResult}
          slot=${slot}
          onRetry=${handleEndlessRetry}
          onWorldMap=${handleEndlessWorldMap}
        />
      `;
    }
    return null;
  };

  return html`
    <div class="game-viewport" style=${{
      transform: `scale(${scale})`,
      transformOrigin: 'center center',
    }}>
      ${renderScreen()}
    </div>
  `;
}

const root = createRoot(document.getElementById('root'));
root.render(html`<${App} />`);
