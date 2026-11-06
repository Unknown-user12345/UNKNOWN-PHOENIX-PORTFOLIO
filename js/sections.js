// Set pieces for the sections after Work. Each one adds to what main.js already animates:
// Journey: pinned photo that wipes to the next one per timeline entry (inline photos on phones)
// Results: flashlight evidence panel, photos that follow the cursor over rows, live tile textures
// Terminal: 3D entrance, lit building behind it, simulated packet feed that reacts to `breach`
// Contact: Boudhanath at night with giant type moving on scroll
(function(){
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const RM=matchMedia('(prefers-reduced-motion:reduce)').matches,hasGS=!!(window.gsap&&window.ScrollTrigger);
  const fine=matchMedia('(pointer:fine)').matches,moving=hasGS&&!RM;
  const el=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!==undefined)e.innerHTML=html;return e};
  document.documentElement.classList.add(moving?'moving':'still');

  /* ---------- journey ---------- */
  const tl=$('#tl');
  if(tl){
    const items=$$('li',tl),src=i=>`img/j-${i+1}.jpg`;
    const jr=el('div','jr');tl.parentNode.insertBefore(jr,tl);jr.appendChild(tl);
    // phones and reduced motion: a photo inside each entry
    items.forEach((li,i)=>{const f=el('figure','lph','<img loading="lazy" decoding="async" alt="" width="760" height="760">');$('img',f).src=src(i);$('div',li).appendChild(f)});
    const o=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in')}),{rootMargin:'0px 0px -12% 0px'});
    const o2=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)e.target.classList.remove('in')}));
    $$('.lph').forEach(f=>{o.observe(f);o2.observe(f)});

    if(moving){
      const stage=el('aside','jstage');stage.setAttribute('aria-hidden','true');
      stage.innerHTML=`<div class="js-imgs">${items.map((_,i)=>`<img loading="lazy" decoding="async" alt="" src="${src(i)}">`).join('')}</div><i class="js-bar"></i><div class="js-top"><span>EVIDENCE</span><span class="js-n">01 / 0${items.length}</span></div><b class="js-yr"></b><i class="js-c a"></i><i class="js-c b"></i><i class="js-c c"></i><i class="js-c d"></i>`;
      jr.appendChild(stage);
      const imgs=$$('.js-imgs img',stage),bar=$('.js-bar',stage),yr=$('.js-yr',stage),num=$('.js-n',stage),G='0123456789/#';
      const years=items.map(li=>$('time',li).textContent);
      let cur=0,z=2,sc=0;yr.textContent=years[0];imgs[0].style.zIndex=1;
      function decode(t){clearInterval(sc);let f=0;sc=setInterval(()=>{yr.textContent=t.split('').map((c,i)=>i<f||c==' '?c:G[Math.random()*G.length|0]).join('');if(++f>t.length){clearInterval(sc);yr.textContent=t}},38)}
      function show(i){
        if(i==cur||!imgs[i])return;const down=i>cur,img=imgs[i],old=imgs[cur];cur=i;img.style.zIndex=++z;
        gsap.fromTo(img,{clipPath:down?'inset(100% 0% 0% 0%)':'inset(0% 0% 100% 0%)',scale:1.28},{clipPath:'inset(0% 0% 0% 0%)',scale:1,duration:1.15,ease:'expo.out',overwrite:true});
        gsap.to(old,{scale:1.1,duration:1.15,ease:'expo.out'});
        gsap.fromTo(bar,{top:down?'100%':'0%',opacity:1},{top:down?'0%':'100%',opacity:0,duration:.8,ease:'power3.out',overwrite:true});
        num.textContent=`0${i+1} / 0${items.length}`;decode(years[i])}
      ScrollTrigger.matchMedia({'(min-width:901px)':()=>{
        items.forEach((li,i)=>ScrollTrigger.create({trigger:li,start:'top 58%',onEnter:()=>show(i),onLeaveBack:()=>show(Math.max(0,i-1))}))}});
    }
  }

  /* ---------- results: flashlight panel ---------- */
  const nums=$('.nums'),resPic=innerWidth<=700?'img/res-s.jpg':'img/res.jpg';
  if(nums){
    const panel=el('div','numwrap auto',`<div class="nw-img"><img class="nw-base" src="${resPic}" loading="lazy" decoding="async" alt=""><img class="nw-lit" src="${resPic}" loading="lazy" decoding="async" alt=""></div><p class="nw-tag" aria-hidden="true"><span>EVIDENCE LOCKER</span><span>${fine?'Move your cursor to inspect':'Record so far'}</span></p>`);
    nums.parentNode.insertBefore(panel,nums);panel.appendChild(nums);
    if(fine&&!RM){
      panel.addEventListener('pointermove',e=>{const b=panel.getBoundingClientRect();panel.style.setProperty('--mx',e.clientX-b.left+'px');panel.style.setProperty('--my',e.clientY-b.top+'px')});
      panel.addEventListener('pointerenter',()=>panel.classList.remove('auto'));
      panel.addEventListener('pointerleave',()=>{panel.style.removeProperty('--mx');panel.style.removeProperty('--my');panel.classList.add('auto')});
    }
    if(moving)gsap.fromTo($('.nw-img',panel),{yPercent:-7},{yPercent:7,ease:'none',scrollTrigger:{trigger:panel,start:'top bottom',end:'bottom top',scrub:true}});
  }

  /* ---------- results: a photo follows the cursor over each row ---------- */
  const rows=$$('.rows li');
  if(rows.length&&fine&&moving){
    const PICS=['img/work-2.jpg','img/hv-lock.jpg','img/j-1.jpg','img/work-6.jpg','img/work-1.jpg','img/j-2.jpg','img/j-4.jpg','img/j-5.jpg'];
    const hv=el('div','',`<img alt="">`);hv.id='hv';hv.setAttribute('aria-hidden','true');document.body.appendChild(hv);
    const hi=$('img',hv);let x=0,y=0,tx=0,ty=0,on=false,run=false,lx=0,loaded=false;
    const loop=()=>{x+=(tx-x)*.14;y+=(ty-y)*.14;const r=Math.max(-9,Math.min(9,(tx-lx)*.09));lx+=(tx-lx)*.14;hv.style.transform=`translate3d(${x}px,${y}px,0) rotate(${r}deg)`;
      if(on||Math.abs(tx-x)>1)requestAnimationFrame(loop);else run=false};
    $$('.cols').forEach(c=>c.addEventListener('pointerenter',()=>{if(loaded)return;loaded=true;PICS.forEach(s=>{new Image().src=s})},{once:true}));
    rows.forEach((li,i)=>{
      li.addEventListener('pointerenter',e=>{hi.src=PICS[i%PICS.length];if(!on){x=lx=tx=e.clientX;y=ty=e.clientY}on=true;hv.classList.add('s');if(!run){run=true;requestAnimationFrame(loop)}});
      li.addEventListener('pointermove',e=>{tx=e.clientX;ty=e.clientY});
      li.addEventListener('pointerleave',()=>{on=false;hv.classList.remove('s')})});
    addEventListener('scroll',()=>{if(on){on=false;hv.classList.remove('s')}},{passive:true});
  }

  /* ---------- results: toolkit tiles get a live data texture ---------- */
  const hex=n=>{let s='';for(let i=0;i<n;i++)s+=(Math.random()*256|0).toString(16).padStart(2,'0')+' ';return s.trim()};
  const off=i=>(i*16).toString(16).padStart(8,'0');
  const TEX=[
    ()=>Array.from({length:18},(_,i)=>`${off(i)}  ${hex(8)}  ${hex(8)}`),
    ()=>['GET /admin HTTP/1.1  403','GET /backup.zip  404','POST /login  302','GET /.git/HEAD  200','GET /api/v1/users  401','GET /robots.txt  200','POST /reset  429','GET /uploads/  301','OPTIONS /api  204'].flatMap(l=>[l,'']),
    ()=>Array.from({length:18},(_,i)=>`10.0.0.${(i*7)%250+1}:${40000+i*311} > 10.0.0.1:${[443,53,22,80][i%4]}  ${['SYN','ACK','PSH','FIN'][i%4]}`),
    ()=>['$ ps aux | grep -v root','$ docker ps --format {{.Names}}','$ journalctl -p err -b','$ ss -tulpn','$ sha256sum image.dd','$ python3 triage.py','$ uname -r','$ strings dump.bin | less','$ ip route'].flatMap(l=>[l,''])
  ];
  $$('.tk>div').forEach((t,i)=>{
    const lines=(TEX[i%TEX.length])().join('\n');
    const h=el('span','hx');h.setAttribute('aria-hidden','true');const inner=el('span');inner.textContent=lines+'\n'+lines;h.appendChild(inner);t.prepend(h);
    if(fine&&!RM)t.addEventListener('pointermove',e=>{const b=t.getBoundingClientRect();t.style.setProperty('--mx',e.clientX-b.left+'px');t.style.setProperty('--my',e.clientY-b.top+'px')})});

  /* ---------- terminal ---------- */
  const term=$('#term'),tsec=$('.termsec');
  if(term&&tsec){
    const bg=el('div','tbg','<img src="img/term.jpg" loading="lazy" decoding="async" alt="">');bg.setAttribute('aria-hidden','true');tsec.prepend(bg);
    const grid=el('div','tgrid');term.parentNode.insertBefore(grid,term);grid.appendChild(term);
    const cap=el('aside','cap','<div class="cap-h"><b><i></i>pcap.live</b><span>simulated</span></div><canvas></canvas><div class="cap-r"></div>');cap.setAttribute('aria-hidden','true');grid.appendChild(cap);
    if(moving){
      gsap.fromTo($('img',bg),{yPercent:-8},{yPercent:8,ease:'none',scrollTrigger:{trigger:tsec,start:'top bottom',end:'bottom top',scrub:true}});
      gsap.fromTo(term,{rotateX:20,scale:.93,transformPerspective:1300,transformOrigin:'50% 100%'},{rotateX:0,scale:1,ease:'none',scrollTrigger:{trigger:term,start:'top 100%',end:'top 45%',scrub:1}});
    }
    // simulated capture: only runs while on screen, and is labelled as simulated in the panel
    const rowsEl=$('.cap-r',cap),cv=$('canvas',cap),ctx=cv.getContext('2d'),N=44,vals=Array(N).fill(.08);
    let vis=false,heat=0,tmr=0,raf=0,seq=0;
    const PR=[['TCP',443,'SYN'],['DNS',53,'A?'],['TLS',443,'hello'],['SSH',22,'kex'],['HTTP',80,'GET'],['TCP',443,'ACK']];
    function row(hot){const p=PR[seq++%PR.length],d=new Date(),t=[d.getHours(),d.getMinutes(),d.getSeconds()].map(v=>String(v).padStart(2,'0')).join(':');
      const r=el('p',hot?'hot':'');r.textContent=hot?`${t} 10.0.0.7 > 185.0.2.44 EXFIL?`:`${t} 10.0.0.${(seq*13)%240+2} > 10.0.0.1 ${p[0]} ${p[1]} ${p[2]}`;
      rowsEl.prepend(r);while(rowsEl.children.length>16)rowsEl.lastChild.remove()}
    function draw(){
      const b=cv.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);if(cv.width!=Math.round(b.width*d)){cv.width=b.width*d;cv.height=b.height*d}
      ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,b.width,b.height);const w=b.width/N;heat*=.985;
      vals.forEach((v,i)=>{const h=Math.max(1.5,v*b.height);ctx.fillStyle=i>N-5?'#ff5a1f':`rgba(239,236,229,${.16+v*.4})`;ctx.fillRect(i*w,b.height-h,w-1.5,h)});
      if(vis&&moving)raf=requestAnimationFrame(draw);else raf=0}
    function pulse(){vals.shift();vals.push(Math.min(1,.1+Math.random()*.42+(Math.random()<.14?.3:0)+heat*.6));row(heat>.3&&Math.random()<.5)}
    function setVis(v){vis=v;clearInterval(tmr);if(v&&moving){tmr=setInterval(pulse,430);if(!raf)raf=requestAnimationFrame(draw)}}
    for(let i=0;i<8;i++)row(false);for(let i=0;i<N;i++){vals.shift();vals.push(.08+Math.random()*.4)}
    draw();
    new IntersectionObserver(e=>setVis(e[0].isIntersecting)).observe(cap);
    document.addEventListener('swarm:breach',()=>{heat=1;cap.classList.add('alert');setTimeout(()=>cap.classList.remove('alert'),2600)});
  }

  /* ---------- contact ---------- */
  const ct=$('.contact');
  if(ct){
    const bg=el('picture','cbg','<source media="(max-width:700px)" srcset="img/contact-s.jpg"><img src="img/contact.jpg" loading="lazy" decoding="async" alt="">');bg.setAttribute('aria-hidden','true');ct.prepend(bg);
    const mq=el('div','cmq',`<div>${'<span>Open a case</span><i>/</i>'.repeat(5)}</div>`);mq.setAttribute('aria-hidden','true');ct.insertBefore(mq,$('.wrap',ct));
    $('.wrap',ct).appendChild(el('p','geo','<span>Boudhanath, Kathmandu</span><span>27.7215&deg; N, 85.3620&deg; E</span>'));
    if(moving){
      gsap.fromTo($('img',bg),{yPercent:-9},{yPercent:5,ease:'none',scrollTrigger:{trigger:ct,start:'top bottom',end:'bottom bottom',scrub:true}});
      gsap.fromTo($('div',mq),{xPercent:-4},{xPercent:-34,ease:'none',scrollTrigger:{trigger:ct,start:'top bottom',end:'bottom bottom',scrub:.6}});
    }
  }

  if(hasGS){ScrollTrigger.refresh();addEventListener('load',()=>ScrollTrigger.refresh(),{once:true})}
})();
