import './what-if.css';
export function gravityIntent(text){
 if(!/\bgravity\b|\bphysics playground\b|\bwhat[ -]?if playground\b/i.test(text))return null;
 let gravity=9.81;
 if(/half|halved/i.test(text))gravity=4.905;
 else if(/double|twice/i.test(text))gravity=19.62;
 else if(/zero|no gravity|without gravity/i.test(text))gravity=0;
 else if(/moon|lunar/i.test(text))gravity=1.62;
 else if(/mars/i.test(text))gravity=3.71;
 const value=text.match(/gravity\s*(?:=|is|to|of)?\s*(\d+(?:\.\d+)?)\s*(?:m\/s|m\/s²)/i);if(value)gravity=Math.min(25,Number(value[1]));
 return {type:'physics',name:'What-if playground',gravity,palette:['#86dcd5','#504387','#101426']};
}
export function flight(g,v,angle){const a=angle*Math.PI/180,vy=v*Math.sin(a),vx=v*Math.cos(a);return g>0?{time:2*vy/g,height:vy*vy/(2*g),range:vx*2*vy/g}:null}
export function physicsShell(){return `<section class="physics-lab"><header><div><small>DOCK LAB / 001</small><h2>Rewrite the rules.</h2><p>One launch. Earth versus your universe.</p></div><button data-lab="launch">↗ LAUNCH</button></header><div class="physics-stage"><canvas aria-label="Comparison of projectile motion on Earth and with your selected gravity"></canvas><div class="physics-key"><span>● YOUR WORLD</span><span>● EARTH · 9.81 m/s²</span></div></div><div class="physics-controls"><label>Gravity <output data-read="gravity"></output><input data-knob="gravity" aria-label="Gravity in metres per second squared" type="range" min="0" max="25" step="0.01"></label><label>Launch speed <output data-read="speed"></output><input data-knob="speed" aria-label="Launch speed in metres per second" type="range" min="5" max="25" value="12"></label><label>Angle <output data-read="angle"></output><input data-knob="angle" aria-label="Launch angle in degrees" type="range" min="15" max="80" value="45"></label></div><div class="physics-presets"><button data-g="9.81">Earth</button><button data-g="4.905">Half gravity</button><button data-g="1.62">Moon</button><button data-g="3.71">Mars</button><button data-g="0">Zero G</button><button data-lab="pause">PAUSE</button></div><div class="physics-stats" aria-live="polite"></div><p class="physics-note">Ideal projectile model · no air resistance · same launch and landing height. Changing a control restarts the experiment. Space pauses while the canvas is focused.</p></section>`}
export function mountPhysics(root,initial){
 if(!root)return ()=>{};const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d');if(!ctx)return ()=>{};
 const knobs=Object.fromEntries([...root.querySelectorAll('[data-knob]')].map(x=>[x.dataset.knob,x]));knobs.gravity.value=initial;
 let g=initial,speed=12,angle=45,t=0,last=0,frame=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,w=0,h=0,duration=3,spanX=30,spanY=15;
 function sync(){g=+knobs.gravity.value;speed=+knobs.speed.value;angle=+knobs.angle.value;t=0;const f=flight(g,speed,angle),earth=flight(9.81,speed,angle);duration=f?Math.max(f.time,earth.time)*1.12:6;spanX=Math.max(f?.range||speed*6,earth.range)*1.18;spanY=Math.max(f?.height||speed*Math.sin(angle*Math.PI/180)*6,earth.height)*1.35;
 root.querySelector('[data-read="gravity"]').textContent=`${g.toFixed(2)} m/s²`;root.querySelector('[data-read="speed"]').textContent=`${speed} m/s`;root.querySelector('[data-read="angle"]').textContent=`${angle}°`;
 root.querySelector('.physics-stats').textContent=f?`Flight ${f.time.toFixed(2)} s · Height ${f.height.toFixed(1)} m · Range ${f.range.toFixed(1)} m · ${(f.range/earth.range).toFixed(2)}× Earth’s range`:'Zero gravity: constant velocity. No landing or finite maximum height in this model.';
 root.querySelectorAll('[data-g]').forEach(b=>b.setAttribute('aria-pressed',Math.abs(+b.dataset.g-g)<.006?'true':'false'));draw();}
 function resize(){const r=canvas.getBoundingClientRect();w=r.width;h=r.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);draw()}
 function draw(){if(!w||!h)return;ctx.clearRect(0,0,w,h);const left=35,bottom=h-30,sx=(w-65)/spanX,sy=(h-55)/spanY;ctx.font='10px monospace';ctx.lineWidth=1;
 for(let i=0;i<=4;i++){const x=left+i*(w-65)/4,y=bottom-i*(h-55)/4;ctx.strokeStyle='#ffffff12';ctx.beginPath();ctx.moveTo(x,20);ctx.lineTo(x,bottom);ctx.moveTo(left,y);ctx.lineTo(w-20,y);ctx.stroke();ctx.fillStyle='#a6aec3';ctx.fillText(`${(spanX*i/4).toFixed(0)}m`,x-8,h-10);if(i)ctx.fillText(`${(spanY*i/4).toFixed(0)}`,3,y+3)}
 for(const [gravity,color] of [[9.81,'#8d9cae'],[g,'#ffc2ea']]){const f=flight(gravity,speed,angle),end=f?Math.min(t,f.time):t,a=angle*Math.PI/180;ctx.strokeStyle=color;ctx.lineWidth=gravity===g?2.5:1.5;ctx.beginPath();for(let i=0;i<=100;i++){const at=end*i/100,x=left+speed*Math.cos(a)*at*sx,y=bottom-(speed*Math.sin(a)*at-.5*gravity*at*at)*sy;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();const x=left+speed*Math.cos(a)*end*sx,y=bottom-(speed*Math.sin(a)*end-.5*gravity*end*end)*sy;ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=gravity===g?16:0;ctx.beginPath();ctx.arc(x,y,gravity===g?6:4,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0}
 }
 function tick(now){if(last&&!paused&&!document.hidden)t=Math.min(t+Math.min((now-last)/1000,.05),duration);last=now;draw();frame=requestAnimationFrame(tick)}
 function toggle(){paused=!paused;root.querySelector('[data-lab="pause"]').textContent=paused?'PLAY':'PAUSE'}
 for(const knob of Object.values(knobs))knob.oninput=sync;
 root.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{knobs.gravity.value=b.dataset.g;sync()});root.querySelector('[data-lab="launch"]').onclick=()=>{t=0;paused=false;root.querySelector('[data-lab="pause"]').textContent='PAUSE'};root.querySelector('[data-lab="pause"]').onclick=toggle;canvas.tabIndex=0;canvas.onkeydown=e=>{if(e.code==='Space'){e.preventDefault();toggle()}};
 root.querySelector('[data-lab="pause"]').textContent=paused?'PLAY':'PAUSE';sync();const observer=new ResizeObserver(resize);observer.observe(canvas);resize();frame=requestAnimationFrame(tick);return ()=>{cancelAnimationFrame(frame);observer.disconnect()};
}
