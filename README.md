# agent-kit

Working rules, hooks and skills for coding agents, packaged as one Claude Code plugin. The plugin
is named `agent-kit`, and its marketplace is named `keann`. The repository root is the plugin.

These are my own working rules and conventions. Once installed, the working rules apply to every
Claude Code session in every project. Fork the repository to make the kit your own.

## Install

```bash
claude plugin marketplace add keann/agent-kit
claude plugin install agent-kit@keann
```

An installed copy changes only when the version in `plugin.json` changes. To pick up a new
version:

```bash
claude plugin marketplace update keann
claude plugin update agent-kit@keann
```

A session started after the update uses the new version. [CHANGELOG.md](CHANGELOG.md) lists what
each version changed.

## Always on

Two hooks run in every session, with no skill to invoke.

| Hook | Event | What it does |
|---|---|---|
| Working rules | `SessionStart` | Prints [working-rules.md](rules/working-rules.md) into the context: consent, scope, quality, running things, talking to the user, tool traps. |
| Commit guard | `PreToolUse` on Bash | Runs [confirm-git-write.sh](hooks/confirm-git-write.sh). A command that runs `git commit` or `git push` gets a confirmation prompt. Every other command passes untouched. The `commit_guard` option turns it off. |

To turn the commit guard off, set the plugin's `commit_guard` option to false in `/config`, or
install with `--config commit_guard=false`. Restart Claude Code after changing it in `/config`.
The working rules still tell the agent to commit and push only when you say so.

## Skills

Each skill loads on its own when its description matches the task, and can be invoked by name as
`/agent-kit:<skill>`.

| Area | Skill | Use it for |
|---|---|---|
| Code | [code-conventions](skills/code-conventions/SKILL.md) | TypeScript naming and equality, imports, where tests go, `package.json` norms |
| Code | [react-conventions](skills/react-conventions/SKILL.md) | Component folder structure, props and types, component bodies, styling, Storybook stories |
| Code | [code-annotations](skills/code-annotations/SKILL.md) | Auditing and rewriting code comments and doc blocks; runs a checker script in a forked subagent |
| Writing | [docs-voice](skills/docs-voice/SKILL.md) | Prose in a README, changelog, guide, docs page or RFC |
| Writing | [release-post](skills/release-post/SKILL.md) | A short Slack release post written from a changelog |
| Writing | [findings-report](skills/findings-report/SKILL.md) | The ranked list of findings a review or investigation reports, item by item |
| Pitfalls | [react-native-pitfalls](skills/react-native-pitfalls/SKILL.md) | Known traps in React Native, Reanimated, Gesture Handler, Yoga, react-native-web and Unistyles |
| Pitfalls | [tooling-pitfalls](skills/tooling-pitfalls/SKILL.md) | Known traps in Storybook, vitest, Vite, bun, pnpm, oxfmt and ESLint |
| Verification | [ui-verification](skills/ui-verification/SKILL.md) | Proving UI behaviour on web and on an iOS simulator, and measuring render cost |

## Versioning

The version lives only in `.claude-plugin/plugin.json`, and installed copies update when it
changes. A commit that changes a shipped file (`rules/`, `hooks/`, `skills/`, or the manifests)
bumps the version in that same commit. The same commit adds a `## [x.y.z] - <date>` section to
[CHANGELOG.md](CHANGELOG.md). A commit that touches only the README or the changelog keeps the
version.

| Bump | When |
|---|---|
| Major | A skill is removed or renamed, or a rule is reversed |
| Minor | A new skill, rule, hook, or reference file |
| Patch | Wording, fixes, or a new pitfall entry in an existing file |

## Credits

The `docs-voice` skill adapts several rules and examples from
[i-have-adhd](https://github.com/ayghri/i-have-adhd) by Ayoub G. (MIT).

## License

MIT, see [LICENSE](LICENSE).
