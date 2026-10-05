(() => {
  'use strict';
  const SAVE = 'find-you-state-v1', META = 'find-you-cloud-v1', BACKUP = 'find-you-cloud-backups-v1';
  const endpoint = window.ARG_CLOUD_ENDPOINT;
  const $ = id => document.getElementById(id);
  const panel = $('cloudSaveDialog');
  let busy = false, conflict = null, message = '', observed = localStorage.getItem(SAVE), dirtyAt = 0, backupRevision = '', replacing = false;
  const parse = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } };
  const meta = () => parse(META, {});
  const raw = () => localStorage.getItem(SAVE) || '{}';
  function backup() {
    const items = parse(BACKUP, []);
    items.unshift({ savedAt: new Date().toISOString(), state: parse(SAVE, {}), cloud: meta() });
    localStorage.setItem(BACKUP, JSON.stringify(items.slice(0, 5)));
  }
  function render() {
    const m = meta();
    $('cloudSaveStatus').textContent = message || (m.token ? (raw() === m.synced ? '已同步' : '进度已保存在本机，等待同步') : '进度保存在当前浏览器');
    $('cloudCode').value = m.token || '';
    $('cloudConnected').hidden = !m.token;
    $('cloudCreate').hidden = !!m.token;
    $('cloudSaveConflict').hidden = !conflict;
    $('cloudSaveRemoteTime').textContent = conflict ? `云端保存时间：${new Date(conflict.updatedAt).toLocaleString()}` : '';
    $('cloudSaveLastTime').textContent = m.updatedAt ? `最近同步：${new Date(m.updatedAt).toLocaleString()}` : '';
    for (const button of panel.querySelectorAll('button[data-cloud-action]')) button.disabled = busy;
    $('cloudCreate').disabled = busy || !endpoint;
    $('cloudRecover').disabled = busy || !endpoint;
    const backups = parse(BACKUP, []);
    $('cloudBackups').hidden = !backups.length;
    const revision = JSON.stringify(backups);
    if (revision !== backupRevision) {
      backupRevision = revision;
      $('cloudBackupSelect').replaceChildren(...backups.map((item, i) => {
        const option = document.createElement('option'); option.value = String(i);
        option.textContent = `${new Date(item.savedAt).toLocaleString()} · ${item.state.playerName || '未建立档案'}`;
        return option;
      }));
    }
  }
  async function request(method, token, body) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${endpoint}/v1/save`, { method, cache: 'no-store', signal: controller.signal,
        headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}) });
      const result = await response.json();
      if (!response.ok && response.status !== 409) throw new Error(result.error || 'unavailable');
      return result;
    } finally { clearTimeout(timeout); }
  }
  function remember(token, result) {
    localStorage.setItem(META, JSON.stringify({ token, version: result.version, updatedAt: result.updatedAt, synced: JSON.stringify(result.state) }));
  }
  function offer(token, result) {
    conflict = { ...result, token };
    message = '本机与云端进度不同。自动同步已暂停，请选择保留的版本。';
  }
  function apply(token, result) {
    backup();
    replacing = true;
    try {
      localStorage.setItem(SAVE, JSON.stringify(result.state));
      remember(token, result);
    } catch (error) { replacing = false; throw error; }
    location.reload();
  }
  async function run(action) {
    if (busy) return;
    busy = true; render();
    try {
      // All tabs use the same lock and re-read metadata inside it.
      if (navigator.locks) await navigator.locks.request('find-you-cloud-sync', action);
      else await action(); // Server version checks still prevent lost updates.
    } catch (error) {
      const texts = { not_found: '未找到该恢复码的存档。', invalid_code: '恢复码格式不正确。',
        create_limit: '今天新建存档次数已达上限，请稍后再试。', too_large: '存档超过云端大小限制，进度仍保留在本机。',
        invalid_body: '请先完成主角档案，再启用云存档。' };
      message = texts[error.message] || '暂时无法连接云端。进度仍保存在本机，联网后会重试。';
    } finally { busy = false; render(); }
  }
  async function sync() {
    if (!endpoint || busy || conflict || !meta().token || !navigator.onLine) return;
    await run(async () => {
      const m = meta();
      if (!m.token || conflict) return;
      let remote;
      // A pending creation retains the same random credential across failed requests.
      if (!m.version) remote = await request('POST', m.token, { state: parse(SAVE, {}) });
      else remote = await request('GET', m.token);
      if (meta().token !== m.token) return;
      if (raw() === JSON.stringify(remote.state)) { remember(m.token, remote); message = '已同步'; return; }
      if (remote.version !== m.version) { offer(m.token, remote); return; }
      const local = parse(SAVE, {});
      const result = await request('PUT', m.token, { state: local, version: remote.version });
      if (meta().token !== m.token) return;
      if (result.error === 'conflict') offer(m.token, result);
      else { remember(m.token, result); message = raw() === JSON.stringify(result.state) ? '已同步' : '进度已保存在本机，等待同步'; }
    });
  }
  $('cloudSaveOpen').addEventListener('click', () => { render(); panel.showModal(); });
  $('cloudSaveClose').addEventListener('click', () => panel.close());
  $('cloudCreate').addEventListener('click', async () => {
    await run(async () => {
      if (meta().token) return;
      const state = parse(SAVE, {});
      if (!state.playerName || !state.playerGender) throw new Error('invalid_body');
      const token = 'FY1_' + [...crypto.getRandomValues(new Uint8Array(32))].map(n => n.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(META, JSON.stringify({ token }));
      message = '正在建立云存档…';
    });
    await sync();
  });
  $('cloudSyncNow').addEventListener('click', () => { message = ''; sync(); });
  $('cloudRecover').addEventListener('click', () => run(async () => {
    const token = $('cloudRecoverCode').value.trim();
    if (!/^FY1_[a-f0-9]{64}$/.test(token)) throw new Error('invalid_code');
    const result = await request('GET', token);
    offer(token, result);
    message = '已找到云端存档。选择“使用云端进度”恢复；当前本机进度会先备份。';
  }));
  $('cloudUseRemote').addEventListener('click', () => run(async () => {
    if (!conflict) return;
    const token = conflict.token;
    const latest = await request('GET', token);
    apply(token, latest);
  }));
  $('cloudKeepLocal').addEventListener('click', () => run(async () => {
    if (!conflict) return;
    // Retain both versions locally before the explicit replacement.
    backup();
    const items = parse(BACKUP, []);
    items.unshift({ savedAt: conflict.updatedAt, state: conflict.state, cloud: { token: conflict.token, version: conflict.version } });
    localStorage.setItem(BACKUP, JSON.stringify(items.slice(0, 5)));
    const token = conflict.token;
    const result = await request('PUT', token, { state: parse(SAVE, {}), version: conflict.version });
    if (result.error === 'conflict') { offer(token, result); return; }
    remember(token, result); conflict = null; message = '已同步本机进度，替换前的版本已备份。';
  }));
  $('cloudDisconnect').addEventListener('click', () => run(async () => {
    backup(); localStorage.removeItem(META); conflict = null; message = '已断开同步，云端存档保留。';
  }));
  $('cloudCopyCode').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('cloudCode').value); message = '恢复码已复制。'; }
    catch { $('cloudCode').select(); message = '请复制选中的恢复码。'; }
    render();
  });
  $('cloudBackupDownload').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(parse(BACKUP, []), null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'find-you-save-backups.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  $('cloudBackupRestore').addEventListener('click', () => run(async () => {
    const item = parse(BACKUP, [])[$('cloudBackupSelect').value];
    if (!item) return;
    backup();
    replacing = true;
    try {
      localStorage.setItem(SAVE, JSON.stringify(item.state));
      localStorage.removeItem(META);
    } catch (error) { replacing = false; throw error; }
    conflict = null; location.reload();
  }));
  // Reset callers detach before clearing progress; an empty game must not overwrite the cloud.
  window.ARGCloudSave = {
    isReplacing: () => replacing,
    beforeReset() { backup(); replacing = true; localStorage.removeItem(META); conflict = null; }
  };
  function observe() {
    const current = raw();
    if (current !== observed) { observed = current; dirtyAt = Date.now(); message = ''; }
    render();
  }
  document.addEventListener('arg-state-changed', observe);
  window.addEventListener('storage', event => {
    if ([SAVE, META].includes(event.key)) { conflict = null; observe(); }
  });
  window.addEventListener('online', sync);
  // At most one scheduled check per minute when idle; changed saves are batched for ten seconds.
  let lastCheck = Date.now();
  setInterval(() => {
    observe();
    if ((dirtyAt && Date.now() - dirtyAt >= 10000) || Date.now() - lastCheck >= 60000) {
      dirtyAt = 0; lastCheck = Date.now(); sync();
    }
  }, 5000);
  if (new URLSearchParams(location.search).has('reset') || new URLSearchParams(location.search).get('preview') === 'village') {
    window.ARGCloudSave.beforeReset();
    replacing = false; // This is already the destination page, so new local progress can be saved.
  }
  render();
  // Wait for game initialization and legacy-save normalization before syncing.
  setTimeout(sync, 1000);
})();
