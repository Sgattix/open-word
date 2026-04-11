import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../index";

type FeedbackCell = "correct" | "present" | "absent";

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

const MULTIPLAYER_GAMES = new Map<
  string,
  {
    roomId: string;
    word: string;
    players: Map<
      string,
      {
        userId: string;
        status: "playing" | "won" | "lost";
        finishedAt: number | null;
        guessesUsed: number;
        roundScore: number;
      }
    >;
    startedAt: number;
  }
>();

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const multiplayerRouter = router({
  createRoom: protectedProcedure
    .input(
      z.object({
        difficulty: z.string(),
        wordLength: z.number(),
        language: z.string().default("en"),
        numRounds: z.number().int().min(1).max(10).default(3),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const code = generateRoomCode();

      const room = await ctx.db.room.create({
        data: {
          id: crypto.randomUUID(),
          code,
          hostId: ctx.session.user.id,
          difficulty: input.difficulty,
          wordLength: input.wordLength,
          language: input.language,
          numRounds: input.numRounds,
          status: "waiting",
        },
        include: {
          players: true,
        },
      });

      await ctx.db.roomPlayer.create({
        data: {
          id: crypto.randomUUID(),
          roomId: room.id,
          userId: ctx.session.user.id,
          guesses: "[]",
          roundScores: "[]",
        },
      });

      return {
        roomId: room.id,
        code: room.code,
      };
    }),

  joinRoom: protectedProcedure
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ input, ctx }) => {
      const room = await ctx.db.room.findUnique({
        where: { code: input.code },
        include: { players: true },
      });

      if (!room) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Room not found",
        });
      }

      if (room.status !== "waiting") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Room is not accepting joins",
        });
      }

      const existingPlayer = room.players.find(
        (p) => p.userId === ctx.session.user.id,
      );

      if (existingPlayer) {
        return {
          roomId: room.id,
          playerCount: room.players.length,
        };
      }

      await ctx.db.roomPlayer.create({
        data: {
          id: crypto.randomUUID(),
          roomId: room.id,
          userId: ctx.session.user.id,
          guesses: "[]",
          roundScores: "[]",
        },
      });

      return {
        roomId: room.id,
        playerCount: room.players.length + 1,
      };
    }),

  getRoomState: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .query(async ({ input, ctx }) => {
      const room = await ctx.db.room.findUnique({
        where: { id: input.roomId },
        include: {
          players: {
            include: {
              user: {
                select: { id: true, name: true, image: true },
              },
            },
          },
        },
      });

      if (!room) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Room not found",
        });
      }

      return {
        id: room.id,
        hostId: room.hostId,
        code: room.code,
        status: room.status,
        difficulty: room.difficulty,
        wordLength: room.wordLength,
        language: room.language,
        numRounds: room.numRounds,
        currentRound: room.currentRound,
        gameWord: room.gameWord,
        startedAt: room.startedAt,
        players: room.players.map((p) => ({
          userId: p.userId,
          userName: p.user.name,
          userImage: p.user.image,
          status: p.status,
          guessesUsed: p.guessesUsed,
          rank: p.rank,
          finalScore: p.finalScore,
          finishedAt: p.finishedAt,
        })),
      };
    }),

  startGame: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const room = await ctx.db.room.findUnique({
        where: { id: input.roomId },
        include: { players: true },
      });

      if (!room) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Room not found",
        });
      }

      if (room.hostId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only host can start the game",
        });
      }

      const isInitialStart = room.currentRound === 0;
      const isRoundProgression =
        room.status === "between_rounds" && room.currentRound < room.numRounds;

      if (!isInitialStart && !isRoundProgression) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot start game in current state",
        });
      }

      const nextRound = isInitialStart ? 1 : room.currentRound + 1;

      const endpoint = new URL("https://random-words-api.kushcreates.com/api");
      endpoint.searchParams.set("length", room.wordLength.toString());
      endpoint.searchParams.set("words", "1");
      endpoint.searchParams.set("language", room.language);

      const response = await fetch(endpoint);
      const payload = (await response.json()) as [{ word?: string }];
      const word = payload[0]?.word?.trim().toUpperCase();
      console.log(
        `Selected word for multiplayer game round ${nextRound}:`,
        word,
      );

      if (!word) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch word",
        });
      }

      const now = new Date();
      const updatedRoom = await ctx.db.room.update({
        where: { id: room.id },
        data: {
          status: "playing",
          gameWord: word,
          currentRound: nextRound,
          startedAt: isInitialStart ? now : room.startedAt, // Only update startedAt on initial start
        },
        include: { players: true },
      });

      // Reset player statuses for new round (but keep cumulative scores and guesses)
      if (!isInitialStart) {
        // For round progression, reset player status for new round
        for (const player of updatedRoom.players) {
          await ctx.db.roomPlayer.update({
            where: {
              roomId_userId: {
                roomId: input.roomId,
                userId: player.userId,
              },
            },
            data: {
              status: "playing", // Reset to playing for new round
              finishedAt: null, // Reset finish time for new round
            },
          });
        }
      }

      // Initialize in-memory game state for this round
      const gameState = new Map<
        string,
        {
          userId: string;
          status: "playing" | "won" | "lost";
          finishedAt: number | null;
          guessesUsed: number;
          roundScore: number;
        }
      >();

      for (const player of updatedRoom.players) {
        gameState.set(player.userId, {
          userId: player.userId,
          status: "playing",
          finishedAt: null,
          guessesUsed: 0,
          roundScore: 0,
        });
      }

      // Store with round-specific key
      const gameKey = `${room.id}_round_${nextRound}`;
      MULTIPLAYER_GAMES.set(gameKey, {
        roomId: room.id,
        word,
        players: gameState,
        startedAt: Date.now(),
      });

      return {
        roomId: room.id,
        wordLength: room.wordLength,
        currentRound: nextRound,
        totalRounds: room.numRounds,
      };
    }),

  // Submit a guess in multiplayer
  submitGuess: protectedProcedure
    .input(
      z.object({
        roomId: z.string(),
        guess: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const room = await ctx.db.room.findUnique({
        where: { id: input.roomId },
      });

      if (!room) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Room not found",
        });
      }

      // Get the current round's game state
      const gameKey = `${input.roomId}_round_${room.currentRound}`;
      const gameState = MULTIPLAYER_GAMES.get(gameKey);

      if (!gameState) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      const playerState = gameState.players.get(ctx.session.user.id);
      if (!playerState) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Player not in this game",
        });
      }

      if (playerState.status !== "playing") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Game already finished for this player",
        });
      }

      const normalizedGuess = input.guess.trim().toUpperCase();

      if (!/^[A-Z]+$/.test(normalizedGuess)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Guesses must only contain letters",
        });
      }

      if (normalizedGuess.length !== gameState.word.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Guess must be ${gameState.word.length} letters long`,
        });
      }

      playerState.guessesUsed += 1;
      const feedback = evaluateGuess(normalizedGuess, gameState.word);

      // Check if guess is correct
      if (normalizedGuess === gameState.word) {
        const timeTaken = Date.now() - gameState.startedAt;
        playerState.status = "won";
        playerState.finishedAt = Date.now();
        playerState.roundScore = Math.max(
          0,
          1000 - Math.floor(timeTaken / 100),
        );

        // Load existing round scores
        const roomPlayer = await ctx.db.roomPlayer.findUnique({
          where: {
            roomId_userId: {
              roomId: input.roomId,
              userId: ctx.session.user.id,
            },
          },
        });

        const roundScores: number[] = roomPlayer?.roundScores
          ? JSON.parse(roomPlayer.roundScores)
          : [];
        roundScores[room.currentRound - 1] = playerState.roundScore;

        const totalScore = roundScores.reduce((a, b) => a + b, 0);

        // Update database
        await ctx.db.roomPlayer.update({
          where: {
            roomId_userId: {
              roomId: input.roomId,
              userId: ctx.session.user.id,
            },
          },
          data: {
            status: "won",
            guessesUsed:
              (roomPlayer?.guessesUsed || 0) + playerState.guessesUsed,
            finalScore: totalScore,
            roundScores: JSON.stringify(roundScores),
            finishedAt: new Date(),
          },
        });

        return {
          correct: true,
          feedback,
          score: playerState.roundScore,
          totalScore,
          timeTaken,
        };
      }

      // Update database with incorrect guess count
      const roomPlayer = await ctx.db.roomPlayer.findUnique({
        where: {
          roomId_userId: {
            roomId: input.roomId,
            userId: ctx.session.user.id,
          },
        },
      });

      await ctx.db.roomPlayer.update({
        where: {
          roomId_userId: {
            roomId: input.roomId,
            userId: ctx.session.user.id,
          },
        },
        data: {
          guessesUsed: (roomPlayer?.guessesUsed || 0) + playerState.guessesUsed,
        },
      });

      return {
        correct: false,
        feedback,
        guessesUsed: playerState.guessesUsed,
      };
    }),

  // End current round and prepare for next
  endRound: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const room = await ctx.db.room.findUnique({
        where: { id: input.roomId },
        include: {
          players: {
            orderBy: [{ finalScore: "desc" }],
          },
        },
      });

      if (!room) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Room not found",
        });
      }

      if (room.hostId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only host can end round",
        });
      }

      // Update player ranks based on current cumulative scores
      const roomPlayers = await ctx.db.roomPlayer.findMany({
        where: { roomId: input.roomId },
      });

      const playersWithScores = roomPlayers.map((p) => ({
        ...p,
        roundScores: JSON.parse(p.roundScores || "[]") as number[],
      }));

      playersWithScores.sort((a, b) => b.finalScore - a.finalScore);

      for (let i = 0; i < playersWithScores.length; i++) {
        await ctx.db.roomPlayer.update({
          where: { id: playersWithScores[i]!.id },
          data: { rank: i + 1 },
        });
      }

      const isLastRound = room.currentRound >= room.numRounds;

      // Clean up current round's in-memory state
      const gameKey = `${input.roomId}_round_${room.currentRound}`;
      MULTIPLAYER_GAMES.delete(gameKey);

      if (isLastRound) {
        // Mark game as finished
        await ctx.db.room.update({
          where: { id: input.roomId },
          data: {
            status: "finished",
            finishedAt: new Date(),
          },
        });

        return {
          roundEnded: true,
          isLastRound: true,
          nextRound: null,
          canContinue: false,
        };
      } else {
        // Move to between_rounds state
        await ctx.db.room.update({
          where: { id: input.roomId },
          data: {
            status: "between_rounds",
          },
        });

        return {
          roundEnded: true,
          isLastRound: false,
          nextRound: room.currentRound + 1,
          canContinue: true,
        };
      }
    }),

  // Get live leaderboard
  getLeaderboard: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .query(async ({ input, ctx }) => {
      const room = await ctx.db.room.findUnique({
        where: { id: input.roomId },
        include: {
          players: {
            include: {
              user: {
                select: { name: true, image: true },
              },
            },
            orderBy: [{ status: "asc" }, { finishedAt: "asc" }],
          },
        },
      });

      if (!room) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Room not found",
        });
      }

      return room.players.map((p, index) => ({
        rank: index + 1,
        userId: p.userId,
        userName: p.user.name,
        userImage: p.user.image,
        status: p.status,
        guessesUsed: p.guessesUsed,
        score: p.finalScore,
        finishedAt: p.finishedAt?.toISOString(),
      }));
    }),

  // Finish game and save results
  finishGame: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const room = await ctx.db.room.findUnique({
        where: { id: input.roomId },
        include: {
          players: {
            orderBy: [{ finalScore: "desc" }],
          },
        },
      });

      if (!room) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Room not found",
        });
      }

      // Save multiplayer game result
      const results = room.players.map((p, index) => ({
        userId: p.userId,
        rank: p.rank || index + 1,
        totalScore: p.finalScore,
        guessesUsed: p.guessesUsed,
        status: p.status,
        roundScores: JSON.parse(p.roundScores || "[]"),
      }));

      await ctx.db.multiplayerGame.create({
        data: {
          id: crypto.randomUUID(),
          roomId: room.id,
          difficulty: room.difficulty,
          wordLength: room.wordLength,
          gameWord: "", // Don't store words for privacy
          language: room.language,
          results: JSON.stringify(results),
        },
      });

      // Mark room as finished (if not already)
      if (room.status !== "finished") {
        await ctx.db.room.update({
          where: { id: input.roomId },
          data: {
            status: "finished",
            finishedAt: new Date(),
          },
        });
      }

      // Clean up all in-memory states
      for (let r = 1; r <= room.currentRound; r++) {
        const gameKey = `${input.roomId}_round_${r}`;
        MULTIPLAYER_GAMES.delete(gameKey);
      }

      return { success: true };
    }),
});
