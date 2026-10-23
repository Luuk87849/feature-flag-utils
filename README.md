# feature-flag-utils

A small function for evaluating feature flags with rollout percentages and override rules.

```js
import { evaluateFlag } from 'feature-flag-utils';

const flag = {
  overrides: [
    { attribute: 'userId', values: ['admin'], enabled: true },
    { attribute: 'country', values: ['US'], enabled: false },
  ],
  rolloutPercent: 30,
  salt: 'checkout-v2',
};

evaluateFlag(flag, 'user-42', { userId: 'user-42', country: 'US' });
```

## Why

Production flag systems either live behind a hosted service or carry an SDK that
does too much. This library is the one decision the server does not need to make:
given a flag config and a user key, are they in? The trade-off is that there is no
streaming, no analytics, no persistence — you call it, it returns a boolean.

## Edge cases

Overrides are evaluated in order; the first one whose attribute value is in its
`values` list wins, and no further overrides are checked. `enabled: false` is a
real outcome, not a skip — use it to explicitly turn a flag off for a cohort.

The rollout bucket is derived from a 32-bit hash of `salt + ':' + key` mapped to
0–99. Because the hash space is finite, a 30% rollout will not land on exactly
30% of keys for small samples; it converges as the cohort grows.
