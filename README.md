# Truncate

Cut a string to a maximum length without splitting words. Truncation happens at the last word boundary that fits; if that leaves nothing, you get the empty string rather than a partial word.

## Usage

```js
import { truncate } from './src/index.js';

truncate('hello world', 8);                       // 'hello'
truncate('hello world', 8, { ellipsis: '...' });  // 'hello...'
truncate('supercalifragilistic word', 5);         // ''
```

## Why

String.prototype.slice doesn't respect word boundaries — `"hello world".slice(0, 8)` gives `"hello wo"`. This library rewinds to the end of the last complete word that fits.

The trade-off: when the first word is longer than `max`, the result is the empty string (plus an ellipsis if requested), because returning a partial word would defeat the entire purpose. If you need hard character caps even at the cost of splitting words, this is the wrong library.

The `ellipsis` string is appended **in addition to** the `max` characters, not counted against them. This keeps the kept-text length predictable for layout; the total output length is `max` (or less, after rewind) plus `ellipsis.length`.

## Edge cases

- `max` of 0 returns the empty string (or just the ellipsis).
- A first word longer than `max` returns the empty string (or just the ellipsis).
- Non-integer `max` is floored.
- Throws `TypeError` for non-string input or non-finite `max`, `RangeError` for negative `max`.

## Exports

- `truncate(input: string, max: number, options?: { ellipsis?: string }): string`

## Design notes

The window stores values eagerly rather than keeping running aggregates. Running
sums drift with floating point over long streams, and recomputing from a small
buffer is cheap enough that the drift is not worth the speed.

