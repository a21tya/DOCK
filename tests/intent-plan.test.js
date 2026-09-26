import test from 'node:test';
import assert from 'node:assert/strict';
import {localObjectPlan,validateModelPlan,parseDuration,parseRelativeReminderText,parseNaturalList,matchTeaching} from '../src/intent-plan.js';

test('equivalent colour and object phrases produce the same plan',()=>{
  const expected={action:'show_object',subject:'car',colour:'red',emoji:'🚗'};
  for(const prompt of ['a red car','the colour of the car is red','make the car red','a red automobile']){
    assert.deepEqual(localObjectPlan(prompt),expected);
  }
});

test('ambiguous and negated requests do not produce a misleading local plan',()=>{
  assert.equal(localObjectPlan('a red car and a blue bike'),null);
  assert.equal(localObjectPlan('a car that is not red'),null);
});

test('model plans must be known actions with valid visual colours',()=>{
  assert.equal(validateModelPlan({action:'run_code',colors:['#ffffff','#000000','#111111']}),null);
  assert.equal(validateModelPlan({action:'show_object',subject:'car',emoji:'🚗',colors:['red','#000000','#111111']}),null);
  assert.equal(validateModelPlan({action:'show_object',subject:'car',emoji:'🚗',colors:['#ffffff','#000000','#111111']})?.action,'show_object');
});

test('everyday timer and relative reminder wording',()=>{
  assert.equal(parseDuration('set a two-minute timer'),120);
  assert.equal(parseDuration('25 min focus'),1500);
  assert.deepEqual(parseRelativeReminderText('remind me to call Mom in five minutes'),{label:'call Mom',seconds:300});
  assert.deepEqual(parseRelativeReminderText('remind me in 5 minutes to call Mom'),{label:'call Mom',seconds:300});
  assert.equal(parseRelativeReminderText('remind me to call Mom'),null);
});

test('natural shopping phrasing needs multiple clear items',()=>{
  assert.deepEqual(parseNaturalList('I need milk and eggs'),['milk','eggs']);
  assert.deepEqual(parseNaturalList('I want bread, eggs and coffee'),['bread','eggs','coffee']);
  assert.equal(parseNaturalList('I need a red car'),null);
});

test('a correction covers close wording without hijacking another subject',()=>{
  const examples=[{phrase:'paint me a violet galaxy',target:'purple sky'}];
  assert.equal(matchTeaching('show me a violet galaxy',examples)?.target,'purple sky');
  assert.equal(matchTeaching('paint me a violet garden',examples),null);
  assert.equal(matchTeaching('violet',examples),null);
  assert.equal(matchTeaching('paint me a violet galaxy',examples)?.similar,false);
});
