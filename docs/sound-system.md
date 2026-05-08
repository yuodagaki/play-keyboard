# サウンドシステム設計書

## 概要

Web Audio API を使ってすべての音を**プログラム生成**する。  
外部音声ファイル（MP3/WAV/OGG）は一切使用しない。

### 設計方針

- `src/js/utils/sound.js` 1ファイルで完結
- `AudioContext` はユーザー操作後（最初のキー入力）に初期化（ブラウザ自動再生ポリシー対応）
- ミュート状態は `localStorage` の `kba-mute` キーで永続化
- 各画面からは `playSound('eventName')` の1行呼び出しのみ（波形生成の詳細を隠蔽）
- BGM はオシレーターのスケジューリングで実現（外部ファイル不要）

---

## ファイル構成（変更・追加箇所）

```
src/js/utils/
└── sound.js          ← 新規作成

src/js/screens/
├── BattleScreen.js   ← playSound() 呼び出しを追加
├── StageClearScreen.js ← playSound() 呼び出しを追加
├── TitleScreen.js    ← BGM 開始 + ミュートボタン追加
├── WorldMapScreen.js ← BGM 切り替え
├── ShopScreen.js     ← uiClick 追加
└── EndlessScreen.js  ← playSound() 呼び出しを追加
```

---

## `sound.js` 実装仕様

### AudioContext の管理

```js
let _ctx = null;

function ctx() {
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}
```

初回呼び出し時にのみ生成する。`suspended` 状態なら `resume()` する。

### ミュート制御

```js
// 初期値を localStorage から読む
let _muted = localStorage.getItem('kba-mute') === '1';

export function isMuted() { return _muted; }

export function toggleMute() {
  _muted = !_muted;
  localStorage.setItem('kba-mute', _muted ? '1' : '0');
  if (_muted) stopBgm();
  else startBgm(_currentBgm);
  return _muted;
}
```

### BGM 管理

```js
let _bgmNodes = [];     // 停止用に保持するノード一覧
let _currentBgm = null; // 'title' | 'battle' | null

export function startBgm(name) { ... }
export function stopBgm() { ... }
```

---

## SE（効果音）仕様

`playSound(name)` で呼び出す。ミュート中は即 return。

```js
export function playSound(name) {
  if (_muted) return;
  SE_MAP[name]?.();
}
```

### 各サウンドの合成パラメータ

#### `correct` — 正解入力

| 項目 | 値 |
|------|-----|
| 波形 | triangle |
| 周波数 | 880 Hz（A5） |
| 音量エンベロープ | attack 0.005s / decay 0.08s / 0へ |
| 総時間 | 0.09s |
| 印象 | 軽い高音・テンポが出る |

```js
function playCorrect() {
  const c = ctx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain); gain.connect(c.destination);
  osc.type = 'triangle';
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.18, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.09);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.09);
}
```

#### `miss` — ミス入力

| 項目 | 値 |
|------|-----|
| 波形 | sawtooth |
| 周波数 | 180 Hz |
| 音量エンベロープ | attack 0.005s / decay 0.15s / 0へ |
| 総時間 | 0.16s |
| 印象 | 低めのブザー。怖くない・気づける |

```js
function playMiss() {
  const c = ctx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain); gain.connect(c.destination);
  osc.type = 'sawtooth';
  osc.frequency.value = 180;
  gain.gain.setValueAtTime(0.12, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.16);
}
```

#### `wordComplete` — 単語・文字クリア（敵を倒す前）

2音の上昇音（G4→B4）。1音より少し嬉しい感じ。

| ノート | 周波数 | 開始時刻 | 長さ |
|--------|--------|---------|------|
| G4 | 392 Hz | +0.00s | 0.10s |
| B4 | 494 Hz | +0.08s | 0.12s |

```js
function playWordComplete() {
  const c = ctx();
  [[392, 0.00, 0.10], [494, 0.08, 0.12]].forEach(([freq, when, dur]) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain); gain.connect(c.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = c.currentTime + when;
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t);
    osc.stop(t + dur + 0.01);
  });
}
```

#### `enemyDefeat` — 敵撃破

3音の勝利上昇（C4→E4→G4）。明るくテンポよく。

| ノート | 周波数 | 開始 | 長さ |
|--------|--------|------|------|
| C4 | 262 Hz | +0.00s | 0.10s |
| E4 | 330 Hz | +0.08s | 0.10s |
| G4 | 392 Hz | +0.16s | 0.18s |

波形: square（少しレトロで子供向き）

#### `stageClear` — ステージクリア

4音のファンファーレ（C4→E4→G4→C5）。星アニメーションと同期。

| ノート | 周波数 | 開始 | 長さ |
|--------|--------|------|------|
| C4 | 262 Hz | +0.00s | 0.12s |
| E4 | 330 Hz | +0.10s | 0.12s |
| G4 | 392 Hz | +0.20s | 0.12s |
| C5 | 524 Hz | +0.30s | 0.30s |

波形: sine。最後の音は伸ばす。

#### `stageFail` — ステージ失敗

2音の下降（C4→G3）。あくまで穏やか。怖くしない。

| ノート | 周波数 | 開始 | 長さ |
|--------|--------|------|------|
| C4 | 262 Hz | +0.00s | 0.18s |
| G3 | 196 Hz | +0.15s | 0.25s |

波形: sine

#### `uiClick` — ボタン押下・画面遷移

| 項目 | 値 |
|------|-----|
| 波形 | triangle |
| 周波数 | 660 Hz |
| 総時間 | 0.06s |
| 音量 | 0.10 |

#### `coinCount` — クリア画面のコインカウント中

`StageClearScreen` でコイン数のアニメーション中、50コインごとに1回鳴らす。

| 項目 | 値 |
|------|-----|
| 波形 | sine |
| 周波数 | 1047 Hz（C6）→ 1319 Hz（E6） |
| 総時間 | 0.07s |
| 印象 | キラキラしたコイン音 |

```js
function playCoinTick() {
  const c = ctx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain); gain.connect(c.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1047, c.currentTime);
  osc.frequency.linearRampToValueAtTime(1319, c.currentTime + 0.07);
  gain.gain.setValueAtTime(0.10, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.07);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.08);
}
```

#### `comboUp` — コンボカウント（将来実装用、APIのみ今回定義）

コンボ数を引数で受け取り、数が増えるほど高い音にする。

```js
export function playCombo(count) {
  if (_muted) return;
  const c = ctx();
  const baseFreq = 440;
  const freq = baseFreq * Math.pow(1.12, Math.min(count - 1, 8));
  // ... correct と同じ構造でfreqだけ変える
}
```

---

## BGM 仕様

BGM は短いフレーズを **AudioContext のスケジューリングで繰り返す**方式。  
Web Audio の `AudioWorklet` や外部ファイルは使わない。

### BGM種類

| name | 使用画面 | テンポ | 雰囲気 |
|------|---------|--------|--------|
| `'title'` | タイトル・ワールドマップ | 80 BPM | のんびり冒険 |
| `'battle'` | バトル・エンドレス | 140 BPM | ドキドキ |

### 実装パターン

```js
// 1フレーズ分のノート列（音程, 音長[拍]）
const BGM_TITLE = [
  [392, 1], [440, 0.5], [392, 0.5], [330, 1], [0, 1],  // 休符は周波数0
  [294, 1], [330, 0.5], [294, 0.5], [262, 2],
];

const BGM_BATTLE = [
  [523, 0.5], [523, 0.5], [587, 0.5], [523, 0.5],
  [494, 0.5], [523, 0.5], [0, 0.5],   [392, 0.5],
  [440, 0.5], [440, 0.5], [494, 0.5], [440, 0.5],
  [392, 0.5], [440, 0.5], [0, 1.0],
];

function scheduleBgm(notes, bpm, startTime) {
  const beatSec = 60 / bpm;
  let t = startTime;
  const nodes = [];
  for (const [freq, beats] of notes) {
    const dur = beats * beatSec;
    if (freq > 0) {
      const osc = ctx().createOscillator();
      const gain = ctx().createGain();
      osc.connect(gain); gain.connect(ctx().destination);
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.04, t);
      gain.gain.setValueAtTime(0.04, t + dur * 0.8);
      gain.gain.linearRampToValueAtTime(0, t + dur);
      osc.start(t);
      osc.stop(t + dur);
      nodes.push(osc);
    }
    t += dur;
  }
  return { nodes, endTime: t };
}
```

ループは `setTimeout` で次フレーズを先行スケジューリング：

```js
let _bgmTimer = null;

function loopBgm(notes, bpm) {
  const { endTime } = scheduleBgm(notes, bpm, ctx().currentTime);
  const loopMs = (endTime - ctx().currentTime - 0.1) * 1000;
  _bgmTimer = setTimeout(() => loopBgm(notes, bpm), loopMs);
}

export function startBgm(name) {
  if (_muted) return;
  stopBgm();
  _currentBgm = name;
  const map = { title: [BGM_TITLE, 80], battle: [BGM_BATTLE, 140] };
  const [notes, bpm] = map[name] ?? [BGM_TITLE, 80];
  loopBgm(notes, bpm);
}

export function stopBgm() {
  if (_bgmTimer) { clearTimeout(_bgmTimer); _bgmTimer = null; }
}
```

---

## 各画面への組み込み

### BattleScreen.js

```js
import { playSound } from '../utils/sound.js';

// 正解入力時（keydown handler 内）
if (key === targetChar) {
  playSound('correct');        // ← 追加
  // ... 既存の処理 ...
  if (newTyped.length >= question.romaji.length) {
    playSound('wordComplete'); // ← 追加（単語完了時）
    if (newEnemies[enemyIdx].hp <= 0) {
      playSound('enemyDefeat'); // ← 追加（敵撃破時）
    }
  }
} else {
  playSound('miss');           // ← 追加
}
```

### StageClearScreen.js

```js
import { playSound } from '../utils/sound.js';

// コンポーネント内 useEffect
useEffect(() => {
  if (isFail) {
    playSound('stageFail');
  } else {
    playSound('stageClear');
  }
}, []); // マウント時1回

// コインカウントアニメーション内（既存 step 関数）
const step = (ts) => {
  if (!start) start = ts;
  const progress = Math.min((ts - start) / duration, 1);
  const newCoins = Math.floor(totalCoins * progress);
  // 50コイン刻みで鳴らす
  if (Math.floor(newCoins / 50) > Math.floor(displayCoins / 50)) {
    playSound('coinCount'); // ← 追加
  }
  setDisplayCoins(newCoins);
  if (progress < 1) requestAnimationFrame(step);
};
```

### TitleScreen.js / WorldMapScreen.js / ShopScreen.js

```js
import { startBgm, stopBgm } from '../utils/sound.js';

// TitleScreen: マウント時にタイトルBGM開始
useEffect(() => { startBgm('title'); return () => stopBgm(); }, []);

// WorldMapScreen: ワールドマップもタイトルBGM継続
useEffect(() => { startBgm('title'); return () => {}; }, []);

// BattleScreen: バトルBGMに切り替え
useEffect(() => { startBgm('battle'); return () => stopBgm(); }, []);
```

### main.js

BGM の切り替えは各スクリーンコンポーネントで管理するため、`main.js` への変更は不要。

---

## ミュートボタン UI

### 配置

全画面共通のヘッダー右端に配置。`main.js` の App コンポーネントで1箇所管理。

```
┌────────────────────────────────────┐
│ キーボードぼうけん          [🔊]  │  ← ヘッダー
└────────────────────────────────────┘
```

### 実装（main.js の App コンポーネントへ追加）

```js
import { isMuted, toggleMute } from './utils/sound.js';

function App() {
  const [muted, setMuted] = useState(isMuted());

  const handleToggleMute = () => {
    const next = toggleMute();
    setMuted(next);
  };

  return html`
    <div class="viewport" style=${{ transform: `scale(${scale})`, ... }}>
      <!-- ミュートボタン（全画面共通） -->
      <button
        class="btn-mute"
        onClick=${handleToggleMute}
        title=${muted ? '音をオンにする' : '音をオフにする'}
        aria-label=${muted ? '音をオンにする' : '音をオフにする'}
      >
        ${muted ? '🔇' : '🔊'}
      </button>
      <!-- 既存の画面ルーティング -->
      ...
    </div>
  `;
}
```

### CSS（`screens.css` に追加）

```css
.btn-mute {
  position: fixed;
  top: 12px;
  right: 16px;
  z-index: 100;
  background: rgba(255,255,255,0.85);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  transition: transform 0.1s;
}
.btn-mute:active { transform: scale(0.9); }
```

---

## 実装ステップ

| ステップ | 内容 | ファイル |
|---------|------|---------|
| 1 | `sound.js` を作成（SE のみ、BGMなし） | `src/js/utils/sound.js` |
| 2 | `BattleScreen.js` に `playSound()` を組み込む | `src/js/screens/BattleScreen.js` |
| 3 | `StageClearScreen.js` に `playSound()` を組み込む | `src/js/screens/StageClearScreen.js` |
| 4 | ミュートボタンを `main.js` に追加 | `src/js/main.js` + `src/css/screens.css` |
| 5 | BGM ループを `sound.js` に追加 | `src/js/utils/sound.js` |
| 6 | 各画面に `startBgm()` / `stopBgm()` を追加 | 各スクリーンファイル |
| 7 | `ShopScreen.js` / `WorldMapScreen.js` に `uiClick` を追加 | 各スクリーンファイル |

ステップ1〜4だけで主要なSEはすべて機能する。BGM（5〜6）は後から追加可能。

---

## 注意事項

- **AudioContext の初期化タイミング**: ブラウザのポリシーにより、ユーザー操作（クリック・キー入力）の前に `AudioContext` を生成すると `suspended` 状態になる。`ctx()` を遅延初期化する設計で対応済み。
- **音量**: 全体的に控えめ（gain 0.04〜0.18）に設定する。子供が使うため音量が大きすぎないよう注意。
- **iOSのサウンド**: iOS Safari は `touchstart` または `click` 後でないと AudioContext が動かない。タイトル画面の「はじめる」ボタン押下が初回ユーザー操作になるため、問題なく対応できる。
- **BGM音量のバランス**: BGM の gain（0.04）は SE（0.10〜0.18）より大幅に下げ、BGMに埋もれてSEが聞こえなくなるのを防ぐ。
