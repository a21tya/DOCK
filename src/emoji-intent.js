import emojiKeywords from 'emojilib/dist/emoji-en-US.json' with {type:'json'};

const preferred={milk:'🥛',rabbit:'🐇',bunny:'🐇',dog:'🐕',cat:'🐈',fox:'🦊',wolf:'🐺',lion:'🦁',tiger:'🐅',bear:'🐻',panda:'🐼',horse:'🐎',cow:'🐄',pig:'🐖',sheep:'🐑',goat:'🐐',elephant:'🐘',giraffe:'🦒',zebra:'🦓',monkey:'🐒',gorilla:'🦍',deer:'🦌',mouse:'🐁',rat:'🐀',squirrel:'🐿️',hedgehog:'🦔',koala:'🐨',kangaroo:'🦘',chicken:'🐓',duck:'🦆',owl:'🦉',eagle:'🦅',parrot:'🦜',penguin:'🐧',flamingo:'🦩',fish:'🐟',shark:'🦈',whale:'🐋',dolphin:'🐬',octopus:'🐙',crab:'🦀',turtle:'🐢',frog:'🐸',snake:'🐍',lizard:'🦎',butterfly:'🦋',bee:'🐝',ladybug:'🐞',ant:'🐜',spider:'🕷️',dragon:'🐉'};
const aliases=new Map();
for(const [emoji,names] of Object.entries(emojiKeywords))for(const [priority,name] of names.entries()){
  const key=name.toLowerCase().replace(/_/g,' ');
  if(!aliases.has(key)||priority===0)aliases.set(key,emoji);
}
const emojis=new Set(Object.keys(emojiKeywords));
const segmenter=new Intl.Segmenter(undefined,{granularity:'grapheme'});
const singular=word=>word.endsWith('ies')?word.slice(0,-3)+'y':word.endsWith('xes')?word.slice(0,-2):word.endsWith('s')&&!word.endsWith('ss')?word.slice(0,-1):word;

export function findEmoji(text){
  for(const {segment} of segmenter.segment(text))if(emojis.has(segment)||/[\p{Extended_Pictographic}\p{Regional_Indicator}]/u.test(segment))
    return {emoji:segment,subject:emojiKeywords[segment]?.[0]?.replace(/_/g,' ')||'emoji',animal:false};
  const words=text.toLowerCase().match(/[a-z]+/g)||[];
  // Familiar animals and milk are reliable subjects even inside descriptive prompts.
  for(const word of words){
    const subject=singular(word),emoji=preferred[subject];
    if(emoji)return {emoji,subject,animal:subject!=='milk'};
  }
  // The full emoji dictionary has aliases such as “zero” and “high” that are
  // incidental in a sentence. Use it for a direct subject or wallpaper request.
  const direct=words.length===1?words[0]:/^(?:show|make|create)?\s*(?:me\s+)?(?:a\s+)?([a-z]+)\s+(?:everywhere|wallpaper|background)$/i.exec(text)?.[1];
  if(!direct)return null;
  const subject=singular(direct),emoji=aliases.get(subject)||aliases.get(direct);
  if(!emoji||subject.length<3)return null;
  return {emoji,subject,animal:emojiKeywords[emoji]?.includes('animal')||emojiKeywords[emoji]?.includes('pet')||false};
}
