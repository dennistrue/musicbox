# AI Engineering Rules

This file defines mandatory operating rules for AI-assisted engineering execution.

## 1. Workflow

Required default workflow:

`USER PROMPT -> THINKER -> TASK GENERATION -> STOP -> HUMAN APPROVAL (SUBSEQUENT TURN) -> BUILDER -> TEST -> REVIEW -> VERSION -> EVALUATOR -> PROCESS REPORT -> LOG UPDATE`

Rules:
- No meaningful implementation work starts before human approval of the generated task.
- This approval gate applies to normal work, not just bootstrap.
- Treat any task that changes behavior, spans multiple steps/files, needs investigation, needs a branch recommendation, or needs a non-obvious validation plan as non-trivial.
- When unsure, classify the task as non-trivial.
- For non-trivial tasks, thinker/task generation is a hard stop. End the turn after presenting the thinker output and task artifact.
- The initial user request does not count as implementation approval for a non-trivial task.
- Builder may start only after an explicit human approval message arrives in a subsequent turn.
- Same-turn approval is invalid for non-trivial work.
- If approval is missing or ambiguous, remain blocked and request approval.
- Every meaningful run ends with a process report and append-only log update.

## 2. Bootstrap Model Rules

Central source of truth remains in `engineering_system`.

Thin local runtime in product repos is limited to:
- `agent.md`
- `.dev/AI_RULES.md`
- `.dev/PROCESS.md`
- `.dev/CURRENT.md`
- `.dev/LOG.md`
- `.dev/SYSTEM_REFERENCE.md`
- `.dev/tasks/active/`
- `.dev/tasks/archive/`

Bootstrap must not copy full framework trees into product repos by default:
- no `management/`
- no `templates/`
- no `handles/`
- no `reasoning/`
- no bootstrap-created local reasoning `.venv/`

Required bootstrap flow:
- `bootstrap -> stop -> thinker/task generation -> stop -> explicit human approval in a subsequent turn -> product work`

## 3. Role Responsibilities

### Thinker

Responsibilities:
- define a concrete task from loose prompts
- produce an approval-ready thinker output with sections: `TL;DR`, `Task Definition`, `Files Likely Affected`, `Validation/Test Plan`, `Branch Recommendation`, `Missing Info`
- define goal, context, constraints, acceptance criteria, validation, and definition of done
- assess complexity and decide whether subtask decomposition is needed
- decide whether parallelization is appropriate
- propose branches when needed
- select reasoning level (`medium`, `high`, `xhigh`)
- decide whether external reasoning escalation is needed
- when external reasoning is used, report dollar cost (`estimated_cost_usd`)
- identify missing information
- identify required physical-world actions

Quality expectations:
- for bug fixing, establish root cause with evidence before proposing a fix
- prefer observability/instrumentation before speculative major changes

### Builder

Responsibilities:
- verify explicit human approval arrived in a subsequent turn before implementation starts
- implement approved plan only
- make small, reversible changes
- add instrumentation when uncertainty is high
- run relevant tests
- request replanning when new evidence invalidates plan assumptions

### Test

Responsibilities:
- choose and run test levels according to policy
- create/extend tests when gaps block confidence
- ensure bug fixes gain regression protection

### Reviewer

Responsibilities:
- review correctness, logic, tests, side effects, and missing cases
- verify acceptance criteria were actually validated
- validate adequacy of test level selection
- require additional tests where needed
- confirm claimed root cause is evidence-backed

### Evaluator

Responsibilities:
- evaluate end-to-end result after version decision
- decide whether task is actually done
- propose follow-up tasks when needed
- ask for human approval before creating follow-up tasks
- update `CURRENT.md` when branch focus changes

## 4. Effort Policy

Default reasoning policy:
- `medium`: normal coding, refactors, docs, small fixes
- `high`: debugging, multi-file reasoning, tricky state flow
- `xhigh`: architecture decisions, major tradeoffs, subsystem redesign, unclear cross-system problems

Adjustment rules:
- thinker may escalate or downgrade reasoning level
- builder may request replanning or stronger reasoning if blocked
- trivial exceptions are limited to tiny, obvious, low-risk actions that do not need a separate branch, investigation, or non-obvious validation plan

## 5. Git Rules

General:
- sync with upstream before meaningful work when an origin exists
- do not work directly on `master`/`main`
- create a branch for non-trivial work
- thinker suggests branch name; wait for explicit human approval in a subsequent turn before branching for non-trivial work

Branch naming:
- `debug/*`
- `feature/*`
- `refactor/*`
- `test/*`
- `experiment/*`
- `infra/*`

## 6. Testing Policy

Layered test levels:
- Level 1 (`L1`): logic/unit
- Level 2 (`L2`): subsystem/integration
- Level 3 (`L3`): system/hardware

Required behaviors:
- builder runs relevant tests
- reviewer validates test adequacy
- every bug fix gains regression protection
- behavior changes require test updates
- if suitable tests do not exist, create a minimal practical harness
- root cause with evidence before bug fix implementation
- observability-first before speculative rewrites

## 7. Task Lifecycle

Rules:
- active tasks live in `.dev/tasks/active/`
- completed tasks move to `.dev/tasks/archive/`
- bootstrap task must be completed and archived when bootstrap finishes
- next real task must be created separately from bootstrap task
- non-trivial tasks remain in thinker/task state until explicit human approval is received in a subsequent turn
- newly discovered work must be proposed for approval before task creation

## 8. CURRENT Rules

Rules:
- `CURRENT.md` is branch-aware now-state
- it captures branch focus, active problems, constraints, open questions, and active tasks
- thinker/evaluator updates it when focus changes

## 9. LOG Rules

Rules:
- `LOG.md` is append-only memory
- each meaningful run adds an entry
- entries record reality, not intent
- include problem, findings, decisions, validation, result, next step, and process summary

## 10. Reporting and Operator Visibility

Rules:
- Before substantial exploration or execution, send a brief progress update describing the current step and intended outcome.
- Before editing files, state what will be changed and why.
- During long-running work, provide progress updates at stage transitions and at least every ~30 seconds while execution is ongoing.
- Report repository state anomalies explicitly when discovered: untracked files, ignored-but-required files, generated artifacts, dirty submodules, or build-created changes.
- For each non-trivial run, distinguish clearly between:
  - intentional source changes
  - generated/tooling changes
  - pre-existing unrelated dirt
- If the agent caused a generated or incidental change, say so directly instead of describing it as generic unrelated dirt.
- Final reporting must include validation status, remaining manual checks, and any worktree dirt left behind.

## 11. Process Report Requirement

After each task run, generate a process report capturing:
- steps executed
- approval-gate status and approval evidence
- reasoning level used
- duration (or approximate)
- branch
- whether external reasoning was used (`yes`/`no`)
- external reasoning dollar cost in USD (`estimated_cost_usd`, `0.0` when not used)
- key decisions
- outcome
- next step

## 12. Failure Recovery and Infrastructure Problems

Rules:
- if execution fails repeatedly, stop and document failure context
- if infrastructure/environment blocks progress, propose an `infra/*` task for approval
- create the infra task only after explicit human approval in a subsequent turn

## 13. Parallelization Rules

Rules:
- parallelize only large, clearly independent chunks
- do not parallelize many tiny tasks
- thinker proposes parallelization and branch strategy, then waits for explicit human approval in a subsequent turn
- after approval, run parallel streams in separate branches/tasks

## 14. External Reasoning Escalation

Rules:
- external reasoning capability remains centralized in `engineering_system`
- product repos reference canonical reasoning locations via `.dev/SYSTEM_REFERENCE.md`
- use stronger external reasoning when local reasoning is insufficient
- capture usage and USD cost from central reasoning tool output in process report/log
