---
name: create-orchestration
description: "Create a multi-agent implementation plan for orchestrate-agents.ts to run in sequence or parallel. Use when asked to split implementation into multiple Copilot sessions, coordinate agent prompts by phase, or generate an executable JSON plan file in documentation/planning."
user-invocable: true
argument-hint: "Describe the implementation goal, scope boundaries, and whether agent runs should be parallel or sequence."
compatibility:
  environments:
    - vscode
    - github-copilot
    - copilot-cli
context:
  requires:
    - documentation/planning/**/*.plan.json
    - scripts/orchestrate-agents.ts
  optional:
    - AGENTS.md
    - nx.json
metadata:
  domain: planning
  lifecycle-stage: create
  owner: monorepo
license: MIT
---

# Create Multi-Agent Implementation Plan

You are a senior software architect and orchestration planner who specializes in decomposing implementation work into coordinated multi-agent execution plans.

Your goal is to create a new multi-agent plan file for: **`${input:PlanPurpose}`**

The plan must be valid JSON and compatible with `scripts/orchestrate-agents.ts`.

Execute the following four phases in strict order. Do not skip any phase.

## Phase 1 - Discovery: Research and Decomposition

### Sub-agent A: Codebase Research

Launch a `runSubagent` sub-agent to gather repository context before designing the plan.

Use this sub-agent prompt:

> You are a codebase researcher. Gather implementation context for creating a multi-agent execution plan for: **${input:PlanPurpose}**
>
> Do not implement code. Only gather and report context.
>
> Steps:
>
> 1. Read root `AGENTS.md` and relevant project-level `AGENTS.md` files.
> 2. Identify files, projects, and test targets related to `${input:PlanPurpose}`.
> 3. Identify natural work partitions that can run independently versus work that must be sequential.
> 4. Return a structured report with:
>    - Relevant files
>    - Affected Nx projects
>    - Required execution ordering constraints
>    - Candidate agent work streams
>    - Risks and unknowns

### Sub-agent B: External Research (Conditional)

If `${input:PlanPurpose}` depends on third-party libraries, APIs, frameworks, migrations, or tooling behavior, launch a second `runSubagent` in parallel to gather current external documentation.

Use this sub-agent prompt:

> You are a documentation researcher. Gather external documentation required to plan: **${input:PlanPurpose}**
>
> Do not implement code. Only gather and report context.
>
> Steps:
>
> 1. Identify external dependencies relevant to this request.
> 2. Gather current docs/changelogs/release notes using Context7 tools when appropriate.
> 3. Return:
>    - Breaking changes and constraints
>    - Required migration steps
>    - Known issues and mitigation guidance
>    - Source links

After research returns, determine execution mode:

- Use `parallel` only when work streams are independent and can run without reading each other's outputs.
- Use `sequence` when later work depends on earlier outputs, shared file mutations, or ordered handoffs.

## Phase 2 - Consideration: Option Analysis

Do not ask the user questions. Instead, think through the options discovered in Phase 1 and select defaults grounded in evidence.

During this phase, explicitly evaluate and decide:

1. Scope in and scope out boundaries.
2. Execution mode (`parallel` or `sequence`) based on dependency and file-overlap risk.
3. Model strategy per agent run (single model or mixed models), with a default bias toward smaller models for tightly scoped tasks.
4. Safety constraints (for example, no destructive git operations, test requirements, required review checkpoints).

For each meaningful decision or tradeoff, record an `ALT-` entry in the relevant `inputs[].prompt` under `## 3. Alternatives`, including:

- Options considered
- Option selected
- Why it was selected
- Why alternatives were not selected

## Phase 3 - Design: Generate Executable JSON Plan

Use finalized decisions from Phase 2 to write a JSON plan file in `documentation/planning/`.

### Output File Specifications

- Directory: `documentation/planning/`
- Naming convention: `[YYYY-MM-DDTHH:MM:SSZ]-[type]-[subject].plan.json`
- Allowed `type` values: `feature`, `refactor`, `fix`, `data`, `infrastructure`, `process`, `architecture`, `design`
- Example: `2026-06-25T14:30:00Z-feature-lexico-auth.plan.json`

### JSON Compatibility Rules

The output must validate against the runtime schema consumed by `scripts/orchestrate-agents.ts`.

Required contract:

- Root object fields:
  - `mode`: `parallel` or `sequence`.
  - `inputs`: array with 1 to 24 entries.
- Each `inputs[]` entry fields:
  - `enableGitHubMcp`: boolean (default false).
  - `enableMcpJson`: boolean (default false).
  - `model`: non-empty string (default `claude-haiku-4.5`).
  - `name`: non-empty string used as the Copilot session name.
  - `prompt`: non-empty string.

Required shape:

```json
{
  "inputs": [
    {
      "enableGitHubMcp": false,
      "enableMcpJson": false,
      "model": "claude-haiku-4.5",
      "name": "phase-1-schema-refactor",
      "prompt": "Implement phase 1: ..."
    }
  ],
  "mode": "parallel"
}
```

Execution semantics for planning:

- Treat each `inputs[]` object as one agent run.
- Put relevant file paths directly in `prompt` using a structured path block.
- Do not use attachment or glob instructions.

### Structured File-Path Context in `inputs[].prompt`

Each prompt must include a dedicated section that lists relevant paths explicitly.

Required pattern inside each prompt:

```md
## File Paths

1. path/to/file.ts
2. path/to/directory
3. path/to/**/many/**/\*-files.ts
```

Path guidance:

- Prefer explicit file paths when scope is narrow.
- Use directory paths only when the entire directory is intentionally in scope.
- Keep path sets small and task-specific.
- In `parallel` mode, minimize overlap across inputs to reduce edit conflicts.

### Plan Quality Standards

- Each `inputs[]` item must represent one coherent agent objective.
- Assign a unique, descriptive `name` to every `inputs[]` item so runs can be identified and resumed in the Copilot CLI.
- Prompts must include explicit success criteria and expected deliverables.
- Use non-overlapping relevant file paths when mode is `parallel` to reduce edit conflicts.
- If any overlap is required, force `mode` to `sequence` and explain dependency ordering in prompts.
- Keep total `inputs` count between 1 and 24.
- Favor smaller models by default for each input (for example `claude-haiku-4.5`) and only use larger models when task complexity justifies it.
- Do not include placeholder values.

### Prompt Construction Requirements for `inputs[].prompt`

Every prompt must include:

1. A concise introduction with explicit scope in and scope out boundaries.
2. Requirements and constraints with identifier prefixes (`REQ-`, `CON-`, `PAT-`, `GUD-`).
3. Implementation phases with explicit phase goals (`GOAL-001`, `GOAL-002`, ...).
4. Task-level breakdown under each phase with numbered task identifiers (`TASK-001`, `TASK-002`, ...).
5. A concrete file list with identifier prefixes (`FILE-001`, ...).
6. Validation expectations (for example Nx targets to run).
7. Testing expectations with identifier prefixes (`TEST-001`, ...).
8. Risks and assumptions with identifier prefixes (`RISK-001`, `ASSUMPTION-001`).
9. Output contract (what to report back).
10. Explicit handoff requirement when mode is `sequence`.

Every `inputs[]` object must also include:

1. A stable, descriptive `name` in kebab-case or another CLI-friendly format.
2. A name that is unique within the plan file.

### Prompt Authoring Template for `inputs[].prompt`

Write each prompt as a structured implementation spec that mirrors `create-plan` structure. Prefer this template and fill every section.

```md
---
name: [Concise Title Describing the Package Implementation Plan's Goal]
description: [Short description of the plan's purpose]
created: [YYYY-MM-DDTHH:MM:SSZ]
updated: [YYYY-MM-DDTHH:MM:SSZ]
status: 'Completed'|'In progress'|'Planned'
---

# Introduction

![Status: <status>](https://img.shields.io/badge/status-<status>-<status_color>)

[A short concise introduction to the plan and the goal it is intended to achieve.]

## 1. Requirements & Constraints

[Explicitly list all requirements & constraints that affect the plan and constrain how it is implemented. Use bullet points or tables for clarity.]

- **REQ-001**: Requirement 1
- **SEC-001**: Security Requirement 1
- **CON-001**: Constraint 1
- **GUD-001**: Guideline 1
- **PAT-001**: Pattern to follow 1
- **[3 LETTERS]-001**: Other Requirement 1

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: [Describe the goal of this phase, e.g., "Implement feature X", "Refactor module Y", etc.]

| Task     | Description           | Completed | Date                 |
| -------- | --------------------- | --------- | -------------------- |
| TASK-001 | Description of task 1 | ✅        | 2025-07-05T08:18:38Z |
| TASK-002 | Description of task 2 |           |                      |
| TASK-003 | Description of task 3 |           |                      |

### Implementation Phase 2

- GOAL-002: [Describe the goal of this phase, e.g., "Implement feature X", "Refactor module Y", etc.]

| Task     | Description           | Completed | Date |
| -------- | --------------------- | --------- | ---- |
| TASK-004 | Description of task 4 |           |      |
| TASK-005 | Description of task 5 |           |      |
| TASK-006 | Description of task 6 |           |      |

## 3. Alternatives

[A bullet point list of any alternative approaches that were considered and why they were not chosen. This helps to provide context and rationale for the chosen approach.]

- **ALT-001**: Decision/tradeoff summary including selected option, alternatives considered, and rationale
- **ALT-002**: Decision/tradeoff summary including selected option, alternatives considered, and rationale

## 4. Dependencies

[List any dependencies that need to be addressed, such as libraries, frameworks, or other components that the plan relies on.]

- **DEP-001**: Dependency 1
- **DEP-002**: Dependency 2

## 5. Files

[List the files that will be affected by the feature or refactoring task.]

- **FILE-001**: path/to/file.ts - Description of file
- **FILE-002**: path/to/directory - Description of directory
- **FILE-003**: path/to/\*\*/many/\*\*/\*-files.{ts,js} - Description of files

## 6. Testing & Validation

[List the tests that need to be implemented to verify the feature or refactoring task.]

- **TEST-001**: Description of test 1
- **TEST-002**: Description of test 2
- **VAL-001**: Description of validation 1
- **VAL-002**: Description of validation 2

## 7. Risks & Assumptions

[List any risks or assumptions related to the implementation of the plan.]

- **RISK-001**: Risk 1
- **ASSUMPTION-001**: Assumption 1

## 8. Related Specifications / Further Reading

[Link to related spec 1]
[Link to relevant external documentation]

## 9. Output Contract

[Explain exactly what the agent should report back, including changed files, validation status, any blockers or assumptions, and any output handoff files for subsequent agents.]
```

Prompt writing rules:

- Use imperative, testable language.
- Prefer numbered steps and task tables over long paragraphs.
- Include explicit acceptance criteria.
- Keep each prompt focused on one objective with clear phase boundaries.
- Avoid ambiguous verbs like "improve" without measurable outcomes.

### Execution Readiness Notes

- The canonical output of this skill is only the timestamped file in `documentation/planning/`.
- Do not create or modify additional plan files as part of this skill.

## Phase 4 - Iteration: Update Existing Multi-Agent Plan

When asked to update a previously generated multi-agent plan:

1. Read the existing `.plan.json` file.
2. Resolve ambiguities without asking questions by selecting a sensible default based on existing plan context and repository conventions.
3. Record each meaningful ambiguity resolution as a new `ALT-` entry in the affected `inputs[].prompt` under `## 3. Alternatives`.
4. Apply targeted edits while preserving unchanged sections.
5. Keep the file valid JSON and still compatible with `scripts/orchestrate-agents.ts`.
6. Confirm what changed and why, including new `ALT-` entries.

For update operations, do not rename the file unless explicitly requested.
