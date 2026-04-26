/**
 * Core game logic for WORDLE-style guess evaluation.
 * Used by both solo and multiplayer modes.
 */

export type FeedbackCell = "correct" | "present" | "absent";

export type GuessRecord = {
  guess: string;
  feedback: FeedbackCell[];
};

/**
 * Evaluate a single guess against the secret word.
 * Returns feedback array where each position indicates:
 * - "correct": letter is in the word and in correct position
 * - "present": letter is in the word but wrong position
 * - "absent": letter is not in the word
 */
export function evaluateGuess(guess: string, word: string): FeedbackCell[] {
  const feedback: FeedbackCell[] = new Array(word.length).fill("absent");
  const remainingLetters = new Map<string, number>();

  // First pass: mark correct positions and count remaining letters
  for (let index = 0; index < word.length; index += 1) {
    const wordLetter = word[index]!;
    const guessLetter = guess[index]!;

    if (guessLetter === wordLetter) {
      feedback[index] = "correct";
      continue;
    }

    remainingLetters.set(
      wordLetter,
      (remainingLetters.get(wordLetter) ?? 0) + 1,
    );
  }

  // Second pass: mark present letters (avoiding double-counting)
  for (let index = 0; index < word.length; index += 1) {
    if (feedback[index] === "correct") {
      continue;
    }

    const guessLetter = guess[index]!;
    const count = remainingLetters.get(guessLetter) ?? 0;

    if (count > 0) {
      feedback[index] = "present";
      remainingLetters.set(guessLetter, count - 1);
    }
  }

  return feedback;
}
