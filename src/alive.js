import './alive.css';

export function openAlive(initial='DOCK'){
  if(document.querySelector('.alive-room'))return;
  const previous=document.activeElement,room=document.createElement('dialog');room.className='alive-room';
  room.innerHTML='<canvas aria-hidden="true"></canvas><header><strong>DOCK<span>.</span><small> / LIVING TYPE</small></strong><button aria-label="Close living type">BACK TO DOCK ↗</button></header><div class="alive-caption">EVERY WORD HAS A PULSE.</div><form><input aria-label="Words to bring alive" maxlength="32" placeholder="Give the particles a new thought…"><button>TRANSFORM ↗</button></form><footer>MOVE TO SCATTER · PRESS TO PULL · RELEASE TO REFORM</footer>';
  document.body.append(room);room.showModal();
  const canvas=room.querySelector('canvas'),ctx=canvas.getContext('2d'),input=room.querySelector('input');
  if(!ctx){room.remove();return}
  let w=0,h=0,particles=[],frame=0,word=String(initial||'DOCK').slice(0,32),pointer={x:-9999,y:-9999,down:false},last=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function shape(){
    w=room.clientWidth;h=room.clientHeight;const ratio=Math.min(devicePixelRatio||1,2);canvas.width=w*ratio;canvas.height=h*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);
    const mask=document.createElement('canvas');mask.width=w;mask.height=h;const m=mask.getContext('2d');
    let size=Math.min(w*.17,190);m.font=`700 ${size}px "Space Grotesk", sans-serif`;while(m.measureText(word).width>w*.84&&size>16){size-=2;m.font=`700 ${size}px "Space Grotesk", sans-serif`}
    m.fillStyle='white';m.textAlign='center';m.textBaseline='middle';m.fillText(word,w/2,h*.46);
    const data=m.getImageData(0,0,w,h).data,points=[],step=Math.max(4,Math.ceil(w/260));
    for(let y=Math.max(0,Math.floor(h*.46-size));y<Math.min(h,h*.46+size);y+=step)for(let x=0;x<w;x+=step)if(data[(y*w+x)*4+3]>100)points.push({tx:x,ty:y});
    particles=points.map((p,i)=>({...p,x:particles[i]?.x??Math.random()*w,y:particles[i]?.y??Math.random()*h,vx:0,vy:0,hue:270+100*p.tx/w}));
  }
  function draw(time){
    const dt=Math.min((time-last)/16.67||1,2);last=time;ctx.fillStyle='#090b19';ctx.fillRect(0,0,w,h);
    const glow=ctx.createRadialGradient(w/2,h*.46,0,w/2,h*.46,w*.6);glow.addColorStop(0,'#252044');glow.addColorStop(1,'#090b19');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
    for(const p of particles){
      if(reduced){p.x=p.tx;p.y=p.ty}else{
        p.vx+=(p.tx-p.x)*.012*dt;p.vy+=(p.ty-p.y)*.012*dt;
        const dx=p.x-pointer.x,dy=p.y-pointer.y,d=Math.hypot(dx,dy);if(d<150&&d>0){const force=(1-d/150)*(pointer.down?-1.8:2.6);p.vx+=dx/d*force*dt;p.vy+=dy/d*force*dt}
        p.vx*=Math.pow(.88,dt);p.vy*=Math.pow(.88,dt);p.x+=p.vx*dt;p.y+=p.vy*dt;
      }
      ctx.fillStyle=`hsl(${p.hue} 90% ${70+Math.sin(time*.001+p.tx*.01)*10}%)`;ctx.beginPath();ctx.arc(p.x,p.y,1.7,0,Math.PI*2);ctx.fill();
    }
    frame=requestAnimationFrame(draw);
  }
  function close(){cancelAnimationFrame(frame);window.removeEventListener('resize',shape);room.close();room.remove();previous?.focus()}
  room.querySelector('header button').onclick=close;room.addEventListener('cancel',e=>{e.preventDefault();close()});
  canvas.onpointermove=e=>{const r=canvas.getBoundingClientRect();pointer.x=e.clientX-r.left;pointer.y=e.clientY-r.top};canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);pointer.down=true;canvas.onpointermove(e)};canvas.onpointerup=canvas.onpointercancel=()=>{pointer.down=false};canvas.onpointerleave=()=>{pointer.x=-9999;pointer.down=false};
  room.querySelector('form').onsubmit=e=>{e.preventDefault();if(input.value.trim()){word=input.value.trim();shape();input.value=''}};
  window.addEventListener('resize',shape);shape();frame=requestAnimationFrame(draw);input.focus();
}
