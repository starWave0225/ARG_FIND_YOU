const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');

function boot(t) {
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), {
    url: 'http://127.0.0.1:4173/', runScripts: 'outside-only'
  });
  const w = dom.window, d = w.document;
  w.open = (...args) => { w.lastOpenedTab = args; };
  for (const file of ['styles.css', 'pixel-desktop.css', 'story-flow.css']) {
    const style = d.createElement('style');
    style.textContent = fs.readFileSync(path.join(root, file), 'utf8');
    d.head.append(style);
  }
  w.eval(fs.readFileSync(path.join(root, 'app.js'), 'utf8'));
  t.after(() => w.close());
  return { w, d, display: win => w.getComputedStyle(win).display };
}

test('workbench minimizes visibly, restores from taskbar, closes and reopens from desktop', t => {
  const { w, d, display } = boot(t);
  const win = d.querySelector('#window-workbench');
  const task = d.querySelector('[data-task="workbench"]');
  assert.equal(display(win), 'flex');
  win.querySelector('[data-action="minimize"]').click();
  assert.equal(display(win), 'none');
  assert.equal(task.classList.contains('is-running'), true);
  assert.equal(task.classList.contains('is-active'), false);
  task.click();
  assert.equal(display(win), 'flex');
  win.querySelector('[data-action="maximize"]').click();
  assert.equal(win.classList.contains('is-maximized'), true);
  win.querySelector('[data-action="minimize"]').click();
  assert.equal(display(win), 'none');
  task.click();
  assert.equal(display(win), 'flex');
  assert.equal(win.classList.contains('is-maximized'), true);
  win.querySelector('[data-action="close"]').click();
  assert.equal(display(win), 'none');
  assert.equal(task.classList.contains('is-running'), false);
  assert.equal(win.classList.contains('is-maximized'), false);
  d.querySelector('.desktop-icon[data-open="workbench"]').click();
  assert.equal(display(win), 'flex');
  assert.equal(task.classList.contains('is-running'), true);
  task.click();
  assert.equal(display(win), 'none');
});

test('every window hides on minimize/close; show desktop hides all open windows', t => {
  const { w, d, display } = boot(t);
  for (const win of d.querySelectorAll('.window:not(#window-village)')) {
    assert.deepEqual([...win.querySelectorAll('.window-actions button')].map(button => button.dataset.action), ['minimize', 'maximize', 'close'], win.id);
    w.desktopAPI.openWindow(win.dataset.window);
    assert.equal(display(win), 'flex', win.id);
    win.querySelector('[data-action="minimize"]').click();
    assert.equal(display(win), 'none', win.id);
    w.desktopAPI.openWindow(win.dataset.window);
    win.querySelector('[data-action="close"]').click();
    assert.equal(display(win), 'none', win.id);
    w.desktopAPI.openWindow(win.dataset.window);
  }
  d.querySelector('#showDesktop').click();
  for (const win of d.querySelectorAll('.window')) assert.equal(display(win), 'none', win.id);
});

test('village opens in a separate tab instead of an internal desktop window', t => {
  const {w,d,display}=boot(t);
  w.desktopAPI.openWindow('village', {scene:'entrance'});
  assert.equal(display(d.querySelector('#window-village')),'none');
  const [url,target,features]=w.lastOpenedTab;
  assert.equal(new URL(url).searchParams.get('view'),'village');
  assert.equal(new URL(url).searchParams.get('scene'),'entrance');
  assert.equal(target,'_blank');assert.equal(features,'noopener');
});
