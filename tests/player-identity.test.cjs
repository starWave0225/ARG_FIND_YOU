const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '..');
const key = 'find-you-state-v1';

function boot(t, saved = {}) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), {
    url: 'https://find-you.test/', runScripts: 'outside-only', virtualConsole: vc
  });
  const w = dom.window, d = w.document;
  w.localStorage.setItem(key, JSON.stringify(saved));
  for (const file of ['app.js', 'village-npcs.js', 'village-scenes.js', 'village-effects.js', 'ghost-hands.js', 'search-keywords.js', 'story-documents.js', 'story-config.js', 'story-flow.js', 'archive-search.js', 'game.js']) {
    w.eval(fs.readFileSync(path.join(root, file), 'utf8'));
  }
  t.after(() => { w.close(); assert.deepEqual(errors, []); });
  return {
    w, d, state: () => w.ARGGame.getState(),
    submit(name) {
      d.querySelector('#playerName').value = name;
      d.querySelector('#identityForm').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
    },
    gender(value) { d.querySelector(`button[data-player-gender="${value}"]`).click(); }
  };
}

test('new game requires a name and gender, selecting a portrait does not enter the story', t => {
  const g = boot(t);
  const suggestedName = g.d.querySelector('#playerName').value;
  assert.match(suggestedName, /^[\p{Script=Han}]{2,4}$/u);
  g.gender('male');
  assert.equal(g.d.querySelector('#playerName').value, suggestedName);
  // Return to an unselected start to check the required gender separately.
  const fresh = boot(t);
  fresh.submit('林晚');
  assert.equal(fresh.state().playerName, '');
  assert.match(fresh.d.querySelector('#identityFeedback').textContent, /性别/);
  assert.equal(g.d.querySelector('#window-workbench').inert, true);
  g.d.querySelector('#playerName').value = '林晚';
  g.gender('female');
  assert.equal(g.d.querySelector('#playerName').value, '林晚');
  assert.equal(g.state().playerGender, null);
  assert.equal(g.d.querySelector('#identitySetup').classList.contains('is-hidden'), false);
  g.submit('   ');
  assert.equal(g.d.querySelector('#playerName').getAttribute('aria-invalid'), 'true');
  g.submit('一二三四五六七八九十一二三');
  assert.equal(g.state().playerName, '');
  g.submit('  林晚  ');
  assert.equal(g.state().playerName, '林晚');
  assert.equal(g.state().playerGender, 'female');
  assert.equal(g.d.querySelector('#identitySetup').inert, true);
  assert.equal(g.d.querySelector('#window-workbench').inert, false);
  assert.equal(g.w.ARGGame.getPlayerTerms().pronoun, '她');
});

test('custom name persists, follows page navigation and signs the conclusion and receipt', t => {
  const g = boot(t, { accepted: true, confirmed: true, sent: true });
  g.gender('male'); g.submit('顾行舟');
  const saved = JSON.parse(g.w.localStorage.getItem(key));
  const reloaded = boot(t, saved);
  assert.equal(reloaded.d.querySelector('#identitySetup').classList.contains('is-hidden'), true);
  reloaded.w.desktopAPI.showPage('people');
  reloaded.w.desktopAPI.showPage('home');
  assert.match(reloaded.d.querySelector('#pageSubtitle').textContent, /顾行舟/);
  for (const node of reloaded.d.querySelectorAll('[data-player-name]')) assert.equal(node.textContent, '顾行舟');
  for (const node of reloaded.d.querySelectorAll('[data-player-initial]')) assert.equal(node.textContent, '顾');
  reloaded.d.querySelector('[data-file-folder="case"]').click();
  reloaded.d.querySelector('[data-open-document="conclusion"]').click();
  assert.match(reloaded.d.querySelector('.case-document').textContent, /经办：顾行舟（男性）/);
  reloaded.d.querySelector('[data-files-back="case"]').click();
  reloaded.d.querySelector('[data-open-document="receipt"]').click();
  assert.match(reloaded.d.querySelector('.case-document').textContent, /操作人：?顾行舟/);
});

test('old saves confirm their name once without losing progress or chosen gender', t => {
  const g = boot(t, { playerGender: 'female', accepted: true, clues: ['postalArea'], searchBookmarks: ['postal-1993'] });
  assert.equal(g.d.querySelector('#identitySetup').classList.contains('is-hidden'), false);
  const suggestedName = g.d.querySelector('#playerName').value;
  assert.match(suggestedName, /^[\p{Script=Han}]{2,4}$/u);
  assert.equal(g.d.querySelector('button[data-player-gender="female"]').getAttribute('aria-pressed'), 'true');
  g.submit(suggestedName);
  const reloaded = boot(t, JSON.parse(g.w.localStorage.getItem(key)));
  assert.equal(reloaded.state().playerName, suggestedName);
  assert.equal(reloaded.d.querySelector('#identitySetup').classList.contains('is-hidden'), true);
  assert.equal(g.state().playerGender, 'female');
  assert.equal(g.state().accepted, true);
  assert.deepEqual([...g.state().clues], ['postalArea']);
  assert.deepEqual([...g.state().searchBookmarks], ['postal-1993']);
});

test('stored names render as literal text, and malformed names reopen setup', t => {
  const g = boot(t, { playerGender: 'male', playerName: '<img>', accepted: true, sent: true });
  assert.equal(g.d.querySelector('[data-player-name]').textContent, '<img>');
  g.d.querySelector('[data-file-folder="case"]').click();
  g.d.querySelector('[data-open-document="receipt"]').click();
  assert.equal(g.d.querySelector('.case-document img'), null);
  assert.match(g.d.querySelector('.case-document').textContent, /操作人：?<img>/);
  const corrupt = boot(t, { playerGender: 'unknown', playerName: { value: 'bad' }, accepted: true });
  assert.equal(corrupt.state().playerName, '');
  assert.equal(corrupt.state().playerGender, null);
  assert.equal(corrupt.d.querySelector('#identitySetup').classList.contains('is-hidden'), false);
});
