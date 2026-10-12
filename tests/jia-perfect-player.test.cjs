const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const folder = path.resolve(__dirname, '../assets/video/jia-perfect');

function boot(t) {
  const dom = new JSDOM(fs.readFileSync(path.join(folder, 'preview.html'), 'utf8'), {
    url: 'http://127.0.0.1:4173/assets/video/jia-perfect/preview.html',
    runScripts: 'outside-only',
  });
  t.after(() => dom.window.close());
  const w = dom.window, d = w.document;
  const film = d.querySelector('#film'), button = d.querySelector('#begin');
  const gate = d.querySelector('#gate'), status = d.querySelector('#status');
  let loads = 0, plays = 0, timeout;
  film.load = () => { loads++; };
  film.pause = () => {};
  film.play = () => { plays++; return Promise.resolve(); };
  w.setTimeout = callback => { timeout = callback; return 1; };
  w.clearTimeout = () => { timeout = undefined; };
  w.eval(fs.readFileSync(path.join(folder, 'player.js'), 'utf8'));
  return { w, film, button, gate, status, loads: () => loads, plays: () => plays, timeout: () => timeout() };
}

test('click starts playback immediately and waits for playing before revealing the film', async t => {
  const p = boot(t);
  p.button.click();
  assert.equal(p.plays(), 1);
  assert.equal(p.button.disabled, true);
  assert.match(p.status.textContent, /加载/);
  assert.equal(p.gate.hidden, false);
  await Promise.resolve();
  assert.equal(p.gate.hidden, false);
  p.film.dispatchEvent(new p.w.Event('playing'));
  assert.equal(p.gate.hidden, true);
  assert.equal(p.button.disabled, false);
  assert.equal(p.gate.hasAttribute('aria-busy'), false);
});

test('failed playback enables retry, reloads the media and then plays successfully', async t => {
  const p = boot(t);
  p.film.play = () => Promise.reject(new Error('invalid cached media'));
  p.button.click();
  await Promise.resolve();
  assert.equal(p.button.disabled, false);
  assert.match(p.status.textContent, /重试/);
  p.film.play = () => Promise.resolve();
  p.button.click();
  assert.equal(p.loads(), 1);
  assert.match(p.film.src, /retry=2/);
  p.film.dispatchEvent(new p.w.Event('playing'));
  assert.equal(p.gate.hidden, true);
});

test('stalled playback times out, and a media error does not leave the button disabled', t => {
  const p = boot(t);
  p.film.play = () => new Promise(() => {});
  p.button.click();
  p.timeout();
  assert.equal(p.button.disabled, false);
  assert.equal(p.gate.hidden, false);
  p.button.click();
  p.film.dispatchEvent(new p.w.Event('error'));
  assert.equal(p.button.disabled, false);
  assert.equal(p.gate.hidden, false);
});
