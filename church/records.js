/* Shared authored archive: the public site and in-game reader use these same texts. */
(() => {
  'use strict';
  const records = [
    {id:'QZ-260818-041',title:'留一盏归灯',type:'团圆',status:'已封存',date:'2026-08-18',name:'周女士',origin:'归灯所来函 · 摘录获准公开',keywords:['归灯'],
      excerpt:'他若走得太远，请让他记得门口还有一盏灯。',
      sections:[{title:'祈愿原文',text:['孩子离家以后，我仍在晚饭时多摆一双筷子。我不求他解释这些年去了哪里。他若走得太远，请让他记得门口还有一盏灯。']},{title:'回访留记',text:['来函人补记：昨日收到了他的信。信纸上没有地址，字却是我认得的字。我已经不再摆第二双筷子。','执簿人：依来函封存，不再续问。']}]},
    {id:'QZ-260811-019',title:'一人之愿',type:'偿还',status:'持续见证',date:'2026-08-11',name:'林知微（原件署名）',origin:'旧件转录 · HM-SJC-019 / A页',keywords:['林知微','盛雄','HM-SJC-019','咒杀'],
      excerpt:'只记我写下的那一个人。其余的人，不在这张纸上。',
      sections:[{title:'原件登记',text:['本页日期为入簿日期。原件未署年月，留存折痕、涂改及背面批注。移交索引：HM-SJC-019。受愿栏：盛雄。']},{title:'祈愿原文',text:['你们说，写下名字，就有人听见。','我叫林知微。我没有自愿到盛家，也没有自愿成为谁的妻子。有人听见过我的求救，后来他们把门关上了。','我不要他悔过，也不要他忘了。我求盛雄偿命。若你们把这叫作咒杀，就照这两个字记。','只记我写下的那一个人。其余的人，不在这张纸上。']},{title:'背面批注',text:['执簿：来愿已受。旧册所录关系，依原件留存。','另笔：他们把我的名字填进那一栏，不是我认下的。你们可以借那张纸找他，不能拿那张纸说我愿意。']},{title:'移交记录',text:['恒目管理顾问有限公司 · 盛家村旧件专项：接收A页、B页及一份续问记录；原件签写时间未核定。','见证处：本页保持受理。未附终结回执。']}],related:['QZ-260811-019-B','QZ-260812-020']},
    {id:'QZ-260811-019-B',title:'受愿范围附记',type:'偿还',status:'附页留存',date:'2026-08-11',name:'同卷原件',origin:'旧件转录 · HM-SJC-019 / B页',keywords:['林知微','盛雄','HM-SJC-019'],
      excerpt:'“若所记之人不再承受，可否由同户之人续承？”——不准。',
      sections:[{title:'附页转录',text:['执簿问：若所记之人不再承受，可否由同户之人续承？','来愿人答：不准。','执簿问：若有人代他应名，可否视为应愿？','来愿人答：不准。我写的是盛雄。别把别人的名字放进来。']},{title:'末行增补',text:['“同户续承”一栏划除。旁有手写：你们要我留下什么，就问我；别去问那些没有来过这里的人。','见证处收讫批注：范围照旧；留置事项另记。']}],related:['QZ-260811-019','QZ-260812-020']},
    {id:'QZ-260812-020',title:'续问留记',type:'留声',status:'持续见证',date:'2026-08-12',name:'记录席 · 第六席',origin:'HM-SJC-019 · 续问转写副本',keywords:['HM','恒目','盛雄','HM-SJC-019'],
      excerpt:'愿了之后，留下的声音也可以走吗？',
      sections:[{title:'转写说明',text:['由恒目管理顾问有限公司专项保管岗交存。此页为文字转写；本次公开副本不含声源鉴别签字。索引沿用HM-SJC-019，不另立来愿人身份。']},{title:'续问片段',text:['问：你还认得原来写下的名字吗？','应：盛雄。','问：是否更改所求？','应：不改。愿了之后，留下的声音也可以走吗？','问：所愿的终结与留置的终结分开登记。','此后无可辨应答。']},{title:'保管岗注',text:['不得以愿簿状态替代放行签收。本卷未见放行签收页。']}],related:['QZ-260811-019']},
    {id:'QZ-260729-033',title:'无梦的一夜',type:'安宁',status:'已封存',date:'2026-07-29',name:'陈先生',origin:'静室来愿 · 本人摘录',keywords:[],
      excerpt:'我只想睡一个不必回头的好觉。',
      sections:[{title:'祈愿原文',text:['每次梦到那栋老房子，总有人从楼上叫我。我不想再答应了。我只想睡一个不必回头的好觉。']},{title:'第七日回访',text:['来愿人：这几天没有再梦见房子。可我想不起母亲的声音了。她仍和我住在一起，我知道那是她，只是每次听见，都像第一次。','执簿：原愿记“无梦”，未记“留声”。来函随卷保留。']}]},
    {id:'QZ-260706-028',title:'空着的位置',type:'团圆',status:'持续见证',date:'2026-07-06',name:'佚名',origin:'礼堂投函 · 依原件隐去落款',keywords:[],
      excerpt:'桌子太大了。可不可以让晚饭的时候不那么安静？',
      sections:[{title:'祈愿原文',text:['我一个人住。桌子太大了。可不可以让晚饭的时候不那么安静？']},{title:'第二封信',text:['最近每天回家，都能听见碗筷响。开了灯就停。昨天我晚了一点，那声音一直等到我坐下。','我没有问是谁。我怕问了以后，他就不来了。']}]},
    {id:'QZ-260621-024',title:'替我记得',type:'留声',status:'已封存',date:'2026-06-21',name:'顾女士',origin:'口述誊本 · 经来愿人校阅',keywords:[],
      excerpt:'当我忘了自己的名字，请不要跟着忘掉。',
      sections:[{title:'祈愿原文',text:['医生说我会慢慢忘记许多事。我把名字、生日和常走的那条路写在后面。当我忘了自己的名字，请不要跟着忘掉。']},{title:'回访留记',text:['第六次来访，来愿人未能认出此前的手迹。诵读至名字时，室内另一处先有应答。','执簿：姓名页按来愿人的原意单独保管，不随公开摘录附出。']}]},
    {id:'QZ-260602-017',title:'归还一件旧物',type:'归还',status:'已封存',date:'2026-06-02',name:'旧物保管岗',origin:'经手登记 · HM归档服务办公室',keywords:['HM','恒目','恒慕'],
      excerpt:'物件可以归还，附在物件上的称呼另行留簿。',
      sections:[{title:'经手说明',text:['来件为一只旧木匣，未附购买票据。接收人要求抹去旧签，再依原址归还。','见证处签注：物件可以归还，附在物件上的称呼另行留簿。']},{title:'服务分工抄录',text:['全知教会见证处负责愿文、受愿范围与续问登记；HM归档服务办公室负责安排承接与移交。','恒目管理顾问有限公司承接本次旧物保管。恒慕婚姻家庭服务集团列于跨区域礼仪服务名录，本件未向其派送。各承接主体按各自单项委托签收。']},{title:'签收栏',text:['木匣：已归还。','旧签：见证处留存。','原称呼的注销申请：未随本件办理。']}]} 
  ];
  const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const body = record => `<p>登记日期：${escape(record.date)} · ${escape(record.status)}</p><p>署名：${escape(record.name)}</p><p>来源：${escape(record.origin)}</p>` + record.sections.map(s=>`<section><h3>${escape(s.title)}</h3>${s.text.map(p=>`<p>${escape(p)}</p>`).join('')}</section>`).join('');
  const catalog = [{id:'church-home',source:'church',year:2026,kind:'网页快照',number:'QZ-INDEX',origin:'church-home',title:'全知教会｜见证未竟之愿',summary:'教会公开愿簿、见证处说明及经手服务登记。',keywords:['全知教会','全知','教会','HM','恒目','恒慕','祈愿','祈愿记录'],body:'<p>全知教会 · 见证处</p><h3>凡有所愿，皆有所闻。</h3><p>愿望可以低声说出，名字可以留在纸上。我们保存来愿人的原话，也保存此后每一次回应。</p><p>见证处主持受愿与续问；HM归档服务办公室负责承接安排和旧件移交。专项保管及礼仪服务由登记主体分别履行。</p><p><a href="./church/" target="_blank" rel="noopener">进入全知教会官方网站 ↗</a></p>'}, ...records.map(r=>({id:'church-'+r.id,source:'church',year:2026,kind:'网页快照',number:r.id,origin:r.id.startsWith('QZ-260811-019') || r.id==='QZ-260812-020' ? 'church-QZ-260811-019' : 'church-'+r.id,title:r.title,summary:r.excerpt,keywords:[r.id,...r.keywords],related:(r.related||[]).map(id=>'church-'+id),body:body(r)+`<p><a href="./church/?record=${encodeURIComponent(r.id)}" target="_blank" rel="noopener">查看愿簿原页 ↗</a></p>`}))];
  catalog[0].related = records.map(r=>'church-'+r.id);
  window.ChurchArchive = {records, catalog, body, escape};
})();
