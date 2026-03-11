# SYSTEM_REFERENCE

This repository uses a thin local runtime under \.dev/.
The canonical framework source of truth lives in the central repository below.

## Central Framework Root

`/Users/dennistrue/engineering_system`

## Canonical Paths

- Rules: `/Users/dennistrue/engineering_system/management/AI_RULES.md`
- Process: `/Users/dennistrue/engineering_system/management/PROCESS.md`
- Templates: `/Users/dennistrue/engineering_system/templates/`
- Handles: `/Users/dennistrue/engineering_system/handles/`
- External reasoning docs/tooling: `/Users/dennistrue/engineering_system/reasoning/`
- Bootstrap script: `/Users/dennistrue/engineering_system/bootstrap.sh`

## Thin Runtime Policy

- Keep this product repository lightweight: maintain only the root-level `agent.md` entrypoint plus `.dev/` runtime artifacts by default.
- Do not copy central framework trees (`management/`, `templates/`, `handles/`, `reasoning/`) into product repositories.
- Do not install a repo-local reasoning virtual environment by default for bootstrap.

## Workflow Gate

Required flow:
- Bootstrap: `bootstrap -> stop`
- Non-trivial work: `thinker/task generation -> stop -> explicit human approval in a subsequent turn -> product work`
