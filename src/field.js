import './field.css';

const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const palettes={ocean:195,sunset:24,moon:245,neon:310,forest:145,fire:12,rain:210,space:270,red:0,orange:28,yellow:50,green:135,blue:220,purple:275,pink:325};
function hueFor(text){const match=Object.keys(palettes).find(key=>text.toLowerCase().includes(key));if(match)return palettes[match];return [...text].reduce((h,c)=>(h*31+c.charCodeAt(0))%360,0)}

export function openField(){
  if(document.querySelector('.dock-field'))return;
  const previousFocus=document.activeElement;
  const root=document.createElement('section');root.className='dock-field';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','The Field, an interactive universe of words');
  root.innerHTML=`<canvas class="field-canvas" aria-hidden="true"></canvas><div class="field-vignette"></div>
    <header class="field-header"><div class="field-brand">DOCK<span>.</span><i>/ THE FIELD</i></div><button class="field-exit" aria-label="Close The Field">BACK TO DOCK <span>↗</span></button></header>
    <div class="field-intro"><div class="field-eyebrow"><span></span> A LITTLE UNIVERSE. ENTIRELY YOURS.</div><h1>Words have<br><em>gravity.</em></h1><p>Give a thought a world.<br>Throw it into another. See what happens.</p><div class="field-hint">DRAG TO THROW <b>·</b> DROP TO FUSE</div></div>
    <div class="field-live" role="status" aria-live="polite">Five thoughts. Infinite collisions.</div>
    <div class="field-tools"><button data-field-action="burst" title="Send your worlds flying">✺ <span>BIG BANG</span></button><button data-field-action="orbit" aria-pressed="true">◎ <span>ORBIT ON</span></button><button data-field-action="reset">↺ <span>START AGAIN</span></button></div>
    <form class="field-compose"><span class="field-input-star">✦</span><input aria-label="A thought to turn into a world" maxlength="48" placeholder="Make a world. Type anything…" autocomplete="off"><button type="submit" aria-label="Create world">↑</button></form>
    <footer class="field-footer"><span>EXPERIMENT 002 <b>/</b> PLAY IS THE POINT.</span><span class="field-count">05 WORLDS</span></footer>
    <div class="field-accessible"><label for="field-world-one">Fuse a world</label><select id="field-world-one"></select><label for="field-world-two">with</label><select id="field-world-two"></select><button type="button" class="field-fuse">FUSE SELECTED WORLDS</button></div>`;
  document.body.append(root);
  const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d');
  if(!ctx){root.remove();return}
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width=0,height=0,dpr=1,worlds=[],sparks=[],pointer=null,drag=null,orbit=true,frame=0,last=performance.now(),nextId=1,closing=false;
  const stars=Array.from({length:210},()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.3+.2,a:Math.random()*.55+.12}));
  const status=root.querySelector('.field-live');
  const center=()=>({x:width*(width<650?.5:.65),y:height*(width<650?.48:.47)});
  function resize(){width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;canvas.style.width=width+'px';canvas.style.height=height+'px';ctx.setTransform(dpr,0,0,dpr,0,0);for(const w of worlds){w.x=Math.max(w.r,Math.min(width-w.r,w.x));w.y=Math.max(90+w.r,Math.min(height-160-w.r,w.y))}}
  function make(text,x,y){const hue=hueFor(text);return {id:nextId++,text,x,y,r:Math.min(width<650?36:56,Math.max(28,width*.039)),vx:0,vy:0,hue,hue2:(hue+45)%360,phase:Math.random()*6.28,level:1}}
  function updateControls(){root.querySelector('.field-count').textContent=String(worlds.length).padStart(2,'0')+' WORLDS';for(const [i,select] of [...root.querySelectorAll('.field-accessible select')].entries()){const selected=select.value;select.innerHTML=worlds.map(w=>`<option value="${w.id}">${escapeHtml(w.text)}</option>`).join('');select.value=worlds.some(w=>String(w.id)===selected)?selected:String(worlds[Math.min(i,worlds.length-1)]?.id)}root.querySelector('.field-fuse').disabled=worlds.length<2}
  function seed(){sparks=[];const c=center();worlds=['ocean','sunset','moon','neon','forest'].map((text,i)=>{const a=i*6.28/5-.9;const radius=Math.min(width*.24,height*.24);const w=make(text,c.x+Math.cos(a)*radius,c.y+Math.sin(a)*radius);w.vx=-Math.sin(a)*.4;w.vy=Math.cos(a)*.4;return w});updateControls()}
  function particles(x,y,hue,count=45){if(reduced)return;for(let i=0;i<count;i++){const angle=Math.random()*6.28,speed=Math.random()*5+1;sparks.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1,hue})}if(sparks.length>400)sparks.splice(0,sparks.length-400)}
  function fuse(a,b){if(!a||!b||a===b)return;const text=(a.text+' + '+b.text).slice(0,90);const w=make(text,(a.x+b.x)/2,(a.y+b.y)/2);w.hue=a.hue;w.hue2=b.hue;w.r=Math.min(width<650?68:110,Math.sqrt(a.r*a.r+b.r*b.r)*.83);w.level=a.level+b.level;w.emoji='';worlds=worlds.filter(item=>item!==a&&item!==b);worlds.push(w);particles(w.x,w.y,w.hue,90);particles(w.x,w.y,w.hue2,70);status.textContent=`${a.text} × ${b.text}. A world that did not exist a moment ago.`;updateControls()}
  function glow(x,y,r,hue,alpha){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`hsla(${hue},90%,60%,${alpha})`);g.addColorStop(1,`hsla(${hue},90%,40%,0)`);ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2)}
  function drawWorld(w,t){
    glow(w.x,w.y,w.r*2.7,w.hue,.13);
    ctx.save();ctx.translate(w.x,w.y);
    if(drag===w){ctx.strokeStyle='#fff9';ctx.lineWidth=1;ctx.setLineDash([3,7]);ctx.beginPath();ctx.arc(0,0,w.r+13,0,6.28);ctx.stroke();ctx.setLineDash([])}
    ctx.save();ctx.beginPath();ctx.arc(0,0,w.r,0,6.28);ctx.clip();
    const g=ctx.createLinearGradient(-w.r,-w.r,w.r,w.r);g.addColorStop(0,`hsl(${w.hue},85%,80%)`);g.addColorStop(.38,`hsl(${w.hue},78%,52%)`);g.addColorStop(.75,`hsl(${w.hue2},72%,32%)`);g.addColorStop(1,'#090916');ctx.fillStyle=g;ctx.fillRect(-w.r,-w.r,w.r*2,w.r*2);
    // Curved atmospheric bands make every world a moving, dimensional object.
    for(let j=0;j<9;j++){ctx.beginPath();ctx.ellipse(Math.sin(t*.17+w.phase+j)*w.r*.14,(j-4)*w.r*.22,w.r*1.15,w.r*.23,.24,0,6.28);ctx.strokeStyle=`hsla(${j%2?w.hue:w.hue2},90%,${j%3?80:20}%,${j%2?.13:.2})`;ctx.lineWidth=w.r*.075;ctx.stroke()}
    const shade=ctx.createRadialGradient(-w.r*.4,-w.r*.5,w.r*.1,w.r*.45,w.r*.2,w.r*1.5);shade.addColorStop(0,'#ffffff55');shade.addColorStop(.5,'#0000');shade.addColorStop(1,'#000c');ctx.fillStyle=shade;ctx.fillRect(-w.r,-w.r,w.r*2,w.r*2);ctx.restore();
    ctx.strokeStyle=`hsla(${w.hue},90%,85%,.65)`;ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,w.r,0,6.28);ctx.stroke();
    if(w.level>1){ctx.save();ctx.rotate(-.35);ctx.strokeStyle=`hsla(${w.hue2},90%,80%,.65)`;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,w.r*1.42,w.r*.32,0,0,6.28);ctx.stroke();ctx.restore()}
    ctx.font=`500 ${width<650?12:14}px "Space Grotesk",sans-serif`;ctx.textAlign='center';ctx.fillStyle='#fff';ctx.shadowColor='#000';ctx.shadowBlur=9;const label=w.text.length>28?w.text.slice(0,27)+'…':w.text;ctx.fillText(label,0,w.r+30);ctx.shadowBlur=0;ctx.restore();
  }
  function tick(now){if(closing)return;const dt=Math.min((now-last)/16.67,2);last=now;const t=reduced?0:now/1000;ctx.clearRect(0,0,width,height);ctx.fillStyle='#070813';ctx.fillRect(0,0,width,height);const c=center();glow(width*.7,height*.4,width*.55,260,.11);glow(width*.42,height*.76,width*.4,320,.065);
    for(const s of stars){ctx.globalAlpha=s.a*(reduced?1:.75+.25*Math.sin(t*.5+s.x*50));ctx.fillStyle='#dcdaff';ctx.beginPath();ctx.arc(s.x*width,s.y*height,s.r,0,6.28);ctx.fill()}ctx.globalAlpha=1;
    if(orbit){ctx.strokeStyle='#c5b4ff0d';ctx.lineWidth=1;for(let i=1;i<4;i++){ctx.beginPath();ctx.ellipse(c.x,c.y,Math.min(width*.24,height*.24)*i*.55,Math.min(width*.24,height*.24)*i*.55,0,0,6.28);ctx.stroke()}}
    for(const w of worlds){if(w!==drag&&!reduced){if(orbit){const dx=c.x-w.x,dy=c.y-w.y,distance=Math.max(1,Math.hypot(dx,dy)),radius=Math.min(width*.24,height*.24),pull=(distance-radius)*.00065;w.vx+=(dx/distance*pull-dy/distance*.006)*dt;w.vy+=(dy/distance*pull+dx/distance*.006)*dt}for(const other of worlds){if(other===w)continue;const dx=w.x-other.x,dy=w.y-other.y,distance=Math.max(1,Math.hypot(dx,dy)),gap=w.r+other.r+30;if(distance<gap){w.vx+=dx/distance*(gap-distance)*.004*dt;w.vy+=dy/distance*(gap-distance)*.004*dt}}w.vx*=Math.pow(.98,dt);w.vy*=Math.pow(.98,dt);w.x+=w.vx*dt;w.y+=w.vy*dt;const bottom=Math.max(110+w.r,height-155-w.r);if(w.x<w.r+12||w.x>width-w.r-12){w.vx*=-.7;w.x=Math.max(w.r+12,Math.min(width-w.r-12,w.x))}if(w.y<100+w.r||w.y>bottom){w.vy*=-.7;w.y=Math.max(100+w.r,Math.min(bottom,w.y))}}
      drawWorld(w,t)}
    for(const p of sparks){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=.013*dt;ctx.fillStyle=`hsla(${p.hue},95%,80%,${Math.max(0,p.life)})`;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(.2,p.life*2),0,6.28);ctx.fill()}sparks=sparks.filter(p=>p.life>0);frame=requestAnimationFrame(tick)}
  canvas.onpointerdown=e=>{const hit=[...worlds].reverse().find(w=>Math.hypot(w.x-e.clientX,w.y-e.clientY)<w.r+14);if(!hit)return;drag=hit;pointer={x:e.clientX,y:e.clientY,time:performance.now()};hit.vx=hit.vy=0;canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing'};
  canvas.onpointermove=e=>{if(!drag)return;const now=performance.now(),delta=Math.max(16,now-pointer.time);drag.vx=Math.max(-8,Math.min(8,(e.clientX-pointer.x)*16/delta));drag.vy=Math.max(-8,Math.min(8,(e.clientY-pointer.y)*16/delta));drag.x=e.clientX;drag.y=e.clientY;pointer={x:e.clientX,y:e.clientY,time:now}};
  canvas.onpointerup=()=>{if(!drag)return;const target=worlds.find(w=>w!==drag&&Math.hypot(w.x-drag.x,w.y-drag.y)<(w.r+drag.r)*.8);if(target)fuse(drag,target);drag=null;pointer=null;canvas.style.cursor='grab'};
  canvas.onpointercancel=()=>{drag=null;pointer=null;canvas.style.cursor='grab'};
  root.querySelector('form').onsubmit=e=>{e.preventDefault();const input=root.querySelector('input'),text=input.value.trim();if(!text)return;if(worlds.length>=18){status.textContent='Your universe is full. Fuse two worlds to make room.';return}const c=center(),w=make(text,c.x+(Math.random()-.5)*160,c.y+(Math.random()-.5)*100);w.vx=(Math.random()-.5)*3;w.vy=-2;worlds.push(w);particles(w.x,w.y,w.hue);input.value='';status.textContent=`${text} has entered your universe.`;updateControls()};
  root.querySelector('[data-field-action="burst"]').onclick=()=>{const c=center();for(const w of worlds){const a=Math.atan2(w.y-c.y,w.x-c.x);w.vx=Math.cos(a)*7;w.vy=Math.sin(a)*7;particles(w.x,w.y,w.hue,20)}status.textContent='A little chaos looks good on you.'};
  root.querySelector('[data-field-action="orbit"]').onclick=e=>{orbit=!orbit;const button=e.currentTarget;button.setAttribute('aria-pressed',String(orbit));button.querySelector('span').textContent=orbit?'ORBIT ON':'FREE FLOAT';status.textContent=orbit?'Everything finds its orbit.':'No rules. Just momentum.'};
  root.querySelector('[data-field-action="reset"]').onclick=()=>{seed();status.textContent='A fresh universe. Try ocean + sunset.'};
  root.querySelector('.field-fuse').onclick=()=>{const selects=root.querySelectorAll('select');fuse(worlds.find(w=>w.id===Number(selects[0].value)),worlds.find(w=>w.id===Number(selects[1].value)))};
  const close=()=>{closing=true;cancelAnimationFrame(frame);removeEventListener('resize',resize);removeEventListener('keydown',keys);root.remove();previousFocus?.focus()};
  const keys=e=>{if(e.key==='Escape'){e.preventDefault();close()}if(e.key==='Tab'){const focusable=[...root.querySelectorAll('button,input,select')].filter(el=>!el.disabled);const first=focusable[0],end=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();end.focus()}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();first.focus()}}};
  root.querySelector('.field-exit').onclick=close;addEventListener('resize',resize);addEventListener('keydown',keys);resize();seed();frame=requestAnimationFrame(tick);root.querySelector('input').focus();
}
