const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '..');
const key = 'find-you-state-v1';

function boot(t, saved = {}, url = 'https://find-you.test/') {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), {
    url, runScripts: 'outside-only', virtualConsole: vc
  });
  const w = dom.window, d = w.document;
  w.localStorage.setItem(key, JSON.stringify(saved));
  if (url.startsWith('http://127.0.0.1')) w.eval(fs.readFileSync(path.join(root, 'cloud-save.js'), 'utf8'));
  for (const file of ['app.js', 'village-npcs.js', 'village-scenes.js', 'village-effects.js', 'ghost-hands.js', 'search-keywords.js', 'story-documents.js', 'story-config.js', 'story-flow.js', 'archive-search.js', 'game.js', 'city-news.js']) {
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

test('editor introduces tools, resumes after reload and hands over submission without accepting it', t => {
  const g = boot(t);
  g.gender('female'); g.submit('林晚');
  assert.match(g.d.querySelector('#editorBriefing').textContent, /栏目主编/);
  assert.ok(g.d.querySelector('.editor-standing img'));
  g.d.querySelector('[data-editor-demo]').click();
  assert.equal(g.d.querySelector('#window-workbench').hidden, true);
  g.d.querySelector('[data-editor-demo]').click();
  assert.equal(g.d.querySelector('#window-workbench').hidden, false);
  g.d.querySelector('[data-editor-next]').click();
  const resumed = boot(t, JSON.parse(g.w.localStorage.getItem(key)));
  assert.match(resumed.d.querySelector('#editorBriefing').textContent, /查到的东西/);
  resumed.d.querySelector('[data-editor-next]').click();
  assert.match(resumed.d.querySelector('#editorBriefing').textContent, /盛德昌/);
  assert.doesNotMatch(resumed.d.querySelector('#editorBriefing').textContent, /许行远/);
  resumed.d.querySelector('[data-editor-next]').click();
  assert.equal(resumed.d.querySelector('#editorBriefing'), null);
  assert.equal(resumed.state().accepted, false);
  assert.equal(resumed.d.querySelector('#submissionModal').getAttribute('aria-hidden'), 'false');
  resumed.d.querySelector('[data-editor-replay]').click();
  for (let i = 0; i < 3; i++) resumed.d.querySelector('[data-editor-next]').click();
  assert.equal(resumed.state().editorBriefingDone, true);
  assert.equal(resumed.state().accepted, false);
});

test('artifact observations belong to player notes and do not register predefined clues', t => {
  const g = boot(t, {playerName:'林晚',playerGender:'female',accepted:true});
  g.d.querySelector('#openEnvelopeFromSubmission').click();
  assert.equal(g.d.querySelector('[data-record-clue]'), null);
  const note = g.d.querySelector('[data-artifact-note="envelope"]');
  assert.ok(note);
  note.value = '我自己的观察';
  note.dispatchEvent(new g.w.Event('input', {bubbles:true}));
  assert.equal(g.state().artifactNotes.envelope, '我自己的观察');
  assert.deepEqual(Array.from(g.state().clues), []);
  const resumed = boot(t, JSON.parse(g.w.localStorage.getItem(key)));
  resumed.d.querySelector('#openEnvelopeFromSubmission').click();
  assert.equal(resumed.d.querySelector('[data-artifact-note="envelope"]').value, '我自己的观察');
});


test('local news reveals existing briefings by installment without confirming identities', t => {
  for (let count = 0; count <= 3; count++) {
    const g = boot(t, {playerName:'林晚',playerGender:'female',accepted:true,storyProgress:{done:['M05','M06','S04'].slice(0,count)}});
    const articles = g.d.querySelectorAll('.city-news-article');
    assert.equal(articles.length, count);
    const text = g.d.querySelector('#cityNewsFeed').textContent;
    assert.doesNotMatch(text, /盛德昌|罗桂枝|盛广财|许行远|23:04|16:10|19:30/);
    if (count === 1) { assert.match(text, /67 岁/); assert.doesNotMatch(text, /58 岁|72 岁/); }
    if (count === 2) { assert.match(text, /58 岁/); assert.doesNotMatch(text, /72 岁/); }
    assert.equal(g.state().conclusionBuilt, false);
  }
});


test('fresh localhost reset releases save protection and closes identity setup after confirmation', t => {
  const g = boot(t, {playerName:'旧档',playerGender:'male',accepted:true}, 'http://127.0.0.1:4173/');
  assert.equal(g.state().accepted, false);
  assert.equal(g.w.ARGCloudSave.isReplacing(), false);
  g.gender('female'); g.submit('林晚');
  assert.equal(g.state().playerName, '林晚');
  assert.equal(g.d.querySelector('#identitySetup').hidden, true);
  assert.ok(g.d.querySelector('#editorBriefing'));
  assert.equal(JSON.parse(g.w.localStorage.getItem(key)).playerName, '林晚');
});
