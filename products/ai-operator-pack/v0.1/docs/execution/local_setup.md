# Local Web App 起動手順 (placeholder)

> ⚠️ **placeholder です**。 Yuino Local Web App の実装は Kai (Aira 実装担当) が `nokaze-aira/` repo で進めています。 actual 起動手順は、 観察試験 (Phase 1) の中で Kai が起稿予定。 公開判断は Phase 6 Launch Readiness Gate (yes/no decision、 evidence ベース)。 本 file は構造の outline のみです。

## 何が起動するか (placeholder)

Yuino Local Web App は、 **手元のパソコンで動くブラウザ画面** です。 起動すると、 ブラウザで `http://127.0.0.1:4327/` (仮 port、 actual は Kai 確定) を開いて、 判断をまとめる画面 が表示される予定です。

## 前提

- Node.js 20+ (LTS 推奨)
- ターミナル (PowerShell / bash / zsh のいずれか)
- ブラウザ (Chrome / Firefox / Edge / Safari)
- AI agent の API キーを 1 つ以上 (Claude / Codex / Gemini のいずれか)

## 起動手順 (公開判断 (Phase 6) 通過時に確定予定、 placeholder)

```bash
# step 1: パッケージのインストール (npm)
npm install -g @nokaze/yuino  # ※ 実際のパッケージ名は Kai 確定後

# step 2: 初回 setup
yuino init

# step 3: Local Web App 起動
yuino start

# step 4: ブラウザで開く
# (起動メッセージに表示される URL を開く、 通常は http://127.0.0.1:4327/)
```

= 上記コマンドは **placeholder です**。 actual コマンドは Kai が `nokaze-aira/` で確定後、 本 file を override します。

## 安全のルール (起動時の動作)

起動時に以下の動作が走ります:

1. ローカルの `~/.local/share/yuino/state/` ディレクトリに data 保存
2. `~/.local/share/yuino/audit.jsonl` に全 action 記録
3. `~/.config/yuino/config.json` に設定保存 (API キー含む、 但し API キーは OS keyring 推奨)
4. **Local-first 厳守**: 起動時に外部送信は発生しない、 user の承認後に AI service 呼び出し

## トラブルシュート (placeholder)

actual トラブルシュートは Kai 起稿後に本 file に inline。 暫定の form:

| 症状 | 確認 |
|---|---|
| `yuino: command not found` | `npm install -g @nokaze/yuino` 完了確認 + PATH 確認 |
| port 4327 が使用中 | 別 port で起動 (`yuino start --port 4328` 等、 placeholder) |
| ブラウザが開かない | 起動メッセージの URL を手動でコピー、 ブラウザに貼り付け |
| API キーエラー | `.env` または OS keyring の API キー確認、 `yuino keys list` で確認 (placeholder) |

## 開発の進捗

- 2026-05-06 夕方: Kai が `nokaze-aira/` で 12 件の commit、 full closed loop 実装完成
- Phase 1 観察試験期間 (2026-05-08〜2026-05-21): Yuino Local Web App の実装着手 (Iwa 補助)
- Phase 1 期間中の dogfood: Zen + Kai が日常で使い続け、 動いた / 失敗した / 復旧した を 14 day 記録
- Phase 6 Launch Readiness Gate (yes/no 判断): 起動手順を確定 + 本 file を完成版に置換

詳細は Kai の `nokaze-aira/README.md` を参照 (公開判断 yes 時に nokaze.dev / GitHub から link 公開)。

---

Zen (nokaze CTO、 Claude Opus 4.7)
2026-05-08 起稿 (Execution layer local_setup placeholder、 起動手順 outline + 前提 + トラブルシュート placeholder、 Kai 主担当の実装が観察試験 Phase 1 〜 Phase 2 完了条件で揃った時点で本 file を完成版に置換予定)
