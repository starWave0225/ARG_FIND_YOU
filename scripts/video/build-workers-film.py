"""Rebuild the fictional Donglan worker film; optionally supply a local music file."""
from pathlib import Path
import argparse, subprocess, json
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets/video/donglan-workers'
FONT = '/System/Library/Fonts/PingFang.ttc'
SCENES = [
 ('那年，厂门还开着', '一声铃响，大家往同一个门里走。'),
 ('后来，机器停了', '改制的通知贴出来，车间开始清点设备。'),
 ('把工作证留好', '工资条、安置单、缴费凭据，被压进抽屉底下。'),
 ('各自找一条路', '有人转岗，有人离厂。再见面，先问这些年过得怎样。'),
 ('宿舍楼还在', '电话换了，地址变了。旧照片里的人，慢慢断了联系。'),
 ('东兰机械厂下岗工人', '有人建了一个工友群。\n“老照片发来看看，也许还有人记得。”'),
]
def run(args):
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y',*args],check=True)
def main():
 parser=argparse.ArgumentParser();parser.add_argument('--music',type=Path); args=parser.parse_args()
 OUT.mkdir(parents=True,exist_ok=True)
 source=OUT/'storyboard.png'
 if not source.exists(): raise SystemExit('Missing storyboard.png')
 info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','stream=width,height','-of','json',str(source)]))['streams'][0]
 w,h=info['width']//2,info['height']//3
 for i,(title,subtitle) in enumerate(SCENES):
  (OUT/f'title-{i}.txt').write_text(title)
  (OUT/f'subtitle-{i}.txt').write_text(subtitle)
  label=OUT/'label.txt';label.write_text('我要找到你  /  东岚旧厂影像')
  credit=OUT/'credit.txt';credit.write_text('剧情影像 · 画面为虚构重现')
  vf=(f'crop={w}:{h}:{i%2*w}:{i//2*h},scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,'
      "zoompan=z='1+0.00020*on':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=200:s=1280x720:fps=25,"
      'drawbox=x=0:y=500:w=iw:h=220:color=black@0.55:t=fill,'
      f'drawtext=fontfile={FONT}:textfile={label}:fontsize=17:fontcolor=white@0.7:x=56:y=38,'
      f'drawtext=fontfile={FONT}:textfile={credit}:fontsize=14:fontcolor=white@0.5:x=w-tw-40:y=40,'
      f'drawtext=fontfile={FONT}:textfile={OUT/f"title-{i}.txt"}:fontsize=34:fontcolor=0xe7d6b0:x=56:y=530,'
      f'drawtext=fontfile={FONT}:textfile={OUT/f"subtitle-{i}.txt"}:fontsize=25:fontcolor=white:x=56:y=592:line_spacing=10,'
      'fade=t=in:st=0:d=0.5,fade=t=out:st=7.5:d=0.5,format=yuv420p')
  run(['-i',str(source),'-vf',vf,'-t','8','-an','-c:v','libx264','-preset','fast','-crf','20',str(OUT/f'scene-{i}.mp4')])
 listing=OUT/'scenes.txt';listing.write_text(''.join(f"file 'scene-{i}.mp4'\n" for i in range(6)))
 silent=OUT/'donglan-workers-picture.mp4'
 run(['-f','concat','-safe','0','-i',str(listing),'-c','copy','-movflags','+faststart',str(silent)])
 if args.music:
  destination=OUT/'donglan-workers.mp4'
  run(['-i',str(silent),'-i',str(args.music.resolve()),'-map','0:v','-map','1:a','-c:v','copy','-af','afade=t=in:st=0:d=1,afade=t=out:st=45:d=3','-t','48','-c:a','aac','-b:a','192k','-movflags','+faststart',str(destination)])
 print(silent)
if __name__ == '__main__':main()
