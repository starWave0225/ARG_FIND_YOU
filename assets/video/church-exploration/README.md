# 第六席 · 教会探险录像

72 秒 / 1280×720 / 24 fps / H.264 + AAC / 简体中文字幕。

这是游戏虚构剧情的影像素材，采用 AI 生成关键帧、剪辑运镜、拟现场声音及合成对白制作；人物转向通过剪辑呈现，未使用连续人物动作视频生成模型。图片由内置 imagegen 生成，完整提示词与参考图记录在 `prompts.json`。网页预览为 `preview.html`，成片为 `church-exploration-v1.mp4`。

## 剧情口径

- 夜间探索全知教会：空礼堂 → 背向而坐的仪式人群 → 受愿册 → 第六席录音机 → 人群回头 → 黑屏残音。
- 林知微祈愿咒杀盛雄，禁止代人应名；录像不宣布咒杀生效或盛雄死亡。
- 录音沿用“是否更改所求”“不改。愿了之后，留下的声音也可以走吗？”“所愿的终结与留置的终结分开登记”。录音中的女声不作身份鉴定。
- 册页是现有 A/B 页与续问留记的美术化节录，不新增终结回执或放行结果；签收框留白。
- 新增视听事件：仪式中心空椅放着录音机，人群背向坐定；回头白眼；黑屏后女声问“那你为什么答应了”。它是录像异象，不改变主线核验规则。
- 当前仅提供独立录像预览，不把秘密探险影像公开挂到教会官方导航上；没有增加解谜提示或游戏进度门槛。

## 文件

- `source/*-v1.png`：五张原始生成镜头，保留无损源文件。
- `source/voice-*.mp3`：已生成语音，重建可离线复用。
- `dialogue.json`：对白时间、角色处理方式和音色。
- `captions.srt` / `captions.vtt`：对白字幕，成片已烧录字幕。
- `poster.jpg`：成片抽帧封面。

## 重建

需要 ffmpeg（含 subtitles/libass）、ffprobe、Python 的 numpy / edge-tts。macOS 使用 PingFang 字体；其他系统需替换脚本 FONT。全部临时渲染文件位于 `/tmp/church-film-work`。

```sh
python scripts/video/build-church-film.py --stage picture
python /Users/qujunjie/.codex/skills/video-voiceover/scripts/extract_frames.py /tmp/church-film-work/picture.mp4 --workdir /tmp/church-film-work/review
# 查看抽帧，确认内容与 dialogue.json 对应后：
python scripts/video/build-church-film.py --stage audio
```

配音使用 video-voiceover 的抽帧、按时间轴写对白、合成、音量核验流程。为保留戏剧停顿，按句合成并按时码混音，未把整片填满旁白。音色 Yunxi / Yunjian / Xiaoxiao，语速 -10%，无背景音乐；脚步、木门摩擦、金属敲击、磁带底噪由脚本原创合成。TTS 需要联网，现成语音文件可以直接复用。

## 成片核验

2026-10-07：全片解码无错误；视频与音频均为 72.000 秒；文件 8,990,438 字节；平均音量 -33.4 dB、峰值 -8.3 dB。抽检全部镜头及 23 秒字幕，浏览器 readyState=4、实际播放时间推进、无媒体错误。
