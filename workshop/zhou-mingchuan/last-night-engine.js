(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ZhouLastNight=api;})(typeof window==='object'?window:globalThis,function(){
  const DATE='2026 年 6 月 2 日';
  const diary=[
    '旧邮件里反复出现“观察者”“回返窗口”和“记忆一致性”什么的。我的思绪很乱很乱，仿佛我的脑袋都不属于我了。他们要求物业优先接收意外死亡者家属的特殊保管委托，再把每天被清掉的账号重新放回原来的任务队列。只剩那枚单眼章，只要盖上了，一切都归于寂静。',
    '但，好像来不及了，我的行为已经被恒目组织发现，我能记住的事情越来越少，脑子里的声音，啊，那股声音快要把我吞噬了。',
    '21时17分，系统生成了我的处置记录，我看到我被离线了；而刚才，我的人事状态被改成“内部转移”。我有很不好的预感，这个房间我可能出不去了，所有异常都不是系统出错，而是它刻意为之的。有人知道接下来会发生什么。走廊里那道身影已经停了很久，我预感就是今天了。我把这些日记都留在本地，不再上传。如果你能看到这里，尽快离开这座大楼吧，找到自己的记忆吧。',
  ];
  const call=[
    {at:3,speaker:'周明川',text:'CS-046，别再走系统工单。你也会被清掉的。'},
    {at:11,speaker:'CS-046',text:'请说明需要复核的房号和材料编号。'},
    {at:18,speaker:'周明川',text:'我把东西都存在我的账号里，1104是我的房间，我可能没机会，你一定有办法做到。'},
    {at:37,speaker:'CS-046',text:'我没有发送过这项要求。'},
    {at:43,speaker:'周明川',text:'生死不过是一个轮回，明天他们也许会给你换一个编号，我一定会想办法帮你走出去。没时间了，我……'},
    {at:54,speaker:'CS-046',text:'您好，请问还在线吗？'},
  ];
  const message='一切都放在1104，救救我，我被困住了！';
  const boxes=[
    [-2.5,-3.6,2.5,-3.4],[-2.5,-3.5,-2.3,3.5],[2.3,-3.5,2.5,3.5],
    [-2.4,3.4,-.65,3.6],[.65,3.4,2.4,3.6],[-.9,-2.9,.9,-2.05],
    [1.62,-1.2,2.28,.2],[-2.25,-2.8,-1.55,-1.2],[1.52,1.65,2.28,2.55],
  ];
  const objects=[
    {id:'computer',name:'查看本地终端',min:[-.55,.85,-2.8],max:[.55,1.72,-2.05]},
    {id:'phone',name:'拿起手机',min:[1.60,.7,-1.15],max:[2.28,1.7,.2]},
    {id:'door',name:'拉动门把手',min:[-.65,.1,3.30],max:[.65,2.6,3.55]},
    {id:'panel',name:'打开遮板',min:[-2.29,.05,-2.8],max:[-1.52,1.72,-1.2]},
    {id:'cabinet',name:'拉开工具柜',min:[1.45,.1,1.55],max:[2.27,1.8,2.55]},
    {id:'switch',name:'按动照明开关',min:[2.22,1.15,.8],max:[2.4,1.8,1.4]},
  ];
  function canStand(x,z){return x> -2.08&&x<2.08&&z> -3.18&&z<3.18&&!boxes.some(([a,b,c,d])=>x>a-.22&&x<c+.22&&z>b-.22&&z<d+.22);}
  function move(p,dx,dz){let x=p.x,z=p.z;const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.06));for(let i=0;i<n;i++){if(canStand(x+dx/n,z))x+=dx/n;if(canStand(x,z+dz/n))z+=dz/n;}return {...p,x,z};}
  function hit(o,d,min,max){let lo=0,hi=Infinity;for(let i=0;i<3;i++){if(Math.abs(d[i])<1e-8){if(o[i]<min[i]||o[i]>max[i])return Infinity;continue;}const a=(min[i]-o[i])/d[i],b=(max[i]-o[i])/d[i];lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));if(lo>hi)return Infinity;}return lo;}
  function target(p,stage){if(stage==='hiding')return {id:'trapped-phone',name:'查看手机'};if(stage==='intrusion'||stage==='ended')return null;
    const pitch=p.pitch||0,o=[p.x,1.58,p.z],d=[Math.sin(p.yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(p.yaw)*Math.cos(pitch)];let out=null,near=1.9;
    for(const object of objects){const t=hit(o,d,object.min,object.max);if(t<near){near=t;out=object;}}
    if(out&&boxes.some(([a,b,c,e],i)=>hit(o,d,[a,-.1,b],[c,i<5?3.3:.82,e])<near-.08))return null;
    return out&&out.id==='phone'&&stage==='calling'?{...out,name:'查看通话'}:out;
  }
  function create(){return {stage:'room',calledAt:null,sent:false,sentAt:null,localSaved:true,unlocked:false,power:true,network:true,lamp:true,flashlight:false,replayed:false,filterRuns:0};}
  function authenticate(state,value){if(String(value).trim().toLowerCase()!=='hengmurecyclezm0602')return false;state.unlocked=true;return true;}
  function toggleConnection(state,key){if(!['power','network'].includes(key))return false;state[key]=!state[key];if(!state[key])state.filterRuns++;return state[key];}
  function dial(state,time){if(state.stage!=='room')return false;state.stage='calling';state.calledAt=time;return true;}
  function elapsed(state,time){return state.calledAt===null?0:Math.max(0,(time-state.calledAt)/1000);}
  function sinceSent(state,time){return state.sentAt===null?0:Math.max(0,(time-state.sentAt)/1000);}
  function advance(state,time){if(state.stage==='calling'&&elapsed(state,time)>=60)state.stage='hiding';if(state.stage==='intrusion'&&sinceSent(state,time)>=9)state.stage='ended';return state.stage;}
  function line(state,time){const t=elapsed(state,time);return call.filter(e=>e.at<=t).at(-1)||null;}
  function send(state,time){if(state.stage!=='hiding'||!Number.isFinite(time))return false;state.sent=true;state.sentAt=time;state.stage='intrusion';return true;}
  return {DATE,diary,call,message,boxes,objects,canStand,move,target,create,dial,elapsed,sinceSent,advance,line,send,authenticate,toggleConnection};
});
