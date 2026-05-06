/**
 * aira-tripwire.test.ts — Aira Tripwire unit + integration test
 *
 * 2026-05-06 起稿 (Iwa packet、 Wave 1 期間 return content path)
 * scope:
 *   - scanForTripwireTargets: 5 target_type 別 match + no match
 *   - categorizeWithGate: 4 gate 別 grouping + helper count
 *   - enforceTripwire: blocking 発火 (inbox + log)、 advisory のみ (log のみ)、 空 matches (no-op)
 *   - scanJudgmentsForTripwire: Evaluator FailureJudgment 経由 chain
 *
 * Pattern: 既存 aira-evaluator.test.ts (mkdtemp + afterEach rm -rf) 踏襲。
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  scanForTripwireTargets,
  enforceTripwire,
  categorizeWithGate,
  scanJudgmentsForTripwire,
  type TripwireMatch,
  type TripwirePattern,
} from '../src/aira-tripwire.js';
import type { FailureJudgment } from '../src/aira-evaluator.js';

let TMP_ROOT: string;

beforeEach(async () => {
  TMP_ROOT = await mkdtemp(join(tmpdir(), 'aira-tripwire-test-'));
});

afterEach(async () => {
  if (TMP_ROOT) {
    await rm(TMP_ROOT, { recursive: true, force: true });
  }
});

const FIXED_NOW = new Date('2026-05-06T15:30:00.000Z');

describe('scanForTripwireTargets — 5 target_type 別 match', () => {
  it('detects external_post keywords (Zenn / note / X / npm publish)', () => {
    const content = '今夜の作業: zenn publish して note 投稿 + tweet も流す予定。';
    const matches = scanForTripwireTargets(content, { source: 'plan.md', now: FIXED_NOW });

    const types = matches.map((m) => m.target_type);
    expect(types).toContain('external_post');
    const externals = matches.filter((m) => m.target_type === 'external_post');
    expect(externals.length).toBeGreaterThanOrEqual(3);
    for (const m of externals) {
      expect(m.gate_category).toBe('blocking');
      expect(m.source).toBe('plan.md');
      expect(m.ts).toBe(FIXED_NOW.toISOString());
      expect(m.excerpt.length).toBeGreaterThan(0);
    }
  });

  it('detects mail_form_send keywords', () => {
    const content = '案内文を email send で flush、 form 送信 で完了報告。';
    const matches = scanForTripwireTargets(content, { source: 'mail_plan.md', now: FIXED_NOW });
    const mail = matches.filter((m) => m.target_type === 'mail_form_send');
    expect(mail.length).toBeGreaterThanOrEqual(2);
    for (const m of mail) {
      expect(m.gate_category).toBe('blocking');
    }
  });

  it('detects payment_contract keywords (polar.sh / 価格公開 / subscription)', () => {
    const content =
      'Polar.SH の paid plan で価格公開 を進める案、 subscription model を検証する。';
    const matches = scanForTripwireTargets(content, { source: 'pricing.md', now: FIXED_NOW });
    const pay = matches.filter((m) => m.target_type === 'payment_contract');
    expect(pay.length).toBeGreaterThanOrEqual(3);
    for (const m of pay) {
      expect(m.gate_category).toBe('escalating');
    }
  });

  it('detects public_claim keywords (北極星達成 / 完成しました / production ready)', () => {
    const content =
      'お知らせ: 北極星達成しました。 Yuino は完成しました、 production ready です。';
    const matches = scanForTripwireTargets(content, { source: 'announce.md', now: FIXED_NOW });
    const claims = matches.filter((m) => m.target_type === 'public_claim');
    expect(claims.length).toBeGreaterThanOrEqual(3);
    for (const m of claims) {
      expect(m.gate_category).toBe('blocking');
    }
  });

  it('detects private_nia_leak keywords (Desktop/project-nia / AI_Buddy_backup)', () => {
    const content =
      '参考: C:/Users/jk023/Desktop/project-nia/spec.md と AI_Buddy_backup の比較。';
    const matches = scanForTripwireTargets(content, { source: 'leak_check.md', now: FIXED_NOW });
    const leaks = matches.filter((m) => m.target_type === 'private_nia_leak');
    expect(leaks.length).toBeGreaterThanOrEqual(2);
    for (const m of leaks) {
      expect(m.gate_category).toBe('escalating');
    }
  });

  it('returns empty array when content has no Tripwire keywords', () => {
    const content = '今日は雨。 散歩は中止して読書する。';
    const matches = scanForTripwireTargets(content, { source: 'diary.md', now: FIXED_NOW });
    expect(matches).toEqual([]);
  });

  it('respects custom patterns override (test 用)', () => {
    const customPatterns: TripwirePattern[] = [
      {
        target_type: 'external_post',
        gate_category: 'advisory',
        keywords: ['CUSTOM_KEY'],
      },
    ];
    const content = 'Some text containing CUSTOM_KEY token.';
    const matches = scanForTripwireTargets(content, {
      source: 'custom.md',
      patterns: customPatterns,
      now: FIXED_NOW,
    });
    expect(matches).toHaveLength(1);
    expect(matches[0].gate_category).toBe('advisory');
    expect(matches[0].matched_keyword).toBe('CUSTOM_KEY');
  });
});

describe('categorizeWithGate — 4 gate grouping', () => {
  it('groups matches by gate_category and aggregates counts', () => {
    const ts = FIXED_NOW.toISOString();
    const matches: TripwireMatch[] = [
      {
        ts,
        target_type: 'external_post',
        matched_keyword: 'zenn publish',
        source: 'a.md',
        excerpt: 'zenn publish ...',
        gate_category: 'blocking',
      },
      {
        ts,
        target_type: 'public_claim',
        matched_keyword: '完成しました',
        source: 'b.md',
        excerpt: '完成しました ...',
        gate_category: 'blocking',
      },
      {
        ts,
        target_type: 'payment_contract',
        matched_keyword: 'polar.sh',
        source: 'c.md',
        excerpt: 'polar.sh ...',
        gate_category: 'escalating',
      },
      {
        ts,
        target_type: 'external_post',
        matched_keyword: 'CUSTOM',
        source: 'd.md',
        excerpt: 'CUSTOM ...',
        gate_category: 'advisory',
      },
    ];

    const cat = categorizeWithGate(matches);
    expect(cat.total_count).toBe(4);
    expect(cat.blocking_count).toBe(2);
    expect(cat.escalating_count).toBe(1);
    expect(cat.by_category.blocking).toHaveLength(2);
    expect(cat.by_category.escalating).toHaveLength(1);
    expect(cat.by_category.advisory).toHaveLength(1);
    expect(cat.by_category.validating).toHaveLength(0);
  });
});

describe('enforceTripwire — blocking 発火 (inbox + log)', () => {
  it('writes audit log + jun approval inbox when blocking match present', async () => {
    const inboxPath = join(TMP_ROOT, 'inbox');
    const logPath = join(TMP_ROOT, '_daemon', 'aira_tripwire.log');

    const content = '明日 zenn publish を打つ。 段取りを確認する。';
    const matches = scanForTripwireTargets(content, { source: 'plan.md', now: FIXED_NOW });
    expect(matches.length).toBeGreaterThan(0);

    const result = await enforceTripwire(matches, {
      inboxPath,
      logPath,
      now: FIXED_NOW,
      approvalTopic: 'external_post',
    });

    expect(result.blocked).toBe(true);
    expect(result.audit_log_appended).toBe(true);
    expect(result.approval_inbox_path).not.toBeNull();
    expect(result.approval_inbox_path!).toContain('2026-05-06_aira_tripwire_jun_approval_external_post.md');

    const inboxFiles = await readdir(inboxPath);
    expect(inboxFiles).toContain('2026-05-06_aira_tripwire_jun_approval_external_post.md');

    const inboxBody = await readFile(result.approval_inbox_path!, 'utf-8');
    expect(inboxBody).toContain('# Aira Tripwire — jun approval 待ち');
    expect(inboxBody).toContain('external_post');
    expect(inboxBody).toContain('jun decision');
    expect(inboxBody).toContain('zenn publish');

    const logRaw = await readFile(logPath, 'utf-8');
    const lines = logRaw.trim().split('\n');
    expect(lines.length).toBe(matches.length);
    const first = JSON.parse(lines[0]);
    expect(first.target_type).toBeDefined();
    expect(first.enforced).toBe(true);
    expect(first.gate_category).toBeDefined();
  });
});

describe('enforceTripwire — advisory のみ (log のみ、 inbox 起票なし)', () => {
  it('appends audit log but does not create approval inbox file', async () => {
    const inboxPath = join(TMP_ROOT, 'inbox');
    const logPath = join(TMP_ROOT, '_daemon', 'aira_tripwire.log');

    const ts = FIXED_NOW.toISOString();
    const advisoryOnly: TripwireMatch[] = [
      {
        ts,
        target_type: 'external_post',
        matched_keyword: 'CUSTOM_ADVISORY',
        source: 'note.md',
        excerpt: 'low priority note ...',
        gate_category: 'advisory',
      },
      {
        ts,
        target_type: 'public_claim',
        matched_keyword: 'CUSTOM_VALIDATING',
        source: 'note.md',
        excerpt: 'tagged validating ...',
        gate_category: 'validating',
      },
    ];

    const result = await enforceTripwire(advisoryOnly, {
      inboxPath,
      logPath,
      now: FIXED_NOW,
    });

    expect(result.blocked).toBe(false);
    expect(result.approval_inbox_path).toBeNull();
    expect(result.audit_log_appended).toBe(true);

    const logRaw = await readFile(logPath, 'utf-8');
    const lines = logRaw.trim().split('\n');
    expect(lines).toHaveLength(2);
    for (const line of lines) {
      const obj = JSON.parse(line);
      expect(obj.enforced).toBe(false);
    }

    await expect(readdir(inboxPath)).rejects.toThrow();
  });
});

describe('enforceTripwire — 空 matches (no-op)', () => {
  it('returns no-op result and does not create files', async () => {
    const inboxPath = join(TMP_ROOT, 'inbox');
    const logPath = join(TMP_ROOT, '_daemon', 'aira_tripwire.log');

    const result = await enforceTripwire([], {
      inboxPath,
      logPath,
      now: FIXED_NOW,
    });

    expect(result.blocked).toBe(false);
    expect(result.approval_inbox_path).toBeNull();
    expect(result.audit_log_appended).toBe(false);
    expect(result.notes.join(' ')).toContain('no matches');

    await expect(readFile(logPath, 'utf-8')).rejects.toThrow();
    await expect(readdir(inboxPath)).rejects.toThrow();
  });
});

describe('scanJudgmentsForTripwire — Evaluator chain integration', () => {
  it('extracts Tripwire matches from FailureJudgment description + evidence extract', () => {
    const judgments: FailureJudgment[] = [
      {
        ts: '2026-05-06T11:00:00+09:00',
        type: 'escalate',
        confidence: 'high',
        evidence_pointer: {
          source_file: '/abs/path/aira_observer_counter.json',
          timestamp: '2026-05-06T10:55:00+09:00',
          extract: 'denial 累計 30、 polar.sh 連動 path で escalate 候補',
        },
        review_tag: 'human_review_required',
        description: '今日 zenn publish を打つ計画あり、 jun + Kai cross-check 候補',
      },
      {
        ts: '2026-05-06T11:05:00+09:00',
        type: 'idle',
        confidence: 'medium',
        evidence_pointer: {
          source_file: '/abs/path/state.md',
          timestamp: '2026-05-06T10:00:00+09:00',
          extract: 'no relevant keyword content here',
        },
        review_tag: 'human_review_recommended',
        description: 'Active Work 0 件で 60 min 経過',
      },
    ];

    const matches = scanJudgmentsForTripwire(judgments, { now: FIXED_NOW });

    const types = matches.map((m) => m.target_type);
    expect(types).toContain('external_post');
    expect(types).toContain('payment_contract');

    for (const m of matches) {
      if (m.target_type === 'external_post') {
        expect(m.gate_category).toBe('blocking');
        expect(m.source).toBe('/abs/path/aira_observer_counter.json');
      }
      if (m.target_type === 'payment_contract') {
        expect(m.gate_category).toBe('escalating');
      }
    }
  });
});
