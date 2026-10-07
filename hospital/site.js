(() => {
  'use strict';
  const {records} = window.HospitalArchive;
  const byId = new Map(records.map(record=>[record.id,record]));
  const $ = selector=>document.querySelector(selector);
  const escape = value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = value=>String(value??'').normalize('NFKC').trim().toLowerCase();
  const storageKey='find-you-hospital-reading-v1';
  let log={read:[],unlocked:[]},storageOK=true,kind='';
  const lock = id=>window.StoryConfig.locks[id];
  try {
    const raw=JSON.parse(localStorage.getItem(storageKey)||'null');
    if(raw && typeof raw==='object') {
      log.read=Array.isArray(raw.read)?raw.read.filter(r=>r && byId.has(r.id)).slice(0,records.length):[];
      log.unlocked=Array.isArray(raw.unlocked)?raw.unlocked.filter(id=>byId.has(id)&&lock(id)):[];
    }
  } catch {storageOK=false;}
  function persist() {
    try {localStorage.setItem(storageKey,JSON.stringify(log));storageOK=true;}catch{storageOK=false;}
    $('#storageStatus').textContent=storageOK?'':'本机留存不可用，当前资料仍可阅读。';
  }
  function recordBody(id) {
    let gender='';
    // Read the selected character's gender for the existing variable field; never alter game state.
    try {gender=JSON.parse(localStorage.getItem('find-you-state-v1')||'null')?.playerGender;}catch{}
    const value=gender==='female'?'女':gender==='male'?'男':'未转录';
    return window.StoryDocuments[id].body.replaceAll('男／女，按主角选择显示',value).replaceAll('男／女按主角选择显示',value)
      .replaceAll('="./hospital/assets/','="./assets/');
  }
  function queryParams() {
    const params=new URLSearchParams(location.search);
    params.delete('record');params.delete('view');return params;
  }
  function href(id) {const params=queryParams();params.set('record',id);return '?'+params;}
  function setKind(value) {
    kind=['birth','visit','office'].includes(value)?value:'';
    document.querySelectorAll('[data-kind]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.kind===kind)));
  }
  function renderResults() {
    const query=norm($('#query').value),date=$('#date').value;
    if(!query&&!date) {
      $('#resultStatus').textContent='';
      $('#results').innerHTML='<div class="empty-state">输入检索条件后查询。</div>';return;
    }
    const hits=records.filter(r=>(!kind||r.kind===kind)&&(!date||r.date===date)&&(!query||[r.id,r.number,r.title,r.subject,...r.keywords].some(key=>norm(key)===query)));
    $('#resultStatus').textContent=`共 ${hits.length} 项`;
    $('#results').innerHTML=hits.length?`<table class="results-table"><thead><tr><th scope="col">档案题名 / 编号</th><th scope="col">登记对象</th><th scope="col">登记日期</th><th scope="col">资料类别</th></tr></thead><tbody>${hits.map(r=>`<tr><td><a href="${escape(href(r.id))}">${escape(r.title)}</a><small>${escape(r.number)}</small></td><td>${escape(r.subject)}</td><td>${r.date}</td><td>${r.kind==='office'?'院务记录':r.kind==='birth'?'出生记录':'就诊记录'}${lock(r.id)?'<br><span class="lock-label">封存附件</span>':''}</td></tr>`).join('')}</tbody></table>`:'<div class="empty-state">未查询到匹配记录。</div>';
  }
  function showRecord(id) {
    const record=byId.get(id);
    const back='./'+(queryParams().size?'?'+queryParams():'');
    if(!record){document.title='档案未收录 · 岭川县医院';$('#readerView').innerHTML=`<a class="back-link" href="${escape(back)}">« 返回查询</a><div class="error"><h1 id="recordTitle" tabindex="-1">档案未收录</h1><p>当前编号没有对应记录。</p></div>`;return;}
    document.title=record.title+' · 岭川县医院';
    const locked=Boolean(lock(id))&&!log.unlocked.includes(id),body=locked?'':recordBody(id);
    const snapshot={id,title:record.title,number:record.number,date:record.date,source:record.source,body,locked};
    log.read=[snapshot,...log.read.filter(r=>r.id!==id)];persist();
    const attachments=[...(record.attachments||[]),...(record.parent?[record.parent]:[])].map(id=>byId.get(id));
    $('#readerView').innerHTML=`<a class="back-link" href="${escape(back)}">« 返回查询</a><article class="record-paper"><div class="record-top">岭川县医院 / ${record.kind==='office'?'院办公室 / 院务留档':'病案室 / 历史资料'}</div><h1 id="recordTitle" tabindex="-1">${escape(record.title)}</h1><dl class="record-meta"><div><dt>${record.kind==='office'?'相关人员':'登记对象'}</dt><dd>${escape(record.subject)}</dd></div><div><dt>${record.kind==='office'?'发布日期':'登记日期'}</dt><dd>${record.date}</dd></div><div><dt>原记录编号</dt><dd>${escape(record.number)}</dd></div><div><dt>资料来源</dt><dd>${escape(record.source)}</dd></div></dl>${locked?`<div class="locked-box"><p>${escape(lock(id).cover)}</p><form id="unlockForm"><label for="attachmentCode">附件密码</label><div class="unlock-controls"><input id="attachmentCode" type="password" maxlength="40" autocomplete="off" required><button type="submit">核验</button></div><div id="unlockFeedback" class="feedback" role="status" aria-live="polite"></div></form></div>`:`<div class="record-body">${body}</div>`}${attachments.length?`<aside class="attachment-list"><h2>${record.parent?'所属档案':'随附资料'}</h2>${attachments.map(r=>`<a href="${escape(href(r.id))}">${escape(r.title)}${lock(r.id)?'（封存附件）':''} »</a>`).join('')}</aside>`:''}</article><p class="record-status">${storageOK?(locked?'封面与来源已留存。':'原文与来源已自动留存。'):'本机留存不可用。'}</p>`;
    $('#unlockForm')?.addEventListener('submit',event=>{
      event.preventDefault();
      if(norm($('#attachmentCode').value)!==norm(lock(id).code)){$('#unlockFeedback').textContent='核验未通过';return;}
      log.unlocked=[...new Set([...log.unlocked,id])];showRecord(id);$('#recordTitle').focus({preventScroll:true});
    });
  }
  function renderHistory() {
    document.title='调阅记录 · 岭川县医院';
    $('#historyList').innerHTML=log.read.length?log.read.map(item=>{
      const r=byId.get(item.id);
      return `<div class="history-item"><a href="?record=${encodeURIComponent(r.id)}">${escape(r.title)}</a><small>${escape(r.source)} · ${r.date}${item.locked?' · 封面留存':''}</small></div>`;
    }).join(''):'<div class="empty-state">暂无调阅记录。</div>';
  }
  function render() {
    const params=new URLSearchParams(location.search),id=params.get('record'),view=params.get('view');
    $('#searchView').hidden=id!==null||view==='history';$('#readerView').hidden=id===null;$('#historyView').hidden=id!==null||view!=='history';
    document.querySelectorAll('[data-nav]').forEach(link=>{if(link.dataset.nav===(id===null&&view==='history'?'history':'search'))link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
    if(id!==null)showRecord(id);
    else if(view==='history')renderHistory();
    else{document.title='岭川县医院 · 历史档案查阅';setKind(params.get('kind'));$('#query').value=(params.get('q')||'').slice(0,100);$('#date').value=params.get('date')||'';renderResults();}
    $('#storageStatus').textContent=storageOK?'':'本机留存不可用，当前资料仍可阅读。';
  }
  function navigate(url) {history.pushState(null,'',url);render();window.scrollTo({top:0,behavior:'instant'});if(!$('#readerView').hidden)$('#recordTitle')?.focus({preventScroll:true});}
  document.addEventListener('click',event=>{
    const category=event.target.closest('[data-kind]');if(category){setKind(category.dataset.kind);return;}
    const link=event.target.closest('a');if(!link||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||link.classList.contains('skip'))return;
    const url=new URL(link.href);if(url.origin!==location.origin||url.pathname!==location.pathname)return;
    event.preventDefault();navigate(url);
  });
  $('#queryForm').addEventListener('submit',event=>{event.preventDefault();const params=new URLSearchParams();if(kind)params.set('kind',kind);if($('#query').value.trim())params.set('q',$('#query').value.trim());if($('#date').value)params.set('date',$('#date').value);navigate('./'+(params.size?'?'+params:''));});
  $('#queryForm').addEventListener('reset',event=>{event.preventDefault();navigate('./');});
  window.addEventListener('popstate',render);
  render();
})();
