# Storybook pitfalls

Verified on Storybook 10.5 and 10.6 with the Vite builder, unless an entry says otherwise.

## `storySort` must be an inline literal

The indexer reads `parameters.options.storySort` from the raw text of `preview.ts` by AST and
evaluates it alone. A broken value kills the whole Storybook ("Something went wrong loading this
Storybook"); the real message appears only in the terminal.

- The value is an array, object, arrow or function literal. A call such as `createStorySort(…)`
  or an identifier is rejected.
- A function is evaluated in isolation: no imports, no module constants, and no TypeScript syntax
  inside it. No `satisfies` or `as` around it either.
- `parameters` may be a `const` with a top-level `satisfies`. `options` stays an inline object.
- The chained form `definePreview({…}).type<T>()` is not unwrapped, so `storySort` is silently
  dropped and the sidebar is unsorted. Upstream fix: storybookjs/storybook#36085. Until it ships,
  a package patch is needed, and it must be regenerated for every Storybook release.
- In the default sorter, `['*', ['Name', '*']]` applies an order to the children of every group.
- The same function runs twice: in the Node indexer and in the preview.

## Docs pages disappear after editing `preview.ts`

After several edits to `preview.ts`, one of them broken, the running dev server keeps the stories
and drops the autodocs entries. Touching a stories file restores that file only.

**Fix:** restart `storybook dev`.

## A callback in a nested arg logs nothing

A `fn()` spy as a top-level arg logs to the Actions panel. A spy nested in an object arg
(`args: { actionProps: { onPress: fn() } }`) records its calls but notifies no listener, so the
panel stays empty. `fn(action('…'))` does not help: mocks are reset per render.

**Fix:** pass a plain closure that calls `action('name')(...args)`. It is not a spy, so a play
function cannot assert on it.

A related stall: with a DOM-backed event, auto-logging an `fn()` in `args` was seen to delay a
dismiss callback by about 50 ms. A module-level `fn()` outside `args` avoids it.

## Stories render unstyled after a new import is added

Adding a new bare import to a story file while the dev server runs makes Vite re-optimize its
dependencies. A style library that computes its styles at import was seen to return empty styles
in that running instance. A test run that reuses the live server then fails across unrelated
components. A fresh boot is healthy.

**Fix:** restart the dev server.

## Manager tools

- The manager bundle uses the classic JSX transform. A manager-side `.tsx` needs
  `import React from 'react'`, or the whole manager crashes with "React is not defined".
- The manager bundle is built once, when the dev server starts. Edits to `manager.ts` or a tool
  need a restart.
- A toggle is `ToggleButton` with `pressed`. `IconButton active` has no visible effect.
- A boolean global round-trips the URL as `globals=name:!true`.
- `useParameter` works on docs pages too, but it treats a falsy value as missing and returns the
  default. Nest a flag in an object (`myTool: { hidden: true }`).
- Story-level `globals` do not reach docs mode.
- A barrel that re-exports a manager component must not be imported by preview code that also
  runs in a native app: the manager's dependencies touch `document` at import.

## The first story appears twice on a docs page

The default docs page renders the first story as the primary, then lists every story again.
`includePrimary` is a prop of the `<Stories>` block. As a parameter it does nothing.

**Fix:** in `preview.ts`, set `parameters.docs.stories.filter` to a function that drops the story
by name. It is read from the project annotations only, so it has no effect in a meta.

Do not tag the first story `!autodocs`: the primary slot and the props table then move to the
second story.

## Table-of-contents styling

The TOC is tocbot. Storybook's own rules are scoped per nesting level with rising specificity, so
an override written for the top level loses on nested lists. Write a rule for each level. Only the
leaf item gets the active class, never its group. Storybook exposes no CSS variables: copy the
needed theme values to custom properties from `preview.ts`.

## Tags and badges

Storybook's core never renders tags; they only feed the sidebar filter. A badge needs an addon
such as `storybook-addon-tag-badges`. A component row shows only the tags that all of its entries
share. The addon sets `sidebar.renderLabel`, so a custom `renderLabel` hides the badges.

## Vite plugin order against Storybook's csf plugin

Since 10.6, the csf plugin's transform uses `enforce: 'pre'` with `transform: { order: 'post' }`.
Vite sorts `order: 'post'` hooks after every plain hook, whatever `enforce` says. A plugin with
`enforce: 'post'` and a plain hook therefore runs before it.

**Fix:** use the object form with `order: 'post'`. A unit test that calls the hook directly cannot
catch an ordering regression: check the module the dev server serves.

## Parameters merge deeply

A story's parameters are merged into the meta's, key by key. A story that sets one key of an
object parameter keeps the meta's other keys, so it may need to override those as well.

## Overlay stories on a docs page

A docs page scales inline stories with a CSS transform, which makes the story block the containing
block for `position: fixed`. A story that needs the viewport sets `docs.story.inline: false` to
get its own iframe. That iframe is `display: inline` and leaves a 4 px scrollable gap:
`.sb-story iframe { display: block }` removes it. `layout: 'fullscreen'` also removes Storybook's
centering, on web and on device.

## The first "Run tests" click after a boot fails a few files

Seen on 10.4. A run started from the Testing panel can evaluate some story modules before the
preview annotations have run. Any module-scope code that depends on a side effect of `preview.ts`
(a style library's configure call, for example) then fails at import. A second run passes, and
CLI runs are always green.

**Fix, if it must be fixed locally:** a Vite plugin that prepends a static import of a virtual
"configure" module to every story file. An imported module's body runs during the import phase. A
statement injected into the story file would run after all of its imports, which is too late.

## Running story tests

- A test's name is the story's display name, with spaces: `-t "Centered Window"`.
- Console output is printed only for failing tests.
- The headless runner's viewport is its own (for example 900 px tall). Code that switches layout
  by window size takes a different branch than on a phone.
- A story opts out of the test run with `tags: ['!test']`.
- ESLint ignores `.storybook/` by default, since it is a dot-directory.

## On-device Storybook (`@storybook/react-native`)

- The story glob decides what is bundled. Metro evaluates every matched file's static imports at
  load, so one web-only import breaks every story.
- `storybook.requires.ts` is regenerated when Metro starts. The CLI generator
  (`get-stories.js`) writes it without the WebSocket settings that come from the Metro config.
  Restart Metro instead of running the CLI.
- The app ignores story tags.
