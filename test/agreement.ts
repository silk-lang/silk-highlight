import { tokenize } from '../src/tanstack.ts'
import { textMateClasses } from './textmate.ts'

export type Disagreement = { line: number; text: string; textMate: string | undefined; tanstack: string | undefined }

/** Characters whose category differs between the TextMate grammar and the TanStack tokenizer. */
export function disagreements(code: string, categories: ReadonlySet<string>): Array<Disagreement> {
  const textMate = textMateClasses(code)
  const tanstack: Array<string | undefined> = new Array(code.length).fill(undefined)
  for (const range of tokenize(code)) tanstack.fill(range.className, range.start, range.end)
  const found: Array<Disagreement> = []
  let index = 0
  while (index < code.length) {
    const left = categories.has(textMate[index] ?? '') ? textMate[index] : undefined
    const right = categories.has(tanstack[index] ?? '') ? tanstack[index] : undefined
    if (left === right || /\s/.test(code[index]!)) {
      index += 1
      continue
    }
    let end = index + 1
    while (end < code.length && textMate[end] === textMate[index] && tanstack[end] === tanstack[index]) end += 1
    found.push({
      line: code.slice(0, index).split('\n').length,
      text: code.slice(index, end),
      textMate: left,
      tanstack: right,
    })
    index = end
  }
  return found
}
