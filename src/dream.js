import './dream.css';
const scenes=[['a warm orange sunset','GOLDEN HOUR','Let the day melt away.'],['northern lights','AFTER DARK','Follow the light.'],['minecraft diamond','ANOTHER WORLD','A little impossible.'],['a pink sky','SOFT LANDING','Stay here a moment.'],['a black sky','MIDNIGHT','Room for a new thought.'],['flowers everywhere','BEGIN AGAIN','Everything blooms.']];
export function startDream(show){
 if(document.querySelector('.dream-deck'))return;
 const deck=document.createElement('section');deck.className='dream-deck';deck.setAttribute('aria-label','Dream scene controls');
 deck.innerHTML='<div class="dream-progress"><i></i></div><div class="dream-story" aria-live="polite"><small></small><strong></strong></div><nav><button data-dream="previous" aria-label="Previous scene">←</button><button data-dream="pause">PAUSE</button><button data-dream="next" aria-label="Next scene">→</button><button data-dream="keep">KEEP THIS WORLD ↗</button></nav>';
 document.body.append(deck);document.body.classList.add('dreaming');let index=0,timer=null,paused=false,elapsed=0,last=performance.now();
 function paint(){show(scenes[index][0]);deck.querySelector('small').textContent=`0${index+1} / 06 · ${scenes[index][1]}`;deck.querySelector('strong').textContent=scenes[index][2];elapsed=0;deck.querySelector('i').style.width='0%'}
 function stop(){clearInterval(timer);document.body.classList.remove('dreaming');deck.remove();document.removeEventListener('keydown',key);document.removeEventListener('pointerdown',outside)}
 function key(e){if(e.key==='Escape')stop();if(e.target.id==='prompt')stop()}
 function outside(e){if(e.target.closest('.search,.topbar,.corner-clock'))stop()}
 deck.onclick=e=>{const action=e.target.closest('[data-dream]')?.dataset.dream;if(action==='keep')stop();if(action==='pause'){paused=!paused;e.target.textContent=paused?'PLAY':'PAUSE'}if(action==='next'||action==='previous'){index=(index+(action==='next'?1:scenes.length-1))%scenes.length;paint()}};
 document.addEventListener('keydown',key);document.addEventListener('pointerdown',outside);paint();
 timer=setInterval(()=>{const now=performance.now(),dt=now-last;last=now;if(paused||document.hidden)return;elapsed+=Math.min(dt,300);deck.querySelector('i').style.width=`${Math.min(elapsed/8000*100,100)}%`;if(elapsed>=8000){index=(index+1)%scenes.length;paint()}},100);
}
