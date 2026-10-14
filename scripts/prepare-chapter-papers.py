"""Export generated masters to WebP and build an unretouched comparison sheet.

Generation uses built-in image_gen; this script only converts file formats and
lays out scaled, uncropped thumbnails. It never changes the PNG masters.
"""
from pathlib import Path
import json, os
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/chapter-papers'
manifest=json.loads((OUT/'manifest.json').read_text())
items=manifest['items']
sheet=Image.new('RGB',(1200,1770),'#ede9df')
draw=ImageDraw.Draw(sheet)
font_path='/System/Library/Fonts/Supplemental/Songti.ttc'
if not Path(font_path).exists():font_path='/System/Library/Fonts/PingFang.ttc'
font=ImageFont.truetype(font_path,23)
for i,item in enumerate(items):
    src=OUT/item['png']
    with Image.open(src) as master:
        master.load()
        item['width'],item['height']=master.size
        temporary=OUT/(Path(item['src']).stem+'.rendering.webp')
        master.convert('RGB').save(temporary,'WEBP',quality=92,method=6)
        os.replace(temporary,OUT/item['src'])
        thumb=master.convert('RGB');thumb.thumbnail((348,480),Image.Resampling.LANCZOS)
        x=(i%3)*400+(400-thumb.width)//2;y=(i//3)*590+18
        sheet.paste(thumb,(x,y))
        draw.text(((i%3)*400+25,(i//3)*590+516),item['chapter']+' · '+item['name'],fill='#404939',font=font)
    print(item['id'],item['width'],item['height'],(OUT/item['src']).stat().st_size,flush=True)
sheet.save(OUT/'overview-v1.jpg',quality=92)
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(OUT/'manifest.js').write_text('window.ChapterPapers = '+json.dumps(items,ensure_ascii=False,indent=2)+';\n')
