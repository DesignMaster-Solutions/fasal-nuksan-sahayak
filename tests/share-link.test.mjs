// A son in the city can answer the questions and send the same result, with the same 72-hour clock, to the farmer.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { shareUrl, answersFrom, classify, deadline, istToEpoch } from '../rules.js';
import { STRINGS } from '../i18n.js';

const O = 'https://x.example';
const AT = istToEpoch('2026-11-10', '16:30');
const NOW = istToEpoch('2026-11-11', '09:00');
const CASES = [
  { peril: 'hail', cropState: 'standing', eventEpoch: AT, insured: 'loan' },
  { peril: 'wild_animal', cropState: 'standing', eventEpoch: AT, insured: 'unsure' },
  { peril: 'rain_cyclone', cropState: 'cut_in_field', eventEpoch: AT, insured: 'csc', harvestDate: '2026-11-02' },
];

test('answers round-trip through the link and give the same result and the same deadline', () => {
  for (const a of CASES) {
    for (const lang of ['en', 'hi']) {
      const url = new URL(shareUrl(O, a, lang));
      assert.equal(url.searchParams.get('lang'), lang);
      assert.equal(url.pathname, '/');
      const back = answersFrom(url.search, NOW);
      assert.deepEqual(back, a);
      assert.deepEqual(classify(back), classify(a));
      assert.equal(deadline(back.eventEpoch), deadline(a.eventEpoch));
    }
  }
});

test('the link carries only the language and the answers; nothing typed, harvest day only for a cut crop', () => {
  const typed = { name: 'x', mobile: '9', crop: 'wheat', state: 'Bihar', season: 'rabi', result: {} };
  const keys = (a) => [...new URL(shareUrl(O, { ...a, ...typed }, 'hi')).searchParams.keys()].sort();
  assert.deepEqual(keys(CASES[0]), ['at', 'crop', 'ins', 'lang', 'peril']);
  assert.deepEqual(keys(CASES[2]), ['at', 'crop', 'harvest', 'ins', 'lang', 'peril']);
  // A standing crop never sends a stale harvest day left over from an earlier answer.
  assert.equal(new URL(shareUrl(O, { ...CASES[0], harvestDate: '2026-11-02' }, 'en')).searchParams.has('harvest'), false);
});

test('a missing, unknown or impossible answer opens the normal first screen', () => {
  const edit = (a, fn) => { const p = new URL(shareUrl(O, a, 'en')).searchParams; fn(p); return `?${p}`; };
  const bad = [
    '', '?lang=hi', '?nostats',
    edit(CASES[0], (p) => p.delete('ins')),
    edit(CASES[0], (p) => p.delete('at')),
    edit(CASES[0], (p) => p.set('peril', '<script>')),
    edit(CASES[0], (p) => p.set('crop', 'burnt')),
    edit(CASES[0], (p) => p.set('ins', 'maybe')),
    edit(CASES[0], (p) => p.set('at', 'yesterday')),
    edit(CASES[0], (p) => p.set('at', '12.5')),
    edit(CASES[0], (p) => p.set('at', String(NOW + 3600e3))), // loss in the future
    edit(CASES[2], (p) => p.delete('harvest')),
    edit(CASES[2], (p) => p.set('harvest', '2026-13-40')),
    edit(CASES[2], (p) => p.set('harvest', '2026-11-12')), // harvested after the loss
  ];
  for (const s of bad) assert.equal(answersFrom(s, NOW), null, s);
});

test('app.js opens a shared link on the result without counting a report; worker and /stats know the event', () => {
  const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
  const app = read('app.js');
  assert.match(app, /answersFrom\(location\.search, Date\.now\(\)\)/);
  assert.match(app, /shareUrl\(location\.origin, a, lang\)/);
  assert.match(app, /count\('share_link'\)/);
  assert.match(read('index.html'), /id="pass"/);
  for (const f of ['worker.js', 'stats.html']) assert.ok(read(f).includes("'share_link'"), f);
  for (const l of ['en', 'hi']) for (const k of ['pass_on', 'pass_text']) assert.ok(STRINGS[l][k], `${l}.${k}`);
});
