# 厂门关了以后

48 秒、1280×720、25fps，六个镜头各 8 秒。画面由 imagegen 生成，为东岚机械厂剧情的虚构重现，不是历史记录。字幕为原创剧情文本。最终镜头牵出“东兰机械厂下岗工人”群聊，没有提供任何谜题答案。

当前 `donglan-workers-picture.mp4` 为画面及字幕版，无音轨。用户指定背景音乐《杀死那个石家庄人》，待提供音频后合成。仓库未下载或附带该歌曲录音。

在项目根目录执行：

```sh
python3 scripts/video/build-workers-film.py --music /absolute/path/to/music.mp3
```

合成后文件为 `donglan-workers.mp4`。音乐从输入文件开头开始，48 秒结束，首尾淡入淡出；如需要使用指定段落，先剪出该段音频。

分镜原图：`storyboard.png`。剪辑脚本：`scripts/video/build-workers-film.py`。`preview.html` 可在本地服务器中预览。
