(() => {
  function create(canvas, options={}) {
    const realistic=Boolean(options.materials);
    const gl=canvas.getContext('webgl',{antialias:realistic,alpha:false});
    if(!gl)return null;
    const vertex=`
      attribute vec3 p; attribute vec3 n; attribute vec3 c;
      attribute vec2 uv; attribute float material; attribute float emission;
      uniform mat4 vp;
      varying mediump vec3 normal; varying mediump vec3 color; varying mediump vec3 world;
      varying mediump vec2 tex; varying mediump float surface; varying mediump float glow;
      void main(){world=p;normal=n;color=c;tex=uv;surface=material;glow=emission;gl_Position=vp*vec4(p,1.);}`;
    const fragment=`
      precision mediump float;
      varying mediump vec3 normal; varying mediump vec3 color; varying mediump vec3 world;
      varying mediump vec2 tex; varying mediump float surface; varying mediump float glow;
      uniform vec3 eye; uniform vec3 aim; uniform float light; uniform float torch; uniform float photographic;
      uniform sampler2D plaster; uniform sampler2D terrazzo; uniform sampler2D wood; uniform sampler2D steel;
      void main(){
        vec3 albedo=color;
        if(surface>.5){
          vec2 q=fract(tex);
          vec3 sampleColor;
          if(surface<1.5)sampleColor=texture2D(plaster,q).rgb;
          else if(surface<2.5)sampleColor=texture2D(terrazzo,q).rgb;
          else if(surface<3.5)sampleColor=texture2D(wood,q).rgb;
          else sampleColor=texture2D(steel,q).rgb;
          albedo*=sampleColor*1.65;
        }
        float distanceToEye=length(world-eye);
        float spot=smoothstep(.83,.97,dot(normalize(world-eye),aim))*torch/(1.+distanceToEye*.18);
        float grain=fract(sin(dot(floor(world*90.),vec3(12.99,78.23,37.4)))*43758.54);
        vec3 rgb;
        if(photographic>.5){
          vec3 toLamp=vec3(0.,2.83,-1.45)-world;
          float diffuse=.25+.75*max(dot(normal,normalize(toLamp)),0.);
          float lamp=diffuse/(1.+dot(toLamp,toLamp)*.26);
          float hall=1./(1.+length(world-vec3(0.,2.8,5.4))*1.7);
          float corner=min(min(2.4-abs(world.x),3.5-abs(world.z)),world.y);
          float ao=.72+.28*smoothstep(0.,.5,corner);
          float deskShadow=(1.-smoothstep(.5,1.15,abs(world.x)))*(1.-smoothstep(.4,1.,abs(world.z+2.48)));
          float cabinetShadow=(1.-smoothstep(.25,.7,abs(world.x-1.91)))*(1.-smoothstep(.4,.8,abs(world.z-2.1)));
          if(normal.y>.8&&world.y<.08)ao*=1.-max(deskShadow,cabinetShadow)*.62;
          vec3 illumination=vec3(.18+lamp*.94)*light+vec3(.72,.75,.72)*spot+vec3(.025,.026,.025)*hall;
          rgb=albedo*illumination*ao*(.98+grain*.04);
          rgb=mix(rgb,albedo*.75,glow);
          float gray=dot(rgb,vec3(.299,.587,.114));rgb=mix(vec3(gray),rgb,.52);
          float fog=clamp(distanceToEye/23.,0.,.5);
          rgb=mix(rgb,vec3(.012,.014,.015),fog);
        }else{
          float diffuse=.34+.30*max(dot(normal,normalize(vec3(.4,1.,.2))),0.);
          float lamp=max(0.,1.-length(world-vec3(0.,2.5,-2.4))/5.);
          rgb=albedo*((diffuse+lamp*.5)*light+spot*.95)*(grain*.15+.92);
          rgb=mix(rgb,vec3(.035,.045,.052)*light,clamp(distanceToEye/14.,0.,.7));
        }
        gl_FragColor=vec4(rgb,1.);
      }`;
    function shader(type,code){
      const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    function program(v,f){
      const p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,v));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,f));gl.linkProgram(p);
      if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));
      return p;
    }
    const worldProgram=program(vertex,fragment),worldBuffer=gl.createBuffer();
    const spriteProgram=program(`
      attribute vec3 p;attribute vec2 uv;uniform mat4 vp;
      varying mediump vec2 tex;varying mediump vec3 world;
      void main(){tex=uv;world=p;gl_Position=vp*vec4(p,1.);}`,`
      precision mediump float;
      varying mediump vec2 tex;varying mediump vec3 world;
      uniform sampler2D image;uniform vec3 eye;uniform vec3 aim;
      uniform float torch;uniform float light;uniform float torchReveal;uniform float photographic;
      void main(){
        vec4 c=texture2D(image,tex);if(c.a<.35)discard;
        float spot=smoothstep(.83,.97,dot(normalize(world-eye),aim))*torch;
        vec3 lit=c.rgb*(light*.54+.12+spot*.58);
        float gray=dot(lit,vec3(.299,.587,.114));lit=mix(lit,mix(vec3(gray),lit,.45),photographic);
        vec3 shaded=mix(lit,vec3(.004,.005,.006),torchReveal*(1.-spot));
        float fog=clamp(length(world-eye)/23.,0.,.5);
        gl_FragColor=vec4(mix(shaded,vec3(.012,.014,.015),fog),c.a);
      }`),spriteBuffer=gl.createBuffer();
    const textures=new Map();
    function texture(src){
      if(textures.has(src))return textures.get(src);
      const item={texture:gl.createTexture(),ready:false};textures.set(src,item);
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,item.texture);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([170,170,170,255]));
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      const image=new Image();
      image.onload=()=>{gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,item.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);item.ready=true;};
      image.onerror=()=>{canvas.dataset.assetError='部分材质未能载入';};image.src=src;
      return item;
    }
    // Complete fallback keeps the shared paper demo valid without material assets.
    const fallback=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,fallback);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([170,170,170,255]));
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    const materialTextures=['plaster','terrazzo','wood','steel'].map(name=>options.materials&&options.materials[name]?texture(options.materials[name]):null);
    function attributes(prog,list,stride){
      for(let i=0;i<8;i++)gl.disableVertexAttribArray(i);
      for(const [name,size,offset] of list){const loc=gl.getAttribLocation(prog,name);if(loc>=0){gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,stride,offset);}}
    }
    function multiply(a,b){const out=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];return out;}
    function matrix(p){
      const f=1/Math.tan(Math.PI/6),a=canvas.width/canvas.height;
      const projection=new Float32Array([f/a,0,0,0,0,f,0,0,0,0,-1.002,-1,0,0,-.2002,0]);
      const sy=Math.sin(p.yaw),cy=Math.cos(p.yaw),sp=Math.sin(p.pitch),cp=Math.cos(p.pitch);
      const r=[cy,0,sy],u=[-sy*sp,cp,cy*sp],b=[-sy*cp,-sp,cy*cp],e=[p.x,p.height||1.58,p.z];
      const dot=v=>v.reduce((sum,x,i)=>sum+x*e[i],0);
      return multiply(projection,new Float32Array([r[0],u[0],b[0],0,r[1],u[1],b[1],0,r[2],u[2],b[2],0,-dot(r),-dot(u),-dot(b),1]));
    }
    function geometry(boxes){
      const vertices=[];
      const faces=[[[0,0,1],[1,0,1],[1,1,1],[0,1,1],[0,0,1]],[[1,0,0],[0,0,0],[0,1,0],[1,1,0],[0,0,-1]],[[1,0,1],[1,0,0],[1,1,0],[1,1,1],[1,0,0]],[[0,0,0],[0,0,1],[0,1,1],[0,1,0],[-1,0,0]],[[0,1,1],[1,1,1],[1,1,0],[0,1,0],[0,1,0]],[[0,0,0],[1,0,0],[1,0,1],[0,0,1],[0,-1,0]]];
      for(const [x,y,z,w,h,d,color,angle=0,material=0,emission=0] of boxes){
        const X=[-w/2,w/2],Y=[y-h/2,y+h/2],Z=[-d/2,d/2],cos=Math.cos(angle),sin=Math.sin(angle);
        const scale=material===1?.5:material===2?1/1.4:material===3?1.1:1.6;
        for(const face of faces)for(const i of [0,1,2,0,2,3]){
          const v=face[i],n=face[4],lx=X[v[0]],ly=Y[v[1]],lz=Z[v[2]];
          const u=n[0]!==0?lz:x+lx,uv=n[1]!==0?z+lz:ly;
          vertices.push(x+lx*cos+lz*sin,ly,z-lx*sin+lz*cos,n[0]*cos+n[2]*sin,n[1],-n[0]*sin+n[2]*cos,...color,u*scale,uv*scale,material,emission);
        }
      }
      return new Float32Array(vertices);
    }
    const uniform=(p,name)=>gl.getUniformLocation(p,name);
    function viewUniforms(prog,mat,p,direction,brightness,flashlight){
      gl.uniformMatrix4fv(uniform(prog,'vp'),false,mat);gl.uniform3f(uniform(prog,'eye'),p.x,p.height||1.58,p.z);
      gl.uniform3fv(uniform(prog,'aim'),direction);gl.uniform1f(uniform(prog,'light'),brightness);
      gl.uniform1f(uniform(prog,'torch'),flashlight?1:0);gl.uniform1f(uniform(prog,'photographic'),realistic?1:0);
    }
    gl.enable(gl.DEPTH_TEST);
    return {preload:src=>texture(src),render(player,boxes,brightness=1,sprites=[],flashlight=false){
      const width=Math.max(1,Math.min(realistic?1600:960,Math.round(canvas.clientWidth*(realistic?Math.min(window.devicePixelRatio||1,1.5):1))));
      const height=Math.max(1,Math.round(width*canvas.clientHeight/Math.max(1,canvas.clientWidth)));
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height);}
      const v=geometry(boxes),mat=matrix(player),direction=[Math.sin(player.yaw)*Math.cos(player.pitch||0),Math.sin(player.pitch||0),-Math.cos(player.yaw)*Math.cos(player.pitch||0)];
      gl.useProgram(worldProgram);gl.bindBuffer(gl.ARRAY_BUFFER,worldBuffer);
      attributes(worldProgram,[['p',3,0],['n',3,12],['c',3,24],['uv',2,36],['material',1,44],['emission',1,48]],52);
      gl.bufferData(gl.ARRAY_BUFFER,v,gl.DYNAMIC_DRAW);
      gl.clearColor(.012,.014,.015,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      viewUniforms(worldProgram,mat,player,direction,brightness,flashlight);
      ['plaster','terrazzo','wood','steel'].forEach((name,i)=>{gl.activeTexture(gl.TEXTURE1+i);gl.bindTexture(gl.TEXTURE_2D,materialTextures[i]?materialTextures[i].texture:fallback);gl.uniform1i(uniform(worldProgram,name),i+1);});
      gl.drawArrays(gl.TRIANGLES,0,v.length/13);
      if(!sprites.length)return;
      gl.useProgram(spriteProgram);gl.bindBuffer(gl.ARRAY_BUFFER,spriteBuffer);attributes(spriteProgram,[['p',3,0],['uv',2,12]],20);
      viewUniforms(spriteProgram,mat,player,direction,brightness,flashlight);gl.uniform1i(uniform(spriteProgram,'image'),0);
      gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
      for(const s of sprites){
        const tex=texture(s.src);if(!tex.ready)continue;
        gl.uniform1f(uniform(spriteProgram,'torchReveal'),s.torchReveal?1:0);
        const a=s.angle||0,c=Math.cos(a),n=Math.sin(a),w=s.width/2,y=s.y||0,h=s.height;
        const coords=[[-w,0,0,1],[w,0,1,1],[w,h,1,0],[-w,h,0,0]],vertices=[];
        for(const i of [0,1,2,0,2,3]){const q=coords[i];vertices.push(s.x+q[0]*c,y+q[1],s.z-q[0]*n,q[2],q[3]);}
        gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex.texture);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,6);
      }
      gl.disable(gl.BLEND);
    }};
  }
  window.ZhouRenderer={create};
})();
