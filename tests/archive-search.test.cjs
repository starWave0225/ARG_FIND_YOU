const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '..');
const key = 'find-you-state-v1';
const prologue = { playerGender: 'male', accepted: true };
const chapterOne = { ...prologue, sent: true, chapterOneStarted: true, clues: ['envelopeFactory', 'envelopePostcode', 'postalArea', 'renamedFactory', 'workerNumber', 'movedRongchuan'], envelopeOpened: true, legacyOpened: true, rosterUnlocked: true, personFound: true, conclusionBuilt: true, confirmed: true };

test('village faith sources use explicit search mappings without chapter or HM progress', t => {
  const g = boot(t);
  for (const [query, id] of [['求子','V01'],['旧佛堂','V01'],['香火钱','V02'],['XQ-93','V02'],['FT-93-02','V03'],['雨日停摊','V04'],['SJC-WL-2021-壁内','V05']]) {
    g.search(query);
    assert.ok(g.ids().includes('story-' + id));
    assert.equal(g.w.StoryFlow.available(id), true);
  }
  assert.equal(g.state().chapterThreeStarted, false);
  assert.deepEqual(Array.from(g.state().storyProgress?.done || []), []);
  assert.doesNotMatch(g.w.StoryDocuments.V01.body, /制作备注|解谜元素|暂拟|生物学亲子/);
  assert.doesNotMatch(g.w.StoryDocuments.V02.body, /后续可做|本轮已落地|金额密码/);
});
function boot(t, saved = prologue) {
  const errors = [];
  const vc = new VirtualConsole(); vc.on('jsdomError', e => errors.push(e.message));
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), { url: 'https://find-you.test/', runScripts: 'outside-only', virtualConsole: vc });
  const w = dom.window, d = w.document;
  w.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  w.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); this.dispatchEvent(new w.Event('close')); };
  w.localStorage.setItem(key, JSON.stringify(saved));
  for (const file of ['app.js', 'village-npcs.js', 'village-scenes.js', 'village-effects.js', 'ghost-hands.js', 'search-keywords.js', 'story-documents.js', 'story-config.js', 'story-flow.js', 'archive-search.js', 'game.js']) w.eval(fs.readFileSync(path.join(root, file), 'utf8'));
  const click = selector => { const node = d.querySelector(selector); assert.ok(node, selector); assert.equal(node.disabled, false, selector); node.click(); };
  const search = query => { if (d.querySelector('#archiveSearchView').hidden) click('[data-search-results]'); d.querySelector('#archiveQuery').value = query; d.querySelector('#archiveSearch').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); };
  const ids = () => [...d.querySelectorAll('#archiveResult [data-result-id]')].map(n => n.dataset.resultId);
  const filter = (id, value) => { const select = d.querySelector('#' + id); select.value = value; select.dispatchEvent(new w.Event('change', { bubbles: true })); };
  t.after(() => { w.close(); assert.deepEqual(errors, []); });
  return { w, d, click, search, ids, filter, state: () => w.ARGGame.getState() };
}

test('explicit keyword mappings return fixed articles, reject body-only/partial terms, and retain filters', t => {
  const g = boot(t);
  g.search('农机厂'); assert.ok(!g.ids().includes('liuhe-factory')); assert.ok(g.ids().includes('factory-register'));
  g.search('东岚 农机厂'); assert.ok(!g.ids().includes('liuhe-factory')); assert.ok(g.ids().includes('factory-reprint'));
  g.filter('archiveYear', '2000'); assert.deepEqual(g.ids(), ['factory-register']);
  g.filter('archiveKind', '原档扫描'); g.filter('archiveSource', 'business'); assert.deepEqual(g.ids(), ['factory-register']);
  g.click('[data-search-clear]');
  for (const query of ['原厂址', '查一下 原厂址', '东岚农', '东岚 不存在的关键词', '']) { g.search(query); assert.deepEqual(g.ids(), []); }
  g.search('东岚农机厂'); assert.deepEqual(g.ids(), ['factory-register', 'factory-home', 'factory-reprint']);
  g.search(' ｄｌ－２０００－１７ '); assert.deepEqual(g.ids(), ['factory-register']);
  g.search('1993 东岚'); assert.deepEqual(g.ids(), ['postal-1993']);
  assert.equal(g.state().clues.length, 0, 'Searching must not solve a clue');
});

test('reprints lead to original and publisher; browser history preserves the query and filter', t => {
  const g = boot(t); g.search('东岚 农机厂'); g.filter('archiveKind', '转载摘录');
  g.click('#archiveResult [data-search-document="factory-reprint"]');
  assert.match(g.d.querySelector('.source-chain').textContent, /此页与所引原档归为同一来源/);
  g.click('#archiveReaderView .source-chain [data-search-document="factory-register"]');
  assert.match(g.d.querySelector('#archiveReaderView h2').textContent, /改制登记/);
  g.click('#archiveReaderView [data-source-id="business"]'); assert.match(g.d.querySelector('#archiveReaderView h2').textContent, /企业档案室/);
  g.click('#archiveBack'); g.click('#archiveBack'); g.click('#archiveBack');
  assert.equal(g.d.querySelector('#archiveSearchView').hidden, false);
  assert.equal(g.d.querySelector('#archiveQuery').value, '东岚 农机厂');
  assert.equal(g.d.querySelector('#archiveKind').value, '转载摘录');
  g.click('#archiveForward'); assert.match(g.d.querySelector('#archiveReaderView h2').textContent, /老厂名小记/);
});

test('legacy page and password remain usable, and returning to search does not lose the form listener', t => {
  const g = boot(t); g.search('退休 工号'); g.click('#archiveResult [data-search-document="factory-home"]');
  g.click('[data-open-password]'); g.d.querySelector('#zipPassword').value = '0717';
  g.d.querySelector('#zipPasswordForm').dispatchEvent(new g.w.Event('submit', { bubbles: true, cancelable: true }));
  assert.equal(g.state().rosterUnlocked, true);
  assert.match(g.d.querySelector('#archiveReaderView').textContent, /2003 年调往荣川/);
  g.click('[data-search-results]'); g.search('43?1?0'); assert.ok(g.ids().includes('postal-1993'));
  g.click('#archiveResult [data-search-document="postal-1993"]');
  g.click('[data-search-record="postal"]'); assert.ok(g.state().clues.includes('postalArea'));
  g.click('[data-search-results]'); g.search('DL-2000-17'); assert.ok(g.ids().includes('factory-register'));
});

test('collecting preserves provenance in case files, is idempotent, survives reload, and grants no identity conclusion', t => {
  const g = boot(t); g.search('厂史'); g.click('#archiveResult [data-search-document="factory-reprint"]');
  g.click('[data-search-bookmark="factory-reprint"]'); g.click('[data-search-bookmark="factory-reprint"]');
  assert.deepEqual(Array.from(g.state().searchBookmarks), ['factory-reprint']); assert.equal(g.state().conclusionBuilt, false);
  g.click('[data-file-folder="case"]'); g.click('[data-open-document="search:factory-reprint"]');
  assert.match(g.d.querySelector('.case-document').textContent, /东岚退休职工之家/);
  assert.match(g.d.querySelector('.case-document').textContent, /DL-2000-17/);
  g.click('[data-open-search-document="factory-reprint"]'); assert.match(g.d.querySelector('#archiveReaderView h2').textContent, /老厂名小记/);
  const reload = boot(t, JSON.parse(g.w.localStorage.getItem(key)));
  assert.equal(reload.d.querySelector('#archiveQuery').value, '厂史');
  assert.equal(reload.state().searchBookmarks.length, 1);
  assert.match(reload.d.querySelector('#archiveSaved').textContent, /老厂名小记/);
});

test('search finds scans and school records without requiring prior receipt or chapter progress', t => {
  const g = boot(t, chapterOne);
  g.search('许行远'); assert.ok(!g.ids().includes('submission-photo'));
  g.search('盛家村 卫生室'); g.click('#archiveResult [data-search-document="clinic-catalogue"]');
  g.click('[data-search-request="clinicCard"]'); assert.ok(g.state().remoteFinds.includes('clinicCard'));
  assert.match(g.d.querySelector('#filesView').textContent, /盛禾提供/);
  assert.equal(g.state().chapterThreeStarted, false); assert.equal(g.d.querySelectorAll('.village-map button').length, 0);
  g.search('罗桂枝'); assert.ok(g.ids().includes('clinic-scan')); assert.ok(g.ids().includes('school-roster'));
  g.click('#filesView [data-open-remote]'); g.click('[data-remote-find="clinicPhoto"]'); g.click('#filesView [data-open-remote]');
  g.d.querySelector('#remoteClinicAnswer').value = '卫生学校'; g.d.querySelector('#remoteClinicConclusion').dispatchEvent(new g.w.Event('submit', { bubbles: true, cancelable: true }));
  g.search('卫校 1996'); assert.ok(g.ids().includes('school-roster'));
  g.search('许行远'); assert.ok(!g.ids().includes('submission-photo'));
  g.search('TG-240824-019'); assert.ok(g.ids().includes('submission-photo'));
  g.search('恒目'); assert.ok(g.ids().includes('tourism-notice'));
});

test('historical and HM sources are readable from a new game and do not advance the story', t => {
  const g = boot(t, {playerName:'叶书言',playerGender:'female'});
  for (const [query,id] of [['HM','tourism-notice'],['林知微','story-C4-01'],['许行远','story-C3-04'],['96-0729-17','story-C6-04'],['全职教会','story-H13']]) {
    g.search(query); assert.ok(g.ids().includes(id),query);
    g.click(`#archiveResult [data-search-document="${id}"]`);
    assert.doesNotMatch(g.d.querySelector('.search-document-body').textContent,/尚未取得查阅条件|本阶段可调阅/);
    g.click(`[data-search-bookmark="${id}"]`);
    assert.ok(g.state().searchBookmarks.includes(id));
  }
  g.search('母亲旧物');g.click('[data-search-document="story-C7-02"]');
  assert.doesNotMatch(g.d.querySelector('.search-document-body').textContent,/盛临川/);
  g.click('[data-story-doc="C7-02"]');
  const unlock=g.d.querySelector('#storyUnlock');unlock.elements.code.value='临川';
  unlock.dispatchEvent(new g.w.Event('submit',{bubbles:true,cancelable:true}));
  assert.match(g.d.querySelector('#storyReader').textContent,/我没能救下临川/);
  g.click('[data-story-close]');
  assert.equal(g.state().accepted,false);
  assert.equal(g.state().chapterThreeStarted,false);
  assert.equal(g.state().sent,false);
  assert.deepEqual(Array.from(g.state().storyProgress.done),[]);
  const reload=boot(t,JSON.parse(g.w.localStorage.getItem(key)));
  reload.w.LingchuanSearch.openDocument('story-C3-04');
  assert.match(reload.d.querySelector('.search-document-body').textContent,/许行远/);
  reload.search('RW01');assert.deepEqual(reload.ids(),[]);
  reload.search('C7-03');assert.deepEqual(reload.ids(),[]);
});

test('query and restored search state cannot inject markup or introduce unknown case sources', t => {
  const g = boot(t, { ...prologue, searchBookmarks: ['missing', 'tourism-notice'], searchVisited: null, searchHistory: [null, 12, '<img src=x onerror=alert(1)>'], searchFilters: { kind: '<script>', source: 'bad', year: 'x' } });
  g.search('<img src=x onerror=alert(1)>');
  assert.equal(g.d.querySelector('#archiveSearchView img'), null);
  assert.equal(g.d.querySelector('#archiveSearchView script'), null);
  assert.deepEqual(Array.from(g.w.LingchuanSearch.documents(),doc=>doc.id), ['search:tourism-notice']);
  assert.match(g.d.querySelector('#archiveResult').textContent, /当前没有匹配结果/);
  assert.match(g.d.querySelector('#archiveHistory').textContent, /<img/);
});
