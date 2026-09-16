(() => {
  'use strict';
  const NEGATIVE='./assets/effects/afterimage-child-negative-v1.png';
  const POSITIVE='./assets/effects/afterimage-child-positive-v1.png';
  const HALL='./assets/pixel/environments/ancestral-hall-interior-v1.png';
  const choices={child:'一个孩子的脸',adult:'一个成年人的脸',none:'什么也没看清'};
  const poem=['寥寥星辰去','拂袖碍晚灯','初奇三月里','还忆夜雨声'];
  const lanternPhoto='./assets/pixel/environments/hall-lanterns-realistic-v1.png';
  // Lamp centers measured against the finished photograph, not the surrounding wall.
  const candleLights=[
    {row:2,col:3,x:49.6,y:39.4,duration:3.7,delay:-.8},
    {row:3,col:2,x:32.9,y:60.7,duration:4.3,delay:-2.6},
    {row:3,col:3,x:49.7,y:60.7,duration:3.2,delay:-1.4},
    {row:4,col:2,x:32.9,y:82,duration:4.7,delay:-3.5}
  ];
  let api,dialog,detail,timer=null,audio=null;
  function lanternMarkup(){
    return `<span class="hall-lantern-art"><img class="hall-lantern-photo" src="${lanternPhoto}" alt="四排旧纸灯笼，每排五盏。第一排全暗；第二排第三盏亮；第三排第二、三盏亮；第四排第二盏亮。四盏亮灯的烛光时明时暗。" decoding="async" />${candleLights.map(lamp=>`<span class="lantern-flicker" data-lantern-light="${lamp.row}:${lamp.col}" aria-hidden="true" style="--lamp-x:${lamp.x}%;--lamp-y:${lamp.y}%;--flicker-duration:${lamp.duration}s;--flicker-delay:${lamp.delay}s"></span>`).join('')}</span>`;
  }
  function closeDetail(){if(detail?.open)detail.close();}
  function showDetail(kind){
    const scene=kind==='well'?'night-lane':'hall-interior';
    if(!api?.getState().chapterThreeStarted || !api.getState().sent || !document.querySelector(`[data-scene="${scene}"]`))return;
    detail.dataset.kind=kind;
    detail.setAttribute('aria-label',kind==='well'?'井口检视':'祠堂灯笼');
    detail.innerHTML=`<header><span>${kind==='well'?'中央夜巷 · 井口':'盛家宗祠 · 灯笼'}</span><button data-detail-close aria-label="关闭检视">×</button></header>${kind==='well'?`<div class="well-depth"><div class="well-stone-ring" aria-hidden="true"></div><button class="well-board-object" data-well-board aria-label="查看井内木板"><span aria-hidden="true">木板</span></button></div>`:`<div class="hall-lantern-closeup">${lanternMarkup()}</div>`}`;
    if(!detail.open)detail.showModal();
    detail.querySelector(kind==='well'?'[data-well-board]':'[data-detail-close]').focus();
  }
  function showBoard(){
    if(detail.dataset.kind!=='well'||!detail.open)return;
    detail.dataset.kind='board';detail.setAttribute('aria-label','井内木板');
    detail.innerHTML=`<header><span>井内木板</span><button data-detail-close aria-label="关闭检视">×</button></header><div class="well-board-stage"><article class="well-poem-board" aria-label="木板上的四句诗">${poem.map(line=>`<p>${[...line].map(char=>`<span>${char}</span>`).join('')}</p>`).join('')}</article></div><footer><button data-well-return>放回井内</button></footer>`;
    detail.querySelector('[data-well-return]').focus();
  }
  function syncDetail(){
    if(!detail?.open)return;
    const scene=detail.dataset.kind==='lanterns'?'hall-interior':'night-lane';
    if(!api.getState().chapterThreeStarted||!api.getState().sent||!document.querySelector(`[data-scene="${scene}"]`))closeDetail();
  }
  function clearTimer(){window.clearTimeout(timer);timer=null;}
  function phase(value){dialog.dataset.phase=value;}
  function cancel(){clearTimer();if(dialog?.open)dialog.close();}
  function bell(){
    if(!audio)return;
    const now=audio.currentTime;
    for(const [hz,volume] of [[440,.045],[880,.018],[1320,.008]]){
      const oscillator=audio.createOscillator(),gain=audio.createGain();
      oscillator.type='sine';oscillator.frequency.value=hz;
      gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.02);gain.gain.exponentialRampToValueAtTime(.0001,now+2.5);
      oscillator.connect(gain);gain.connect(audio.destination);oscillator.start(now);oscillator.stop(now+2.6);
      oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
    }
  }
  function start(){
    clearTimer();phase('watch');
    // Resume audio only from the explicit click, never on arrival or tab restoration.
    try{const Audio=window.AudioContext||window.webkitAudioContext;if(Audio){audio ||= new Audio();audio.resume().catch(()=>{});}}catch{}
    timer=window.setTimeout(()=>{
      phase('echo');bell();
      timer=window.setTimeout(()=>{phase('answer');dialog.querySelector('[data-afterimage-answer]').focus();},8500);
    },32000);
  }
  function openAfterimage(){
    if(!api?.getState().chapterThreeStarted)return;
    cancel();
    dialog.innerHTML=`<div class="afterimage-plate"><img class="afterimage-room" src="${HALL}" alt="宗祠供桌" /><img class="afterimage-signal" src="${NEGATIVE}" alt="" aria-hidden="true" /><span class="afterimage-ember" aria-hidden="true"></span><div class="afterimage-blank" aria-hidden="true"><img class="afterimage-echo" src="${POSITIVE}" alt="" /></div></div>
      <button class="afterimage-exit" data-afterimage-exit aria-label="结束观察">×</button>
      <section class="afterimage-note"><small>供桌下压着的纸条</small><p>“香已经断过两次。重新点上以后，看着火头，别回头。等门外那声钟。”</p><button data-afterimage-start>重新点香</button></section>
      <section class="afterimage-answer"><small>观察记录</small><h2>灯灭以后，你看见了什么？</h2><div>${Object.entries(choices).map(([key,label])=>`<button data-afterimage-answer="${key}">${label}</button>`).join('')}</div></section>
      <section class="afterimage-result"><p>观察已记录。</p><button data-afterimage-start>再看一次</button><button data-afterimage-exit>返回宗祠</button></section>`;
    phase('ready');dialog.showModal();dialog.querySelector('[data-afterimage-start]').focus();
  }
  function record(answer){
    if(dialog.dataset.phase!=='answer'||!Object.hasOwn(choices,answer))return;
    const current=api.getState();
    api.saveState({sceneObservations:{...current.sceneObservations,afterimage:{answer,matched:answer==='child',observedAt:new Date().toISOString()}}});
    phase('result');dialog.querySelector('.afterimage-result [data-afterimage-exit]').focus();
  }
  function shrineMarkup(){return `<svg class="shrine-animation" viewBox="0 0 1672 941" aria-hidden="true">
    <g class="buddha-tears" fill="none" stroke="#929b8c" stroke-linecap="square">
      <path class="tear-track" d="M493 262 L493 271 L491 279 L492 289 L491 300" stroke-width="3" />
      <path class="tear-track tear-track--second" d="M539 261 L540 272 L539 282 L541 294" stroke-width="2.5" />
      <rect class="tear-drop" x="489.5" y="270" width="3" height="5" fill="#b5b8a2" stroke="none" />
      <rect class="tear-drop tear-drop--second" x="539" y="270" width="2.5" height="4" fill="#a6aa98" stroke="none" />
    </g>
    <g class="guanyin-eyes" fill="#969684" stroke="#292e28" stroke-width="1.5">
      <path d="M1126 263 L1129 260 L1138 260 L1143 264 L1139 268 L1131 268 Z" />
      <path d="M1160 264 L1164 260 L1172 260 L1177 263 L1173 268 L1165 268 Z" />
      <path d="M1133 260 H1137 V268 H1133 Z M1166 260 H1170 V268 H1166 Z" fill="#171f19" stroke="none" />
    </g>
  </svg>`;}
  window.VillageEffects={
    init(callbacks){
      api=callbacks;
      detail=document.createElement('dialog');detail.id='villageDetail';detail.className='village-detail';document.body.append(detail);
      detail.addEventListener('click',event=>{
        if(event.target.closest('[data-detail-close]'))closeDetail();
        if(event.target.closest('[data-well-board]'))showBoard();
        if(event.target.closest('[data-well-return]'))showDetail('well');
      });
      detail.addEventListener('cancel',event=>{if(detail.dataset.kind==='board'){event.preventDefault();showDetail('well');}});
      document.addEventListener('arg-state-changed',syncDetail);
      dialog=document.createElement('dialog');dialog.id='afterimageRitual';dialog.className='afterimage-ritual';dialog.setAttribute('aria-label','宗祠观察');document.body.append(dialog);
      dialog.addEventListener('close',()=>{clearTimer();phase('closed');});
      dialog.addEventListener('cancel',clearTimer);
      document.addEventListener('visibilitychange',()=>{if(document.hidden&&dialog.open)cancel();});
      window.addEventListener('pagehide',()=>{clearTimer();audio?.close();});
      document.addEventListener('click',event=>{
        const button=event.target.closest('button');if(!button)return;
        if(['well','lanterns'].includes(button.dataset.sceneDetail))showDetail(button.dataset.sceneDetail);
        if(button.hasAttribute('data-scene-ritual'))openAfterimage();
        if(button.hasAttribute('data-afterimage-start'))start();
        if(button.hasAttribute('data-afterimage-exit'))cancel();
        if(button.dataset.afterimageAnswer)record(button.dataset.afterimageAnswer);
        if(button.dataset.sceneEffect){
          const kind=button.dataset.sceneEffect;if(!['buddha','guanyin'].includes(kind))return;
          const surface=document.querySelector('[data-scene="shrine"] .pixel-scene');if(!surface)return;
          surface.classList.remove('plays-'+kind);void surface.offsetWidth;surface.classList.add('plays-'+kind);
        }
      });
    },
    mount(scene,stage){
      if(scene==='shrine'&&!api?.getState().sceneFlags?.shrineGhost)stage.insertAdjacentHTML('beforeend',shrineMarkup());
      if(scene==='hall-interior')stage.insertAdjacentHTML('beforeend',`<button class="hall-lantern-rack" data-scene-detail="lanterns" aria-label="查看祠堂灯笼">${lanternMarkup()}</button>`);
      syncDetail();
    },
    observation(){const value=api?.getState().sceneObservations?.afterimage;return value&&Object.hasOwn(choices,value.answer)?value:null;},
    files(){return this.observation()?[{id:'scene-afterimage',type:'记',title:'宗祠_熄灯后的观察记录',meta:'现场观察 · 未确定身份'}]:[];},
    body(id){if(id!=='scene-afterimage')return '';const value=this.observation();return value?`<span class="document-kicker">宗祠 · 现场观察</span><h2>熄灯后的观察记录</h2><p>重新点香并观察香头。钟响、灯灭以后，我看见：${choices[value.answer]}。</p><p>这份记录只保留当时的观察，不认定面孔对应的身份。</p>`:'';}
  };
})();
