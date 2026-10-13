(() => {
  const $=s=>document.querySelector(s),canvas=$('#world'),engine=window.ZhouLastNight,renderer=window.ZhouRenderer.create(canvas);
  const reader=$('#reader'),storageKey='find-you-zhou-last-night-readings-v1';
  let player={x:0,z:.7,yaw:0,pitch:0,height:1.58},state=engine.create(),active=false,clock=0,last=0,keys=new Set(),drag=false,pointer=[0,0],panel=false;
  let currentLine=-1,captionUntil=0,caption='',speaker='',doorUntil=0,footDistance=0,endedAt=null,intruderStep=-1;
  let records={};try{const saved=JSON.parse(localStorage.getItem(storageKey)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))records=saved;}catch{}
  let audio=null,master=null,muted=false;
  if(!renderer){$('#failure').textContent='当前浏览器无法显示此场景，请使用支持 WebGL 的浏览器。';$('#begin').disabled=true;return;}
  function startAudio(){try{if(!audio){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;audio=new Audio();master=audio.createGain();master.gain.value=muted?0:.16;master.connect(audio.destination);for(const hz of [53,56]){const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=hz;g.gain.value=.018;o.connect(g).connect(master);o.start();}}audio.resume().catch(()=>{});}catch{audio=null;}}
  function sound(kind){if(!audio||muted||!master)return;const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;const props={step:[95,.05,.22],door:[58,.3,.4],ring:[440,.22,.18],tap:[840,.05,.045],scrape:[38,.38,.12]}[kind]||[80,.1,.1];o.type=kind==='ring'?'sine':'triangle';o.frequency.setValueAtTime(props[0],t);o.frequency.exponentialRampToValueAtTime(Math.max(22,props[0]*.5),t+props[1]);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(props[2],t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+props[1]+.05);o.connect(g).connect(master);o.start(t);o.stop(t+props[1]+.06);}
  function say(text,who='',seconds=5){caption=text;speaker=who;captionUntil=clock+seconds*1000;}
  function retain(id,title,html,source){records[id]={title,body:html,source};try{localStorage.setItem(storageKey,JSON.stringify(records));}catch{}}
  function open(title,html,buttons=[],id,source='周明川 · 1104 本地设备'){
    keys.clear();if(document.pointerLockElement)document.exitPointerLock();$('#document-title').textContent=title;$('#source').textContent=source;$('#document-body').innerHTML=html;const actions=$('#document-actions');actions.replaceChildren();
    for(const [label,fn] of buttons){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=fn;actions.append(b);}if(id)retain(id,title,html,source);if(!reader.open)reader.showModal();
  }
  const diaryHTML=engine.diary.map(p=>'<p>'+p+'</p>').join('');
  function inspect(id){
    if(id==='computer')open('如果没有明天',diaryHTML,[['保存在本地',()=>{reader.close();sound('tap');say('留在这里。不再上传。','周明川');}]],'diary','周明川私人日记 · 2026-06-02 / 21:48');
    if(id==='panel'){panel=true;open('本地终端','<p>ZM-0602</p><p>第一个没有去向的人<br>钱归于一处去了<br>终端设备不需要电也能联通<br>如果没有明天</p><p>四份日记 · 本地已保存</p>',[['合上遮板',()=>{panel=false;reader.close();}]],'local','1104 暗格内终端');}
    if(id==='door'){doorUntil=clock+600;sound('door');say('门把手压下去了，门没有动。','周明川');retain('door','1104 房门','<p>门没有打开。门外的身影停在那里。</p>','周明川现场观察');}
    if(id==='phone'){
      if(state.stage==='room')open('CS-046','<p>最后联系人：CS-046</p>',[['拨出电话',()=>{reader.close();engine.dial(state,clock);sound('ring');say('呼叫中……');$('#location').textContent='1104 · 22:18';}]],'contact','周明川手机');
      else open('CS-046','<p>通话仍在继续。</p>');
    }
    if(id==='trapped-phone')open('物业留言','<p class="phone-message">'+engine.message+'</p>',[['发送',()=>{engine.send(state);retain('message','最后一条留言','<p>'+engine.message+'</p>','周明川公开留言 · 2026-06-02 / 22:18');endedAt=performance.now();reader.close();sound('tap');say('已发送。');}]],'message-draft','周明川手机 · 未发送');
  }
  function turn(dx,dy){player.yaw+=dx;player.pitch=Math.max(-.62,Math.min(.62,player.pitch-dy));if(state.stage==='sealed'){player.yaw=Math.max(-.65,Math.min(.65,player.yaw));player.pitch=Math.max(-.35,Math.min(.35,player.pitch));}}
  function step(f,s,d){if(!['room','calling'].includes(state.stage)||engine.elapsed(state,clock)>=52)return;const before=player;player=engine.move(player,(Math.sin(player.yaw)*f+Math.cos(player.yaw)*s)*d,(-Math.cos(player.yaw)*f+Math.sin(player.yaw)*s)*d);footDistance+=Math.hypot(player.x-before.x,player.z-before.z);if(footDistance>.5){sound('step');footDistance=0;}}
  function interact(){const target=engine.target(player,state.stage);if(active&&!reader.open&&target)inspect(target.id);}
  const C={wall:[.38,.40,.37],floor:[.22,.25,.24],metal:[.22,.28,.28],wood:[.32,.23,.17],dark:[.035,.046,.055],paper:[.75,.75,.62],screen:[.15,.42,.4]};
  function geometry(t){const out=[],b=(x,y,z,w,h,d,c,a=0)=>out.push([x,y,z,w,h,d,C[c]||c,a]);
    b(0,-.08,0,4.8,.16,7,'floor');b(0,3.05,0,4.8,.12,7,'wall');b(0,1.5,-3.5,4.8,3,.18,'wall');b(-2.4,1.5,0,.18,3,7,'wall');b(2.4,1.5,0,.18,3,7,'wall');
    for(const x of [-1.52,1.52])b(x,1.5,3.5,1.75,3,.18,'wall');b(0,2.8,3.5,1.3,.4,.18,'wall');
    for(let z=-3;z<3.5;z+=.7)b(0,.007,z,4.6,.01,.015,'metal');for(let x=-2.1;x<2.2;x+=.7)b(x,.009,0,.015,.01,7,'metal');
    // Narrow hall, viewed through the door's observation slot.
    b(0,-.08,5.5,1.8,.16,4,'floor');for(const x of [-.9,.9])b(x,1.5,5.5,.15,3,4,'wall');b(0,1.5,7.5,1.8,3,.16,'dark');b(0,1.5,7.39,1.6,2.7,.015,[.5,.49,.4]);b(0,2.9,5.5,.55,.06,.12,[.6,.59,.42]);
    const doorAngle=t>=43?Math.min(1,(t-43)/2)*Math.PI*.46:0,hinge=-.61;
    const doorX=hinge+.61*Math.cos(doorAngle),doorZ=3.5-.61*Math.sin(doorAngle)+(clock<doorUntil?Math.sin(clock*.06)*.015:0);
    b(doorX,.73,doorZ,1.22,1.46,.08,'wood',doorAngle);b(doorX,1.99,doorZ,1.22,.64,.08,'wood',doorAngle);
    for(const side of [-.46,.46])b(doorX+side*Math.cos(doorAngle),1.57,doorZ-side*Math.sin(doorAngle),.3,.22,.08,'wood',doorAngle);
    b(doorX+.42*Math.cos(doorAngle),1,doorZ-.06-.42*Math.sin(doorAngle),.16,.025,.04,'paper',doorAngle);
    // One indistinct human silhouette. No face, name or execution method is assigned.
    const intruderZ=t<43?5.7:5.7-Math.min(3.1,(t-43)*.3);const shift=t>=43?Math.sin(t*5)*.025:0;
    b(shift,1.55,intruderZ,.25,.3,.25,'dark');b(shift,1.06,intruderZ,.47,.65,.28,'dark');
    for(const side of [-.16,.16]){b(shift+side,.42,intruderZ,.15,.72,.18,'dark');b(shift+side*1.9,1.03,intruderZ,.13,.66,.16,'dark');}
    // Original local records and phone occupy opposite sides of the room.
    b(0,.81,-2.48,1.8,.1,.85,'wood');for(const x of [-.75,.75])for(const z of [-2.8,-2.16])b(x,.39,z,.07,.78,.07,'metal');
    b(0,1.24,-2.55,.9,.64,.38,'dark');b(0,1.25,-2.347,.76,.47,.015,'screen');for(let i=0;i<5;i++)b(-.08,1.40-i*.06,-2.335,.49-(i%2)*.15,.012,.01,[.52,.68,.56]);
    b(0,.94,-2.5,.2,.17,.15,'dark');b(0,.89,-2.18,.8,.03,.18,'dark');b(-.68,.89,-2.5,.27,.015,.3,'paper');
    b(0,2.89,-1.5,1.15,.06,.15,'paper');b(1.95,.77,-.5,.65,.08,1.4,'wood');for(const z of [-1.05,.05])b(1.95,.35,z,.08,.7,.08,'metal');
    if(state.stage==='room'){b(1.95,.83,-.3,.15,.027,.28,'dark');b(1.95,.848,-.3,.12,.005,.19,[.3,.47,.38]);}
    b(-1.91,.85,-2,.7,1.65,1.6,'metal');b(-1.91,.31,-1.19-(panel?.2:0),.6,.48,.07,'dark');b(-1.91,.45,-1.12,.34,.03,.025,'paper');
    if(panel){b(-1.91,.18,-1.06,.42,.13,.27,'dark');for(const x of [-2,-1.93,-1.86])b(x,.23,-.91,.025,.025,.02,[.34,.75,.43]);}
    // The wall view is a dramatic reconstruction; the original accounts do not show the sealing operation.
    if(['sealed','ended'].includes(state.stage)){b(-1.98,1.5,0,.12,3,7,[.32,.31,.28]);for(let z=-3;z<3;z+=.35)b(-2.32,.01,z,.11,.03,.17,'wood');}
    if(state.stage!=='room'){
      const sy=Math.sin(player.yaw),cy=Math.cos(player.yaw),side=['sealed','ended'].includes(state.stage)?0:.15;
      const x=player.x+sy*.38+cy*side,z=player.z-cy*.38+sy*side,y=player.height-.25+Math.sin(player.pitch)*.2;
      b(x,y-.11,z,.15,.17,.07,[.45,.34,.27],-player.yaw);b(x,y+.04,z,.145,.25,.022,'dark',-player.yaw);b(x-sy*.016,y+.06,z+cy*.016,.12,.19,.006,[1.5,2.3,1.8],-player.yaw);
    }
    return out;
  }
  function update(now){const dt=Math.min((now-last)/1000,.05);last=now;
    if(active&&!reader.open&&endedAt===null)clock+=dt*1000;
    const t=engine.elapsed(state,clock),previousStage=state.stage;engine.advance(state,clock);
    if(previousStage!==state.stage&&state.stage==='sealed'){player={x:-2.19,z:-.4,yaw:0,pitch:0,height:.55};keys.clear();$('#location').textContent='1104';say('……还有人吗？','周明川',6);sound('scrape');}
    if(active&&!reader.open){const f=Number(keys.has('w')||keys.has('arrowup')||keys.has('forward'))-Number(keys.has('s')||keys.has('arrowdown')||keys.has('back')),s=Number(keys.has('d')||keys.has('right'))-Number(keys.has('a')||keys.has('left')),norm=Math.max(1,Math.hypot(f,s));step(f/norm,s/norm,dt*1.6);turn((Number(keys.has('arrowright'))-Number(keys.has('arrowleft')))*dt*1.4,0);}
    if(state.stage==='calling'){
      const index=engine.call.findLastIndex(e=>e.at<=t);if(index!==currentLine&&index>=0){currentLine=index;const line=engine.call[index];say(line.text,line.speaker,index===4?10:7);retain('call-'+index,line.speaker,'<p>'+line.text+'</p>','1104 失联员工异常回访 · 2026-06-02 / 22:18');if(index===4)sound('door');}
      if(t>=45&&t<52&&Math.floor(t)!==intruderStep){intruderStep=Math.floor(t);sound('step');}
      if(t>52&&t<56)player.height=1.58-Math.min(1,(t-52)/3)*1.08;
    }
    const black=(state.stage==='calling'&&t>=56)||(endedAt!==null);
    $('#blackout').hidden=!black;$('#blackout').style.opacity=endedAt!==null?Math.min(1,(performance.now()-endedAt)/1800):'1';
    // Ending fade uses the display clock while the narrative clock remains paused.
    if(endedAt!==null&&performance.now()-endedAt>2300){$('#ended').hidden=false;active=false;$('#reticle').hidden=true;$('#pause').hidden=true;}
    const brightness=state.stage==='sealed'||state.stage==='ended'?.3:t>=43&&t<56?.54+Math.abs(Math.sin(t*2.2))*.34:1;
    renderer.render(player,geometry(t),brightness);
    const target=active&&!reader.open?engine.target(player,state.stage):null;$('#interact').hidden=!target;$('#interact').textContent=target?'E · '+target.name:'';$('#scene').dataset.target=target?target.id:'';
    $('#subtitle').textContent=clock<captionUntil?caption:'';$('#speaker').textContent=clock<captionUntil?speaker:'';
    canvas.dataset.position=[player.x.toFixed(3),player.z.toFixed(3),player.yaw.toFixed(3),player.pitch.toFixed(3)].join(',');canvas.dataset.stage=state.stage;
    requestAnimationFrame(update);
  }
  function begin(){active=true;last=performance.now();$('#gate').hidden=true;$('#paused').hidden=true;$('#ended').hidden=true;$('#controls').hidden=false;$('#pause').hidden=false;$('#reticle').hidden=false;$('#touch').hidden=false;startAudio();if(master)master.gain.value=muted?0:.16;canvas.focus();}
  function pause(){if(!active||reader.open||state.stage==='ended')return;active=false;drag=false;keys.clear();if(document.pointerLockElement)document.exitPointerLock();if(master)master.gain.value=0;$('#paused').hidden=false;$('#reticle').hidden=true;}
  function reset(){state=engine.create();player={x:0,z:.7,yaw:0,pitch:0,height:1.58};clock=0;currentLine=-1;intruderStep=-1;endedAt=null;panel=false;drag=false;doorUntil=0;footDistance=0;caption='';captionUntil=0;keys.clear();$('#location').textContent='1104 · 21:48';begin();}
  function leave(){active=false;keys.clear();if(master)master.gain.value=0;$('#paused').hidden=true;$('#ended').hidden=true;$('#gate').hidden=false;$('#controls').hidden=true;$('#pause').hidden=true;$('#reticle').hidden=true;$('#touch').hidden=true;$('#interact').hidden=true;$('#blackout').hidden=true;}
  $('#begin').onclick=()=>state.stage==='ended'?reset():begin();$('#resume').onclick=begin;$('#pause').onclick=pause;$('#restart').onclick=reset;$('#replay').onclick=reset;$('#leave').onclick=leave;$('#end-leave').onclick=leave;$('#interact').onclick=interact;
  $('#mute').onclick=()=>{muted=!muted;$('#mute').textContent=muted?'环境音：关':'环境音：开';if(master)master.gain.value=muted||!active?0:.16;};
  $('#notes').onclick=()=>open('留存记录',Object.values(records).map(e=>'<section><h3>'+e.title+'</h3><p class="date">'+e.source+'</p>'+e.body+'</section>').join('')||'<p>暂无记录。</p>');
  reader.addEventListener('close',()=>{keys.clear();canvas.focus();if(state.stage==='ended')endedAt=performance.now();});
  document.addEventListener('keydown',e=>{if(!active||reader.open)return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','pageup','pagedown','e','escape'].includes(k))e.preventDefault();if(k==='escape'){pause();return;}if(k==='e'){if(!e.repeat)interact();return;}keys.add(k);if(!e.repeat){if(k==='w'||k==='arrowup')step(1,0,.1);if(k==='s'||k==='arrowdown')step(-1,0,.1);if(k==='a')step(0,-1,.1);if(k==='d')step(0,1,.1);if(k==='arrowleft')turn(-.1,0);if(k==='arrowright')turn(.1,0);if(k==='pageup')turn(0,-.12);if(k==='pagedown')turn(0,.12);}});
  document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  canvas.addEventListener('pointerdown',e=>{if(active&&!reader.open){drag=true;pointer=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);}});
  canvas.addEventListener('pointermove',e=>{if(active&&!reader.open){if(document.pointerLockElement===canvas)turn(e.movementX*.003,e.movementY*.003);else if(drag){turn((e.clientX-pointer[0])*.003,(e.clientY-pointer[1])*.003);pointer=[e.clientX,e.clientY];}}});
  canvas.addEventListener('pointerup',()=>drag=false);canvas.addEventListener('pointercancel',()=>drag=false);canvas.addEventListener('dblclick',()=>{if(active&&!reader.open&&canvas.requestPointerLock){try{const p=canvas.requestPointerLock();if(p)p.catch(()=>{});}catch{}}});
  for(const b of document.querySelectorAll('[data-move]')){b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.move);});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys.delete(b.dataset.move));}
  requestAnimationFrame(update);
})();
