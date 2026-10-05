// Recovery codes are bearer credentials. Store only their SHA-256 hash in D1.
const MAX_BYTES = 65536;
const DEFAULT_ORIGINS = 'https://starwave0225.github.io,http://127.0.0.1:4173,http://localhost:4173';
async function hash(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(n => n.toString(16).padStart(2, '0')).join('');
}
function record(row) {
  return { state: JSON.parse(row.data), version: row.version, updatedAt: row.updated_at };
}
async function readBody(request) {
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) throw new Error('invalid_body');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('invalid_body');
  let length = 0;
  const chunks = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > MAX_BYTES) { await reader.cancel(); throw new Error('too_large'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  let body;
  try { body = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new Error('invalid_body'); }
  const state = body?.state;
  if (!state || typeof state !== 'object' || Array.isArray(state) ||
      typeof state.playerName !== 'string' || state.playerName.length > 12 ||
      !['male', 'female'].includes(state.playerGender)) throw new Error('invalid_body');
  return body;
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const allowed = (env.ALLOWED_ORIGINS || DEFAULT_ORIGINS).split(',').map(s => s.trim());
    const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Vary': 'Origin', 'X-Content-Type-Options': 'nosniff' };
    if (origin && allowed.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
    const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
    if (origin && !allowed.includes(origin)) return reply({ error: 'origin_denied' }, 403);
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { ...headers,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Max-Age': '86400' } });
    }
    const path = new URL(request.url).pathname;
    try {
      if (path === '/health' && request.method === 'GET') {
        await env.DB.prepare('SELECT token_hash FROM saves LIMIT 0').all();
        return reply({ ok: true, service: 'find-you-saves' });
      }
      if (path !== '/v1/save') return reply({ error: 'not_found' }, 404);
      if (!['GET', 'POST', 'PUT'].includes(request.method)) return reply({ error: 'method_not_allowed' }, 405);
      const token = request.headers.get('Authorization')?.match(/^Bearer (FY1_[a-f0-9]{64})$/)?.[1];
      if (!token) return reply({ error: 'invalid_code' }, 401);
      const tokenHash = await hash(token);
      // Use the primary so GET and conflict handling see the latest committed version.
      const db = env.DB.withSession ? env.DB.withSession('first-primary') : env.DB;
      const select = () => db.prepare('SELECT data, version, updated_at FROM saves WHERE token_hash = ?').bind(tokenHash).first();
      if (request.method === 'GET') {
        const row = await select();
        return row ? reply(record(row)) : reply({ error: 'not_found' }, 404);
      }
      const body = await readBody(request);
      const data = JSON.stringify(body.state);
      const now = new Date().toISOString();
      if (request.method === 'POST') {
        const existing = await select();
        if (existing) return reply(record(existing)); // Idempotent retry after a lost response.
        const day = now.slice(0, 10);
        const bucket = await hash(`${day}:${request.headers.get('CF-Connecting-IP') || 'local'}`);
        const quota = await db.prepare('INSERT INTO create_limits(bucket, day, count) VALUES (?, ?, 1) ON CONFLICT(bucket) DO UPDATE SET count = count + 1 WHERE count < 5 RETURNING count').bind(bucket, day).first();
        if (!quota) return reply({ error: 'create_limit' }, 429);
        await db.prepare('DELETE FROM create_limits WHERE day < ?').bind(day).run();
        await db.prepare('INSERT OR IGNORE INTO saves(token_hash, data, version, updated_at) VALUES (?, ?, 1, ?)').bind(tokenHash, data, now).run();
        return reply(record(await select()), 201);
      }
      if (!Number.isSafeInteger(body.version) || body.version < 1) return reply({ error: 'invalid_version' }, 400);
      const updated = await db.prepare('UPDATE saves SET data = ?, version = version + 1, updated_at = ? WHERE token_hash = ? AND version = ? RETURNING data, version, updated_at').bind(data, now, tokenHash, body.version).first();
      if (updated) return reply(record(updated));
      const current = await select();
      return current ? reply({ error: 'conflict', ...record(current) }, 409) : reply({ error: 'not_found' }, 404);
    } catch (error) {
      if (error.message === 'too_large') return reply({ error: 'too_large' }, 413);
      if (error.message === 'invalid_body') return reply({ error: 'invalid_body' }, 400);
      // Never return SQL, request bodies, or credentials in error responses.
      return reply({ error: 'unavailable' }, 503);
    }
  }
};
