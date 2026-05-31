---
name: skill-creator
description: Project-local skill for creating, revising, reviewing, splitting, or consolidating Markdown skills inside SNU_study/Personal-Project/skills. Use when the user asks to add, update, organize, copy, adapt, or validate AI-agent skills for the 3-week personal frontend project.
---

# Skill Creator

Use this skill when maintaining project-local skills under `skills/`.

## Purpose

Skills should make future AI-agent behavior more consistent, not act as long user-facing documentation. Each skill should encode a repeatable workflow that helps the 3-week project move from planning to implementation to deployment.

## Inputs

1. Read `skills/index.md` if it exists.
2. Read the skill being edited, if any.
3. Read `../project-requirements-and-agent-workflow.md`.
4. Read `../project-topic-draft.md` when topic, scope, MVP, or product decisions are involved.
5. Read source skills from `../../AI-Blog/skills/` only when adapting an existing pattern.

## Creation Rules

- Store local skills as Markdown files directly under `skills/`.
- Use lowercase hyphen-case filenames.
- Include YAML frontmatter with exactly `name` and `description`.
- Use lowercase hyphen-case for `name`.
- Make the `description` say both what the skill does and when to use it.
- Keep the body focused on future agent behavior.
- Avoid stale references to AI-Blog, GitHub blog generation, Express, LLM drafts, or other old mission-specific details unless this project chooses that direction.
- Do not include secrets, tokens, `.env` values, or private account details.
- Update `skills/index.md` when adding, renaming, or removing a skill.

## Scope Test

Before creating or keeping a skill, ask:

- Would a future agent know when to read this file from the description alone?
- Does this prevent a likely mistake or save repeated project discovery?
- Does it duplicate an existing skill?
- Is it still useful before the project topic is finalized?
- Is the body short enough to load when needed?
- Does it point to source documents instead of copying them wholesale?

## Workflow

1. Define the skill's trigger and purpose.
2. Search existing skills for overlap.
3. Choose whether to create, update, split, or consolidate.
4. Write or edit the frontmatter first.
5. Add only the workflow details needed for repeatable behavior.
6. Update `skills/index.md`.
7. Read the changed file back to check frontmatter, stale references, and formatting.
8. Run `mission-verifier.md` when multiple skills changed.

## Quality Check

- Frontmatter has only `name` and `description`.
- The description is specific enough to trigger correctly.
- The body is actionable without the original chat.
- The skill references the personal project source documents.
- No unrelated AI-Blog assumptions remain.
- `skills/index.md` matches the actual files.

## Output

Report changed skill files, why each skill exists, and any remaining overlap or validation gaps.

