import { RomajiGuide } from '../components/RomajiGuide.js';
import { html } from 'https://esm.sh/htm/react';
import { useState, useEffect, useRef } from 'https://esm.sh/react';
import { LittleKnight, useKnightReaction } from '../components/LittleKnight.js';
import { ForestBoar } from '../components/ForestSprites.js';
import { CaveSprite, caveNames } from '../components/CaveSprites.js';
import { IslandSprite, islandNames } from '../components/IslandSprites.js';
import { MistSprite, mistNames } from '../components/MistSprites.js';
import { JourneyAnimal, journeys, journeyNames } from '../components/JourneySprites.js';
import { KeyboardGuide } from '../components/KeyboardGuide.js';
import { createRomajiQuestion, romajiGuide } from '../utils/romaji.js';
import { getWords } from '../data/loader.js';
import { ENDLESS } from '../data/endlessConstants.js';
import { playSound, startBgm, stopBgm } from '../utils/sound.js';

const WEAPON_ATK  = { wooden:1, iron:2, flame:3, thunder:4, ice:5, dragon:6, legendary:7, lightsaber:8, magnum:9 };
const ARMOR_XP_MULT = { hat:1.0, helmet:1.1, cape:1.2, armor:1.3, robe:1.5, shield:1.6, divine:1.7, vest:1.8, radiant:1.9 };
const encounters = [
  { sprite: ForestBoar, mobs: ['boar'], boss: 'chief', names: { boar: 'うりぼう', chief: '大イノシシ' } },
  { sprite: CaveSprite, mobs: ['bat', 'mole'], boss: 'chief', names: caveNames },
  { sprite: IslandSprite, mobs: ['tanuki', 'fox'], boss: 'pair', names: islandNames },
  { sprite: MistSprite, mobs: ['frog', 'otter'], boss: 'deer', names: mistNames },
  ...Object.values(journeys).map(({ cast: [first, second, boss] }) => ({
    sprite: JourneyAnimal, mobs: [first, second], boss, names: journeyNames,
  })),
];

function mobHP(loop)   { return Math.min(9999,  Math.ceil(ENDLESS.MOB_HP_BASE  * Math.pow(ENDLESS.MOB_HP_SCALE,   loop - 1))); }
function mobAtk(loop)  { return Math.min(999,   ENDLESS.MOB_ATK_BASE + (loop - 1) * ENDLESS.MOB_ATK_STEP); }
function bossHP(loop)  { return Math.min(99999, Math.ceil(ENDLESS.BOSS_HP_BASE * Math.pow(ENDLESS.BOSS_HP_SCALE,  loop - 1))); }
function bossAtk(loop) { return Math.min(999,   Math.ceil(ENDLESS.BOSS_ATK_BASE * Math.pow(ENDLESS.BOSS_ATK_SCALE, loop - 1))); }

function hpColor(hp, max) {
  const r = hp / max;
  if (r > 0.6) return '#4CAF50';
  if (r > 0.3) return '#FFD700';
  return '#FF5252';
}

function pickQuestion(words, heroLevel) {
  let poolA, poolB;
  if      (heroLevel <= 10) { poolA = words['2'].easy;   poolB = words['3'].easy; }
  else if (heroLevel <= 20) { poolA = words['3'].normal; poolB = words['4'].easy; }
  else if (heroLevel <= 30) { poolA = words['4'].normal; poolB = words['5'].easy; }
  else if (heroLevel <= 50) { poolA = words['5'].normal; poolB = words.sentences.easy; }
  else                      { poolA = words.sentences.normal; poolB = words.sentences.hard; }
  const pool = Math.random() < 0.5 ? poolA : poolB;
  const word = pool[Math.floor(Math.random() * pool.length)];
  return createRomajiQuestion(word);
}

export function EndlessScreen({ slot, onGameOver, onBack }) {
  const [words, setWords] = useState(null);
  const [question, setQuestion] = useState(null);
  const [typed, setTyped] = useState('');
  const guide = question ? romajiGuide(question.tokens, typed) : '';

  // Enemy
  const [loop, setLoop] = useState(1);
  const [mobCount, setMobCount] = useState(0);
  const [isBoss, setIsBoss] = useState(false);
  const [enemyHP, setEnemyHP] = useState(() => mobHP(1));
  const [enemyMaxHP, setEnemyMaxHP] = useState(() => mobHP(1));
  const [enemyAtkVal, setEnemyAtkVal] = useState(() => mobAtk(1));
  const [fallingEnemy, setFallingEnemy] = useState(false);
  const [flashEnemy, setFlashEnemy] = useState(false);
  const [done, setDone] = useState(false);
  const [loopBanner, setLoopBanner] = useState(false);

  // Hero
  const [heroHP, setHeroHP] = useState(ENDLESS.HERO_HP_INIT);
  const [heroMaxHP, setHeroMaxHP] = useState(ENDLESS.HERO_HP_INIT);
  const [heroDef, setHeroDef] = useState(ENDLESS.HERO_DEF_INIT);
  const [heroAtkBonus, setHeroAtkBonus] = useState(0);
  const [heroLevel, setHeroLevel] = useState(1);
  const [heroXP, setHeroXP] = useState(0);
  const [heroFlash, setHeroFlash] = useState(false);

  // Progress
  const [charCount, setCharCount] = useState(0);
  const [sessionMobs, setSessionMobs] = useState(0);
  const [sessionBosses, setSessionBosses] = useState(0);

  // Visual
  const [reaction, reactKnight] = useKnightReaction();
  const [dmgFloats, setDmgFloats] = useState([]);
  const [heroDmgFloats, setHeroDmgFloats] = useState([]);
  const [flashError, setFlashError] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [levelUpMsg, setLevelUpMsg] = useState('');

  // Refs for stable timer callbacks
  const timerRef    = useRef(null);
  const enemyAtkRef = useRef(mobAtk(1));
  const heroDefRef  = useRef(ENDLESS.HERO_DEF_INIT);
  const gameDoneRef = useRef(false);
  const fallingRef  = useRef(false);

  // Keep refs current
  useEffect(() => { enemyAtkRef.current = enemyAtkVal; }, [enemyAtkVal]);
  useEffect(() => { heroDefRef.current  = heroDef;     }, [heroDef]);

  // Load words, init first question
  useEffect(() => {
    getWords().then(w => {
      setWords(w);
      setQuestion(pickQuestion(w, 1));
    });
    return () => { gameDoneRef.current = true; clearTimer(); };
  }, []);

  useEffect(() => {
    startBgm(isBoss ? 'finalBoss' : 'battle');
    return stopBgm;
  }, [isBoss]);

  // Game over when HP hits 0
  useEffect(() => {
    if (heroHP <= 0 && !gameDoneRef.current && !done) {
      gameDoneRef.current = true;
      clearTimer();
      setDone(true);
      setTimeout(() => {
        onGameOver({ loop, sessionMobs, sessionBosses, heroLevel });
      }, 400);
    }
  }, [heroHP]);

  // ─── Timer ──────────────────────────────────────────────────

  function clearTimer() {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }

  function startTimer() {
    clearTimer();
    if (gameDoneRef.current || fallingRef.current) return;
    setTimerKey(k => k + 1);
    timerRef.current = setTimeout(() => {
      if (gameDoneRef.current || fallingRef.current) return;
      const dmg = Math.max(1, enemyAtkRef.current - heroDefRef.current);
      const id = Date.now();
      setHeroDmgFloats(f => [...f, { id, value: dmg }]);
      setTimeout(() => setHeroDmgFloats(f => f.filter(x => x.id !== id)), 700);
      setHeroFlash(true);
      setTimeout(() => setHeroFlash(false), 350);
      setHeroHP(prev => Math.max(0, prev - dmg));
      startTimer();
    }, ENDLESS.ENEMY_TIMER_MS);
  }

  // ─── Keydown handler ────────────────────────────────────────

  useEffect(() => {
    if (!question || !words || fallingEnemy || done) return;

    const handler = (e) => {
      if (e.key === 'Escape') { onBack(); return; }
      const key = e.key.toLowerCase();
      if (key.length !== 1 || !/[a-z;,./\-]/.test(key)) return;
      if (typed.length >= guide.length) return;

      const newTyped = typed + key;
      const nextGuide = romajiGuide(question.tokens, newTyped);

      if (nextGuide !== null) {
        playSound('correct');
        const newCharCount = charCount + 1;
        setCharCount(newCharCount);
        startTimer();

        // 10-char attack
        if (newCharCount % ENDLESS.ATTACK_EVERY_N === 0) {
          const atk = (WEAPON_ATK[slot.weapon] ?? 1) + heroAtkBonus;
          const newEnemyHP = Math.max(0, enemyHP - atk);

          reactKnight('attack');

          const fid = Date.now();
          setDmgFloats(f => [...f, { id: fid, value: atk }]);
          setTimeout(() => setDmgFloats(f => f.filter(x => x.id !== fid)), 700);

          setFlashEnemy(true);
          setTimeout(() => setFlashEnemy(false), 180);
          setEnemyHP(newEnemyHP);

          if (newEnemyHP <= 0) {
            const baseXP = isBoss ? ENDLESS.XP_BOSS : ENDLESS.XP_MOB;
            const xpGain = Math.ceil(baseXP * (ARMOR_XP_MULT[slot.armor] ?? 1.0));
            handleEnemyDeath(xpGain, newCharCount);
            return;
          }
        }

        if (newTyped.length === nextGuide.length) {
          setTyped(newTyped);
          setTimeout(() => {
            setTyped('');
            setQuestion(pickQuestion(words, heroLevel));
          }, newTyped.length > 1 ? 220 : 0);
        } else {
          setTyped(newTyped);
        }
      } else {
        playSound('miss');
        // Typo → enemy attacks (keep typed as-is, retry from wrong character)
        setFlashError(true);
        setTimeout(() => setFlashError(false), 350);

        const dmg = Math.max(1, enemyAtkVal - heroDef);
        const id = Date.now();
        setHeroDmgFloats(f => [...f, { id, value: dmg }]);
        setTimeout(() => setHeroDmgFloats(f => f.filter(x => x.id !== id)), 700);
        setHeroFlash(true);
        setTimeout(() => setHeroFlash(false), 350);
        setHeroHP(prev => Math.max(0, prev - dmg));
        startTimer();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [question, typed, fallingEnemy, done, words, charCount, enemyHP,
      isBoss, heroLevel, heroAtkBonus, enemyAtkVal, heroDef,
      loop, mobCount, sessionMobs, sessionBosses]);

  // Start timer when question is ready
  useEffect(() => {
    if (question && words && !fallingEnemy && !done) {
      startTimer();
    }
    return clearTimer;
  }, [question, fallingEnemy, done]);

  // ─── Enemy death & progression ───────────────────────────────

  function handleEnemyDeath(xpGain, currentCharCount) {
    clearTimer();
    fallingRef.current = true;
    setFallingEnemy(true);

    // XP & level up
    const rawNewXP = heroXP + xpGain;
    let newLevel = heroLevel;
    let newHeroHP = heroHP;
    let newHeroMaxHP = heroMaxHP;
    let newHeroDef = heroDef;
    let newHeroAtkBonus = heroAtkBonus;
    let lvlMsg = '';

    if (rawNewXP >= ENDLESS.XP_PER_LEVEL && heroLevel < ENDLESS.MAX_LEVEL) {
      newLevel = heroLevel + 1;
      const [rollA, rollB] = [0, 1, 2].sort(() => Math.random() - 0.5);
      const lvlParts = [];
      for (const roll of [rollA, rollB]) {
        if (roll === 0) {
          newHeroAtkBonus = Math.min(ENDLESS.MAX_STAT, newHeroAtkBonus + ENDLESS.LEVELUP_ATK);
          lvlParts.push(`こうげき +${ENDLESS.LEVELUP_ATK}`);
        } else if (roll === 1) {
          newHeroDef = Math.min(ENDLESS.MAX_STAT, newHeroDef + ENDLESS.LEVELUP_DEF);
          heroDefRef.current = newHeroDef;
          lvlParts.push(`まもり +${ENDLESS.LEVELUP_DEF}`);
        } else {
          newHeroMaxHP = Math.min(ENDLESS.MAX_STAT, newHeroMaxHP + ENDLESS.LEVELUP_HP);
          newHeroHP = Math.min(newHeroMaxHP, newHeroHP + ENDLESS.LEVELUP_HP);
          lvlParts.push(`HP +${ENDLESS.LEVELUP_HP}`);
        }
      }
      newHeroHP = newHeroMaxHP; // レベルアップ時はHP全回復
      lvlMsg = `Lv.${newLevel} ▲ ${lvlParts.join(' / ')} / HP全回復！`;
    }
    const newXP = rawNewXP % ENDLESS.XP_PER_LEVEL;

    setHeroXP(newXP);
    setHeroLevel(newLevel);
    if (newHeroAtkBonus !== heroAtkBonus) setHeroAtkBonus(newHeroAtkBonus);
    if (newHeroDef !== heroDef) setHeroDef(newHeroDef);
    if (newHeroMaxHP !== heroMaxHP) setHeroMaxHP(newHeroMaxHP);
    if (newHeroHP !== heroHP) setHeroHP(newHeroHP);

    if (lvlMsg) {
      setLevelUpMsg(lvlMsg);
      setTimeout(() => setLevelUpMsg(''), 1700);
    }

    if (isBoss) {
      setSessionBosses(prev => prev + 1);
    } else {
      setSessionMobs(prev => prev + 1);
    }

    setTimeout(() => {
      setFallingEnemy(false);
      fallingRef.current = false;

      if (isBoss) {
        const nextLoop = loop + 1;
        setLoop(nextLoop);
        setMobCount(0);
        setIsBoss(false);
        setLoopBanner(true);
        setTimeout(() => setLoopBanner(false), 1200);
        const hp   = mobHP(nextLoop);
        const atk  = mobAtk(nextLoop);
        setEnemyHP(hp); setEnemyMaxHP(hp);
        setEnemyAtkVal(atk); enemyAtkRef.current = atk;
      } else {
        const nextMobCount = mobCount + 1;
        if (nextMobCount >= ENDLESS.MOB_COUNT) {
          setMobCount(nextMobCount);
          setIsBoss(true);
          const hp   = bossHP(loop);
          const atk  = bossAtk(loop);
          setEnemyHP(hp); setEnemyMaxHP(hp);
          setEnemyAtkVal(atk); enemyAtkRef.current = atk;
        } else {
          setMobCount(nextMobCount);
          const hp   = mobHP(loop);
          const atk  = mobAtk(loop);
          setEnemyHP(hp); setEnemyMaxHP(hp);
          setEnemyAtkVal(atk); enemyAtkRef.current = atk;
        }
      }

      setTyped('');
      setQuestion(pickQuestion(words, newLevel));
    }, 520);
  }

  // ─── Render ─────────────────────────────────────────────────

  if (!question || !words) {
    return html`
      <div class="screen endless-loading" style=${{ alignItems:'center', justifyContent:'center' }}>
        <div style=${{ fontSize:'24px', color:'rgba(255,255,255,0.7)' }}>よみこみちゅう...</div>
      </div>
    `;
  }

  const hpRatio      = Math.max(0, heroHP / heroMaxHP);
  const enemyHpRatio = Math.max(0, enemyHP / enemyMaxHP);
  const xpRatio      = heroXP / ENDLESS.XP_PER_LEVEL;
  const progress = charCount % ENDLESS.ATTACK_EVERY_N;
  const striking = flashEnemy && progress === 0;
  const litSegments = striking ? ENDLESS.ATTACK_EVERY_N : progress;
  const nextChar     = guide[typed.length]?.toUpperCase() ?? '';
  const heroAtk      = (WEAPON_ATK[slot.weapon] ?? 1) + heroAtkBonus;
  const encounter = encounters[(loop - 1) % encounters.length];
  const actor = isBoss ? encounter.boss : encounter.mobs[mobCount % encounter.mobs.length];
  const enemyDisplayName = encounter.names[actor];
  const mobLabel     = isBoss
    ? 'ボス！'
    : `雑魚 ${mobCount + 1} / ${ENDLESS.MOB_COUNT}`;

  return html`
    <div class="screen battle-screen endless-screen">

      <!-- ステータスバー -->
      <div class="battle-status">
        <button class="pixel-button" onClick=${onBack}><img src="art/ui/back.png" alt="" /> もどる <span class="kbd">Esc</span></button>
        <div class="endless-status-lv">
          Lv.${heroLevel}
          <div class="endless-status-xp-track">
            <div class="endless-status-xp-fill" style=${{ width: `${xpRatio * 100}%` }} />
          </div>
        </div>
        <span style=${{ color:'rgba(255,255,255,0.7)', fontWeight:'700' }}>ループ ${loop}</span>
        ${!isBoss && html`<div class="boss-preview">
          <div class=${'boss-portrait' + (mobCount < ENDLESS.MOB_COUNT - 1 ? ' silhouette' : '')} aria-hidden="true">
            <${encounter.sprite} kind=${encounter.boss} actor=${encounter.boss} boss=${true} />
          </div>
          つぎのボス　${mobCount < ENDLESS.MOB_COUNT - 1 ? '？？？' : encounter.names[encounter.boss]}
        </div>`}
        <span style=${{ marginLeft:'auto', fontWeight:'900', color:'#FFD700' }}>ATK ${heroAtk} / DEF ${heroDef}</span>
      </div>

      <!-- バトルゾーン -->
      <div class="battle-zone">

        <!-- ゆうしゃ -->
        <div class="battle-hero">
          <div class="battle-hero__label">リトルナイト</div>

          <!-- ゆうしゃHP -->
          <div class="endless-hero-hp">
            <div class="endless-hero-hp__header">
              <span>HP</span>
              <span>${heroHP} / ${heroMaxHP}</span>
            </div>
            <div class="endless-hero-hp__track">
              <div class="endless-hero-hp__fill" style=${{
                width: `${hpRatio * 100}%`,
                background: hpColor(heroHP, heroMaxHP),
              }} />
            </div>
          </div>

          <div style=${{ position:'relative' }}>
            <div class=${heroFlash ? 'endless-hero--hit' : ''}><${LittleKnight} key=${reaction.id} weapon=${slot.weapon} armor=${slot.armor} pose=${reaction.pose} /></div>
            ${heroDmgFloats.map(f => html`
              <div key=${f.id} style=${{ position:'absolute', top:'20px', left:0, right:0, display:'flex', justifyContent:'center', pointerEvents:'none' }}>
                <div class="hero-dmg-float">-${f.value}</div>
              </div>
            `)}
          </div>
        </div>

        <div class="battle-zone__divider" />

        <!-- てき -->
        <div class="battle-enemy">
          <div class="battle-enemy__label">${enemyDisplayName}（${mobLabel}）</div>

          <div class="battle-enemy__hp-wrap">
            <div class="battle-enemy__hp-header">
              <span>HP</span>
              <span>${Math.max(0, enemyHP)} / ${enemyMaxHP}</span>
            </div>
            <div class="battle-enemy__hp-track">
              <div class="battle-enemy__hp-fill" style=${{
                width: `${enemyHpRatio * 100}%`,
                background: hpColor(enemyHP, enemyMaxHP),
              }} />
            </div>

            <!-- 攻撃タイマーバー -->
            <div class="endless-timer-wrap">
              <div class="endless-timer-label">こうげきまで</div>
              <div class="endless-timer-track">
                <div key=${timerKey} class="endless-timer-bar"
                     style=${{ '--timer-dur': `${ENDLESS.ENEMY_TIMER_MS}ms` }} />
              </div>
            </div>
          </div>

          <div class="endless-opponent">
            <${encounter.sprite} key=${actor} kind=${actor} actor=${actor} flash=${flashEnemy} falling=${fallingEnemy} boss=${isBoss} />
            ${dmgFloats.map(f => html`
              <div key=${f.id} style=${{ position:'absolute', top:'30px', left:0, right:0, display:'flex', justifyContent:'center', pointerEvents:'none' }}>
                <div class="dmg-float">-${f.value}</div>
              </div>
            `)}
          </div>
        </div>
      </div>

      <!-- 出題エリア -->
      <div class=${'battle-question' + (flashError ? ' battle-question--miss' : '')}>
        <div class="battle-question__hira">${question.text}</div>
        <${RomajiGuide} guide=${guide} typed=${typed} />


        <div class=${'endless-charge' + (striking ? ' striking' : '')}>
          <span>${striking ? 'こうげき！' : 'あと ' + (ENDLESS.ATTACK_EVERY_N - progress) + ' 打'}</span>
          <div class="charge-sword" aria-hidden="true">
            ${Array.from({ length: ENDLESS.ATTACK_EVERY_N }, (_, i) => html`<i key=${i} class=${i < litSegments ? 'lit' : ''} />`)}
          </div>
        </div>
      </div>

      <!-- キーボードガイド -->
      <${KeyboardGuide} nextChar=${nextChar} availableKeys="" flashError=${flashError} />

      <!-- ループバナー -->
      ${loopBanner && html`
        <div class="endless-loop-banner">ループ ${loop} かいめ！</div>
      `}

      <!-- レベルアップフロートテキスト -->
      ${levelUpMsg && html`
        <div key=${levelUpMsg} class="endless-levelup-msg">${levelUpMsg}</div>
      `}
    </div>
  `;
}
