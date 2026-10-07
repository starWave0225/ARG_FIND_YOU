const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');

function boot(t, state = {}, search = '') {
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), {
    url: 'http://127.0.0.1:4173/' + search, runScripts: 'outside-only'
  });
  const w = dom.window, d = w.document;
  const video = d.querySelector('#openingFilmVideo'), dialog = d.querySelector('#openingFilm');
  const paused = [];
  w.ARGGame = { getState: () => state };
  w.localStorage.setItem('find-you-state-v1', JSON.stringify(state));
  dialog.showModal = () => dialog.setAttribute('open', '');
  dialog.close = () => { dialog.removeAttribute('open'); dialog.dispatchEvent(new w.Event('close')); };
  video.pause = () => paused.push(true);
  video.load = () => {};
  video.play = async () => video.dispatchEvent(new w.Event('playing'));
  d.querySelector('#playerName').focus();
  w.eval(fs.readFileSync(path.join(root, 'opening-film.js'), 'utf8'));
  t.after(() => w.close());
  return { w, d, video, dialog, paused };
}

test('new game opens the existing narrated film before identity setup without changing its save', t => {
  const g = boot(t);
  assert.equal(g.dialog.open, true);
  assert.equal(g.d.activeElement.id, 'openingFilmPlay');
  assert.ok(fs.existsSync(path.join(root, g.video.getAttribute('src'))));
  assert.ok(fs.existsSync(path.join(root, g.video.getAttribute('poster'))));
  assert.equal(g.video.muted, false);
  g.d.querySelector('#openingFilmPlay').click();
  assert.equal(g.d.querySelector('#openingFilmPlay').hidden, true);
  g.video.dispatchEvent(new g.w.Event('ended'));
  assert.equal(g.dialog.open, false);
  assert.equal(g.video.hasAttribute('src'), false);
  assert.equal(g.paused.length, 1);
  assert.equal(g.d.activeElement.id, 'playerName');
  assert.equal(g.w.localStorage.getItem('find-you-state-v1'), '{}');
});

test('continuing games and field visits do not load the film; replay is available from Start', t => {
  const saved = { playerName: '林晚', playerGender: 'female', accepted: true };
  for (const search of ['', '?view=village', '?preview=village']) {
    const g = boot(t, search ? {} : saved, search);
    assert.equal(g.dialog.open, false);
    assert.equal(g.video.hasAttribute('src'), false);
  }
  const g = boot(t, saved);
  g.d.querySelector('#openingFilmReplay').click();
  assert.equal(g.dialog.open, true);
  g.d.querySelector('#openingFilmSkip').click();
  assert.deepEqual(JSON.parse(g.w.localStorage.getItem('find-you-state-v1')), saved);
});

test('failed playback remains skippable and preview removes only its own URL parameter', async t => {
  const saved = { playerName: '林晚', playerGender: 'female' };
  const g = boot(t, saved, '?intro=1&test=keep');
  g.video.play = async () => { throw new Error('unavailable'); };
  g.d.querySelector('#openingFilmPlay').click();
  await new Promise(resolve => setImmediate(resolve));
  assert.match(g.d.querySelector('#openingFilmStatus').textContent, /无法播放/);
  g.video.dispatchEvent(new g.w.Event('error'));
  assert.match(g.d.querySelector('#openingFilmStatus').textContent, /无法载入/);
  g.d.querySelector('#openingFilmSkip').click();
  assert.equal(g.dialog.open, false);
  assert.equal(g.w.location.search, '?test=keep');
  assert.deepEqual(JSON.parse(g.w.localStorage.getItem('find-you-state-v1')), saved);
});
