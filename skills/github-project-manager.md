---
name: github-project-manager
description: Project-local skill for GitHub workflow. Use when preparing repository setup, branch strategy, issues, PR descriptions, Wiki pages, labels, milestones, commits, or documentation evidence.
---

# GitHub Project Manager

Use this skill when the task touches GitHub.

## Inputs

1. Read `../README.md`.
2. Read `../CODEX_HANDOFF.md`.
3. Read `../docs/development-checklist.md`.
4. Inspect `git status` and current branch.
5. Read changed files before suggesting commits or PR text.

## Repository

```text
https://github.com/boostcampwm-snu-2026-1/esports-manager-lite-motoo42
```

## Branch Strategy

```text
main -> dev -> feature/*
```

- `main`: stable/submission branch
- `dev`: integration branch
- `feature/*`: feature or documentation branch

## Issue Template

Each issue should include:

- Goal
- Background
- Scope
- Acceptance criteria
- Verification checklist
- Suggested branch

Recommended labels:

```text
planning, documentation, feature, bug, design, refactor, test, deployment, agent-workflow
```

## PR Template

Each PR should include:

- Summary
- Related issue
- What changed
- Verification
- Screenshots for UI work
- Known limitations
- Next work

## Wiki Pages

Recommended Wiki pages:

- 프로젝트 기획서
- 기술 스택과 선택 이유
- 화면 흐름
- 개발 Task 관리
- Agent 개발 Workflow
- 검증 체크포인트
- 주간 회고

## Quality Check

- Do not claim GitHub actions that were not actually done.
- Keep secrets out of commits, Wiki, issues, and PRs.
- Update README/docs when workflow changes.
- Prefer feature-level PRs into `dev`.
