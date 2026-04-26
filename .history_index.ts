import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";
import { multiplayerRouter } from "./multiplayer";

type FeedbackCell = "correct" | "present" | "absent";

type GuessRecord = {
  guess: string;
  feedback: FeedbackCell[];
};

type SoloGame = {
  id: string;
  word: string;
  status: "playing" | "won" | "lost";
  maxAttempts: number;
  guesses: GuessRecord[];
  hintedLetters: { [position: number]: string };
  hintsUsed: number;
  hintsAllowed: number;
};

const SOLO_GAMES = new Map<string, SoloGame>();

async function fetchSecretWord(
  length: number,
  language: string = "en",
): Promise<string> {
  const endpoint = new URL("https://random-words-api.kushcreates.com/api");
  endpoint.searchParams.set("length", length.toString());
  endpoint.searchParams.set("words", "1");
  endpoint.searchParams.set("language", language);

  try {
    const response = await fetch(endpoint, {
      method: "GET",
    });

    const payload = (await response.json()) as [{ word?: string }];
    console.log("Received response from secret word API:", payload);

    const word = payload[0]?.word?.trim().toUpperCase();
    console.log(`Fetched secret word: ${word}`);

    return word as string;
  } catch {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch a secret word",
    });
  }
}

function evaluateGuess(guess: string, word: string) {
  const feedback: FeedbackCell[] = new Array(word.length).fill("absent");
  const remainingLetters = new Map<string, number>();

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

function toPublicGameState(game: SoloGame) {
  return {
    gameId: game.id,
    wordLength: game.word.length,
    attemptsLeft: game.maxAttempts - game.guesses.length,
    status: game.status,
    guesses: game.guesses,
    revealedWord: game.status === "playing" ? null : game.word,
    hintedLetters: game.hintedLetters,
  };
}

const startGameInputSchema = z.object({
  mode: z.enum(["daily", "random"]).optional().default("random"),
  length: z.number().int().min(4).max(8).optional().default(5),
  maxAttempts: z.number().int().min(3).max(12).optional().default(6),
  hintsAllowed: z.number().int().min(0).optional().default(2),
  language: z.string().optional().default("en"),
});

const gameIdSchema = z.object({
  gameId: z.string().min(1),
});

const submitGuessInputSchema = z.object({
  gameId: z.string().min(1),
  guess: z.string().min(1).max(16),
});

const saveGameInputSchema = z.object({
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

const gameHistoryInputSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  difficulty: z.string().optional(),
});

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  solo: router({
    startGame: publicProcedure
      .input(startGameInputSchema)
      .mutation(async ({ input }) => {
        const word = await fetchSecretWord(input.length, input.language);
        const game: SoloGame = {
          id: crypto.randomUUID(),
          word,
          status: "playing",
          maxAttempts: input.maxAttempts,
          guesses: [],
          hintedLetters: {},
          hintsUsed: 0,
          hintsAllowed: input.hintsAllowed,
        };

        SOLO_GAMES.set(game.id, game);

        return toPublicGameState(game);
      }),
    getGameState: publicProcedure.input(gameIdSchema).query(({ input }) => {
      const game = SOLO_GAMES.get(input.gameId);

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      return toPublicGameState(game);
    }),
    submitGuess: publicProcedure
      .input(submitGuessInputSchema)
      .mutation(({ input }) => {
        const game = SOLO_GAMES.get(input.gameId);

        if (!game) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Game not found",
          });
        }

        if (game.status !== "playing") {
          return toPublicGameState(game);
        }

        const normalizedGuess = input.guess.trim().toUpperCase();

        if (!/^[A-Z]+$/.test(normalizedGuess)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Guesses must only contain letters",
          });
        }

        if (normalizedGuess.length !== game.word.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Guess must be ${game.word.length} letters long`,
          });
        }

        const feedback = evaluateGuess(normalizedGuess, game.word);
        game.guesses.push({
          guess: normalizedGuess,
          feedback,
        });

        if (normalizedGuess === game.word) {
          game.status = "won";
        } else if (game.guesses.length >= game.maxAttempts) {
          game.status = "lost";
        }

        return toPublicGameState(game);
      }),
    useHint: publicProcedure.input(gameIdSchema).mutation(({ input }) => {
      const game = SOLO_GAMES.get(input.gameId);

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      if (game.status !== "playing") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot use hint on a finished game",
        });
      }

      if (game.hintsUsed >= game.hintsAllowed) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No hints remaining",
        });
      }

      // Find unrevealed letters
      const availablePositions: number[] = [];
      for (let i = 0; i < game.word.length; i++) {
        if (!(i in game.hintedLetters)) {
          availablePositions.push(i);
        }
      }

      if (availablePositions.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "All letters already revealed",
        });
      }

      // Pick a random unrevealed position
      const randomIndex = Math.floor(Math.random() * availablePositions.length);
      const position = availablePositions[randomIndex]!;
      game.hintedLetters[position] = game.word[position]!;
      game.hintsUsed += 1;

      return toPublicGameState(game);
    }),
    saveGame: protectedProcedure
      .input(saveGameInputSchema)
      .mutation(async ({ input, ctx }) => {
        const game = await ctx.db.game.create({
          data: {
            id: crypto.randomUUID(),
            userId: ctx.session.user.id,
            difficulty: input.difficulty,
            wordLength: input.wordLength,
            guessWord: input.guessWord,
            status: input.status,
            guessesUsed: input.guessesUsed,
            attemptsLeft: input.attemptsLeft,
            hintsUsed: input.hintsUsed,
            timeTaken: input.timeTaken,
            score: input.score,
            attemptBonus: input.attemptBonus,
            timeBonus: input.timeBonus,
            difficultyMultiplier: input.difficultyMultiplier,
            guesses: JSON.stringify(input.guesses),
          },
        });

        return {
          id: game.id,
          createdAt: game.createdAt,
          score: game.score,
        };
      }),
  }),
  gameHistory: protectedProcedure
    .input(gameHistoryInputSchema)
    .query(async ({ input, ctx }) => {
      const where: Record<string, unknown> = {
        userId: ctx.session.user.id,
      };

      if (input.difficulty) {
        where.difficulty = input.difficulty;
      }

      const games = await ctx.db.game.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
        select: {
          id: true,
          difficulty: true,
          wordLength: true,
          status: true,
          score: true,
          guessesUsed: true,
          hintsUsed: true,
          timeTaken: true,
          createdAt: true,
        },
      });

      const total = await ctx.db.game.count({
        where,
      });

      return {
        games,
        total,
        hasMore: input.offset + games.length < total,
      };
    }),
  userStats: protectedProcedure.query(async ({ ctx }) => {
    const games = await ctx.db.game.findMany({
      where: { userId: ctx.session.user.id },
      select: {
        status: true,
        score: true,
        difficulty: true,
        guessesUsed: true,
        timeTaken: true,
      },
    });

    if (games.length === 0) {
      return {
        totalGames: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        averageScore: 0,
        averageGuesses: 0,
        averageTime: 0,
        bestScore: 0,
        difficultyBreakdown: {},
      };
    }

    const stats = {
      totalGames: games.length,
      wins: games.filter((g) => g.status === "won").length,
      losses: games.filter((g) => g.status === "lost").length,
      winRate: 0,
      averageScore: 0,
      averageGuesses: 0,
      averageTime: 0,
      bestScore: 0,
      difficultyBreakdown: {} as Record<
        string,
        { wins: number; losses: number; avgScore: number }
      >,
    };

    stats.winRate = (stats.wins / stats.totalGames) * 100;
    stats.averageScore = Math.round(
      games.reduce((acc, g) => acc + g.score, 0) / games.length,
    );
    stats.averageGuesses = Math.round(
      games.reduce((acc, g) => acc + g.guessesUsed, 0) / games.length,
    );
    stats.averageTime = Math.round(
      games.reduce((acc, g) => acc + g.timeTaken, 0) / games.length,
    );
    stats.bestScore = Math.max(...games.map((g) => g.score));

    // Breakdown by difficulty
    const difficultyGroups = games.reduce(
      (acc, game) => {
        if (!acc[game.difficulty]) {
          acc[game.difficulty] = [];
        }
        acc[game.difficulty]!.push(game);
        return acc;
      },
      {} as Record<string, typeof games>,
    );

    for (const [difficulty, diffGames] of Object.entries(difficultyGroups)) {
      const wins = diffGames.filter((g) => g.status === "won").length;
      const avgScore = Math.round(
        diffGames.reduce((acc, g) => acc + g.score, 0) / diffGames.length,
      );
      stats.difficultyBreakdown[difficulty] = {
        wins,
        losses: diffGames.length - wins,
        avgScore,
      };
    }

    return stats;
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  multiplayer: multiplayerRouter,
});
export type AppRouter = typeof appRouter;
