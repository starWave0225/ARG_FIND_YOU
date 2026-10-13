(() => {
  function create(canvas){
    const gl=canvas.getContext('webgl',{antialias:false});if(!gl)return null;
    const vertex=`attribute vec3 p;attribute vec3 n;attribute vec3 c;uniform mat4 vp;varying vec3 normal;varying vec3 color;varying vec3 world;void main(){world=p;normal=n;color=c;gl_Position=vp*vec4(p,1.);}`;
    const fragment=`precision mediump float;varying vec3 normal;varying vec3 color;varying vec3 world;uniform vec3 eye;uniform float light;void main(){float grain=fract(sin(dot(floor(world*70.),vec3(12.99,78.23,37.4)))*43758.54);float diffuse=.34+.30*max(dot(normal,normalize(vec3(.4,1.,.2))),0.);float lamp=max(0.,1.-length(world-vec3(0.,2.5,-2.4))/5.);vec3 rgb=color*(diffuse+lamp*.5)*(grain*.15+.92)*light;float fog=clamp(length(eye-world)/14.,0.,.7);gl_FragColor=vec4(mix(rgb,vec3(.035,.045,.052)*light,fog),1.);}`;
    function shader(type,code){const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
    const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);for(const [name,offset] of [['p',0],['n',12],['c',24]]){const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,36,offset);}
    gl.enable(gl.DEPTH_TEST);const vp=gl.getUniformLocation(program,'vp'),eye=gl.getUniformLocation(program,'eye'),light=gl.getUniformLocation(program,'light');
    function multiply(a,b){const out=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];return out;}
    function matrix(p){const f=1/Math.tan(Math.PI/6),a=canvas.width/canvas.height;const projection=new Float32Array([f/a,0,0,0,0,f,0,0,0,0,-1.002,-1,0,0,-.2002,0]);
      const sy=Math.sin(p.yaw),cy=Math.cos(p.yaw),sp=Math.sin(p.pitch),cp=Math.cos(p.pitch),r=[cy,0,sy],u=[-sy*sp,cp,cy*sp],b=[-sy*cp,-sp,cy*cp],e=[p.x,p.height||1.58,p.z];const dot=v=>v.reduce((sum,x,i)=>sum+x*e[i],0);
      return multiply(projection,new Float32Array([r[0],u[0],b[0],0,r[1],u[1],b[1],0,r[2],u[2],b[2],0,-dot(r),-dot(u),-dot(b),1]));
    }
    function geometry(boxes){const vertices=[];const faces=[[[0,0,1],[1,0,1],[1,1,1],[0,1,1],[0,0,1]],[[1,0,0],[0,0,0],[0,1,0],[1,1,0],[0,0,-1]],[[1,0,1],[1,0,0],[1,1,0],[1,1,1],[1,0,0]],[[0,0,0],[0,0,1],[0,1,1],[0,1,0],[-1,0,0]],[[0,1,1],[1,1,1],[1,1,0],[0,1,0],[0,1,0]],[[0,0,0],[1,0,0],[1,0,1],[0,0,1],[0,-1,0]]];
      for(const [x,y,z,w,h,d,color,angle=0] of boxes){const X=[-w/2,w/2],Y=[y-h/2,y+h/2],Z=[-d/2,d/2],cos=Math.cos(angle),sin=Math.sin(angle);for(const face of faces)for(const i of [0,1,2,0,2,3]){const v=face[i],n=face[4];vertices.push(x+X[v[0]]*cos+Z[v[2]]*sin,Y[v[1]],z-X[v[0]]*sin+Z[v[2]]*cos,n[0]*cos+n[2]*sin,n[1],-n[0]*sin+n[2]*cos,...color);}}
      return new Float32Array(vertices);
    }
    return {render(player,boxes,brightness=1){const width=Math.min(960,Math.round(canvas.clientWidth)),height=Math.round(width*canvas.clientHeight/canvas.clientWidth);if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height);}const v=geometry(boxes);gl.bufferData(gl.ARRAY_BUFFER,v,gl.DYNAMIC_DRAW);gl.clearColor(.035,.045,.05,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniformMatrix4fv(vp,false,matrix(player));gl.uniform3f(eye,player.x,player.height||1.58,player.z);gl.uniform1f(light,brightness);gl.drawArrays(gl.TRIANGLES,0,v.length/9);}};
  }
  window.ZhouRenderer={create};
})();
