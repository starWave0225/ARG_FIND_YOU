(() => {
  const STORAGE_KEY = 'find-you-state-v1';
  const villagePage = new URLSearchParams(location.search).get('view') === 'village';
  const previewVillage = new URLSearchParams(location.search).get('preview') === 'village';
  const villageCast = window.VillageCast || [];
  const defaults = {
    playerGender: null,
    playerName: '',
    accepted: false,
    envelopeOpened: false,
    clues: [],
    legacyOpened: false,
    rosterUnlocked: false,
    personFound: false,
    conclusionBuilt: false,
    confirmed: false,
    sent: false,
    chapterOneStarted: false,
    storyFlowVersion: 2,
    chapterThreeStarted: false,
    remoteFinds: [],
    villageFinds: [],
    clinicSolved: false,
    npcDocuments: [],
    npcTopics: {},
    searchQuery: '',
    searchHistory: [],
    searchBookmarks: [],
    searchVisited: [],
    searchFilters: {}
  };

  const clueCatalog = {
    envelopeFactory: { title: '东岚农机厂', detail: '旧信封上的收件单位', icon: '厂' },
    envelopePostcode: { title: '43?1?0', detail: '信封上残缺的六位邮编', icon: '邮' },
    postalArea: { title: '435160 · 东岚镇', detail: '1993 年邮政区划记录', icon: '址' },
    renamedFactory: { title: '东岚机电二厂', detail: '东岚农机厂 2000 年后的名称', icon: '档' },
    workerNumber: { title: '原工号 0717', detail: '维修二组职工合影胸牌', icon: '照' },
    movedRongchuan: { title: '2003 年调往荣川', detail: '退休人员通讯录内部备注', icon: '录' }
  };

  let state = loadState();
  let pendingGender = state.playerGender;
  let identityInitialized = false;
  let artifactMode = 'envelope';
  let zoom = 1;
  let filesPath = 'root';
  const initialScene = new URLSearchParams(location.search).get('scene');
  let villageView = initialScene === 'map' || window.VillageScenes?.[initialScene] ? initialScene : (villagePage ? 'entrance' : 'map');
  let selectedEvidence = [];
  let activeNpc = null;
  let npcTopic = null;

  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {};
      if (previewVillage) {
        const original = localStorage.getItem(STORAGE_KEY);
        if (original) localStorage.setItem(`${STORAGE_KEY}-before-village-${Date.now()}`, original);
        const flow = raw.storyProgress || {};
        const route = window.StoryConfig.main;
        const beforeVillage = route.slice(0, route.findIndex(item => item.id === 'DEPART') + 1);
        const union = (current, extra) => [...new Set([...(Array.isArray(current) ? current : []), ...extra])];
        const times = {M05:'2026-08-25 18:10',M06:'2026-08-26 16:30',S04:'2026-08-26 17:05'};
        const records = Array.isArray(flow.sendRecords) ? [...flow.sendRecords] : [];
        for (const item of beforeVillage.filter(item => item.send)) {
          if (!records.some(record => record.step === item.id)) records.push({step:item.id,target:item.send,recipient:'TG-240824-019',operator:raw.playerName || '主角',sentAt:times[item.id],fields:item.id==='S04'?'住址及联系电话':'联系资料及常住地区'});
        }
        Object.assign(raw, {accepted:true,envelopeOpened:true,legacyOpened:true,rosterUnlocked:true,personFound:true,conclusionBuilt:true,confirmed:true,sent:true,chapterOneStarted:true,clinicSolved:true,chapterThreeStarted:true,storyFlowVersion:2,
          clues:union(raw.clues,Object.keys(clueCatalog)),remoteFinds:union(raw.remoteFinds,['clinicCard','clinicPhoto']),
          storyProgress:{...flow,done:union(flow.done,beforeVillage.map(item=>item.id)),collected:union(flow.collected,['P01','P02','P03','P04','P05','P06','P07','P08',...beforeVillage.flatMap(item=>[...item.docs,...(item.outputs || [])])]),unlocked:union(flow.unlocked,['C1-05']),sendRecords:records}
        });
        localStorage.setItem(STORAGE_KEY,JSON.stringify(raw));
        const url = new URL(location.href);url.searchParams.delete('preview');history.replaceState(null,'',url.pathname+url.search+url.hash);
      }
      const saved = { ...defaults, ...raw };
      saved.playerName = normalizePlayerName(raw.playerName);
      saved.playerGender = ['male', 'female'].includes(raw.playerGender) ? raw.playerGender : null;
      // Old first-chapter visits retain their evidence, never the new visit permission.
      saved.chapterThreeStarted = raw.storyFlowVersion === 2 && raw.chapterThreeStarted === true && raw.sent === true;
      saved.storyFlowVersion = 2;
      saved.remoteFinds = [...new Set(Array.isArray(raw.remoteFinds) ? raw.remoteFinds.filter(id => ['clinicCard', 'clinicPhoto'].includes(id)) : [])];
      saved.clues = Array.isArray(saved.clues) ? saved.clues : [];
      saved.villageFinds = Array.isArray(saved.villageFinds) ? saved.villageFinds : [];
      const documentIds = new Set(villageCast.map(npc => npc.document.id));
      saved.npcDocuments = [...new Set(Array.isArray(saved.npcDocuments) ? saved.npcDocuments.filter(id => documentIds.has(id)) : [])];
      const oldTopics = saved.npcTopics && typeof saved.npcTopics === 'object' ? saved.npcTopics : {};
      saved.npcTopics = Object.fromEntries(villageCast.map(npc => [npc.id,
        Array.isArray(oldTopics[npc.id]) ? [...new Set(oldTopics[npc.id].filter(id => npc.topics.some(topic => topic.id === id)))] : []
      ]));
      saved.conclusionBuilt = Boolean(saved.conclusionBuilt || saved.confirmed || saved.sent);
      return saved;
    }
    catch { return { ...defaults }; }
  }

  function canVisitVillage() { return state.chapterThreeStarted && state.sent; }

  // Only real scene navigation records a visit; rendering and storage sync never do.
  function enterVillageScene(scene) {
    villageView = scene === 'map' || window.VillageScenes?.[scene] ? scene : 'map';
    if (villagePage && canVisitVillage()) {
      const url = new URL(location.href);
      url.searchParams.set('scene', villageView);
      history.replaceState(null, '', url.pathname + url.search + url.hash);
      const flags = { ...state.sceneFlags };
      if (villageView === 'shrine') {
        if (flags.shrineSeen && flags.shrineDeparted) flags.shrineGhost = true;
        flags.shrineSeen = true;
      } else if (flags.shrineSeen) {
        flags.shrineDeparted = true;
      }
      if (JSON.stringify(flags) !== JSON.stringify(state.sceneFlags || {})) {
        saveState({sceneFlags: flags});
        return;
      }
    }
    renderVillage();
  }

  function hasClinicFile(id) { return state.remoteFinds.includes(id) || state.villageFinds.includes(id); }

  function saveState(patch = {}) {
    state = { ...state, ...patch };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderGame();
    document.dispatchEvent(new Event('arg-state-changed'));
  }

  function addClue(id) {
    if (state.clues.includes(id)) return;
    state.clues = [...state.clues, id];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    desktopAPI.showToast('线索已记录', clueCatalog[id].title);
    renderGame();
  }

  function openCase() {
    desktopAPI.closeModal();
    desktopAPI.openWindow('workbench');
    desktopAPI.showPage('case-detail');
    renderGame();
  }

  function openEnvelope() {
    artifactMode = 'envelope';
    zoom = 1;
    if (!state.envelopeOpened) saveState({ envelopeOpened: true });
    renderArtifact();
    desktopAPI.openWindow('artifact');
  }

  function openFactoryPhoto() {
    artifactMode = 'factory';
    zoom = 1;
    renderArtifact();
    desktopAPI.openWindow('artifact');
  }

  function renderArtifact() {
    const envelope = document.querySelector('#envelopeArtifact');
    const photo = document.querySelector('#factoryPhotoArtifact');
    const title = document.querySelector('#artifactWindowTitle');
    const filename = document.querySelector('#artifactFilename');
    const side = document.querySelector('#artifactSide');
    envelope.classList.toggle('is-visible', artifactMode === 'envelope');
    photo.classList.toggle('is-visible', artifactMode === 'factory');
    document.querySelector('#artifactCanvas').style.setProperty('--artifact-zoom', zoom);
    document.querySelector('#zoomLevel').textContent = `${Math.round(zoom * 100)}%`;

    if (artifactMode === 'envelope') {
      title.textContent = '投稿附件 · 图像查看器';
      filename.textContent = '旧信封背面.jpg';
      side.innerHTML = `
        <span class="eyebrow eyebrow--dark">TG-240824-019 / 附件 1</span>
        <h3>旧信封背面</h3>
        <p>匿名投稿人说，这是他手上唯一留下来的东西。纸张受潮严重，有些字只能勉强辨认。</p>
        <div class="artifact-observations">
          <button data-record-clue="envelopeFactory" class="${state.clues.includes('envelopeFactory') ? 'is-recorded' : ''}"><i>${state.clues.includes('envelopeFactory') ? '✓' : '+'}</i><span><strong>记录收件单位</strong><small>“东岚……农机厂”</small></span></button>
          <button data-record-clue="envelopePostcode" class="${state.clues.includes('envelopePostcode') ? 'is-recorded' : ''}"><i>${state.clues.includes('envelopePostcode') ? '✓' : '+'}</i><span><strong>记录残缺邮编</strong><small>“43?1?0”</small></span></button>
        </div>
        `;
    } else {
      title.textContent = '网页图片 · 图像查看器';
      filename.textContent = '维修二组_1998年合影.jpg';
      side.innerHTML = `
        <span class="eyebrow eyebrow--dark">东岚机电退休职工之家</span>
        <h3>维修二组职工合影</h3>
        <p>网页说明：摄于 1998 年厂庆前夕。照片里没有写姓名，但有人还戴着原工号牌。</p>
        <form class="artifact-answer" id="workerNumberForm">
          <label>照片中能够辨认的工号</label>
          <div><input id="workerNumberInput" inputmode="numeric" maxlength="4" placeholder="输入四位数字" value="${state.clues.includes('workerNumber') ? '0717' : ''}" ${state.clues.includes('workerNumber') ? 'disabled' : ''}/><button ${state.clues.includes('workerNumber') ? 'disabled' : ''}>${state.clues.includes('workerNumber') ? '已记录' : '确认'}</button></div>
          <small id="workerNumberFeedback">${state.clues.includes('workerNumber') ? '工号已加入本案线索。' : ''}</small>
        </form>`;
    }
  }

  function renderGame() {
    renderIdentitySetup();
    renderCaseDetail();
    renderEvidence();
    renderFiles();
    renderVillage();
    renderVillageIcon();
    renderNpcDialogue();
    if (document.querySelector('#window-artifact')?.classList.contains('is-open')) renderArtifact();
  }

  function normalizePlayerName(value) {
    if (typeof value !== 'string') return '';
    const name = value.trim();
    return name && [...name].length <= 12 && !/[\p{Cc}\p{Cf}]/u.test(name) ? name : '';
  }

  function escapedPlayerName() {
    const text = document.createElement('span');
    text.textContent = state.playerName || '未登记';
    return text.innerHTML;
  }

  function randomPlayerName() {
    const names = ['林予安', '江时宁', '程知秋', '陆望舒', '陈以南', '苏清越',
      '叶书言', '宋云舟', '郑言溪', '梁听澜', '徐景初', '何怀远'];
    return names[Math.floor(Math.random() * names.length)];
  }

  function renderIdentitySetup() {
    const layer = document.querySelector('#identitySetup');
    if (!layer) return;
    const hasIdentity = Boolean(state.playerName) && ['male', 'female'].includes(state.playerGender);
    const wasOpen = !layer.classList.contains('is-hidden');
    layer.classList.toggle('is-hidden', hasIdentity);
    layer.setAttribute('aria-hidden', String(hasIdentity));
    layer.inert = hasIdentity;
    for (const child of document.querySelector('#desktop').children) {
      if (child !== layer) child.inert = !hasIdentity;
    }
    document.documentElement.dataset.playerGender = state.playerGender || '';
    if (!identityInitialized) {
      // Suggest once per opening; gender changes and rerenders preserve the player's edits.
      document.querySelector('#playerName').value = state.playerName || randomPlayerName();
      if (!hasIdentity) document.querySelector('#playerName').focus();
      identityInitialized = true;
    }
    layer.querySelectorAll('[data-player-gender]').forEach(button => {
      const selected = button.dataset.playerGender === pendingGender;
      button.setAttribute('aria-pressed', String(selected));
      button.querySelector('i').textContent = selected ? '已选择' : '选择';
    });
    document.querySelectorAll('[data-player-name]').forEach(node => { node.textContent = state.playerName || '未登记'; });
    document.querySelectorAll('[data-player-initial]').forEach(node => { node.textContent = [...state.playerName][0] || '你'; });
    if (document.querySelector('#page-home').classList.contains('is-visible')) {
      document.querySelector('#pageSubtitle').textContent = state.playerName
        ? `下午好，${state.playerName}。今天有 1 份新投稿等待处理。`
        : '下午好。今天有 1 份新投稿等待处理。';
    }
    if (hasIdentity && wasOpen) document.querySelector('[data-page="home"]').focus();
  }

  function playerTerms() {
    return state.playerGender === 'female'
      ? { gender: 'female', label: '女性', pronoun: '她', sibling: '妹妹' }
      : { gender: 'male', label: '男性', pronoun: '他', sibling: '弟弟' };
  }

  function renderCaseDetail() {
    const list = document.querySelector('#clueList');
    if (!list) return;
    document.querySelector('#clueCount').textContent = `${state.clues.length} / ${Object.keys(clueCatalog).length}`;
    list.innerHTML = state.clues.length
      ? state.clues.map(id => `<button class="clue-chip"><i>${clueCatalog[id].icon}</i><span><strong>${clueCatalog[id].title}</strong><small>${clueCatalog[id].detail}</small></span></button>`).join('')
      : '<p class="clue-empty">还没有记录可用线索。</p>';

    const objective = getObjective();
    document.querySelector('#objectiveTitle').textContent = objective.title;
    document.querySelector('#objectiveCopy').textContent = '';
    document.querySelector('#objectiveActions').innerHTML = objective.action;
    document.querySelector('#caseStateLabel').textContent = state.sent ? '已发送' : state.confirmed ? '已找到' : state.personFound ? '身份确认' : '资料核查';

    const progressStep = state.sent ? 4 : state.personFound ? 3 : state.clues.includes('postalArea') ? 2 : 1;
    document.querySelectorAll('#caseProgress div').forEach((item, index) => {
      item.classList.toggle('is-complete', index + 1 < progressStep || state.sent);
      item.classList.toggle('is-current', index + 1 === progressStep && !state.sent);
    });

    const logs = [
      ['14:36', '选题建立', '匿名投稿人希望寻找三十多年没有联系的故人盛德昌。'],
      ...(state.envelopeOpened ? [['14:38', '查看附件', '打开投稿附件“旧信封背面.jpg”。']] : []),
      ...(state.clues.includes('postalArea') ? [['14:46', '地区确认', '残缺邮编对应岭川县东岚镇。']] : []),
      ...(state.legacyOpened ? [['14:53', '单位沿革', '东岚农机厂后更名为东岚机电二厂。']] : []),
      ...(state.rosterUnlocked ? [['15:02', '去向确认', '盛德昌于 2003 年调往荣川。']] : []),
      ...(state.personFound ? [['15:11', '建立候选', '人物库中找到一名信息吻合的盛德昌。']] : []),
      ...(state.confirmed ? [['15:14', '确认找到', '三项身份信息相互吻合。']] : []),
      ...(state.sent ? [['15:16', '资料已发送', '联系方式已发送给投稿人匿名投稿人。']] : [])
    ];
    document.querySelector('#caseLog').innerHTML = logs.map(item => `<div class="log-item"><time>${item[0]}</time><i></i><div><strong>${item[1]}</strong><p>${item[2]}</p></div></div>`).join('');

    const target = document.querySelector('#targetCard');
    if (!state.personFound) {
      target.innerHTML = '<div class="target-placeholder"><span>?</span><div><strong>目标人物尚未确认</strong><p>找到足够信息后，在人物库建立候选人。</p></div></div>';
    } else {
      target.innerHTML = `
        <div class="target-profile">
          <div class="target-avatar">盛</div>
          <div><span class="eyebrow eyebrow--dark">CANDIDATE 01</span><h3>盛德昌</h3><p>男 · 67 岁 · 荣川市</p></div>
          <span class="match-rate">${state.confirmed ? '身份已确认' : '3 项吻合'}</span>
        </div>
        <div class="match-list"><span>姓名一致 <b>✓</b></span><span>原单位沿革吻合 <b>✓</b></span><span>调动地区吻合 <b>✓</b></span></div>
        ${state.confirmed
          ? '<button class="target-confirmed" disabled>✓ 已确认找到</button>'
          : state.conclusionBuilt
            ? '<button class="case-primary case-primary--full" data-confirm-target>确认是同一个人</button>'
            : '<button class="case-secondary case-primary--full" data-open-evidence>先在证据墙提交身份结论</button>'}`;
    }
  }

  function getObjective() {
    if (state.chapterOneStarted && state.clinicSolved && window.StoryFlow) return {
      title: '继续跨文档调查', copy: '调阅当前阶段的材料、核对来源，并提交调查结论。',
      action: '<button class="case-primary" data-story-open>打开调查流程</button>'
    };
    const hasEnvelopeClues = state.clues.includes('envelopeFactory') && state.clues.includes('envelopePostcode');
    if (!state.envelopeOpened || !hasEnvelopeClues) return {
      title: '先看看投稿人留下的旧信封',
      copy: '地址已经受潮。把仍能辨认的收件单位和邮编记录下来。',
      action: '<button class="case-primary" data-open-envelope>查看旧信封</button>'
    };
    if (!state.clues.includes('postalArea') || !state.legacyOpened) return {
      title: '确认地址，并追查这家工厂',
      copy: '用残缺邮编和“东岚农机厂”检索地方资料。旧单位可能已经改过名字。',
      action: '<button class="case-primary" data-objective="archive">打开资料检索</button>'
    };
    if (!state.clues.includes('workerNumber')) return {
      title: '在旧厂网页里找盛德昌留下的编号',
      copy: '退休职工网页只有一张维修二组合影。通讯录提示密码为“原工号”。',
      action: '<button class="case-primary" data-objective="legacy">打开旧厂网页</button>'
    };
    if (!state.rosterUnlocked) return {
      title: '打开退休人员通讯录',
      copy: '你已经从合影中找到一枚四位工号。用它试试压缩包。',
      action: '<button class="case-primary" data-objective="legacy">返回旧厂网页</button>'
    };
    if (!state.personFound) return {
      title: '用新线索核对人物库',
      copy: '目前最可靠的组合是：盛德昌、荣川、东岚原单位。',
      action: '<button class="case-primary" data-objective="people">打开人物库</button>'
    };
    if (!state.conclusionBuilt) return {
      title: '不要只凭同名确认身份',
      copy: '从证据墙挑出三项能够相互闭合的材料，提交一句调查结论。',
      action: '<button class="case-primary" data-open-evidence>前往证据墙</button><button class="case-secondary" data-case-tool="files">查阅案卷</button>'
    };
    if (!state.confirmed) return {
      title: '核验盛德昌的身份',
      copy: '核对候选人的原单位、工号和调动地区，确认各份记录能否对应。',
      action: '<button class="case-primary" data-focus-target>查看身份依据</button>'
    };
    if (!state.sent) return {
      title: '把找到的结果告诉匿名投稿人',
      copy: '节目流程要求将目标人物的联系方式回传给投稿人。发送后无法撤回。',
      action: '<button class="case-primary case-primary--danger" data-send-result>发送联系资料</button>'
    };
    return {
      title: state.chapterOneStarted ? '第一章：继续寻找故人' : '第一位故人已经找到',
      copy: state.chapterOneStarted ? (state.clinicSolved ? '姓名与去向已核对。下一步查岭川卫生学校学籍和退休名册。' : '匿名投稿人补发了旧照片。先查看附件，再向资料联络员申请独立扫描件。') : '匿名投稿人很快回复了“谢谢”。十分钟后，他又发来了第二个名字。',
      action: state.chapterOneStarted ? '<button class="case-primary" data-open-remote>打开远程资料桌</button><button class="case-secondary" data-case-tool="files">查看新增案卷</button>' : '<button class="case-secondary" data-open-next-message>查看匿名投稿人的回复</button>'
    };
  }

  function renderEvidence() {
    const locked = document.querySelector('#evidenceLocked');
    const board = document.querySelector('#evidenceBoard');
    if (!locked || !board) return;
    const open = state.clues.length >= 2;
    locked.style.display = open ? 'none' : 'grid';
    board.classList.toggle('is-visible', open);
    document.querySelector('#boardCount').textContent = `${state.clues.length} 条记录`;
    const required = ['renamedFactory', 'workerNumber', 'movedRongchuan'];
    const canConclude = required.every(id => state.clues.includes(id));
    document.querySelector('#boardCanvas').innerHTML = `
      ${state.clues.map((id, index) => `
        <button class="board-note ${selectedEvidence.includes(id) ? 'is-selected' : ''}" data-evidence-id="${id}" style="--x:${7 + (index % 3) * 31}%;--y:${8 + Math.floor(index / 3) * 38}%;--r:${index % 2 ? 2 : -2}deg">
          <i>${clueCatalog[id].icon}</i><strong>${clueCatalog[id].title}</strong><p>${clueCatalog[id].detail}</p><span>${selectedEvidence.includes(id) ? '已选作依据' : '点击选为依据'}</span>
        </button>`).join('')}
      <section class="evidence-conclusion">
        <div><span class="eyebrow eyebrow--dark">INVESTIGATION CONCLUSION</span><h3>${state.conclusionBuilt ? '身份结论已成立' : '提交身份结论'}</h3><p>${state.conclusionBuilt ? '原单位沿革、原工号与调动地区形成连续记录。' : '选择三项最能证明“人物库里的盛德昌就是旧信封收件人”的材料。'}</p></div>
        ${state.conclusionBuilt
          ? '<button disabled>✓ 已提交：三类记录指向同一人</button>'
          : `<button data-submit-conclusion ${canConclude ? '' : 'disabled'}>提交所选依据 <b>${selectedEvidence.length} / 3</b></button>`}
        <small id="conclusionFeedback">${canConclude ? '' : '尚不能提交。'}</small>
      </section>`;
    const lockLabel = document.querySelector('.nav-item[data-page="evidence"] .nav-lock');
    if (lockLabel) lockLabel.textContent = open ? `${state.clues.length} 条` : '未开放';
  }

  function availableDocuments() {
    return [
      state.accepted && { id: 'intake', type: 'TXT', title: 'TG-240824-019_投稿登记', meta: '今天 14:36 · 投稿原文' },
      state.envelopeOpened && { id: 'envelope', type: 'JPG', title: '旧信封_检视记录', meta: '今天 14:38 · 附件批注' },
      state.clues.includes('postalArea') && { id: 'postal', type: 'PDF', title: '1993_东岚邮政区划表', meta: '地方志扫描件 · 第 6 页' },
      state.legacyOpened && { id: 'factory', type: 'PDF', title: '东岚农机厂_沿革摘录', meta: '企业档案 · 2000 年' },
      state.rosterUnlocked && { id: 'roster', type: 'ZIP', title: '维修二组_退休通讯录', meta: '已解密 · 工号 0717' },
      state.conclusionBuilt && { id: 'conclusion', type: '结', title: 'QT-073_身份核验结论', meta: '三项材料闭合' },
      state.sent && { id: 'receipt', type: 'LOG', title: 'QT-073_资料发送回执', meta: '不可撤回 · 16:04' },
      hasClinicFile('clinicCard') && { id: 'clinic-card', type: '卡', title: '卫生室_药柜索引卡', meta: state.remoteFinds.includes('clinicCard') ? '盛禾提供 · 已有扫描件' : '现场原件检视 · 已留存' },
      hasClinicFile('clinicPhoto') && { id: 'clinic-photo', type: '照', title: '妇幼宣传照_背面题记', meta: state.remoteFinds.includes('clinicPhoto') ? '匿名投稿人补发 · 来源待交叉核验' : '现场原件检视 · 已留存' },
      state.clinicSolved && { id: 'luo-lead', type: '结', title: '罗桂枝_初步去向结论', meta: '第一章 · 新线索' },
      ...villageCast.filter(npc => state.npcDocuments.includes(npc.document.id)).map(npc => npc.document),
      ...(window.LingchuanSearch?.documents() || []),
      ...(window.StoryFlow?.files() || []),
      ...(window.VillageEffects?.files() || [])
    ].filter(Boolean);
  }

  function documentBody(id) {
    if (id === 'scene-afterimage') return window.VillageEffects?.body(id) || '';
    if (id.startsWith('story:')) return window.StoryFlow?.documentBody(id) || '';
    const fullDraft = window.StoryFlow?.legacyBody(id);
    if (fullDraft) return fullDraft;
    if (id.startsWith('search:')) return window.LingchuanSearch.documentBody(id);
    const terms = playerTerms();
    const docs = {
      intake: `<span class="document-kicker">投稿登记 / TG-240824-019</span><h2>想找几位很多年没见的故人</h2><dl><div><dt>投稿人</dt><dd>匿名投稿人 · TG-240824-019</dd></div><div><dt>首位目标</dt><dd>盛德昌，曾在东岚农机厂工作</dd></div><div><dt>唯一附件</dt><dd>旧信封背面.jpg</dd></div></dl><blockquote>“这几年身体不如以前，总想起过去的一些事。”</blockquote><p class="document-note">登记员备注：投稿人一次提到“几位故人”，但首轮只提供了一个姓名。</p>`,
      envelope: `<span class="document-kicker">附件检视记录 / 14:38</span><h2>旧信封背面</h2><figure><img src="./assets/evidence/old-envelope.png" alt="旧信封" /></figure><dl><div><dt>可辨单位</dt><dd>东岚农机厂</dd></div><div><dt>残缺数字</dt><dd>43?1?0</dd></div><div><dt>纸面便笺</dt><dd>“到荣川后记得来信”</dd></div></dl><p class="document-note">这句话不能证明盛德昌已经去了荣川，只能作为后续核验方向。</p>`,
      postal: `<span class="document-kicker">岭川县地方志馆 / 扫描页 06</span><h2>一九九三年邮政投递区划调整表</h2><table><thead><tr><th>支局</th><th>服务区域</th><th>邮政编码</th></tr></thead><tbody><tr><td>东岚邮电支局</td><td>东岚镇、盛家村及周边厂矿</td><td><b>435160</b></td></tr><tr><td>青源邮电支局</td><td>青源街道</td><td>435171</td></tr></tbody></table><p class="document-note">检索结论：信封残码与东岚镇区划一致。</p>`,
      factory: `<span class="document-kicker">企业沿革档案 / DL-2000-17</span><h2>东岚农机厂改制登记摘录</h2><p>二〇〇〇年六月，东岚农机厂改制并更名为<strong>东岚机电二厂</strong>。原厂址、维修车间人事档案与退休关系由新单位承接。</p><div class="document-stamp">岭川县<br />企业档案</div><p class="document-note">因此旧信封与退休职工网页属于同一条单位沿革链。</p>`,
      roster: `<span class="document-kicker">内部通讯资料 / 2008</span><h2>维修车间退休、调离人员</h2><table><thead><tr><th>原工号</th><th>姓名</th><th>原班组</th><th>去向</th></tr></thead><tbody><tr><td>0717</td><td><b>盛德昌</b></td><td>维修二组</td><td>2003 年调往荣川，后办理退休</td></tr></tbody></table><p class="document-note">文件密码与 1998 年合影胸牌一致，形成跨材料主键。</p>`,
      conclusion: `<span class="document-kicker">QT-073 / 调查结论</span><h2>人物库候选人与旧信封收件人为同一人</h2><ol><li>东岚农机厂后来更名为东岚机电二厂；</li><li>1998 年维修二组合影中的原工号为 0717；</li><li>同一工号的通讯录记录了盛德昌于 2003 年调往荣川。</li></ol><p class="document-note">经办：${escapedPlayerName()}（${terms.label}） · 结论由玩家提交，不由系统自动生成。</p>`,
      receipt: `<span class="document-kicker document-kicker--danger">外发回执 / 不可撤回</span><h2>联系资料已发送</h2><dl><div><dt>接收账号</dt><dd>TG-240824-019</dd></div><div><dt>目标人物</dt><dd>盛德昌</dd></div><div><dt>发送内容</dt><dd>联系电话、荣川市青源区常住地区</dd></div><div><dt>操作人</dt><dd>${escapedPlayerName()}</dd></div></dl><p class="document-warning">系统未记录投稿人与目标人物的关系证明。本回执将在后续事件时间线中保留。</p>`,
      'clinic-card': `<span class="document-kicker">${state.remoteFinds.includes('clinicCard') ? '盛禾提供 / 既存索引卡扫描件 / 原保管位置：药柜12号' : '现场原件检视 / 留存索引卡'}</span><h2>借用与代领索引卡</h2><table><tbody><tr><th>1995.06.17</th><td>桂枝　代罗家婶取药</td></tr><tr><th>1995.08.03</th><td>桂枝　协助妇幼宣传照登记</td></tr><tr><th>1995.09.11</th><td>罗桂枝　县里来函已转交</td></tr></tbody></table><p class="document-note">“桂枝”在最后一条记录中出现了完整姓名。</p>`,
      'clinic-photo': `<span class="document-kicker">${state.remoteFinds.includes('clinicPhoto') ? '匿名投稿人补发 / 宣传照副本 / 背面铅笔字' : '现场原件检视 / 照片背面'}</span><h2>一九九五年妇幼宣传照</h2><div class="photo-placeholder"><b>旧照片已严重褪色</b><span>左侧年轻女子鼻翼旁有一颗浅痣</span></div><blockquote>“桂枝去县里念卫校了。照片留卫生室。”</blockquote><p class="document-note">题记只证明去向，仍需与完整姓名交叉核验。</p>`,
      'luo-lead': `<span class="document-kicker">第一章 / 初步结论</span><h2>罗桂枝曾在村卫生室帮忙，后来去了县卫校</h2><p>药柜索引卡提供完整姓名，宣传照背面提供去向。下一步应检索<strong>岭川卫生学校 1996 级名录</strong>，再用籍贯、年龄和照片特征排除同名者。</p><p class="document-note">旧照中桂枝的身份仍待核验。</p>`
    };
    const npc = villageCast.find(person => person.document.id === id && state.npcDocuments.includes(id));
    if (npc) return `<span class="document-kicker">村庄访谈 / ${npc.name} / ${npc.place}</span>${npc.document.body}<p class="document-source">提供人：${npc.name} · ${npc.role} · 经玩家请求借阅后收入 QT-073 案卷</p>`;
    return docs[id] || '<h2>文件暂时无法读取</h2>';
  }

  function renderFiles() {
    const view = document.querySelector('#filesView');
    if (!view) return;
    if (filesPath === 'remote') { renderRemoteDesk(view); return; }
    if (filesPath.startsWith('doc:')) {
      const id = filesPath.slice(4);
      const doc = availableDocuments().find(item => item.id === id);
      view.innerHTML = `<div class="address-bar"><button data-files-back="case">← QT-073</button>${state.chapterOneStarted ? '<button data-open-remote>远程资料桌</button>' : ''}<span>此电脑 &gt; 选题资料 &gt; QT-073 &gt; ${doc?.title || '文件'}</span></div><article class="case-document">${documentBody(id)}</article>`;
      return;
    }
    if (filesPath === 'case') {
      const docs = availableDocuments();
      view.innerHTML = `<div class="address-bar"><button data-files-back="root">← 选题资料</button><span>此电脑 &gt; 选题资料 &gt; 本周投稿 &gt; QT-073</span><b>${docs.length} 个文件</b></div><div class="folder-grid folder-grid--documents">${docs.map(doc => `<button data-open-document="${doc.id}"><span class="file-doc file-doc--${doc.type.toLowerCase()}">${doc.type}</span><strong>${doc.title}</strong><small>${doc.meta}</small></button>`).join('')}</div>`;
      return;
    }
    view.innerHTML = `<div class="address-bar"><span>此电脑 &gt; 选题资料</span></div><div class="folder-grid"><button data-file-folder="case"><span class="large-folder"></span><strong>本周投稿</strong><small>${state.accepted ? `QT-073 · ${availableDocuments().length} 个文件` : '等待建立选题'}</small></button><button><span class="large-folder"></span><strong>采访录音</strong><small>昨天 18:05</small></button><button><span class="large-folder"></span><strong>照片待核</strong><small>8月21日</small></button><button><span class="file-doc">DOC</span><strong>选题工作守则</strong><small>2024年3月</small></button></div>`;
  }

  function openRemoteDesk() {
    if (!state.chapterOneStarted || !state.sent) return;
    filesPath = 'remote';
    desktopAPI.openWindow('files');
    renderFiles();
  }

  function renderRemoteDesk(view) {
    if (!state.chapterOneStarted || !state.sent) {
      view.innerHTML = '<article class="case-document"><h2>暂无后续寻人资料</h2></article>';
      return;
    }
    view.innerHTML = `<div class="address-bar"><button data-files-back="case">← QT-073</button><span>第一章 · 远程资料桌</span></div><article class="case-document remote-desk"><span class="document-kicker">节目电脑 / 资料接收与核验</span><h2>先确认照片里的桂枝是谁</h2><div class="remote-search-entry"><button data-objective="archive">打开岭川搜寻</button></div><p>村庄名称出现在旧资料里。你目前仍在节目电脑前，通过附件和资料联络继续查找。</p><section class="remote-source"><h3>匿名投稿人的补充附件</h3><p>“翻到了这张老照片，背面也拍给你们。她以前在卫生室帮过忙。”</p><p class="document-note">来源：投稿人持有的照片副本；说法仍需独立记录核验。</p><button data-remote-find="clinicPhoto">${hasClinicFile('clinicPhoto') ? '重读宣传照副本' : '接收宣传照正反面'}</button></section><section class="remote-source"><h3>地方资料联络 · 盛禾</h3><p>“我存着一份以前整理的卫生室索引卡扫描件，原件放在药柜12号。这就把对应页发给你。照片里的人，还得查学籍确认。”</p><button data-remote-find="clinicCard">${hasClinicFile('clinicCard') ? '重读索引卡扫描件' : '申请并接收已有扫描件'}</button></section><section class="scene-journal">${clinicJournal(true)}</section>${state.clinicSolved ? '<p class="prototype-note">扫描件初步核验完成。继续调阅学籍与校友原页，核对后续去向。</p><button class="case-primary" data-story-open>继续调查：学籍与后续材料 →</button>' : ''}</article>`;
  }

  function receiveRemoteFile(id) {
    if (!state.chapterOneStarted || !state.sent || !['clinicCard', 'clinicPhoto'].includes(id)) return;
    if (!hasClinicFile(id)) saveState({ remoteFinds: [...state.remoteFinds, id] });
    readCaseDocument(id === 'clinicCard' ? 'clinic-card' : 'clinic-photo');
  }

  function renderVillageIcon() {
    const icon = document.querySelector('#villageDesktopIcon');
    if (!icon) return;
    icon.hidden = !canVisitVillage();
    icon.querySelector('i').textContent = canVisitVillage() ? `${state.villageFinds.length + state.npcDocuments.length} 份材料` : '';
  }

  function renderVillage() {
    const explorer = document.querySelector('#villageExplorer');
    if (!explorer) return;
    if (!canVisitVillage()) {
      explorer.innerHTML = '<div class="village-locked"><span>村</span><h2>现场档案尚未建立</h2><p>目前尚未安排实地走访。先在节目电脑通过投稿附件、检索和远程联系推进调查。</p></div>';
      return;
    }
    const inspected = state.villageFinds.filter(id => ['clinicCard', 'clinicPhoto'].includes(id)).length;
    const collection = `${inspected} / 2 原件核验 · ${state.npcDocuments.length} / 6 村民档案`;
    const locations = [
      { id: 'clinic', title: '废弃卫生室', note: '药柜与书桌', x: 24, y: 48, mark: '01' },
      { id: 'hall', title: '祠堂外石阶', note: window.StoryFlow?.completed('DEPART') ? '盛石生 · 旧档调阅' : '盛石生 · 内室未开放', x: 48, y: 23, mark: '石' },
      { id: 'forest', title: '林场火场遗址', note: '烧毁的值守屋', x: 14, y: 17, mark: '林' },
      { id: 'night-lane', title: '中央夜巷', note: '石井与旧巷', x: 60, y: 58, mark: '巷' },
      { id: 'arrival', title: '村口暮色', note: '村外山路', x: 30, y: 88, mark: '路' },
      { id: 'lane', title: '巷道杂货铺', note: '钱素兰', x: 50, y: 51, mark: '店' },
      { id: 'entrance', title: '村口旧邮亭', note: '盛福根', x: 46, y: 88, mark: '邮' },
      { id: 'school', title: '旧学校', note: '邱映秋', x: 78, y: 31, mark: '校' },
      { id: 'bridge', title: '河桥', note: '何小满', x: 77, y: 75, mark: '桥' },
      { id: 'service', title: '便民服务室', note: '盛禾', x: 30, y: 69, mark: '档' }
    ];
    if (villageView === 'map') {
      explorer.innerHTML = `
        <header class="village-head"><div><span>CHAPTER 03 · 第四个人</span><h2>盛家村现场调查图</h2><p>第一次抵达盛家村。带着先前的扫描件核验原件，也可以拜访村民。点击场景中的人物，询问后借阅材料。</p></div><b>${collection}</b></header>
        <div class="village-map"><img src="./assets/pixel/maps/shengjia-village-exploration-map-v1.png" alt="盛家村探索地图" />
          ${locations.map(place => `<button style="--hx:${place.x}%;--hy:${place.y}%" data-village-place="${place.id}" aria-label="${place.title}，${place.note}" class="${place.id === 'clinic' && !state.clinicSolved ? 'is-current' : ''}"><i>${place.mark}</i><span>${place.title}<small>${place.note}</small></span></button>`).join('')}
        </div><section class="village-visits" aria-label="村民拜访记录"><h3>村民拜访 <span>${state.npcDocuments.length} / 6 份档案已入库</span></h3><div>${villageCast.map(npc => `<button data-village-place="${npc.scene}"><span>${npc.name}</span><small>${npc.place}</small><b>${state.npcDocuments.includes(npc.document.id) ? '✓ 档案已收录' : (state.npcTopics[npc.id] || []).length ? '已交谈 · 可再拜访' : '尚未交谈'}</b></button>`).join('')}</div></section>`;
      return;
    }
    const scene = window.VillageScenes[villageView];
    if (!scene) { villageView='map'; renderVillage(); return; }
    const npc = villageCast.find(person => person.id === scene.npc);
    const isClinic = villageView === 'clinic';
    const dark = isClinic && state.sceneFlags?.clinicDark;
    const ghost = villageView === 'shrine' && state.sceneFlags?.shrineGhost;
    const image = ghost ? scene.ghostImage : dark ? './assets/pixel/environments/abandoned-clinic-anomaly-v1.png' : scene.image;
    const box = coords => `left:${coords[0]}%;top:${coords[1]}%;width:${coords[2]}%;height:${coords[3]}%`;
    const spots = scene.spots.map((spot,index) => {
      const action = ghost && spot.ghostText ? `data-ghost-statue="${index}"` : spot.detail ? `data-scene-detail="${spot.detail}"` : spot.find ? `data-scene-find="${spot.find}"` : spot.doc ? `data-story-doc="${spot.doc}"` : spot.light ? 'data-scene-light' : spot.effect ? `data-scene-effect="${spot.effect}"` : spot.ritual ? 'data-scene-ritual' : `data-scene-inspect="${index}"`;
      return `<button class="scene-object" ${action} aria-label="${spot.label}" style="${box(spot.box)}"><span>${spot.label}</span></button>`;
    }).join('');
    const npcTarget = npc ? `<button class="npc-hitbox" data-npc="${npc.id}" aria-label="与${npc.name}交谈" style="${box(scene.npcBox)}"><span>${npc.name}</span></button>` : '';
    explorer.innerHTML = `<section class="scene-shell scene-shell--immersive" data-scene="${villageView}">
      <header><button data-village-map>← 地图</button><h2>${scene.title}</h2><div><button data-scene-investigation>调查记录</button><button data-scene-casefiles>案卷</button></div></header>
      <div class="scene-picture-space"><div class="pixel-scene ${npc?'pixel-scene--encounter':''} ${dark?'is-anomalous':''} ${ghost?'is-ghost-shrine':''}" style="--scene-ratio:${scene.ratio || 1672/941}"><img src="${image}" alt="${scene.title}" />${npcTarget}${spots}</div></div>
      <nav class="scene-exits" aria-label="场景出口">${scene.exits.map(id=>`<button data-village-place="${id}">${window.VillageScenes[id].title} →</button>`).join('')}${isClinic?'<button data-scene-clinic-records>原件核验记录</button>':''}${villageView==='forest'?'<button data-story-doc="C4-06">调阅录像资料</button>':''}${villageView==='hall-interior'?'<button data-story-step="M10">旧档核验</button>':''}</nav>
    </section>`;
    window.VillageEffects?.mount(villageView, explorer.querySelector('.pixel-scene'));
    window.GhostHands?.mount(villageView, explorer.querySelector('.pixel-scene'));
  }

  function inspectScene(index) {
    const spot = window.VillageScenes[villageView]?.spots[index];
    const text = villageView === 'shrine' && state.sceneFlags?.shrineGhost ? spot?.ghostText : spot?.text;
    if (!text || !canVisitVillage()) return;
    const dialog = document.querySelector('#sceneInspection');
    dialog.querySelector('h2').textContent = spot.label;
    dialog.querySelector('.scene-inspection-body').textContent = text;
    if (!dialog.open) dialog.showModal();
    if (spot.anomaly && !state.sceneFlags?.clinicDark) saveState({sceneFlags:{...state.sceneFlags,clinicDark:true}});
  }

  function topicAvailable(npc, topic) {
    if (!canVisitVillage() || !npc || !topic) return false;
    if (topic.evidence && !(state.storyProgress?.collected || []).includes(topic.evidence)) return false;
    if (topic.after && !(state.npcTopics[npc.id] || []).includes(topic.after)) return false;
    if (topic.requires === 'clinicCard') return hasClinicFile('clinicCard');
    if (topic.requires === 'clinicSolved') return state.clinicSolved;
    if (topic.requires === 'npcDocument') return state.npcDocuments.some(id => id !== npc.document.id);
    return true;
  }

  function renderNpcDialogue() {
    const dialog = document.querySelector('#npcDialogue');
    const npc = villageCast.find(person => person.id === activeNpc);
    if (!dialog || !npc) return;
    const topic = npc.topics.find(item => item.id === npcTopic);
    const received = state.npcDocuments.includes(npc.document.id);
    const read = state.npcTopics[npc.id] || [];
    dialog.innerHTML = `<header class="npc-dialogue-head"><div><span>${npc.place} · ${npc.role}</span><h2 id="npcDialogueName">${npc.name}</h2></div><button data-npc-close aria-label="结束交谈">离开 ×</button></header><div class="npc-dialogue-body"><figure class="npc-dialogue-portrait"><img src="${npc.image}" alt="${npc.name}" /></figure><div class="npc-conversation"><p id="npcSpeech" tabindex="-1" aria-live="polite">${topic ? topic.reply : npc.greeting}</p>${(topic?.documents || []).filter(doc => window.StoryFlow?.available(doc.id)).map(doc => `<button data-story-doc="${doc.id}">${doc.label}</button>`).join('')}<div class="npc-topics" aria-label="选择话题">${npc.topics.filter(item => !item.evidence || topicAvailable(npc, item)).map(item => `<button data-npc-topic="${item.id}" ${topicAvailable(npc, item) ? '' : 'disabled'} aria-pressed="${npcTopic === item.id}"><span>${item.label}</span><small>${!topicAvailable(npc, item) ? '尚未开放' : read.includes(item.id) ? '已聊过 · 可重温' : '询问'}</small></button>`).join('')}</div><div class="npc-receipt" aria-live="polite">${received ? `<p>✓ 已收入案卷：${npc.document.title}</p><button data-npc-read="${npc.document.id}">打开这份档案</button>` : topic?.offer && topicAvailable(npc, topic) ? `<p>${npc.name}同意借阅这份材料。</p><button data-npc-claim>拍摄并收入案卷</button>` : '<p>尚未取得借阅许可。</p>'}</div></div></div>`;
  }

  function openNpc(id) {
    const npc = villageCast.find(person => person.id === id);
    if (!npc || !canVisitVillage() || npc.scene !== villageView) return;
    activeNpc = id;
    npcTopic = null;
    renderNpcDialogue();
    const dialog = document.querySelector('#npcDialogue');
    if (!dialog.open) dialog.showModal();
  }

  function readCaseDocument(id) {
    if (!availableDocuments().some(item => item.id === id)) return;
    for (const dialog of document.querySelectorAll('#npcDialogue, #sceneInspection')) if (dialog.open) dialog.close();
    filesPath = `doc:${id}`;
    desktopAPI.openWindow('files');
    renderFiles();
  }

  function clinicJournal(remote = false) {
    const prefix = remote ? 'remoteClinic' : 'clinic';
    const ready = hasClinicFile('clinicCard') && hasClinicFile('clinicPhoto');
    return `<h3>${remote ? '远程材料核验' : '原件核验记录'}</h3><button data-open-document="clinic-card" ${hasClinicFile('clinicCard') ? '' : 'disabled'}>药柜索引卡 <b>${hasClinicFile('clinicCard') ? '查看' : '未取得'}</b></button><button data-open-document="clinic-photo" ${hasClinicFile('clinicPhoto') ? '' : 'disabled'}>宣传照背面 <b>${hasClinicFile('clinicPhoto') ? '查看' : '未取得'}</b></button>${state.clinicSolved ? '<div class="clinic-solved">✓ 结论已记录：罗桂枝去了县卫校</div>' : `<form id="${prefix}Conclusion"><label>两份材料共同指向哪里？</label><div><input id="${prefix}Answer" placeholder="输入地点或学校类型" ${ready ? '' : 'disabled'} /><button ${ready ? '' : 'disabled'}>提交结论</button></div><small id="${prefix}Feedback" data-clinic-feedback>${ready ? '' : '材料未齐。'}</small></form>`}`;
  }

  function addVillageFind(id) {
    if (!canVisitVillage() || villageView !== 'clinic' || !['clinicCard', 'clinicPhoto'].includes(id) || state.villageFinds.includes(id)) return;
    state.villageFinds = [...state.villageFinds, id];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    desktopAPI.showToast('原件核验已记录', id === 'clinicCard' ? '药柜索引卡的原件检视已留存。' : '宣传照原件与背面题记的检视已留存。');
    renderGame();
  }

  function openArchive() {
    desktopAPI.openWindow('archive');
    window.LingchuanSearch.focus();
  }

  function archiveSearch(query) {
    return window.LingchuanSearch.search(query);
  }

  function showLegacySite() {
    if (!state.legacyOpened) saveState({ legacyOpened: true });
    if (!state.clues.includes('renamedFactory')) addClue('renamedFactory');
    const content = `
      <div class="legacy-site">
        <header><div><b>东岚机电二厂</b><span>退休职工之家</span></div><small>最后更新：2008-04-17</small></header>
        <nav>网站首页　｜　厂史沿革　｜　老照片　｜　职工通讯录</nav>
        <div class="legacy-body">
          <aside><strong>站内栏目</strong><a>厂区新闻</a><a>历届劳模</a><a>退休职工</a><a>照片留言</a><p>本站由退休职工自发维护</p></aside>
          <main>
            <h2>维修二组老照片</h2>
            <button class="legacy-photo" data-open-factory-photo><img src="./assets/evidence/factory-team-1998.png" alt="维修二组职工合影" /><span>1998 年维修二组职工合影（点击放大）</span></button>
            <section class="protected-download">
              <div class="zip-icon">ZIP</div><div><strong>退休人员通讯录.zip</strong><p>更新于 2008-04-17 · 文件已加密</p></div>
              ${state.rosterUnlocked ? '<span class="download-opened">已解锁</span>' : '<button data-open-password>打开</button>'}
            </section>
            <div id="passwordArea">${state.rosterUnlocked ? rosterContent() : ''}</div>
          </main>
        </div>
      </div>`;
    window.LingchuanSearch.openEmbedded('东岚机电二厂退休职工之家', content);
  }

  function rosterContent() {
    return `<div class="roster-paper"><span>内部通讯资料 · 2008 年整理</span><h3>维修车间退休、调离人员</h3><div class="roster-row"><b>0717</b><strong>盛德昌</strong><span>维修二组</span><em>2003 年调往荣川，后办理退休</em></div><p>注：联系方式仅供原厂职工联络使用。</p></div>`;
  }

  function showPasswordForm() {
    document.querySelector('#passwordArea').innerHTML = `
      <form class="zip-password" id="zipPasswordForm"><label>请输入文件密码</label><div><input id="zipPassword" autocomplete="off" /><button>确定</button></div><small id="zipFeedback"></small></form>`;
    document.querySelector('#zipPassword')?.focus();
  }

  function peopleSearch(name, extra) {
    if (!state.accepted || name !== '盛德昌') return false;
    const result = document.querySelector('#searchResult');
    if (!state.rosterUnlocked || !/荣川|东岚|机电|农机/.test(extra)) {
      result.innerHTML = '<div class="result-note"><strong>结果过多，暂时无法确认。</strong><br>“盛德昌”共有 18 条同名记录。请补充地区或曾用单位。</div>';
      return true;
    }
    result.innerHTML = `
      <article class="person-result-card">
        <div class="person-result-avatar">盛</div>
        <div><span>人物库编号 RW-330184</span><h3>盛德昌</h3><p>男 · 67 岁 · 现居荣川市青源区</p></div>
        <b>高匹配</b>
        <dl><div><dt>曾用单位</dt><dd>东岚机电二厂</dd></div><div><dt>入厂记录</dt><dd>原东岚农机厂维修二组</dd></div><div><dt>调动记录</dt><dd>2003 年转入荣川农机配件公司</dd></div></dl>
        <button data-add-candidate>${state.personFound ? '已加入本案' : '加入候选人'}</button>
      </article>`;
    return true;
  }

  function showSendDialog() {
    const layer = document.createElement('div');
    layer.className = 'decision-layer';
    layer.innerHTML = `<article><span class="decision-icon">⇧</span><h2>发送给匿名投稿人？</h2><p>将向投稿人发送盛德昌目前的联系电话与常住地区。按照栏目流程，发送后无法撤回。</p><div class="decision-data"><span>接收账号</span><b>TG-240824-019</b><span>资料</span><b>联系方式、现居地区</b></div><footer><button data-cancel-send>再检查一下</button><button class="confirm-send" data-confirm-send>确认发送</button></footer></article>`;
    document.querySelector('#desktop').appendChild(layer);
  }

  function showNextMessage() {
    const layer = document.createElement('div');
    layer.className = 'decision-layer';
    layer.innerHTML = `<article class="message-dialog"><span class="eyebrow eyebrow--dark">匿名投稿人 · 刚刚</span><h2>谢谢，辛苦你们了。</h2><p>德昌之后，我还想找一个人。她叫罗桂枝，以前在村卫生室帮过忙，后来好像去县里念了卫校。</p><div class="message-attachment"><span>补充附件</span><b>一九九五年妇幼宣传照 · 正反面</b><small>投稿人提供副本，需与独立资料核验</small></div><footer><button data-close-decision>稍后再看</button><button class="case-primary" data-start-chapter-one>查看补充附件</button></footer></article>`;
    document.querySelector('#desktop').appendChild(layer);
  }

  document.querySelector('#identityForm').addEventListener('submit', event => {
    event.preventDefault();
    const input = document.querySelector('#playerName');
    const feedback = document.querySelector('#identityFeedback');
    const playerName = normalizePlayerName(input.value);
    input.setAttribute('aria-invalid', String(!playerName));
    if (!playerName) {
      feedback.textContent = '请输入 1—12 个字的姓名，不包含控制字符。';
      input.focus();
      return;
    }
    if (!['male', 'female'].includes(pendingGender)) {
      feedback.textContent = '请选择主角性别，再开始游戏。';
      document.querySelector('button[data-player-gender]').focus();
      return;
    }
    feedback.textContent = '';
    saveState({ playerName, playerGender: pendingGender });
    desktopAPI.showToast('主角档案已建立', `${playerName} · ${playerTerms().label} · 30 岁`);
  });

  document.addEventListener('click', event => {
    const identityButton = event.target.closest('button[data-player-gender]');
    if (identityButton) {
      const playerGender = identityButton.dataset.playerGender;
      if (playerGender === 'male' || playerGender === 'female') {
        pendingGender = playerGender;
        renderIdentitySetup();
      }
      return;
    }

    const npcButton = event.target.closest('[data-npc]');
    if (npcButton) { openNpc(npcButton.dataset.npc); return; }
    if (event.target.closest('[data-npc-close]')) { document.querySelector('#npcDialogue').close(); return; }
    const npc = villageCast.find(person => person.id === activeNpc);
    const topicButton = event.target.closest('[data-npc-topic]');
    if (topicButton && npc) {
      const topic = npc.topics.find(item => item.id === topicButton.dataset.npcTopic);
      if (!topicAvailable(npc, topic)) return;
      npcTopic = topic.id;
      saveState({ npcTopics: { ...state.npcTopics, [npc.id]: [...new Set([...(state.npcTopics[npc.id] || []), topic.id])] } });
      document.querySelector('#npcSpeech')?.focus();
      return;
    }
    if (event.target.closest('[data-npc-claim]') && npc) {
      const topic = npc.topics.find(item => item.id === npcTopic);
      if (!topic?.offer || !topicAvailable(npc, topic) || state.npcDocuments.includes(npc.document.id)) return;
      saveState({ npcDocuments: [...state.npcDocuments, npc.document.id] });
      return;
    }
    const npcRead = event.target.closest('[data-npc-read]');
    if (npcRead && npc && npcRead.dataset.npcRead === npc.document.id && state.npcDocuments.includes(npc.document.id)) {
      document.querySelector('#npcDialogue').close();
      readCaseDocument(npc.document.id);
      return;
    }

    const envelopeButton = event.target.closest('[data-open-envelope], #openEnvelopeFromSubmission');
    if (envelopeButton) { openEnvelope(); return; }

    const caseRow = event.target.closest('[data-case="QT-073"]');
    if (caseRow) { openCase(); return; }

    if (event.target.closest('#caseBack')) { desktopAPI.showPage('cases'); return; }

    const clueButton = event.target.closest('[data-record-clue]');
    if (clueButton) { addClue(clueButton.dataset.recordClue); renderArtifact(); return; }

    const tool = event.target.closest('[data-case-tool]')?.dataset.caseTool;
    if (tool === 'archive') openArchive();
    if (tool === 'people') { desktopAPI.showPage('people'); }
    if (tool === 'files') desktopAPI.openWindow('files');

    if (event.target.closest('[data-open-evidence]')) { desktopAPI.showPage('evidence'); return; }
    if (event.target.closest('[data-open-village]')) { desktopAPI.openWindow('village'); enterVillageScene('map'); return; }

    const evidenceCard = event.target.closest('[data-evidence-id]');
    if (evidenceCard && !state.conclusionBuilt) {
      const id = evidenceCard.dataset.evidenceId;
      selectedEvidence = selectedEvidence.includes(id)
        ? selectedEvidence.filter(item => item !== id)
        : selectedEvidence.length < 3 ? [...selectedEvidence, id] : [...selectedEvidence.slice(1), id];
      renderEvidence();
      return;
    }
    if (event.target.closest('[data-submit-conclusion]')) {
      const required = ['renamedFactory', 'workerNumber', 'movedRongchuan'];
      const correct = required.every(id => selectedEvidence.includes(id));
      if (correct) {
        saveState({ conclusionBuilt: true });
        desktopAPI.showToast('身份结论已提交', '三项跨年代材料形成连续记录。');
      } else {
        const feedback = document.querySelector('#conclusionFeedback');
        if (feedback) feedback.textContent = '核验未通过。';
      }
      return;
    }

    const folder = event.target.closest('[data-file-folder]')?.dataset.fileFolder;
    if (folder === 'case') {
      if (!state.accepted) desktopAPI.showToast('文件夹为空', '接受新投稿后，系统会自动建立选题案卷。');
      else { filesPath = 'case'; renderFiles(); }
      return;
    }
    const filesBack = event.target.closest('[data-files-back]')?.dataset.filesBack;
    if (filesBack) { filesPath = filesBack; renderFiles(); return; }
    const documentId = event.target.closest('[data-open-document]')?.dataset.openDocument;
    if (documentId) { readCaseDocument(documentId); return; }

    if (event.target.closest('[data-open-remote]')) { openRemoteDesk(); return; }
    const sourceDocument = event.target.closest('[data-open-search-document]')?.dataset.openSearchDocument;
    if (sourceDocument) { desktopAPI.openWindow('archive'); window.LingchuanSearch.openDocument(sourceDocument); return; }
    const remoteFind = event.target.closest('[data-remote-find]')?.dataset.remoteFind;
    if (remoteFind) { receiveRemoteFile(remoteFind); return; }

    if (event.target.closest('[data-start-chapter-one]')) {
      if (!state.sent) return;
      event.target.closest('.decision-layer')?.remove();
      saveState({ chapterOneStarted: true });
      openRemoteDesk();
      desktopAPI.showToast('第一章已解锁', '补充附件与远程资料申请已加入案卷。');
      return;
    }
    if (event.target.closest('[data-close-scene-inspection]')) { document.querySelector('#sceneInspection').close(); return; }
    const inspection = event.target.closest('[data-scene-inspect]');
    if (inspection) { inspectScene(Number(inspection.dataset.sceneInspect)); return; }
    if (event.target.closest('[data-scene-light]')) { if (villageView === 'clinic' && canVisitVillage()) saveState({sceneFlags:{...state.sceneFlags,clinicDark:!state.sceneFlags?.clinicDark}}); return; }
    if (event.target.closest('[data-scene-casefiles]')) { filesPath='case'; renderFiles(); desktopAPI.openWindow('files'); return; }
    if (event.target.closest('[data-scene-investigation]')) { window.StoryFlow.open(); return; }
    if (event.target.closest('[data-scene-clinic-records]')) {
      const dialog=document.querySelector('#sceneInspection');dialog.querySelector('h2').textContent='原件核验记录';dialog.querySelector('.scene-inspection-body').innerHTML=clinicJournal();dialog.showModal();return;
    }
    if (event.target.closest('[data-village-map]')) { enterVillageScene('map'); return; }
    const villagePlace = event.target.closest('[data-village-place]')?.dataset.villagePlace;
    if (villagePlace) { enterVillageScene(villagePlace); return; }
    const sceneFind = event.target.closest('[data-scene-find]')?.dataset.sceneFind;
    if (sceneFind) { addVillageFind(sceneFind); return; }

    const objective = event.target.closest('[data-objective]')?.dataset.objective;
    if (objective === 'archive') openArchive();
    if (objective === 'legacy') { desktopAPI.openWindow('archive'); showLegacySite(); }
    if (objective === 'people') { desktopAPI.showPage('people'); document.querySelector('#personName').focus(); }

    const archiveAction = event.target.closest('[data-archive-action]')?.dataset.archiveAction;
    if (archiveAction === 'postal') addClue('postalArea');
    if (archiveAction === 'legacy') showLegacySite();

    if (event.target.closest('[data-open-factory-photo]')) openFactoryPhoto();
    if (event.target.closest('[data-open-password]')) showPasswordForm();
    if (event.target.closest('[data-add-candidate]')) { saveState({ personFound: true }); desktopAPI.showToast('候选人已建立', '返回选题页核对身份依据。'); peopleSearch('盛德昌', '荣川'); }
    if (event.target.closest('[data-confirm-target]')) { saveState({ confirmed: true }); desktopAPI.showToast('确认找到', '盛德昌的身份信息已闭合。'); }
    if (event.target.closest('[data-focus-target]')) document.querySelector('#targetCard')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (event.target.closest('[data-send-result]')) showSendDialog();
    if (event.target.closest('[data-cancel-send], [data-close-decision]')) event.target.closest('.decision-layer')?.remove();
    if (event.target.closest('[data-confirm-send]')) { event.target.closest('.decision-layer')?.remove(); saveState({ sent: true }); desktopAPI.showToast('发送成功', '联系资料已发送给匿名投稿人。'); }
    if (event.target.closest('[data-open-next-message]')) showNextMessage();


  });

  document.addEventListener('submit', event => {
    if (event.target.id === 'workerNumberForm') {
      event.preventDefault();
      const input = document.querySelector('#workerNumberInput');
      if (input.value.trim() === '0717') { addClue('workerNumber'); renderArtifact(); }
      else document.querySelector('#workerNumberFeedback').textContent = '核验未通过。';
    }
    if (event.target.id === 'zipPasswordForm') {
      event.preventDefault();
      const input = document.querySelector('#zipPassword');
      if (input.value.trim() === '0717') {
        saveState({ rosterUnlocked: true });
        if (!state.clues.includes('movedRongchuan')) addClue('movedRongchuan');
        showLegacySite();
      } else {
        document.querySelector('#zipFeedback').textContent = '密码不正确。';
        input.select();
      }
    }
    if (['clinicConclusion', 'remoteClinicConclusion'].includes(event.target.id)) {
      event.preventDefault();
      if (!state.chapterOneStarted || !hasClinicFile('clinicCard') || !hasClinicFile('clinicPhoto')) return;
      const input = event.target.querySelector('input');
      if (/卫校|卫生学校/.test(input.value.trim())) {
        saveState({ clinicSolved: true });
        if (document.querySelector('#sceneInspection').open) document.querySelector('.scene-inspection-body').innerHTML = clinicJournal();
        desktopAPI.showToast('核验完成', '记录已留存。');
      } else {
        event.target.querySelector('[data-clinic-feedback]').textContent = '核验未通过。';
        input.select();
      }
    }
  });

  document.querySelector('#acceptSubmission')?.addEventListener('click', () => {
    if (!state.accepted) saveState({ accepted: true });
    else openCase();
  });

  document.querySelector('#zoomIn')?.addEventListener('click', () => { zoom = Math.min(1.75, zoom + .25); renderArtifact(); });
  document.querySelector('#zoomOut')?.addEventListener('click', () => { zoom = Math.max(.5, zoom - .25); renderArtifact(); });

  document.querySelector('#npcDialogue').addEventListener('close', () => { activeNpc = null; npcTopic = null; });

  window.ARGGame = {
    handleArchiveSearch: archiveSearch,
    handlePeopleSearch: peopleSearch,
    reset() { localStorage.removeItem(STORAGE_KEY); location.reload(); },
    getState() { return { ...state }; },
    getPlayerTerms() { return { ...playerTerms() }; }
  };

  window.StoryFlow?.init({ getState: () => state, saveState, openVillage(scene) {
    if (!canVisitVillage()) return;
    desktopAPI.openWindow('village', {scene}); enterVillageScene(scene);
  } });

  window.LingchuanSearch.init({
    getState: () => state,
    saveState,
    openLegacy: showLegacySite,
    record(type) { if (type === 'postal') addClue('postalArea'); if (type === 'factory') addClue('renamedFactory'); },
    request(id) { if (id !== 'clinicCard') return;
      if (!hasClinicFile(id)) saveState({remoteFinds:[...state.remoteFinds,id]});
      readCaseDocument('clinic-card'); },
    toast: (title, message) => desktopAPI.showToast(title, message)
  });
  window.VillageEffects?.init({getState:()=>state,saveState});
  window.GhostHands?.init({getState:()=>state,saveState});
  window.addEventListener('storage', event => {
    if (event.key !== STORAGE_KEY || event.storageArea !== localStorage) return;
    state = loadState();
    pendingGender = state.playerGender;
    desktopAPI.syncAccepted(state.accepted);
    renderGame();
    document.dispatchEvent(new Event('arg-state-changed'));
  });
  if (villagePage) enterVillageScene(villageView);
  renderGame();
  if (villagePage) {
    document.querySelectorAll('.window').forEach(win => desktopAPI.closeWindow(win));
    desktopAPI.openWindow('village');
  } else if (previewVillage) {
    desktopAPI.closeModal();
    desktopAPI.openWindow('village');
  }
  // Direct author inspection uses the same return-visit transition and saved poses.
  if (villagePage && canVisitVillage() && new URLSearchParams(location.search).get('inspect') === 'hands') {
    if (!state.sceneFlags?.shrineGhost) {
      enterVillageScene('shrine');
      enterVillageScene('hall-interior');
    }
    enterVillageScene('shrine');
    window.GhostHands?.open();
  }
})();
