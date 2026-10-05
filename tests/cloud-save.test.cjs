const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '..');
const SAVE = 'find-you-state-v1', META = 'find-you-cloud-v1', BACKUP = 'find-you-cloud-backups-v1';
const token = 'FY1_' + 'b'.repeat(64);
const state = { playerName: '测试玩家', playerGender: 'female', clues: [] };
const remote = (data = state, version = 1) => ({ state: data, version, updatedAt: '2026-10-05T00:00:00.000Z' });
const tick = () => new Promise(resolve => setImmediate(resolve));
function boot(t, { saved = state, cloud, url = 'https://starwave0225.github.io/ARG_FIND_YOU/' } = {}) {
  const errors = [], calls = [], vc = new VirtualConsole();
  vc.on('jsdomError', e => { if (!e.message.includes('navigation')) errors.push(e.message); });
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), { url, runScripts: 'outside-only', virtualConsole: vc });
  const w = dom.window, d = w.document;
  w.localStorage.setItem(SAVE, JSON.stringify(saved));
  if (cloud) w.localStorage.setItem(META, JSON.stringify(cloud));
  w.ARG_CLOUD_ENDPOINT = 'https://saves.test';
  let handler = async () => ({ status: 200, body: remote() });
  w.fetch = async (url, opts) => { const call = { url, ...opts, data: opts.body ? JSON.parse(opts.body) : undefined }; calls.push(call); const r = await handler(call); return { ok: r.status < 400, status: r.status, json: async () => r.body }; };
  w.eval(fs.readFileSync(path.join(root, 'cloud-save.js'), 'utf8'));
  t.after(() => { dom.window.close(); assert.deepEqual(errors, []); });
  return { w, d, calls, handler(fn) { handler = fn; }, read(key) { return JSON.parse(w.localStorage.getItem(key)); }, async click(id) {
    d.getElementById(id).click();
    for (let i = 0; i < 30; i++) { await tick(); if (!d.getElementById('cloudRecover').disabled) break; }
  } };
}
test('cloud storage is opt in and retries creation with the same code after an offline response', async t => {
  const g = boot(t);
  assert.equal(g.calls.length, 0);
  g.handler(async () => { throw new Error('offline'); });
  await g.click('cloudCreate');
  const pending = g.read(META);
  assert.match(pending.token, /^FY1_[a-f0-9]{64}$/); assert.equal(pending.version, undefined);
  assert.deepEqual(g.read(SAVE), state);
  g.handler(async () => ({ status: 201, body: remote() }));
  await g.click('cloudSyncNow');
  assert.equal(g.calls.length, 2);
  assert.equal(g.calls[0].headers.Authorization, g.calls[1].headers.Authorization);
  assert.equal(g.read(META).version, 1);
});
test('cloud conflict does not overwrite either save until an explicit choice, and preserves both backups', async t => {
  const local = { ...state, clues: ['local'] }, other = { ...state, clues: ['remote'] };
  const g = boot(t, { saved: local, cloud: { token, version: 1, synced: JSON.stringify(state) } });
  g.handler(async call => call.method === 'GET' ? { status: 200, body: remote(other, 2) } : { status: 200, body: remote(local, 3) });
  await g.click('cloudSyncNow');
  assert.equal(g.d.getElementById('cloudSaveConflict').hidden, false);
  assert.equal(g.calls.filter(c => c.method === 'PUT').length, 0);
  assert.deepEqual(g.read(SAVE), local);
  await g.click('cloudKeepLocal');
  assert.equal(g.calls.at(-1).data.version, 2);
  assert.equal(g.read(META).version, 3);
  assert.deepEqual(g.read(BACKUP).map(b => b.state.clues), [['remote'], ['local']]);
});
test('recovering on another device requires selection and keeps the local save as a backup', async t => {
  const g = boot(t, { saved: {} });
  g.d.getElementById('cloudRecoverCode').value = token;
  await g.click('cloudRecover');
  assert.deepEqual(g.read(SAVE), {}); assert.equal(g.read(META), null);
  await g.click('cloudUseRemote');
  assert.deepEqual(g.read(SAVE), state); assert.equal(g.read(META).token, token);
  assert.deepEqual(g.read(BACKUP)[0].state, {});
});
test('game pagehide draft persistence cannot overwrite a recovered cloud save', async t => {
  const g = boot(t, { saved: {} });
  for (const file of ['app.js', 'village-npcs.js', 'village-scenes.js', 'village-effects.js', 'ghost-hands.js', 'search-keywords.js', 'story-documents.js', 'story-config.js', 'story-flow.js', 'archive-search.js', 'game.js']) {
    g.w.eval(fs.readFileSync(path.join(root, file), 'utf8'));
  }
  g.d.getElementById('cloudRecoverCode').value = token;
  await g.click('cloudRecover'); await g.click('cloudUseRemote');
  g.w.dispatchEvent(new g.w.Event('pagehide'));
  assert.deepEqual(g.read(SAVE), state);
});
test('reset and author preview disconnect first; no empty save is uploaded', async t => {
  for (const suffix of ['?reset', '?preview=village']) {
    const g = boot(t, { cloud: { token, version: 1 }, url: 'https://starwave0225.github.io/ARG_FIND_YOU/' + suffix });
    assert.equal(g.read(META), null); assert.equal(g.read(BACKUP)[0].cloud.token, token);
    assert.equal(g.w.ARGCloudSave.isReplacing(), false);
    assert.equal(g.calls.length, 0);
  }
});
test('a server race pauses sync and keeps local progress; reset during a request cannot reconnect', async t => {
  const local = { ...state, clues: ['local'] };
  const g = boot(t, { saved: local, cloud: { token, version: 1 } });
  g.handler(async call => call.method === 'GET' ? { status: 200, body: remote() } : { status: 409, body: { ...remote({ ...state, clues: ['remote'] }, 2), error: 'conflict' } });
  await g.click('cloudSyncNow');
  assert.deepEqual(g.read(SAVE), local); assert.equal(g.read(META).version, 1);
  assert.equal(g.d.getElementById('cloudSaveConflict').hidden, false);
  const g2 = boot(t, { cloud: { token, version: 1 } });
  g2.handler(async () => { g2.w.ARGCloudSave.beforeReset(); return { status: 200, body: remote() }; });
  await g2.click('cloudSyncNow'); assert.equal(g2.read(META), null);
});
