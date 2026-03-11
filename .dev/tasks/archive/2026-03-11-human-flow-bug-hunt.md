# Task: Human-flow E2E bug hunt for desktop sequencer

## TL;DR
Current checks prove the code builds, packages, and passes reducer tests, but they do not exercise the app like a human. Add a human-flow end-to-end test harness, reproduce the reported runtime issues through those tests, and fix the failures that surface.

## Task Definition
Implement a user-like test slice for `musicbox` and use it as the driver for bug fixing.

Scope:
- add end-to-end coverage that behaves like a person using the sequencer UI
- cover the highest-risk flows: launch, transport, step editing, pattern duplication, arranger editing, kit switching, sample import, local persistence, and AI prompt flow
- use failing human-flow tests to identify concrete runtime defects
- fix the defects discovered by those tests

Non-goals:
- do not add controller or pad-input support; the user explicitly said they will not use a controller
- do not build a generic cross-platform desktop automation framework
- do not redesign product scope beyond bugs exposed by the human-flow test pass

## Files Likely Affected
- `package.json`
- `playwright.config.ts`
- `tests/e2e/*`
- `src/app/App.tsx`
- `src/app/styles.css`
- `src/features/audio/useTransport.ts`
- `src/features/sequencer/*`
- `src/platform/bridge.ts`
- `src-tauri/src/lib.rs`
- `README.md`

## Context
Observed evidence:
- `npm test` passes, but it only covers reducer-level logic
- `npm run build` passes
- `cargo check --manifest-path /Users/dennistrue/musicbox/src-tauri/Cargo.toml` passes
- `npm exec tauri build -- --debug` passes
- there is no existing E2E coverage that clicks through the rendered application
- the user reports "there's a lot of errors" during actual usage

Relevant platform/testing constraint:
- official Tauri WebDriver support does not cover macOS desktop automation because macOS lacks a WKWebView driver tool

Inference from the above:
- the closest practical automated "human-like" test on this machine is a Playwright-driven rendered-UI test against the app’s preview/runtime surface, paired with the existing native build checks
- native macOS-specific issues that only appear in the packaged app may still require manual L3 verification after automated fixes

## Constraints
- Follow bug policy: establish root cause with evidence before fixing each issue.
- Keep the test user-facing: prefer interactions and assertions a human would recognize.
- Do not introduce controller-specific work in this slice.
- Preserve desktop-app architecture; do not reframe this as a web product.
- Keep changes small and reversible.

## Root Cause Evidence (Required for Bug Fixes)
- Evidence observed:
  - all current automated checks are green
  - no human-flow E2E coverage exists
  - user reports runtime errors during real usage
  - official Tauri desktop WebDriver automation is unsupported on macOS
- Hypothesis:
  - the current test pyramid misses UI/runtime failures because it stops at unit/build/package checks and never drives the actual interaction flows
- Why this is likely the root cause:
  - if the failing behaviors are only visible during interactive use, reducer-only tests will not catch them

## Observability Plan
- Add human-flow E2E traces/screenshots on failure.
- Add targeted runtime logging only where tests expose ambiguity, especially around transport state, sample import, persistence, and AI response handling.
- Keep each discovered bug tied to a reproducible test case before patching.

## Acceptance Criteria
- [x] A human-flow E2E harness is added and runnable locally.
- [x] The harness covers launch, editing steps, switching kits, arranging blocks, importing a sample, and prompting AI.
- [x] At least one real user-visible failure is reproduced by an automated human-flow test.
- [x] Discovered failures are fixed with regression coverage.
- [x] Existing build/package checks still pass after the fixes.

## Validation/Test Plan
- Tests:
  - `L1`: keep existing reducer/model tests
  - `L2`: add Playwright E2E tests that drive the rendered app like a user
  - `L3`: rerun packaged-app smoke/build checks after bug fixes
- Runtime checks:
  - confirm transport toggles and visible step edits behave correctly
  - confirm pattern duplication and arranger edits persist correctly
  - confirm sample import updates the visible lane state and survives reload
  - confirm AI prompt flow returns usable, editable results without crashing

## Branch Recommendation
`codex/debug/human-flow-e2e-bug-hunt`

## Missing Info
- If there are specific runtime errors you already saw, they would accelerate reproduction, but the test pass can proceed without them.

## Approval Gate
- [x] Thinker output completed and presented
- [x] Explicit human approval received in a subsequent turn
- [x] Builder started

## Definition of Done
- [x] Human-flow test harness added
- [x] Runtime defects found and fixed
- [x] Validation evidence captured
- [x] Review passed
- [x] Process report generated
- [x] LOG updated

## Notes / Hypotheses
- On macOS, automated testing of the packaged Tauri app itself is not the best first step because official Tauri WebDriver desktop support excludes macOS.
- The most effective first pass is likely Playwright against the rendered UI plus native build/package smoke checks afterward.
- The first reproduced real bug was sample-import persistence in browser-preview mode: imported samples were stored as temporary blob URLs, which broke after reload.

## Test Level Expectation
`L1 + L2 + L3` with rationale: this bug hunt needs user-like UI automation plus post-fix package smoke validation.
