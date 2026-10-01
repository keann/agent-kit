# Bundler pitfalls

## bun build drops a module behind a re-export barrel

Seen on bun 1.3.10 and 1.3.14 (upstream oven-sh/bun#27709). When `package.json` declares
`sideEffects: false`, `bun build` removes a module whose only use is a pure re-export from a
barrel. The bundle then references an undefined binding and throws
"ReferenceError: X is not defined" at load. The export style does not matter: every form of
re-export through the barrel fails, and `--ignore-dce-annotations` does not help.

**Fix:** import each module directly where it is used, and define the entry's public functions in
the entry file instead of re-exporting them.

**Guard:** unit tests run `src` and can never catch a bundler regression. A smoke suite that
imports the built `dist` and asserts the public surface, run in `prepublishOnly`, does.

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
