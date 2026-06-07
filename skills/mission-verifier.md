---
name: mission-verifier
description: Project-local skill for checking plans, implementation, documentation, GitHub workflow, and handoff readiness against the project goals and course evidence requirements. Use before calling major work complete.
---

# Mission Verifier

Use this skill before finalizing a substantial task.

## Inputs

1. Read `../README.md`.
2. Read `../CODEX_HANDOFF.md`.
3. Read `../docs/development-checklist.md`.
4. Read the docs or source files changed in the task.
5. Inspect `git status`.
6. Run available build/tests when code changed.

## Validation Loop

1. Confirm the work matches the user's latest request.
2. Check current project goals:
   - 1-season MVP.
   - 16:9 FM-style UI.
   - URL-based pages.
   - domain logic separated from UI.
   - AI-agent workflow documented.
3. Check course evidence:
   - README.
   - GitHub Issue/PR workflow.
   - Wiki-ready planning docs.
   - Agent workflow notes.
   - weekly reflection support.
4. Find stale docs or stale assumptions.
5. Fix small documentation issues when safe.
6. Name remaining gaps clearly.

## Implementation Checks

- Existing user decisions are preserved.
- Domain logic is testable.
- UI frame remains stable.
- Build/test status is reported honestly.
- Screenshots are saved for important UI work.
- Checklist is updated.

## Documentation Checks

- Markdown renders cleanly.
- Links point to existing files.
- Completed work and planned work are separated.
- No old mojibake/encoding corruption remains.
- No actual secrets or connection strings.

## Output

Lead with pass/fail findings, then list files checked, fixes made, commands run, and remaining gaps.
