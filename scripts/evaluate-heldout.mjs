import {readFileSync} from 'node:fs';
import {localObjectPlan,parseDuration,parseRelativeReminderText,parseNaturalList} from '../src/intent-plan.js';
import {findEmoji} from '../src/emoji-intent.js';

const cases=JSON.parse(readFileSync(new URL('../evaluation/held-out-prompts.json',import.meta.url),'utf8'));
let correct=0;
for(const item of cases){
  const object=localObjectPlan(item.prompt);
  const reminder=parseRelativeReminderText(item.prompt);
  const list=parseNaturalList(item.prompt);
  const emoji=findEmoji(item.prompt);
  const timer=/\b(?:timer|focus|countdown)\b/i.test(item.prompt)?parseDuration(item.prompt):null;
  const kind=object?'object':reminder?'relative-reminder':list?'list':timer?'timer':emoji?'emoji':'model';
  const result={kind,subject:object?.subject,colour:object?.colour,emoji:emoji?.emoji,seconds:reminder?.seconds||timer||undefined,items:list||undefined};
  const expected=Object.fromEntries(Object.entries(item).filter(([key])=>key!=='prompt'));
  const passes=Object.entries(expected).every(([key,value])=>JSON.stringify(result[key])===JSON.stringify(value));
  if(passes)correct++;
  else console.log(`Mismatch: ${item.prompt} → ${JSON.stringify(result)}`);
}
console.log(`Held-out local routing: ${correct}/${cases.length} correct. This checks pure local handlers only; it does not score Gemini or the full browser.`);
if(correct!==cases.length)process.exitCode=1;
