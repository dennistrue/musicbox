import {
  startTransition,
  useDeferredValue,
  useEffect,
  useReducer,
  useState,
  type CSSProperties,
} from "react";
import { useTransport } from "../features/audio/useTransport";
import { generateBeatIdea, getBackendDiagnostics, persistImportedSample } from "../platform/bridge";
import type { BackendDiagnostics } from "../platform/bridge";
import {
  buildPlaybackSequence,
  createInitialState,
  DRUM_DEFINITIONS,
  findPattern,
  type DrumId,
  type GeneratedBeatIdea,
} from "../features/sequencer/model";
import { reducer } from "../features/sequencer/state";

const storageKey = "musicbox.session.v1";

function formatSwing(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function loadInitialSequencerState() {
  const baseState = createInitialState();

  if (typeof window === "undefined") {
    return baseState;
  }

  const rawValue = window.localStorage.getItem(storageKey);
  if (!rawValue) {
    return baseState;
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (
      !parsed ||
      !Array.isArray(parsed.patterns) ||
      !Array.isArray(parsed.kits) ||
      !Array.isArray(parsed.arrangerBlocks)
    ) {
      return baseState;
    }

    return {
      ...baseState,
      ...parsed,
    };
  } catch {
    return baseState;
  }
}

export function App() {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialSequencerState);
  const [isPlaying, setIsPlaying] = useState(false);
  const [prompt, setPrompt] = useState(
    "Give me a dusty boom bap beat with human swing, stronger ghost kicks, a tasteful fill, and arrangement blocks for intro, verse, and turnaround.",
  );
  const deferredPrompt = useDeferredValue(prompt);
  const [ideaStatus, setIdeaStatus] = useState<"idle" | "loading" | "error">("idle");
  const [ideaError, setIdeaError] = useState<string | null>(null);
  const [previewIdea, setPreviewIdea] = useState<GeneratedBeatIdea | null>(null);
  const [backend, setBackend] = useState<BackendDiagnostics | null>(null);

  const activePattern = findPattern(state.patterns, state.activePatternId) ?? state.patterns[0];
  const activeKit = state.kits.find((kit) => kit.id === state.activeKitId) ?? state.kits[0];

  const playbackSequence = buildPlaybackSequence(
    state.patterns,
    state.arrangerBlocks,
    state.activePatternId,
    state.transportMode,
  );

  const transport = useTransport({
    tempo: state.tempo,
    swing: state.swing,
    kit: activeKit,
    sequence: playbackSequence,
    isPlaying,
  });

  useEffect(() => {
    void getBackendDiagnostics().then(setBackend);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  async function handleGenerateIdea() {
    setIdeaStatus("loading");
    setIdeaError(null);

    try {
      const nextIdea = await generateBeatIdea(deferredPrompt, {
        tempo: state.tempo,
        swing: state.swing,
        activePatternName: activePattern?.name ?? "Untitled",
      });
      setPreviewIdea(nextIdea);
      setIdeaStatus("idle");
    } catch (error) {
      setIdeaStatus("error");
      setIdeaError(error instanceof Error ? error.message : "Failed to generate beat idea.");
    }
  }

  function applyIdea() {
    if (!previewIdea) {
      return;
    }

    startTransition(() => {
      dispatch({
        type: "apply-generated-idea",
        idea: previewIdea,
      });
    });
  }

  async function importSample(drumId: DrumId, file: File | null) {
    if (!file) {
      return;
    }

    const persisted = await persistImportedSample(drumId, file);
    const previewUrl = persisted?.path ?? URL.createObjectURL(file);

    dispatch({
      type: "import-sample",
      drumId,
      fileName: file.name,
      previewUrl,
    });
  }

  return (
    <div className="app-shell">
      <div className="backdrop-grid" />
      <header className="hero">
        <div>
          <p className="eyebrow">Musicbox / macOS sequencer</p>
          <h1>Build beats, blocks, fills, and song motion in one surface.</h1>
          <p className="lede">
            Native-first drum workstation for acoustic kits, electronic kits, MIDI routing,
            and prompt-driven groove design.
          </p>
        </div>
        <div className="hero-metrics">
          <div className="metric">
            <span>Transport</span>
            <strong>{transport.currentLabel}</strong>
          </div>
          <div className="metric">
            <span>Loaded Samples</span>
            <strong>
              {transport.readySamples}/{transport.totalSamples}
            </strong>
          </div>
          <div className="metric">
            <span>Runtime</span>
            <strong>{backend?.nativeRuntime ? "Tauri" : "Preview"}</strong>
          </div>
        </div>
      </header>

      <main className="workspace">
        <section className="main-column">
          <section className="panel transport-panel">
            <div className="transport-controls">
              <button
                className={`transport-button ${isPlaying ? "playing" : ""}`}
                onClick={() => setIsPlaying((current) => !current)}
                type="button"
              >
                {isPlaying ? "Stop" : "Play"}
              </button>
              <div className="transport-chip-group">
                <button
                  className={state.transportMode === "pattern" ? "chip active" : "chip"}
                  onClick={() => dispatch({ type: "set-transport-mode", mode: "pattern" })}
                  type="button"
                >
                  Pattern Loop
                </button>
                <button
                  className={state.transportMode === "song" ? "chip active" : "chip"}
                  onClick={() => dispatch({ type: "set-transport-mode", mode: "song" })}
                  type="button"
                >
                  Song Blocks
                </button>
              </div>
            </div>

            <div className="sliders">
              <label>
                Tempo
                <div className="slider-row">
                  <input
                    max={170}
                    min={72}
                    onChange={(event) =>
                      dispatch({ type: "set-tempo", tempo: Number(event.target.value) })
                    }
                    type="range"
                    value={state.tempo}
                  />
                  <strong>{state.tempo} BPM</strong>
                </div>
              </label>

              <label>
                Swing
                <div className="slider-row">
                  <input
                    max={0.24}
                    min={0}
                    onChange={(event) =>
                      dispatch({
                        type: "set-swing",
                        swing: Number(event.target.value),
                      })
                    }
                    step={0.01}
                    type="range"
                    value={state.swing}
                  />
                  <strong>{formatSwing(state.swing)}</strong>
                </div>
              </label>
            </div>
          </section>

          <section className="panel pattern-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Patterns</p>
                <h2>{activePattern?.name ?? "Pattern"}</h2>
              </div>
              <button
                className="ghost-button"
                onClick={() =>
                  dispatch({ type: "duplicate-pattern", patternId: state.activePatternId })
                }
                type="button"
              >
                Duplicate Variation
              </button>
            </div>
            <div className="pattern-chip-row">
              {state.patterns.map((pattern) => (
                <button
                  className={
                    pattern.id === state.activePatternId ? "pattern-chip active" : "pattern-chip"
                  }
                  key={pattern.id}
                  onClick={() => dispatch({ type: "select-pattern", patternId: pattern.id })}
                  type="button"
                >
                  <span>{pattern.name}</span>
                  <small>{pattern.description}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="panel sequencer-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Lane Sequencer</p>
                <h2>Each drum stays visible, color-coded, and MIDI-addressable.</h2>
              </div>
              <div className="mini-stats">
                <span>Current step {transport.currentStep + 1}</span>
                <span>{activeKit.name}</span>
              </div>
            </div>

            <div className="lane-grid">
              {DRUM_DEFINITIONS.map((definition) => {
                const lane = activePattern?.laneSteps[definition.id] ?? [];
                const sample = activeKit.samples[definition.id];

                return (
                  <div
                    className="lane-row"
                    key={definition.id}
                    style={{ "--lane-color": definition.color } as CSSProperties}
                  >
                    <div className="lane-meta">
                      <div className="lane-icon">{definition.icon}</div>
                      <div>
                        <strong>{definition.name}</strong>
                        <span>
                          {sample.label} / MIDI {state.midiMappings[definition.id]}
                        </span>
                      </div>
                    </div>
                    <div className="step-row">
                      {lane.map((cell, stepIndex) => (
                        <button
                          className={[
                            "step-button",
                            cell.velocity > 0 ? `velocity-${cell.velocity}` : "",
                            transport.currentStep === stepIndex ? "current" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          key={`${definition.id}-${stepIndex}`}
                          onClick={() =>
                            dispatch({
                              type: "cycle-step",
                              patternId: activePattern.id,
                              drumId: definition.id,
                              stepIndex,
                            })
                          }
                          type="button"
                        >
                          <span>{stepIndex + 1}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel arranger-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Arranger</p>
                <h2>Juggle blocks, repeats, and fills into a song sketch.</h2>
              </div>
              <button
                className="ghost-button"
                onClick={() => dispatch({ type: "add-arranger-block" })}
                type="button"
              >
                Add Block
              </button>
            </div>

            <div className="arranger-strip">
              {state.arrangerBlocks.map((block) => (
                <article className="arranger-card" key={block.id}>
                  <header>
                    <input
                      onChange={(event) =>
                        dispatch({
                          type: "update-arranger-block",
                          blockId: block.id,
                          patch: { label: event.target.value },
                        })
                      }
                      value={block.label}
                    />
                    <div className="arranger-actions">
                      <button
                        onClick={() =>
                          dispatch({
                            type: "move-arranger-block",
                            blockId: block.id,
                            direction: "left",
                          })
                        }
                        type="button"
                      >
                        ←
                      </button>
                      <button
                        onClick={() =>
                          dispatch({
                            type: "move-arranger-block",
                            blockId: block.id,
                            direction: "right",
                          })
                        }
                        type="button"
                      >
                        →
                      </button>
                      <button
                        onClick={() =>
                          dispatch({ type: "remove-arranger-block", blockId: block.id })
                        }
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                  </header>

                  <label>
                    Pattern
                    <select
                      onChange={(event) =>
                        dispatch({
                          type: "update-arranger-block",
                          blockId: block.id,
                          patch: { patternId: event.target.value },
                        })
                      }
                      value={block.patternId}
                    >
                      {state.patterns.map((pattern) => (
                        <option key={pattern.id} value={pattern.id}>
                          {pattern.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Fill
                    <select
                      onChange={(event) =>
                        dispatch({
                          type: "update-arranger-block",
                          blockId: block.id,
                          patch: {
                            fillPatternId: event.target.value || undefined,
                          },
                        })
                      }
                      value={block.fillPatternId ?? ""}
                    >
                      <option value="">None</option>
                      {state.patterns.map((pattern) => (
                        <option key={pattern.id} value={pattern.id}>
                          {pattern.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Repeats
                    <input
                      max={8}
                      min={1}
                      onChange={(event) =>
                        dispatch({
                          type: "update-arranger-block",
                          blockId: block.id,
                          patch: { repeats: Number(event.target.value) },
                        })
                      }
                      type="number"
                      value={block.repeats}
                    />
                  </label>

                  <label>
                    Transition
                    <select
                      onChange={(event) =>
                        dispatch({
                          type: "update-arranger-block",
                          blockId: block.id,
                          patch: {
                            transition: event.target.value as typeof block.transition,
                          },
                        })
                      }
                      value={block.transition}
                    >
                      <option value="hold">Hold</option>
                      <option value="fill">Fill</option>
                      <option value="lift">Lift</option>
                      <option value="drop">Drop</option>
                    </select>
                  </label>
                </article>
              ))}
            </div>
          </section>
        </section>

        <aside className="side-column">
          <section className="panel ai-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">AI Composer</p>
                <h2>Prompt beats with groove, feel, velocity, and arrangement intent.</h2>
              </div>
            </div>

            <textarea
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe the beat, feel, groove, and transition shape."
              value={prompt}
            />

            <div className="ai-actions">
              <button
                className="primary-button"
                disabled={ideaStatus === "loading"}
                onClick={() => void handleGenerateIdea()}
                type="button"
              >
                {ideaStatus === "loading" ? "Generating..." : "Generate Beat Idea"}
              </button>
              <button
                className="ghost-button"
                disabled={!previewIdea}
                onClick={applyIdea}
                type="button"
              >
                Apply to Sequencer
              </button>
            </div>

            {ideaError ? <p className="error-text">{ideaError}</p> : null}
            {previewIdea ? (
              <div className="idea-preview">
                <h3>{previewIdea.mainPattern.name}</h3>
                <p>{previewIdea.summary}</p>
                <ul>
                  <li>Feel: {previewIdea.feel}</li>
                  <li>Tempo: {previewIdea.suggestedTempo} BPM</li>
                  <li>Swing: {formatSwing(previewIdea.swing)}</li>
                  <li>Blocks: {previewIdea.arrangement.map((block) => block.label).join(" / ")}</li>
                </ul>
              </div>
            ) : null}
          </section>

          <section className="panel kit-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Kit Locker</p>
                <h2>Factory kits plus lane-by-lane custom imports.</h2>
              </div>
            </div>

            <div className="kit-list">
              {state.kits.map((kit) => (
                <button
                  className={kit.id === state.activeKitId ? "kit-card active" : "kit-card"}
                  key={kit.id}
                  onClick={() => dispatch({ type: "set-active-kit", kitId: kit.id })}
                  type="button"
                >
                  <strong>{kit.name}</strong>
                  <span>{kit.description}</span>
                  <small>
                    {kit.vibe} / {kit.license}
                  </small>
                </button>
              ))}
            </div>

            <div className="import-grid">
              {DRUM_DEFINITIONS.map((definition) => (
                <label className="import-card" key={definition.id}>
                  <span>{definition.name}</span>
                  <small>{activeKit.samples[definition.id].label}</small>
                  <input
                    accept=".wav,.flac,.aif,.aiff,.mp3,.m4a"
                    onChange={(event) =>
                      void importSample(definition.id, event.target.files?.[0] ?? null)
                    }
                    type="file"
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="panel midi-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">MIDI Mode</p>
                <h2>Map pads and notes directly onto sequencer lanes.</h2>
              </div>
              <label className="toggle">
                <input
                  checked={state.midiModeEnabled}
                  onChange={(event) =>
                    dispatch({
                      type: "set-midi-mode",
                      enabled: event.target.checked,
                    })
                  }
                  type="checkbox"
                />
                <span>{state.midiModeEnabled ? "Enabled" : "Disabled"}</span>
              </label>
            </div>

            <p className="backend-note">{backend?.message}</p>

            <div className="midi-list">
              {DRUM_DEFINITIONS.map((definition) => (
                <label className="midi-row" key={definition.id}>
                  <span>{definition.name}</span>
                  <input
                    max={127}
                    min={0}
                    onChange={(event) =>
                      dispatch({
                        type: "set-midi-mapping",
                        drumId: definition.id,
                        note: Number(event.target.value),
                      })
                    }
                    type="number"
                    value={state.midiMappings[definition.id]}
                  />
                </label>
              ))}
            </div>

            {backend?.midiInputs.length ? (
              <div className="input-badge-list">
                {backend.midiInputs.map((input) => (
                  <span className="input-badge" key={input.id}>
                    {input.name}
                  </span>
                ))}
              </div>
            ) : null}
          </section>
        </aside>
      </main>
    </div>
  );
}
