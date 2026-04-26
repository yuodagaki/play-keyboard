import { html } from 'https://esm.sh/htm/react';
import { useState, useEffect } from 'https://esm.sh/react';
import { StickFigure } from '../components/StickFigure.js';
import { EnemySVG } from '../components/EnemySVG.js';
import { KeyboardGuide } from '../components/KeyboardGuide.js';
import { TutorialOverlay } from '../components/TutorialOverlay.js';
import { toRomaji } from '../utils/romaji.js';
import { getStage, getWords } from '../data/loader.js';

const ENEMY_NAMES = {
  slime: 'スライム', mushroom: 'キノコ', goblin: 'ゴブリン',
  bat: 'コウモリ', skeleton: 'ガイコツ', golem: 'ゴーレム',
};
const WEAPON_ATK  = { wooden:1, iron:2, flame:3, thunder:4, ice:5, dragon:6, legendary:7 };
const ARMOR_BONUS = { hat:0.1, helmet:0.2, cape:0.3, armor:0.4, robe:0.5, shield:0.6, divine:0.7 };

const ATTACK_ANIMS = [
  { css: 'attack-lunge 0.40s ease-out',  dur: 400 },
  { css: 'attack-spin  0.50s ease-out',  dur: 500 },
  { css: 'attack-jump  0.55s ease-out',  dur: 550 },
  { css: 'attack-slash 0.45s ease-out',  dur: 450 },
  { css: 'attack-thrust 0.42s ease-out', dur: 420 },
];
function pickAttack() {
  return ATTACK_ANIMS[Math.floor(Math.random() * ATTACK_ANIMS.length)];
}

function hpColor(hp, max) {
  const r = hp / max;
  if (r > 0.6) return '#4CAF50';
  if (r > 0.3) return '#FFD700';
  return '#FF5252';
}

function calcStars(acc) {
  if (acc >= 90) return 3;
  if (acc >= 70) return 2;
  if (acc >= 50) return 1;
  return 0;
}

function pickQuestion(stage, words) {
  if (stage.phase === 'A') {
    const ch = stage.availableKeys[Math.floor(Math.random() * stage.availableKeys.length)];
    return { text: ch, romaji: ch.toLowerCase() };
  }
  if (['B', 'B2', 'B3'].includes(stage.phase)) {
    const set = stage.hiraganaSet;
    const ch = set[Math.floor(Math.random() * set.length)];
    return { text: ch, romaji: toRomaji(ch) };
  }
  if (stage.phase === 'G') {
    const list = words?.sentences?.[stage.wordDifficulty] ?? ['ねこがいる'];
    const sentence = list[Math.floor(Math.random() * list.length)];
    return { text: sentence, romaji: toRomaji(sentence) };
  }
  const list = words?.[String(stage.wordLength)]?.[stage.wordDifficulty] ?? ['ねこ'];
  const word = list[Math.floor(Math.random() * list.length)];
  return { text: word, romaji: toRomaji(word) };
}

export function BattleScreen({ stageId, slot, onClear, onBack, tutorialStep, onTutorialNext }) {
  const [stage, setStage] = useState(null);
  const [words, setWords] = useState(null);
  const [enemies, setEnemies] = useState([]);
  const [enemyIdx, setEnemyIdx] = useState(0);
  const [question, setQuestion] = useState(null);
  const [typed, setTyped] = useState('');
  const [correctKeys, setCorrectKeys] = useState(0);
  const [totalKeys, setTotalKeys] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [flashEnemy, setFlashEnemy] = useState(false);
  const [fallingEnemy, setFallingEnemy] = useState(false);
  const [heroAnim, setHeroAnim] = useState('idle');
  const [flashError, setFlashError] = useState(false);
  const [missPulse, setMissPulse] = useState(false);
  const [dmgFloats, setDmgFloats] = useState([]);
  const [done, setDone] = useState(false);
  const [showHomeGuide, setShowHomeGuide] = useState(slot.maxUnlocked === 1);

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

  // Init enemies + first question
  useEffect(() => {
    if (!stage) return;
    if (['C', 'D', 'E', 'F', 'G'].includes(stage.phase) && !words) return;
    setEnemies(Array.from({ length: stage.enemyCount }, () => ({ hp: stage.enemyMaxHP })));
    setEnemyIdx(0);
    setQuestion(pickQuestion(stage, words));
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
      if (typed.length >= question.romaji.length) return;

      const targetChar = question.romaji[typed.length];

      if (key === targetChar) {
        const newCK = correctKeys + 1;
        const newTK = totalKeys + 1;
        setCorrectKeys(newCK);
        setTotalKeys(newTK);
        setAccuracy(Math.round(newCK / newTK * 100));

        const newTyped = typed + key;
        if (newTyped.length >= question.romaji.length) {
          // 完了状態を一時表示してから遷移（複数文字のみ遅延）
          setTyped(newTyped);
          const atk_anim = pickAttack();
          setHeroAnim(atk_anim.css);
          setTimeout(() => setHeroAnim('idle'), atk_anim.dur);

          const newEnemies = enemies.map((en, i) =>
            i === enemyIdx ? { hp: Math.max(0, en.hp - atk) } : en
          );
          setEnemies(newEnemies);

          const floatId = Date.now();
          setDmgFloats(f => [...f, { id: floatId, value: atk }]);
          setTimeout(() => setDmgFloats(f => f.filter(x => x.id !== floatId)), 700);

          const completionDelay = question.romaji.length > 1 ? 220 : 0;

          if (newEnemies[enemyIdx].hp <= 0) {
            // Enemy defeated
            setFlashEnemy(true);
            setTimeout(() => {
              setFlashEnemy(false);
              setFallingEnemy(true);
              setTyped('');
              setTimeout(() => {
                setFallingEnemy(false);
                const nextIdx = enemyIdx + 1;
                if (nextIdx >= enemies.length) {
                  setDone(true);
                  const finalAcc = Math.round(newCK / newTK * 100);
                  const stars = calcStars(finalAcc);
                  const bonusCoins = Math.floor(stage.coinReward * ARMOR_BONUS[slot.armor]);
                  onClear({ stageId, stars, coinReward: stage.coinReward, bonusCoins, accuracy: finalAcc });
                } else {
                  setEnemyIdx(nextIdx);
                  setQuestion(pickQuestion(stage, words));
                }
              }, 520);
            }, 150);
          } else {
            setFlashEnemy(true);
            setTimeout(() => setFlashEnemy(false), 180);
            setTimeout(() => {
              setTyped('');
              setQuestion(pickQuestion(stage, words));
            }, completionDelay);
          }
        } else {
          setTyped(newTyped);
        }
      } else {
        // Miss — keep typed as-is (retry from the wrong character)
        const newTK = totalKeys + 1;
        setTotalKeys(newTK);
        setAccuracy(correctKeys === 0 ? 0 : Math.round(correctKeys / newTK * 100));
        setFlashError(true);
        setMissPulse(true);
        setTimeout(() => { setFlashError(false); setMissPulse(false); }, 350);
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
  const nextChar = question.romaji[typed.length]?.toUpperCase() ?? '';
  const enemyName = ENEMY_NAMES[stage.enemyType] ?? 'モンスター';

  return html`
    <div class="screen battle-screen">
      <!-- ステータスバー -->
      <div class="battle-status">
        <button class="battle-status__back" onClick=${onBack}>← もどる <span class="kbd">Esc</span></button>
        <span>ステージ ${stage.id}</span>
        <span class=${'battle-status__accuracy--' + accClass}>
          せいかく: ${accuracy}%
        </span>
        <span style=${{ marginLeft:'auto' }}>💰 ${slot.coins}</span>
      </div>

      <!-- バトルゾーン -->
      <div class="battle-zone">
        <!-- ヒーロー -->
        <div class="battle-hero">
          <div class="battle-hero__label">ゆうしゃ</div>
          <svg width="120" height="140" viewBox="0 0 120 160" style=${{ overflow:'visible' }}>
            <${StickFigure}
              weapon=${slot.weapon}
              armor=${slot.armor}
              pose=${heroAnim !== 'idle' ? 'attack' : 'idle'}
              animStyle=${{
                animation: heroAnim === 'idle' ? 'idle-bob 2.5s ease-in-out infinite' : heroAnim,
              }}
            />
          </svg>
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
            <${EnemySVG} type=${stage.enemyType} flash=${flashEnemy} falling=${fallingEnemy} />
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
          <div class="battle-question__hint">
            ${question.romaji.split('').map((ch, i) => html`
              <span key=${i} style=${{
                color: i < typed.length ? '#5BB8FF'
                     : i === typed.length ? '#455A64'
                     : '#90A4AE',
                fontWeight: i === typed.length ? '900' : '700',
              }}>
                ${ch.toUpperCase()}
              </span>
            `)}
          </div>
        `}

        ${question.romaji.length > 1 && html`
          <div class="battle-progress">
            ${question.romaji.split('').map((ch, i) => html`
              <div key=${i} class=${'battle-progress__cell' + (i < typed.length ? ' battle-progress__cell--done' : '')}>
                ${ch.toUpperCase()}
              </div>
            `)}
          </div>
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
