(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ZhouInvestigation=api;})(typeof window==='object'?window:globalThis,function(){
  const documents={
    transfers:{title:'没有接收人的调岗单',source:'周明川本机 · 2026-05-18 抄录',html:'<p>过去三年：17 人。接收部门、派车单、本人签收均缺失。6 人最后刷门禁的地点，随后出现封闭施工工单。</p><table><tr><th>记录</th><th>人事</th><th>出行</th><th>审批</th></tr><tr><td>老孙</td><td>内部转移</td><td>空</td><td>恒目驻场合规</td></tr><tr><td>同批 16 人</td><td>内部转移</td><td>空</td><td>数据合规复核</td></tr></table><p class="handwriting">交接单不是空白表格。人去了哪里？</p>'},
    ledger:{title:'三项支出',source:'工具柜底层 · 周明川 2026-05-24 打印件',html:'<p>特殊保管服务 → 顾问结算户 → 恒目关联文化基金</p><p>终端校准 → 顾问结算户 → 恒目关联文化基金</p><p>数据过滤 → 顾问结算户 → 恒目关联文化基金</p><hr><p>工程验收附件：空。实际维护设备：空。审批签名：空。</p><p>证书第一次返回：校验失败。刷新后返回：已通过。</p><p class="handwriting">不覆盖旧件，两份都留。</p>'},
    credential:{title:'终端便笺',source:'工具柜内壁 · 周明川手写便笺',html:'<div class="credential"><span class="eye-mark" aria-label="单眼标记">◉</span><p>HENGMU</p><pre>.-. . -.-. -.-- -.-. .-.. .</pre><p>ZM-0602</p></div>'},
    label:{title:'ZC-LH 留样袋',source:'工具柜抽屉 · 2026-05-29 拆检留样',html:'<p>压膜铝箔，背面没有电池、芯片、天线或连接线。内附家属特殊保管委托复印联，物品类别：遗物箱。</p><p>外部终端记录：00:04 在线；00:07 在线；00:10 连接中断。</p><p class="handwriting">我拆开的只是标签。原物还在保管处。</p>'},
    status:{title:'ZM-0602 · 员工状态',source:'1104 本机 · 人事与处置缓存',html:'<div class="sheets"><section class="sheet"><h3>人事记录</h3><p>周明川 / ZM-0602</p><p>状态：内部转移</p><p>接收部门：空<br>工作地点：空<br>本人确认：空</p></section><section class="sheet"><h3>处置队列</h3><p>EMP-TRANSFER-CLOSE</p><p>生成时间：2026-06-02 21:17</p><p>发起：HMO-ADMIN<br>执行人：恒目驻场合规组<br>附件：空</p></section></div><p>本页为缓存快照。人事同步时间字段缺失。</p>'},
    mail:{title:'专项交接 · 旧邮件',source:'暗格终端 · 周明川离线保存的邮件附页',html:'<p class="mailhead">发件署名：恒目驻场项目组<br>抄送署名：全知教会 · 保管与回访联络<br>主题：澄江专项服务延续<br>归档批次：QZ-CJ-04</p><p>物品保管关系不随前台账号更换而变更。原标签与原始关系附件分开封存，终端调用仍按旧批次登记。</p><p>前台应先接收意外死亡者家属的特殊保管委托，现场回访不得补写未确认的姓名。关系称谓与任务岗位分列，例行一致性回填不得覆盖原始回应。</p><p>下一班次恢复原队列。回返窗口单列，不计入普通物业维修成果。</p><hr><p>附件目录：QZ-CJ-04 / 保管交接；RW-04 / 窗口观察回放。</p>'},
    church:{title:'全知教会 · 保管交接附页',source:'QZ-CJ-04 · 旧邮件所附扫描件',html:'<div class="church-sheet"><span class="eye-mark" aria-label="单眼标记">◉</span><h3>全知教会</h3><p>保管与回访联络</p><hr><p>委托物与原始关系凭据，由保管处分别登记；恒目驻场组接收终端标签、前台岗位与维护批次。</p><p>物品不因前台销号返还。退出申请须保留家属原话，不以新的服务名称替换。</p><p>观察登记：遗留物编号／关系称谓／岗位编号。三栏不得互相代填。</p><p>回返窗口：重复接触时段。超出窗口的沉默照常记录。</p><p>页尾异议：有人换了称呼仍然回应旧名。请保留，不作统一修正。</p><hr><p>经手：保管与回访联络<br>执行：恒目驻场项目组<br>归档：QZ-CJ-04</p></div>'},
  };
  const replay=[
    {phase:'原始回访',account:'旧坐席',relation:'家属原称谓',task:'回访未结',response:'“你又回来了。”'},
    {phase:'过滤执行',account:'离线',relation:'空',task:'队列清空',response:'原始回应封存；前台历史删除'},
    {phase:'岗位重建',account:'新巡检岗',relation:'普通住户',task:'首次上门',response:'同一保管标签继续绑定'},
    {phase:'窗口重放',account:'新巡检岗',relation:'普通住户',task:'首次上门',response:'“你又回来了。”'},
  ];
  return {documents,replay};
});
