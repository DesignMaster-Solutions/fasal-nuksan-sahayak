// The app is used right after a storm, when mobile data is often down: it must open offline.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('sw.js precaches every file the first screen needs', () => {
  const sw = read('sw.js');
  const needed = new Set(['/']);
  for (const m of read('index.html').matchAll(/(?:href|src)="([\w.-]+\.(?:css|js))"/g)) needed.add(`/${m[1]}`);
  for (const m of read('app.js').matchAll(/from '\.\/([\w.-]+\.js)'/g)) needed.add(`/${m[1]}`);
  assert.ok(needed.size >= 5, `expected index, css and 3 modules, got ${[...needed]}`);
  for (const f of needed) assert.ok(sw.includes(`'${f}'`), `sw.js does not precache ${f}`);
});

test('sw.js is network-first and never touches the counter API', () => {
  const sw = read('sw.js');
  assert.match(sw, /\/api\//, 'must skip /api/');
  assert.ok(sw.indexOf('fetch(e.request)') < sw.indexOf('caches.match('), 'network before cache: online users always get the current rules');
  assert.match(sw, /ignoreSearch/, '?lang=hi must open offline too');
});

test('app.js registers the service worker', () => {
  assert.ok(read('app.js').includes("serviceWorker?.register('sw.js')"), 'app.js must register sw.js');
});
