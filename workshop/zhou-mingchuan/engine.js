(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ZhouEngine=api;})(typeof window==='object'?window:globalThis,function(){
  const obstacles = [
    [-5.1,-6.1,5.1,-5.9],[-5.1,-6,-4.9,5],[4.9,-6,5.1,5],
    [-5,4.9,-1.4,5.1],[1.4,4.9,5,5.1],[-1.5,5,-1.3,10],[1.3,5,1.5,10],[-1.5,9.9,1.5,10.1],
    [-1.3,-4.1,1.3,-3.1],[3,-4.5,4.7,-2.9],[-4.9,-2.6,-3.5,-1.4],[-4.3,1.1,-2.2,2.1],
  ];
  const objects = [
    {id:'computer',name:'查看电脑',min:[-.65,.85,-3.95],max:[.65,1.75,-3.1]},
    {id:'printer',name:'查看打印机',min:[3,.8,-4.4],max:[4.7,1.55,-2.9]},
    {id:'cabinet',name:'打开工具柜',min:[-4.9,.05,-2.6],max:[-3.5,1.9,-1.4]},
  ];
  function canStand(x,z,r=.22){
    if(!(x>-4.78&&x<4.78&&z>-5.78&&z<9.68))return false;
    if(z>4.78&&Math.abs(x)>1.08)return false;
    return !obstacles.some(([x0,z0,x1,z1])=>x>x0-r&&x<x1+r&&z>z0-r&&z<z1+r);
  }
  function move(player,dx,dz){
    let x=player.x,z=player.z;const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.08));
    for(let i=0;i<steps;i++){if(canStand(x+dx/steps,z))x+=dx/steps;if(canStand(x,z+dz/steps))z+=dz/steps;}
    return {...player,x,z};
  }
  function hit(origin,direction,min,max){
    let near=0,far=Infinity;
    for(let i=0;i<3;i++){
      if(Math.abs(direction[i])<1e-8){if(origin[i]<min[i]||origin[i]>max[i])return Infinity;continue;}
      const a=(min[i]-origin[i])/direction[i],b=(max[i]-origin[i])/direction[i];
      near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));if(near>far)return Infinity;
    }
    return near;
  }
  function target(player){
    const pitch=player.pitch||0,origin=[player.x,1.58,player.z];
    const direction=[Math.sin(player.yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(player.yaw)*Math.cos(pitch)];
    let result=null,nearest=2.3;
    for(const object of objects){const d=hit(origin,direction,object.min,object.max);if(d<nearest){nearest=d;result=object;}}
    if(result&&obstacles.some(([x0,z0,x1,z1],i)=>hit(origin,direction,[x0,-.1,z0],[x1,i<8?3.3:i===10?1.9:.9,z1])<nearest-.08))return null;
    return result;
  }
  return {obstacles,objects,canStand,move,target};
});
