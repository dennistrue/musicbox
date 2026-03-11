import type {
  DrumId,
  GeneratedBeatIdea,
  Pattern,
  SequencerState,
  SongBlock,
  StepVelocity,
} from "./model";
import {
  buildPatternFromIdeaRole,
  createId,
  createInitialState,
  cycleVelocity,
  duplicatePattern,
  findPattern,
  DRUM_IDS,
} from "./model";

export type SequencerAction =
  | {
      type: "cycle-step";
      patternId: string;
      drumId: DrumId;
      stepIndex: number;
    }
  | {
      type: "set-tempo";
      tempo: number;
    }
  | {
      type: "set-swing";
      swing: number;
    }
  | {
      type: "select-pattern";
      patternId: string;
    }
  | {
      type: "duplicate-pattern";
      patternId: string;
    }
  | {
      type: "set-transport-mode";
      mode: SequencerState["transportMode"];
    }
  | {
      type: "add-arranger-block";
    }
  | {
      type: "update-arranger-block";
      blockId: string;
      patch: Partial<SongBlock>;
    }
  | {
      type: "move-arranger-block";
      blockId: string;
      direction: "left" | "right";
    }
  | {
      type: "remove-arranger-block";
      blockId: string;
    }
  | {
      type: "set-active-kit";
      kitId: string;
    }
  | {
      type: "import-sample";
      drumId: DrumId;
      fileName: string;
      previewUrl: string;
    }
  | {
      type: "set-midi-mode";
      enabled: boolean;
    }
  | {
      type: "set-midi-mapping";
      drumId: DrumId;
      note: number;
    }
  | {
      type: "apply-generated-idea";
      idea: GeneratedBeatIdea;
    };

function updatePattern(
  patterns: Pattern[],
  patternId: string,
  updater: (pattern: Pattern) => Pattern,
): Pattern[] {
  return patterns.map((pattern) =>
    pattern.id === patternId ? updater(pattern) : pattern,
  );
}

function clampVelocity(value: number): StepVelocity {
  if (value >= 127) {
    return 127;
  }
  if (value >= 104) {
    return 104;
  }
  if (value > 0) {
    return 72;
  }
  return 0;
}

export function reducer(
  state: SequencerState,
  action: SequencerAction,
): SequencerState {
  switch (action.type) {
    case "cycle-step":
      return {
        ...state,
        patterns: updatePattern(state.patterns, action.patternId, (pattern) => {
          const nextPattern = structuredClone(pattern);
          const lane = nextPattern.laneSteps[action.drumId];
          const currentCell = lane[action.stepIndex];
          lane[action.stepIndex] = {
            velocity: cycleVelocity(currentCell.velocity),
          };
          return nextPattern;
        }),
      };
    case "set-tempo":
      return {
        ...state,
        tempo: Math.min(170, Math.max(72, Math.round(action.tempo))),
      };
    case "set-swing":
      return {
        ...state,
        swing: Number(action.swing.toFixed(2)),
      };
    case "select-pattern":
      return {
        ...state,
        activePatternId: action.patternId,
      };
    case "duplicate-pattern": {
      const source = findPattern(state.patterns, action.patternId);
      if (!source) {
        return state;
      }
      const clone = duplicatePattern(source);
      return {
        ...state,
        patterns: [...state.patterns, clone],
        activePatternId: clone.id,
      };
    }
    case "set-transport-mode":
      return {
        ...state,
        transportMode: action.mode,
      };
    case "add-arranger-block":
      return {
        ...state,
        arrangerBlocks: [
          ...state.arrangerBlocks,
          {
            id: createId("block"),
            label: `Section ${state.arrangerBlocks.length + 1}`,
            patternId: state.activePatternId,
            repeats: 2,
            transition: "hold",
          },
        ],
      };
    case "update-arranger-block":
      return {
        ...state,
        arrangerBlocks: state.arrangerBlocks.map((block) =>
          block.id === action.blockId ? { ...block, ...action.patch } : block,
        ),
      };
    case "move-arranger-block": {
      const index = state.arrangerBlocks.findIndex(
        (block) => block.id === action.blockId,
      );
      if (index === -1) {
        return state;
      }

      const directionOffset = action.direction === "left" ? -1 : 1;
      const targetIndex = index + directionOffset;

      if (targetIndex < 0 || targetIndex >= state.arrangerBlocks.length) {
        return state;
      }

      const nextBlocks = [...state.arrangerBlocks];
      const [movedBlock] = nextBlocks.splice(index, 1);
      nextBlocks.splice(targetIndex, 0, movedBlock);

      return {
        ...state,
        arrangerBlocks: nextBlocks,
      };
    }
    case "remove-arranger-block":
      return {
        ...state,
        arrangerBlocks: state.arrangerBlocks.filter(
          (block) => block.id !== action.blockId,
        ),
      };
    case "set-active-kit":
      return {
        ...state,
        activeKitId: action.kitId,
      };
    case "import-sample":
      return {
        ...state,
        activeKitId: "kit-custom-user",
        kits: state.kits.map((kit) =>
          kit.id !== "kit-custom-user"
            ? kit
            : {
                ...kit,
                samples: {
                  ...kit.samples,
                  [action.drumId]: {
                    ...kit.samples[action.drumId],
                    label: action.fileName,
                    url: action.previewUrl,
                  },
                },
              },
        ),
      };
    case "set-midi-mode":
      return {
        ...state,
        midiModeEnabled: action.enabled,
      };
    case "set-midi-mapping":
      return {
        ...state,
        midiMappings: {
          ...state.midiMappings,
          [action.drumId]: action.note,
        },
      };
    case "apply-generated-idea": {
      const mainPattern = buildPatternFromIdeaRole(action.idea.mainPattern, "main");
      const fillPattern = buildPatternFromIdeaRole(action.idea.fillPattern, "fill");
      const patternRoleMap = {
        main: mainPattern.id,
        fill: fillPattern.id,
      } as const;

      return {
        ...state,
        tempo: Math.round(action.idea.suggestedTempo),
        swing: Number(action.idea.swing.toFixed(2)),
        patterns: [
          ...state.patterns.filter(
            (pattern) =>
              pattern.id !== mainPattern.id && pattern.id !== fillPattern.id,
          ),
          mainPattern,
          fillPattern,
        ],
        activePatternId: mainPattern.id,
        arrangerBlocks:
          action.idea.arrangement.length > 0
            ? action.idea.arrangement.map((section) => ({
                id: createId("block"),
                label: section.label,
                patternId: patternRoleMap[section.patternRole],
                repeats: section.repeats,
                fillPatternId: section.fillOnLastRepeat
                  ? patternRoleMap.fill
                  : undefined,
                transition: section.transition,
              }))
            : state.arrangerBlocks,
        lastIdea: {
          ...action.idea,
          mainPattern: {
            ...action.idea.mainPattern,
            steps: Object.fromEntries(
              DRUM_IDS.map((drumId) => [
                drumId,
                action.idea.mainPattern.steps[drumId].map((hit) => ({
                  ...hit,
                  velocity: clampVelocity(hit.velocity),
                })),
              ]),
            ) as GeneratedBeatIdea["mainPattern"]["steps"],
          },
        },
      };
    }
  }
}

export function createInitialSequencerState(): SequencerState {
  return createInitialState();
}

