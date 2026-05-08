# pre-commit hook (公開 docs audit) install / uninstall 手順

5/08 enforcement layer reform 軸 7 の reify。 公開 docs (= audience-facing path)
に staged change がある時、 vocabulary_lint + naming_mixup_check + honesty_audit
+ defer_check の 4 chain を fire し、 1 件以上 red で commit を block する。

## 役割と限界

- 役割: 公開 docs を commit する直前に 4 chain audit を物理 fire し、
  「memory に書いた誠実さ ruled / naming ruled / 英語混入 ruled / 明日に回す
  ruled」 を script layer で enforce する。
- 限界: `git commit --no-verify` で bypass 可能 (bypass 時は warn を残す)。
  pre-commit は手元 commit 直前のみ、 push 後の CI/CD level では別途 audit。
- 連動: 200 確認 ritual (memory `feedback_200_confirmation_ritual.md`) と組
  で運用。 pre-commit = 公開前最終 audit、 200 確認 = 公開成立確認、 役割違い。

## 公開 docs path (5/08 時点 boundary)

- `products/`
- `Nexus.Lab.Zen/articles/`
- `packages/nokaze-portal/`
- `docs/` (nexus-lab repo 自身の docs/、 外部 link されうる)

各 path 内でも `.md` / `.mdx` / `.txt` / `.html` / `.tsx` / `.jsx` のみ対象。
画像 / lock file 等は skip。

## 1. install (jun 確認後の手順)

### 1-A. script を実行可能化 (本日中可、 jun 確認不要)

```bash
chmod +x ~/nexus-lab/scripts/pre_commit_public_docs_audit.sh
```

### 1-B. .git/hooks/pre-commit に symlink (jun 確認推奨)

git の pre-commit hook は repo 毎 `.git/hooks/pre-commit` で動く。 symlink
することで script 更新が自動反映される (file copy より保守性が高い)。

```bash
cd ~/nexus-lab
ln -sf ../../scripts/pre_commit_public_docs_audit.sh .git/hooks/pre-commit
```

確認:

```bash
ls -la .git/hooks/pre-commit
# → pre-commit -> ../../scripts/pre_commit_public_docs_audit.sh
```

注意: Windows + Git Bash 環境で ln -s が hardcopy になるケースあり。
その場合は file copy + 手動更新運用に fallback。

```bash
# fallback (symlink 不可時)
cp scripts/pre_commit_public_docs_audit.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

## 2. 動作確認

### 2-A. 公開 docs に test edit + commit

```bash
echo "test line" >> docs/zen_wake_queue_watcher_install.md  # 例
git add docs/zen_wake_queue_watcher_install.md
git commit -m "test: pre-commit hook fire"
```

公開 path 内 .md なので 4 chain fire、 red 0 なら commit 通過。 red あれば
block + stderr に list 表示。

### 2-B. bypass 確認

```bash
git commit --no-verify -m "test: bypass pre-commit"
```

bypass で commit 通過。 但し本 script が走らないので、 bypass log は別 hook
(post-commit) で記録する設計が望ましい (5/13+ Phase B carry 候補)。

### 2-C. 公開 path 外の commit は skip

```bash
echo "// test" >> scripts/some_internal_script.sh
git add scripts/some_internal_script.sh
git commit -m "test: internal change"
```

`scripts/` は公開 path 外なので 4 chain は skip、 即 commit 通過。

## 3. uninstall

```bash
rm ~/nexus-lab/.git/hooks/pre-commit
```

script 本体 (`scripts/pre_commit_public_docs_audit.sh`) は repo に残す
(再 install 時に再利用)。 完全削除は手動で git rm。

## 4. 整合 / 注意

- 既存 PreToolUse hook (`zen_semantic_check_hook.sh` / `subagent_write_gate.sh`)
  と独立。 PreToolUse = Write/Edit fire 直前 advisory、 pre-commit = git
  commit 直前 block、 fire timing が違う。
- 1 件 commit 当たり script 全体で 1-3 sec (file 数 / 内容 size に依存)。
- 4 chain の 1 つでも red あれば block。 個別 chain の advisory level は各
  script 内 spec、 pre-commit 側では red 件数 count のみ。
- 5/13+ Phase B carry 候補:
  - bypass 時 log 記録 (post-commit hook で `--no-verify` flag 検出 + warn 起稿)
  - 200 確認 ritual との chain 化 (公開 commit 後 30 min で WebFetch 自動 audit)
