---
name: mission-verifier
description: Project-local skill for checking personal project plans, skills, documentation, GitHub workflow, and implementation against the Week 13 requirements. Use before finalizing planning docs, weekly reflections, repository setup, issues, pull requests, deployment notes, or after creating multiple project skills.
---

# Mission Verifier

Use this skill before calling a project task complete.

## Purpose

Planning and implementation can look finished while missing course evidence, workflow notes, or verification. This skill checks the work against the 3-week mission and reports remaining risk.

## Inputs

1. Read `../project-requirements-and-agent-workflow.md`.
2. Read `../project-topic-draft.md` when topic or scope is involved.
3. Read `skills/index.md` and relevant skills when validating skill work.
4. Inspect changed files with `git status` and targeted reads when a git repository exists.
5. Read README, Wiki drafts, issue drafts, PR drafts, and weekly reflections when present.
6. Run available tests or builds when implementation files changed and the project has scripts.

## Validation Loop

1. Check whether the work matches the user's latest request.
2. Check against Week 13 requirements:
   - 3-week deployable personal frontend project.
   - Week 1 planning before implementation.
   - project plan.
   - service topic and core features.
   - technical stack and reasons.
   - screen flow or page structure.
   - GitHub issue task management.
   - Wiki documentation.
   - feature PR workflow.
   - Agent workflow draft.
   - weekly personal reflection.
3. Check for stale or copied assumptions from older projects.
4. Fix small documentation or skill issues when clearly safe.
5. Name unresolved decisions instead of pretending they are done.

## Skill Validation Checks

- Every skill has YAML frontmatter with exactly `name` and `description`.
- Descriptions explain when to use the skill.
- Skills point to project source documents.
- `skills/index.md` lists all skills.
- No skill contains old AI-Blog mission details unless intentionally reused.
- No secrets, tokens, or private values are present.

## Planning Checks

- The topic status is explicit.
- MVP and deferred features are separated.
- Week 1 does not overcommit to implementation.
- Risks and verification checkpoints are named.
- Next tasks can become GitHub issues.

## Implementation Checks

- Changes are scoped to the selected issue or request.
- Existing project conventions are preserved.
- Empty, loading, error, and success states are considered for UI work.
- Build, test, or manual verification is reported honestly.
- New dependencies are justified by the MVP.

## Output

Lead with pass/fail findings. Then name files checked, fixes made, commands run, and remaining gaps.

