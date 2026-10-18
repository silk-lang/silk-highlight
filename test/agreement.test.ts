import { expect, test } from 'bun:test'
import { disagreements } from './agreement.ts'
import { fixtures } from './fixtures.ts'
import { textMateClasses } from './textmate.ts'

// The TanStack tokenizer is hand-written, so it must classify every character the way the
// TextMate grammar (the one VS Code and Shiki use) does. Properties are TanStack-only.
const CATEGORIES = new Set(['comment', 'string', 'number', 'literal', 'keyword', 'operator', 'type', 'function'])

for (const { name, code } of fixtures) {
  test(`${name} highlights the same under TextMate and TanStack`, () => {
    expect(disagreements(code, CATEGORIES)).toEqual([])
  })
}

test('the TextMate side of the comparison sees categories', () => {
  // Guards against an empty TextMate result, which would make every comparison pass.
  const classes = textMateClasses('fn main() -> i32 { return 0 } // done')
  expect(classes.slice(0, 2)).toEqual(['keyword', 'keyword'])
  expect(classes[3]).toBe('function')
  expect(classes[13]).toBe('type')
  expect(classes[26]).toBe('number')
  expect(classes.at(-1)).toBe('comment')
})
