/**
 * Silk for TanStack Highlight.
 *
 * TanStack Highlight does not read TextMate or tree-sitter grammars: a language is a tokenizer that
 * returns non-overlapping source ranges. This one is a single left-to-right scan that follows the
 * native lexer (`compiler/src/lexer` in silk-lang/silk) and assigns the same categories as the
 * TextMate grammar used by VS Code and Shiki. `test/agreement.test.ts` checks the two against
 * each other.
 *
 * ```ts
 * import { createHighlighter } from '@tanstack/highlight/core'
 * import { silk } from 'silk-lang/tanstack'
 *
 * const highlighter = createHighlighter({ languages: [silk] })
 * ```
 */
import type { HighlightTokenClass, LanguageDefinition, TokenRange } from '@tanstack/highlight/core'

/** The closed keyword vocabulary of the native lexer, minus `true` and `false`. */
export const KEYWORDS: ReadonlySet<string> = new Set([
  'as', 'break', 'compileError', 'const', 'continue', 'drop', 'effect', 'else', 'enum', 'export',
  'extern', 'fail', 'fn', 'for', 'if', 'impl', 'import', 'interface', 'let', 'match', 'move', 'mut',
  'once', 'param', 'pub', 'return', 'role', 'run', 'service', 'static', 'struct', 'tuple', 'type',
  'union', 'unsafe', 'while',
])

const PRIMITIVES: ReadonlySet<string> = new Set([
  'i8', 'i16', 'i32', 'i64', 'u8', 'u16', 'u32', 'u64', 'isize', 'usize', 'f32', 'f64', 'bool',
  'char', 'string', 'never',
])

const DECLARATION_KEYWORDS: ReadonlySet<string> = new Set([
  'struct', 'tuple', 'enum', 'union', 'type', 'service', 'interface', 'role',
])

const whitespace = /\s+/y
const identifier = /[A-Za-z_][A-Za-z0-9_]*/y
// Character literals use the escaped-body policy; an unclosed apostrophe is a lifetime.
const character = /'(?:\\(?:u\{[0-9A-Fa-f]*\}|x[0-9A-Fa-f]{2}|[^\n])|[^'\\\n])'/y
const lifetime = /'[A-Za-z_][A-Za-z0-9_]*/y
// A numeric token immediately followed by letters is one token (a duration or an invalid one).
const number = /(?:0[xXoObB][0-9A-Fa-f_]*|[0-9][0-9_]*(?:\.[0-9][0-9_]*)?(?:[eE][+-]?[0-9][0-9_]*)?)[A-Za-z0-9_]*/y
const operator = /\|>|->|=>|==|!=|<=|>=|&&|\|\||\.\.\.?|[-+*/%=<>!?&|^~@]/y
const callFollows = /\s*\(/y

function isIdentifierCharacter(code: string, index: number): boolean {
  return index >= 0 && index < code.length && /[A-Za-z0-9_]/.test(code[index]!)
}

function match(pattern: RegExp, code: string, at: number): number {
  pattern.lastIndex = at
  return pattern.test(code) ? pattern.lastIndex : -1
}

// Returns the end of a quoted literal whose body starts at `at`. Single-quote-width literals stop
// at a line break, as the lexer does; triple-quoted ones run to the closing delimiter.
function stringEnd(code: string, at: number, triple: boolean, raw: boolean): number {
  let index = at
  while (index < code.length) {
    const character = code[index]
    if (!raw && character === '\\') {
      index += 2
      continue
    }
    if (triple) {
      if (code.startsWith('"""', index)) return index + 3
    } else {
      if (character === '"') return index + 1
      if (character === '\n') return index
    }
    index += 1
  }
  return code.length
}

/** Tokenizes Silk source into TanStack Highlight ranges. Gaps stay plain text. */
export function tokenize(code: string): Array<TokenRange> {
  const ranges: Array<TokenRange> = []
  const push = (start: number, end: number, className: HighlightTokenClass) => {
    if (end > start) ranges.push({ start, end, className })
  }
  let previousWord = ''
  let previousPunctuation = ''
  // The dotted module path after `import` stays plain, keyword-spelled segments included.
  let importPath = false
  let at = 0

  while (at < code.length) {
    const spaced = match(whitespace, code, at)
    if (spaced >= 0) {
      if (code.slice(at, spaced).includes('\n')) importPath = false
      at = spaced
      continue
    }

    if (code.startsWith('//', at)) {
      let end = code.indexOf('\n', at)
      if (end < 0) end = code.length
      push(at, end, 'comment')
      at = end
      continue
    }

    // `r` and `b` modifiers must touch the quote and must not end a longer identifier.
    const modifier = code[at]
    if ((modifier === 'r' || modifier === 'b') && code[at + 1] === '"' && !isIdentifierCharacter(code, at - 1)) {
      const triple = code.startsWith('"""', at + 1)
      const end = stringEnd(code, at + (triple ? 4 : 2), triple, modifier === 'r')
      push(at, end, 'string')
      at = end
      previousWord = ''
      previousPunctuation = ''
      continue
    }
    if (code[at] === '"') {
      const triple = code.startsWith('"""', at)
      const end = stringEnd(code, at + (triple ? 3 : 1), triple, false)
      push(at, end, 'string')
      at = end
      previousWord = ''
      previousPunctuation = ''
      continue
    }

    if (code[at] === "'") {
      let end = match(character, code, at)
      if (end >= 0) {
        push(at, end, 'string')
      } else {
        end = match(lifetime, code, at)
        if (end < 0) end = at + 1
        else push(at, end, 'type')
      }
      at = end
      previousWord = ''
      previousPunctuation = ''
      continue
    }

    if (/[0-9]/.test(code[at]!)) {
      const end = match(number, code, at)
      push(at, end, 'number')
      at = end
      previousWord = ''
      previousPunctuation = ''
      continue
    }

    const wordEnd = match(identifier, code, at)
    if (wordEnd >= 0) {
      const word = code.slice(at, wordEnd)
      let className: HighlightTokenClass | undefined
      if (importPath && (previousWord === 'import' || previousPunctuation === '.')) {
        previousWord = word
        previousPunctuation = ''
        at = wordEnd
        continue
      }
      importPath = word === 'import'
      // A name after `fn` is the function's, even when it is spelled `drop` or `string`.
      if (previousWord === 'fn') className = 'function'
      else if (KEYWORDS.has(word)) className = 'keyword'
      else if (word === 'true' || word === 'false') className = 'literal'
      else if (PRIMITIVES.has(word) || word === 'Self') className = 'type'
      else if (DECLARATION_KEYWORDS.has(previousWord)) className = 'type'
      else if (/^[A-Z]/.test(word)) className = 'type'
      else if (match(callFollows, code, wordEnd) >= 0) className = 'function'
      else if (previousPunctuation === '.') className = 'property'
      if (className) push(at, wordEnd, className)
      previousWord = word
      previousPunctuation = ''
      at = wordEnd
      continue
    }

    const operatorEnd = match(operator, code, at)
    if (operatorEnd >= 0) {
      push(at, operatorEnd, 'operator')
      previousWord = ''
      previousPunctuation = ''
      at = operatorEnd
      continue
    }

    // Brackets and separators stay plain text.
    if (code[at] !== '.') importPath = false
    previousPunctuation = code[at]!
    previousWord = ''
    at += 1
  }
  return ranges
}

/** The Silk language definition for `createHighlighter({ languages: [silk] })`. */
export const silk: LanguageDefinition<'silk'> = {
  name: 'silk',
  tokenize,
}

export default silk
