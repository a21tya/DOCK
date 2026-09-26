import {readFileSync} from 'node:fs';
import {localObjectPlan} from '../src/intent-plan.js';

const cases=JSON.parse(readFileSync(new URL('../evaluation/seed-prompts.json',import.meta.url),'utf8'));
let matched=0,correct=0,incorrect=0;
for(const item of cases){
  const result=localObjectPlan(item.prompt);
  if(!result)continue;
  matched++;
  if(item.intent==='show_object'&&result.subject===item.subject&&result.colour===item.colour)correct++;
  else{incorrect++;console.log(`Wrong local result: ${item.prompt} → ${result.subject}/${result.colour}`)}
}
console.log(`Local object coverage: ${matched}/${cases.length}; correct: ${correct}; incorrect: ${incorrect}.`);
console.log('Unmatched prompts need another local handler or the hosted model. This is an evaluation baseline, not model training.');
if(incorrect)process.exitCode=1;
