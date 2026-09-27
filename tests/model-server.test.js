import test from 'node:test';
import assert from 'node:assert/strict';
import {interpretPrompt} from '../src/model-server.js';

test('hosted interpreter requires a key and validates prompts',async()=>{
  assert.equal((await interpretPrompt('rabbit')).status,503);
  assert.equal((await interpretPrompt('',{key:'test'})).status,400);
});

test('hosted interpreter returns only a validated visual plan',async()=>{
  let request;
  const fetchImpl=async(url,options)=>{
    request={url,options};
    return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify({action:'show_object',subject:'rabbit',colour:'purple',emoji:'🐇',colors:['#aaccee','#446688','#112233'],title:'A purple rabbit',description:'A rabbit scene'})}]}}]})};
  };
  const result=await interpretPrompt('a purple rabbit',{key:'test-secret',fetchImpl});
  assert.equal(result.status,200);
  assert.equal(result.body.subject,'rabbit');
  assert.equal(request.options.headers['x-goog-api-key'],'test-secret');
  assert.equal(JSON.stringify(result.body).includes('test-secret'),false);
  assert.equal(JSON.parse(request.options.body).generationConfig.responseMimeType,'application/json');
});

test('hosted interpreter rejects invalid model actions',async()=>{
  const fetchImpl=async()=>({ok:true,json:async()=>({candidates:[{content:{parts:[{text:'{"action":"run_code"}'}]}}]})});
  assert.equal((await interpretPrompt('run something',{key:'test',fetchImpl})).status,502);
});

test('temporary model failures retry once and return a usable result',async()=>{
  let calls=0;
  const fetchImpl=async()=>{
    calls++;
    if(calls===1)return {ok:false,status:503};
    return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify({action:'show_atmosphere',subject:'mist',colors:['#aaccee','#446688','#112233'],title:'Soft mist',description:'A misty landscape'})}]}}]})};
  };
  const result=await interpretPrompt('misty hills',{key:'test',fetchImpl,sleep:async()=>{}});
  assert.equal(result.status,200);
  assert.equal(calls,2);
});

test('persistent rate limits have a distinct status without exposing credentials',async()=>{
  let calls=0;
  const result=await interpretPrompt('unknown scene',{key:'secret',fetchImpl:async()=>{calls++;return {ok:false,status:429}},sleep:async()=>{}});
  assert.equal(result.status,503);
  assert.equal(result.body.error,'MODEL_BUSY');
  assert.equal(calls,2);
  assert.equal(JSON.stringify(result).includes('secret'),false);
});
