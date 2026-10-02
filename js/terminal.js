// Small interactive terminal. Type a command or click one of the buttons.
(function(){
  const out=document.getElementById('tout'),inp=document.getElementById('tcmd');if(!out)return;
  const esc=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const C={
    help:['Available commands:','  whoami    who I am','  skills    tools and areas','  certs     certifications','  ctf       competition results','  projects  what I have built','  contact   how to reach me','  clear     clear the screen'],
    whoami:['Abhaya Chand, Kathmandu, Nepal','BSc (Hons) Ethical Hacking and Cyber Security, 4th semester','Technical Blue Team Leader, Cyber Security Club','Focus: digital forensics, incident response, web security'],
    skills:['forensics  Volatility, ExifTool, Binwalk, Steghide','offensive  Burp Suite, ffuf, Gobuster, Nmap, Metasploit, Hydra','network    Wireshark, Cisco Packet Tracer','systems    Arch Linux, Python, Bash, Docker, CUDA'],
    certs:['Practical Ethical Hacking (TCM Security)','Pre Security and Cyber Security 101 (TryHackMe)','Certified Cybersecurity Educator Professional (CCEP)','AV/EDR Evasion Practical Techniques (Red Team Leaders)'],
    ctf:['3rd  DFIR CTF, Softwarica College','5th  Pentester Nepal CTF','7th  Trinity CTF','Played every CTF Softwarica has organised'],
    projects:['microcrawl                      local web crawler','USB crypto-miner investigation    real malware case','Browser extension session theft  educational PoC','Windows reverse shell study      isolated lab','Network design                   Cisco Packet Tracer'],
    contact:['email   avayachand2@gmail.com','github  github.com/Unknown-user12345']
  };
  C.ls=['evidence/  notes/  reports/  tools/'];
  const hist=[];let hi=0,busy=false;
  const add=(t,cls)=>{const p=document.createElement('p');if(cls)p.className=cls;p.innerHTML=t;out.appendChild(p);out.scrollTop=out.scrollHeight;return p};
  async function print(lines){busy=true;for(const l of lines){add(esc(l)||'&nbsp;');await new Promise(r=>setTimeout(r,matchMedia('(prefers-reduced-motion:reduce)').matches?0:55))}busy=false}
  function run(cmd){
    cmd=cmd.trim();if(!cmd)return;
    add('<span class="c">$</span> '+esc(cmd));hist.push(cmd);hi=hist.length;
    const k=cmd.toLowerCase().split(/\s+/)[0];
    if(k=='clear'){out.innerHTML='';return}
    if(k=='sudo'){return print(['Nice try. Permission denied, and it has been logged.'])}
    if(C[k])return print(C[k]);
    return print(['command not found: '+cmd,'type help to see what is available'])
  }
  inp.addEventListener('keydown',e=>{
    if(e.key=='Enter'&&!busy){run(inp.value);inp.value=''}
    if(e.key=='ArrowUp'&&hi>0){inp.value=hist[--hi];e.preventDefault()}
    if(e.key=='ArrowDown'){inp.value=hist[++hi]||'';hi=Math.min(hi,hist.length)}
  });
  document.querySelector('.tq').addEventListener('click',e=>{if(e.target.tagName=='BUTTON'&&!busy){run(e.target.textContent)}});
  // auto-run once when it scrolls into view
  new IntersectionObserver((e,o)=>{if(e[0].isIntersecting){o.disconnect();add('Welcome. Running whoami for you...','m');setTimeout(()=>run('whoami'),500)}},{threshold:.5}).observe(document.getElementById('term'));
})();
