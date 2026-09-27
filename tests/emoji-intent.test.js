import test from 'node:test';
import assert from 'node:assert/strict';
import {findEmoji} from '../src/emoji-intent.js';

test('direct subjects and literal emojis stay instant',()=>{
  assert.equal(findEmoji('milk everywhere')?.emoji,'🥛');
  assert.equal(findEmoji('rabbit in a meadow')?.emoji,'🐇');
  assert.equal(findEmoji('a moonlit orchard of crystal foxes')?.emoji,'🦊');
  assert.equal(findEmoji('🐙')?.emoji,'🐙');
});

test('incidental emoji aliases do not steal unfamiliar prompts',()=>{
  assert.equal(findEmoji('surreal nostalgia in zero gravity'),null);
  assert.equal(findEmoji('a bioluminescent pangolin in a blizzard'),null);
  assert.equal(findEmoji('a quiet glass city under violet clouds'),null);
});
