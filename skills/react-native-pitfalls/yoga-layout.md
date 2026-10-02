# Yoga layout pitfalls

Verified on React Native 0.86 (Fabric). Yoga and CSS flexbox differ in each case below, so a
layout that is right in a web preview can be wrong on a device. Check layout rules on native.

## `flexBasis` gives 0 px on native and the right size on web

Yoga ignores a child's `flexBasis` when the parent's main size is undefined, which is the case for
any stack sized by its content. A spacer styled `flexBasis: 12, flexGrow: 0, flexShrink: 0` is
0 px tall there. Browsers honour the basis.

**Fix:** also set `minHeight` and `minWidth` to the size. Yoga respects minimums.

## A `flex: 1` or `flexBasis` child keeps the size of its first layout

Yoga computes a child's definite flex basis once and caches it. A definite basis is a number, a
percentage, or the 0 that `flex: 1` sets on native. Yoga clears that cache only in
`markDirtyAndPropagate` and when it hides a subtree. React Native marks a changed node with
`setDirty`, which keeps the cache. A child first laid out while its parent has no height therefore
keeps the content-sized basis of that pass. Two `flex: 1` lists with 10 and 60 rows split 111 and
667 px instead of 389 and 389 once the parent gets a height. A later change to `flexBasis` never
applies. A percentage basis also ignores a parent resized through its style props, so 25% of a
parent whose `height` drops from 600 to 300 px stays 150 px. `height` and `width` are resolved on
every layout, percentages included.

**Fix:** to clear a basis taken while the parent had no height, render the parent with
`display: 'none'` for one commit before it gets its height. Yoga zeroes the layout of a hidden
subtree, the cached basis included. Fabric emits no layout events for the hidden children. For a
size that changes at runtime, set `height` or `width` instead of `flexBasis`.

## A measuring view reports a height capped at its parent's

A child in normal flow with auto height, inside a parent with a definite height, is measured "at
most the parent". Its `onLayout` never reports more than the parent's height, so content that
grows past the parent is under-reported.

**Fix:** to measure what the content wants, position the measured view absolutely with `top: 0`,
`left: 0`, `right: 0` and no `bottom`. It is then measured without a cap and overflows the parent.
Adding `bottom: 0` pins it to the parent's height again. Switch between the two with a static
style, never an animated one.

## An auto-height child overflows instead of fitting the space left

Yoga caps an auto-height child at the parent's content box, not at the space left after its
siblings. A scrollable wrapper under an 88 px header keeps the full parent height and ends 88 px
below the parent's edge.

**Fix:** give the child `flexShrink: 1`, or a flex size, so it takes the remaining space.

## Text inside a zero-size anchor box collapses to "…"

A `width: 0, height: 0` absolute box that centers its child positions correctly on both engines.
Yoga, however, measures the child with "at most 0" width, so a one-line text is truncated. Web
hides the problem: one-line text there is `white-space: nowrap`, and Yoga has no min-content size.

**Fix:** make the anchor a row with a generous fixed width (for example 256) as a measurement
budget, shift it by half that width so its centre stays on the point, and keep
`alignItems: 'center'`.

## An absolutely positioned child sits differently on native and web

Yoga anchors an absolute child to the parent's content box. Web anchors it to the padding box. A
padded parent therefore shifts the child on one platform only.

**Fix:** pin absolute children to an unpadded container, and create the insets with flow views
(spacers) instead of padding.

## Clearing one edge of `absoluteFill`

`{ ...StyleSheet.absoluteFill, bottom: 'auto' }` clears the bottom edge on native and web. With an
`inset: 0` base, `bottom: undefined` does not clear it: Yoga falls back to the all-edges value.

## A resize that never settles

Native layout works on a fractional grid (thirds of a point on a 3× screen). Rounding one
measurement and then subtracting a fractional one from it can land on either side of .5 on
alternate frames. The rounded result flips by 1, the resize restarts, and the loop never ends. Web
does not loop.

**Fix:** keep intermediate measurements fractional and compare raw values. Round only the final
value.

## `alignItems: 'center'` has no visible effect in a wrapping container

A wrapping container that is wider than its content packs its single line to the start, because
`alignContent` decides the line's position. The centering is real but invisible.

**Fix:** set `flexWrap: 'nowrap'` wherever the container is wider than its content.

## Margins

Margins never collapse in Yoga, and views in react-native-web are flex containers too. Two
neighbours with 12 px margins are 24 px apart on both platforms.
