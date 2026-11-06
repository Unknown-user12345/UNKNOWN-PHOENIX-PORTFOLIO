// The swarm: labelled tool cursors that inspect the real page. Everything is drawn on one
// canvas above the site, so the existing animations keep running underneath it untouched.
// Opening run (on load and whenever you come back to the top), then small missions per section.
// Everything replays: typed text and heading decodes reset once off screen. window.Swarm = terminal hooks.
(function(){
  if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const root=document.documentElement,hero=$('.hero');
  const fine=matchMedia('(pointer:fine)').matches,small=innerWidth<900||!fine,CAP=small?4:8;
  const TOOLS=['Volatility','Wireshark','Burp Suite','Nmap','ExifTool','Binwalk','Steghide','ffuf','Gobuster','Hydra','Metasploit','Python','Docker','Arch Linux'];
  const TONE={or:['#ff5a1f','#101114'],am:['#ffb020','#101114'],ink:['#101114','#efece5'],pa:['#efece5','#101114']};
  const CYCLE=['or','ink','am','or','pa','ink','am','or'];
  const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),rand=(a,b)=>a+Math.random()*(b-a);
  const io=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,out=t=>1-Math.pow(1-t,4),lin=t=>t;
  const wait=s=>new Promise(r=>setTimeout(r,s*1000));

  const cv=document.createElement('canvas');cv.id='swarm';cv.setAttribute('aria-hidden','true');document.body.appendChild(cv);
  const ctx=cv.getContext('2d');
  let W=0,H=0,dpr=1,heroH=1;
  function size(){W=innerWidth;H=innerHeight;dpr=Math.min(devicePixelRatio||1,2);cv.width=W*dpr;cv.height=H*dpr;heroH=hero?hero.offsetHeight:1}
  size();addEventListener('resize',size);

  let now=performance.now(),dirty=false,px=-999,py=-999;
  const agents=[],frames=[],links=[],rets=[],rings=[],tweens=[],overlays=[],ticks=new Set();
  addEventListener('pointermove',e=>{px=e.clientX;py=e.clientY},{passive:true});
  addEventListener('pointerdown',e=>{if(!fine)return;agents.forEach(a=>{const dx=a.x-e.clientX,dy=a.y-e.clientY,d=Math.hypot(dx,dy)||1;
    if(d<300){const f=(300-d)*.09;a.vx+=dx/d*f;a.vy+=dy/d*f}})},{passive:true});

  function tw(o,to,d,ease=io){return new Promise(r=>{const from={};for(const k in to)from[k]=o[k];tweens.push({o,from,to,t0:now,d:d*1000,ease,r})})}

  /* ---------- cursors ---------- */
  let nextTool=0;
  const ARROW=new Path2D('M0 0L0 15.6L4.3 11.7L7 18L9.7 16.9L7 10.7L12.5 10.4Z');
  function edge(){const s=Math.random()*4|0;return s==0?[rand(0,W),-40]:s==1?[W+40,rand(0,H)]:s==2?[rand(0,W),H+40]:[-40,rand(0,H)]}
  function agent(){
    const [x,y]=edge(),i=nextTool++;
    const a={name:TOOLS[i%TOOLS.length],tone:CYCLE[i%CYCLE.length],depth:i%3==2?.82:1,seed:rand(0,99),x,y,bx:x,by:y,ox:0,oy:0,vx:0,vy:0,
      alpha:1,w:0,path:null,at:null,follow:0,trail:[],dip:1,gone:false,
      go(to,d=.7,bend){return new Promise(r=>{a.path={fx:a.bx,fy:a.by,to,t0:now,d:d*1000,bend:bend===undefined?rand(-.28,.28):bend,r};a.at=null})},
      press(){a.dip=.78;rings.push({x:a.x,y:a.y,r:2,a:.55,max:16,tone:a.tone})},
      exit(d=.8){if(a.gone)return;a.gone=true;let dx=a.bx<W/2?-60:W+60,dy=a.by;if(Math.random()<.4){dx=a.bx;dy=a.by<H/2?-60:H+60}
        a.go(()=>({x:dx,y:dy}),d,rand(-.2,.2)).then(()=>{const k=agents.indexOf(a);if(k>=0)agents.splice(k,1)})}};
    agents.push(a);return a}
  const take=n=>{const got=[];for(let i=0;i<n&&agents.filter(a=>!a.gone).length<CAP;i++)got.push(agent());return got};

  function stepAgent(a){
    if(a.path){const P=a.path,p=clamp((now-P.t0)/P.d),e=io(p),T=P.to();
      const mx=(P.fx+T.x)/2,my=(P.fy+T.y)/2,cx=mx-(T.y-P.fy)*P.bend,cy=my+(T.x-P.fx)*P.bend,u=1-e;
      a.bx=u*u*P.fx+2*u*e*cx+e*e*T.x;a.by=u*u*P.fy+2*u*e*cy+e*e*T.y;
      a.w+=(0-a.w)*.2;
      if(p>=1){a.at=P.to;a.path=null;P.r()}}
    else if(a.at){const T=a.at(),k=a.follow||1;a.bx+=(T.x-a.bx)*k;a.by+=(T.y-a.by)*k;a.w+=(1-a.w)*.05}
    // pointer pushes cursors aside, a spring brings them back
    if(fine){const dx=a.bx+a.ox-px,dy=a.by+a.oy-py,d=Math.hypot(dx,dy);
      if(d<120&&d>0){const f=(120-d)*.012;a.vx+=dx/d*f;a.vy+=dy/d*f}}
    a.vx=(a.vx-a.ox*.045)*.86;a.vy=(a.vy-a.oy*.045)*.86;a.ox+=a.vx;a.oy+=a.vy;
    a.x=a.bx+a.ox+Math.sin(now*.0013+a.seed)*2.6*a.w;a.y=a.by+a.oy+Math.cos(now*.0011+a.seed*2)*2.6*a.w;
    a.dip+=(1-a.dip)*.14;
    const last=a.trail[a.trail.length-1];
    if(!last||Math.hypot(last[0]-a.x,last[1]-a.y)>6){a.trail.push([a.x,a.y]);if(a.trail.length>16)a.trail.shift()}
    else if(a.trail.length)a.trail.shift();
  }
  function drawAgent(a){
    const c=TONE[a.tone];
    if(a.trail.length>2){ctx.lineWidth=1;ctx.strokeStyle=c[0]=='#101114'?'#ff5a1f':c[0];
      for(let i=1;i<a.trail.length;i++){ctx.globalAlpha=(i/a.trail.length)*.32*a.depth;ctx.beginPath();ctx.moveTo(a.trail[i-1][0],a.trail[i-1][1]);ctx.lineTo(a.trail[i][0],a.trail[i][1]);ctx.stroke()}}
    ctx.save();ctx.translate(a.x,a.y);const s=a.depth*a.dip;ctx.scale(s,s);ctx.globalAlpha=a.alpha*(a.depth<1?.72:1);
    ctx.fillStyle=c[0];ctx.fill(ARROW);ctx.lineWidth=1;ctx.strokeStyle=c[0]=='#efece5'?'#101114':'#fff';ctx.stroke(ARROW);ctx.restore();
    tag(a.x+11*a.depth,a.y+17*a.depth,a.label||a.name,a.tone,a.alpha*(a.depth<1?.72:1),a.depth<1?9.5:10.5);
  }

  /* ---------- text ---------- */
  const widths=new Map();
  function tag(x,y,t,tone,alpha=1,sz=10.5){
    const c=TONE[tone],key=sz+t;ctx.font=`500 ${sz}px "Geist Mono",monospace`;
    let w=widths.get(key);if(w===undefined){w=ctx.measureText(t).width;widths.set(key,w)}
    const bw=w+12,bh=sz+7;
    if(x+bw>W-4)x=W-4-bw;if(y<4)y=4;
    ctx.globalAlpha=alpha;ctx.fillStyle=c[0];ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,bw,bh,3):ctx.rect(x,y,bw,bh);ctx.fill();
    if(tone=='pa'){ctx.lineWidth=1;ctx.strokeStyle='rgba(16,17,20,.35)';ctx.stroke()}
    ctx.fillStyle=c[1];ctx.textBaseline='middle';ctx.textAlign='left';ctx.fillText(t,x+6,y+bh/2+.5);
  }
  function mono(x,y,t,color,alpha,align='right',sz=9.5){ctx.font=`400 ${sz}px "Geist Mono",monospace`;ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='top';ctx.fillText(t,x,y)}

  /* ---------- annotations ---------- */
  // rect is a function so a box stays glued to its element through scrolling, tilt and parallax
  function frame(rect,o={}){const f=Object.assign({rect,p:0,alpha:1,hov:1,tone:'or',dim:true,handles:true,guides:false,hero:false,drag:false,scan:-1},o);frames.push(f);return f}
  const drop=f=>tw(f,{alpha:0},.4).then(()=>{f.dead=true});
  function walk(x,y,w,h,L){
    const P=[[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]];ctx.beginPath();ctx.moveTo(x,y);
    for(let i=1;i<5&&L>0;i++){const a=P[i-1],b=P[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]),t=Math.min(1,L/d);ctx.lineTo(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t);L-=d}
    ctx.stroke()}
  function drawFrame(f){
    const r=f.rect();if(!r||r.w<1||r.y>H+40||r.y+r.h<-40||r.x>W+40||r.x+r.w<-40)return;
    const over=fine&&!f.drag&&px>r.x-6&&px<r.x+r.w+6&&py>r.y-6&&py<r.y+r.h+6;
    f.hov+=((over?.22:1)-f.hov)*.12;
    const A=f.alpha*f.hov*(f.hero?heroFade():1);if(A<.01)return;
    const c=TONE[f.tone][0],x=r.x-4,y=r.y-4,w=r.w+8,h=r.h+8;
    const e=f.drag?f.p:1,dw=w*e,dh=h*e;
    if(f.guides){ctx.strokeStyle=c;ctx.lineWidth=1;ctx.globalAlpha=A*.26;ctx.setLineDash([2,5]);ctx.beginPath();
      const g=clamp(f.p);ctx.moveTo(x-x*g,y+.5);ctx.lineTo(x+(W-x)*g,y+.5);ctx.moveTo(x+.5,y-y*g);ctx.lineTo(x+.5,y+(H-y)*g);ctx.stroke();ctx.setLineDash([])}
    ctx.strokeStyle=c;ctx.lineWidth=1;ctx.globalAlpha=A*(f.soft||1);
    if(f.drag)ctx.strokeRect(x+.5,y+.5,dw,dh);else walk(x+.5,y+.5,w,h,f.p*2*(w+h));
    if(f.drag){ctx.globalAlpha=A*.07;ctx.fillStyle=c;ctx.fillRect(x,y,dw,dh)}
    const done=clamp((f.p-.86)/.14);if(done<=0)return;
    if(f.handles){ctx.globalAlpha=A*done;for(const [hx,hy] of [[x,y],[x+w,y],[x,y+h],[x+w,y+h]]){ctx.fillStyle='#efece5';ctx.fillRect(hx-2,hy-2,5,5);ctx.strokeStyle=c;ctx.strokeRect(hx-1.5,hy-1.5,4,4)}}
    if(f.tag){if(f.side)tag(x+w+9,y+h/2-9,f.tag,f.tone,A*done);else tag(x,y-20,f.tag,f.tone,A*done)}
    if(f.dim)mono(x+w,y+h+6,`${Math.round(r.w)} x ${Math.round(r.h)}`,c,A*done*.85);
    if(f.note)mono(x,y+h+6,f.note,c,A*done*.85,'left');
  }
  function link(a,b,o={}){const l=Object.assign({a,b,p:0,alpha:1,tone:'or',hero:true,seed:rand(0,1)},o);links.push(l);return l}
  function drawLink(l){
    const A=l.alpha*(l.hero?heroFade():1);if(A<.01)return;const s=l.a(),t=l.b();if(!s||!t)return;
    const mx=s.x+(t.x-s.x)/2,P=[[s.x,s.y],[mx,s.y],[mx,t.y],[t.x,t.y]],seg=i=>Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]);
    const total=seg(1)+seg(2)+seg(3);
    const at=d=>{for(let i=1;i<4;i++){const n=seg(i);if(d<=n||i==3){const k=n?clamp(d/n):0;return[P[i-1][0]+(P[i][0]-P[i-1][0])*k,P[i-1][1]+(P[i][1]-P[i-1][1])*k]}d-=n}};
    const c=TONE[l.tone][0];ctx.strokeStyle=c;ctx.lineWidth=1;ctx.globalAlpha=A*.55;ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(P[0][0],P[0][1]);
    let rem=total*l.p;for(let i=1;i<4&&rem>0;i++){const n=seg(i),k=Math.min(1,rem/(n||1));ctx.lineTo(P[i-1][0]+(P[i][0]-P[i-1][0])*k,P[i-1][1]+(P[i][1]-P[i-1][1])*k);rem-=n}
    ctx.stroke();ctx.setLineDash([]);
    ctx.globalAlpha=A;ctx.fillStyle=c;
    if(l.p>=1)for(let i=0;i<2;i++){const q=at(total*((now*.00042+l.seed+i*.5)%1));ctx.beginPath();ctx.arc(q[0],q[1],2,0,7);ctx.fill()}
    ctx.beginPath();ctx.arc(s.x,s.y,2.2,0,7);ctx.fill();
  }
  function reticle(c,o={}){const r=Object.assign({c,p:0,alpha:1,tone:'or',hero:true},o);rets.push(r);return r}
  function drawRet(r){
    const q=r.c();if(!q)return;const A=r.alpha*(r.hero?heroFade():1);if(A<.01)return;const col=TONE[r.tone][0],R=q.r*(1.25-.25*r.p);
    ctx.strokeStyle=col;ctx.lineWidth=1;ctx.globalAlpha=A*.8;const sp=now*.00035;
    for(let i=0;i<3;i++){const s=sp+i*2.094;ctx.beginPath();ctx.arc(q.x,q.y,R,s,s+1.45*r.p);ctx.stroke()}
    ctx.globalAlpha=A*.4;ctx.setLineDash([2,6]);ctx.beginPath();ctx.arc(q.x,q.y,R*.82,-sp*1.6,-sp*1.6+6.283*r.p);ctx.stroke();ctx.setLineDash([]);
    ctx.globalAlpha=A*.8;ctx.beginPath();for(let i=0;i<4;i++){const s=i*1.5708,a=R+6,b=R+6+10*r.p;ctx.moveTo(q.x+Math.cos(s)*a,q.y+Math.sin(s)*a);ctx.lineTo(q.x+Math.cos(s)*b,q.y+Math.sin(s)*b)}ctx.stroke();
    if(r.p>.8&&r.text)tag(q.x+R*.72,q.y-R*.72-18,r.text,r.tone,A*clamp((r.p-.8)/.2));
  }
  const heroFade=()=>1-clamp(scrollY/(heroH*.42));

  /* ---------- frame loop, on the same clock as GSAP when it is there ---------- */
  function tick(){
    now=performance.now();
    for(const fn of ticks)fn();
    if(!(agents.length||frames.length||links.length||rets.length||rings.length||tweens.length||overlays.length)){
      if(dirty){ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height);dirty=false}return}
    for(let i=tweens.length-1;i>=0;i--){const t=tweens[i],p=clamp((now-t.t0)/t.d),e=t.ease(p);for(const k in t.to)t.o[k]=t.from[k]+(t.to[k]-t.from[k])*e;if(p>=1){tweens.splice(i,1);t.r()}}
    agents.slice().forEach(stepAgent);
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);dirty=true;
    for(const L of [frames,links,rets])for(let i=L.length-1;i>=0;i--)if(L[i].dead)L.splice(i,1);
    links.forEach(drawLink);rets.forEach(drawRet);frames.forEach(drawFrame);
    for(let i=rings.length-1;i>=0;i--){const r=rings[i];r.r+=(r.max-r.r)*.12;r.a*=.93;ctx.globalAlpha=r.a;ctx.strokeStyle=TONE[r.tone][0]=='#101114'?'#ff5a1f':TONE[r.tone][0];ctx.lineWidth=1;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,7);ctx.stroke();if(r.a<.02)rings.splice(i,1)}
    agents.forEach(drawAgent);
    for(let i=overlays.length-1;i>=0;i--)if(overlays[i]()===false)overlays.splice(i,1);
    ctx.globalAlpha=1;
  }
  if(window.gsap)gsap.ticker.add(tick);else(function r(){tick();requestAnimationFrame(r)})();

  /* ---------- rect helpers ---------- */
  const R=el=>{if(!el)return null;const b=el.getBoundingClientRect();return{x:b.left,y:b.top,w:b.width,h:b.height}};
  const TL=r=>({x:r.x-4,y:r.y-4}),BR=r=>({x:r.x+r.w+4,y:r.y+r.h+4}),TR=r=>({x:r.x+r.w+4,y:r.y-4});
  function textWidth(span){const d=span.style.display;span.style.display='inline-block';const w=span.offsetWidth;span.style.display=d;return w}
  const union=els=>()=>{let x=1e9,y=1e9,X=-1e9,Y=-1e9;els.forEach(e=>{const b=e.getBoundingClientRect();if(!b.width)return;x=Math.min(x,b.left);y=Math.min(y,b.top);X=Math.max(X,b.right);Y=Math.max(Y,b.bottom)});return X<0?{x:0,y:0,w:0,h:0}:{x,y,w:X-x,h:Y-y}};
  const fnv=s=>{let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)}return(h>>>0).toString(16).padStart(8,'0')};

  // headline widths, measured again once the web fonts arrive so the boxes fit the real text
  const lineEls=$$('.hero h1 .line'),lineW=[];
  const measure=()=>lineEls.forEach((l,i)=>{lineW[i]=textWidth(l.firstElementChild)});
  measure();addEventListener('resize',measure);
  if(document.fonts){document.fonts.ready.then(measure);document.fonts.addEventListener('loadingdone',measure)}

  /* ---------- status pill ---------- */
  const pill=document.createElement('div');pill.id='swp';
  pill.innerHTML='<span class="dots" aria-hidden="true"><i></i><i></i><i></i><i></i></span><b></b><span class="sep" aria-hidden="true"></span><span class="ct"></span><span class="bar" aria-hidden="true"><i></i></span><span class="st"></span><button type="button">Skip</button>';
  document.body.appendChild(pill);
  const pB=$('b',pill),pC=$('.ct',pill),pBar=$('.bar i',pill),pS=$('.st',pill);
  const NODES=document.querySelectorAll('main *').length;
  function pillTick(p){pC.textContent=`${Math.round(NODES*p)}/${NODES} nodes`;pBar.style.transform=`scaleX(${p})`;
    pS.textContent=p<.32?'mapping':p<.68?'analysing':p<1?'sealing':'case opened'}

  /* ---------- opening run ---------- */
  let introOn=false,run=null,pillT0=0;
  const stamp=$('.stamp');
  function pillLoop(){const p=clamp((now-pillT0)/4300);pillTick(p);if(p>=1)ticks.delete(pillLoop)}
  async function intro(){
    introOn=true;sync();const my=run={on:true};
    const crew=take(CAP),live=()=>my.on;
    pB.textContent=crew.length+' tools live';pillT0=now;pillTick(0);ticks.add(pillLoop);pill.classList.add('on');
    const made=[];
    const later=(s,fn)=>wait(s).then(()=>{if(live())return fn()});
    // a tool flies to a corner, presses and drags a selection box over the element
    const select=(a,rect,o,moveD=.7,dragD=.62)=>{if(!a)return;return a.go(()=>TL(rect()),moveD).then(()=>{if(!live())return;a.press();
      const f=frame(rect,Object.assign({drag:true,hero:true},o));made.push(f);a.go(()=>BR(rect()),dragD,0);return tw(f,{p:1},dragD).then(()=>{f.drag=false;a.press()})})};
    const lines=lineEls.map((l,i)=>()=>{const r=R(l);return{x:r.x,y:r.y,w:Math.min(lineW[i],r.w),h:r.h}});
    const tags=['h1.line[0]','h1.line[1]','h1.line[2]'];
    lines.forEach((rect,i)=>later(.42+i*.13,()=>select(crew[i%crew.length],rect,{tag:small&&i?'':tags[i],side:!small,dim:false,tone:i==2?'am':'or',guides:i==0})));

    const caseEl=$('.case'),hasCase=caseEl&&caseEl.offsetWidth>0;
    if(!small){
      later(.95,()=>select(crew[3],()=>R($('.sub')),{tone:'am'}));
      later(1.3,()=>select(crew[4],union($$('.hero .cta .btn')),{tone:'or',note:'click targets: 2'},.6,.5));
    }
    if(hasCase&&crew[5])later(.8,()=>{const a=crew[5],rect=()=>R(caseEl);
      return a.go(()=>TL(rect()),.75).then(()=>{if(!live())return;a.press();const f=frame(rect,{hero:true,tone:'or',tag:'case.AC-2026-02'});made.push(f);
        tw(f,{p:1},1.1,lin);return a.go(()=>TR(rect()),.28,0).then(()=>live()&&a.go(()=>BR(rect()),.34,0))})});
    const core=window.heroCore&&window.heroCore();
    if(core&&!small&&crew[6]){
      const a=crew[6],ret=reticle(()=>window.heroCore(),{text:`points.${core.n}`,tone:'am'});made.push(ret);
      later(1,()=>a.go(()=>{const q=window.heroCore();return{x:q.x-q.r*.72,y:q.y+q.r*.72}},.8).then(()=>{if(live()){a.press();tw(ret,{p:1},.9,out)}}));
      if(crew[7])later(1.5,()=>crew[7].go(()=>{const q=window.heroCore();return{x:q.x+q.r*.8,y:q.y-q.r*.5}},.8));
    }
    // dotted evidence links: headline to case file to 3D object
    if(hasCase&&!small)later(1.9,()=>{
      const l1=link(()=>{const r=lines[1]();return{x:r.x+r.w+92,y:r.y+r.h/2}},()=>{const r=R(caseEl);return{x:r.x-4,y:r.y+r.h*.3}});tw(l1,{p:1},.55);made.push(l1);
      if(core){const l2=link(()=>{const r=R(caseEl);return{x:r.x+r.w*.5,y:r.y-4}},()=>{const q=window.heroCore();return{x:q.x,y:q.y-q.r}},{tone:'am'});tw(l2,{p:1},.6);made.push(l2)}});

    // everyone converges on the stamp as it lands (its CSS delay is timed to this)
    const target=()=>{if(hasCase&&stamp){const r=R(stamp);return{x:r.x+r.w/2,y:r.y+r.h/2}}const e=R($('.hero h1 em'));return{x:e.x+e.w/2,y:e.y+e.h/2}};
    await wait(2.62);if(!live())return;
    crew.forEach((a,i)=>{const ang=i/crew.length*6.283,rad=64+i%3*26;a.go(()=>{const t=target();return{x:t.x+Math.cos(ang)*rad,y:t.y+Math.sin(ang)*rad}},.48-.02*(i%3),rand(-.35,.35))});
    await wait(.56);if(!live())return;
    const t=target();rings.push({x:t.x,y:t.y,r:6,a:.9,max:190,tone:'or'},{x:t.x,y:t.y,r:4,a:.55,max:110,tone:'am'});
    if(window.gsap)gsap.fromTo('.hl',{x:0},{keyframes:[{x:-5,duration:.05},{x:4,duration:.06},{x:-2,duration:.07},{x:0,duration:.1}],overwrite:'auto'});
    crew.forEach(a=>{const d=Math.hypot(a.x-t.x,a.y-t.y)||1,f=rand(4,8);a.vx+=(a.x-t.x)/d*f;a.vy+=(a.y-t.y)/d*f});
    await wait(.24);if(!live())return;
    crew.forEach((a,i)=>setTimeout(()=>a.exit(rand(.8,1.05)),i*40));
    made.forEach((f,i)=>setTimeout(()=>{tw(f,{alpha:0},.4).then(()=>{f.dead=true})},140+i*60));
    await wait(1.05);if(!live())return;
    finish();
  }
  function finish(){
    if(!introOn)return;introOn=false;if(run)run.on=false;
    if(stamp)stamp.style.animationDelay='0s';
    $$('.hero .line').forEach(l=>l.classList.add('in'));
    agents.forEach(a=>a.exit());
    frames.forEach(f=>{if(!f.dead)drop(f)});
    links.concat(rets).forEach(o=>tw(o,{alpha:0},.3).then(()=>{o.dead=true}));
    pill.classList.remove('on');ticks.delete(pillLoop);sync();
  }
  $('button',pill).addEventListener('click',finish);
  addEventListener('keydown',e=>{if(e.key=='Escape')finish()});
  addEventListener('scroll',()=>{if(introOn&&scrollY>heroH*.3)finish()},{passive:true});

  /* ---------- section missions: start in view, clear away when left ---------- */
  const missions=[];
  function mission(el,start,margin='-22% 0px -22% 0px'){
    if(!el)return;const m={inView:false,ctx:null,start};missions.push(m);
    new IntersectionObserver(e=>{m.inView=e[0].isIntersecting;sync()},{rootMargin:margin}).observe(el)}
  function sync(){missions.forEach(m=>{const want=m.inView&&!introOn;if(want&&!m.ctx)open(m);else if(!want&&m.ctx)close(m)})}
  function open(m){
    const c={on:true,fr:[],ag:[],tk:[],take(n){const a=take(n);c.ag.push(...a);return a},frame(r,o){const f=frame(r,o);c.fr.push(f);return f},tick(fn){ticks.add(fn);c.tk.push(fn)},free(a){a.exit();c.ag=c.ag.filter(x=>x!=a)}};
    m.ctx=c;m.start(c)}
  function close(m){const c=m.ctx;m.ctx=null;c.on=false;c.ag.forEach(a=>a.exit());c.fr.forEach(drop);c.tk.forEach(fn=>ticks.delete(fn))}

  // about: one tool reads along with the words as they light up
  const words=$$('#scrub .w');
  if(window.gsap&&words.length)mission($('#scrub'),c=>{
    const [a]=c.take(1);if(!a)return;a.follow=.2;a.label='ExifTool';
    const litIdx=()=>{let l=0,h=words.length-1;while(l<h){const m=(l+h+1)>>1;if(parseFloat(words[m].style.opacity)>=.6)l=m;else h=m-1}return l};
    let cur=0;c.frame(()=>R(words[cur]),{p:1,dim:false,handles:false,tone:'am',soft:.75});
    c.tick(()=>{cur=litIdx()});
    const spot=()=>{const r=R(words[cur]);return{x:r.x+r.w+2,y:r.y+r.h-4}};
    a.go(spot,.8);
    if(!small){const fp=$('.fp');if(fp){const g=c.frame(()=>R(fp),{tone:'or',tag:'latent print',soft:.45});tw(g,{p:1},1.4)}}
  },'-10% 0px -10% 0px');

  // typed text: the paragraph keeps its full size and line breaks from the start, the untyped
  // part is just invisible, so nothing on the page jumps. Screen readers get the whole text at once.
  function typer(p){
    const txt=p.textContent.trim(),INK=3;let n=0,t0=0,step=null,last={x:0,y:0},done,caret,ink,rest;
    const build=()=>{p.innerHTML='<span class="ty-sr"></span><span aria-hidden="true"><span class="ty-done"></span><span class="ty-caret"></span><span class="ty-ink"></span><span class="ty-rest"></span></span>';
      p.firstChild.textContent=txt;[done,caret,ink,rest]=p.lastChild.children};
    const paint=()=>{done.textContent=txt.slice(0,n);ink.textContent=txt.slice(n,n+INK);rest.textContent=txt.slice(n+INK)};
    build();paint();
    // quick and slightly uneven, with a short breath after punctuation
    const at=[];let sum=0;for(let i=0;i<txt.length;i++){sum+=rand(10,18)+('.,:;'.includes(txt[i])?85:0);at.push(sum)}
    const this_={
      get started(){return !!step},get finished(){return n>=txt.length},
      pos(){if(caret.isConnected){const r=R(caret);last={x:r.x+2,y:r.y+r.h-2}}return last},
      start(onDone){if(step)return;t0=now;step=()=>{const e=now-t0;let k=n;while(k<txt.length&&at[k]<=e)k++;if(k==n)return;n=k;
        if(n>=txt.length){ticks.delete(step);this_.pos();p.textContent=txt;if(onDone)onDone()}else paint()};ticks.add(step)},
      reset(){if(!step)return;ticks.delete(step);step=null;n=0;build();paint()}};
    return this_;
  }
  // typed text goes blank again only once it is fully off screen, so nothing visibly disappears
  const whenGone=(el,fn)=>new IntersectionObserver(e=>{if(!e[0].isIntersecting)fn()}).observe(el);

  // work: a tool types each description while the card gets boxed and tagged as an exhibit
  $$('.pj').forEach((card,i)=>{const para=$('p',card),type=para?typer(para):null;if(type)whenGone(card,type.reset);mission(card,c=>{
    const title=$('h3',card).textContent,rect=()=>R(card);
    const f=c.frame(rect,{tone:i%2?'am':'or',tag:`EX-0${i+1}`,note:`fnv1a ${fnv(title)}`});
    tw(f,{p:1},.9,lin);
    const first=type&&!type.started,[a]=c.take(1);
    if(first)type.start(()=>{if(a&&c.on){a.press();setTimeout(()=>{if(c.on)c.free(a)},350)}});
    if(!a)return;
    if(first){a.follow=.42;a.go(()=>type.pos(),.45);return}
    a.go(()=>BR(rect()),.8).then(()=>{if(!c.on)return;a.press();return wait(.5)}).then(()=>{if(c.on)c.free(a)});
  },small?'-30% 0px -30% 0px':'0px -32% 0px -32%')});

  // journey: a tool rides the tip of the line and calls out the year it has reached
  const tl=$('#tl');
  const logTypers=tl&&window.gsap?$$('li',tl).map(li=>{const q=$('p',li);if(!q)return null;const t=typer(q);whenGone(li,t.reset);return t}):[];
  if(tl&&window.gsap)mission(tl,c=>{
    const [a]=c.take(1);if(a){a.follow=.25}
    const items=$$('li',tl),tip=()=>{const r=R(tl),p=parseFloat(tl.style.getPropertyValue('--p'))||0;return{x:r.x+5,y:r.y+6+p*(r.h-12)}};
    let last=-1,box=null;
    if(a)a.go(tip,.7);
    c.tick(()=>{const y=tip().y;let n=0;items.forEach((li,i)=>{if(li.getBoundingClientRect().top<=y+10)n=i});
      for(let i=0;i<=n;i++)if(logTypers[i])logTypers[i].start();
      if(n==last)return;last=n;if(a){a.label=$('time',items[n]).textContent;if(!a.path)a.press()}
      if(box)drop(box);const el=$('div',items[n]);box=c.frame(()=>R(el),{tone:'or',dim:false,tag:`log.${n}`,soft:.7});tw(box,{p:1},.7)});
  },'-15% 0px -15% 0px');

  // results: each number gets selected and logged, one after another
  mission($('.nums'),c=>{
    const cells=$$('.nums>div').slice(0,small?3:5),crew=c.take(small?1:3);if(!crew.length)return;
    (async()=>{for(let i=0;i<cells.length&&c.on;i++){
      const a=crew[i%crew.length],rect=()=>R(cells[i]);
      await a.go(()=>TL(rect()),.48);if(!c.on)return;a.press();
      const f=c.frame(rect,{drag:true,dim:false,tone:i%2?'am':'or',tag:`log.0${i+1}`});a.go(()=>BR(rect()),.34,0);await tw(f,{p:1},.34);f.drag=false;a.press();
    }await wait(.4);if(c.on)crew.forEach(a=>c.free(a))})();
  });

  // terminal: one tool points out the hidden command
  mission($('#term'),c=>{
    const term=$('#term'),btn=$$('.tq button').find(b=>b.textContent=='swarm');
    const f=c.frame(()=>R(term),{tag:'abhaya@portfolio',tone:'or',soft:.7});tw(f,{p:1},1.1);
    const [a]=c.take(1);if(!a||!btn)return;a.label='try this';
    a.go(()=>{const r=R(btn);return{x:r.x+r.w*.55,y:r.y+r.h+3}},1).then(()=>{if(c.on)a.press();return wait(6)}).then(()=>{if(c.on)c.free(a)});
  },'-18% 0px -18% 0px');

  // contact: what is left of the swarm circles the address
  mission($('#em'),c=>{
    const mail=$('#em'),rect=()=>R(mail),f=c.frame(rect,{tag:'case closed',tone:'or',note:'AC-2026-02',dim:false});tw(f,{p:1},1.1);
    c.take(small?2:5).forEach((a,i,all)=>{const off=i/all.length*6.283,to=()=>{const r=rect(),s=now*.00022+off;return{x:r.x+r.w/2+Math.cos(s)*(r.w/2+46),y:r.y+r.h/2+Math.sin(s)*(r.h/2+46)}};
      a.go(to,1+i*.12)});
  },'-5% 0px -5% 0px');

  /* ---------- headings decode as they rise in ---------- */
  const G='abcdef0123456789/#%&';
  function decode(span,txt){
    const k=span.dk=(span.dk||0)+1;span.textContent=txt;span.style.minHeight='';span.style.minHeight=span.offsetHeight+'px';const t0=performance.now();let last=0;
    (function f(t){if(span.dk!=k)return;const p=clamp((t-t0)/950);
      if(t-last>42||p>=1){last=t;const n=Math.floor(out(p)*txt.length);span.textContent=txt.split('').map((c,i)=>i<n||c==' '?c:G[Math.random()*G.length|0]).join('')}
      if(p<1)requestAnimationFrame(f);else{span.textContent=txt;span.style.minHeight=''}})(t0)}
  // main.js takes .in off again when a heading leaves the screen, so this runs on every return
  $$('h2.line').forEach(h=>{const s=h.firstElementChild;if(!s)return;const txt=s.textContent;let was=h.classList.contains('in');
    new MutationObserver(()=>{const on=h.classList.contains('in');if(on==was)return;was=on;
      if(on)decode(s,txt);else{s.dk=(s.dk||0)+1;s.textContent=txt;s.style.minHeight=''}}).observe(h,{attributes:true,attributeFilter:['class']})});

  /* ---------- scroll ruler on the right edge ---------- */
  const rule=document.createElement('div');rule.id='rule';rule.setAttribute('aria-hidden','true');rule.innerHTML='<i><b></b></i>';document.body.appendChild(rule);
  const mark=rule.firstChild,read=mark.firstChild;
  function onRule(){const m=document.documentElement.scrollHeight-innerHeight,p=m>0?clamp(scrollY/m):0;mark.style.transform=`translateY(${p*rule.offsetHeight}px)`;read.textContent=String(Math.round(p*100)).padStart(3,'0')}
  addEventListener('scroll',onRule,{passive:true});onRule();

  /* ---------- start ---------- */
  const play=!location.hash&&scrollY<40;
  if(play)root.classList.add('swarm-intro');
  const begin=()=>{if(play)intro();else sync()};
  if(root.classList.contains('ready'))begin();else document.addEventListener('site:ready',begin,{once:true});

  // the whole opening again: headline, case file, stamp, 3D object and the swarm
  function reopen(){
    $$('.hero .line').forEach(l=>l.classList.remove('in'));
    const cs=$('.case');if(cs){cs.style.animation='none';void cs.offsetWidth;cs.style.animation=''}
    if(stamp){stamp.style.animation='none';void stamp.offsetWidth;stamp.style.animation='st .5s var(--ease) 3.05s forwards'}
    if(window.heroCore)window.heroCore.assemble();
    $$('.hero .line').forEach((l,i)=>setTimeout(()=>l.classList.add('in'),500+i*130));intro()}

  // scrolling away and coming back to the top runs it again
  let armed=false,queued=false;
  addEventListener('scroll',()=>{const y=scrollY;if(y>heroH*.3)armed=true;
    else if(armed&&!introOn&&!queued&&y<heroH*.08){armed=false;reopen()}},{passive:true});

  /* ---------- terminal commands ---------- */
  window.Swarm={
    // same wipe as the nav, then the opening again from the top
    replay(){const logo=$('.logo');finish();queued=true;if(logo)logo.click();
      setTimeout(()=>{queued=false;armed=false;reopen()},900)},
    breach(){
      document.dispatchEvent(new Event('swarm:breach'));
      const term=$('#term'),t0=now,D=2600,bars=[];for(let i=0;i<14;i++)bars.push({y:rand(0,1),h:rand(2,22),s:rand(0,1),o:rand(-40,40)});
      const crew=take(CAP);crew.forEach((a,i)=>{const s=i/crew.length*6.283,to=()=>{const r=R(term);return{x:r.x+r.w/2+Math.cos(s)*(r.w/2+24),y:r.y+r.h/2+Math.sin(s)*(r.h/2+24)}};a.go(to,.5+i*.05);setTimeout(()=>a.exit(),2300+i*40)});
      if(window.gsap)gsap.fromTo(term,{x:0},{keyframes:[{x:-7,duration:.05},{x:6,duration:.06},{x:-4,duration:.06},{x:3,duration:.07},{x:0,duration:.1}],overwrite:'auto'});
      overlays.push(()=>{const p=(now-t0)/D;if(p>=1)return false;
        const heat=p<.55?1:1-(p-.55)/.45,safe=p>.55;
        bars.forEach(b=>{const y=((b.y+now*.00008*b.s)%1)*H;ctx.globalAlpha=.16*heat;ctx.fillStyle=b.s>.5?'#ff5a1f':'#ffb020';ctx.fillRect(b.o,y,W,b.h)});
        const fade=Math.min(1,p*14)*(p>.86?(1-p)/.14:1),fs=Math.min(W*.07,64),by=H-fs-92;
        ctx.globalAlpha=fade*.94;ctx.fillStyle='#101114';ctx.fillRect(0,by,W,fs+70);
        ctx.globalAlpha=fade;ctx.font=`700 ${fs}px "Bricolage Grotesque",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillStyle=safe?'#ffb020':'#ff5a1f';ctx.fillText(safe?'Contained':'Intrusion detected',W/2,by+fs/2+14);
        ctx.font='500 12px "Geist Mono",monospace';ctx.fillStyle='#efece5';ctx.fillText(safe?'simulation, nothing was touched':'simulated event',W/2,by+fs+36)});
    }
  };
})();
