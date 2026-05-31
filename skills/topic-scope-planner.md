---
name: topic-scope-planner
description: Project-local skill for choosing and shaping the personal project topic. Use when comparing ideas, defining target users, writing the topic draft, deciding MVP scope, identifying deferred features, or preventing the 3-week project from becoming too broad.
---

# Topic Scope Planner

Use this skill while the project topic, users, value, or MVP boundary is still unclear.

## Purpose

The project should become a deployable 3-week frontend project with a clear user value. This skill keeps topic selection concrete, feasible, and documented before implementation starts.

## Inputs

1. Read `../project-requirements-and-agent-workflow.md`.
2. Read `../project-topic-draft.md`.
3. Read any existing project plan, README draft, Wiki draft, or issue list.
4. If candidate ideas exist in chat or notes, extract them into comparable options.

## Workflow

1. Restate the current topic status: undecided, candidate phase, selected but unscoped, or finalized.
2. For each candidate, identify target users, core problem, main user flow, frontend learning value, and 3-week feasibility.
3. Score candidates lightly by interest, user value, feasibility, and AI-agent workflow fit.
4. Recommend one of these outcomes:
   - choose a topic now,
   - narrow a broad topic,
   - prototype a specific risk,
   - collect more ideas,
   - defer a feature.
5. Define the MVP as the smallest deployable version that demonstrates the main user flow.
6. Separate features into core, nice-to-have, and out-of-scope.
7. Update or prepare content for `project-topic-draft.md`.
8. Convert the chosen scope into issue candidates when the topic is clear.

## Scope Rules

- Prefer one strong user flow over many shallow features.
- Prefer frontend-visible interaction over hidden infrastructure.
- Avoid backend-heavy ideas unless the backend can remain minimal or mocked.
- Avoid external APIs with uncertain access unless they are optional.
- Treat AI use as a workflow aid, not a reason to inflate scope.
- Keep Week 1 focused on planning, not production implementation.

## Topic Decision Checks

- The project can be explained in one sentence.
- The target user is specific.
- The first screen can communicate the product's value.
- The MVP can be deployed within 3 weeks.
- At least one useful feature can be built without waiting on complex integrations.
- Deferred features are explicitly named.

## Output

Return a topic summary, MVP boundary, deferred feature list, risks, and next tasks. If the topic is not ready, say exactly what decision is still missing.

