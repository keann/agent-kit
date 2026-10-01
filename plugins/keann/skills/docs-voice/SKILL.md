---
name: docs-voice
description: The user's voice for documentation prose. Use when writing, editing, polishing, or reviewing a README, a changelog entry, a guide, a docs page, or an RFC.
---

# docs-voice

Documentation here is literal, plain, and written in flowing sentences. Apply every rule under
"All prose", then every rule in the section that matches the document. Code comments and JSDoc
belong to the `code-annotations` skill.

## All prose

- **Wrap at the repo's cap**: `max_line_length` in `.editorconfig`, or 100 when there is none.
  Fill each line toward the cap before breaking. A narrower wrap in an older file is not the
  standard, even when that file is your style reference.
- **Start with the answer.** A section opens with its fact, command, or verdict, and ends when
  that is said. Delete an opening sentence that only announces what comes next, and a closing
  sentence that only recaps.
- **Use the literal technical term.** "Extends below the host" and "siblings without `zIndex`
  stack in render order" are docs. "A strip of surface" and "the dock rests on the bar" are
  images, and the reader has to translate them back. Idioms get the same treatment: "circle back"
  and "get the ball rolling" become the literal action.
- **One fact per sentence.** A sentence that chains clauses with colons or dashes becomes two
  sentences.
- **Drop a hedge that adds nothing** ("perhaps", "might", "could possibly"). Keep a hedge that
  states real uncertainty: deleting it claims a confidence the text does not have.
- **Group and rank a long list**: about five items per group, the most relevant first. This shapes
  presentation only. Every relevant item stays in the document.
- **A contrast names the property the two sides differ in.** "`PortalHost` is a DOM `div`, not a
  React Native view" fails, because a view renders a `div` on web too. The real difference (the
  styling plugin wraps views and does not wrap `PortalHost`) is the sentence to write.
- **Keep flowing sentences.** Making prose compact means trimming words and moving the main fact
  to the front, inside the paragraph shape that is already there. Prose stays prose: it does not
  become bullet fragments or question-led headings.
- **State what the code shows.** Every descriptor is verifiable from the component, its types, or
  its examples. Where a thing is placed or how it should be used is stated only when the code
  enforces it.
- **Describe the present.** Docs say how a thing works today. Stability promises and plans stay
  out of them.

## Steps and troubleshooting

- A task of more than one step is a numbered list. Each step is one bounded action, and the list
  has the fewest steps that still work.
- A command, path, or snippet comes before the prose that explains it.
- A troubleshooting entry states the symptom, the cause, and the fix as plain facts: "The test
  fails at `auth.spec.ts:42` with 401 where 200 is expected. The request has no auth header. Add
  `Authorization: Bearer <token>` to it."

## Changelog entries

A changelog reader asks two things: what changed, and what must I do.

- One fact per entry, with the noun or the verb first: "Renamed `numberOfLines` to `maxLines`."
- A New or Fixed entry says what works now, in concrete terms: "Login now works with magic links."
- Keep the facts that affect the reader ("Output unchanged"). The reason for the change and the
  design thinking go into the PR description.
- A new component gets one line that says what it is. Its compound subparts are covered by that
  line. Names that are exported separately (`BaseSheetScrollView`, `useSheetDismiss`) are listed.
- An addition to a component that is itself still unreleased gets no entry of its own. The
  component's line covers it.
- A new helper reads like a new component: `` `useMergedRef` — what it does``. Everything public
  is exported from the root, so the entry does not say so.

## Polishing the user's draft

A request to improve the user's copy ("keep the idea, add some juice") is a copy-edit on their
draft.

- Their sentences stay as the skeleton, word for word, including their punctuation (parentheses,
  dashes). You expand between and after them.
- The result is at least as long as the original and carries every point it made.
- Additions are concrete: an anatomy sentence after their opener, a vague "(actions, icons, etc.)"
  swelled into a list of real, linked names.

## Docs scaffolded from a sibling

Mirroring a sibling package's structure (sections, tables, badge rows) is the norm. Its memorable
phrasings are not part of the structure: a line like "One function, one options interface. This is
the entire surface." works once. Before finishing, grep your draft for the template's phrasings
and make each section say its own thing in plain words ("Everything the package exports:").

## Option and API docs

- **An option named after a mechanism is justified by need.** For an option like `allowRelative`,
  state the enabling conditions as questions about capability and need: does the sink resolve
  against a document base URL, and does the product want relative navigation? "Turn it on for
  web" teaches readers to enable it because of what platform they are on. Platform names stay in
  real hazard warnings and per-platform recipes. Answer "why is this not a `platform` option"
  explicitly.
- **Compact API sections, when the user asks for them**: the verdict or the action comes first,
  decisions are numbered questions, one sentence of rationale follows the verdict, and each
  paragraph stands without referring back to another.

## Depth follows flexibility

How deep a page goes depends on how much the API can do, and not on how many people read it.

- A flexible primitive (a headless or base component) gets detailed storytelling: every behavior
  has an example that explains the mechanism, because its readers build their own component on it.
- A styled wrapper gets a short page that is correct and self-contained for the standard cases.
  For a complex behavior it states its own fact and links to the primitive's example. It does not
  retell the mechanism or repeat the demo.
- In a review, grade the wrapper's page on correctness, self-containment, and links. A primitive
  with deeper docs than its wrapper is the intended state.
