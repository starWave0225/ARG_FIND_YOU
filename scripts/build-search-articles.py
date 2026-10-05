"""Compile editable search article drafts into the existing browser catalog."""
from pathlib import Path
import json,re,html
ROOT=Path(__file__).resolve().parent.parent
SOURCE=ROOT/'docs/document-drafts/19-search-articles.md'
def inline(value):
 if re.search(r"</?(?:strong|em|b|code|a)(?:\s|>)",value): return value
 value=html.escape(value)
 value=re.sub(r'\*\*(.+?)\*\*',r'<strong>\1</strong>',value)
 return value
def render(value):
 out=[]
 for line in value.strip().splitlines():
  line=line.strip()
  if not line:continue
  if line.startswith('<'):out.append(line)
  elif line.startswith('### '):out.append('<h3>'+inline(line[4:])+'</h3>')
  elif line.startswith('> '):out.append('<blockquote>'+inline(line[2:])+'</blockquote>')
  else:out.append('<p>'+inline(line)+'</p>')
 return '\n'.join(out)
def build():
 docs=[]
 for match in re.finditer(r'^## ([a-z0-9-]+)｜([^\n]+)\n(.*?)(?=^## |\Z)',SOURCE.read_text(),re.M|re.S):
  id,title,content=match.groups()
  metadata=json.loads(re.search(r'```json\n(.*?)\n```',content,re.S)[1])
  body=content.split('### 正文初稿\n',1)[1].split('### 制作备注',1)[0]
  docs.append(dict(id=id,title=title,**metadata,body=render(body)))
 ids={doc['id'] for doc in docs}
 assert len(ids)==len(docs) and docs
 for doc in docs:
  assert doc['body'] or doc.get('action')=='legacy',doc['id']
  assert doc['keywords'],doc['id']
  assert all(id in ids for id in doc.get('related',[])),doc['id']
 path=ROOT/'archive-search.js';code=path.read_text()
 code,count=re.subn(r'  const catalog = \[[\s\S]*?\n  \];',lambda _: '  // Generated from docs/document-drafts/19-search-articles.md.\n  const catalog = '+json.dumps(docs,ensure_ascii=False,indent=2)[:-1]+'  ];',code,count=1)
 assert count==1
 path.write_text(code)
 print(f'Compiled {len(docs)} search articles with drafts and keywords.')
if __name__=='__main__':build()
