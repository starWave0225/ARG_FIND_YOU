const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '..');
const storageKey = 'find-you-state-v1';
const prologue = {
  playerGender: 'female', accepted: true, envelopeOpened: true,
  clues: ['envelopeFactory', 'envelopePostcode', 'postalArea', 'renamedFactory', 'workerNumber', 'movedRongchuan'],
  legacyOpened: true, rosterUnlocked: true, personFound: true, confirmed: true, sent: true,
  chapterOneStarted: true, villageFinds: [], clinicSolved: false
};

const thirdChapter = { ...prologue, storyFlowVersion: 2, chapterThreeStarted: true };

test('Chinese hand counting covers all digits, hook nine and both common three gestures', t => {
  const game=boot(t);
  const poses=[[2,2,0,0,0],[0,1,0,0,0],[0,1,1,0,0],[0,0,1,1,1],[0,1,1,1,1],[1,1,1,1,1],[1,0,0,0,1],[2,2,2,0,0],[1,1,0,0,0],[0,3,0,0,0]];
  poses.forEach((pose,digit)=>assert.equal(game.window.GhostHands.numeral(pose),digit));
  assert.equal(game.window.GhostHands.numeral([0,1,1,1,0]),3);
  assert.equal(game.window.GhostHands.numeral([2,1,0,0,0]),null);
  assert.notEqual(game.window.GhostHands.renderHand(poses[0]),game.window.GhostHands.renderHand(poses[7]));
  assert.notEqual(game.window.GhostHands.renderHand(poses[1]),game.window.GhostHands.renderHand(poses[9]));
});

test('village motives are available through NPC conversation without borrowing or HM prerequisites', t => {
  const game = boot(t);
  for (const [scene, topic, id] of [['entrance','faith','V01'],['lane','incense','V02']]) {
    game.visit(scene);
    game.click(`[data-npc-topic="${topic}"]`);
    game.click(`#npcDialogue [data-story-doc="${id}"]`);
    assert.equal(game.document.querySelector('#storyReader').open, true);
    assert.match(game.document.querySelector('#storyReader').textContent, id === 'V01' ? /为儿盛雄求嗣/ : /结余 180/);
    game.click('[data-story-close]');
  }
  assert.deepEqual(Array.from(game.state().npcDocuments), []);
  assert.deepEqual(Array.from(game.state().storyProgress?.done || []), []);
  assert.equal(game.state().sceneFlags?.shrineGhost, undefined);
});

function boot(t, saved = thirdChapter, scene = '') {
  const errors = [];
  const console = new VirtualConsole();
  console.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), {
    url: 'https://find-you.test/?view=village' + (scene ? '&scene=' + scene : ''), runScripts: 'outside-only', virtualConsole: console
  });
  const { window } = dom;
  // jsdom has no native dialog UI. Shim only its open/close events for logic tests;
  // top-layer focus, Escape and layout remain browser-only behavior.
  window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  window.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); this.dispatchEvent(new window.Event('close')); };
  if (saved) window.localStorage.setItem(storageKey, JSON.stringify(saved));
  for (const file of ['app.js', 'village-npcs.js', 'village-scenes.js', 'village-effects.js', 'ghost-hands.js', 'search-keywords.js', 'story-documents.js', 'story-config.js', 'story-flow.js', 'archive-search.js', 'game.js']) window.eval(fs.readFileSync(path.join(root, file), 'utf8'));
  const document = window.document;
  const click = selector => {
    const element = document.querySelector(selector);
    assert.ok(element, `Missing control: ${selector}`);
    assert.equal(element.disabled, false, `Disabled control: ${selector}`);
    element.click();
  };
  const visit = scene => {
    if (document.querySelector('#npcDialogue').open) click('[data-npc-close]');
    if (document.querySelector('[data-village-map]')) click('[data-village-map]');
    click(`[data-village-place="${scene}"]`);
    click('.npc-hitbox');
  };
  const claim = () => {
    const first = document.querySelector('[data-npc-topic]');
    click(`[data-npc-topic="${first.dataset.npcTopic}"]`);
    click('[data-npc-topic="record"]');
    click('[data-npc-claim]');
  };
  t.after(() => { window.close(); assert.deepEqual(errors, [], 'No script/event errors'); });
  return { window, document, click, visit, claim, state: () => window.ARGGame.getState() };
}

test('new game has no village access or NPC documents', t => {
  const game = boot(t, null);
  assert.match(game.document.querySelector('#villageExplorer').textContent, /尚未建立/);
  assert.equal(game.document.querySelectorAll('[data-npc]').length, 0);
  assert.deepEqual(Array.from(game.state().npcDocuments), []);
});

test('end-of-prologue opens remote attachments, without village or NPC access', t => {
  const game = boot(t, { ...prologue, chapterOneStarted: false });
  game.click('[data-open-next-message]');
  game.click('[data-start-chapter-one]');
  assert.equal(game.state().chapterOneStarted, true);
  assert.equal(game.state().chapterThreeStarted, false);
  assert.equal(game.document.querySelectorAll('.village-map button').length, 0);
  assert.equal(game.document.querySelector('#window-village').classList.contains('is-open'), true);
  assert.match(game.document.querySelector('#filesView').textContent, /远程资料桌/);
  assert.equal(game.document.querySelector('#remoteClinicAnswer').disabled, true);
  game.click('[data-remote-find="clinicPhoto"]');
  assert.match(game.document.querySelector('.document-kicker').textContent, /匿名投稿人提供/);
  game.click('#filesView [data-open-remote]');
  assert.equal(game.document.querySelector('#remoteClinicAnswer').disabled, true);
  game.click('[data-remote-find="clinicCard"]');
  assert.match(game.document.querySelector('.document-kicker').textContent, /盛禾提供/);
  game.click('#filesView [data-open-remote]');
  game.document.querySelector('#remoteClinicAnswer').value = '荣川';
  game.document.querySelector('#remoteClinicConclusion').dispatchEvent(new game.window.Event('submit', { bubbles: true, cancelable: true }));
  assert.equal(game.state().clinicSolved, false);
  game.document.querySelector('#remoteClinicAnswer').value = '县卫校';
  game.document.querySelector('#remoteClinicConclusion').dispatchEvent(new game.window.Event('submit', { bubbles: true, cancelable: true }));
  assert.equal(game.state().clinicSolved, true);
  assert.deepEqual(Array.from(game.state().villageFinds), []);
  assert.equal(game.state().remoteFinds.length, 2);
  assert.equal(game.state().npcDocuments.length, 0);
  game.click('[data-remote-find="clinicCard"]');
  assert.equal(game.state().remoteFinds.length, 2);
  const restored = boot(t, JSON.parse(game.window.localStorage.getItem(storageKey)));
  assert.equal(restored.state().clinicSolved, true);
  assert.equal(restored.state().chapterThreeStarted, false);
  assert.equal(restored.document.querySelectorAll('.village-map button').length, 0);
});

test('legacy early visit preserves collected evidence but cannot bypass the new chapter gate', t => {
  const game = boot(t, { ...prologue, villageFinds: ['clinicCard', 'clinicPhoto'], clinicSolved: true, npcDocuments: ['npc-postal-route'] });
  assert.equal(game.state().chapterThreeStarted, false);
  assert.equal(game.state().clinicSolved, true);
  assert.equal(game.state().npcDocuments.length, 1);
  game.click('[data-open-remote]');
  game.click('[data-remote-find="clinicCard"]');
  assert.match(game.document.querySelector('.document-kicker').textContent, /现场原件检视/);
  assert.equal(game.state().remoteFinds.length, 0, 'Do not relabel legacy evidence as newly received remotely');
  game.click('#villageDesktopIcon');
  assert.equal(game.document.querySelectorAll('[data-village-place]').length, 0);
});

test('third-chapter fixture opens all six visit locations; remote evidence satisfies NPC conditions', t => {
  const game = boot(t, { ...thirdChapter, remoteFinds: ['clinicCard', 'clinicPhoto'], clinicSolved: true });
  game.click('[data-village-map]');
  assert.equal(game.document.querySelectorAll('.village-visits button').length, 6);
  assert.equal(game.document.querySelectorAll('.village-map button').length, 10);
  game.visit('lane');
  game.click('[data-npc-topic="names"]');
  assert.equal(game.document.querySelector('[data-npc-topic="record"]').disabled, false);
  game.visit('school');
  game.click('[data-npc-topic="photos"]');
  assert.equal(game.document.querySelector('[data-npc-topic="record"]').disabled, false);
});

test('third-chapter dialogue and save reload work; reading dialogue does not grant a file, claiming persists once', t => {
  const game = boot(t);
  game.visit('entrance');
  assert.match(game.document.querySelector('#npcSpeech').textContent, /节目组/);
  assert.equal(game.document.querySelector('[data-npc-topic="record"]').disabled, true);
  assert.equal(game.state().npcDocuments.length, 0);
  game.click('[data-npc-topic="route"]');
  game.click('[data-npc-topic="record"]');
  assert.equal(game.state().npcDocuments.length, 0);
  game.click('[data-npc-claim]');
  assert.deepEqual(Array.from(game.state().npcDocuments), ['npc-postal-route']);
  game.visit('entrance');
  game.click('[data-npc-topic="record"]');
  assert.equal(game.document.querySelector('[data-npc-claim]'), null);
  assert.equal(game.state().npcDocuments.length, 1);
  game.click('[data-npc-read]');
  assert.equal(game.document.querySelector('#npcDialogue').open, false);
  assert.match(game.document.querySelector('.case-document').textContent, /东岚支局乡邮投递路线摘页/);
  assert.match(game.document.querySelector('.document-source').textContent, /盛福根/);
  const restored = boot(t, JSON.parse(game.window.localStorage.getItem(storageKey)));
  restored.visit('entrance');
  assert.match(restored.document.querySelector('.npc-receipt').textContent, /已收入案卷/);
  assert.equal(restored.document.querySelector('[data-npc-topic="record"]').disabled, false);
});

test('shopkeeper and teacher require the existing clinic evidence; clinic puzzle still completes', t => {
  const game = boot(t);
  game.visit('lane');
  game.click('[data-npc-topic="names"]');
  assert.equal(game.document.querySelector('[data-npc-topic="record"]').disabled, true);
  game.visit('school');
  game.click('[data-npc-topic="photos"]');
  assert.equal(game.document.querySelector('[data-npc-topic="record"]').disabled, true);
  game.click('[data-npc-close]');
  game.click('[data-village-map]');
  game.click('[data-village-place="clinic"]');
  game.click('[data-scene-find="clinicCard"]');
  game.visit('lane');
  game.click('[data-npc-topic="record"]');
  game.click('[data-npc-claim]');
  game.click('[data-npc-close]');
  game.click('[data-village-map]');
  game.click('[data-village-place="clinic"]');
  game.click('[data-scene-find="clinicPhoto"]');
  game.click('[data-scene-clinic-records]');
  game.document.querySelector('#clinicAnswer').value = '县卫校';
  game.document.querySelector('#clinicConclusion').dispatchEvent(new game.window.Event('submit', { bubbles: true, cancelable: true }));
  assert.equal(game.state().clinicSolved, true);
  game.click('[data-close-scene-inspection]');
  game.visit('school');
  game.click('[data-npc-topic="record"]');
  game.click('[data-npc-claim]');
  game.click('[data-npc-read]');
  assert.match(game.document.querySelector('.case-document').textContent, /背面的字什么时候添的，这里没记/);
});

test('all six scene characters require a click to converse; environment interiors are explorable', t => {
  const game = boot(t, { ...thirdChapter, villageFinds: ['clinicCard', 'clinicPhoto', 'clinicConclusion'], clinicSolved: true });
  game.visit('service');
  game.click('[data-npc-topic="catalog"]');
  assert.equal(game.document.querySelector('[data-npc-topic="record"]').disabled, true);
  for (const scene of ['entrance', 'lane', 'school', 'hall', 'service', 'bridge']) {
    game.visit(scene);
    assert.ok(game.document.querySelector('.npc-hitbox'));
    if (scene === 'hall') {
      assert.ok(game.document.querySelector('[data-village-place="hall-interior"]'));
      assert.match(game.document.querySelector('.pixel-scene > img').src, /hall-encounter-wide/);
    }
    game.claim();
    game.click('[data-npc-read]');
    assert.ok(game.document.querySelector('.case-document h2').textContent);
    assert.match(game.document.querySelector('.document-source').textContent, /提供人/);
  }
  assert.equal(new Set(game.state().npcDocuments).size, 6);
  game.click('[data-files-back="case"]');
  assert.equal(game.document.querySelectorAll('#filesView [data-open-document^="npc-"]').length, 6);
  game.click('[data-village-map]');
  game.click('[data-village-place="forest"]');
  assert.match(game.document.querySelector('#villageExplorer img').src, /burned-forest-watch-hut/);
  assert.equal(game.document.querySelector('#npcDialogue').open, false);
});

test('malformed legacy NPC fields are normalized without crashing or granting unknown files', t => {
  const game = boot(t, { ...thirdChapter, npcTopics: null, npcDocuments: ['unknown', 'npc-postal-route', 'npc-postal-route'] });
  assert.deepEqual(Array.from(game.state().npcDocuments), ['npc-postal-route']);
  game.visit('entrance');
  assert.equal(game.document.querySelector('[data-npc-topic="record"]').disabled, true);
});

test('each NPC scene image exists and no public NPC text discloses the central family twist', t => {
  const game = boot(t);
  for (const npc of game.window.VillageCast) {
    assert.ok(fs.existsSync(path.join(root, npc.image)));
    const scene = game.window.VillageScenes[npc.scene];
    assert.notEqual(scene.image,npc.image);
    assert.ok(fs.existsSync(path.join(root,scene.image)));
    assert.ok(scene.npcBox[2]*scene.npcBox[3] < 700, 'NPC click region is a small part of the environment');
    assert.doesNotMatch(npc.greeting + JSON.stringify(npc.topics) + npc.document.body, /亲叔叔|双胞胎|纵火灭口|生父/);
  }
});

test('horror scene assets are reachable and the clinic changes visually without advancing a puzzle', t => {
  const game=boot(t,thirdChapter);
  for(const [scene,image] of [['arrival','village-entrance-dusk'],['night-lane','village-central-lane-night'],['hall-interior','ancestral-hall-interior'],['forest','burned-forest-watch-hut']]) {
    game.click('[data-village-map]');
    if(scene==='hall-interior'){game.click('[data-village-place="hall"]');}
    game.click(`[data-village-place="${scene}"]`);
    assert.match(game.document.querySelector('.pixel-scene > img').src,new RegExp(image));
    assert.equal(game.document.querySelector('#npcDialogue').open,false);
  }
  game.click('[data-village-map]');game.click('[data-village-place="clinic"]');
  const before=JSON.stringify(game.state().storyProgress);
  game.click('[data-scene-inspect="2"]');
  assert.equal(game.document.querySelector('#sceneInspection').open,true);
  assert.match(game.document.querySelector('.pixel-scene > img').src,/abandoned-clinic-anomaly/);
  assert.equal(JSON.stringify(game.state().storyProgress),before);
  game.click('[data-close-scene-inspection]');
  game.click('[data-scene-light]');assert.match(game.document.querySelector('.pixel-scene > img').src,/abandoned-clinic-interior/);
  game.click('[data-village-map]');game.click('[data-village-place="entrance"]');
  assert.equal(game.document.querySelectorAll('[data-npc]').length,1);
  assert.equal(game.document.querySelector('#npcDialogue').open,false);
  game.click('.npc-hitbox');assert.equal(game.document.querySelector('#npcDialogue').open,true);
  assert.match(game.document.querySelector('#npcDialogue figure img').src,/sheng-fugen/);
});

test('Buddha tears and Guanyin eyes animate only after touching their statues', t => {
  const game=boot(t);
  game.click('[data-village-map]');game.click('[data-village-place="hall"]');game.click('[data-village-place="hall-interior"]');game.click('[data-village-place="shrine"]');
  const scene=game.document.querySelector('.pixel-scene');
  assert.match(scene.querySelector('img').src,/old-buddhist-shrine/);
  assert.equal(scene.classList.contains('plays-buddha'),false);
  assert.equal(scene.classList.contains('plays-guanyin'),false);
  const before=JSON.stringify(game.state());
  game.click('[data-scene-effect="buddha"]');assert.ok(scene.classList.contains('plays-buddha'));
  game.click('[data-scene-effect="guanyin"]');assert.ok(scene.classList.contains('plays-guanyin'));
  assert.equal(JSON.stringify(game.state()),before);
});

test('original incense afterimage sequence records observation, cancels cleanly and never reveals identity', t => {
  const game=boot(t);
  game.click('[data-village-map]');game.click('[data-village-place="hall"]');game.click('[data-village-place="hall-interior"]');
  const pending=new Map();let sequence=0;
  game.window.setTimeout=(fn,delay)=>{pending.set(++sequence,{fn,delay});return sequence;};
  game.window.clearTimeout=id=>pending.delete(id);
  const advance=delay=>{const [id,item]=[...pending].find(([,value])=>value.delay===delay)||[];assert.ok(item);pending.delete(id);item.fn();};
  game.click('[data-scene-ritual]');
  const ritual=game.document.querySelector('#afterimageRitual');
  assert.match(ritual.textContent,/看着火头/);
  assert.doesNotMatch(ritual.textContent,/提高一点强度|反相|正相|许行远|双胞胎/);
  game.click('[data-afterimage-start]');assert.equal(ritual.dataset.phase,'watch');
  game.click('[data-afterimage-exit]');assert.equal(ritual.open,false);assert.equal(pending.size,0);
  assert.equal(game.state().sceneObservations,undefined);
  game.click('[data-scene-ritual]');game.click('[data-afterimage-start]');
  advance(32000);assert.equal(ritual.dataset.phase,'echo');
  advance(8500);assert.equal(ritual.dataset.phase,'answer');
  const before=JSON.stringify(game.state().storyProgress);
  game.click('[data-afterimage-answer="child"]');
  assert.equal(game.state().sceneObservations.afterimage.matched,true);
  assert.equal(JSON.stringify(game.state().storyProgress),before);
  assert.equal(ritual.dataset.phase,'result');game.click('.afterimage-result [data-afterimage-exit]');
  game.click('[data-scene-casefiles]');game.click('[data-open-document="scene-afterimage"]');
  assert.match(game.document.querySelector('.case-document').textContent,/一个孩子的脸/);
  assert.doesNotMatch(game.document.querySelector('.case-document').textContent,/许行远|双胞胎|亲叔叔/);
});


test('shrine changes both statues only after leaving and returning, and survives reload', t => {
  const game=boot(t,thirdChapter,'shrine');
  const image=()=>game.document.querySelector('.pixel-scene > img').src;
  const saved=()=>JSON.parse(game.window.localStorage.getItem(storageKey));
  const before=JSON.stringify(game.state().storyProgress);
  assert.equal(game.state().sceneFlags.shrineSeen,true);
  assert.equal(game.state().sceneFlags.shrineGhost,undefined);
  assert.doesNotMatch(image(),/ghost/);
  game.click('[data-scene-casefiles]');
  game.window.dispatchEvent(new game.window.StorageEvent('storage',{key:storageKey,storageArea:game.window.localStorage}));
  assert.doesNotMatch(image(),/ghost/);
  const refreshed=boot(t,saved(),'shrine');
  assert.equal(refreshed.state().sceneFlags.shrineGhost,undefined);
  game.click('[data-village-place="hall-interior"]');
  assert.equal(new URL(game.window.location.href).searchParams.get('scene'),'hall-interior');
  assert.equal(game.state().sceneFlags.shrineDeparted,true);
  assert.equal(game.state().sceneFlags.shrineGhost,undefined);
  const outside=boot(t,saved(),'hall-interior');
  assert.equal(outside.state().sceneFlags.shrineGhost,undefined);
  game.click('[data-village-place="shrine"]');
  assert.equal(game.state().sceneFlags.shrineGhost,true);
  assert.match(image(),/old-buddhist-shrine-ghost-v1/);
  assert.equal(game.document.querySelector('.shrine-animation'),null);
  assert.equal(game.document.querySelectorAll('[data-scene-effect]').length,0);
  game.click('[data-ghost-statue="0"]');
  assert.equal(game.document.querySelector('#ghostHandsPuzzle').open,true);
  game.click('[data-ghost-close]');game.click('[data-ghost-statue="1"]');
  assert.equal(game.document.querySelector('#ghostHandsPuzzle').open,true);
  assert.equal(JSON.stringify(game.state().storyProgress),before);
  const restored=boot(t,saved(),'shrine');
  assert.match(restored.document.querySelector('.pixel-scene > img').src,/ghost/);
  assert.equal(restored.state().playerGender,'female');
  assert.deepEqual(Array.from(restored.state().npcDocuments),[]);
});

test('map departure counts as leaving the shrine and old saves start with normal statues', t => {
  const game=boot(t,{...thirdChapter,sceneFlags:{clinicDark:true}},'shrine');
  assert.equal(game.state().sceneFlags.shrineGhost,undefined);
  game.click('[data-village-map]');
  game.click('[data-village-place="hall"]');game.click('[data-village-place="hall-interior"]');game.click('[data-village-place="shrine"]');
  assert.equal(game.state().sceneFlags.shrineGhost,true);
  assert.equal(game.state().sceneFlags.clinicDark,true);
});

test('stone fingers preserve partial poses, require all four gestures, and persist the open compartment', t => {
  const fixture={...thirdChapter,sceneFlags:{shrineGhost:true,shrineSeen:true,shrineDeparted:true,clinicDark:true}};
  const game=boot(t,fixture,'shrine');
  game.click('[data-ghost-statue="0"]');
  const finger=(g,hand,index)=>g.document.querySelector(`[data-ghost-finger="${hand}:${index}"]`);
  const turn=(g,hand,index,times=1)=>{for(let i=0;i<times;i++)finger(g,hand,index).dispatchEvent(new g.window.MouseEvent('click',{bubbles:true}));};
  assert.equal(game.document.querySelectorAll('[data-ghost-finger]').length,20);
  assert.doesNotMatch(game.document.querySelector('#ghostHandsPuzzle').textContent,/2713|2731|密码|提示|正确|错误/);
  turn(game,0,1);turn(game,0,2);
  assert.equal(game.state().scenePuzzles.ghostHands.opened,false);
  game.click('[data-ghost-close]');
  game.click('[data-village-place="hall-interior"]');game.click('[data-village-place="shrine"]');game.click('[data-ghost-statue="1"]');
  assert.equal(finger(game,0,1).dataset.pose,'1');
  const restored=boot(t,JSON.parse(game.window.localStorage.getItem(storageKey)),'shrine');
  restored.click('[data-ghost-statue="1"]');
  assert.equal(finger(restored,0,2).dataset.pose,'1');
  for(let f=0;f<3;f++)turn(restored,1,f,2);
  turn(restored,2,1);turn(restored,3,2);turn(restored,3,3);
  assert.equal(restored.state().scenePuzzles.ghostHands.opened,false);
  // Both the wrong 2714 and the former 2713 must stay closed.
  turn(restored,3,0);turn(restored,3,1);turn(restored,3,4);turn(restored,3,0,2);
  assert.equal(restored.state().scenePuzzles.ghostHands.opened,false);
  turn(restored,3,1,3);
  assert.equal(restored.state().scenePuzzles.ghostHands.opened,false);
  // Change the right statue to 3,1. No poem-reading or HM flag is required.
  turn(restored,2,1,3);turn(restored,2,2);turn(restored,2,3);turn(restored,2,4);
  assert.equal(restored.state().scenePuzzles.ghostHands.opened,false);
  turn(restored,3,2,2);turn(restored,3,3);turn(restored,3,4);turn(restored,3,1);
  assert.equal(restored.state().scenePuzzles.ghostHands.opened,true);
  assert.equal(restored.document.querySelectorAll('.ghost-cabinet.is-open').length,2);
  assert.equal(restored.document.querySelector('[data-ghost-cavity]').getAttribute('aria-label'),'查看暗格');
  const before=JSON.stringify(restored.state().scenePuzzles.ghostHands);
  turn(restored,0,1);assert.equal(JSON.stringify(restored.state().scenePuzzles.ghostHands),before);
  assert.equal(restored.state().storyProgress,undefined);
  assert.equal(restored.state().sceneFlags.clinicDark,true);
  const solved=boot(t,JSON.parse(restored.window.localStorage.getItem(storageKey)),'shrine');
  solved.click('[data-ghost-cavity]');
  assert.equal(solved.document.querySelector('#shrineCompartment').open,true);
  solved.click('[data-compartment-close]');assert.equal(solved.document.querySelector('#shrineCompartment').open,false);
});

test('stone mechanism normalizes old saves and synchronizes solved state without solving the main story', t => {
  const game=boot(t,{...thirdChapter,sceneFlags:{shrineGhost:true},scenePuzzles:{ghostHands:{hands:[['2',999,-1,null,2]]},other:{kept:true}}},'shrine');
  game.click('[data-ghost-statue="0"]');
  assert.ok([...game.document.querySelectorAll('[data-ghost-finger]')].every(el=>el.dataset.pose==='0'));
  const control=game.document.querySelector('[data-ghost-finger="0:1"]');
  control.dispatchEvent(new game.window.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
  assert.equal(game.state().scenePuzzles.ghostHands.hands[0][1],1);
  assert.equal(game.state().scenePuzzles.other.kept,true);
  const saved=JSON.parse(game.window.localStorage.getItem(storageKey));
  saved.scenePuzzles.ghostHands={hands:[[0,1,1,0,0],[2,2,2,0,0],[0,1,0,0,0],[0,0,1,1,1]],opened:true};
  game.window.localStorage.setItem(storageKey,JSON.stringify(saved));
  game.window.dispatchEvent(new game.window.StorageEvent('storage',{key:storageKey,storageArea:game.window.localStorage}));
  assert.equal(game.document.querySelector('#ghostHandsPuzzle').classList.contains('is-solved'),true);
  assert.equal(game.state().storyProgress,undefined);
});

const openShrine = {...thirdChapter,sceneFlags:{shrineGhost:true},scenePuzzles:{ghostHands:{opened:true}}};

test('well wood and fixed lantern positions form a separate spatial clue without granting progress',t=>{
  const g=boot(t,thirdChapter,'night-lane');
  const before=JSON.stringify(g.state());
  g.click('[data-scene-detail="well"]');
  assert.equal(g.document.querySelector('#villageDetail').open,true);
  assert.equal(g.document.querySelector('.well-poem-board'),null);
  g.click('[data-well-board]');
  const lines=[...g.document.querySelectorAll('.well-poem-board p')].map(p=>p.textContent);
  assert.deepEqual(lines,['寥寥星辰去','拂袖碍晚灯','初奇三月里','还忆夜雨声']);
  assert.equal(g.document.querySelectorAll('.well-poem-board p > span').length,20);
  assert.doesNotMatch(g.document.querySelector('#villageDetail').textContent,/2731|2713|密码|灯笼|提示/);
  g.click('[data-well-return]');g.click('[data-detail-close]');
  assert.equal(JSON.stringify(g.state()),before);
  g.click('[data-village-map]');g.click('[data-village-place="hall"]');g.click('[data-village-place="hall-interior"]');
  const scenePhoto=g.document.querySelector('.hall-lantern-rack .hall-lantern-photo');
  assert.ok(scenePhoto);
  assert.ok(fs.existsSync(path.join(root,scenePhoto.getAttribute('src'))));
  g.click('[data-scene-detail="lanterns"]');
  const closeup=g.document.querySelector('#villageDetail .hall-lantern-photo');
  assert.equal(closeup.src,scenePhoto.src);
  assert.equal(closeup.alt,'四排旧纸灯笼，每排五盏。第一排全暗；第二排第三盏亮；第三排第二、三盏亮；第四排第二盏亮。四盏亮灯的烛光时明时暗。');
  assert.equal(g.document.querySelector('#villageDetail svg'),null);
  assert.deepEqual([...g.document.querySelectorAll('#villageDetail [data-lantern-light]')].map(node=>node.dataset.lanternLight),['2:3','3:2','3:3','4:2']);
  assert.doesNotMatch(g.document.querySelector('#villageDetail').textContent,/2731|2713|碍奇三忆|密码|提示/);
  g.click('[data-detail-close]');
  const restored=boot(t,JSON.parse(g.window.localStorage.getItem(storageKey)),'hall-interior');
  assert.equal(restored.document.querySelector('.hall-lantern-rack .hall-lantern-photo').src,scenePhoto.src);
  assert.equal(g.state().scenePuzzles,undefined);
  assert.equal(g.state().storyProgress,undefined);
});

test('well inspection closes if another village tab revokes departure',t=>{
  const g=boot(t,thirdChapter,'night-lane');g.click('[data-scene-detail="well"]');g.click('[data-well-board]');
  const saved=JSON.parse(g.window.localStorage.getItem(storageKey));saved.chapterThreeStarted=false;
  g.window.localStorage.setItem(storageKey,JSON.stringify(saved));
  g.window.dispatchEvent(new g.window.StorageEvent('storage',{key:storageKey,storageArea:g.window.localStorage}));
  assert.equal(g.document.querySelector('#villageDetail').open,false);
});

test('compartment objects support independent sides, photographs, nested reading and safe persistent notes', t => {
  const g=boot(t,openShrine,'shrine');
  g.click('[data-ghost-cavity]');
  assert.equal(g.document.querySelectorAll('[data-evidence-object]').length,3);
  g.click('[data-evidence-object="V03"]');
  assert.match(g.document.querySelector('.evidence-paper').textContent,/为儿盛雄续愿/);
  assert.doesNotMatch(g.document.querySelector('.evidence-paper').textContent,/勿贴外榜/);
  assert.equal(g.state().storyProgress,undefined);
  g.click('[data-evidence-photo]');
  assert.deepEqual(Array.from(g.state().sceneEvidence.photos.V03),['front']);
  assert.equal(g.state().storyProgress,undefined,'One photo does not claim the unseen reverse');
  g.click('#shrineCompartment [data-story-doc="V03"]');
  assert.equal(g.document.querySelector('#storyReader').open,true);
  g.click('[data-story-close]');
  assert.equal(g.document.querySelector('#shrineCompartment').open,true);
  const note=g.document.querySelector('#evidenceNote');
  note.value='我的笔记：<img src=x onerror=alert(1)> 不替背面认笔迹。';
  note.dispatchEvent(new g.window.Event('input',{bubbles:true}));
  const restored=boot(t,JSON.parse(g.window.localStorage.getItem(storageKey)),'shrine');
  restored.click('[data-ghost-cavity]');restored.click('[data-evidence-object="V03"]');
  assert.equal(restored.document.querySelector('#evidenceNote').value,note.value);
  assert.equal(restored.document.querySelector('#evidenceNote img'),null);
  assert.equal(restored.document.querySelector('[data-evidence-photo]').disabled,true);
  restored.click('[data-evidence-flip]');
  assert.match(restored.document.querySelector('.evidence-paper').textContent,/勿贴外榜/);
  restored.click('[data-evidence-photo]');
  assert.ok(restored.window.StoryFlow.files().some(file=>file.id==='story:V03'));
  assert.deepEqual(Array.from(restored.state().storyProgress.done),[]);
  for(const id of ['V04','V05']) {
    restored.click('[data-evidence-putback]');restored.click(`[data-evidence-object="${id}"]`);
    restored.click('[data-evidence-flip]');restored.click('[data-evidence-photo]');
    restored.click('[data-evidence-flip]');restored.click('[data-evidence-photo]');
  }
  assert.deepEqual(Array.from(restored.state().storyProgress.collected),['V03','V04','V05']);
  assert.deepEqual(Array.from(restored.state().storyProgress.done),[]);
  restored.click('[data-compartment-close]');restored.click('[data-ghost-cavity]');
  assert.equal(restored.document.querySelector('#shrineCompartment').classList.contains('is-inspecting'),false);
});

test('evidence return conversations accept openly collected copies without requiring the shrine puzzle', t => {
  const g=boot(t);
  for(const [scene,topic,id] of [['entrance','wish-return','V03'],['lane','refund-return','V04'],['hall','cavity-return','V05'],['service','label-return','V05']]) {
    g.visit(scene);
    if(!(g.state().storyProgress?.collected || []).includes(id)) {
      assert.equal(g.document.querySelector(`[data-npc-topic="${topic}"]`),null,'No premature topic hint');
      g.window.StoryFlow.openDoc(id);g.click(`[data-story-collect="${id}"]`);g.click('[data-story-close]');
    }
    g.click(`[data-npc-topic="${topic}"]`);
    assert.equal(g.document.querySelector(`[data-npc-topic="${topic}"]`).getAttribute('aria-pressed'),'true');
    assert.ok(g.document.querySelector('#npcSpeech').textContent.length>90);
  }
  assert.equal(g.state().scenePuzzles,undefined);
  assert.equal(g.state().sceneEvidence,undefined,'Search must not fabricate on-site photos');
  assert.deepEqual(Array.from(g.state().storyProgress.done),[]);
});

test('compartment closes when another tab resets the mechanism and cannot manufacture photos', t => {
  const g=boot(t,openShrine,'shrine');
  g.click('[data-ghost-cavity]');g.click('[data-evidence-object="V05"]');
  const saved=JSON.parse(g.window.localStorage.getItem(storageKey));
  saved.scenePuzzles.ghostHands.opened=false;
  g.window.localStorage.setItem(storageKey,JSON.stringify(saved));
  g.window.dispatchEvent(new g.window.StorageEvent('storage',{key:storageKey,storageArea:g.window.localStorage}));
  assert.equal(g.document.querySelector('#shrineCompartment').open,false);
  g.click('[data-evidence-photo]');
  assert.equal(g.state().sceneEvidence,undefined);
});
