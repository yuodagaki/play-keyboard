# デザインシステム（Claude 実装用ルール）

このファイルは **Claude が UI を実装・修正するときの制約集**。
詳細な経緯・設計判断の根拠は `docs/view-design.md` / `docs/ui-typography-optimization.md` を参照。

---

## 1. デザイントークン（CSS 変数）

すべての色・影・角丸は `base.css` の `:root` 変数を使う。ハードコードした値を新たに追加しない。

### カラー

| 変数 | 値 | 用途 | 禁止パターン |
|------|-----|------|------------|
| `--color-primary` | `#FFD700` | コイン・強調・プライマリボタン背景 | **文字色には使わない**（コントラスト不足） |
| `--color-primary-dark` | `#F9A825` | ボタン影 | — |
| `--color-secondary` | `#5BB8FF` | ボタン・ハイライト・打鍵済み文字 | — |
| `--color-secondary-dark` | `#1E88E5` | セカンダリボタン影 | — |
| `--color-success` | `#4CAF50` | 正解・装備中バッジ | — |
| `--color-error` | `#FF5252` | ミス・ダメージ | — |
| `--color-bg` | `#FFF9E6` | バトル画面・ショップ画面背景 | — |
| `--color-text` | `#1A237E` | 本文・見出し（コントラスト比 9.1:1） | — |
| `--color-muted` | `#455A64` | 補足テキスト（コントラスト比 5.3:1） | — |
| `--color-border` | `#E0E0E0` | カード・入力枠の境界線 | — |
| `--color-header-bg` | グラデーション | ヘッダー背景 | — |

### フォント

| 変数 | 値 | 用途 |
|------|-----|------|
| `--font-main` | `'Noto Sans JP', sans-serif` | すべてのテキスト |
| `--font-mono` | `'Courier New', monospace` | キーキャップ・プログレスセル文字 |

### 角丸

| 変数 | 値 | 使いどころ |
|------|-----|----------|
| `--radius-sm` | `8px` | キーキャップ・小ボタン |
| `--radius-md` | `12px` | ツールチップ・ゴーストボタン |
| `--radius-lg` | `18px` | プライマリ・セカンダリボタン |
| `--radius-xl` | `24px` | カード・ポップアップ・ダイアログ |

### 影

| 変数 | 用途 |
|------|------|
| `--shadow-btn` | `.btn-primary` のボックスシャドウ |
| `--shadow-card` | `.card` のボックスシャドウ |
| `--shadow-header` | `.header` のボックスシャドウ |

---

## 2. レイアウト基盤

- **固定 viewport**: 1280×720px（`game-viewport` クラス）
- **スケーリング**: `Math.min(w/1280, h/720)` で縮小される。CSS の px 値は 1280×720 基準で書く
- **スケール後サイズ**: iPad（768px 幅）では ×0.60 になる。**CSS 16px → 実描画 9.6px** が子供向け最小ライン

### 画面の縦構成（バトル画面の例）

```
.header / .battle-status  高さ固定
.battle-zone              flex: 0 0 240px
.battle-question          flex: 0 0 168px
.keyboard-guide           flex: 1（残り）
```

`flex: 1` は 1 エリアだけに使い、残りは固定高さで積む。

---

## 3. タイポグラフィ制約（子供向け基準）

| 区分 | 最小サイズ | 根拠 |
|------|----------|------|
| 本文・補足 | **16px** | スケール後 9.6px が限界ライン |
| ラベル・メタ | **14px** | スケール後 8.4px まで許容 |
| 出題文字（ひらがな） | 64px | — |
| 出題文字（アルファベット） | 72px | — |
| ローマ字ヒント | 30px | — |
| タイトルロゴ | 68px | — |

- `font-weight: 900`（Black）を見出し・出題テキストに使う
- `font-weight: 700`（Bold）を補足テキスト・ボタンに使う
- `letter-spacing`: ひらがな出題 `8px`、ローマ字ヒント `5px`、アルファベット出題 `6px`
- `line-height: 1.5` がグローバルに設定済み（`base.css`）。上書きするときは `1` 以上を維持する

---

## 4. 共通コンポーネント仕様

### ボタン

既存クラスを使う。新しいボタンクラスを作らない。

| クラス | 用途 | 文字色 | 背景 |
|-------|------|--------|------|
| `.btn-primary` | メインアクション（次へ・はじめる） | `var(--color-text)` | `var(--color-primary)` |
| `.btn-secondary` | サブアクション（キャンセル・装備） | `white` | `var(--color-secondary)` |
| `.btn-ghost` | 補助操作（もどる・とじる） | `var(--color-muted)` | `white` + border |

ボタンの hover は `translateY(-3px)`、active は `translateY(4px)` で統一。

### カード

`.card` クラス（`border-radius: var(--radius-xl); padding: 28px 40px; box-shadow: var(--shadow-card)`）を基本形とする。

### ヘッダー

`.header` クラス（高さ 64px、`var(--color-header-bg)` 背景）を全画面で使う。バトル画面だけ `.battle-status`（高さ 48px）を使う。

### オーバーレイ・ダイアログ

| 要素 | 背景 | アニメーション |
|------|------|-------------|
| モーダル背景 | `rgba(0,0,0,0.5〜0.6)` | なし |
| ダイアログカード | `white` + `.card` スタイル | `slide-up 0.2〜0.3s` |
| トースト通知 | `var(--color-text)` 背景 + 白文字 | `slide-up 0.25s` |

### キーキャップ

`.key-cap` は 36×36px、`var(--radius-sm)`、`var(--font-mono)` で統一。状態クラス:

| クラス | 見た目 |
|-------|-------|
| `.key-cap--inactive` | グレー（`#CFD8DC`）|
| `.key-cap--available` | 指色（`FINGER_COLOR` より）|
| `.key-cap--next` | scale(1.2) + 点滅リング |
| `.key-cap--home` | 底面に白マーク（F・J キー） |

---

## 5. 画面別背景

| 画面 | 背景 |
|------|------|
| タイトル | `linear-gradient(to bottom, #42A5F5 0%, #90CAF9 52%, #81C784 52%, #4CAF50 100%)` |
| ワールドマップ | `linear-gradient(170deg, #E8F5E9, #C8E6C9)` |
| バトル | `var(--color-bg)`（クリーム） |
| ステージクリア | `linear-gradient(135deg, #E8F5E9, #DCEDC8)` |
| ステージ失敗 | `linear-gradient(135deg, #FFF9E6, #FFF3CD)` |
| ショップ | `var(--color-bg)` |
| エンドレス | `linear-gradient(160deg, #1A237E, #283593, #1565C0)` |
| エンドレスゲームオーバー | `linear-gradient(160deg, #37474F, #263238)` |

---

## 6. アニメーション

すべての `@keyframes` 定義は `animations.css` に書く。コンポーネント内に書かない。

| 演出 | クラス / keyframes | 時間 |
|------|------------------|------|
| 画面・ダイアログ登場 | `slide-up` | 0.2〜0.3s ease-out |
| 攻撃（主人公） | `hero-attack` | インラインstyle で適用 |
| ダメージフロート | `dmg-float` | 0.6s ease-out forwards |
| ステージノード点滅 | `stage-pulse` | 1.8s ease-in-out infinite |
| 次キーリング | `key-next-ring` | 0.9s ease-in-out infinite |
| ミスフラッシュ | `miss-flash` | 0.32s ease-out |
| 指押し込み | `finger-press` | 0.1s → 0.05s |
| タイトルロゴ浮遊 | `title-float` | 3s ease-in-out infinite |
| チュートリアルグロー | `tutorial-glow` | 1.4s ease-in-out infinite |

**敵ダメージフラッシュ**は `filter: brightness(2.8) saturate(0) sepia(1) hue-rotate(310deg)` で CSS 変数を使わずに直接指定する（svg-policy.md 参照）。

---

## 7. アクセシビリティ

- `button:focus-visible` のフォーカスリングは `base.css` で設定済み（`outline: 3px solid var(--color-secondary)`）。個別に `outline: none` を上書きしない
- 精度フィードバックは色だけでなく文字列（「せいかく 82%」）でも伝える
- コントラスト比: `--color-text` / `--color-bg` = 9.1:1 ✅、`--color-muted` / `white` = 5.3:1 ✅

---

## 8. 禁止パターン

- **インラインスタイル禁止**（ただしアニメーション適用・動的な幅・transform など JS で計算が必要な値は許可）
- **ハードコードカラー禁止**（CSS 変数を使う）
- **新しいボタンクラス禁止**（`.btn-primary` / `.btn-secondary` / `.btn-ghost` を使い回す）
- **`!important` 禁止**
- **`window.xxx` グローバル変数禁止**（architecture.md 参照）
- **画像ファイル（PNG/JPG 等）禁止**（svg-policy.md 参照）
