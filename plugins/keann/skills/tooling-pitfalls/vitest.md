# vitest pitfalls

Verified on vitest 4.1.

## Benchmarks measure the transform, not the package

A bench that imports `src` runs it through Vite's module transform. Cross-module references become
property accesses on a namespace object, which costs about 4× in a hot loop. A dependency from
`node_modules` is externalized and runs natively. A "mine against theirs" bench is then unfair by
that factor: one measured 1.6× where the built artifacts differ by 6–7×.

**Fix:**

- Import the built single-file bundle (`dist`) on both sides, and add a `prebench` script that
  builds, so the bench never measures a stale build.
- vitest sets `NODE_ENV=test`, which loads React's development build (about 4× slower per
  element). Set `env: { NODE_ENV: 'production' }` on a project that benchmarks rendering.
- A module that Vite inlines pays a getter on every use of an imported binding. Externalize the
  measured bundle with a `server.deps.external` regex. An alias to a bundle changes nothing while
  the module stays inlined.
- Check the bench against plain `node` on the same bundle. The two should agree within about 10 %.
- Put one scenario in each suite. vitest's summary otherwise ranks unrelated inputs against each
  other ("N× faster").
- To drop the summary block, extend `BenchmarkReporter` from `vitest/node` (`vitest/reporters` is
  deprecated since 4.1).

## `execArgv` in the pool options has no effect

vitest 4 removed `poolOptions.forks.execArgv` from the user config and ignores it silently.

**Fix:** pass Node flags through `NODE_OPTIONS`. Forked workers inherit it.

## A static import of `dist` breaks the typecheck

A typecheck that runs before the build cannot resolve `../../dist/index.js`.

**Fix:** load it with a computed specifier and take the types from source:
`await import(import.meta.resolve('../../dist/index.js')) as typeof import('../../src/index')`.

## React Native libraries under jsdom

A unit environment that aliases `react-native` to `react-native-web` cannot import several native
libraries as they ship:

- Reanimated and react-native-svg publish Flow sources. `import typeof` fails with a bare
  "SyntaxError: Unexpected token 'typeof'" and no stack.
- Reanimated's official `mock.js` imports the real package.
- react-native-svg's web build deep-imports React Native internals.

**Fix:** hand-written stubs for those modules, wired with
`vi.mock('<module>', () => import('<path>').then((m) => m.mock))`. Keep shared fakes in one place
and make them strict: a fake that throws on an unmodeled call is safer than one that silently
passes.

## A pure-helper test fails to import because of an animation library

A helpers barrel that re-exports one module with a runtime import of Reanimated makes every test
that loads the barrel load Reanimated, which does not resolve under vitest.

**Fix:** keep such barrels free of runtime imports of native libraries. Import the dependent
modules by path. Do not call `Easing.*` or similar at module scope in shared helpers: a partial
mock fails at import.

## A `vite` alias is ignored for a dependency

Externalized `node_modules` are resolved by Node, not by Vite, so `resolve.alias` does not apply
to imports made from inside them. The alias takes effect only when the importer is inlined.

## Smaller facts

- vitest prints `FAIL` lines to stderr. Capture both streams.
- In a jsdom environment `import.meta.url` is not a file URL. Build paths from `process.cwd()`.
- A type-level test is an `@ts-expect-error -- reason` line. When the type under test is weakened,
  the compiler reports the directive as unused.
- pnpm runs `pre<script>` and `post<script>` hooks automatically.
