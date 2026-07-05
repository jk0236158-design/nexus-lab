# Aira single-console chat UI mockup 3 案 (2026-07-05)

jun の directive (`~/.shared-ops/owner-decisions/2026-07-05_aira_single_console_operator_direction.md`) を受けた先行デザイン。
Zen の技術分解 (`~/.shared-ops/board/2026-07-05_zen_kai_response_single_console_adapter_contract_decomposition.md`) の
queued / observed / 返信の 3 状態と evidence chip の思想を、そのまま画面の言葉に置き換えています。

- 絵だけの見本です。ボタンは動きません。データはすべて例です。
- browser で HTML を開くだけで見られます。外部 CDN なし、font は system fallback (Yu Mincho / Yu Gothic / Consolas)。
- 色・書体・余白は nokaze-design skill (`~/.claude/skills/nokaze-design/`) の token に準拠。
- 3 案とも共通で入れたもの: 宛先選択 (Zen / Kai)、送信→受け取り→返信の 3 段表示、返信待ちと未読、
  証拠あり(緑)・申告のみ(黄)・止まった(赤) の chip、red gate (価格変更) で止まった場面、証拠への 1 click 導線。

## 案A — a_chat_center.html「チャット中心」

- 会話が主役。左に相手の一覧 (未読 badge)、中央に吹き出しの thread、右 rail に「いまの全体」+ jun の番 + 仕事 + 証拠。
- 「送った ≠ 読まれた ≠ 証拠あり」を吹き出しの直下と中の chip で分離。凡例 (ことばの意味) を chat の頭に常設。
- red gate は agent の返信そのものが承認カードになる形。会話の流れを離れずに承認・見送りを決められる。

## 案B — b_console_center.html「操作卓中心」

- いまの Home (Operations) を主役のまま育てる案。上段カードで全体、仕事の表で状態と証拠を一覧。
- 会話は下部の常駐パネル (たためる)。仕事の行の「開く」からその仕事の会話へ、会話から証拠へ 1 操作ずつ。
- 既存実装からの距離が一番近い。管理を見る時間が長い日 (点検・承認) に向く形。

## 案C — c_timeline.html「統合タイムライン」

- 会話・仕事の状態変化・証拠・止まった場面を 1 本の時系列に混ぜ、「きょうの記録」を上から読むだけで追える。
- 「いま」の線で現在地を示し、右の sticky rail に全体の数字と返信待ち・未読を常掲。filter で会話だけ等に絞る想定。
- 操作の流れがそのまま物語になる。あとから見返す・週次点検の材料にする用途に一番強い。

## 統合版 — a_plus_timeline.html「A 骨格 + 記録 view」(jun feedback「A か C かな」への追補)

- 案A の 3 カラム骨格 (左: 相手一覧 / 中央: 会話 / 右: rail) はそのまま、中央上部の「会話 / 記録」tab で view を 1 click 切り替え。選択中の tab は墨で塗って現在地を迷わせない (JS なし、CSS の radio + label でこの切り替えだけ実際に動く)。
- 「記録」view は案C の時系列をこの thread 単位に絞ったもの。同じ会話の発言・仕事の状態変化 (work-1203 / 1207 / 1211)・証拠・止まった場面を起きた順に 1 本で読み返せて、末尾に「いま」の線を置く。
- 3 段表示 (送信済み ≠ 受け取り ≠ 証拠あり) と 3 色 chip (緑/黄/赤)・red gate 承認カードは両 view で同じ部品・同じ意味。会話で操作し、記録で振り返る、という分担。

## 推し: 案A「チャット中心」

1. jun の directive の動機が「VSCode / Codex を開かず、会話で管理・指示・確認まで完結」であり、操作の入口は会話そのもの。async の queued → observed → 返信の可視化は thread 形式が一番自然で、Zen の欠け分析の 1 番目 (chat 画面そのもの) に直結します。
2. 右 rail が Home の情報 (いまの全体 / jun の番 / 仕事 / 証拠) を同居させるので「管理・会話・確認」の 3 つが 1 画面で成立し、evidence chip が会話の中に立つ = completion-truth がそのまま見た目になる、という商品機会 (Zen の Q4-2) を一番強く出せます。
3. 案B は既存 Home の発展としてタブ併存でき、案C の時系列は将来「記録 view」として案A に足せます。つまり A を骨格にすると B / C の良さを後から取り込めますが、逆は難しい。

## file 一覧

- `a_chat_center.html` — 案A チャット中心
- `b_console_center.html` — 案B 操作卓中心
- `c_timeline.html` — 案C 統合タイムライン
- `a_plus_timeline.html` — 統合版 (A 骨格 + 記録 view、jun feedback 反映)
- `mock_a_verify.png` / `mock_b_verify.png` / `mock_b_viewport_verify.png` / `mock_c_verify.png` / `mock_a_plus_verify.png` / `mock_a_plus_log_verify.png` — 実 browser での render 検証 screenshot
- `README.md` — この file

作: Akari (Claude Code / Fable 5)。見本内の往復は例で、実際の board 記録ではありません。
