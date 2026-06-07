---
name: agent-workflow-curator
description: Project-local skill for designing, updating, or evaluating the AI-agent development workflow. Use when writing Agent workflow docs, defining prompt patterns, choosing task-splitting rules, recording verification checkpoints, or improving how AI is used in this project.
---

# Agent Workflow Curator

Use this skill when the task is about how the user and AI agent should collaborate.

## Purpose

Keep AI-assisted work repeatable, inspectable, and easy to hand off.

## Inputs

1. Read `../README.md`.
2. Read `../CODEX_HANDOFF.md`.
3. Read `../docs/development-checklist.md`.
4. Read `../docs/risks-and-ai-workflow.md`.
5. Read related docs or changed files for the current task.

## Default Workflow

```text
Inspect -> Ask/Confirm -> Implement -> Verify -> Document -> Handoff
```

## Workflow Rules

1. Identify the work type: planning, implementation, UI, test, GitHub, documentation, or reflection.
2. Read the narrowest relevant source documents.
3. List the decisions the user must make before implementation.
4. Start implementation only after the user confirms when the task is policy-heavy.
5. After implementation, report changed files, verification, and remaining work.
6. Update `docs/development-checklist.md` when progress changes.
7. For UI work, capture or request 16:9 verification.

## Prompt Pattern

Reusable prompt shape:

```text
Context:
Goal:
Decisions already made:
Questions for user:
Implementation scope:
Verification:
Expected output:
```

## Human Verification Points

The user should personally verify:

- UI layout and information density.
- Game fun and realism.
- LoL/LCK format decisions.
- Data and naming choices.
- GitHub PR content.
- Wiki and reflection wording.

## Quality Check

- The workflow separates AI implementation from user judgment.
- The output names files and tests.
- The next task is clear.
- No stale decisions are treated as current.
