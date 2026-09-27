import './alive.css';

// The real headline becomes particles, one word at a time. No idle animation.
let lastAnimatedQuery='';
export function mountAlive(headline,query=''){
  if(!headline||matchMedia('(prefers-reduced-motion: reduce)').matches)return ()=>{};
  const canvas=document.createElement('canvas');canvas.className='alive-inline';canvas.setAttribute('aria-hidden','true');headline.append(canvas);
  const ctx=canvas.getContext('2d');if(!ctx){canvas.remove();return ()=>{}}
  const padding=90;let frame=0,last=0,active=null,particles=[],pointer=null,leaving=0,disposed=false;
  function reset(){if(active)active.style.opacity='';active=null;particles=[];pointer=null;ctx.clearRect(0,0,canvas.width,canvas.height);cancelAnimationFrame(frame);frame=0}
  function start(word){
    if(active===word){leaving=0;return}reset();
    const box=headline.getBoundingClientRect(),r=word.getBoundingClientRect();if(!r.width||!r.height)return;
    const dpr=Math.min(devicePixelRatio||1,2),w=box.width+padding*2,h=box.height+padding*2;
    canvas.style.width=`${w}px`;canvas.style.height=`${h}px`;canvas.width=Math.ceil(w*dpr);canvas.height=Math.ceil(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    const s=getComputedStyle(word),mask=document.createElement('canvas');mask.width=Math.ceil(r.width+12);mask.height=Math.ceil(r.height+12);const m=mask.getContext('2d');
    m.font=`${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;m.letterSpacing=s.letterSpacing;m.fillStyle='#fff';m.textBaseline='alphabetic';
    const metrics=m.measureText(word.textContent),fontHeight=metrics.fontBoundingBoxAscent+metrics.fontBoundingBoxDescent;
    const baseline=Number.isFinite(fontHeight)?(r.height-fontHeight)/2+metrics.fontBoundingBoxAscent:r.height*.79;
    m.fillText(word.textContent,6,baseline+6);
    const pixels=m.getImageData(0,0,mask.width,mask.height).data;
    const step=r.width>400?3:2;
    for(let y=0;y<mask.height;y+=step)for(let x=0;x<mask.width;x+=step){const alpha=pixels[(y*mask.width+x)*4+3]/255;if(alpha>.25){const tx=r.left-box.left+x-6+padding,ty=r.top-box.top+y-6+padding;particles.push({x:tx,y:ty,tx,ty,vx:0,vy:0,alpha})}}
    if(!particles.length)return;
    active=word;active.style.opacity='0';canvas.style.color=s.color;leaving=0;last=performance.now();frame=requestAnimationFrame(draw);
  }
  function draw(t){
    if(disposed)return;
    const dt=Math.min((t-last)/16.67,2);last=t;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle=canvas.style.color;
    let energy=0;
    for(const p of particles){
      if(pointer){const dx=p.x-pointer.x,dy=p.y-pointer.y,d=Math.hypot(dx,dy);if(d<70&&d>.1){const force=(1-d/70)*2.8;p.vx+=dx/d*force*dt;p.vy+=dy/d*force*dt}}
      p.vx+=(p.tx-p.x)*.032*dt;p.vy+=(p.ty-p.y)*.032*dt;p.vx*=Math.pow(.82,dt);p.vy*=Math.pow(.82,dt);p.x+=p.vx*dt;p.y+=p.vy*dt;energy+=Math.abs(p.x-p.tx)+Math.abs(p.y-p.ty);
      ctx.globalAlpha=p.alpha;ctx.beginPath();ctx.arc(p.x,p.y,1.15,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
    if(leaving&&(energy/particles.length<.15||t-leaving>1600)){reset();return}
    frame=requestAnimationFrame(draw);
  }
  function move(e){if(e.buttons||e.pointerType==='touch')return;const word=e.target.closest('.drag-word');if(word&&headline.contains(word))start(word);if(!active)return;const r=headline.getBoundingClientRect();pointer={x:e.clientX-r.left+padding,y:e.clientY-r.top+padding};if(!word){pointer=null;if(!leaving)leaving=performance.now()}}
  function leave(){pointer=null;leaving=performance.now()}
  headline.addEventListener('pointermove',move);headline.addEventListener('pointerleave',leave);headline.addEventListener('pointerdown',reset);
  const observer=new ResizeObserver(reset);observer.observe(headline);
  const reveal=setTimeout(()=>{if(query&&query!==lastAnimatedQuery&&!disposed){lastAnimatedQuery=query;const word=headline.querySelector('.drag-word');if(word){start(word);for(const p of particles){p.x+=Math.random()*100-50;p.y+=Math.random()*80-40}leave()}}},300);
  return ()=>{clearTimeout(reveal);disposed=true;reset();observer.disconnect();headline.removeEventListener('pointermove',move);headline.removeEventListener('pointerleave',leave);headline.removeEventListener('pointerdown',reset);canvas.remove()};
}
