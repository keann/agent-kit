# Gesture Handler pitfalls

Verified on react-native-gesture-handler 3.2 with Reanimated 4.6 (worklet callbacks).

## A fast flick commits the value at the grab point

On iOS, a pan that completes within about one frame delivers `onBegin` and `onFinalize` and not a
single `onUpdate`. The event has `canceled: false` and a translation of 0, yet `event.x` and
`event.y` in `onFinalize` hold the correct final touch position. Touch moves are coalesced to the
display refresh rate, so a sub-frame gesture collapses to down and up. Web is not affected.

**Fix:** the success branch of `onFinalize` applies `event.x` / `event.y` itself before it commits.
The cancelled branch must not, because a cancelled event's position cannot be trusted.

## A tap on a pan area snaps the value back

`event.canceled` in `onFinalize` is true for a failed gesture as well as a cancelled one. The two
cannot be told apart there.

- On iOS a pan activates only when the finger moves, even with `minDistance: 0`. A finger that
  goes down and up without moving fails, so `onFinalize` reports `canceled: true` after `onBegin`
  already ran.
- On web a tap activates and ends normally, but the browser cancels an active pan when the pointer
  capture is lost.

**Fix:** never restore the value from before the gesture in the cancelled branch. Keep the last
touched value, as native sliders and `<input type="range">` do.

## A gesture hook re-registers its handlers on every render

`usePanGesture(config)` memoizes on the identity of the `config` object. A fresh object literal on
each render re-sends the config to native. Inline worklet callbacks that close over a helper
created per render also fail Reanimated's closure comparison, so the event handlers are
unregistered and registered again during render. Measured cost: about 1 ms per render in a dev
build.

**Fix:** build the config in one `useMemo`, define the helpers inside it, and list only real
triggers as dependencies. Shared values and stable callbacks are left out.

## The first `onUpdate` and the first scroll event arrive in an unexpected order

- The first `onUpdate` after activation repeats the activation's translation, so its travel is 0.
  Decide nothing from it.
- When a pan sits over a scrollable, the list scrolls about 10 pt before the pan activates. A gate
  that asks "is the list at its edge" must read the scroll offset captured at touch down, not the
  live one.
- A fast finger's first scroll event can reach a Reanimated scroll handler before Gesture Handler
  delivers the scrollable's `onTouchesDown`. It never arrives before `onScrollBeginDrag`.

## Callbacks on a wrapped `ScrollView` run on the JS thread

Gesture Handler's `ScrollView` and `FlatList` forward gesture callbacks such as `onTouchesDown`,
but the native wrapper defaults `disableReanimated` to true, which runs them on JS.

**Fix:** pass `disableReanimated={false}` to run those callbacks as worklets on the UI thread,
together with the pan they coordinate with.

## Migrating from the v2 builder API

The `Gesture` builder and Reanimated's `runOnJS` are deprecated in this stack. The v3 form is the
hook API: `usePanGesture(config)` with `onActivate`, `onUpdate` and `onDeactivate` (v2's
`onStart`, `onUpdate`, `onEnd`), an explicit `'worklet'` directive in each callback, flat event
payloads, and `scheduleOnRN(fn, ...args)` from `react-native-worklets` in place of
`runOnJS(fn)(args)`.
