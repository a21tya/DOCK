import {interpretPrompt} from '../src/model-server.js';

export default async function handler(request,response){
  response.setHeader('Cache-Control','no-store');
  if(request.method!=='POST')return response.status(405).json({error:'METHOD_NOT_ALLOWED'});
  const prompt=request.body?.prompt;
  const result=await interpretPrompt(prompt,{key:process.env.GEMINI_API_KEY,model:process.env.GEMINI_MODEL||'gemini-3.1-flash-lite'});
  return response.status(result.status).json(result.body);
}
