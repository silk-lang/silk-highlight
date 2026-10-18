// Highlights every Silk source in a silk-lang/silk checkout with both the TextMate grammar and
// the TanStack tokenizer, and fails on any character they classify differently.
//
//   bun scripts/compare-silk.ts [path/to/silk]   (default: ../silk)
//
// The lexer fixtures are token lists with deliberately invalid spellings, so they are skipped.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Glob } from 'bun'
import { disagreements } from '../test/agreement.ts'

const SKIPPED = new Set(['compiler/fixtures/keywords.silk', 'compiler/fixtures/numbers-durations.silk'])
const CATEGORIES = new Set(['comment', 'string', 'number', 'literal', 'keyword', 'operator', 'type', 'function'])

const root = process.argv[2] ?? '../silk'
let files = 0
let failures = 0
for (const path of new Glob('{compiler,stdlib,examples}/**/*.silk').scanSync(root)) {
  if (SKIPPED.has(path)) continue
  files += 1
  for (const difference of disagreements(readFileSync(join(root, path), 'utf8'), CATEGORIES)) {
    failures += 1
    console.error(
      `${path}:${difference.line} ${JSON.stringify(difference.text)} is ${difference.textMate ?? 'plain'} in TextMate but ${difference.tanstack ?? 'plain'} in TanStack`,
    )
  }
}
console.log(`Compared ${files} files from ${root}: ${failures} differences`)
process.exit(failures === 0 ? 0 : 1)
