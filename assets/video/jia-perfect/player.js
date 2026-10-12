(() => {
  const film = document.querySelector('#film');
  const gate = document.querySelector('#gate');
  const begin = document.querySelector('#begin');
  const status = document.querySelector('#status');
  const source = film.querySelector('source').src;
  let pending = false;
  let needsReload = false;
  let timer;
  let attempt = 0;

  function finishLoading() {
    clearTimeout(timer);
    pending = false;
    begin.disabled = false;
    gate.removeAttribute('aria-busy');
  }

  function failed(token) {
    if (token !== attempt) return;
    finishLoading();
    needsReload = true;
    gate.hidden = false;
    status.textContent = '视频暂时无法播放，请点击重试，或下载视频观看。';
    begin.textContent = '重新拨通刘涵的电话 →';
  }

  begin.addEventListener('click', () => {
    if (pending) return;
    const token = ++attempt;
    pending = true;
    begin.disabled = true;
    gate.setAttribute('aria-busy', 'true');
    status.textContent = '正在接通，加载影片…';
    if (needsReload || film.error) {
      const fresh = new URL(source);
      fresh.searchParams.set('retry', String(token));
      film.src = fresh.href;
      film.load();
      needsReload = false;
    }
    timer = setTimeout(() => {
      if (!pending || token !== attempt) return;
      film.pause();
      failed(token);
    }, 12000);
    // Invoke inside the click handler to retain the browser's user activation.
    try {
      const result = film.play();
      if (result) result.catch(() => {
        if (pending) failed(token);
      });
    } catch {
      failed(token);
    }
  });

  film.addEventListener('playing', () => {
    finishLoading();
    gate.hidden = true;
    status.textContent = '';
    film.focus();
  });
  film.addEventListener('error', () => {
    needsReload = true;
    if (pending || gate.hidden) failed(attempt);
  });
  film.addEventListener('ended', () => {
    try { localStorage.setItem('find-you-jia-perfect-viewed-v1', '1'); } catch {}
  });
})();
