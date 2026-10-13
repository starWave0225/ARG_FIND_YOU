(() => {
  'use strict';
  const $=s=>document.querySelector(s),canvas=$('#world'),gl=canvas.getContext('webgl',{antialias:true});
  const reader=$('#reader'),body=$('#document-body'),actions=$('#document-actions');
  const engine=window.ZhouEngine,diary=window.StoryDocuments.RW01;
  let player={x:0,z:2.5,yaw:0,pitch:0},active=false,keys=new Set(),last=0,drag=false,pointer=[0,0];
  let printed=false,held=false,written=false,stored=false,drawer=false,forgotten=false,subtitleTimer;
  let visited={};try{visited=JSON.parse(localStorage.getItem('find-you-zhou-preview-readings-v1')||'{}');}catch{}
  if(!gl){$('#failure').textContent='当前浏览器无法显示此场景，请使用支持 WebGL 的浏览器。';$('#begin').disabled=true;return;}
  // Native WebGL geometry keeps this independent preview free of remote assets.
  const vs=`attribute vec3 p;attribute vec3 n;attribute vec3 c;uniform mat4 vp;varying vec3 normal;varying vec3 color;varying vec3 world;void main(){world=p;normal=n;color=c;gl_Position=vp*vec4(p,1.);}`;
  const fs=`precision mediump float;varying vec3 normal;varying vec3 color;varying vec3 world;uniform vec3 eye;void main(){float rough=fract(sin(dot(floor(world*85.),vec3(12.9898,78.233,37.4)))*43758.54);float light=.55+.25*max(dot(normal,normalize(vec3(.4,1.,.7))),0.);float lamp=max(0.,1.-length(world-vec3(0.,2.5,-3.2))/6.);vec3 rgb=color*(light+lamp*.38)*(rough*.1+.95);float fog=clamp(length(eye-world)/18.,0.,.7);gl_FragColor=vec4(mix(rgb,vec3(.09,.12,.13),fog),1.);}`;
  function shader(type,code){const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
  const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  for(const [name,offset] of [['p',0],['n',12],['c',24]]){const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,36,offset);}
  const vpLocation=gl.getUniformLocation(program,'vp'),eyeLocation=gl.getUniformLocation(program,'eye');gl.enable(gl.DEPTH_TEST);
  const colors={wall:[.37,.43,.42],trim:[.19,.25,.25],floor:[.28,.31,.29],wood:[.32,.24,.16],metal:[.24,.31,.3],dark:[.065,.085,.09],paper:[.83,.8,.68],screen:[.12,.37,.4]};
  function box(vertices,x,y,z,w,h,d,color){
    const X=[x-w/2,x+w/2],Y=[y-h/2,y+h/2],Z=[z-d/2,z+d/2];
    const faces=[[[0,0,1],[1,0,1],[1,1,1],[0,1,1],[0,0,1]],[[1,0,0],[0,0,0],[0,1,0],[1,1,0],[0,0,-1]],[[1,0,1],[1,0,0],[1,1,0],[1,1,1],[1,0,0]],[[0,0,0],[0,0,1],[0,1,1],[0,1,0],[-1,0,0]],[[0,1,1],[1,1,1],[1,1,0],[0,1,0],[0,1,0]],[[0,0,0],[1,0,0],[1,0,1],[0,0,1],[0,-1,0]]];
    for(const face of faces)for(const i of [0,1,2,0,2,3]){const v=face[i];vertices.push(X[v[0]],Y[v[1]],Z[v[2]],...face[4],...color);}
  }
  let vertices=[];
  function geometry(){
    vertices=[];const b=(x,y,z,w,h,d,color)=>box(vertices,x,y,z,w,h,d,colors[color]||color);
    b(0,-.1,-.5,10,.2,11,'floor');b(0,3.2,-.5,10,.1,11,'wall');
    b(0,1.6,-6,10,3.2,.18,'wall');b(-5,1.6,-.5,.18,3.2,11,'wall');b(5,1.6,-.5,.18,3.2,11,'wall');
    for(const x of [-3.2,3.2])b(x,1.6,5,3.6,3.2,.18,'wall');
    b(0,2.95,5,2.8,.5,.18,'trim');b(0,-.1,7.5,2.8,.2,5,'floor');b(0,3.2,7.5,2.8,.1,5,'wall');
    for(const x of [-1.4,1.4])b(x,1.6,7.5,.18,3.2,5,'wall');b(0,1.6,10,2.8,3.2,.18,'trim');
    b(0,1.1,9.88,1.3,2.2,.1,'wood');b(.5,1.05,9.78,.1,.06,.08,'paper');
    for(let z=-5;z<=9;z++)b(0,.006,z,z<5?10:2.8,.01,.018,'trim');
    for(let x=-4;x<=4;x++)b(x,.008,-.5,.018,.01,11,'trim');
    // Workbench and CRT monitor face the incoming player.
    b(0,.84,-3.6,2.6,.12,1,'wood');for(const x of [-1.1,1.1])for(const z of [-3.94,-3.26])b(x,.4,z,.09,.8,.09,'metal');
    b(0,1.29,-3.67,1,.7,.42,'dark');b(0,1.29,-3.448,.84,.52,.015,forgotten?[.15,.21,.21]:colors.screen);
    for(let i=0;i<5;i++)b(-.11,1.44-i*.065,-3.433,.54-(i%2)*.18,.014,.01,[.48,.67,.61]);
    b(0,.945,-3.68,.22,.14,.18,'dark');b(0,.92,-3.28,.95,.04,.25,'dark');
    for(let i=0;i<12;i++)b(-.41+i*.075,.948,-3.25,.04,.01,.12,'metal');
    b(.87,.92,-3.28,.09,.04,.13,'dark');b(-.92,.92,-3.65,.33,.015,.38,'paper');
    // Desk lamp, notice board and conduit establish a workplace rather than a portrait.
    b(1,1.31,-3.85,.035,.76,.035,'metal');b(.86,1.68,-3.85,.32,.09,.2,'paper');
    b(1.7,1.85,-5.89,1.6,1.15,.1,'wood');for(let i=0;i<4;i++)b(1.17+(i%2)*.57,1.64+Math.floor(i/2)*.47,-5.82,.4,.35,.03,'paper');
    b(-2.5,2.7,-5.8,.045,.045,11,'metal');
    // Printer and emitted page.
    b(3.85,.86,-3.7,1.7,.1,1.6,'wood');for(const x of [3.15,4.55])b(x,.4,-3.7,.08,.8,1.3,'metal');
    b(3.85,1.09,-3.7,1.08,.36,.68,'paper');b(3.85,1.28,-3.7,.86,.02,.38,'trim');b(3.85,1.11,-3.345,.72,.07,.015,'dark');
    b(3.85,.95,-3.17,.72,.04,.32,'dark');if(printed&&!held&&!stored)b(3.85,.979,-3.06,.55,.012,.36,'paper');
    // A four-drawer metal tool cabinet. The bottom drawer opens in world space.
    b(-4.22,.97,-2,1.35,1.9,1.1,'metal');for(let i=0;i<4;i++){
      const y=.27+i*.44,z=i===0&&drawer?-1.05:-1.435;
      b(-4.22,y,z,1.24,.39,.09,'trim');b(-4.22,y,z+.07,.42,.025,.055,'paper');
      if(i===0&&drawer){b(-4.22,.08,-1.23,1.2,.06,.62,'dark');if(stored)b(-4.22,.125,-1.12,.48,.015,.32,'paper');}
    }
    b(-3.25,.8,1.6,2.1,.12,1,'wood');for(let i=0;i<3;i++)b(-3.9+i*.54,.91,1.55,.31,.12,.46,i===1?'metal':'dark');
    // Window and old blind on the right wall, distant buildings kept abstract.
    b(4.88,1.93,.5,.025,1.4,2.4,[.3,.4,.46]);for(let y=1.28;y<2.65;y+=.16)b(4.84,y,.5,.045,.045,2.5,'trim');
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
  }
  function multiply(a,b){const out=new Float32Array(16);for(let col=0;col<4;col++)for(let row=0;row<4;row++)for(let k=0;k<4;k++)out[col*4+row]+=a[k*4+row]*b[col*4+k];return out;}
  function matrix(){
    const f=1/Math.tan(Math.PI/6),aspect=canvas.width/canvas.height;
    const projection=new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,-1.002,-1,0,0,-.2002,0]);
    const sy=Math.sin(player.yaw),cy=Math.cos(player.yaw),sp=Math.sin(player.pitch),cp=Math.cos(player.pitch);
    const right=[cy,0,sy],up=[-sy*sp,cp,cy*sp],back=[-sy*cp,-sp,cy*cp],eye=[player.x,1.58,player.z];
    const dot=v=>v[0]*eye[0]+v[1]*eye[1]+v[2]*eye[2];
    const view=new Float32Array([right[0],up[0],back[0],0,right[1],up[1],back[1],0,right[2],up[2],back[2],0,-dot(right),-dot(up),-dot(back),1]);
    return multiply(projection,view);
  }
  function turn(dx,dy=0){player.yaw+=dx;player.pitch=Math.max(-.62,Math.min(.62,player.pitch-dy));}
  function step(forward,side,distance){
    const dx=(Math.sin(player.yaw)*forward+Math.cos(player.yaw)*side)*distance;
    const dz=(-Math.cos(player.yaw)*forward+Math.sin(player.yaw)*side)*distance;player=engine.move(player,dx,dz);
  }
  function frame(now){
    const dt=Math.min((now-last)/1000,.05);last=now;
    if(active&&!reader.open){
      const fw=Number(keys.has('w')||keys.has('arrowup')||keys.has('forward'))-Number(keys.has('s')||keys.has('arrowdown')||keys.has('back'));
      const side=Number(keys.has('d')||keys.has('right'))-Number(keys.has('a')||keys.has('left'));
      const norm=Math.max(1,Math.hypot(fw,side));step(fw/norm,side/norm,dt*1.75);
      turn((Number(keys.has('arrowright'))-Number(keys.has('arrowleft')))*dt*1.5);
    }
    const ratio=Math.min(devicePixelRatio||1,1.5),w=Math.round(canvas.clientWidth*ratio),h=Math.round(canvas.clientHeight*ratio);
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
    gl.clearColor(.1,.13,.14,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniformMatrix4fv(vpLocation,false,matrix());gl.uniform3f(eyeLocation,player.x,1.58,player.z);gl.drawArrays(gl.TRIANGLES,0,vertices.length/9);
    const object=active&&!reader.open?engine.target(player):null;
    $('#interact').hidden=!object;$('#interact').textContent=object?'E · '+object.name:'';
    canvas.dataset.position=[player.x.toFixed(3),player.z.toFixed(3),player.yaw.toFixed(3),player.pitch.toFixed(3)].join(',');
    requestAnimationFrame(frame);
  }
  function say(text){clearTimeout(subtitleTimer);$('#subtitle').textContent=text;subtitleTimer=setTimeout(()=>$('#subtitle').textContent='',4500);}
  function retain(id,title,html){visited[id]={title,body:html,source:'周明川 · 2026 年 5 月 30 日的经历'};try{localStorage.setItem('find-you-zhou-preview-readings-v1',JSON.stringify(visited));}catch{}}
  function open(title,html,buttons=[],id){
    keys.clear();if(document.pointerLockElement)document.exitPointerLock();
    $('#document-title').textContent=title;$('#source').textContent='2026 年 5 月 30 日 · 周明川';body.innerHTML=html;actions.replaceChildren();
    for(const [label,fn] of buttons){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=fn;b.disabled=!fn;actions.append(b);}
    if(id)retain(id,title,html);if(!reader.open)reader.showModal();
  }
  const forms=`<div class="sheets"><section class="sheet"><h3>澄江项目</h3><dl><dt>登记称谓</dt><dd>员工</dd><dt>计费单位</dt><dd>回访次数</dd><dt>附记</dt><dd>本次有没有出现不在登记范围内的关系人</dd></dl></section><section class="sheet"><h3>村落项目</h3><dl><dt>服务内容</dt><dd>导览、旧物保管、夜间回访</dd><dt>登记称谓</dt><dd>角色</dd><dt>计费单位</dt><dd>场次</dd><dt>附记</dt><dd>本次有没有出现不在登记范围内的关系人</dd></dl></section></div>`;
  const formTemplate=document.createElement('template');formTemplate.innerHTML=forms;
  const villageForm=formTemplate.content.querySelector('.sheet:last-child').outerHTML;
  function paper(){return villageForm+(written?'<p class="handwriting">不是只有澄江。<br>纸先留下。</p>':'');}
  function inspect(id){
    if(id==='computer'){
      open('同一收款批次 · 附件',forgotten?'<p>附件列表已刷新。</p>':forms,[
        [printed?'首页已打印':'打印村落附件首页',printed?null:()=>{printed=true;geometry();reader.close();say('打印机响了。');}],
        ['刷新页面',()=>{forgotten=true;geometry();reader.close();$('.grain').classList.remove('flash');void $('.grain').offsetWidth;$('.grain').classList.add('flash');say('我刚才……在查什么？');}],
      ],forgotten?undefined:'computer');
    }else if(id==='printer'){
      if(held){open('纸页',paper(),written?[]:[['记下两行字',()=>{written=true;inspect('printer');}]],'paper');}
      else if(printed&&!stored){open('打印机出纸口',villageForm,[['拿起纸页',()=>{held=true;geometry();inspect('printer');}]],'paper');}
      else open('打印机','<p>出纸口空着。</p>');
    }else if(id==='cabinet'){
      drawer=true;geometry();open('工具柜 · 最下层',stored?paper():'<p>抽屉底部留着一道旧划痕。</p>',held?[['放入纸页',()=>{held=false;stored=true;geometry();open('五月三十日',written?diary.body:paper(),[['合上抽屉',()=>{drawer=false;geometry();reader.close();}]],written?'diary':'paper');}]]:[['合上抽屉',()=>{drawer=false;geometry();reader.close();}]],stored?'paper':undefined);
    }
  }
  function interact(){const target=engine.target(player);if(active&&!reader.open&&target)inspect(target.id);}
  function begin(){active=true;$('#gate').hidden=true;$('#paused').hidden=true;$('#controls').hidden=false;$('#pause').hidden=false;$('#reticle').hidden=false;$('#touch').hidden=false;canvas.focus();}
  function pause(){if(!active||reader.open)return;active=false;drag=false;keys.clear();if(document.pointerLockElement)document.exitPointerLock();$('#paused').hidden=false;$('#reticle').hidden=true;}
  $('#begin').onclick=begin;$('#resume').onclick=begin;$('#pause').onclick=pause;$('#interact').onclick=interact;
  $('#restart').onclick=()=>{player={x:0,z:2.5,yaw:0,pitch:0};printed=held=written=stored=drawer=forgotten=false;geometry();say('');begin();};
  $('#leave').onclick=()=>{active=false;keys.clear();$('#paused').hidden=true;$('#gate').hidden=false;$('#controls').hidden=true;$('#pause').hidden=true;$('#reticle').hidden=true;$('#interact').hidden=true;$('#touch').hidden=true;};
  $('#notes').onclick=()=>open('留存记录',Object.values(visited).length?Object.values(visited).map(e=>'<section><h3>'+e.title+'</h3><p class="date">'+e.source+'</p>'+e.body+'</section>').join(''):'<p>暂无记录。</p>');
  reader.addEventListener('close',()=>{keys.clear();canvas.focus();});
  document.addEventListener('keydown',e=>{
    if(reader.open||!active)return;const key=e.key.toLowerCase();
    if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','pageup','pagedown','e','escape'].includes(key))e.preventDefault();
    if(key==='e'){if(!e.repeat)interact();return;}if(key==='escape'){pause();return;}keys.add(key);
    // Single keyboard taps also move the camera; held keys continue every frame.
    if(!e.repeat){if(key==='w'||key==='arrowup')step(1,0,.1);if(key==='s'||key==='arrowdown')step(-1,0,.1);if(key==='a')step(0,-1,.1);if(key==='d')step(0,1,.1);if(key==='arrowleft')turn(-.1);if(key==='arrowright')turn(.1);if(key==='pageup')turn(0,-.12);if(key==='pagedown')turn(0,.12);}
  });
  document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();pause();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();pause();}});
  canvas.addEventListener('pointerdown',e=>{if(!active||reader.open)return;drag=true;pointer=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(active&&!reader.open){if(document.pointerLockElement===canvas)turn(e.movementX*.003,e.movementY*.003);else if(drag){turn((e.clientX-pointer[0])*.003,(e.clientY-pointer[1])*.003);pointer=[e.clientX,e.clientY];}}});
  canvas.addEventListener('pointerup',()=>drag=false);canvas.addEventListener('pointercancel',()=>drag=false);
  canvas.addEventListener('dblclick',()=>{if(active&&!reader.open&&canvas.requestPointerLock){try{const p=canvas.requestPointerLock();if(p)p.catch(()=>{});}catch{}}});
  for(const button of document.querySelectorAll('[data-move]')){
    button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);keys.add(button.dataset.move);});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>keys.delete(button.dataset.move));
  }
  geometry();requestAnimationFrame(frame);
})();
