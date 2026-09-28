import test from 'node:test';
import assert from 'node:assert/strict';
import {readStored,writeStored,validList,validReminders,validActivity} from '../src/storage.js';
test('corrupted and incompatible storage cannot prevent startup',()=>{
  for(const raw of ['{','null','{}','[null]']){
    globalThis.localStorage={getItem:()=>raw};
    assert.deepEqual(readStored('reminders',[],validReminders),[]);
    assert.deepEqual(readStored('activity',[],validActivity),[]);
    assert.equal(readStored('list',null,validList),null);
  }
});
test('blocked storage is safe to read and write',()=>{
  Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new Error('denied')}});
  assert.deepEqual(readStored('anything',[]),[]);
  assert.equal(writeStored('anything',[]),false);
  delete globalThis.localStorage;
});
test('valid saved lists survive reload',()=>{
  const saved={text:'buy milk',items:['milk'],checked:[0]};
  globalThis.localStorage={getItem:()=>JSON.stringify(saved)};
  assert.deepEqual(readStored('list',null,validList),saved);
  delete globalThis.localStorage;
});
