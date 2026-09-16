const villagePage = new URLSearchParams(location.search).get('view') === 'village';
document.documentElement.classList.toggle('village-page', villagePage);
if (villagePage) document.title = '盛家村 · 现场调查';
const desktop = document.querySelector('#desktop');
const windows = [...document.querySelectorAll('.window')];
const modal = document.querySelector('#submissionModal');
const toast = document.querySelector('#toast');
const startMenu = document.querySelector('#startMenu');
const taskbarApps = [...document.querySelectorAll('.task-app')];
let zIndex = 20;
if (new URLSearchParams(location.search).has('reset')) {
  localStorage.removeItem('find-you-state-v1');
  history.replaceState(null, '', location.pathname);
}
let accepted = (() => {
  try { return Boolean(JSON.parse(localStorage.getItem('find-you-state-v1') || '{}').accepted); }
  catch { return false; }
})();
let windowInteraction = null;

const pageMeta = {
  story: ['调查流程', '按来源查阅材料，跨文档核验，留下你的调查记录。'],
  home: ['工作首页', '下午好。今天有 1 份新投稿等待处理。'],
  inbox: ['投稿箱', '来自观众的寻人申请与补充材料。'],
  cases: ['我的选题', '跟进已经建立的选题与人物联系进度。'],
  people: ['人物库', '检索公开资料，核对人物身份。'],
  evidence: ['证据墙', '整理人物、事件和资料之间的关系。'],
  'case-detail': ['QT-073', '寻找盛德昌 · 投稿人：匿名投稿人']
};

function focusWindow(win) {
  windows.forEach(item => item.classList.remove('is-active'));
  taskbarApps.forEach(item => item.classList.remove('is-active'));
  win.classList.add('is-active');
  win.style.zIndex = ++zIndex;
  const key = win.dataset.window;
  document.querySelector(`[data-task="${key}"]`)?.classList.add('is-active');
}

function openWindow(key, options = {}) {
  if (key === 'village' && !villagePage) {
    const url = new URL(location.href);
    url.search = ''; url.hash = '';
    url.searchParams.set('view', 'village');
    if (options.scene) url.searchParams.set('scene', options.scene);
    window.open(url.href, '_blank', 'noopener');
    return;
  }
  const win = document.querySelector(`[data-window="${key}"]`);
  if (!win) return;
  win.hidden = false;
  win.classList.add('is-open');
  const task = document.querySelector(`[data-task="${key}"]`);
  task?.classList.add('is-running');
  focusWindow(win);
  startMenu.classList.remove('is-open');
}

function closeWindow(win) {
  win.hidden = true;
  win.classList.remove('is-open', 'is-active', 'is-maximized');
  const task = document.querySelector(`[data-task="${win.dataset.window}"]`);
  task?.classList.remove('is-running', 'is-active');
}

function minimizeWindow(win) {
  win.hidden = true;
  win.classList.remove('is-open', 'is-active');
  document.querySelector(`[data-task="${win.dataset.window}"]`)?.classList.remove('is-active');
}

function getWindowBounds() {
  const desktopRect = desktop.getBoundingClientRect();
  return {
    left: desktopRect.left,
    top: desktopRect.top,
    width: desktopRect.width,
    height: desktopRect.height - 46
  };
}

function beginWindowDrag(event, win) {
  if (event.button !== 0 || win.classList.contains('is-maximized') || event.target.closest('button, input')) return;
  const rect = win.getBoundingClientRect();
  const bounds = getWindowBounds();
  windowInteraction = {
    type: 'drag', win,
    startX: event.clientX, startY: event.clientY,
    left: rect.left - bounds.left, top: rect.top - bounds.top,
    width: rect.width, height: rect.height
  };
  win.classList.add('is-moving');
  event.preventDefault();
}

function beginWindowResize(event, win, direction) {
  if (event.button !== 0 || win.classList.contains('is-maximized')) return;
  const rect = win.getBoundingClientRect();
  const bounds = getWindowBounds();
  windowInteraction = {
    type: 'resize', direction, win,
    startX: event.clientX, startY: event.clientY,
    left: rect.left - bounds.left, top: rect.top - bounds.top,
    width: rect.width, height: rect.height
  };
  focusWindow(win);
  win.classList.add('is-resizing');
  event.preventDefault();
  event.stopPropagation();
}

function moveWindow(event) {
  if (!windowInteraction) return;
  const state = windowInteraction;
  const bounds = getWindowBounds();
  const dx = event.clientX - state.startX;
  const dy = event.clientY - state.startY;

  if (state.type === 'drag') {
    const visibleGrip = 90;
    const left = Math.min(bounds.width - visibleGrip, Math.max(-(state.width - visibleGrip), state.left + dx));
    const top = Math.min(bounds.height - 35, Math.max(0, state.top + dy));
    Object.assign(state.win.style, { left: `${left}px`, top: `${top}px` });
    return;
  }

  const minWidth = state.win.dataset.window === 'workbench' ? 760 : 440;
  const minHeight = state.win.dataset.window === 'workbench' ? 500 : 300;
  let left = state.left;
  let top = state.top;
  let width = state.width;
  let height = state.height;
  const direction = state.direction;

  if (direction.includes('e')) width = Math.min(bounds.width - left, Math.max(minWidth, state.width + dx));
  if (direction.includes('s')) height = Math.min(bounds.height - top, Math.max(minHeight, state.height + dy));
  if (direction.includes('w')) {
    const right = state.left + state.width;
    left = Math.max(0, Math.min(right - minWidth, state.left + dx));
    width = right - left;
  }
  if (direction.includes('n')) {
    const bottom = state.top + state.height;
    top = Math.max(0, Math.min(bottom - minHeight, state.top + dy));
    height = bottom - top;
  }

  Object.assign(state.win.style, {
    left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px`
  });
}

function endWindowInteraction() {
  if (!windowInteraction) return;
  windowInteraction.win.classList.remove('is-moving', 'is-resizing');
  windowInteraction = null;
}

function setupWindowInteractions(win) {
  if (villagePage && win.dataset.window === 'village') return;
  const titlebar = win.querySelector('.window-titlebar, .browser-chrome');
  titlebar?.addEventListener('pointerdown', event => beginWindowDrag(event, win));
  titlebar?.addEventListener('dblclick', event => {
    if (!event.target.closest('button, input')) win.classList.toggle('is-maximized');
  });

  ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw'].forEach(direction => {
    const handle = document.createElement('span');
    handle.className = `resize-handle resize-handle--${direction}`;
    handle.setAttribute('aria-hidden', 'true');
    handle.addEventListener('pointerdown', event => beginWindowResize(event, win, direction));
    win.appendChild(handle);
  });
}

function showPage(page) {
  document.querySelectorAll('[data-page-panel]').forEach(panel => panel.classList.toggle('is-visible', panel.dataset.pagePanel === page));
  document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('is-active', item.dataset.page === page));
  document.querySelector('#pageTitle').textContent = pageMeta[page][0];
  document.querySelector('#pageSubtitle').textContent = page === 'home' && window.ARGGame?.getState().playerName
    ? `下午好，${window.ARGGame.getState().playerName}。今天有 1 份新投稿等待处理。`
    : pageMeta[page][1];
}

function openSubmission() {
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.querySelector('#inboxBadge').style.display = 'none';
}

function closeModal() {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
}

document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => openWindow(button.dataset.open)));
document.querySelectorAll('[data-open-submission]').forEach(button => button.addEventListener('click', openSubmission));
document.querySelectorAll('[data-close-modal]').forEach(button => button.addEventListener('click', closeModal));
document.querySelectorAll('.nav-item[data-page]').forEach(button => button.addEventListener('click', () => showPage(button.dataset.page)));
document.querySelectorAll('[data-page-link]').forEach(button => button.addEventListener('click', () => showPage(button.dataset.pageLink)));

windows.forEach(win => {
  setupWindowInteractions(win);
  win.addEventListener('pointerdown', () => focusWindow(win));
  win.querySelectorAll('[data-action]').forEach(button => {
    button.addEventListener('click', event => {
      event.stopPropagation();
      const action = button.dataset.action;
      if (action === 'close') closeWindow(win);
      if (action === 'minimize') minimizeWindow(win);
      if (action === 'maximize') win.classList.toggle('is-maximized');
    });
  });
});

document.addEventListener('pointermove', moveWindow);
document.addEventListener('pointerup', endWindowInteraction);
document.addEventListener('pointercancel', endWindowInteraction);

taskbarApps.forEach(button => button.addEventListener('click', () => {
  const win = document.querySelector(`[data-window="${button.dataset.task}"]`);
  if (!win.classList.contains('is-open')) openWindow(button.dataset.task);
  else if (win.classList.contains('is-active')) minimizeWindow(win);
  else focusWindow(win);
}));

document.querySelector('#startButton').addEventListener('click', event => {
  event.stopPropagation();
  startMenu.classList.toggle('is-open');
});
startMenu.addEventListener('click', event => event.stopPropagation());
desktop.addEventListener('click', () => startMenu.classList.remove('is-open'));
document.querySelector('#showDesktop').addEventListener('click', () => windows.forEach(minimizeWindow));

document.querySelectorAll('.check-box').forEach(button => button.addEventListener('click', () => {
  button.classList.toggle('is-checked');
  button.closest('li').classList.toggle('is-muted');
}));

document.querySelector('#acceptSubmission').addEventListener('click', event => {
  if (accepted) { closeModal(); showPage('cases'); return; }
  accepted = true;
  try {
    const saved = JSON.parse(localStorage.getItem('find-you-state-v1') || '{}');
    localStorage.setItem('find-you-state-v1', JSON.stringify({ ...saved, accepted: true }));
  } catch {}
  event.currentTarget.textContent = '进入选题';
  event.currentTarget.classList.add('is-done');
  const badge = document.querySelector('#inboxBadge');
  badge.style.display = 'none';
  toast.classList.add('is-shown');
  renderCases();
  setTimeout(() => toast.classList.remove('is-shown'), 3600);
});

function renderCases() {
  const cases = [
    ...(accepted ? [['QT-073', '盛家村的旧日故人', '寻找故友', '资料核查', '刚刚']] : []),
    ['QT-071', '写在旧车票背面的人', '寻找故友', '联系中', '今天 11:24'],
    ['QT-068', '晚风', '寻找亲人', '待确认', '昨天 17:40'],
    ['QT-063', '那年洪水以后', '寻找恩人', '已找到', '8月20日']
  ];
  document.querySelector('#fullCaseTable').innerHTML = `
    <div class="case-row case-row--head"><span>编号 / 选题</span><span>类型</span><span>进度</span><span>最后更新</span></div>
    ${cases.map(item => `<div class="case-row ${item[0] === 'QT-073' ? 'case-row--clickable' : ''}" data-case="${item[0]}"><div><b>${item[0]}</b><strong>${item[1]}</strong></div><span>${item[2]}</span><span class="status ${item[3] === '已找到' ? 'status--done' : item[3] === '待确认' ? 'status--verify' : 'status--contact'}">${item[3]}</span><time>${item[4]}</time></div>`).join('')}
  `;
}

document.querySelector('#peopleSearchForm').addEventListener('submit', event => {
  event.preventDefault();
  const name = document.querySelector('#personName').value.trim();
  const extra = document.querySelector('#personExtra').value.trim();
  if (window.ARGGame?.handlePeopleSearch?.(name, extra)) return;
  const result = document.querySelector('#searchResult');
  if (!name) { result.innerHTML = '<div class="result-note">请先输入需要核查的人名。</div>'; return; }
  result.innerHTML = accepted && name === '盛德昌'
    ? '<div class="result-note"><strong>结果过多，暂时无法确认。</strong><br>“盛德昌”共有 18 条同名记录。请补充地区、曾用单位或年龄信息。</div>'
    : `<div class="result-note">没有找到能够直接确认“${name.replace(/[<>]/g, '')}”身份的记录。请检查姓名或补充辅助信息。</div>`;
});

document.querySelector('#archiveSearch').addEventListener('submit', event => {
  event.preventDefault();
  window.ARGGame?.handleArchiveSearch?.(document.querySelector('#archiveQuery').value.trim());
});

document.querySelector('#noticeButton').addEventListener('click', () => {
  toast.querySelector('strong').textContent = '没有新的系统通知';
  toast.querySelector('p').textContent = '投稿箱里还有 1 份未读内容。';
  toast.classList.add('is-shown');
  setTimeout(() => toast.classList.remove('is-shown'), 2600);
});

function updateClock() {
  const now = new Date();
  const time = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const date = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
  document.querySelector('#clock strong').textContent = time;
  document.querySelector('#clock span').textContent = date;
  document.querySelector('#fullDate').textContent = `${now.getMonth() + 1}月${now.getDate()}日`;
}

renderCases();
updateClock();
setInterval(updateClock, 30000);
setTimeout(() => document.querySelector('#bootScreen').classList.add('is-gone'), 900);

window.desktopAPI = {
  openWindow,
  closeWindow,
  showPage,
  openSubmission,
  closeModal,
  renderCases,
  syncAccepted(value) { accepted = Boolean(value); renderCases(); },
  showToast(title, copy) {
    toast.querySelector('strong').textContent = title;
    toast.querySelector('p').textContent = copy;
    toast.classList.add('is-shown');
    setTimeout(() => toast.classList.remove('is-shown'), 3200);
  }
};
