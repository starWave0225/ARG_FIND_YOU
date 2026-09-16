# 《我要找到你》盛家村像素探索素材包 v1

## 美术基准

- 类型：九十年代末 32-bit 叙事冒险像素画。
- 视角：室外采用三分之四俯视探索视角；室内采用正面箱庭式点击解谜视角。
- 气质：低饱和、安静、克制。恐怖来自重复、缺失、时间错乱和物件位置变化，不靠突然出现的怪脸。
- 地域：湖北／华中山区气质的中国乡村，旧白墙、深色木构、湿石板、竹林、梯田和九十年代遗留设施。
- 色板：潮湿青灰、苔藓绿、旧木褐、病房灰绿；暗红只用于线索和危险提示。
- 超现实规则：吸收箱庭式超现实解谜的特点，但不复制其他作品的角色、图标、构图和标志性物件。

## 已生成素材

### 主角

- `assets/pixel/characters/protagonist-sprites-concept-v1.png`
  - 男女主角两套动作概念表。
  - 包含四向站立、行走、手电、调查、受惊和蹲下。
  - 男主为黑灰工作夹克，女主为藏蓝夹克和灰色内搭；共用帆布肩包。
  - 带透明通道，可用于后续切分正式 sprite cells。

### 路线与环境

- `assets/pixel/maps/shengjia-village-exploration-map-v1.png`
  - 村口、中心巷、卫生室、宗祠、旧学校、河桥、火场遗址七个节点。
- `assets/pixel/environments/village-entrance-dusk-v1.png`
  - 玩家抵达盛家村的第一幕；远处废屋中有一扇不合理的亮窗。
- `assets/pixel/environments/village-central-lane-night-v1.png`
  - 第一处自由探索节点；水井、邮箱、抓痕、断掉的脚印和面对墙壁的鸡。
- `assets/pixel/environments/abandoned-clinic-interior-v1.png`
  - 罗桂枝工作过的旧卫生室；药柜、病床、蓝白针织毯、两只搪瓷杯和 02:17 的钟。
- `assets/pixel/environments/abandoned-clinic-anomaly-v1.png`
  - 同一卫生室的异常状态；熄灯、倒流的雨、打开的药柜、手印、重叠钟针和幼童脚印。
- `assets/pixel/environments/ancestral-hall-interior-v1.png`
  - 盛家宗祠；反放的牌位、被剪掉的孩子、缺页族谱、四把椅子和地板暗格。
- `assets/pixel/environments/burned-forest-watch-hut-v1.png`
  - 1995 年火场遗址；相机、磁带机、三根钉子、红鞋、017 树号和不落雨的地面。

## 现行章节投放路线

本文件保留早期概念图清单，场景中的装饰不自动成为证据。实际谜题与章节以 [场景流程稿](document-drafts/15-scene-flow.md) 和 [谜题制作单](document-drafts/13-puzzle-blueprint.md) 为准。

1. 序章和第一、二章在电脑调查，不展示村庄可探索全景。
2. 第三章首次抵达村口，打开地图与六位NPC；比对早期扫描件和原保管位置。
3. 第三章从正式旧物调阅进入祠堂，独立家庭照片支撑三人登记与四人照的矛盾。现图剪影、椅子不是正式物证。
4. 第四章进入林场并回访卫生室封存夹。017来自录像巡护牌与领用册，不能由树刻替代；02:17不是卫生室钟给出的密码。
5. 双胞胎蓝白毯线索在第五至六章的医疗/福利院照片和家庭材料中出现，卫生室装饰布不得充当同一物件。
6. HM和异常氛围从第三章后可选展开，不以触发熄灯或场景异常解锁主线。

## 2D 与 3D 的边界

场景、人物、恐怖变化都保留 2D 像素风。只有需要玩家旋转和拆解的关键物证使用低多边形 3D：

- 半熔化的磁带机：旋转、开仓、倒带。
- 烧焦的相机：调整镜头环、取出底片。
- 药瓶：观察瓶底编号与残留药片。
- 宗祠暗格内的木盒：转动铜扣并检查夹层。

3D 物件进入检查模式时仍使用同一套青灰和旧褐色调，并叠加像素化后处理，避免与 2D 场景割裂。

## 最终生成提示词基准

所有素材均使用内置图像生成模式，核心提示词如下：

> Authentic hand-authored late-1990s 32-bit 2D pixel art for an original Chinese mountain-village mystery. Outdoor scenes use an orthographic three-quarter top-down exploration view; interiors use a front-facing theatrical point-and-click room. Crisp deliberate pixel clusters, limited muted palette, wet blue-gray, moss green, aged wood brown, restrained dark-red clue accents. Calm at first glance, quietly impossible on closer inspection. Clear navigation lanes and separated clickable clue silhouettes. No readable text, no UI, no logo, no watermark, no photorealism, no smooth painting, no overt gore, no copied characters or signature objects.

角色提示词额外锁定：30 岁、硬朗但好看的中国面孔；男女为龙凤胎气质；男主黑灰夹克，女主藏蓝夹克与灰色内搭；深色长裤、实用短靴、同款帆布肩包；保持四向动作比例一致。


## 2026-09-09 场景接入更新

概念场景已进入独立村庄页面，人物先在场景里出现，点击后对话。地图林场入口现在直接显示火场环境；主线核验仍由玩家另行提交。卫生室异常画面可触发，宗祠香炉已接入原视觉残留原型。新增佛堂底图及流泪／睁眼动画，详见 [效果说明](shrine-afterimage-effects.md)。
