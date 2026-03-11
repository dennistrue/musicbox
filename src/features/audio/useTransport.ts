import { useEffect, useRef, useState } from "react";
import type { Kit, PlaybackSlot } from "../sequencer/model";
import { DRUM_IDS, STEP_COUNT } from "../sequencer/model";

interface UseTransportArgs {
  tempo: number;
  swing: number;
  kit: Kit;
  sequence: PlaybackSlot[];
  isPlaying: boolean;
}

interface TransportState {
  currentStep: number;
  currentLabel: string;
  readySamples: number;
  totalSamples: number;
}

const lookAheadMs = 25;
const scheduleAheadSeconds = 0.1;

export function useTransport({
  tempo,
  swing,
  kit,
  sequence,
  isPlaying,
}: UseTransportArgs): TransportState {
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef(0);
  const stepCounterRef = useRef(0);
  const bufferCacheRef = useRef(new Map<string, AudioBuffer>());
  const [transportState, setTransportState] = useState<TransportState>({
    currentStep: 0,
    currentLabel: sequence[0]?.label ?? "Pattern",
    readySamples: 0,
    totalSamples: DRUM_IDS.length,
  });

  useEffect(() => {
    let cancelled = false;

    async function ensureBuffers() {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      let readyCount = 0;

      for (const drumId of DRUM_IDS) {
        const sample = kit.samples[drumId];
        if (!sample.url) {
          continue;
        }

        if (bufferCacheRef.current.has(sample.url)) {
          readyCount += 1;
          continue;
        }

        try {
          const response = await fetch(sample.url);
          const arrayBuffer = await response.arrayBuffer();
          const decoded = await audioContextRef.current.decodeAudioData(
            arrayBuffer.slice(0),
          );
          bufferCacheRef.current.set(sample.url, decoded);
          readyCount += 1;
        } catch {
          // Skip missing/bad assets. The UI will show sample readiness count.
        }
      }

      if (!cancelled) {
        setTransportState((current) => ({
          ...current,
          readySamples: readyCount,
          totalSamples: DRUM_IDS.filter((drumId) => kit.samples[drumId].url).length,
        }));
      }
    }

    ensureBuffers();

    return () => {
      cancelled = true;
    };
  }, [kit]);

  useEffect(() => {
    if (!isPlaying || sequence.length === 0) {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    void audioContextRef.current.resume();
    nextNoteTimeRef.current = audioContextRef.current.currentTime;
    stepCounterRef.current = 0;

    const scheduleStep = (slot: PlaybackSlot, stepIndex: number, time: number) => {
      for (const drumId of DRUM_IDS) {
        const cell = slot.pattern.laneSteps[drumId][stepIndex];
        if (!cell || cell.velocity === 0) {
          continue;
        }

        const sample = kit.samples[drumId];
        const buffer = sample?.url
          ? bufferCacheRef.current.get(sample.url)
          : undefined;

        if (!buffer || !audioContextRef.current) {
          continue;
        }

        const source = audioContextRef.current.createBufferSource();
        const gain = audioContextRef.current.createGain();
        gain.gain.value = cell.velocity / 127;
        source.buffer = buffer;
        source.connect(gain).connect(audioContextRef.current.destination);
        source.start(time);
      }
    };

    const scheduler = () => {
      const ctx = audioContextRef.current;
      if (!ctx) {
        return;
      }

      const secondsPerStep = 60 / tempo / 4;
      const swingOffset = secondsPerStep * swing * 0.28;

      while (nextNoteTimeRef.current < ctx.currentTime + scheduleAheadSeconds) {
        const slotIndex =
          Math.floor(stepCounterRef.current / STEP_COUNT) % sequence.length;
        const stepIndex = stepCounterRef.current % STEP_COUNT;
        const slot = sequence[slotIndex];
        const timingOffset = stepIndex % 2 === 1 ? swingOffset : 0;

        scheduleStep(slot, stepIndex, nextNoteTimeRef.current + timingOffset);

        setTransportState((current) => ({
          ...current,
          currentStep: stepIndex,
          currentLabel: slot.label,
        }));

        stepCounterRef.current += 1;
        nextNoteTimeRef.current += secondsPerStep;
      }
    };

    timerRef.current = window.setInterval(scheduler, lookAheadMs);
    scheduler();

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, kit, sequence, swing, tempo]);

  return transportState;
}

