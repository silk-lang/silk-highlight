import { readdirSync, readFileSync } from 'node:fs'

const directory = new URL('./fixtures/', import.meta.url)

/** Every sample in test/fixtures: silk-vscode's grammar tests plus real compiler and stdlib files. */
export const fixtures: Array<{ name: string; code: string }> = readdirSync(directory)
  .filter((name) => name.endsWith('.silk'))
  .sort()
  .map((name) => ({ name, code: readFileSync(new URL(name, directory), 'utf8') }))
