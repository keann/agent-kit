# Changelog

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Version numbers
follow the rules in [Versioning](README.md#versioning).

## [1.0.1] - 2026-10-31

### Fixed

- `release-post` marks the "is out 🚀" headline of its reference posts as not a template, in line
  with its rule that each post words its own headline.
- `release-post` and `ui-verification` state two remarks as present facts instead of past events.

## [1.0.0] - 2026-10-31

### Added

- Working rules, printed into every session by a `SessionStart` hook: consent, scope, quality,
  running things, talking to the user, and tool traps.
- Commit guard, a `PreToolUse` hook that asks for confirmation before `git commit` and `git push`.
- `commit_guard` plugin option, which turns the commit guard off when set to false.
- `code-conventions` — TypeScript naming and equality, imports, test placement, and
  `package.json` norms.
- `react-conventions` — component folder structure, props and types, component bodies, styling,
  and Storybook stories.
- `code-annotations` — audits and rewrites code comments and doc blocks, and runs a checker script
  in a forked subagent.
- `docs-voice` — the voice for a README, changelog, guide, docs page, or RFC.
- `release-post` — a short Slack release post written from a changelog.
- `findings-report` — the ranked list a review or investigation reports its findings in.
- `react-native-pitfalls` — known traps in React Native, Reanimated, Gesture Handler, Yoga,
  react-native-web, and Unistyles.
- `tooling-pitfalls` — known traps in Storybook, vitest, Vite, bun, pnpm, oxfmt, and ESLint.
- `ui-verification` — proving UI behaviour on web and on an iOS simulator, and measuring render
  cost.
