# silk-lang

TypeScript utilities for [Silk](https://github.com/silk-lang/silk), published on npm as
`silk-lang`. Each tool is a subpath export. So far that is syntax highlighting for web
highlighters: [Shiki](https://shiki.style) and [TanStack Highlight](https://tanstack.com/highlight).

```sh
bun add silk-lang
```

## Shiki

Shiki reads TextMate grammars, so this package ships the grammar from
[silk-lang/silk-vscode](https://github.com/silk-lang/silk-vscode) unchanged. That repository owns
it; `grammar/silk.tmLanguage.json` is a copy that CI checks against silk-vscode's `main`.

```ts
import { createHighlighter } from 'shiki'
import silk from 'silk-lang/shiki'

const highlighter = await createHighlighter({ langs: [silk], themes: ['github-dark'] })
const html = highlighter.codeToHtml(source, { lang: 'silk', theme: 'github-dark' })
```

The raw grammar is also exported as `silk-lang/silk.tmLanguage.json` for other TextMate
consumers.

## TanStack Highlight

TanStack Highlight does not read TextMate or tree-sitter grammars. A language is a tokenizer that
returns source ranges, so this package includes a hand-written one that follows the native lexer.

```ts
import { createHighlighter } from '@tanstack/highlight/core'
import silk from 'silk-lang/tanstack'

const highlighter = createHighlighter({ languages: [silk] })
const html = highlighter.highlightToHtml(source, { lang: 'silk' })
```

To keep the two from drifting, CI highlights every `.silk` file in silk-lang/silk with both and
fails if any character gets a different category (comment, string, number, literal, keyword,
operator, type or function). Member names after `.` are a TanStack-only `property` class.

## Develop

```sh
bun install
bun run test                # tokenizer tests and TextMate agreement on test/fixtures
bun run compare-silk ../silk  # agreement on a whole silk-lang/silk checkout
bun run sync-grammar        # copy the grammar from silk-vscode main
bun run build               # dist/
```

When the grammar changes in silk-vscode, run `bun run sync-grammar` here and update
`src/tanstack.ts` until `compare-silk` reports no differences.

## Release

Releases use [Changesets](https://github.com/changesets/changesets). With a change that should
reach npm, run `bun changeset`, pick the bump and describe it for the changelog, and commit the
generated file in `.changeset/`.

On `main`, the Release workflow keeps a "Version packages" pull request open that applies the
pending changesets to `package.json` and `CHANGELOG.md`. Merging it publishes to npm through
trusted publishing, so no npm token is needed.
