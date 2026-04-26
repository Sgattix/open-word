/**
 * Game-related React hooks — extracted from GameContext for better maintainability.
 */

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { trpc, queryClient } from "@/utils/trpc";
import { DEFAULT_WORD_LENGTH } from "@/config";
import { calculateMultiplier } from "@/lib/utils";
import type { GameScore, GameState } from "@/types/game";

/**
 * Hook for managing active game form state (guess input, game ID).
 */
export function useGameFormState() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [guess, setGuess] = useState("");

  const resetForm = useCallback(() => {
    setGameId(null);
    setGuess("");
  }, []);

  return {
    gameId,
    setGameId,
    guess,
    setGuess,
    resetForm,
  };
}

/**
 * Hook for managing game settings and customization.
 */
export function useGameSettings(initialSettings: any) {
  const [customWordLength, setCustomWordLength] = useState(5);
  const [customMaxAttempts, setCustomMaxAttempts] = useState(6);
  const [customHintsAllowed, setCustomHintsAllowed] = useState(2);
  const [customMultiplier, setCustomMultiplier] = useState(
    calculateMultiplier(5, 6, 2),
  );
  const [language, setLanguage] = useState("en");

  const resetSettings = useCallback(() => {
    setCustomWordLength(5);
    setCustomMaxAttempts(6);
    setCustomHintsAllowed(2);
    setCustomMultiplier(calculateMultiplier(5, 6, 2));
    setLanguage("en");
  }, []);

  return {
    customWordLength,
    setCustomWordLength,
    customMaxAttempts,
    setCustomMaxAttempts,
    customHintsAllowed,
    setCustomHintsAllowed,
    customMultiplier,
    setCustomMultiplier,
    language,
    setLanguage,
    resetSettings,
  };
}

/**
 * Hook for managing game session state (score, hints, timing).
 */
export function useGameSession() {
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [gameDuration, setGameDuration] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [finalScore, setFinalScore] = useState<GameScore | null>(null);

  const resetSession = useCallback(() => {
    setGameStartTime(null);
    setGameDuration(0);
    setHintsUsed(0);
    setFinalScore(null);
  }, []);

  return {
    gameStartTime,
    setGameStartTime,
    gameDuration,
    setGameDuration,
    hintsUsed,
    setHintsUsed,
    finalScore,
    setFinalScore,
    resetSession,
  };
}

/**
 * Hook for managing UI visibility states.
 */
export function useGameUIState() {
  const [showSettings, setShowSettings] = useState(true);

  return {
    showSettings,
    setShowSettings,
  };
}

/**
 * Hook for managing API mutations (start game, submit guess, save game).
 */
export function useGameMutations() {
  const startGameMutation = useMutation({
    mutationFn: (input: {
      difficulty: string;
      wordLength: number;
      maxAttempts: number;
      hintsAllowed: number;
      language: string;
    }) => trpc.solo.startGame.mutate(input),
  });

  const submitGuessMutation = useMutation({
    mutationFn: (input: { gameId: string; guess: string }) =>
      trpc.solo.submitGuess.mutate(input),
  });

  const useHintMutation = useMutation({
    mutationFn: (input: { gameId: string }) => trpc.solo.useHint.mutate(input),
  });

  const saveGameMutation = useMutation({
    mutationFn: (input: any) => trpc.solo.saveGame.mutate(input),
  });

  return {
    startGameMutation,
    submitGuessMutation,
    useHintMutation,
    saveGameMutation,
  };
}

/**
 * Hook for fetching live game state.
 */
export function useGameState(gameId: string | null) {
  const gameStateQuery = useQuery({
    queryKey: ["solo", "getGameState", gameId],
    queryFn: () => trpc.solo.getGameState.query({ gameId: gameId ?? "" }),
    enabled: Boolean(gameId),
  });

  return {
    game: (gameStateQuery.data ?? null) as GameState | null,
    isLoading: gameStateQuery.isLoading,
    isFetching: gameStateQuery.isFetching,
    refetch: gameStateQuery.refetch,
  };
}

/**
 * Pure logic: compute the full guess from the user input and hinted letters.
 */
export function computeFullGuess(
  guess: string,
  hintedLetters: { [position: number]: string } | undefined,
  wordLength: number | undefined,
): string {
  const actualWordLength = wordLength || DEFAULT_WORD_LENGTH;

  if (!hintedLetters || Object.keys(hintedLetters).length === 0) {
    return guess;
  }

  const chars = Array(actualWordLength).fill("_");

  for (const [position, letter] of Object.entries(hintedLetters)) {
    chars[parseInt(position)] = letter;
  }

  let guessIdx = 0;
  for (let i = 0; i < actualWordLength; i++) {
    if (!(i in hintedLetters) && guessIdx < guess.length) {
      chars[i] = guess[guessIdx];
      guessIdx++;
    }
  }

  return chars.join("").replace(/_/g, "");
}

/**
 * Hook for handling guess submissions with loading state tracking.
 */
export function useGameSubmitHandler(
  gameId: string | null,
  game: GameState | null,
  fullGuess: string,
  submitGuessMutation: ReturnType<typeof useMutation<GameState, Error, { gameId: string; guess: string }, unknown>>,
  resetGuess: () => void,
) {
  const handleSubmitGuess = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!gameId || !fullGuess) {
        return;
      }

      submitGuessMutation.mutate(
        { gameId, guess: fullGuess },
        {
          onSuccess: () => {
            resetGuess();
            void queryClient.invalidateQueries({
              queryKey: ["solo", "getGameState", gameId],
            });
          },
        },
      );
    },
    [gameId, fullGuess, submitGuessMutation, resetGuess],
  );

  const canSubmitGuess =
    Boolean(gameId) &&
    game?.status === "playing" &&
    fullGuess.length === (game?.wordLength ?? DEFAULT_WORD_LENGTH);

  const isBusy = submitGuessMutation.isPending;

  return {
    handleSubmitGuess,
    canSubmitGuess,
    isBusy,
  };
}

