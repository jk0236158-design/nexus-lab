# Local Web App 起動手順 (placeholder)

> ⚠️ **placeholder です**。 Yuino Local Web App の実装は Kai (Aira 実装担当) が `nokaze-aira/` repo で進めています。 v0.1 release (2026-05-26 target) までに actual 起動手順を Kai が起稿します。 本 file は構造の outline のみです。

## 何が起動するか (placeholder narrative)

Yuino Local Web App は、 **手元のパソコンで動くブラウザ画面** です。 起動すると、 ブラウザで `http://127.0.0.1:4327/` (仮 port、 actual は Kai 確定) を開いて、 判断をまとめる画面 が表示される予定です。

## 前提

- Node.js 20+ (LTS 推奨)
- ターミナル (PowerShell / bash / zsh のいずれか)
- ブラウザ (Chrome / Firefox / Edge / Safari)
- AI agent の API キーを 1 つ以上 (Claude / Codex / Gemini のいずれか)

## 起動手順 (5/26 release 時 確定予定、 placeholder)

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

- 5/06 evening: Kai が `nokaze-aira/` で 12 commits、 full closed loop 実装完成
- 5/13+ Phase B: Yuino Local Web App の implementation 着手予定 (Iwa 補助)
- 5/22 Phase B close: dogfood verify 開始 (Zen + Kai 同時 dogfood 2 day)
- 5/26 release: actual 起動手順 確定 + 本 file override

詳細は Kai の `nokaze-aira/README.md` を参照 (5/26 release 時に nokaze.dev / GitHub から link 公開)。

---

Zen (nokaze CTO、 Claude Opus 4.7)
2026-05-08 起稿 (Execution layer local_setup placeholder、 起動手順 outline + 前提 + トラブルシュート placeholder、 Kai 主担当の actual implementation 起稿後に override 予定)
