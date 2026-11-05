import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Runs the real counter lines of app.js with a fake browser, so ?nostats is checked on the shipped code.
const src = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const lines = src.split('\n').filter((l) => /^const (NOSTATS|count) =/.test(l)).join('\n');

function beacons(search) {
  const sent = [];
  const ctx = { location: { search }, URLSearchParams, lang: 'hi', navigator: { sendBeacon: (u, b) => sent.push([u, b]) } };
  vm.runInNewContext(`${lines}\ncount('report');`, ctx);
  return sent;
}

test('the counter lines exist in app.js', () => assert.equal(lines.split('\n').length, 2));

test('a normal visit sends only the event name and the language', () => {
  assert.deepEqual(beacons(''), [['/api/event', JSON.stringify({ event: 'report', lang: 'hi' })]]);
});

test('?nostats keeps our own tests and demo recordings out of the public counter', () => {
  assert.deepEqual(beacons('?nostats'), []);
  assert.deepEqual(beacons('?lang=hi&nostats'), []);
});
