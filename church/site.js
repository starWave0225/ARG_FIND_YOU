(() => {
  'use strict';
  const {records, escape} = window.ChurchArchive;
  const byId = new Map(records.map(r=>[r.id,r]));
  const $ = selector => document.querySelector(selector);
  const normalize = text => String(text).normalize('NFKC').toLowerCase().trim();
  // This site's reading log is independent of the game's save and verification state.
  const readingKey = 'find-you-church-reading-v1';
  let storageAvailable = true;
  function readLog() {
    try {
      const log = JSON.parse(localStorage.getItem(readingKey) || '[]');
      return Array.isArray(log) ? log.filter(item=>item && byId.has(item.id)).slice(0,records.length) : [];
    } catch { storageAvailable=false; return []; }
  }
  function retain(record) {
    const log = readLog().filter(item=>item.id!==record.id);
    // Keep both the original excerpt and its stated source, not just a bookmark.
    const item = {id:record.id,title:record.title,source:record.origin,url:new URL('?record='+encodeURIComponent(record.id),location.href).href,sections:record.sections};
    try { localStorage.setItem(readingKey,JSON.stringify([item,...log])); storageAvailable=true; }
    catch { storageAvailable=false; }
  }
  function renderHistory() {
    const log = readLog();
    $('#readingHistory').hidden = !log.length;
    $('#historyList').innerHTML = log.map(item=>`<a href="?record=${encodeURIComponent(item.id)}">${escape(byId.get(item.id).title)}</a>`).join('');
    $('#storageStatus').textContent = storageAvailable ? '' : '本机留存不可用；仍可翻阅公开愿簿。';
  }
  function renderList() {
    const query = normalize($('#wishQuery').value);
    const type = $('#typeFilter').value, status = $('#statusFilter').value;
    const hits = records.filter(r=>(!type || r.type===type) && (!status || r.status===status) && (!query || [r.id,r.title,r.name,...r.keywords].some(term=>normalize(term)===query)));
    $('#resultCount').textContent = `共 ${hits.length} 份记录`;
    $('#recordList').innerHTML = hits.length ? hits.map(r=>`<a class="record-row" href="?record=${encodeURIComponent(r.id)}"><div class="record-id">${escape(r.id)}<time datetime="${r.date}">${r.date.replaceAll('-',' / ')}</time></div><div class="record-summary"><h3>${escape(r.title)}</h3><p>${escape(r.excerpt)}</p></div><div class="record-tag">${escape(r.status)}<small>${escape(r.type)}</small></div><span class="row-arrow" aria-hidden="true">↗</span></a>`).join('') : '<div class="empty-state">没有匹配的祈愿记录。</div>';
    renderHistory();
  }
  function readRoute() {
    const params = new URLSearchParams(location.search);
    $('#wishQuery').value = (params.get('q') || '').slice(0,120);
    $('#typeFilter').value = params.get('type') || '';
    $('#statusFilter').value = params.get('status') || '';
    const id = params.get('record');
    const record = byId.get(id);
    $('#homeView').hidden = id !== null;
    $('#recordView').hidden = id === null;
    document.querySelectorAll('.masthead nav a, .site-footer a[href$="#archive"]').forEach(link=>{
      const hash = new URL(link.href).hash;
      link.href = id === null ? hash : './'+hash;
    });
    if (id === null) { document.title='全知教会 · 见证未竟之愿'; renderList(); return; }
    if (!record) {
      document.title='记录未收录 · 全知教会';
      $('#recordView').innerHTML='<a class="back-link" href="./#archive">← 返回祈愿簿</a><div class="record-error"><h1 id="recordTitle" tabindex="-1">记录未收录</h1><p>当前编号没有对应的公开记录。</p></div>';
      return;
    }
    retain(record);
    document.title=record.title+' · 全知教会祈愿簿';
    const returnParams = new URLSearchParams(params); returnParams.delete('record');
    const returnURL='./'+(returnParams.size?'?'+returnParams:'')+'#archive';
    $('#recordView').innerHTML=`<a class="back-link" href="${escape(returnURL)}">← 返回祈愿簿</a><article class="folio"><div class="folio-top"><span>见证处 / ${escape(record.id)}</span><img src="./seal.svg" alt="全知教会印记"></div><h1 id="recordTitle" tabindex="-1">${escape(record.title)}</h1><dl class="record-meta"><div><dt>入簿日期</dt><dd>${record.date}</dd></div><div><dt>登记状态</dt><dd>${escape(record.status)} · ${escape(record.type)}</dd></div><div><dt>署名</dt><dd>${escape(record.name)}</dd></div><div><dt>留存来源</dt><dd>${escape(record.origin)}</dd></div></dl><div class="record-body">${record.sections.map(s=>`<section><h2>${escape(s.title)}</h2>${s.text.map(p=>`<p>${escape(p)}</p>`).join('')}</section>`).join('')}</div><div class="folio-end" aria-hidden="true">✧ · ✧</div></article>${record.related?.length?`<aside class="related-records"><h2>同卷附页</h2>${record.related.map(id=>byId.get(id)).filter(Boolean).map(r=>`<a href="?record=${encodeURIComponent(r.id)}">${escape(r.title)} ↗ <small>${escape(r.id)}</small></a>`).join('')}</aside>`:''}<p class="record-retained" role="status">${storageAvailable?'原文与来源已留存在本机阅览记录。':'本机留存不可用；当前原文仍可阅读。'}</p>`;
  }
  function navigate(url, focusRecord=false) {
    history.pushState(null,'',url);
    readRoute();
    if (focusRecord) { window.scrollTo({top:0,left:0,behavior:'instant'}); $('#recordTitle')?.focus({preventScroll:true}); }
    else if(location.hash) document.querySelector(location.hash)?.scrollIntoView();
  }
  function updateSearch() {
    const params = new URLSearchParams();
    for (const [key,value] of [['q',$('#wishQuery').value.trim()],['type',$('#typeFilter').value],['status',$('#statusFilter').value]]) if(value) params.set(key,value);
    history.replaceState(null,'','./'+(params.size?'?'+params:'')+'#archive');
    renderList();
  }
  $('#archiveForm').addEventListener('submit',event=>{event.preventDefault();updateSearch();});
  for(const id of ['#typeFilter','#statusFilter']) $(id).addEventListener('change',updateSearch);
  document.addEventListener('click',event=>{
    const link=event.target.closest('a');
    if(!link || event.button!==0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (link.dataset.photo) {
      event.preventDefault();
      $('#photoLarge').src = link.href;
      $('#photoLarge').alt = link.querySelector('img').alt;
      $('#photoCaption').textContent = link.dataset.photo;
      $('#photoViewer').showModal();
      return;
    }
    const url=new URL(link.href);
    if(url.origin!==location.origin || !url.searchParams.has('record') && !link.classList.contains('back-link')) return;
    event.preventDefault();
    if(url.searchParams.has('record')) {
      const current=new URLSearchParams(location.search);
      for(const key of ['q','type','status']) if(current.has(key)) url.searchParams.set(key,current.get(key));
    }
    navigate(url,url.searchParams.has('record'));
  });
  $('#photoClose').addEventListener('click',()=>$('#photoViewer').close());
  $('#photoViewer').addEventListener('click',event=>{
    if(event.target!==$('#photoViewer')) return;
    const box=event.target.getBoundingClientRect();
    if(event.clientX<box.left || event.clientX>box.right || event.clientY<box.top || event.clientY>box.bottom) event.target.close();
  });
  window.addEventListener('popstate',readRoute);
  window.addEventListener('storage',event=>{if(event.key===readingKey || event.key===null) renderHistory();});
  readRoute();
})();
