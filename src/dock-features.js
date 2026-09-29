import {writeStored} from './storage.js';
export const commands=[
  {label:'India map',hint:'States and districts',prompt:'Indian map',icon:'◎'},
  {label:'Globe',hint:'Countries and capitals',prompt:'world map',icon:'◉'},
  {label:'Weather',hint:'Current conditions',prompt:'weather in Jaipur',icon:'☀'},
  {label:'Calendar',hint:'Your saved dates',prompt:'calendar',icon:'▦'},
  {label:'Appointment',hint:'Plan a meeting',prompt:'meeting at 9 on Sunday',icon:'◷'},
  {label:'Trip',hint:'Choose travel dates',prompt:'trip to Jaipur',icon:'✈'},
  {label:'Timer',hint:'Start a countdown',prompt:'2 min timer',icon:'◴'},
  {label:'Checklist',hint:'Keep a list',prompt:'buy milk, eggs and bread',icon:'☷'},
  {label:'Colour',hint:'Mix a shade',prompt:'red',icon:'◈'},
  {label:'Calculator',hint:'Quick maths',prompt:'square of 12',icon:'＋'},
  {label:'Time',hint:'Another city',prompt:'time in London',icon:'◷'},
  {label:'Games',hint:'Play without wagers',prompt:'games',icon:'♠'},
  {label:'Rock paper scissors',hint:'Quick game',prompt:'rock paper scissors',icon:'✊'},
  {label:'Blackjack',hint:'Cards for fun',prompt:'blackjack',icon:'♠'},
  {label:'Dice',hint:'Roll 2d6',prompt:'roll 2d6',icon:'⚄'},
  {label:'Sunrise',hint:'First light over water',prompt:'sunrise',icon:'☀'},
  {label:'Sunset',hint:'Warm animated sky',prompt:'a warm orange sunset',icon:'☀'},
  {label:'Northern lights',hint:'Animated aurora',prompt:'northern lights',icon:'✦'},
  {label:'Night sky',hint:'Stars after dark',prompt:'a black sky',icon:'☾'},
  {label:'Minecraft diamond',hint:'Pixel scene',prompt:'minecraft diamond',icon:'◆'},
  {label:'Emoji world',hint:'Fill the canvas',prompt:'milk everywhere',icon:'☻'},
  {label:'Animal scene',hint:'A little rabbit',prompt:'rabbit in a meadow',icon:'♧'},
  {label:'Google search',hint:'Explore any topic',prompt:'search for the moon',icon:'↗'},
  {label:'Split a bill',hint:'Share a total',prompt:'split 2400 between 3',icon:'÷'},
  {label:'Cube root',hint:'Quick maths',prompt:'cube root of 27',icon:'∛'},
];
export const sparks=['sunrise','a warm orange sunset','a pink sky','northern lights','red','buy milk, eggs, bread and coffee','minecraft diamond','Indian map','world map','weather in Jaipur','2 min timer','trip to Goa','roll 2d6','blackjack','rock paper scissors'];
export function slashMatch(value){if(!value.startsWith('/'))return [];const q=value.slice(1).trim().toLowerCase();return commands.filter(c=>!q||`${c.label} ${c.hint}`.toLowerCase().includes(q))}
export function parseDice(text){const match=text.trim().match(/^(?:roll\s+)?(\d{1,2})?d(\d{1,3})(?:\s+dice?)?$/i);if(!match)return null;const count=Number(match[1]||1),sides=Number(match[2]);return count>=1&&count<=10&&sides>=2&&sides<=100?{count,sides}:null}
export const randomInt=(max)=>Math.floor(Math.random()*max)+1;
export function makeDeck(){const deck=['♠','♥','♣','♦'].flatMap(suit=>Array.from({length:13},(_,i)=>{const rank=i+1;return {rank:rank===1?'A':rank===11?'J':rank===12?'Q':rank===13?'K':String(rank),value:Math.min(rank,10),ace:rank===1,suit}}));for(let i=deck.length-1;i>0;i--){const j=randomInt(i+1)-1;[deck[i],deck[j]]=[deck[j],deck[i]]}return deck}
export function drawCard(deck){return deck.pop()}
export function handValue(cards){let score=cards.reduce((n,c)=>n+c.value,0);let aces=cards.filter(c=>c.ace).length;while(aces&&score+10<=21){score+=10;aces--}return score}
export function tripDates(){const today=new Date();const start=new Date(today.getTime()+86400000),end=new Date(today.getTime()+4*86400000);return [start,end].map(d=>{const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);const x=Object.fromEntries(p.map(v=>[v.type,v.value]));return `${x.year}-${x.month}-${x.day}`})}
export const saveActivity=items=>writeStored('dock-activity',items.slice(0,40));

// Exclude the last group before shuffling so every refresh reveals four new ideas.
export function createSparkPicker(previous=[],random=Math.random){
  let last=previous;
  return ()=>{
    const pool=sparks.filter(value=>!last.includes(value));
    for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
    last=pool.slice(0,4);return [...last];
  };
}
