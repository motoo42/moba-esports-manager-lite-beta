---
name: frontend-project-architect
description: Project-local skill for reviewing or changing frontend architecture. Use when editing routing, app state, feature folders, domain engines, component boundaries, test structure, or 16:9 UI layout.
---

# Frontend Project Architect

Use this skill when the frontend structure or implementation boundary matters.

## Inputs

1. Read `../README.md`.
2. Read `../CODEX_HANDOFF.md`.
3. Read `../docs/development-checklist.md`.
4. Read `../docs/ui-design-decisions.md` for UI work.
5. Inspect the current tree with `rg --files`.
6. Read `package.json`, route files, state files, and relevant domain files.

## Current Structure

```text
src/
  app/
  pages/
  features/
  domain/
  data/
  shared/
  types/
tests/
  unit/
  integration/
  system/
  acceptance/
docs/
skills/
```

## Architecture Rules

- Keep `GameProvider` focused on state/context wiring.
- Put reducer/action logic in `src/app/gameReducer.ts`.
- Put game progression in `src/domain/game-progress`.
- Put pure rules and calculations in `src/domain`.
- Put user-facing feature components in `src/features`.
- Put page composition in `src/pages`.
- Keep UI frame behavior in `src/shared/layout` and `src/shared/styles`.
- Avoid adding folders without immediate use.

## UI Rules

- First screen after setup should be the real game hub.
- 16:9 desktop/gorizontal tablet first.
- Left menu and top progress controls stay fixed.
- Scroll only inside content panels where possible.
- Use dense, scannable FM-style layouts.
- Verify important UI changes with screenshots.

## Test Rules

- Domain logic: unit tests.
- Feature component behavior: integration tests.
- Whole app route/progression flow: system tests.
- User-value requirements: acceptance tests.

## Quality Check

- The feature has a clear owner folder.
- Domain logic is not buried inside UI components.
- State changes are testable.
- URLs remain stable after refresh/direct entry.
- UI work follows `docs/ui-design-decisions.md`.
