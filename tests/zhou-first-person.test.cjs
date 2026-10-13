const test=require('node:test');const assert=require('node:assert/strict');
const engine=require('../workshop/zhou-mingchuan/engine.js');
const fs=require('node:fs');const path=require('node:path');const {JSDOM}=require('jsdom');
test('walking cannot cross a wall or desk even with a long frame, but can slide alongside them',()=>{
  const start={x:0,z:-2,yaw:0};
  const blocked=engine.move(start,0,-10);assert.ok(blocked.z>-2.9);
  const slide=engine.move({x:4.6,z:3,yaw:0},2,-2);assert.ok(slide.x<4.78);assert.ok(slide.z<1.1);
  const corridor=engine.move({x:0,z:4,yaw:0},0,3);assert.ok(corridor.z>6.9);
});
test('interaction requires proximity and facing an object, and a wall blocks it',()=>{
  assert.equal(engine.target({x:0,z:-1.9,yaw:0}).id,'computer');
  assert.equal(engine.target({x:0,z:2.5,yaw:0}),null);
  assert.equal(engine.target({x:0,z:-1.9,yaw:Math.PI}),null);
  assert.equal(engine.target({x:5.4,z:-3.5,yaw:-Math.PI/2}),null);
});

test('paper survives the screen refresh; readings keep their source without changing the main save',t=>{
  const folder=path.resolve(__dirname,'../workshop/zhou-mingchuan');
  const dom=new JSDOM(fs.readFileSync(path.join(folder,'paper.html'),'utf8'),{url:'http://127.0.0.1:4173/workshop/zhou-mingchuan/paper.html',runScripts:'outside-only'});
  t.after(()=>dom.window.close());const w=dom.window,d=w.document;
  const gl=new Proxy({getShaderParameter:()=>true,getAttribLocation:()=>0},{get:(o,k)=>o[k]||(()=>({}))});
  w.HTMLCanvasElement.prototype.getContext=()=>gl;
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
  w.requestAnimationFrame=()=>{};
  w.localStorage.setItem('find-you-state-v1','untouched-main-save');
  for(const file of ['../../story-documents.js','engine.js','scene.js'])w.eval(fs.readFileSync(path.resolve(folder,file),'utf8'));
  function key(key,n=1){for(let i=0;i<n;i++){d.dispatchEvent(new w.KeyboardEvent('keydown',{key,bubbles:true}));d.dispatchEvent(new w.KeyboardEvent('keyup',{key,bubbles:true}));}}
  function action(label){const b=[...d.querySelectorAll('button')].find(b=>b.textContent===label);assert.ok(b,label);assert.equal(b.disabled,false);b.click();}
  const close=()=>d.querySelector('#reader').close();
  action('进入值班室');key('w',43);key('e');action('打印村落附件首页');
  key('d',38);key('PageDown');key('e');action('拿起纸页');action('记下两行字');
  assert.match(d.querySelector('#document-body').textContent,/不是只有澄江/);
  assert.doesNotMatch(d.querySelector('#document-body').textContent,/澄江项目/,'only the village page is printed');
  close();key('a',38);key('e');action('刷新页面');key('e');
  assert.match(d.querySelector('#document-body').textContent,/附件列表已刷新/);
  let readings=JSON.parse(w.localStorage.getItem('find-you-zhou-preview-readings-v1'));
  assert.match(readings.computer.body,/澄江项目/,'refresh must not erase the retained original');
  assert.match(readings.paper.body,/纸先留下/);assert.match(readings.paper.source,/周明川/);
  close();key('s',12);key('a',42);key('e');action('放入纸页');
  assert.match(d.querySelector('#document-body').textContent,/工具柜里的一张纸/);
  assert.equal(w.localStorage.getItem('find-you-state-v1'),'untouched-main-save');
});
