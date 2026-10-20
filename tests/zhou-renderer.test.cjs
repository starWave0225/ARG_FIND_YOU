const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../workshop/zhou-mingchuan/renderer.js'),'utf8');
function setup(){
  let next=0,currentUnit=0,buffer=null;const bound=new Map(),uploads=new Map(),uniforms=new Map(),draws=[],images=[];
  const gl={
    VERTEX_SHADER:1,FRAGMENT_SHADER:2,COMPILE_STATUS:3,LINK_STATUS:4,ARRAY_BUFFER:5,FLOAT:6,TEXTURE0:100,TEXTURE1:101,TEXTURE_2D:7,
    RGBA:8,UNSIGNED_BYTE:9,TEXTURE_WRAP_S:10,TEXTURE_WRAP_T:11,CLAMP_TO_EDGE:12,TEXTURE_MIN_FILTER:13,TEXTURE_MAG_FILTER:14,
    LINEAR:15,DEPTH_TEST:16,DYNAMIC_DRAW:17,COLOR_BUFFER_BIT:18,DEPTH_BUFFER_BIT:19,TRIANGLES:20,BLEND:21,SRC_ALPHA:22,ONE_MINUS_SRC_ALPHA:23,
    createShader:()=>++next,shaderSource(){},compileShader(){},getShaderParameter:()=>true,
    createProgram:()=>++next,attachShader(){},linkProgram(){},getProgramParameter:()=>true,
    createBuffer:()=>++next,createTexture:()=>++next,
    activeTexture(unit){currentUnit=unit;},bindTexture(type,id){bound.set(currentUnit,id);},texImage2D(){},texParameteri(){},
    getAttribLocation:(p,name)=>['p','n','c','uv','material','emission'].indexOf(name),
    disableVertexAttribArray(){},enableVertexAttribArray(){},vertexAttribPointer(){},
    getUniformLocation:(p,name)=>name,uniform1i(name,value){uniforms.set(name,value);},uniform1f(name,value){uniforms.set(name,value);},
    uniform3f(){},uniform3fv(){},uniformMatrix4fv(name,transpose,data){assert.ok([...data].every(Number.isFinite));},
    useProgram(){},bindBuffer(type,id){buffer=id;},bufferData(type,data){uploads.set(buffer,data);},
    clearColor(){},clear(){},viewport(){},enable(){},disable(){},blendFunc(){},
    drawArrays(mode,start,count){assert.ok(Number.isInteger(count)&&count>0);assert.ok([...uploads.get(buffer)].every(Number.isFinite));draws.push({count,data:uploads.get(buffer)});},
  };
  const canvas={clientWidth:1280,clientHeight:720,dataset:{},getContext:()=>gl};
  class Image{set src(value){this.url=value;images.push(this);}}
  const window={devicePixelRatio:1};vm.runInNewContext(source,{window,Image,Float32Array,Uint8Array});
  return {create:window.ZhouRenderer.create,canvas,draws,uniforms,bound,images};
}
const player={x:0,z:.7,yaw:0,pitch:0,height:1.58};
test('shared renderer has complete material samplers even when the old paper scene supplies no textures',()=>{
  const h=setup(),r=h.create(h.canvas);r.render(player,[[0,0,0,4,.1,4,[.3,.3,.3]]]);
  assert.equal(h.uniforms.get('photographic'),0);assert.equal(h.canvas.width,960);
  for(let unit=101;unit<=104;unit++)assert.ok(h.bound.get(unit),'all four sampler units must bind a complete fallback');
  assert.equal(h.draws[0].count,36);
});
test('textured geometry and transparent intruder render with finite attributes; failed images retain a usable fallback',()=>{
  const h=setup(),r=h.create(h.canvas,{materials:{plaster:'wall.webp',terrazzo:'floor.webp',wood:'wood.webp',steel:'steel.webp'}});
  const sprite={src:'person.png',x:0,z:5.7,width:1.4,height:2.12,torchReveal:true};
  r.preload(sprite.src);for(const image of h.images)image.onload();
  r.render(player,[[0,0,0,4,.1,4,[.3,.3,.3],0,2,0] ],1,[sprite],false);
  assert.equal(h.canvas.width,1280);assert.equal(h.uniforms.get('photographic'),1);assert.equal(h.uniforms.get('torch'),0);assert.equal(h.uniforms.get('torchReveal'),1);
  assert.deepEqual(h.draws.map(d=>d.count),[36,6]);
  assert.equal(h.draws[0].data.length,36*13);assert.equal(h.draws[1].data.length,6*5);
  h.canvas.clientWidth=0;h.canvas.clientHeight=0;h.images[0].onerror();r.render(player,[[0,0,0,1,1,1,[.5,.5,.5]]]);
  assert.equal(h.canvas.width,1);assert.equal(h.canvas.height,1);assert.match(h.canvas.dataset.assetError,/材质/);
});
