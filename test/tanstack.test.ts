import { describe, expect, test } from 'bun:test'
import { createHighlighter } from '@tanstack/highlight/core'
import { silk, tokenize } from '../src/tanstack.ts'
import { fixtures } from './fixtures.ts'

function classesOf(code: string): Array<[string, string]> {
  return tokenize(code).map((range) => [code.slice(range.start, range.end), range.className])
}

describe('ranges', () => {
  for (const { name, code } of fixtures) {
    test(`${name} has ordered, non-overlapping ranges`, () => {
      let previous = 0
      for (const range of tokenize(code)) {
        expect(range.start).toBeGreaterThanOrEqual(previous)
        expect(range.end).toBeGreaterThan(range.start)
        expect(range.end).toBeLessThanOrEqual(code.length)
        previous = range.end
      }
    })
  }
})

describe('highlighter', () => {
  const highlighter = createHighlighter({ languages: [silk] })

  for (const { name, code } of fixtures) {
    test(`${name} reconstructs its source`, () => {
      const result = highlighter.tokenize(code, { lang: 'silk' })
      expect(result.lang).toBe('silk')
      expect(result.tokens.map((token) => token.value).join('')).toBe(code)
    })
  }

  test('renders HTML', () => {
    expect(highlighter.highlightToHtml('fn main() -> i32 { return 0 }', { lang: 'silk' })).toContain('keyword')
  })
})

describe('tokens', () => {
  test('declarations, types and calls', () => {
    expect(classesOf('pub fn parse(state: &mut State) -> NodeId { return run inner(state) }')).toEqual([
      ['pub', 'keyword'],
      ['fn', 'keyword'],
      ['parse', 'function'],
      ['&', 'operator'],
      ['mut', 'keyword'],
      ['State', 'type'],
      ['->', 'operator'],
      ['NodeId', 'type'],
      ['return', 'keyword'],
      ['run', 'keyword'],
      ['inner', 'function'],
    ])
  })

  test('numbers, durations and comments', () => {
    expect(classesOf('let d = 1h30m + 0xff + 1.5e3 // done')).toEqual([
      ['let', 'keyword'],
      ['=', 'operator'],
      ['1h30m', 'number'],
      ['+', 'operator'],
      ['0xff', 'number'],
      ['+', 'operator'],
      ['1.5e3', 'number'],
      ['// done', 'comment'],
    ])
  })

  test('text, raw, byte, character and triple-quoted literals', () => {
    const code = 'r"a\\n" b"\\x00" "q\\"x" \'c\' """x\ny"""'
    expect(classesOf(code).map(([, className]) => className)).toEqual(['string', 'string', 'string', 'string', 'string'])
    expect(classesOf(code).map(([text]) => text).join(' ')).toBe(code)
  })

  test('an unclosed single-line string stops at the line break', () => {
    expect(classesOf('"open\nfn f')).toEqual([
      ['"open', 'string'],
      ['fn', 'keyword'],
      ['f', 'function'],
    ])
  })

  test('lifetimes are not character literals', () => {
    expect(classesOf("fn f<'a>(x: &'a u8) -> bool { return true }")).toEqual([
      ['fn', 'keyword'],
      ['f', 'function'],
      ['<', 'operator'],
      ["'a", 'type'],
      ['>', 'operator'],
      ['&', 'operator'],
      ["'a", 'type'],
      ['u8', 'type'],
      ['->', 'operator'],
      ['bool', 'type'],
      ['return', 'keyword'],
      ['true', 'literal'],
    ])
  })

  test('keywords match only whole identifiers', () => {
    expect(classesOf('letter matcher services')).toEqual([])
  })

  test('members and applied types', () => {
    expect(classesOf('value.field Vector<T>.make()')).toEqual([
      ['field', 'property'],
      ['Vector', 'type'],
      ['<', 'operator'],
      ['T', 'type'],
      ['>', 'operator'],
      ['make', 'function'],
    ])
  })

  test('import paths stay plain, like the TextMate grammar', () => {
    expect(classesOf('import silk.type as Types {Vector}')).toEqual([
      ['import', 'keyword'],
      ['as', 'keyword'],
      ['Types', 'type'],
      ['Vector', 'type'],
    ])
  })
})
