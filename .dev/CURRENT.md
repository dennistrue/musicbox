# CURRENT

## Branch
`codex/debug/human-flow-e2e-bug-hunt`

## Current Focus
Builder work produced a functioning macOS desktop app foundation, packaged `.app` bundle, and a published GitHub repository. A human-flow E2E bug-hunt pass is now in place, and the immediate remaining focus is release-time key UX plus any additional runtime issues that surface from broader usage.

## Active Problems
- Live human-flow coverage now exists, but it currently represents one core journey rather than the full product surface.
- MIDI controller support is explicitly out of scope.
- Local development now has a confirmed git-ignored `.env.local` path for the OpenAI key, but user-facing key configuration is still absent.
- Manual app QA is still needed for audio feel, imported-sample playback in the packaged app, and AI prompt flow with a real key.

## Constraints
- Follow thin runtime model: root-level `agent.md` plus `.dev/` runtime artifacts only.
- Keep framework rules/process/templates/handles/reasoning central in engineering_system.
- For bug work: root-cause-with-evidence before fix; observability-first.
- Parallelize only large, independent chunks after approval.
- If infra is blocked, propose infra task and wait for approval.
- Keep the product macOS desktop-first and do not ship a browser-hosted interface.
- Use the existing local OpenAI key only through native backend handling; do not copy secrets into repo files.
- Do not use a synthesized in-house kit as the bundled electronic factory option.

## Open Questions
- Should the next builder slice expand E2E coverage further or prioritize end-user OpenAI key settings UI?
- Should the app surface explicit user key configuration for release builds, or is local `.env.local`/environment injection acceptable?
- Are additional manual QA findings expected before this task is split into follow-up work?

## Active Tasks
- `./.dev/tasks/active/2026-03-11-desktop-drum-sequencer-v1.md`
