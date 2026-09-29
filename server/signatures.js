import {createHash, timingSafeEqual} from 'node:crypto';

export function validateSignature(body){
  if(!body || !/^[a-f0-9-]{36}$/i.test(body.id||''))throw new Error('Invalid receipt. Please reload and try again.');
  const name=typeof body.name==='string'?body.name.trim():'';
  if(!name||name.length>60)throw new Error('Enter a name of up to 60 characters.');
  if(body.consent!==true)throw new Error('Please agree to private storage before signing.');
  const mode=body.mode;
  if(!['draw','type'].includes(mode))throw new Error('Choose a signing method.');
  let strokes=[];
  if(mode==='draw'){
    if(!Array.isArray(body.strokes)||!body.strokes.length||body.strokes.length>100)throw new Error('Draw your signature first.');
    let total=0;
    strokes=body.strokes.map(stroke=>{
      if(!Array.isArray(stroke)||stroke.length<1)throw new Error('Invalid drawing.');
      total+=stroke.length;
      return stroke.map(point=>{
        if(!Array.isArray(point)||point.length!==2||!point.every(n=>Number.isFinite(n)&&n>=0&&n<=1))throw new Error('Invalid drawing.');
        return point.map(n=>Math.round(n*10000)/10000);
      });
    });
    if(total<5||total>3000)throw new Error('Use a signature between 5 and 3,000 points.');
  }
  return {id:body.id,name,mode,strokes,createdAt:new Date().toISOString()};
}
const saveScript=`
local previous=redis.call('HGET',KEYS[1],ARGV[1])
if previous then return {redis.call('GET',KEYS[3]) or '0',previous} end
local count=redis.call('INCR',KEYS[3])
local item=cjson.decode(ARGV[2]); item.number=count
local encoded=cjson.encode(item)
redis.call('HSET',KEYS[1],ARGV[1],encoded)
redis.call('ZADD',KEYS[2],ARGV[3],ARGV[1])
return {tostring(count),encoded}`;
function authorized(header,secret){
  if(!secret||secret.length<32)return false;
  const expected=createHash('sha256').update(`Bearer ${secret}`).digest();
  const actual=createHash('sha256').update(header||'').digest();
  return timingSafeEqual(expected,actual);
}
export async function handleSignatures(req,{env=process.env,fetcher=fetch}={}){
  const url=env.UPSTASH_REDIS_REST_URL||env.KV_REST_API_URL;
  const token=env.UPSTASH_REDIS_REST_TOKEN||env.KV_REST_API_TOKEN;
  const reply=(status,body)=>({status,body});
  if(!url||!token||!env.SIGNATURE_ADMIN_TOKEN||env.SIGNATURE_ADMIN_TOKEN.length<32)return reply(503,{error:'The signature book is being connected. Please check back soon.',count:null});
  async function redis(...command){
    const response=await fetcher(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(command),signal:AbortSignal.timeout(8000)});
    if(!response.ok)throw new Error('Storage unavailable');
    const data=await response.json();if(data.error)throw new Error('Storage unavailable');return data.result;
  }
  try{
    if(req.method==='GET'&&req.query?.view!=='private')return reply(200,{count:Number(await redis('GET','dock:signatures:count')||0)});
    if(req.method==='GET'){
      const ip=createHash('sha256').update(req.ip||'unknown').digest('hex').slice(0,24);
      const key=`dock:signatures:auth:${ip}:${Math.floor(Date.now()/60000)}`;
      const attempts=Number(await redis('INCR',key));if(attempts===1)await redis('EXPIRE',key,120);
      if(attempts>20)return reply(429,{error:'Too many attempts. Try again in a minute.'});
      if(!req.authorization)return reply(401,{error:'Enter your owner access key.'});
      if(!authorized(req.authorization,env.SIGNATURE_ADMIN_TOKEN))return reply(401,{error:'That owner key does not match this site. Use the SIGNATURE_ADMIN_TOKEN saved for DOCK in Vercel.'});
      const offset=Math.max(0,Math.min(1000000,Math.floor(Number(req.query.offset)||0)));
      const ids=await redis('ZREVRANGE','dock:signatures:order',offset,offset+19);
      const records=ids.length?await redis('HMGET','dock:signatures:records',...ids):[];
      return reply(200,{records:records.filter(Boolean).map(JSON.parse),count:Number(await redis('GET','dock:signatures:count')||0),offset});
    }
    if(req.method!=='POST')return reply(405,{error:'Method not allowed.'});
    let record;try{record=validateSignature(req.body)}catch(error){return reply(400,{error:error.message})}
    const ip=createHash('sha256').update(req.ip||'unknown').digest('hex').slice(0,24);
    const key=`dock:signatures:rate:${ip}:${Math.floor(Date.now()/3600000)}`;
    const attempts=Number(await redis('INCR',key));if(attempts===1)await redis('EXPIRE',key,7200);
    if(attempts>10)return reply(429,{error:'This connection has signed several times. Please try again later.'});
    const [count,saved]=await redis('EVAL',saveScript,3,'dock:signatures:records','dock:signatures:order','dock:signatures:count',record.id,JSON.stringify(record),Date.now());
    const item=JSON.parse(saved);
    // Never return stored names or drawings from the public endpoint, including on a replayed ID.
    return reply(200,{count:Number(count),receipt:{id:item.id,number:item.number,createdAt:item.createdAt}});
  }catch{return reply(503,{error:'The signature book is temporarily unavailable. Your signature has not been confirmed; please retry.'})}
}
