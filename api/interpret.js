import {interpretPrompt} from '../src/model-server.js';

export default async function handler(request,response){
  response.setHeader('Cache-Control','no-store');
  response.setHeader('X-Content-Type-Options','nosniff');
  if(request.method!=='POST'){
    response.setHeader('Allow','POST');
    return response.status(405).json({error:'METHOD_NOT_ALLOWED'});
  }
  let body=request.body;
  if(typeof body==='string'){
    if(body.length>10000)return response.status(413).json({error:'PROMPT_TOO_LONG'});
    try{body=JSON.parse(body)}catch{return response.status(400).json({error:'INVALID_REQUEST'})}
  }
  const result=await interpretPrompt(body?.prompt,{key:process.env.GEMINI_API_KEY,model:process.env.GEMINI_MODEL||'gemini-3.1-flash-lite'});
  return response.status(result.status).json(result.body);
}
