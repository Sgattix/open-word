import { TRPCError } from "@trpc/server";
/**
 * Validates that a room exists and throws if not found
 */
export async function validateRoomExists(
  db: any,
  roomId: string,
): Promise<any> {
  const room = await db.room.findUnique({
    where: { id: roomId },
  });

  if (!room) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Room not found",
    });
  }

  return room;
}

/**
 * Validates that user is the room host
 */
export function validateIsHost(
  hostId: string,
  userId: string,
): void {
  if (hostId !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only host can perform this action",
    });
  }
}

/**
 * Validates a guess string
 */
export function validateGuess(
  guess: string,
  wordLength: number,
): string {
  const normalized = guess.trim().toUpperCase();

  if (!/^[A-Z]+$/.test(normalized)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Guesses must only contain letters",
    });
  }

  if (normalized.length !== wordLength) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Guess must be ${wordLength} letters long`,
    });
  }

  return normalized;
}

/**
 * Processes a correct guess and calculates score
 */
export function processCorrectGuess(
  startTime: number,
): { roundScore: number; timeTaken: number } {
  const timeTaken = Date.now() - startTime;
  const roundScore = Math.max(0, 1000 - Math.floor(timeTaken / 100));

  return { roundScore, timeTaken };
}

/**
 * Updates room player ranks based on cumulative scores
 */
export async function updatePlayerRanks(
  db: any,
  roomId: string,
): Promise<void> {
  const players = await db.roomPlayer.findMany({
    where: { roomId },
    orderBy: { finalScore: "desc" },
  });

  for (let i = 0; i < players.length; i++) {
    await db.roomPlayer.update({
      where: { id: players[i]!.id },
      data: { rank: i + 1 },
    });
  }
}

/**
 * Loads round scores for a player
 */
export function loadRoundScores(
  roundScoresJSON: string | null,
): number[] {
  return roundScoresJSON ? JSON.parse(roundScoresJSON) : [];
}

/**
 * Calculates total score from round scores
 */
export function calculateTotalScore(roundScores: number[]): number {
  return roundScores.reduce((sum, score) => sum + score, 0);
}

/**
 * Gets the game key for storing in-memory game state
 */
export function getGameKey(roomId: string, round: number): string {
  return `${roomId}_round_${round}`;
}




