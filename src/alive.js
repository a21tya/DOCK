import './alive.css';

// Enhance the existing headline without replacing its text or drag controls.
export function mountAlive(headline){
  if(!headline)return ()=>{};
  const canvas=document.createElement('canvas');canvas.className='alive-inline';canvas.setAttribute('aria-hidden','true');headline.append(canvas);
  const ctx=canvas.getContext('2d');if(!ctx)return ()=>canvas.remove();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frame=0,particles=[],pointer={x:-999,y:-999},width=0,height=0,last=0;
  function shape(){
    const bounds=headline.getBoundingClientRect();width=bounds.width;height=bounds.height;if(!width||!height)return;
    const dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
    const mask=document.createElement('canvas');mask.width=Math.ceil(width);mask.height=Math.ceil(height);const m=mask.getContext('2d');
    for(const word of headline.querySelectorAll('span')){if(word.children.length)continue;const r=word.getBoundingClientRect(),s=getComputedStyle(word);m.font=`${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;m.fillStyle='#fff';m.textBaseline='middle';m.fillText(word.textContent,r.left-bounds.left,r.top-bounds.top+r.height/2)}
    const data=m.getImageData(0,0,mask.width,mask.height).data;particles=[];
    for(let y=0;y<height;y+=5)for(let x=0;x<width;x+=5)if(data[(y*mask.width+x)*4+3]>100)particles.push({x,y,tx:x,ty:y,vx:0,vy:0});
  }
  function move(e){const r=headline.getBoundingClientRect();pointer={x:e.clientX-r.left,y:e.clientY-r.top}}
  function leave(){pointer={x:-999,y:-999}}
  function draw(t){
    const dt=Math.min((t-last)/16.67||1,2);last=t;ctx.clearRect(0,0,width,height);
    for(const p of particles){const dx=p.x-pointer.x,dy=p.y-pointer.y,d=Math.hypot(dx,dy);if(!reduced&&d<90&&d>0){p.vx+=dx/d*(1-d/90)*2;p.vy+=dy/d*(1-d/90)*2}p.vx+=(p.tx-p.x)*.025;p.vy+=(p.ty-p.y)*.025;p.vx*=.86;p.vy*=.86;p.x+=p.vx*dt;p.y+=p.vy*dt;const displacement=Math.hypot(p.x-p.tx,p.y-p.ty);if(displacement>1){ctx.fillStyle=`hsla(${280+p.tx/width*60},95%,80%,${Math.min(displacement/12,.95)})`;ctx.beginPath();ctx.arc(p.x,p.y,1.5,0,Math.PI*2);ctx.fill()}}
    frame=requestAnimationFrame(draw);
  }
  headline.addEventListener('pointermove',move);headline.addEventListener('pointerleave',leave);const observer=new ResizeObserver(shape);observer.observe(headline);shape();if(!reduced)frame=requestAnimationFrame(draw);
  return ()=>{cancelAnimationFrame(frame);observer.disconnect();headline.removeEventListener('pointermove',move);headline.removeEventListener('pointerleave',leave);canvas.remove()};
}
