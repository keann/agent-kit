# Storybook story conventions

For `*.stories.tsx` files in the component's `docs/` folder. Prose in story docs follows the
`docs-voice` skill, including its rules for component names and cross-links.

## Meta and Sandbox

```tsx
/** Component-level docs shown on the docs page. */
export default {
    title: 'Components/<Category>/<Component Name>',
    component: MyComponent,
    argTypes: { ...systemArgTypes, ...eventsArgTypes, ...a11yArgTypes },
    args: { children: 'Label' },
} satisfies Meta<typeof MyComponent>

type Story = StoryObj<typeof MyComponent>

export const Sandbox: Story = {}
```

- **`Sandbox` is required and is the first story.** It uses args only, with no props in JSX, and
  inherits everything from the meta.
- **Never hide an arg type in `Sandbox` or in the meta.** The docs page builds its props table from
  `Sandbox`, so a hidden key disappears from the reference.

## Arg types

A component that extends an element's props gets a `MyComponent.argTypes.ts` that sorts the
inherited props into table categories, each with its keys in alphabetical order:

| Group | Keys |
|---|---|
| `a11yArgTypes` | `accessibility*`, `aria-*`, `role` |
| `eventsArgTypes` | `on*`, press delays and offsets |
| `systemArgTypes` | `testID`, `hitSlop`, `nativeID`, platform-prefixed props |

The same file exports `hideArgTypes(...keys)`, which disables the table row for each key.

## Stories that show a prop

When a story has a written code preview, the snippet is what a reader copies. The prop the story
exists to show must be in it.

- Write the prop in the JSX, after the spread and in alphabetical order:
  `<MyComponent {...args} variant="secondary" />`.
- Remove that prop from the story's `args`. The story's `args` keep only plumbing: open state,
  spies, demo children.
- Hide its control in that story with `argTypes: hideArgTypes('variant')`.

## Variant stories

- Show a representative subset, not every value.
- Order a size axis from small to large: `s`, `m`, `l`.
- Map over the array of values in `render`.
- A story that another component shares is re-exported from that component's stories file
  (`export const Color = IconStories.Color`). Storybook swaps in the importing file's component.

## Story docs

Story docs are developer documentation, not descriptions of what is on screen.

- Annotate only what the code does not show. Do not repeat a prop's own doc comment.
- A numeric axis gets a Markdown table, with the values as columns and the measurements as rows.
- A list of variant values reads `- **primary** — one line on what it means.`
- Show the component in a real context (an inline button inside a sentence), not in an artificial
  stack.

## Layout and helpers

- Arrange a story through the project's preview parameters where it has them, instead of wrapping
  the story in layout components.
- A demo helper used by several story files moves to the Storybook folder's shared blocks.
- A callback spy nested inside an object arg logs nothing to the Actions panel. See the
  `tooling-pitfalls` skill.
