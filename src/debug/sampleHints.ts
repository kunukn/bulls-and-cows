import type { Hint } from "@/features/game/hints";

/*
 * Example facts for every hint kind, for the bull-lines debug page. Keyed by
 * kind so a new kind fails `pnpm check` until it gets a sample here. Counts
 * cover each plural form the locales use (Arabic needs two, few and many).
 */
export const SAMPLE_HINTS: {
  [Kind in Hint["kind"]]: Extract<Hint, { kind: Kind }>[];
} = {
  rowHasAbsent: [{ kind: "rowHasAbsent", color: "red" }],
  rowSlotWrong: [{ kind: "rowSlotWrong", slot: 2, color: "blue" }],
  rowConflict: [{ kind: "rowConflict", row: 3 }],
  rowNoFit: [{ kind: "rowNoFit" }],
  rowFits: [{ kind: "rowFits" }],
  rowFitsSoFar: [{ kind: "rowFitsSoFar" }],
  absent: [{ kind: "absent", color: "orange" }],
  present: [
    { kind: "present", colors: ["green"] },
    { kind: "present", colors: ["red", "yellow", "purple"] },
  ],
  exactly: [
    { kind: "exactly", color: "yellow", count: 1 },
    { kind: "exactly", color: "yellow", count: 2 },
  ],
  atLeast: [
    { kind: "atLeast", color: "green", count: 2 },
    { kind: "atLeast", color: "green", count: 3 },
  ],
  atMostOne: [{ kind: "atMostOne", color: "cyan" }],
  slotIs: [{ kind: "slotIs", slot: 1, color: "purple" }],
  slotIsOneOf: [
    { kind: "slotIsOneOf", slot: 4, colors: ["red", "pink"] },
    { kind: "slotIsOneOf", slot: 5, colors: ["orange", "cyan", "blue"] },
  ],
  slotIsNot: [{ kind: "slotIsNot", slot: 3, color: "pink" }],
  colorInSlots: [
    { kind: "colorInSlots", color: "blue", slots: [1, 3] },
    { kind: "colorInSlots", color: "red", slots: [2, 4, 5] },
  ],
  noRepeats: [{ kind: "noRepeats" }],
  hasRepeat: [{ kind: "hasRepeat" }],
  codesLeft: [2, 5, 11, 100, 1296].map((count) => ({
    kind: "codesLeft" as const,
    count,
  })),
  oneLeft: [{ kind: "oneLeft" }],
};
