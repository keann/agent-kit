# Formatter, linter and package-manager pitfalls

## oxfmt: which files a run really covers

Verified on oxfmt 0.64. What gets formatted depends on how the target is given:

| Target | Excluded by `.gitignore` | Excluded by a config's `ignorePatterns` |
|---|---|---|
| An explicit file | formatted | refused ("excluded by ignore rules") |
| An explicit directory | refused ("Expected at least one target file") | formatted anyway, so ignored files are reported as failures |
| No target (the default walk) | skipped | skipped |

Only the default walk finds nested configs and applies every exclusion correctly. Versions 0.62
and 0.63 also refused explicit files under `.gitignore`.

**Fix:** to format build output, pass files: `find dist -name '*.d.ts' -print0 | xargs -0 oxfmt
--write`. Before trusting a failure from a scoped run, look for an `oxfmt.config.*` above the
target and compare with the default walk, which is what CI runs.

## oxfmt reflows Markdown

In write mode oxfmt joins the indented sub-bullets of a nested list into long lines. Where
Markdown is wrapped by hand and only `--check` runs in CI, never run write mode on `.md` files.
To recover, restore the file from git and re-apply the edit by hand.

## oxfmt and ESLint disagree on a type-parameter comma

In a `.tsx` file oxfmt writes `<Item = unknown,>`, and ESLint's `comma-spacing` rejects it. The
conflict returns on every format run.

**Fix:** drop the default (`<Item,>`), or drop the type parameter if it has one use.

## pnpm refuses a fresh release

With `minimumReleaseAge` set in `pnpm-workspace.yaml`, a package version younger than that many
minutes fails with `ERR_PNPM_NO_MATURE_MATCHING_VERSION`. This is a supply-chain guard.

**Fix:** wait. Do not loosen the setting.

## pnpm patches

- A patch targets one exact version. For a package that ships minified chunks, the chunk file
  names and the local variable names change with every release, so the patch must be regenerated
  each time, even when the source is unchanged.
- Remove the old `patchedDependencies` entry before `pnpm install`: pnpm errors on a patch that
  matches no installed package.
- Flow: `pnpm patch <pkg>@<version> --edit-dir <dir>`, edit, `pnpm patch-commit <dir>`, then
  delete the old patch file.
- `pnpm patch-commit` rewrites `pnpm-workspace.yaml` with 2-space indentation. Reformat the file
  afterwards, or the format check fails.
- Prove the patch through the tool's own API or output, not by reading the patched file.

With the hoisted linker, installed dependencies resolve from the root `node_modules`. A package's
own `node_modules` is nearly empty.

## ESLint

- `no-param-reassign` with `props: true` rejects `ref.current = x` and `sharedValue.value = x`
  when the ref or shared value is a function parameter. Bind it to a local first, or iterate
  (`for (const ref of refs)`).
- ESLint ignores dot-directories such as `.storybook/` by default. Files there are checked only by
  the formatter and the type checker unless the config opts them in.
- An empty function body needs a comment inside for `no-empty-function`.
