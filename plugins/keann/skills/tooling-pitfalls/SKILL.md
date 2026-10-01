---
name: tooling-pitfalls
description: Known pitfalls in Storybook, vitest, Vite, bun, pnpm, oxfmt and ESLint, each with its mechanism and fix. Use when configuring or debugging one of these tools, when a build, a test run or a Storybook page behaves unexpectedly, and when writing a benchmark.
---

# tooling-pitfalls

Each entry was verified in the tool's source or by experiment. Find the symptom below, then read
that entry in the named file. Every file states the versions its entries were verified on. When
the installed version is newer, check the mechanism again before relying on the entry.

When a tool misbehaves, the fix belongs in that tool's own config. Check its options (a glob, an
exclude, an alias) before writing an adapter around it.

## [storybook.md](storybook.md)

- "Something went wrong loading this Storybook", or the sidebar is unsorted.
- Docs pages disappear from the sidebar after editing `preview.ts`.
- A callback in a nested arg logs nothing to the Actions panel.
- Stories render unstyled after a new import is added while the server runs.
- A toolbar tool crashes the manager, ignores edits, or never hides.
- The first story appears twice on a docs page.
- Table-of-contents styles apply to the top level only.
- A tag does not show as a badge.
- A Vite plugin that must run after Storybook's runs before it.
- A story that overrides one key of an object parameter still gets the meta's other keys.
- An overlay story is misplaced or scrolls by a few pixels on a docs page.
- The first "Run tests" click after a boot fails a few files.
- A test filter matches nothing; test logs are missing.
- On-device Storybook: the generated story list is stale or loses its WebSocket settings.

## [vitest.md](vitest.md)

- A benchmark shows a much smaller or larger speed-up than the built package has.
- `execArgv` in the pool options has no effect.
- A static import of `dist` breaks the typecheck.
- "Unexpected token 'typeof'" with no stack when a test imports a React Native library.
- A pure-helper test fails to import because of an animation library.
- A `vite` alias is ignored for a dependency.
- Failure lines are missing from captured output.

## [bundlers.md](bundlers.md)

- A bun-built bundle throws "X is not defined" at load.
- A bun script stopped reading `.env`.
- "Element type is invalid … got: object" for a default import under Vite 8.
- A file fails to parse because of a glob in a comment.

## [formatting-and-packages.md](formatting-and-packages.md)

- oxfmt refuses a file, reports false failures, or reflows Markdown.
- oxfmt and ESLint disagree about a trailing comma in a type parameter list.
- pnpm refuses to install a fresh release.
- A pnpm patch no longer applies, or patching breaks the format check.
- ESLint `no-param-reassign` rejects writing to a ref or a shared value.
- ESLint skips files in a dot-directory.
