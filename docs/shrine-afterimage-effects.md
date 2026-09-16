# 佛堂动画与宗祠视觉残留

2026-09-09，已接入独立盛家村页面。

## 场景与操作

- 到达地点先显示环境和人物，点击人物区域后才出现底部对话；不提供侧栏对话捷径。
- 旧邮亭连接村口暮色和中央夜巷；夜巷连接杂货铺、卫生室与村口；地图可进入林场遗址。
- 祠堂外石阶连接宗祠内景，宗祠可走到旧佛堂。恐怖场景的观察不作为主线核验的前置。
- 卫生室检视挂钟后显示已有异常底图，可按场景中电灯开关改变明暗，状态随存档保存。
- 首次进入佛堂，佛像流泪和观音睁眼由点击对应雕像触发，缓慢发生后恢复，可重复观察。动画用 SVG/CSS 叠加在底图上，没有闪屏。
- 离开佛堂（包括返回地图）后再次进入，两尊雕像同时换为鬼佛底图：左像黑眼窝、裂口石齿与干涸泪痕，右像睁眼、狭长笑与裂纹。保留原构图，玩家进入时直接看到变化，没有解释弹窗或提示。
- `sceneFlags.shrineSeen / shrineDeparted / shrineGhost` 保存到存档。刷新同一场景、查看案卷、点击雕像与跨标签存档同步不计作离开或重访；URL 同步当前场景，避免刷新跳回之前的位置。旧存档第一次进入仍显示正常雕像。鬼佛状态持续保留。
- 鬼佛底图取代正常流泪／睁眼叠层，避免重复眼睛。点击任意鬼佛进入四只石手的机关近景；手势同时构成 2731 时打开两像之间的暗格，具体操作与保存见 [鬼佛四手机关](ghost-hands-puzzle.md)。不新增身份结论或主线前置。

## 视觉残留谜题

原始依据是 `docs/afterimage-test.html` 及 `assets/effects/afterimage-child-negative-v1.png`、`afterimage-child-positive-v1.png`，没有重新设定答案。

入口为宗祠内供桌上的香炉。显示原型纸条后由玩家点击“重新点香”。32 秒注视阶段沿用 13% 反相信号、香头位置和 7 秒渐入。钟响后显示 8.5 秒淡灰余像阶段，再让玩家记录孩子、成年人或没看清。正相辅助余像保持原型的低强度，不直接弹出整张孩子肖像。

只有选择记录后才写入 `sceneObservations.afterimage` 并生成“宗祠_熄灯后的观察记录”。选择孩子保存匹配状态，但不推断身份或自动完成主线。停止、Escape、关闭页面或切换标签页会取消计时，不补发观察结果。再次进入可以重试。

移除原测试页的强度调节、解法说明、答案核对大图与系统提示。纸条是已存在的场内材料。

## 生成素材

使用内置 image_gen 工具生成佛堂底图，保存到 `assets/pixel/environments/old-buddhist-shrine-v1.png`。既有恐怖环境及残像素材直接复用，未重绘。

重访底图使用内置 image_gen 编辑原图生成，保存到 `assets/pixel/environments/old-buddhist-shrine-ghost-v1.png`，原图保留。完整编辑提示词见 [shrine-ghost-image-prompt.txt](shrine-ghost-image-prompt.txt)。

首次底图生成提示词：

```text
Use case: stylized-concept. Asset type: static background for a Chinese anime pixel art horror adventure game, 16:9 landscape.
Create an original quiet abandoned small rural Buddhist shrine at night in central China, in carefully drawn late-1990s 32-bit pixel art, visibly angular pixel clusters, muted moss green and charcoal blue, ochre wood, weathered stone, restrained atmospheric horror. No photorealism, no smooth painted anime, no people, no lettering, no UI.
The interactive composition needs two distinct statues: on the LEFT at about 30% canvas x, a weathered ochre seated Buddha with a clearly visible frontal face and closed eyelids; on the RIGHT at about 70% canvas x, a pale stone Guanyin in a hood and lotus crown with a clearly visible frontal face and CLOSED eyelids. Both faces are large enough to later animate tiny tears and eyes in code, centered at about 37% canvas y. The viewer sees statues from head to lotus base, old wooden altar and incense vessels below. Leave the cheeks clean and dry and eyes completely closed in this base frame. Between the statues is an undecorated pale plaster wall patch with no inscription, suitable for a visual afterimage interaction. Symmetrical eye-level medium-wide shrine composition; background mossy plaster, dark rafters, dusty worn red cloth, one dim warm altar lamp. No blood, no monsters or jump scare, no glowing open eyes, no tears in the base image. Architecture and statues must be readable despite the dark atmosphere. Output one single image, not a collage, not a spritesheet.
```

## 验证

32 项 DOM 回归通过，新增首访正常、真实离开再进入变异、地图离开、刷新与跨标签同步不误触发、旧存档兼容及主线不变测试。DOM 回归覆盖场景可达、点击人物后对话、异常画面切换不推进剧情、雕像动画触发、32 秒／8.5 秒状态转换、取消计时、观察归档及不揭示身份。浏览器另外验证实际点击、绘制位置和完整等待时序。
