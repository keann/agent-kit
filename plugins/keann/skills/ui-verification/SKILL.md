---
name: ui-verification
description: How to prove that UI behaviour works, on web and on an iOS simulator - choosing the tool, driving real gestures, sampling animation frames, reading logs from a device, and measuring render cost. Use when verifying a visual, gesture, animation, layout, or performance change, when reproducing a UI bug, and before reporting such a change as working.
---

# ui-verification

A UI change is verified when numbers show it. This skill says which tool can produce those numbers
and which cannot.

## Rules

1. **Measure, do not look.** Read computed styles, layout rectangles, per-frame samples or pixel
   values. A collapsed layer and a correct one can look the same in a screenshot.
2. **A web preview is not native.** Layout, gestures, text measurement and press handling differ
   (see the `react-native-pitfalls` skill). Verify a native rule on a simulator or device.
3. **Check that frames ran.** Before judging an animation, confirm the page or app was actually
   rendering: `document.visibilityState` on web, a known-good animation (a spinner) on either.
4. **Make the reproduction faithful.** A replica that differs from the real case in one detail can
   reverse the verdict. Reproduce with the real entry point, the real file type, the real build.
5. **Probes are temporary.** Copy the file to the scratchpad before adding the probe. After the
   measurement, copy it back and confirm with `cmp` that it is byte-identical. Scripts and captures
   live in the scratchpad, never in the repo.
6. **Compare before and after.** Run the same measurement on the old code and the new code: copy
   the new file to the scratchpad, write the old one with `git show HEAD:./<file> > <file>` (the
   `./` makes the path relative to the current folder), run, and copy the new file back. A green
   run on new code alone proves little.
7. **Say what was verified where.** Report each claim with its environment: headless web,
   simulator, device. State plainly what was not verified.

## Which tool

| Need | Use |
|---|---|
| Structure, text, computed styles of a web page | The in-app browser pane with DOM queries, or headless Playwright |
| Animation frames, gestures, `onLayout`-driven logic on web | Headless Playwright. See [web-playwright.md](web-playwright.md) |
| A first-frame flash or a jump on mount | Playwright with CPU throttling and a per-frame sampler |
| Real native gestures and layout | The iOS simulator with `idb`. See [ios-simulator.md](ios-simulator.md) |
| Logs from a native app | Metro's console, or a scratch log server. See [ios-simulator.md](ios-simulator.md) |
| Render cost, frame rate, bundle size | See [measuring.md](measuring.md) |
| A colour, motion or icon choice for the user | Rendered options side by side. See [measuring.md](measuring.md) |

## The in-app browser pane

As of 2026-09 the browser pane inside the Claude desktop app has these limits. Use it for DOM
queries, and switch to headless Playwright for anything about motion or gestures.

- **The page can be hidden.** When the pane is not visible, `document.visibilityState` is
  `hidden`: `requestAnimationFrame` stops, timers are throttled to about one per second, and
  react-native-web delivers no `onLayout`. Every animation freezes at its first value, and logic
  that waits for a measurement never runs. Visibility changes during a session, so check it first
  when an interaction that worked stops working.
- **Screenshots lag the DOM.** A screenshot taken one second after a click can show the old
  state. Trust a DOM query. When a picture is needed, wait two seconds.
- **A drag is a single move.** It never activates a pan gesture, which needs several moves.
- **Zooming into a region is not supported.** It returns the full screenshot.
- **A synthetic `element.click()`** carries no pointer events. Code that compares a click with
  its `pointerdown` position may ignore it.
