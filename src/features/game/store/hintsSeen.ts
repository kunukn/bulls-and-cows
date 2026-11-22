import { create } from "zustand";

/*
 * Which newsworthy hints (see newsworthyHintKeys) the player has already been
 * shown, so the shield bull's dot only shows for new ones. Keyed by the
 * game's `startedAt`, so a new game starts unseen. Not persisted: after a
 * reload the dot shows again if there's anything to tell.
 */
type HintsSeenStore = {
  gameId: number;
  keys: readonly string[];
  markSeen: (gameId: number, keys: readonly string[]) => void;
};

export const useHintsSeen = create<HintsSeenStore>()((set) => ({
  gameId: 0,
  keys: [],
  markSeen: (gameId, keys) => set({ gameId, keys }),
}));
