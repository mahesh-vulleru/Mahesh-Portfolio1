"use strict";
const $=(s,el=document)=>el.querySelector(s);
const $$=(s,el=document)=>Array.from(el.querySelectorAll(s));
const REDUCED=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const STATIC=new URLSearchParams(location.search).has("static");
const MOTION_OFF=REDUCED||STATIC;
const TAU=Math.PI*2;

/* ---------- HUD clock ---------- */
const MON=["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
function tick(){
  const n=new Date();
  const hh=n.toLocaleTimeString("en-IN",{hour12:false,timeZone:"Asia/Kolkata"});
  $("#clock").textContent=String(n.getDate()).padStart(2,"0")+" "+MON[n.getMonth()]+" · "+hh+" IST";
}
tick();setInterval(tick,1000);

/* ---------- J.A.R.V.I.S. boot line ---------- */
(function(){
  const h=new Date().getHours();
  const dp=h<12?"morning":h<17?"afternoon":"evening";
  const line="J.A.R.V.I.S. online — good "+dp+", sir. Loading personnel file: VULLERU, M.";
  const sl=$("#statusLine");
  const txt=document.createElement("span");
  sl.insertBefore(txt,sl.firstChild);
  if(MOTION_OFF){txt.textContent=line;sl.classList.add("done");return;}
  let i=0;
  (function type(){
    i++;txt.textContent=line.slice(0,i);
    if(i<line.length){setTimeout(type,24+Math.random()*34);}
    else{sl.classList.add("done");}
  })();
})();

/* ---------- stat counters ---------- */
function finalCount(el){el.textContent=parseFloat(el.dataset.count).toFixed(+(el.dataset.dec||0));}
const cio=new IntersectionObserver(es=>es.forEach(e=>{
  if(!e.isIntersecting) return;
  const el=e.target,v=parseFloat(el.dataset.count),dec=+(el.dataset.dec||0);
  cio.unobserve(el);
  const t0=performance.now(),dur=1100;
  (function step(now){
    const t=Math.min(1,(now-t0)/dur),ez=1-Math.pow(1-t,3);
    el.textContent=(v*ez).toFixed(dec);
    if(t<1){requestAnimationFrame(step);}else{el.textContent=v.toFixed(dec);}
  })(t0);
}),{threshold:.4});
$$("[data-count]").forEach(el=>{MOTION_OFF?finalCount(el):cio.observe(el);});

/* ---------- reveal on scroll ---------- */
const rio=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting){e.target.classList.add("in");rio.unobserve(e.target);}
}),{threshold:.12});
$$(".reveal").forEach(el=>{MOTION_OFF?el.classList.add("in"):rio.observe(el);});

/* ---------- nav current section ---------- */
const sio=new IntersectionObserver(es=>es.forEach(e=>{
  if(!e.isIntersecting) return;
  $$(".hud-nav a").forEach(a=>a.classList.toggle("current",a.getAttribute("href")==="#"+e.target.id));
}),{rootMargin:"-40% 0px -55% 0px"});
["profile","core","missions","training","medals","comms"].forEach(id=>{
  const el=document.getElementById(id);if(el)sio.observe(el);
});

/* ---------- 3D card tilt ---------- */
if(!MOTION_OFF&&window.matchMedia("(pointer:fine)").matches){
  $$("[data-tilt]").forEach(card=>{
    card.addEventListener("mousemove",e=>{
      const r=card.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width*2-1,y=(e.clientY-r.top)/r.height*2-1;
      card.style.transform="perspective(900px) rotateX("+(-y*4).toFixed(2)+"deg) rotateY("+(x*5).toFixed(2)+"deg)";
    });
    card.addEventListener("mouseleave",()=>{card.style.transform="";});
  });
}

/* ---------- 3D arc reactor (canvas, perspective projection) ---------- */
(function(){
  const wrap=document.querySelector(".reactor-wrap");
  const cv=document.getElementById("reactor");
  if(!wrap||!cv) return;
  const ctx=cv.getContext("2d");
  const DPR=Math.min(2,window.devicePixelRatio||1);
  let W=0,H=0,cx=0,cy=0,S=0;
  function resize(){
    const r=wrap.getBoundingClientRect();
    W=r.width;H=r.width;
    cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);
    ctx.setTransform(DPR,0,0,DPR,0,0);
    cx=W/2;cy=H/2;S=W/2*0.66;
  }
  resize();window.addEventListener("resize",()=>{resize();if(MOTION_OFF){draw();}});

  function proj(x,y,z,rx,ry){
    const c1=Math.cos(rx),s1=Math.sin(rx);
    const y2=y*c1-z*s1,z2=y*s1+z*c1;
    const c2=Math.cos(ry),s2=Math.sin(ry);
    const x3=x*c2+z2*s2,z3=-x*s2+z2*c2;
    const f=3.4,sc=f/(f+z3);
    return [cx+x3*S*sc,cy+y2*S*sc,sc];
  }
  function path3(r,rx,ry,a0,a1,steps){
    for(let i=0;i<=steps;i++){
      const t=a0+(a1-a0)*i/steps;
      const p=proj(Math.cos(t)*r,Math.sin(t)*r,0,rx,ry);
      if(i===0){ctx.moveTo(p[0],p[1]);}else{ctx.lineTo(p[0],p[1]);}
    }
  }
  function stroke3(r,rx,ry,color,alpha,width,glow){
    ctx.lineJoin="round";ctx.lineCap="round";
    if(glow){ctx.beginPath();path3(r,rx,ry,0,TAU,110);ctx.strokeStyle=color;ctx.globalAlpha=alpha*.15;ctx.lineWidth=width*3.6;ctx.stroke();}
    ctx.beginPath();path3(r,rx,ry,0,TAU,110);
    ctx.strokeStyle=color;ctx.globalAlpha=alpha;ctx.lineWidth=width;ctx.stroke();
    ctx.globalAlpha=1;
  }
  function coils(r,rx,ry){
    const n=10,len=.34;
    for(let k=0;k<n;k++){
      const a0=k/n*TAU;
      ctx.beginPath();path3(r,rx,ry,a0,a0+len,10);
      ctx.strokeStyle="rgba(95,217,255,.25)";ctx.lineWidth=7.5;ctx.stroke();
      ctx.beginPath();path3(r,rx,ry,a0,a0+len,10);
      ctx.strokeStyle="rgba(190,242,255,.95)";ctx.lineWidth=3;ctx.stroke();
    }
  }
  function reticle(){
    ctx.save();ctx.translate(cx,cy);
    ctx.strokeStyle="rgba(120,200,255,.2)";ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(0,0,S*1.34,0,TAU);ctx.stroke();
    for(let i=0;i<60;i++){
      const a=i/60*TAU,long=i%5===0,r1=S*1.34,r2=r1+(long?9:4);
      ctx.beginPath();ctx.moveTo(Math.cos(a)*r1,Math.sin(a)*r1);ctx.lineTo(Math.cos(a)*r2,Math.sin(a)*r2);ctx.stroke();
    }
    ctx.strokeStyle="rgba(245,182,46,.42)";
    for(let q=0;q<4;q++){
      const a0=q*Math.PI/2+.16;
      ctx.beginPath();ctx.arc(0,0,S*1.46,a0,a0+.5);ctx.stroke();
    }
    ctx.restore();
  }
  const P=Array.from({length:64},()=>({
    a:Math.random()*TAU,r:.5+Math.random()*.62,
    rx:(Math.random()-.5)*1.6,ry:Math.random()*TAU,
    sp:.15+Math.random()*.5,sz:.8+Math.random()*1.7,
    g:Math.random()<.28
  }));
  function particles(time){
    for(const p of P){
      const ang=p.a+time*p.sp;
      const pt=proj(Math.cos(ang)*p.r,Math.sin(ang)*p.r,0,p.rx,p.ry+time*.07);
      const depth=Math.max(0,Math.min(1,(pt[2]-.75)/.6));
      ctx.globalAlpha=.12+.7*depth;
      ctx.fillStyle=p.g?"#f5b62e":"#7fe0ff";
      ctx.beginPath();ctx.arc(pt[0],pt[1],p.sz,0,TAU);ctx.fill();
    }
    ctx.globalAlpha=1;
  }
  function core(pulse){
    const g=ctx.createRadialGradient(cx,cy,0,cx,cy,S*.62);
    g.addColorStop(0,"rgba(240,253,255,.95)");
    g.addColorStop(.18,"rgba(150,228,255,.5)");
    g.addColorStop(.5,"rgba(64,160,255,.1)");
    g.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    ctx.beginPath();ctx.arc(cx,cy,S*(.11+.02*pulse),0,TAU);
    ctx.fillStyle="rgba(248,253,255,.97)";ctx.fill();
    ctx.beginPath();ctx.arc(cx,cy,S*.155,0,TAU);
    ctx.strokeStyle="rgba(200,240,255,.5)";ctx.lineWidth=1.5;ctx.stroke();
  }
  let time=0,last=0,tx=0,ty=0,smx=0,smy=0;
  function draw(){
    ctx.clearRect(0,0,W,H);
    reticle();
    const wob=Math.sin(time*.7)*.05;
    const gRx=.42+smy*.4+wob*.3,gRy=time*.28+smx*.55;
    stroke3(1.02,.5+wob,time*.1,"#f5b62e",.8,2,true);
    stroke3(.84,gRx,gRy,"#5fd9ff",.85,2.2,true);
    stroke3(.66,-gRx*1.25,-gRy*1.35,"#37b6ff",.6,1.8,false);
    stroke3(.48,gRx*1.7,gRy*1.9,"#a8ecff",.5,1.4,false);
    coils(.93,gRx*.7,gRy*.75);
    particles(time);
    core(Math.sin(time*2.4)*.5+.5);
  }
  window.addEventListener("mousemove",e=>{
    const r=wrap.getBoundingClientRect();
    tx=Math.max(-1,Math.min(1,(e.clientX-(r.left+r.width/2))/(r.width*.9)));
    ty=Math.max(-1,Math.min(1,(e.clientY-(r.top+r.height/2))/(r.height*.9)));
  });
  function frame(ts){
    if(!last)last=ts;
    const dt=Math.min(.05,(ts-last)/1000);last=ts;time+=dt;
    smx+=(tx-smx)*.06;smy+=(ty-smy)*.06;
    draw();
    requestAnimationFrame(frame);
  }
  if(MOTION_OFF){time=9;draw();}else{requestAnimationFrame(frame);}
})();
