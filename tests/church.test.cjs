const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM, VirtualConsole} = require('jsdom');
const root=path.resolve(__dirname,'..');
const key='find-you-church-reading-v1';
function boot(t,search='',setup=()=>{}) {
  const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error.message));
  const dom=new JSDOM(fs.readFileSync(path.join(root,'church/index.html'),'utf8'),{url:'https://find-you.test/church/'+search,runScripts:'outside-only',virtualConsole:vc});
  const w=dom.window,d=w.document;
  w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.localStorage.setItem('find-you-state-v1',JSON.stringify({accepted:false,sent:false,storyProgress:{done:[]}}));
  setup(w);
  for(const file of ['records.js','site.js']) w.eval(fs.readFileSync(path.join(root,'church',file),'utf8'));
  t.after(()=>{w.close();assert.deepEqual(errors,[]);});
  return {w,d,click:selector=>{assert.ok(d.querySelector(selector),selector);d.querySelector(selector).click();},search:value=>{d.querySelector('#wishQuery').value=value;d.querySelector('#archiveForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}};
}
test('prayer reading retains source and original without changing game progress; reload is idempotent',t=>{
  const g=boot(t,'?record=QZ-260811-019');
  assert.equal(g.d.querySelector('#homeView').hidden,true);
  assert.match(g.d.querySelector('.record-body').textContent,/我求盛雄偿命/);
  const saved=JSON.parse(g.w.localStorage.getItem(key));
  assert.equal(saved.length,1);assert.match(saved[0].source,/HM-SJC-019/);
  assert.ok(saved[0].sections.some(s=>s.text.some(text=>text.includes('不在这张纸上'))));
  assert.deepEqual(JSON.parse(g.w.localStorage.getItem('find-you-state-v1')),{accepted:false,sent:false,storyProgress:{done:[]}});
  const next=boot(t,'?record=QZ-260811-019',w=>w.localStorage.setItem(key,JSON.stringify(saved)));
  assert.equal(JSON.parse(next.w.localStorage.getItem(key)).length,1);
  next.click('.back-link');assert.equal(next.d.querySelector('#readingHistory').hidden,false);
});
test('search, status filter, related pages and return navigation preserve the query',t=>{
  const g=boot(t);g.search('盛雄');
  assert.equal(g.d.querySelectorAll('.record-row').length,3);
  g.d.querySelector('#statusFilter').value='附页留存';g.d.querySelector('#statusFilter').dispatchEvent(new g.w.Event('change'));
  assert.equal(g.d.querySelectorAll('.record-row').length,1);
  g.click('.record-row');assert.match(g.d.querySelector('#recordTitle').textContent,/受愿范围附记/);
  g.click('.related-records a');assert.equal(g.d.querySelector('#recordTitle').textContent,'一人之愿');
  g.click('.back-link');assert.equal(g.d.querySelector('#wishQuery').value,'盛雄');assert.equal(g.d.querySelector('#statusFilter').value,'附页留存');
  assert.equal(g.d.querySelectorAll('.record-row').length,1);
  g.search('盛');assert.equal(g.d.querySelectorAll('.record-row').length,0);
  g.search('<img src=x onerror=alert(1)>');assert.equal(g.d.querySelectorAll('.record-row').length,0);assert.equal(g.d.querySelector('#recordList img'),null);
});
test('direct links, unknown records and denied or corrupt storage stay readable',t=>{
  const unknown=boot(t,'?record=does-not-exist');assert.match(unknown.d.querySelector('#recordTitle').textContent,/未收录/);assert.equal(unknown.w.localStorage.getItem(key),null);
  unknown.click('.back-link');assert.equal(unknown.d.querySelectorAll('.record-row').length,8);
  const bad=boot(t,'?record=QZ-260811-019',w=>w.localStorage.setItem(key,'[null, {}, {"id":"missing"}]'));
  assert.match(bad.d.querySelector('.record-body').textContent,/我叫林知微/);
  const blocked=boot(t,'?record=QZ-260811-019',w=>Object.defineProperty(w,'localStorage',{get(){throw new Error('denied');}}));
  assert.match(blocked.d.querySelector('.record-retained').textContent,/不可用/);
  assert.match(blocked.d.querySelector('.record-body').textContent,/我叫林知微/);
});
test('all authored source links resolve, preserve anonymous submitter identity and stay within the static site',t=>{
  const g=boot(t);const archive=g.w.ChurchArchive;
  assert.equal(new Set(archive.records.map(r=>r.id)).size,archive.records.length);
  for(const r of archive.records) for(const id of r.related||[]) assert.ok(archive.records.some(other=>other.id===id));
  assert.doesNotMatch(JSON.stringify(archive.records),/许行远|TG-240824-019|制作备注|解谜元素|正确答案/);
  for(const source of archive.catalog){const doc=new JSDOM(source.body).window.document;for(const a of doc.querySelectorAll('a')) assert.ok(a.getAttribute('href').startsWith('./church/'));}
  for(const node of g.d.querySelectorAll('script[src],link[href],img[src]')){const ref=node.getAttribute('src')||node.getAttribute('href');assert.ok(fs.existsSync(path.resolve(root,'church',ref.split('?')[0])),ref);}
});
