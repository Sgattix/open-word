/**
 * Shared validation schemas for game APIs.
 * Used across solo and multiplayer routers.
 */

import { z } from "zod";

// Core game schemas
export const gameIdSchema = z.object({
  gameId: z.string().min(1),
});

export const submitGuessInputSchema = z.object({
  gameId: z.string().min(1),
  guess: z.string().min(1).max(16),
});

// Solo mode schemas
export const startGameInputSchema = z.object({
  mode: z.enum(["daily", "random"]).optional().default("random"),
  length: z.number().int().min(4).max(8).optional().default(5),
  maxAttempts: z.number().int().min(3).max(12).optional().default(6),
  hintsAllowed: z.number().int().min(0).optional().default(2),
  language: z.string().optional().default("en"),
});

export const saveGameInputSchema = z.object({
  difficulty: z.string(),
  wordLength: z.number().int(),
  guessWord: z.string(),
  status: z.enum(["won", "lost"]),
  guessesUsed: z.number().int(),
  attemptsLeft: z.number().int(),
  hintsUsed: z.number().int(),
  timeTaken: z.number().int(),
  score: z.number().int(),
  attemptBonus: z.number().int(),
  timeBonus: z.number().int(),
  difficultyMultiplier: z.number(),
  guesses: z.array(
    z.object({
      guess: z.string(),
      feedback: z.array(z.enum(["correct", "present", "absent"])),
    }),
  ),
});

export const gameHistoryInputSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  difficulty: z.string().optional(),
});

// Multiplayer schemas
export const createRoomInputSchema = z.object({
  difficulty: z.string(),
  wordLength: z.number(),
  language: z.string().default("en"),
  numRounds: z.number().int().min(1).max(10).default(3),
});

export const joinRoomInputSchema = z.object({
  code: z.string().length(6),
});

export const getRoomStateInputSchema = z.object({
  roomId: z.string(),
});

export const startRoundInputSchema = z.object({
  roomId: z.string(),
});

export const submitRoundGuessInputSchema = z.object({
  roomId: z.string(),
  guess: z.string().min(1).max(16),
});

export const finishGameInputSchema = z.object({
  roomId: z.string(),
});
