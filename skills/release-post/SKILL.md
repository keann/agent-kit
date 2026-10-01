---
name: release-post
description: Writes a short Slack release post from a package's changelog, as an FYI news bulletin with Breaking and New highlights. Use when the user asks for a release post, a release announcement, or a release message.
---

# release-post

A release post is a news bulletin, not a compressed changelog. Its one job: a developer reads it in
about 10 seconds and knows whether the upgrade touches them and roughly how much work it is. It
reads as news worth waiting for, and its size reflects the real scale of the release.

## Steps

1. Read the release's changelog section right before composing, even when you read it earlier in
   the session: a late commit can add an entry. Sort every entry into a Breaking highlight, a New
   highlight, or dropped. Done when no entry is left unsorted.
2. Check every fact the post will state against the code: each named tool is a public export that
   shipped in this release, and each count ("eight new components") matches the changelog.
3. Compose the post in the shape below.
4. Deliver it as one fenced code block in chat, and nothing else: the user copies it and posts it.

## Shape

```
*<package> <version>* is out 🚀

<wordplay line, optional; see Tone>
<preamble, 1–2 sentences>

*⚠️ Breaking*
• <bullet>

*✨ New*
• <bullet>

📝 [Full changelog](<URL of CHANGELOG.md on the default branch>)
```

- These two sections are the whole body. Changed and Fixed entries and install commands stay in
  the changelog.
- When nothing breaks, leave the Breaking section out and say so in the preamble ("No breaking
  changes.").
- The wordplay line, when there is one, sits directly above the preamble with no blank line
  between them.
- Formatting is Slack's: `*bold*`, backticks for identifiers, `•` bullets. The footer is linked
  text in Markdown form.
- A large release takes about 100 words. A 70-word post under-sells it.

## What each part says

**Preamble**: the scale and the theme of the release in plain, countable facts. "A big one: eight
new components, a color-semantics refresh, and a new sizing model for text and buttons. Most of
the new stuff is aimed at list screens."

**Breaking bullet**: the area or the affected components, plus a phrase that implies a required
code change.

- Say that an API changed, and stop there. "Color tokens: several renamed, moved, or removed"
  carries everything a reader needs. The token list, the old and new prop names, and the value
  unions are in the changelog.
- "The API of sizing inside a parent changed" implies work. "Sizing inside a parent changed" reads
  as a behavior change that demands nothing.
- Name the mental model that changed (sizing inside a parent), which matters more than the exact
  API difference.
- A change that visibly alters output with no code change (a default palette re-synced with the
  design files) is a highlight. Attach it to the matching Breaking bullet.
- A pure rename that the compiler catches is not a highlight next to larger breaking changes, so
  it is dropped there. When renames are all that breaks, they get one bullet that says where they
  are and that the compiler flags each one: "A few renames — props on `Toast`, `Toggle`,
  `ToggleCell`, and the `star` icon. That's the whole list, and the compiler flags each one."

**New bullets**: one bullet per kind of addition, in this order, each one line.

- **Components**, at concept level, with flavors in parentheses to show scale: "Components:
  preview images (single or 2×2 collage), cells (plain, toggle, action, swipeable), selection
  fields (single and multi)." Concepts replace component names, so nothing is said twice. A concept
  that is not self-explanatory gets a short gloss in parentheses. An addition to an existing
  component comes last, after "plus", and names that component: "plus a `checkmark` variant for
  `Toggle`".
- **Docs**, when the documentation changed in ways a reader will notice: "Storybook: better code
  snippets where it matters, a toggle for story framing, a Utilities section, and a guide to
  custom cells." A page is described in common words ("a guide to custom cells"), not by its
  title.
- **Tools**, by name, with no descriptors: hooks and type helpers a developer might use in their
  own components. "Tools for your own components: `useStableCallback`,
  `ExtractUnistylesVariants`."

**Dropped**: everything most product developers never import. That covers prop-type and interface
changes, base-props types, `testID` additions, single new tokens, and fixes that only affect a
preview or docs build.

## Tone

- The post informs, and the developer decides what to do. Every sentence is a statement. Words
  like "migrate" or "update now" turn it into instructions.
- The register is one casual opener ("A big one:"), plain facts, and at most one wink inside a
  bullet ("your screens get a free touch-up"). It is livelier than a changelog and has its own
  wording: phrases from earlier posts are not reused.
- No word claims more than the release delivers. "Makeover" for docs that got better in places is
  too much; "revamped" was accepted.
- An improvement is described without implying the old state was wrong. "Real code previews" says
  the previous ones were fake; "better code snippets where it matters" does not.
- Most readers are non-native English speakers. Use common words: a rare form such as "fuller"
  reads oddly. Wordplay is one layer on a common international idiom, in as few words as possible,
  with the pun word in bold (`*word*`) and one emoji right after it: "Still raising the *bars* 🥁"
  for a release that added two bar components.
- The wordplay's strength matches the size of the change. A steady improvement gets a steady
  phrase ("still"). "Again" claims a jump to a new level.

## Reference posts

Both were accepted by the user. The first is a large release with nothing to pun on:

```
*@acme/ui 0.13.0* is out 🚀

A big one: eight new components, a color-semantics refresh, and a new sizing model for text and buttons. Most of the new stuff is aimed at list screens.

*⚠️ Breaking*
• Color tokens: several renamed, moved, or removed. Default palette re-synced with Figma — your screens get a free touch-up.
• `Text`, `BBCodeText`, `Button`, `TextButton`: the API of sizing inside a parent changed.

*✨ New*
• Components: preview images (single or 2×2 collage), cells (plain, toggle, action, swipeable), selection fields (single and multi), plus a `checkmark` variant for `Toggle`.
• Tools for your own components: `useStableCallback`, `ExtractUnistylesVariants`.

📝 [Full changelog](https://github.com/acme/ui/blob/main/CHANGELOG.md)
```

The second has a wordplay line, renames as the only breaking changes, and a docs bullet:

```
*@acme/ui 0.14.0* is out 🚀

Still raising the *bars* 🥁
Four new components, headlined by tab and bottom bars, and revamped Storybook docs.

*⚠️ Breaking*
• A few renames — props on `Toast`, `Toggle`, `ToggleCell`, and the `star` icon. That's the whole list, and the compiler flags each one.

*✨ New*
• Components: tab and bottom bars, an inline text button (pressable phrases inside flowing text — BBCode links now render as one), a divider, plus an anchored mode for `NotificationBadge`.
• Storybook: better code snippets where it matters, a toggle for story framing, a Utilities section, headless `BaseButton` docs, and a guide to custom cells.
• Tools for your own components: `useToggleState`, `sanitizeUrl`.

📝 [Full changelog](https://github.com/acme/ui/blob/main/CHANGELOG.md)
```

The user tunes this voice with each new post. When they correct a post, propose the matching edit
to this skill.
