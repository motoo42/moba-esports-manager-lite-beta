---
name: agent-workflow-curator
description: Project-local skill for designing, updating, or evaluating the user's AI-agent development workflow. Use when writing Agent workflow docs, defining prompt patterns, choosing task splitting rules, recording verification checkpoints, or improving how AI is used across the 3-week project.
---

# Agent Workflow Curator

Use this skill whenever the task is about how the user and AI agent should collaborate.

## Purpose

The course goal includes building the project and developing a personal Agent workflow. This skill turns everyday work into a repeatable process that can be documented, tested, and improved.

## Inputs

1. Read `../project-requirements-and-agent-workflow.md`.
2. Read `../project-topic-draft.md` when workflow depends on the product scope.
3. Read current planning docs, issue drafts, PR drafts, and weekly reflections if present.
4. Read relevant skills when the workflow touches topic planning, GitHub, frontend architecture, or reflection.

## Default Workflow

Use this cycle unless the task calls for a narrower flow:

```text
Understand -> Inspect -> Plan -> Implement -> Verify -> Document -> Reflect
```

## Workflow Design Steps

1. Identify the work type: planning, implementation, review, documentation, deployment, or reflection.
2. Define what context the agent must read first.
3. Define what the agent may change.
4. Define what the agent must not change.
5. Define human verification checkpoints.
6. Define output format: plan, issue, PR summary, code change, Wiki draft, or reflection.
7. Record the workflow in a reusable Markdown section or skill when it will be repeated.

## Prompt Pattern Rules

Each reusable prompt pattern should include:

- Context.
- Goal.
- Constraints.
- Inputs.
- Expected output.
- Human verification points.

Avoid prompts that ask AI to "handle everything" without scope, evidence, or verification.

## Human Verification Checkpoints

The user should personally verify:

- Topic choice and product value.
- MVP scope.
- Design taste and user flow clarity.
- Tech stack tradeoffs.
- AI-generated claims.
- Final PR and Wiki content.
- Deployment behavior.

## Quality Check

- The workflow names the source documents to read.
- It separates AI assistance from user judgment.
- It includes verification before completion.
- It can be reused on a future task.
- It is concise enough to be followed under time pressure.

## Output

Return the updated workflow, prompt pattern, or verification checklist, plus where it should be stored.

