---
name: code-conventions
description: The user's conventions for TypeScript, tests, and npm packages. Use when writing or reviewing TypeScript or JavaScript, adding or moving test files, or creating or editing a package.json.
---

# code-conventions

These are the user's own conventions. They apply to every file you create or change, tests, stories
and docs snippets included. A project's own documented convention wins where the two differ. Lint
does not catch most of them, so apply each one that matches the code in front of you.
Component structure, props, styling and stories are in the `react-conventions` skill.

## TypeScript

- **Strict equality only.** A check for both nullish values is written out:
  `value !== undefined && value !== null`, or the single strict check when the type admits one
  nullish kind. `??` and `?.` are fine.
- **Names are words.** `cursor`, `code`, `inputLength`: a name says the role the value plays.
  Single letters are for the counter of a short `for` loop.
- **Generic parameters are words too**: `Item`, `Value`, `Instance`, named by role, with no `T`
  prefix or suffix. A generic with a single concrete use loses its type parameter. A TSX arrow
  keeps the comma: `<Item,>(props) =>`.
- **Names are literal.** `hasInlinePadding` says what the prop does, `isFullBleed` borrows a print
  metaphor. `elasticClamp` over `rubberBand`.
- **Type specifiers come first in a mixed import**: `import { type BBCodeNode, parse } from '…'`.
  A separate `import type { … }` line is fine.
- **Reuse before writing.** Before adding a small utility, a dev-time error, or a type helper, grep
  the repo's helpers and the utility libraries it already depends on.
- **With type-fest installed, use its strict utilities**: `Except` over `Omit`, `ExcludeStrict`
  over `Exclude`, `ExtractStrict` over `Extract`. A typo in a key or a member then fails to
  compile. Read its `index.d.ts` before concluding that it lacks a utility.

## Public API

- **A type is exported when consumer code has to name it**, which a documented usage snippet
  shows. A type that only helps a demo or an internal helper stays unexported and is imported from
  its file.

## Tests

- **A unit test sits beside its subject**: `src/x/foo.ts` and `src/x/foo.test.ts`. There are no
  `__tests__` directories.
- **A fixture or mock with one subject is a sibling** with a `.mocks.` infix: `figma.mocks.ts`.
- **`tests/<flavor>/` is for suites with no single subject**: `tests/smoke/`, `tests/integration/`.
  Shared fakes that stand in for third-party modules go to `tests/mocks/<module>.ts`.
- **A small published package may keep its whole suite under `tests/`** (`tests/unit/`,
  `tests/smoke/`) when test files would outnumber the files in `src/`.

## Packages

- **ESM only.** A new package ships no CJS build and no `require` condition: a flat `dist/`, and
  `exports['.']` with `types` and `default`.
- **Each script does one thing, and lifecycle hooks compose them**:
  `"prepublishOnly": "pnpm run build && pnpm run test"`. A `test` script that builds internally
  hides the dependency.
- **Dependencies are pinned to exact versions**, in installs and in docs: `pnpm add -E`,
  `pnpm add -DE`. A range needs a stated reason.
- **A published package has a smoke suite that imports the built `dist`** and asserts the public
  surface, wired into `prepublishOnly`. Unit tests run `src` and cannot catch a bundler regression.
- **Authorship uses `{ "name": "Alex K.", "email": "code@keann.dev" }`.** In the user's own
  personal package it is the `author` field. In a package that already has a `contributors` field,
  or in a known public package, it is an entry in `contributors`. A project with its own
  authorship convention keeps that convention.

## Lint

When you set up or touch lint config in the user's own project, propose the rule that enforces a
convention above: `eqeqeq` with `always` for strict equality, and `id-length` with `i` and `k`
excepted for names.
