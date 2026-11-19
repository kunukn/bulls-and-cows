import { hashPeg } from "@/features/game/components/Peg";
import type { Color } from "@/features/game/logic";

/* Kenney "Impact Sounds" (CC0), trimmed with ffmpeg; see public/sounds/LICENSE.md. */
const PEG_SOUND_URLS = [1, 2, 3, 4, 5].map(
  (number) => `${import.meta.env.BASE_URL}sounds/peg-${number}.wav`,
);

export type PegSound = {
  clipIndex: number;
  playbackRate: number;
  gain: number;
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
): PegSound {
  const hash = hashPeg(rowNumber, slot, color);

  return {
    clipIndex: (hash >>> 8) % PEG_SOUND_URLS.length,
    // 0.92–1.08: a slightly different peg, not a different instrument.
    playbackRate: 0.92 + (((hash >>> 16) & 0xff) / 255) * 0.16,
    gain: 0.75 + ((hash >>> 24) / 255) * 0.25,
  };
}

let audioContext: AudioContext | undefined;
let buffers: Promise<AudioBuffer[]> | undefined;
let loadedBuffers: AudioBuffer[] = [];

/*
 * Creates the context and decodes the clips once. Called when sound is turned
 * on, so the first peg doesn't wait for the network. The context starts
 * suspended outside a user gesture; playPegSound resumes it on a tap.
 */
export function loadPegSounds(): void {
  if (buffers) return;

  audioContext = new AudioContext();
  const context = audioContext;
  buffers = Promise.all(
    PEG_SOUND_URLS.map(async (url) => {
      const response = await fetch(url);

      return context.decodeAudioData(await response.arrayBuffer());
    }),
  );
  buffers.then(
    (decoded) => {
      loadedBuffers = decoded;
    },
    // Sound is decoration: a failed load leaves the game silent, not broken.
    () => {
      buffers = undefined;
    },
  );
}

/* Call synchronously from the input handler so iOS treats it as a gesture. */
export function playPegSound(sound: PegSound): void {
  const buffer = loadedBuffers[sound.clipIndex];
  if (!audioContext || !buffer) return;

  if (audioContext.state === "suspended") void audioContext.resume();

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = sound.playbackRate;
  const gainNode = audioContext.createGain();
  gainNode.gain.value = sound.gain;
  source.connect(gainNode).connect(audioContext.destination);
  source.start();
}
