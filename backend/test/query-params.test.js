const test = require('node:test');
const assert = require('node:assert/strict');

const { parseNumberParam, parseItemTypesParam } = require('../utils/query-params');

test('parseNumberParam returns default for undefined', () => {
  assert.strictEqual(parseNumberParam(undefined, 10), 10);
});

test('parseNumberParam returns default for null', () => {
  assert.strictEqual(parseNumberParam(null, 4), 4);
});

test('parseNumberParam retains zero values', () => {
  assert.strictEqual(parseNumberParam('0', 5), 0);
  assert.strictEqual(parseNumberParam(0, 5), 0);
});

test('parseNumberParam uses the first value from arrays', () => {
  assert.strictEqual(parseNumberParam(['15', '20'], 3), 15);
});

test('parseNumberParam returns default for invalid numbers', () => {
  assert.strictEqual(parseNumberParam('foo', 7), 7);
  assert.strictEqual(parseNumberParam(NaN, 7), 7);
});

test('parseNumberParam trims whitespace', () => {
  assert.strictEqual(parseNumberParam(' 42 ', 0), 42);
});

test('parseNumberParam returns default for blank strings', () => {
  assert.strictEqual(parseNumberParam('   ', 9), 9);
});

test('parseItemTypesParam returns empty array when missing', () => {
  const { itemTypes, error } = parseItemTypesParam(undefined);
  assert.deepEqual(itemTypes, []);
  assert.equal(error, undefined);
});

test('parseItemTypesParam returns empty array for null', () => {
  const { itemTypes, error } = parseItemTypesParam(null);
  assert.deepEqual(itemTypes, []);
  assert.equal(error, undefined);
});

test('parseItemTypesParam parses valid comma-separated values', () => {
  const { itemTypes, error } = parseItemTypesParam('1,2, 3');
  assert.deepEqual(itemTypes, [1, 2, 3]);
  assert.equal(error, undefined);
});

test('parseItemTypesParam rejects invalid entries', () => {
  const { itemTypes, error } = parseItemTypesParam('1,foo,3');
  assert.deepEqual(itemTypes, undefined);
  assert.equal(error, 'Invalid itemTypes parameter');
});

test('parseItemTypesParam ignores empty segments', () => {
  const { itemTypes, error } = parseItemTypesParam(' , 5 ,, 6 ');
  assert.deepEqual(itemTypes, [5, 6]);
  assert.equal(error, undefined);
});

test('parseItemTypesParam flattens array inputs', () => {
  const { itemTypes, error } = parseItemTypesParam(['7', '8']);
  assert.deepEqual(itemTypes, [7, 8]);
  assert.equal(error, undefined);
});
