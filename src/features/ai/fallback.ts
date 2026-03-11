import type {
  ArrangementDraft,
  DrumId,
  GeneratedBeatIdea,
  GrooveTone,
  PatternDraft,
  StepVelocity,
} from "../sequencer/model";
import { DRUM_IDS } from "../sequencer/model";

export interface BeatIdeaContext {
  tempo: number;
  swing: number;
  activePatternName: string;
}

function emptyDraft(
  name: string,
  description: string,
  swing: number,
  grooveTone: GrooveTone,
): PatternDraft {
  const emptySteps = Object.fromEntries(
    DRUM_IDS.map((drumId) => [drumId, [] as Array<{ index: number; velocity: StepVelocity }>]),
  ) as PatternDraft["steps"];

  return {
    name,
    description,
    swing,
    grooveTone,
    steps: emptySteps,
  };
}

function addHits(
  draft: PatternDraft,
  drumId: DrumId,
  entries: Array<[number, StepVelocity]>,
): PatternDraft {
  draft.steps[drumId] = entries.map(([index, velocity]) => ({ index, velocity }));
  return draft;
}

function createStylePack(style: string, context: BeatIdeaContext): GeneratedBeatIdea {
  if (style === "techno") {
    const main = addHits(
      addHits(
        addHits(
          addHits(
            emptyDraft(
              "Warehouse Drive",
              "Four-on-the-floor with clipped tops and a late snare drag.",
              0.03,
              "tight",
            ),
            "kick",
            [
              [0, 127],
              [4, 127],
              [8, 127],
              [12, 127],
            ],
          ),
          "snare",
          [
            [4, 72],
            [12, 104],
          ],
        ),
        "closedHat",
        [
          [2, 72],
          [6, 72],
          [10, 72],
          [14, 72],
        ],
      ),
      "openHat",
      [[15, 72]],
    );
    addHits(main, "clap", [[12, 104]]);
    addHits(main, "crash", [[0, 72]]);

    const fill = addHits(
      addHits(
        emptyDraft(
          "Warehouse Lift",
          "Snare-tom lift that opens into the downbeat.",
          0.03,
          "pushed",
        ),
        "snare",
        [
          [10, 72],
          [12, 104],
          [14, 127],
        ],
      ),
      "lowTom",
      [
        [11, 72],
        [13, 104],
      ],
    );
    addHits(fill, "kick", [[0, 104]]);
    addHits(fill, "crash", [[15, 127]]);

    return {
      summary:
        "Generated a warehouse groove: straight kick grid, clipped hats, and a lift fill.",
      suggestedTempo: 132,
      swing: 0.03,
      grooveTone: "tight",
      feel: "driving, late-night, locked",
      mainPattern: main,
      fillPattern: fill,
      arrangement: [
        { label: "Intro", patternRole: "main", repeats: 2, transition: "hold" },
        {
          label: "Main Run",
          patternRole: "main",
          repeats: 4,
          fillOnLastRepeat: true,
          transition: "fill",
        },
      ],
    };
  }

  if (style === "boom-bap") {
    const main = emptyDraft(
      "Dust Pocket",
      "Behind-the-beat boom bap with soft hats and a louder backbeat.",
      0.17,
      "laid-back",
    );
    addHits(main, "kick", [
      [0, 127],
      [3, 72],
      [7, 104],
      [10, 72],
    ]);
    addHits(main, "snare", [
      [4, 104],
      [12, 127],
    ]);
    addHits(main, "closedHat", [
      [0, 72],
      [2, 72],
      [4, 72],
      [6, 72],
      [8, 72],
      [10, 72],
      [12, 72],
      [14, 72],
    ]);
    addHits(main, "clap", [[12, 72]]);
    addHits(main, "openHat", [[7, 72]]);

    const fill = emptyDraft(
      "Dust Lift",
      "Fill with tom answers and a small crash wash.",
      0.17,
      "loose",
    );
    addHits(fill, "kick", [
      [0, 104],
      [8, 72],
      [11, 72],
    ]);
    addHits(fill, "snare", [
      [4, 104],
      [12, 127],
    ]);
    addHits(fill, "lowTom", [[13, 104]]);
    addHits(fill, "midTom", [[14, 104]]);
    addHits(fill, "crash", [[15, 72]]);

    return {
      summary:
        "Generated a dusty boom-bap groove with laid-back hats and a short tom fill.",
      suggestedTempo: 92,
      swing: 0.17,
      grooveTone: "laid-back",
      feel: "dusty, human, behind the beat",
      mainPattern: main,
      fillPattern: fill,
      arrangement: [
        { label: "Verse", patternRole: "main", repeats: 4, transition: "hold" },
        {
          label: "Turnaround",
          patternRole: "main",
          repeats: 2,
          fillOnLastRepeat: true,
          transition: "fill",
        },
      ],
    };
  }

  if (style === "broken") {
    const main = emptyDraft(
      "Broken Orbit",
      "Uneven kick placements with glassy tops and a forward snare snap.",
      0.11,
      "pushed",
    );
    addHits(main, "kick", [
      [0, 127],
      [5, 104],
      [9, 72],
      [13, 104],
    ]);
    addHits(main, "snare", [
      [4, 104],
      [11, 72],
      [12, 127],
    ]);
    addHits(main, "closedHat", [
      [1, 72],
      [3, 72],
      [6, 72],
      [8, 72],
      [10, 72],
      [15, 72],
    ]);
    addHits(main, "clap", [[12, 72]]);
    addHits(main, "midTom", [[14, 72]]);

    const fill = emptyDraft(
      "Broken Spill",
      "Loose fill with low tom and open hat spill into the next section.",
      0.13,
      "loose",
    );
    addHits(fill, "kick", [
      [0, 104],
      [9, 72],
      [12, 72],
    ]);
    addHits(fill, "snare", [
      [4, 104],
      [12, 104],
      [14, 127],
    ]);
    addHits(fill, "lowTom", [[13, 104]]);
    addHits(fill, "openHat", [[15, 104]]);

    return {
      summary:
        "Generated a broken-beat pocket with offset kicks and a loose spill fill.",
      suggestedTempo: 126,
      swing: 0.11,
      grooveTone: "pushed",
      feel: "off-axis, nimble, syncopated",
      mainPattern: main,
      fillPattern: fill,
      arrangement: [
        { label: "Sketch", patternRole: "main", repeats: 2, transition: "hold" },
        {
          label: "Hook",
          patternRole: "main",
          repeats: 3,
          fillOnLastRepeat: true,
          transition: "fill",
        },
      ],
    };
  }

  const main = emptyDraft(
    "Night Pulse",
    "Balanced groove with a steady floor and enough air for arrangement changes.",
    context.swing,
    "tight",
  );
  addHits(main, "kick", [
    [0, 127],
    [4, 104],
    [8, 127],
    [12, 104],
  ]);
  addHits(main, "snare", [
    [4, 104],
    [12, 127],
  ]);
  addHits(main, "closedHat", [
    [0, 72],
    [2, 72],
    [4, 72],
    [6, 72],
    [8, 72],
    [10, 72],
    [12, 72],
    [14, 72],
  ]);
  addHits(main, "clap", [[12, 72]]);
  addHits(main, "crash", [[0, 72]]);

  const fill = emptyDraft(
    "Night Break",
    "Simple fill built to transition into the next block.",
    context.swing,
    "pushed",
  );
  addHits(fill, "kick", [
    [0, 104],
    [10, 72],
  ]);
  addHits(fill, "snare", [
    [4, 104],
    [12, 127],
  ]);
  addHits(fill, "midTom", [[13, 104]]);
  addHits(fill, "openHat", [[15, 104]]);

  return {
    summary:
      "Generated a balanced groove with a simple fill that can slot into the arranger immediately.",
    suggestedTempo: context.tempo,
    swing: context.swing,
    grooveTone: "tight",
    feel: "balanced, direct, editable",
    mainPattern: main,
    fillPattern: fill,
    arrangement: [
      { label: "Main", patternRole: "main", repeats: 4, transition: "hold" },
      {
        label: "Lift",
        patternRole: "main",
        repeats: 2,
        fillOnLastRepeat: true,
        transition: "fill",
      },
    ],
  };
}

function inferStyle(prompt: string): string {
  const normalized = prompt.toLowerCase();
  if (normalized.includes("techno") || normalized.includes("warehouse")) {
    return "techno";
  }
  if (
    normalized.includes("boom bap") ||
    normalized.includes("boom-bap") ||
    normalized.includes("neo soul") ||
    normalized.includes("hip hop")
  ) {
    return "boom-bap";
  }
  if (normalized.includes("broken") || normalized.includes("uk")) {
    return "broken";
  }
  return "default";
}

export function generateFallbackBeatIdea(
  prompt: string,
  context: BeatIdeaContext,
): GeneratedBeatIdea {
  const style = inferStyle(prompt);
  const idea = createStylePack(style, context);

  if (prompt.toLowerCase().includes("faster")) {
    idea.suggestedTempo = Math.min(160, idea.suggestedTempo + 8);
  }

  if (
    prompt.toLowerCase().includes("slower") ||
    prompt.toLowerCase().includes("drag")
  ) {
    idea.suggestedTempo = Math.max(80, idea.suggestedTempo - 6);
  }

  if (
    prompt.toLowerCase().includes("more swing") ||
    prompt.toLowerCase().includes("shuffle")
  ) {
    idea.swing = Number(Math.min(0.24, idea.swing + 0.05).toFixed(2));
  }

  if (prompt.toLowerCase().includes("harder")) {
    for (const drumId of DRUM_IDS) {
      idea.mainPattern.steps[drumId] = idea.mainPattern.steps[drumId].map((hit) => ({
        ...hit,
        velocity: hit.velocity === 72 ? 104 : hit.velocity,
      }));
    }
  }

  return idea;
}
