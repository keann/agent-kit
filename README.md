# agent-kit

Working rules, hooks and skills for coding agents, packaged as one Claude Code plugin. The plugin
is named `agent-kit`, and its marketplace is named `keann`. The repository root is the plugin.

## Install

```bash
claude plugin marketplace add keann/agent-kit
claude plugin install agent-kit@keann
```

The plugin has no `version` field, so every commit counts as a new version. To pick up new
commits:

```bash
claude plugin marketplace update keann
claude plugin update agent-kit@keann
```

A session started after the update uses the new version.

## Always on

Two hooks run in every session, with no skill to invoke.

| Hook | Event | What it does |
|---|---|---|
| Working rules | `SessionStart` | Prints [working-rules.md](rules/working-rules.md) into the context: consent, scope, quality, running things, talking to the user, tool traps. |
| Commit guard | `PreToolUse` on Bash | Runs [confirm-git-write.sh](hooks/confirm-git-write.sh). A command that runs `git commit` or `git push` gets a confirmation prompt. Every other command passes untouched. |

## Skills

Each skill loads on its own when its description matches the task, and can be invoked by name as
`/agent-kit:<skill>`.

| Skill | Use it for |
|---|---|
| [code-conventions](skills/code-conventions/SKILL.md) | TypeScript naming and equality, imports, where tests go, `package.json` norms |
| [react-conventions](skills/react-conventions/SKILL.md) | Component folder structure, props and types, component bodies, styling, Storybook stories |
| [code-annotations](skills/code-annotations/SKILL.md) | Auditing and rewriting code comments and doc blocks; runs a checker script in a forked subagent |
| [docs-voice](skills/docs-voice/SKILL.md) | Prose in a README, changelog, guide, docs page or RFC |
| [release-post](skills/release-post/SKILL.md) | A short Slack release post written from a changelog |
| [react-native-pitfalls](skills/react-native-pitfalls/SKILL.md) | Known traps in React Native, Reanimated, Gesture Handler, Yoga, react-native-web and Unistyles |
| [tooling-pitfalls](skills/tooling-pitfalls/SKILL.md) | Known traps in Storybook, vitest, Vite, bun, pnpm, oxfmt and ESLint |
| [ui-verification](skills/ui-verification/SKILL.md) | Proving UI behaviour on web and on an iOS simulator, and measuring render cost |

Four skills keep their detail in reference files beside `SKILL.md`, which are read only when the
task needs them: `react-conventions`, the two pitfalls skills, and `ui-verification`.

## Layout

```
.claude-plugin/
├── marketplace.json        # the marketplace, named keann
└── plugin.json             # the plugin, named agent-kit
hooks/                      # hooks.json and the commit guard script
rules/                      # the always-on working rules
skills/<skill>/SKILL.md     # one folder per skill
```

## Credits

The `docs-voice` skill adapts several rules and examples from
[i-have-adhd](https://github.com/ayghri/i-have-adhd) by Ayoub G. (MIT).
