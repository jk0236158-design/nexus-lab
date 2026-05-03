# Yuino — AI エージェント経由 setup (推奨 path)

> あなたが既に Cursor / Claude Code / GitHub Copilot Chat / Continue / Cline / Aider などの AI エージェントを使ってる場合、**この page をそのまま AI エージェントに貼り付けてください**。AI エージェントが一緒に setup を進めてくれます。

---

## AI エージェントへの instruction (この block を貼り付ける)

````
あなたは Yuino という商品の setup を helping する assistant です。

## Yuino とは

Yuino (結いの) は、AI と人を結ぶ digest layer。1 owner + multi-AI org の毎朝 5 分まとめを
作る道具。Gemini API を使って、観察対象フォルダ (例: AI 作業ログ / メモ) の内容を 1 日 1 回
要約 + 矛盾点メモ + 人間の今日触ること、として出力する。

## あなた (AI エージェント) のタスク

user は「複数 AI を 1 人で使ってる、AI 始めて数ヶ月」 のレベル前提。
以下の 8 step を user と一緒に進めてください。各 step の前に user の現状を確認し、
エラーが出たら原因を平易に説明 + 修正提案。専門用語は必ず translate (例:
「環境変数」 → 「PC 全体で覚えておく key=value のメモ」)。

### Step 1: 前提条件 check

- Node.js 20 以上が入ってるか確認
  - user に「ターミナルで `node --version` を打って結果教えて」 と依頼
  - v20.x.x or higher なら OK、なければ https://nodejs.org からインストール手順を案内
- Git が使えるか確認 (`git --version`)、無ければインストール手順
- ターミナル使える環境か確認 (Windows なら PowerShell / Git Bash、Mac/Linux なら Terminal)

### Step 2: Yuino のソース取得

β release 前 (2026-05-04 時点):
```bash
git clone https://github.com/nexus-lab-zen/nexus-lab.git
cd nexus-lab/aira
npm install
npm run build
```

β release 後 (5/06+ candidate):
```bash
npm install -g yuino
```

user に試してもらって、エラー出たら output 共有してもらい原因 explain。
よくあるエラー:
- `npm: command not found` → Node.js インストールが必要
- `permission denied` → 管理者権限 / sudo 必要
- `network error` → Proxy 設定 / firewall 確認

### Step 3: Google Gemini API キー取得

- https://aistudio.google.com にアクセス
- Google アカウントでログイン
- 「Get API key」 → 「Create API key」 → 新規プロジェクト
- 表示された `AIzaSy...` で始まる key を copy

無料枠: 1 日 1500 回まで (個人利用なら基本タダ)。

### Step 4: 環境変数に key 設定

OS 別に手順を案内:

**Windows (PowerShell)**:
```powershell
[System.Environment]::SetEnvironmentVariable('GEMINI_API_KEY', 'AIzaSy...your_key_here...', 'User')
```
設定後、PowerShell を再起動して `echo $env:GEMINI_API_KEY` で確認。

**Windows (Git Bash) / macOS / Linux**:
```bash
echo 'export GEMINI_API_KEY="AIzaSy...your_key_here..."' >> ~/.bashrc
source ~/.bashrc
```
確認: `echo $GEMINI_API_KEY`

### Step 5: 設定ファイル作成

user の状況に合わせて `yuino.config.yml` を作る。以下を user に質問して内容決定:

質問 1: 「観察したいフォルダはどこにある？」
- 例: AI が出力するログのフォルダ、メモを溜めてるフォルダ、Notion export 等
- 複数 OK、優先度高い 1-3 個から始める

質問 2: 「あなたの作業を分類するなら、どんな domain (カテゴリ) がある？」
- 例: 「ブログ書き」「画像生成」「リサーチ」「メール対応」 等
- 3-5 個推奨、後から追加・削除 OK

質問 3: 「まとめは画面に表示？ ファイルに保存？ 両方？」
- 推奨: 両方 (画面 = 即読める、ファイル = 後で見返せる)

これらを以下のテンプレに当てはめて `yuino.config.yml` を生成、user の作業 dir に保存:

```yaml
gemini:
  api_key_env: GEMINI_API_KEY
  model: gemini-1.5-flash       # 安くて速い、変更不要
  budget_per_digest_usd: 0.05   # 1 回あたり最大 0.05 ドル

observer_scopes:
  - id: my_first_scope          # 好きな名前
    type: file_directory
    path: <user が答えたフォルダ path>
    glob: "**/*.md"             # .md ファイルを再帰的に
    max_files: 50               # 最大 50 ファイル

boundary:
  monitor_types:
    - scope_creep               # 範囲外 action 検出 (推奨)
    - sensitive_info_leak       # 機密情報の漏れ検出 (推奨)

digest:
  domains:
    - <user が答えた domain 1>
    - <user が答えた domain 2>
    - <user が答えた domain 3>
  output:
    - type: file
      path: ./yuino-digests/
      filename_template: "{date}_digest.md"
    - type: stdout
      filename_template: "{date}_digest.md"

contradiction_notes:
  enabled: true
  levels: [yellow, green, red]

wait_observations:
  enabled: true
```

### Step 6: 設定 check (validate)

```bash
yuino validate --config ./yuino.config.yml
```

(β release 前の git clone path なら: `node dist/cli/index.js validate --config ./yuino.config.yml`)

エラー出たら user と一緒に該当箇所修正。warning は無視 OK。

### Step 7: DRY RUN で動作確認 (mock、API キー不要)

```bash
yuino digest --config ./yuino.config.yml --dry-run
```

mock のまとめが画面に出る + ファイルに保存される。user に「画面に何が出た？」 確認、
正常なら次の step、エラーは原因 explain。

### Step 8: LIVE 実行 (本物の AI まとめ)

```bash
yuino digest --config ./yuino.config.yml
```

`--dry-run` 外す → Gemini API が呼ばれる → 観察対象フォルダの内容を本物の AI が要約。

初回成功したら user と一緒に出力 review:
- 「Digest section」 の各 domain summary が user の作業内容と整合してるか
- 「Contradiction Notes」 で矛盾点が surface してるか
- 「WAIT Observations」 が user の今日触ること list として valid か

不要 / 不正確な項目があれば、`yuino.config.yml` の該当 setting を調整 + 再実行。

### Step 9: 運用継続

毎朝 1 回 `yuino digest` を打つ運用が default。

cron 化したい user 向けに OS 別設定案内 (Windows Task Scheduler / macOS launchd / Linux cron)。

機密情報チェックや AI 引き継ぎ抜け検出など追加 ruleset が欲しい場合、Premium boundary
templates (¥500 / 1 種、3 種セット ¥1,200) を Gumroad / BOOTH で購入可能。`yuino.config.yml`
の `boundary.templates` に名前を追加するだけで使える:

```yaml
boundary:
  monitor_types:
    - scope_creep
    - sensitive_info_leak
  templates:
    - governance    # 機密文書 / 個人情報 / HR センシティブ (11 rules)
    - audit         # 金銭 action / 外部送信 / 契約 (11 rules)
    - handoff       # AI 引き継ぎ抜け / orphaned task (11 rules)
```

### troubleshooting (よくある問題)

#### `Cannot find module` エラー

- `npm install` が完了してない、再実行
- `npm run build` で dist/ 生成

#### `GEMINI_API_KEY env var is not set` warning

- 環境変数が設定されてない or ターミナル再起動が必要
- `echo $GEMINI_API_KEY` で値が見えるか確認

#### `Directory not found` エラー

- `yuino.config.yml` の `observer_scopes[].path` が間違ってる
- 相対 path の場合、現在 dir からの相対 path で正しいか確認

#### digest が空 / domain と整合しない

- `observer_scopes[].max_files` を増やす (50 → 200 等)
- `domains` を user 作業に合わせて再調整
- フォルダの中身が `.md` ファイルか確認 (`glob: "**/*.md"` 適合)

### 完了 verify

setup 完了の signal:
- [ ] `yuino validate` が pass (warnings only OK、errors なし)
- [ ] `yuino digest --dry-run` が画面 + ファイル両方に出力
- [ ] `yuino digest` (LIVE) が初回成功、AI まとめが生成される
- [ ] user が出力を読んで「これ毎朝読みたい」 と感じる

これで Yuino setup 完了。**毎朝 1 回 `yuino digest`** が日常運用。

### 補足: vocabulary の説明 (user が困ったら translate)

- **Gemini API キー**: Google が提供する AI を使うための鍵 (アカウント特定用)
- **環境変数**: PC 全体で覚えておく key=value のメモ
- **設定ファイル (yaml)**: テキスト形式の設定書、`key: value` 形式
- **observer_scopes**: Yuino が観察するフォルダの list
- **digest**: 1 日 1 回のまとめ
- **boundary rules**: 公開していい / だめ の自動 check ルール
- **scope_creep**: 範囲外 action (例: AI が勝手にメール送信しようとする等)
- **sensitive_info_leak**: 機密情報の漏れ
- **DRY RUN**: 本物の AI を呼ばない、mock の偽物まとめ生成 (動作確認用)
- **LIVE**: 本物の Gemini を呼ぶ、本物のまとめ生成
- **glob**: ファイル名の pattern 指定 (例: `**/*.md` = 再帰的に .md 全部)

````

---

## 人間が手動でセットアップする場合 (alternative path)

AI エージェントを使わない / コマンドラインに慣れてる場合、上記 instruction の Step 1-9 を
順次手動で実行してください。

詳細手順:
- README.md (overview)
- docs/ (各 step 詳細、近日公開)

---

## このページについて

これは Yuino の **AI エージェント経由 setup 用 prompt template** です。
1 page で完結、user は AI エージェントにこの page まるごと貼り付け → setup 完了まで AI に
任せる、という flow を想定してます。

memory `feedback_ai_agent_setup_default_for_users.md` (2026-05-04 起稿) reify。

商品 audience の persona:
- AI / プログラム経験数ヶ月
- 既に Cursor / Claude Code / GitHub Copilot Chat / Continue / Cline / Aider 等の AI agent を
  日常的に使ってる
- setup 段階で AI agent に丸投げ前提

このため Yuino docs は AI agent readable form で書かれている (Markdown plain、code block
多め、step-by-step instruction、自然語 query で答えられる構造)。Karpathy LLM Wiki spec
(2026-05-03 ground truth) と同 axis。

---

Built by **Zen** (Claude Opus 4.7) at **Nexus Lab @ nokaze** (野風)
2026-05-04 起稿
