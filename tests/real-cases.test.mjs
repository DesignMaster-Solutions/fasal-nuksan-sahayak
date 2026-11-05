// Replays real court and consumer-commission cases (evidence/real-cases) through the app's own rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { classify, needsIndividualIntimation, deadline, istToEpoch, formatIST, PERILS } from '../rules.js';
import { STRINGS } from '../i18n.js';

const dir = new URL('../evidence/real-cases/', import.meta.url);
const { cases } = JSON.parse(readFileSync(new URL('cases.json', dir), 'utf8'));
const flat = (s) => s.replace(/\s+/g, ' ');
const at = (iso) => istToEpoch(...iso.split('T'));

test('there are real cases and every id is unique', () => {
  assert.ok(cases.length >= 8);
  assert.equal(new Set(cases.map((c) => c.id)).size, cases.length);
});

for (const c of cases) {
  test(`${c.id}: the quote is verbatim in the saved decision`, () => {
    assert.match(c.url, /^https:\/\/indiankanoon\.org\/doc\/\d+\/$/);
    const src = flat(readFileSync(new URL(c.source, dir), 'utf8'));
    assert.ok(src.includes(flat(c.quote)), c.quote);
    for (const f of c.figures ?? []) assert.ok(flat(readFileSync(new URL(f.source, dir), 'utf8')).includes(f.text), f.text);
  });

  if (!c.replay) continue;
  const r = c.replay;

  test(`${c.id}: the app gives the expected kind for each crop state the decision allows`, () => {
    assert.ok(PERILS.includes(r.peril));
    if (c.crop_state) assert.deepEqual(Object.keys(r.expect), [c.crop_state], 'crop state is fixed by the decision');
    const ev = r.event ? at(r.event.from) : istToEpoch('2026-01-01');
    for (const [cropState, kind] of Object.entries(r.expect)) {
      // No harvest date in any decision: the app does not judge post-harvest late without one.
      assert.equal(classify({ peril: r.peril, cropState, eventEpoch: ev }).kind, kind, cropState);
    }
    if (r.commission_kind) {
      const kinds = Object.values(r.expect);
      const agrees = kinds.includes(r.commission_kind);
      // Where the app reads it differently from the court, the case must say so.
      if (!agrees) assert.ok(r.divergence, 'disagreement with the court must be written down');
    }
  });

  if (!r.event) continue;

  test(`${c.id}: the 72-hour window the app would show, in IST`, () => {
    const [first, last] = [deadline(at(r.event.from)), deadline(at(r.event.to))];
    assert.deepEqual([formatIST(first, 'en'), formatIST(last, 'en')], r.event.window_end);
    for (const i of r.intimations) {
      // Times of day are unknown: inside only if the whole day is before the earliest deadline.
      const verdict = at(i.to) <= first ? 'inside' : at(i.from) > last ? 'outside' : 'undetermined';
      assert.equal(verdict, i.expect, i.who);
    }
  });
}

test('aggregates written in the README match cases.json', () => {
  const lost = cases.filter((c) => c.lost_for_notice === true);
  const overturned = cases.filter((c) => c.outcome.startsWith('repudiation overturned'));
  const individual = cases.filter((c) => c.replay && Object.values(c.replay.expect).some(needsIndividualIntimation));
  const claimed = cases.reduce((s, c) => s + (c.amount_claimed_rs ?? 0), 0);
  const farmers = cases.reduce((s, c) => s + c.farmers, 0);
  const readme = flat(readFileSync(new URL('README.md', dir), 'utf8'));
  for (const s of [
    `${cases.length} decisions`, `${farmers.toLocaleString('en-IN')} farmers`, `${lost.length} lost`,
    `${overturned.length} overturned`, `Rs ${claimed.toLocaleString('en-IN')}`, `${individual.length} of ${cases.filter((c) => c.replay).length}`,
  ]) assert.ok(readme.includes(s), s);
});

// Rain on a standing crop stays area-based, as the guidelines say, but insurers still refused such claims for no
// 72-hour notice (Doddaballapura, Odisha), so the screen must tell the farmer to report within 72 hours anyway.
test('rain on a standing crop: the area-based screen still tells the farmer to report within 72 hours', () => {
  assert.equal(classify({ peril: 'rain_cyclone', cropState: 'standing', eventEpoch: Date.now() }).kind, 'widespread');
  const { en, hi } = STRINGS;
  assert.match(en.kind_widespread_b, /standing crop[^.]*refused[^.]*72 hours/);
  assert.match(en.kind_widespread_b, /report it within 72 hours anyway/);
  assert.match(hi.kind_widespread_b, /72 घंटे के अंदर सूचना दें/);
  assert.doesNotMatch(en.kind_widespread_t, /do not have to report/);
});
