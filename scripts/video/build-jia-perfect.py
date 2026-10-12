"""Render the approved Jia crossover ending using generated pixel keyframes.

ffmpeg and numpy are required. Render picture, inspect extracted frames, then
render music, environmental sound and dialogue subtitles. No spoken voice track.
"""
from pathlib import Path
import argparse, json, os, subprocess, wave
import numpy as np

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'assets/video/jia-perfect'
WORK=Path('/tmp/jia-film-work')
FONT='/System/Library/Fonts/Supplemental/Songti.ttc'
if not Path(FONT).exists(): FONT='/System/Library/Fonts/PingFang.ttc'
SCENES=[('call-clean',15),('corridor-back',9),('closed-pov',3),('door-pov',9),('rescue-profile',14),('arrest',8),('ambulance-profile',12),('plane',12),('hospital-side',4),('hospital-distinct',13),('recovery',18),('wedding-back',20),('gallery',15),('gallery',12),('painting',15)]
TOTAL=sum(d for _,d in SCENES)

def overlap_after(i):
    if i in [2,len(SCENES)-1]: return 0
    return 1.6 if SCENES[i][0]=='hospital-side' else .75

def run(args):
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y',*map(str,args)],check=True)

def text_filter(text,size=25,y='h-100',color='0xfff3df',start=0,end=999,x='(w-tw)/2'):
    import hashlib
    f=WORK/(hashlib.sha256(text.encode()).hexdigest()[:14]+'.txt');f.write_text(text)
    return f"drawtext=fontfile={FONT}:textfile={f}:fontsize={size}:fontcolor={color}:shadowcolor=black@0.8:shadowx=1:shadowy=2:x={x}:y={y}:line_spacing=10:enable='between(t,{start},{end})'"

def picture(selected=None):
    offset=0
    for i,(name,duration) in enumerate(SCENES):
        if selected is not None and selected!=i:
            offset+=duration
            continue
        src=OUT/'source'/f'{name}-v1.png'
        overlap=overlap_after(i)
        rendered_duration=duration+overlap
        # Keep explicit pixel edges while delivering a 720p cinematic frame.
        pan="x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2'"
        zoom='1.03+0.00015*on'
        if i==4:zoom='1.075+0.00022*on'
        if i==13:zoom='1.12+0.00018*on'
        frame="scale=1920:1080:force_original_aspect_ratio=increase:flags=neighbor,crop=1920:1080"
        if name=='painting':frame="scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x1c1811"
        vf=f"{frame},zoompan=z='{zoom}':{pan}:d={round(rendered_duration*24)}:s=1280x720:fps=24,vignette=angle=PI/7,noise=alls=2:allf=t+u"
        if i==0:vf+=',fade=t=in:st=0:d=0.65'
        if i==len(SCENES)-1:vf+=f',fade=t=out:st={duration-1}:d=1'
        if i in [2,3,4]:
            vf+=',vignette=angle=PI/5'
        if i==4:
            vf+=",drawbox=x=0:y=0:w=iw:h=ih:color=black@0.9:t=fill:enable='between(t,0.35,0.48)'"
        vf+=',drawbox=x=0:y=0:w=iw:h=40:color=black@1:t=fill,drawbox=x=0:y=ih-40:w=iw:h=40:color=black@1:t=fill'
        if i==0:
            vf+=','+text_filter('刘涵',24,'78',start=.5,end=3.6)
            vf+=','+text_filter('通话已接通',17,'112',color='white@0.7',start=2,end=3.6)
        if i==5:vf+=','+text_filter('这一次，还来得及。',28,'h-112',start=3,end=duration-.8)
        if i==6:
            for n,line in enumerate(['沈望，顾盼救出来了，','正在送往医院，','你落地后直接过去。']):
                vf+=','+text_filter(line,23,str(105+n*39),start=2+n*1.4,end=duration-.7,x='w-tw-60')
            vf+=','+text_filter('医院定位 · 已发送',17,'235',color='0xf0d6a6',start=7,end=duration-.7,x='w-tw-60')
        if i==7:vf+=','+text_filter('顾盼救出来了',27,'h-123',start=2,end=duration-1)
        if name=='recovery':vf+=','+text_filter('爱可以找到完美的时间线',27,'h-112',start=10,end=duration-.8)
        if name=='wedding-back':vf+=','+text_filter('次年，2026。',24,'88',start=1,end=5)
        if i==12:vf+=','+text_filter('顾盼个人美术展',27,'78',start=1,end=duration-.7)
        if name=='painting':
            vf+=',drawbox=x=0:y=ih-170:w=iw:h=130:color=black@0.45:t=fill'
            vf+=','+text_filter('爱可以',62,'210',start=2,end=duration-1)
            vf+=','+text_filter('找到完美的时间线',31,'300',start=3,end=duration-1)
            vf+=','+text_filter('谢谢你的坚持，让故事走向完美',24,'h-133',start=6,end=duration-1)
        run(['-i',src,'-vf',vf+',format=yuv420p','-t',rendered_duration,'-an','-c:v','libx264','-preset','fast','-crf','20','-threads','4',WORK/f'scene-{i}.mp4'])
        offset+=duration;print(f'picture {i+1}/{len(SCENES)} · {offset}s',flush=True)
    join_picture()

def join_picture():
    inputs=[];filters=[]
    for i in range(len(SCENES)):
        inputs+=['-threads','1','-i',WORK/f'scene-{i}.mp4']
        filters.append(f'[{i}:v]settb=AVTB,setpts=PTS-STARTPTS,fps=24[s{i}]')
    previous='s0';at=0
    for i in range(1,len(SCENES)):
        at+=SCENES[i-1][1];label=f'm{i}'
        if i==3:filters.append(f'[{previous}][s{i}]concat=n=2:v=1:a=0[cut];[cut]fps=24[{label}]')
        else:filters.append(f'[{previous}][s{i}]xfade=transition=fade:duration={overlap_after(i-1)}:offset={at}[{label}]')
        previous=label
    run([*inputs,'-filter_complex_threads','1','-filter_complex',';'.join(filters),'-map',f'[{previous}]','-t',TOTAL,'-an','-c:v','libx264','-preset','fast','-crf','20','-threads','4','-pix_fmt','yuv420p','-movflags','+faststart',WORK/'picture.mp4'])
    run(['-ss','136','-i',WORK/'picture.mp4','-frames:v','1',OUT/'poster.jpg'])

def soundscape():
    sr=24000;rng=np.random.default_rng(12026);t=np.arange(TOTAL*sr)/sr
    a=.0009*rng.normal(size=t.size)
    a[t<70]+=.004*np.sin(2*np.pi*57*t[t<70])
    mask=(t>=70)&(t<82);a[mask]+=.025*np.sin(2*np.pi*84*t[mask])+.008*rng.normal(size=mask.sum())
    def place(at,v,gain=1):
        k=round(at*sr);v=v[:max(0,len(a)-k)];a[k:k+len(v)]+=gain*v
    def effect(at,length,kind,gain):
        x=np.arange(round(length*sr))/sr;n=rng.normal(size=len(x))
        if kind=='ring':v=(np.sin(2*np.pi*440*x)+.65*np.sin(2*np.pi*480*x))*((x%1.1)<.5)*.06
        elif kind=='impact':v=(n*.45+np.sin(2*np.pi*70*x))*np.exp(-x*12)
        elif kind=='step':v=(np.sin(2*np.pi*105*x)+n*.15)*np.exp(-x*35)
        elif kind=='paper':v=n*np.sin(np.pi*x/length)**2*.06
        elif kind=='shutter':v=n*np.exp(-x*38)
        else:v=n*.03*np.sin(np.pi*x/length)**2
        place(at,v,gain)
    effect(.7,2.2,'ring',.7)
    for at in [15.7,16.8,18.1,19.2,24.1,25.6,27]:effect(at,.25,'step' if at<24 else 'impact',.09 if at<24 else .14)
    for at in [52,53.5,56]:effect(at,.6,'paper',.3)
    for at in [61,70.4]:effect(at,.08,'shutter',.035)
    for at in [105,110,115]:effect(at,.5,'paper',.65)
    effect(161, .22,'shutter',.13)
    # Original quiet piano-like composition: C/G/Am/F, starting at aircraft scene.
    chords=[[48,55,60,64],[43,50,55,62],[45,52,57,60],[41,48,53,60]]
    for beat,at in enumerate(np.arange(72,TOTAL-4,1.0)):
        midi=chords[(beat//8)%4][beat%4];freq=440*2**((midi-69)/12)
        x=np.arange(sr*4)/sr
        env=(1-np.exp(-x*130))*np.exp(-x*1.45)
        v=(np.sin(2*np.pi*freq*x)+.3*np.sin(2*np.pi*freq*2.002*x)+.11*np.sin(2*np.pi*freq*3.004*x))*env
        place(at,v,.04)
        if beat%8==4:place(at+.12,v*.55,.04)
    # Applause after the spoken consent, lightly filtered for a natural bed.
    for at in np.arange(132,136,.16):effect(float(at),.09,'shutter',.027)
    a*=np.minimum(t/.3,1)*np.clip((TOTAL-t)/4,0,1)
    stereo=np.stack([a,a*.88+np.roll(a,287)*.12],axis=1)
    with wave.open(str(WORK/'score.wav'),'wb') as f:
        f.setnchannels(2);f.setsampwidth(2);f.setframerate(sr);f.writeframes((np.clip(stereo,-.95,.95)*32767).astype('<i2').tobytes())

def stamp(sec):
    ms=round(sec*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'

def audio():
    entries=json.loads((OUT/'dialogue.json').read_text());soundscape()
    args=['-i',WORK/'picture.mp4','-i',WORK/'score.wav']
    filters=[f'[1:a]volume=0.9,apad,atrim=duration={TOTAL}[sound]']
    captions='\n\n'.join(f"{i+1}\n{stamp(e['start'])} --> {stamp(e['end'])}\n{e['text']}" for i,e in enumerate(entries))+'\n'
    (OUT/'captions.srt').write_text(captions)
    run([*args,'-filter_complex',';'.join(filters),'-map','0:v','-map','[sound]','-c:v','copy','-c:a','aac','-b:a','192k','-t',TOTAL,'-movflags','+faststart',WORK/'mixed.mp4'])
    vf=f"subtitles={OUT/'captions.srt'}:force_style='FontName=Songti SC,FontSize=19,Outline=1.3,Shadow=0,MarginV=31'"
    enc=['-i',WORK/'mixed.mp4','-vf',vf,'-c:v','libx264','-preset','fast','-b:v','850k','-maxrate','1400k','-bufsize','2800k','-threads','4','-passlogfile',WORK/'web-pass']
    run([*enc,'-pass','1','-an','-f','null','/dev/null'])
    # Keep the previous complete film available while exporting a replacement.
    temporary=OUT/'love-perfect-timeline-v1.rendering.mp4'
    run([*enc,'-pass','2','-c:a','aac','-b:a','160k','-movflags','+faststart',temporary])
    os.replace(temporary,OUT/'love-perfect-timeline-v1.mp4')

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--stage',choices=['picture','join','audio'],required=True)
    parser.add_argument('--scene',type=int,help='Re-render one picture scene before joining')
    args=parser.parse_args();WORK.mkdir(parents=True,exist_ok=True)
    if args.stage=='picture':picture(args.scene)
    else:{'join':join_picture,'audio':audio}[args.stage]()
