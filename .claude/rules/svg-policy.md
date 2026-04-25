---
name: SVGグラフィック方針
description: キャラクター・敵・UIアイコンをSVGで表現するルールと実装パターン
---

## 原則

- **画像ファイル（PNG/JPG/WebP/GIF）は一切使用しない**
- すべてのキャラクター・敵・演出グラフィックは SVG で実装する
- SVG は React コンポーネントとして `src/js/components/` に定義する
- 外部 SVG ファイル（`<img src="*.svg">`）も使わない。すべてインライン SVG

## StickFigure コンポーネント（棒人間主人公）

ファイル: `src/js/components/StickFigure.js`

```
Props:
  weapon: 'wooden' | 'iron' | 'flame'
  armor: 'hat' | 'helmet' | 'cape'
  pose: 'idle' | 'attack' | 'victory' | 'scratch'
  color: string  (デフォルト '#1A237E')
  animStyle: object  (アニメーション用インラインスタイル)
```

- 装備はSVGパーツの追加で表現する（別ファイルや画像への差し替えは行わない）
- 新しいポーズを追加する場合は `poseArms` オブジェクトに座標を追記する
- 新しい武器・防具を追加する場合はコンポーネント内の条件分岐に追記する

## EnemySVG コンポーネント（敵キャラクター）

ファイル: `src/js/components/EnemySVG.js`

```
Props:
  type: 'slime' | 'mushroom' | 'goblin' | 'bat' | 'skeleton' | 'golem'
  flash: boolean  (ダメージフラッシュ)
  falling: boolean (撃破アニメーション)
```

- 新しい敵タイプを追加する場合はコンポーネント内に描画関数を追加し、`type` プロップで切り替える
- すべての敵は `viewBox="0 0 140 160"` で統一する
- ダメージフラッシュは CSS filter で実装する（`brightness(2.8) saturate(0) sepia(1) hue-rotate(310deg)`）

## SVGコンポーネントの実装パターン

```js
// EnemySVG.js の追加例（新しい敵タイプ）
function renderDragon(style) {
  return html`
    <g style=${style}>
      <!-- SVGパーツ -->
    </g>
  `;
}

export function EnemySVG({ type, flash, falling }) {
  const style = falling
    ? { animation: 'enemy-fall 0.5s ease-in forwards', transformOrigin: '70px 130px' }
    : flash
    ? { filter: 'brightness(2.8) saturate(0) sepia(1) hue-rotate(310deg)' }
    : {};

  const renderers = {
    slime: renderSlime,
    mushroom: renderMushroom,
    // ... 追加分はここに登録
    dragon: renderDragon,
  };

  return html`<svg width="160" height="175" viewBox="0 0 140 160" style="overflow:visible">
    ${renderers[type]?.(style)}
  </svg>`;
}
```

## UI絵文字との使い分け

- ゲームキャラクター（主人公・敵）: 必ず SVG コンポーネント
- UIアイコン（コイン💰・星⭐・鍵🔒等）: 絵文字使用可（SVG不要）
- ボタンアイコン・ワールドマップアイコン: 絵文字使用可

## アニメーション

- SVG 要素のアニメーションは CSS `@keyframes`（`animations.css`）で定義し、`style` プロップで適用する
- SVG内の `<animate>` タグは使用しない（CSS で統一）
