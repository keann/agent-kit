# Verifying on web with headless Playwright

A headless Chromium page is always `visible`, so animation frames, springs and `onLayout` run.
Drive it against the project's running dev server (Storybook, Vite). Check first whether the user
already runs that server, and reuse it.

## Setup

- Use the project's own Playwright if it has one. From a scratchpad script, resolve it through the
  project: `createRequire('<repo>/package.json')('playwright')`, or symlink the repo's
  `node_modules` into the scratchpad.
- For Storybook, load one story without the manager UI:
  `http://localhost:<port>/iframe.html?id=<story-id>&viewMode=story`. Add `&globals=<key>:<value>`
  for toolbar globals and `&args=<name>:<value>` for args. A docs page is `viewMode=docs`.
- Set the viewport to the device size under test (for example 390×844).
- Headless Chromium logs blocked hot-reload WebSocket errors. That is expected noise.

## Gestures

- `page.mouse.down()`, several `page.mouse.move()` calls about 16 ms apart, then `page.mouse.up()`
  activate a pan gesture. A loop of 14 moves works. Hand-built `PointerEvent`s and Storybook's
  test-library events do not.
- A regression test for a drag must assert that the element moved mid-drag. Without that, it
  passes when the gesture never activated.
- To emulate the browser dropping pointer capture, patch `Element.prototype.setPointerCapture` to
  remember the capturing element, then call `releasePointerCapture` on it mid-drag.

## Sampling per frame

Install a sampler with `page.addInitScript`: a `requestAnimationFrame` loop that pushes
`performance.now()` and the values under test into `window.__samples`. Read values from
`getComputedStyle`, or from inline `style` for properties an animation library writes inline.
Afterwards, read the array with `page.evaluate`, drop consecutive duplicates, and print the
timeline of changes.

For a position, read the transform as a matrix:
`new DOMMatrixReadOnly(getComputedStyle(node).transform).m41`.

## A first-frame flash or a jump on mount

A one-frame glitch is too short for a screenshot or a screencast.

1. Open a CDP session (`context.newCDPSession(page)`) and send
   `Emulation.setCPUThrottlingRate` with `rate: 20`. A one-frame window becomes about half a
   second.
2. Install the per-frame sampler before navigation.
3. `page.goto(url, { waitUntil: 'commit' })`, wait for the element, wait three seconds, read the
   samples.
4. Run once at rate 1 for the real duration and once at rate 20 for the visible window. Report
   both timelines.

Native has no equivalent. Argue from the code path there: the initial value against the value
after the first layout.

## Finding and reading components

- Locate a component's DOM node through React: the node's `__reactFiber$…` key, then walk
  `.return` and match `fiber.type.name`.
- That fiber can show the previous render when the host node did not update. For current props,
  start from the root container's `__reactContainer$…` key, take `.stateNode.current`, and walk
  `child` and `sibling`.
- In react-native-web, text nodes are `div[dir="auto"]`. Filter on that when a code block on the
  page repeats the same string.
- A Storybook docs page renders canvases lazily. A story below the fold has no DOM until it is
  scrolled into view: call `scrollIntoView()` on its anchor and wait before measuring.

## Observing callbacks

To record Storybook actions without the panel, wrap `window.__STORYBOOK_ADDONS_CHANNEL__.emit` in
the page and collect `payload.data.name` and `payload.data.args`.

## Testing a config change without touching the repo

Intercept the served module and rewrite it in flight:

```js
await page.route('**/.storybook/preview.ts*', async (route) => {
    const response = await route.fetch()
    const body = (await response.text()).replace(before, after)
    await route.fulfill({ response, body })
})
```

The same works on `**/iframe.html*` for styles that Storybook inlines from `preview-head.html`.
For a style experiment, `page.addStyleTag({ content: css })` is enough.

## CSS states

Synthetic events cannot trigger `:active` or `:hover`. Verify such a rule by finding it in the
compiled stylesheet and checking `element.matches(selector)`.
