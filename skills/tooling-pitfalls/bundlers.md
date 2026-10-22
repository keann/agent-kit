# Bundler pitfalls

## bun build drops a module behind a re-export barrel

Seen on bun 1.3.10, 1.3.14 and 1.4.0 (upstream oven-sh/bun#27709). When `package.json` declares
`sideEffects: false`, `bun build` removes a module whose only use is a pure re-export from a
barrel. The bundle keeps the export and loses the binding. Node rejects such a file before running
it, with "SyntaxError: Export 'X' is not defined in module". Code that reads the missing binding
throws "ReferenceError: X is not defined". The export style does not matter. Every form of
re-export through the barrel fails, including `import { x }` followed by `export { x }`. No bundler
option helps either: splitting and minification on or off, `--ignore-dce-annotations`, and a build
of the entry alone all drop the module.

**Fix:** import each module directly where it is used, and define the entry's public functions in
the entry file instead of re-exporting them. A value the entry itself uses survives:
`export default x` after `import { x } from './a'` keeps the module.

**Detect:** `node --check <file>` on each built `.js` file fails with the SyntaxError above. It
parses the file and runs none of it.

**Guard:** unit tests run `src` and can never catch a bundler regression. A smoke suite that
imports the built `dist`, run in `prepublishOnly`, catches one when it checks each export's value:
its `typeof`, or a call. Comparing the names alone passes. Vitest 5 loads the broken bundle with
every export `undefined` instead of rejecting it.

## A bun script stopped reading `.env`

`.env` is loaded automatically only by the bun runtime process itself: `bun file.ts`, or a bin run
by path.

- A bin that is a plain file with a Node shebang never got `.env` through `bun run`, on any
  version.
- A bin that is a symlink to a `.ts` file ran in-process up to bun 1.3.13 and so did get it.
  Since bun 1.4.0 it does not.

**Fix:** pass the file explicitly: `bun --bun --env-file=.env run <bin>`.

## A default import is an object under Vite 8

Symptom: React throws "Element type is invalid: expected a string … but got: object" for a
component that is a package's default export.

Vite prefers the `browser` field. When that field points to a UMD build, the factory sets
`exports.default` at runtime, where rolldown's static analysis cannot see it. The optimized
dependency exports the whole exports object as the default.

**Diagnosis:** `_metadata.json` in Vite's dependency cache shows which file the package resolved
to. The transformed consumer module, fetched from the dev server, lacks the `.default` unwrap.

**Fix:** alias the package name to its ESM build in the Vite config. Do not deep-import in
component code, which loses the type mapping.

## A glob in a block comment ends the comment

A glob such as `**/*.d.ts` inside `/* … */` or `/** … */` contains `*/`. The comment ends there
and the file fails to parse.

**Fix:** describe the files in words.
