import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STRINGS } from '../i18n.js';

test('English and Hindi have exactly the same keys and no empty string', () => {
  assert.deepEqual(Object.keys(STRINGS.hi).sort(), Object.keys(STRINGS.en).sort());
  for (const lang of ['en', 'hi']) {
    for (const [k, v] of Object.entries(STRINGS[lang])) assert.ok(typeof v === 'string' && v.trim(), `${lang}.${k}`);
  }
});

test('no string promises a payout or names a rupee amount', () => {
  const bad = /you will get|will be paid|guaranteed|₹|\bRs\.?\b|rupee|रुपये|रुपए|रुपया|मिलेगा पैसा|पक्का/i;
  for (const lang of ['en', 'hi']) {
    for (const [k, v] of Object.entries(STRINGS[lang])) assert.doesNotMatch(v, bad, `${lang}.${k}`);
  }
});
