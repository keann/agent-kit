---
name: code-annotations
description: "Audits and rewrites code comments and JSDoc/TSDoc annotations to the user's own hand-written style (where a comment belongs, how long it runs, how it reads) and runs the checker script, in a forked Opus subagent. Use after writing or changing any comment or docblock in TypeScript/JavaScript, after moving or copying code that carries comments, when reviewing code for comment quality, and when the user says annotate, comment, JSDoc, or docblock. Pass the touched file paths as arguments, plus `review` for findings without edits."
context: fork
model: opus
---

# code-annotations

Comments here are terse, full-sentence, and rare: names carry the what, a comment earns its lines
by carrying the why. This is the fingerprint of the user's own annotations. Apply it to every
comment you write, rewrite, or grade. A project skill that sets wording templates, file paths, or
Storybook story docs wins on those; this skill wins on placement, length, and shape.

## Task

Arguments: $ARGUMENTS

The arguments name the files to audit and may add notes from the caller: `review` for findings
without edits, a different scope, or which blocks the user wrote. With no files named, take the
TypeScript and JavaScript files that `git diff HEAD --name-only` lists.

Edit only the comment blocks the working tree changes, per `git diff HEAD -- <file>`; an untracked
file counts as changed whole. You run as a subagent and never saw the conversation behind the
change: tighten, delete, reflow, and re-voice, but add no claim the code does not show.

## Placement

| Target | Annotation |
|---|---|
| Declaration line of a props/options/attributes type | none; its fields carry the docs |
| Field of an exported interface/object type | always; one line when simple, else ≤2 paragraphs |
| Field of a type nobody hovers (internal, details) | none; the delivering handler explains it |
| Exported standalone type (union, alias) | one block when the literals leave the meaning open |
| Component | none; Storybook or a README carries usage |
| Hook, function, helper | one block, ≤3 paragraphs |
| Statement inside a body | `//` on its own line above it; see Bodies |
| JSX tree | none inside; a one-line `{/* */}` when nothing else reaches the spot |
| Stylesheet, CSS module | bare unless a live trap; `/* */` in CSS |
| Test file | one-liners for a workaround or a non-obvious expected value |
| Lint suppression, `@ts-expect-error` | reason mandatory; see Bodies |
| Accepted limitation | prose in the nearest block |
| Deferred work, untried alternative | none; a ticket or RFC holds it, the file never does |

Bodies: a one-liner names the case of a branch in long code; two lines cover the confusing part;
everything else stays bare, the names do the work. A third line is not yours to take — ask the
author for it, and only when something the reader really needs does not fit in two. A suppression
reads `// eslint-disable-next-line <rule> -- <reason>`; when the reason runs long, a `/* */` block
with the rule, a bare `--` line, then prose, indented to the statement it covers.

The "complicated stuff" exception overrides a *none* row: when a reader would be confused without
help, comment, and keep it short, precise, and helpful.

## Length and wrap

- Column cap: `max_line_length` from the nearest `.editorconfig`, fallback 100, indent included.
- Paragraph: ≤3 text lines. Delimiters, ` *` spacers and tag lines are free. A fourth line means a
  blank-line split into a second paragraph, or a cut.
- Block: ≤2 paragraphs on a field, ≤3 on a helper or a type. An in-body `//` note is one paragraph
  of ≤2 lines, a third only with the author's go-ahead. A Markdown list item is its own paragraph;
  a whole list counts once toward the block cap.
- Fill is sentence-aware. Pack toward the cap; when the paragraph still fits, break where a
  sentence or clause ends (`.`, `:`, `;`, `—`) instead of mid-phrase. Short summary sentences may
  sit one per line. A last line of one to three words is an orphan: rebreak the line before it.
- Two defects, both silent here because no formatter enforces width: a line over the cap, and a
  block reflowed at a narrower fixed width (~80) out of habit.

## Voice

- Full sentences, capitalised, ending in a period. Third person, present tense, descriptive:
  "Clamps `value` between the detents."
- Booleans open with "Whether …". Callbacks open with "Handler that is called when …" (or "once").
- Em-dash asides and colons carry the sub-clause. Backticks wrap identifiers, types, literal
  values, and library APIs; a component name stays plain.
- Why over what: mechanism, thread or frame consequence, accepted limitation. A line that restates
  the code or the type is a line to delete.
- Name the thing, do not describe it: `useSheetPosition`, not "the hook that latches the
  placement". A description makes the reader map prose back to a symbol; a name is the symbol.
- State the mechanism literally: "sets state during render", not "rides the render". A pronoun
  that needs the previous clause to resolve is a rewrite. A comment that fails a cold read is a
  defect the checker cannot see, so it is the audit's job.
- Tags: any official TSDoc tag that renders in IDE hover. Observed set: `@default` (last line
  before `*/`, bare value, single-quoted strings, no blank line before it except after a list),
  `{@link}`, and `@example` on helpers. `@deprecated`, `@see`, `@remarks` when warranted. The block
  closes right after the last line, with no spacer before `*/`.
- A default that depends on a mode the type does not show is one composed `@default`, each value
  labelled with the mode's literal and the main mode first: `@default 0 (bottom), 16 (center)`.
  A mode with no value reads `none (bottom)`. Under 50 characters, so Storybook shows one chip.
  A wrapper that changes a base's default redeclares the prop and carries its own tag.

## Existing comments

- Editing a file: rewrite rule-breaking comments only inside blocks the change already touches; list
  the rest in the report.
- Reviewing: a verbose, AI-flavoured annotation is a finding; propose the shorter version inline.
- Comments the user wrote or deliberately shortened are settled; a perceived loss goes in the
  summary, not into the file.
- A polish request adds onto the user's skeleton: at least as long, every original beat kept, every
  added claim verifiable from the code.
- Docs for an option motivate enabling it by need, never by platform or environment identity.

## Examples

Field docs, from a one-liner to the two-paragraph ceiling:

```ts
/** Icon shown before the label. */
iconStart?: IconName

/**
 * Whether a tap on the backdrop closes the drawer. A locked drawer still reports the tap through
 * `onDismiss`, so a consumer can react without letting it close.
 * @default true
 */
isDismissable?: boolean

/**
 * Handler that is called when the drawer settles at a new position.
 * Fires once per settle, after the spring — never during a drag.
 *
 * Receives the detent landed on and its height in points. A dismissal reports `null`: the drawer
 * has no position then, and a consumer that waits for one keeps its last.
 */
onSettle?: (detent: DrawerDetent | null, height: number) => void
```

A helper, a union that needs a block, and one that does not:

```ts
/**
 * Debounces `callback` by `delay` ms behind one stable function, so it can sit in a dependency
 * array without retriggering effects. A call still pending on unmount is dropped: the timer is
 * cleared, so the callback never runs after it.
 */
export const useDebounce = (callback: () => void, delay: number) =>

/** Where the drawer renders: the RN `Modal` window, or a portal above the host screen. */
export type DrawerHost = 'modal' | 'portal'

export type DrawerSide = 'left' | 'right'
```

Inside a body:

```ts
// While a close animation runs, a second close request is ignored.
if (isClosing) return

// Keep the latest `onChange` in a ref, so the returned callback keeps one identity whether or
// not the consumer memoizes it.
const onChangeRef = useRef(onChange)

// eslint-disable-next-line react-hooks/exhaustive-deps -- `frame` is a shared value, stable.
```

Anti-examples, each with its fix:

```ts
// 1. Overflow: an example crammed into the summary line (168 columns in the original).
 * `[tag=attr 100=100][/tag] -> { '100': '100', attr: 'attr' }` — numeric keys go first, so …
// Fix: the sentence on its own line, the listing under `@example`.

// 2. A documented component.
/**
 * Optional specialized container/wrapper for the drawer content, which provides additional
 * context. Useful for creating the drawer's sub-components, like header, footer, etc.
 */
export const DrawerContent = ({ children }: DrawerContentProps) =>
// Fix: delete the block; the story docs carry usage.

// 3. A boolean carrying its RFC.
/**
 * Whether the drawer can be dismissed by the user. When `false`, the drag gesture resists past
 * the last detent instead of closing, the backdrop tap does nothing, and the system back is
 * swallowed, so that the consumer stays in full control of the drawer's lifecycle.
 *
 * This matters for flows that must complete, like a payment confirmation, where an accidental
 * swipe would lose the user's progress. It does not affect programmatic closes through `isOpen`.
 *
 * Note that the dismissal request is still reported through `onDismiss` for every gesture,
 * which allows the consumer to shake the drawer or show a hint that the flow must be finished.
 * @default true
 */
isDismissable?: boolean
// Fix: the two-line `isDismissable` above. Rationale and use cases belong in the RFC.

// 4. Compressed past reading: names replaced by descriptions, the mechanism by a figure.
// The pan's shared values are created below this hook, so a scrollable leaving the registry
// reaches their reset through a ref the commit fills; a cleanup can only run once it has.
// Fix: name the function, state the mechanism.
// `forgetScrollable` is created by the gesture hook below, so the position hook reaches it
// through a ref. The ref is filled on commit, before any scrollable's cleanup can run.

// 5. A deferred experiment parked in the file.
// Hugging like the window below needs the bleed as surface padding: untried on device.
// Fix: delete; a ticket holds the experiment. Nobody returns to remove the note once it is tried.
```

## Procedure

Applying this skill to a file means the audit first, the checker last. The checker measures shape;
it cannot tell a component from a helper, a public field from an internal one, or a trap from
narration — that judgement is step 1, and a pass that skips it only reflows the verbosity.

1. Audit: list every comment block in the file, name its target from the Placement table, and
   decide keep, tighten, or delete. Internal is anything a consumer of the package never hovers:
   check the barrel, not the `export` keyword. Default for a `//` note is delete, and a note that
   stays true only until someone acts on it (untried, not yet, for later) is a delete at any
   length: nobody comes back to remove it.
2. Apply the decisions, then rewrite what stays to the Length and Voice rules.
3. Run the checker on every touched file:

   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/check-comments.mjs" <file…>
   ```

   `--cap N` overrides the `.editorconfig` cap; `--all` also lists code lines over it.
4. Fix every `error` line and rerun until the output holds nothing but `note` lines. A
   `note-length` note wants an answer, not a fix, and the author is reached only through the
   report: cut the note back to two lines and put the three-line version in the report as a
   question, so the caller can ask whether the third line stays. A cap is met by cutting; moving the
   excess into another block relocates the defect and hides it from the author.
5. Re-read each touched block once for balance and orphans: the script sees widths, you see sense.

Done when every block in the file has a row in the table that allows it, the script is silent, and
what remains reads like the examples. The report is all the caller sees: per file, every deletion
with its line, each rewrite, the settled blocks that break a rule, and the questions from step 4.
