import test from 'node:test';
import assert from 'node:assert/strict';
import {validateSignature,handleSignatures} from '../server/signatures.js';
const body={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',name:'Visitor',mode:'type',consent:true};
const env={UPSTASH_REDIS_REST_URL:'https://storage.example',UPSTASH_REDIS_REST_TOKEN:'secret',SIGNATURE_ADMIN_TOKEN:'a'.repeat(40)};
function database(){
 const values=new Map(),records=new Map(),ids=[];
 return async(_url,options)=>{const [command,...args]=JSON.parse(options.body);let result;
 if(command==='GET')result=values.get(args[0])||null;
 else if(command==='INCR'){result=Number(values.get(args[0])||0)+1;values.set(args[0],result)}
 else if(command==='EXPIRE')result=1;
 else if(command==='EVAL'){const id=args[5],record=JSON.parse(args[6]);if(!records.has(id)){record.number=records.size+1;records.set(id,JSON.stringify(record));ids.unshift(id);values.set('dock:signatures:count',records.size)}result=[String(records.size),records.get(id)]}
 else if(command==='ZREVRANGE')result=ids.slice(args[1],args[2]+1);
 else if(command==='HMGET')result=args.slice(1).map(id=>records.get(id));
 else throw new Error('Unexpected command '+command);
 return {ok:true,json:async()=>({result})};};
}
test('signature validation rejects malformed, unconsented and oversized data',()=>{
 for(const invalid of [{...body,consent:false},{...body,name:'x'.repeat(61)},{...body,id:'bad'},{...body,mode:'draw',strokes:[[[Infinity,0]]]},{...body,mode:'draw',strokes:[Array.from({length:3001},()=>[.5,.5])]}])assert.throws(()=>validateSignature(invalid));
 assert.equal(validateSignature(body).name,'Visitor');
});
test('count persists across requests; retries are idempotent; archive requires owner authentication',async()=>{
 const options={env,fetcher:database()};
 const first=await handleSignatures({method:'POST',body,ip:'one'},options);
 assert.equal(first.status,200);assert.equal(first.body.count,1);
 const retry=await handleSignatures({method:'POST',body:{...body,name:'Different'},ip:'one'},options);
 assert.equal(retry.body.count,1);assert.equal(retry.body.receipt.number,1);assert.equal(JSON.stringify(retry.body).includes('Visitor'),false);
 const publicCount=await handleSignatures({method:'GET'},options);assert.deepEqual(publicCount.body,{count:1});
 const denied=await handleSignatures({method:'GET',query:{view:'private'}},options);assert.equal(denied.status,401);assert.equal(denied.body.records,undefined);
 const wrong=await handleSignatures({method:'GET',query:{view:'private'},authorization:'Bearer wrong-key'},options);assert.equal(wrong.status,401);assert.match(wrong.body.error,/does not match/);
 const archive=await handleSignatures({method:'GET',query:{view:'private'},authorization:`Bearer ${env.SIGNATURE_ADMIN_TOKEN}`},options);
 assert.equal(archive.body.records[0].name,'Visitor');assert.equal(archive.body.count,1);
});
test('storage failures do not invent a count or a successful save',async()=>{
 assert.equal((await handleSignatures({method:'GET'},{env:{}})).status,503);
 assert.equal((await handleSignatures({method:'POST',body},{env,fetcher:async()=>{throw new Error('offline')}})).status,503);
});
test('submission rate limit applies across requests',async()=>{
 const options={env,fetcher:database()};for(let n=0;n<10;n++)assert.equal((await handleSignatures({method:'POST',body,ip:'same'},options)).status,200);
 assert.equal((await handleSignatures({method:'POST',body,ip:'same'},options)).status,429);
});
