const test = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { readFileSync } = require('node:fs');
const { randomBytes } = require('node:crypto');
const state = { playerName: '测试玩家', playerGender: 'male', clues: [] };
const code = () => 'FY1_' + randomBytes(32).toString('hex');

async function setup(t) {
  const worker = (await import('../cloud/worker.mjs')).default;
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(require.resolve('../cloud/migrations/0001_saves.sql'), 'utf8'));
  t.after(() => sqlite.close());
  const DB = { prepare(sql) {
    const query = sqlite.prepare(sql);
    const statement = args => ({ bind: (...values) => statement(values),
      first: async () => query.get(...args), all: async () => ({ results: query.all(...args) }),
      run: async () => query.run(...args) });
    return statement([]);
  } };
  return { sqlite, async send(method, token, body, headers = {}, path = '/v1/save') {
    const request = new Request('https://saves.test' + path, { method,
      headers: { Origin: 'https://starwave0225.github.io', ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
      ...(body ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}) });
    const response = await worker.fetch(request, { DB });
    return { status: response.status, headers: response.headers, data: response.status === 204 ? null : await response.json() };
  } };
}
test('cloud saves require the full credential and store only a hash; creation is idempotent', async t => {
  const api = await setup(t), token = code();
  assert.equal((await api.send('GET')).status, 401);
  assert.equal((await api.send('GET', 'FY1_short')).status, 401);
  assert.equal((await api.send('GET', code())).status, 404);
  const created = await api.send('POST', token, { state });
  assert.equal(created.status, 201); assert.equal(created.data.version, 1);
  assert.deepEqual((await api.send('GET', token)).data.state, state);
  const again = await api.send('POST', token, { state: { ...state, clues: ['new'] } });
  assert.deepEqual(again.data.state, state);
  const rows = api.sqlite.prepare('SELECT * FROM saves').all();
  assert.equal(rows.length, 1); assert.equal(JSON.stringify(rows).includes(token), false);
});
test('concurrent devices cannot overwrite a newer version', async t => {
  const api = await setup(t), token = code();
  await api.send('POST', token, { state });
  const results = await Promise.all(['a', 'b'].map(clue => api.send('PUT', token, { version: 1, state: { ...state, clues: [clue] } })));
  assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
  assert.equal(results.find(r => r.status === 409).data.version, 2);
  assert.equal((await api.send('PUT', token, { state, version: 0 })).status, 400);
  assert.equal((await api.send('PUT', code(), { state, version: 1 })).status, 404);
});
test('API rejects other origins, oversized/invalid input and limits new saves per IP/day', async t => {
  const api = await setup(t);
  assert.equal((await api.send('GET', code(), null, { Origin: 'https://other.test' })).status, 403);
  const cors = await api.send('OPTIONS');
  assert.equal(cors.status, 204); assert.equal(cors.headers.get('access-control-allow-origin'), 'https://starwave0225.github.io');
  assert.equal((await api.send('POST', code(), '{')).status, 400);
  assert.equal((await api.send('POST', code(), { state: {} })).status, 400);
  assert.equal((await api.send('POST', code(), { state: { ...state, huge: 'a'.repeat(66000) } })).status, 413);
  for (let i = 0; i < 5; i++) assert.equal((await api.send('POST', code(), { state })).status, 201);
  assert.equal((await api.send('POST', code(), { state })).status, 429);
  assert.equal((await api.send('GET', null, null, {}, '/health')).data.ok, true);
});
