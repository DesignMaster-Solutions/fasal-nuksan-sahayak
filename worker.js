// Fasal Nuksan Sahayak Worker: static assets are served directly; only /api/* runs here.
// Anonymous usage counter for the impact data (one Durable Object, so increments are atomic):
// it stores the event name and the language as totals, per language and per day (UTC).
// Never the peril, the State, the report text, names, numbers or IPs. GET /api/stats is public.
const EVENTS = new Set(['report', 'open', 'share', 'docket_yes', 'docket_no']);
const LANGS = new Set(['en', 'hi']);

export class Counter {
  constructor(state) { this.storage = state.storage; }

  async fetch(req) {
    if (req.method === 'POST') {
      let body;
      try { body = JSON.parse(await req.text()); } catch { return new Response('bad json', { status: 400 }); }
      // Exactly {event, lang}: anything more would be data we promised not to keep.
      if (!EVENTS.has(body?.event) || !LANGS.has(body?.lang) || Object.keys(body).length !== 2) {
        return new Response('bad event', { status: 400 });
      }
      const day = new Date().toISOString().slice(0, 10);
      for (const k of [`total:${body.event}`, `lang:${body.lang}:${body.event}`, `day:${day}:${body.event}`]) {
        await this.storage.put(k, ((await this.storage.get(k)) || 0) + 1);
      }
      return new Response(null, { status: 204 });
    }
    const counts = Object.fromEntries(await this.storage.list());
    return Response.json({ since: '2026-11-05', counts }, { headers: { 'cache-control': 'no-store' } });
  }
}

export default {
  async fetch(req, env) {
    const { pathname } = new URL(req.url);
    if (pathname === '/api/event' || pathname === '/api/stats') {
      const wanted = pathname === '/api/event' ? 'POST' : 'GET';
      if (req.method !== wanted) return new Response(null, { status: 405 });
      return env.COUNTER.get(env.COUNTER.idFromName('global')).fetch(req);
    }
    if (pathname.startsWith('/api/')) return new Response(null, { status: 404 });
    return env.ASSETS.fetch(req);
  },
};
