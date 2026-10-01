---
name: react-native-pitfalls
description: Known pitfalls in React Native, Reanimated, Gesture Handler, Yoga layout, react-native-web and Unistyles, each with its mechanism and fix. Use when writing or debugging animation, gesture, layout, keyboard, or theming code in a React Native project, and when native and web behave differently.
---

# react-native-pitfalls

Each entry was found the hard way and verified in the library's source or on a device. Find the
symptom below, then read that entry in the named file before writing or changing the code. Each
file states the versions its entries were verified on, and an entry names its own where it
differs. When the installed version is newer than the stated one, check the mechanism in
`node_modules` before relying on the entry.

## [reanimated.md](reanimated.md)

- A shared value read on the JS thread returns an old value.
- A spring starts with zero velocity, or moves the wrong way before settling.
- A timing animation jumps past its start value for a frame.
- A dependency array on a Reanimated hook warns on native or goes stale on web.
- A child sized in percent snaps back under a parent with an animated height.
- A `flex: 1` child does not shrink with its animated-height parent; `onLayout` stays silent.
- The first layout measure sees the wrong animated size.
- "Cannot copy value of type WorkletEventHandler".
- A view flickers back for a frame when an animation starts beside a React commit.
- `entering`, `exiting` and `LayoutTransition` on Android.

## [gesture-handler.md](gesture-handler.md)

- A fast flick commits the value at the grab point.
- A tap on a pan area snaps the value back.
- A gesture hook re-registers its handlers on every render.
- The first `onUpdate` and the first scroll event arrive in an unexpected order.
- Callbacks on a wrapped `ScrollView` run on the JS thread.
- Migrating from the v2 builder API.

## [yoga-layout.md](yoga-layout.md)

- `flexBasis` gives 0 px on native and the right size on web.
- A measuring view reports a height capped at its parent's.
- An auto-height child overflows instead of fitting the space left.
- Text inside a zero-size anchor box collapses to "…".
- An absolutely positioned child sits differently on native and web.
- Clearing one edge of `absoluteFill`.
- A resize that never settles.
- `alignItems: 'center'` has no visible effect in a wrapping container.

## [react-native-web.md](react-native-web.md)

- A drag fires `onPress` on web.
- `onPressIn` and `onPressOut` never fire on a `Text`.
- `onLayout` results arrive half-updated; a moved marker never re-fires.
- A `100%` cross size renders 0 px tall or wide.
- Text shrinks on web and overflows on native.
- Render timings measured under react-native-web are far too high.
- Accessibility state, snapping and scroll props that are missing on web.
- Safe-area insets are huge for content below the fold.
- A portal's content ignores presses or is left-aligned.

## [unistyles.md](unistyles.md)

- A style on an `Animated.View` silently disappears.
- A style stops following theme changes.
- Indexing a variant axis fails to type-check; a compound variant applies when it should not.
- Content inside a `ScopedTheme` keeps the wrong theme.
- "No theme has been selected yet" at import.
- A pressed state through `_web` pseudo-classes does not reach the DOM.

## [react-native-core.md](react-native-core.md)

- A programmatic `scrollTo` reports a momentum end on iOS.
- A medium font weight renders as the heaviest face on iOS.
- "Accessing a property on a released synthetic event".
- A pressed state on `Text` never triggers.
- `Modal` teardown and `onDismiss` differ per platform.
- Keyboard height is wrong on Android or in iPad multitasking.
- A platform helper ships web code to native.
- A list in a content-sized container opens short and grows.
- A web-only import crashes the whole native app at start.
