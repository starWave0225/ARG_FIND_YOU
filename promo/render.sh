#!/bin/zsh
set -euo pipefail

ROOT_DIR="${0:A:h}"
FONT_FILE="/System/Library/Fonts/PingFang.ttc"
FPS=24
WIDTH=1280
HEIGHT=720

mkdir -p "$ROOT_DIR/work" "$ROOT_DIR/audio" "$ROOT_DIR/output"

render_image_scene() {
  local input_file="$1"
  local text_file="$2"
  local duration="$3"
  local output_file="$4"
  local frames=$((duration * FPS))

  ffmpeg -hide_banner -loglevel error -y \
    -loop 1 -i "$input_file" -t "$duration" \
    -vf "scale=1600:900:force_original_aspect_ratio=increase,crop=1600:900,zoompan=z='min(zoom+0.00045,1.07)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${WIDTH}x${HEIGHT}:fps=${FPS},eq=saturation=0.9:contrast=1.025,drawbox=x=0:y=0:w=iw:h=ih:color=black@0.10:t=fill,drawbox=x=55:y=h-190:w=7:h=105:color=0xd9f56a@0.95:t=fill,drawtext=fontfile='${FONT_FILE}':textfile='${text_file}':fontcolor=white:fontsize=44:line_spacing=15:x=82:y=h-text_h-92:shadowcolor=black@0.72:shadowx=2:shadowy=3,fade=t=in:st=0:d=0.6,fade=t=out:st=$((${duration} - 1)):d=1" \
    -an -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r "$FPS" "$output_file"
}

render_image_scene "$ROOT_DIR/assets/old-photo-hands.png" "$ROOT_DIR/text/scene01.txt" 6 "$ROOT_DIR/work/scene01.mp4"
render_image_scene "$ROOT_DIR/assets/family-reunion.png" "$ROOT_DIR/text/scene02.txt" 7 "$ROOT_DIR/work/scene02.mp4"
render_image_scene "$ROOT_DIR/assets/mountain-bus-stop.png" "$ROOT_DIR/text/scene03.txt" 5 "$ROOT_DIR/work/scene03.mp4"
render_image_scene "$ROOT_DIR/assets/old-friends-reunion.png" "$ROOT_DIR/text/scene04.txt" 7 "$ROOT_DIR/work/scene04.mp4"
render_image_scene "$ROOT_DIR/assets/old-envelope.png" "$ROOT_DIR/text/scene05.txt" 6 "$ROOT_DIR/work/scene05.mp4"
render_image_scene "$ROOT_DIR/assets/benefactor-reunion.png" "$ROOT_DIR/text/scene06.txt" 7 "$ROOT_DIR/work/scene06.mp4"
render_image_scene "$ROOT_DIR/assets/empty-chair-phone.png" "$ROOT_DIR/text/scene07.txt" 5 "$ROOT_DIR/work/scene07.mp4"

ffmpeg -hide_banner -loglevel error -y \
  -f lavfi -i "color=c=0x102422:s=${WIDTH}x${HEIGHT}:r=${FPS}:d=12" \
  -vf "drawbox=x=178:y=182:w=13:h=228:color=0xd9f56a:t=fill,drawbox=x=205:y=182:w=13:h=160:color=0xd9f56a@0.75:t=fill,drawtext=fontfile='${FONT_FILE}':textfile='${ROOT_DIR}/text/final-kicker.txt':fontcolor=0xd9f56a:fontsize=23:x=265:y=188,drawtext=fontfile='${FONT_FILE}':textfile='${ROOT_DIR}/text/final-title.txt':fontcolor=white:fontsize=84:x=258:y=250,drawtext=fontfile='${FONT_FILE}':textfile='${ROOT_DIR}/text/final-tagline.txt':fontcolor=0xcbd8d4:fontsize=30:x=263:y=382,drawtext=fontfile='${FONT_FILE}':text='FINDING DESK / PUBLIC SERVICE PROGRAM':fontcolor=0x758d86:fontsize=14:x=263:y=447,fade=t=in:st=0:d=0.7,fade=t=out:st=11.2:d=0.8" \
  -an -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p "$ROOT_DIR/work/scene08.mp4"

ffmpeg -hide_banner -loglevel error -y \
  -i "$ROOT_DIR/work/scene01.mp4" \
  -i "$ROOT_DIR/work/scene02.mp4" \
  -i "$ROOT_DIR/work/scene03.mp4" \
  -i "$ROOT_DIR/work/scene04.mp4" \
  -i "$ROOT_DIR/work/scene05.mp4" \
  -i "$ROOT_DIR/work/scene06.mp4" \
  -i "$ROOT_DIR/work/scene07.mp4" \
  -i "$ROOT_DIR/work/scene08.mp4" \
  -filter_complex "[0:v][1:v][2:v][3:v][4:v][5:v][6:v][7:v]concat=n=8:v=1:a=0[v]" \
  -map "[v]" -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p "$ROOT_DIR/work/promo-silent.mp4"

EDGE_PYTHON="$ROOT_DIR/.venv/bin/python"

for voice_index in {01..09}; do
  case "$voice_index" in
    01) voice_rate="-8%"; voice_pitch="-4Hz" ;;
    02) voice_rate="-7%"; voice_pitch="-3Hz" ;;
    03) voice_rate="-9%"; voice_pitch="-4Hz" ;;
    04) voice_rate="-6%"; voice_pitch="-2Hz" ;;
    05) voice_rate="+4%"; voice_pitch="-3Hz" ;;
    06) voice_rate="+0%"; voice_pitch="-3Hz" ;;
    07) voice_rate="+4%"; voice_pitch="-2Hz" ;;
    08) voice_rate="+3%"; voice_pitch="-2Hz" ;;
    09) voice_rate="+5%"; voice_pitch="-3Hz" ;;
  esac

  if [[ -x "$EDGE_PYTHON" ]] && "$EDGE_PYTHON" -c 'import edge_tts' 2>/dev/null; then
    "$EDGE_PYTHON" -m edge_tts \
      --voice zh-CN-XiaoxiaoNeural \
      --rate="$voice_rate" \
      --pitch="$voice_pitch" \
      -f "$ROOT_DIR/text/voice${voice_index}.txt" \
      --write-media "$ROOT_DIR/audio/voice${voice_index}-natural.mp3"
    ffmpeg -hide_banner -loglevel error -y \
      -i "$ROOT_DIR/audio/voice${voice_index}-natural.mp3" \
      -af "highpass=f=70,lowpass=f=11500,acompressor=threshold=-20dB:ratio=2:attack=20:release=180:makeup=2dB" \
      -ar 48000 -ac 2 "$ROOT_DIR/audio/voice${voice_index}-natural.wav"
  else
    echo "edge-tts 不可用，回退到 macOS 系统语音。"
    say -v Tingting -r 168 -o "$ROOT_DIR/audio/voice${voice_index}.aiff" -f "$ROOT_DIR/text/voice${voice_index}.txt"
    ffmpeg -hide_banner -loglevel error -y \
      -i "$ROOT_DIR/audio/voice${voice_index}.aiff" -ar 48000 -ac 2 \
      "$ROOT_DIR/audio/voice${voice_index}-natural.wav"
  fi
done

ffmpeg -hide_banner -loglevel error -y \
  -i "$ROOT_DIR/audio/voice01-natural.wav" -i "$ROOT_DIR/audio/voice02-natural.wav" -i "$ROOT_DIR/audio/voice03-natural.wav" \
  -i "$ROOT_DIR/audio/voice04-natural.wav" -i "$ROOT_DIR/audio/voice05-natural.wav" -i "$ROOT_DIR/audio/voice06-natural.wav" \
  -i "$ROOT_DIR/audio/voice07-natural.wav" -i "$ROOT_DIR/audio/voice08-natural.wav" -i "$ROOT_DIR/audio/voice09-natural.wav" \
  -filter_complex "[0:a]adelay=800|800[v0];[1:a]adelay=6500|6500[v1];[2:a]adelay=13200|13200[v2];[3:a]adelay=18500|18500[v3];[4:a]adelay=24900|24900[v4];[5:a]adelay=31300|31300[v5];[6:a]adelay=38000|38000[v6];[7:a]adelay=43500|43500[v7];[8:a]adelay=49000|49000[v8];[v0][v1][v2][v3][v4][v5][v6][v7][v8]amix=inputs=9:duration=longest:normalize=0,volume=1.20,highpass=f=80,lowpass=f=10500[narration]" \
  -map "[narration]" -ar 48000 "$ROOT_DIR/audio/narration-timed.wav"

ffmpeg -hide_banner -loglevel error -y \
  -f lavfi -i "sine=frequency=110:sample_rate=48000:duration=55" \
  -f lavfi -i "sine=frequency=164.81:sample_rate=48000:duration=55" \
  -f lavfi -i "sine=frequency=220:sample_rate=48000:duration=55" \
  -f lavfi -i "anoisesrc=color=pink:sample_rate=48000:duration=55" \
  -filter_complex "[0:a]volume=0.026,lowpass=f=500[p0];[1:a]volume=0.018,lowpass=f=700[p1];[2:a]volume=0.010,lowpass=f=900[p2];[3:a]volume=0.004,lowpass=f=1800[p3];[p0][p1][p2][p3]amix=inputs=4:duration=longest:normalize=0,afade=t=in:st=0:d=3,afade=t=out:st=51:d=4,aformat=channel_layouts=stereo[pad]" \
  -map "[pad]" "$ROOT_DIR/audio/music.wav"

ffmpeg -hide_banner -loglevel error -y \
  -i "$ROOT_DIR/work/promo-silent.mp4" \
  -i "$ROOT_DIR/audio/narration-timed.wav" \
  -i "$ROOT_DIR/audio/music.wav" \
  -filter_complex "[1:a]volume=1.0[voice];[2:a]volume=0.70[music];[voice][music]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.92,loudnorm=I=-16:TP=-1.5:LRA=8[a]" \
  -map 0:v -map "[a]" -t 55 \
  -c:v copy -c:a aac -ar 48000 -b:a 192k -movflags +faststart \
  -metadata title="我要找到你｜节目宣传片" \
  -metadata comment="Fictional public-service program promo" \
  "$ROOT_DIR/output/find-you-program-promo-v2.mp4"

ffmpeg -hide_banner -loglevel error -y \
  -ss 46 -i "$ROOT_DIR/output/find-you-program-promo-v2.mp4" -frames:v 1 -q:v 2 \
  "$ROOT_DIR/output/find-you-program-promo-cover-v2.jpg"

echo "$ROOT_DIR/output/find-you-program-promo-v2.mp4"
