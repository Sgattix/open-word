import type { Difficulty, GameSettings } from "@/types";

export const DIFFICULTY_PRESETS: Record<
  Exclude<Difficulty, "custom">,
  GameSettings
> = {
  easy: {
    difficulty: "easy",
    wordLength: 4,
    maxAttempts: 8,
    hintsAllowed: 3,
  },
  normal: {
    difficulty: "normal",
    wordLength: 5,
    maxAttempts: 6,
    hintsAllowed: 2,
  },
  hard: {
    difficulty: "hard",
    wordLength: 6,
    maxAttempts: 5,
    hintsAllowed: 1,
  },
  impossible: {
    difficulty: "impossible",
    wordLength: 7,
    maxAttempts: 4,
    hintsAllowed: 0,
  },
};

export const DEFAULT_WORD_LENGTH = 5;
