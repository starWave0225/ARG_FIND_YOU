(() => {
  'use strict';
  const BACKGROUND = './assets/pixel/environments/ghost-buddha-hands-closeup-v1.png';
  const COMPARTMENT = './assets/pixel/environments/shrine-compartment-v1.png';
  const evidence = [
    {id:'V03',label:'红线纸包',position:[14,42,20,32]},
    {id:'V04',label:'复写旧本',position:[37,46,30,30]},
    {id:'V05',label:'穿绳查验签',position:[71,45,18,31]}
  ];
  const MATERIAL = new URL('./assets/effects/stone-hand-material-v1.png', document.currentScript?.src || location.href).href;
  let materialBitmap = MATERIAL;
  // Render a coarse texture atlas in the browser so its pixel density matches
  // the scene. The generated source file stays unchanged.
  const materialImage = new Image();
  materialImage.onload = () => {
    try {
    const atlas=document.createElement('canvas');atlas.width=384;atlas.height=256;
    const context=atlas.getContext('2d');if(!context)return;
    context.drawImage(materialImage,0,0,384,256);
    materialBitmap=atlas.toDataURL('image/png');
    document.querySelectorAll('.stone-material-image').forEach(image=>image.setAttribute('href',materialBitmap));
    } catch { /* File previews can retain the original texture if canvas export is unavailable. */ }
  };
  materialImage.src=MATERIAL;
  const names = ['拇指','食指','中指','无名指','小指'];
  const positions = ['左像外侧手','左像内侧手','右像内侧手','右像外侧手'];
  const poses = ['弯曲','伸直','合拢','勾曲'];
  const maxPose = finger => finger === 1 ? 3 : finger < 3 ? 2 : 1;
  // Chinese one-handed numerals, ordered by the four physical hands on screen.
  // 7 joins thumb, index and middle fingertips. These values are never rendered.
  const numerals = [
    [0,[0,0,0,0,0]],[0,[2,2,0,0,0]],
    [1,[0,1,0,0,0]],[2,[0,1,1,0,0]],
    [3,[0,0,1,1,1]],[3,[0,1,1,1,0]],
    [4,[0,1,1,1,1]],[5,[1,1,1,1,1]],
    [6,[1,0,0,0,1]],[7,[2,2,2,0,0]],
    [8,[1,1,0,0,0]],[9,[0,3,0,0,0]]
  ];
  const numeral = fingers => numerals.find(([,pose])=>pose.every((value,i)=>value===fingers[i]))?.[0] ?? null;
  let api, dialog, cavity, selected=null, face='front', last = '', sound;
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const evidenceState = () => {
    const value=api.getState().sceneEvidence || {};
    return {photos:value.photos || {},notes:value.notes || {}};
  };
  const photographed = id => {
    const value=evidenceState().photos[id];
    return Array.isArray(value)?[...new Set(value.filter(side=>['front','back'].includes(side)))]:[];
  };
  function renderEvidence() {
    const pane=cavity.querySelector('.compartment-inspection');
    cavity.classList.toggle('is-inspecting',Boolean(selected));
    if (!selected) {pane.hidden=true;pane.innerHTML='';return;}
    pane.hidden=false;
    const doc=window.StoryDocuments[selected];
    const sides=doc.body.split('<h3>背面</h3>');
    const body=(face==='front'?sides[0].replace('<h3>正面</h3>',''):sides[1]) || '';
    const photos=photographed(selected), captured=photos.includes(face);
    pane.innerHTML=`<header><div><small>物件检视 · ${face==='front'?'正面':'背面'}</small><h2>${esc(doc.title)}</h2></div><button data-evidence-putback>放回</button></header><div class="evidence-paper" tabindex="0">${body}</div><div class="evidence-actions"><button data-evidence-flip>翻到${face==='front'?'背面':'正面'}</button><button data-evidence-photo ${captured?'disabled':''}>${captured?'本面已拍摄':'拍摄本面'}</button><button data-story-doc="${selected}">查看整理全文</button></div><p class="evidence-status" role="status">${photos.length===2?'双面照片已收入案卷。':captured?'本面照片已保存。':''}</p><label for="evidenceNote">个人笔记</label><textarea id="evidenceNote" maxlength="2000" rows="3">${esc(evidenceState().notes[selected])}</textarea><small class="evidence-note-state" aria-live="polite"></small>`;
  }
  function openCompartment() {
    if (!inShrine() || !read().opened) return;
    if(cavity.open)return;
    selected=null;face='front';cavity.classList.remove('is-inspecting');
    cavity.innerHTML=`<header><span>旧佛堂 · 壁内暗格</span><button data-compartment-close aria-label="关闭暗格">×</button></header><div class="compartment-layout"><div class="compartment-stage"><img src="${COMPARTMENT}" alt="暗格石台上放着红线纸包、复写旧本和穿绳查验签"/>${evidence.map(item=>`<button class="scene-object" data-evidence-object="${item.id}" aria-label="查看${item.label}" style="left:${item.position[0]}%;top:${item.position[1]}%;width:${item.position[2]}%;height:${item.position[3]}%"><span>${item.label}</span></button>`).join('')}</div><section class="compartment-inspection" aria-label="物件检视" hidden></section></div>`;
    cavity.showModal();
  }
  function photograph() {
    if(!cavity.open || !selected || !inShrine() || !read().opened)return;
    const current=evidenceState(),photos=[...new Set([...photographed(selected),face])];
    api.saveState({sceneEvidence:{...current,photos:{...current.photos,[selected]:photos}}});
    if(photos.length===2)window.StoryFlow.collect(selected);
    renderEvidence();
    cavity.querySelector('[data-evidence-flip]').focus();
  }
  function read() {
    const value = api?.getState().scenePuzzles?.ghostHands || {};
    return {
      hands: Array.from({length:4}, (_,hand) => Array.from({length:5}, (_,finger) => {
        const n = value.hands?.[hand]?.[finger];
        return Number.isInteger(n) && n >= 0 && n <= maxPose(finger) ? n : 0;
      })),
      opened: value.opened === true
    };
  }
  function inShrine() {
    const state = api?.getState();
    return state?.chapterThreeStarted && state.sent && state.sceneFlags?.shrineGhost && document.querySelector('[data-scene="shrine"]');
  }
  function stoneSound(opening) {
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      sound ||= new Audio();
      sound.resume().catch(()=>{});
      const oscillator=sound.createOscillator(), gain=sound.createGain(), now=sound.currentTime;
      oscillator.type='triangle';oscillator.frequency.setValueAtTime(opening?68:145,now);
      oscillator.frequency.exponentialRampToValueAtTime(opening?30:70,now+(opening?1.2:.09));
      gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(opening?.055:.022,now+.015);
      gain.gain.exponentialRampToValueAtTime(.0001,now+(opening?1.5:.12));
      oscillator.connect(gain);gain.connect(sound.destination);oscillator.start(now);oscillator.stop(now+(opening?1.6:.15));
      oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
    } catch {}
  }
  // Bent fingers are chains of phalanges, with a rotating thumb and shared contact
  // point for 7. Control hit regions are a separate top layer, never hidden by skin.
  function bones(finger,pose,hand) {
    if(finger===0) {
      if(pose===1)return [[61,181],[43,158],[26,139],[10,129]];
      if(pose===2)return [[61,181],[42,156],[55,126],[78,105],[97,96]];
      return [[61,181],[48,165],[60,151],[84,156]];
    }
    if(pose===3)return [[76,144],[72,107],[73,64],[80,42],[99,39],[112,49],[111,66]];
    if(pose===2) {
      if(finger===1 && hand[2]!==2)return [[76,144],[68,106],[72,78],[88,65],[105,70],[113,84],[97,96]];
      return finger===1 ? [[76,144],[65,116],[70,87],[84,80],[97,96]]
        : [[106,139],[115,111],[114,85],[103,79],[97,96]];
    }
    const straight=[null,[[76,144],[73,106],[70,68],[69,34]],[[106,139],[106,98],[108,56],[110,22]],[[135,144],[139,106],[143,70],[144,38]],[[161,151],[172,121],[180,95],[185,70]]];
    const folded=[null,[[76,144],[70,124],[75,117],[85,129],[84,148]],[[106,139],[101,118],[107,110],[117,123],[116,145]],[[135,144],[132,126],[139,119],[148,132],[144,153]],[[161,151],[160,138],[166,132],[175,143],[169,160]]];
    return pose===1 ? straight[finger] : folded[finger];
  }
  function line(points){return points.map((p,i)=>`${i?'L':'M'}${p.join(' ')}`).join(' ');}
  // Sample the generated statue-hand sheet in SVG. This keeps each finger movable
  // while its visible surface uses the same bitmap material as the surrounding art.
  const materials = [
    {palm:[275,440,325,325],wrist:[315,785,260,180],finger:[392,135,52,330]},
    {palm:[1000,440,325,325],wrist:[1040,785,260,180],finger:[1120,135,52,330]}
  ];
  function materialPart(source,x,y,width,height,index) {
    return `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${source.join(' ')}" preserveAspectRatio="none" overflow="hidden"><use href="#stone-texture-${index}"/></svg>`;
  }
  function fingerArt(finger,pose,hand,index,material) {
    const points=bones(finger,pose,hand),width=finger===0?24:finger===4?17:21;
    const path=line(points);
    const segments=points.slice(0,-1).map((p,i)=>{
      const next=points[i+1],length=Math.hypot(next[0]-p[0],next[1]-p[1]),angle=Math.atan2(next[1]-p[1],next[0]-p[0])*180/Math.PI-90;
      const id=`stone-segment-${index}-${finger}-${i}`;
      const source=[material.finger[0],material.finger[1]+i*37,material.finger[2],Math.max(45,length*2.8)];
      return `<g transform="translate(${p.join(' ')}) rotate(${angle})"><defs><clipPath id="${id}"><rect x="${-width/2}" y="${-width/2}" width="${width}" height="${length+width}" rx="${width/2}"/></clipPath></defs><g clip-path="url(#${id})">${materialPart(source,-width/2,-width/2,width,length+width,index)}</g></g>`;
    }).join('');
    const joints=points.slice(1,-1).map((p,i)=>{
      const next=points[i+2],prev=points[i],angle=Math.atan2(next[1]-prev[1],next[0]-prev[0]),dx=Math.sin(angle)*width*.25,dy=-Math.cos(angle)*width*.25;
      return `<path class="stone-crease" d="M${p[0]-dx} ${p[1]-dy} L${p[0]+dx} ${p[1]+dy}"/>`;
    }).join('');
    return `<g class="stone-digit" style="--finger-width:${width}px"><path class="digit-outline" d="${path}"/>${segments}${joints}</g>`;
  }
  function handArt(hand,index) {
    const order=[4,3,2,1,0],material=materials[Number(index)>=2?1:0];
    const palm='M64 118 Q76 108 104 109 L146 116 Q169 125 174 146 L169 177 Q164 193 151 203 L140 215 L85 214 Q61 204 53 183 L49 160 Q48 137 64 118 Z';
    const wrist='M83 197 Q108 184 146 197 L145 244 H83 Z';
    return `<defs><image id="stone-texture-${index}" class="stone-material-image" href="${materialBitmap}" width="1536" height="1024"/><clipPath id="stone-palm-${index}"><path d="${palm}"/></clipPath><clipPath id="stone-wrist-${index}"><path d="${wrist}"/></clipPath><linearGradient id="stone-join-${index}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="white"/><stop offset=".65" stop-color="white"/><stop offset="1" stop-color="black"/></linearGradient><mask id="stone-join-mask-${index}" maskUnits="userSpaceOnUse" x="70" y="190" width="90" height="54"><rect x="70" y="190" width="90" height="54" fill="url(#stone-join-${index})"/></mask></defs>
      <g clip-path="url(#stone-wrist-${index})" mask="url(#stone-join-mask-${index})">${materialPart(material.wrist,80,191,70,56,index)}</g>
      <g clip-path="url(#stone-palm-${index})">${materialPart(material.palm,47,107,130,110,index)}</g>
      ${order.map(f=>fingerArt(f,hand[f],hand,index,material)).join('')}`;
  }
  function fingerMarkup(finger,pose,hand) {
    const [x,y]=[[49,172],[76,145],[107,141],[137,148],[163,157]][finger];
    return `<path class="finger-hit" d="${line(bones(finger,pose,hand))}"/><rect class="stone-pin" x="${x-10}" y="${y-9}" width="20" height="18"/>`;
  }
  function handMarkup(hand) {
    return `<svg class="ghost-hand ghost-hand--${hand}" viewBox="0 0 200 250" role="group" aria-label="${positions[hand]}" ><g class="hand-art" aria-hidden="true"></g><g class="hand-controls">${names.map((name,finger)=>`<g class="ghost-finger" role="button" tabindex="0" data-ghost-finger="${hand}:${finger}"></g>`).join('')}</g></svg>`;
  }
  function cabinetMarkup(opened, wide=false) {
    return `<div class="ghost-cabinet ${wide?'ghost-cabinet--wide':''} ${opened?'is-open':''}" aria-hidden="true"><div class="ghost-recess"><span></span></div><div class="ghost-stone-door"></div></div>`;
  }
  function sync() {
    if(cavity?.open && (!inShrine() || !read().opened)) cavity.close();
    if (!dialog?.open) return;
    if (!inShrine()) {dialog.close();return;}
    const puzzle=read(), signature=JSON.stringify(puzzle);
    if (signature===last) return;
    last=signature;
    dialog.querySelectorAll('.ghost-hand').forEach((svg,i)=>{const pose=puzzle.hands[i].join(',');if(svg.dataset.materialPose!==pose){svg.querySelector('.hand-art').innerHTML=handArt(puzzle.hands[i],i);svg.dataset.materialPose=pose;}});
    for (const control of dialog.querySelectorAll('[data-ghost-finger]')) {
      const [hand,finger]=control.dataset.ghostFinger.split(':').map(Number), pose=puzzle.hands[hand][finger];
      control.innerHTML=fingerMarkup(finger,pose,puzzle.hands[hand]);
      control.dataset.pose=String(pose);
      control.setAttribute('aria-label', `${positions[hand]} · ${names[finger]} · ${poses[pose]}`);
      control.setAttribute('aria-disabled',String(puzzle.opened));
      control.setAttribute('tabindex',puzzle.opened?'-1':'0');
    }
    dialog.querySelector('.ghost-cabinet').classList.toggle('is-open',puzzle.opened);
    dialog.classList.toggle('is-solved',puzzle.opened);
    dialog.querySelector('[data-ghost-cavity]').hidden=!puzzle.opened;
    dialog.querySelector('[role="status"]').textContent=puzzle.opened?'石板已经移开。':'';
  }
  function open(statue=0) {
    if (!inShrine()) return;
    if (!dialog.open) {
      dialog.innerHTML=`<header><span>旧佛堂</span><button data-ghost-close aria-label="关闭鬼佛近景">×</button></header><div class="ghost-mechanism-scroll"><div class="ghost-mechanism"><img class="ghost-mechanism-bg" src="${BACKGROUND}" alt="两尊鬼佛伸出的四只石手，中央为石板"/>${cabinetMarkup(false)}<button class="scene-object ghost-cavity-target ghost-cavity-target--close" data-ghost-cavity aria-label="查看暗格" hidden><span>暗格</span></button>${[0,1,2,3].map(handMarkup).join('')}</div></div><p class="ghost-mechanism-status" role="status"></p>`;
      last='';dialog.showModal();sync();
    }
    if (read().opened) dialog.querySelector('[data-ghost-close]').focus();
    else dialog.querySelector(`[data-ghost-finger="${statue===1?2:0}:1"]`).focus();
  }
  function bend(control) {
    if (!dialog?.open || !inShrine()) return;
    const puzzle=read();if(puzzle.opened)return;
    const [hand,finger]=control.dataset.ghostFinger.split(':').map(Number);
    if(!Number.isInteger(hand)||hand<0||hand>3||!Number.isInteger(finger)||finger<0||finger>4)return;
    puzzle.hands[hand][finger]=(puzzle.hands[hand][finger]+1)%(maxPose(finger)+1);
    puzzle.opened=puzzle.hands.map(numeral).join(',')==='2,7,3,1';
    const key=control.dataset.ghostFinger;
    api.saveState({scenePuzzles:{...api.getState().scenePuzzles,ghostHands:puzzle}});
    sync();stoneSound(puzzle.opened);
    if(puzzle.opened)dialog.querySelector('[data-ghost-close]').focus();
    else dialog.querySelector(`[data-ghost-finger="${key}"]`).focus();
  }
  window.GhostHands={
    open,
    // Author-only inspection of the same gesture rig; not a player hint panel.
    numeral,
    renderHand(pose, key='demo') {return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 250" class="ghost-hand" style="position:static;width:200px;">${handArt(pose,key)}</svg>`;},
    init(callbacks) {
      api=callbacks;
      dialog=document.createElement('dialog');dialog.id='ghostHandsPuzzle';dialog.className='ghost-hands-dialog';dialog.setAttribute('aria-label','鬼佛石手机关');document.body.append(dialog);
      cavity=document.createElement('dialog');cavity.id='shrineCompartment';cavity.className='shrine-compartment';cavity.setAttribute('aria-label','壁内暗格');document.body.append(cavity);
      cavity.addEventListener('click',event=>{
        if(event.target.closest('[data-compartment-close]')){cavity.close();return;}
        if(!inShrine() || !read().opened)return;
        const object=event.target.closest('[data-evidence-object]');
        if(object && evidence.some(item=>item.id===object.dataset.evidenceObject)) {selected=object.dataset.evidenceObject;face='front';renderEvidence();cavity.querySelector('.evidence-paper').focus();return;}
        if(event.target.closest('[data-evidence-putback]')){const id=selected;selected=null;renderEvidence();cavity.querySelector(`[data-evidence-object="${id}"]`).focus();return;}
        if(event.target.closest('[data-evidence-flip]')){face=face==='front'?'back':'front';renderEvidence();cavity.querySelector('[data-evidence-flip]').focus();return;}
        if(event.target.closest('[data-evidence-photo]'))photograph();
      });
      cavity.addEventListener('input',event=>{
        if(event.target.id!=='evidenceNote' || !selected || !inShrine() || !read().opened)return;
        const current=evidenceState();
        api.saveState({sceneEvidence:{...current,notes:{...current.notes,[selected]:event.target.value.slice(0,2000)}}});
        cavity.querySelector('.evidence-note-state').textContent='已保存';
      });
      document.addEventListener('click',event=>{
        const finger=event.target.closest('[data-ghost-finger]');
        if(finger){bend(finger);return;}
        if(event.target.closest('[data-ghost-close]')){dialog.close();return;}
        const statue=event.target.closest('[data-ghost-statue]');
        if(statue)open(Number(statue.dataset.ghostStatue));
        if(event.target.closest('[data-ghost-cavity]'))openCompartment();
      });
      dialog.addEventListener('keydown',event=>{
        const finger=event.target.closest('[data-ghost-finger]');
        if(finger&&['Enter',' '].includes(event.key)){event.preventDefault();if(!event.repeat)bend(finger);}
      });
      document.addEventListener('arg-state-changed',sync);
      window.addEventListener('pagehide',()=>{sound?.close();sound=null;});
    },
    mount(scene,stage) {
      if(scene!=='shrine'||!api?.getState().sceneFlags?.shrineGhost)return;
      const puzzle=read();
      stage.insertAdjacentHTML('beforeend',cabinetMarkup(puzzle.opened,true));
      if(puzzle.opened)stage.insertAdjacentHTML('beforeend','<button class="scene-object ghost-cavity-target" data-ghost-cavity aria-label="查看暗格"><span>暗格</span></button>');
    }
  };
})();
