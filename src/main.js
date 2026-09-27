import './style.css';
import {findEmoji} from './emoji-intent.js';
import {calculate} from './math.js';
import {mapShell,mountMap,countryForPrompt} from './maps.js';
import {commands,sparks,slashMatch,parseDice,randomInt,makeDeck,drawCard,handValue,tripDates,saveActivity} from './dock-features.js';
import {localObjectPlan,validateModelPlan,parseDuration,parseRelativeReminderText,parseNaturalList,matchTeaching} from './intent-plan.js';

const app = document.querySelector('#app');
function loadTeachings(){try{const saved=JSON.parse(localStorage.getItem('dock-teachings')||'[]');return Array.isArray(saved)?saved.filter(item=>typeof item?.phrase==='string'&&typeof item?.target==='string').slice(-100):[]}catch{return []}}
const state = { text:'', relativeReminder:null, committed:false, listening:false, notice:'', checked:new Set(), listItems:null, savedList:JSON.parse(localStorage.getItem('dock-list')||'null'), seconds:0, initial:0, running:false, interval:null, colorOverride:null, aiScene:null, aiPending:null, aiUnavailable:false, teachings:loadTeachings(),teachOpen:false,reminders:JSON.parse(localStorage.getItem('dock-reminders')||'[]'),calendarMonth:new Date().getMonth(),calendarYear:new Date().getFullYear(),clockHands:null,clockIdle:null,weather:null,timePlace:null,activity:JSON.parse(localStorage.getItem('dock-activity')||'[]'),suggestionOffset:0,game:null,tripDraft:null };
const teachableTypes=new Set(['emoji','creature','color','sky','sunset','night','aurora','pixel','list','timer','india-map','world-map','trip','calendar','clock','games-hub','game-rps','game-dice','game-blackjack']);
const IST='Asia/Kolkata';
const inIndia=(date,options)=>new Intl.DateTimeFormat('en-IN',{timeZone:IST,...options}).format(date);
const indianNow=()=>{const parts=new Intl.DateTimeFormat('en-GB',{timeZone:IST,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date());return Object.fromEntries(parts.map(p=>[p.type,Number(p.value)]))};
const todayKey=()=>{const n=indianNow();return `${n.year}-${String(n.month).padStart(2,'0')}-${String(n.day).padStart(2,'0')}`};
const displayDate=value=>{const [y,m,d]=value.split('-');return `${d}/${m}/${y}`};
function tripDateControls(key,value,min){const [year,month,day]=value.split('-').map(Number);const now=indianNow();const firstYear=Math.max(2026,now.year);const values={day,month,year};return `<div class="trip-date-parts" data-trip-date="${key}" aria-label="${key==='start'?'Departure':'Return'} date, day month year">${[['day','DAY',Array.from({length:31},(_,i)=>i+1)],['month','MONTH',Array.from({length:12},(_,i)=>i+1)],['year','YEAR',Array.from({length:11},(_,i)=>firstYear+i)]].map(([part,label,options])=>`<label>${label}<select data-trip-part="${part}" data-trip-for="${key}" aria-label="${key==='start'?'Departure':'Return'} ${label.toLowerCase()}">${options.map(n=>`<option value="${n}" ${n===values[part]?'selected':''} ${part==='year'&&n<Number(min.slice(0,4))||part==='month'&&year===Number(min.slice(0,4))&&n<Number(min.slice(5,7))||part==='day'&&year===Number(min.slice(0,4))&&month===Number(min.slice(5,7))&&n<Number(min.slice(8,10))?'disabled':''}>${part==='month'?new Intl.DateTimeFormat('en-GB',{month:'short'}).format(new Date(Date.UTC(2026,n-1,1))):n}</option>`).join('')}</select></label>`).join('')}</div><small class="date-format">DD / MM / YYYY · from ${displayDate(min)}</small>`}
function readTripDate(key){const fields=[...document.querySelectorAll(`[data-trip-for="${key}"]`)];const part=Object.fromEntries(fields.map(x=>[x.dataset.tripPart,Number(x.value)]));if(!part.year||!part.month||!part.day)return null;const date=new Date(Date.UTC(part.year,part.month-1,part.day));if(date.getUTCFullYear()!==part.year||date.getUTCMonth()!==part.month-1||date.getUTCDate()!==part.day)return null;return `${part.year}-${String(part.month).padStart(2,'0')}-${String(part.day).padStart(2,'0')}`}
function draggableWords(html){return html.split(/(<[^>]+>)/g).map(chunk=>chunk.startsWith('<')?chunk:chunk.split(/(\s+)/g).map(token=>/^\s*$/.test(token)?token:`<span class="drag-word">${token}</span>`).join('')).join('')}
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = value => new Intl.NumberFormat('en-IN',{maximumFractionDigits:2}).format(value);
const icon = (name,size=19) => {
  const paths={arrow:'M5 12h14m-6-6 6 6-6 6',mic:'M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm-7-4a7 7 0 0 0 14 0M12 18v3m-4 0h8',stop:'M8 8h8v8H8z',spark:'m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2Z',copy:'M8 8h12v13H8zM4 16V4h12',check:'m5 12 4 4L19 6',play:'m8 5 11 7-11 7V5Z',pause:'M8 5v14m8-14v14',refresh:'M20 11a8 8 0 1 0-2.4 6M20 4v7h-7',close:'M5 5l14 14M19 5 5 19',plus:'M12 5v14M5 12h14',trash:'M4 7h16M9 7V4h6v3m-9 0 1 14h10l1-14M10 11v6m4-6v6'};
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]}"/></svg>`;
};
const palettes={orange:['#ffbd64','#fc6d4c','#673579'],pink:['#ffb4da','#e96fb1','#683c9a'],blue:['#92d9ff','#5b82ef','#242e80'],purple:['#d8aaff','#855bd5','#302479'],red:['#ffa29a','#ed585e','#732a54'],yellow:['#ffeba4','#f6bd59','#ac5d65'],green:['#b9efa8','#68c9ad','#276b88'],black:['#71788e','#33354d','#11121d'],white:['#f9eddf','#d3d7eb','#8c91a4']};
const uniquePalette = text => {let hash=2166136261;for(const char of text){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619)}const hue=(hash>>>0)%360;return [`hsl(${hue} 82% 72%)`,`hsl(${(hue+42)%360} 75% 55%)`,`hsl(${(hue+155)%360} 45% 25%)`]};
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
function colourValues(value){
  const canvas=document.createElement('canvas');
  const context=canvas.getContext('2d');
  context.fillStyle=value;
  const hex=context.fillStyle;
  const normalized=hex.length===4?`#${[...hex.slice(1)].map(x=>x+x).join('')}`:hex;
  const rgb=[1,3,5].map(i=>parseInt(normalized.slice(i,i+2),16)/255);
  const max=Math.max(...rgb),min=Math.min(...rgb),delta=max-min;
  let hue=0;
  if(delta){const index=rgb.indexOf(max);hue=index===0?((rgb[1]-rgb[2])/delta)%6:index===1?(rgb[2]-rgb[0])/delta+2:(rgb[0]-rgb[1])/delta+4;hue=(hue*60+360)%360}
  const light=(max+min)/2;
  const saturation=delta?delta/(1-Math.abs(2*light-1)):0;
  return {h:Math.round(hue),s:Math.round(saturation*100),l:Math.round(light*100)};
}
const shadePalette=({h,s,l})=>[`hsl(${h} ${clamp(s+5,0,100)}% ${clamp(l+22,4,94)}%)`,`hsl(${h} ${s}% ${clamp(l,4,94)}%)`,`hsl(${h} ${clamp(s-10,0,100)}% ${clamp(l-29,3,75)}%)`];
const mixerColour=({h,s,l})=>`hsl(${h} ${s}% ${l}%)`;
const hslToHex=({h,s,l})=>{const a=s/100*Math.min(l/100,1-l/100);const channel=n=>{const k=(n+h/30)%12;return Math.round(255*(l/100-a*Math.max(-1,Math.min(k-3,9-k,1)))).toString(16).padStart(2,'0')};return `#${channel(0)}${channel(8)}${channel(4)}`};
function glyphForColour(colour,values){
  if(/black|navy|charcoal/i.test(colour))return '🌑';
  if(/white|ivory|cream/i.test(colour))return '☁️';
  if(/brown|beige|tan/i.test(colour))return '🍂';
  const h=values.h;
  return h<16||h>=345?'❤️':h<46?'🍊':h<75?'🌻':h<160?'🍀':h<196?'🧊':h<255?'🦋':h<295?'🪻':'🌸';
}
function pickColour(text){
  const hex=text.match(/#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/i)?.[0];
  if(hex)return hex;
  const names=['pink','red','orange','yellow','green','blue','purple','violet','indigo','cyan','teal','turquoise','magenta','maroon','navy','gold','silver','brown','black','white','grey','gray','lavender','coral','crimson','scarlet','peach','mint','beige'];
  return names.find(name=>new RegExp(`\\b${name}\\b`,'i').test(text))||text.toLowerCase().match(/[a-z]+/g)?.find(word=>word.length>2&&CSS.supports('color',word)&&!['transparent','inherit','initial','currentcolor'].includes(word))||null;
}
function parsePalette(text){
  const colours=text.match(/#[0-9a-f]{3,8}\b|hsla?\([^)]*\)/gi);
  if(!colours||!colours.length||colours.length>3||text.replace(/#[0-9a-f]{3,8}\b|hsla?\([^)]*\)/gi,'').replace(/[\s,;]+/g,''))return null;
  if(!colours.every(colour=>CSS.supports('color',colour)))return null;
  const values=colourValues(colours[0]);
  return {type:'color',name:'Your palette',palette:colours.length===3?colours:shadePalette(values),values,emoji:glyphForColour(colours[0],values)};
}
const objects=[
  {re:/\beggs?\b|omelette|breakfast/i,emoji:'🥚',name:'Eggscape',bg:'#ffe4ef',ink:'#48243a'},
  {re:/\bpizza\b/i,emoji:'🍕',name:'Pizza party',bg:'#ffe0bc',ink:'#5d2f25'},
  {re:/\bcoffee\b|espresso/i,emoji:'☕',name:'Coffee break',bg:'#cba478',ink:'#382419'},
  {re:/\bhearts?\b|\blove\b/i,emoji:'💗',name:'Love notes',bg:'#ffb8d6',ink:'#5b2140'},
  {re:/\bflowers?\b|dais(y|ies)/i,emoji:'🌼',name:'Flower field',bg:'#ffeda7',ink:'#463913'},
  {re:/\bstars?\b|galaxy|space/i,emoji:'✨',name:'Star field',bg:'#211a49',ink:'#f8eaff'},
  {re:/\brain\b|storm/i,emoji:'💧',name:'Rain room',bg:'#8cbbe2',ink:'#1a3454'},
  {re:/\bfire\b|flames?/i,emoji:'🔥',name:'Firelight',bg:'#f0a274',ink:'#542722'}
];
const animals=new Set(['rabbit','bunny','dog','cat','fox','wolf','lion','tiger','bear','panda','horse','cow','pig','sheep','goat','elephant','giraffe','zebra','monkey','gorilla','deer','mouse','rat','squirrel','hedgehog','koala','kangaroo','chicken','duck','owl','eagle','parrot','penguin','flamingo','fish','shark','whale','dolphin','octopus','crab','turtle','frog','snake','lizard','butterfly','bee','ladybug','ant','spider','dragon']);
const titleCase=text=>text.replace(/\b\w/g,match=>match.toUpperCase());
function parseList(text){
  const natural=parseNaturalList(text);
  if(natural)return {items:natural,shopping:true};
  const prefix=text.match(/^\s*(?:(?:make|create)\s+(?:me\s+)?(?:a\s+)?(?:shopping\s+|grocery\s+|to[ -]?do\s+)?list(?:\s+of)?|(?:a\s+)?(?:shopping|grocery|to[ -]?do)\s+list|(?:a\s+)?list|buy|shop\s+for|pick\s+up|get|remember\s+to|i\s+need\s+to)\s*:?\s*/i);
  if(!prefix)return null;
  const body=text.slice(prefix[0].length).replace(/^\s*(?:(?:with|of)\s+)?\d+\s+(?:items?|things?)\s*:?(?:\s+like)?\s*/i,'').trim();
  if(!body)return {items:[],shopping:/buy|shop|grocery|pick up|get/i.test(prefix[0])};
  let items=body.split(/\s*(?:,|;|\band\b)\s*/i).map(item=>item.replace(/[.!?]+$/,'').trim()).filter(Boolean);
  if(items.length===1){const words=body.split(/\s+/);if(words.length>=2&&words.length<=6&&words.every(word=>findEmoji(word)))items=words}
  return {items,shopping:/buy|shop|grocery|pick up|get/i.test(prefix[0])};
}
function parseReminder(text){
  const match=text.match(/^\s*(?:remind me(?: to)?\s+)?(.+?)\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?(?:\s+on\s+(next\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday))?(\s+with\s+.+)?\s*$/i);
  if(!match||(!/^\s*remind me\b/i.test(text)&&!/(?:dinner|lunch|breakfast|meeting|call|appointment|reservation|booking|class|event|reminder)/i.test(match[1])))return null;
  const hour=Number(match[2]),minute=Number(match[3]||0),meridian=match[4]?.toLowerCase();
  if(hour>23||minute>59||(meridian&&hour>12))return null;
  const hours=meridian?(hour%12)+(meridian==='pm'?12:0):!meridian&&/\b(?:dinner|supper)\b/i.test(match[1])&&hour<12?hour+12:!meridian&&/\blunch\b/i.test(match[1])&&hour<=3?hour+12:hour;
  const now=indianNow();
  const day=new Date(Date.UTC(now.year,now.month-1,now.day));
  if(match[6]){const weekday=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'].indexOf(match[6].toLowerCase());let gap=(weekday-day.getUTCDay()+7)%7;if(match[5]&&gap===0)gap=7;day.setUTCDate(day.getUTCDate()+gap)}
  let when=Date.UTC(day.getUTCFullYear(),day.getUTCMonth(),day.getUTCDate(),hours,minute)-19800000;
  if(when<=Date.now())when+=match[6]?7*86400000:86400000;
  return {label:(match[1]+(match[7]||'')).trim(),when};
}
function detect(input,skipMemory=false){
  const text=input.trim(), lower=text.toLowerCase();
  if(!skipMemory){const teaching=matchTeaching(lower,state.teachings);if(teaching){const remembered=detect(teaching.target,true);if(remembered.type!=='search'&&remembered.type!=='idle')return {...remembered,remembered:true,learnedFrom:teaching.phrase,similar:teaching.similar}}}
  const slash=commands.find(c=>`/${c.label.toLowerCase()}`===lower);if(slash)return detect(slash.prompt);
  if(/^trip\s+(?:to|in)\s+(.+)/i.test(text))return {type:'trip',name:'Plan a trip',place:text.match(/^trip\s+(?:to|in)\s+(.+)/i)[1].trim()};
  if(/^(?:games|play games)$/i.test(text))return {type:'games-hub',name:'Games'};
  if(/^(?:rock paper scissors|rps|play rock paper scissors)$/i.test(text))return {type:'game-rps',name:'Rock paper scissors'};
  if(/^(?:blackjack|play blackjack|21 cards)$/i.test(text))return {type:'game-blackjack',name:'Blackjack'};
  const dice=parseDice(text);if(dice)return {type:'game-dice',name:'Dice',...dice};
  if(!text)return {type:'idle',name:'Blank canvas'};
  const pastedPalette=parsePalette(text);
  if(pastedPalette)return pastedPalette;
  if(/\b(?:india|indian)\b.*\bmap\b|\bmap\b.*\b(?:india|indian)\b/.test(lower))return {type:'india-map',name:'India atlas'};
  const country=countryForPrompt(text);if(country)return {type:'world-map',name:'Country atlas',country};
  if(/\b(?:world map|globe|map of the world|map of countries|countries and capitals|world capitals)\b/.test(lower))return {type:'world-map',name:'World atlas'};
  if(/\b(?:flag|flags|tricolou?r)\b/.test(lower))return {type:'flag',name:'Flag search',query:text};
  if(/^(?:hey+|hi+|hello+|hiya|namaste|good morning|good afternoon|good evening|good night|how are (?:you|u)|what'?s up|sup|thanks|thank you|bye|goodbye)[!?. ]*$/i.test(text))return {type:'greeting',name:'Hello',query:lower};
  const weatherMatch=lower.match(/^(?:(?:what(?:'s| is) the |how(?:'s| is) the )?weather|temperature|is it raining|is it windy|rain forecast|wind forecast)\s*(?:(?:like\s*)?(?:in|at|for)\s+(.+?))?[?!. ]*$/i);
  if(weatherMatch)return {type:'weather',name:'Live weather',place:(weatherMatch[1]||'').trim(),data:state.weather?.query===text?state.weather.data:null,error:state.weather?.query===text?state.weather.error:null};
  const timeMatch=lower.match(/^(?:what time is it|what(?:'s| is) the time|current time|time)\s+(?:in|at)\s+(.+?)\??$/i);
  if(timeMatch)return {type:'place-time',name:'World time',place:timeMatch[1].replace(/[?!.]+$/,'').trim(),data:state.timePlace?.query===text?state.timePlace.data:null,error:state.timePlace?.query===text?state.timePlace.error:null};
  const relativeReminder=parseRelativeReminderText(text);
  if(relativeReminder){
    if(state.relativeReminder?.query!==text)state.relativeReminder={query:text,when:Date.now()+relativeReminder.seconds*1000};
    return {type:'reminder',name:'Reminder',label:relativeReminder.label,when:state.relativeReminder.when};
  }
  const timerSeconds=parseDuration(text);
  if(timerSeconds&&/timer|focus|countdown|meditat|study|break|\b\d+\s*(?:min|sec|hr)/.test(lower))return {type:'timer',name:'Focus mode',seconds:timerSeconds};
  const split=lower.match(/(?:split|divide|share)\s*[₹$]?\s*([\d,]+(?:\.\d+)?)\s*(?:between|among|by|with)\s*(\d+)/);
  if(split&&Number(split[2])>0)return {type:'split',name:'Fair split',amount:Number(split[1].replace(/,/g,'')),people:Number(split[2])};
  const calc=calculate(text);
  if(calc)return {type:'calc',name:'Instant answer',...calc};
  const list=parseList(text);
  if(list)return {type:'list',name:list.shopping?'Shopping checklist':'Quick checklist',items:list.items};
  const reminder=parseReminder(text);
  if(reminder)return {type:'reminder',name:'Reminder',...reminder};
  if(/^(?:show (?:me )?(?:the )?)?(?:calendar|my calendar|schedule|my schedule|reminders)$/.test(lower))return {type:'calendar',name:'Calendar'};
  if(/^(?:show (?:me )?(?:the )?)?(?:clock|current time|time now)$|^what(?:'s| is) the time\??$|^what time is it\??$/i.test(text))return {type:'clock',name:'Live clock'};
  if(/\b(?:northern lights|aurora(?: borealis)?)\b/.test(lower))return {type:'aurora',name:'Northern lights',palette:['#75e5be','#5f71bd','#101637']};
  if(/\bsky\b/.test(lower)){
    const skyColour=pickColour(text);
    if(skyColour&&/^(?:black|navy|indigo)$/.test(skyColour))return {type:'night',name:'Black sky',palette:['#121b34','#080e20','#02040d']};
    if(skyColour){const values=state.colorOverride??colourValues(skyColour);return {type:'sky',name:`${titleCase(skyColour)} sky`,palette:shadePalette(values),values}}
  }
  if(/\b(?:black|dark|night|starless)\s+sky\b|\bsky\s+at\s+night\b/.test(lower))return {type:'night',name:'Black sky',palette:['#121b34','#080e20','#02040d']};
  if(/\bminecraft\b.*\bdiamond\b|\bdiamond\b.*\bminecraft\b/.test(lower)){const values=state.colorOverride??{h:181,s:72,l:43};return {type:'pixel',name:'Minecraft diamond',palette:shadePalette(values),values}}
  if(/sunset|sunrise|golden hour|dusk|dawn/.test(lower))return {type:'sunset',name:/sunrise|dawn/.test(lower)?'First light':'Golden hour',palette:/purple/.test(lower)?palettes.purple:/pink/.test(lower)?palettes.pink:palettes.orange};
  const objectPlan=localObjectPlan(text);
  if(objectPlan){const values=state.colorOverride??colourValues(objectPlan.colour);return {type:animals.has(objectPlan.subject)?'creature':'emoji',name:`${titleCase(objectPlan.colour)} ${objectPlan.subject}`,subject:objectPlan.subject,emoji:objectPlan.emoji,coloured:true,palette:shadePalette(values),values,bg:shadePalette(values)[0],ink:'#24182d'}}
  const preferredSubject=findEmoji(text);
  if(preferredSubject?.animal||preferredSubject?.subject==='milk'){
    const objectColour=pickColour(text),values=objectColour?state.colorOverride??colourValues(objectColour):null;
    return {type:preferredSubject.animal?'creature':'emoji',name:`${titleCase(preferredSubject.subject)} world`,subject:preferredSubject.subject,emoji:preferredSubject.emoji,bg:preferredSubject.animal?uniquePalette(preferredSubject.subject)[2]:'#f2ebe2',ink:preferredSubject.animal?'#fff6f5':'#33233f',coloured:!!values,palette:values?shadePalette(values):null,values};
  }
  const object=lower.match(/[a-z]+/g)?.length<=4||/\b(?:everywhere|wallpaper|background)\b/.test(lower)?objects.find(x=>x.re.test(lower)):null;
  if(object){const objectColour=pickColour(text),values=objectColour?state.colorOverride??colourValues(objectColour):null;return {type:'emoji',...object,coloured:!!values,palette:values?shadePalette(values):null,values}}
  const found=findEmoji(text);
  if(found){const objectColour=pickColour(text);const values=objectColour?state.colorOverride??colourValues(objectColour):null;return {type:found.animal?'creature':'emoji',name:found.animal?`${titleCase(found.subject)} world`:`${titleCase(found.subject)} scene`,subject:found.subject,emoji:found.emoji,bg:found.animal?uniquePalette(found.subject)[2]:found.subject==='milk'?'#f2ebe2':uniquePalette(found.subject)[0],ink:found.animal?'#fff6f5':'#33233f',coloured:!!values,palette:values?shadePalette(values):null,values}}
  const colour=pickColour(text);
  const colourOnly=colour&&lower.replace(new RegExp(`\\b${colour}\\b`,'i'),'').replace(/\b(?:a|the|make|it|my|show|me|please|pure|deep|bright|dark|light)\b/g,'').trim()==='';
  if(colour&&(colourOnly||/\b(?:colou?r|shade|palette|background|wallpaper)\b/.test(lower))){const values=state.colorOverride??colourValues(colour);return {type:'color',name:`${titleCase(colour)} colour`,palette:shadePalette(values),values,emoji:glyphForColour(colour,values)}}
  if(/ocean|sea|beach|water/.test(lower))return {type:'color',name:'Blue hour',palette:palettes.blue};
  if(state.aiScene?.query===text){const plan=state.aiScene.plan;return {type:plan.action==='answer'?'ai-answer':'ai-visual',name:'Made for this prompt',palette:plan.colors||uniquePalette(text),title:plan.title||titleCase(plan.subject)||'Your idea',description:plan.description,emoji:plan.emoji,query:text}}
  return {type:'search',name:'Explore this',palette:uniquePalette(lower),query:text};
}
const diamondArtwork=className=>`<svg class="${className}" viewBox="0 0 280 280" aria-hidden="true" shape-rendering="crispEdges"><path fill="#135866" d="M82 24h116v24h34v34h24v116h-24v34h-34v24H82v-24H48v-34H24V82h24V48h34z"/><path fill="#48e7e6" d="M82 48h116v34h34v116h-34v34H82v-34H48V82h34z"/><path fill="#b6ffff" d="M82 48h116v34H82zM48 82h34v116H48zM82 82h34v34H82z"/><path fill="#20aeba" d="M198 82h34v116h-34zM82 198h116v34H82zM116 116h82v82h-82z"/><path fill="#6ff9ee" d="M116 82h82v34h-82zM82 116h34v82H82z"/><path fill="#fff" d="M82 82h34v34H82z"/></svg>`;
function environment(scene){
  if(scene.type==='india-map'||scene.type==='world-map')return '<div class="atlas-ambient"></div><div class="grid-pattern"></div>';
  if(scene.type==='weather'){
    const condition=scene.data?.condition||'cloudy';
    const particles=condition==='rainy'?Array.from({length:52},(_,i)=>`<i style="--n:${i};--speed:${1+i%5*.2}s"></i>`).join(''):condition==='windy'?Array.from({length:22},(_,i)=>`<i style="--n:${i};--speed:${2+i%6*.3}s"></i>`).join(''):'';
    return `<div class="weather-glow"></div><div class="weather-particles ${condition}">${particles}</div>`;
  }
  if(scene.type==='sunset')return '<div class="sun-glow"></div><div class="sun-disc"></div><div class="horizon"></div><div class="reflection"></div><div class="cloud cloud-a"></div><div class="cloud cloud-b"></div>';
  if(scene.type==='night')return '<div class="night-haze"></div><div class="night-stars"></div><div class="night-horizon"></div>';
  if(scene.type==='sky')return '<div class="sky-cloud sky-cloud-a"></div><div class="sky-cloud sky-cloud-b"></div><div class="sky-glow"></div>';
  if(scene.type==='aurora')return '<div class="aurora-light aurora-a"></div><div class="aurora-light aurora-b"></div><div class="aurora-light aurora-c"></div><div class="night-stars"></div>';
  if(scene.type==='pixel')return `<div class="pixel-halo"></div>${diamondArtwork('pixel-diamond')}<div class="pixel-ground"></div>`;
  if(scene.type==='ai-visual'&&scene.emoji){const columns=Math.ceil(window.innerWidth*1.5/90),rows=Math.ceil(window.innerHeight*1.5/85);return `<div class="emoji-field" aria-hidden="true" style="--columns:${columns}">${Array.from({length:columns*rows},(_,i)=>`<span style="--delay:${i%columns*.025}s">${esc(scene.emoji)}</span>`).join('')}</div>`}
  if(scene.type==='ai-visual'||scene.type==='ai-answer')return '<div class="colour-orb orb-a"></div><div class="colour-orb orb-b"></div><div class="colour-orb orb-c"></div>';
  if(scene.type==='emoji'||scene.type==='creature'){
    const columns=Math.ceil(window.innerWidth*1.5/90);
    const rows=Math.ceil(window.innerHeight*1.5/85);
    return `<div class="emoji-field" aria-hidden="true" style="--columns:${columns}">${Array.from({length:columns*rows},(_,i)=>`<span style="--delay:${i%columns*.025}s;--drift:${(i%5)-2}">${esc(scene.emoji)}</span>`).join('')}</div><div class="emoji-spotlight" aria-hidden="true"><span>${esc(scene.emoji)}</span><i></i><i></i></div>`;
  }
  if(scene.type==='color')return `<div class="colour-orb orb-a"></div><div class="colour-orb orb-b"></div><div class="colour-orb orb-c"></div>${scene.emoji?`<div class="emoji-spotlight colour-spotlight" aria-hidden="true"><span>${esc(scene.emoji)}</span><i></i><i></i></div>`:''}`;
  if(scene.type==='search'||scene.type==='greeting'||scene.type==='flag'||scene.type==='place-time')return '<div class="colour-orb orb-a"></div><div class="colour-orb orb-b"></div><div class="colour-orb orb-c"></div>';
  if(scene.type==='reminder'||scene.type==='clock'||scene.type==='calendar')return '<div class="time-ring r1"></div><div class="time-ring r2"></div><div class="time-ring r3"></div>';
  if(scene.type==='timer')return '<div class="time-ring r1"></div><div class="time-ring r2"></div><div class="time-ring r3"></div>';
  if(scene.type==='split'||scene.type==='calc')return '<div class="big-symbol">÷</div><div class="big-symbol second">×</div>';
  return '<div class="idle-orb idle-a"></div><div class="idle-orb idle-b"></div><div class="idle-orb idle-c"></div><div class="grid-pattern"></div>';
}
const clock=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
function decoratedPrompt(scene){
  if(scene.type!=='list')return esc(state.text);
  const items=state.listItems??scene.items;
  const lower=state.text.toLowerCase();
  let offset=0,html='';
  for(const [index,item] of items.entries()){
    const start=lower.indexOf(item.toLowerCase(),offset);
    if(start<0)continue;
    html+=esc(state.text.slice(offset,start));
    const match=esc(state.text.slice(start,start+item.length));
    html+=state.checked.has(index)?`<span class="prompt-crossed">${match}</span>`:match;
    offset=start+item.length;
  }
  return html+esc(state.text.slice(offset));
}
function mixerPanel(values){
  return `<details class="colour-mixer" open><summary>COLOUR MIXER <span>ADJUST THE BACKGROUND ↗</span></summary><div class="mixer-grid"><label class="picker-label">PICK A COLOUR<input id="mixer-picker" type="color" value="${hslToHex(values)}" aria-label="Pick a colour"></label>${[['h','HUE',360],['s','SATURATION',100],['l','LIGHTNESS',100]].map(([key,label,max])=>`<label class="mixer-slider">${label}<output data-value="${key}">${values[key]}${key==='h'?'°':'%'}</output><input data-mix="${key}" type="range" min="0" max="${max}" value="${values[key]}" aria-label="${label.toLowerCase()}"></label>`).join('')}</div><button class="mixer-reset" data-action="mixer-reset">RESET TO PROMPT COLOUR</button></details>`;
}
function upsertActivity(item){state.activity=[item,...state.activity.filter(x=>x.id!==item.id)].slice(0,40);saveActivity(state.activity)}
function removeActivity(id){state.activity=state.activity.filter(x=>x.id!==id);saveActivity(state.activity)}
function queuePanel(){
  const upcoming=state.reminders.filter(x=>!x.fired).map(x=>({id:`reminder-${x.id}`,type:'appointment',title:x.label,detail:inIndia(new Date(x.when),{weekday:'short',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})}));
  const timers=state.activity.filter(x=>x.type==='timer'&&x.status!=='done');
  const trips=state.activity.filter(x=>x.type==='trip'&&x.end>=todayKey()).map(x=>({...x,type:'appointment',detail:`${displayDate(x.start)} → ${displayDate(x.end)}`}));
  const items=[...timers,...upcoming,...trips].slice(0,12);
  return `<aside class="activity-rail" aria-label="Your plans"><div class="rail-heading"><span>YOUR PLANS</span><b>${items.length}</b></div><button class="rail-saved-list" data-action="saved-list">☷ &nbsp; MY LIST <span>↗</span></button>${items.length?`<div class="rail-items">${items.map(item=>`<article class="rail-item"><span class="rail-icon">${item.type==='timer'?'◴':item.id.startsWith('trip-')?'✈':'▦'}</span><div><strong>${esc(item.title)}</strong><small>${esc(item.type==='timer'&&item.status==='running'?clock(Math.max(0,Math.ceil((item.endsAt-Date.now())/1000))):item.detail||item.status||'Saved')}</small></div><button data-queue-open="${esc(item.id)}" aria-label="Open ${esc(item.title)}">↗</button>${!item.id.startsWith('reminder-')?`<button data-queue-remove="${esc(item.id)}" aria-label="Remove ${esc(item.title)}">×</button>`:''}</article>`).join('')}</div>`:'<p class="rail-empty">Timers and appointments will appear here.</p>'}</aside>`
}
function commandPicker(){const matches=slashMatch(state.text);return matches.length?`<div class="command-picker" role="listbox" aria-label="DOCK commands"><div class="command-heading">${matches.length} THINGS TO MAKE / TYPE TO FILTER · SCROLL FOR MORE</div>${matches.map((c,i)=>`<button role="option" aria-selected="${i===0}" data-command="${esc(c.prompt)}"><span>${c.icon}</span><strong>${esc(c.label)}</strong><small>${esc(c.hint)}</small><i>↗</i></button>`).join('')}</div>`:''}
function reminderList(){
  const upcoming=state.reminders.filter(item=>!item.fired).sort((a,b)=>a.when-b.when).slice(0,5);
  return upcoming.length?`<div class="upcoming"><small>UPCOMING REMINDERS</small>${upcoming.map(item=>`<div class="upcoming-row"><span>${esc(item.label)} <b>${new Date(item.when).toLocaleString(undefined,{weekday:'short',hour:'numeric',minute:'2-digit'})}</b></span><button data-remove-reminder="${item.id}" aria-label="Remove reminder ${esc(item.label)}">${icon('close',15)}</button></div>`).join('')}</div>`:'';
}
function calendarPanel(){
  const first=new Date(Date.UTC(state.calendarYear,state.calendarMonth,1));
  const offset=first.getUTCDay();
  const days=new Date(Date.UTC(state.calendarYear,state.calendarMonth+1,0)).getUTCDate();
  const today=indianNow();
  const cells=Array.from({length:offset+days},(_,i)=>{
    const day=i-offset+1;if(day<1)return '<span class="calendar-empty"></span>';
    const events=state.reminders.filter(item=>{const d=indianNowFor(item.when);return d.year===state.calendarYear&&d.month===state.calendarMonth+1&&d.day===day});
    const isToday=today.year===state.calendarYear&&today.month===state.calendarMonth+1&&today.day===day;
    const dateKey=`${state.calendarYear}-${String(state.calendarMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const range=state.tripDraft&&dateKey>=state.tripDraft.start&&dateKey<=state.tripDraft.end;
    return `<button class="calendar-day ${isToday?'today':''} ${events.length?'has-events':''} ${range?'trip-range':''}" data-calendar-day="${day}" aria-label="${day} ${inIndia(first,{month:'long'})}, ${events.length} events"><b>${day}</b>${events.length?`<i>${events.length}</i>`:''}</button>`;
  }).join('');
  const month=first.toLocaleString('en-IN',{month:'long',timeZone:'UTC'});
  return `<div class="calendar"><div class="calendar-heading"><h3>${month} ${state.calendarYear}</h3><div><button data-calendar-nav="-1" aria-label="Previous month">←</button><button data-calendar-nav="1" aria-label="Next month">→</button></div></div><div class="calendar-grid">${['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d=>`<small>${d}</small>`).join('')}${cells}</div></div>`;
}
function indianNowFor(timestamp){const p=new Intl.DateTimeFormat('en-GB',{timeZone:IST,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(timestamp));return Object.fromEntries(p.map(x=>[x.type,Number(x.value)]))}
function analogClock(){return `<div class="analog-wrap"><svg class="analog-clock" viewBox="0 0 240 240" role="img" aria-label="Interactive clock, India Standard Time. Drag the hands; they reset after 3 seconds of inactivity."><circle class="clock-face" cx="120" cy="120" r="107"/>${Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return `<text x="${120+89*Math.sin(a)}" y="${124-89*Math.cos(a)}" text-anchor="middle">${i||12}</text>`}).join('')}<line class="clock-hand hour" data-hand="hour" x1="120" y1="132" x2="120" y2="65"/><line class="clock-hand minute" data-hand="minute" x1="120" y1="136" x2="120" y2="39"/><line class="clock-hand second" data-hand="second" x1="120" y1="145" x2="120" y2="30"/><circle cx="120" cy="120" r="5" fill="currentColor"/></svg></div>`}
function saveList(scene){
  if(scene.type!=='list'||!state.text.trim())return;
  state.savedList={text:state.text,items:[...(state.listItems??scene.items)],checked:[...state.checked]};
  localStorage.setItem('dock-list',JSON.stringify(state.savedList));
}
function result(scene){
  const label=`<div class="result-label"><span class="live-dot"></span>${esc(scene.name.toUpperCase())}<span>${scene.remembered?`<button class="forget-teaching" data-action="forget-teaching" data-learned-from="${esc(scene.learnedFrom)}" aria-label="Forget this interpretation">${scene.similar?'LEARNED MATCH':'REMEMBERED'} · FORGET ↗</button>`:'/ LIVE OBJECT 001'}</span></div>`;
  if(scene.type==='india-map'||scene.type==='world-map')return mapShell(scene.type);
  if(scene.type==='trip'){const [start,end]=state.tripDraft?.place===scene.place?[state.tripDraft.start,state.tripDraft.end]:tripDates();const minimum=todayKey();return `<section class="result-card trip-card">${label}<div class="trip-title"><div><h2>Plan a trip to ${esc(scene.place)}.</h2><p>Choose your dates and keep the plan in Your Plans.</p></div><span>✈</span></div><div class="trip-dates"><div>${tripDateControls('start',start,minimum)}</div><span>→</span><div>${tripDateControls('end',end,start)}</div></div><p class="trip-error" role="alert"></p><button class="primary-button" data-action="save-trip">SAVE TRIP</button><div class="trip-calendar-label">YOUR TRAVEL DATES</div>${calendarPanel()}</section>`}
  if(scene.type==='games-hub')return `<section class="result-card game-card">${label}<h2>Pick a little game.</h2><p>Three quick games to play right here.</p><div class="game-hub">${[['✊','Rock paper scissors','rock paper scissors'],['♠','Blackjack','blackjack'],['⚄','Dice','roll 2d6']].map(([icon,title,prompt])=>`<button data-command="${prompt}"><span>${icon}</span><strong>${title}</strong><i>↗</i></button>`).join('')}</div></section>`;
  if(scene.type==='game-dice')return `<section class="result-card game-card">${label}<h2>Roll ${scene.count}d${scene.sides}.</h2><p>Just for fun. No wagers.</p><div class="dice-values">${state.game?.type==='dice'?state.game.rolls.map(n=>`<b>${n}</b>`).join(''):'<b>?</b>'}</div><strong class="game-total">${state.game?.type==='dice'?`TOTAL ${state.game.rolls.reduce((a,b)=>a+b,0)}`:'READY WHEN YOU ARE'}</strong><button class="primary-button" data-action="roll-dice">ROLL THE DICE</button></section>`;
  if(scene.type==='game-rps')return `<section class="result-card game-card">${label}<h2>Rock · paper · scissors</h2><p>Choose a hand. DOCK chooses at the same time.</p><div class="game-choices">${['rock','paper','scissors'].map((v,i)=>`<button data-rps="${v}">${['✊','✋','✌️'][i]}<span>${v}</span></button>`).join('')}</div>${state.game?.type==='rps'?`<div class="game-result">You chose ${esc(state.game.you)} · DOCK chose ${esc(state.game.dock)}<strong>${esc(state.game.outcome)}</strong></div>`:''}</section>`;
  if(scene.type==='game-blackjack'){const game=state.game?.type==='blackjack'?state.game:null;return `<section class="result-card game-card">${label}<h2>Blackjack</h2><p>Draw to 21 without going over. Cards are for fun only.</p>${game?`<div class="card-hands"><div><small>DEALER · ${game.status==='playing'?'?':handValue(game.dealer)}</small><div>${game.dealer.map((c,i)=>`<span class="playing-card">${game.status==='playing'&&i===1?'?':`${c.rank}${c.suit}`}</span>`).join('')}</div></div><div><small>YOU · ${handValue(game.player)}</small><div>${game.player.map(c=>`<span class="playing-card">${c.rank}${c.suit}</span>`).join('')}</div></div></div>${game.status!=='playing'?`<strong class="game-result">${esc(game.status)}</strong>`:''}`:''}<div class="game-actions">${!game||game.status!=='playing'?'<button class="primary-button" data-action="deal">NEW HAND</button>':`<button class="primary-button" data-action="hit">HIT</button><button class="secondary-button" data-action="stand">STAND</button>`}</div></section>`}

  if(scene.type==='greeting'){const q=scene.query;const response=/how are/.test(q)?'I’m good. What would you like to make today?':/thank/.test(q)?'You’re welcome. What’s next?':/bye|good night/.test(q)?'See you soon. Your canvas will be here.':/morning|afternoon|evening/.test(q)?`${titleCase(q.replace(/[!?.]/g,''))}! What’s on your mind?`:'Hey! What’s on your mind?';return `<section class="result-card greeting-card">${label}<h2>${esc(response)}</h2><p>Try a scene, a calculation, a map, or a question about the weather.</p></section>`}
  if(scene.type==='flag')return `<section class="result-card">${label}<div class="result-main"><div><h2>Looking for ${esc(scene.query)}?</h2><p>Open Google results for this flag.</p></div><div class="topic-links"><a href="https://www.google.com/search?q=${encodeURIComponent(scene.query)}" target="_blank" rel="noopener noreferrer">FIND ON GOOGLE ↗</a><a href="https://www.google.com/search?tbm=isch&q=${encodeURIComponent(scene.query)}" target="_blank" rel="noopener noreferrer">IMAGES ↗</a></div></div></section>`;
  if(scene.type==='weather'){const weather=scene.data;return `<section class="result-card weather-card">${label}${weather?`<div class="weather-answer"><span class="weather-emoji">${weather.emoji}</span><div><h2>${esc(weather.place)}: ${esc(weather.summary)}.</h2><p>Current model estimate · ${esc(weather.observed)} local time</p></div><strong>${Math.round(weather.temperature)}°C</strong></div><div class="weather-facts"><span>WIND <b>${Math.round(weather.wind)} km/h</b></span><span>RAIN <b>${weather.rain} mm</b></span><span>FEELS LIKE <b>${Math.round(weather.feels)}°C</b></span></div><small class="weather-source">Weather data: Open-Meteo</small>`:scene.error?`<h2>Couldn’t load weather for ${esc(scene.place)}.</h2><p>${esc(scene.error)}</p><a href="https://www.google.com/search?q=${encodeURIComponent(state.text)}" target="_blank" rel="noopener noreferrer">SEARCH WEATHER ↗</a>`:`<h2>${scene.place?`Checking ${esc(scene.place)}…`:'Where should I check the weather?'}</h2><p>${scene.place?'Fetching current conditions now.':'Try “weather in Jaipur” or another city.'}</p>`}</section>`}
  if(scene.type==='place-time')return `<section class="result-card">${label}<div class="result-main"><div><h2>${scene.data?esc(scene.data.name):`Time in ${esc(scene.place)}`}</h2><p>${scene.error?esc(scene.error):scene.data?'Current local time':'Checking the time zone…'}</p></div>${scene.data?`<div id="place-time" data-time-zone="${esc(scene.data.timezone)}" class="timer-readout">${esc(new Intl.DateTimeFormat('en-US',{timeZone:scene.data.timezone,hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true}).format(new Date()))}</div>`:''}</div></section>`;
  if(['sunset','night','sky','aurora','color'].includes(scene.type))return `<section class="result-card">${label}<div class="result-main"><div><h2>${scene.type==='sunset'?'A sky, on demand.':scene.type==='night'?'A sky after dark.':scene.type==='aurora'?'The lights are moving.':scene.type==='sky'?'Your sky, your shade.':'The room changed colour.'}</h2><p>${scene.type==='sky'||scene.type==='color'?'Tune the shade below and watch the whole page change.':'Your words become the atmosphere. Keep typing to shift it again.'}</p></div><button data-action="copy" class="secondary-button">${icon('copy',16)} COPY COLOURS</button></div><div class="swatches">${scene.palette.map(c=>`<div style="background:${c}"><span>${c.toUpperCase()}</span></div>`).join('')}</div>${scene.values?mixerPanel(scene.values):''}</section>`;
  if(scene.type==='emoji'||scene.type==='creature')return `<section class="result-card">${label}<div class="result-main"><div><h2>${scene.type==='creature'?`Meet the ${esc(scene.subject)}.`:`A whole world of ${esc(scene.emoji)}`}</h2><p>The background picked up the subject of your words.</p></div><div class="emoji-preview" aria-hidden="true">${esc(scene.emoji)}</div><div class="topic-links"><a href="https://www.google.com/search?q=${encodeURIComponent(state.text)}" target="_blank" rel="noopener noreferrer">GOOGLE SEARCH ↗</a><a href="https://www.google.com/search?tbm=isch&q=${encodeURIComponent(state.text)}" target="_blank" rel="noopener noreferrer">IMAGES ↗</a></div></div></section>`;
  if(scene.type==='pixel')return `<section class="result-card">${label}<div class="result-main"><div><h2>A diamond from another world.</h2><p>Change the backdrop shade to suit your gem.</p></div><div class="gem-preview">${diamondArtwork('gem-preview-svg')}</div><div class="topic-links"><a href="https://www.google.com/search?tbm=isch&q=${encodeURIComponent(state.text)}" target="_blank" rel="noopener noreferrer">EXPLORE IMAGES ↗</a></div></div><div class="swatches">${scene.palette.map(c=>`<div style="background:${c}"><span>${c.toUpperCase()}</span></div>`).join('')}</div><button data-action="copy" class="secondary-button palette-copy">${icon('copy',16)} COPY COLOURS</button>${mixerPanel(scene.values)}</section>`;
  if(scene.type==='search')return `<section class="result-card">${label}<div class="result-main"><div><h2>${state.aiPending===scene.query?'Making your scene…':`Let’s explore ${esc(scene.query)}.`}</h2><p>${state.aiPending===scene.query?'DOCK is interpreting your idea. Search links are ready while it works.':'DOCK doesn’t have a scene for this yet. Open search results, images, or videos for this exact phrase.'}</p></div><div class="topic-links"><a href="https://www.google.com/search?q=${encodeURIComponent(scene.query)}" target="_blank" rel="noopener noreferrer">GOOGLE SEARCH ↗</a><a href="https://www.google.com/search?tbm=isch&q=${encodeURIComponent(scene.query)}" target="_blank" rel="noopener noreferrer">IMAGES ↗</a><a href="https://www.youtube.com/results?search_query=${encodeURIComponent(scene.query)}" target="_blank" rel="noopener noreferrer">VIDEOS ↗</a></div></div><form class="teach-form" id="teach-form"><label for="teach-target">SHOW THIS INSTEAD NEXT TIME</label><div><input id="teach-target" maxlength="100" placeholder="Try an equivalent prompt, like a red car" aria-label="Equivalent prompt"><button type="submit">TEACH DOCK ↗</button></div><small>Saved in this browser only. <button type="button" class="manage-teachings" data-action="teach-toggle">MANAGE CORRECTIONS ↗</button></small></form></section>`;
  if(scene.type==='ai-visual'||scene.type==='ai-answer')return `<section class="result-card">${label}<div class="result-main"><div><h2>${esc(scene.title)}</h2><p>${esc(scene.description)}</p></div><div class="topic-links"><a href="https://www.google.com/search?q=${encodeURIComponent(scene.query)}" target="_blank" rel="noopener noreferrer">GOOGLE SEARCH ↗</a><a href="https://www.google.com/search?tbm=isch&q=${encodeURIComponent(scene.query)}" target="_blank" rel="noopener noreferrer">IMAGES ↗</a></div></div></section>`;
  if(scene.type==='clock')return '';
  if(scene.type==='calendar')return `<section class="result-card">${label}<div class="result-main"><div><h2>Your calendar.</h2><p>Events and reminders in India Standard Time.</p></div><div id="clock-readout" class="calendar-time">${inIndia(new Date(),{hour:'2-digit',minute:'2-digit',hour12:true})} IST</div></div>${calendarPanel()}${reminderList()}</section>`;
  if(scene.type==='reminder'){const saved=state.reminders.find(item=>item.label===scene.label&&item.when===scene.when);return `<section class="result-card">${label}<div class="result-main"><div><h2>${esc(scene.label)}</h2><p>${inIndia(new Date(scene.when),{weekday:'long',day:'numeric',month:'long',hour:'numeric',minute:'2-digit'})} IST</p></div><button class="primary-button" data-action="save-reminder" ${saved?'disabled':''}>${saved?'REMINDER SAVED':'SAVE REMINDER'}</button></div><p class="reminder-note">Reminder alerts appear while this page is open. Saved reminders are checked again when you return.</p><button class="secondary-button" data-action="open-calendar">OPEN CALENDAR ↗</button>${calendarPanel()}${reminderList()}</section>`}
  if(scene.type==='timer')return `<section class="result-card">${label}<div class="result-main"><div><h2>Make this moment count.</h2><p>A little space to focus, shaped from your words.</p></div><div class="timer-readout">${clock(state.seconds)}</div></div><div class="result-buttons"><button class="primary-button" data-action="timer">${icon(state.running?'pause':'play',16)} ${state.running?'PAUSE':'START FOCUS'}</button><button class="secondary-button" data-action="timer-reset">${icon('refresh',16)} RESET</button></div></section>`;
  if(scene.type==='split'||scene.type==='calc')return `<section class="result-card">${label}<div class="math-result"><div><small>YOU ASKED</small><h2>${scene.type==='split'?fmt(scene.amount):esc(scene.expression)}</h2></div><b>${scene.type==='split'?`÷ ${scene.people}`:'='}</b><div><small>${scene.type==='split'?'EACH PERSON PAYS':'ANSWER'}</small><strong>${scene.type==='split'?fmt(scene.amount/scene.people):scene.result===null?'Undefined':fmt(scene.result)}</strong></div></div><p class="math-foot">Calculated locally in your browser.</p></section>`;
  if(scene.type==='list'){const items=state.listItems??scene.items;return `<section class="result-card list-card">${label}<div class="list-heading"><div><h2>${scene.name==='Shopping checklist'?'Your shopping list.':'A list, ready to go.'}</h2><p>Appears as you type. Check things off, add more, or remove them.</p></div><span class="list-progress">${state.checked.size} / ${items.length} DONE</span></div><div class="checklist">${items.map((item,i)=>`<div class="list-row ${state.checked.has(i)?'done':''}"><button class="list-toggle" data-check="${i}" aria-label="${state.checked.has(i)?'Uncheck':'Check'} ${esc(item)}"><span>${state.checked.has(i)?icon('check',14):''}</span><span>${esc(item)}</span></button><button class="list-remove" data-remove="${i}" aria-label="Remove ${esc(item)}">${icon('close',15)}</button></div>`).join('')||'<p class="list-empty">Start typing your first item…</p>'}</div><form id="add-item-form" class="add-item"><input id="new-item" aria-label="Add list item" placeholder="Add another item…" autocomplete="off"><button type="submit" aria-label="Add item">${icon('plus',18)}</button></form></section>`}
  return `<section class="result-card">${label}<h2>Keep going. It’s taking shape.</h2><p>Try a colour, an object, a timer, a calculation, or a list. Your words paint the whole canvas.</p></section>`;
}
function render(focus=false,cursor=null){
  const scene=detect(state.text);
  saveList(scene);
  const palette=scene.palette;
  const liveResult=['list','color','sky','search','aurora','pixel','emoji','creature','reminder','calendar','calc','ai-visual','ai-answer','india-map','world-map','greeting','weather','place-time','flag','trip','game-rps','game-dice','game-blackjack','games-hub'].includes(scene.type)&&state.text.trim().length>2;
  app.innerHTML=`<div class="world ${scene.type==='search'?'explore':scene.type} ${scene.coloured?'coloured':''} ${scene.type==='weather'?`weather-${scene.data?.condition||'cloudy'}`:''} ${state.committed||liveResult?'committed':''}" style="${palette?`--c1:${palette[0]};--c2:${palette[1]};--c3:${palette[2]};`:''}${scene.type==='emoji'||scene.type==='creature'?`--object-bg:${scene.bg};--object-ink:${scene.ink};`:''}">
    <div class="scene">${environment(scene)}</div><div class="noise"></div>
    <header class="topbar"><button class="logo" data-action="home" aria-label="DOCK home"><span class="logo-icon">◖◗</span>DOCK<span>.</span></button><a class="github-link" href="https://github.com/a21tya" target="_blank" rel="noopener noreferrer" aria-label="GitHub profile">GitHub ↗</a></header>
    <aside class="corner-clock" aria-label="Interactive India Standard Time clock">${analogClock()}</aside>
    <main class="stage">
      <div class="core"><h1 class="draggable-headline" aria-label="Drag individual words; each returns after three seconds">${draggableWords(scene.type==='idle'?'What should this<br><em>become?</em>':scene.type==='sunset'?'There’s a sunset<br><em>in your words.</em>':scene.type==='night'?'A darker sky.<br><em>Just as you asked.</em>':scene.type==='sky'?'Paint the sky.<br><em>Make it yours.</em>':scene.type==='aurora'?'Let the lights<br><em>dance.</em>':scene.type==='pixel'?'A pixel world.<br><em>One diamond.</em>':scene.type==='search'?'Curiosity looks<br><em>good here.</em>':scene.type==='ai-visual'?'Your thought.<br><em>A new world.</em>':scene.type==='ai-answer'?'A question.<br><em>An answer.</em>':scene.type==='clock'?'Time is yours<br><em>to play with.</em>':scene.type==='calendar'?'Your days,<br><em>in view.</em>':scene.type==='reminder'?'Keep it<br><em>on your mind.</em>':scene.type==='color'?'Find your<br><em>perfect shade.</em>':scene.type==='emoji'?`You said ${scene.emoji}<br><em>We heard a world.</em>`:scene.type==='creature'?`Meet the ${esc(scene.subject)}.<br><em>It’s everywhere.</em>`:scene.type==='timer'?'Time to make<br><em>time.</em>':scene.type==='trip'?'The next place,<br><em>on your calendar.</em>':(scene.type.startsWith('game-')||scene.type==='games-hub')?'A little play,<br><em>right here.</em>':scene.type==='split'||scene.type==='calc'?'Numbers in.<br><em>Clarity out.</em>':scene.type==='list'?'Consider it<br><em>on the list.</em>':scene.type==='greeting'?'Good to see<br><em>you here.</em>':scene.type==='weather'?'The sky has<br><em>a story.</em>':scene.type==='place-time'?'Around the world,<br><em>right now.</em>':scene.type==='flag'?'Find the flag.<br><em>Follow the story.</em>':scene.type==='india-map'||scene.type==='world-map'?'A world to<br><em>explore.</em>':'Words become<br><em>worlds.</em>')}</h1><p class="subtitle">Type a thought. Speak an idea. Watch the interface become it.</p>
        <div class="search ${state.listening?'listening':''} ${scene.type==='list'?'with-decor':''}"><span class="search-spark">${icon('spark',23)}</span><div class="prompt-wrap">${scene.type==='list'?`<div class="prompt-mirror" aria-hidden="true"><span class="prompt-mirror-text">${decoratedPrompt(scene)}</span></div>`:''}<input id="prompt" aria-label="Describe what you want" autocomplete="off" spellcheck="false" placeholder="Try ‘a warm orange sunset’…" value="${esc(state.text)}"></div><button class="mic ${state.listening?'active':''}" data-action="voice" aria-label="${state.listening?'Stop voice input':'Use voice input'}">${icon(state.listening?'stop':'mic',20)}</button><button class="go" data-action="go" aria-label="Create from input">${icon('arrow',22)}</button></div>
        ${commandPicker()}<div class="input-meta"><span>${state.listening?'● LISTENING — SPEAK NOW':state.notice?esc(state.notice):'↵ ENTER TO CREATE  /  🎙 SPEAK INSTEAD'}</span>${state.text.trim().length>2&&scene.type!=='search'?'<button class="teach-toggle" data-action="teach-toggle" aria-label="Correct what DOCK understood">CORRECT THIS ↗</button>':''}</div>
        ${(state.committed||liveResult)&&state.text.trim()&&scene.type!=='clock'?`<div class="result-wrap">${result(scene)}</div>`:scene.type==='clock'?'':`<div class="examples"><span>TRY A SPARK</span>${Array.from({length:4},(_,i)=>sparks[(state.suggestionOffset+i)%sparks.length]).map(x=>`<button data-example="${esc(x)}">${esc(x)} <span>↗</span></button>`).join('')}</div>`}
      </div></main>${queuePanel()}
    ${state.teachOpen?`<div class="teach-overlay" role="presentation"><section class="teach-dialog" role="dialog" aria-modal="true" aria-labelledby="teach-heading"><button class="teach-close" data-action="teach-close" aria-label="Close correction">×</button><small>TEACH DOCK / YOUR BROWSER</small><h2 id="teach-heading">What did you mean?</h2><p>Give this phrase an equivalent DOCK command. Try “a red car”, “2 min timer”, “buy milk and eggs”, or “indian map”.</p><form id="teach-dialog-form"><label for="teach-dialog-target">SHOW THIS INSTEAD</label><div><input id="teach-dialog-target" maxlength="100" placeholder="Type a working DOCK prompt" autocomplete="off" required><button type="submit">REMEMBER ↗</button></div><span id="teach-error" role="alert"></span></form><div class="teach-library"><small>${state.teachings.length} SAVED CORRECTION${state.teachings.length===1?'':'S'} · ONLY IN THIS BROWSER</small><div><button data-action="export-teachings" ${state.teachings.length?'':'disabled'}>EXPORT JSON ↗</button><button data-action="clear-teachings" ${state.teachings.length?'':'disabled'}>DELETE ALL</button></div></div></section></div>`:''}
    ${state.alert?`<div class="reminder-toast" role="alert"><span>⏰ ${esc(state.alert)}</span><button data-action="dismiss-alert" aria-label="Dismiss reminder">${icon('close',16)}</button></div>`:''}
  </div>`;
  bind();
  if(scene.type==='india-map'||scene.type==='world-map')mountMap(scene.type,scene.country);
  if(scene.type==='weather')queueWeather(scene);
  if(scene.type==='place-time')queuePlaceTime(scene);
  if(focus){const input=document.querySelector('#prompt');input.focus({preventScroll:true});const position=cursor??input.value.length;input.setSelectionRange(position,position)}
}
function stopTimer(){clearInterval(state.interval);state.interval=null;state.running=false}
function showTool(name){state.text=name;state.committed=true;state.clockHands=null;render()}
function clockAngles(){if(state.clockHands)return state.clockHands;const now=indianNow();return {hour:(now.hour%12+now.minute/60)*30,minute:(now.minute+now.second/60)*6,second:now.second*6}}
function updateClock(){

  const placeTime=document.querySelector('#place-time');if(placeTime)placeTime.textContent=new Intl.DateTimeFormat('en-US',{timeZone:placeTime.dataset.timeZone,hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true}).format(new Date());
  const date=document.querySelector('#clock-date');if(date)date.textContent=inIndia(new Date(),{weekday:'long',month:'long',day:'numeric'});
  const angles=clockAngles();for(const hand of document.querySelectorAll('[data-hand]'))hand.setAttribute('transform',`rotate(${angles[hand.dataset.hand]} 120 120)`);
}
function bindAnalogClock(){
  const face=document.querySelector('.analog-clock');if(!face)return;
  updateClock();
  let dragging=null;
  const move=e=>{if(!dragging)return;const point=face.createSVGPoint();point.x=e.clientX;point.y=e.clientY;const local=point.matrixTransform(face.getScreenCTM().inverse());const angle=(Math.atan2(local.x-120,120-local.y)*180/Math.PI+360)%360;state.clockHands={...clockAngles(),[dragging]:angle};updateClock();clearTimeout(state.clockIdle);state.clockIdle=setTimeout(()=>{state.clockHands=null;updateClock()},3000)};
  face.querySelectorAll('[data-hand]').forEach(hand=>hand.addEventListener('pointerdown',e=>{dragging=hand.dataset.hand;face.setPointerCapture(e.pointerId);move(e);e.preventDefault()}));
  face.addEventListener('pointermove',move);
  face.addEventListener('pointerup',()=>{dragging=null});face.addEventListener('pointercancel',()=>{dragging=null});
}
function commit(){if(state.text.startsWith('/')&&slashMatch(state.text).length){state.text=slashMatch(state.text)[0].prompt}if(!state.text.trim()){document.querySelector('#prompt').focus();return}state.committed=true;const s=detect(state.text);if(s.type==='timer'&&s.seconds!==state.initial){stopTimer();state.initial=s.seconds;state.seconds=s.seconds}if(s.type==='reminder'&&!state.reminders.some(item=>item.label===s.label&&item.when===s.when)){state.reminders.push({id:Date.now(),label:s.label,when:s.when,fired:false});localStorage.setItem('dock-reminders',JSON.stringify(state.reminders))}if(s.type==='trip'&&state.tripDraft?.place!==s.place){const [start,end]=tripDates();state.tripDraft={place:s.place,start,end};const [year,month]=start.split('-').map(Number);state.calendarYear=year;state.calendarMonth=month-1}if(!['idle','clock','search','timer','reminder','trip','game-rps','game-dice','game-blackjack'].includes(s.type))upsertActivity({id:`history-${Date.now()}`,type:'history',title:state.text,detail:s.name});render(true);if(s.type==='search')queueInterpret(true);window.scrollTo(0,0)}
function updateTimerRail(){const item=state.activity.find(x=>x.id==='active-timer');if(!item)return;item.status=state.running?'running':state.seconds?'paused':'done';item.remaining=state.seconds;if(!state.running)item.endsAt=null;saveActivity(state.activity);const label=document.querySelector('[data-queue-open="active-timer"] small');if(label)label.textContent=clock(state.seconds)}
function toggleTimer(){
  if(state.running){stopTimer();updateTimerRail();render();return}
  if(state.seconds<=0)state.seconds=state.initial;
  state.running=true;
  upsertActivity({id:'active-timer',type:'timer',title:`${Math.ceil(state.initial/60)} min timer`,detail:'Running',duration:state.initial,remaining:state.seconds,status:'running',endsAt:Date.now()+state.seconds*1000});
  state.interval=setInterval(()=>{const item=state.activity.find(x=>x.id==='active-timer');state.seconds=Math.max(0,Math.ceil(((item?.endsAt||Date.now())-Date.now())/1000));const x=document.querySelector('.timer-readout');if(x&&detect(state.text).type==='timer')x.textContent=clock(state.seconds);updateTimerRail();if(!state.seconds){stopTimer();updateTimerRail();state.notice='TIMER COMPLETE';state.alert='Your timer is complete';render()}},1000);render()
}
let speech;
let inputRender;
let aiRender;
let aiRequest;
let aiRequestQuery='';
const aiCache=new Map();
let weatherTimer;
let weatherController;
let placeTimeTimer;
let placeTimeController;
function queuePlaceTime(scene){
  clearTimeout(placeTimeTimer);
  if(!scene.place||scene.data||scene.error)return;
  const query=state.text.trim(),place=scene.place;
  placeTimeTimer=setTimeout(async()=>{
    placeTimeController?.abort();const controller=new AbortController();placeTimeController=controller;
    try{
      const response=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=en&format=json`,{signal:controller.signal});
      if(!response.ok)throw Error('Location search unavailable');
      const location=(await response.json()).results?.[0];
      if(!location?.timezone)throw Error('I could not find that place or time zone.');
      if(state.text.trim()!==query)return;
      state.timePlace={query,data:{name:`${location.name}${location.country?`, ${location.country}`:''}`,timezone:location.timezone}};
      const input=document.querySelector('#prompt');render(document.activeElement===input,input?.selectionStart);
    }catch(error){if(error.name==='AbortError'||state.text.trim()!==query)return;state.timePlace={query,error:error.message||'Please try again.'};const input=document.querySelector('#prompt');render(document.activeElement===input,input?.selectionStart)}
  },380);
}
function weatherDescription(code,wind){
  if([95,96,99].includes(code))return {condition:'rainy',summary:'Thunderstorms',emoji:'⛈️'};
  if([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code))return {condition:'rainy',summary:'Rainy',emoji:'🌧️'};
  if([71,73,75,77,85,86].includes(code))return {condition:'snowy',summary:'Snowy',emoji:'❄️'};
  if(wind>=25)return {condition:'windy',summary:'Windy',emoji:'💨'};
  if(code===0)return {condition:'sunny',summary:'Clear skies',emoji:'☀️'};
  if(code===1||code===2)return {condition:'cloudy',summary:'Partly cloudy',emoji:'🌤️'};
  return {condition:'cloudy',summary:'Cloudy',emoji:'☁️'};
}
function queueWeather(scene){
  clearTimeout(weatherTimer);
  if(!scene.place||scene.data||scene.error)return;
  const query=state.text.trim(),place=scene.place;
  weatherTimer=setTimeout(async()=>{
    weatherController?.abort();const controller=new AbortController();weatherController=controller;
    try{
      const geoResponse=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=en&format=json`,{signal:controller.signal});
      if(!geoResponse.ok)throw Error('Location search unavailable');
      const location=(await geoResponse.json()).results?.[0];
      if(!location)throw Error('I could not find that city. Try adding its country.');
      const params=new URLSearchParams({latitude:String(location.latitude),longitude:String(location.longitude),current:'temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',timezone:'auto'});
      const weatherResponse=await fetch(`https://api.open-meteo.com/v1/forecast?${params}`,{signal:controller.signal});
      if(!weatherResponse.ok)throw Error('Current conditions unavailable');
      const weather=await weatherResponse.json(),current=weather.current;
      if(!current)throw Error('Current conditions unavailable');
      const kind=weatherDescription(current.weather_code,current.wind_speed_10m);
      if(state.text.trim()!==query)return;
      state.weather={query,data:{...kind,place:`${location.name}${location.country?`, ${location.country}`:''}`,temperature:current.temperature_2m,feels:current.apparent_temperature,wind:current.wind_speed_10m,rain:current.precipitation,observed:current.time?.split('T')[1]||'now'}};
      const input=document.querySelector('#prompt');render(document.activeElement===input,input?.selectionStart);
    }catch(error){if(error.name==='AbortError'||state.text.trim()!==query)return;state.weather={query,error:error.message||'Please try again.'};const input=document.querySelector('#prompt');render(document.activeElement===input,input?.selectionStart)}
  },380);
}
function queueInterpret(immediate=false){
  clearTimeout(aiRender);
  if(import.meta.env.BASE_URL!=='/')return;
  if(state.aiUnavailable||detect(state.text).type!=='search'||state.text.trim().length<4)return;
  const query=state.text.trim();
  const cached=aiCache.get(query.toLowerCase());
  if(cached){state.aiScene={query,plan:cached};const input=document.querySelector('#prompt');render(document.activeElement===input,input?.selectionStart);return}
  if(aiRequestQuery===query)return;
  aiRender=setTimeout(async()=>{
    aiRequest?.abort();
    const controller=new AbortController();aiRequest=controller;aiRequestQuery=query;state.aiPending=query;
    const input=document.querySelector('#prompt');render(document.activeElement===input,input?.selectionStart);
    try{
      const response=await fetch('/api/interpret',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:query}),signal:controller.signal});
      if(!response.ok){
        const error=(await response.json().catch(()=>({}))).error;
        if(error==='AI_NOT_CONFIGURED'){state.aiUnavailable=true;state.notice='AI IS NOT CONFIGURED · SEARCH LINKS ARE READY'}
        else state.notice=error==='MODEL_BUSY'?'MODEL IS BUSY · TRY AGAIN IN A MOMENT':error==='MODEL_TIMEOUT'?'MODEL TIMED OUT · TRY AGAIN':'MODEL UNAVAILABLE · SEARCH LINKS ARE READY';
        return;
      }
      const data=await response.json();
      const plan=validateModelPlan(data);
      if(state.text.trim()!==query||!plan)return;
      aiCache.set(query.toLowerCase(),plan);
      if(aiCache.size>50)aiCache.delete(aiCache.keys().next().value);
      state.aiScene={query,plan};
      const currentInput=document.querySelector('#prompt');render(document.activeElement===currentInput,currentInput?.selectionStart);
    }catch(error){if(error.name!=='AbortError')state.notice='NETWORK ERROR · SEARCH LINKS ARE READY'}
    finally{if(aiRequest===controller){aiRequest=null;aiRequestQuery='';state.aiPending=null;if(state.text.trim()===query&&!state.aiScene){const currentInput=document.querySelector('#prompt');render(document.activeElement===currentInput,currentInput?.selectionStart)}}}
  },immediate?0:280);
}
function saveTeaching(target,errorNode){
  const scene=detect(target,true);
  if(!target||target.trim().toLowerCase()===state.text.trim().toLowerCase()||!teachableTypes.has(scene.type)){
    const message='Enter a different prompt DOCK already understands, such as “2 min timer”.';
    if(errorNode)errorNode.textContent=message;
    state.notice='TRY A DIFFERENT WORKING DOCK PROMPT';
    const status=document.querySelector('.input-meta span');if(status)status.textContent=state.notice;
    return;
  }
  const phrase=state.text.trim().toLowerCase();
  state.teachings=[...state.teachings.filter(item=>item.phrase!==phrase),{phrase,target:target.trim()}].slice(-100);
  localStorage.setItem('dock-teachings',JSON.stringify(state.teachings));
  state.teachOpen=false;state.listItems=null;state.checked.clear();state.aiScene=null;
  if(scene.type==='timer'){state.initial=scene.seconds;state.seconds=scene.seconds}
  if(scene.type==='trip'){const [start,end]=tripDates();state.tripDraft={place:scene.place,start,end}}
  state.notice='DOCK WILL REMEMBER THIS IN THIS BROWSER';
  render();
}
function toggleVoice(){
  if(state.listening){speech?.stop();state.listening=false;render(true);return}
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Recognition){state.notice='VOICE INPUT NEEDS A SUPPORTED BROWSER';render();return}
  speech=new Recognition();speech.lang=navigator.language||'en-US';speech.interimResults=true;
  speech.onresult=e=>{let words='';for(let i=0;i<e.results.length;i++)words+=e.results[i][0].transcript;state.text=words;state.committed=e.results[e.results.length-1].isFinal;state.listItems=null;state.colorOverride=null;state.aiScene=null;state.checked.clear();const s=detect(words);if(s.type==='timer'){state.initial=s.seconds;state.seconds=s.seconds}render();queueInterpret()};
  speech.onerror=e=>{state.listening=false;state.notice=e.error==='not-allowed'?'MICROPHONE ACCESS WAS NOT GRANTED':'VOICE INPUT COULD NOT START';render()};
  speech.onend=()=>{state.listening=false;render()};
  try{speech.start();state.listening=true;state.notice='';render()}catch{state.notice='VOICE INPUT COULD NOT START';render()}
}
function bind(){
  const input=document.querySelector('#prompt');
  document.querySelector('#teach-form')?.addEventListener('submit',event=>{event.preventDefault();saveTeaching(document.querySelector('#teach-target').value,document.querySelector('.teach-form small'))});
  document.querySelectorAll('[data-action="teach-toggle"]').forEach(button=>button.addEventListener('click',()=>{state.teachOpen=true;render();document.querySelector('#teach-dialog-target')?.focus()}));
  document.querySelector('[data-action="teach-close"]')?.addEventListener('click',()=>{state.teachOpen=false;render()});
  document.querySelector('#teach-dialog-form')?.addEventListener('submit',event=>{event.preventDefault();saveTeaching(document.querySelector('#teach-dialog-target').value,document.querySelector('#teach-error'))});
  document.querySelector('.teach-overlay')?.addEventListener('keydown',event=>{if(event.key==='Escape'){state.teachOpen=false;render(true)}});
  document.querySelector('[data-action="forget-teaching"]')?.addEventListener('click',()=>{const phrase=document.querySelector('[data-action="forget-teaching"]')?.dataset.learnedFrom||state.text.trim().toLowerCase();state.teachings=state.teachings.filter(item=>item.phrase!==phrase);localStorage.setItem('dock-teachings',JSON.stringify(state.teachings));state.notice='INTERPRETATION FORGOTTEN';render()});
  document.querySelector('[data-action="export-teachings"]')?.addEventListener('click',()=>{const blob=new Blob([JSON.stringify({format:'dock-teachings',version:1,corrections:state.teachings},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='dock-corrections.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
  document.querySelector('[data-action="clear-teachings"]')?.addEventListener('click',()=>{if(!window.confirm('Delete all saved Teach DOCK corrections in this browser? Export them first if you want a backup.'))return;state.teachings=[];localStorage.removeItem('dock-teachings');state.notice='ALL CORRECTIONS REMOVED';state.teachOpen=false;render()});
  input.oninput=e=>{const cursor=e.target.selectionStart;state.text=e.target.value;state.committed=false;state.notice='';state.teachOpen=false;state.checked.clear();state.listItems=null;state.colorOverride=null;state.aiScene=null;state.aiPending=null;aiRequest?.abort();aiRequestQuery='';weatherController?.abort();placeTimeController?.abort();clearTimeout(weatherTimer);clearTimeout(placeTimeTimer);clearTimeout(aiRender);const mirror=document.querySelector('.prompt-mirror-text');if(mirror)mirror.textContent=state.text;clearTimeout(inputRender);inputRender=setTimeout(()=>render(true,cursor),160);queueInterpret()};
  input.onscroll=()=>{const mirror=document.querySelector('.prompt-mirror-text');if(mirror)mirror.style.transform=`translateX(-${input.scrollLeft}px)`};
  input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();clearTimeout(inputRender);commit()}if(e.key==='Escape'){clearTimeout(inputRender);clearTimeout(aiRender);aiRequest?.abort();state.text='';state.committed=false;state.aiScene=null;state.colorOverride=null;render(true)}};
  document.querySelectorAll('[data-command]').forEach(b=>b.onclick=()=>{state.text=b.dataset.command;state.committed=true;state.tripDraft=null;render(true)});
  document.querySelectorAll('.drag-word').forEach(word=>{let origin=null,timer;word.onpointerdown=e=>{if(e.button!==0)return;origin={x:e.clientX,y:e.clientY};word.setPointerCapture(e.pointerId);word.classList.add('is-dragged');clearTimeout(timer);e.preventDefault()};word.onpointermove=e=>{if(!origin)return;word.style.setProperty('--drag-x',`${Math.max(-140,Math.min(140,e.clientX-origin.x))}px`);word.style.setProperty('--drag-y',`${Math.max(-100,Math.min(100,e.clientY-origin.y))}px`)};word.onpointerup=()=>{origin=null;timer=setTimeout(()=>{word.style.setProperty('--drag-x','0px');word.style.setProperty('--drag-y','0px');word.classList.remove('is-dragged')},3000)};word.onpointercancel=word.onpointerup});
  document.querySelectorAll('[data-queue-open]').forEach(b=>b.onclick=()=>{const id=b.dataset.queueOpen;if(id.startsWith('reminder-')){state.text='calendar'}else{const item=state.activity.find(x=>x.id===id);if(!item)return;state.text=item.type==='timer'?`${Math.ceil(item.remaining/60)} min timer`:item.type==='trip'?`trip to ${item.place}`:item.prompt||item.title;if(item.type==='trip'){state.tripDraft={place:item.place,start:item.start,end:item.end};const [year,month]=item.start.split('-').map(Number);state.calendarYear=year;state.calendarMonth=month-1}}state.committed=true;render(true)});
  document.querySelectorAll('[data-queue-remove]').forEach(b=>b.onclick=()=>{if(b.dataset.queueRemove==='active-timer')stopTimer();removeActivity(b.dataset.queueRemove);render()});
  document.querySelectorAll('[data-trip-part]').forEach(field=>field.onchange=()=>{const start=readTripDate('start'),end=readTripDate('end');const error=document.querySelector('.trip-error');if(!start||!end){error.textContent='Choose a real calendar date.';return}if(start<todayKey()){error.textContent='Departure cannot be before today.';return}state.tripDraft={place:detect(state.text).place,start,end:end<start?start:end};const [year,month]=start.split('-').map(Number);state.calendarYear=year;state.calendarMonth=month-1;render()});
  document.querySelector('[data-action="save-trip"]')?.addEventListener('click',()=>{const start=readTripDate('start'),end=readTripDate('end');if(!start||!end||start<todayKey()||end<todayKey()||end<start){document.querySelector('.trip-error').textContent='Choose valid dates from today onward; return on or after departure.';return}const scene=detect(state.text);upsertActivity({id:`trip-${Date.now()}`,type:'trip',place:scene.place,title:`Trip to ${scene.place}`,detail:`${displayDate(start)} → ${displayDate(end)}`,start,end});state.tripDraft={place:scene.place,start,end};state.notice='TRIP SAVED TO YOUR PLANS';render()});
  document.querySelector('[data-action="roll-dice"]')?.addEventListener('click',()=>{const scene=detect(state.text);state.game={type:'dice',rolls:Array.from({length:scene.count},()=>randomInt(scene.sides))};upsertActivity({id:`game-${Date.now()}`,type:'game',title:`Rolled ${scene.count}d${scene.sides}`,prompt:state.text,detail:`Total ${state.game.rolls.reduce((a,b)=>a+b,0)}`});render()});
  document.querySelectorAll('[data-rps]').forEach(b=>b.onclick=()=>{const choices=['rock','paper','scissors'],you=b.dataset.rps,dock=choices[randomInt(3)-1];const outcome=you===dock?'A tie.':(you==='rock'&&dock==='scissors'||you==='paper'&&dock==='rock'||you==='scissors'&&dock==='paper')?'You win!':'DOCK wins.';state.game={type:'rps',you,dock,outcome};upsertActivity({id:`game-${Date.now()}`,type:'game',title:'Rock paper scissors',prompt:state.text,detail:outcome});render()});
  document.querySelector('[data-action="deal"]')?.addEventListener('click',()=>{const deck=makeDeck();state.game={type:'blackjack',deck,player:[drawCard(deck),drawCard(deck)],dealer:[drawCard(deck),drawCard(deck)],status:'playing'};if(handValue(state.game.player)===21)state.game.status=handValue(state.game.dealer)===21?'Push — both have blackjack.':'Blackjack! You win.';else if(handValue(state.game.dealer)===21)state.game.status='Dealer blackjack.';render()});
  document.querySelector('[data-action="hit"]')?.addEventListener('click',()=>{state.game.player.push(drawCard(state.game.deck));const value=handValue(state.game.player);if(value>21)state.game.status='Bust. Dealer wins.';else if(value===21){const g=state.game;while(handValue(g.dealer)<17)g.dealer.push(drawCard(g.deck));g.status=handValue(g.dealer)===21?'Push — a tie.':'21! You win.'}if(state.game.status!=='playing')upsertActivity({id:`game-${Date.now()}`,type:'game',title:'Blackjack',prompt:'blackjack',detail:state.game.status});render()});
  document.querySelector('[data-action="stand"]')?.addEventListener('click',()=>{const g=state.game;while(handValue(g.dealer)<17)g.dealer.push(drawCard(g.deck));const you=handValue(g.player),dealer=handValue(g.dealer);g.status=dealer>21||you>dealer?'You win!':you===dealer?'Push — a tie.':'Dealer wins.';upsertActivity({id:`game-${Date.now()}`,type:'game',title:'Blackjack',prompt:'blackjack',detail:g.status});render()});
  document.querySelector('[data-action="go"]').onclick=commit;
  document.querySelector('[data-action="voice"]').onclick=toggleVoice;
  document.querySelector('[data-action="home"]').onclick=()=>{state.text='';state.committed=false;state.checked.clear();state.listItems=null;state.colorOverride=null;state.aiScene=null;aiRequest?.abort();clearTimeout(aiRender);render(true)};
  document.querySelectorAll('[data-action="open-clock"]').forEach(b=>b.onclick=()=>showTool('clock'));
  document.querySelectorAll('[data-action="open-calendar"]').forEach(b=>b.onclick=()=>showTool('calendar'));
  document.querySelectorAll('[data-calendar-nav]').forEach(b=>b.onclick=()=>{const date=new Date(Date.UTC(state.calendarYear,state.calendarMonth+Number(b.dataset.calendarNav),1));state.calendarYear=date.getUTCFullYear();state.calendarMonth=date.getUTCMonth();render()});
  document.querySelectorAll('[data-calendar-day]').forEach(b=>b.onclick=()=>{const day=Number(b.dataset.calendarDay);const events=state.reminders.filter(item=>{const d=indianNowFor(item.when);return d.year===state.calendarYear&&d.month===state.calendarMonth+1&&d.day===day});state.notice=events.length?events.map(item=>item.label).join(' · '):`NO EVENTS ON ${day} ${new Date(Date.UTC(state.calendarYear,state.calendarMonth,1)).toLocaleString('en-IN',{month:'long',timeZone:'UTC'}).toUpperCase()}`;document.querySelector('.input-meta span').textContent=state.notice});
  bindAnalogClock();
  document.querySelector('[data-action="saved-list"]')?.addEventListener('click',()=>{const saved=state.savedList;state.text=saved?.text||'make a list';state.listItems=saved?[...saved.items]:null;state.checked=new Set(saved?.checked||[]);state.committed=true;state.colorOverride=null;state.aiScene=null;render(true)});
  document.querySelectorAll('[data-example]').forEach(b=>b.onclick=()=>{clearTimeout(inputRender);clearTimeout(aiRender);aiRequest?.abort();aiRequestQuery='';state.text=b.dataset.example;state.committed=true;state.checked.clear();state.listItems=null;state.colorOverride=null;state.aiScene=null;const s=detect(state.text);state.initial=s.seconds||0;state.seconds=state.initial;render(true);queueInterpret(true);window.scrollTo(0,0)});
  document.querySelector('[data-action="copy"]')?.addEventListener('click',async event=>{const button=event.currentTarget;try{const colours=detect(state.text).palette.map(colour=>hslToHex(colourValues(colour)));await navigator.clipboard.writeText(colours.join(', '));state.notice='PALETTE COPIED · PASTE IT BACK ANYTIME';button.innerHTML=`${icon('check',16)} COPIED`;const status=document.querySelector('.input-meta span');if(status)status.textContent=state.notice}catch{state.notice='CLIPBOARD ACCESS IS UNAVAILABLE';const status=document.querySelector('.input-meta span');if(status)status.textContent=state.notice}});
  const syncMixer=values=>{state.colorOverride=values;const colours=shadePalette(values);const world=document.querySelector('.world');colours.forEach((colour,i)=>{world.style.setProperty(`--c${i+1}`,colour);const swatch=document.querySelectorAll('.swatches>div')[i];if(swatch){swatch.style.background=colour;swatch.querySelector('span').textContent=colour.toUpperCase()}});document.querySelectorAll('[data-mix]').forEach(slider=>{slider.value=values[slider.dataset.mix]});document.querySelectorAll('[data-value]').forEach(output=>{const key=output.dataset.value;output.textContent=`${values[key]}${key==='h'?'°':'%'}`});const picker=document.querySelector('#mixer-picker');if(picker)picker.value=hslToHex(values)};
  document.querySelectorAll('[data-mix]').forEach(slider=>slider.oninput=()=>{const values={...detect(state.text).values,[slider.dataset.mix]:Number(slider.value)};syncMixer(values)});
  document.querySelector('#mixer-picker')?.addEventListener('input',e=>syncMixer(colourValues(e.target.value)));
  document.querySelector('[data-action="mixer-reset"]')?.addEventListener('click',()=>{state.colorOverride=null;render()});
  document.querySelector('[data-action="save-reminder"]')?.addEventListener('click',()=>{const reminder=detect(state.text);state.reminders.push({id:Date.now(),label:reminder.label,when:reminder.when,fired:false});localStorage.setItem('dock-reminders',JSON.stringify(state.reminders));state.notice='REMINDER SAVED';render()});
  document.querySelectorAll('[data-remove-reminder]').forEach(button=>button.onclick=()=>{state.reminders=state.reminders.filter(item=>item.id!==Number(button.dataset.removeReminder));localStorage.setItem('dock-reminders',JSON.stringify(state.reminders));state.notice='REMINDER REMOVED';render()});
  document.querySelector('[data-action="dismiss-alert"]')?.addEventListener('click',()=>{state.alert='';render()});
  document.querySelector('[data-action="timer"]')?.addEventListener('click',toggleTimer);
  document.querySelector('[data-action="timer-reset"]')?.addEventListener('click',()=>{stopTimer();state.seconds=state.initial;removeActivity('active-timer');render()});
  document.querySelectorAll('[data-check]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.check);state.checked.has(i)?state.checked.delete(i):state.checked.add(i);render()});
  document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.remove);const items=[...(state.listItems??detect(state.text).items)];items.splice(i,1);state.listItems=items;state.checked=new Set([...state.checked].filter(n=>n!==i).map(n=>n>i?n-1:n));render()});
  document.querySelector('#add-item-form')?.addEventListener('submit',e=>{e.preventDefault();const value=document.querySelector('#new-item').value.trim();if(!value)return;state.listItems=[...(state.listItems??detect(state.text).items),value];render();document.querySelector('#new-item')?.focus({preventScroll:true})});
}
render();
const restoredTimer=state.activity.find(x=>x.id==='active-timer');
if(restoredTimer){state.initial=restoredTimer.duration||restoredTimer.remaining||0;state.seconds=restoredTimer.status==='running'?Math.max(0,Math.ceil((restoredTimer.endsAt-Date.now())/1000)):restoredTimer.remaining||0;if(restoredTimer.status==='running'&&state.seconds>0){state.running=true;state.interval=setInterval(()=>{state.seconds=Math.max(0,Math.ceil((restoredTimer.endsAt-Date.now())/1000));updateTimerRail();if(!state.seconds){stopTimer();updateTimerRail();state.alert='Your timer is complete';render()}},1000)}else if(restoredTimer.status==='running'){restoredTimer.status='done';restoredTimer.remaining=0;saveActivity(state.activity);render()}}
window.addEventListener('resize',()=>{const input=document.querySelector('#prompt');render(document.activeElement===input,input?.selectionStart)});
window.setInterval(()=>{
  updateClock();
  const due=state.reminders.find(item=>!item.fired&&item.when<=Date.now());
  if(due){due.fired=true;localStorage.setItem('dock-reminders',JSON.stringify(state.reminders));state.alert=`Reminder: ${due.label}`;const existing=document.querySelector('.reminder-toast');if(existing)existing.remove();const toast=document.createElement('div');toast.className='reminder-toast';toast.setAttribute('role','alert');toast.innerHTML=`<span>⏰ ${esc(state.alert)}</span><button aria-label="Dismiss reminder">${icon('close',16)}</button>`;toast.querySelector('button').onclick=()=>{state.alert='';toast.remove()};document.querySelector('.world')?.append(toast)}
},1000);

window.setInterval(()=>{state.suggestionOffset=(state.suggestionOffset+1)%sparks.length;const examples=document.querySelector('.examples');if(examples)examples.innerHTML=`<span>TRY A SPARK</span>${Array.from({length:4},(_,i)=>sparks[(state.suggestionOffset+i)%sparks.length]).map(x=>`<button data-example="${esc(x)}">${esc(x)} <span>↗</span></button>`).join('')}`;document.querySelectorAll('[data-example]').forEach(b=>b.onclick=()=>{state.text=b.dataset.example;state.committed=true;render(true)});const prompt=document.querySelector('#prompt');if(prompt&&document.activeElement!==prompt)prompt.placeholder=`Try ‘${sparks[state.suggestionOffset]}’…`},6500);
window.addEventListener('dock-plan-trip',e=>{state.text=`trip to ${e.detail.place}`;state.committed=true;const [start,end]=tripDates();state.tripDraft={place:e.detail.place,start,end};const [year,month]=start.split('-').map(Number);state.calendarYear=year;state.calendarMonth=month-1;render(true)});
