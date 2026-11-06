// 3D particle object in the hero. Morphs between a sphere, a torus knot and a double helix,
// leans toward the pointer and scatters as you scroll away. Needs three.js; skips itself otherwise.
(function(){
  const hero=document.querySelector('.hero'),bg=hero&&hero.querySelector('.bg');
  if(!bg||!window.THREE)return;
  const RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const small=innerWidth<900,N=small?4500:9000;

  let renderer;
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'})}catch(e){return}
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  const cv=renderer.domElement;cv.id='gl';cv.setAttribute('aria-hidden','true');bg.appendChild(cv);

  const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(40,1,.1,100);cam.position.z=9;
  const group=new THREE.Group();scene.add(group);

  // three target shapes, all centred on the origin with radius about 2
  const sphere=new Float32Array(N*3),knot=new Float32Array(N*3),helix=new Float32Array(N*3),print=new Float32Array(N*3),rnd=new Float32Array(N*3);
  const ga=Math.PI*(3-Math.sqrt(5));
  for(let i=0;i<N;i++){
    const y=1-(i/(N-1))*2,r=Math.sqrt(1-y*y),th=ga*i;
    sphere.set([Math.cos(th)*r*2.1,y*2.1,Math.sin(th)*r*2.1],i*3);

    const t=i/N*Math.PI*2,p=2,q=3,kr=Math.cos(q*t)+2.2,j=(Math.random()-.5)*.28;
    knot.set([(kr*Math.cos(p*t))*.72+j,(kr*Math.sin(p*t))*.72+j,(-Math.sin(q*t))*.9+j],i*3);

    const s=i%2?Math.PI:0,h=(i/N)*2-1,a=h*Math.PI*3.2+s,hr=1.05+(Math.random()-.5)*.12;
    helix.set(i%7==0
      ?[Math.cos(h*Math.PI*3.2)*hr*Math.random()*(Math.random()<.5?-1:1),h*2.5,Math.sin(h*Math.PI*3.2)*hr*.3] // rungs
      :[Math.cos(a)*hr,h*2.5,Math.sin(a)*hr],i*3);

    // fingerprint: one long whorl with breaks in the ridges, slightly domed
    const u=Math.sqrt(i/N),fa=u*Math.PI*2*13,brk=Math.sin(fa*.37+u*29)>.86?.07:0,fr=.08+u*2.2+brk+(Math.random()-.5)*.018;
    print.set([Math.cos(fa)*fr*.8+Math.sin(fr*2.6)*.09,Math.sin(fa)*fr*1.04+Math.cos(fr*2.1)*.07,.5-.14*fr*fr],i*3);

    rnd.set([Math.random(),Math.random(),Math.random()],i*3);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(sphere,3));
  geo.setAttribute('pB',new THREE.BufferAttribute(knot,3));
  geo.setAttribute('pC',new THREE.BufferAttribute(helix,3));
  geo.setAttribute('pD',new THREE.BufferAttribute(print,3));
  geo.setAttribute('rnd',new THREE.BufferAttribute(rnd,3));

  const U={uT:{value:0},uW:{value:new THREE.Vector4(1,0,0,0)},uScatter:{value:0},uPx:{value:renderer.getPixelRatio()},
    uM:{value:new THREE.Vector2(99,99)},uHov:{value:0},
    uA:{value:new THREE.Color('#ff5a1f')},uB:{value:new THREE.Color('#101114')},uC:{value:new THREE.Color('#ffb020')}};
  const mat=new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,
    vertexShader:`
      attribute vec3 pB;attribute vec3 pC;attribute vec3 pD;attribute vec3 rnd;
      uniform float uT,uScatter,uPx,uHov;uniform vec4 uW;uniform vec2 uM;
      varying float vMix;varying float vA;
      void main(){
        vec3 p=position*uW.x+pB*uW.y+pC*uW.z+pD*uW.w;
        p+=0.05*vec3(sin(uT*1.3+rnd.x*40.),cos(uT*1.1+rnd.y*40.),sin(uT*.9+rnd.z*40.));
        p+=(rnd-.5)*uScatter*9.;
        vec4 mv=modelViewMatrix*vec4(p,1.);
        // particles part around the pointer
        vec2 away=mv.xy-uM;float dist=length(away)+.001;
        mv.xy+=away/dist*smoothstep(1.15,0.,dist)*(.3+rnd.x*.5)*uHov;
        gl_Position=projectionMatrix*mv;
        gl_PointSize=(1.4+rnd.x*2.6)*uPx*(9./-mv.z);
        vMix=rnd.y;vA=.55+.45*sin(uT*2.+rnd.z*30.);
      }`,
    fragmentShader:`
      uniform vec3 uA,uB,uC;varying float vMix;varying float vA;
      void main(){
        float d=length(gl_PointCoord-.5);if(d>.5)discard;
        vec3 c=vMix<.62?uA:(vMix<.82?uC:uB);
        gl_FragColor=vec4(c,smoothstep(.5,.1,d)*vA*.9);
      }`});
  const pts=new THREE.Points(geo,mat);group.add(pts);

  // thin orbit rings for depth
  const ringMat=new THREE.LineBasicMaterial({color:0xff5a1f,transparent:true,opacity:.25});
  [2.7,3.2].forEach((r,i)=>{const g=new THREE.BufferGeometry().setFromPoints(new THREE.EllipseCurve(0,0,r,r).getPoints(160).map(v=>new THREE.Vector3(v.x,v.y,0)));
    const l=new THREE.LineLoop(g,ringMat);l.rotation.x=Math.PI/2.3+i*.35;l.rotation.y=i*.6;group.add(l)});

  function size(){
    const w=hero.clientWidth,h=hero.clientHeight;renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();
    // sit on the right on wide screens, behind the headline on narrow ones
    group.position.x=w>1000?2.6*Math.min(1.4,cam.aspect/1.6):0;group.position.y=w>1000?.1:.4;
    group.scale.setScalar(w>1000?1:.85);
  }
  size();addEventListener('resize',size);

  let mx=0,my=0,rx=0,ry=0;
  let hover=0;
  addEventListener('pointermove',e=>{mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5;hover=matchMedia('(pointer:fine)').matches?1:0},{passive:true});

  // 0-1 weights for sphere / knot / helix / fingerprint: hold each shape, then ease to the next
  const HOLD=3.2,MOVE=1.8,CYCLE=(HOLD+MOVE)*4;
  function weights(t){
    const k=t%CYCLE,idx=Math.floor(k/(HOLD+MOVE)),f=Math.max(0,(k-idx*(HOLD+MOVE)-HOLD)/MOVE),e=f<.5?4*f*f*f:1-Math.pow(-2*f+2,3)/2;
    const w=[0,0,0,0];w[idx]=1-e;w[(idx+1)%4]=e;return w}

  // where the object sits on screen, so the swarm can move around it
  const pv=new THREE.Vector3(),VIEW_H=2*Math.tan(20*Math.PI/180)*9;
  window.heroCore=()=>{const b=cv.getBoundingClientRect();pv.copy(group.position).project(cam);
    return{x:b.left+(pv.x+1)/2*b.width,y:b.top+(1-pv.y)/2*b.height,r:2.7*group.scale.x*b.height/VIEW_H,n:N}};
  let bootAt=0;window.heroCore.assemble=()=>{bootAt=performance.now()};

  let vis=true,raf=0;const t0=performance.now();
  function frame(now){
    const t=(now-t0)/1000,w=weights(t);U.uT.value=t;U.uW.value.set(w[0],w[1],w[2],w[3]);
    if(!bootAt&&document.documentElement.classList.contains('ready'))bootAt=now;
    // the object pulls together from a cloud as the site opens, and scatters again on scroll
    const bp=bootAt?Math.min(1,(now-bootAt)/2600):0,boot=Math.pow(1-bp,3);
    const sp=Math.min(1,scrollY/(hero.offsetHeight*.9));U.uScatter.value=Math.max(sp*sp,boot);
    U.uHov.value+=(hover-U.uHov.value)*.06;U.uM.value.set(mx*VIEW_H*cam.aspect,-my*VIEW_H);
    rx+=(my*.5-rx)*.05;ry+=(mx*.8-ry)*.05;
    // turns to face the viewer while it is a fingerprint, so it never reads edge-on
    const spin=t*.12+boot*2.4,face=Math.round(spin/Math.PI)*Math.PI;
    group.rotation.y=spin+(face-spin)*w[3]+ry;group.rotation.x=rx+Math.sin(t*.3)*.1*(1-w[3]);
    renderer.render(scene,cam);
    raf=vis?requestAnimationFrame(frame):0}
  if(RM){renderer.render(scene,cam);return}
  new IntersectionObserver(e=>{vis=e[0].isIntersecting;if(vis&&!raf)raf=requestAnimationFrame(frame)}).observe(hero);
  document.addEventListener('visibilitychange',()=>{vis=!document.hidden;if(vis&&!raf)raf=requestAnimationFrame(frame)});
  raf=requestAnimationFrame(frame);
})();
