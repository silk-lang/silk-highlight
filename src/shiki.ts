/**
 * Silk for Shiki.
 *
 * Shiki reads TextMate grammars, so this is the grammar from silk-lang/silk-vscode, vendored in
 * `grammar/silk.tmLanguage.json` and checked against silk-vscode's `main` in CI.
 *
 * ```ts
 * import { createHighlighter } from 'shiki'
 * import silk from 'silk-highlight/shiki'
 *
 * const highlighter = await createHighlighter({ langs: [silk], themes: ['github-dark'] })
 * highlighter.codeToHtml(source, { lang: 'silk', theme: 'github-dark' })
 * ```
 */
import type { LanguageRegistration } from 'shiki'
import grammar from '../grammar/silk.tmLanguage.json' with { type: 'json' }

/** The Silk TextMate grammar registered under the language id `silk`. */
export const silk = {
  ...grammar,
  name: 'silk',
  displayName: 'Silk',
} as unknown as LanguageRegistration

export default silk
