import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";

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
};

const SOLO_GAMES = new Map<string, SoloGame>();
const DEFAULT_MAX_ATTEMPTS = 6;

function pickFallbackWord(length: number) {
  console.warn(
    `Failed to fetch a secret word of length ${length}, picking a fallback word`,
  );
  return "ERROR".substring(0, length);
}

async function fetchSecretWord(length: number) {
  const endpoint = new URL("https://random-words-api.kushcreates.com/api");
  endpoint.searchParams.set("length", length.toString());
  endpoint.searchParams.set("words", "1");
  endpoint.searchParams.set("lang", "en");

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
    return pickFallbackWord(length);
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
  };
}

const startGameInputSchema = z.object({
  mode: z.enum(["daily", "random"]).optional().default("random"),
  length: z.number().int().min(4).max(8).optional().default(5),
});

const gameIdSchema = z.object({
  gameId: z.string().min(1),
});

const submitGuessInputSchema = z.object({
  gameId: z.string().min(1),
  guess: z.string().min(1).max(16),
});

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  solo: router({
    startGame: publicProcedure
      .input(startGameInputSchema)
      .mutation(async ({ input }) => {
        const word = await fetchSecretWord(input.length);
        const game: SoloGame = {
          id: crypto.randomUUID(),
          word,
          status: "playing",
          maxAttempts: DEFAULT_MAX_ATTEMPTS,
          guesses: [],
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
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
});
export type AppRouter = typeof appRouter;
