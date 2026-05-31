---
name: github-project-manager
description: Project-local skill for managing GitHub workflow for the personal project. Use when preparing the public repository, branch strategy, GitHub issues, PR descriptions, Wiki pages, labels, milestones, or documentation workflow required by the 3-week mission.
---

# GitHub Project Manager

Use this skill when the task touches repository setup, issues, branches, pull requests, Wiki documentation, or GitHub-based progress tracking.

## Purpose

The course requires a public GitHub repository, issue-based task management, Wiki documentation, and feature-level PRs. This skill keeps that workflow consistent and evidence-friendly.

## Inputs

1. Read `../project-requirements-and-agent-workflow.md`.
2. Read `../project-topic-draft.md` if repository naming or issue scope depends on the topic.
3. Read README, Wiki drafts, issue templates, and PR templates if present.
4. Inspect git status and branches before proposing branch or commit actions.

## Repository Rules

- Repository should be public under `boostcampwm-snu-2026`.
- Repository name should follow `{project-name}-{user-name}`.
- Confirm project name and user-name format before creating the repository.
- Keep real secrets out of README, issues, Wiki, PRs, commits, and logs.

## Branch Strategy

Use this default flow unless the user chooses otherwise:

```text
main -> dev -> feature/*
```

- `main`: stable, deployable branch.
- `dev`: integration branch.
- `feature/*`: small feature or documentation branches.

## Issue Workflow

For each issue, include:

- Goal.
- Background.
- Scope.
- Acceptance criteria.
- Verification checklist.
- Suggested branch name.
- Labels.

Recommended labels:

```text
planning, documentation, feature, bug, design, refactor, deployment, agent-workflow, week-1, week-2, week-3
```

## PR Workflow

Each feature PR should target `dev` and include:

- Summary.
- Related issue.
- Changed files or user-facing behavior.
- Verification steps.
- Screenshots for UI work when useful.
- Known limitations.

## Wiki Workflow

Prepare or update Wiki-ready content for:

- Project Overview.
- Product Requirements.
- Technical Stack.
- Screen Flow.
- Task Breakdown.
- Agent Workflow.
- Weekly Reflections.

## Quality Check

- Issues are small enough to complete and review.
- PRs map to issues or clear documentation tasks.
- The branch name matches the task.
- Wiki and README content do not contradict the current project plan.
- GitHub workflow work is recorded without claiming actions that were not actually performed.

## Output

Report GitHub artifacts prepared or changed, remaining setup decisions, and suggested next GitHub actions.

