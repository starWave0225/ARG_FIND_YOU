// Isolated browser fixture: does not read or modify the author's browser save.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
let playwright;try{playwright=require('playwright')}catch{playwright=require(process.env.ARG_PLAYWRIGHT_MODULE || '/Users/qujunjie/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')}
const source=fs.readFileSync(path.join(__dirname,'../tests/village-npcs.test.cjs'),'utf8');
const fixture=vm.runInNewContext(source.slice(source.indexOf('const prologue ='),source.indexOf("test('Chinese"))+';thirdChapter');
const url=process.env.ARG_TEST_URL || 'http://127.0.0.1:4173/';
(async()=>{
 const browser=await playwright.chromium.launch({executablePath:process.env.ARG_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);
  await context.addInitScript(state=>{if(!localStorage.getItem('find-you-state-v1'))localStorage.setItem('find-you-state-v1',JSON.stringify(state));},{...fixture,playerName:'验收员',playerGender:'female'});
  await page.goto(url+'?view=village&scene=night-lane');await page.locator('#bootScreen').waitFor({state:'hidden'});
  const before=await page.evaluate(()=>JSON.stringify(ARGGame.getState()));
  await page.locator('[data-scene-detail="well"]').click();await page.screenshot({path:'/tmp/arg-well-depth.png'});
  await page.locator('[data-well-board]').click();
  assert.deepEqual(await page.locator('.well-poem-board p').allTextContents(),['寥寥星辰去','拂袖碍晚灯','初奇三月里','还忆夜雨声']);
  await page.screenshot({path:'/tmp/arg-well-poem.png'});
  await page.keyboard.press('Escape');assert.equal(await page.locator('[data-well-board]').isVisible(),true);
  await page.keyboard.press('Escape');assert.equal(await page.locator('#villageDetail').isVisible(),false);
  assert.equal(await page.evaluate(()=>JSON.stringify(ARGGame.getState())),before);
  await page.locator('[data-village-map]').click();await page.locator('[data-village-place="hall"]').first().click();await page.locator('[data-village-place="hall-interior"]').click();
  await page.locator('.pixel-scene > img').evaluate(img=>img.decode());
  await page.locator('.hall-lantern-rack img').evaluate(img=>img.decode());
  await page.screenshot({path:'/tmp/arg-lantern-scene.png'});
  await page.locator('[data-scene-detail="lanterns"]').click();
  await page.locator('#villageDetail .hall-lantern-photo').evaluate(img=>img.decode());
  assert.equal(await page.locator('#villageDetail .hall-lantern-photo').getAttribute('alt'),'四排旧纸灯笼，每排五盏。第一排全暗；第二排第三盏亮；第三排第二、三盏亮；第四排第二盏亮。四盏亮灯的烛光时明时暗。');
  await page.screenshot({path:'/tmp/arg-lantern-closeup.png'});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/arg-lantern-mobile.png'});
  assert.equal(await page.locator('#villageDetail').evaluate(n=>n.scrollWidth<=n.clientWidth),true);
  await page.locator('[data-detail-close]').click();
  await page.goto(url+'?view=village&scene=night-lane');await page.locator('#bootScreen').waitFor({state:'hidden'});
  await page.locator('[data-scene-detail="well"]').click();await page.locator('[data-well-board]').click();
  await page.screenshot({path:'/tmp/arg-well-poem-mobile.png'});
  assert.equal(await page.locator('#villageDetail').evaluate(n=>n.scrollWidth<=n.clientWidth),true);
  await page.setViewportSize({width:1440,height:1000});await page.locator('[data-detail-close]').click();
  await page.goto(url+'?view=village&scene=shrine');await page.locator('#bootScreen').waitFor({state:'hidden'});
  await page.locator('[data-village-place="hall-interior"]').click();await page.locator('[data-village-place="shrine"]').click();await page.locator('[data-ghost-statue="0"]').click();
  const bend=async(h,f,n=1)=>{for(let i=0;i<n;i++)await page.locator(`[data-ghost-finger="${h}:${f}"] .stone-pin`).click();};
  for(const [h,pose] of [[0,[0,1,1,0,0]],[1,[2,2,2,0,0]],[2,[0,1,0,0,0]],[3,[0,0,1,1,1]]])for(let f=0;f<5;f++)await bend(h,f,pose[f]);
  assert.equal(await page.evaluate(()=>ARGGame.getState().scenePuzzles.ghostHands.opened),false,'old 2713 is rejected');
  await bend(2,1,3);await bend(2,2);await bend(2,3);await bend(2,4);
  await bend(3,2,2);await bend(3,3);await bend(3,4);await bend(3,1);
  assert.equal(await page.evaluate(()=>ARGGame.getState().scenePuzzles.ghostHands.opened),true);
  await page.locator('[data-ghost-close]').click();await page.locator('.pixel-scene [data-ghost-cavity]').click();
  assert.equal(await page.locator('#shrineCompartment').isVisible(),true);
  await page.reload();await page.locator('#bootScreen').waitFor({state:'hidden'});
  assert.equal(await page.evaluate(()=>ARGGame.getState().scenePuzzles.ghostHands.opened),true);
  assert.deepEqual(await page.evaluate(()=>ARGGame.getState().storyProgress?.done || []),[]);
  assert.deepEqual(errors,[]);
  console.log('PASS well → poem → 4×5 lanterns; desktop/mobile; Escape; old 2713 rejected; 2731 opens; reload retains compartment; no main progress or browser errors.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
