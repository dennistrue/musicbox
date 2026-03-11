# Musicbox

`musicbox` is a macOS-first desktop drum sequencer built with `Tauri 2 + React + TypeScript + Rust`.

Current scope in this branch:
- polished multi-lane drum sequencer
- arranger/song-block surface for beats and fills
- acoustic and electronic factory kits sourced from `Sample Pi` public-domain material
- lane-by-lane custom sample import
- MIDI mapping surface
- AI prompt-to-beat generation wired through the native backend

## Source Layout

- `src/`: React UI, sequencer model, arranger, kit management, AI bridge, audio transport
- `src-tauri/`: native shell, file persistence, MIDI diagnostics, OpenAI integration
- `.dev/`: engineering runtime and task state

## Development

Install frontend dependencies:

```bash
npm install
```

Run the frontend preview:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Run the human-flow E2E test:

```bash
npm run test:e2e
```

Run the desktop app once the Rust toolchain is available:

```bash
npm exec tauri dev
```

## OpenAI Key

The native backend checks these locations in order:

1. `OPENAI_API_KEY` in the environment
2. `.env.local` in the repo root
3. `.env` in the repo root
4. candidate files under `/Users/dennistrue/engineering_system/`

Keep keys local-only. `.env.local` and `.env` are ignored by git.

## Notes

- This repo expects a local Rust toolchain because the desktop shell and backend commands are built with Tauri/Rust.
- The native backend looks for `OPENAI_API_KEY` in the environment first, then local repo env files, then common config files inside `/Users/dennistrue/engineering_system/`.
- The bundled factory-kit audio in this repo is sourced from the `Sample Pi` pack, whose README states the included samples are public-domain / CC0.
