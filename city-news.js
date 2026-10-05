(() => {
  'use strict';
  const feed = document.querySelector('#cityNewsFeed');
  // These are installments of the existing public briefings, not identity conclusions.
  const stages = ['M05', 'M06', 'S04'];
  let previous = 0;
  function edition() {
    const done = window.ARGGame?.getState().storyProgress?.done || [];
    return stages.filter(id => done.includes(id)).length;
  }
  function render() {
    const count = edition();
    document.querySelector('#newsEdition').textContent = count ? ['2026年8月26日 · 早间版','2026年8月27日 · 早间版','2026年8月28日 · 上午版'][count - 1] : '当前版面';
    const source = window.StoryDocuments?.['C2-01'];
    const holder = document.createElement('div');
    holder.innerHTML = source?.body || '';
    const paragraphs = [...holder.children];
    feed.replaceChildren();
    if (!count) {
      const empty = document.createElement('div');
      empty.className = 'city-news-empty';
      empty.innerHTML = '<span>▤</span><h2>暂无新的地方简讯</h2><p>新的报道发布后，将保留在本版面。</p>';
      feed.appendChild(empty);
    }
    for (let i = count - 1; i >= 0; i--) {
      const article = document.createElement('article');
      article.className = 'city-news-article';
      const category = document.createElement('span');
      category.className = 'city-news-category';
      category.textContent = ['荣川 · 社会','南岭 · 社会','柳河 · 社会'][i];
      const title = document.createElement('h2');
      title.textContent = paragraphs[i * 2]?.textContent || '';
      const body = document.createElement('p');
      body.textContent = paragraphs[i * 2 + 1]?.textContent || '';
      const foot = document.createElement('footer');
      foot.textContent = '地方简讯 · 后续情况以进一步通报为准';
      article.append(category, title, body, foot);
      feed.appendChild(article);
    }
    document.querySelector('#newsDesktopBadge').hidden = count === 0;
    if (count > previous && previous >= 0) window.desktopAPI.showToast('本市新闻更新', '新的地方简讯已刊出。');
    previous = count;
  }
  previous = edition();
  document.addEventListener('arg-state-changed', render);
  render();
})();
