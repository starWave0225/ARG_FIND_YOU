// Author-only index. Never loaded into the player interface.
const fs=require('node:fs'),vm=require('node:vm');
const root=require('node:path').resolve(__dirname,'..');
const c={window:{}};vm.createContext(c);
for(const file of ['story-documents.js','story-config.js','search-keywords.js'])vm.runInContext(fs.readFileSync(`${root}/${file}`,'utf8'),c);
const code=fs.readFileSync(`${root}/archive-search.js`,'utf8');
const articles=vm.runInContext(code.match(/  const catalog = (\[[\s\S]*?\n  \]);/)[1],c);
const conditional=new Set(['P07','P08','C1-08','C2-02','C2-03','C2-04','C4-11','C7-03','E01','E02']);
let text='# 文章与档案检索总表\n\n作者编辑用 · 2026-10-05。此表不进入玩家界面。既存材料可自由检索；密码附件仍需核验密码。本次通信、回执、现场借阅记录及奖励按实际操作产生。\n\n独立文章正文及关键词修改 [19-search-articles.md](19-search-articles.md)，之后运行 `python3 scripts/build-search-articles.py`。主线正文修改对应分章初稿后运行 `python3 scripts/build-story-documents.py`；主线关键词修改 `story-config.js` 的 aliases／archiveKeywords。重新生成此总表运行 `node scripts/export-search-index.cjs`。\n\n## 独立文章与来源目录\n\n| 题名 | 编号 | 关键词 | 正文 |\n| --- | --- | --- | --- |\n';
for(const d of articles)text+=`| ${d.title} | ${d.id} | ${d.keywords.join('、')} | [修改初稿](19-search-articles.md#${d.id}) |\n`;
text+='\n## 主线、村史与支线材料\n\n| 编号 | 题名 | 关键词（另支持编号与完整题名） | 初稿 | 类型 |\n| --- | --- | --- | --- | --- |\n';
for(const d of Object.values(c.window.StoryDocuments)){
 const type=d.id.startsWith('RW')?'支线奖励':d.id.startsWith('J')?'本次通信':d.id.startsWith('N')?'现场借阅记录':conditional.has(d.id)?'操作生成或留存':'既存材料';
 const words=c.window.StoryConfig.aliases[d.id]||[];
 text+=`| ${d.id} | ${d.title} | ${words.join('、')||'完整题名、材料编号'} | [修改初稿](${d.draft}) | ${type} |\n`;
}
fs.writeFileSync(`${root}/docs/document-drafts/20-search-index.md`,text);
console.log(`Indexed ${articles.length} independent entries and ${Object.keys(c.window.StoryDocuments).length} story documents.`);
