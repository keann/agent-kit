# agent-kit

Working rules, hooks and skills for coding agents, packaged as a Claude Code plugin.

## Install

```bash
claude plugin marketplace add keann/agent-kit
claude plugin install keann@agent-kit
```

## What is inside

- `plugins/keann/rules/working-rules.md` holds the rules that apply in every session. A
  `SessionStart` hook prints the file into the context.
- `plugins/keann/skills/` holds the skills. Each one is invoked as `keann:<skill>`.
