export function evaluateFlag(flag, key, ctx = {}) {
  if (flag === null || typeof flag !== 'object') {
    throw new TypeError('flag must be a config object');
  }
  if (typeof key !== 'string' || key.length === 0) {
    throw new TypeError('key must be a non-empty string');
  }
  if (ctx === null || typeof ctx !== 'object') {
    throw new TypeError('ctx must be an object');
  }

  for (const rule of flag.overrides || []) {
    const v = ctx[rule.attribute];
    if (rule.values.includes(v)) {
      return Boolean(rule.enabled);
    }
  }

  if (typeof flag.rolloutPercent === 'number' && flag.rolloutPercent > 0) {
    const b = hashToBucket(key, flag.salt || '');
    return b < flag.rolloutPercent;
  }

  return false;
}

function hashToBucket(key, salt) {
  const s = salt + ':' + key;
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  }
  const u = h >>> 0;
  return Math.floor((u / 0xffffffff) * 100);
}
