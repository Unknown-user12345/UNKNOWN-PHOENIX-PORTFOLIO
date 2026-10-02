(function () {
  const hero = document.querySelector('.hero'), s = document.getElementById('spot');
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!hero || !s || RM) return;

  if (matchMedia('(pointer:fine)').matches) {
    let tx = 0, ty = 0, x = 0, y = 0, on = false, raf = 0;
    const f = () => {
      x += (tx - x) * 0.14; y += (ty - y) * 0.14;
      s.style.transform = `translate3d(${x}px,${y}px,0)`;
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(f) : 0;
    };
    hero.addEventListener('pointermove', e => {
      const b = hero.getBoundingClientRect();
      tx = e.clientX - b.left; ty = e.clientY - b.top;
      if (!on) { on = true; x = tx; y = ty; hero.classList.add('hot'); }
      if (!raf) raf = requestAnimationFrame(f);
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { on = false; hero.classList.remove('hot'); });
  }

  const hx = document.getElementById('hash'), H = '0123456789abcdef';
  if (hx) setInterval(() => {
    if (document.hidden) return;
    let o = ''; for (let i = 0; i < 32; i++) o += H[(Math.random() * 16) | 0];
    hx.textContent = o;
  }, 1800);
})();
