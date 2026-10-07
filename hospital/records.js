/* Metadata only. Record bodies and attachment passwords remain in StoryDocuments/StoryConfig. */
(() => {
  'use strict';
  const records = [
    {id:'C1-10',number:'LC-RX-20231027',title:'罗桂枝同志荣誉退休仪式简讯',kind:'office',date:'2023-10-27',subject:'罗桂枝',source:'岭川县医院院办公室 · 护理部供稿',keywords:['罗桂枝','荣誉退休','荣休简讯','LC-RX-20231027','护理部']},
    {id:'C5-02',number:'LC-960708-12',title:'产房登记',kind:'birth',date:'1996-07-08',subject:'林知微',source:'历史产房登记 · 整理副本',keywords:['林知微','LC-960708-12','产房登记'],attachments:['C5-03']},
    {id:'C5-03',number:'LC-960708-12 · 附页',title:'新生儿观察附页',kind:'birth',date:'1996-07-08',subject:'林知微（关联产妇）',source:'产房登记 LC-960708-12 · 随附两联',keywords:['林知微','LC-960708-12','LC-960708-12-A','LC-960708-12-B','新生儿观察附页'],parent:'C5-02'},
    {id:'C5-05',number:'LC-960708-12-B',title:'儿科就诊登记',kind:'visit',date:'1996-07-29',subject:'未命名患儿',source:'县医院儿科历史就诊登记 · 整理副本',keywords:['林知微','未命名','未命名患儿','LC-960708-12-B','儿科就诊登记']}
  ];
  const catalog = [{id:'hospital-home',source:'hospital',year:2026,kind:'网页快照',number:'LC-HOSPITAL-ARCHIVE',origin:'hospital-home',title:'岭川县医院｜历史档案查阅',summary:'病案室历史资料查询入口，保留院务简讯、产房登记、观察附页及就诊记录。',keywords:['县医院','岭川县医院','医院','出生日志','就医记录','病历','病案室','医疗档案','院务留档'],related:['story-C1-10','story-C5-02','story-C5-05'],body:'<h3>岭川县医院 · 病案室</h3><p>历史档案按原登记日期、姓名与编号编目。整理副本保留原文与来源，封存附件单独核验。</p><p><a href="./hospital/" target="_blank" rel="noopener">进入医院档案网站</a></p>'}];
  window.HospitalArchive = {records,catalog};
})();
