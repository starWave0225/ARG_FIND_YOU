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
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;};
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
  for(const node of g.d.querySelectorAll('script[src],link[href],img[src]')){const ref=node.getAttribute('src')||node.getAttribute('href');assert.ok(fs.existsSync(path.join(root,new URL(ref,g.w.location.href).pathname)),ref);}
});
const photoKey='find-you-church-haunting-v1';
function assertPhotos(g,state) {
  const links=[...g.d.querySelectorAll('a[data-photo-id]')];assert.equal(links.length,4);
  for(const link of links){
    assert.ok(link.href.endsWith(`${link.dataset.photoId}-${state}-v3.jpg`));
    assert.equal(link.querySelector('img').src,link.href);
    assert.match(link.querySelector('img').alt,state==='back'?/背对/:/双眼翻白/);
    assert.ok(fs.existsSync(path.join(root,new URL(link.href).pathname)));
  }
}
test('photos start with backs even with old reading history; search, gallery and missing entries do not trigger',t=>{
  const g=boot(t,'#archive',w=>w.localStorage.setItem(key,JSON.stringify([{id:'QZ-260811-019'}])));
  assertPhotos(g,'back');g.search('林知微');assertPhotos(g,'back');
  g.click('[data-photo-id="registration"]');assert.equal(g.d.querySelector('#photoViewer').open,true);
  assert.match(g.d.querySelector('#photoLarge').src,/registration-back-v3/);
  g.click('#photoClose');assert.equal(g.w.localStorage.getItem(photoKey),null);
  const missing=boot(t,'?record=missing');assertPhotos(missing,'back');assert.equal(missing.w.localStorage.getItem(photoKey),null);
});
test('opening an existing prayer changes every photo, survives return and reload, and keeps the main save untouched',t=>{
  const g=boot(t);const before=g.w.localStorage.getItem('find-you-state-v1');
  g.search('林知微');g.click('.record-row');assertPhotos(g,'possessed');
  assert.equal(g.w.localStorage.getItem(photoKey),'1');g.click('.back-link');assertPhotos(g,'possessed');
  for(const id of ['assembly','registration','archive','handover']){
    g.click(`[data-photo-id="${id}"]`);assert.match(g.d.querySelector('#photoLarge').src,new RegExp(`${id}-possessed-v3`));g.click('#photoClose');
  }
  assert.equal(g.w.localStorage.getItem('find-you-state-v1'),before);
  const reload=boot(t,'',w=>w.localStorage.setItem(photoKey,g.w.localStorage.getItem(photoKey)));assertPhotos(reload,'possessed');
  const direct=boot(t,'?record=QZ-260811-019');assertPhotos(direct,'possessed');
});
test('other-tab changes update an open enlargement, and blocked storage still allows the visual change in this page',t=>{
  const g=boot(t);g.click('[data-photo-id="archive"]');
  g.w.localStorage.setItem(photoKey,'1');
  g.w.dispatchEvent(new g.w.StorageEvent('storage',{key:photoKey,newValue:'1',storageArea:g.w.localStorage}));
  assertPhotos(g,'possessed');assert.match(g.d.querySelector('#photoLarge').src,/archive-possessed-v3/);
  assert.equal(g.d.querySelector('#photoViewer').open,true);
  g.w.localStorage.removeItem(photoKey);g.w.dispatchEvent(new g.w.StorageEvent('storage',{key:photoKey,storageArea:g.w.localStorage}));assertPhotos(g,'back');
  g.w.localStorage.setItem(photoKey,'1');g.w.dispatchEvent(new g.w.PageTransitionEvent('pageshow',{persisted:true}));assertPhotos(g,'possessed');
  const blocked=boot(t,'',w=>Object.defineProperty(w,'localStorage',{get(){throw new Error('denied');}}));
  assertPhotos(blocked,'back');blocked.click('.record-row');assertPhotos(blocked,'possessed');blocked.click('.back-link');assertPhotos(blocked,'possessed');
});
