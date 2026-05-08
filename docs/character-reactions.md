# キャラクターリアクション設計書

## 概要

バトル中の棒人間（StickFigure）に「喜び」「残念」の2種類のリアクションを追加する。  
現在はアタックアニメーションのみで、正解・ミスへの感情表現がない。

子供がキャラクターに感情移入できるよう、**腕のポーズ** と **顔の表情** の両方を変化させる。

---

## 追加するリアクション一覧

| イベント | ポーズ | 表情 | アニメーション | 継続時間 |
|---------|--------|------|-------------|---------|
| 正解（通常攻撃） | `attack` | neutral | 既存 attack-* | 既存 |
| 敵撃破 | `happy` | smile | `hero-happy` | 600ms |
| ミス入力 | `sad` | frown | `hero-sad` | 350ms |
| 待機（idle） | `idle` | neutral | `idle-bob`（既存） | ループ |
| クリア画面 | `victory` | smile | `idle-bob`（既存） | ループ |
| 失敗画面 | `scratch` | frown | なし | - |

---

## StickFigure.js の変更

### 1. POSE_ARMS に2ポーズを追加

現在の肩座標: `(cx, shY)` = `(58, 54)`

```js
const POSE_ARMS = {
  idle:    { r:[80, 78], l:[36, 78] },   // 既存
  attack:  { r:[100,46], l:[44, 76] },   // 既存
  victory: { r:[78, 32], l:[42, 32] },   // 既存
  scratch: { r:[72, 40], l:[36, 78] },   // 既存
  // ── 新規 ──
  happy:   { r:[96, 30], l:[20, 30] },   // 両腕を大きく広げたV字（victoryより開いた形）
  sad:     { r:[74, 94], l:[42, 94] },   // 両腕がidleより低く垂れ下がった形
};
```

**ポーズ形状のイメージ（viewBox 0 0 120 140 内）:**

```
happy (喜び)        idle (通常)         sad (残念)
   \   /                \   /               |   |
    \ /                  \ /                |   |
     ●                   ●                  ●
     |                   |                  |
```

### 2. 表情システムの追加

現在の頭部: `<circle cx=${cx} cy=${headCy} r=${headR}>` のみ（内部描画なし）

ポーズに連動した目・口を追加する。  
座標基準: `cx=58`, `headCy=22`, `headR=17`

#### 表情マップ

```js
const FACE_TYPE = {
  idle:    'neutral',
  attack:  'neutral',
  victory: 'smile',
  scratch: 'frown',
  happy:   'smile',   // 新規
  sad:     'frown',   // 新規
};
```

#### 目（全表情共通）

2つの塗りつぶし円。常時表示。

```js
// 左目: (cx-7, headCy-4) = (51, 18)
// 右目: (cx+7, headCy-4) = (65, 18)
<circle cx=${cx - 7} cy=${headCy - 4} r="2.5" fill=${color} />
<circle cx=${cx + 7} cy=${headCy - 4} r="2.5" fill=${color} />
```

#### 口（3パターン）

| 種別 | SVG | 説明 |
|------|-----|------|
| `neutral` | `<line>` | 水平線（横 -6〜+6） |
| `smile` | `<path>` 下向きアーク | 笑顔 |
| `frown` | `<path>` 上向きアーク | 困り顔 |

```js
const mouthType = FACE_TYPE[pose] ?? 'neutral';

// neutral: まっすぐな口
${mouthType === 'neutral' && html`
  <line
    x1=${cx - 6} y1=${headCy + 7}
    x2=${cx + 6} y2=${headCy + 7}
    stroke=${color} strokeWidth="2.5" strokeLinecap="round"
  />
`}

// smile: 下に膨らむアーク（笑顔）
${mouthType === 'smile' && html`
  <path
    d="M ${cx - 7} ${headCy + 5} Q ${cx} ${headCy + 12} ${cx + 7} ${headCy + 5}"
    fill="none" stroke=${color} strokeWidth="2.5" strokeLinecap="round"
  />
`}

// frown: 上に膨らむアーク（困り顔）
${mouthType === 'frown' && html`
  <path
    d="M ${cx - 7} ${headCy + 10} Q ${cx} ${headCy + 4} ${cx + 7} ${headCy + 10}"
    fill="none" stroke=${color} strokeWidth="2.5" strokeLinecap="round"
  />
`}
```

**表情の見た目（頭円の中）:**

```
neutral  smile  frown
  ◉ ◉    ◉ ◉    ◉ ◉
  ——      ∪      ∩
```

#### 配置箇所（StickFigure.js 内）

頭部の `<circle>` の直後、体の描画の前に挿入する。

```js
<!-- 頭 -->
<circle cx=${cx} cy=${headCy} r=${headR} fill="none" ...${s} />
<!-- 表情（新規追加） -->
<circle cx=${cx - 7} cy=${headCy - 4} r="2.5" fill=${color} />
<circle cx=${cx + 7} cy=${headCy - 4} r="2.5" fill=${color} />
${...口のSVG...}
<!-- 体・骨格（既存） -->
<line x1=${cx} y1=${bodyTop} ... />
```

---

## animations.css の追加

### `hero-happy` — 敵撃破時のジャンプ

軽くジャンプして着地する。`attack-jump` より小さく、お祝い感のある動き。

```css
@keyframes hero-happy {
  0%   { transform: translateY(0)     scale(1);    }
  25%  { transform: translateY(-22px) scale(1.08); }
  55%  { transform: translateY(-10px) scale(1.04); }
  80%  { transform: translateY(4px)   scale(0.97); }
  100% { transform: translateY(0)     scale(1);    }
}
```

### `hero-sad` — ミス時のうなだれ

左右にわずかに揺れながら小さく縮む。赤フラッシュと同期させる。

```css
@keyframes hero-sad {
  0%   { transform: rotate(0deg)  translateY(0)   scale(1);    }
  25%  { transform: rotate(-5deg) translateY(2px) scale(0.96); }
  70%  { transform: rotate(2deg)  translateY(1px) scale(0.98); }
  100% { transform: rotate(0deg)  translateY(0)   scale(1);    }
}
```

---

## BattleScreen.js の変更

### state の再設計

現在の `heroAnim` はポーズと CSS アニメーション文字列を1つの state で兼用しており構造が複雑。  
`heroPose` と `heroAnim` に分離する。

**変更前:**
```js
const [heroAnim, setHeroAnim] = useState('idle');
// renderで:
pose=${heroAnim !== 'idle' ? 'attack' : 'idle'}
animStyle=${{ animation: heroAnim === 'idle' ? 'idle-bob 2.5s ease-in-out infinite' : heroAnim }}
```

**変更後:**
```js
const [heroPose, setHeroPose] = useState('idle');
const [heroAnim, setHeroAnim] = useState('idle-bob 2.5s ease-in-out infinite');
// renderで:
pose=${heroPose}
animStyle=${{ animation: heroAnim }}
```

idle 状態に戻すためのヘルパー関数をコンポーネント内に定義する:

```js
function resetHero() {
  setHeroPose('idle');
  setHeroAnim('idle-bob 2.5s ease-in-out infinite');
}
```

### 各イベントへの組み込み

#### ① 通常攻撃（単語完了・敵は生存）

```js
// 変更前
const atk_anim = pickAttack();
setHeroAnim(atk_anim.css);
setTimeout(() => setHeroAnim('idle'), atk_anim.dur);

// 変更後
const atk_anim = pickAttack();
setHeroPose('attack');
setHeroAnim(atk_anim.css);
setTimeout(() => resetHero(), atk_anim.dur);
```

#### ② 敵撃破（fallingEnemy 開始時）

既存のタイムライン（t=0: 撃破判定、t=150: 倒れアニメ開始、t=670: 次へ）に合わせて  
t=150 のコールバック内に `happy` を設定する。`hero-happy` の 600ms が 520ms の window に収まる。

```js
setTimeout(() => {
  setFlashEnemy(false);
  setFallingEnemy(true);
  setTyped('');
  // ── 追加 ──
  setHeroPose('happy');
  setHeroAnim('hero-happy 0.6s ease-out');
  // ─────────
  setTimeout(() => {
    setFallingEnemy(false);
    resetHero();  // ← 追加（次の敵・クリア前にidle復帰）
    const nextIdx = enemyIdx + 1;
    if (nextIdx >= enemies.length) {
      // onClear...
    } else {
      setEnemyIdx(nextIdx);
      setQuestion(pickQuestion(stage, words));
    }
  }, 520);
}, 150);
```

#### ③ ミス入力

既存の `flashError` / `missPulse`（350ms）と同タイミングで設定する。

```js
// 変更前
setFlashError(true);
setMissPulse(true);
setTimeout(() => { setFlashError(false); setMissPulse(false); }, 350);

// 変更後
setFlashError(true);
setMissPulse(true);
setHeroPose('sad');           // ← 追加
setHeroAnim('hero-sad 0.35s ease-out');  // ← 追加
setTimeout(() => {
  setFlashError(false);
  setMissPulse(false);
  resetHero();                // ← 追加
}, 350);
```

---

## タイムライン整理（敵撃破）

```
t=0ms    撃破判定、setFlashEnemy(true)、攻撃アニメ開始
t=150ms  setFlashEnemy(false)、setFallingEnemy(true)、heroPose='happy'
t=~450ms hero-happy アニメーション完了（600msなのでまだ継続）
t=670ms  setFallingEnemy(false)、resetHero()、次の敵 or onClear
```

敵が倒れながらキャラクターが喜ぶ姿が同時に見える設計になっている。

---

## 実装ステップ

| ステップ | 内容 | ファイル |
|---------|------|---------|
| 1 | `hero-happy` と `hero-sad` を追加 | `src/css/animations.css` |
| 2 | `POSE_ARMS` に `happy` / `sad` を追加 | `src/js/components/StickFigure.js` |
| 3 | `FACE_TYPE` マップと目・口の SVG を追加 | `src/js/components/StickFigure.js` |
| 4 | `heroAnim` state を `heroPose` + `heroAnim` に分離 | `src/js/screens/BattleScreen.js` |
| 5 | 敵撃破コールバックに `happy` を設定 | `src/js/screens/BattleScreen.js` |
| 6 | ミスブランチに `sad` を設定 | `src/js/screens/BattleScreen.js` |

ステップ1〜3は `StickFigure.js` 単体の変更で完結し、既存のポーズ（victory/scratch）にも自動で  
表情が付く。ステップ4以降の BattleScreen 変更が完成して初めてリアクションが動作する。

---

## 注意事項

- `scratch` ポーズ（失敗画面）は `FACE_TYPE` の定義で自動的に frown 表情になるため、  
  `StageClearScreen.js` への変更は不要。
- `victory` ポーズ（クリア画面）も自動的に smile 表情になる。
- 顔パーツは `fill=${color}` を使うため、コンポーネントの `color` プロップを変更すれば  
  体と顔色が一括で変わる。カスタマイズの余地を残した設計。
- `heroPose` が `'attack'` 以外のときは武器の `sAngle`（傾き）が影響する。  
  `happy` / `sad` では `sAngle = -0.35`（idle と同じ値）が適用されるため、  
  武器が自然な位置に収まる。
