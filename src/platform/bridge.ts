import type { DrumId, GeneratedBeatIdea } from "../features/sequencer/model";
import { generateFallbackBeatIdea } from "../features/ai/fallback";
import type { BeatIdeaContext } from "../features/ai/fallback";

export interface BackendDiagnostics {
  nativeRuntime: boolean;
  openAiConfigured: boolean;
  openAiSource?: string;
  midiInputs: Array<{ id: string; name: string }>;
  message: string;
}

interface PersistedSample {
  path: string;
}

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function getBackendDiagnostics(): Promise<BackendDiagnostics> {
  if (!isTauriRuntime()) {
    return {
      nativeRuntime: false,
      openAiConfigured: false,
      midiInputs: [],
      message:
        "Running in browser preview. Native MIDI and secure OpenAI access activate in the packaged Tauri app.",
    };
  }

  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<BackendDiagnostics>("backend_status");
  } catch (error) {
    return {
      nativeRuntime: true,
      openAiConfigured: false,
      midiInputs: [],
      message:
        error instanceof Error
          ? error.message
          : "Could not load native backend diagnostics.",
    };
  }
}

export async function generateBeatIdea(
  prompt: string,
  context: BeatIdeaContext,
): Promise<GeneratedBeatIdea> {
  if (!isTauriRuntime()) {
    return generateFallbackBeatIdea(prompt, context);
  }

  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<GeneratedBeatIdea>("generate_beat_from_prompt", {
      request: { prompt, context },
    });
  } catch {
    return generateFallbackBeatIdea(prompt, context);
  }
}

export async function persistImportedSample(
  drumId: DrumId,
  file: File,
): Promise<PersistedSample | null> {
  if (!isTauriRuntime()) {
    return null;
  }

  const buffer = await file.arrayBuffer();
  const bytes = Array.from(new Uint8Array(buffer));

  try {
    const { convertFileSrc, invoke } = await import("@tauri-apps/api/core");
    const persisted = await invoke<PersistedSample>("persist_imported_sample", {
      request: {
        drumId,
        fileName: file.name,
        bytes,
      },
    });
    return {
      path: convertFileSrc(persisted.path),
    };
  } catch {
    return null;
  }
}
