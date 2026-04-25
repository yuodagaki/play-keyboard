---
name: アーキテクチャ方針
description: src/ 配下のファイル構成・モジュール設計・技術スタックの実装ルール
---

## 技術スタック

- HTML / CSS / JavaScript（ES Modules）— ビルドステップなし
- React 18 + htm（CDN）: JSXライクな記法をビルドなしで使用
  - `import { html } from 'https://esm.sh/htm/react'`
  - JSXの代わりに `` html`<div>...</div>` `` テンプレートリテラルを使う
- データ: JSONファイルを起動時に `fetch()` で読み込む
- ホスティング: GitHub Pages（`src/` 直下が公開ルート）

## ディレクトリ構成

```
src/
├── index.html              # エントリーポイント、CSS/JS読み込み
├── css/
│   ├── animations.css      # @keyframes 定義（全アニメーション）
│   ├── base.css            # リセット、CSS変数、共通スタイル
│   └── screens.css         # 画面固有スタイル（クラス定義）
├── js/
│   ├── main.js             # App コンポーネント、画面ルーティング
│   ├── utils/
│   │   ├── romaji.js       # toRomaji() 変換ロジック
│   │   └── save.js         # 複数セーブスロット管理（→ save-system.md 参照）
│   ├── data/
│   │   └── loader.js       # JSON fetch & キャッシュ（STAGES, WORLDS, ITEMS）
│   ├── components/
│   │   ├── StickFigure.js  # 棒人間 SVG コンポーネント
│   │   ├── EnemySVG.js     # 敵キャラ SVG コンポーネント
│   │   ├── Confetti.js     # 紙吹雪エフェクト
│   │   └── KeyboardGuide.js # キーボードガイド表示
│   └── screens/
│       ├── TitleScreen.js      # タイトル・セーブスロット選択
│       ├── WorldMapScreen.js   # ワールドマップ
│       ├── BattleScreen.js     # バトル（メインゲームプレイ）
│       ├── StageClearScreen.js # ステージクリア結果
│       └── ShopScreen.js       # ショップ
└── data/
    ├── stages.json     # ステージ定義（id, world, words, enemyType, etc.）
    ├── worlds.json     # ワールド定義（id, name, bg, stages[]）
    ├── words.json      # ひらがな単語リスト（難易度別）
    └── items.json      # 武器・防具・アクセサリ定義
```

## モジュールルール

- すべての JS ファイルは `type="module"` で読み込む
- `index.html` は `<script type="module" src="js/main.js">` 1行のみ
- 各ファイルは `export` で公開し、使う側で `import` する
- グローバル変数は使わない（`window.xxx` への代入禁止）

## CSS ルール

- CSS変数（`--color-primary` 等）を `base.css` の `:root` に定義し全体で使う
- アニメーションは必ず `animations.css` に集約する
- インラインスタイルはコンポーネントに閉じたレイアウト調整のみ許可
- クラス名は BEM ライクに `.screen-battle__hp-bar` 形式で命名

## データ読み込み

- `loader.js` が起動時に全JSONを `fetch()` し、モジュールレベルの変数にキャッシュ
- 各スクリーンは `await getStages()` 等のヘルパー経由でデータを取得する
- JSONを差し替えるだけでコンテンツ追加・修正が完結する設計を維持する

## index.html の構造

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>キーボードぼうけん</title>
  <link rel="stylesheet" href="css/base.css">
  <link rel="stylesheet" href="css/animations.css">
  <link rel="stylesheet" href="css/screens.css">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```
