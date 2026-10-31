#!/bin/sh
# PreToolUse hook for Bash: asks the user before a command that runs `git commit` or `git push`.
# Reads the hook input (JSON) from stdin. Any other command passes through with no output,
# and so does every command when the plugin's `commit_guard` option is off.

input=$(cat)

# Unset counts as on: `commit_guard` defaults to true.
case $(printf '%s' "$CLAUDE_PLUGIN_OPTION_COMMIT_GUARD" | tr '[:upper:]' '[:lower:]') in
    false | 0 | off | no) exit 0 ;;
esac

# `git`, optional global flags (each with an optional value), then the subcommand. The command
# arrives JSON-escaped, so a newline or tab before `git` reads as `\n` or `\t`.
pattern='(^|[^[:alnum:]_./-]|\\[nt])git([[:space:]]+-[^[:space:]]+([[:space:]]+[^-[:space:]][^[:space:]]*)?)*[[:space:]]+(commit|push)([^[:alnum:]_-]|$)'

if printf '%s' "$input" | grep -Eq "$pattern"; then
    cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"Working rule: commit and push only on the user's word. Confirm this git commit or push."}}
JSON
fi

exit 0
