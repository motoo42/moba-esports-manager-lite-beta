---
name: frontend-project-architect
description: Project-local skill for choosing or reviewing frontend architecture for the personal project. Use when selecting the tech stack, drafting page structure, deciding file layout, creating the initial app scaffold, or reviewing whether implementation boundaries match the 3-week MVP.
---

# Frontend Project Architect

Use this skill when the shape of the frontend project is part of the work.

## Purpose

The project should stay understandable, deployable, and realistic across 3 weeks. This skill helps choose a conservative frontend structure after the topic and MVP are clear.

## Inputs

1. Read `../project-requirements-and-agent-workflow.md`.
2. Read `../project-topic-draft.md`.
3. Inspect the current tree with `rg --files`.
4. Read `package.json`, config files, and existing source files if an app scaffold already exists.
5. Read `topic-scope-planner.md` if the MVP is still unclear.

## Timing Rules

- Before the topic is selected, do not create a detailed component structure.
- During Week 1, prefer stack notes, page-flow drafts, and prototype-risk notes.
- Create the app scaffold only when the user asks or when the planning baseline is clear.
- During Week 2, implement the primary user flow before optional polish.
- During Week 3, prefer stabilization and deployment over new architecture.

## Stack Decision Workflow

1. Identify product needs: routing, forms, data visualization, storage, animations, external APIs, authentication, deployment.
2. Choose the smallest stack that supports the MVP.
3. Explain each major tool choice in documentation-ready language.
4. Avoid dependencies that do not serve a named feature.
5. Record risks and alternatives.

## Structure Workflow

Adapt to the actual framework, but prefer a boring, discoverable shape:

```text
src/
  components/
  pages/
  features/
  hooks/
  services/
  types/
  styles/
docs/
skills/
```

Only create folders that have immediate use.

## UI Architecture Checks

- The first screen is the real product experience, not a generic marketing page.
- The main user flow can be described page by page.
- Empty, loading, error, and success states are planned for core interactions.
- Components are split by user value or reuse, not by premature abstraction.
- Mobile and desktop layouts are considered before final polish.

## Quality Check

- The structure supports the chosen MVP.
- The stack choices are explainable in the README or Wiki.
- No feature folder exists only because it might be useful someday.
- The final answer names any architecture decision and its tradeoff.

## Output

Report recommended stack, page structure, file structure changes, and verification steps. If architecture is premature, say what planning decision should happen first.

