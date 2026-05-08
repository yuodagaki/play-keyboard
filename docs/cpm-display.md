# CPM 表示設計書

## 概要

バトル中のリアルタイム打鍵速度（CPM: Characters Per Minute）を計測・表示し、  
ステージクリア時に最終CPMを記録・比較できるようにする。

子供が「前より速くなった！」を体感できるシンプルな指標として機能させる。

---

## 用語定義

| 用語 | 意味 |
|------|------|
| CPM | 1分あたりの**正解キー入力数**。ミス入力はカウントしない |
| 計測開始 | 最初の正解キー入力を押した瞬間 |
| 計測終了 | 全敵を倒して `onClear` を呼ぶ瞬間 |
| ベストCPM | そのステージでの過去最高CPM（セーブデータに記録） |

---

## 計測仕様

### タイマーの管理方法

`useRef` で開始タイムスタンプを保持する。`useState` だとクロージャ問題が起きるため。

```js
const battleStartRef = useRef(null); // null = まだ計測開始前
```

### 計測開始トリガー

最初の**正解**キー入力時のみ記録する（誤打でタイマーが動かないよう）。

```js
// keydown handler 内・正解ブランチの先頭
if (battleStartRef.current === null) {
  battleStartRef.current = Date.now();
}
```

### CPM の計算式

```
CPM = correctKeys ÷ ((Date.now() - battleStartRef.current) ÷ 60000)
```

- `correctKeys`: 正解キー入力の累計（既存 state）
- 分母はミリ秒→分変換

### 表示開始の閾値

開始直後は値が不安定なため、以下の両条件を満たすまで `--` を表示する。

| 条件 | 値 |
|------|-----|
| 正解入力数 | 5打 以上 |
| 経過時間 | 2秒 以上 |

```js
function calcCpm(correctKeys, startMs) {
  if (!startMs) return null;
  if (correctKeys < 5) return null;
  const elapsedMin = (Date.now() - startMs) / 60000;
  if (elapsedMin < 2 / 60) return null; // 2秒未満
  return Math.round(correctKeys / elapsedMin);
}
```

### ステージ終了時の最終CPM

`onClear` を呼ぶ直前に算出し、`result` オブジェクトに追加する。

```js
// BattleScreen.js・全敵撃破ブランチ
const finalCpm = calcCpm(newCK, battleStartRef.current) ?? 0;
onClear({ stageId, stars, coinReward, bonusCoins, accuracy: finalAcc, cpm: finalCpm });
```

---

## 状態追加（BattleScreen.js）

既存の state に以下を追加する：

```js
const [cpm, setCpm] = useState(null); // null = 表示前 / number = 表示中
const battleStartRef = useRef(null);
```

keydown handler 内、正解処理のたびに CPM を更新：

```js
if (key === targetChar) {
  // ... 既存の newCK/newTK 更新 ...
  if (battleStartRef.current === null) battleStartRef.current = Date.now();
  setCpm(calcCpm(newCK, battleStartRef.current));
  // ... 以降既存処理 ...
}
```

---

## 表示仕様

### バトル画面（リアルタイム）

現在のステータスバー：

```
← もどる [Esc]  ステージ N  せいかく: XX%  💰 999
```

CPM を `せいかく` の隣に追加：

```
← もどる [Esc]  ステージ N  せいかく: XX%  ⚡ XXX  💰 999
```

#### 表示コード（`battle-status` 内に追記）

```js
<span class="battle-status__cpm">
  ⚡ ${cpm !== null ? cpm : '--'}
</span>
```

#### CSS（`screens.css` に追記）

```css
.battle-status__cpm {
  font-weight: 700;
  color: var(--color-secondary-dark);
  min-width: 60px;
  text-align: right;
}
```

`min-width` を設定することで値の変化によるレイアウトシフトを防ぐ。

---

### クリア画面（最終結果）

#### ランク定義

| CPM範囲 | ランク | ラベル | 色 |
|---------|--------|--------|----|
| 0〜29 | D | ゆっくり | `#90A4AE` |
| 30〜59 | C | ふつう | `var(--color-muted)` |
| 60〜99 | B | はやい ⚡ | `var(--color-success)` |
| 100〜149 | A | すごい！⚡⚡ | `#FF8F00` |
| 150以上 | S | チャンピオン！⚡⚡⚡ | `#E53935` |

```js
function cpmRank(cpm) {
  if (cpm >= 150) return { rank: 'S', label: 'チャンピオン！⚡⚡⚡', color: '#E53935' };
  if (cpm >= 100) return { rank: 'A', label: 'すごい！⚡⚡',       color: '#FF8F00' };
  if (cpm >= 60)  return { rank: 'B', label: 'はやい！⚡',         color: '#4CAF50' };
  if (cpm >= 30)  return { rank: 'C', label: 'ふつう',             color: '#546E7A' };
  return           { rank: 'D', label: 'ゆっくり',                 color: '#90A4AE' };
}
```

#### クリア画面のレイアウト変更

既存の `せいかく: XX%` 表示の下に CPM カードを追加する。  
`cpm === 0`（タイマー未起動・フェーズA等）の場合は非表示。

```
┌──────────────────────────────────┐
│  ステージクリア！                 │
│  ★ ★ ★                         │
│  せいかく: 95%                   │
│                                  │
│  ┌──────────┐  ┌──────────────┐  │
│  │ 💰 +120  │  │ ⚡ 87 CPM   │  │  ← CPMカードを横並びで追加
│  └──────────┘  │  はやい！    │  │
│                │  🏆 じこべスト│  │  ← ベスト更新時のみ表示
│                └──────────────┘  │
└──────────────────────────────────┘
```

`StageClearScreen` のコイン表示と同じカードスタイルで横並びにする。

---

## ベストCPMの保存

### SaveSlot の変更

`progress` フィールドの値オブジェクトを拡張する。  
既存の `stars` フィールドと同じオブジェクト内に追加するため、セーブ構造の大幅変更は不要。

**変更前：**
```js
progress: { [stageId]: { stars: number } }
```

**変更後：**
```js
progress: { [stageId]: { stars: number, bestCpm: number } }
```

旧データ（`bestCpm` がない）との互換は `?? 0` で対応する。

### main.js での保存（`handleBattleClear` 内）

```js
const handleBattleClear = (result) => {
  const { stageId, stars, coinReward, bonusCoins, cpm = 0 } = result; // ← cpm を追加
  const isFail = stars === 0;

  if (!isFail) {
    const existingStars  = slot.progress?.[stageId]?.stars   ?? 0;
    const existingBestCpm = slot.progress?.[stageId]?.bestCpm ?? 0;
    const newProgress = {
      ...slot.progress,
      [stageId]: {
        stars:   Math.max(existingStars, stars),
        bestCpm: Math.max(existingBestCpm, cpm), // ← 追加
      },
    };
    // ... 以降既存処理 ...
  }

  setClearResult(result); // cpm も result に含まれる
  setScreen('stageclear');
};
```

### StageClearScreen へのベストCPM受け渡し

`result` に `cpm` が含まれているほか、比較のために `prevBestCpm` も渡す。

```js
// main.js・handleBattleClear で setClearResult を呼ぶ前に追記
const prevBestCpm = slot.progress?.[stageId]?.bestCpm ?? 0;
setClearResult({ ...result, prevBestCpm });
```

```js
// StageClearScreen の props 展開
const { stageId, stars, coinReward, bonusCoins, accuracy, cpm = 0, prevBestCpm = 0 } = result;
const isNewCpmRecord = cpm > 0 && cpm > prevBestCpm;
```

---

## フェーズAへの対応

フェーズA（アルファベット位置学習）は1文字ずつのランダム出題で  
「打鍵速度」より「正確な位置の習得」が目的のため、CPM表示は**省略**する。

```js
// BattleScreen の render 部分
const showCpm = stage.phase !== 'A';
```

バトル画面・クリア画面ともに `showCpm` が false の場合は CPM UIを非表示にする。

---

## 実装ステップ

| ステップ | 内容 | ファイル |
|---------|------|---------|
| 1 | `calcCpm()` と `cpmRank()` を BattleScreen.js に追加 | `BattleScreen.js` |
| 2 | `battleStartRef`・`cpm` state を追加し、keydown handler に計測ロジックを追記 | `BattleScreen.js` |
| 3 | ステータスバーに `⚡ XXX` 表示を追加 | `BattleScreen.js` |
| 4 | `onClear` の result に `cpm` を追加 | `BattleScreen.js` |
| 5 | `handleBattleClear` で `bestCpm` を保存・`prevBestCpm` を result に追記 | `main.js` |
| 6 | クリア画面に CPM カードを追加 | `StageClearScreen.js` |
| 7 | `.battle-status__cpm` CSS を追加 | `screens.css` |

ステップ1〜4でバトル中の表示が機能する。  
ステップ5〜6でクリア画面の記録比較が完成する。  
ステップ7はレイアウト崩れ防止のため4より前に行うこと。
