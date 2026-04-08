import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import confetti from "canvas-confetti";
import type { Difficulty, GameScore, GameSettings } from "@/types/game";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const runConfettiAnimation = (duration = 3000) => {
  const end = Date.now() + duration;
  const colors = ["#4ade80", "#22c55e", "#16a34a", "#15803d"];

  const frame = () => {
    if (Date.now() > end) return;

    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      startVelocity: 60,
      origin: { x: 0, y: 0.5 },
      colors: colors,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      startVelocity: 60,
      origin: { x: 1, y: 0.5 },
      colors: colors,
    });

    requestAnimationFrame(frame);
  };

  frame();
};

export const calculateCustomMultiplier = (
  wordLength: number,
  maxAttempts: number,
  hintsAllowed: number,
): number => {
  let multiplier = 1.0;

  multiplier += (wordLength - 4) * 0.35;

  const attemptsDifficulty = Math.max(0, 6 - maxAttempts) * 0.25;
  multiplier += attemptsDifficulty;

  const hintsDifficulty = (2 - Math.min(2, hintsAllowed)) * 0.4;
  multiplier += hintsDifficulty;

  return Math.round(Math.max(0.5, Math.min(5, multiplier)) * 100) / 100;
};

export const calculateScore = (
  game: any,
  settings: GameSettings,
  hintsUsed: number,
  gameDuration: number,
): GameScore => {
  const guessesUsed = game.guesses.length;
  const maxAttempts = settings.maxAttempts;
  const difficultyMultipliers: Record<Exclude<Difficulty, "custom">, number> = {
    easy: 1,
    normal: 1.5,
    hard: 2.5,
    impossible: 4,
  };

  const multiplier =
    settings.difficulty === "custom"
      ? settings.customMultiplier || 1
      : difficultyMultipliers[settings.difficulty];

  const attemptBonus = Math.max(0, (maxAttempts - guessesUsed) * 50);

  const timeBonus = Math.max(0, 300 - gameDuration * 3);

  const baseScore = 500 + attemptBonus + timeBonus;

  const finalScore = Math.round(baseScore * multiplier);

  return {
    difficulty: settings.difficulty,
    score: finalScore,
    timeTaken: gameDuration,
    guessesUsed,
    hintsUsed,
    attemptBonus,
    timeBonus,
    difficultyMultiplier: multiplier,
  };
};