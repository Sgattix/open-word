import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { evaluateGuess } from "../game/evaluator";
import {
  validateIsHost,
  validateGuess,
  processCorrectGuess,
  updatePlayerRanks,
  loadRoundScores,
  calculateTotalScore,
  getGameKey,
} from "./multiplayer-helpers";

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
    roundEndsAt: number;
    timePerRound: number;
  }
>();

const ROOM_TIME_PER_ROUND = new Map<string, number>();

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
        timePerRound: z.number().int().min(15).max(300).default(60),
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

      ROOM_TIME_PER_ROUND.set(room.id, input.timePerRound);

      return {
        roomId: room.id,
        code: room.code,
        timePerRound: input.timePerRound,
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

      const timePerRound = ROOM_TIME_PER_ROUND.get(room.id) ?? 60;
      const activeRoundState = MULTIPLAYER_GAMES.get(
        getGameKey(room.id, room.currentRound),
      );

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
        timePerRound,
        roundEndsAt: activeRoundState?.roundEndsAt
          ? new Date(activeRoundState.roundEndsAt).toISOString()
          : null,
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

      validateIsHost(room.hostId, ctx.session.user.id);

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
      const timePerRound = ROOM_TIME_PER_ROUND.get(room.id) ?? 60;

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
      MULTIPLAYER_GAMES.set(getGameKey(input.roomId, nextRound), {
        roomId: room.id,
        word,
        players: gameState,
        startedAt: Date.now(),
        roundEndsAt: Date.now() + timePerRound * 1000,
        timePerRound,
      });

      return {
        roomId: room.id,
        wordLength: room.wordLength,
        currentRound: nextRound,
        totalRounds: room.numRounds,
        timePerRound,
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
      const gameState = MULTIPLAYER_GAMES.get(
        getGameKey(input.roomId, room.currentRound),
      );

      if (!gameState) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      if (Date.now() > gameState.roundEndsAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Round time is over",
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

      const normalizedGuess = validateGuess(input.guess, gameState.word.length);

      playerState.guessesUsed += 1;
      const feedback = evaluateGuess(normalizedGuess, gameState.word);

      // Check if guess is correct
      if (normalizedGuess === gameState.word) {
        const { roundScore, timeTaken } = processCorrectGuess(
          gameState.startedAt,
        );
        playerState.status = "won";
        playerState.finishedAt = Date.now();
        playerState.roundScore = roundScore;

        // Load existing round scores
        const roomPlayer = await ctx.db.roomPlayer.findUnique({
          where: {
            roomId_userId: {
              roomId: input.roomId,
              userId: ctx.session.user.id,
            },
          },
        });

        const roundScores = loadRoundScores(roomPlayer?.roundScores ?? null);
        roundScores[room.currentRound - 1] = playerState.roundScore;

        const totalScore = calculateTotalScore(roundScores);

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

      validateIsHost(room.hostId, ctx.session.user.id);

      // Update player ranks
      await updatePlayerRanks(ctx.db, input.roomId);

      const isLastRound = room.currentRound >= room.numRounds;

      // Clean up current round's in-memory state
      MULTIPLAYER_GAMES.delete(getGameKey(input.roomId, room.currentRound));

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
        MULTIPLAYER_GAMES.delete(getGameKey(input.roomId, r));
      }

      ROOM_TIME_PER_ROUND.delete(input.roomId);

      return { success: true };
    }),
});

