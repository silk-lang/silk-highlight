// Copies the TextMate grammar from silk-lang/silk-vscode, which owns it.
//
//   bun scripts/sync-grammar.ts [--check] [path/to/silk.tmLanguage.json]
//
// Without a path the grammar is read from silk-vscode's main branch. `--check` fails when the
// vendored copy differs instead of overwriting it.
import { readFile, writeFile } from 'node:fs/promises'

const UPSTREAM = 'https://raw.githubusercontent.com/silk-lang/silk-vscode/main/syntaxes/silk.tmLanguage.json'
const VENDORED = new URL('../grammar/silk.tmLanguage.json', import.meta.url)

const args = process.argv.slice(2)
const check = args.includes('--check')
const source = args.find((argument) => argument !== '--check')

async function upstream(): Promise<string> {
  if (source) return readFile(source, 'utf8')
  const response = await fetch(UPSTREAM)
  if (!response.ok) throw new Error(`${UPSTREAM}: ${response.status} ${response.statusText}`)
  return response.text()
}

const expected = await upstream()
const actual = await readFile(VENDORED, 'utf8')

if (expected === actual) {
  console.log('grammar/silk.tmLanguage.json matches silk-vscode')
} else if (check) {
  console.error('grammar/silk.tmLanguage.json differs from silk-vscode; run `bun run sync-grammar`')
  process.exit(1)
} else {
  await writeFile(VENDORED, expected)
  console.log('Updated grammar/silk.tmLanguage.json from silk-vscode')
}
