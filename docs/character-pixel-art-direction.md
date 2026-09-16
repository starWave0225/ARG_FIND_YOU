# 《我要找到你》中式动漫像素人物美术基准

版本：v2 · 2026-09-09

本次使用内置 image_gen 生成。交付 14 组人物原画，统一在 `assets/characters/pixel/`，形象册入口为 `docs/character-album.html`。最终使用的双胞胎为 v3，其余人物为 v2；v1 与六人探索对照只留作过程记录，不是当前形象基准。

## 已采纳的美术要求

- 中式动漫人物造型与像素场景统一：青灰、苔绿、旧木褐；阶梯轮廓和明确像素色块，不用照片加像素滤镜。
- 每位人物有独立脸型、眉眼比例、鼻形、嘴唇、胖瘦、年龄和姿态。先区分骨相，再安排衣着与发型。
- 双胞胎采用更好看的主角造型：男性硬朗俊朗，女性明艳利落。男性分支是同卵兄弟，女性分支是异卵龙凤胎；盛承安跨分支保持同一身份。
- 年龄、亲属关系、剧情、痣与疤等设定继续参照 character-bible.md。林知微的 52 岁图是年龄造型参考，本册不以此额外断言剧情结局。
- 童年图来自两个家庭，不表现共同成长。蓝白几何针织毯保留为视觉线索。原画中的微小标记需在未来正式谜题特写制作时继续校准。
- 游戏主角选择与卫生室人物图也引用当前像素版本；宣传片、信封与工厂证物不属于本次人物形象册的替换范围。

## 最终资产与完整提示词

### lin-zhiwei

文件：`assets/characters/pixel/lin-zhiwei-v2.png`

```text
Use case: stylized-concept. Original Chinese anime PIXEL ART cast designs for a grounded rural mystery game, matching attached rural scene ONLY in pixel texture and muted blue-gray / moss / old wood palette. Invent facial identities from the explicit morphology specs below. Decisive silhouette diversity and facial anatomy diversity are the first priority. Pixel-art illustration with crisply stepped outlines, deliberate coarse square clusters, restrained flat cel shading, clear face readability, simplified expressive eyes; not photorealism, not a photograph filter, not smooth digital painting, not generic handsome anime-face clones. Period-correct everyday Chinese clothing. Natural age-appropriate proportions, no chibi. Each person is a distinct individual rather than the same face wearing different hair or glasses. Head entirely visible, upper torso visible, neutral background in muted gray-green. No text, no numbers, no logos.
Reference: six person 3x2 morphology board. Use ONLY the named panel identity, never blend all faces together. Output a new 3:2 landscape album illustration, NOT the six-panel board. Two panels with narrow divider unless single portrait requested. Keep age credible and distinguish facial structures strongly.
Subject: Two equal portrait panels, SAME Lin Zhiwei, matching TOP LEFT identity from reference board exactly. LEFT 21 in 1995 with shoulder length black hair, plain ivory blouse and blue cloth hair tie. RIGHT 52 with clearly aged same slender oval face, gray strands, fine eye and mouth lines, shorter practical hair, blue-gray cardigan. Preserve small horizontal eyes, straight delicate brows, slim nose and mole below HER LEFT eye. Restrained alertness, no large generic anime eyes. Faded rural window background. Age comparison sheet only.
```

### sheng-linchuan

文件：`assets/characters/pixel/sheng-linchuan-v2.png`

```text
Use case: stylized-concept. Original Chinese anime PIXEL ART cast designs for a grounded rural mystery game, matching attached rural scene ONLY in pixel texture and muted blue-gray / moss / old wood palette. Invent facial identities from the explicit morphology specs below. Decisive silhouette diversity and facial anatomy diversity are the first priority. Pixel-art illustration with crisply stepped outlines, deliberate coarse square clusters, restrained flat cel shading, clear face readability, simplified expressive eyes; not photorealism, not a photograph filter, not smooth digital painting, not generic handsome anime-face clones. Period-correct everyday Chinese clothing. Natural age-appropriate proportions, no chibi. Each person is a distinct individual rather than the same face wearing different hair or glasses. Head entirely visible, upper torso visible, neutral background in muted gray-green. No text, no numbers, no logos.
Reference: six person 3x2 morphology board. Use ONLY the named panel identity, never blend all faces together. Output a new 3:2 landscape album illustration, NOT the six-panel board. Two panels with narrow divider unless single portrait requested. Keep age credible and distinguish facial structures strongly.
Subject: SINGLE full-width waist-up portrait, not a grid. Sheng Linchuan at 23, exactly TOP MIDDLE identity from reference board: long lean angular sun-dark face, high cheekbones, broad nose bridge, narrow deep-set eyes, rough flat brows, big ears, practical short buzz cut, short scar at HIS RIGHT eyebrow tail (viewer LEFT). Worn indigo labor jacket and canvas strap, sturdy slim physique. Calm direct gaze, understated half smile. Forestry village in muted background. Young outdoor worker, not old man, not male-model glamour.
```

### xu-xingyuan

文件：`assets/characters/pixel/xu-xingyuan-v2.png`

```text
Use case: stylized-concept. Original Chinese anime PIXEL ART cast designs for a grounded rural mystery game, matching attached rural scene ONLY in pixel texture and muted blue-gray / moss / old wood palette. Invent facial identities from the explicit morphology specs below. Decisive silhouette diversity and facial anatomy diversity are the first priority. Pixel-art illustration with crisply stepped outlines, deliberate coarse square clusters, restrained flat cel shading, clear face readability, simplified expressive eyes; not photorealism, not a photograph filter, not smooth digital painting, not generic handsome anime-face clones. Period-correct everyday Chinese clothing. Natural age-appropriate proportions, no chibi. Each person is a distinct individual rather than the same face wearing different hair or glasses. Head entirely visible, upper torso visible, neutral background in muted gray-green. No text, no numbers, no logos.
Reference: six person 3x2 morphology board. Use ONLY the named panel identity, never blend all faces together. Output a new 3:2 landscape album illustration, NOT the six-panel board. Two panels with narrow divider unless single portrait requested. Keep age credible and distinguish facial structures strongly.
Subject: Two equal portrait panels, SAME Xu Xingyuan, exactly TOP RIGHT identity from reference: high wide forehead, pale inverted-pear face narrowing to tiny chin, small drooping close-set eyes, very thin eyebrows, long narrow nose and thin lips, black round-rectangular glasses, modest academic bearing. LEFT 21 in 1995 flat side-part hair exposing forehead, gray student jacket. RIGHT 52 in 2026 same anatomy with receding hairline, sparse gray temples, fine age lines, simple glasses and navy cardigan. Subtle notch at HIS LEFT ear upper rim. Courteous ordinary expression, not ominous. Old study setting.
```

### twins-adult-male

文件：`assets/characters/pixel/twins-adult-male-v3.png`

```text
Use case: identity-preserve edit. Edit the provided two-panel Chinese anime pixel artwork. KEEP THE ENTIRE LEFT HALF UNCHANGED: this handsome man is Sheng Chengan age30, the fixed male identity. Replace ONLY the woman in the RIGHT half with his IDENTICAL MALE TWIN age30, the male player. Exact same male face shape, sculpted jaw, eye shape/spacing, nose bridge/tip, full lips, eyebrows and skin tone as the left man. He must be equally handsome. Right man has slightly softer side-parted SHORT black hair and more relaxed warmer expression, charcoal gray field jacket over gray shirt, same canvas shoulder strap as original right figure. Keep both rural backdrops, same two-panel composition, full heads, crisp deliberate pixel outlines and clean cel-shaded faces. Both are clearly MEN. Only hairstyle/clothes/expression distinguish the identical twins, never facial anatomy. No third figure, no text, no logo. Landscape 3:2.
```

### twins-adult-female

文件：`assets/characters/pixel/twins-adult-female-v3.png`

```text
Use case: style-transfer / character redesign. Edit the supplied Chinese anime pixel portrait DIPTYCH of fraternal brother/sister twins aged 30. Keep the same muted Chinese rural scene, composition, two portrait panels, olive men's zip jacket and navy woman's field jacket with canvas strap, pure deliberate pixel-art treatment. Redesign BOTH adult faces to be noticeably BEAUTIFUL PROTAGONISTS with refined Chinese animation character design. This is an intentional anatomy refinement requested by user; do not preserve the overly blocky heavy faces from the reference.
LEFT brother Sheng Chengan: strikingly handsome, clean angular square-OVAL face of balanced medium width, sculpted jaw corners but lean cheeks, elegant straight nose bridge and neat rounded tip (not squat broad bulbous nose), bright expressive almond eyes with subtle upward outer corners, strong well-shaped straight eyebrows, naturally full finely drawn lips, warm clear skin, neatly textured short black hair with a LITTLE height and a few deliberate separated locks, not shaved buzzcut and not huge floppy anime hair. Lean athletic shoulders, confident restrained gaze, age30 adult rather than teenage boy. His face should be distinct from a long gaunt laborer, a bespectacled thin scholar, and a heavy broad-faced stocky man.
RIGHT female protagonist: strikingly beautiful, lively clear dark almond eyes, slightly lifted brows, sculpted but graceful cheekbones and defined jaw, refined straight nose, elegantly full lips, balanced square-oval face with softly tapered chin, warm clear skin, short black bob with a clean side part and a few attractive face-framing strands, tucked behind ear. Confident capable mature woman age30. Chinese animation heroine, not generic doll, not child, not skinny pointed V chin.
Sibling resemblance: shared eye shape/spacing and full lips; brother a stronger jaw/straighter brows, sister slightly softer lower face and lifted brows. BOTH visibly good-looking. Smooth clean stylized skin through flat PIXEL CEL SHADING, do NOT fill cheeks with photographic dither freckles or gritty stubble. Crisp intentional square pixels, clear stepped dark outlines, muted colors with luminous face planes, no photorealism, no 3D, no text, no watermark. 3:2 landscape, entire hair/head visible.
```

### twins-childhood-male

文件：`assets/characters/pixel/twins-childhood-male-v3.png`

```text
Use case: stylized-concept. Two separate childhood portrait panels in Chinese anime PIXEL ART, same muted colors and crisp cel-shaded square pixel clusters as reference. Age regress the handsome LEFT adult male in supplied reference into a cute healthy 6-year-old Chinese BOY in BOTH panels, identical twins with exact same boy face, bright dark almond eyes, small refined rounded nose, full little lips, soft square-oval childhood cheeks, no adult jaw angles. Two DIFFERENT family locations in 2002, not a shared childhood scene. LEFT Sheng Chengan with short neat black hair and faded blue school jacket in front of village school brick wall, slightly reserved pose. RIGHT male player with soft short black fringe and ivory/navy striped knitted sweater at adoptive family home, relaxed expression. A BLUE-AND-WHITE GEOMETRIC knitted blanket clearly draped on chair behind RIGHT child. Both look cute and six years old, age-appropriate, never miniature adults. Preserve family eye/lip resemblance to adult reference. Two equal portrait panels narrow gutter, full head and upper body, no text or labels. 3:2 landscape.
```

### twins-childhood-female

文件：`assets/characters/pixel/twins-childhood-female-v3.png`

```text
Use case: stylized-concept. Two separate childhood portrait panels in Chinese anime PIXEL ART, muted rural colors, clean cel shading and crisp intentional square pixels matching supplied reference. Naturally age-regress BOTH adults in reference into cute healthy 6-year-old Chinese fraternal twins in 2002. LEFT Sheng Chengan boy: same family identity as left adult with soft square-oval CHILD cheeks, bright almond eyes, small refined rounded nose, little full lips, short black hair, faded blue school jacket before rural school brick wall. RIGHT girl player: same family identity as right adult with soft slightly more oval child cheeks, bright dark eyes, full small lips, tidy black bob, ivory/navy striped sweater in DIFFERENT adoptive family home. Blue-and-white GEOMETRIC knitted blanket unmistakably draped on chair behind girl. Sibling resemblance in eyes/mouth, not identical face. Age6 child proportions, no adult makeup, no adult sharp jaw, charming naturally expressive children. Two separate panels not a joint photo; no shared upbringing. Full heads and upper bodies visible, no text, 3:2 landscape.
```

### twins-newborn

文件：`assets/characters/pixel/twins-newborn-v3.png`

```text
Use case: stylized-concept. Original Chinese anime PIXEL ART cast designs for a grounded rural mystery game, matching attached rural scene ONLY in pixel texture and muted blue-gray / moss / old wood palette. Invent facial identities from the explicit morphology specs below. Decisive silhouette diversity and facial anatomy diversity are the first priority. Pixel-art illustration with crisply stepped outlines, deliberate coarse square clusters, restrained flat cel shading, clear face readability, simplified expressive eyes; not photorealism, not a photograph filter, not smooth digital painting, not generic handsome anime-face clones. Period-correct everyday Chinese clothing. Natural age-appropriate proportions, no chibi. Each person is a distinct individual rather than the same face wearing different hair or glasses. Head entirely visible, upper torso visible, neutral background in muted gray-green. No text, no numbers, no logos.
SINGLE wide scene no split: 1996 modest rural county hospital, TWO small newborn babies sleeping safely in two ADJACENT metal hospital bassinets, clothed and swaddled, heads supported, blankets away from faces. LEFT swaddled in simple ivory hospital cloth. RIGHT swaddled in distinct blue-and-white GEOMETRIC knitted blanket. Tiny newborn facial detail, no gender cues. Faded gray-green wall, wooden shelf, muted warm light. Quiet tender evidence illustration rendered fully in Chinese anime PIXEL ART, no text, no numbers. No adult figures.
Use 3:2 landscape; newborns in 1996, plainly illustrated cute tiny sleeping faces with very few pixels, not adult faces. Reference adult image is style only; do not copy faces or insert adults.
```

### sheng-xiong

文件：`assets/characters/pixel/sheng-xiong-v2.png`

```text
Use case: stylized-concept. Original Chinese anime PIXEL ART cast designs for a grounded rural mystery game, matching attached rural scene ONLY in pixel texture and muted blue-gray / moss / old wood palette. Invent facial identities from the explicit morphology specs below. Decisive silhouette diversity and facial anatomy diversity are the first priority. Pixel-art illustration with crisply stepped outlines, deliberate coarse square clusters, restrained flat cel shading, clear face readability, simplified expressive eyes; not photorealism, not a photograph filter, not smooth digital painting, not generic handsome anime-face clones. Period-correct everyday Chinese clothing. Natural age-appropriate proportions, no chibi. Each person is a distinct individual rather than the same face wearing different hair or glasses. Head entirely visible, upper torso visible, neutral background in muted gray-green. No text, no numbers, no logos.
Output ONE 3:2 landscape character album illustration with TWO equal portrait panels, narrow gutter. Show upper torso and whole head. No grids beyond the two panels. Reference board illustrates varied morphology and pixel style; use only Sheng Xiong panel identity for Sheng Xiong; all other identities must follow their own explicit spec, not copy faces from board.
Subject: Two equal portrait panels, SAME Sheng Xiong, exactly BOTTOM RIGHT board identity: heavy large round-square face, very thick neck, narrow hooded small eyes, crowded rough eyebrows, very broad flared nose, heavy cheek pads, blunt thick mouth, bristly short hair, stocky body. LEFT age 30 in 1995 brown work jacket. RIGHT age 61 in 2026 same heavy build but visibly older: graying sparse stiff hair, deep nasolabial folds, heavier eyelids, dark brown-gray jacket. Neutral ordinary expression, no theatrical malice. Old plaster courtyard setting. Do not slim him or beautify nose.
```

### sheng-changlin-zhou-shuqin

文件：`assets/characters/pixel/sheng-changlin-zhou-shuqin-v2.png`

```text
Use case: stylized-concept. Original Chinese anime PIXEL ART cast designs for a grounded rural mystery game, matching attached rural scene ONLY in pixel texture and muted blue-gray / moss / old wood palette. Invent facial identities from the explicit morphology specs below. Decisive silhouette diversity and facial anatomy diversity are the first priority. Pixel-art illustration with crisply stepped outlines, deliberate coarse square clusters, restrained flat cel shading, clear face readability, simplified expressive eyes; not photorealism, not a photograph filter, not smooth digital painting, not generic handsome anime-face clones. Period-correct everyday Chinese clothing. Natural age-appropriate proportions, no chibi. Each person is a distinct individual rather than the same face wearing different hair or glasses. Head entirely visible, upper torso visible, neutral background in muted gray-green. No text, no numbers, no logos.
Output ONE 3:2 landscape character album illustration with TWO equal portrait panels, narrow gutter. Show upper torso and whole head. No grids beyond the two panels. Reference board illustrates varied morphology and pixel style; use only Sheng Xiong panel identity for Sheng Xiong; all other identities must follow their own explicit spec, not copy faces from board.
Subject: Two equally sized panels with TWO different people in 1995. LEFT Sheng Changlin, father age48: unusually LONG BONY narrow face, hollow cheeks, very high cheekbones, sun-dark leathery skin, small high-set deep eyes, broad projecting ears, weathered large nose, thin gray-black cropped hair, deeply creased forehead, slender angular shoulders. Worn olive forestry uniform and faded canvas strap, patient expression. Father of TOP MIDDLE and TOP RIGHT board men, share only ears/brow. RIGHT Zhou Shuqin age46: markedly ROUND FULL face, soft plump cheeks, small gentle crescent eyes, thin delicate curved eyebrows, small upturned round nose, tiny thin lips and mole beside HER RIGHT mouth corner, black hair in LOW TIGHT BUN with loose gray strand. Stocky maternal frame, dark homemade indigo blouse. Calm warmth, clearly middle-aged, not glamorous young anime heroine. Faces must be dramatically distinct in shape, not matching couple-face templates. Rustic wood porch background.
```

### sheng-shouan-shouping

文件：`assets/characters/pixel/sheng-shouan-shouping-v2.png`

```text
Use case: stylized-concept. Original Chinese anime PIXEL ART cast designs for a grounded rural mystery game, matching attached rural scene ONLY in pixel texture and muted blue-gray / moss / old wood palette. Invent facial identities from the explicit morphology specs below. Decisive silhouette diversity and facial anatomy diversity are the first priority. Pixel-art illustration with crisply stepped outlines, deliberate coarse square clusters, restrained flat cel shading, clear face readability, simplified expressive eyes; not photorealism, not a photograph filter, not smooth digital painting, not generic handsome anime-face clones. Period-correct everyday Chinese clothing. Natural age-appropriate proportions, no chibi. Each person is a distinct individual rather than the same face wearing different hair or glasses. Head entirely visible, upper torso visible, neutral background in muted gray-green. No text, no numbers, no logos.
Output ONE 3:2 landscape character album illustration with TWO equal portrait panels, narrow gutter. Show upper torso and whole head. No grids beyond the two panels. Reference board illustrates varied morphology and pixel style; use only Sheng Xiong panel identity for Sheng Xiong; all other identities must follow their own explicit spec, not copy faces from board.
Subject: Two different brothers in 1995, clear anatomy contrast. LEFT Sheng Shouan age55 village head: BROAD TRAPEZOID pear-like face, very wide forehead, bulbous rounded nose, prominent puffy under-eye bags, small widely-spaced smiling eyes, thin slightly arched eyebrows, rounded full lower cheeks, slicked-back salt-black hair, stocky body, neat olive cadre jacket, affable public expression. RIGHT Sheng Shouping age58 county official: tall THIN HORSE-SHAPED face, long vertical cheeks, narrow jaw and chin, LONG hooked bridge with related round nose tip, similar wide eye spacing but narrow coldly polite eyes, dark brows slanting down at ends, graying formal side-part hair, gray Zhongshan suit with plain pen. Both visibly late50s, respectful ordinary public faces. Keep left broad and friendly, right severe and slender without evil caricature. Quiet office backdrop.
```

### sheng-dechang

文件：`assets/characters/pixel/sheng-dechang-v2.png`

```text
Use case: stylized-concept. Original Chinese anime PIXEL ART cast designs for a grounded rural mystery game, matching attached rural scene ONLY in pixel texture and muted blue-gray / moss / old wood palette. Invent facial identities from the explicit morphology specs below. Decisive silhouette diversity and facial anatomy diversity are the first priority. Pixel-art illustration with crisply stepped outlines, deliberate coarse square clusters, restrained flat cel shading, clear face readability, simplified expressive eyes; not photorealism, not a photograph filter, not smooth digital painting, not generic handsome anime-face clones. Period-correct everyday Chinese clothing. Natural age-appropriate proportions, no chibi. Each person is a distinct individual rather than the same face wearing different hair or glasses. Head entirely visible, upper torso visible, neutral background in muted gray-green. No text, no numbers, no logos.
Output ONE 3:2 landscape character album illustration with TWO equal portrait panels, narrow gutter. Show upper torso and whole head. No grids beyond the two panels. Reference board illustrates varied morphology and pixel style; use only Sheng Xiong panel identity for Sheng Xiong; all other identities must follow their own explicit spec, not copy faces from board.
Subject: Two equal portrait panels of SAME Sheng Dechang at 36 LEFT and 67 RIGHT. Unique face unlike reference board cast: medium BROAD OBLONG rectangular face, SLIGHTLY DROOPING asymmetrical outer eyes and sparse lower lashes, straight thick but separated eyebrows, flattened WIDE nose bridge with blunt projecting tip, small slightly pursed mouth with thin upper lip, shallow short diagonal scar on HIS RIGHT upper cheek. LEFT thick practical black hair swept slightly forward, weathered medium tan skin, navy mechanic jacket with rolled collar, broad shoulders. RIGHT receding silver-gray hair, sagging jowls and eyelids, same scar and anatomy, gray-green retired worker jacket, unshowy gentle reserve. Backdrop subdued factory workshop left and courtyard right. Actual age distinction; not just gray hair on a 20-year-old.
```

### luo-guizhi

文件：`assets/characters/pixel/luo-guizhi-v2.png`

```text
Use case: stylized-concept. Original Chinese anime PIXEL ART cast designs for a grounded rural mystery game, matching attached rural scene ONLY in pixel texture and muted blue-gray / moss / old wood palette. Invent facial identities from the explicit morphology specs below. Decisive silhouette diversity and facial anatomy diversity are the first priority. Pixel-art illustration with crisply stepped outlines, deliberate coarse square clusters, restrained flat cel shading, clear face readability, simplified expressive eyes; not photorealism, not a photograph filter, not smooth digital painting, not generic handsome anime-face clones. Period-correct everyday Chinese clothing. Natural age-appropriate proportions, no chibi. Each person is a distinct individual rather than the same face wearing different hair or glasses. Head entirely visible, upper torso visible, neutral background in muted gray-green. No text, no numbers, no logos.
Output ONE 3:2 landscape character album illustration with TWO equal portrait panels, narrow gutter. Show upper torso and whole head. No grids beyond the two panels. Reference board illustrates varied morphology and pixel style; use only Sheng Xiong panel identity for Sheng Xiong; all other identities must follow their own explicit spec, not copy faces from board.
Subject: Two equal panels SAME Luo Guizhi at27 LEFT and58 RIGHT. Unique square-round face with WIDE lower cheek area, short blunt chin, slightly unequal almond eyes with heavy tired upper lids, short low eyebrows, LOW WIDE nose with distinctly round tip, thin downturned mouth, tiny mole beside HER LEFT nostril. Left loosely tied practical black hair with flyaway wisps, slightly hunched posture, simple ivory rural clinic coat. Right gray streaks in low bun, substantially heavier cheeks and eye bags, age lines, muted moss cardigan. Caring but tired human presence. No wide-eyed heroine glamour; absolutely not slim delicate Lin Zhiwei or angular female player's face. Faded gray-green clinic backdrop.
```

### sheng-guangcai

文件：`assets/characters/pixel/sheng-guangcai-v2.png`

```text
Use case: stylized-concept. Original Chinese anime PIXEL ART cast designs for a grounded rural mystery game, matching attached rural scene ONLY in pixel texture and muted blue-gray / moss / old wood palette. Invent facial identities from the explicit morphology specs below. Decisive silhouette diversity and facial anatomy diversity are the first priority. Pixel-art illustration with crisply stepped outlines, deliberate coarse square clusters, restrained flat cel shading, clear face readability, simplified expressive eyes; not photorealism, not a photograph filter, not smooth digital painting, not generic handsome anime-face clones. Period-correct everyday Chinese clothing. Natural age-appropriate proportions, no chibi. Each person is a distinct individual rather than the same face wearing different hair or glasses. Head entirely visible, upper torso visible, neutral background in muted gray-green. No text, no numbers, no logos.
Output ONE 3:2 landscape character album illustration with TWO equal portrait panels, narrow gutter. Show upper torso and whole head. No grids beyond the two panels. Reference board illustrates varied morphology and pixel style; use only Sheng Xiong panel identity for Sheng Xiong; all other identities must follow their own explicit spec, not copy faces from board.
Subject: Two equal portrait panels SAME Sheng Guangcai age41 LEFT and72 RIGHT. Very distinctive NARROW WEDGE/TRAPEZOID face with pinched temples, HIGH protruding cheekbones, long pointed chin, pronounced slightly OFF-CENTER nose bent toward HIS LEFT, small sharply focused close-set eyes, short sparse eyebrows, small puckered thin lips, attached tiny earlobes, hunched slim shoulders. LEFT thinning carefully combed dark hair, deep nasolabial creases already, navy-gray plain cloth jacket, closed ledger below chest without readable text. RIGHT sparse white-gray comb-over and mostly bald crown, thin metal READING glasses sitting low on nose, creased sunken cheeks, old brown cardigan. Reserved analytical person, not an evil caricature. Dull old wooden village office background. Nothing like youthful handsome Xu despite both being slim.
```


## 村庄 NPC 扩展

2026-09-09 新增 6 张独立 NPC 原画，形象册合计 20 组。文件位于 `assets/characters/pixel/npcs/`；人物设定见 [village-npcs.md](village-npcs.md)，完整提示词与修订记录见 [village-npc-prompts.md](village-npc-prompts.md)。
