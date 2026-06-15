// predicates.test.mjs — node:test, zero dependencies. Run: node --test src/core/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evalPredicate, predicateFields, assertValidPredicate } from './predicates.mjs';

test('null / boolean constants', () => {
  assert.equal(evalPredicate(null, {}), true);
  assert.equal(evalPredicate(undefined, {}), true);
  assert.equal(evalPredicate(true, {}), true);
  assert.equal(evalPredicate(false, {}), false);
});

test('eq / ne', () => {
  assert.equal(evalPredicate({ field: 'x', op: 'eq', value: 'yes' }, { x: 'yes' }), true);
  assert.equal(evalPredicate({ field: 'x', op: 'eq', value: 'yes' }, { x: 'no' }), false);
  assert.equal(evalPredicate({ field: 'x', op: 'eq', value: 'yes' }, {}), false); // undefined !== 'yes'
  assert.equal(evalPredicate({ field: 'x', op: 'ne', value: 'yes' }, { x: 'no' }), true);
});

test('in / nin', () => {
  const p = { field: 'fs', op: 'in', value: ['mfj', 'mfs'] };
  assert.equal(evalPredicate(p, { fs: 'mfj' }), true);
  assert.equal(evalPredicate(p, { fs: 'mfs' }), true);
  assert.equal(evalPredicate(p, { fs: 'single' }), false);
  assert.equal(evalPredicate(p, {}), false);
  assert.equal(evalPredicate({ field: 'fs', op: 'nin', value: ['mfj'] }, { fs: 'single' }), true);
});

test('has / hasAny / hasAll with array-default semantics (matches v1 `(a.x||[])`)', () => {
  assert.equal(evalPredicate({ field: 'it', op: 'has', value: 'w2' }, { it: ['w2', 'contractor'] }), true);
  assert.equal(evalPredicate({ field: 'it', op: 'has', value: 'w2' }, { it: ['contractor'] }), false);
  assert.equal(evalPredicate({ field: 'it', op: 'has', value: 'w2' }, {}), false); // undefined -> []
  assert.equal(evalPredicate({ field: 'it', op: 'has', value: 'w2' }, { it: null }), false);
  assert.equal(evalPredicate({ field: 'it', op: 'hasAny', value: ['contractor', 'business'] }, { it: ['w2', 'business'] }), true);
  assert.equal(evalPredicate({ field: 'it', op: 'hasAny', value: ['contractor', 'business'] }, { it: ['w2'] }), false);
  assert.equal(evalPredicate({ field: 'it', op: 'hasAll', value: ['w2', 'business'] }, { it: ['w2', 'business', 'retired'] }), true);
  assert.equal(evalPredicate({ field: 'it', op: 'hasAll', value: ['w2', 'business'] }, { it: ['w2'] }), false);
});

test('exists / truthy', () => {
  assert.equal(evalPredicate({ field: 'x', op: 'exists' }, { x: 0 }), true);
  assert.equal(evalPredicate({ field: 'x', op: 'exists' }, { x: null }), false);
  assert.equal(evalPredicate({ field: 'x', op: 'exists' }, {}), false);
  assert.equal(evalPredicate({ field: 'x', op: 'truthy' }, { x: 'yes' }), true);
  assert.equal(evalPredicate({ field: 'x', op: 'truthy' }, { x: '' }), false);
});

test('combinators all / any / not + nesting', () => {
  const p = { all: [{ field: 'it', op: 'has', value: 'w2' }, { field: 'em', op: 'eq', value: 'yes' }] };
  assert.equal(evalPredicate(p, { it: ['w2'], em: 'yes' }), true);
  assert.equal(evalPredicate(p, { it: ['w2'], em: 'no' }), false);
  assert.equal(evalPredicate({ any: [{ field: 'a', op: 'eq', value: 1 }, { field: 'b', op: 'eq', value: 2 }] }, { b: 2 }), true);
  assert.equal(evalPredicate({ not: { field: 'a', op: 'eq', value: 1 } }, { a: 2 }), true);
  // empty all = true (vacuous), empty any = false
  assert.equal(evalPredicate({ all: [] }, {}), true);
  assert.equal(evalPredicate({ any: [] }, {}), false);
});

test('predicateFields collects all referenced fields', () => {
  const p = { all: [{ field: 'it', op: 'has', value: 'w2' }, { any: [{ field: 'em', op: 'eq', value: 'yes' }, { not: { field: 'fs', op: 'eq', value: 'single' } }] }] };
  assert.deepEqual(predicateFields(p).sort(), ['em', 'fs', 'it']);
});

test('assertValidPredicate throws on malformed', () => {
  assert.throws(() => assertValidPredicate({ field: 'x', op: 'bogus' }));
  assert.throws(() => assertValidPredicate({ field: 'x', op: 'in', value: 'not-an-array' }));
  assert.throws(() => assertValidPredicate({ op: 'eq', value: 1 })); // missing field
  assert.doesNotThrow(() => assertValidPredicate({ all: [{ field: 'x', op: 'eq', value: 1 }] }));
});

test('unknown op throws at eval', () => {
  assert.throws(() => evalPredicate({ field: 'x', op: 'nope' }, {}));
});
