(() => {
  'use strict';
  const config = window.StoryConfig, documents = window.StoryDocuments;
  const main = config.main, side = config.side;
  const steps = new Map([...main,...side].map(item => [item.id,item]));
  const npcIds = ['npc-postal-route','npc-shop-ledger','npc-school-index','npc-hall-repairs','npc-scan-directory','npc-bridge-route'];
  const legacy = {P01:'intake',P02:'envelope',P03:'postal',P04:'factory',P06:'roster',P07:'conclusion',P08:'receipt','C1-01':'clinic-card','C1-02':'clinic-photo'};
  let api, active = '', section = 'main', drafts = {}, feedback = '', reading = '';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const norm = value => String(value || '').normalize('NFKC').trim().toLowerCase().replace(/[\s，,。]/g,'');
  const state = () => api?.getState() || {};
  function flow() {
    const raw = state().storyProgress || {};
    const clean = (value, valid) => Array.isArray(value) ? [...new Set(value.filter(id => valid(id)))] : [];
    return {
      done: clean(raw.done,id => steps.has(id)), collected: clean(raw.collected,id => Boolean(documents[id])),
      unlocked: clean(raw.unlocked,id => Boolean(config.locks[id])), verified: clean(raw.verified,id => steps.has(id)),
      nextChecked: raw.nextChecked === true, published: raw.published === true,
      lettersRead: clean(raw.lettersRead,id => config.letters.some(letter=>letter.id===id)),
      drafts: raw.drafts && typeof raw.drafts==='object' ? Object.fromEntries(Object.entries(raw.drafts).filter(([id,value])=>steps.has(id)&&value&&typeof value==='object').map(([id,value])=>[id,Object.fromEntries(Object.entries(value).filter(([key,val])=>/^(a|order|check)\d+$/.test(key)&&typeof val==='string').map(([key,val])=>[key,val.slice(0,80)]))])) : {},
      sendRecords: Array.isArray(raw.sendRecords) ? raw.sendRecords.filter(record => record && ['M05','M06','S04'].includes(record.step) && typeof record.operator === 'string') : []
    };
  }
  const done = id => flow().done.includes(id);
  const current = () => main.find(item => !done(item.id)) || main.at(-1);
  function enabled(item) {
    if (!item || !state().playerName || !state().playerGender || !state().sent || !state().chapterOneStarted || !state().clinicSolved) return false;
    if (item.id.startsWith('X')) return done('DEPART') && (!item.afterMain || done(item.afterMain)) && (item.after || []).every(done);
    const index = main.indexOf(item);
    return main.slice(0,index).every(item => done(item.id));
  }
  function baseDocument(id) {
    const s = state();
    if (id.startsWith('N')) return s.chapterThreeStarted && (s.npcDocuments || []).includes(npcIds[Number(id.slice(1))-1]);
    if (id === 'P01') return s.accepted;
    if (id === 'P02') return s.envelopeOpened;
    if (id === 'P03') return (s.clues || []).includes('postalArea');
    if (id === 'P04') return (s.clues || []).includes('renamedFactory');
    if (id === 'P05') return s.legacyOpened;
    if (id === 'P06') return s.rosterUnlocked;
    if (id === 'P07') return s.conclusionBuilt;
    if (id === 'P08') return s.sent;
    if (id === 'C1-01') return [...(s.remoteFinds||[]),...(s.villageFinds||[])].includes('clinicCard');
    if (id === 'C1-02') return [...(s.remoteFinds||[]),...(s.villageFinds||[])].includes('clinicPhoto');
    if (id === 'RW01') return ['X05','X08','X09'].every(done);
    if (id === 'RW02') return ['X10','X11','X12'].every(done);
    return false;
  }
  // Existing source documents can be investigated in any order.
  const generated = new Set(['P01','P07','P08','C2-02','C2-03','E01','H14', ...[...main,...side].flatMap(item=>(item.outputs || []).filter(id=>id!=='H13'))]);
  const archiveSource = id => Boolean(documents[id]) && !id.startsWith('N') && !id.startsWith('J') && !id.startsWith('RW') && !generated.has(id);
  function available(id) {
    if (!documents[id]) return false;
    if (id.startsWith('J')) {const letter=config.letters.find(item=>item.id===id);return Boolean(letter&&(letter.after?done(letter.after):state()[letter.when]));}
    if (archiveSource(id)) return true;
    if (id.startsWith('N') || id.startsWith('P') || ['C1-01','C1-02','RW01','RW02'].includes(id)) return Boolean(baseDocument(id));
    // Generated conclusions only exist after the corresponding verification.
    const producer = [...main,...side].find(item => (item.outputs || []).includes(id));
    if (producer) return done(producer.id);
    return [...main,...side].some(item => enabled(item) && item.docs.includes(id));
  }
  const unlocked = id => !config.locks[id] || flow().unlocked.includes(id);
  const collected = id => available(id) && (flow().collected.includes(id) || (id.startsWith('N') && baseDocument(id)));
  function save(patch, extra={}) { capture();api.saveState({storyProgress:{...flow(),...patch,drafts:{...flow().drafts,...drafts}},...extra}); }
  function capture() {
    const form = document.querySelector('#storyPuzzle');
    if (!form) return;
    drafts[form.dataset.step] = Object.fromEntries(new FormData(form).entries());
  }
  function title(id) { return (documents[id]?.title || id).replaceAll('陈默',state().playerName || '主角'); }
  function source(id) {
    if (id.startsWith('J')) return (config.letters.find(letter=>letter.id===id)?.sender || '选题通信')+' · 本次调查收到的通信';
    if (id.startsWith('N')) return window.VillageCast[Number(id.slice(1))-1]?.document.meta || '村民借阅';
    if (id.startsWith('RW')) return '番外阅读 · 非本案证据';
    if (id.startsWith('V')) return documents[id].source;
    if (id.startsWith('H')) return '可选调查 · 项目档案留存副本';
    if (['P07','P08','C1-08','C2-02','C2-03','C2-04','C4-11','C7-03','E01','E02'].includes(id)) return '节目案卷 · 留存或核验生成';
    if (id === 'C1-01') return (state().remoteFinds||[]).includes('clinicCard') ? '盛禾提供 · 既存扫描件 · 原保管位置：卫生室药柜12号' : '现场原件检视 · 留存索引卡';
    if (id === 'C1-02') return (state().villageFinds||[]).includes('clinicPhoto') && !(state().remoteFinds||[]).includes('clinicPhoto') ? '现场原件检视 · 照片背面' : '匿名投稿人提供 · 私人照片副本';
    if (id === 'C1-09') return '匿名投稿人提供 · 私人投稿留言';
    if (config.external[id]) return '文章 / 原页摘录 · 外部链接待补';
    if (id.startsWith('C3')) return '现场调阅 · 祠堂与学校原件';
    if (id.startsWith('C4')) return '旧案调阅 · 原始登记与留存副本';
    if (id.startsWith('C5')) return '历史医疗与村登记 · 对应编号调阅';
    if (id.startsWith('C6')) return '接收移交档案 / 家庭自存资料';
    if (id === 'C7-02') return '盛承安此前上传 · SCA-OLD-01 · 母亲旧物副本';
    return '本案调阅副本 · 原始记录';
  }
  const table = (heads,rows) => `<div class="story-table-scroll"><table><thead><tr>${heads.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  function attachments(id) {
    if (id === 'C1-03') return '<h3>学籍附照 · 文字检视</h3>'+table(['学号','可核特征'],[['9608','右眉上方一小处浅疤；无鼻翼浅痣'],['9624','鼻翼旁浅痣；基层卫生人员进修登记'],['9641','左下颌浅痣；籍贯柳河']]);
    if (id === 'C1-04' || id === 'C1-05') return '<h3>照片检查卡</h3><p>实习照：名单学号9624，鼻翼旁浅痣。近年志愿合影：前排左二，鼻翼同处浅痣。每张照片的拍摄时间分别保留；外貌相符仍需学号与履历核验。</p>';
    if (id === 'C2-02' || id === 'C2-03') return '<h3>本机保留的外发动作快照</h3>'+table(['记录','资料对象','接收人','故事内发送时刻','操作人'],flow().sendRecords.filter(record=>id==='C2-02'?record.step!=='S04':record.step==='S04').map(record=>[record.step,record.target,'TG-240824-019',record.sentAt,record.operator]));
    if (id === 'C1-09') return '<h3>本次人物页</h3><p>盛承安，30岁，盛家村籍，在县城经营小公司。登记父亲：盛雄。</p><p>待发送字段：游戏用住址及联系电话。接收账号：TG-240824-019。</p>';
    if (id === 'C3-03') return '<h3>照片正反面检查卡</h3><div class="story-photo-count" aria-label="照片中两名成人和两名男孩"><span>成人</span><span>成人</span><span>男孩</span><span>男孩</span></div><p>背面：临川十三，行远十一。白边留有SY85-04馆藏章。原图与存留白边的衣角线条延续，章的两半可以拼合。</p>';
    if (id === 'N03' && done('M11')) return '<h3>家庭旧照调阅增页</h3><p>SY85-04：1985家庭原照。原底片袋与原图白边同号；折痕旁半枚章可与原边对齐。公开副本另存，不能覆盖原件。</p>';
    if (id === 'N04') return '<h3>测绘定位补记</h3><p>封闭旧门标号E-2。固定定位点为山墙端点与石阶转角，测量不可采用临时脚手架。</p>';
    if (id === 'H01') return '<h3>灯控巡检说明 · 静态记录</h3><p>短亮=点，长亮=划；空格分组三次。记录：<code>..--- .---- -----</code>。译码后查对应历史录音频道。</p>'+table(['数字','点划'],[['0','-----'],['1','.----'],['2','..---'],['3','...--'],['4','....-'],['5','.....'],['6','-....'],['7','--...'],['8','---..'],['9','----.']]);
    if (id === 'H03') return '<h3>测绘尺寸 · 文字测量板</h3><p>北向向上，比例1:100。山墙端点至石阶转角共同轮廓12米，图例已解释部分9米。独立墙厚0.3米。待核区域E-2在东侧；差值以米为单位，记录这段空间的宽度。</p><div class="story-measure"><span>共同轮廓 12m</span><span>已解释 9m</span><span>待核段</span></div>';
    if (id === 'H06') return '<h3>物主联 / 扫描联及交接表</h3><p>同一协议SJC-BG-2022-017：物主联页码止于2/2，扫描联止于3/3。物主返还申请说明未补签第三页。</p>'+table(['记录','物品号','标签 / 角色'],[['物品交接表','W-17','BG-017'],['专项任务对应表','BG-017','R-17']]);
    if (id === 'H07') return '<h3>同一铃响的双时间校准</h3>'+table(['事件','终端钟','手持钟'],[['开场同一铃响','21:00','21:03'],['原始回应','21:31','21:34']])+'<p>演员出场登记采用终端钟21:10。原音索引包含频道210，原始回应、环境声、导览配音分别归档。</p>';
    if (id === 'H09') return '<h3>授权盖章页摘录</h3>'+table(['委托','受托','范围','生效'],[['乡土旅游合作社','恒目管理顾问有限公司','专项保管、终端维护、受限档案复核','2021-09-20'],['乡土旅游合作社','岭川归灯文旅服务有限公司','前台导览、店铺和演职劳务','2026-01-12'],['关联服务办公室','恒慕婚姻家庭服务集团','仅单项家庭礼仪委托；旧号冻结','按各单附件']]);
    if (id === 'H11') return '<h3>频道210 · 同段文字声轨</h3>'+table(['时段','轨道','原始转写','公开版'],[['21:31:08—21:31:12','导览配音','请随灯向前。','保留'],['21:31:08—21:31:12','环境声','脚步、门框轻响。','保留'],['21:31:08—21:31:12','房内原始回应','我不是来接客的。','该段剪去']]);
    return '';
  }
  function body(id) {
    if (!available(id)) return '<p>这份材料尚未取得查阅条件。</p>';
    if (!unlocked(id)) return `<p>${esc(config.locks[id].cover)}</p><button data-story-doc="${id}">打开附件查验</button>`;
    let html = documents[id].body;
    if (id === 'C5-01' && !done('M18')) html = html.replace(/<p>栏目计算附页：.*?<\/p>/s,'');
    if (id === 'H14' && !done('X12')) html = html.split('<p><strong>处理后：')[0];
    if (id === 'H05') html = '<h3>原讲解稿 v1 · 原稿扫描</h3><p>盛长林一家旧照，背面题字保留。林知微的失踪与在村记录存在矛盾，另附两份原件。祠堂侧门于2008年封闭。</p><h3>游客讲解稿 v3 · 发布副本</h3><p>学校展柜：普通村户合影，人物信息陆续补充。照片仅保留画面主体。祠堂侧院：旧时即不通行，请随工作人员行走。</p><h3>流转审批附件</h3><p>编辑提交：裁去白边；个人经历移入专项复核，不进入游客稿；侧门表述统一。校对退回：不得改变照片原义，侧门说法与工单不符。运营验收页：按v3用于公开导览，异议另存，原扫描不覆盖。</p>';
    if (id === 'H08') html = '<p>2026年7月支付与归集凭证。先按交易号和批次核对，普通工资独立结算。</p>'+table(['交易号','批次','科目','金额（元）','归集凭证'],[['ZF-071','ZX-2607','特殊保管','18000','JG-2607-17'],['ZF-072','ZX-2607','终端校准','9600','JG-2607-17'],['ZF-073','ZX-2607','内容复核','7200','JG-2607-17'],['GZ-041','PT-2607','普通导览工资','5400','GZ-2607-04']])+'<h3>到款凭证</h3><p>JG-2607-17：对应ZF-071、ZF-072、ZF-073，接收方为恒目关联文化基金。GZ-2607-04：普通经营工资清单，收款人为当班演职人员。</p>';
    if (id === 'E02' && !done('X05')) html = html.replace(/<p>近年的村庄改造，.*?<\/p>/s,'');
    html = html.replaceAll('男／女，按主角选择显示',state().playerGender === 'female'?'女':'男').replaceAll('男／女按主角选择显示',state().playerGender === 'female'?'女':'男').replaceAll('次子／次女',state().playerGender === 'female'?'次女':'次子');
    html = html.replaceAll('陈默',esc(state().playerName || '主角')).replaceAll('默默六岁',esc((state().playerName || '孩子')+'六岁'));
    if (id === 'P07') html += `<p>经办：${esc(state().playerName || '主角')}（${state().playerGender==='female'?'女性':'男性'}）</p>`;
    return html+attachments(id)+externalLink(id);
  }
  function externalLink(id) {
    const link = config.external[id];
    if (!link) return '';
    // Empty URLs have no href, so placeholders never reload the page or open a fake source.
    return /^https?:\/\//.test(link.url) ? `<p class="story-external"><a href="${esc(link.url)}" target="_blank" rel="noopener noreferrer">查看外部原文</a></p>` : `<p class="story-external"><a role="link" aria-disabled="true" data-external-placeholder="${id}">${esc(link.label)}</a></p>`;
  }
  function openDoc(id) {
    if (!available(id)) return;
    capture(); reading = id;
    if(id.startsWith('J')&&!flow().lettersRead.includes(id))save({lettersRead:[...flow().lettersRead,id]});
    const reader = document.querySelector('#storyReader');
    reader.innerHTML = `<header><div><small>${esc(id)} · ${esc(source(id))}</small><h2>${esc(title(id))}</h2></div><button data-story-close aria-label="关闭文档">×</button></header><article class="story-document">${unlocked(id) ? body(id) : `<p>${esc(config.locks[id].cover)}</p><form id="storyUnlock" data-doc="${id}"><label>附件查验码<input name="code" autocomplete="off" required></label><button>查验并打开</button><p id="storyUnlockFeedback" role="status"></p></form>`}</article><footer>${unlocked(id) ? `<button data-story-collect="${id}" ${collected(id)?'disabled':''}>${id.startsWith('RW')?'留存番外':collected(id)?'已收入案卷':'连同来源收入案卷'}</button>` : ''}</footer>`;
    if (!reader.open) reader.showModal();
    reader.querySelector('[data-story-close]').focus();
  }
  function renderField(item,f,index,values) {
    const name = 'a'+index, value = values[name] || '';
    return `<label class="story-field"><span>${esc(f.label)}</span>${f.options ? `<select name="${name}" required><option value="">请选择</option>${f.options.map(option=>`<option value="${esc(option)}" ${value===option?'selected':''}>${esc(option)}</option>`).join('')}</select>` : `<input name="${name}" value="${esc(value)}" autocomplete="off" maxlength="80" required>`}</label>`;
  }
  function puzzle(item) {
    const values = drafts[item.id] || {}, finished = done(item.id), verified = flow().verified.includes(item.id);
    if (finished) return `<section class="story-result"><strong>✓ 已完成核验</strong><p>${esc(item.result || '结论已记录，原件和来源保留在案卷中。')}</p>${(item.outputs||[]).map(docButton).join('')}<button data-story-current>继续当前调查 →</button></section>`;
    return `<form id="storyPuzzle" data-step="${item.id}" novalidate><h3>${item.send&&verified?'资料发送预览':'提交你的核验'}</h3>${item.order?`<fieldset class="story-order"><legend>按发生时间从早到晚排列</legend>${item.order.map((_,i)=>`<label>${i+1}<select name="order${i}" required><option value="">选择时间卡</option>${[...item.order.slice(2),...item.order.slice(0,2)].map(card=>`<option value="${esc(card)}" ${values['order'+i]===card?'selected':''}>${esc(card)}</option>`).join('')}</select></label>`).join('')}</fieldset>`:''}<div class="story-fields">${item.fields.map((f,i)=>renderField(item,f,i,values)).join('')}</div>${item.checks?`<fieldset class="story-checks"><legend>${item.verifyNext?'保全与停止操作':'确认处理项'}</legend>${item.checks.map((label,i)=>`<label><input type="checkbox" name="check${i}" ${values['check'+i]?'checked':''}>${esc(label)}</label>`).join('')}</fieldset>`:''}${item.send&&verified?`<div class="story-send-preview"><strong>接收账号：TG-240824-019</strong><p>目标：${esc(item.send)}。字段：${item.send==='盛承安'?'住址及联系电话':'核验后联系资料及常住地区'}。</p><p>本次为游戏内资料外发，确认后写入不可撤回的发送回执。</p><button type="button" data-story-send="${item.id}">确认发送给匿名投稿人</button><button type="button" data-story-cancel-send="${item.id}">返回核验</button></div>`:`<button class="story-submit" type="submit">${item.send?'核验并预览发送范围':item.verifyNext?'保存操作并查看下一批':esc(item.confirmLabel || '提交核验')}</button>`}${item.verifyNext&&verified?`<div class="story-next-batch"><p>独立副本：SJC-R17-COPY-01。对象R-17：绑定已停止、自动续建已取消；原物及关系记录保留。</p><p>下一批 R-17-NEXT：未创建新角色。现场回应另留记录，不预填转生结论。</p><button type="button" data-story-next-batch>核对下一批，完成保全回执</button></div>`:''}<p class="story-feedback" role="status">${esc(feedback)}</p></form>`;
  }
  function docButton(id) {
    if (!available(id)) {
      if (id.startsWith('N')) return `<button class="story-doc-card" data-story-npc="${id}"><small>需向村民借阅</small><strong>${esc(title(id))}</strong><span>前往保管人处 →</span></button>`;
      return '';
    }
    return `<button class="story-doc-card" data-story-doc="${id}"><small>${esc(id)} · ${unlocked(id)?collected(id)?'已收入':'可查阅':'附件待查验'}</small><strong>${esc(title(id))}</strong><span>${esc(source(id))}</span></button>`;
  }
  function sceneMarkup(sceneId,item) {
    const [name,copy,image] = config.scenes[sceneId];
    const place=done('DEPART')&&config.fieldScenes[sceneId];
    return `<section class="story-scene ${image?'':'story-scene--desk'}">${image?`<img src="${image}" alt="${esc(name)}的像素场景">`:'<div class="story-desk-art" aria-hidden="true"><span>QT-073</span><i></i><b></b></div>'}<div class="story-scene-caption"><small>${sceneId} · ${item.id.startsWith('X')?'可选调查':'当前场景'}</small><h2>${esc(name)}</h2><p>${esc(copy)}</p>${place?`<button class="story-field-visit" data-story-place="${place}">进入现场</button>`:''}</div></section>`;
  }
  function lettersMarkup(){
    const received=config.letters.filter(letter=>available(letter.id));
    return `<section class="story-library"><h2>QT-073 · 选题通信</h2>${received.length?received.map(letter=>`<button class="story-letter" data-story-doc="${letter.id}"><small>${esc(letter.sender)} · ${flow().lettersRead.includes(letter.id)?'已读':'未读'}</small><strong>${esc(title(letter.id))}</strong></button>`).join(''):'<p>暂无通信。</p>'}</section>`;
  }
  function endingMarkup(){return `<section class="story-ending"><small>QT-073 · 报道已留档</small><h2>名字重新被看见</h2>${body('J09')}<div class="story-ending-actions"><button data-story-doc="E02">阅读已发布报道</button><button data-story-section="letters">选题通信</button><button data-open-village>继续村庄走访</button><button data-story-section="bonus">番外阅读</button></div></section>`;}
  function render() {
    const panel = document.querySelector('#page-story'); if (!api || !panel) return;
    const now = current();
    if (!active || !enabled(steps.get(active))) active = now.id;
    const item = steps.get(active);
    const visitedChapters = [...new Set(main.filter(enabled).map(s=>s.chapter))];
    const badges = `<button data-story-section="main" aria-pressed="${section==='main'}">当前调查</button><button data-story-section="files" aria-pressed="${section==='files'}">案卷 ${Object.keys(documents).filter(collected).length}</button>${done('DEPART')?`<button data-story-section="side" aria-pressed="${section==='side'}">可选走访</button><button data-open-village>村庄地图</button>`:''}<button data-story-search>岭川搜寻 ↗</button>${done('DEPART')?'<button data-story-section="bonus">番外阅读</button>':''}`;
    const unread=config.letters.filter(letter=>available(letter.id)&&!flow().lettersRead.includes(letter.id)).length;
    document.querySelectorAll('[data-letter-count]').forEach(node=>{node.textContent=unread?String(unread):'';});
    let content;
    if(section==='letters')content=lettersMarkup();
    else if(section==='main'&&done('PUBLISH')&&active==='PUBLISH')content=endingMarkup();
    else if (section==='main' && !enabled(now) && !main.some(s=>done(s.id))) content = `<section class="story-welcome"><span>QT-073 / 调查流程</span><h2>${!state().sent?'当前选题':!state().chapterOneStarted?'投稿回复':'远程资料交接'}</h2>${state().sent?(state().chapterOneStarted?'<button data-open-remote>打开远程资料桌</button>':'<button data-open-next-message>查看投稿回复</button>'):''}<button data-story-prologue>回到当前选题</button><div class="story-doc-grid">${Object.keys(legacy).filter(baseDocument).map(docButton).join('')}</div></section>`;
    else if (section==='files') content = `<section class="story-library"><h2>已取得的案卷材料</h2><p>材料按分卷保留，可随时回看出处。番外文章单独留存。</p><div class="story-doc-grid">${Object.keys(documents).filter(id=>collected(id)&&!id.startsWith('RW')).map(docButton).join('') || '<p>打开场景中的材料，再点击“连同来源收入案卷”。</p>'}</div></section>`;
    else if (section==='side') content = `<section class="story-library"><h2>盛家村 · 可选走访与档案</h2><p>这些调查不影响主线终审。可返回主线，也可在报道完成后继续。</p><div class="story-step-grid">${side.filter(enabled).map(s=>`<button data-story-step="${s.id}"><small>${s.id} · ${config.scenes[s.scene][0]}</small><strong>${esc(s.title)}</strong><span>${done(s.id)?'✓ 已核验':'进入调查 →'}</span></button>`).join('')}</div></section>`;
    else if (section==='bonus') content = `<section class="story-library"><h2>番外阅读</h2><p>前作人物的后续片段，作为番外独立留存。</p>${['RW01','RW02'].map(id=>available(id)?docButton(id):`<div class="story-reward-lock"><h3>${esc(title(id))}</h3><p>${id==='RW01'?'完成版本来源、专项对账与授权接续调查后留存。':'完成原声比对、观察核验与任务停止回执后留存。'}</p></div>`).join('')}</section>`;
    else content = `${sceneMarkup(item.id==='DEPART'&&!done('DEPART')?'SC10':item.scene,item)}<div class="story-investigation"><header><small>${item.chapter===8?'终审':'第'+item.chapter+'章'} · ${item.id}</small><h2>${esc(item.title)}</h2></header><div class="story-doc-grid">${item.docs.map(docButton).join('')}</div>${puzzle(item)}</div>`;
    panel.innerHTML = `<nav class="story-tools" aria-label="调查工具">${badges}<button data-story-section="letters">选题通信${unread?` · ${unread}`:''}</button></nav><div class="story-layout"><aside class="story-chapters"><small>调查记录</small>${visitedChapters.map(ch=>`<details ${item?.chapter===ch?'open':''}><summary>${ch===8?'终审报道':'第'+ch+'章'}</summary>${main.filter(s=>s.chapter===ch&&enabled(s)).map(s=>`<button data-story-step="${s.id}" class="${s.id===active?'is-current':''}">${done(s.id)?'✓':'◇'} ${esc(s.title)}</button>`).join('')}</details>`).join('')}<p>${flow().done.filter(id=>!id.startsWith('X')).length} / ${main.length} 调查步骤已完成</p>${flow().published?'<strong>报道已留档</strong>':''}</aside><div class="story-body">${content}</div></div>`;
  }
  function open(id) {
    capture(); feedback='';
    if (id && enabled(steps.get(id))) active=id;
    else active=current().id;
    section='main';
    desktopAPI.openWindow('workbench'); desktopAPI.showPage('story'); render();
  }
  function complete(item) {
    if (!enabled(item) || done(item.id)) return;
    const f=flow();
    const collectedIds = [...new Set([...f.collected,...(item.outputs||[])])];
    const patch = {done:[...f.done,item.id],collected:collectedIds};
    const extra = item.id==='DEPART'?{chapterThreeStarted:true,storyFlowVersion:2}:{};
    if (item.send) patch.sendRecords=[...f.sendRecords.filter(record=>record.step!==item.id),{step:item.id,target:item.send,recipient:'TG-240824-019',operator:state().playerName,sentAt:{M05:'2026-08-25 18:10',M06:'2026-08-26 16:30',S04:'2026-08-26 17:05'}[item.id],fields:item.id==='S04'?'住址及联系电话':'联系资料及常住地区'}];
    if (item.id==='PUBLISH') patch.published=true;
    save(patch,extra);
    feedback='';
    desktopAPI.showToast(item.id==='DEPART'?'已抵达盛家村':'调查已记录',item.result || item.title);
    render();
  }
  function submit(form) {
    const item=steps.get(form.dataset.step);
    if (!enabled(item)||done(item.id)) return;
    capture();
    const values=drafts[item.id]||{};
    const missing=item.docs.filter(id=>!collected(id));
    if (missing.length) {feedback='材料尚未收齐。';render();return;}
    const bad=item.fields.findIndex((f,i)=>norm(values['a'+i])!==norm(f.answer==='$player'?state().playerName:f.answer));
    if (bad>=0) {feedback='核验未通过。';render();return;}
    if (item.order?.some((card,i)=>values['order'+i]!==card)) {feedback='核验未通过。';render();return;}
    if (item.checks?.some((_,i)=>!values['check'+i])) {feedback='尚有操作未确认。';render();return;}
    if (item.send || item.verifyNext) {save({verified:[...new Set([...flow().verified,item.id])]});feedback='';render();return;}
    complete(item);
  }
  window.StoryFlow = {
    init(callbacks) {
      api=callbacks;drafts=flow().drafts;
      window.addEventListener('pagehide',()=>save({}));
      const reader=document.createElement('dialog'); reader.id='storyReader';reader.className='story-reader';reader.setAttribute('aria-label','案卷文档阅读器');document.body.append(reader);
      document.addEventListener('arg-state-changed',render);
      document.addEventListener('click',event=>{
        const b=event.target.closest('button'); if(!b)return;
        if(b.hasAttribute('data-story-letters')){open();section='letters';render();return;}
        if(b.dataset.storyPlace){if(done('DEPART')&&Object.values(config.fieldScenes).includes(b.dataset.storyPlace))api.openVillage(b.dataset.storyPlace);return;}
        if(b.dataset.storyDoc){openDoc(b.dataset.storyDoc);return;}
        if(b.hasAttribute('data-story-close')){reader.close();return;}
        if(b.dataset.storyCollect){const id=b.dataset.storyCollect;if(available(id)&&unlocked(id)){save({collected:[...new Set([...flow().collected,id])]});openDoc(id);}return;}
        if(b.dataset.storyStep){open(b.dataset.storyStep);return;}
        if(b.dataset.storySection){capture();section=b.dataset.storySection;feedback='';render();return;}
        if(b.hasAttribute('data-story-current')||b.hasAttribute('data-story-open')){open();return;}
        if(b.hasAttribute('data-story-prologue')){desktopAPI.showPage('case-detail');return;}
        if(b.hasAttribute('data-story-search')){capture();desktopAPI.openWindow('archive');window.LingchuanSearch.focus();return;}
        if(b.dataset.storyNpc){reader.close();const npc=window.VillageCast[Number(b.dataset.storyNpc.slice(1))-1];if(npc&&done('DEPART'))api.openVillage(npc.scene);return;}
        if(b.dataset.storySend){const item=steps.get(b.dataset.storySend);if(item?.send&&flow().verified.includes(item.id))complete(item);return;}
        if(b.dataset.storyCancelSend){save({verified:flow().verified.filter(id=>id!==b.dataset.storyCancelSend)});return;}
        if(b.hasAttribute('data-story-next-batch')&&flow().verified.includes('X12')){save({nextChecked:true});complete(steps.get('X12'));return;}
      });
      document.addEventListener('submit',event=>{
        if(event.target.id==='storyPuzzle'){event.preventDefault();submit(event.target);}
        if(event.target.id==='storyUnlock'){
          event.preventDefault();const id=event.target.dataset.doc;
          if(!available(id)||!config.locks[id])return;
          const code=new FormData(event.target).get('code');
          if(norm(code)===norm(config.locks[id].code)){save({unlocked:[...new Set([...flow().unlocked,id])]});openDoc(id);}
          else document.querySelector('#storyUnlockFeedback').textContent='查验码不符。';
        }
      });
      render();
    },
    collect(id){if(available(id)&&unlocked(id))save({collected:[...new Set([...flow().collected,id])]});},
    render, open, openDoc, available, canRead:id=>available(id)&&unlocked(id), body, source,
    files(){return Object.keys(documents).filter(id=>collected(id)&&!id.startsWith('RW')).map(id=>({id:'story:'+id,type:'档',title:title(id),meta:source(id)}));},
    documentBody(id){id=id.replace(/^story:/,'');return collected(id)?`<h2>${esc(title(id))}</h2><p>${esc(source(id))}</p>${body(id)}`:'<p>尚未收入案卷。</p>';},
    legacyBody(id){const doc=Object.keys(legacy).find(key=>legacy[key]===id)||('N'+String(npcIds.indexOf(id)+1).padStart(2,'0'));return documents[doc]&&available(doc)?`<span class="document-kicker">${esc(source(doc))}</span><h2>${esc(title(doc))}</h2>${body(doc)}${doc.startsWith('N')?`<p class="document-source">提供人：${esc(window.VillageCast[Number(doc.slice(1))-1].name)} · 经借阅收入本案</p>`:''}`:null;},
    current:()=>current().id, completed:done
  };
})();
