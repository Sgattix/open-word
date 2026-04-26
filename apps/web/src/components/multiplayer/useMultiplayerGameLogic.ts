"use client";

import { authClient } from "@/lib/auth-client";
import { useMultiplayer } from "@/context/MultiplayerContext";
import { trpc, queryClient } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  useMultiplayerGameState,
  useMultiplayerUIState,
  useRoomStateSync,
  useGlobalGameTimer,
  useRoundCountdownTimer,
  useRoundTransition,
  useLeaderboardSync,
  useFinalLeaderboardAnimation,
  useMultiplayerComputedState,
} from "@/hooks/useMultiplayerState";

export function useMultiplayerGameLogic() {
  const { roomId, players, setPlayers } = useMultiplayer();
  const { data: session } = authClient.useSession();

  const gameState = useMultiplayerGameState();
  const uiState = useMultiplayerUIState();

  const submitGuessMutation = useMutation({
    mutationFn: (input: { roomId: string; guess: string }) =>
      trpc.multiplayer.submitGuess.mutate(input),
    onSuccess: (data: any) => {
      gameState.setGuesses((prev) => [
        ...prev,
        {
          guess: gameState.guess.toUpperCase(),
          feedback: data.feedback,
        },
      ]);

      if (data.correct) {
        gameState.setUserFinished(true);
        gameState.setUserScore(data.score);
      }
      gameState.setGuess("");
      void queryClient.invalidateQueries({
        queryKey: ["multiplayer", "getLeaderboard", roomId],
      });
    },
  });

  const endRoundMutation = useMutation({
    mutationFn: (input: { roomId: string }) =>
      trpc.multiplayer.endRound.mutate(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["multiplayer", "getRoomState", roomId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["multiplayer", "getLeaderboard", roomId],
      });
    },
  });

  const startNextRoundMutation = useMutation({
    mutationFn: (input: { roomId: string }) =>
      trpc.multiplayer.startGame.mutate(input),
    onSuccess: () => {
      gameState.setGuesses([]);
      gameState.setUserFinished(false);
      gameState.setUserScore(0);
      gameState.setGuess("");
      void queryClient.invalidateQueries({
        queryKey: ["multiplayer", "getRoomState", roomId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["multiplayer", "getLeaderboard", roomId],
      });
    },
  });

  const finishGameMutation = useMutation({
    mutationFn: (input: { roomId: string }) =>
      trpc.multiplayer.finishGame.mutate(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["multiplayer", "getRoomState", roomId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["multiplayer", "getLeaderboard", roomId],
      });
    },
  });

  const getLeaderboard = useQuery({
    queryKey: ["multiplayer", "getLeaderboard", roomId],
    queryFn: () =>
      trpc.multiplayer.getLeaderboard.query({ roomId: roomId || "" }),
    enabled: !!roomId,
    refetchInterval: 500,
  });

  const getRoomState = useQuery({
    queryKey: ["multiplayer", "getRoomState", roomId],
    queryFn: () =>
      trpc.multiplayer.getRoomState.query({ roomId: roomId || "" }),
    enabled: !!roomId,
    refetchInterval: 1000,
  });

  // Sync room state from server
  useRoomStateSync(getRoomState.data, gameState);

  // Keep a single synchronized timer for all players.
  useGlobalGameTimer(
    gameState.gameStartedAtMs,
    gameState.roomStatus,
    gameState.setGlobalElapsedSeconds,
  );

  useRoundCountdownTimer(
    gameState.roundEndsAtMs,
    gameState.roomStatus,
    gameState.timePerRoundSeconds,
    gameState.setRoundRemainingSeconds,
  );

  // Handle round transitions
  useRoundTransition(
    gameState.currentRound,
    uiState.lastSeenRound,
    gameState,
    uiState,
  );

  // Sync leaderboard to players
  useLeaderboardSync(getLeaderboard.data, setPlayers);

  // Manage final leaderboard animations
  useFinalLeaderboardAnimation(gameState.roomStatus, players, uiState);

  // Compute derived state
  const computed = useMultiplayerComputedState(
    gameState.guesses,
    gameState.wordLength,
    players,
    session,
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roomId || !gameState.guess.trim() || gameState.userFinished) return;
    if (gameState.guess.trim().length !== gameState.wordLength) return;

    submitGuessMutation.mutate({
      roomId,
      guess: gameState.guess.trim().toUpperCase(),
    });
  }

  async function handleNextRound() {
    if (!roomId) return;
    try {
      await endRoundMutation.mutateAsync({ roomId });
      await startNextRoundMutation.mutateAsync({ roomId });
    } catch (error) {
      console.error("Error transitioning to next round:", error);
    }
  }

  async function handleFinishGame() {
    if (!roomId) return;
    try {
      await endRoundMutation.mutateAsync({ roomId });
      await finishGameMutation.mutateAsync({ roomId });
    } catch (error) {
      console.error("Error finishing game:", error);
    }
  }

  return {
    allPlayersFinished: computed.allPlayersFinished,
    currentRound: gameState.currentRound,
    displayWord: computed.displayWord,
    endRoundMutation,
    finalRanking: computed.finalRanking,
    finishGameMutation,
    globalElapsedSeconds: gameState.globalElapsedSeconds,
    roundRemainingSeconds: gameState.roundRemainingSeconds,
    timePerRoundSeconds: gameState.timePerRoundSeconds,
    guess: gameState.guess,
    guesses: gameState.guesses,
    handleFinishGame,
    handleNextRound,
    handleSubmit,
    isHost: gameState.isHost,
    players,
    revealedCount: uiState.revealedCount,
    roomStatus: gameState.roomStatus,
    session,
    setGuess: gameState.setGuess,
    showFinalLeaderboard: uiState.showFinalLeaderboard,
    startNextRoundMutation,
    submitGuessMutation,
    totalRounds: gameState.totalRounds,
    userFinished: gameState.userFinished,
    userPlayer: computed.userPlayer,
    userScore: gameState.userScore,
    wordLength: gameState.wordLength,
  };
}
