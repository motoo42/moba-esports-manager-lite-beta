---
name: weekly-reflection-writer
description: Project-local skill for writing weekly GitHub Wiki reflections and retrospectives. Use when summarizing completed work, AI usage, personal decisions, verification, or next-week plans.
---

# Weekly Reflection Writer

Use this skill when creating or revising reflection content.

## Inputs

1. Read `../README.md`.
2. Read `../CODEX_HANDOFF.md`.
3. Read `../docs/development-checklist.md`.
4. Read recent PR descriptions, issue notes, screenshots, or changed files if available.
5. Read `agent-workflow-curator.md` when reflecting on AI usage.

## Reflection Structure

```markdown
# Weekly Reflection - Week X

## What I Worked On

## Decisions I Made

## How I Used AI

## What I Personally Verified

## Problems Or Surprises

## What I Would Change

## Plan For Next Week
```

## Writing Rules

- Write in first person for final Wiki text.
- Mention concrete artifacts: docs, issues, PRs, tests, screenshots, deployed URL.
- Separate completed work from planned work.
- Include how AI helped and where AI needed correction.
- Include what the user personally judged.
- Name remaining risks.
- Avoid claiming unverified implementation.

## Current Reflection Themes

- Topic and scope changed from 3-week submission pressure to long-term precision.
- UI decisions became FM-style 16:9 fixed-frame.
- AI was used to split tasks, implement vertical slices, generate docs, and verify flows.
- User personally validated screenshots and corrected UI direction.
- GitHub workflow was introduced after substantial local implementation.

## Quality Check

- Specific, not promotional.
- Honest about unfinished parts.
- Uses actual project facts.
- Ready to paste into GitHub Wiki with minimal editing.
