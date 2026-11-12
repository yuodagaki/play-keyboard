import { RomajiGuide } from '../components/RomajiGuide.js';
import { JourneyAnimal, journeyEncounter } from '../components/JourneySprites.js';
import { MistSprite, mistEnemy, mistNames } from '../components/MistSprites.js';
import { IslandSprite, islandNames, islandEnemy } from '../components/IslandSprites.js';
import { CaveSprite, caveNames } from '../components/CaveSprites.js';
import { LittleKnight, useKnightReaction } from '../components/LittleKnight.js';
import { ForestBoar } from '../components/ForestSprites.js';
import { html } from 'https://esm.sh/htm/react';
import { useState, useEffect, useRef } from 'https://esm.sh/react';
import { EnemySVG } from '../components/EnemySVG.js';
import { KeyboardGuide } from '../components/KeyboardGuide.js';
import { TutorialOverlay } from '../components/TutorialOverlay.js';
import { createRomajiQuestion, romajiGuide } from '../utils/romaji.js';
import { getStage, getWords } from '../data/loader.js';
import { playSound, startBgm, stopBgm } from '../utils/sound.js';

const ENEMY_NAMES = {
  slime: 'スライム', mushroom: 'キノコ', goblin: 'ゴブリン',
  bat: 'コウモリ', skeleton: 'ガイコツ', golem: 'ゴーレム',
};
const WEAPON_ATK  = { wooden:1, iron:2, flame:3, thunder:4, ice:5, dragon:6, legendary:7, lightsaber:8, magnum:9 };
const ARMOR_BONUS = { hat:0.1, helmet:0.2, cape:0.3, armor:0.4, robe:0.5, shield:0.6, divine:0.7, vest:0.8, radiant:0.9 };

function hpColor(hp, max) {
  const r = hp / max;
  if (r > 0.6) return '#4CAF50';
  if (r > 0.3) return '#FFD700';
  return '#FF5252';
}

function calcCpm(correctKeys, startMs) {
  if (!startMs) return null;
  if (correctKeys < 5) return null;
  const elapsedMin = (Date.now() - startMs) / 60000;
  if (elapsedMin < 2 / 60) return null;
  return Math.round(correctKeys / elapsedMin);
}

function calcStars(acc) {
  if (acc >= 90) return 3;
  if (acc >= 70) return 2;
  if (acc >= 50) return 1;
  return 0;
}

const wordEffects = {
  ちずをひらく: 'map',
  ちずをみよう: 'map',
  みずをくもう: 'water',
};

function pickQuestion(stage, words, practiceQueue) {
  if (practiceQueue.length) return createRomajiQuestion(practiceQueue.shift());
  if (stage.phase === 'A') {
    const ch = stage.availableKeys[Math.floor(Math.random() * stage.availableKeys.length)];
    return createRomajiQuestion(ch);
  }
  if (['B', 'B2', 'B3'].includes(stage.phase)) {
    const set = stage.hiraganaSet;
    const ch = set[Math.floor(Math.random() * set.length)];
    return createRomajiQuestion(ch);
  }
  if (stage.phase === 'G') {
    const list = words?.sentences?.[stage.wordDifficulty] ?? ['ねこがいる'];
    const sentence = list[Math.floor(Math.random() * list.length)];
    return createRomajiQuestion(sentence);
  }
  const list = words?.[String(stage.wordLength)]?.[stage.wordDifficulty] ?? ['ねこ'];
  const word = list[Math.floor(Math.random() * list.length)];
  return createRomajiQuestion(word);
}

export function BattleScreen({ stageId, slot, onClear, onBack, tutorialStep, onTutorialNext }) {
  const [stage, setStage] = useState(null);
  const [words, setWords] = useState(null);
  const [enemies, setEnemies] = useState([]);
  const [enemyIdx, setEnemyIdx] = useState(0);
  const [wordEffect, setWordEffect] = useState(null);
  const [question, setQuestion] = useState(null);
  const [typed, setTyped] = useState('');
  const guide = question ? romajiGuide(question.tokens, typed) : '';
  const [correctKeys, setCorrectKeys] = useState(0);
  const [totalKeys, setTotalKeys] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [flashEnemy, setFlashEnemy] = useState(false);
  const [fallingEnemy, setFallingEnemy] = useState(false);
  const [flashError, setFlashError] = useState(false);
  const [missPulse, setMissPulse] = useState(false);
  const [reaction, reactKnight] = useKnightReaction();
  const [dmgFloats, setDmgFloats] = useState([]);
  const [done, setDone] = useState(false);
  const [showHomeGuide, setShowHomeGuide] = useState(slot.maxUnlocked === 1);
  const [cpm, setCpm] = useState(null);
  const practiceQueue = useRef([]);
  const battleStartRef = useRef(null);

  const atk = WEAPON_ATK[slot.weapon] ?? 1;


  // Load stage (and words if needed)
  useEffect(() => {
    getStage(stageId).then(s => {
      setStage(s);
      if (s && ['C', 'D', 'E', 'F', 'G'].includes(s.phase)) {
        getWords().then(setWords);
      }
    });
  }, [stageId]);

  const encounter = stage && journeyEncounter(stage, enemyIdx);
  const boss = stage?.id === 6 && enemyIdx === stage?.enemyCount - 1;
  const caveKind = stage?.id < 10 ? 'bat' : stage?.id === 12 && enemyIdx === stage?.enemyCount - 1 ? 'chief' : 'mole';
  const islandKind = islandEnemy(stage?.id, enemyIdx, stage?.enemyCount);
  const mistKind = mistEnemy(stage?.id, enemyIdx, stage?.enemyCount);
  const isBoss = boss || caveKind === 'chief' || islandKind === 'pair' || mistKind === 'deer' || encounter?.boss;
  const battleMusic = isBoss ? 'finalBoss' : 'battle';
  useEffect(() => {
    startBgm(battleMusic);
    return stopBgm;
  }, [battleMusic]);

  // Init enemies + first question
  useEffect(() => {
    if (!stage) return;
    if (['C', 'D', 'E', 'F', 'G'].includes(stage.phase) && !words) return;
    practiceQueue.current = [...(stage.practiceWords ?? [])];
    setEnemies(Array.from({ length: stage.enemyCount }, () => ({ hp: stage.enemyMaxHP })));
    setEnemyIdx(0);
    setQuestion(pickQuestion(stage, words, practiceQueue.current));
    setTyped('');
    setCorrectKeys(0);
    setTotalKeys(0);
    setAccuracy(100);
    setDone(false);
  }, [stage, words]);

  // Keydown handler (re-attached whenever relevant state changes)
  useEffect(() => {
    if (!stage || !question || fallingEnemy || done || enemies.length === 0) return;

    const handler = (e) => {
      if (tutorialStep > 0) return;
      if (showHomeGuide) { setShowHomeGuide(false); }
      if (e.key === 'Escape') { onBack(); return; }

      const key = e.key.toLowerCase();
      if (key.length !== 1 || !/[a-z;,./\-]/.test(key)) return;

      // 単語完了後の遷移待機中は入力を無視
      if (typed.length >= guide.length) return;

      const newTyped = typed + key;
      const nextGuide = romajiGuide(question.tokens, newTyped);

      if (nextGuide !== null) {
        playSound('correct');
        const newCK = correctKeys + 1;
        const newTK = totalKeys + 1;
        setCorrectKeys(newCK);
        setTotalKeys(newTK);
        setAccuracy(Math.round(newCK / newTK * 100));

        if (stage.phase !== 'A') {
          if (battleStartRef.current === null) battleStartRef.current = Date.now();
          setCpm(calcCpm(newCK, battleStartRef.current));
        }

        if (newTyped.length === nextGuide.length) {
          // 完了状態を一時表示してから遷移（複数文字のみ遅延）
          setTyped(newTyped);
          reactKnight('attack');
          const effect = wordEffects[question.text];
          if (effect) setWordEffect({ kind: effect, id: newCK });

          const newEnemies = enemies.map((en, i) =>
            i === enemyIdx ? { hp: Math.max(0, en.hp - atk) } : en
          );
          setEnemies(newEnemies);

          const floatId = Date.now();
          setDmgFloats(f => [...f, { id: floatId, value: atk }]);
          setTimeout(() => setDmgFloats(f => f.filter(x => x.id !== floatId)), 700);

          const completionDelay = nextGuide.length > 1 ? 220 : 0;

          if (newEnemies[enemyIdx].hp <= 0) {
            playSound('enemyDefeat');
            // Enemy defeated
            setFlashEnemy(true);
            setTimeout(() => {
              setFlashEnemy(false);
              setFallingEnemy(true);
              setTyped('');
              reactKnight('happy');
              setTimeout(() => {
                setFallingEnemy(false);

                const nextIdx = enemyIdx + 1;
                if (nextIdx >= enemies.length) {
                  setDone(true);
                  const finalAcc = Math.round(newCK / newTK * 100);
                  const stars = calcStars(finalAcc);
                  const bonusCoins = Math.floor(stage.coinReward * ARMOR_BONUS[slot.armor]);
                  const finalCpm = calcCpm(newCK, battleStartRef.current) ?? 0;
                  onClear({ stageId, stars, coinReward: stage.coinReward, bonusCoins, accuracy: finalAcc, cpm: finalCpm, misses: newTK - newCK });
                } else {
                  setEnemyIdx(nextIdx);
                  setQuestion(pickQuestion(stage, words, practiceQueue.current));
                }
              }, 520);
            }, 150);
          } else {
            playSound('wordComplete');
            setFlashEnemy(true);
            setTimeout(() => setFlashEnemy(false), 180);
            setTimeout(() => {
              setTyped('');
              setQuestion(pickQuestion(stage, words, practiceQueue.current));
            }, completionDelay);
          }
        } else {
          setTyped(newTyped);
        }
      } else {
        playSound('miss');
        // Miss — keep typed as-is (retry from the wrong character)
        const newTK = totalKeys + 1;
        setTotalKeys(newTK);
        setAccuracy(correctKeys === 0 ? 0 : Math.round(correctKeys / newTK * 100));
        setFlashError(true);
        setMissPulse(true);
        reactKnight('sad');
        setTimeout(() => {
          setFlashError(false);
          setMissPulse(false);

        }, 350);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [stage, question, typed, fallingEnemy, done, enemies, enemyIdx,
      correctKeys, totalKeys, showHomeGuide, atk, words, tutorialStep]);

  if (!stage || !question || enemies.length === 0) {
    return html`
      <div class="screen battle-screen" style=${{ alignItems:'center', justifyContent:'center' }}>
        <div style=${{ fontSize:'24px', color:'var(--color-muted)' }}>よみこみちゅう...</div>
      </div>
    `;
  }

  const currentEnemy = enemies[enemyIdx] ?? { hp: 0 };
  const hpRatio = Math.max(0, currentEnemy.hp / stage.enemyMaxHP);
  const accClass = accuracy >= 90 ? 'good' : accuracy >= 70 ? 'ok' : 'bad';
  const isPhaseA = stage.phase === 'A';
  const showCpm = !isPhaseA;
  const nextChar = guide[typed.length]?.toUpperCase() ?? '';
  const forest = stage.world === 1;
  const cave = stage.world === 2;
  const island = stage.world === 3;
  const islandScene = stage.id < 16 ? 'shore' : stage.id < 19 ? 'camellia' : 'ring';
  const mist = stage.world === 4;
  const mistScene = stage.id === 22 ? 'pond' : stage.id === 23 ? 'bank' : 'grove';
  const enemyName = encounter ? encounter.name : mist ? mistNames[mistKind] : island ? islandNames[islandKind] : cave ? caveNames[caveKind] : forest ? (boss ? '大イノシシ' : 'うりぼう') : ENEMY_NAMES[stage.enemyType] ?? 'モンスター';

  return html`
    <div class="screen battle-screen">
      <!-- ステータスバー -->
      <div class="battle-status">
        <button class="pixel-button" onClick=${onBack}><img src="art/ui/back.png" alt="" /> もどる <span class="kbd">Esc</span></button>
        <span>ステージ ${stage.id}</span>
        <span class=${'battle-status__accuracy--' + accClass}>
          せいかく: ${accuracy}%
        </span>
        ${showCpm && html`
          <span class="battle-status__cpm">
            ⚡ ${cpm !== null ? cpm : '--'}
          </span>
        `}
        <span style=${{ marginLeft:'auto' }}><img class="pixel-icon" src="art/shop/coin.png" alt="コイン" /> ${slot.coins}</span>
      </div>

      <!-- バトルゾーン -->
      <div style=${encounter ? { backgroundImage: "url(art/journey/" + encounter.scene + ".png)" } : undefined} class=${encounter ? "battle-zone journey-arena arena-" + encounter.scene + " journey-stage-" + stage.id : mist ? "battle-zone mist-arena mist-" + mistScene : island ? "battle-zone island-scene island-" + islandScene : forest ? "battle-zone forest-clearing" : cave ? "battle-zone cave-arena " + (caveKind === "bat" ? "cave-pool" : "cave-mine") : "battle-zone"}>
        <!-- ヒーロー -->
        <div class="battle-hero">
          ${wordEffect && html`<span key=${wordEffect.id} aria-hidden="true"
            class=${'practice-effect practice-effect--' + wordEffect.kind}
            onAnimationEnd=${() => setWordEffect(current => current === wordEffect ? null : current)} />`}
          <div class="battle-hero__label">リトルナイト</div>
          <${LittleKnight} key=${reaction.id} weapon=${slot.weapon} armor=${slot.armor} pose=${reaction.pose} />
        </div>

        <div class="battle-zone__divider" />

        <!-- てき -->
        <div class="battle-enemy">
          <div class="battle-enemy__label">
            ${enemyName}（${enemyIdx + 1} / ${enemies.length}）
          </div>
          <div class="battle-enemy__hp-wrap">
            <div class="battle-enemy__hp-header">
              <span>HP</span>
              <span>${Math.max(0, currentEnemy.hp)} / ${stage.enemyMaxHP}</span>
            </div>
            <div class="battle-enemy__hp-track">
              <div class="battle-enemy__hp-fill" style=${{
                width: `${hpRatio * 100}%`,
                background: hpColor(currentEnemy.hp, stage.enemyMaxHP),
              }} />
            </div>
          </div>

          <div style=${{ position: 'relative', marginTop: '28px' }}>
            ${encounter ? html`<${JourneyAnimal} actor=${encounter.actor} boss=${encounter.boss} flash=${flashEnemy} falling=${fallingEnemy} />` : mist ? html`<${MistSprite} kind=${mistKind} flash=${flashEnemy} falling=${fallingEnemy} />` : island ? html`<${IslandSprite} kind=${islandKind} flash=${flashEnemy} falling=${fallingEnemy} />` : cave ? html`<${CaveSprite} kind=${caveKind} flash=${flashEnemy} falling=${fallingEnemy} />` : forest ? html`<${ForestBoar} boss=${boss} flash=${flashEnemy} falling=${fallingEnemy} />` : html`<${EnemySVG} type=${stage.enemyType} flash=${flashEnemy} falling=${fallingEnemy} />`}
            ${dmgFloats.map(f => html`
              <div key=${f.id} style=${{ position:'absolute', top:'30px', left:0, right:0, display:'flex', justifyContent:'center', pointerEvents:'none' }}>
                <div class="dmg-float">-${f.value}</div>
              </div>
            `)}
          </div>
        </div>
      </div>

      <!-- 出題エリア -->
      <div class=${'battle-question' + (missPulse ? ' battle-question--miss' : '')}>
        ${isPhaseA ? html`
          <div class="battle-question__alpha">${question.text.toUpperCase()}</div>
        ` : html`
          <div class="battle-question__hira">${question.text}</div>
          <${RomajiGuide} guide=${guide} typed=${typed} />
        `}

        <!-- てき残数ドット -->
        <div style=${{ position:'absolute', bottom:'8px', right:'16px', display:'flex', gap:'5px' }}>
          ${enemies.map((_, i) => html`
            <div key=${i} style=${{
              width: 10, height: 10, borderRadius: '50%',
              background: i < enemyIdx ? '#B0BEC5' : i === enemyIdx ? 'var(--color-secondary)' : '#E0E0E0',
              transition: 'background 0.2s',
            }} />
          `)}
        </div>

        <!-- ホームポジション初回ガイド -->
        ${showHomeGuide && html`
          <div class="home-pos-tooltip">
            まず「F」と「J」に ひとさしゆびをおいてね！
          </div>
        `}
      </div>

      <!-- キーボードガイド -->
      <${KeyboardGuide}
        nextChar=${nextChar}
        availableKeys=${isPhaseA ? stage.availableKeys : ''}
        flashError=${flashError}
      />

      <!-- チュートリアル（ステップ3-4はバトル画面） -->
      ${(tutorialStep === 3 || tutorialStep === 4) && html`
        <${TutorialOverlay} step=${tutorialStep} onNext=${onTutorialNext} />
      `}
    </div>
  `;
}
