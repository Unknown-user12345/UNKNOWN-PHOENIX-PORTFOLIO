// Photo, showreel and project images. Each one stays hidden until its file exists:
//   img/me.jpg           portrait in About
//   media/reel.mp4       showreel video (plus optional media/reel.jpg poster)
//   img/work-1.jpg ...   project covers, numbered in card order (replaces the animated sketch)
(function(){
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const hasGS=!!(window.gsap&&window.ScrollTrigger);
  const refresh=()=>hasGS&&ScrollTrigger.refresh();
  const load=src=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=src});

  /* portrait */
  const me=$('#me');
  if(me)load(me.dataset.src).then(img=>{
    img.alt='Abhaya Chand';me.querySelector('.me-in').prepend(img);me.hidden=false;me.closest('.wrap').classList.add('has-me');
    if(!RM){me.addEventListener('pointermove',e=>{const b=me.getBoundingClientRect();
      me.style.setProperty('--rx',((e.clientY-b.top)/b.height-.5)*-10+'deg');me.style.setProperty('--ry',((e.clientX-b.left)/b.width-.5)*12+'deg')});
      me.addEventListener('pointerleave',()=>{me.style.setProperty('--rx','0deg');me.style.setProperty('--ry','0deg')})}
    refresh()},()=>{});

  /* project covers */
  $$('.pj').forEach((c,i)=>load(`img/work-${i+1}.jpg`).then(img=>{
    img.alt='';img.loading='lazy';const f=document.createElement('div');f.className='cover';f.appendChild(img);
    const v=$('.viz',c);v?v.replaceWith(f):c.insertBefore(f,$('h3',c));c.classList.add('has-img')},()=>{}));

  /* showreel */
  const reel=$('#reel'),vid=reel&&$('video',reel);
  if(!vid)return;
  vid.addEventListener('loadeddata',()=>{
    if(!reel.hidden)return;reel.hidden=false;
    const nav=$('nav a[href="#reel"]');if(nav)nav.hidden=false;
    const btn=$('.rbtn',reel),box=$('.rv',reel);
    const set=()=>btn.textContent=vid.paused?'Play':'Pause';
    btn.onclick=()=>{vid.paused?vid.play():vid.pause();set()};
    box.addEventListener('dblclick',()=>vid.requestFullscreen&&vid.requestFullscreen());
    // only play while on screen
    new IntersectionObserver(e=>{if(RM)return;e[0].isIntersecting?vid.play().catch(()=>{}):vid.pause();set()},{threshold:.25}).observe(box);
    if(hasGS&&!RM){
      gsap.fromTo(box,{clipPath:'inset(14% 22% 14% 22% round 40px)'},{clipPath:'inset(0% 0% 0% 0% round 28px)',ease:'none',
        scrollTrigger:{trigger:box,start:'top 95%',end:'center 55%',scrub:1}});
      gsap.fromTo(vid,{scale:1.35},{scale:1,ease:'none',scrollTrigger:{trigger:box,start:'top bottom',end:'center 55%',scrub:1}});
    }
    set();refresh()},{once:true});
  vid.load();
})();
