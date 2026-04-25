---
name: 指使いガイド・手SVG設計
description: キーボードガイドの指色分け・手SVGコンポーネント・アニメーション仕様のルール
---

## 指の色分けシステム

左右同色・指ごとに4色で統一。

| 指 | 色 | カラーコード | 担当キー（左手） | 担当キー（右手） |
|----|----|-----------|--------------|--------------| 
| 人差し指 | 黄 | `#FFD700` | R F V T G B | Y H N U J M |
| 中指 | 緑 | `#4CAF50` | E D C | I K , |
| 薬指 | 青 | `#5BB8FF` | W S X | O L . |
| 小指 | 紫 | `#AB47BC` | Q A Z | P ; / |
| 親指 | グレー | `#90A4AE` | スペース（対象外） | スペース（対象外） |

### キーと指の対応マップ（実装用）

```js
export const KEY_FINGER = {
  // 左手 人差し指
  'R':'L_INDEX','F':'L_INDEX','V':'L_INDEX',
  'T':'L_INDEX','G':'L_INDEX','B':'L_INDEX',
  // 左手 中指
  'E':'L_MIDDLE','D':'L_MIDDLE','C':'L_MIDDLE',
  // 左手 薬指
  'W':'L_RING','S':'L_RING','X':'L_RING',
  // 左手 小指
  'Q':'L_PINKY','A':'L_PINKY','Z':'L_PINKY',
  // 右手 人差し指
  'Y':'R_INDEX','H':'R_INDEX','N':'R_INDEX',
  'U':'R_INDEX','J':'R_INDEX','M':'R_INDEX',
  // 右手 中指
  'I':'R_MIDDLE','K':'R_MIDDLE',',':'R_MIDDLE',
  // 右手 薬指
  'O':'R_RING','L':'R_RING','.':'R_RING',
  // 右手 小指
  'P':'R_PINKY',';':'R_PINKY','/':'R_PINKY',
};

export const FINGER_COLOR = {
  L_INDEX:'#FFD700', R_INDEX:'#FFD700',
  L_MIDDLE:'#4CAF50', R_MIDDLE:'#4CAF50',
  L_RING:'#5BB8FF',  R_RING:'#5BB8FF',
  L_PINKY:'#AB47BC', R_PINKY:'#AB47BC',
};
```

---

## 手SVGコンポーネント

ファイル: `src/js/components/HandSVG.js`

### Props

```js
HandSVG({
  hand: 'left' | 'right',
  activeFingers: string[],  // 例: ['L_INDEX'] — ハイライトする指ID
  pressedFinger: string | null,  // 押し込みアニメーション対象
  flashError: boolean,          // ミス時の赤フラッシュ
})
```

### 構造（角丸矩形の組み合わせ）

viewBox: `0 0 120 140`

各指は `<rect rx="6">` で構成。手のひらは `<rect rx="10">`。

| パーツ | 形状 | x,y,w,h（左手） |
|-------|------|----------------|
| 手のひら | 角丸矩形 | 10, 80, 100, 50 |
| 小指 | 角丸矩形 | 10, 35, 18, 50 |
| 薬指 | 角丸矩形 | 34, 15, 18, 68 |
| 中指 | 角丸矩形 | 58, 8, 18, 75 |
| 人差し指 | 角丸矩形 | 82, 20, 18, 63 |
| ホームポジション突起（●） | 小円 r=4 | 人差し指の先端中央に常時表示 |

右手は左手を水平反転（`transform="scale(-1,1) translate(-120,0)"`）で実現。

### 色の状態

| 状態 | 塗り |
|------|------|
| 次に押す指（active） | `FINGER_COLOR[fingerId]`（フル彩度） |
| それ以外の指 | `#CFD8DC`（グレーアウト） |
| 手のひら | `#ECEFF1`（常時） |
| ミスフラッシュ時（全体） | `filter: brightness(1.5) sepia(1) hue-rotate(310deg) saturate(3)` |

### ホームポジション突起（●）

- 左手人差し指（F）・右手人差し指（J）の指先中央に `<circle r="4" fill="#1A237E">` を常時表示
- これがキーボードの物理的な突起（触覚インジケーター）に対応することを示す

---

## バトル画面での配置

`src/js/screens/BattleScreen.js` のキーボードガイドエリア（画面下部）に追加。

```
┌─────────────────────────────────────┐
│  🤚左手SVG(120×140)  右手SVG🤚       │  ← 手エリア（高さ 100px）
├─────────────────────────────────────┤
│  Q W E R T Y U I O P               │
│   A S D F G H J K L ;  [かくす]     │  ← キーボードガイド（既存）
│    Z X C V B N M , .               │
└─────────────────────────────────────┘
```

- 左手SVGは左寄せ、右手SVGは右寄せ、中央に空白を設けてキーボード中央の区切りを表現
- F・J キーに下線（border-bottom）を常時表示してホームポジションを明示

---

## アニメーション仕様

すべての定義は `src/css/animations.css` に追記する。

| イベント | 対象 | アニメーション | 時間 |
|---------|------|-------------|------|
| 次キー決定 | active指 | 色が変わる（transition） | 0.1s |
| 正解入力 | pressed指 | 指の高さが3px縮む → 戻る | 0.1s → 0.05s |
| ミス入力 | 手SVG全体 | 赤フラッシュ（キーボードと同期） | 0.3s |
| 敵撃破・次単語 | 全指 | グレーに戻る → 次の指が点灯 | 0.1s |

### 押し込みアニメーション（CSS）

```css
@keyframes finger-press {
  0%   { transform: scaleY(1)   translateY(0); }
  60%  { transform: scaleY(0.88) translateY(2px); }
  100% { transform: scaleY(1)   translateY(0); }
}
```

---

## 初回ホームポジションガイド

- **表示条件**: フェーズA Stage 1 の初回プレイ時のみ（localStorage に `kba-fp-shown` フラグを保存）
- **内容**: 手SVGの上に吹き出し「ここがホームポジション！中指と人差し指の間に指を置こう」
- **消去**: 最初のキー入力で自動的に消える
