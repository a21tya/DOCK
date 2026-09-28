import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate} from '../src/math.js';
test('calculator respects powers, unary signs and factorial precedence',()=>{
  for(const [query,answer] of [['-2^2',-4],['(-2)^2',4],['2^-2',.25],['2^3^2',512],['2^3!',64],['5!',120],['square of 12',144],['cube root of 27',3],['25% of 200',50]])assert.equal(calculate(query)?.result,answer,query);
});
test('invalid math and division by zero never execute code or return infinity',()=>{
  assert.equal(calculate('1/0').result,null);
  assert.equal(calculate('alert(1)'),null);
  assert.equal(calculate('171!'),null);
});
