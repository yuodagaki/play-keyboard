# エンドレスモード PRD

**バージョン**: 1.0.0  
**作成日**: 2026-04-26  
**ステータス**: ドラフト

---

## 1. 概要

全56ステージをクリアしたプレイヤー向けの「終わりのないバトル」モード。  
ショップで専用アイテムを購入すると解放され、ループを重ねるほど敵が強くなる。  
ゆうしゃのレベルが上がるにつれて出題文字列も長く難しくなる。ゲームオーバーまで続ける1セッション型モード。

---

## 2. アンロック条件・購入

### ショップ追加アイテム

| アイテムID | 表示名 | カテゴリ | 価格 | 効果 |
|-----------|-------|---------|------|------|
| `endless` | おわりなきタイピングのみち | 特殊 | 15,000 コイン | エンドレスモードを解放する |

- 購入は1回のみ。購入後は `slot.ownedSpecials` 配列（新設）に `'endless'` が追加される
- 装備・解除の概念はない（購入即解放）
- ショップの表示順は武器 → 防具 → 特殊の順

### SaveSlot 追加フィールド

```js
// 既存 SaveSlot に追加
ownedSpecials: string[],     // 例: ['endless']
endlessRecord: {
  maxLoop: number,           // 最高到達ループ数（1ループ = 雑魚20体+ボス1体）
  maxLevel: number,          // 最高到達ゆうしゃレベル
  totalMobs: number,         // 累計倒した雑魚敵数
  totalBosses: number,       // 累計倒したボス数
} | null                     // 未挑戦時は null
```

---

## 3. ワールドマップ統合

### ヘッダーへのボタン配置

ワールドマップのヘッダー右側に「エンドレス」ボタンを追加する。

```
┌────────────────────────────────────────────────────────────┐
│ 💰 コイン数   [ショップ]   [エンドレス]                     │  ← ヘッダー
└────────────────────────────────────────────────────────────┘
```

| 状態 | 表示 | 挙動 |
|------|------|------|
| 未購入 | `🔒 エンドレス` グレーアウト | クリックすると「ショップで購入できるよ！」トースト表示 |
| 購入済み | `⚔️ エンドレス` アクティブ | クリックでエンドレス画面へ遷移 |

### ワールドマップへの記録表示

購入済み かつ `endlessRecord !== null` の場合、ワールドマップ画面の末尾（ステージリスト下）に記録バッジを表示する。

```
┌──────────────────────────────────┐
│ 🏆 エンドレス最高記録             │
│  ループ: 3  レベル: 47            │
│  雑魚: 62体  ボス: 3体            │
└──────────────────────────────────┘
```

---

## 4. 画面構成

### 新規ファイル

| ファイル | 役割 |
|---------|------|
| `src/js/screens/EndlessScreen.js` | エンドレスモードのメインバトル画面 |
| `src/js/screens/EndlessGameOverScreen.js` | ゲームオーバー結果表示画面 |

### main.js への追加

```js
// screen 状態に 'endless' / 'endlessgameover' を追加
// ルーティング:
//   'endless'           → <EndlessScreen>
//   'endlessgameover'   → <EndlessGameOverScreen>
```

### EndlessScreen のレイアウト

通常の BattleScreen をベースに、以下を差し替え・追加する。

```
┌─────────────────────────────────────────────────────────┐
│  ← もどる(Esc)   [ループ N]  Lv.XX  XP ████░░░ 100     │  ← ステータスバー
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ゆうしゃ              |              ボス/雑魚          │
│  HP ████████░░ 100/100 |   HP ████░░░░░░  [🔴攻撃バー]  │
│                        |                                │
│  [ATK:XX DEF:XX]       |   （雑魚カウンタ 1/20 or ボス）│
├─────────────────────────────────────────────────────────┤
│  【出題文字列】  [10文字カウンタ ████░░░░░░ 3/10]       │  ← 入力エリア
├─────────────────────────────────────────────────────────┤
│  キーボードガイド（通常モードと同じ）                     │
└─────────────────────────────────────────────────────────┘
```

---

## 5. ゲームループ構造

```
ループ開始
  ↓
雑魚敵 × 20 体（順番に1体ずつ）
  ↓
ボス × 1 体（既存 EnemySVG を 1.7倍スケールで表示）
  ↓
ループカウント+1 → ループ開始へ戻る（ゲームオーバーまで無限）
```

- 雑魚・ボスの種類はランダム選択（既存6種の敵から）
- ボスは敵名に「大」を付けて表示（例: 「大スライム」）
- ボスSVGは既存 `<EnemySVG>` に `boss={true}` prop を追加し、CSS `transform: scale(1.7)` を適用する

---

## 6. ゆうしゃのステータス

### 6.1 初期値

すべての値は `src/js/data/endlessConstants.js` に定数として定義し、調整しやすくする。

```js
export const ENDLESS = {
  // ゆうしゃ初期値
  HERO_HP_INIT:      100,
  HERO_ATK_INIT:     0,    // 装備武器の WEAPON_ATK をそのまま使用
  HERO_DEF_INIT:     0,

  // レベルアップ時の上昇量（ランダムで1項目が上がる）
  LEVELUP_ATK:       3,
  LEVELUP_DEF:       2,
  LEVELUP_HP:        15,   // 最大HP増加分 = 現在HPも同量回復

  // 必要経験値（常に固定）
  XP_PER_LEVEL:      100,

  // 経験値獲得量
  XP_MOB:            10,
  XP_BOSS:           60,

  // 上限
  MAX_LEVEL:         999,
  MAX_ATK:           999,
  MAX_DEF:           999,
  MAX_HP:            999,

  // 攻撃トリガー（N文字正解入力ごとに1回攻撃）
  ATTACK_EVERY_N:    10,

  // 敵攻撃タイマー（ミリ秒）
  ENEMY_TIMER_MS:    2500,
};
```

### 6.2 ゆうしゃステータスの管理

エンドレスモード中はコンポーネントのローカル `state` で管理する（localStorage への保存は不要・ゲームオーバー時に記録のみ保存）。

```js
const [heroHP,     setHeroHP]     = useState(ENDLESS.HERO_HP_INIT);
const [heroMaxHP,  setHeroMaxHP]  = useState(ENDLESS.HERO_HP_INIT);
const [heroDef,    setHeroDef]    = useState(ENDLESS.HERO_DEF_INIT);
const [heroLevel,  setHeroLevel]  = useState(1);
const [heroXP,     setHeroXP]     = useState(0);
const [charCount,  setCharCount]  = useState(0);  // 10文字カウンタ
```

攻撃力 (`heroAtk`) は `WEAPON_ATK[slot.weapon]` を直接参照し、state管理しない。

### 6.3 レベルアップ処理

```
XP が ENDLESS.XP_PER_LEVEL 以上になるたびにレベルアップ
  ↓
['atk', 'def', 'hp'] からランダムで1つ選択
  ↓
atk  → heroAtk_bonus += ENDLESS.LEVELUP_ATK  (999 でキャップ)
def  → heroDef      += ENDLESS.LEVELUP_DEF   (999 でキャップ)
hp   → heroMaxHP    += ENDLESS.LEVELUP_HP; heroHP += ENDLESS.LEVELUP_HP (999 でキャップ)
  ↓
レベルアップ演出（画面中央に「Lv.UP！ こうげきりょく +3」等のフロートテキスト）
```

---

## 7. 敵のスケーリング

### 7.1 雑魚敵

ループ N（1始まり）の雑魚敵HP・攻撃力:

| ループ | 雑魚 HP | 雑魚 攻撃力 |
|-------|--------|----------|
| 1 | 15 | 10 |
| 2 | 20 | 13 |
| 3 | 26 | 16 |
| 4 | 34 | 19 |
| 5 | 44 | 22 |
| N | `ceil(15 × 1.3^(N-1))` | `10 + (N-1) × 3` |

上限: HP は 9999・攻撃力は 999。

### 7.2 ボス

ボスは雑魚の3倍HP・1.5倍攻撃力（小数点切り上げ）。

| ループ | ボス HP | ボス 攻撃力 |
|-------|--------|----------|
| 1 | 80 | 18 |
| 2 | 104 | 23 |
| 3 | 135 | 29 |
| N | `ceil(80 × 1.3^(N-1))` | `ceil(18 × 1.3^(N-1))` |

上限: HP は 99999・攻撃力は 999。

### 7.3 ダメージ計算

```
// ゆうしゃが敵に与えるダメージ（10文字入力ごと）
playerDamage = WEAPON_ATK[slot.weapon]

// 敵がゆうしゃに与えるダメージ（タイポ時 or タイマー切れ時）
enemyDamage = max(1, enemyAtk - heroDef)
```

---

## 8. 戦闘システム

### 8.1 プレイヤーの攻撃

- 正解キーを押すたびに `charCount` を +1
- `charCount % ENDLESS.ATTACK_EVERY_N === 0` になった瞬間に攻撃を発動
- 攻撃演出は通常モードと同じ（ヒーロー攻撃アニメ＋ダメージフロート）
- `charCount` はリセットせず累積し続ける（ループをまたいでも継続）

```
10文字カウンタのUI: 出題エリアに横棒で表示
  ████████░░  8/10  → あと2文字で攻撃
```

### 8.2 敵の攻撃（タイポ時）

- タイポ検出時: 即座に敵が攻撃
- `heroHP -= enemyDamage`
- ゆうしゃのHP表示が赤フラッシュ
- 出題文字列はタイポ時点でリセット（通常モードと同じ挙動）

### 8.3 敵の攻撃（タイマー切れ時）

- 最後の正解キー入力から `ENDLESS.ENEMY_TIMER_MS`（2500ms）経過で攻撃
- タイマーバーは敵のHP表示の下に配置し、左から右へ2500msで消費される赤いバー
- タイマーは**正解キー入力のたびにリセット**（タイポでは止まらない）
- タイマー攻撃時も `heroHP -= enemyDamage` し、バーをフルリセット

```
[敵HP]  ████████░░░░  18/30
[タイマー] ████░░░░░░░░░  (赤)   ← 2.5秒で空になる
```

### 8.4 ゲームオーバー

- `heroHP <= 0` でゲームオーバー
- エンドレスバトル画面からゲームオーバー画面へ遷移

---

## 9. 出題内容の難易度変化

ゆうしゃレベルに応じて `words.json` から取得するセクションが変化する。

| ゆうしゃレベル | 出題元 | 文字数目安 |
|-------------|-------|----------|
| Lv.1〜10    | `words["2"]["easy"]` + `words["3"]["easy"]` | 2〜3文字 |
| Lv.11〜20   | `words["3"]["normal"]` + `words["4"]["easy"]` | 3〜4文字 |
| Lv.21〜30   | `words["4"]["normal"]` + `words["5"]["easy"]` | 4〜5文字 |
| Lv.31〜50   | `words["5"]["normal"]` + `words.sentences["easy"]` | 5〜7文字 |
| Lv.51〜     | `words.sentences["normal"]` + `words.sentences["hard"]` | 6〜8文字 |

- 各ランクの2つのプールは50/50の確率でランダム選択
- レベルアップ時に次の問題から難易度が変化（現在入力中の単語は維持）
- ローマ字変換は通常モードと同じ `toRomaji()` を使用
- フェーズA（アルファベット）は出題しない（エンドレスモードはひらがな単語前提）

---

## 10. ゲームオーバー画面（EndlessGameOverScreen）

### 表示内容

```
┌──────────────────────────────────────────────┐
│        ゲームオーバー                          │
│                                              │
│  到達ループ:    3                             │
│  さいこうレベル: 47                           │
│  たおした雑魚:  62 体                         │
│  たおしたボス:   3 体                         │
│                                              │
│  ベスト記録更新！ 🎉  ← 最高記録を超えた場合のみ │
│                                              │
│  [もう一度挑戦する]   [ワールドマップへ]        │
└──────────────────────────────────────────────┘
```

### 記録の保存タイミング

ゲームオーバー時に `slot.endlessRecord` を更新し `saveSlot()` を呼ぶ。  
**各フィールドは過去最高値を上書きしない（累計値は累積加算、最大値は `Math.max` で更新）。**

```js
const newRecord = {
  maxLoop:     Math.max(slot.endlessRecord?.maxLoop    ?? 0, currentLoop),
  maxLevel:    Math.max(slot.endlessRecord?.maxLevel   ?? 0, heroLevel),
  totalMobs:   (slot.endlessRecord?.totalMobs   ?? 0) + sessionMobs,
  totalBosses: (slot.endlessRecord?.totalBosses ?? 0) + sessionBosses,
};
```

---

## 11. 演出・UI 詳細

### レベルアップ演出

- バトルを一時停止しない（演出と並行してゲームは続く）
- 画面中央上部に 1.5秒間フロートテキストを表示:  
  `「Lv.47 ▲ こうげきりょく +3」`

### ゆうしゃHP表示

- 通常モードにはなかったゆうしゃのHP表示を追加
- バトルゾーン左側（ヒーロー側）にHP表示を追加

### ループ開始演出

- ループが増えるたびに `「ループ N かいめ！」` を 1秒間表示

### Esc キー

- 押すとワールドマップへ戻る（進行状況は失われる）
- 確認ダイアログは出さない（子供向けシンプル優先）

---

## 12. 実装ファイル一覧

### 新規作成

| ファイル | 内容 |
|---------|------|
| `src/js/screens/EndlessScreen.js` | メインバトル画面（EndlessGameOver への遷移含む） |
| `src/js/screens/EndlessGameOverScreen.js` | ゲームオーバー結果・記録保存 |
| `src/js/data/endlessConstants.js` | 全数値定数（`export const ENDLESS = {...}`） |

### 変更が必要な既存ファイル

| ファイル | 変更内容 |
|---------|--------|
| `src/js/main.js` | `screen` に `'endless'`/`'endlessgameover'` 追加・ルーティング・`handleEndlessGameOver` ハンドラ |
| `src/js/screens/WorldMapScreen.js` | ヘッダーに「エンドレス」ボタン追加・記録バッジ表示 |
| `src/js/screens/ShopScreen.js` | 特殊カテゴリ「おわりなきタイピングのみち」追加 |
| `src/js/utils/save.js` | `SaveSlot` 型に `ownedSpecials` と `endlessRecord` を追加・`defaultGameState()` の初期値更新 |
| `src/js/components/EnemySVG.js` | `boss` prop を追加し、`true` の時に `transform: scale(1.7)` を適用 |
| `src/data/items.json` | 特殊カテゴリのアイテムとして `endless` を追加 |
| `src/css/screens.css` | エンドレス専用クラス（タイマーバー・ゆうしゃHP・レベル表示等）追加 |

---

## 13. データスキーマ変更

### items.json への追加

```json
{
  "specials": [
    {
      "id": "endless",
      "name": "おわりなきタイピングのみち",
      "description": "エンドレスモードがかいほうされる！",
      "cost": 15000,
      "emoji": "♾️"
    }
  ]
}
```

### save.js defaultGameState() の変更

```js
export function defaultGameState() {
  return {
    coins: 0,
    weapon: 'wooden',
    armor: 'hat',
    ownedWeapons: ['wooden'],
    ownedArmors: ['hat'],
    ownedSpecials: [],        // 追加
    progress: {},
    maxUnlocked: 1,
    endlessRecord: null,      // 追加
  };
}
```

---

## 14. スコープ外（将来拡張）

| 機能 | 備考 |
|------|------|
| エンドレス中のショップ | RFC で明示的にスコープ外 |
| ボス専用 SVG デザイン | 現在はスケール変換で代替 |
| オンラインランキング | サーバー不要のオフライン設計を維持 |
| エンドレス中のポーズ機能 | Esc キーで直接ワールドマップへ |

---

*このドキュメントはエンドレスモード実装のための設計仕様書です。数値定数（`endlessConstants.js`）はプレイテスト後に随時調整してください。*
