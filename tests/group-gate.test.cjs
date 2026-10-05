const { test } = require('node:test');
const assert = require('node:assert/strict');
const config = { GROUP_GATE_QUESTION: '测试核验问题', GROUP_GATE_ANSWER: '测试答案', GROUP_GATE_QR_URL: 'https://example.com/private-qr.png' };
async function call(method, answer, env = config) {
  const worker = (await import('../cloud/worker.mjs')).default;
  return worker.fetch(new Request('https://api.example.com/v1/group-gate', { method, ...(method === 'POST' ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answer }) } : {}) }), env);
}
test('group gate remains closed before configured', async () => {
  assert.deepEqual(await (await call('GET', null, {})).json(), { ready: false, question: '' });
  assert.equal((await call('POST', 'anything', {})).status, 503);
});
test('group gate metadata never returns answer or QR', async () => {
  assert.deepEqual(await (await call('GET')).json(), { ready: true, question: config.GROUP_GATE_QUESTION });
});
test('wrong answer returns neutral failure without QR', async () => {
  const response = await call('POST', '错误');
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: 'verification_failed' });
});
test('correct answer releases QR and responses cannot be cached', async () => {
  const response = await call('POST', ' 测试答案 ');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(await response.json(), { ok: true, qrUrl: config.GROUP_GATE_QR_URL });
});
test('non-string answer is rejected', async () => {
  assert.equal((await call('POST', 42)).status, 400);
});
