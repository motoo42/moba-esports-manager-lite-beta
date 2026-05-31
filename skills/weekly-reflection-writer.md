---
name: weekly-reflection-writer
description: Project-local skill for writing weekly personal reflections and final retrospectives for the 3-week project. Use when preparing GitHub Wiki reflection pages, summarizing AI usage, recording decisions, or turning completed work into honest learning notes.
---

# Weekly Reflection Writer

Use this skill when creating or revising weekly reflection content.

## Purpose

The mission requires at least one personal reflection each week in GitHub Wiki. The reflection should be specific, honest, and connected to project decisions and AI-agent usage.

## Inputs

1. Read `../project-requirements-and-agent-workflow.md`.
2. Read current project plan, topic draft, README, Wiki drafts, issues, PRs, or changed files relevant to the week.
3. Read `agent-workflow-curator.md` when reflecting on AI usage patterns.
4. Inspect actual work before claiming completion.

## Reflection Structure

Use this default shape:

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

- Write in first person when preparing final user reflection text.
- Mention concrete artifacts: docs, issues, PRs, prototype results, deployed URL, or tests.
- Separate completed work from planned work.
- Include how AI helped and where AI output needed correction.
- Include what the user personally judged or verified.
- Name remaining risks instead of hiding them.
- Keep the tone reflective, not promotional.

## Week-Specific Focus

- Week 1: topic, scope, planning, stack decision, Agent workflow draft.
- Week 2: implementation progress, issue flow, PR review, changed assumptions.
- Week 3: deployment, polish, final limitations, workflow retrospective.

## Quality Check

- The reflection does not claim unverified implementation.
- It mentions AI usage with specific examples.
- It includes at least one lesson or future change.
- It can be pasted into GitHub Wiki with minimal editing.

## Output

Return a Wiki-ready reflection draft and a short list of facts that still need user confirmation.

