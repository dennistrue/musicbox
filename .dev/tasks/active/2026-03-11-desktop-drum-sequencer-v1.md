# Task: Build desktop drum sequencer v1

## TL;DR
Build `musicbox` as a packaged desktop drum sequencer application with a polished multi-lane step sequencer, song-block arranger, sample-kit management, MIDI mode, and AI-assisted beat generation. Recommended stack is `Tauri 2 + React/TypeScript UI + Rust backend` so the app ships as a desktop binary while keeping audio, filesystem, MIDI, and API-key handling in native code.

## Task Definition
Implement `musicbox` in two phases, with Phase 1 as the first builder target.

Phase 1: desktop sequencer MVP
- packaged desktop application, not browser-hosted
- visually strong drum-machine UI with one clearly labeled/color-coded lane per drum
- bundled factory kits: at least one acoustic kit and one electronic kit with redistribution-safe licensing
- custom sample import and custom-kit assembly
- per-lane sequencer editing with velocity, swing/groove, fills, transitions, and pattern variations
- arranger/song view for chaining beat blocks and fills into sections
- MIDI mode that maps external pads/notes to sequencer lanes and the internal beat model
- prompt-driven AI beat generation that returns editable pattern/song-block data, not just a raw MIDI file

Phase 2: prompt-driven sample and kit acquisition
- prompt to discover, curate, or synthesize new kits/samples
- attribution/license ledger for downloaded or bundled sample assets
- optional AI-assisted kit generation workflow

Non-goals for Phase 1:
- web deployment
- DAW plugin formats
- full online sample marketplace or automated scraping
- realtime collaborative editing

## Files Likely Affected
- `package.json`
- `vite.config.ts`
- `src/main.tsx`
- `src/app/App.tsx`
- `src/app/styles.css`
- `src/features/sequencer/*`
- `src/features/arranger/*`
- `src/features/kits/*`
- `src/features/midi/*`
- `src/features/ai/*`
- `src-tauri/Cargo.toml`
- `src-tauri/src/main.rs`
- `src-tauri/src/audio/*`
- `src-tauri/src/midi/*`
- `src-tauri/src/openai/*`
- `src-tauri/src/storage/*`
- `src-tauri/tauri.conf.json`
- `assets/kits/*`
- `README.md`

## Context
User requirements:
- must be an application, not a web interface
- must look great
- needs acoustic and electronic kits
- needs one sequencer lane per drum with strong visual identity
- needs MIDI mode mapped to the sequencer
- needs ChatGPT-backed prompt generation for beats, feel, groove, velocity, transitions, and song blocks
- needs an arranger view for juggling blocks, beats, and fills
- needs support for user-loaded samples and future prompt-driven sample/kit discovery or creation

Current repo state:
- repository is bootstrapped but otherwise empty
- there is no existing app framework or source tree, so architecture choice is part of this task definition

Working assumptions:
- Phase 1 targets macOS only
- use the existing OpenAI API key available in the local `engineering_system` area for development, but do not copy or commit it into this repository
- keep secret handling in the native backend; never expose the API key in shipped frontend code
- use redistribution-safe free sample sources for factory kits, with user-imported kits as an equal first-class path

Free sample-source candidates for Phase 1 factory kits:
- acoustic: Karoryfer free sample libraries such as `Big Rusty Drums` and `Swirly Drums`, which the publisher currently marks as `CC0`
- electronic: use a third-party redistribution-safe CC0/public-domain factory kit assembled from verified sources; synthesized in-house fallback is not acceptable

## Constraints
- Stop after thinker/task generation in this turn; no builder work yet.
- Keep the app macOS desktop-first and local-first.
- Sequencer timing must stay deterministic enough for drum-machine use even when the UI is busy.
- AI output must map into a structured internal model for patterns, fills, transitions, and song blocks.
- Bundled samples must have redistribution-compatible licenses; if not, do not ship them.
- Secret handling must stay in the native backend.
- Prefer reversible scaffolding choices and a thin first slice over trying to finish the whole product in one pass.
- Do not replace the electronic factory kit with synthesized fallback content.

## Root Cause Evidence (Required for Bug Fixes)
- Evidence observed: not applicable; this is product creation work.
- Hypothesis: none.
- Why this is likely the root cause: none.

## Observability Plan
- Add a sequencer debug overlay or event log for clock ticks, pattern triggers, MIDI input events, and AI-generated pattern imports.
- Add backend logging around sample loading, kit validation, MIDI mapping, and OpenAI request/response schema validation.
- Keep the beat/song model serializable so AI outputs and arranger edits can be diffed and replayed.

## Acceptance Criteria
- [x] `musicbox` launches as a packaged desktop app on macOS without a browser dependency.
- [x] The main sequencer view shows one clearly labeled lane per drum with distinct color/icon treatment.
- [x] Users can edit step patterns, velocity, swing/groove, fills, and transitions.
- [x] An arranger view lets users combine beat blocks and fills into a song timeline.
- [x] The app ships with at least one acoustic factory kit and one electronic factory kit with acceptable redistribution terms.
- [x] Users can import their own samples and save custom kits locally.
- [ ] MIDI mode maps external notes/pads to sequencer lanes and the editable beat model.
- [x] AI prompting can generate or revise beats and arrangement blocks with groove, feel, and velocity detail, and the results remain editable in the UI.
- [x] Phase 1 ships without embedding secrets in frontend code.

## Validation/Test Plan
- Tests:
  - `L1`: beat-model serialization, step editing reducers, groove/velocity transforms, AI schema parsing, sample-kit validation
  - `L2`: desktop integration tests for kit loading, MIDI mapping, sequencer playback control, arranger persistence, backend/frontend command paths
  - `L3`: manual end-to-end checks for audio playback timing, MIDI input usability, AI prompt-to-pattern workflow, and arrangement playback
- Runtime checks:
  - verify kit metadata and sample paths load correctly
  - verify AI responses round-trip into internal pattern and arranger data
  - verify imported samples and MIDI hits land on the intended drum lane
  - verify song blocks, fills, and transitions remain editable after AI generation

## Implementation Status
Completed in this builder pass:
- Created a `Tauri 2 + React/TypeScript + Rust` desktop app foundation with a packaged macOS debug bundle.
- Built a polished sequencer UI with one color-coded lane per drum, transport controls, pattern duplication, and a song-block arranger.
- Added Web Audio playback scheduling for bundled factory kits and imported user samples.
- Bundled acoustic and electronic factory kits using a curated subset of the `Sample Pi` public-domain sample pack, with local attribution notes.
- Added custom sample import, native sample-file persistence, and local session persistence for kits/patterns/arrangement state.
- Added native backend diagnostics, MIDI-device discovery, and backend-only AI beat generation with frontend fallback.
- Added reducer tests and validated frontend build, Rust compile, and Tauri bundle generation.

Remaining gaps:
- Live MIDI note capture/recording is not yet wired from native inputs into sequencer edits or real-time lane triggering.
- Local development key loading is now wired through a git-ignored repo-root `.env.local`, but end-user key configuration UI is still not implemented.

## Branch Recommendation
`feature/desktop-drum-sequencer-v1`

## Missing Info
- Decide whether the next slice should prioritize live MIDI note capture/recording or end-user OpenAI key configuration UI.
- Decide whether end-user key configuration should be file-based, environment-based, or stored via a native settings flow.

## Approval Gate
- [x] Thinker output completed and presented
- [x] Explicit human approval received in a subsequent turn
- [x] Builder started

## Definition of Done
- [ ] Phase 1 implementation complete
- [x] Validation evidence captured
- [x] Review passed
- [x] Process report generated
- [x] LOG updated
- [ ] Follow-up Phase 2 task proposed separately if still desired

## Notes / Hypotheses
- `Tauri 2 + Rust backend` is the most pragmatic fit for a desktop-first app with secure API access, filesystem control, and MIDI/audio integration while still allowing a high-design interface.
- The product is large enough that Phase 1 should focus on core sequencing, arranger, kits, MIDI mapping, and AI beat generation before sample-search/generation automation.
- The internal source of truth should be a structured beat/song model, with MIDI import/export as a view of that model rather than the primary representation.
- The two highest delivery risks are desktop audio/MIDI reliability and sourcing a legally safe bundled electronic factory kit that still sounds good.

## Test Level Expectation
`L1 + L2 + L3` with rationale: this is a multi-surface desktop audio app with UI, native backend, sample assets, MIDI I/O, and AI integration.
