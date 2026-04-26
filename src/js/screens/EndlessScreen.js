import { html } from 'https://esm.sh/htm/react';
import { useState, useEffect, useRef } from 'https://esm.sh/react';
import { StickFigure } from '../components/StickFigure.js';
import { EnemySVG } from '../components/EnemySVG.js';
import { KeyboardGuide } from '../components/KeyboardGuide.js';
import { toRomaji } from '../utils/romaji.js';
import { getWords } from '../data/loader.js';
import { ENDLESS } from '../data/endlessConstants.js';

const WEAPON_ATK  = { wooden:1, iron:2, flame:3, thunder:4, ice:5, dragon:6, legendary:7 };
const ENEMY_TYPES = ['slime', 'mushroom', 'goblin', 'bat', 'skeleton', 'golem'];
const ENEMY_NAMES = { slime:'スライム', mushroom:'キノコ', goblin:'ゴブリン', bat:'コウモリ', skeleton:'ガイコツ', golem:'ゴーレム' };
const ATTACK_ANIMS = [
  { css: 'attack-lunge 0.40s ease-out',  dur: 400 },
  { css: 'attack-spin  0.50s ease-out',  dur: 500 },
  { css: 'attack-jump  0.55s ease-out',  dur: 550 },
  { css: 'attack-slash 0.45s ease-out',  dur: 450 },
  { css: 'attack-thrust 0.42s ease-out', dur: 420 },
];

function pickAttack() { return ATTACK_ANIMS[Math.floor(Math.random() * ATTACK_ANIMS.length)]; }
function pickType()   { return ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)]; }

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
  return { text: word, romaji: toRomaji(word) };
}

export function EndlessScreen({ slot, onGameOver, onBack }) {
  const [words, setWords] = useState(null);
  const [question, setQuestion] = useState(null);
  const [typed, setTyped] = useState('');

  // Enemy
  const [loop, setLoop] = useState(1);
  const [mobCount, setMobCount] = useState(0);
  const [isBoss, setIsBoss] = useState(false);
  const [enemyType, setEnemyType] = useState(() => pickType());
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
  const [heroAnim, setHeroAnim] = useState('idle');
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
      if (typed.length >= question.romaji.length) return;

      const targetChar = question.romaji[typed.length];

      if (key === targetChar) {
        const newTyped    = typed + key;
        const newCharCount = charCount + 1;
        setCharCount(newCharCount);
        startTimer();

        // 10-char attack
        if (newCharCount % ENDLESS.ATTACK_EVERY_N === 0) {
          const atk = (WEAPON_ATK[slot.weapon] ?? 1) + heroAtkBonus;
          const newEnemyHP = Math.max(0, enemyHP - atk);

          const animInfo = pickAttack();
          setHeroAnim(animInfo.css);
          setTimeout(() => setHeroAnim('idle'), animInfo.dur);

          const fid = Date.now();
          setDmgFloats(f => [...f, { id: fid, value: atk }]);
          setTimeout(() => setDmgFloats(f => f.filter(x => x.id !== fid)), 700);

          setFlashEnemy(true);
          setTimeout(() => setFlashEnemy(false), 180);
          setEnemyHP(newEnemyHP);

          if (newEnemyHP <= 0) {
            const xpGain = isBoss ? ENDLESS.XP_BOSS : ENDLESS.XP_MOB;
            handleEnemyDeath(xpGain, newCharCount);
            return;
          }
        }

        if (newTyped.length >= question.romaji.length) {
          setTyped(newTyped);
          setTimeout(() => {
            setTyped('');
            setQuestion(pickQuestion(words, heroLevel));
          }, newTyped.length > 1 ? 220 : 0);
        } else {
          setTyped(newTyped);
        }
      } else {
        // Typo → enemy attacks
        setTyped('');
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
      const roll = Math.floor(Math.random() * 3);
      if (roll === 0) {
        newHeroAtkBonus = Math.min(ENDLESS.MAX_STAT, heroAtkBonus + ENDLESS.LEVELUP_ATK);
        lvlMsg = `Lv.${newLevel} ▲ こうげきりょく +${ENDLESS.LEVELUP_ATK}`;
      } else if (roll === 1) {
        newHeroDef = Math.min(ENDLESS.MAX_STAT, heroDef + ENDLESS.LEVELUP_DEF);
        heroDefRef.current = newHeroDef;
        lvlMsg = `Lv.${newLevel} ▲ まもりのちから +${ENDLESS.LEVELUP_DEF}`;
      } else {
        newHeroMaxHP = Math.min(ENDLESS.MAX_STAT, heroMaxHP + ENDLESS.LEVELUP_HP);
        newHeroHP = Math.min(newHeroMaxHP, heroHP + ENDLESS.LEVELUP_HP);
        lvlMsg = `Lv.${newLevel} ▲ HP +${ENDLESS.LEVELUP_HP}`;
      }
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
        const type = pickType();
        const hp   = mobHP(nextLoop);
        const atk  = mobAtk(nextLoop);
        setEnemyType(type);
        setEnemyHP(hp); setEnemyMaxHP(hp);
        setEnemyAtkVal(atk); enemyAtkRef.current = atk;
      } else {
        const nextMobCount = mobCount + 1;
        if (nextMobCount >= ENDLESS.MOB_COUNT) {
          setMobCount(nextMobCount);
          setIsBoss(true);
          const type = pickType();
          const hp   = bossHP(loop);
          const atk  = bossAtk(loop);
          setEnemyType(type);
          setEnemyHP(hp); setEnemyMaxHP(hp);
          setEnemyAtkVal(atk); enemyAtkRef.current = atk;
        } else {
          setMobCount(nextMobCount);
          const type = pickType();
          const hp   = mobHP(loop);
          const atk  = mobAtk(loop);
          setEnemyType(type);
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
      <div class="screen endless-screen" style=${{ alignItems:'center', justifyContent:'center' }}>
        <div style=${{ fontSize:'24px', color:'rgba(255,255,255,0.7)' }}>よみこみちゅう...</div>
      </div>
    `;
  }

  const hpRatio      = Math.max(0, heroHP / heroMaxHP);
  const enemyHpRatio = Math.max(0, enemyHP / enemyMaxHP);
  const xpRatio      = heroXP / ENDLESS.XP_PER_LEVEL;
  const charRatio    = (charCount % ENDLESS.ATTACK_EVERY_N) / ENDLESS.ATTACK_EVERY_N;
  const nextChar     = question.romaji[typed.length]?.toUpperCase() ?? '';
  const heroAtk      = (WEAPON_ATK[slot.weapon] ?? 1) + heroAtkBonus;
  const enemyDisplayName = (isBoss ? '大' : '') + (ENEMY_NAMES[enemyType] ?? 'モンスター');
  const mobLabel     = isBoss
    ? 'ボス！'
    : `雑魚 ${mobCount + 1} / ${ENDLESS.MOB_COUNT}`;

  return html`
    <div class="screen endless-screen">

      <!-- ステータスバー -->
      <div class="battle-status">
        <button class="battle-status__back" onClick=${onBack}>← もどる <span class="kbd">Esc</span></button>
        <div class="endless-status-lv">
          Lv.${heroLevel}
          <div class="endless-status-xp-track">
            <div class="endless-status-xp-fill" style=${{ width: `${xpRatio * 100}%` }} />
          </div>
        </div>
        <span style=${{ color:'rgba(255,255,255,0.7)', fontWeight:'700' }}>ループ ${loop}</span>
        <span style=${{ marginLeft:'auto', fontWeight:'900', color:'#FFD700' }}>ATK ${heroAtk} / DEF ${heroDef}</span>
      </div>

      <!-- バトルゾーン -->
      <div class="battle-zone">

        <!-- ゆうしゃ -->
        <div class="battle-hero">
          <div class="battle-hero__label">ゆうしゃ</div>

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
            <svg width="120" height="140" viewBox="0 0 120 160" style=${{ overflow:'visible' }}
                class=${heroFlash ? 'endless-hero--hit' : ''}>
              <${StickFigure}
                weapon=${slot.weapon}
                armor=${slot.armor}
                pose=${heroAnim !== 'idle' ? 'attack' : 'idle'}
                color="white"
                animStyle=${{
                  animation: heroAnim === 'idle' ? 'idle-bob 2.5s ease-in-out infinite' : heroAnim,
                }}
              />
            </svg>
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

          <div style=${{ position:'relative', marginTop:'60px' }}>
            <${EnemySVG} type=${enemyType} flash=${flashEnemy} falling=${fallingEnemy} boss=${isBoss} />
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

        ${question.romaji.length > 1 && html`
          <div class="battle-progress">
            ${question.romaji.split('').map((ch, i) => html`
              <div key=${i} class=${'battle-progress__cell' + (i < typed.length ? ' battle-progress__cell--done' : '')}>
                ${ch.toUpperCase()}
              </div>
            `)}
          </div>
        `}

        <!-- 10文字カウンタ -->
        <div class="endless-char-counter">
          <span class="endless-char-counter__label">⚔️ ${charCount % ENDLESS.ATTACK_EVERY_N}/${ENDLESS.ATTACK_EVERY_N}</span>
          <div class="endless-char-counter__track">
            <div class="endless-char-counter__fill" style=${{ width: `${charRatio * 100}%` }} />
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
