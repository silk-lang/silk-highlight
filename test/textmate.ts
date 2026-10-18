import { createHighlighter } from 'shiki'
import { silk } from '../src/shiki.ts'

export const highlighter = await createHighlighter({ langs: [silk], themes: ['github-dark'] })

/** The coarse category of each character under the TextMate grammar, or undefined for plain text. */
export function textMateClasses(code: string): Array<string | undefined> {
  const classes: Array<string | undefined> = new Array(code.length).fill(undefined)
  const lines = highlighter.codeToTokensBase(code, { lang: 'silk', theme: 'github-dark', includeExplanation: true })
  for (const line of lines) {
    for (const token of line) {
      let at = token.offset
      for (const part of token.explanation ?? []) {
        const category = categorize(part.scopes.map((scope) => scope.scopeName))
        for (let index = 0; index < part.content.length; index += 1) classes[at + index] = category
        at += part.content.length
      }
    }
  }
  return classes
}

function categorize(scopes: Array<string>): string | undefined {
  const has = (prefix: string) => scopes.some((scope) => scope.startsWith(prefix))
  if (has('comment')) return 'comment'
  if (has('string') || has('constant.character')) return 'string'
  if (has('constant.numeric')) return 'number'
  if (has('constant.language.boolean')) return 'literal'
  if (has('keyword.operator')) return 'operator'
  if (has('storage.modifier.lifetime')) return 'type'
  if (has('storage.type.self') || has('support.type') || has('entity.name.type')) return 'type'
  if (has('keyword') || has('storage.type') || has('storage.modifier')) return 'keyword'
  if (has('entity.name.function')) return 'function'
  return undefined
}
