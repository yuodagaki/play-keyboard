# フォント・UI最適化 設計書

## 概要

現在の UI を子供の視認性・操作しやすさの観点で監査し、優先度の高い問題を特定・修正する。  
「学習効果に直結する要素（出題文字・ヒント）」と「ストレスなく読める基盤（フォント・コントラスト）」の2軸で改善する。

---

## 現状の問題点 一覧

| # | 箇所 | 問題 | 影響度 |
|---|------|------|--------|
| 1 | バトル・ローマ字ヒント | 22px は 6歳〜8歳には小さい（スケール後15〜18px相当） | 🔴 高 |
| 2 | バトル・「次の文字」 | 色 `#455A64`（ダークグレー）で他文字と判別しにくい | 🔴 高 |
| 3 | フォント読み込み | `Noto Sans JP` の `<link>` が index.html に存在せずシステムフォントにフォールバックする | 🔴 高 |
| 4 | セーブスロット・メタテキスト | 12〜13px は子供には読みにくい | 🟠 中 |
| 5 | ワールドマップ・ステージ番号 | 11px は実スケール 6〜7px 相当になりうる | 🟠 中 |
| 6 | 行間の未設定 | `line-height` がグローバルに指定されておらず、ブラウザデフォルト（約1.2）になっている | 🟠 中 |
| 7 | プログレスセル | 38×38px / 17px は多文字の単語で小さく見える | 🟡 低 |
| 8 | フォーカスリング | `button { outline: none }` でキーボードフォーカスが非表示 | 🟡 低 |
| 9 | muted テキストのコントラスト | `#546E7A` はWCAG AA（4.5:1）ギリギリ。小さいサイズでは不十分な場面がある | 🟡 低 |

### スケール問題について

アプリは `1280×720` 固定の viewport を `Math.min(w/1280, h/720)` でスケーリングしている。  
iPad（768px 幅）では scale ≈ 0.60。CSSの px 値に 0.60 を掛けた値が実際のレンダリングサイズになる。

| CSS px | iPad 実描画 | PC(1440px) 実描画 |
|--------|------------|-----------------|
| 52px（ひらがな出題）| 31px | 52px |
| 22px（ローマ字ヒント）| **13px** | 22px |
| 12px（スロットメタ）| **7px** | 12px |

13px・7px は子供には非常に読みにくい。

---

## 改善仕様

### 1. フォント読み込みの確実化（index.html）

**問題:** `Noto Sans JP` が宣言されているが `<link>` タグが存在しない。  
macOS では標準フォントで代替されるが、Windows・Android ではレンダリングが崩れる。

**修正:** `<head>` に Google Fonts の `<link>` を追加する。

```html
<!-- index.html <head> 内・既存 <link rel="stylesheet"> の前に追加 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700;900&display=swap">
```

`wght@700;900` のみ指定（使用ウェイトを絞りロード時間を最小化する）。  
`display=swap` でフォント読み込み前にシステムフォントで表示し、ロード後に入れ替える。

---

### 2. バトル画面：出題文字・ヒントのサイズアップ

#### 2-1. ひらがな出題文字

```css
/* 変更前 */
.battle-question__hira {
  font-size: 52px;
  letter-spacing: 6px;
}

/* 変更後 */
.battle-question__hira {
  font-size: 64px;
  letter-spacing: 8px;
}
```

#### 2-2. ローマ字ヒント行

```css
/* 変更前 */
.battle-question__hint {
  font-size: 22px;
  letter-spacing: 3px;
  margin-top: 4px;
}

/* 変更後 */
.battle-question__hint {
  font-size: 30px;
  letter-spacing: 5px;
  margin-top: 6px;
}
```

#### 2-3. フェーズA アルファベット出題

```css
/* 変更前 */
.battle-question__alpha {
  font-size: 54px;
  letter-spacing: 4px;
  margin-bottom: 10px;
}

/* 変更後 */
.battle-question__alpha {
  font-size: 72px;
  letter-spacing: 6px;
  margin-bottom: 12px;
}
```

#### 2-4. 出題エリアの高さ確保

ヒントが大きくなるため `battle-question` の高さを調整する。

```css
/* 変更前 */
.battle-question {
  flex: 0 0 148px;
}

/* 変更後 */
.battle-question {
  flex: 0 0 168px;
}
```

`battle-zone` を20px削ることでレイアウトの総高さを維持する。

```css
/* 変更前 */
.battle-zone {
  flex: 0 0 260px;
}

/* 変更後 */
.battle-zone {
  flex: 0 0 240px;
}
```

---

### 3. 「次の文字」ハイライトの強化

現在は `color: '#455A64'` + `fontWeight: '900'` のみ。  
他の文字と差がわかりにくく、特に多文字のローマ字（`sha`, `kyo` 等）で迷いやすい。

#### CSS クラスを追加（screens.css）

```css
/* 新規追加 */
.battle-hint__char {
  display: inline-block;
  transition: color 0.05s;
}

.battle-hint__char--done {
  color: var(--color-secondary);   /* 打鍵済み: 青 */
}

.battle-hint__char--next {
  color: var(--color-text);        /* 次の文字: 濃紺（最大コントラスト） */
  font-size: 120%;                 /* 一回り大きく */
  border-bottom: 3px solid var(--color-text);
  padding-bottom: 1px;
  line-height: 1;
}

.battle-hint__char--pending {
  color: #B0BEC5;                  /* 未入力: グレー */
}
```

#### BattleScreen.js のインラインスタイルをクラスへ置き換え

```js
/* 変更前 */
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

/* 変更後 */
${question.romaji.split('').map((ch, i) => html`
  <span
    key=${i}
    class=${'battle-hint__char ' + (
      i < typed.length      ? 'battle-hint__char--done'
    : i === typed.length    ? 'battle-hint__char--next'
    :                         'battle-hint__char--pending'
    )}
  >
    ${ch.toUpperCase()}
  </span>
`)}
```

---

### 4. 小テキストのサイズ底上げ

子供向けアプリの最小フォントサイズは **16px** を原則とする（スケール後 10px 以上確保のため）。

| セレクタ | 現在 | 変更後 | 対象画面 |
|---------|------|--------|---------|
| `.save-slot-card__label` | 13px | 16px | タイトル |
| `.save-slot-card__meta` | 12px | 14px | タイトル |
| `.stage-node__id` | 11px | 14px | ワールドマップ |
| `.battle-enemy__hp-header` | 12px | 14px | バトル |
| `.battle-hero__label` | 13px | 15px | バトル |
| `.battle-enemy__label` | 13px | 15px | バトル |
| `.shop-item__desc` | 13px | 15px | ショップ |
| `.endless-hero-hp__header` | 11px | 13px | エンドレス |
| `.endless-timer-label` | 10px | 13px | エンドレス |

---

### 5. 行間・letter-spacing の設定

```css
/* base.css の html, body セクションに追加 */
html, body {
  /* 既存プロパティはそのまま */
  line-height: 1.5;      /* 追加: 行間をブラウザデフォルト(1.2)から改善 */
}
```

日本語テキストは `line-height: 1.5〜1.8` が標準。現在の設定なしでは行が詰まりすぎる。

---

### 6. プログレスセルの拡大

長い単語（フェーズF: 5文字以上）でセルが小さく並ぶ問題に対応。  
セルを大きくし、5文字以上では自動的に折り返す。

```css
/* 変更前 */
.battle-progress {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.battle-progress__cell {
  width: 38px;
  height: 38px;
  font-size: 17px;
}

/* 変更後 */
.battle-progress {
  display: flex;
  flex-wrap: wrap;           /* 追加: 折り返し */
  justify-content: center;   /* 追加 */
  gap: 8px;
  margin-top: 10px;
  max-width: 560px;          /* 追加: 最大幅でセンタリング */
}

.battle-progress__cell {
  width: 44px;
  height: 44px;
  font-size: 19px;
}
```

---

### 7. フォーカスリングの復活

現在 `button { outline: none }` で無効化されている。  
キーボード操作時のみフォーカスリングを表示するよう修正する。

```css
/* base.css の button セクションを変更 */

/* 変更前 */
button {
  font-family: var(--font-main);
  cursor: pointer;
  border: none;
  outline: none;      /* ← 削除 */
}

/* 変更後 */
button {
  font-family: var(--font-main);
  cursor: pointer;
  border: none;
  outline: none;
}

/* マウス操作時は非表示、キーボード操作時のみ表示 */
button:focus-visible {
  outline: 3px solid var(--color-secondary);
  outline-offset: 2px;
}
```

`:focus-visible` は CSS4 の擬似クラス。マウスクリック時は発火しない。

---

### 8. muted テキストのコントラスト改善

`--color-muted: #546E7A` を `#455A64` に変更して約 5.3:1 のコントラスト比を確保。  
（WCAG AA 基準 4.5:1 を余裕をもってクリア）

```css
/* base.css の :root */
--color-muted: #455A64;   /* 変更前: #546E7A */
```

この変更は `var(--color-muted)` を使用している全箇所に自動適用される。

---

## 変更ファイルと変更箇所まとめ

| ファイル | 変更内容 |
|---------|---------|
| `src/index.html` | Google Fonts `<link>` タグを追加 |
| `src/css/base.css` | `line-height: 1.5` 追加 / `--color-muted` 変更 / `button:focus-visible` 追加 |
| `src/css/screens.css` | 出題文字・ヒント font-size 変更 / `.battle-hint__char` 系クラス追加 / 小テキストサイズ変更 / プログレスセル拡大 |
| `src/js/screens/BattleScreen.js` | ローマ字ヒントのインラインスタイル → CSS クラスへ置き換え |

---

## 実装ステップ

| ステップ | 内容 | ファイル |
|---------|------|---------|
| 1 | Google Fonts `<link>` を追加してフォントを保証する | `index.html` |
| 2 | `line-height`・`--color-muted`・`focus-visible` をまとめて反映 | `base.css` |
| 3 | 出題文字（ひらがな・アルファベット）のサイズアップ + 出題エリア高さ調整 | `screens.css` |
| 4 | `.battle-hint__char` 系クラスを追加 | `screens.css` |
| 5 | BattleScreen のインラインスタイルをクラスへ置き換え | `BattleScreen.js` |
| 6 | 小テキスト一覧のサイズを一括更新 | `screens.css` |
| 7 | プログレスセルのサイズ・折り返し対応 | `screens.css` |

ステップ1〜2は独立変更のため最初に行う。  
ステップ3〜5はバトル画面の表示崩れが起きないよう連続して実施し、都度ブラウザ確認を推奨する。

---

## 非変更事項

以下は現状維持とする根拠を記す。

| 項目 | 理由 |
|------|------|
| タイトルロゴ `68px` | 十分な大きさ |
| `btn-primary` `22px` | 子供向けとして適切 |
| `key-cap` `36×36px` | キーボードガイドは表示密度とのバランス上これ以上大きくすると全体に収まらない |
| `--color-text: #1A237E` | 背景（`#FFF9E6`）との対比は 9.1:1 で十分 |
| `--color-primary: #FFD700` | ブランドカラーのため変更しない。ただし単独で文字色には使わない（コントラスト比が低いため） |
