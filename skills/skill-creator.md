---
name: skill-creator
description: Project-local skill for creating, revising, reviewing, splitting, or consolidating Markdown skills inside this project's skills folder. Use when the user asks to add, update, organize, adapt, or validate AI-agent skills.
---

# Skill Creator

Use this skill when maintaining project-local skills under `skills/`.

## Inputs

1. Read `skills/index.md`.
2. Read the skill being edited.
3. Read `../CODEX_HANDOFF.md`.
4. Read `../docs/risks-and-ai-workflow.md`.
5. Read `../docs/development-checklist.md` when skill changes affect current workflow.

## Rules

- Store skills as Markdown files directly under `skills/`.
- Use lowercase hyphen-case filenames.
- Include YAML frontmatter with exactly `name` and `description`.
- Use lowercase hyphen-case for `name`.
- Make the `description` explain when to use the skill.
- Keep the body focused on repeatable agent behavior.
- Avoid copying large project docs into skills.
- Avoid stale references to files that do not exist.
- Update `skills/index.md` when adding, renaming, or removing a skill.

## Scope Test

Before keeping a skill, check:

- Does a future agent know when to read it?
- Does it prevent a likely mistake?
- Does it duplicate another skill?
- Is it short enough to load during real work?
- Does it point to current project docs?

## Workflow

1. Identify the skill's trigger.
2. Search existing skills for overlap.
3. Decide whether to create, update, split, or consolidate.
4. Edit frontmatter first.
5. Keep the body procedural.
6. Update `skills/index.md`.
7. Re-read the changed skill.
8. Use `mission-verifier.md` after broad skill changes.

## Quality Check

- Frontmatter is valid.
- Description is specific.
- Body is actionable.
- References exist.
- No secrets or private tokens.
- `skills/index.md` matches actual files.
