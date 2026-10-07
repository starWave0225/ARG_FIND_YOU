"""Build the fictional found-footage film from generated keyframes and timed voices.

Requires ffmpeg/ffprobe, Python numpy and edge-tts. No source images are changed.
Run --stage picture, inspect extracted frames, then --stage audio.
"""
from pathlib import Path
import argparse, asyncio, json, subprocess, wave
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets/video/church-exploration'
WORK = Path('/tmp/church-film-work')
FONT = '/System/Library/Fonts/PingFang.ttc'
SCENES = [('hall',8),('ritual',11),('ledger',12),('tape',18),('ritual',7),('turn',5),('hall',4),('black',7)]
TOTAL = sum(d for _,d in SCENES)

def run(args):
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y',*map(str,args)],check=True)

def picture():
    offset=0
    for i,(name,duration) in enumerate(SCENES):
        if name == 'black':
            source=['-f','lavfi','-i',f'color=c=black:s=1280x720:r=24:d={duration}']
            vf='format=yuv420p'
        else:
            source=['-i',str(OUT/'source'/f'{name}-v1.png')]
            jitter=9 if i==6 else 1.8
            zoom='1.10-0.0006*on' if i==6 else '1.025+0.00018*on'
            vf=(f"scale=1920:1080,zoompan=z='{zoom}':x='iw/2-iw/zoom/2+{jitter}*sin(on*.31)':"
                f"y='ih/2-ih/zoom/2+{jitter}*cos(on*.23)':d={duration*24}:s=1280x720:fps=24,"
                "eq=saturation=0.65:contrast=1.05:brightness=-0.014,"
                "vignette=angle=PI/5,noise=alls=5:allf=t+u,")
            if i==6:
                vf+='gblur=sigma=2.2,'
            vf+=(f"drawtext=fontfile={FONT}:text='REC':fontcolor=white@0.7:fontsize=19:x=65:y=38,"
                 "drawbox=x=43:y=43:w=10:h=10:color=0xc86055@0.8:t=fill,"
                 f"drawtext=fontfile={FONT}:text='DV / 03':fontcolor=white@0.65:fontsize=17:x=w-tw-42:y=38,"
                 f"drawtext=fontfile={FONT}:text='%{{pts\\:hms\\:{offset}}}':fontcolor=white@0.6:fontsize=17:x=w-tw-42:y=h-45,"
                 'format=yuv420p')
            if i==0: vf+=',fade=t=in:st=0:d=0.6'
            if i==6: vf+=',fade=t=out:st=3.6:d=0.4'
        run([*source,'-vf',vf,'-t',duration,'-an','-c:v','libx264','-preset','fast','-crf','22','-threads','4',WORK/f'scene-{i}.mp4'])
        offset+=duration
        print(f'picture {i+1}/{len(SCENES)}',flush=True)
    listing=WORK/'scenes.txt'
    listing.write_text(''.join(f"file '{WORK/f'scene-{i}.mp4'}'\n" for i in range(len(SCENES))))
    run(['-f','concat','-safe','0','-i',listing,'-c','copy','-movflags','+faststart',WORK/'picture.mp4'])
    run(['-ss','9','-i',WORK/'picture.mp4','-frames:v','1',OUT/'poster.jpg'])

def ambience():
    sr=24000
    rng=np.random.default_rng(610)
    t=np.arange(TOTAL*sr)/sr
    # Original synthesized room tone: tape hiss, mains hum, air resonance.
    a=.009*rng.normal(size=t.size)+.018*np.sin(2*np.pi*49.7*t)+.008*np.sin(2*np.pi*99.4*t)
    a+=.011*np.sin(2*np.pi*72*t)*(0.65+.35*np.sin(2*np.pi*.17*t))
    def event(at,length,kind,gain):
        n=int(length*sr); x=np.arange(n)/sr; noise=rng.normal(size=n)
        if kind=='step': v=(np.sin(2*np.pi*65*x)*np.exp(-x*25)+noise*.12*np.exp(-x*35))
        elif kind=='bell': v=(np.sin(2*np.pi*510*x)+.4*np.sin(2*np.pi*1311*x))*np.exp(-x*1.7)
        elif kind=='creak': v=np.sin(2*np.pi*(155*x+45*x*x))*np.sin(np.pi*x/length)**2
        else: v=noise*np.exp(-x*15)
        k=int(at*sr); a[k:k+n]+=gain*v[:len(a[k:k+n])]
    for at in [1,2.1,3.3,5.4,6.6,19.1,20,31.1,32,62,62.4,62.8,63.2,63.6]:event(at,.25,'step',.11)
    for at in [9.2,16.6,49.4,54.6]:event(at,2.0,'bell',.052)
    for at in [0.4,18.7,48.8,60.8]:event(at,.65,'creak',.07)
    for at in [30.8,55.9,64.8,70.7]:event(at,.14,'click',.15)
    # The room drops out after the camera is covered; faint tape hiss remains.
    a[t>65]*=.22
    a*=np.minimum(t/.3,1)*np.minimum((TOTAL-t)/.15,1)
    stereo=np.stack([a,a*.96+np.roll(a,173)*.04],axis=1)
    with wave.open(str(WORK/'ambience.wav'),'wb') as f:
        f.setnchannels(2);f.setsampwidth(2);f.setframerate(sr)
        f.writeframes((np.clip(stereo,-.95,.95)*32767).astype('<i2').tobytes())

def stamp(sec,sep=','):
    ms=round(sec*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}{sep}{ms%1000:03}'

async def voices(entries):
    import edge_tts
    for i,e in enumerate(entries):
        path=OUT/'source'/f'voice-{i:02}.mp3'
        if not path.exists():
            await edge_tts.Communicate(e['text'],e['voice'],rate='-10%',pitch='-3Hz').save(str(path))
        duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(path)]))
        if duration>e['end']-e['start']:
            raise RuntimeError(f'Voice {i} overflows its slot: {duration}')
        e['duration']=duration
        print(f'voice {i}: {duration:.2f}s',flush=True)

def audio():
    entries=json.loads((OUT/'dialogue.json').read_text())
    asyncio.run(voices(entries));ambience()
    args=['-i',WORK/'picture.mp4','-i',WORK/'ambience.wav']
    filters=['[1:a]volume=0.75[a0]'];mix=['[a0]']
    for i,e in enumerate(entries):
        args+=['-i',OUT/'source'/f'voice-{i:02}.mp3']
        band='highpass=f=420,lowpass=f=2400,aecho=0.8:0.6:55:0.15,' if e['role']=='tape' else 'highpass=f=100,lowpass=f=6200,'
        delay=round(e['start']*1000)
        filters.append(f'[{i+2}:a]{band}volume=0.85,adelay={delay}|{delay}[v{i}]')
        mix.append(f'[v{i}]')
    # The same archival sentence is heard again from the ritual room.
    args+=['-i',OUT/'source'/'voice-05.mp3']
    filters.append(f'[{len(entries)+2}:a]highpass=f=250,lowpass=f=1100,aecho=0.8:0.65:180:0.35,volume=0.28,adelay=49100|49100[roomvoice]')
    mix.append('[roomvoice]')
    filters.append(''.join(mix)+f'amix=inputs={len(mix)}:duration=longest:normalize=0,alimiter=limit=0.82:level=false,apad,atrim=duration={TOTAL}[audio]')
    srt='\n\n'.join(f"{i+1}\n{stamp(e['start'])} --> {stamp(e['end'])}\n{e['text']}" for i,e in enumerate(entries))+'\n'
    (OUT/'captions.srt').write_text(srt)
    (OUT/'captions.vtt').write_text('WEBVTT\n\n'+'\n\n'.join(f"{stamp(e['start'],'.')} --> {stamp(e['end'],'.')}\n{e['text']}" for e in entries)+'\n')
    run([*args,'-filter_complex',';'.join(filters),'-map','0:v','-map','[audio]','-c:v','copy','-c:a','aac','-b:a','160k','-t',TOTAL,'-movflags','+faststart',WORK/'mixed.mp4'])
    # Burn dialogue only; no puzzle advice, production notes or identity assertions.
    run(['-i',WORK/'mixed.mp4','-vf',f"subtitles={OUT/'captions.srt'}:force_style='FontName=PingFang SC,FontSize=18,Outline=1.3,Shadow=0,MarginV=30'",'-c:v','libx264','-preset','fast','-crf','22','-threads','4','-c:a','copy','-movflags','+faststart',OUT/'church-exploration-v1.mp4'])

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--stage',choices=['picture','audio'],required=True)
    args=parser.parse_args();WORK.mkdir(parents=True,exist_ok=True)
    picture() if args.stage=='picture' else audio()
