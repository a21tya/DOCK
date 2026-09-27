import {validateModelPlan} from './intent-plan.js';

export async function interpretPrompt(prompt,{key,model='gemini-3.1-flash-lite',fetchImpl=fetch,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}){
  if(typeof prompt!=='string'||!prompt.trim()||prompt.length>500)return {status:400,body:{error:'INVALID_PROMPT'}};
  const apiKey=typeof key==='string'?key.trim().replace(/^["']|["']$/g,''):'';
  if(!apiKey)return {status:503,body:{error:'AI_NOT_CONFIGURED'}};
  const instruction=`Interpret this DOCK canvas request. Concrete subject: show_object with one relevant emoji. Mood/place: show_atmosphere. Stable factual question: answer. Current/uncertain facts: say live search is needed. Title <=6 words; description <=25 words. No HTML, code, secrets, or claims of generating images. User text: ${JSON.stringify(prompt)}`;
  const responseSchema={type:'OBJECT',properties:{action:{type:'STRING',enum:['show_object','show_atmosphere','answer']},subject:{type:'STRING'},colour:{type:'STRING'},title:{type:'STRING'},description:{type:'STRING'},emoji:{type:'STRING'},colors:{type:'ARRAY',items:{type:'STRING'},minItems:3,maxItems:3}},required:['action','title','description','emoji','colors']};
  const deadline=Date.now()+10000;
  for(let attempt=0;attempt<2;attempt++)try{
    const upstream=await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{
      method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},
      body:JSON.stringify({contents:[{parts:[{text:instruction}]}],generationConfig:{responseMimeType:'application/json',responseSchema,maxOutputTokens:256,...(model.startsWith('gemini-3')?{thinkingConfig:{thinkingBudget:0}}:{})}}),
      signal:AbortSignal.timeout(Math.max(1,deadline-Date.now())),
    });
    if(!upstream.ok){
      console.error('DOCK_MODEL_UPSTREAM_STATUS',upstream.status);
      if((upstream.status===429||upstream.status>=500)&&attempt===0&&deadline-Date.now()>1500){await sleep(250);continue}
      return {status:upstream.status===429?503:502,body:{error:upstream.status===429?'MODEL_BUSY':'MODEL_UNAVAILABLE'}};
    }
    const payload=await upstream.json();
    const raw=payload.candidates?.[0]?.content?.parts?.map(part=>part.text||'').join('');
    const plan=validateModelPlan(JSON.parse(raw||'{}'));
    if(!plan)console.error('DOCK_MODEL_INVALID_PLAN');
    return plan?{status:200,body:plan}:{status:502,body:{error:'INVALID_MODEL_PLAN'}};
  }catch(error){
    console.error('DOCK_MODEL_ERROR',error?.name||'unknown');
    if(error?.name!=='TimeoutError'&&error?.name!=='AbortError'&&attempt===0&&deadline-Date.now()>1500){await sleep(250);continue}
    return {status:504,body:{error:'MODEL_TIMEOUT'}};
  }
}
