import {validateModelPlan} from './intent-plan.js';

export async function interpretPrompt(prompt,{key,model='gemini-3.1-flash-lite',fetchImpl=fetch,signal,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}){
  if(typeof prompt!=='string'||!prompt.trim()||prompt.length>500)return {status:400,body:{error:'INVALID_PROMPT'}};
  const apiKey=typeof key==='string'?key.trim().replace(/^["']|["']$/g,''):'';
  if(!apiKey)return {status:503,body:{error:'AI_NOT_CONFIGURED'}};
  const instruction=`Create a concise DOCK canvas interpretation for this request. Use show_object for a concrete thing, show_atmosphere for a mood/place/colour, answer only for stable facts. Current facts need live search. Title max 6 words; description max 20 words; provide three hex colours. No HTML or code. Request: ${JSON.stringify(prompt)}`;
  const responseSchema={type:'OBJECT',properties:{action:{type:'STRING',enum:['show_object','show_atmosphere','answer']},subject:{type:'STRING'},colour:{type:'STRING'},title:{type:'STRING'},description:{type:'STRING'},emoji:{type:'STRING'},colors:{type:'ARRAY',items:{type:'STRING'},minItems:3,maxItems:3}},required:['action','subject','title','description','emoji','colors']};
  const controller=new AbortController();
  const onAbort=()=>controller.abort(signal?.reason);
  if(signal?.aborted)controller.abort(signal.reason);
  else signal?.addEventListener('abort',onAbort,{once:true});
  const timer=setTimeout(()=>controller.abort('timeout'),12000);
  try{
    let upstream;
    for(let attempt=0;attempt<2;attempt++){
    upstream=await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{
      method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},
      body:JSON.stringify({contents:[{parts:[{text:instruction}]}],generationConfig:{responseMimeType:'application/json',responseSchema,maxOutputTokens:384,...(model.startsWith('gemini-3')?{thinkingConfig:{thinkingLevel:'minimal'}}:{})}}),
      signal:controller.signal,
    });
    if(upstream.ok||![429,500,502,503,504].includes(upstream.status)||attempt===1||controller.signal.aborted)break;
    await sleep(300);
    }
    if(!upstream.ok){
      console.error('DOCK_MODEL_UPSTREAM_STATUS',upstream.status);
      return {status:upstream.status===429?503:502,body:{error:upstream.status===429?'MODEL_BUSY':'MODEL_UNAVAILABLE'}};
    }
    const payload=await upstream.json();
    const raw=payload.candidates?.[0]?.content?.parts?.filter(part=>!part.thought).map(part=>part.text||'').join('');
    const plan=validateModelPlan(JSON.parse(raw||'{}'));
    if(!plan)console.error('DOCK_MODEL_INVALID_PLAN');
    return plan?{status:200,body:plan}:{status:502,body:{error:'INVALID_MODEL_PLAN'}};
  }catch(error){
    console.error('DOCK_MODEL_ERROR',error?.name||'unknown');
    if(signal?.aborted)return {status:499,body:{error:'REQUEST_CANCELLED'}};
    return {status:504,body:{error:'MODEL_TIMEOUT'}};
  }finally{
    clearTimeout(timer);signal?.removeEventListener('abort',onAbort);
  }
}
