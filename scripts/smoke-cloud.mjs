// Creates one isolated save; never uses a player's recovery code.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
const base = process.argv[2] || 'http://127.0.0.1:8787';
const token = 'FY1_' + randomBytes(32).toString('hex');
const state = { playerName: '接口测试', playerGender: 'male', clues: [] };
async function send(method, body, authenticated = true) {
  const res = await fetch(`${base}/v1/save`, { method, headers: {
    Origin: 'https://starwave0225.github.io',
    ...(authenticated ? { Authorization: `Bearer ${token}` } : {}),
    ...(body ? { 'Content-Type': 'application/json' } : {})
  }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: res.status, body: await res.json() };
}
assert.equal((await fetch(`${base}/health`)).status, 200);
assert.equal((await send('GET', null, false)).status, 401);
const first = await send('POST', { state }); assert.equal(first.status, 201);
assert.deepEqual((await send('GET')).body.state, state);
const changed = { ...state, clues: ['smoke-test'] };
assert.equal((await send('PUT', { state: changed, version: 1 })).status, 200);
assert.equal((await send('PUT', { state, version: 1 })).status, 409);
assert.deepEqual((await send('GET')).body.state, changed);
console.log('PASS: health, authentication, create, recover, update, stale-write rejection. One isolated test save created.');
