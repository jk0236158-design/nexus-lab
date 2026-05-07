import { describe, it, expect } from 'vitest';
import {
  checkPermission,
  isInternalExecuteWhitelisted,
} from '../permissions';

describe('checkPermission (Yuino セキュリティ v0 axis 19)', () => {
  it('Read level: 自動許可', () => {
    const r = checkPermission('read');
    expect(r.allowed).toBe(true);
    expect(r.requiresJunApproval).toBe(false);
  });

  it('Draft level: 自動許可、 但し公開不可', () => {
    const r = checkPermission('draft');
    expect(r.allowed).toBe(true);
    expect(r.requiresJunApproval).toBe(false);
    expect(r.reason).toContain('公開不可');
  });

  it('Internal Execute whitelisted: 自動許可', () => {
    const r = checkPermission('internal-execute', {
      internalExecuteWhitelisted: true,
    });
    expect(r.allowed).toBe(true);
    expect(r.requiresJunApproval).toBe(false);
  });

  it('Internal Execute non-whitelist: jun 確認必須', () => {
    const r = checkPermission('internal-execute', {
      internalExecuteWhitelisted: false,
    });
    expect(r.allowed).toBe(false);
    expect(r.requiresJunApproval).toBe(true);
  });

  it('External Execute jun 未承認: blocked', () => {
    const r = checkPermission('external-execute');
    expect(r.allowed).toBe(false);
    expect(r.requiresJunApproval).toBe(true);
    expect(r.reason).toContain('Approval Gate');
  });

  it('External Execute jun 承認済: allowed', () => {
    const r = checkPermission('external-execute', { junApproved: true });
    expect(r.allowed).toBe(true);
    expect(r.requiresJunApproval).toBe(false);
  });
});

describe('isInternalExecuteWhitelisted', () => {
  it('board.write は whitelist', () => {
    expect(isInternalExecuteWhitelisted('board.write')).toBe(true);
  });

  it('inbox.decide は whitelist', () => {
    expect(isInternalExecuteWhitelisted('inbox.decide')).toBe(true);
  });

  it('audit.append は whitelist', () => {
    expect(isInternalExecuteWhitelisted('audit.append')).toBe(true);
  });

  it('unknown action は non-whitelist', () => {
    expect(isInternalExecuteWhitelisted('polar.publish')).toBe(false);
    expect(isInternalExecuteWhitelisted('payment.charge')).toBe(false);
  });
});
