import {
  FEEDBACK_POP_MS,
  FEEDBACK_STAGGER_MS,
} from "@/features/game/components/FeedbackPegs";
import { hashPeg } from "@/features/game/components/Peg";
import type { Color } from "@/features/game/logic";

/* Kenney CC0 packs, trimmed with ffmpeg; see public/sounds/LICENSE.md. */
const PEG_CLIPS = [
  "peg-1.wav",
  "peg-2.wav",
  "peg-3.wav",
  "peg-4.wav",
  "peg-5.wav",
];
export const THUD_CLIP = "thud.wav";
export const SHIELD_CLIP = "shield.wav";
export const WIN_CLIP = "win.mp3";
export const LOSE_CLIP = "lose.mp3";
const ALL_CLIPS = [...PEG_CLIPS, THUD_CLIP, SHIELD_CLIP, WIN_CLIP, LOSE_CLIP];

export type ClipPlay = {
  clip: string;
  playbackRate?: number;
  gain?: number;
  /* Scheduled on the audio clock, so staggered clicks stay evenly spaced. */
  delayMs?: number;
};

/*
 * Same idea as pickInsertAnimation: a stable hash per row, slot and colour, so
 * pegs sound varied without Math.random(). Each field reads different bits of
 * the hash, so clip, pitch and volume vary independently.
 */
export function pickPegSound(
  rowNumber: number,
  slot: number,
  color: Color,
): Required<Omit<ClipPlay, "delayMs">> {
  const hash = hashPeg(rowNumber, slot, color);

  return {
    clip: PEG_CLIPS[(hash >>> 8) % PEG_CLIPS.length],
    // 0.92–1.08: a slightly different peg, not a different instrument.
    playbackRate: 0.92 + (((hash >>> 16) & 0xff) / 255) * 0.16,
    gain: 0.75 + ((hash >>> 24) / 255) * 0.25,
  };
}

/* Pulling a peg out: the same peg, lower and quieter. */
export function pickPegRemovedSound(
  rowNumber: number,
  slot: number,
  color: Color,
): ClipPlay {
  const sound = pickPegSound(rowNumber, slot, color);

  return {
    ...sound,
    playbackRate: sound.playbackRate * 0.8,
    gain: sound.gain * 0.6,
  };
}

/*
 * One tick per key peg, on the frame each one peaks in feedback-pop (70% of
 * the keyframes). Key pegs are smaller than code pegs, so they click higher;
 * bulls higher still, so the score can be heard: "tick tick tock".
 */
export function pickFeedbackTicks(black: number, white: number): ClipPlay[] {
  return Array.from({ length: black + white }, (_, index) => {
    const isBull = index < black;

    return {
      clip: PEG_CLIPS[index % PEG_CLIPS.length],
      playbackRate: isBull ? 1.6 : 1.25,
      gain: isBull ? 0.8 : 0.6,
      delayMs: index * FEEDBACK_STAGGER_MS + FEEDBACK_POP_MS * 0.7,
    };
  });
}

let audioContext: AudioContext | undefined;
let loading: Promise<void> | undefined;
const buffers = new Map<string, AudioBuffer>();

/*
 * Creates the context and decodes every clip once. Called when sound is
 * turned on, so the first peg doesn't wait for the network. The context starts
 * suspended outside a user gesture; playClip resumes it on a tap.
 */
export function loadSounds(): void {
  if (loading) return;

  audioContext = new AudioContext();
  const context = audioContext;
  loading = Promise.all(
    ALL_CLIPS.map(async (clip) => {
      const response = await fetch(`${import.meta.env.BASE_URL}sounds/${clip}`);
      buffers.set(
        clip,
        await context.decodeAudioData(await response.arrayBuffer()),
      );
    }),
  ).then(
    () => undefined,
    // Sound is decoration: a failed load leaves the game silent, not broken.
    () => {
      loading = undefined;
    },
  );
}

/* Call synchronously from the input handler so iOS treats it as a gesture. */
export function playClip({
  clip,
  playbackRate = 1,
  gain = 1,
  delayMs = 0,
}: ClipPlay): void {
  const buffer = buffers.get(clip);
  if (!audioContext || !buffer) return;

  if (audioContext.state === "suspended") void audioContext.resume();

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = playbackRate;
  const gainNode = audioContext.createGain();
  gainNode.gain.value = gain;
  source.connect(gainNode).connect(audioContext.destination);
  source.start(audioContext.currentTime + delayMs / 1000);
}
