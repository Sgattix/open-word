"use client";

import { useState, useEffect, useMemo } from "react";
import { useMultiplayer } from "@/context/MultiplayerContext";
import { authClient } from "@/lib/auth-client";

type GuessFeedback = "correct" | "present" | "absent";
export type GuessEntry = { guess: string; feedback: GuessFeedback[] };

/**
 * Manages core game state for multiplayer
 */
export function useMultiplayerGameState() {
  const [guess, setGuess] = useState("");
  const [guesses, setGuesses] = useState<GuessEntry[]>([]);
  const [userFinished, setUserFinished] = useState(false);
  const [userScore, setUserScore] = useState(0);
  const [wordLength, setWordLength] = useState(5);
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(3);
  const [isHost, setIsHost] = useState(false);
  const [roomStatus, setRoomStatus] = useState<string>("playing");
  const [gameStartedAtMs, setGameStartedAtMs] = useState<number | null>(null);
  const [globalElapsedSeconds, setGlobalElapsedSeconds] = useState(0);
  const [timePerRoundSeconds, setTimePerRoundSeconds] = useState(60);
  const [roundEndsAtMs, setRoundEndsAtMs] = useState<number | null>(null);
  const [roundRemainingSeconds, setRoundRemainingSeconds] = useState(60);

  return {
    guess,
    setGuess,
    guesses,
    setGuesses,
    userFinished,
    setUserFinished,
    userScore,
    setUserScore,
    wordLength,
    setWordLength,
    currentRound,
    setCurrentRound,
    totalRounds,
    setTotalRounds,
    isHost,
    setIsHost,
    roomStatus,
    setRoomStatus,
    gameStartedAtMs,
    setGameStartedAtMs,
    globalElapsedSeconds,
    setGlobalElapsedSeconds,
    timePerRoundSeconds,
    setTimePerRoundSeconds,
    roundEndsAtMs,
    setRoundEndsAtMs,
    roundRemainingSeconds,
    setRoundRemainingSeconds,
  };
}

/**
 * Manages UI state for leaderboard animations and displays
 */
export function useMultiplayerUIState() {
  const [lastSeenRound, setLastSeenRound] = useState(0);
  const [showFinalLeaderboard, setShowFinalLeaderboard] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);

  return {
    lastSeenRound,
    setLastSeenRound,
    showFinalLeaderboard,
    setShowFinalLeaderboard,
    revealedCount,
    setRevealedCount,
  };
}

/**
 * Synchronizes room state from server to local state
 */
export function useRoomStateSync(
  roomData: any,
  gameState: ReturnType<typeof useMultiplayerGameState>,
) {
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (roomData) {
      gameState.setWordLength(roomData.wordLength);
      gameState.setCurrentRound(roomData.currentRound);
      gameState.setTotalRounds(roomData.numRounds);
      gameState.setIsHost(roomData.hostId === session?.user?.id);
      gameState.setRoomStatus(roomData.status);
      gameState.setTimePerRoundSeconds(roomData.timePerRound ?? 60);

      const startedAtMs = roomData.startedAt
        ? new Date(roomData.startedAt).getTime()
        : null;
      gameState.setGameStartedAtMs(startedAtMs);

      const roundEndsAtMs = roomData.roundEndsAt
        ? new Date(roomData.roundEndsAt).getTime()
        : null;
      gameState.setRoundEndsAtMs(roundEndsAtMs);

      if (startedAtMs) {
        gameState.setGlobalElapsedSeconds(
          Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)),
        );
      }

      if (roundEndsAtMs) {
        gameState.setRoundRemainingSeconds(
          Math.max(0, Math.ceil((roundEndsAtMs - Date.now()) / 1000)),
        );
      } else {
        gameState.setRoundRemainingSeconds(roomData.timePerRound ?? 60);
      }
    }
  }, [roomData, session?.user?.id, gameState]);
}

/**
 * Maintains a synchronized global timer for the whole multiplayer match.
 */
export function useGlobalGameTimer(
  gameStartedAtMs: number | null,
  roomStatus: string,
  setGlobalElapsedSeconds: (seconds: number) => void,
) {
  useEffect(() => {
    if (!gameStartedAtMs || roomStatus === "waiting") {
      setGlobalElapsedSeconds(0);
      return;
    }

    const updateElapsed = () => {
      setGlobalElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - gameStartedAtMs) / 1000)),
      );
    };

    updateElapsed();

    if (roomStatus === "finished") {
      return;
    }

    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [gameStartedAtMs, roomStatus, setGlobalElapsedSeconds]);
}

/**
 * Maintains a synchronized per-round countdown timer for all players.
 */
export function useRoundCountdownTimer(
  roundEndsAtMs: number | null,
  roomStatus: string,
  timePerRoundSeconds: number,
  setRoundRemainingSeconds: (seconds: number) => void,
) {
  useEffect(() => {
    if (!roundEndsAtMs || roomStatus !== "playing") {
      setRoundRemainingSeconds(timePerRoundSeconds);
      return;
    }

    const updateRemaining = () => {
      setRoundRemainingSeconds(
        Math.max(0, Math.ceil((roundEndsAtMs - Date.now()) / 1000)),
      );
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 500);
    return () => clearInterval(interval);
  }, [
    roundEndsAtMs,
    roomStatus,
    timePerRoundSeconds,
    setRoundRemainingSeconds,
  ]);
}

/**
 * Handles round transitions
 */
export function useRoundTransition(
  currentRound: number,
  lastSeenRound: number,
  gameState: ReturnType<typeof useMultiplayerGameState>,
  uiState: ReturnType<typeof useMultiplayerUIState>,
) {
  useEffect(() => {
    if (currentRound > 0 && currentRound !== lastSeenRound) {
      gameState.setGuesses([]);
      gameState.setGuess("");
      gameState.setUserFinished(false);
      gameState.setUserScore(0);
      uiState.setLastSeenRound(currentRound);
    }
  }, [currentRound, lastSeenRound, gameState, uiState]);
}

/**
 * Synchronizes leaderboard data to player list
 */
export function useLeaderboardSync(
  leaderboardData: any,
  setPlayers: (players: any[]) => void,
) {
  useEffect(() => {
    if (leaderboardData) {
      setPlayers(
        leaderboardData.map((p: any) => ({
          userId: p.userId,
          userName: p.userName,
          userImage: p.userImage,
          status: p.status as "won" | "lost" | "playing",
          guessesUsed: p.guessesUsed,
          rank: p.rank,
          score: p.score,
        })),
      );
    }
  }, [leaderboardData, setPlayers]);
}

/**
 * Manages final leaderboard display animations
 */
export function useFinalLeaderboardAnimation(
  roomStatus: string,
  players: any[],
  uiState: ReturnType<typeof useMultiplayerUIState>,
) {
  useEffect(() => {
    if (roomStatus === "finished" && !uiState.showFinalLeaderboard) {
      uiState.setShowFinalLeaderboard(true);
      uiState.setRevealedCount(0);
    }
  }, [roomStatus, uiState]);

  useEffect(() => {
    if (!uiState.showFinalLeaderboard) return;

    const interval = setInterval(() => {
      uiState.setRevealedCount((prev) => {
        if (prev >= players.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 450);

    return () => clearInterval(interval);
  }, [uiState.showFinalLeaderboard, players.length, uiState]);
}

/**
 * Computes display state derived from game state
 */
export function useMultiplayerComputedState(
  guesses: GuessEntry[],
  wordLength: number,
  players: any[],
  session: any,
) {
  const displayWord = useMemo(() => {
    const correctLetters = new Map<number, string>();
    for (const g of guesses) {
      for (let i = 0; i < g.feedback.length; i++) {
        if (g.feedback[i] === "correct") {
          correctLetters.set(i, g.guess[i]!);
        }
      }
    }

    return Array.from({ length: wordLength })
      .map((_, i) => correctLetters.get(i) || "_")
      .join(" ");
  }, [guesses, wordLength]);

  const finalRanking = useMemo(() => {
    return [...players].sort((a, b) => {
      const byScore = b.score - a.score;
      if (byScore !== 0) return byScore;
      return (a.rank ?? 999) - (b.rank ?? 999);
    });
  }, [players]);

  const userPlayer = useMemo(
    () => players.find((p) => p.userId === session?.user?.id),
    [players, session?.user?.id],
  );

  const allPlayersFinished =
    players.length > 0 && players.every((p) => p.status === "won");

  return {
    displayWord,
    finalRanking,
    userPlayer,
    allPlayersFinished,
  };
}
