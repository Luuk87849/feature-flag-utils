import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateFlag } from '../src/core.js';

describe('evaluateFlag rollout', () => {
  it('returns false when rolloutPercent is 0', () => {
    assert.equal(evaluateFlag({ rolloutPercent: 0 }, 'user-1'), false);
  });

  it('returns true for all keys when rolloutPercent is 100', () => {
    const flag = { rolloutPercent: 100, salt: 's' };
    assert.equal(evaluateFlag(flag, 'a'), true);
    assert.equal(evaluateFlag(flag, 'zzz'), true);
  });

  it('is stable for the same key', () => {
    const flag = { rolloutPercent: 50, salt: 'launch' };
    assert.equal(evaluateFlag(flag, 'user-42'), evaluateFlag(flag, 'user-42'));
  });
});

describe('evaluateFlag overrides', () => {
  const flag = {
    overrides: [
      { attribute: 'userId', values: ['admin'], enabled: true },
      { attribute: 'country', values: ['US', 'CA'], enabled: false },
    ],
    rolloutPercent: 0,
  };

  it('first matching override wins', () => {
    assert.equal(evaluateFlag(flag, 'admin', { userId: 'admin', country: 'US' }), true);
  });

  it('later override applies when earlier does not match', () => {
    assert.equal(evaluateFlag(flag, 'u1', { country: 'CA' }), false);
  });

  it('override value false is honoured', () => {
    const f = { overrides: [{ attribute: 'tier', values: ['beta'], enabled: false }], rolloutPercent: 100 };
    assert.equal(evaluateFlag(f, 'x', { tier: 'beta' }), false);
  });
});

describe('evaluateFlag edge cases', () => {
  it('falls through to rollout when override attribute absent', () => {
    const f = { overrides: [{ attribute: 'tier', values: ['beta'], enabled: false }], rolloutPercent: 100 };
    assert.equal(evaluateFlag(f, 'x', {}), true);
  });

  it('different salts can yield different results', () => {
    let on = 0;
    for (let i = 1; i <= 1000; i++) {
      if (evaluateFlag({ rolloutPercent: 10, salt: 'A' }, 'k-' + i)) on++;
    }
    assert.ok(on > 0 && on < 1000);
  });
});

describe('evaluateFlag validation', () => {
  it('throws on non-object flag', () => {
    assert.throws(() => evaluateFlag(null, 'k'), TypeError);
  });
  it('throws on empty key', () => {
    assert.throws(() => evaluateFlag({ rolloutPercent: 0 }, ''), TypeError);
  });
  it('throws on non-object ctx', () => {
    assert.throws(() => evaluateFlag({ rolloutPercent: 0 }, 'k', null), TypeError);
  });
});
