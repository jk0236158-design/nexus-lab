import { describe, it, expect } from 'vitest';
import {
  runHonestyAudit,
  checkLiteralVerification,
  checkExaggerationPhrases,
  checkDogfoodEvidence,
} from '../audit';

describe('Honesty audit Layer A: literal verification (axis 12 v0)', () => {
  it('数字 token + source annotation で yellow finding 0', () => {
    const content = '4 ヶ月運用中 (source: ledger/2026-05.md#L42)。';
    const findings = checkLiteralVerification(content);
    const yellowCount = findings.filter((f) => f.severity === 'yellow').length;
    expect(yellowCount).toBe(0);
  });

  it('数字 token without source annotation で yellow finding', () => {
    const content = '4 ヶ月運用中。 100 件達成。';
    const findings = checkLiteralVerification(content);
    const yellowCount = findings.filter((f) => f.severity === 'yellow').length;
    expect(yellowCount).toBeGreaterThan(0);
  });
});

describe('Honesty audit Layer B: 誇張 phrase block', () => {
  it('「完成」 単独使用で red finding', () => {
    const content = 'Phase B 完成。';
    const findings = checkExaggerationPhrases(content);
    const redCount = findings.filter((f) => f.severity === 'red').length;
    expect(redCount).toBeGreaterThan(0);
  });

  it('「Phase X reify (北極星未達)」 form で誇張 finding 0', () => {
    const content = 'Phase B reify (北極星未達)。';
    const findings = checkExaggerationPhrases(content);
    const redCount = findings.filter((f) => f.severity === 'red').length;
    expect(redCount).toBe(0);
  });

  it('「世界初」 で red finding', () => {
    const content = '世界初の AI 運用 OS。';
    const findings = checkExaggerationPhrases(content);
    expect(findings.length).toBeGreaterThan(0);
  });
});

describe('Honesty audit Layer C: dogfood evidence link', () => {
  it('dogfood evidence link 不在で red finding', () => {
    const content = 'Yuino release 案。';
    const findings = checkDogfoodEvidence(content);
    expect(findings.length).toBe(1);
    expect(findings[0].severity).toBe('red');
  });

  it('dogfood evidence link 存在で finding 0', () => {
    const content =
      'Yuino release 案 (dogfood evidence: aira/data/digests/2026-05-07_yuino_digest.md)。';
    const findings = checkDogfoodEvidence(content);
    expect(findings.length).toBe(0);
  });
});

describe('runHonestyAudit (3 layer 統合)', () => {
  it('全 layer pass で passed=true', () => {
    const content = `# Yuino Phase B reify (北極星未達)

実 4 ヶ月運用 (source: ledger/2026-05.md#L42)。
dogfood evidence: aira/data/digests/2026-05-07_yuino_digest.md`;
    const result = runHonestyAudit(content);
    expect(result.passed).toBe(true);
  });

  it('red finding 1 件以上で passed=false (Fail Closed)', () => {
    const content = '世界初の AI 運用 OS 完成。';
    const result = runHonestyAudit(content);
    expect(result.passed).toBe(false);
    expect(result.findings.length).toBeGreaterThan(0);
  });

  it('summary に red / yellow / info 件数表示', () => {
    const content = '世界初の AI 運用 OS 完成。 100 件達成。';
    const result = runHonestyAudit(content);
    expect(result.summary).toContain('red');
    expect(result.summary).toContain('yellow');
  });
});
