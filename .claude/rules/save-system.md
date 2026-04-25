---
name: セーブシステム設計
description: localStorage への複数セーブスロット保存・読み込み・削除の実装ルール
---

## 概要

プロトタイプの単一セーブ（`kba-v2`）を廃止し、最大3スロットの複数セーブに対応する。
実装ファイル: `src/js/utils/save.js`

## データ構造

```js
// localStorage キー
const STORAGE_KEY = 'kba-saves';

// セーブデータ全体
type SaveStore = SaveSlot[]  // 最大3件

// 1スロットの型
type SaveSlot = {
  id: string,           // 作成時のタイムスタンプ文字列 (例: "1745123456789")
  name: string,         // 表示名 (例: "ファイル 1")
  createdAt: string,    // ISO 8601
  lastPlayedAt: string, // ISO 8601
  playtimeMin: number,  // 累計プレイ時間（分）
  // --- 以下はゲーム状態 ---
  coins: number,
  weapon: string,       // 装備中の武器ID
  armor: string,        // 装備中の防具ID
  ownedWeapons: string[],
  ownedArmors: string[],
  progress: Record<number, number>,  // {[stageId]: stars (1-3)}
  maxUnlocked: number,
}
```

## 公開API（`save.js` から export）

```js
// 全スロット取得
export function loadAllSlots(): SaveSlot[]

// 特定スロット取得
export function loadSlot(id: string): SaveSlot | null

// スロット作成（空き枠がない場合は null を返す）
export function createSlot(name: string): SaveSlot | null

// スロット保存（ゲーム状態を上書き保存）
export function saveSlot(slot: SaveSlot): void

// スロット削除
export function deleteSlot(id: string): void

// 空きスロット数
export function availableSlotCount(): number  // 最大3 - 現在件数

// デフォルトゲーム状態（新規スロット作成時の初期値）
export function defaultGameState(): Omit<SaveSlot, 'id'|'name'|'createdAt'|'lastPlayedAt'|'playtimeMin'>
```

## タイトル画面でのスロット選択UI

- 3スロット分のカードを横並びで表示
- 使用中スロット: 最終プレイ日時・最高解放ステージ・プレイ時間を表示
- 空きスロット: 「あたらしくはじめる ＋」ボタン
- スロットカードの長押し（500ms）またはサブボタンで削除確認ダイアログを表示
- 削除時は「ほんとうにけす？」確認を必ず挟む（即時削除禁止）

## セーブタイミング

| タイミング | 処理 |
|-----------|------|
| ステージクリア時 | `saveSlot()` を呼ぶ |
| アイテム購入・装備変更時 | `saveSlot()` を呼ぶ |
| アプリ終了・画面遷移時 | 自動保存しない（明示的なタイミングのみ） |

## 移行・互換

- 旧キー `kba-v2` は参照しない（プロトタイプとの互換不要）
- `kba-saves` が存在しない場合は空の配列として扱う
