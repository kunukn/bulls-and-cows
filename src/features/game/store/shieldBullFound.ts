import { create } from "zustand";
import { persist } from "zustand/middleware";

/*
 * Whether the player has ever asked the shield bull. Until then an idle
 * shield knocks now and then to show the bull is there (0011); after that it
 * never asks again. Not a setting, so resetting settings doesn't bring the
 * knock back.
 */
type ShieldBullFoundStore = {
  hasFound: boolean;
  markFound: () => void;
};

export const useShieldBullFound = create<ShieldBullFoundStore>()(
  persist(
    (set) => ({
      hasFound: false,
      markFound: () => set({ hasFound: true }),
    }),
    { name: "app:shield-bull-found" },
  ),
);
