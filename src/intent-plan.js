// Small, deterministic intent layer. The model uses the same shape for new subjects.
const colours = ['red','orange','yellow','green','lime','blue','navy','purple','violet','pink','black','white','grey','gray','brown','gold','silver','teal','cyan'];
const subjects = [
  {name:'car',aliases:['car','cars','automobile','vehicle'],emoji:'🚗'},
  {name:'bicycle',aliases:['bicycle','bike','bikes'],emoji:'🚲'},
  {name:'house',aliases:['house','home','houses'],emoji:'🏠'},
  {name:'rabbit',aliases:['rabbit','bunny','rabbits'],emoji:'🐇'},
  {name:'dog',aliases:['dog','dogs','puppy'],emoji:'🐕'},
  {name:'cat',aliases:['cat','cats','kitten'],emoji:'🐈'},
  {name:'flower',aliases:['flower','flowers'],emoji:'🌼'},
  {name:'milk',aliases:['milk'],emoji:'🥛'},
  {name:'egg',aliases:['egg','eggs'],emoji:'🥚'},
];

export function localObjectPlan(input){
  const text=String(input||'').toLowerCase();
  if(/\b(?:not|without|except)\s+(?:a\s+)?(?:red|blue|green|black|white|pink|yellow)\b/.test(text))return null;
  const foundColours=colours.filter(colour=>new RegExp(`\\b${colour}\\b`).test(text));
  const foundSubjects=subjects.filter(subject=>subject.aliases.some(alias=>new RegExp(`\\b${alias}\\b`).test(text)));
  if(foundColours.length!==1||foundSubjects.length!==1)return null;
  return {action:'show_object',subject:foundSubjects[0].name,colour:foundColours[0]==='gray'?'grey':foundColours[0],emoji:foundSubjects[0].emoji};
}

export function validateModelPlan(data){
  if(Array.isArray(data))data=data.find(x=>x&&typeof x==='object'&&['show_object','show_atmosphere','answer'].includes(x?.action))||data[0];
  if(!data||typeof data!=='object')return null;
  if(!['show_object','show_atmosphere','answer'].includes(data.action))return null;
  const plain=value=>typeof value==='string'?value.trim():'';
  const rawColors=Array.isArray(data.colors)?data.colors.slice(0,3):[];
  const colours=rawColors.length===3&&rawColors.every(c=>typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c))?rawColors:null;
  const title=plain(data.title).slice(0,80),description=plain(data.description).slice(0,240);
  const emoji=plain(data.emoji).slice(0,12);
  const subject=plain(data.subject).slice(0,50);
  if(data.action==='show_object'&&(!subject||!emoji||!colours))return null;
  if(data.action==='show_atmosphere'&&!colours)return null;
  if(data.action==='answer'&&!description)return null;
  return {action:data.action,subject,colour:plain(data.colour).slice(0,30),emoji,colors:colours,title,description};
}

const numberWords={a:1,an:1,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,sixty:60};
export function parseDuration(input){
  const text=String(input||'').toLowerCase();
  const match=text.match(/\b(\d+(?:\.\d+)?|a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty)(?:[ -](one|two|three|four|five|six|seven|eight|nine))?[ -]?(seconds?|secs?|minutes?|mins?|hours?|hrs?)\b/);
  if(!match)return null;
  const amount=/^(?:a|an)$/.test(match[1])&&match[2]?numberWords[match[2]]:(Number(match[1])||numberWords[match[1]]||0)+(match[2]?numberWords[match[2]]:0);
  const unit=match[3][0];
  const seconds=Math.round(amount*(unit==='h'?3600:unit==='m'?60:1));
  return seconds>0&&seconds<=86400?seconds:null;
}

export function parseRelativeReminderText(input){
  const text=String(input||'').trim();
  const match=text.match(/^remind me(?: to)?\s+(.+?)\s+in\s+(.+)$/i)||text.match(/^remind me\s+in\s+(.+?)\s+to\s+(.+)$/i);
  if(!match)return null;
  const reversed=/^remind me\s+in\b/i.test(text);
  const label=(reversed?match[2]:match[1]).trim().replace(/[.!?]+$/,'');
  const duration=(reversed?match[1]:match[2]).trim().replace(/[.!?]+$/,'');
  const seconds=parseDuration(duration);
  return label&&seconds&&/^(?:(?:\d+(?:\.\d+)?)|[a-z-]+)(?:[ -][a-z-]+)?\s*(?:seconds?|secs?|minutes?|mins?|hours?|hrs?)$/i.test(duration)?{label,seconds}:null;
}

export function parseNaturalList(input){
  const match=String(input||'').trim().match(/^i\s+(?:need|want)\s+(?!to\b)(.+)$/i);
  if(!match||!/,|\band\b|;/.test(match[1]))return null;
  const items=match[1].split(/\s*(?:,|;|\band\b)\s*/i).map(x=>x.trim().replace(/[.!?]+$/,'')).filter(Boolean);
  return items.length>=2&&items.every(x=>x.length<=45)?items:null;
}

const fillerWords=new Set(['a','an','the','i','me','my','you','your','please','show','make','create','draw','paint','put','give','want','need','can','could','would','for','of','to','this','that','it','like','with','on','in','is','as','some','something']);
function meaningTokens(input){
  return [...new Set(String(input||'').toLowerCase().normalize('NFKC').match(/[\p{L}\p{N}]+/gu)?.map(word=>word.length>4&&word.endsWith('s')?word.slice(0,-1):word).filter(word=>word.length>1&&!fillerWords.has(word))||[])].sort();
}

// A small browser-trained example matcher. It only generalizes when at least
// two meaningful words agree exactly, so one correction cannot hijack a topic.
export function matchTeaching(input,teachings){
  const query=String(input||'').trim().toLowerCase();
  if(!query||!Array.isArray(teachings))return null;
  const exact=teachings.findLast(item=>item?.phrase===query);
  if(exact)return {...exact,similar:false};
  const queryTokens=meaningTokens(query);
  if(queryTokens.length<2)return null;
  let best=null;
  for(const item of teachings){
    if(typeof item?.phrase!=='string'||typeof item?.target!=='string')continue;
    const learnedTokens=meaningTokens(item.phrase);
    if(learnedTokens.length<2)continue;
    const shared=queryTokens.filter(token=>learnedTokens.includes(token)).length;
    const score=shared/(new Set([...queryTokens,...learnedTokens]).size);
    if(shared>=2&&score>=0.8&&(!best||score>best.score))best={...item,similar:true,score};
  }
  return best;
}
