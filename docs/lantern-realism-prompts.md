# 写实灯笼素材生成记录

使用内置 image_gen。最终采用第四次结果，保存为 assets/pixel/environments/hall-lanterns-realistic-v1.png。第一版少一排，第二、三版透明背景不合格，均未接入游戏。最终四排五列及亮灯位置已目视核对。

## 第 1 次生成

Use case: photorealistic-natural.
Asset type: production game environment prop, isolated photographic asset with a genuinely TRANSPARENT alpha background, no floor or background wall.
Primary request: Replace a fake flat pixel-icon lantern puzzle with a physically believable, photorealistic hanging arrangement of EXACTLY TWENTY old Chinese paper lanterns in FOUR horizontal rows, FIVE lanterns per row. Front view, mild depth, camera square to the arrangement so every row and column is unambiguous.
Subject: a weathered dark timber hanging structure with four thin horizontal rails and subtle vertical supporting posts, aged hemp suspension cords and old muted reddish-brown handmade paper lanterns. No solid backboard, no decorative rectangular UI frame. Each lantern is a round-oval traditional bamboo ribbed paper lantern, with individually uneven paper wrinkles, aged translucent fibers, small stains, dusty bamboo rib shadows, dark metal fittings, and short worn tassels. Subtle organic differences, never perfectly copied identical icons.
CRITICAL lighting state, rows counted top to bottom and columns left to right:
Row 1: OFF, OFF, OFF, OFF, OFF.
Row 2: OFF, OFF, ON, OFF, OFF.
Row 3: OFF, ON, ON, OFF, OFF.
Row 4: OFF, ON, OFF, OFF, OFF.
Exactly FOUR lanterns internally illuminated, the other SIXTEEN unlit. Only R2C3, R3C2, R3C3, R4C2 glow warm amber through the real paper, with brightest cores partly hidden behind bamboo ribs and gentle physically plausible spill onto neighboring timber. Unlit lanterns remain readable in faint cool ambient light but have NO bright cores. No exposed cartoon flame glyphs. No fairy lights or extra lamps.
Composition: entire structure and all twenty lanterns plus all cords and tassels fully visible with a small transparent margin, balanced 4:3 landscape canvas, readable regular row/column order, roomy gaps between rows, no overlap between lantern bodies.
Style: cinematic archaeological prop photography from an abandoned rural Chinese ancestral hall at night; highly detailed actual surfaces, realistic optics and material response, restrained gloomy atmosphere. NO pixel art, NO illustration, NO SVG/vector/icon aesthetic, NO flat color blocks, NO plastic render, NO thick graphic outlines. No text, no Chinese characters, no numbers, no symbols, no labels, no watermark. True transparency in all empty areas, not a checkerboard painted into the image.

## 第 2 次生成

Edit target: supplied photorealistic lantern rack PNG. The current image has ONLY THREE rows and FIFTEEN lanterns. This is incorrect for the puzzle. Make exactly one targeted correction: ADD A COMPLETE FOURTH ROW OF FIVE LANTERNS UNDER THE EXISTING THIRD ROW, extend the vertical posts and lower hanging rail to contain this row, enlarge the canvas height as needed. Keep existing fifteen lanterns and their current lighting states intact. The new fourth row has five lanterns: column 1 UNLIT, column 2 internally glowing warm amber, columns 3,4,5 UNLIT. This produces FOUR rows of FIVE, TWENTY lanterns total, FOUR lit lanterns total. Final lit coordinates R2C3, R3C2, R3C3, R4C2. Final top row all unlit. Keep all four rows fully inside image, no crop. Preserve realistic weathered handmade paper, bamboo ribs, amber candle cores, rope knots, aged timber, camera angle and physical scale. New row matches the existing material and spacing. Maintain true transparent alpha background through gaps and around object. No graphic labels, no text, no numbers, no additional lights. Count 5+5+5+5=20 before finalizing. Square or portrait canvas permitted to fit ALL FOUR rows.

## 第 3 次生成

Use case: background-extraction. Edit the supplied TWENTY-lantern rack image ONLY to remove the fake gray-and-white checkerboard. The checkerboard is currently painted into an RGB file. Output a genuinely TRANSPARENT RGBA PNG: empty pixels must have alpha=0, including every gap between lanterns, gaps between rails and outside timber posts. Do not paint a checkerboard, white, gray or black as the background. Keep the whole rack, all FOUR rows of FIVE old realistic paper lanterns, original object colors, bamboo ribs, fine paper texture, cords, tassels and lighting exactly as in this reference. FOUR illuminated lanterns must remain at row2col3, row3col2, row3col3, row4col2. Other sixteen unlit. Preserve the full rectangular bounds, all twenty lanterns visible. This is a transparent object cutout for compositing into a game scene, NOT a photo of an object against a patterned backdrop.

## 第 4 次生成

Use case: precise-object-edit. Edit the supplied image of four rows of five realistic old Chinese paper lanterns.
REPLACE EVERY GRAY AND WHITE CHECKERBOARD AREA with a real very dark weathered charcoal-brown wooden wall of an abandoned Chinese ancestral hall. OPAQUE photographic image, absolutely NO transparency, NO checkerboard. Background throughout should be near-black aged timber planks, grain barely visible in cool ambient light, with realistic shadows cast by the rack and gentle warm light spill behind the FOUR illuminated lanterns.
Keep the lantern rack, all TWENTY lanterns, their rows and columns, weathered paper, bamboo ribs, timber rails, ropes and tassels unchanged. Keep EXACTLY FOUR lights: second row third lantern; third row second and third lanterns; fourth row second lantern. All other lanterns are dark. Do not add, remove, rearrange or relight any lantern. Four horizontal rows, each with exactly five lanterns, all visible.
Camera straight-on, photorealistic material, cinematic low light, old dry handmade paper with natural wear and muted rust-red pigment. Preserve readable details without studio-bright lighting. No text, lettering, numbers, decorative frame, game UI, icons, pixel art, cartoon or checkerboard. The output is a finished realistic close-up photograph of the lantern rack against the hall wall, full bleed.
