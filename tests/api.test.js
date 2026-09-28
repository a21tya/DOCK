import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/interpret.js';
function response(){return {headers:{},setHeader(k,v){this.headers[k]=v},status(code){this.code=code;return this},json(body){this.body=body;return this}}}
test('API rejects unsupported methods and malformed input',async()=>{
  for(const [req,status] of [[{method:'GET'},405],[{method:'POST',body:'{'},400],[{method:'POST',body:'x'.repeat(10001)},413],[{method:'POST',body:{prompt:'x'.repeat(501)}},400]]){
    const res=response();await handler(req,res);assert.equal(res.code,status);assert.equal(res.headers['Cache-Control'],'no-store');
  }
});
