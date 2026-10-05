import { test } from 'node:test';
import assert from 'node:assert/strict';
import { truncate } from '../src/core.js';

// --- Happy path -----------------------------------------------------------

test('returns the input unchanged when it fits within max', () => {
  assert.equal(truncate('hello world', 11), 'hello world');
});

test('returns the input unchanged when it is shorter than max', () => {
  assert.equal(truncate('hi', 100), 'hi');
});

test('cuts at a word boundary when the slice lands exactly between words', () => {
  // "hello" is 5 chars; position 5 is a space. Slice is "hello", next char is
  // whitespace, so we keep it as-is.
  assert.equal(truncate('hello world', 5), 'hello');
});

test('rewinds to the previous word boundary when the slice cuts mid-word', () => {
  // max=8 gives slice "hello wo" — we're inside "world". Rewind to "hello".
  assert.equal(truncate('hello world', 8), 'hello');
});

test('appends the requested ellipsis when truncation occurs', () => {
  assert.equal(truncate('hello world', 8, { ellipsis: '...' }), 'hello...');
});

test('does not append an ellipsis when no truncation occurs', () => {
  assert.equal(truncate('hello world', 11, { ellipsis: '...' }), 'hello world');
});

// --- Edge cases the implementation explicitly handles --------------------

test('returns empty string when max is 0 and no ellipsis', () => {
  assert.equal(truncate('hello world', 0), '');
});

test('returns only the ellipsis when max is 0 and ellipsis is set', () => {
  assert.equal(truncate('hello world', 0, { ellipsis: '...' }), '...');
});

test('returns empty + ellipsis when the first word is longer than max', () => {
  // "supercalifragilistic" is 20 chars; max=5 can't hold any full word.
  assert.equal(truncate('supercalifragilistic expialidocious', 5, { ellipsis: '...' }), '...');
});

test('returns empty string when the first word is longer than max and no ellipsis', () => {
  assert.equal(truncate('supercalifragilistic expialidocious', 5), '');
});

test('handles a custom ellipsis string', () => {
  assert.equal(truncate('hello world', 8, { ellipsis: ' [more]' }), 'hello [more]');
});

test('floors a non-integer max', () => {
  // 8.9 floors to 8, which cuts inside "world" and rewinds to "hello".
  assert.equal(truncate('hello world', 8.9), 'hello');
});

test('preserves internal whitespace structure of kept text', () => {
  // max=6 → slice "a  b c", next char is "d" (inside "cd"), rewind past "c"
  // to the space before it, strip that one trailing space.
  assert.equal(truncate('a  b cd ef', 6), 'a  b');
});

// --- Input validation ----------------------------------------------------

test('throws TypeError when input is not a string', () => {
  assert.throws(() => truncate(42, 10), { name: 'TypeError' });
});

test('throws TypeError when max is not a number', () => {
  assert.throws(() => truncate('hi', '5'), { name: 'TypeError' });
});

test('throws TypeError when max is NaN', () => {
  assert.throws(() => truncate('hi', NaN), { name: 'TypeError' });
});

test('throws TypeError when max is Infinity', () => {
  assert.throws(() => truncate('hi', Infinity), { name: 'TypeError' });
});

test('throws RangeError when max is negative', () => {
  assert.throws(() => truncate('hi', -1), { name: 'RangeError' });
});
