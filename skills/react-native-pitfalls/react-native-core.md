# React Native core pitfalls

Verified on React Native 0.86 (Fabric), unless an entry says otherwise.

## A programmatic `scrollTo` reports a momentum end on iOS

On iOS, a non-animated `scrollTo` emits `onMomentumScrollEnd` synchronously, nested inside the
call. It also does not stop a running deceleration: the next momentum frame overrides the offset.
Android emits no such event.

A handler that treats every momentum end as "the user's scroll finished" is fooled by its own
`scrollTo`.

**Fix:** judge momentum ends on the UI thread, and set a flag around your own `scrollTo`. An end
that arrives while the flag is set is the echo.

## A medium font weight renders as the heaviest face on iOS

React Native 0.83 to 0.86.2. When `fontFamily` is a PostScript name (`MyFont-Medium`) and
`fontWeight` is anything but 400, iOS picks the heaviest registered face of that family. A typo in
`RCTFontUtils.mm` turns every explicit weight into 1.0. Fixed in 0.86.3. Android is not affected.

**Fix:** upgrade, or name the family (`'My Font'`) together with the weight, which resolves
correctly.

If a web preview maps several alias families to one variable font, give each alias `@font-face` a
`font-weight` descriptor. Without it, removing `fontWeight` from the styles renders every alias at
weight 400.

## "Accessing a property on a released synthetic event"

Synthetic events are still pooled. An event that is read after its dispatch returns has every
property replaced by a warning getter. This happens when a callback hands the event out inside an
object and a consumer reads it later, for example Storybook's action logger serializing the
argument asynchronously. A top-level event argument is persisted by such tools; a nested one is
not.

**Fix:** a component that passes an event inside a details object calls `event.persist()` before
it invokes the consumer's callback.

## A pressed state on `Text` never triggers

`Text` creates its press handling only when `onPress`, `onLongPress` or
`onStartShouldSetResponder` is set. `onPressIn` and `onPressOut` alone never fire.

**Fix:** always pass an `onPress`, a no-op if needed.

Opacity on a nested `Text` span does work on both platforms, and it dims the underline too.

## `Modal` teardown and `onDismiss` differ per platform

- iOS keeps the host mounted after `visible={false}` until the native dismissal ends. Keep the
  `<Modal>` element rendered while its owner is mounted, and wait for `onDismiss` before
  presenting the next one.
- `onDismiss` is iOS-only. On Fabric it fires only if the modal was actually presented, so a
  state that waits for it needs a timeout.
- `transparent` forces `presentationStyle="overFullScreen"`.
- On Android the modal's window height excludes the navigation bar.

## Keyboard height is wrong on Android or in iPad multitasking

- Android reports the keyboard height minus the system bar. Add the bottom inset to get the
  overlap with an edge-to-edge window. A floating keyboard can report a negative height: floor it
  at 0.
- On iOS the frame is in key-window coordinates, and in iPad multitasking the keyboard is as wide
  as the screen. Compute the overlap against `Dimensions.get('window').height`. A keyboard whose
  bottom edge does not reach the window's bottom is floating or split and needs no lift.
- On iOS, listen to `keyboardWillChangeFrame`. After a rotation the first frame can carry the old
  orientation's width and height swapped.

## A platform helper ships web code to native

Expo's Babel preset and Metro replace `Platform.OS` with the platform string only where it is
written in that file, and the minifier then drops the dead branch. Nothing crosses a module
boundary. An `isWeb()` helper in another module leaves both branches in every caller: 664 bytes
across seven call sites when measured.

**Fix:** write `Platform.OS === 'web'` at the use site, or in a module-level constant of the same
file. Such a constant is fixed at import, so a file whose tests switch `Platform.OS` per test must
keep the check inline.

## A list in a content-sized container opens short and grows

`VirtualizedList` renders `initialNumToRender` rows first (10 by default). Without
`getItemLayout`, its tail spacer covers only rows it has measured. A container sized by the list's
content therefore opens at 10 rows and grows batch by batch.

**Fix:** pass an `initialNumToRender` derived from the available height and a minimum row height.
The initial rows stay mounted for the list's lifetime.

Also: `bounces={false}` disables the iOS pull-to-refresh control.

## A web-only import crashes the whole native app at start

Metro evaluates every static import of a bundled module when the bundle loads, and it does not
tree-shake barrels. One module-scope import that touches `document`, reached through any barrel,
fails the whole app with "Property 'document' doesn't exist". A filter that runs later (story
tags, for example) cannot help.

**Fix:** keep web-only modules out of any path the native entry reaches. Import leaf files instead
of barrels that re-export web-only code. Metro's fast refresh does not recover from this error:
reload the app.
