export const STEP_COUNT = 16;

export type DrumId =
  | "kick"
  | "snare"
  | "closedHat"
  | "openHat"
  | "clap"
  | "lowTom"
  | "midTom"
  | "crash";

export type StepVelocity = 0 | 72 | 104 | 127;
export type GrooveTone = "tight" | "loose" | "pushed" | "laid-back";
export type TransitionStyle = "hold" | "lift" | "drop" | "fill";
export type TransportMode = "pattern" | "song";

export interface DrumDefinition {
  id: DrumId;
  name: string;
  shortName: string;
  icon: string;
  color: string;
  midiNote: number;
}

export interface StepCell {
  velocity: StepVelocity;
}

export interface Pattern {
  id: string;
  name: string;
  laneSteps: Record<DrumId, StepCell[]>;
  swing: number;
  grooveTone: GrooveTone;
  description: string;
}

export interface SongBlock {
  id: string;
  label: string;
  patternId: string;
  repeats: number;
  fillPatternId?: string;
  transition: TransitionStyle;
}

export interface KitSample {
  drumId: DrumId;
  label: string;
  url: string;
  source: string;
  license: string;
  attribution: string;
}

export interface Kit {
  id: string;
  name: string;
  vibe: "acoustic" | "electronic" | "custom";
  description: string;
  samples: Record<DrumId, KitSample>;
  sourcePack: string;
  license: string;
}

export type MidiMapping = Record<DrumId, number>;

export interface PatternDraft {
  name: string;
  grooveTone: GrooveTone;
  description: string;
  swing: number;
  steps: Record<DrumId, Array<{ index: number; velocity: StepVelocity }>>;
}

export interface ArrangementDraft {
  label: string;
  patternRole: "main" | "fill";
  repeats: number;
  fillOnLastRepeat?: boolean;
  transition: TransitionStyle;
}

export interface GeneratedBeatIdea {
  summary: string;
  suggestedTempo: number;
  swing: number;
  grooveTone: GrooveTone;
  feel: string;
  mainPattern: PatternDraft;
  fillPattern: PatternDraft;
  arrangement: ArrangementDraft[];
}

export interface PlaybackSlot {
  pattern: Pattern;
  label: string;
}

export interface SequencerState {
  tempo: number;
  swing: number;
  patterns: Pattern[];
  activePatternId: string;
  arrangerBlocks: SongBlock[];
  kits: Kit[];
  activeKitId: string;
  transportMode: TransportMode;
  midiModeEnabled: boolean;
  midiMappings: MidiMapping;
  lastIdea?: GeneratedBeatIdea;
}

export const DRUM_DEFINITIONS: DrumDefinition[] = [
  {
    id: "kick",
    name: "Kick",
    shortName: "K",
    icon: "◎",
    color: "#ff8f5a",
    midiNote: 36,
  },
  {
    id: "snare",
    name: "Snare",
    shortName: "S",
    icon: "◌",
    color: "#ff5470",
    midiNote: 38,
  },
  {
    id: "closedHat",
    name: "Closed Hat",
    shortName: "CH",
    icon: "∷",
    color: "#ffd166",
    midiNote: 42,
  },
  {
    id: "openHat",
    name: "Open Hat",
    shortName: "OH",
    icon: "⋰",
    color: "#f4f1de",
    midiNote: 46,
  },
  {
    id: "clap",
    name: "Clap",
    shortName: "CL",
    icon: "✦",
    color: "#8ecae6",
    midiNote: 39,
  },
  {
    id: "lowTom",
    name: "Low Tom",
    shortName: "LT",
    icon: "▣",
    color: "#6ee7b7",
    midiNote: 45,
  },
  {
    id: "midTom",
    name: "Mid Tom",
    shortName: "MT",
    icon: "▤",
    color: "#38bdf8",
    midiNote: 48,
  },
  {
    id: "crash",
    name: "Crash",
    shortName: "CR",
    icon: "✺",
    color: "#c084fc",
    midiNote: 49,
  },
];

export const DRUM_IDS = DRUM_DEFINITIONS.map((definition) => definition.id);

const velocityCycle: StepVelocity[] = [0, 72, 104, 127];

export function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyLane(): StepCell[] {
  return Array.from({ length: STEP_COUNT }, () => ({ velocity: 0 }));
}

export function createEmptyPattern(
  id: string,
  name: string,
  description: string,
  swing = 0.1,
  grooveTone: GrooveTone = "tight",
): Pattern {
  return {
    id,
    name,
    description,
    swing,
    grooveTone,
    laneSteps: Object.fromEntries(
      DRUM_IDS.map((drumId) => [drumId, createEmptyLane()]),
    ) as Record<DrumId, StepCell[]>,
  };
}

export function cycleVelocity(current: StepVelocity): StepVelocity {
  const currentIndex = velocityCycle.indexOf(current);
  return velocityCycle[(currentIndex + 1) % velocityCycle.length];
}

function applyHits(
  pattern: Pattern,
  drumId: DrumId,
  hits: Array<{ index: number; velocity: StepVelocity }>,
): Pattern {
  const nextPattern = structuredClone(pattern);
  const lane = nextPattern.laneSteps[drumId];
  for (const hit of hits) {
    if (lane[hit.index]) {
      lane[hit.index] = { velocity: hit.velocity };
    }
  }
  return nextPattern;
}

function buildPatternFromDraft(id: string, draft: PatternDraft): Pattern {
  let pattern = createEmptyPattern(
    id,
    draft.name,
    draft.description,
    draft.swing,
    draft.grooveTone,
  );
  for (const drumId of DRUM_IDS) {
    pattern = applyHits(pattern, drumId, draft.steps[drumId] ?? []);
  }
  return pattern;
}

function createFactoryKits(): Kit[] {
  const acousticSource = "Sample Pi / Sonic Pi public-domain one-shots";
  const electronicSource = "Sample Pi / Sonic Pi public-domain electronic hits";
  const license = "CC0 / Public Domain";

  const acoustic: Kit = {
    id: "kit-acoustic-room",
    name: "Loft Acoustic",
    vibe: "acoustic",
    description: "Dry room kit with real drum transients and bright cymbals.",
    sourcePack: acousticSource,
    license,
    samples: {
      kick: {
        drumId: "kick",
        label: "Bass Hard",
        url: "/samples/acoustic/kick.wav",
        source: acousticSource,
        license,
        attribution: "Sample Pi README credits Freesound contributors",
      },
      snare: {
        drumId: "snare",
        label: "Snare Hard",
        url: "/samples/acoustic/snare.wav",
        source: acousticSource,
        license,
        attribution: "Sample Pi README credits Freesound contributors",
      },
      closedHat: {
        drumId: "closedHat",
        label: "Closed Cymbal",
        url: "/samples/acoustic/closed-hat.wav",
        source: acousticSource,
        license,
        attribution: "Sample Pi README credits Freesound contributors",
      },
      openHat: {
        drumId: "openHat",
        label: "Open Cymbal",
        url: "/samples/acoustic/open-hat.wav",
        source: acousticSource,
        license,
        attribution: "Sample Pi README credits Freesound contributors",
      },
      clap: {
        drumId: "clap",
        label: "Snap Accent",
        url: "/samples/acoustic/clap.wav",
        source: acousticSource,
        license,
        attribution: "Sample Pi README credits Freesound contributors",
      },
      lowTom: {
        drumId: "lowTom",
        label: "Low Tom Hard",
        url: "/samples/acoustic/low-tom.wav",
        source: acousticSource,
        license,
        attribution: "Sample Pi README credits Freesound contributors",
      },
      midTom: {
        drumId: "midTom",
        label: "Mid Tom Hard",
        url: "/samples/acoustic/mid-tom.wav",
        source: acousticSource,
        license,
        attribution: "Sample Pi README credits Freesound contributors",
      },
      crash: {
        drumId: "crash",
        label: "Crash Hard",
        url: "/samples/acoustic/crash.wav",
        source: acousticSource,
        license,
        attribution: "Sample Pi README credits Freesound contributors",
      },
    },
  };

  const electronic: Kit = {
    id: "kit-electronic-neon",
    name: "Neon Circuit",
    vibe: "electronic",
    description: "808-weighted electronic kit with synthetic body and sharper percussion.",
    sourcePack: electronicSource,
    license,
    samples: {
      kick: {
        drumId: "kick",
        label: "808 Kick",
        url: "/samples/electronic/kick.wav",
        source: electronicSource,
        license,
        attribution: "Sample Pi README credits Freesound contributors",
      },
      snare: {
        drumId: "snare",
        label: "Elec Snare",
        url: "/samples/electronic/snare.wav",
        source: electronicSource,
        license,
        attribution: "Sample Pi README credits Freesound contributors",
      },
      closedHat: {
        drumId: "closedHat",
        label: "Tick Hat",
        url: "/samples/electronic/closed-hat.wav",
        source: electronicSource,
        license,
        attribution: "Sample Pi README credits Freesound contributors",
      },
      openHat: {
        drumId: "openHat",
        label: "Elec Cymbal",
        url: "/samples/electronic/open-hat.wav",
        source: electronicSource,
        license,
        attribution: "Sample Pi README credits Freesound contributors",
      },
      clap: {
        drumId: "clap",
        label: "Pop Clap",
        url: "/samples/electronic/clap.wav",
        source: electronicSource,
        license,
        attribution: "Sample Pi README credits Freesound contributors",
      },
      lowTom: {
        drumId: "lowTom",
        label: "Fuzz Tom",
        url: "/samples/electronic/low-tom.wav",
        source: electronicSource,
        license,
        attribution: "Sample Pi README credits Freesound contributors",
      },
      midTom: {
        drumId: "midTom",
        label: "Bong Tom",
        url: "/samples/electronic/mid-tom.wav",
        source: electronicSource,
        license,
        attribution: "Sample Pi README credits Freesound contributors",
      },
      crash: {
        drumId: "crash",
        label: "Triangle Crash",
        url: "/samples/electronic/crash.wav",
        source: electronicSource,
        license,
        attribution: "Sample Pi README credits Freesound contributors",
      },
    },
  };

  const customTemplate: Kit = {
    id: "kit-custom-user",
    name: "Custom Vault",
    vibe: "custom",
    description: "Drop in your own sounds lane by lane and preview them instantly.",
    sourcePack: "User imported",
    license: "User supplied",
    samples: Object.fromEntries(
      DRUM_IDS.map((drumId) => [
        drumId,
        {
          drumId,
          label: "Empty slot",
          url: "",
          source: "User imported",
          license: "User supplied",
          attribution: "Imported in app",
        },
      ]),
    ) as Record<DrumId, KitSample>,
  };

  return [acoustic, electronic, customTemplate];
}

export function createDefaultMidiMapping(): MidiMapping {
  return Object.fromEntries(
    DRUM_DEFINITIONS.map((definition) => [definition.id, definition.midiNote]),
  ) as MidiMapping;
}

export function createInitialState(): SequencerState {
  const pocketDraft: PatternDraft = {
    name: "Pocket Room",
    description: "Acoustic verse groove with a little air on the hats.",
    grooveTone: "laid-back",
    swing: 0.12,
    steps: {
      kick: [
        { index: 0, velocity: 127 },
        { index: 7, velocity: 72 },
        { index: 8, velocity: 104 },
        { index: 12, velocity: 72 },
      ],
      snare: [
        { index: 4, velocity: 104 },
        { index: 12, velocity: 127 },
      ],
      closedHat: [
        { index: 0, velocity: 72 },
        { index: 2, velocity: 72 },
        { index: 4, velocity: 72 },
        { index: 6, velocity: 72 },
        { index: 8, velocity: 72 },
        { index: 10, velocity: 72 },
        { index: 12, velocity: 72 },
        { index: 14, velocity: 72 },
      ],
      openHat: [{ index: 15, velocity: 72 }],
      clap: [{ index: 12, velocity: 72 }],
      lowTom: [],
      midTom: [],
      crash: [{ index: 0, velocity: 72 }],
    },
  };

  const fillDraft: PatternDraft = {
    name: "Lift Fill",
    description: "Short transition with tom lift and cymbal release.",
    grooveTone: "pushed",
    swing: 0.08,
    steps: {
      kick: [
        { index: 0, velocity: 104 },
        { index: 9, velocity: 72 },
        { index: 11, velocity: 104 },
      ],
      snare: [
        { index: 4, velocity: 104 },
        { index: 10, velocity: 72 },
        { index: 12, velocity: 127 },
      ],
      closedHat: [
        { index: 0, velocity: 72 },
        { index: 2, velocity: 72 },
        { index: 4, velocity: 72 },
        { index: 6, velocity: 72 },
        { index: 8, velocity: 72 },
      ],
      openHat: [{ index: 15, velocity: 104 }],
      clap: [],
      lowTom: [
        { index: 12, velocity: 104 },
        { index: 14, velocity: 127 },
      ],
      midTom: [{ index: 13, velocity: 104 }],
      crash: [{ index: 15, velocity: 127 }],
    },
  };

  const pocket = buildPatternFromDraft("pattern-pocket-room", pocketDraft);
  const fill = buildPatternFromDraft("pattern-lift-fill", fillDraft);
  const kits = createFactoryKits();

  return {
    tempo: 118,
    swing: 0.12,
    patterns: [pocket, fill],
    activePatternId: pocket.id,
    arrangerBlocks: [
      {
        id: "block-intro",
        label: "Intro",
        patternId: pocket.id,
        repeats: 2,
        fillPatternId: fill.id,
        transition: "lift",
      },
      {
        id: "block-verse",
        label: "Verse",
        patternId: pocket.id,
        repeats: 4,
        fillPatternId: fill.id,
        transition: "fill",
      },
    ],
    kits,
    activeKitId: kits[0].id,
    transportMode: "pattern",
    midiModeEnabled: false,
    midiMappings: createDefaultMidiMapping(),
  };
}

export function findPattern(
  patterns: Pattern[],
  patternId: string,
): Pattern | undefined {
  return patterns.find((pattern) => pattern.id === patternId);
}

export function duplicatePattern(pattern: Pattern): Pattern {
  return {
    ...structuredClone(pattern),
    id: createId("pattern"),
    name: `${pattern.name} Var`,
  };
}

export function buildPlaybackSequence(
  patterns: Pattern[],
  blocks: SongBlock[],
  activePatternId: string,
  mode: TransportMode,
): PlaybackSlot[] {
  if (mode === "pattern") {
    const pattern = findPattern(patterns, activePatternId) ?? patterns[0];
    return pattern ? [{ pattern, label: pattern.name }] : [];
  }

  const sequence: PlaybackSlot[] = [];

  for (const block of blocks) {
    const mainPattern = findPattern(patterns, block.patternId);
    const fillPattern = block.fillPatternId
      ? findPattern(patterns, block.fillPatternId)
      : undefined;

    if (!mainPattern) {
      continue;
    }

    for (let repeat = 0; repeat < block.repeats; repeat += 1) {
      const useFill = Boolean(
        fillPattern && repeat === block.repeats - 1 && block.transition === "fill",
      );

      sequence.push({
        pattern: useFill ? fillPattern! : mainPattern,
        label: useFill ? `${block.label} Fill` : block.label,
      });
    }
  }

  if (sequence.length === 0) {
    const fallback = findPattern(patterns, activePatternId) ?? patterns[0];
    return fallback ? [{ pattern: fallback, label: fallback.name }] : [];
  }

  return sequence;
}

export function buildPatternFromIdeaRole(
  draft: PatternDraft,
  role: "main" | "fill",
): Pattern {
  const prefix = role === "main" ? "pattern-main" : "pattern-fill";
  return buildPatternFromDraft(createId(prefix), draft);
}

