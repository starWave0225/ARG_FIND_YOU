// Existing concept scenes are atmosphere. Observations do not grant identity conclusions.
(() => {
  const env = './assets/pixel/environments/';
  const inspect = (id,label,box,text,extra={}) => ({id,label,box,text,...extra});
  const scenes = {
    arrival: {title:'村口暮色',image:env+'village-entrance-dusk-v1.png',exits:['entrance','night-lane'],spots:[inspect('lit-window','远处的窗',[62,18,15,28],'山坡上的屋子大半隐在暮色里，只有一扇窗还亮着。')]},
    'night-lane': {title:'中央夜巷',image:env+'village-central-lane-night-v1.png',exits:['lane','clinic','entrance'],spots:[inspect('well','井口',[55,49,20,27],'井沿湿滑，里面没有映出天光。',{detail:'well'}),inspect('footprints','石板路',[39,67,17,30],'湿脚印一直到这块石板。再往前，地上没有留下接续的印子。'),inspect('scratches','卷闸门',[30,23,17,30],'门板上有几道斜着的划痕。边缘积了灰，摸不到新露出的金属。'),{label:'公示栏',box:[82,25,12,20],doc:'H01'}]},
    'hall-interior': {title:'盛家宗祠',image:env+'ancestral-hall-interior-v1.png',exits:['hall','shrine'],spots:[inspect('chairs','木椅',[17,59,61,27],'四把木椅朝着供桌，椅面落灰，地面有几道拖曳留下的痕迹。'),inspect('tablets','供桌',[40,21,19,30],'一块牌位朝里放着。从这里看不到上面的字。'),inspect('floor-hatch','地板暗格',[39,80,23,18],'铁环上有锈，暗格的边缘比周围地板干净。'),{label:'旧档卷册',box:[15,46,19,18],doc:'C3-01'},{label:'香炉',box:[45,44,12,13],ritual:true}]},
    shrine: {title:'旧佛堂',image:env+'old-buddhist-shrine-v1.png',ghostImage:env+'old-buddhist-shrine-ghost-v1.png',exits:['hall-interior','night-lane'],spots:[{label:'佛像',box:[22,17,16,47],effect:'buddha',ghostText:'眼窝深陷，嘴角向两侧裂开。暗色的泪痕已经干在石面上。'},{label:'观音像',box:[61,15,17,49],effect:'guanyin',ghostText:'两只眼睛都睁着。苍白的脸上多出细密裂纹，唇边刻着一道狭长的笑。'}]},
    forest: {title:'林场火场遗址',image:env+'burned-forest-watch-hut-v1.png',exits:['night-lane'],spots:[inspect('camera','烧焦的相机',[25,55,10,12],'相机外壳已经熏黑，镜头边缘粘着细小的灰屑。'),inspect('recorder','磁带机',[25,72,13,14],'磁带机斜陷在湿土里。按键卡住了，带仓的盖板已经变形。'),inspect('dry-ground','地面',[35,62,21,23],'雨落在周围的泥地上。这一小片地面却没有同样的水光。'),inspect('red-shoe','树下的鞋',[76,62,9,8],'一只红鞋留在倒下的木梁旁，另一只不在这里。')]},
    clinic: {title:'废弃卫生室',image:env+'abandoned-clinic-interior-v1.png',exits:['night-lane'],spots:[{label:'药柜',box:[19,28,18,49],find:'clinicCard'},{label:'书桌',box:[75,54,15,25],find:'clinicPhoto'},inspect('clinic-clock','挂钟',[67,17,8,16],'钟面停在两点十七分。房间里没有走针的声音。',{anomaly:true}),inspect('clinic-window','窗玻璃',[38,14,16,38],'雨水贴着玻璃滑动。窗外只看得见院墙和树。'),{label:'电灯开关',box:[63,52,5,11],light:true}]}
  };
  const exits = {entrance:['arrival','night-lane'],lane:['night-lane'],hall:['hall-interior','night-lane'],school:['night-lane'],service:['night-lane'],bridge:['night-lane']};
  const npcBoxes = {
    entrance:[56,43,7.5,29], lane:[62.5,42,6.5,15], school:[58,37,7.5,38],
    hall:[58.5,51,8.5,18], service:[39,40,10,18], bridge:[59.5,56,6.5,29]
  };
  // Distant location art and conversation portraits are separate assets.
  for (const npc of window.VillageCast) scenes[npc.scene] = {
    title:npc.place,image:env+`${npc.scene}-encounter-wide-v1.png`,npc:npc.id,
    npcBox:npcBoxes[npc.scene],ratio:1672/941,exits:exits[npc.scene],spots:[]
  };
  window.VillageScenes = scenes;
})();
