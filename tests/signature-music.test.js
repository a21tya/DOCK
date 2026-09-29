import test from 'node:test';
import assert from 'node:assert/strict';
import {notesForSignature} from '../src/signature-music.js';

test('a saved mark produces a stable, playable melody that changes with the mark',()=>{
  const first={number:1,mode:'draw',strokes:[[[.1,.1],[.3,.8],[.5,.3],[.7,.9],[.9,.2]]]};
  const second={...first,strokes:[[[.1,.9],[.3,.2],[.5,.7],[.7,.1],[.9,.8]]]};
  const a=notesForSignature(first),b=notesForSignature(second);
  assert.deepEqual(a,notesForSignature(first));assert.notDeepEqual(a,b);
  assert.equal(a.length,9);assert.ok(a.every(note=>Number.isFinite(note.frequency)&&note.frequency>0&&note.duration>.1));
  assert.equal(notesForSignature({number:2,mode:'type',name:'Visitor'}).length,9);
});
