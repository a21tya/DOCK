import {handleSignatures} from '../server/signatures.js';
export default async function handler(request,response){
  response.setHeader('Cache-Control','no-store');
  response.setHeader('X-Content-Type-Options','nosniff');
  if(request.method==='POST'&&(!request.headers['content-type']?.startsWith('application/json')||request.headers['sec-fetch-site']==='cross-site'))return response.status(415).json({error:'Use the DOCK signature form.'});
  let body=request.body;
  if(JSON.stringify(body||'').length>100000)return response.status(413).json({error:'The drawing is too large.'});
  if(typeof body==='string')try{body=JSON.parse(body)}catch{return response.status(400).json({error:'Invalid request.'})}
  const result=await handleSignatures({method:request.method,body,query:request.query,authorization:request.headers.authorization,ip:request.headers['x-vercel-forwarded-for']||request.headers['x-forwarded-for']||request.socket?.remoteAddress});
  return response.status(result.status).json(result.body);
}
