/*
 * Base for the main actions in the bottom dock and the result panels: Undo,
 * Check, Save score, New game, Share and their neighbours. One stated height:
 * 44px is the tap target, and a panel that swaps one action for another does
 * not jump. Each button adds its own colours, padding and text size.
 */
export const ACTION_BUTTON_CLASS =
  "flex min-h-11 items-center justify-center gap-1.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
