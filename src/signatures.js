import './signatures.css';
import {playSignature} from './signature-music.js';
const NS='http://www.w3.org/2000/svg';
const el=(tag,attrs={})=>{const n=document.createElementNS(NS,tag);for(const [key,value]of Object.entries(attrs))n.setAttribute(key,value);return n};
const load=key=>{try{return JSON.parse(localStorage.getItem(key))}catch{return null}};
const store=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
async function request(options={},query=''){
  const response=await fetch(`/api/signatures${query}`,{...options,headers:{'Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(15000)});
  const data=await response.json();if(!response.ok)throw new Error(data.error||'Could not connect. Please try again.');return data;
}
function ink(svg,strokes){
  svg.replaceChildren();
  for(const stroke of strokes)svg.append(el('polyline',{points:stroke.map(([x,y])=>`${x*800},${y*300}`).join(' '),fill:'none',stroke:'currentColor','stroke-width':2.3,'stroke-linecap':'round','stroke-linejoin':'round'}));
}
export function mountSignatures(){
  const peek=document.createElement('a');peek.className='signature-peek';peek.href='#signature-book';peek.setAttribute('aria-label','Explore the private signature guestbook below');
  peek.innerHTML='<span class="sig-peek-stars" aria-hidden="true">✧ <i>✦</i> ✧</span><span class="sig-peek-copy"><small>WAIT. ONE MORE THING.</small><strong>You were here.</strong></span><span class="sig-peek-action">Leave your mark <b aria-hidden="true">↓</b></span>';
  const section=document.createElement('section');section.id='signature-book';section.className='signature-book';section.setAttribute('aria-labelledby','signature-title');
  section.innerHTML=`<div class="sig-orbit" aria-hidden="true"><span>✧</span></div><div class="sig-inner"><div class="sig-intro"><p class="sig-eyebrow">THE LAST THING. YOUR FIRST MARK.</p><h2 id="signature-title">You were here.<br><em>Leave a little proof.</em></h2><p class="sig-description">A small signature in a big internet. Leave yours in DOCK’s private guestbook — then watch it become something only you could make.</p><div class="sig-total"><strong id="sig-count">—</strong><span>signatures left here<br><small>One shared count. A private collection.</small></span></div><p class="sig-privacy">Only the site owner can view submitted names and signatures. Nothing you draw is shown to other visitors.</p></div><div class="sig-card"><div class="sig-card-top"><span>LEAVE YOUR DIGITAL SIGNATURE</span><span aria-hidden="true">↗</span></div><form id="sig-form"><label class="sig-label" for="sig-name">What should we call you?</label><input id="sig-name" maxlength="60" required autocomplete="nickname" placeholder="Your name or an alias"><div class="sig-modes" role="group" aria-label="Signing method"><button type="button" data-mode="draw" aria-pressed="true">Draw your mark</button><button type="button" data-mode="type" aria-pressed="false">Use my name</button></div><div class="sig-paper"><svg id="sig-pad" viewBox="0 0 800 300" role="img" aria-label="Drawing area. Use a mouse, touch, or pen; choose Use my name for a keyboard alternative."></svg><p class="sig-pad-hint">A finger, a pen, a little personality.</p><span class="sig-typed" hidden></span></div><div class="sig-tools"><span>YOUR MARK, YOUR WAY</span><button type="button" id="sig-undo">Undo</button><button type="button" id="sig-clear">Clear</button></div><label class="sig-consent"><input id="sig-consent" type="checkbox" required><span>I agree to store my name and signature privately with DOCK’s owner. This is a guestbook mark, not a legal signature.</span></label><button class="sig-primary" id="sig-submit" type="submit" disabled>Connecting the guestbook… <span>↗</span></button></form><div id="sig-success" hidden><p class="sig-eyebrow">YOUR INK. YOUR OWN LITTLE UNIVERSE.</p><h3>You’re part of the story.</h3><p id="sig-receipt"></p><svg id="sig-constellation" viewBox="0 0 800 420" role="img" aria-label="A personal star map formed from your signature"></svg><p class="sig-success-note">Your signature became a constellation. Now hear what your mark sounds like.</p><button type="button" class="sig-listen" id="sig-listen" aria-label="Play the melody made from your signature"><span class="sig-listen-icon" aria-hidden="true">♫</span><span><strong>Hear your mark</strong><small>A melody only your signature could make</small></span><span class="sig-listen-arrow" aria-hidden="true">↗</span></button><button type="button" class="sig-primary" id="sig-download">Keep my constellation <span>↓</span></button><button type="button" class="sig-secondary" id="sig-again">Leave another mark</button></div><p id="sig-status" role="status" aria-live="polite">Opening the signature book…</p><button type="button" id="sig-retry" class="sig-secondary" hidden>Reconnect</button></div><footer class="sig-footer"><span>MADE OF WORDS. REMEMBERED BY PEOPLE.</span><a href="#app">Back to the canvas ↑</a><button type="button" id="sig-owner">Owner access</button></footer></div>`;
  document.querySelector('#app').after(peek,section);
  const $=selector=>section.querySelector(selector);const form=$('#sig-form'),pad=$('#sig-pad'),status=$('#sig-status');
  let strokes=[],active=null,mode='draw',ready=false,submitting=false,id=crypto.randomUUID(),saved=null;
  const paint=()=>{ink(pad,strokes);$('.sig-pad-hint').hidden=strokes.length>0||mode==='type';$('.sig-typed').textContent=$('#sig-name').value||'Your name';$('.sig-typed').hidden=mode!=='type';pad.hidden=mode!=='draw'};
  const position=event=>{const box=pad.getBoundingClientRect();return [Math.max(0,Math.min(1,(event.clientX-box.left)/box.width)),Math.max(0,Math.min(1,(event.clientY-box.top)/box.height))]};
  pad.addEventListener('pointerdown',event=>{if(submitting||active!==null||event.button!==0)return;event.preventDefault();if(strokes.length>=100)return;active=event.pointerId;pad.setPointerCapture(active);strokes.push([position(event)]);paint()});
  pad.addEventListener('pointermove',event=>{if(event.pointerId!==active)return;const total=strokes.reduce((n,s)=>n+s.length,0);if(total>=3000)return;const point=position(event);const last=strokes.at(-1).at(-1);if(Math.hypot(point[0]-last[0],point[1]-last[1])>.002){strokes.at(-1).push(point);paint()}});
  const stop=()=>{active=null};pad.addEventListener('pointerup',stop);pad.addEventListener('pointercancel',stop);pad.addEventListener('lostpointercapture',stop);
  $('#sig-name').addEventListener('input',paint);
  section.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{if(submitting)return;mode=button.dataset.mode;section.querySelectorAll('[data-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===button)));paint()}));
  $('#sig-clear').onclick=()=>{if(!submitting){strokes=[];paint()}};$('#sig-undo').onclick=()=>{if(!submitting){strokes.pop();paint()}};
  async function refresh(){
    $('#sig-retry').hidden=true;
    try{const data=await request();ready=true;$('#sig-count').textContent=data.count.toLocaleString();$('#sig-submit').disabled=false;$('#sig-submit').textContent='Leave my signature ↗';status.textContent='Your signature is private. The count is shared.'}
    catch(error){ready=false;$('#sig-submit').disabled=true;$('#sig-submit').textContent='Guestbook unavailable';status.textContent=error.message;$('#sig-retry').hidden=false}
  }
  $('#sig-retry').onclick=refresh;refresh();
  function constellation(record){
    const svg=$('#sig-constellation');svg.replaceChildren();svg.append(el('rect',{width:800,height:420,rx:20,fill:'#111525'}));
    let seed=0;for(const char of record.id)seed=(Math.imul(seed,31)+char.charCodeAt(0))>>>0;
    const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
    for(let i=0;i<65;i++)svg.append(el('circle',{cx:rand()*800,cy:rand()*420,r:rand()*1.2+.3,fill:'#c8c8ef',opacity:.18+rand()*.4}));
    const paths=record.mode==='draw'?record.strokes:[];
    if(paths.length){for(const stroke of paths){svg.append(el('polyline',{points:stroke.map(([x,y])=>`${70+x*660},${60+y*240}`).join(' '),fill:'none',stroke:'#d3b9ff','stroke-width':1.2,opacity:.8,class:'sig-star-line'}));for(let i=0;i<stroke.length;i+=Math.max(1,Math.ceil(stroke.length/14))){const[x,y]=stroke[i];const star=el('circle',{cx:70+x*660,cy:60+y*240,r:2+(i%3),fill:'#ffe2ef',class:'sig-star'});star.style.animationDelay=`${rand()*2}s`;svg.append(star)}}}
    else{const points=Array.from({length:12},()=>[80+rand()*640,75+rand()*220]);svg.append(el('polyline',{points:points.map(p=>p.join(',')).join(' '),fill:'none',stroke:'#cda5ff','stroke-width':1.2,opacity:.65}));for(const[x,y]of points)svg.append(el('circle',{cx:x,cy:y,r:3,fill:'#ffe2ef',class:'sig-star'}));const name=el('text',{x:400,y:206,'text-anchor':'middle',fill:'#fff','font-family':'Georgia,serif','font-style':'italic','font-size':Math.min(45,650/Math.max(record.name.length,1)*1.5)});name.textContent=record.name;svg.append(name)}
    const caption=el('text',{x:400,y:365,'text-anchor':'middle',fill:'#c9bfdc','font-size':14,'font-family':'monospace'});caption.textContent=`DOCK / MARK ${String(record.number).padStart(5,'0')} / ${record.createdAt.slice(0,10)}`;svg.append(caption);
  }
  function success(record){saved=record;form.hidden=true;$('#sig-success').hidden=false;$('#sig-receipt').textContent=`Mark #${record.number.toLocaleString()} · stored privately`;constellation(record);status.textContent='Your signature is safely in the guestbook.'}
  const previous=load('dock-signature-receipt');if(previous?.id&&previous?.number&&previous?.name&&Array.isArray(previous.strokes)&&previous.strokes.length<=100)try{success(previous)}catch{form.hidden=false;$('#sig-success').hidden=true}
  form.onsubmit=async event=>{
    event.preventDefault();if(!ready||submitting)return;
    if(mode==='draw'&&strokes.reduce((n,s)=>n+s.length,0)<5){status.textContent='Draw your mark, or choose Use my name.';return}
    submitting=true;$('#sig-submit').disabled=true;$('#sig-submit').textContent='Saving your mark…';status.textContent='Adding your signature to the private guestbook…';
    const payload={id,name:$('#sig-name').value.trim(),mode,strokes:mode==='draw'?strokes:[],consent:$('#sig-consent').checked};
    try{const data=await request({method:'POST',body:JSON.stringify(payload)});const record={...payload,...data.receipt};store('dock-signature-receipt',record);$('#sig-count').textContent=data.count.toLocaleString();success(record)}catch(error){status.textContent=error.message}finally{submitting=false;$('#sig-submit').disabled=!ready;$('#sig-submit').textContent='Leave my signature ↗'}
  };
  $('#sig-listen').onclick=async()=>{
    if(!saved)return;
    const button=$('#sig-listen');button.disabled=true;button.classList.add('is-playing');status.textContent='Your mark is playing as a melody.';
    try{await playSignature(saved)}catch{status.textContent='Audio is unavailable in this browser.'}
    finally{button.disabled=false;button.classList.remove('is-playing')}
  };
  $('#sig-again').onclick=()=>{id=crypto.randomUUID();form.hidden=false;$('#sig-success').hidden=true;strokes=[];form.reset();paint();$('#sig-name').focus();status.textContent='Make another little memory.'};
  $('#sig-download').onclick=()=>{const svg=$('#sig-constellation').cloneNode(true);svg.setAttribute('xmlns',NS);svg.setAttribute('width','1600');svg.setAttribute('height','840');const blob=new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`DOCK-constellation-${saved.number}.svg`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
  $('#sig-owner').onclick=()=>ownerView(section);
}
function ownerView(section){
  const dialog=document.createElement('dialog');dialog.className='sig-owner-dialog';dialog.innerHTML=`<div class="sig-owner-top"><h2>Your private guestbook</h2><button type="button" class="sig-secondary" id="sig-owner-close">Close ×</button></div><p>Only you can open the archive. Your access key stays in this window and is cleared when you close it.</p><form id="sig-login"><label class="sig-label" for="sig-key">Owner access key</label><input id="sig-key" type="password" required autocomplete="off"><button class="sig-primary">Open private archive ↗</button></form><p id="sig-owner-status" role="status"></p><div id="sig-records"></div><button id="sig-more" class="sig-secondary" hidden>Load more</button>`;section.append(dialog);dialog.showModal();let key='',offset=0,loading=false;
  const $=s=>dialog.querySelector(s);$('#sig-owner-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{key='';dialog.remove()});
  async function read(){
    if(loading)return;loading=true;
    $('#sig-more').disabled=true;$('#sig-owner-status').textContent='Opening your archive…';
    try{const data=await request({headers:{Authorization:`Bearer ${key}`}},`?view=private&offset=${offset}`);if(!dialog.open)return;$('#sig-login').hidden=true;$('#sig-key').value='';$('#sig-owner-status').textContent=`${data.count.toLocaleString()} signatures · visible only to you`;for(const item of data.records){const card=document.createElement('article');card.className='sig-record';const heading=document.createElement('h3');heading.textContent=`#${item.number} · ${item.name}`;const date=document.createElement('p');date.textContent=new Date(item.createdAt).toLocaleString();card.append(heading,date);if(item.mode==='draw'){const svg=el('svg',{viewBox:'0 0 800 300',role:'img','aria-label':`Signature from ${item.name}`});ink(svg,item.strokes);card.append(svg)}else{const signature=document.createElement('p');signature.className='sig-typed-record';signature.textContent=item.name;card.append(signature)}$('#sig-records').append(card)}offset+=data.records.length;$('#sig-more').hidden=offset>=data.count}
    catch(error){if(dialog.open)$('#sig-owner-status').textContent=error.message}finally{loading=false;if(dialog.open)$('#sig-more').disabled=false}
  }
  $('#sig-login').onsubmit=event=>{event.preventDefault();key=$('#sig-key').value;read()};$('#sig-more').onclick=read;
}
