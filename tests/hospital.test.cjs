const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..'),key='find-you-hospital-reading-v1';
function boot(t,search='',setup=()=>{}) {
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(fs.readFileSync(path.join(root,'hospital/index.html'),'utf8'),{url:'https://find-you.test/hospital/'+search,runScripts:'outside-only',virtualConsole:vc});
  const w=dom.window,d=w.document;w.scrollTo=()=>{};
  w.localStorage.setItem('find-you-state-v1',JSON.stringify({playerGender:'female',sent:false,storyProgress:{done:[]}}));setup(w);
  for(const file of ['story-documents.js','story-config.js','hospital/records.js','hospital/site.js'])w.eval(fs.readFileSync(path.join(root,file),'utf8'));
  const click=selector=>{assert.ok(d.querySelector(selector),selector);d.querySelector(selector).click();};
  const submit=selector=>d.querySelector(selector).dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  t.after(()=>{w.close();assert.deepEqual(errors,[]);});
  return{w,d,click,submit,search:(q,date='')=>{d.querySelector('#query').value=q;d.querySelector('#date').value=date;submit('#queryForm');}};
}
test('hospital starts without patient identities and exact query/date/category filters intersect',t=>{
  const g=boot(t);
  assert.equal(g.d.querySelectorAll('#results tbody tr').length,0);
  assert.doesNotMatch(g.d.body.textContent,/林知微|0708|LC-960708|许行远/);
  g.search('林');assert.equal(g.d.querySelectorAll('#results tbody tr').length,0);
  g.search('林知微');assert.equal(g.d.querySelectorAll('#results tbody tr').length,3);
  g.click('[data-kind="visit"]');g.search('林知微','1996-07-29');assert.equal(g.d.querySelectorAll('#results tbody tr').length,1);
  g.search('林知微','1996-07-08');assert.equal(g.d.querySelectorAll('#results tbody tr').length,0);
  g.click('button[type="reset"]');assert.equal(g.d.querySelector('#query').value,'');
  g.search('','1996-07-08');assert.equal(g.d.querySelectorAll('#results tbody tr').length,2);
});
test('public retirement notice connects Luo to the hospital, retains its source, and keeps medical records separate',t=>{
  const g=boot(t);const saved=g.w.localStorage.getItem('find-you-state-v1');
  g.click('.hospital-news a');
  assert.equal(g.d.querySelector('#recordTitle').textContent,'罗桂枝同志荣誉退休仪式简讯');
  assert.match(g.d.querySelector('.record-top').textContent,/院办公室/);
  assert.match(g.d.querySelector('.record-body').textContent,/2006 年由南岭卫生院调入我院/);
  assert.match(g.d.querySelector('.record-body').textContent,/2023 年 10 月 27 日/);
  assert.doesNotMatch(g.d.querySelector('#readerView').textContent,/9624|林知微|LC-960708|假记录|制作备注/);
  const retained=JSON.parse(g.w.localStorage.getItem(key)).read[0];
  assert.match(retained.source,/护理部供稿/);assert.equal(retained.body,g.w.StoryDocuments['C1-10'].body.replaceAll('="./hospital/assets/','="./assets/'));
  const photo=g.d.querySelector('.document-photo img');
  assert.ok(photo);assert.equal(photo.src,'https://find-you.test/hospital/assets/luo-guizhi-retirement-v1.jpg');
  assert.equal(photo.closest('a').href,photo.src);assert.ok(fs.existsSync(path.join(root,new URL(photo.src).pathname)));
  g.click('.back-link');g.click('[data-kind="office"]');g.search('罗桂枝','2023-10-27');
  assert.equal(g.d.querySelectorAll('#results tbody tr').length,1);assert.match(g.d.querySelector('#results').textContent,/院务记录/);
  g.click('[data-kind="visit"]');g.search('罗桂枝');assert.equal(g.d.querySelectorAll('#results tbody tr').length,0);
  assert.equal(g.w.localStorage.getItem('find-you-state-v1'),saved);
});
test('direct attachment links keep bodies sealed; neutral failure, original password, gender and reload remain consistent',t=>{
  const g=boot(t,'?record=C5-03');
  assert.equal(g.d.querySelector('.record-body'),null);assert.doesNotMatch(g.d.querySelector('#readerView').textContent,/04:19|2.4|按主角选择/);
  assert.equal(JSON.parse(g.w.localStorage.getItem(key)).read[0].body,'');
  g.d.querySelector('#attachmentCode').value='bad';g.submit('#unlockForm');
  assert.equal(g.d.querySelector('#unlockFeedback').textContent,'核验未通过');assert.equal(g.d.querySelector('.record-body'),null);
  g.d.querySelector('#attachmentCode').value=g.w.StoryConfig.locks['C5-03'].code;g.submit('#unlockForm');
  assert.match(g.d.querySelector('.record-body').textContent,/04:19/);assert.equal(g.d.querySelector('.record-body tbody tr:nth-child(2) td:nth-child(3)').textContent,'女');
  assert.doesNotMatch(g.d.querySelector('.record-body').textContent,/按主角选择/);
  assert.deepEqual(JSON.parse(g.w.localStorage.getItem('find-you-state-v1')),{playerGender:'female',sent:false,storyProgress:{done:[]}});
  const saved=g.w.localStorage.getItem(key),next=boot(t,'?record=C5-03',w=>w.localStorage.setItem(key,saved));
  assert.ok(next.d.querySelector('.record-body'));assert.equal(JSON.parse(next.w.localStorage.getItem(key)).read.length,1);
});
test('record/source retention, history and returning to filtered queries do not manufacture game progress',t=>{
  const g=boot(t);g.search('林知微','1996-07-29');g.click('#results a');
  assert.equal(g.d.querySelector('.record-body').innerHTML,g.w.StoryDocuments['C5-05'].body);
  const stored=JSON.parse(g.w.localStorage.getItem(key));assert.match(stored.read[0].source,/县医院儿科/);assert.match(stored.read[0].body,/母亲抱离/);
  g.click('.back-link');assert.equal(g.d.querySelector('#date').value,'1996-07-29');assert.equal(g.d.querySelector('#query').value,'林知微');
  g.click('[data-nav="history"]');assert.match(g.d.querySelector('#historyList').textContent,/儿科就诊登记/);
  g.click('#historyList a');assert.equal(g.d.querySelector('#recordTitle').textContent,'儿科就诊登记');
});
test('unknown URLs, markup, corrupt logs and blocked storage remain safe and readable',t=>{
  const bad=boot(t,'?record=missing');assert.equal(bad.d.querySelector('#recordTitle').textContent,'档案未收录');assert.equal(bad.w.localStorage.getItem(key),null);
  bad.click('.back-link');bad.search('<img src=x onerror=alert(1)>');assert.equal(bad.d.querySelector('#results img'),null);
  const corrupt=boot(t,'?view=history',w=>w.localStorage.setItem(key,'{"read":[null,{}, {"id":"missing"}],"unlocked":["missing"]}'));assert.match(corrupt.d.querySelector('#historyList').textContent,/暂无/);
  const blocked=boot(t,'?record=C5-02',w=>Object.defineProperty(w,'localStorage',{get(){throw Error('denied');}}));
  assert.match(blocked.d.querySelector('.record-body').textContent,/林知微/);assert.match(blocked.d.querySelector('#storageStatus').textContent,/不可用/);
});
