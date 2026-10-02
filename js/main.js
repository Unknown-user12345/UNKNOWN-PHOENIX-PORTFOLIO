// Links: fill in LinkedIn and TryHackMe to show those buttons. Empty ones stay hidden.
const CONFIG={github:'https://github.com/Unknown-user12345',linkedin:'',tryhackme:'',email:'avayachand2@gmail.com'};

const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
const root=document.documentElement;
const hasGS=!!(window.gsap&&window.ScrollTrigger);
if(hasGS){gsap.registerPlugin(ScrollTrigger);root.classList.add('gs')}

/* external links */
$$('[data-link]').forEach(a=>{const u=CONFIG[a.dataset.link];if(u)a.href=u;else a.hidden=true});

/* smooth scroll + section wipe */
let lenis=null;
if(window.Lenis&&!RM){
  lenis=new Lenis({lerp:.11,wheelMultiplier:.9});
  if(hasGS){lenis.on('scroll',ScrollTrigger.update);gsap.ticker.add(t=>lenis.raf(t*1000));gsap.ticker.lagSmoothing(0)}
  else{(function r(t){lenis.raf(t);requestAnimationFrame(r)})(0)}
  const mq=$('.marq');
  lenis.on('scroll',e=>mq.style.setProperty('--sk',Math.max(-10,Math.min(10,-e.velocity*.5))+'deg'));
}
const wipe=$('#wipe');
$$('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
  const id=a.getAttribute('href'),t=$(id);if(!t)return;e.preventDefault();
  const jump=()=>lenis?lenis.scrollTo(t,{offset:-10,immediate:true}):t.scrollIntoView();
  if(RM||!wipe)return jump();
  wipe.dataset.t=id=='#top'?'Home':id.slice(1);wipe.className='in';
  setTimeout(()=>{jump();wipe.className='out'},820);
  setTimeout(()=>wipe.className='',1900)}));

/* preloader, then hero lines */
const pc=$('#pc'),pre=$('#pre');
function reveal(el,d){setTimeout(()=>el.classList.add('in'),d)}
function start(){
  root.classList.add('ready');pre.classList.add('go');
  $$('.hero .line').forEach((l,i)=>reveal(l,500+i*130));
  setTimeout(()=>pre.remove(),1300);
  ring.classList.add('on');
}
let n=0;const D=RM?0:1300,t0=performance.now();
(function tick(t){
  n=Math.min(100,Math.round((t-t0)/D*100));pc.textContent=n;
  n<100?requestAnimationFrame(tick):setTimeout(start,220)
})(t0);
setTimeout(()=>{if(pre.isConnected&&!root.classList.contains('ready'))start()},4000);

/* headings reveal on scroll */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.6});
$$('.line').filter(l=>!l.closest('.hero')).forEach(l=>io.observe(l));

/* header, clock, back-to-top ring, active nav */
const hd=$('.hd'),up=$('#up'),upc=$('#upc');
function onScroll(){
  const y=scrollY,max=document.documentElement.scrollHeight-innerHeight;
  hd.classList.toggle('s',y>30);up.classList.toggle('s',y>600);
  upc.style.strokeDashoffset=126*(1-y/max)}
addEventListener('scroll',onScroll,{passive:true});onScroll();
up.onclick=()=>lenis?lenis.scrollTo(0):scrollTo({top:0,behavior:'smooth'});
const navs=$$('nav a');
$$('main section[id]').forEach(s=>new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting)navs.forEach(a=>a.classList.toggle('on',a.getAttribute('href')=='#'+s.id))}),{rootMargin:'-45% 0px -50% 0px'}).observe(s));
const clock=$('#clock');
const tickClock=()=>clock.textContent=new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'Asia/Kathmandu'}).format(new Date())+' NPT';
tickClock();setInterval(tickClock,1000);

/* nav text scramble on hover */
const G='abcdefghijklmnopqrstuvwxyz#%&*';
navs.forEach(a=>{const txt=a.textContent;let k;
  a.addEventListener('pointerenter',()=>{if(RM)return;clearInterval(k);let f=0;
    k=setInterval(()=>{a.textContent=txt.split('').map((c,i)=>i<f?c:G[Math.random()*G.length|0]).join('');if(++f>txt.length){clearInterval(k);a.textContent=txt}},38)})});

/* cursor ring */
const ring=$('#ring');
if(matchMedia('(pointer:fine)').matches&&!RM){
  let x=0,y=0,tx=0,ty=0;
  addEventListener('pointermove',e=>{tx=e.clientX;ty=e.clientY});
  (function f(){x+=(tx-x)*.18;y+=(ty-y)*.18;ring.style.transform=`translate(${x}px,${y}px)`;requestAnimationFrame(f)})();
  document.addEventListener('pointerover',e=>ring.classList.toggle('big',!!e.target.closest('a,button,[data-tilt],input')))
}else ring.remove();

/* magnetic buttons */
if(!RM)$$('[data-mag]').forEach(el=>{
  el.addEventListener('pointermove',e=>{const b=el.getBoundingClientRect();
    el.style.transform=`translate(${(e.clientX-b.left-b.width/2)*.25}px,${(e.clientY-b.top-b.height/2)*.35}px)`});
  el.addEventListener('pointerleave',()=>el.style.transform='')});

/* tilt cards */
if(!RM)$$('[data-tilt]').forEach(el=>{
  el.addEventListener('pointermove',e=>{const b=el.getBoundingClientRect(),px=(e.clientX-b.left)/b.width,py=(e.clientY-b.top)/b.height;
    el.style.transform=`perspective(900px) rotateY(${(px-.5)*7}deg) rotateX(${(.5-py)*7}deg) translateZ(0)`;
    el.style.setProperty('--gx',px*100+'%');el.style.setProperty('--gy',py*100+'%')});
  el.addEventListener('pointerleave',()=>el.style.transform='')});

/* count-up stats */
const sfx={rd:'rd',th:'th','+':'+'};
$$('[data-n]').forEach(el=>new IntersectionObserver((es,o)=>es.forEach(e=>{
  if(!e.isIntersecting)return;o.disconnect();
  const n=+el.dataset.n,s=el.dataset.s,t0=performance.now(),D=RM?1:1400;
  (function f(t){const p=Math.min((t-t0)/D,1),v=Math.round(n*(1-Math.pow(1-p,4)));
    el.innerHTML=v+(s?`<small>${sfx[s]}</small>`:'');if(p<1)requestAnimationFrame(f)})(t0)}),{threshold:.6}).observe(el));

/* copy email */
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('s');clearTimeout(toast.k);toast.k=setTimeout(()=>t.classList.remove('s'),1800)};
$('#em').onclick=()=>navigator.clipboard?.writeText(CONFIG.email).then(()=>toast('Email copied'),()=>toast('Copy failed. Select the address instead.'));

/* scroll-driven animations (need GSAP) */
if(hasGS&&!RM){
  // hero drifts away as you scroll
  gsap.to('.hero-in',{yPercent:-14,opacity:0,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom 25%',scrub:true}});
  gsap.to('.hero .bg',{yPercent:18,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});

  // about: words light up
  const p=$('#scrub');
  p.innerHTML=p.textContent.trim().split(/\s+/).map(w=>`<span class="w">${w}</span>`).join(' ');
  gsap.to('#scrub .w',{opacity:1,stagger:.1,ease:'none',scrollTrigger:{trigger:p,start:'top 80%',end:'bottom 55%',scrub:true}});

  // work: pinned horizontal scroll with progress + card focus
  ScrollTrigger.matchMedia({'(min-width:901px)':()=>{
    const tr=$('#track'),pin=$('.pin'),cards=$$('.pj',tr);root.classList.add('pinned');
    const pg=document.createElement('div');pg.className='wprog';
    pg.innerHTML='<b>01</b><span><i></i></span><b>0'+cards.length+'</b>';pin.appendChild(pg);
    const num=$('b',pg),bar=$('i',pg);
    const dist=()=>tr.scrollWidth-innerWidth+60;
    const tw=gsap.to(tr,{x:()=>-dist(),ease:'none',scrollTrigger:{trigger:pin,start:'top top',end:()=>'+='+dist(),pin:true,scrub:true,invalidateOnRefresh:true,anticipatePin:1,
      onUpdate:s=>{bar.style.transform=`scaleX(${s.progress})`;num.textContent='0'+Math.min(cards.length,1+Math.floor(s.progress*cards.length))}}});
    cards.forEach(c=>gsap.fromTo(c,{opacity:.25},{opacity:1,ease:'none',scrollTrigger:{trigger:c,containerAnimation:tw,start:'left 95%',end:'left 60%',scrub:true}}));
    return()=>{root.classList.remove('pinned');pg.remove()}}});

  // journey: line draws, dots light up, items slide in
  gsap.fromTo('#tl',{'--p':0},{'--p':1,ease:'none',scrollTrigger:{trigger:'#tl',start:'top 65%',end:'bottom 60%',scrub:true}});
  $$('#tl li').forEach(li=>gsap.from(li,{opacity:0,x:-30,duration:.8,ease:'power3.out',
    scrollTrigger:{trigger:li,start:'top 85%',toggleActions:'play none none reverse',onEnter:()=>li.classList.add('on'),onLeaveBack:()=>li.classList.remove('on')}}));

  // results: staggered rise
  ScrollTrigger.batch('.nums>div,.rows li,.tk>div',{start:'top 92%',once:true,
    onEnter:b=>gsap.from(b,{y:34,opacity:0,stagger:.07,duration:.9,ease:'power3.out',overwrite:true})});
}
/* section-to-section transitions */
if(hasGS&&!RM){
  const NAMES={about:'About',work:'Work',journey:'Journey',results:'Results',terminal:'Terminal',contact:'Contact'};
  const ids=Object.keys(NAMES);
  const bar=document.createElement('div');bar.id='sweep';document.body.appendChild(bar);
  const tt=document.createElement('div');tt.id='tt';tt.setAttribute('aria-hidden','true');document.body.appendChild(tt);
  const hud=document.createElement('div');hud.id='hud';hud.setAttribute('aria-hidden','true');hud.innerHTML='<b></b><span></span>';document.body.appendChild(hud);
  const hb=hud.firstChild,hs=hud.lastChild;

  function change(id){
    if(wipe&&wipe.className)return;
    hb.textContent='0'+(ids.indexOf(id)+1);hs.textContent=NAMES[id];
    gsap.set(hud,{autoAlpha:1});
    gsap.fromTo(hud.children,{yPercent:110,opacity:0},{yPercent:0,opacity:1,stagger:.1,duration:1,ease:'power3.out',overwrite:true});
    gsap.timeline()
      .fromTo(bar,{scaleX:0,opacity:1,transformOrigin:'0 50%'},{scaleX:1,duration:1.4,ease:'power2.out'})
      .to(bar,{opacity:0,duration:.9});
    tt.textContent=NAMES[id];
    gsap.killTweensOf(tt);
    gsap.timeline()
      .set(tt,{x:innerWidth,opacity:0})
      .to(tt,{x:()=>-tt.offsetWidth-40,duration:3.2,ease:'power1.inOut'},0)
      .to(tt,{opacity:.4,duration:.9},0)
      .to(tt,{opacity:0,duration:1},2.2);
  }
  
  ids.forEach(id=>ScrollTrigger.create({trigger:'#'+id,start:'top 50%',onEnter:()=>change(id),onEnterBack:()=>change(id)}));
  ScrollTrigger.create({trigger:'.hero',start:'bottom 50%',onEnterBack:()=>gsap.to(hud,{autoAlpha:0,duration:.3})});

  ['about','journey','results','terminal','contact'].forEach(id=>{
    const s=$('#'+id),w=$('.wrap',s);
    gsap.fromTo(w,{clipPath:'inset(16% 7% 0% 7% round 36px)',y:70},
      {clipPath:'inset(-5% -5% -5% -5% round 0px)',y:0,ease:'none',
       scrollTrigger:{trigger:s,start:'top 100%',end:'top 10%',scrub:1.4}});
  });
}
/* generative visuals */
(function(){
  const R=(a,b)=>a+Math.random()*(b-a);
  const V=[
    ()=>{let s='';for(let r=0;r<4;r++)for(let c=0;c<30;c++){const h=Math.random()<.09;
      s+=`<rect class="${h?'a':'d'}" x="${c*11}" y="${r*15}" width="9" height="12" rx="2">${h?`<animate attributeName="opacity" values="1;.2;1" dur="${R(1.5,3.5).toFixed(1)}s" repeatCount="indefinite"/>`:''}</rect>`}return s},
    ()=>[0,1,2,3,4].map(i=>{const x=R(0,120)|0,w=R(60,190)|0;
      return `<rect class="${i==3?'a':'d'}" x="${x}" y="${i*12+2}" width="0" height="7" rx="3.5"><animate attributeName="width" values="0;${w};${w};0" keyTimes="0;.4;.8;1" dur="3.6s" begin="${i*.4}s" repeatCount="indefinite"/></rect>`}).join(''),
    ()=>{let d='M0 30';for(let x=10;x<=330;x+=10)d+=`L${x} ${(30+Math.sin(x/18)*R(6,22)).toFixed(1)}`;
      return `<path class="sd" d="${d}" stroke-width="1"/><path class="sa" d="${d}" stroke-width="1.8" stroke-dasharray="520" stroke-dashoffset="520"><animate attributeName="stroke-dashoffset" values="520;0;0;-520" keyTimes="0;.5;.8;1" dur="4s" repeatCount="indefinite"/></path>`},
    ()=>['$ nc -lvnp 4444','listening on 0.0.0.0','connect from 10.0.0.7'].map((t,i)=>
      `<text class="${i==2?'ac':''}" x="2" y="${16+i*18}" opacity="0"><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;${(.02+i*.2).toFixed(2)};${(.07+i*.2).toFixed(2)};.9;1" dur="6s" repeatCount="indefinite"/>${t}</text>`).join(''),
    ()=>{const N=[[165,8],[60,30],[165,30],[270,30]],L=[[20,54,1],[100,54,1],[135,54,2],[195,54,2],[250,54,3],[300,54,3]];let s='';
      L.forEach(([x,y,p])=>s+=`<path class="sd" d="M${N[p][0]} ${N[p][1]}L${x} ${y}"/>`);
      [1,2,3].forEach(p=>s+=`<path class="sd" d="M165 8L${N[p][0]} ${N[p][1]}"/>`);
      N.concat(L).forEach(([x,y])=>s+=`<circle class="d" cx="${x}" cy="${y}" r="3"/>`);
      return s+`<circle class="a" r="3"><animateMotion dur="3s" repeatCount="indefinite" path="M165 8L60 30L20 54L60 30L165 8L270 30L300 54"/></circle>`},
    ()=>{const B=[[50,12],[50,50],[280,12],[280,50]];let s='';
      B.forEach(([x,y],i)=>s+=`<path class="sd" d="M165 30L${x} ${y}"/><circle class="d" cx="${x}" cy="${y}" r="4"/><circle class="a" r="2.2"><animateMotion dur="2.4s" begin="${i*.6}s" repeatCount="indefinite" path="M165 30L${x} ${y}"/></circle>`);
      return s+`<circle class="a" cx="165" cy="30" r="6"/><circle class="sa" cx="165" cy="30" r="6"><animate attributeName="r" values="6;18" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values=".7;0" dur="2s" repeatCount="indefinite"/></circle>`}
  ];
  $$('.pj').forEach((c,i)=>{if(!V[i])return;const d=document.createElement('div');d.className='viz';d.setAttribute('aria-hidden','true');
    d.innerHTML=`<svg viewBox="0 0 330 60" preserveAspectRatio="xMidYMid meet">${V[i]()}</svg>`;c.insertBefore(d,$('h3',c))});

  const ab=$('.about');
  if(ab){const f=document.createElement('div');f.className='fp';f.setAttribute('aria-hidden','true');let s='';
    for(let i=1;i<=16;i++){const r=i*9,L=2*Math.PI*r,d=(L*R(.15,.5))|0,g=(L*R(.05,.15))|0;
      s+=`<ellipse class="sa" cx="150" cy="150" rx="${r}" ry="${(r*1.18).toFixed(1)}" stroke-width="1.2" stroke-dasharray="${d} ${g} ${d>>1} ${g}"><animateTransform attributeName="transform" type="rotate" from="0 150 150" to="${i%2?360:-360} 150 150" dur="${40+i*4}s" repeatCount="indefinite"/></ellipse>`}
    f.innerHTML=`<svg viewBox="0 0 300 300">${s}<rect class="scanl" x="0" y="0" width="300" height="2"><animate attributeName="y" values="0;298;0" dur="5s" repeatCount="indefinite"/></rect></svg>`;
    ab.appendChild(f)}
})();
