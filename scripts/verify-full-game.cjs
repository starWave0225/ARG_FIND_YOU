// Optional real-browser acceptance run. Uses an isolated context and no seeded save.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
let playwright;try{playwright=require('playwright')}catch{playwright=require(process.env.ARG_PLAYWRIGHT_MODULE || '/Users/qujunjie/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')}
const testSource=fs.readFileSync(path.join(root,'tests/story-flow.test.cjs'),'utf8');
const {answers,codes}=vm.runInNewContext(testSource.slice(testSource.indexOf('const answers ='),testSource.indexOf('function boot('))+';({answers,codes})');
(async()=>{
 const browser=await playwright.chromium.launch({executablePath:process.env.ARG_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 let page;
 try{
  const context=await browser.newContext({viewport:{width:1600,height:1050}});
  page=await context.newPage();page.setDefaultTimeout(10000);
  const errors=[];context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));page.on('pageerror',e=>errors.push(e.message));
  const click=async selector=>page.locator(selector+':visible').first().click();
  const close=async win=>click(`#window-${win} [data-action="close"]`);
  const search=async query=>{if(await page.locator('[data-search-results]:visible').count())await click('[data-search-results]');await page.locator('#archiveQuery').fill(query);await page.locator('#archiveQuery').press('Enter');};
  await page.goto(process.env.ARG_TEST_URL || 'http://127.0.0.1:4173/');await page.locator('#bootScreen').waitFor({state:'hidden'});
  assert.equal(await page.evaluate(()=>localStorage.getItem('find-you-state-v1')),null);
  await click('[data-player-gender="female"]');await page.locator('#playerName').fill('林予安');await click('#identityForm [type="submit"]');
  await click('[data-open-submission]');await click('#acceptSubmission');
  if(await page.locator('#submissionModal[aria-hidden="false"]').count())await click('#acceptSubmission');
  await click('.nav-item[data-page="cases"]');await click('[data-case="QT-073"]');await click('[data-open-envelope]');
  for(const clue of ['envelopeFactory','envelopePostcode'])await click(`[data-record-clue="${clue}"]`);await close('artifact');
  await click('[data-case-tool="archive"]');await search('435160');await click('[data-search-document="postal-1993"]');await click('[data-search-record="postal"]');
  await search('东岚农机厂');await click('[data-search-document="factory-register"]');await click('[data-search-record="factory"]');
  await search('东岚机电二厂');await click('[data-search-document="factory-home"]');await click('[data-open-factory-photo]');
  await page.locator('#workerNumberInput').fill('0717');await page.locator('#workerNumberInput').press('Enter');await close('artifact');
  await click('[data-open-password]');await page.locator('#zipPassword').fill('0717');await page.locator('#zipPassword').press('Enter');await close('archive');
  await click('.nav-item[data-page="people"]');await page.locator('#personName').fill('盛德昌');await page.locator('#personExtra').fill('荣川');await page.locator('#personExtra').press('Enter');await click('[data-add-candidate]');
  await click('.nav-item[data-page="evidence"]');for(const id of ['renamedFactory','workerNumber','movedRongchuan'])await click(`[data-evidence-id="${id}"]`);await click('[data-submit-conclusion]');
  await click('.nav-item[data-page="cases"]');await click('[data-case="QT-073"]');await click('[data-confirm-target]');await click('[data-send-result]');await click('[data-confirm-send]');
  await click('[data-open-next-message]');await click('[data-start-chapter-one]');
  for(const id of ['clinicPhoto','clinicCard']){await click(`[data-remote-find="${id}"]`);await click('#window-files [data-open-remote]');}
  await page.locator('#remoteClinicAnswer').fill('县卫校');await page.locator('#remoteClinicAnswer').press('Enter');await click('#window-files [data-story-open]');
  // Bringing the workbench forward must not require programmatic state or UI changes.
  console.log('PASS new identity, anonymous submission, envelope, open search, factory, candidate, evidence, first send and remote chapter');
  const steps=await page.evaluate(()=>StoryConfig.main);
  for(const step of steps){
   if(await page.locator('[data-story-current]:visible').count())await click('[data-story-current]');
   assert.equal(await page.locator('#storyPuzzle').getAttribute('data-step'),step.id);
   for(const id of step.docs){
    await click(`.story-investigation [data-story-doc="${id}"]`);
    if(await page.locator('#storyUnlock').count()){await page.locator('#storyUnlock input').fill(codes[id]);await page.locator('#storyUnlock input').press('Enter');}
    const collect=page.locator(`#storyReader [data-story-collect="${id}"]`);if(await collect.isEnabled())await collect.click();await click('#storyReader [data-story-close]');
   }
   for(let i=0;i<answers[step.id].length;i++){const field=page.locator(`#storyPuzzle [name="a${i}"]`);if(await field.evaluate(n=>n.tagName)==='SELECT')await field.selectOption(answers[step.id][i]);else await field.fill(answers[step.id][i]);}
   if(step.order)for(let i=0;i<step.order.length;i++)await page.locator(`#storyPuzzle [name="order${i}"]`).selectOption(step.order[i]);
   for(const box of await page.locator('#storyPuzzle input[type="checkbox"]').all())await box.check();
   await click('#storyPuzzle .story-submit');if(step.send)await click(`[data-story-send="${step.id}"]`);
   assert.equal(await page.evaluate(id=>StoryFlow.completed(id),step.id),true);
   if(step.id==='DEPART'){
    const popup=context.waitForEvent('page');await click('[data-story-place="entrance"]');const village=await popup;await village.waitForLoadState();await village.locator('#bootScreen').waitFor({state:'hidden'});assert.match(village.url(),/view=village/);await village.locator('.npc-hitbox').click();assert.equal(await village.locator('#npcDialogue').getAttribute('open'),'');await village.locator('[data-npc-close]').click();await village.close();
   }
   console.log('PASS '+step.id);
  }
  assert.equal(await page.locator('.story-ending').count(),1);assert.match(await page.locator('.story-ending').innerText(),/林予安/);
  await click('.story-ending [data-story-section="letters"]');assert.equal(await page.locator('.story-letter').count(),9);
  await click('.story-letter[data-story-doc="J09"]');await click('#storyReader [data-story-close]');
  await page.reload();await page.locator('#bootScreen').waitFor({state:'hidden'});await click('.nav-item[data-page="story"]');
  assert.equal(await page.locator('.story-ending').count(),1);
  assert.equal(await page.evaluate(()=>ARGGame.getState().storyProgress.done.some(id=>id.startsWith('X'))),false);
  assert.deepEqual(errors,[]);await page.screenshot({path:'/tmp/arg-full-game-ending.png'});
  console.log('PASS complete fresh game → publication, separate village tab, nine letters, ending, reload, no HM dependency or page errors');
 }catch(error){if(page)await page.screenshot({path:'/tmp/arg-full-game-failure.png'}).catch(()=>{});throw error;}finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
