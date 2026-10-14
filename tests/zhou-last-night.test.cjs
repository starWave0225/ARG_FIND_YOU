const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const {JSDOM}=require('jsdom');
const engine=require('../workshop/zhou-mingchuan/last-night-engine.js');
test('the last encounter preserves the original diary, interrupted call and final plea',()=>{
  assert.match(engine.diary.join(''),/21时17分/);assert.match(engine.diary.join(''),/走廊里那道身影/);
  const state=engine.create();assert.equal(engine.send(state),false);assert.equal(engine.dial(state,1000),true);
  assert.equal(engine.line(state,55000).text,'您好，请问还在线吗？');
  assert.equal(engine.advance(state,60000),'calling');assert.equal(engine.advance(state,61000),'sealed');
  assert.equal(engine.send(state),true);assert.equal(state.stage,'ended');
  assert.equal(engine.message,'一切都放在1104，救救我，我被困住了！');
});
test('the room walls and furnishings block movement, and distant objects cannot be operated',()=>{
  const p={x:0,z:.7,yaw:0,pitch:0};assert.equal(engine.target(p,'room'),null);
  assert.ok(engine.move(p,0,-10).z> -1.84);assert.ok(engine.move(p,0,10).z<3.18);
  assert.equal(engine.target({x:0,z:-.5,yaw:0},'room').id,'computer');
  assert.equal(engine.target({x:0,z:2.6,yaw:Math.PI},'room').id,'door');
  assert.equal(engine.target(p,'ended'),null);
});
test('the player can call without reading gates; pause freezes the encounter and the final message stays separate from the main save',t=>{
  const folder=path.resolve(__dirname,'../workshop/zhou-mingchuan');
  const dom=new JSDOM(fs.readFileSync(path.join(folder,'index.html'),'utf8'),{url:'http://127.0.0.1:4173/workshop/zhou-mingchuan/',runScripts:'outside-only'});
  t.after(()=>dom.window.close());const w=dom.window,d=w.document;let now=0,frame;
  w.performance.now=()=>now;w.requestAnimationFrame=fn=>{frame=fn;};
  w.ZhouRenderer={create:()=>({render(){}})};
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
  w.localStorage.setItem('find-you-state-v1','original-main-save');
  for(const file of ['last-night-engine.js','investigation.js','last-night.js'])w.eval(fs.readFileSync(path.join(folder,file),'utf8'));
  function key(key,n=1){for(let i=0;i<n;i++){d.dispatchEvent(new w.KeyboardEvent('keydown',{key}));d.dispatchEvent(new w.KeyboardEvent('keyup',{key}));}}
  function tick(ms){for(let i=0;i<ms/50;i++){now+=50;frame(now);}}
  function action(label){const b=[...d.querySelectorAll('button')].find(b=>b.textContent===label);assert.ok(b,label);b.click();}
  action('进入房间');key('w',12);key('d',12);key('ArrowRight',15);key('e');action('拨出电话');
  tick(44000);assert.match(d.querySelector('#subtitle').textContent,/没时间了/);
  action('暂停');tick(60000);assert.equal(d.querySelector('#world').dataset.stage,'calling');
  action('继续');tick(16000);assert.equal(d.querySelector('#world').dataset.stage,'sealed');
  const before=d.querySelector('#world').dataset.position;key('w',15);tick(50);assert.equal(d.querySelector('#world').dataset.position,before,'sealed view permits looking but not walking through the wall');
  key('e');action('发送');tick(50);assert.equal(d.querySelector('#ended').hidden,true,'ending fade must not skip ahead after a long pause');
  tick(2500);assert.equal(d.querySelector('#ended').hidden,false);
  const records=JSON.parse(w.localStorage.getItem('find-you-zhou-last-night-readings-v1'));assert.match(records.message.body,/我被困住了/);assert.match(records.message.source,/22:18/);
  assert.equal(w.localStorage.getItem('find-you-state-v1'),'original-main-save');
  action('重看这段经历');tick(50);assert.equal(d.querySelector('#world').dataset.stage,'room');
});
test('physical investigation retains sources, rejects incorrect credentials neutrally and replays the erased relationship without advancing the call',t=>{
  const folder=path.resolve(__dirname,'../workshop/zhou-mingchuan');
  const dom=new JSDOM(fs.readFileSync(path.join(folder,'index.html'),'utf8'),{url:'http://127.0.0.1:4173/workshop/zhou-mingchuan/',runScripts:'outside-only'});
  t.after(()=>dom.window.close());const w=dom.window,d=w.document;let now=0,frame;
  w.performance.now=()=>now;w.requestAnimationFrame=fn=>{frame=fn;};w.ZhouRenderer={create:()=>({render(){}})};
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
  w.localStorage.setItem('find-you-state-v1','main-unchanged');
  for(const file of ['last-night-engine.js','investigation.js','last-night.js'])w.eval(fs.readFileSync(path.join(folder,file),'utf8'));
  function key(k,n=1){for(let i=0;i<n;i++){d.dispatchEvent(new w.KeyboardEvent('keydown',{key:k}));d.dispatchEvent(new w.KeyboardEvent('keyup',{key:k}));}}
  function tick(ms){for(let i=0;i<ms/50;i++){now+=50;frame(now);}}
  function action(label){const b=[...d.querySelectorAll('button')].find(b=>b.textContent===label);assert.ok(b,label);b.click();}
  action('进入房间');key('w',12);key('a',10);key('ArrowLeft',7);key('e');
  assert.equal(d.querySelector('#document-title').textContent,'本地终端');
  action('拔掉电源');action('拔掉网线');assert.match(d.querySelector('#document-body').textContent,/终端：在线/);
  d.querySelector('#terminal-password').value='wrong';action('登录');assert.equal(d.querySelector('#terminal-result').textContent,'密码不正确。');assert.equal(d.querySelector('#document-title').textContent,'本地终端');
  d.querySelector('#terminal-password').value='hengmurecyclezm0602';action('登录');action('打开保管交接附页');
  const records=()=>JSON.parse(w.localStorage.getItem('find-you-zhou-last-night-readings-v1'));
  assert.match(records().church.body,/恒目驻场组/);assert.match(records().church.source,/QZ-CJ-04/);
  action('返回终端');action('打开批次回放');d.querySelector('#batch-code').value='wrong';action('载入');assert.equal(d.querySelector('#batch-result').textContent,'核验未通过。');
  d.querySelector('#batch-code').value='RW-04';action('载入');action('执行过滤');assert.match(d.querySelector('#document-body').textContent,/关系字段空/);
  tick(70000);assert.equal(d.querySelector('#world').dataset.stage,'room');action('重建岗位');action('重放窗口');
  assert.match(d.querySelector('#document-body').textContent,/首次上门/);assert.match(d.querySelector('#document-body').textContent,/你又回来了/);
  assert.equal(Object.keys(records()).filter(k=>k.startsWith('replay-')).length,4);assert.match(records()['test-power'].body,/屏幕与指示灯仍亮/);
  assert.equal(w.localStorage.getItem('find-you-state-v1'),'main-unchanged');
});
