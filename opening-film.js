(() => {
  const dialog = document.querySelector('#openingFilm');
  const video = document.querySelector('#openingFilmVideo');
  const play = document.querySelector('#openingFilmPlay');
  const status = document.querySelector('#openingFilmStatus');
  const source = './promo/output/find-you-program-promo-v2.mp4';
  let returnFocus;

  function open() {
    if (dialog.open) return;
    returnFocus = document.activeElement;
    document.querySelector('#startMenu').classList.remove('is-open');
    status.textContent = '';
    play.hidden = false;
    video.controls = false;
    video.preload = 'metadata';
    video.src = source;
    dialog.showModal();
    play.focus();
  }
  play.addEventListener('click', async () => {
    status.textContent = '正在载入宣传片…';
    video.controls = true;
    try {
      // A deliberate click allows the existing narration to play with sound.
      await video.play();
    } catch {
      if (dialog.open) status.textContent = '暂时无法播放，可以重试或直接进入游戏。';
    }
  });
  video.addEventListener('playing', () => { play.hidden = true; status.textContent = ''; });
  video.addEventListener('waiting', () => { if (dialog.open) status.textContent = '正在缓冲…'; });
  video.addEventListener('error', () => {
    if (dialog.open) status.textContent = '宣传片暂时无法载入，可直接进入游戏。';
  });
  video.addEventListener('ended', () => { if (dialog.open) dialog.close(); });
  document.querySelector('#openingFilmSkip').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    video.pause();
    video.removeAttribute('src');
    video.load();
    returnFocus?.focus();
    const url = new URL(location.href);
    if (url.searchParams.has('intro')) {
      url.searchParams.delete('intro');
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    }
  });
  document.querySelector('#openingFilmReplay').addEventListener('click', open);
  const params = new URLSearchParams(location.search);
  const state = window.ARGGame?.getState() || {};
  if (params.get('view') !== 'village' && params.get('preview') !== 'village' &&
      (params.get('intro') === '1' || !state.playerName || !state.playerGender)) open();
})();
