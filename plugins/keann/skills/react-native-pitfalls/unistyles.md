# Unistyles pitfalls

Verified on react-native-unistyles 3.3.

## A style on an `Animated.View` silently disappears

A Unistyles style passed to Reanimated's `Animated.View` is dropped with no error. The animated
style still applies. A layer that lost `position: absolute` and its insets computes to 0 px and
never paints. Styles on plain views work.

**Fix:** give animated nodes plain styles (React Native's own `StyleSheet.absoluteFill`, plain
objects) and keep themed values on the plain views around them. For a third-party component, wrap
it with `withUnistyles`. Check the result with computed styles, since a collapsed layer can look
identical to a correct one.

## A style stops following theme changes

The Babel plugin finds a style's theme dependencies by position in the source. A reference to a
theme value counts only when it sits inside that style's own property in the returned object.

A local such as `const paddingInline = spacing.m` in the callback body records nothing, and the
plugin does not follow the local into the styles that use it. A style whose only theme input
arrives through such a local never recomputes on `setTheme()`, with no warning. If the themes
share the value today, the bug stays invisible until one of them changes it.

**Fix:** either keep token keys in module-scope constants and index the theme at each use
(`spacing[PADDING_INLINE]`), or make sure every style that uses a theme-derived local also
contains at least one direct theme reference.

## Variant typing and compound variants

`UnistylesVariants<typeof styles>` is built per style entry. A sheet whose variants live in
several entries yields a union of per-entry shapes, and indexing an axis that one member lacks is
a type error.

- Merge by union: `Required<AllUnionFields<UnistylesVariants<T>>>` with type-fest. An intersection
  is wrong: it collapses an axis that two entries declare with different keys.
- `compoundVariants` never contribute to the inferred axes. The `variants` block must stay a
  literal, while `compoundVariants` can be generated.
- A boolean axis infers `'true' | 'false' | boolean`.
- Empty placeholder axes added only to satisfy indexing can be deleted once the merged type is
  used, with one exception that follows.

On native, a compound variant's condition on an axis that its own entry does not declare is
treated as satisfied whenever that axis is unselected. Web checks the condition properly, so the
platforms differ silently.

**Fix:** an entry declares every axis its compound variants read, even as an empty
`{ true: {} }`.

## Content inside a `ScopedTheme` keeps the wrong theme

On native, the scope exists only while the scoped component renders. Three failures follow:

1. `useUnistyles().theme` inside a scope is frozen at mount. `rt.themeName` does follow.
2. A stylesheet style remembers the scope name from the last time its view rendered. When the
   scope's `name` changes, only views that re-render in that pass switch. Children that bail out
   keep the old theme until they remount.
3. A render that starts below the scope (local state, `onLayout` then `setState`, focus) sees no
   scope at all. `useAnimatedTheme` and `withUnistyles` switch to the root theme, and style values
   that change in that render come from the root theme.

The docs describe `ScopedTheme` for fixed themes and avoid React context on purpose. The matching
upstream issue is labelled wontfix, so do not plan around an upstream fix.

**Fix:** keep the scope's `name` fixed. For a component that renders later, put a `ScopedTheme`
inside it. To switch a subtree's theme, remount it with `key={name}`.

## "No theme has been selected yet" at import

On web, stylesheets compute when their module is imported. `StyleSheet.configure` must have run
before any module with a stylesheet is evaluated. A statement added to a file runs after all of
that file's imports, so the configure call must live in the body of a module that is imported
first.

The web runtime also reads `window.matchMedia` and `screen.orientation` at import, which a jsdom
environment has to stub.

## A pressed state through `_web` pseudo-classes does not reach the DOM

On web, Unistyles emits one merged class per element from the styles applied to it.

- An `_active` rule must sit in a style entry that is always in the style array. A rule in a
  conditionally applied entry never reaches the DOM.
- A disabled entry needs its own `_active` rule, or the pressed rule survives the merge and dims
  a disabled element.
- The order of the style array decides the result. CSS specificity does not.

Synthetic events cannot trigger `:active`. Verify the compiled rule with
`element.matches(selector)`.

## Other facts

- Breakpoints go into `StyleSheet.configure`, not the theme, and they are width-only. A rule on the
  smallest side needs `mq.width(…).and.height(…)`, which works only inside `StyleSheet.create`.
- Reading `UnistylesRuntime` never re-renders. `useUnistyles()` does.
- A style entry with logical `paddingInline`, passed as `contentContainerStyle` to a Gesture
  Handler `ScrollView`, was dropped on web. A plain style with physical keys works.
