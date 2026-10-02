# Styling conventions

The examples use React Native with Unistyles. The rules apply to any variant-based stylesheet.

## The styles file

- `MyComponent.styles.ts` holds the stylesheet as its default export.
- **Tokens only.** No hardcoded colours, spacing, or font values.
- **Style keys follow the render tree**: the root first, then its children. Not alphabetical.
- **Avoid an `alignSelf` default on a component.** The parent controls layout. Set one only when
  every alternative is worse, and explain why in a comment next to it.
- **The file holds only values a designer could change.** A value derived from them (a built
  spring config) lives where it is used.
- Motion and gesture numbers sit in `constants/motion.ts` as one flat object of plain numbers.
- With Unistyles: no `as const` on style string values, and no variant key named `default`
  (it is reserved and dropped from the inferred type; use `idle` or `neutral`).

## Variants

- **A prop with a fixed set of values is a variant**, selected with `styles.useVariants({ … })`.
  A JS map from prop value to style is the thing to replace.
- **A style that depends on a combination of values is a compound variant.**
- **The prop's type is derived from the stylesheet's variant keys**, so the two cannot drift.
- An axis that exists only to trigger compound variants is declared with empty values
  (`hasStartIcon: { true: {} }`).

```tsx
export default StyleSheet.create(({ colors, spacing }) => ({
    root: {
        variants: {
            size: {
                m: { height: 44, paddingInline: spacing.m },
                l: { height: 52, paddingInline: spacing.l },
            },
            hasStartIcon: { true: {} },
        },
        compoundVariants: [
            { size: 'm', hasStartIcon: true, styles: { paddingInlineStart: spacing.s } },
        ],
    },
}))
```

## Composing styles on an element

- **Cascade order**: overridable defaults, then prop-driven offsets, then the consumer's `style`,
  then the styles the component cannot work without. The consumer can override the first two and
  never the last.
- **Pressed and disabled looks** come from opacity tokens, applied conditionally.
- **Logical properties** (`paddingInline`, `paddingInlineStart`) over physical ones.
- A `_web` block is for making a web preview match native. It is not a second design.

## Layout wrappers

Where the project has stack components (`HStack`, `VStack`, `Spacer`), use them instead of a
stylesheet entry when everything the wrapper needs is a layout prop: direction, gap, padding,
size, alignment.

- Keep a stylesheet when the wrapper also needs a background, border, opacity, transform,
  accessibility props, or a `testID`.
- Inside a content-sized parent, do not give the stack a percent width: the cross-axis stretch
  already fills it, and a percentage breaks the parent's sizing.
- Vertical centering inside a plain pressable needs a full height on the stack.

## Animated styles

- `useAnimatedStyle` hooks live in the styles file, as one exported hook: `useAnimatedStyles`
  (or a scoped name such as `useHeaderAnimatedStyles` in a shared styles file).
- The hook takes the shared values and plain inputs as options. It composes the static styles with
  the animated ones and returns named arrays, so the JSX reads `style={animatedStyles.container}`.
- A static size comes before the animated style in the array.
- A static style that the hook fully absorbs is no longer exported.
- One exception: a fixed on/off switch with nothing to tune (`opacity: isVisible ? 1 : 0`) stays
  inline in the component. The styles file is for looks, and a visibility switch is wiring.
