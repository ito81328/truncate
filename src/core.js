/**
 * Core truncation logic for the Truncate library.
 *
 * Design decisions (stated plainly so the tests and README agree):
 *
 * 1. "Word" means a maximal run of characters that are NOT whitespace.
 *   We do not attempt Unicode word-boundary segmentation, and we do not treat
 *   punctuation as its own word. "hello, world" has two words: "hello," and
 *   "world". This is the simplest interpretation that is still useful and is
 *   easy to reason about in tests.
 *
 * 2. Truncation cuts at the last word boundary that fits within `max`
 *   characters of the original string. If the character after the cut is not
 *   whitespace (i.e. we stopped mid-word), we rewind to the end of the
 *   previous word. If there IS no previous word (the first word is longer
 *   than `max`), we return the empty string rather than a partial word,
 *   because the whole point of this library is to never cut inside a word.
 *
 * 3. An ellipsis ("...") is appended when truncation actually happened AND
 *   the caller asked for one. The ellipsis is NOT counted against `max` —
 *   `max` bounds the visible text from the original string only. This is a
 *   deliberate choice: it makes the output length predictable for layout.
 *
 * 4. A single trailing space produced by the cut is stripped before appending
 *   the ellipsis, so you never get "foo ..." — you get "foo...".
 */

/**
 * Truncate `input` so that it contains no partial words, optionally appending
 * an ellipsis when text was removed.
 *
 * @param {string} input - The string to truncate.
 * @param {number} max - Maximum number of characters of `input` to keep.
 *   Must be a non-negative finite number. Floats are floored.
 * @param {Object} [options]
 * @param {string} [options.ellipsis=''] - Marker appended when truncation
 *   occurs. Default is the empty string (no marker). Pass '...' for the
 *   classic look. The ellipsis is not counted against `max`.
 * @returns {string} The truncated string, with `options.ellipsis` appended if
 *   any characters were cut.
 * @throws {TypeError} If `input` is not a string or `max` is not a finite
 *   number.
 * @throws {RangeError} If `max` is negative.
 */
export function truncate(input, max, options) {
  if (typeof input !== 'string') {
    throw new TypeError('input must be a string');
  }
  if (typeof max !== 'number' || !Number.isFinite(max)) {
    throw new TypeError('max must be a finite number');
  }
  if (max < 0) {
    throw new RangeError('max must be non-negative');
  }

  const ellipsis = options && options.ellipsis !== undefined
    ? String(options.ellipsis)
    : '';

  const limit = Math.floor(max);

  // Nothing to do — the whole string fits.
  if (input.length <= limit) {
    return input;
  }

  // No budget at all. We refuse to return a partial word, so the only
  // word-safe result is the empty string. (We still honour the ellipsis so
  // callers can signal elision happened.)
  if (limit === 0) {
    return ellipsis;
  }

  const slice = input.slice(0, limit);

  // The character right after our slice. If it's whitespace, we got lucky and
  // landed on a boundary already — no rewind needed.
  const nextChar = input[limit];
  if (nextChar === ' ' || nextChar === '\t' || nextChar === '\n' || nextChar === '\r') {
    return slice + ellipsis;
  }

  // We're in the middle of a word. Walk backward to find whitespace, which
  // marks the start of the word we're inside — the safe cut is just before it.
  let cutAt = slice.length;
  while (cutAt > 0) {
    const ch = slice[cutAt - 1];
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      break;
    }
    cutAt--;
  }

  if (cutAt === 0) {
    // The first word is longer than `max`. Return empty + ellipsis rather
    // than cutting the word.
    return ellipsis;
  }

  // Keep everything up to the whitespace we found, then strip trailing
  // whitespace so "foo " doesn't become "foo ...". We only strip whitespace
  // produced by the cut — leading and internal whitespace from the original
  // is preserved.
  const trimmed = slice.slice(0, cutAt).replace(/\s+$/, '');
  return trimmed + ellipsis;
}
