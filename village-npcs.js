// Village encounters: each speaker distinguishes personal memory from archived records.
window.VillageCast = [
  {
    id: 'sheng-fugen', name: '盛福根', role: '退休乡邮员', scene: 'entrance', place: '村口旧邮亭',
    greeting: '你们是节目组的？车停前面吧。找人先认路，村里的老地址，连现在送信的小伙子都未必认得。',
    topics: [
      { id: 'route', label: '以前的信是怎么送进村的？', reply: '从东岚支局出来，先到厂区，再过石桥。大家都把那个岔口叫“农机厂口”，厂子改了名，叫法却没变。' },
      { id: 'faith', label: '村里什么时候开始热衷求子？', reply: '早先也有人上香，可没那么热闹。我记得盛守安张罗重修那阵，总往堂里去，说是替儿子盛雄求个后。对大家又是另一番话：人来了，卖菜、卖饭就不必都往镇上挑。清点时抄下的修堂旧记，我留了一份。', documents: [{id:'V01',label:'查看修堂旧记'}] },
      { id: 'wish-return', evidence:'V03', label:'出示续灯愿纸，问起“不贴外榜”', reply:'福根把眼镜往下挪了挪，先看落款，又翻到背面。“正面写的是守安的名字，背面这手字，我不敢认。那时候外面贴的是谁捐瓦、谁出工，不会把人家求什么都贴出去。可有人问盛家什么时候添人，他脸上就挂不住。我送信的，见过他怎么避开人，没见过他关门以后做什么。”', documents:[{id:'V01',label:'重看修堂旧记'},{id:'V03',label:'重看续灯愿纸'}] },
      { id: 'record', label: '能借看一下旧投递路线册吗？', after: 'route', hint: '先问问以前的投递路线。', offer: true, reply: '这一页你们可以拍下来。记住，路名对得上，只能说明信往哪儿走，不能说明如今住在那里的是谁。' }
    ],
    document: { id: 'npc-postal-route', type: 'PDF', title: '乡邮路线册_东岚至盛家村', meta: '盛福根提供 · 旧册拍摄件',
      body: '<h2>东岚支局乡邮投递路线摘页</h2><p>册页年份：1993 年。右上角有数次改线留下的铅笔痕。</p><table><thead><tr><th>沿途站点</th><th>旧称与备注</th></tr></thead><tbody><tr><td>东岚支局</td><td>厂矿、村庄共用收转点</td></tr><tr><td>农机厂口</td><td>先投厂区，再向石桥分路</td></tr><tr><td>盛家村石桥</td><td>过桥沿巷道到旧邮亭</td></tr><tr><td>村口旧邮亭</td><td>旧门牌信件交本户签收，不以外号代签</td></tr></tbody></table><blockquote>页边铅笔字：“厂口是路名，莫把路名当收件单位。”</blockquote><p class="document-note">用途：核对旧地名与投递方向。本页不包含个人联系方式，不能单独用于确认人物身份。</p>' }
  },
  {
    id: 'qian-sulan', name: '钱素兰', role: '杂货铺老板娘', scene: 'lane', place: '中央巷道 · 杂货铺',
    greeting: '买水自己拿。问人也行，可别只说“那个姓盛的”——这条巷子里一半都姓盛。',
    topics: [
      { id: 'names', label: '村里人平时都用外号吗？', reply: '熟人喊得顺口，我记账却得写清楚。不然月底拿着账本上门，谁都说你找错了人。卫生室里的“桂枝”，也得拿字据来对。' },
      { id: 'incense', label: '以前来烧香的人，能给村里带来生意吗？', reply: '能，一到香期，火柴、供香卖得快，有几家还给客人做饭。可进货也要钱，碰上雨，谁卖不出去谁着急。守安总说把名声办起来，往后大家都有饭吃。我愿意做生意，没说我知道谁求的愿应没应。店里留着那份结算摘册，你可以看看。', documents: [{id:'V02',label:'查看香期收支摘册'}] },
      { id:'refund-return', evidence:'V04', label:'出示停摊存根，问那句“饭菜等不得”', reply:'钱素兰手上的抹布停住了。“这句是我说的，我托人记在抄件上。香能收进柜子，切好的菜不能。公账上留下的钱不是我家赚的钱，更不是每户都领到的钱。谁后来领了、谁没领，你得去看各家的收条，我不能替他们说。”她把纸推回来。“后来开文旅议事会，我还在问什么时候结账。不是换块牌子，日子就换了。”', documents:[{id:'V02',label:'重看香期收支'},{id:'H02',label:'查看后来的村民议事记录'}] },
      { id: 'record', label: '拿药柜索引卡，请她核对“桂枝”', after: 'names', requires: 'clinicCard', hint: '先聊称呼，再出示已收到的索引卡扫描件或现场原件。', offer: true, reply: '卡上有全名，这就好说了。我这里只给你拍写着“卫生室代领”的几行，旁人的赊账别拍进去。至于她后来去了哪儿，别听我瞎猜。' }
    ],
    document: { id: 'npc-shop-ledger', type: 'PDF', title: '杂货铺赊账本_卫生室代领摘页', meta: '钱素兰提供 · 非相关条目已遮挡',
      body: '<h2>杂货铺赊账本摘页</h2><p>钱素兰核对药柜索引卡后，允许拍摄以下条目。无关住户记录未收入案卷。</p><table><thead><tr><th>日期</th><th>账面称呼</th><th>事项</th></tr></thead><tbody><tr><td>1995.06.17</td><td>桂枝</td><td>卫生室代领肥皂两块</td></tr><tr><td>1995.08.03</td><td>罗桂枝</td><td>妇幼宣传用纸，卫生室统一结清</td></tr></tbody></table><blockquote>本次访谈：“同一本账里的桂枝，就是写全名的这位。她后来的事，我不作准。”</blockquote><p class="document-note">账页用于核对称呼和工作地点；关于去向的结论仍需卫生室题记等独立材料。</p>' }
  },
  {
    id: 'qiu-yingqiu', name: '邱映秋', role: '退休村小教师', scene: 'school', place: '旧学校值班室',
    greeting: '相册可以翻，顺序不要打乱。有些照片上没写日期，底片袋上却还留着。先说说，你们在找哪一次活动？',
    topics: [
      { id: 'photos', label: '学校为什么留着卫生宣传照片？', reply: '那年借过教室办宣传，活动照也交来洗过。照片内容和后来写在背面的字，不一定是同一天留下的。' },
      { id: 'record', label: '核对卫生室照片的拍摄年份', after: 'photos', requires: 'clinicSolved', hint: '先核验索引卡和照片副本，再来核对原件年份。', offer: true, reply: '你们已经对过姓名和背面题记了？那看这页目录：拍摄登记在一九九五年，后来补字的时间没填。拍照和离村，不要记成同一件事。' }
    ],
    document: { id: 'npc-school-index', type: 'PDF', title: '村小相册目录_妇幼宣传底片袋', meta: '邱映秋提供 · 目录页与袋面抄录',
      body: '<h2>村小学活动相册目录摘录</h2><table><tbody><tr><th>目录编号</th><td>SY95-06</td></tr><tr><th>活动名称</th><td>妇幼卫生宣传</td></tr><tr><th>拍摄登记</th><td>1995 年 8 月</td></tr><tr><th>协作单位</th><td>村卫生室</td></tr><tr><th>补注时间</th><td>空白</td></tr></tbody></table><blockquote>底片袋附签：“活动照一套，另留卫生室一份。”</blockquote><p class="document-note">目录可确认拍摄年份。照片背面的离村题记属于后续补注，不能据此认定罗桂枝在 1995 年已经入学。</p>' }
  },
  {
    id: 'sheng-shisheng', name: '盛石生', role: '石匠兼房屋修缮工', scene: 'hall', place: '祠堂外石阶',
    greeting: '脚底下慢点，青苔滑。里面旧地板有松的，你们要问这道墙，站外头也看得见。',
    topics: [
      { id: 'wall', label: '墙上为什么有两种灰浆？', reply: '下面老，上面新。修墙有修墙的年头，我能说的是后来怎么补的，不能见着一道缝，就说三十年前发生过什么。' },
      { id: 'shrine', label: '佛堂以前只用来供香吗？', reply: '我二〇〇八年来修的时候，堂里是供像，外院还留着摆摊的旧棚脚。老人来添油，做生意的忙着量过道，各有各的打算。守安最早为什么修，我没经手，别拿我的工单替那时候作证。旧纸里另有一张留样，我也存着。', documents:[{id:'V06',label:'查看佛堂检修留样纸'}] },
      { id:'cavity-return', evidence:'V05', label:'出示查验签，问壁内的石板', reply:'盛石生没接那张纸，只指了指檐下。“新纸能系在旧东西上。二〇〇八年我补的是屋面、石阶和侧墙，没拆过两尊像中间那块石板。里面能不能动、谁先放的纸，我没上手试过。你们看到二〇二一年的签，就说整个暗格那年才做？这话我不认。”', documents:[{id:'V05',label:'重看查验签'},{id:'H03',label:'查看建筑测绘与导览图差异单'}] },
      { id: 'record', label: '能看看你留的修缮记录吗？', after: 'wall', hint: '先问墙面的灰浆。', offer: true, reply: '这是二〇〇八年的工单，补漏、石阶、封门，各有记号。你们留一份，以后核对建筑位置用。族谱那些东西不归我管。' }
    ],
    document: { id: 'npc-hall-repairs', type: 'PDF', title: '祠堂外墙_2008修缮工单', meta: '盛石生提供 · 建筑位置记录',
      body: '<h2>盛家村祠堂外墙修缮工单</h2><p>施工年份：2008 年。施工记录人：盛石生。</p><table><thead><tr><th>部位</th><th>处理</th></tr></thead><tbody><tr><td>前檐</td><td>补漏、替换碎瓦</td></tr><tr><td>门前石阶</td><td>补齐缺角，保留原石</td></tr><tr><td>侧墙旧门</td><td>封闭门洞，新灰浆覆盖旧门框边缘</td></tr></tbody></table><blockquote>复核备注：“旧墙与新补面留缝，后续照位置核验。”</blockquote><p class="document-note">本工单只证明 2008 年的建筑改动。盛石生在 1995 年仅 16 岁，本次访谈没有提供旧案见证。</p>' }
  },
  {
    id: 'sheng-he', name: '盛禾', role: '返乡资料整理员', scene: 'service', place: '村便民服务室',
    greeting: '先别把这些箱子搬开，我刚排好顺序。你们拿到材料的话，给我看看来源，我帮你们把名字和编号对上。',
    topics: [
      { id: 'catalog', label: '这些旧材料怎么查？', reply: '人说的称呼、册子写的标题、扫描时起的文件名，经常是三套东西。先记原件是谁保管，再查编号。没看过原件的，我不会替它填内容。' },
      { id:'label-return', evidence:'V05', label:'出示查验签，问“原位复核”', reply:'盛禾把正反面并排摆好。“公开展签只讲一件东西是什么，这张连放在哪里、绳子怎么系都在记。我那时协助整理公开扫描，没有参加夜里的复看，签上的工号我也不能凭空认人。你要查项目怎么保管旧物，我这里有补充约定的留存副本。先看原文，别把查验签上的一句话直接当成发生过什么的证明。”', documents:[{id:'H06',label:'查看旧物保管补充约定'},{id:'V05',label:'重看查验签'}] },
      { id: 'record', label: '拿出已借阅材料，请她整理目录', after: 'catalog', requires: 'npcDocument', hint: '先向其他村民借到至少一份档案，再来核对目录。', offer: true, reply: '来源记下了。这张表能把几处保管点串起来，空着的栏就是还没核验，别自己补。文件拿到以后，会和你已经有的材料一起存进案卷。' }
    ],
    document: { id: 'npc-scan-directory', type: 'PDF', title: '村庄资料_来源与编号对照表', meta: '盛禾提供 · 整理工作表',
      body: '<h2>村庄公共资料来源与编号对照表</h2><table><thead><tr><th>类别</th><th>编号</th><th>原件保管人</th></tr></thead><tbody><tr><td>乡邮路线册</td><td>YL93-01</td><td>盛福根</td></tr><tr><td>店铺代领摘页</td><td>ZD95-02</td><td>钱素兰</td></tr><tr><td>学校活动相册</td><td>SY95-06</td><td>邱映秋</td></tr><tr><td>祠堂外墙修缮单</td><td>JZ08-03</td><td>盛石生</td></tr></tbody></table><p>编号按资料类别编排。原件或拍摄件的借阅情况与来源逐份登记。</p><p class="document-note">整理员盛禾生于 2000 年。表中没有补写旧案事实，也不替代原件核验。</p>' }
  },
  {
    id: 'he-xiaoman', name: '何小满', role: '乡村快递代投员', scene: 'bridge', place: '河桥边',
    greeting: '借过一下，这箱东西怕淋。你们找我外婆的店？过桥直走就到。要是去旧学校，别跟着大路绕。',
    topics: [
      { id: 'paths', label: '今天哪些路还能走？', reply: '河桥这边和巷道都能走，学校门口也能到。林场那条山路有封闭牌，别往里去。以前的事我不知道，今天的路我刚骑过。' },
      { id: 'record', label: '能给我们画一份路线记录吗？', after: 'paths', hint: '先问今天的道路情况。', offer: true, reply: '我把今天走过的画给你们。只算今天的，夜里再下雨就不一定了。旧照片里的路通不通，不能拿这张来证明。' }
    ],
    document: { id: 'npc-bridge-route', type: '图', title: '当日代投路线_河桥与村中巷道', meta: '何小满提供 · 当日路线手记',
      body: '<h2>当日代投路线手记</h2><ol><li>村口旧邮亭 → 河桥：可步行、可推车。</li><li>河桥 → 中央巷道杂货铺：今天已通行。</li><li>杂货铺 → 旧学校 → 便民服务室：沿巷道步行可达。</li><li>林场山路：见封闭牌，未进入。</li></ol><blockquote>何小满：“这是我今天实际走过的路，老路以前什么样，我可没见过。”</blockquote><p class="document-note">当代交通观察，供现场路线选择使用；不能证明 1995 年的道路条件。</p>' }
  }
].map(npc => ({ ...npc, image: `./assets/characters/pixel/npcs/${npc.id}-v1.png` }));
