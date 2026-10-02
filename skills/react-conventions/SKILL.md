---
name: react-conventions
description: The user's conventions for React and React Native components - folder structure, props and types, component bodies, styling, and Storybook stories. Use when creating, changing, or reviewing a component, its styles, or its stories.
---

# react-conventions

These are the user's own conventions for components. Apply every rule that matches the file in
front of you. A project's own documented convention wins where the two differ, and so does a name
or a file the user wrote themselves: these rules govern the code you create.

Before writing styles, read [styling.md](styling.md). Before writing or editing stories, read
[stories.md](stories.md). Language-level rules (naming, equality, imports, tests, packages) are in
the `code-conventions` skill.

## Folder structure

```
/my-component                 # kebab-case
├── /assets                   # static files
├── /components               # internal subparts
├── /constants                # component-wide constant values
├── /context                  # React contexts with their providers and hooks
├── /docs                     # stories, fixtures, demo helpers
├── /helpers                  # component-specific functions and hooks
├── index.ts                  # the component's exports
├── MyComponent.tsx
├── MyComponent.styles.ts     # or MyComponent.module.css on web
└── MyComponent.types.ts
```

- Every item is optional. A component-specific type or helper with no component still gets a
  component folder.
- A file in `helpers/` or `constants/` drops the component prefix (`helpers/requestKey.ts`,
  `constants/motion.ts`). The exported symbol keeps a descriptive name (`sourceRequestKey`,
  `SHEET_MOTION`).
- Subparts live in `components/`, all in one of two shapes. While no subpart needs a styles or
  types file of its own, each subpart is one flat file (`components/SheetHeader.tsx`) that
  declares its props type. Once one does, every subpart gets a kebab-case folder named without the
  root component's prefix (`components/surface/BaseSheetSurface.tsx`). The folder holds
  `<Subpart>.styles.ts` when the subpart has styles, and `<Subpart>.types.ts` when it has public
  props. A subpart has no barrel in either shape, and its helpers and constants live in the root
  component's folders.
- `index.ts` exports types first, then the component. It re-exports a subpart's public type from
  the subpart's file path.
- The package root re-exports each component flat. There are no barrels for category folders.
- Named exports only. The one default export is a stylesheet.
- A unit test sits beside its subject, in `helpers/` too.

## Imports

Three blocks, separated by a blank line:

1. External packages.
2. Relative imports from other folders, deepest `../` first, then alphabetical.
3. The component's own files (`./MyComponent.styles`, `./components/…`).

Inside a mixed `{ … }` list, `type` names come first. Import React's types by name from `'react'`;
never use the `React.*` globals.

## Types and props

- **Extend the underlying element's props by omission**, not by picking: expose the full surface
  and leave out only what the component overrides.
- **Inherit instead of redefining.** When two components share props, define them once and take
  them through `Pick`, `Partial<Pick<…>>`, or an indexed access type.
- **Props are in alphabetical order**, in the interface and in the destructuring.
- **A prop that could grow is a string union, not a boolean**: `sizing: 'auto' | 'fill' |
  'shrink'`, not `isFilling`.
- **Directions are `start` and `end`**, not `left` and `right`: `iconStart`, `iconEnd`.
- **A boolean state prop starts with `is`**, a boolean about content with `has`: `isDisabled`,
  `hasCloseButton`.
- **An object of props for an inner element is named after the element's role**:
  `pressableProps`, `actionProps`.
- **A size given in pixels is an `offset`; a size given as a token is a `gap`** or the token's own
  name.
- Every public prop has a doc comment, written by the `code-annotations` skill's rules.

## Component body

- **Reuse before building.** Check in this order: an existing component of the library, a headless
  base component, the platform primitive.
- **A pressable element is built on the library's base button**, not on a raw `Pressable`.
- **Rest props are spread first, and explicit overrides come after the spread.** Name the rest
  object after its target: `...baseButtonProps`.
- **One component, one concern.** An unrelated feature becomes a companion component, not another
  prop.
- **A headless base knows nothing about its styled wrapper**: no design values and no wrapper
  vocabulary in the base. The wrapper reaches the base's internals only through a hook the base
  exports (`useFieldState = () => use(FieldContext)`), never through a deep import.
- **A dependency array lists what changes between renders**: props, state, unstable callbacks.
  Refs and other objects with a stable identity (a Reanimated shared value, a stable callback) are
  left out, even when the hook body reads or writes them. Where the repo's lint enforces
  exhaustive deps, tell the user about the conflict.
- **Dev-time errors go through the project's one helper**, and they log when the bad condition
  appears, from an effect, not on every render.

```tsx
export const MyComponent = ({
    children,
    size = 'm',
    style,
    variant = 'primary',
    ...baseButtonProps
}: MyComponentProps) => {
    styles.useVariants({ size, variant })

    return (
        <BaseButton {...baseButtonProps} style={[styles.root, style]}>
            {children}
        </BaseButton>
    )
}
```

## Accessibility

Apply these unless the project has ruled accessibility out of scope.

- Set the role that matches the element. A base button sets `button`, or `link` when it opens a
  URL.
- Reflect meaningful states: `disabled`, `busy`, `checked`, `selected`, `expanded`.
- An icon-only interactive element needs an explicit label.
- Spread the consumer's accessibility props after the defaults, so the consumer can override them.

## From a design file

Ask for the design link when a new component has none. Read colours, spacing, sizes and typography
from the file; do not guess token values. Numbers from the design are evidence. Its names are not:
map each one to an existing code token or convention, and report a raw value that has no token.
