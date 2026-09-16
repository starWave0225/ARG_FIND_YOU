(() => {
  'use strict';
  const sources = {
    gazette: { name: '岭川县地方志馆', description: '保存地方志、旧区划表与区域沿革。登记内容仍需注意所指年代。' },
    business: { name: '岭川县企业档案室', description: '单位改制登记的保存机构。转载本室摘录的页面不构成另一份独立记录。' },
    workers: { name: '东岚退休职工之家', description: '退休职工自建网页；照片、内部名录与厂史转载各有不同原始来源。' },
    local: { name: '岭川地方资料索引', description: '整理公开目录与原文入口，记录材料的保管处和查阅方式。' },
    village: { name: '盛家村资料整理处', description: '盛禾等整理员接收村民资料并保留保管人信息；扫描件和口述分开登记。' },
    school: { name: '岭川卫生学校档案室', description: '学籍记录按届别保存，每条记录列有姓名、出生年、籍贯及附照。' },
    oldphotos: { name: '岭川旧影', description: '地方照片整理栏目。文章说明、图片原件和后补题记应分别判断。' },
    submission: { name: 'QT-073 投稿案卷', description: '玩家已接收的私人投稿副本，仅在本案范围内检索。投稿人陈述需要独立来源核验。' },
    tourism: { name: '盛家村乡土旅游合作社', description: '收录经营者发布的公示和导览材料，保留发布方及其引用来源。' }
  };
  const catalog = [
    { id: 'postal-guide', title: '旧信件中的邮政编码与投递区划', source: 'gazette', year: 1993, kind: '背景资料', number: '索引说明·邮政', origin: 'postal-guide', summary: '查阅旧邮件时，分别核对数字格式、当年投递区划与收件单位。', body: '<p>邮政编码由六位数字组成。旧信封上的缺字可查寄信当年的邮政区划表。</p><p>单位名称、支局名称和收件人姓名分别登记。地址用于确认投递范围，收件人身份另行核验。</p>', related: ['postal-1993'] },
    { id: 'postal-1993', title: '一九九三年东岚邮政投递区划调整表', source: 'gazette', year: 1993, kind: '原档扫描', number: '地方志·邮政篇·第6页', origin: 'postal-1993', summary: '按支局列出的历史服务区域与邮政编码，含东岚及青源条目。', body: '<table><thead><tr><th>支局</th><th>服务区域</th><th>邮政编码</th></tr></thead><tbody><tr><td>东岚邮电支局</td><td>东岚镇、盛家村及周边厂矿</td><td>435160</td></tr><tr><td>青源邮电支局</td><td>青源街道</td><td>435171</td></tr></tbody></table><p>此页按1993年的投递范围登记，不应将服务区域直接当成某人的常住地址。</p>', related: ['postal-guide', 'factory-register'], action: 'postal' },
    { id: 'factory-register', title: '东岚农机厂改制登记摘录', source: 'business', year: 2000, kind: '原档扫描', number: 'DL-2000-17', origin: 'factory-register', summary: '改制前后名称、原厂址和人事档案承接关系。', body: '<p>二〇〇〇年六月，东岚农机厂改制并更名为<strong>东岚机电二厂</strong>。原厂址、维修车间人事档案与退休关系由新单位承接。</p><p>本页说明单位沿革。具体职工的身份和调动记录，应另查照片与内部通讯资料。</p>', related: ['factory-home', 'factory-reprint'], action: 'factory' },
    { id: 'factory-home', title: '东岚机电二厂退休职工之家：维修二组老照片', source: 'workers', year: 2008, kind: '网页快照', number: '退休职工网页·2008-04-17', origin: 'factory-photo-1998', summary: '收录1998年维修二组合影，并附需原工号打开的退休通讯录。', body: '', related: ['factory-register'], action: 'legacy' },
    { id: 'factory-reprint', title: '老厂名小记：东岚农机厂后来叫什么', source: 'workers', year: 2008, kind: '转载摘录', number: '厂史栏目·摘录页', origin: 'factory-register', original: 'factory-register', summary: '引用企业档案DL-2000-17整理的厂名说明；原始依据为同一改制登记。', body: '<p>旧信件上常写“东岚农机厂”，后来的网页标题则使用“东岚机电二厂”。</p><blockquote>本页依据《东岚农机厂改制登记摘录》DL-2000-17整理。</blockquote><p>本页转载上述改制登记，日期和承接范围见所引原页。</p>', related: ['factory-register', 'factory-home'] },
    { id: 'liuhe-factory', title: '柳河农机修配站设备维护简记', source: 'local', year: 2010, kind: '背景资料', number: '地方生产资料·柳河', origin: 'liuhe-factory', summary: '柳河县本地修配站的设备维修记录；单位与地区分别列明。', body: '<p>资料地点：柳河县。单位：柳河农机修配站。主要内容为2010年度设备维护。</p><p>记录范围仅为上述本地修配站的设备维护，未列职工名录。查询时请同时核对地区与单位全称。</p>', related: [] },
    { id: 'village-directory', title: '盛家村公开资料查阅目录', source: 'village', year: 2026, kind: '档案目录', number: '公开查阅说明', origin: 'village-directory', summary: '公开扫描、私人借存旧物与尚未数字化资料分别登记，可按具体题名提出申请。', body: '<p>扫描副本请注明原题名、形成日期与资料类别。原保管位置只说明材料在哪里保存，不表示申请人已经到过现场。</p><p>提供人为资料整理员盛禾。涉及私人家庭旧照的材料可能仅有目录，是否提供由保管人说明。收到扫描件后仍应保留提供人及原保管信息。</p>', related: ['clinic-catalogue', 'land-catalogue'] },
    { id: 'source-guide', title: '原件、转载和目录：查阅时如何记来源', source: 'local', year: 2026, kind: '背景资料', number: '使用说明·来源', origin: 'source-guide', summary: '分别登记发布者、原始保管者和所引原件，同源转载归在同一组。', body: '<p>来源记录包括原件的形成者、保管者和当前发布者。转载附原文出处，目录附调阅方式，网页快照保留当时的页面内容。</p><p>收入案卷时会保存标题、来源、年份、档案号和访问入口。调查结论在核验后单独提交。</p>', related: ['factory-register', 'factory-reprint'] },
    { id: 'clinic-catalogue', title: '村卫生室借用与代领索引：扫描目录', source: 'village', year: 1995, kind: '档案目录', number: '卫生室·药柜12号', origin: 'clinic-card', gate: 'chapter-one', summary: '现存借用与代领卡片的扫描目录，原保管位置为药柜12号。可经资料联络申请对应页。', body: '<p>材料形成于1995年，内容为卫生室的借用与代领条目。目录标注“药柜12号”，指卡片原保管位置。</p><p>已有整理时扫描的副本，可向盛禾提出查阅申请。申请回复进入节目电脑的远程资料桌，无需先到盛家村。</p>', related: ['village-directory', 'school-directory'], action: 'clinic-request' },
    { id: 'clinic-scan', title: '卫生室借用与代领索引卡：扫描件', source: 'village', year: 1995, kind: '案卷材料', number: 'C1-01·借用与代领', origin: 'clinic-card', original: 'clinic-catalogue', gate: 'clinic-card', summary: '整理留存的索引卡，提供方式与原保管位置随件保存。', body: '<table><thead><tr><th>日期</th><th>登记</th></tr></thead><tbody><tr><td>1995.06.17</td><td>桂枝，代罗家婶取药</td></tr><tr><td>1995.08.03</td><td>桂枝，协助妇幼宣传照登记</td></tr><tr><td>1995.09.11</td><td>罗桂枝，县里来函已转交</td></tr></tbody></table><p>最后一行来函内容未注明。来函日期不能直接当作入学日期。</p>', related: ['clinic-catalogue', 'submission-photo', 'school-directory'] },
    { id: 'submission-photo', title: '匿名投稿人补发：一九九五年妇幼宣传照副本', source: 'submission', year: 1995, kind: '案卷材料', number: 'C1-02·投稿副本', origin: 'submission-photo', gate: 'clinic-photo', summary: '匿名投稿人提供的照片正反面副本，存于 QT-073 投稿案卷。', body: '<p>正面：村小教室前的妇幼宣传合影。左侧年轻女子鼻翼旁有一颗浅痣。照片白边写“一九九五”。</p><blockquote>背面题记：桂枝去县里念卫校了。照片留卫生室。</blockquote><p>补写日期没有注明。请分别核验拍摄时间、姓名与后来去向。</p>', related: ['clinic-catalogue', 'school-directory'] },
    { id: 'school-directory', title: '岭川卫生学校历史学籍查阅目录', source: 'school', year: 1996, kind: '档案目录', number: '学籍目录·1996', origin: 'school-directory', gate: 'chapter-one', summary: '九六级包含社会招生与基层进修学员。按年份查阅原名录，姓名相近者须分别核对。', body: '<p>一九九六级学籍单独成册，学员包括社会招生与基层卫生人员进修。查阅时请核对出生年、籍贯与附照，不按统一应届年龄筛选。</p><p>已有的旧照片和姓名依据可用于提出对应届别的查阅请求。近年文章与学籍原件属于不同来源。</p>', related: ['school-roster', 'oldphoto-directory'] },
    { id: 'school-roster', title: '岭川卫生学校一九九六级学员名录摘页', source: 'school', year: 1996, kind: '原档扫描', number: 'C1-03·1996级名录', origin: 'school-roster', gate: 'clinic-solved', summary: '列出三名相近姓名学员的出生年、籍贯和学号。原附照仍需分别比较。', body: '<table><thead><tr><th>学号</th><th>姓名</th><th>出生年</th><th>籍贯</th></tr></thead><tbody><tr><td>9608</td><td>何桂枝</td><td>1977</td><td>青源街道</td></tr><tr><td>9624</td><td>罗桂枝</td><td>1968</td><td>盛家村</td></tr><tr><td>9641</td><td>罗桂芝</td><td>1974</td><td>柳河县</td></tr></tbody></table><p>原学号用于毕业后校友资料查阅。原件与附照文字检视保留在资料索引中，候选人身份单独核验。</p>', related: ['school-directory', 'oldphoto-directory'] },
    { id: 'oldphoto-directory', title: '岭川旧影：学校照片整理目录', source: 'oldphotos', year: 2026, kind: '档案目录', number: '照片专题·学校', origin: 'oldphoto-directory', gate: 'chapter-one', summary: '按学校和拍摄年代整理照片；图注、原底片来源及后补文字分栏登记。', body: '<p>学校资料按届别与活动分别整理。查询九六级卫生学校资料时，可以按学校、年份或姓名查找关联记录。</p><p>目录仅列资料主题。校友文章与退休附件按原学号建立关联索引。</p>', related: ['school-directory', 'school-roster'] },
    { id: 'land-catalogue', title: '盛家村土地与住户变更资料查阅说明', source: 'village', year: 2001, kind: '档案目录', number: '住户变更·目录说明', origin: 'land-catalogue', gate: 'chapter-one', summary: '按姓名、历史户号和变更年代申请对应页；目录不公开所有住户的完整个人资料。', body: '<p>本目录说明土地与住户变更资料的保存方式。线上申请需给出正在核对的人名、历史户号或变更年份，不要求申请人先来服务室。</p><p>提出的范围与查阅回复一起保存在案卷。住户档案按历史户号建立关联索引。</p>', related: ['village-directory'] },
    { id: 'tourism-notice', title: '盛家村旧村修缮与民俗游线试点公示', source: 'tourism', year: 2021, kind: '公开公示', number: 'SJC-WL-2021-01', origin: 'tourism-notice', gate: 'chapter-three', summary: '村口可见公示的数字化副本，列修缮范围与设施、档案管理顾问。', body: '<p>公示日期：2021年9月6日。试点范围包括旧邮亭、中央巷道、祠堂外院、旧学校闲置教室及河桥沿线。</p><p>运营筹备：盛家村乡土旅游合作社。设施与档案管理顾问：恒目管理顾问有限公司。双方分工以附件工作清单为准。</p><p>资料征集以借阅、扫描为主，应记录原保管人、年代及返还方式。本公示只说明项目关系，不能单独证明其他委托或组织关系。</p>', related: ['village-directory'] }
  ];
  if (window.StoryDocuments) {
    sources.story = {name:'岭川档案资料库', description:'按题名、人物、地点及档案编号检索原件与数字化副本。具体提供者在每份材料中保留。外部原文链接尚未填写的条目仅显示待补入口。'};
    for (const doc of Object.values(window.StoryDocuments)) {
      if (doc.id.startsWith('RW')) continue;
      catalog.push({id:'story-'+doc.id, storyId:doc.id, title:doc.title, source:'story', year:window.StoryConfig?.years[doc.id] || 2026, kind:'案卷材料', number:doc.id, origin:'story-'+doc.id, summary:'原始摘录与数字化附件，保留资料来源及原件编号。', body:''});
    }
  }
  const byId = new Map(catalog.map(doc => [doc.id, doc]));
  const kinds = ['原档扫描', '网页快照', '转载摘录', '档案目录', '案卷材料', '公开公示', '背景资料'];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const normalize = value => String(value || '').normalize('NFKC').toLowerCase().trim().replace(/\s+/g, ' ');
  let api;
  let query = '';
  let filters = { kind: '', source: '', year: '' };
  let view = { type: 'results' };
  let trail = [];
  let cursor = -1;
  let lastGate = '';
  let persistTimer;
  function state() { return api.getState(); }
  function has(id) { const s = state(); return (s.remoteFinds || []).includes(id) || (s.villageFinds || []).includes(id); }
  function visible(doc) {
    if (!doc) return false;
    return doc.storyId ? Boolean(window.StoryFlow?.available(doc.storyId)) : true;
  }
  function publicCatalog() { return catalog.filter(visible); }
  function cleanFilters(value) {
    return { kind: kinds.includes(value?.kind) ? value.kind : '', source: sources[value?.source] ? value.source : '', year: /^\d{4}$/.test(value?.year || '') ? value.year : '' };
  }
  function savedList(key) { return Array.isArray(state()[key]) ? state()[key].filter(id => byId.has(id) && visible(byId.get(id))) : []; }
  function persist(patch) { api.saveState(patch); }
  function snapshot() { return { query, filters: { ...filters }, view: { ...view } }; }
  function remember() {
    trail = trail.slice(0, cursor + 1);
    trail.push(snapshot());
    if (trail.length > 40) trail.shift();
    cursor = trail.length - 1;
    updateNavigation();
  }
  function updateNavigation() {
    document.querySelector('#archiveBack').disabled = cursor <= 0;
    document.querySelector('#archiveForward').disabled = cursor >= trail.length - 1;
  }
  function updateAddress(label) { document.querySelector('#archiveAddress').textContent = label; }
  // Only explicit mappings participate. Body text, summaries and partial words never add results.
  const keywordLinks = new Map();
  const storyMappings = Object.values(window.StoryDocuments || {}).filter(doc=>!doc.id.startsWith('RW')).map(doc=>({
    keywords:[doc.id,doc.title,...(window.StoryConfig?.aliases[doc.id] || [])],articles:['story-'+doc.id]
  }));
  for (const rule of [...(window.SearchKeywordLinks || []),...storyMappings]) {
    for (const word of rule.keywords) {
      const key = normalize(word);
      const ids = keywordLinks.get(key) || new Set();
      rule.articles.filter(id => byId.has(id)).forEach(id => ids.add(id));
      keywordLinks.set(key, ids);
    }
  }
  function mappedArticles(value) {
    const key = normalize(value);
    if (!key) return new Set();
    if (keywordLinks.has(key)) return keywordLinks.get(key);
    const terms = key.split(' ');
    if (terms.length < 2 || terms.some(term => !keywordLinks.has(term))) return new Set();
    return new Set([...keywordLinks.get(terms[0])].filter(id => terms.every(term => keywordLinks.get(term).has(id))));
  }
  function resultDocs() {
    const mapped = mappedArticles(query);
    return publicCatalog().filter(doc => mapped.has(doc.id) && (!filters.kind || doc.kind === filters.kind) && (!filters.source || doc.source === filters.source) && (!filters.year || String(doc.year) === filters.year));
  }
  function metadata(doc) {
    return `<span>${escape(doc.kind)}</span><button data-source-id="${doc.source}">${escape(sources[doc.source].name)}</button><span>${doc.year}年</span><span>${escape(doc.number)}</span>`;
  }
  function resultCard(doc) {
    const visited = savedList('searchVisited').includes(doc.id);
    const pinned = savedList('searchBookmarks').includes(doc.id);
    return `<article class="search-hit" data-result-id="${doc.id}"><div class="search-meta">${metadata(doc)}</div><h3><button data-search-document="${doc.id}">${escape(doc.title)}</button></h3><p>${escape(doc.summary)}</p><footer><span>${doc.original ? '同源资料 · 请回看引用来源' : doc.kind === '档案目录' ? '资料目录 · 含保管与查阅信息' : doc.kind === '案卷材料' ? '档案副本 · 保留提供方说明' : '关键词关联文章 · 身份仍需核验'}</span><span>${visited ? '已读' : ''}${pinned ? ' · 已收入案卷' : ''}</span></footer></article>`;
  }
  function renderResults() {
    document.querySelector('#archiveSearchView').hidden = false;
    document.querySelector('#archiveReaderView').hidden = true;
    document.querySelector('#archiveQuery').value = query;
    const docs = publicCatalog();
    const visibleSources = new Set(docs.map(doc => doc.source));
    const option = (value, name, selected) => `<option value="${escape(value)}"${value === selected ? ' selected' : ''}>${escape(name)}</option>`;
    document.querySelector('#archiveFilters').innerHTML = `<label>类型<select id="archiveKind">${option('', '全部类型', filters.kind)}${kinds.filter(kind => docs.some(doc => doc.kind === kind)).map(kind => option(kind, kind, filters.kind)).join('')}</select></label><label>发布者<select id="archiveSource">${option('', '全部发布者', filters.source)}${Object.keys(sources).filter(id => visibleSources.has(id)).map(id => option(id, sources[id].name, filters.source)).join('')}</select></label><label>年代<select id="archiveYear">${option('', '全部年代', filters.year)}${[...new Set(docs.map(doc => String(doc.year)))].sort().reverse().map(year => option(year, year + '年', filters.year)).join('')}</select></label><button data-search-clear>清除筛选</button>`;
    const hits = resultDocs();
    const origins = new Set(hits.map(doc => doc.origin));
    document.querySelector('#archiveResult').innerHTML = `<p class="search-count" role="status">${query ? `“${escape(query)}”` : '请输入关键词'} · ${hits.length}项 · ${origins.size}组原始来源${hits.length !== origins.size ? '（含同源转载或目录）' : ''}</p>${hits.length ? hits.map(resultCard).join('') : '<div class="search-empty"><h3>当前没有匹配结果</h3><button data-search-clear>清除筛选再查</button></div>'}`;
    const history = (Array.isArray(state().searchHistory) ? state().searchHistory : []).filter(term => typeof term === 'string').slice(0, 8);
    document.querySelector('#archiveHistory').innerHTML = history.length ? '<span>最近搜索</span>' + history.map(term => `<button data-search-query="${escape(term)}">${escape(term)}</button>`).join('') : '<span>输入明确关键词，打开关联文章或链接。</span>';
    const pins = savedList('searchBookmarks');
    document.querySelector('#archiveSaved').innerHTML = `<summary>已收入案卷的来源 · ${pins.length}</summary>${pins.length ? pins.map(id => `<button data-search-document="${id}">${escape(byId.get(id).title)}</button>`).join('') : '<p>打开资料后可连同来源一起收入案卷。</p>'}`;
    updateAddress('lingchuan.example/search' + (query ? '?q=' + query : ''));
    updateNavigation();
  }
  function readerShell(title, body) {
    document.querySelector('#archiveSearchView').hidden = true;
    const reader = document.querySelector('#archiveReaderView');
    reader.hidden = false;
    reader.innerHTML = `<div class="search-reader-tools"><button data-search-results>← 返回搜索结果</button><span>岭川搜寻 · 资料阅读</span></div>${body}`;
    reader.scrollTop = 0;
    updateAddress('lingchuan.example/资料/' + title);
    updateNavigation();
  }
  function openDocument(id, push = true) {
    const doc = byId.get(id);
    if (!visible(doc)) return;
    view = { type: 'document', id };
    if (push) remember();
    if (!savedList('searchVisited').includes(id)) persist({ searchVisited: [...savedList('searchVisited'), id] });
    if (doc.action === 'legacy') { api.openLegacy(); return; }
    const related = (doc.related || []).map(id => byId.get(id)).filter(visible);
    const peers = publicCatalog().filter(other => other.origin === doc.origin && other.id !== doc.id);
    const pinned = savedList('searchBookmarks').includes(id);
    readerShell(doc.title, `<article class="search-document"><div class="search-meta">${metadata(doc)}</div><h2>${escape(doc.title)}</h2><div class="source-chain"><strong>来源追溯</strong><p>当前发布：${escape(sources[doc.source].name)} → ${doc.original ? `<button data-search-document="${doc.original}">${escape(byId.get(doc.original).title)}</button>` : `原始依据：${escape(byId.get(doc.origin)?.title || doc.number)}`}</p><p>${doc.kind === '档案目录' ? '当前页面只说明材料的保存和申请方式。' : doc.kind === '转载摘录' ? '此页与所引原档归为同一来源。' : '原文内容及提供方说明随案卷保存，核验结论另行记录。'}</p></div><div class="search-document-body">${doc.storyId ? window.StoryFlow.body(doc.storyId) : doc.body}</div><div class="search-document-actions">${doc.storyId ? `<button data-story-doc="${doc.storyId}">查看原件与附件</button>` : ''}<button data-search-bookmark="${doc.id}">${pinned ? '已收入案卷 · 再次查看' : '连同来源收入案卷'}</button>${doc.action === 'postal' ? '<button data-search-record="postal">记录区划线索</button>' : ''}${doc.action === 'factory' ? '<button data-search-record="factory">记录单位沿革</button>' : ''}${doc.action === 'clinic-request' ? '<button data-search-request="clinicCard">申请对应扫描页</button>' : ''}</div>${peers.length ? '<section class="source-peers"><h3>同一原始来源的其他页面</h3>' + peers.map(item => `<button data-search-document="${item.id}">${escape(item.title)}</button>`).join('') + '</section>' : ''}${related.length ? '<section class="source-peers"><h3>原页列出的关联资料</h3>' + related.map(item => `<button data-search-document="${item.id}">${escape(item.title)}</button>`).join('') + '</section>' : ''}</article>`);
  }
  function openSource(id, push = true) {
    if (!sources[id] || !publicCatalog().some(doc => doc.source === id)) return;
    view = { type: 'source', id };
    if (push) remember();
    readerShell(sources[id].name, `<article class="search-document"><span class="search-eyebrow">来源档案</span><h2>${escape(sources[id].name)}</h2><p>${escape(sources[id].description)}</p><h3>当前可查页面</h3>${publicCatalog().filter(doc => doc.source === id).map(resultCard).join('')}</article>`);
  }
  function renderCurrent() {
    if (view.type === 'document') openDocument(view.id, false);
    else if (view.type === 'source') openSource(view.id, false);
    else renderResults();
  }
  function search(value, record = true) {
    query = String(value || '').trim().slice(0, 120);
    view = { type: 'results' };
    const old = Array.isArray(state().searchHistory) ? state().searchHistory.filter(term => typeof term === 'string') : [];
    if (record) persist({ searchQuery: query, searchFilters: filters, searchHistory: query ? [query, ...old.filter(term => term !== query)].slice(0, 8) : old });
    remember();
    renderResults();
    return true;
  }
  function bookmark(id) {
    const doc = byId.get(id);
    if (!visible(doc)) return;
    if (doc.storyId && !window.StoryFlow.canRead(doc.storyId)) { window.StoryFlow.openDoc(doc.storyId); return; }
    if (doc.storyId) window.StoryFlow.collect(doc.storyId);
    if (!savedList('searchBookmarks').includes(id)) persist({ searchBookmarks: [...savedList('searchBookmarks'), id] });
    api.toast('来源已收入案卷', doc.title);
    renderCurrent();
  }
  function restore(direction) {
    const next = cursor + direction;
    if (next < 0 || next >= trail.length) return;
    cursor = next;
    const item = trail[cursor]; query = item.query; filters = { ...item.filters }; view = { ...item.view };
    persist({ searchQuery: query, searchFilters: filters });
    renderCurrent();
  }
  window.LingchuanSearch = {
    init(callbacks) {
      api = callbacks;
      query = typeof state().searchQuery === 'string' ? state().searchQuery.slice(0, 120) : '';
      filters = cleanFilters(state().searchFilters);
      document.querySelector('#archiveBack').addEventListener('click', () => restore(-1));
      document.querySelector('#archiveForward').addEventListener('click', () => restore(1));
      document.querySelector('#archiveRefresh').addEventListener('click', () => renderCurrent());
      document.querySelector('#window-archive').addEventListener('click', event => {
        const button = event.target.closest('button'); if (!button) return;
        if (button.dataset.searchDocument) openDocument(button.dataset.searchDocument);
        else if (button.dataset.sourceId) openSource(button.dataset.sourceId);
        else if (button.dataset.searchQuery) { filters = { kind: '', source: '', year: '' }; search(button.dataset.searchQuery); }
        else if (button.hasAttribute('data-search-results')) { view = { type: 'results' }; remember(); renderResults(); }
        else if (button.hasAttribute('data-search-clear')) { filters = { kind: '', source: '', year: '' }; search(query); }
        else if (button.dataset.searchBookmark) bookmark(button.dataset.searchBookmark);
        else if (button.dataset.searchRecord) { if (state().accepted) api.record(button.dataset.searchRecord); }
        else if (button.dataset.searchRequest) api.request(button.dataset.searchRequest);
      });
      document.querySelector('#archiveFilters').addEventListener('change', () => {
        filters = cleanFilters({ kind: document.querySelector('#archiveKind').value, source: document.querySelector('#archiveSource').value, year: document.querySelector('#archiveYear').value });
        search(query);
      });
      // Update newly created case records without interrupting search input.
      document.addEventListener('arg-state-changed', () => {
        const signature = JSON.stringify([state().chapterOneStarted, state().chapterThreeStarted, state().clinicSolved, state().remoteFinds, state().villageFinds, state().storyProgress]);
        if (signature === lastGate) return;
        lastGate = signature;
        clearTimeout(persistTimer);
        persistTimer = setTimeout(() => { if (view.type === 'results') renderResults(); }, 0);
      });
      remember(); renderResults();
    },
    search,
    focus() { view = { type: 'results' }; remember(); renderResults(); document.querySelector('#archiveQuery').focus(); },
    openEmbedded(title, html) {
      const moved = view.type !== 'document' || view.id !== 'factory-home';
      view = { type: 'document', id: 'factory-home' };
      if (moved) remember();
      readerShell(title, `<div class="legacy-source-note"><span>网页快照 · 东岚退休职工之家 · 2008年</span><button data-source-id="workers">查看发布者</button><button data-search-bookmark="factory-home">连同来源收入案卷</button></div>${html}`);
    },
    documents() { return savedList('searchBookmarks').map(id => { const doc = byId.get(id); return { id: 'search:' + id, type: '源', title: doc.title, meta: `${sources[doc.source].name} · ${doc.year} · ${doc.kind}` }; }); },
    documentBody(id) {
      const doc = byId.get(id.replace(/^search:/, ''));
      if (!visible(doc) || !savedList('searchBookmarks').includes(doc.id)) return '<h2>来源尚未收藏</h2>';
      return `<span class="document-kicker">搜索来源存档 / ${escape(doc.kind)}</span><h2>${escape(doc.title)}</h2><dl><div><dt>发布者</dt><dd>${escape(sources[doc.source].name)}</dd></div><div><dt>资料年份</dt><dd>${doc.year}</dd></div><div><dt>档案号</dt><dd>${escape(doc.number)}</dd></div><div><dt>原始来源组</dt><dd>${escape(byId.get(doc.origin)?.title || doc.number)}</dd></div></dl>${doc.storyId ? window.StoryFlow.body(doc.storyId) : doc.body || '<p>已保存职工网页来源入口。原图、通讯录及解锁状态请在搜索阅读器中查看。</p>'}<button data-open-search-document="${doc.id}">回到来源页面</button>`;
    },
    openDocument
  };
})();
