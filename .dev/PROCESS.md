# AI Engineering Process

This file describes operational execution, stage by stage.

These stages apply to normal work after bootstrap. For non-trivial work, the run must stop after thinker/task generation and wait for explicit human approval in a subsequent turn before builder starts.

## Stage -1: Bootstrap (Thin Runtime Only)

Actions:
- initialize the root `agent.md` entrypoint plus thin `.dev/` runtime
- generate `agent.md`, `.dev/AI_RULES.md`, `.dev/PROCESS.md`, `.dev/CURRENT.md`, `.dev/LOG.md`, `.dev/SYSTEM_REFERENCE.md`
- create bootstrap task, complete it, and archive it
- create or identify next separate active task
- add `agent.md` and `.dev/` to git tracking automatically so runtime state is visible and reviewable

Hard constraints:
- do not copy full framework trees into product repos
- do not start product implementation in bootstrap run

Output:
- repo ready for thinker/task generation and approval gate

## Stage 0: Intake (Loose Prompt or Explicit Task)

Actions:
- record prompt in task draft
- gather immediate context (branch, repo status, `.dev` artifacts)
- report the immediate context to the operator before deeper exploration
- classify prompt type (bug/feature/refactor/infra)
- classify work as trivial or non-trivial; when unsure, treat it as non-trivial

Output:
- thinker-ready context package and work classification

## Stage 1: Thinker

Actions:
- convert prompt into structured task
- produce approval-ready thinker output with these sections: `TL;DR`, `Task Definition`, `Files Likely Affected`, `Validation/Test Plan`, `Branch Recommendation`, `Missing Info`
- define goal, context, constraints
- set acceptance criteria, validation plan, definition of done
- choose reasoning level and test-level expectations
- identify missing information, required observations, and physical-world actions
- evaluate complexity and propose decomposition/subtasks
- propose branch strategy
- decide whether external reasoning escalation is required
- stop after thinker output for non-trivial work; do not begin builder activity in the same turn

Bug-fix policy:
- establish root-cause hypothesis with evidence before fix
- prefer observability-first instrumentation before large changes

Output:
- task proposal artifact ready for approval and builder remains blocked pending a subsequent-turn approval

## Stage 2: Task Generation

Actions:
- generate concrete task using central template referenced from `.dev/SYSTEM_REFERENCE.md`
- optionally generate subtasks for large independent chunks
- map work to branch recommendation and test expectations
- mirror the required thinker-output sections in the task artifact
- stop after task generation for non-trivial work

Output:
- explicit task artifact(s) ready for approval and no builder work yet

## Stage 3: Human Approval (Required Gate for Non-Trivial Work)

Actions:
- present scope, assumptions, branch suggestion, and validation approach
- request explicit approval before meaningful product changes
- approval must arrive in a subsequent turn after thinker/task output is presented
- the initial user prompt does not count as implementation approval
- if approval is missing or ambiguous, remain blocked

If approved:
- record approval in the task artifact and proceed to builder in the following turn

If not approved:
- revise task and repeat approval gate

## Stage 4: Builder

Actions:
- confirm explicit subsequent-turn approval exists before making changes
- report intended edits before changing files
- implement approved plan only
- keep changes small and reversible
- add instrumentation before speculative major changes
- if execution or builds generate additional files or dirty nested repos, report them explicitly and classify them as intentional, generated, or pre-existing

Builder-triggered replan:
- if new evidence invalidates assumptions, stop and request replanning
- thinker updates task and constraints before builder resumes

Output:
- implementation changes and updated task state

## Stage 5: Test

Actions:
- run required test levels (`L1`, `L2`, `L3` as applicable)
- add/extend tests when coverage is missing
- add regression coverage for fixed bugs
- report test/build progress during long-running validation and summarize non-blocking warnings separately from true failures

Output:
- test evidence (pass/fail and scope)

## Stage 6: Review

Actions:
- assess correctness, side effects, edge cases, and acceptance criteria
- verify claimed root cause is evidence-backed
- confirm test adequacy for risk profile

Output:
- review artifact

## Stage 7: Version

Actions:
- evaluate readiness for integration based on rules compliance, task state, review, and tests
- recommend merge target (`main` or designated integration branch)

Output:
- version/integration decision

## Stage 8: Evaluator

Actions:
- evaluate full run quality after version decision
- determine done/not done
- propose follow-up tasks when needed
- request human approval before creating follow-up tasks
- update `CURRENT.md` if branch focus changed
- archive completed tasks

Output:
- final evaluation status and next-step recommendation

## Stage 9: Process Report

Actions:
- generate report using central process-report template reference
- include steps, reasoning level, duration, branch, external reasoning usage/cost, decisions, outcome, next step
- include remaining worktree dirt and who/what caused it when known

Output:
- process report artifact

## Stage 10: Log Update

Actions:
- append log entry to `.dev/LOG.md`
- capture actual findings and outcomes only
- include external reasoning usage and USD cost

Output:
- durable append-only run memory

## Artifact Interaction Model

- `.dev/CURRENT.md`: branch-aware present state and active focus
- `.dev/tasks/active/`: in-progress tasks and subtasks
- `.dev/tasks/archive/`: completed task history
- `.dev/LOG.md`: append-only operational memory
- `.dev/SYSTEM_REFERENCE.md`: canonical pointer to central framework/docs/tooling
- `.dev/` should be git-tracked after bootstrap unless the operator explicitly wants local-only runtime state

## Parallel Work Handling

Rules:
- parallelize only large, independent chunks
- define explicit branch and dependency boundaries
- wait for explicit human approval in a subsequent turn before parallel execution

## Infrastructure Blockers

When environment/infrastructure blocks progress:
- stop repeated failing execution attempts
- document blocker evidence and failed attempts
- propose an `infra/*` task for approval
- create/run that task only after approval in a subsequent turn
