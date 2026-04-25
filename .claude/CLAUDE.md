# キーボードぼうけん

子供用キーボード練習アプリ

## 要件

`docs/prd.md` 参照

## 構成

* github public リポジトリ

## 実装ルール（実装作業前に必ず読むこと）

実装・修正を行う前に `.claude/rules/` 配下の該当ファイルを読み込むこと。

| ルールファイル | 読むべきタイミング |
|--------------|----------------|
| `.claude/rules/architecture.md` | ファイル新規作成・ディレクトリ構成変更・モジュール追加時 |
| `.claude/rules/save-system.md` | セーブ・ロード・スロット管理に関わる実装時 |
| `.claude/rules/svg-policy.md` | キャラクター・敵・SVGグラフィックの追加・修正時 |
| `.claude/rules/typing-progression.md` | ステージ出題内容・フェーズ構成・単語データに関わる実装時 |
| `.claude/rules/finger-guide.md` | 手SVG・指色分け・キーボードガイドの指示表示に関わる実装時 |

## Skills

* `git-guardrails-claude-code` — 危険な git コマンド（push, reset --hard, clean, branch -D 等）を実行前にブロックするフックを設定
* `grill-me` — 設計・計画について徹底的にインタビューして理解を深める
* `skill-creator` — 新しいスキルの作成・既存スキルの改善・パフォーマンス計測
* `triage-issue` — バグのルート原因調査と GitHub Issue の作成
* `write-a-prd` — ユーザーインタビュー・コードベース調査を経て PRD を GitHub Issue として作成
* `write-a-skill` — 新しいスキルを適切な構造で作成
