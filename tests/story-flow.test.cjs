const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM, VirtualConsole} = require('jsdom');
const root = path.resolve(__dirname,'..');
const key = 'find-you-state-v1';
const ready = {playerName:'林予安',playerGender:'female',accepted:true,envelopeOpened:true,clues:['envelopeFactory','envelopePostcode','postalArea','renamedFactory','workerNumber','movedRongchuan'],legacyOpened:true,rosterUnlocked:true,personFound:true,conclusionBuilt:true,confirmed:true,sent:true,chapterOneStarted:true,clinicSolved:true,remoteFinds:['clinicCard','clinicPhoto'],storyFlowVersion:2};
const answers = {
 M04:['9624','罗桂枝','照片拍摄年'],M05:['9624','南岭卫生院','1968'],M06:['023','盛广财','盛家村籍、村会计','2001'],S04:[],
 M07:['盛德昌','罗桂枝','盛广财'],M08:['31','22','27','TG-240824-019'],M09:['盛承安','住址及联系电话','已送达'],DEPART:[],
 M10:['3','4','有第四人，亲属关系仍待查'],M11:['1974','许行远','长林家老二'],M12:['盛长林','042','寄养户籍'],
 M13:['林知微','在读大学生','21'],M14:['盛守平','盛守安','1'],M15:['017','盛临川','1995-11-02'],
 M16:['火前形成','火中形成','无法判断','电气检验附件'],M17:['东岚农机厂','0717','经手记录与转述并存，需并核'],
 M18:['1996-07-08','尚未出生'],M19:['2','B','7'],M20:['LC-960708-12-B','1996-07-29','1996-07-15'],
 M21:['盛雄处','县医院→福利院','林知微','可能为了仍留村的孩子'],M22:['96-0729-17','LC-960708-12-B','不能'],M23:['陈建平','沈芸','96-0729-17'],M24:['林予安','1996-07-08','B'],M25:['不能','盛临川'],M26:['生父子','寄养','收养','亲叔叔'],
 REVIEW:['C4-01 / C4-02','C4-03','C4-04 / C4-09','C4-08 / C4-10','C5-03 / C5-04 / C5-05','C6-04 / C6-05 / C6-06','P08 / C2-02 / C2-03'],PUBLISH:[],
 X01:['石桥与邮亭','邮亭→河桥→巷道'],X02:['同一馆藏号','衣角延续与半枚馆藏章'],X03:['210'],X04:['3','E-2东侧附房','不能'],X05:['照片白边姓名','2008','失踪与村内登记矛盾','运营验收页'],X06:['2/3','BG-017','R-17','未签收'],X07:['3','21'],X08:['34800','JG-2607-17','恒目关联文化基金'],X09:['岭川归灯文旅服务有限公司','附房特殊保管与终端','不能'],X10:['我不是来接客的','房内原始回应'],X11:['A/B','B/C','未证明'],X12:['R-17']
};
const codes={'C1-05':'9624','C3-05':'0826','C4-03':'1028','C5-03':'0708','C7-02':'临川'};
function boot(t,saved=ready) {
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'http://127.0.0.1:4173/?view=village',runScripts:'outside-only',virtualConsole:vc});
 const w=dom.window,d=w.document;
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
 w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
 w.localStorage.setItem(key,JSON.stringify(saved));
 for(const script of d.querySelectorAll('script[src]'))w.eval(fs.readFileSync(path.join(root,decodeURIComponent(new URL(script.src).pathname).replace(/^\//, '')),'utf8'));
 t.after(()=>{w.close();assert.deepEqual(errors,[]);});
 function click(selector){const node=d.querySelector(selector);assert.ok(node,selector);assert.equal(node.disabled,false,selector);node.click();}
 function submit(form){form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}
 function read(id){
   w.StoryFlow.openDoc(id);assert.equal(d.querySelector('#storyReader').open,true,id);
   const lock=d.querySelector('#storyUnlock');
   if(lock){lock.querySelector('input').value=codes[id];submit(lock);assert.equal(d.querySelector('#storyUnlock'),null,id);}
   const claim=d.querySelector(`[data-story-collect="${id}"]`);assert.ok(claim,id);
   if(!claim.disabled)claim.click();
   click('#storyReader [data-story-close]');
 }
 function solve(id){
   const item=[...w.StoryConfig.main,...w.StoryConfig.side].find(x=>x.id===id);
   w.StoryFlow.open(id);assert.equal(d.querySelector('#storyPuzzle')?.dataset.step,id);
   for(const doc of item.docs)read(doc);
   let form=d.querySelector('#storyPuzzle');
   answers[id].forEach((value,i)=>{form.elements['a'+i].value=value;});
   for(const input of form.querySelectorAll('input[type="checkbox"]'))input.checked=true;
   if(item.order) {
     const ordered=[...form.querySelector('[name="order0"]').options].map(x=>x.value).filter(Boolean).sort((a,b)=>{
       const time=x=>x.match(/\d\d-\d\d \d\d:\d\d/)?.[0]||x.match(/\d+月\d+日/)?.[0];
       if(id==='M08')return time(a).localeCompare(time(b));
       return ['10月28日举报提交','10月30日调阅','10月31日摘转村内','11月3日暴力与转运','11月4日凌晨住宅起火'].indexOf(a)-['10月28日举报提交','10月30日调阅','10月31日摘转村内','11月3日暴力与转运','11月4日凌晨住宅起火'].indexOf(b);
     });
     ordered.forEach((value,i)=>{form.elements['order'+i].value=value;});
   }
   submit(form);
   if(item.send){assert.equal(w.StoryFlow.completed(id),false,'preview must not send');click(`[data-story-send="${id}"]`);}
   if(id==='X12'){assert.equal(w.StoryFlow.completed(id),false,'next batch must be reviewed');click('[data-story-next-batch]');}
   assert.equal(w.StoryFlow.completed(id),true,id+': '+d.querySelector('.story-feedback')?.textContent);
 }
 return {w,d,click,submit,read,solve,saved:()=>JSON.parse(w.localStorage.getItem(key))};
}

test('full main route reaches in-game publication without HM; gates, locks and reload preserve the investigation',t=>{
 const g=boot(t);assert.equal(Object.keys(g.w.StoryDocuments).length,90);assert.equal(Object.keys(g.w.StoryConfig.scenes).length,24);
 assert.equal(g.w.StoryFlow.available('C3-03'),true);assert.equal(g.w.StoryFlow.available('H01'),true);
 g.w.StoryFlow.open('M04');
 assert.equal(g.d.querySelector('.story-hint'),null);
 assert.equal(g.d.querySelector('[data-hint]'),null);
 g.submit(g.d.querySelector('#storyPuzzle'));assert.equal(g.w.StoryFlow.completed('M04'),false);
 for(const id of ['M04','M05','M06','S04','M07','M08','M09'])g.solve(id);
 assert.equal(g.saved().chapterThreeStarted,false);
 assert.deepEqual(g.saved().storyProgress.sendRecords.map(record=>record.target),['罗桂枝','盛广财','盛承安']);
 assert.ok(g.saved().storyProgress.sendRecords.every(record=>record.operator==='林予安'));
 assert.equal(g.w.StoryFlow.available('C3-03'),true);
 g.solve('DEPART');assert.equal(g.saved().chapterThreeStarted,true);
 for(const id of ['M10','M11','M12','M13','M14','M15','M16','M17','M18','M19','M20','M21','M22','M23','M24','M25','M26','REVIEW','PUBLISH'])g.solve(id);
 assert.equal(g.saved().storyProgress.published,true);
 assert.equal(g.saved().storyProgress.done.some(x=>x.startsWith('X')),false);
 assert.doesNotMatch(g.w.StoryFlow.body('E02'),/近年的村庄改造/);
 assert.match(g.w.StoryFlow.body('C7-03'),/林予安/);assert.doesNotMatch(g.w.StoryFlow.body('C7-03'),/陈默/);
 const reloaded=boot(t,g.saved());assert.equal(reloaded.w.StoryFlow.completed('PUBLISH'),true);
 reloaded.w.StoryFlow.open();assert.match(reloaded.d.querySelector('#page-story').textContent,/报道已留档/);
});

test('chapter correspondence only appears when received and reading never advances the story',t=>{
 const g=boot(t,{...ready,accepted:false,sent:false,chapterOneStarted:false,clinicSolved:false});
 assert.equal(g.w.StoryFlow.available('J01'),false);
 assert.equal(g.w.StoryFlow.available('J09'),false);
 g.click('[data-story-letters]');assert.match(g.d.querySelector('#page-story').textContent,/暂无通信/);
 const active=boot(t);
 active.click('[data-story-letters]');assert.equal(active.d.querySelectorAll('.story-letter').length,2);
 active.click('.story-letter[data-story-doc="J01"]');
 assert.match(active.d.querySelector('#storyReader').textContent,/林予安/);
 assert.doesNotMatch(active.d.querySelector('#storyReader').textContent,/许行远/);
 assert.deepEqual(active.saved().storyProgress.lettersRead,['J01']);
 assert.deepEqual(active.saved().storyProgress.done,[]);
 active.click('[data-story-close]');
 const restored=boot(t,active.saved());restored.click('[data-story-letters]');
 assert.match(restored.d.querySelector('[data-story-doc="J01"]').textContent,/已读/);
 assert.equal(restored.w.StoryFlow.available('J06'),false);
});

test('unfinished form values survive source collection and reload without counting as a solution',t=>{
 const g=boot(t);g.w.StoryFlow.open('M04');
 g.d.querySelector('[name="a0"]').value='尚未确认';
 g.read('C1-03');
 assert.equal(g.d.querySelector('[name="a0"]').value,'尚未确认');
 assert.equal(g.w.StoryFlow.completed('M04'),false);
 const reloaded=boot(t,g.saved());reloaded.w.StoryFlow.open('M04');
 assert.equal(reloaded.d.querySelector('[name="a0"]').value,'尚未确认');
 assert.equal(reloaded.w.StoryFlow.completed('M04'),false);
});

test('old stone sample remains searchable without exposing a complete gesture solution',t=>{
 const g=boot(t);
 g.w.LingchuanSearch.search('佛堂留样');assert.ok(g.d.querySelector('[data-result-id="story-V06"]'));
 g.w.StoryFlow.openDoc('V06');
 assert.equal(g.d.querySelectorAll('.shrine-hand-proof > svg').length,0);
 assert.match(g.d.querySelector('#storyReader').textContent,/辨不出原来的姿态/);
 assert.doesNotMatch(g.d.querySelector('#storyReader').textContent,/2713|2731|解法|制作备注/);
 assert.equal(g.saved().scenePuzzles,undefined);
 assert.equal(g.w.StoryFlow.completed('DEPART'),false);
});

test('independent side routes grant separate rewards and require NPC borrowing and final batch review',t=>{
 const pre=boot(t);for(const id of ['M04','M05','M06','S04','M07','M08','M09','DEPART','M10','M11','M12','M13'])pre.solve(id);
 for(const npc of pre.w.VillageCast){
   pre.w.desktopAPI.openWindow('village');
   let node=pre.d.querySelector(`[data-village-place="${npc.scene}"]`);
   if(!node){pre.click('[data-village-map]');node=pre.d.querySelector(`[data-village-place="${npc.scene}"]`);}node.click();
   pre.click(`[data-npc="${npc.id}"]`);
   for(const topic of npc.topics.filter(topic=>!topic.evidence))pre.click(`[data-npc-topic="${topic.id}"]`);
   pre.click('[data-npc-claim]');pre.click('[data-npc-close]');
 }
 const base=pre.saved();
 const financial=boot(t,base);
 for(const id of ['X01','X02','X04','X05','X08','X09'])financial.solve(id);
 assert.equal(financial.w.StoryFlow.available('RW01'),true);assert.equal(financial.w.StoryFlow.available('RW02'),false);
 financial.read('RW01');assert.equal(financial.w.StoryFlow.files().some(x=>x.id.includes('RW')),false);
 const consciousness=boot(t,base);
 for(const id of ['X03','X06','X07','X10','X11','X12'])consciousness.solve(id);
 assert.equal(consciousness.w.StoryFlow.available('RW02'),true);assert.equal(consciousness.w.StoryFlow.available('RW01'),false);
 assert.equal(consciousness.saved().storyProgress.nextChecked,true);
 consciousness.read('RW02');assert.equal(consciousness.w.StoryFlow.files().some(x=>x.id.includes('RW')),false);
});

test('source documents open independently of chapters, passwords remain puzzles and external links stay empty',t=>{
 const g=boot(t);
 for(const id of ['C3-03','C5-03','C7-02','H13']){g.w.StoryFlow.openDoc(id);assert.equal(g.d.querySelector('#storyReader').open,true);g.click('#storyReader [data-story-close]');}
 for(const id of ['RW02']){g.w.StoryFlow.openDoc(id);assert.equal(g.d.querySelector('#storyReader').open,false);}
 g.w.LingchuanSearch.search('林知微');assert.ok(g.d.querySelector('[data-result-id="story-C4-01"]'));
 g.solve('M04');g.w.StoryFlow.openDoc('C1-04');
 const link=g.d.querySelector('[data-external-placeholder="C1-04"]');assert.ok(link);assert.equal(link.hasAttribute('href'),false);
 assert.doesNotMatch(g.d.querySelector('#storyReader').textContent,/制作备注|解谜元素制作单|还需制作/);
 g.click('#storyReader [data-story-close]');
 g.w.LingchuanSearch.search('C1-04');assert.ok(g.d.querySelector('[data-result-id="story-C1-04"]'));
 g.click('[data-search-document="story-C1-04"]');assert.match(g.d.querySelector('.search-document-body').textContent,/罗桂枝/);
 g.click('[data-search-bookmark="story-C1-04"]');assert.equal(g.saved().storyProgress.collected.includes('C1-04'),true);
 g.w.StoryFlow.openDoc('C1-05');assert.match(g.d.querySelector('#storyReader').textContent,/校友附件/);assert.doesNotMatch(g.d.querySelector('#storyReader').textContent,/出生年：1968/);
 const lock=g.d.querySelector('#storyUnlock');lock.querySelector('input').value='0000';g.submit(lock);assert.ok(g.d.querySelector('#storyUnlock'));
});

test('sender stays anonymous through chapter two, including old send records and search sources', t => {
 const g=boot(t);
 const anonymous = () => {
   assert.doesNotMatch(g.d.querySelector('#desktop').textContent,/许行远|52\s*岁|当前位置：宁州/);
   for(const [id,doc] of Object.entries(g.w.StoryDocuments)) {
     if (/^(P|C1-|C2-)/.test(id)) assert.doesNotMatch(doc.title+doc.body,/许行远/,id);
   }
 };
 anonymous();
 for(const id of ['M04','M05','M06','S04','M07','M08','M09']){g.solve(id);anonymous();}
 assert.ok(g.saved().storyProgress.sendRecords.every(record=>record.recipient==='TG-240824-019'));
 const saved=g.saved();saved.storyProgress.sendRecords.forEach(record=>record.recipient='许行远');
 const reload=boot(t,saved);
 reload.w.StoryFlow.openDoc('C2-03');
 assert.doesNotMatch(reload.d.querySelector('#storyReader').textContent,/许行远/);
 assert.match(reload.d.querySelector('#storyReader').textContent,/TG-240824-019/);
 reload.w.LingchuanSearch.search('许行远');
 assert.ok(reload.d.querySelector('[data-result-id="story-C3-04"]'));
 assert.equal(reload.d.querySelector('[data-result-id="submission-photo"]'),null);
});
