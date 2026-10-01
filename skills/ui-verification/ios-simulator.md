# Verifying on the iOS simulator

Start the app with the project's own scripts, and reuse a simulator the user has booted. Pass the
device UDID to every tool: a call without it can boot a different device. The simulator may be
shared with another session, so leave it on the screen you found.

## Input with `idb`

- `idb ui tap --udid <udid> <x> <y>` and
  `idb ui swipe --udid <udid> --duration <seconds> --delta <points> <x1> <y1> <x2> <y2>`.
  Coordinates are integer points; a float makes the command fail. These activate real native
  gestures and take about 0.15 s to start.
- A swipe with `--duration 0.03` reproduces a sub-frame flick.
- The simulator tool in the Claude desktop app has seconds of latency per tap. Use it for a held
  touch (`touch_path`), and use `idb` for anything timed.
- A tap in the top 47 points lands on the status bar. Near y = 30 it triggers iOS scroll-to-top.
  Tap lower (y ≈ 120) to hit the app.
- A touch that begins before an overlay covers the point lands on what was there before.
- `idb ui text` types through the hardware-keyboard channel, and iOS then hides the software
  keyboard for the whole simulator session. To test keyboard layout, tap the on-screen keys, which
  `describe-all` lists as buttons. The user can restore the keyboard with ⌘K in the Simulator.
- In landscape, `describe-all` reports landscape frames, but `idb ui tap` takes portrait
  coordinates: for a landscape point (x, y), tap (y, x). There is no command to rotate. Ask the
  user to rotate the simulator.

## Reading the screen

- `idb ui describe-all --udid <udid> --json` returns the accessibility tree with frames. Visible
  text is in `AXLabel`, and a control's value (a slider's percentage) is in `AXValue`. Rendering a
  result as text in the app and reading it this way is a reliable output channel.
- The tree can come back nearly empty for a second or more after a screen change. Retry before
  concluding anything.
- On an iPad in a windowed app, element frames are relative to the window, while keyboard keys and
  taps use screen coordinates.
- `xcrun simctl io <udid> screenshot <file>` takes a picture. In landscape it returns the portrait
  buffer with rotated content.
- `xcrun simctl io <udid> recordVideo <file>` records. Turn it into a timeline with ffmpeg
  (`fps=8,crop=…,tile=…`), or crop a two-pixel column and scan it per frame to track an edge.
- A size driven by an animation library may not emit `onLayout`. Sample pixels for it.
- With no image library installed, decode a PNG in headless Chromium through a canvas
  (`getImageData`) or with a small zlib decoder in Node.
- Wait about 15 seconds after an edit before recording: the Fast Refresh banner shows up in pixel
  scans. The simulator's status-bar clock can be stuck, so never date a frame by it.

## Logs from the app

Pick the first channel that works:

1. **Metro's console.** `console.log` from JS and from worklets appears there. If the user runs
   Metro in a terminal you can read, read it there.
2. **A scratch log server.** Start a small HTTP server from the scratchpad. In JS, send lines with
   `fetch('http://localhost:<port>/log', { method: 'POST', body })`. From a worklet, hop to JS
   first (`scheduleOnRN`). The simulator shares the host's localhost. This gives a timeline with
   millisecond offsets and does not depend on Metro.
3. **The system log.**
   `xcrun simctl spawn <udid> log stream --level debug --predicate 'process == "<app>"'` shows
   React Native's `console.log` lines. It has stopped delivering without a reason before.
4. **`console.error`.** It raises a LogBox toast whose text `describe-all` can read.
5. **The Hermes debugger.** `GET http://localhost:8081/json/list` returns the target. Connect a
   WebSocket with the header `Origin: http://127.0.0.1:8081`; Expo rejects a missing origin and
   `http://localhost:8081`. `Runtime.evaluate` then runs code in the app, modules are reachable
   through `__r(id)` with ids from `__r.getModules()`, and
   `__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.get(1)` exposes `overrideProps(fiber, path, value)`
   to force one component to re-render.

## Reloading and state

- Fast Refresh does not always apply. After changing a hook's shape, the app can keep running old
  code or stop responding to taps. A cold restart is the sure reset:
  `xcrun simctl terminate <udid> <bundle-id>`, then `launch`, then wait for the bundle to finish.
- Metro does not watch dot-directories. Restart it after editing files in one.
- A red-box error at load is not recovered by Fast Refresh. Reload the app.
- A new Expo development build shows an onboarding sheet and then the dev menu on first launch.
  Both swallow input until dismissed.
- Requesting the bundle with `curl` as a check forces a full build that takes minutes.

## On-device Storybook

With `@storybook/react-native` and its WebSocket server (port 7007 by default):

- List stories: `GET http://localhost:7007/index.json`.
- Select a story and wait for it to render:
  `curl -X POST http://localhost:7007/select-story-sync/<story-id>`.
- Change toolbar globals or args: `POST http://localhost:7007/send-event` with a body such as
  `{"type":"updateStoryArgs","args":[{"storyId":"…","updatedArgs":{…}}]}`. `updateGlobals` and
  `resetStoryArgs` take the same shape.
- A connected device shows as an established connection:
  `lsof -nP -iTCP:7007 -sTCP:ESTABLISHED`. Poll that instead of sleeping.
- New story exports need a cold restart of the app to appear in the index.
- An open modal can block a story switch. Dismiss it first.
- The story view dismisses the keyboard on any tap, so "keyboard already open, then tap a button"
  cannot be tested through Storybook.
- The app ignores story tags.

## iPad

- An iPhone-only app runs letterboxed on an iPad simulator, so tablet layouts never trigger. For a
  local check, copy the built `.app` to the scratchpad, set `UIDeviceFamily` to `[1,2]` in its
  `Info.plist` with `plutil`, and install that copy with `simctl install`.
- iPadOS 26 opens apps in a window. The green window button makes it full screen, and a long press
  on it offers split layouts. Resize by dragging the window's corner with a slow `idb ui swipe`.
