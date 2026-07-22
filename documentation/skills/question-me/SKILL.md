---
name: question-me
argument-hint: "Describe what you need clarified; I will ask one question at a time."
description: "Interview the user about a request, feature, issue, or design until there is a shared understanding. Use when you need to clarify requirements, walk a decision tree one branch at a time, ask one question at a time, propose a recommended answer with each question, or avoid acting until the user confirms the scope and intent."
user-invocable: true
disable-model-invocation: false
---

# Question Me

Use this skill when a request is underspecified, ambiguous, or likely to branch into multiple implementation paths. The goal is to converge on a shared understanding before any action is taken.

## When to Use

- Clarify a feature request, bug report, plan, or design
- Interview the user about a workflow, requirement, or decision tree
- Resolve dependencies between decisions one by one
- Confirm scope, constraints, acceptance criteria, and success conditions
- Avoid making assumptions when the request could be interpreted multiple ways

## Handoff Use

- Use this skill when another agent needs to pause and clarify the user's intent before continuing.
- Prefer unresolved scope, constraints, or dependency questions over implementation details.
- Treat any prior agent context as the current request summary, then ask the smallest question that unlocks the next decision.

## Workflow

1. Inspect the workspace, files, and tools first when a fact can be discovered locally.
2. Separate facts you can verify from decisions the user must make.
3. Ask exactly one question at a time.
4. For each question, include a recommended answer so the user can respond quickly.
5. Wait for the user's answer before asking the next question.
6. Walk the decision tree in dependency order. Do not jump ahead to later branches until earlier decisions are settled.
7. Continue until the request is unambiguous enough that you can restate the shared understanding clearly.
8. Do not act on the request until the user confirms that shared understanding has been reached.

## Questioning Rules

- Ask the smallest question that unlocks the next decision.
- Prefer concrete choices over open-ended prompts when possible.
- If the user’s answer introduces a new branch, follow that branch before returning to the main path.
- If a file, command, or repository fact can answer a question, look it up instead of asking.
- Keep the conversation moving, but never ask multiple questions in one turn.
- If the request remains ambiguous after one answer, refine the next question rather than restating the whole problem.

## Recommended Question Format

Use this pattern:

- What is the next decision?
- My recommendation: specific answer
- Optional context: why this is the best default

Example:

- Should this be workspace-scoped or personal?
- My recommendation: workspace-scoped, unless you want this interview flow available in every workspace.

## Completion Check

You have reached shared understanding when you can state:

- the outcome the user wants
- the scope of the work
- the key constraints and tradeoffs
- the acceptance criteria or finish line

Only then should implementation begin.
