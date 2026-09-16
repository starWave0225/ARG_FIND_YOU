# 地点远景与人物对话

2026-09-09。每个地点先展示完整环境，人物只占环境画面的一小部分；点击人物才展开近景与话题，关闭或 Escape 回到同一地点。不能将人物形象册直接作为地点背景。

六处更新：村口旧邮亭、杂货铺、旧学校值班室、祠堂外石阶、便民服务室、河桥。其余六处环境、佛像／观音／鬼佛和视觉残留继续使用已有场景与操作。

## 素材

本次用内置 imagegen 分别生成六张远景，参考原人物形象及中央夜巷画风。人物直接画入环境，统一透视、像素颗粒、接地阴影及光线。原近景图保留，用于对话放大。

| 地点 | 远景文件（assets/pixel/environments/） | 点击后的近景（assets/characters/pixel/npcs/） |
| --- | --- | --- |
| 村口旧邮亭 | entrance-encounter-wide-v1.png | sheng-fugen-v1.png |
| 杂货铺 | lane-encounter-wide-v1.png | qian-sulan-v1.png |
| 旧学校值班室 | school-encounter-wide-v1.png | qiu-yingqiu-v1.png |
| 祠堂外石阶 | hall-encounter-wide-v1.png | sheng-shisheng-v1.png |
| 便民服务室 | service-encounter-wide-v1.png | sheng-he-v1.png |
| 河桥 | bridge-encounter-wide-v1.png | he-xiaoman-v1.png |

完整提示词：[npc-environment-prompts.json](npc-environment-prompts.json)。每张提示强调宽幅环境、单个远处小人物、保留衣着与身份、无界面文字；像素环境光线一致。

## 配置与交互

`village-scenes.js` 管理远景、原图比例和 `npcBox` 百分比点击区域。`village-npcs.js` 的 `image` 只用于近景，对话正文、领取条件和存档字段不变。`story-config.js` 的六处地点预览同步使用远景。

人物点击区域按生成图中实际人物位置标定，不能沿用旧近景的大范围矩形。场景图完整包含在视口内，点击区域与同一原图坐标系缩放。人物名字只在悬停或键盘聚焦时显示。

对话以人物近景和文本并排呈现；右上角结束交谈，长话题区可滚动。窄屏缩小人物栏，保留人物、对话与关闭入口。动画遵循减少动态效果设置。

## 验收

43 项 DOM 回归通过。隔离 Chrome 逐一进入六处地点，确认不自动弹出对话、远景成功载入且与近景不同、点击区域占画面不足 7%，再实际点击人物、切换话题、关闭返回原地点。700px 窄屏近景和 Escape 关闭通过，无页面报错；作者现有存档未改动。
