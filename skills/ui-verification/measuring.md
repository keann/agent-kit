# Measuring cost and showing options

Absolute numbers from a development build are inflated. Measure a control next to the subject and
report the difference.

## Render cost of a component

Build a temporary bench component in a story or a scratch screen:

1. It takes `renderChild: () => ReactNode`. A static `children` element lets React skip the
   re-render and measures nothing.
2. A button starts a loop that forces N parent re-renders (for example 200) with
   `setState` inside `setTimeout(0)`.
3. `<Profiler onRender>` around the child sums `actualDuration`.
4. Wall time per re-render runs from the `setState` call to a `queueMicrotask` queued in the
   parent's `useEffect`. Children's effects have run by then.
5. Render the median as text and read it from the page or from the accessibility tree.
6. Run a plain `View` as the control, the subject before the change, and the subject after.

## Frames and commits during an interaction

To measure an open, a drag or a close on a device:

- A `useFrameCallback` worklet counts UI-thread frames and the largest gap between them while a
  recording flag is set. When the flag drops, it sends the totals to JS. Do not read those shared
  values from JS directly.
- A JS `requestAnimationFrame` loop counts JS frames and gaps over 33 ms.
- `<Profiler onRender>` counts React commits and their duration.
- Start and stop each window from the component's own lifecycle callbacks.

Under heavy JS load the JS frame counter reads zero, so the commit count is the reliable measure
of JS work. Read each sample twice: a repeated identical readout may be a stale screen.

A consumer callback that sets React state on every frame of a drag shows up as a dozen commits per
drag. That is the number to quote when recommending a shared value or a ref instead.

## Whether code is removed from a bundle

To check that a platform branch is dropped from a native bundle, run the real pipeline on one
file: transform it with the app's Babel preset and Metro's caller options for the platform
(`platform`, `isDev: false`), wrap the result as Metro does, and minify with Metro's default
terser config. Compare byte counts per platform, and search the output for the code that should be
gone.

## Timing inside an animation

Wrap the easing or the worklet under test in a worklet that logs its input when it is outside the
expected range, and send the lines to a scratch log server. Count how often it happens over a
fixed number of runs, before and after the fix, at the same probe load.

## Whether a test still guards the code

Before removing or merging a test as redundant, break the code it guards. The old test must fail,
and the remaining suite must fail too. Keep the old test beside the new one under a temporary
name while comparing, restore the implementation from its original text, and delete the copy
afterwards. A suite that passes after a rewrite says nothing about what it still pins.

## Pictures for the user

A choice of colour, motion, framing or icon is made from a picture, and a change is shown with
one. Every picture is a headless Playwright capture at `deviceScaleFactor: 2`, clipped to the
element: `locator.screenshot()`, or `page.screenshot({ clip })` for a region spanning several.

- Render each option in the scratchpad: headless Playwright for web content and animation
  frames, the platform's own tools for app icons, ffmpeg for video.
- Put the options side by side in one image or video (ffmpeg `hstack`, or an HTML grid that is
  screenshotted), with each option's name written in the image.
- Apply a styling variant with `page.addStyleTag`, and a text or markup variant with
  `page.evaluate`, before the capture.
- Send the file, then ask.
