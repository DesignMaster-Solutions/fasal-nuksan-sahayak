import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PERILS, istToEpoch, formatIST, classify, needsIndividualIntimation, deadline, status, intimationText,
} from '../rules.js';

const H = 3600e3;
const ev = istToEpoch('2026-11-05', '14:30');

// Expected kind for every peril x crop state (harvest 3 days before the event, inside 14 days).
const EXPECTED = {
  standing: {
    hail: 'localized', landslide: 'localized', inundation: 'localized', cloudburst: 'localized',
    lightning_fire: 'localized', rain_cyclone: 'widespread', drought_pest: 'widespread', other: 'other',
  },
  cut_in_field: {
    hail: 'post_harvest', landslide: 'not_listed_cut', inundation: 'not_listed_cut', cloudburst: 'not_listed_cut',
    lightning_fire: 'not_listed_cut', rain_cyclone: 'post_harvest', drought_pest: 'widespread', other: 'other',
  },
  stored: Object.fromEntries(['hail', 'landslide', 'inundation', 'cloudburst', 'lightning_fire', 'rain_cyclone', 'drought_pest', 'other'].map((p) => [p, 'stored'])),
};

test('there are exactly the eight perils of the brief', () => {
  assert.deepEqual([...PERILS].sort(), Object.keys(EXPECTED.standing).sort());
});

for (const [cropState, byPeril] of Object.entries(EXPECTED)) {
  for (const [peril, kind] of Object.entries(byPeril)) {
    test(`${peril} on a ${cropState} crop -> ${kind}`, () => {
      const r = classify({ peril, cropState, eventEpoch: ev, harvestDate: '2026-11-02' });
      assert.equal(r.kind, kind);
      assert.ok(r.refs.length > 0, 'every result cites the OG');
    });
  }
}

test('individual intimation is needed only for localized, post_harvest and not_listed_cut', () => {
  const yes = ['localized', 'post_harvest', 'not_listed_cut'];
  for (const k of ['localized', 'post_harvest', 'post_harvest_late', 'not_listed_cut', 'stored', 'widespread', 'other']) {
    assert.equal(needsIndividualIntimation(k), yes.includes(k), k);
  }
});

test('individual cover results carry the add-on and premium caveats with their paragraphs', () => {
  const loc = classify({ peril: 'hail', cropState: 'standing', eventEpoch: ev });
  assert.ok(loc.caveats.includes('caveat_notified') && loc.caveats.includes('caveat_premium'));
  assert.ok(['5.2.4', '21.5.4.1', '21.5.4.4'].every((p) => loc.refs.includes(p)));
  const ph = classify({ peril: 'rain_cyclone', cropState: 'cut_in_field', eventEpoch: ev, harvestDate: '2026-11-01' });
  assert.ok(ph.caveats.includes('caveat_notified') && ph.caveats.includes('caveat_premium'));
  assert.ok(ph.caveats.includes('caveat_unseasonal'), 'unseasonal rain needs >20% over LPA (21.6.2)');
  assert.ok(['5.2.3', '21.6.1', '21.6.4.1', '21.5.4.4'].every((p) => ph.refs.includes(p)));
  assert.ok(classify({ peril: 'drought_pest', cropState: 'standing', eventEpoch: ev }).refs.includes('5.5'));
});

test('post-harvest window: day 14 after harvest is inside, day 15 is outside (calendar days in IST)', () => {
  const at = (date, time) => classify({ peril: 'hail', cropState: 'cut_in_field', eventEpoch: istToEpoch(date, time), harvestDate: '2026-11-01' }).kind;
  assert.equal(at('2026-11-01', '18:00'), 'post_harvest');
  assert.equal(at('2026-11-15', '23:59'), 'post_harvest');
  assert.equal(at('2026-11-16', '00:00'), 'post_harvest_late');
  assert.equal(at('2026-11-16', '00:01'), 'post_harvest_late');
});

test('72-hour edge: 71:59 open, exactly 72:00 open, 72:01 closed', () => {
  assert.equal(deadline(ev), ev + 72 * H);
  assert.deepEqual(status(ev, ev + 71 * H + 59 * 60e3), { open: true, msLeft: 60e3 });
  assert.deepEqual(status(ev, ev + 72 * H), { open: true, msLeft: 0 });
  assert.equal(status(ev, ev + 72 * H + 60e3).open, false);
});

test('IST handling does not depend on the phone time zone', () => {
  const before = process.env.TZ;
  const seen = new Set();
  const offsets = new Set();
  for (const tz of ['America/Sao_Paulo', 'UTC', 'Asia/Kolkata']) {
    process.env.TZ = tz;
    offsets.add(new Date(Date.UTC(2026, 10, 5)).getTimezoneOffset());
    const e = istToEpoch('2026-11-05', '14:30');
    seen.add(e);
    assert.equal(e, Date.parse('2026-11-05T14:30:00+05:30'), tz);
    assert.match(formatIST(e, 'en'), /5 Nov 2026, 14:30 IST/);
    assert.match(formatIST(e, 'hi'), /5 नवंबर 2026, 14:30 IST/);
  }
  process.env.TZ = before;
  if (before === undefined) delete process.env.TZ;
  assert.equal(offsets.size, 3, 'the time zone really changed between runs');
  assert.equal(seen.size, 1);
});

const FORBIDDEN = /you will get|will be paid|guaranteed|₹|\bRs\.?\b|rupee|रुपये|रुपए|रुपया/i;
const FULL = {
  name: 'Ramesh Kumar', mobile: '9876500000', appNo: '0402250123456789', account: '12345678901',
  state: 'Madhya Pradesh', district: 'Vidisha', village: 'Gyaraspur', survey: '112/3', crop: 'Wheat',
  season: 'rabi', area: '1.5 acre', peril: 'hail', cropState: 'cut_in_field', eventEpoch: ev, harvestDate: '2026-11-02',
};

for (const lang of ['en', 'hi']) {
  test(`intimation text (${lang}) has the facts, no promise and no rupee amount`, () => {
    const full = intimationText(FULL, lang);
    for (const v of ['Ramesh Kumar', '9876500000', '0402250123456789', '12345678901', 'Vidisha', 'Gyaraspur', '112/3', 'Wheat', '1.5 acre', '14:30']) {
      assert.ok(full.includes(v), v);
    }
    assert.ok(full.includes('2 ' + (lang === 'hi' ? 'नवंबर' : 'Nov') + ' 2026'), 'harvest date of a cut crop');
    assert.doesNotMatch(full, FORBIDDEN);
    assert.doesNotMatch(full, /______/);
  });

  test(`intimation text (${lang}) keeps empty fields as visible blanks and invents nothing`, () => {
    const empty = intimationText({ peril: 'hail', cropState: 'standing', eventEpoch: ev }, lang);
    assert.ok((empty.match(/______/g) || []).length >= 10, 'one blank per missing field');
    assert.doesNotMatch(empty, FORBIDDEN);
    assert.doesNotMatch(empty, /undefined|null|NaN/);
    assert.ok(!intimationText({ ...FULL, cropState: 'standing' }, lang).includes('2 ' + (lang === 'hi' ? 'नवंबर' : 'Nov')), 'no harvest line for a standing crop');
  });
}
