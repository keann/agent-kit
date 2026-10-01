# react-native-web pitfalls

Verified on react-native-web 0.21. A web build of a React Native project (a Storybook preview, for
example) is not a faithful copy of native. These are the differences that have cost time.

## A drag fires `onPress` on web

`Pressable`'s `onPress` fires from the browser's `click` event and never consults the responder
system. Gesture Handler's web implementation cancels nothing when a gesture activates, and it
captures the pointer, so the `click` is retargeted to the element that was touched first. A
browser synthesizes a `click` even after about 64 px of drag. Consequences:

- Stealing the responder does not stop the press.
- An overlay cannot block it, because it never becomes the click target.
- An overlay `Pressable` used as a "tap to close" target fires after a drag as well.

On iOS, Gesture Handler cancels touches when a gesture activates, so native is not affected.

**Fix:** a capture-phase gate at the document or gesture root. It records the `pointerdown`
position and swallows a `click` whose distance from it exceeds the drag activation distance.
Clicks with `event.detail === 0` are keyboard clicks and pass. `View` forwards only the bubbling
`onClick`, so attach the capture listener through a ref. For a tap target, use a Gesture Handler
tap on a plain `View`.

## `onPressIn` and `onPressOut` never fire on a `Text`

`Text` wires only `onPress`, as a click handler. `onPressIn`, `onPressOut` and `onLongPress` do
nothing on web, so a pressed state driven by them is native-only.

**Fix:** on web, drive the pressed look with a CSS `:active` rule and keep the state path for
native.

## `onLayout` results arrive half-updated

All `onLayout` callbacks share one `ResizeObserver`. Each entry is delivered in its own
`setTimeout`, and `measure` on a ref answers one timer later still. One browser layout pass
therefore reaches JS as several timer tasks. Code that coalesces per microtask sees intermediate
states: a "0 px" measure, a wrong transient size.

A `ResizeObserver` also reports size changes only. A zero-height marker that moves without
resizing never fires again.

**Fix:** on web, schedule the combined measure with `setTimeout`, so it lands after the queued
batch, and read positions synchronously from the DOM (`offsetTop`).

## A `100%` cross size renders 0 px tall or wide

In CSS, a flex item is stretched only when its cross size computes to `auto`. A `height: '100%'`
item in a row whose height comes from its content gets neither: the percentage resolves to
nothing against an indefinite container, and stretching is switched off. The item is 0 px tall.
Yoga still stretches, so the same code looks right on a device.

**Fix:** to span the parent's cross axis, use `alignSelf: 'stretch'` with no percent size. It
works in content-sized and fixed-size parents on both platforms. Keep percentages for parents with
a definite size.

## Text shrinks on web and overflows on native

`Text` on web defaults to `flexShrink: 1`, and `numberOfLines` adds `maxWidth: 100%`. Yoga's
default shrink is 0, so text in a native row overflows instead of truncating.

**Fix:** decide the shrink explicitly. To make a web preview match native, set `flexShrink: 0` on
web for text that has not opted into shrinking.

## Render timings measured under react-native-web are far too high

A root-level `Text` (one with no `Text` ancestor) is wrapped in a `LocaleProvider` whose context
value is a new object on every render. React then walks the whole subtree past every memo boundary
and re-renders every nested `Text`. The cost is linear in the number of text nodes (1.6 ms per
re-render for a 10 KB rich-text tree) and is far larger than what is usually being measured.
React Native has no counterpart.

The sign: a subtree with a large render time while its render counters stay flat.

**Fix:** time the logic outside React, or count renders instead of timing them. To time a real
render, mount the subject under a root `Text` that never re-renders.

## Props that are missing on web

- `accessibilityState` is gone. Only the `aria-*` props reach the DOM, so `aria-checked` reads
  null for a component that sets `accessibilityState`. Assert selection through callbacks.
- `snapToOffsets` does not exist. Snapping is native-only.
- The scroll view forwards only `onScroll`, `onTouchMove` and `onWheel`.

## Safe-area insets are huge for content below the fold

Verified on react-native-safe-area-context 5.9. Since that version the web `SafeAreaProvider`
reports insets relative to its own view, measured once at mount and on resize, never on scroll. A
provider that starts below the viewport's edge reports a bottom inset of hundreds of pixels.
Anything that pads by the insets (a popover's collision padding) then misbehaves until a resize.
On native, nested providers were always view-relative.

**Fix:** mount one provider that spans the window. Where the page is not a screen (a docs page
with many previews), provide static metrics through `SafeAreaInsetsContext` and
`SafeAreaFrameContext`.

In version 5.8 the web provider also renders `null` until its insets arrive in an effect, so a
synchronous query right after mount finds nothing. Pass `initialMetrics`.

## A portal's content ignores presses or is left-aligned

Verified on react-native-teleport 1.2. On web the provider renders its root host as a `div` with
`position: absolute; inset: 0; pointer-events: none`, placed next to the children inside the
nearest positioned ancestor.

- `pointer-events: none` is inherited, so portal content ignores presses.
- The host has the size of that ancestor, which may hug its content.
- The host and the portal wrapper are block `div`s, so `alignSelf` on the content does nothing.

**Fix:** set `pointerEvents: 'auto'` on the content's container, and wrap portal content in an
absolute-fill view with `pointerEvents: 'box-none'` so flex alignment applies.
