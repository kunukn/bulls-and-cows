/*
 * Column layout shared by GuessRow, FeedbackPegs and the secret-code row in
 * Board, so the secret pegs line up with the guess pegs:
 * row number | pegs (centred) | feedback.
 */
export const ROW_LAYOUT = "flex items-center gap-3 px-2";
export const NUMBER_COLUMN = "w-5 shrink-0";
export const PEGS_COLUMN = "flex flex-1 justify-center gap-2 desk:gap-2.5";
export const FEEDBACK_COLUMN = "w-10 shrink-0 desk:w-13";

/* One size for every board circle: guess pegs and the hidden `?` code pegs. */
export const PEG_SIZE = "size-8 sm:size-9 desk:size-11";
