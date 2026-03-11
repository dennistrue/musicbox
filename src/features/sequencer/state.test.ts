import { describe, expect, test } from "vitest";
import { reducer } from "./state";
import { createInitialState, findPattern } from "./model";

describe("sequencer reducer", () => {
  test("cycles a step through velocity states", () => {
    const initial = createInitialState();
    const patternId = initial.activePatternId;

    const one = reducer(initial, {
      type: "cycle-step",
      patternId,
      drumId: "kick",
      stepIndex: 1,
    });
    const two = reducer(one, {
      type: "cycle-step",
      patternId,
      drumId: "kick",
      stepIndex: 1,
    });
    const three = reducer(two, {
      type: "cycle-step",
      patternId,
      drumId: "kick",
      stepIndex: 1,
    });
    const four = reducer(three, {
      type: "cycle-step",
      patternId,
      drumId: "kick",
      stepIndex: 1,
    });

    expect(findPattern(one.patterns, patternId)?.laneSteps.kick[1].velocity).toBe(72);
    expect(findPattern(two.patterns, patternId)?.laneSteps.kick[1].velocity).toBe(104);
    expect(findPattern(three.patterns, patternId)?.laneSteps.kick[1].velocity).toBe(127);
    expect(findPattern(four.patterns, patternId)?.laneSteps.kick[1].velocity).toBe(0);
  });

  test("applies generated idea into patterns and arranger", () => {
    const initial = createInitialState();
    const next = reducer(initial, {
      type: "apply-generated-idea",
      idea: {
        summary: "A clear test groove",
        suggestedTempo: 128,
        swing: 0.08,
        grooveTone: "tight",
        feel: "driving",
        mainPattern: {
          name: "Main",
          grooveTone: "tight",
          description: "main",
          swing: 0.08,
          steps: {
            kick: [{ index: 0, velocity: 127 }],
            snare: [{ index: 4, velocity: 104 }],
            closedHat: [],
            openHat: [],
            clap: [],
            lowTom: [],
            midTom: [],
            crash: [],
          },
        },
        fillPattern: {
          name: "Fill",
          grooveTone: "pushed",
          description: "fill",
          swing: 0.05,
          steps: {
            kick: [{ index: 0, velocity: 104 }],
            snare: [{ index: 12, velocity: 127 }],
            closedHat: [],
            openHat: [],
            clap: [],
            lowTom: [],
            midTom: [],
            crash: [{ index: 15, velocity: 127 }],
          },
        },
        arrangement: [
          {
            label: "Intro",
            patternRole: "main",
            repeats: 2,
            transition: "hold",
          },
          {
            label: "Hook",
            patternRole: "main",
            repeats: 4,
            fillOnLastRepeat: true,
            transition: "fill",
          },
        ],
      },
    });

    expect(next.tempo).toBe(128);
    expect(next.arrangerBlocks).toHaveLength(2);
    expect(next.patterns.at(-1)?.name).toBe("Fill");
    expect(findPattern(next.patterns, next.activePatternId)?.name).toBe("Main");
  });

  test("imports a sample into the custom kit and activates it", () => {
    const initial = createInitialState();
    const next = reducer(initial, {
      type: "import-sample",
      drumId: "snare",
      fileName: "my-snare.wav",
      previewUrl: "file:///tmp/my-snare.wav",
    });

    const customKit = next.kits.find((kit) => kit.id === "kit-custom-user");

    expect(next.activeKitId).toBe("kit-custom-user");
    expect(customKit?.samples.snare.label).toBe("my-snare.wav");
  });
});
