# Reanimated pitfalls

Verified on react-native-reanimated 4.6 with react-native-worklets 0.12, unless an entry says
otherwise.

## A shared value read on the JS thread returns an old value

On the JS thread, the `.value` setter only schedules the write to the UI thread, and the getter
returns a cached copy. The cache is refreshed only after the UI side writes through the setter.

- A JS write followed by a JS read in the same tick returns the old value.
- A value driven by an animation is never refreshed: animation frames write the value directly
  and do not mark the cache dirty. `position.value` can read 0 on JS after a spring settled at 142.
- A value set through the setter inside a worklet does reach JS on the next read.

Test mocks that back `useSharedValue` with a ref hide both cases, so unit tests pass while the
device fails.

**Fix:** JS keeps its own copy (a ref) next to the shared value. Results of a settle travel to JS
through `scheduleOnRN(callback, value)` with the value captured in the worklet. An animation that
depends on the current position starts inside a worklet scheduled with `scheduleOnUI`.

## A spring starts with zero velocity, or moves the wrong way before settling

`withSpring`'s `onStart` does two things to the velocity:

- A seeded `velocity` that points away from the target is set to 0.
- A retarget adds the running animation's velocity to `config.velocity`. If the previous animation
  was not a spring, the sum is 0.

A "spring back while waiting for the consumer, then retarget" design therefore reverses direction
on its first frame, and passing the release velocity again on the retarget counts it twice.
Duration-based springs also recompute stiffness from the distance on every start, so a long travel
snaps hard.

**Fix:** keep the value moving in the direction it will most likely continue (a short spring
toward the projected endpoint), and retarget with `velocity: 0` to carry the in-flight velocity.

## A timing animation jumps past its start value for a frame

Seen on iOS. An animation scheduled from JS is stamped with the time its write lands on the UI
thread. Frames carry the display link's target timestamp. A frame callback that the main thread
held past its vsync is stamped before the start, so the easing receives a negative progress.
Bezier and ease-out curves extrapolate below 0, and the value moves opposite to the animation for
1–3 frames. Springs are safe, because their time delta is clamped at 0.

**Fix:** wrap the easing so it reads `clamp(progress, 0, 1)`. A test can pin it: the eased value at
a runtime of −16 ms must equal the start value.

## A dependency array on a Reanimated hook warns on native or goes stale on web

When the worklets Babel plugin runs, it records every captured value in the worklet's closure, and
Reanimated restarts the hook when those change. A dependency array then adds nothing and costs:

- On native the array is discarded and a warning is logged on every render
  ("dependencies should only be used in web implementation"). This applies to `useDerivedValue`,
  `useAnimatedStyle`, `useAnimatedReaction` and `useHandler`.
- On web a passed array replaces closure tracking, so a missing entry leaves a stale closure.

**Fix:** pass no array where the plugin runs on both platforms. Capture values, never list them.

## A child sized in percent snaps back under a parent with an animated height

On native, a React re-render resolves a child's `minHeight: '100%'` against the parent's static
height from JS styles, not against the height Reanimated is driving. The child jumps back to the
static size on the next commit.

**Fix:** size the child with edges (`StyleSheet.absoluteFill`, or `top: 0` and `bottom: 0`), which
track the animated height.

## A flex child does not shrink with its animated-height parent

Seen on iOS Fabric. An animated `height` on a container does not shrink its `flex: 1` child: the
child stays at its content height. Related: a size change driven by Reanimated does not always
emit `onLayout`.

**Fix:** put no height on the container and let it hug the animated child. To check an animated
size, sample pixels from a screenshot instead of waiting for a layout event.

## The first layout measure sees the wrong animated size

An animated style's initial value is computed on the first render. When that value depends on a
measurement that arrives later, the corrected size reaches the native view one frame after mount,
which is too late for the first `onLayout`.

**Fix:** give the node a static style for the size it needs before the first measure. The animated
style adds the property only after the measure.

## "Cannot copy value of type WorkletEventHandler"

A worklet closure copies everything it captures. Capturing an object that holds a gesture or an
event handler drags that handler into the copy and logs this warning on device.

**Fix:** capture shared values and plain data only. A constants object that worklets capture holds
plain numbers: a function or a shared value in it would be copied into every worklet.

## A view flickers back for a frame when an animation starts beside a React commit

When an event handler starts an animation and also sets React state for the same change, the
commit can land a few milliseconds after the animation's first frame. For 1–2 frames the view
shows its values from before the animation. Reanimated's sync of settled props to React is not the
cause.

**Fix:** set the state in the handler, and start the animation in a `useLayoutEffect` keyed on
that state, so it starts after the commit. The cost is about two frames of latency.

## Layout animations on Android

`entering`, `exiting` and `LayoutTransition` were seen broken on new-architecture Android in
production apps.

**Fix:** drive enter and exit with explicit shared values: duration-based springs with clamped
overshoot, seeded with the gesture's velocity.
