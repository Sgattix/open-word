export interface GameState {
  gameId: string;
  wordLength: number;
  attemptsLeft: number;
  status: "playing" | "won" | "lost";
  guesses: Guess[];
  revealedWord: string | null;
}

export interface GameSettings {
  difficulty: Difficulty;
  wordLength: number;
  maxAttempts: number;
  hintsAllowed: number;
  customMultiplier?: number;
}

export interface GameScore {
  difficulty: Difficulty;
  score: number;
  timeTaken: number;
  guessesUsed: number;
  hintsUsed: number;
  attemptBonus: number;
  timeBonus: number;
  difficultyMultiplier: number;
}

export type Difficulty = "easy" | "normal" | "hard" | "impossible" | "custom";

export type Guess = {
  guess: string;
  feedback: ("correct" | "present" | "absent")[];
};
