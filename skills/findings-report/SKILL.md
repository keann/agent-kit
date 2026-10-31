---
name: findings-report
description: The format for reporting findings, as one ranked list with a title, type, severity, location, description, and fix per item. Use when reporting the results of a review, an audit, or an investigation into problems in code or docs. Pass a target to review it; with no arguments, restate the findings already given in the conversation.
---

# findings-report

Findings go out as one ranked list the user answers by number ("fix 2 and 5"). When another skill
or tool prescribes its own report format, that format wins: the built-in `/code-review`, for
example, reports through its findings tool.

## Steps

1. Pick the input. Arguments name a target: review it, and keep ranked findings inside it. With
   no arguments, the input is the findings already given in this conversation: re-read the code
   behind each one before restating it, and name any finding the working tree disproves. Done when
   every finding has a `path:line` you read in this step.
2. Rank the findings by severity, most severe first.
3. Write the report in the shape below, and end on the question: code waits for the user's pick.

## Shape

```
<total> findings: <count> critical, <count> high, <count> medium, <count> low

1. **<title>** — <emoji> <severity> · <type>
   - **Where:** <path:line>, <path:line>
   - **Description:** <mechanism and one concrete failure>
   - **Fix:** <suggested fix>
   - **Comments:** <optional>

2. …

Aside, outside the target: <one line, unranked>

Which ones should I fix?
```

- The tally lists only the severity levels present.
- The aside line appears only when a dangerous discovery sits outside the target.
- When nothing is found, the whole report is `No findings.` and one sentence on what was checked:
  "Read the 14 files in `src/auth` and ran `pnpm test`."

## Fields

- **Title**: the defect stated as a claim in a few words, such as "Cache survives logout".
- **Severity**, one of four levels:

  | Level | Meaning |
  |---|---|
  | 🔴 critical | Data loss, a security hole, a crash, or a broken build or release |
  | 🟠 high | Wrong behaviour users will hit |
  | 🟡 medium | Wrong behaviour in edge cases, or a trap for the next developer |
  | ⚪ low | Naming, style, docs, or cleanup |

- **Type**: one of bug, oversight, inconsistency, performance, security, naming, docs, test gap,
  dead code, design. Free text when none fits.
- **Where**: every place the defect lives, as `path:line` relative to the working directory.
- **Description**: compact. The mechanism, then one concrete failure: this input or state leads to
  this wrong result.
- **Fix**: concrete enough to act on. With several options, the recommended one goes here and the
  rest go to Comments.
- **Comments**: optional. Caveats, alternative fixes, and confidence. A finding you could not
  confirm is marked **unverified** here, with the check that would confirm it.
