---
date: 2026-05-10
owner: Iwa (Lead Engineer)
status: draft (jun confirm Q1 GO 済、 Kagami QA review pending)
purpose: broadcast-os 完成度向上 reform — 共通 adapter contract spec 起稿 (前回 spawn return I2 軸 detail)
audience: developer (technical spec)
related:
  - broadcast_os_completion_reform_spec_2026-05-08.md (前回 spawn return)
  - yuino_broadcast_connect_interface_spec_2026-05-10.md (姉妹 spec、 同日起稿)
  - feedback_yuino_security_axis (Approval Gate / Fail Closed / Audit Log axis)
  - LLM Replaceable Part Principle (model も商品も replaceable narrative)
---

# broadcast-os 共通 Adapter Contract Spec

## 0. document scope

本 spec は broadcast-os が外部生成サービス (video / voice / music / slide) を呼び出す際の **共通 adapter contract** を定義する。 `BroadcastAdapter<I, O>` interface + 4 種 adapter (video_gen / voice_gen / music_gen / slide_gen) の推奨実装 form + Approval Gate / Audit Log / Fail Closed boundary を含む。

**out of scope**:
- 各外部サービスの actual API 呼び出し実装 (新規 provider のみ Red boundary、 jun explicit directive 必須、 但し既導入 provider は既運用継続 narrative)
- broadcast-os Showrunner Layer / Continuity Layer の内部実装 (前回 spawn return I1 + 姉妹 spec で記述)
- Yuino 4 file pull form の interface 詳細 (姉妹 spec に分離)

## 0.1 既存 implementation evidence (2026-05-10 audit、 drift correction)

> **重要 finding** (5/10 jun directive 「Veo + 音楽生成 既使ってる」 連動 audit): broadcast-os は **既に 4 layer 全部 Provider Registry Pattern + multi-provider 実装済 + 運用中**。 本 spec doc 旧 narrative 「default = local pipeline / external = optional 新規 adapter integration」 は drift、 **「既存 Provider Registry Pattern を audience-facing narrative form で整理 + 不足 2 件 (slide / voice ElevenLabs) を既存 pattern に追加 + Approval Gate / Audit Log / cost_estimate を既存 layer に統合」** が正しい narrative。

### 既存 Provider Registry Pattern (4 layer 既 reify 済)

```
src/pipeline/<layer>/
  base.py        # XProvider abstract interface
  registry.py    # get_X_provider(name) で provider 切替 (lru_cache + lazy import)
  <provider>.py  # 各 provider 実装
```

### 既存 provider 一覧 (5/10 audit、 actual code evidence)

| layer | path | 既存 provider |
|---|---|---|
| **video** | `src/pipeline/video/` | manual_stub (local fallback) / openai_video / **veo** (Google Veo) |
| **image** | `src/pipeline/image/` | openai_images / **gemini_flash_image** (Gemini 2.5 Flash Image) |
| **music** | `src/pipeline/music/` | **suno_api** (Suno) のみ registry 登録、 manual_pack.py は utility module で MusicProvider subclass ではない (5/10 21:00 Iwa spawn audit で訂正、 旧 narrative 「manual_pack registry 登録」 は drift) |
| **voice / speech** | `src/pipeline/speech/` | voicevox (local TTS) / openai_tts / google_tts |

= **LLM Replaceable Part Principle は既 reify 済**、 「自前再発明しない、 必要時 adapter 経由で呼ぶ」 narrative は **「未来形」 ではなく 「既存 implementation evidence」**。

### 5/10 reform で追加候補 (本 spec doc の actual scope)

1. **slide adapter** (新規追加、 Akari 推奨 = Slidev): `src/pipeline/slide/` (新規 layer) + `slide/registry.py` + `slidev.py` provider
2. **voice ElevenLabs provider 追加** (既存 speech registry pattern に 1 件追加): `src/pipeline/speech/elevenlabs.py`
3. **Approval Gate / Audit Log / cost_estimate 統合** (既存 4 layer 全 provider に共通機能追加): provider 横断 cross-cutting concern として既 base.py 拡張

video / image / music は **既 multi-provider で追加不要**、 本 spec doc の主目的は 「既存 evidence 整理 + 不足 2 件追加 + 横断機能統合」。

### cost narrative (jun 「既使ってる」 directive 連動)

- **既導入 provider** (Veo / Gemini Flash Image / Suno / OpenAI Video / OpenAI Images / OpenAI TTS / Google TTS) = jun 既 decide 済、 既運用継続、 新規 cost 発生ではない
- **新規 provider** (ElevenLabs / 将来 Udio 等) = 新規 cost 発生 = Red boundary、 jun explicit directive 必須
- **cost_estimate doc 起稿 + Audit Log 整理** = Green、 既導入 + 新規共通の運用整備

---

## 1. design principle (LLM Replaceable Part Principle 整合)

### 1.1 model も商品も replaceable

broadcast-os は 「外部生成サービスは交換可能な部品」 として扱う。 video gen で Veo 3.1 → Runway Gen-4.5 → HeyGen と乗り換える時、 broadcast-os core の Showrunner / Continuity / Audio Layer は無変更で済むこと。

これは Yuino 側の LLM (Claude / GPT / Gemini) replaceable narrative と同 axis、 nokaze 全体の architectural principle (= 「model lock-in しない」 商品差別化軸の broadcast layer 反映)。

### 1.2 default = local fallback / 既存 multi-provider registry / external 追加候補 (5/10 audit corrected)

既存 implementation evidence 反映の actual default form:

| layer | local fallback | 既存 external provider (運用中) | 5/10 reform 追加候補 |
|---|---|---|---|
| video | manual_stub | **veo** (Google Veo) / openai_video | (追加なし、 既 multi-provider) |
| image | (manual fallback 不在、 base.py audit 候補) | openai_images / **gemini_flash_image** (Gemini 2.5 Flash Image) | (追加なし、 既 multi-provider) |
| music | manual_pack | **suno_api** (Suno) | (option: udio / musicgen は v1 candidate) |
| voice / speech | voicevox (local TTS) | openai_tts / google_tts | **ElevenLabs 追加** (新規 cost 発生 = Red boundary) |
| slide | (既 layer 不在) | (既 layer 不在) | **Slidev 新規 layer 追加** (Akari 推奨、 Node 依存 subprocess form) |

**default narrative の core**:
- **既導入 provider は既運用継続**、 新規 「拡張」 narrative ではなく 「整理」 narrative
- **Approval Gate / Audit Log / cost_estimate** は **既存 4 layer 全 provider に横断追加** (既 + 新規共通の運用整備、 Green)
- **新規 provider 追加** (ElevenLabs voice / 将来 Udio music 等) は **新規 cost 発生 = Red boundary**、 jun explicit directive 必須
- **slide layer 新規追加** (broadcast-os に既 layer 不在) = scope 大、 但し外部 API 不要 (Slidev = OSS)、 cost 発生なし、 Green
- 北極星 「jun 介入週 1-2 回」 阻害しない (既導入は jun 既 decide、 新規は Approval Gate)

### 1.3 自前再発明しない

broadcast-os は 「外部サービスを呼ぶ層」 までを実装する。 video gen / voice gen の core algorithm は実装しない (=外部 SaaS or OSS 依存)、 商品差別化軸ではない。

差別化軸は **「呼び方」 と 「組み合わせ方」 と 「audit / boundary」** に置く (= Continuity Layer + Approval Gate + Audit Log)。

---

## 2. `BroadcastAdapter<I, O>` interface

### 2.1 interface 定義 (TypeScript notation、 Python 実装も同 shape)

```typescript
interface BroadcastAdapter<I, O> {
  // identity
  readonly name: string;                    // e.g. "veo_3_1_video", "elevenlabs_voice"
  readonly version: string;                 // e.g. "0.1.0"
  readonly category: AdapterCategory;       // "video_gen" | "voice_gen" | "music_gen" | "slide_gen"

  // permission classification
  readonly permission_level: PermissionLevel;
                                            // "internal" = local pipeline、 jun 確認不要
                                            // "external" = 外部 API call、 Approval Gate 経由

  // cost estimation (call 前に Approval Gate に渡す)
  cost_estimate(input: I): Promise<CostEstimate>;

  // quota check (rate limit / 月次予算 / API key 残量)
  quota_check(): Promise<QuotaStatus>;

  // main invocation (actual API call or local pipeline)
  invoke(input: I, ctx: InvokeContext): Promise<O>;

  // fallback (external 失敗時 or quota 不足時に local pipeline)
  fallback(input: I, ctx: InvokeContext): Promise<O>;

  // audit log (call timestamp + input shape + output shape + cost + permission_level)
  audit_log(record: AuditRecord): Promise<void>;
}
```

### 2.2 supporting types

```typescript
type AdapterCategory = "video_gen" | "voice_gen" | "music_gen" | "slide_gen";

type PermissionLevel = "internal" | "external";
//   internal: local pipeline、 jun 確認不要、 broadcast-os 自走 OK
//   external: 外部 API call、 Approval Gate 経由、 jun explicit directive 必須

interface CostEstimate {
  monetary_cost_usd: number;       // 推定金銭 cost (USD)、 0 if internal
  monetary_cost_jpy: number;       // 推定金銭 cost (JPY)、 0 if internal
  time_estimate_sec: number;       // 推定処理時間 (秒)
  quota_units: number;             // API quota 消費単位 (e.g. ElevenLabs character count)
  estimation_confidence: "high" | "medium" | "low";
                                   // high = API doc の price table 由来
                                   // medium = 過去 call の統計 平均
                                   // low = 推定根拠薄、 actual と乖離 risk あり
}

interface QuotaStatus {
  remaining_units: number;         // 残 API quota
  limit_units: number;             // 月次 / 日次 limit
  reset_at: string;                // ISO 8601 timestamp
  available: boolean;              // call 可能か
  reason_if_unavailable?: string;  // unavailable 時の理由 (rate limit / budget cap / API key invalid 等)
}

interface InvokeContext {
  request_id: string;              // 呼び出し追跡 ID (UUID)
  triggered_by: string;            // "yuino_observation_pull" | "manual" | "scheduled"
  jun_approval_token?: string;     // external permission_level の時必須
  dry_run: boolean;                // true = actual call せず cost_estimate だけ返す
}

interface AuditRecord {
  request_id: string;
  adapter_name: string;
  permission_level: PermissionLevel;
  call_timestamp: string;          // ISO 8601
  input_shape: object;             // input の structural summary (実 content は audit log に含めない、 privacy)
  output_shape: object;            // output の structural summary
  monetary_cost_usd_actual: number;
  duration_ms: number;
  status: "success" | "fallback" | "error";
  error_message?: string;
  jun_approval_token?: string;
}
```

### 2.3 lifecycle (call sequence)

```
1. Showrunner Layer が adapter call を要求
   ↓
2. cost_estimate(input) で見積取得
   ↓
3. permission_level === "external" の場合:
     ├─ Approval Gate に cost_estimate 渡す
     ├─ jun explicit directive 待ち (Red boundary)
     ├─ approval_token 受領
     └─ なければ fallback(input) で local pipeline
   ↓
4. quota_check() で残量確認
   ↓
5. quota.available === false の場合:
     └─ fallback(input) で local pipeline
   ↓
6. invoke(input, ctx) で actual call
   ↓
7. audit_log(record) で記録 (success / fallback / error 全 case)
   ↓
8. output を Showrunner Layer に返す
```

---

## 3. 4 種 adapter 推奨実装

### 3.1 video_gen_adapter

> **§ 0.1 audit 反映 note** (2026-05-10): 本 section narrative は 「新規 adapter integration」 前提の draft、 actual には **Veo + OpenAI Video + manual_stub 既実装 + 運用中** (`src/pipeline/video/registry.py`)。 「default off / declare-on-demand」 narrative は drift、 actual は **既 Format Bible で provider declare されて Veo 等が運用中**。 5/13+ Iwa actual code audit + Kagami QA pass 後に v1 rewrite candidate、 現 narrative は historical draft 扱い。

**status**: optional (default off)、 declare-on-demand

#### 3.1.1 推奨外部サービス

| サービス | 強み | 弱み | 推奨用途 |
|---|---|---|---|
| Google Veo 3.1 | 物理整合性高、 長尺対応 | 課金高 (推定 $0.30+/sec)、 Approval Gate 必須 | 重要 milestone 動画 (5/26 canonical switch 等) |
| Runway Gen-4.5 | 編集自由度高、 keyframe 制御 | quality variance 高 | prototype / draft |
| HeyGen | avatar / lipsync 強い | branded avatar 限定 | jun avatar narrative の場合 (現時点候補なし) |

#### 3.1.2 default behavior

- `permission_level = "external"`
- broadcast-os Format Bible に `external_video: true` declare されてない時は **adapter call せず** Slidev pipeline (default local) で出力
- `external_video: true` declare 時のみ adapter call、 但し Approval Gate で jun explicit directive 必須

#### 3.1.3 fallback 実装

```python
async def fallback(self, input: VideoGenInput, ctx: InvokeContext) -> VideoGenOutput:
    # local pipeline = Slidev export to mp4 + ffmpeg 合成
    return await slidev_to_mp4_pipeline(
        scene_plan=input.scene_plan,
        audio_track=input.audio_track,
    )
```

#### 3.1.4 cost_estimate 実装例 (Veo 3.1)

```python
async def cost_estimate(self, input: VideoGenInput) -> CostEstimate:
    estimated_duration_sec = sum(scene.duration_sec for scene in input.scene_plan.scenes)
    return CostEstimate(
        monetary_cost_usd=estimated_duration_sec * 0.30,  # 公開 price table 由来
        monetary_cost_jpy=estimated_duration_sec * 0.30 * 155,
        time_estimate_sec=estimated_duration_sec * 5,     # 5x real-time 処理
        quota_units=estimated_duration_sec,
        estimation_confidence="high",
    )
```

### 3.2 voice_gen_adapter

> **§ 0.1 audit 反映 note** (2026-05-10): 既存 speech registry pattern (`src/pipeline/speech/registry.py`) で **voicevox + openai_tts + google_tts** 3 provider 既実装 + 運用中。 本 section は **ElevenLabs 新規追加** scope (provider list の `local | elevenlabs | openai` narrative は actual には `voicevox | elevenlabs | openai_tts | google_tts` の 4 provider form に rewrite candidate)。 ElevenLabs 追加は新規 cost 発生 = Red boundary、 jun explicit directive 必須。

**status**: broadcast-os 既存 Voice Layer 拡張

#### 3.2.1 voice profile schema 拡張

既存 Voice Layer の voice profile JSON に `provider` field 追加:

```json
{
  "voice_id": "zen_default",
  "provider": "local",               // "local" | "elevenlabs" | "openai"
  "voice_name": "Zen 標準音声",
  "language": "ja",
  "elevenlabs_voice_id": null,       // provider="elevenlabs" の時必須
  "openai_voice": null               // provider="openai" の時必須 (alloy / echo / fable / onyx / nova / shimmer)
}
```

| provider | permission_level | 用途 |
|---|---|---|
| `local` | internal | default、 全 routine 利用 |
| `elevenlabs` | external | premium voice 必要時 (重要 milestone narration 等) |
| `openai` | external | OpenAI TTS が要件 fit 時 |

#### 3.2.2 default behavior

- 既存 voice profile (provider=local) は **adapter 介さず直接 Voice Layer 呼び出し** (高速 path)
- provider=elevenlabs / openai の時のみ voice_gen_adapter 経由、 Approval Gate 通る
- 月次予算 cap default $20 (jun confirm 待ち、 ElevenLabs Starter plan 5 USD/month 想定)

#### 3.2.3 cost_estimate 実装例 (ElevenLabs)

```python
async def cost_estimate(self, input: VoiceGenInput) -> CostEstimate:
    char_count = len(input.text)
    # ElevenLabs Starter: 30,000 chars/month for $5
    cost_per_char = 5.00 / 30000
    return CostEstimate(
        monetary_cost_usd=char_count * cost_per_char,
        monetary_cost_jpy=char_count * cost_per_char * 155,
        time_estimate_sec=char_count / 100,  # rough
        quota_units=char_count,
        estimation_confidence="high",
    )
```

### 3.3 music_gen_adapter

> **§ 0.1 audit 反映 note** (2026-05-10): 既存 music registry pattern (`src/pipeline/music/registry.py`) で **manual_pack + suno_api** 2 provider 既実装 + 運用中。 「default off / declare-on-demand」 narrative は drift、 actual は **既 Suno 運用中 (royalty-free BGM narrative は wrong、 manual_pack が local fallback)**。 「commercial license 確認必須 (jun confirm tied)」 narrative は 既 jun decide 済の運用継続、 新規 cost narrative ではない。 udio 追加は v1 candidate (Red boundary)。

**status**: optional (default off)、 declare-on-demand

#### 3.3.1 default behavior

- `permission_level = "external"`
- Format Bible `bgm_generated: true` declare されてない時は既存 Audio Layer royalty-free BGM (default local)
- `bgm_generated: true` declare 時のみ adapter call、 Approval Gate 経由

#### 3.3.2 推奨外部サービス

| サービス | 強み | 弱み |
|---|---|---|
| Suno | high quality vocal、 短時間生成 | commercial license 確認必須 (jun confirm tied) |
| Udio | jazzy / instrumental 強い | API stability 不明、 v1 で contract のみ用意 |

#### 3.3.3 license boundary narrative

music_gen 出力の commercial use は **jun explicit directive 必須** (Red boundary)。 Suno / Udio の TOS は generated audio の使用範囲が plan tier で異なる、 broadcast-os 側で license metadata を audit log に必ず記録、 後の audit / takedown 対応可能 form を維持。

### 3.4 slide_gen_adapter

> **§ 0.1 audit 反映 note** (2026-05-10): broadcast-os 既存 implementation に **slide layer 不在** (audit 確認、 5/04 evening jun directive 「資料動画 不適」 narrative の root cause)。 本 section narrative = **新規 layer 追加 spec**、 既存 4 layer (video / image / music / speech) と並ぶ 5 番目の layer 新設。 Slidev = OSS、 外部 API なし、 cost 発生なし、 Green。 Akari 推奨 = Slidev subprocess form、 Node 依存 (Python broadcast-os と隔離)。 既存 registry pattern (`src/pipeline/<layer>/registry.py`) と同 form で `src/pipeline/slide/registry.py` 新設候補。


**status**: I1 (前回 spawn return) で記述の Slidev subprocess form を contract 化

#### 3.4.1 default behavior

- `permission_level = "internal"` (Slidev は npm subprocess、 外部 API call なし)
- Approval Gate 不要、 broadcast-os 自走 OK
- Marp / Reveal.js は将来選択肢として contract のみ用意 (実装は v1 後)

#### 3.4.2 implementation form (Slidev)

```python
class SlidevAdapter(BroadcastAdapter[SlideGenInput, SlideGenOutput]):
    name = "slidev_local"
    version = "0.1.0"
    category = "slide_gen"
    permission_level = "internal"

    async def cost_estimate(self, input):
        return CostEstimate(
            monetary_cost_usd=0,
            monetary_cost_jpy=0,
            time_estimate_sec=len(input.slides) * 0.5,  # ~0.5 sec/slide for build
            quota_units=0,
            estimation_confidence="high",
        )

    async def quota_check(self):
        return QuotaStatus(
            remaining_units=999999,
            limit_units=999999,
            reset_at="never",
            available=True,
        )

    async def invoke(self, input, ctx):
        # subprocess call: slidev export --format pdf
        return await self._run_slidev_subprocess(input)

    async def fallback(self, input, ctx):
        # slidev も失敗時は素の markdown を返す degraded mode
        return SlideGenOutput(format="markdown_only", content=input.markdown_source)
```

#### 3.4.3 future adapter (contract のみ用意、 v0 では実装しない)

```python
class MarpAdapter(BroadcastAdapter[SlideGenInput, SlideGenOutput]):
    # v1 で実装予定、 v0 では interface 定義のみ
    pass

class RevealJsAdapter(BroadcastAdapter[SlideGenInput, SlideGenOutput]):
    # v1 で実装予定、 v0 では interface 定義のみ
    pass
```

---

## 4. Approval Gate integration

### 4.1 approval flow (external permission_level)

```
1. Showrunner Layer が adapter.invoke(input, ctx) を呼ぶ
   ↓
2. adapter が permission_level = "external" を return
   ↓
3. broadcast-os が cost_estimate(input) を call
   ↓
4. Approval Gate に request 投擲:
     - request_id
     - adapter_name
     - cost_estimate (USD / JPY / time / confidence)
     - input_shape (privacy filtered)
     - triggered_by
   ↓
5. Approval Gate が ~/.shared-ops/approval_queue/ に file 起稿
   ↓
6. jun が file を見て approval (Y/N) を board に返す
   ↓
7a. jun approval Y → approval_token 発行 → adapter.invoke(input, ctx_with_token)
7b. jun approval N → adapter.fallback(input, ctx) で local pipeline
7c. 24 hour timeout → fallback (Fail Closed default)
   ↓
8. audit_log に approval_token / status 記録
```

### 4.2 approval_token format

```json
{
  "token": "ag_xxxxxxxxxxxx",
  "request_id": "req_yyyyyyyyyyyy",
  "approved_by": "jun",
  "approved_at": "2026-05-10T13:45:00+09:00",
  "expires_at": "2026-05-10T14:45:00+09:00",
  "scope": {
    "adapter_name": "veo_3_1_video",
    "max_cost_usd": 5.00,
    "max_calls": 1
  }
}
```

### 4.3 Fail Closed default

- approval_token 不在 → adapter.invoke 拒否、 fallback path
- approval_token 期限切れ (1 hour default) → 拒否、 fallback path
- approval_token scope 超過 (max_cost / max_calls) → 拒否、 fallback path

これは feedback_yuino_security_axis (5/07 PM jun directive) の Fail Closed axis を broadcast layer に反映。

---

## 5. Audit Log spec

### 5.1 storage location

```
broadcast-os/audit_logs/<YYYY-MM>/<YYYY-MM-DD>_adapter_calls.jsonl
```

JSONL form (1 call = 1 line)、 月次 rotate、 90 day retention default。

### 5.2 record shape (重複定義、 reference 用)

```json
{
  "request_id": "req_yyyyyyyyyyyy",
  "adapter_name": "veo_3_1_video",
  "permission_level": "external",
  "call_timestamp": "2026-05-10T13:50:00+09:00",
  "input_shape": {
    "scene_count": 5,
    "total_duration_sec": 60,
    "languages": ["ja"]
  },
  "output_shape": {
    "format": "mp4",
    "duration_sec": 60,
    "file_size_mb": 12.3
  },
  "monetary_cost_usd_actual": 18.20,
  "duration_ms": 285000,
  "status": "success",
  "jun_approval_token": "ag_xxxxxxxxxxxx",
  "triggered_by": "yuino_observation_pull"
}
```

### 5.3 privacy filter (input_shape)

`input_shape` には actual content 含めない (text / video frame 等)、 structural summary のみ:

- 含める: count / duration / language / format / shape
- 含めない: actual text / actual frame / personal info / project-nia content / Nia memory

これは Continuity Layer の Nia 公開境界 axis と整合。

### 5.4 audit log review cycle

- 週次: jun が audit_log を grep / review (任意)
- 月次: cost summary 自動生成 (`broadcast-os scripts/audit_cost_summary.sh`)、 月予算超過 detect
- 重要 incident 時: ad-hoc audit (jun directive)

---

## 6. permission_level 判定 default 表

| 操作 | permission_level | 理由 |
|---|---|---|
| Slidev subprocess (local) | internal | 外部 API なし |
| local TTS (Voice Layer 既存) | internal | 外部 API なし |
| royalty-free BGM 選択 (Audio Layer 既存) | internal | 外部 API なし |
| Veo 3.1 / Runway video gen | external | 課金 + 外部送信 |
| ElevenLabs / OpenAI TTS | external | 課金 + text 外部送信 |
| Suno / Udio music gen | external | 課金 + license 確認必要 |
| (将来) Marp / Reveal.js subprocess | internal | 外部 API なし |

**判定 rule**: 「外部 API call が発生する」 OR 「金銭発生」 OR 「project-nia / Nia memory / jun 個人情報 が外部送信される可能性」 のいずれか 1 つでも該当 → external。

---

## 7. 実装 phase plan (jun confirm tied portions 明示)

### Phase 0 (本日着手 OK、 Green): contract 定義のみ

- [x] 本 spec doc 起稿 (= 本 file)
- [ ] `BroadcastAdapter` interface code (TypeScript / Python both) を broadcast-os repo に PR
- [ ] SlidevAdapter (internal、 既存 I1 form を contract 化) 実装
- [ ] audit_log writer 実装 (storage + JSONL writer)
- [ ] Approval Gate file-based queue 実装 (~/.shared-ops/approval_queue/)
- [ ] dry_run mode 実装 (cost_estimate のみ、 actual call せず)

**estimated effort**: 3-5 day (Iwa + Oto 並列)

### Phase 1 (jun explicit directive 必須、 Red): 1 件目 external adapter

- [ ] elevenlabs voice_gen_adapter 実装 (推奨 first external、 cost cap 低い)
- [ ] 月次予算 $20 で start (jun confirm tied)
- [ ] dogfood: zen-routines.md 1 件で premium voice narration 試行
- [ ] audit_log review (1 week 後)

**precondition**:
- jun explicit directive
- ElevenLabs API key 取得 (jun 直接、 既存 nia / broadcast-aira / yuino 3 key 体系の broadcast-aira key 流用 candidate)
- 月予算 cap 設定 (jun confirm)

### Phase 2 (5/26 canonical switch 後): video / music adapter

- [ ] video_gen_adapter (Veo 3.1 推奨 first、 Runway は alternative)
- [ ] music_gen_adapter (Suno、 license 確認後)
- [ ] 月次予算再評価 (jun confirm)

---

## 8. blocker / open question

### 8.1 blocker

- ElevenLabs / OpenAI TTS / Veo 3.1 の API key 取得は jun 直接、 broadcast-os 自走では取得不可
- Suno commercial license 確認が jun + Kura 経由必要、 license clear 前は adapter contract のみで実装は holding

### 8.2 open question (Kagami QA review で議論候補)

1. approval_token expiration を 1 hour default で良いか? 短すぎ / 長すぎの meta 議論
2. audit_log retention 90 day default で良いか? 法的要件 / project-nia 連動の retention 要件
3. fallback 失敗時 (local pipeline も失敗) の behavior は? `error` status で showrunner に return + Continuity Layer block か、 raw markdown で degraded ok か
4. dry_run mode を Approval Gate flow に組み込むか? cost_estimate prefetch + jun に approval 求めず先に見積 review する form
5. cost_estimate の confidence="low" の adapter call は Approval Gate で jun に special warning 出すべきか

### 8.3 Kagami QA review tied items

- Fail Closed default (24 hour timeout で fallback) が actual security 要件を満たすか
- input_shape privacy filter spec が Nia 公開境界 (project-nia / 内部 memory / jun 個人情報) を漏出しない確証
- audit log JSONL form が後の grep / 月次集約 / 将来 SaaS dashboard 連動で使い物になるか

---

## 9. references

- 前回 spawn return: broadcast_os_completion_reform_spec_2026-05-08.md (I1 + I2 + I3 軸 6 項目)
- 姉妹 spec: yuino_broadcast_connect_interface_spec_2026-05-10.md (I3 軸 detail、 同日起稿)
- Yuino security axis: memory/feedback_yuino_security_axis (Local-first / Approval Gate / Audit Log / Fail Closed)
- LLM Replaceable Part Principle: nokaze 全体 architectural principle (model lock-in しない)
- 北極星: project_nokaze_north_star_phase_1_5 (jun 介入週 1-2 回 + 売上固定費超え)
- Approval Gate boundary: feedback_yuino_security_axis (Read + Draft 自動 + Internal whitelist + External 必須)

---

## changelog

- 2026-05-10 Iwa 起稿、 jun confirm Q1 GO 済 status、 Kagami QA review pending
