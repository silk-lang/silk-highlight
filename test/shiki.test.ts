import { expect, test } from 'bun:test'
import { silk } from '../src/shiki.ts'
import { highlighter } from './textmate.ts'

test('registers as silk with the source.silk scope', () => {
  expect(silk.name).toBe('silk')
  expect(silk.scopeName).toBe('source.silk')
  expect(highlighter.getLoadedLanguages()).toContain('silk')
})

test('renders keywords and comments with distinct colors', () => {
  const html = highlighter.codeToHtml('// note\nfn main() -> i32 { return 0 }', { lang: 'silk', theme: 'github-dark' })
  expect(html).toContain('main')
  const colors = new Set(html.match(/color:#[0-9A-Fa-f]{6}/g))
  expect(colors.size).toBeGreaterThan(2)
})
