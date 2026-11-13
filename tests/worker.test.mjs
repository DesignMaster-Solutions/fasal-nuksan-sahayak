import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker, { Counter } from '../worker.js';

class FakeStorage {
  constructor() { this.m = new Map(); }
  async get(k) { return this.m.get(k); }
  async put(k, v) { this.m.set(k, v); }
  async list() { return new Map(this.m); }
}
const counter = () => new Counter({ storage: new FakeStorage() });
const post = (body) => new Request('https://x/api/event', { method: 'POST', body });
const stats = async (c) => (await (await c.fetch(new Request('https://x/api/stats'))).json()).counts;

test('every valid event is counted in total, per language and per day', async () => {
  const c = counter();
  for (const event of ['report', 'open', 'share', 'share_link', 'docket_yes', 'docket_no']) {
    assert.equal((await c.fetch(post(JSON.stringify({ event, lang: 'hi' })))).status, 204, event);
  }
  assert.equal((await c.fetch(post(JSON.stringify({ event: 'report', lang: 'en' })))).status, 204);
  const s = await stats(c);
  const day = new Date().toISOString().slice(0, 10);
  assert.equal(s['total:report'], 2);
  assert.equal(s['lang:hi:report'], 1);
  assert.equal(s['lang:en:report'], 1);
  assert.equal(s[`day:${day}:report`], 2);
  assert.equal(s['total:open'], 1);
  assert.equal(s['total:docket_no'], 1);
});

test('unknown events, languages, extra data and broken JSON are rejected and not stored', async () => {
  const c = counter();
  assert.equal((await c.fetch(post(JSON.stringify({ event: 'name', lang: 'en' })))).status, 400);
  assert.equal((await c.fetch(post(JSON.stringify({ event: 'report', lang: 'xx' })))).status, 400);
  assert.equal((await c.fetch(post(JSON.stringify({ event: 'report', lang: 'en', state: 'Bihar' })))).status, 400);
  assert.equal((await c.fetch(post('{not json'))).status, 400);
  assert.deepEqual(await stats(c), {});
});

test('the worker routes /api/event and /api/stats, rejects wrong methods and unknown /api paths', async () => {
  const seen = [];
  const env = {
    ASSETS: { fetch: async (r) => { seen.push(new URL(r.url).pathname); return new Response('asset'); } },
    COUNTER: { idFromName: (n) => n, get: () => counter() },
  };
  assert.equal(await (await worker.fetch(new Request('https://x/'), env)).text(), 'asset');
  assert.equal(await (await worker.fetch(new Request('https://x/stats'), env)).text(), 'asset');
  assert.equal((await worker.fetch(new Request('https://x/api/stats'), env)).status, 200);
  assert.equal((await worker.fetch(post(JSON.stringify({ event: 'share', lang: 'en' })), env)).status, 204);
  assert.equal((await worker.fetch(post('[]'), env)).status, 400);
  assert.equal((await worker.fetch(new Request('https://x/api/event'), env)).status, 405);
  assert.equal((await worker.fetch(new Request('https://x/api/stats', { method: 'POST' }), env)).status, 405);
  assert.equal((await worker.fetch(new Request('https://x/api/other'), env)).status, 404);
  assert.deepEqual(seen, ['/', '/stats']);
});
